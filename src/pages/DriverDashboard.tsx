import { useState } from 'react';
import { MapPin, Package, Truck, CheckCircle, Clock, User, Navigation } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, materialInfo } from '@/lib/crv-utils';
import { useToast } from '@/hooks/use-toast';

// Mock data for demo
const mockRequests = [
  {
    id: '1',
    userName: 'Sarah M.',
    address: '1234 Sunset Blvd, Los Angeles, CA 90026',
    items: [
      { type: 'aluminum', quantity: 24, sizeOz: 12 },
      { type: 'plastic', quantity: 10, sizeOz: 20 },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    estimatedDistance: '3.2 miles',
    estimatedTime: '12 min',
    estimatedCRV: 2.20,
  },
  {
    id: '2',
    userName: 'Mike R.',
    address: '5678 Hollywood Ave, Los Angeles, CA 90028',
    items: [
      { type: 'glass', quantity: 15, sizeOz: 12 },
      { type: 'aluminum', quantity: 30, sizeOz: 12 },
    ],
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    estimatedDistance: '5.1 miles',
    estimatedTime: '18 min',
    estimatedCRV: 2.25,
  },
  {
    id: '3',
    userName: 'Lisa K.',
    address: '910 Venice Blvd, Los Angeles, CA 90019',
    items: [
      { type: 'aluminum', quantity: 48, sizeOz: 12 },
    ],
    status: 'accepted',
    createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    estimatedDistance: '4.5 miles',
    estimatedTime: '15 min',
    estimatedCRV: 2.40,
  },
];

const CENTRAL_HUB = "Ammex Recycling, 3315 E Washington Blvd, Los Angeles, CA 90023";

type RequestStatus = 'pending' | 'accepted' | 'picked_up' | 'delivered';

const statusConfig: Record<RequestStatus, { label: string; color: string; next?: RequestStatus; nextLabel?: string }> = {
  pending: { label: 'Pending', color: 'status-pending', next: 'accepted', nextLabel: 'Accept Job' },
  accepted: { label: 'Accepted', color: 'status-accepted', next: 'picked_up', nextLabel: 'Mark Picked Up' },
  picked_up: { label: 'Picked Up', color: 'status-picked-up', next: 'delivered', nextLabel: 'Mark Delivered' },
  delivered: { label: 'Delivered', color: 'status-delivered' },
};

const DriverDashboard = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState(mockRequests);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');

  const updateStatus = (id: string, newStatus: RequestStatus) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    );

    const statusLabels: Record<RequestStatus, string> = {
      accepted: 'Job accepted! Navigate to pickup location.',
      picked_up: 'Items picked up! Head to the central hub.',
      delivered: 'Delivery complete! Items redeemed.',
      pending: 'Status updated.',
    };

    toast({
      title: 'Status Updated',
      description: statusLabels[newStatus],
    });
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'active') return req.status !== 'pending' && req.status !== 'delivered';
    return true;
  });

  const totalItems = (items: typeof mockRequests[0]['items']) =>
    items.reduce((sum, item) => sum + item.quantity, 0);

  const formatTimeAgo = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Driver Dashboard
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Central Hub: {CENTRAL_HUB.split(',')[0]}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 bg-card rounded-lg p-1 shadow-card">
                {(['all', 'pending', 'active'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl shadow-card">
                  <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">No requests found</p>
                  <p className="text-muted-foreground">
                    {filter === 'pending' ? 'No pending pickups right now.' : 'Check back soon for new jobs.'}
                  </p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const status = request.status as RequestStatus;
                  const config = statusConfig[status];

                  return (
                    <div
                      key={request.id}
                      className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in"
                    >
                      {/* Header */}
                      <div className="p-4 md:p-6 border-b border-border">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{request.userName}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge className={config.color}>{config.label}</Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 md:p-6 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{request.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.estimatedDistance} • {request.estimatedTime} to pickup
                            </p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {totalItems(request.items)} items
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {request.items.map((item, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                  {materialInfo[item.type as keyof typeof materialInfo].icon} {item.quantity}x {item.sizeOz}oz
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* CRV Estimate */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <span className="text-sm text-muted-foreground">Est. CRV Value:</span>
                          <span className="crv-badge">{formatCurrency(request.estimatedCRV)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 md:p-6 bg-muted/30 border-t border-border flex flex-wrap gap-3">
                        {config.next && (
                          <Button
                            variant={status === 'pending' ? 'eco' : 'default'}
                            onClick={() => updateStatus(request.id, config.next!)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {config.nextLabel}
                          </Button>
                        )}
                        {(status === 'accepted' || status === 'picked_up') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              const destination = status === 'accepted' 
                                ? request.address 
                                : CENTRAL_HUB;
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
                                '_blank'
                              );
                            }}
                            className="flex-1"
                          >
                            <Navigation className="w-4 h-4" />
                            Navigate
                          </Button>
                        )}
                        {status === 'delivered' && (
                          <div className="flex-1 text-center py-2 text-sm text-muted-foreground">
                            ✓ Completed
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DriverDashboard;
