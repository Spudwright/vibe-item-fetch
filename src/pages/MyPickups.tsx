import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, MapPin, DollarSign, Clock, Eye, Plus } from 'lucide-react';
import DeliveryRobotIcon from '@/components/icons/DeliveryRobotIcon';
import { useToast } from '@/hooks/use-toast';

interface Pickup {
  id: string;
  status: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  estimated_crv: number | null;
  items: any;
  created_at: string;
  drone_id: string | null;
}

interface Profile {
  id: string;
  crv_balance: number;
  full_name: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  assigned: { label: 'Drone Assigned', color: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

const MyPickups = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch pickups
      const { data: pickupsData, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load pickups.',
          variant: 'destructive',
        });
      } else {
        setPickups(pickupsData || []);
      }

      setLoading(false);
    };

    fetchData();

    // Subscribe to pickup updates
    const channel = supabase
      .channel('my-pickups')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickups',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPickups(prev => [payload.new as Pickup, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPickups(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as Pickup : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setPickups(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const filteredPickups = pickups.filter(pickup => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'assigned', 'in_transit'].includes(pickup.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(pickup.status);
    return true;
  });

  const totalEarnedCRV = pickups
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.estimated_crv || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">My Pickups</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your recycling pickups
            </p>
          </div>
          <Button variant="eco" onClick={() => navigate('/request')}>
            <Plus className="w-4 h-4 mr-2" />
            New Pickup Request
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 eco-gradient rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CRV Balance</p>
                  <p className="text-2xl font-display font-bold text-primary">
                    ${((profile?.crv_balance || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-display font-bold">
                    ${(totalEarnedCRV / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 terracotta-gradient rounded-xl flex items-center justify-center">
                  <DeliveryRobotIcon size={24} color="white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pickups</p>
                  <p className="text-2xl font-display font-bold">
                    {pickups.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pickups List */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle>Pickup History</CardTitle>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPickups.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pickups yet</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/request')}
                >
                  Request your first pickup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPickups.map((pickup) => {
                  const status = statusConfig[pickup.status] || { label: pickup.status, color: 'bg-gray-100 text-gray-800' };
                  const isTrackable = pickup.status === 'assigned' || pickup.status === 'in_transit';

                  return (
                    <div
                      key={pickup.id}
                      className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                          {pickup.estimated_crv && (
                            <span className="crv-badge">
                              <DollarSign className="w-3 h-3" />
                              {(pickup.estimated_crv / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{pickup.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(pickup.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isTrackable && (
                          <Button
                            variant="eco"
                            size="sm"
                            onClick={() => navigate(`/track/${pickup.id}`)}
                          >
                            <DeliveryRobotIcon size={16} className="mr-1" />
                            Track Robot
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/track/${pickup.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MyPickups;
