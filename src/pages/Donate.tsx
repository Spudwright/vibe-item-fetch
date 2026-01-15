import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Heart, School, Home, Hospital, Building2, DollarSign, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Organization {
  id: string;
  name: string;
  type: 'school' | 'shelter' | 'hospital' | 'other';
  description: string | null;
  address: string | null;
}

const typeIcons = {
  school: School,
  shelter: Home,
  hospital: Hospital,
  other: Building2,
};

const typeColors = {
  school: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  shelter: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  hospital: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};

const Donate = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [crvBalance, setCrvBalance] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const [orgsResult, profileResult] = await Promise.all([
      supabase.from('donation_organizations').select('*').eq('is_active', true),
      supabase.from('profiles').select('crv_balance').eq('id', user.id).single()
    ]);

    if (orgsResult.data) {
      setOrganizations(orgsResult.data as Organization[]);
    }
    
    if (profileResult.data) {
      setCrvBalance(profileResult.data.crv_balance);
    }

    setLoading(false);
  };

  const handleDonate = (org: Organization) => {
    setSelectedOrg(org);
    setDonationAmount('');
    setIsDialogOpen(true);
  };

  const confirmDonation = async () => {
    if (!selectedOrg) return;
    
    const amountCents = Math.round(parseFloat(donationAmount) * 100);
    
    if (isNaN(amountCents) || amountCents <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amountCents > crvBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in');
      setIsSubmitting(false);
      return;
    }

    // Create donation record
    const { error: donationError } = await supabase
      .from('donations')
      .insert({
        user_id: user.id,
        organization_id: selectedOrg.id,
        amount_cents: amountCents
      });

    if (donationError) {
      toast.error('Failed to process donation');
      setIsSubmitting(false);
      return;
    }

    // Update user's CRV balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ crv_balance: crvBalance - amountCents })
      .eq('id', user.id);

    if (updateError) {
      toast.error('Failed to update balance');
      setIsSubmitting(false);
      return;
    }

    setCrvBalance(prev => prev - amountCents);
    setIsDialogOpen(false);
    setIsSubmitting(false);
    
    toast.success(
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        <span>Thank you for donating ${(amountCents / 100).toFixed(2)} to {selectedOrg.name}!</span>
      </div>
    );
  };

  const filteredOrgs = activeTab === 'all' 
    ? organizations 
    : organizations.filter(org => org.type === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Donate Your CRV</h1>
          </div>
          <p className="text-muted-foreground">
            Turn your recycling rewards into meaningful impact for local organizations
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">${(crvBalance / 100).toFixed(2)}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              Ready to donate
            </Badge>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="school" className="flex items-center gap-1">
              <School className="h-4 w-4" />
              <span className="hidden sm:inline">Schools</span>
            </TabsTrigger>
            <TabsTrigger value="shelter" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Shelters</span>
            </TabsTrigger>
            <TabsTrigger value="hospital" className="flex items-center gap-1">
              <Hospital className="h-4 w-4" />
              <span className="hidden sm:inline">Hospitals</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Organizations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map(org => {
            const Icon = typeIcons[org.type];
            return (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${typeColors[org.type]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {org.type}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{org.name}</CardTitle>
                  <CardDescription>{org.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {org.address && (
                    <p className="text-xs text-muted-foreground mb-4">{org.address}</p>
                  )}
                  <Button 
                    className="w-full" 
                    onClick={() => handleDonate(org)}
                    disabled={crvBalance <= 0}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Donate
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrgs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No organizations found in this category</p>
          </div>
        )}
      </main>

      {/* Donation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Donate to {selectedOrg?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the amount you'd like to donate. Your current balance is ${(crvBalance / 100).toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">$</span>
              <Input
                type="number"
                placeholder="0.00"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                min="0.01"
                max={(crvBalance / 100).toFixed(2)}
                step="0.01"
                className="text-2xl font-bold"
              />
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-4">
              {[1, 5, 10].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setDonationAmount(amount.toString())}
                  disabled={amount * 100 > crvBalance}
                >
                  ${amount}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDonationAmount((crvBalance / 100).toFixed(2))}
                disabled={crvBalance <= 0}
              >
                All
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDonation} disabled={isSubmitting || !donationAmount}>
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Donation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Donate;
