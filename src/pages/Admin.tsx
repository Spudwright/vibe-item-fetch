import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, TrendingUp, MapPin, Recycle, DollarSign, 
  BarChart3, PieChart, Calendar, ShieldCheck, AlertTriangle, ScanLine
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  totalPickups: number;
  totalItemsRecycled: number;
  totalCRVEarned: number;
  totalDonations: number;
  activePickups: number;
}

interface MaterialBreakdown {
  material: string;
  count: number;
  color: string;
}

interface PickupTrend {
  date: string;
  pickups: number;
  items: number;
}

interface LocationData {
  city: string;
  count: number;
}

interface UserLevel {
  level: number;
  count: number;
}

const MATERIAL_COLORS = {
  aluminum: 'hsl(var(--chart-1))',
  plastic: 'hsl(var(--chart-2))',
  glass: 'hsl(var(--chart-3))',
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPickups: 0,
    totalItemsRecycled: 0,
    totalCRVEarned: 0,
    totalDonations: 0,
    activePickups: 0,
  });
  const [materialBreakdown, setMaterialBreakdown] = useState<MaterialBreakdown[]>([]);
  const [pickupTrends, setPickupTrends] = useState<PickupTrend[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [userLevels, setUserLevels] = useState<UserLevel[]>([]);
  const [recentPickups, setRecentPickups] = useState<any[]>([]);
  const [scanLogs, setScanLogs] = useState<any[]>([]);

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: isAdminResult, error: adminError } = await supabase
        .rpc('is_admin');
      
      if (adminError || !isAdminResult) {
        setIsAdmin(false);
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadAdminData();
    };

    checkAdminAndLoadData();
  }, [user, authLoading, navigate, toast]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        profilesResult,
        pickupsResult,
        donationsResult,
        recentPickupsResult,
        scanLogsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('pickups').select('*'),
        supabase.from('donations').select('amount_cents'),
        supabase.from('pickups').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('scan_logs').select('*').order('scanned_at', { ascending: false }).limit(50),
      ]);

      const profiles = profilesResult.data || [];
      const pickups = pickupsResult.data || [];
      const donations = donationsResult.data || [];

      // Calculate basic stats
      const totalUsers = profiles.length;
      const totalPickups = pickups.length;
      const totalItemsRecycled = profiles.reduce((sum, p) => sum + (p.total_items_recycled || 0), 0);
      const totalCRVEarned = profiles.reduce((sum, p) => sum + (p.crv_balance || 0), 0);
      const totalDonations = donations.reduce((sum, d) => sum + (d.amount_cents || 0), 0) / 100;
      const activePickups = pickups.filter(p => 
        ['pending', 'assigned', 'in_transit'].includes(p.status)
      ).length;

      setStats({
        totalUsers,
        totalPickups,
        totalItemsRecycled,
        totalCRVEarned,
        totalDonations,
        activePickups,
      });

      // Material breakdown from pickup items
      const materialCounts: Record<string, number> = { aluminum: 0, plastic: 0, glass: 0 };
      pickups.forEach(pickup => {
        const items = pickup.items as Array<{ type: string; quantity: number }> | null;
        if (items && Array.isArray(items)) {
          items.forEach(item => {
            if (item.type && materialCounts.hasOwnProperty(item.type)) {
              materialCounts[item.type] += item.quantity || 0;
            }
          });
        }
      });

      setMaterialBreakdown([
        { material: 'Aluminum', count: materialCounts.aluminum, color: MATERIAL_COLORS.aluminum },
        { material: 'Plastic', count: materialCounts.plastic, color: MATERIAL_COLORS.plastic },
        { material: 'Glass', count: materialCounts.glass, color: MATERIAL_COLORS.glass },
      ]);

      // Pickup trends (last 14 days)
      const today = new Date();
      const twoWeeksAgo = subDays(today, 13);
      const dateRange = eachDayOfInterval({ start: twoWeeksAgo, end: today });
      
      const trendData = dateRange.map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const dayPickups = pickups.filter(p => {
          const pickupDate = new Date(p.created_at);
          return pickupDate >= dayStart && pickupDate <= dayEnd;
        });
        
        const totalItems = dayPickups.reduce((sum, p) => {
          const items = p.items as Array<{ quantity: number }> | null;
          if (items && Array.isArray(items)) {
            return sum + items.reduce((s, item) => s + (item.quantity || 0), 0);
          }
          return sum;
        }, 0);

        return {
          date: format(date, 'MMM d'),
          pickups: dayPickups.length,
          items: totalItems,
        };
      });

      setPickupTrends(trendData);

      // Location breakdown from pickup addresses
      const locationCounts: Record<string, number> = {};
      pickups.forEach(pickup => {
        // Extract city from address (simplified - assumes format like "123 Street, City, CA 12345")
        const addressParts = pickup.pickup_address?.split(',') || [];
        if (addressParts.length >= 2) {
          const city = addressParts[addressParts.length - 2]?.trim() || 'Unknown';
          locationCounts[city] = (locationCounts[city] || 0) + 1;
        }
      });

      const sortedLocations = Object.entries(locationCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setLocationData(sortedLocations);

      // User level distribution
      const levelCounts: Record<number, number> = {};
      profiles.forEach(profile => {
        const level = profile.level || 1;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      const levelData = Object.entries(levelCounts)
        .map(([level, count]) => ({ level: parseInt(level), count }))
        .sort((a, b) => a.level - b.level);

      setUserLevels(levelData);

      // Recent pickups
      setRecentPickups(recentPickupsResult.data || []);

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      assigned: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      in_transit: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-600 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return statusStyles[status] || 'bg-muted text-muted-foreground';
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 py-10">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 eco-gradient rounded-xl flex items-center justify-center shadow-eco">
                <ShieldCheck className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  CanDo Recycling Analytics & Statistics
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pickups</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stats.totalPickups}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Recycle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Items Recycled</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stats.totalItemsRecycled.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">CRV Earned</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalCRVEarned)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Donations</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">${stats.totalDonations.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Pickups</p>
                      {loading ? (
                        <Skeleton className="h-7 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground">{stats.activePickups}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card shadow-card p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <PieChart className="w-4 h-4 mr-2" />
                  Materials
                </TabsTrigger>
                <TabsTrigger value="geography" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  Geography
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Trends
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pickups Over Time */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Pickups Over Time
                      </CardTitle>
                      <CardDescription>Daily pickup requests (last 14 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={pickupTrends}>
                            <defs>
                              <linearGradient id="colorPickups" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="pickups" 
                              stroke="hsl(var(--primary))" 
                              fillOpacity={1}
                              fill="url(#colorPickups)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* User Level Distribution */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        User Level Distribution
                      </CardTitle>
                      <CardDescription>Users by gamification level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-64 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={userLevels}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="level" tick={{ fontSize: 12 }} className="fill-muted-foreground" label={{ value: 'Level', position: 'bottom', offset: -5 }} />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="hsl(var(--secondary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Pickups Table */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Recent Pickups
                    </CardTitle>
                    <CardDescription>Latest pickup requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : recentPickups.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No pickups yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Address</th>
                              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Items</th>
                              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Est. CRV</th>
                              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentPickups.map(pickup => {
                              const items = pickup.items as Array<{ quantity: number }> | null;
                              const totalItems = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                              
                              return (
                                <tr key={pickup.id} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    {format(new Date(pickup.created_at), 'MMM d, yyyy')}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-foreground max-w-[200px] truncate">
                                    {pickup.pickup_address}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-foreground">
                                    {totalItems} items
                                  </td>
                                  <td className="py-3 px-4 text-sm font-medium text-foreground">
                                    {formatCurrency(pickup.estimated_crv || 0)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <Badge variant="outline" className={getStatusBadge(pickup.status)}>
                                      {pickup.status.replace('_', ' ')}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Materials Tab */}
              <TabsContent value="materials" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-primary" />
                        Material Distribution
                      </CardTitle>
                      <CardDescription>Breakdown by recyclable type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-80 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <RechartsPieChart>
                            <Pie
                              data={materialBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ material, percent }) => `${material} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {materialBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Material Counts
                      </CardTitle>
                      <CardDescription>Total items by material type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-80 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={materialBreakdown} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis dataKey="material" type="category" tick={{ fontSize: 12 }} className="fill-muted-foreground" width={80} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                              {materialBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Material Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {materialBreakdown.map((material) => (
                    <Card key={material.material} className="shadow-card">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{material.material}</p>
                            <p className="text-3xl font-bold text-foreground">{material.count.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">items collected</p>
                          </div>
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${material.color}20` }}
                          >
                            {material.material === 'Aluminum' ? '🥫' : material.material === 'Plastic' ? '🧴' : '🍾'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Geography Tab */}
              <TabsContent value="geography" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Pickups by Location
                      </CardTitle>
                      <CardDescription>Distribution across service areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-80 w-full" />
                      ) : locationData.length === 0 ? (
                        <p className="text-muted-foreground text-center py-16">No location data available</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={locationData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="city" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar 
                              dataKey="count" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Top Locations
                      </CardTitle>
                      <CardDescription>Most active pickup areas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : locationData.length === 0 ? (
                        <p className="text-muted-foreground text-center py-16">No location data available</p>
                      ) : (
                        <div className="space-y-3">
                          {locationData.map((location, index) => {
                            const maxCount = Math.max(...locationData.map(l => l.count));
                            const percentage = (location.count / maxCount) * 100;
                            
                            return (
                              <div key={location.city} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                      {index + 1}
                                    </span>
                                    <span className="text-foreground">{location.city}</span>
                                  </span>
                                  <span className="font-medium text-foreground">{location.count} pickups</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-primary transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Daily Items Recycled
                      </CardTitle>
                      <CardDescription>Item count trends (last 14 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-80 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={pickupTrends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="items" 
                              stroke="hsl(var(--secondary))" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2 }}
                              activeDot={{ r: 6, fill: 'hsl(var(--secondary))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Pickup vs Items Comparison
                      </CardTitle>
                      <CardDescription>Pickups and item counts over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <Skeleton className="h-80 w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={pickupTrends}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="pickups" fill="hsl(var(--primary))" name="Pickups" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="items" fill="hsl(var(--secondary))" name="Items" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
