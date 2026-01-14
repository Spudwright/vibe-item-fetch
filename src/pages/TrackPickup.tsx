import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DroneMap from '@/components/DroneMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, MapPin, Clock, DollarSign, ArrowLeft, Package } from 'lucide-react';
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

interface Drone {
  id: string;
  name: string;
  status: string;
  lat: number | null;
  lng: number | null;
  last_updated: string | null;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  assigned: { label: 'Drone Assigned', color: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

const TrackPickup = () => {
  const { pickupId } = useParams<{ pickupId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [drone, setDrone] = useState<Drone | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapboxToken, setMapboxToken] = useState<string | null>(
    localStorage.getItem('mapbox_token')
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch pickup data
  useEffect(() => {
    if (!pickupId || !user) return;

    const fetchPickup = async () => {
      const { data, error } = await supabase
        .from('pickups')
        .select('*')
        .eq('id', pickupId)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load pickup details.',
          variant: 'destructive',
        });
        navigate('/my-pickups');
        return;
      }

      setPickup(data);
      setLoading(false);
    };

    fetchPickup();

    // Subscribe to pickup updates
    const pickupChannel = supabase
      .channel(`pickup-${pickupId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pickups',
          filter: `id=eq.${pickupId}`,
        },
        (payload) => {
          setPickup(payload.new as Pickup);
          
          if (payload.new.status !== payload.old?.status) {
            toast({
              title: 'Status Updated',
              description: `Your pickup is now: ${statusConfig[payload.new.status as string]?.label || payload.new.status}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pickupChannel);
    };
  }, [pickupId, user, navigate, toast]);

  // Fetch and subscribe to drone updates
  useEffect(() => {
    if (!pickup?.drone_id) {
      setDrone(null);
      return;
    }

    const fetchDrone = async () => {
      const { data, error } = await supabase
        .from('drones')
        .select('*')
        .eq('id', pickup.drone_id)
        .single();

      if (!error && data) {
        setDrone(data);
      }
    };

    fetchDrone();

    // Subscribe to drone location updates
    const droneChannel = supabase
      .channel(`drone-${pickup.drone_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drones',
          filter: `id=eq.${pickup.drone_id}`,
        },
        (payload) => {
          setDrone(payload.new as Drone);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(droneChannel);
    };
  }, [pickup?.drone_id]);

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem('mapbox_token', token);
    setMapboxToken(token);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!pickup) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <p>Pickup not found.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[pickup.status] || { label: pickup.status, color: 'bg-gray-100 text-gray-800' };
  const isTrackable = pickup.status === 'assigned' || pickup.status === 'in_transit';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/my-pickups')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Pickups
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  Live Drone Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-60px)]">
                {isTrackable ? (
                  <DroneMap
                    droneLocation={drone?.lat && drone?.lng ? { lat: drone.lat, lng: drone.lng } : null}
                    pickupLocation={pickup.pickup_lat && pickup.pickup_lng ? { lat: pickup.pickup_lat, lng: pickup.pickup_lng } : null}
                    mapboxToken={mapboxToken || undefined}
                    onTokenSubmit={handleTokenSubmit}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center p-6">
                      <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {pickup.status === 'pending' 
                          ? 'Waiting for a drone to be assigned...'
                          : pickup.status === 'completed'
                          ? 'Pickup completed!'
                          : 'Tracking not available for this status.'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${status.color} text-sm px-3 py-1`}>
                  {status.label}
                </Badge>
              </CardContent>
            </Card>

            {/* Pickup Address */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Pickup Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{pickup.pickup_address}</p>
              </CardContent>
            </Card>

            {/* Estimated CRV */}
            {pickup.estimated_crv && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    Estimated CRV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-display font-bold text-primary">
                    ${(pickup.estimated_crv / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Items */}
            {pickup.items && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(pickup.items, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Drone Info */}
            {drone && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Plane className="w-4 h-4" />
                    Assigned Drone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{drone.name}</p>
                  {drone.last_updated && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Last updated: {new Date(drone.last_updated).toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Created At */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Requested
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {new Date(pickup.created_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackPickup;
