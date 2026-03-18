import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Plus, Trash2, MapPin, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  calculateFullCRV,
  calculateUserPayout,
  formatCurrency,
  materialInfo,
  commonSizes,
  isValidUPC,
  type CRVItem,
  type MaterialType,
} from '@/lib/crv-utils';
import { calculateItemPoints, formatPoints } from '@/lib/gamification';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PointsBreakdown from '@/components/PointsBreakdown';



const RequestPickup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CRVItem[]>([
    { id: '1', description: '', materialType: 'aluminum', sizeOz: 12, quantity: 1 },
  ]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [consentLocation, setConsentLocation] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        materialType: 'aluminum',
        sizeOz: 12,
        quantity: 1,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, updates: Partial<CRVItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const startBarcodeScanner = async (itemId: string) => {
    setScanningItemId(itemId);
    setScanning(true);
    
    // QuaggaJS integration would go here
    // For now, simulate a scan after 2 seconds
    toast({
      title: "Camera Access",
      description: "Barcode scanning requires camera permission. This is a demo - barcode scanning will be fully functional with backend integration.",
    });
    
    setTimeout(() => {
      // Simulate finding a barcode
      const mockBarcode = '012000001611'; // Example Coke UPC
      updateItem(itemId, { barcode: mockBarcode });
      setScanning(false);
      setScanningItemId(null);
      toast({
        title: "Barcode Scanned",
        description: `UPC: ${mockBarcode} (Demo)`,
      });
    }, 2000);
  };

  // Calculate total quantity of items
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consentLocation || !agreeTerms) {
      toast({
        variant: "destructive",
        title: "Required Consents",
        description: "Please agree to location sharing and terms of service.",
      });
      return;
    }

    if (!address.trim()) {
      toast({
        variant: "destructive",
        title: "Address Required",
        description: "Please enter your pickup address.",
      });
      return;
    }

    // Validate barcodes if provided
    for (const item of items) {
      if (item.barcode && !isValidUPC(item.barcode)) {
        toast({
          variant: "destructive",
          title: "Invalid Barcode",
          description: `Barcode "${item.barcode}" is not a valid 12-digit UPC.`,
        });
        return;
      }
    }

    toast({
      title: "Pickup Requested!",
      description: "Your request has been submitted. A driver will accept it soon.",
    });
  };

  const fullCRV = calculateFullCRV(items);
  const { payout, feeRate } = calculateUserPayout(fullCRV, 0); // Assuming new user
  
  // Calculate total points for this pickup
  const totalPoints = items.reduce((sum, item) => {
    return sum + calculateItemPoints(item.materialType, item.sizeOz, item.quantity);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Request a Pickup
              </h1>
              <p className="text-muted-foreground">
                Add your CRV-eligible items and schedule a pickup. Only bottles and cans with "CA CRV" labels qualify.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Items Section */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">1</span>
                  Add Your Items
                </h2>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-muted/50 border border-border animate-fade-in"
                    >
                      <div className="flex flex-wrap gap-3 mb-3">
                        <div className="flex-1 min-w-[140px]">
                          <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                          <Select
                            value={item.materialType}
                            onValueChange={(value) =>
                              updateItem(item.id, { materialType: value as MaterialType })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(materialInfo).map(([key, info]) => (
                                <SelectItem key={key} value={key}>
                                  {info.icon} {info.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-32">
                          <label className="text-xs text-muted-foreground mb-1 block">Size</label>
                          <Select
                            value={item.sizeOz.toString()}
                            onValueChange={(value) => updateItem(item.id, { sizeOz: Number(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {commonSizes.map((size) => (
                                <SelectItem key={size.value} value={size.value.toString()}>
                                  {size.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-24">
                          <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })
                            }
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            UPC Barcode (optional)
                          </label>
                          <Input
                            placeholder="12-digit UPC"
                            value={item.barcode || ''}
                            onChange={(e) => updateItem(item.id, { barcode: e.target.value })}
                            maxLength={12}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => startBarcodeScanner(item.id)}
                            disabled={scanning}
                          >
                            <ScanLine className={`w-4 h-4 ${scanningItemId === item.id ? 'animate-pulse' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={addItem} className="w-full mt-4">
                  <Plus className="w-4 h-4" />
                  Add More Items
                </Button>


                {/* Estimate with Points */}
                <div className="mt-6 p-4 rounded-xl gold-gradient">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-foreground/70">Estimated Payout</p>
                      <p className="font-display text-2xl font-bold text-foreground">
                        {formatCurrency(payout)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-foreground/70">
                      <p>Full CRV: {formatCurrency(fullCRV)}</p>
                      <p>Fee: {(feeRate * 100).toFixed(0)}%</p>
                      <p>Items: {totalQuantity}</p>
                    </div>
                  </div>
                  {/* Points Preview */}
                  <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Points You'll Earn</span>
                    </div>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      +{formatPoints(totalPoints)} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Points Breakdown Section */}
              <PointsBreakdown items={items} />

              {/* Address Section */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">2</span>
                  Pickup Location
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Pickup Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="123 Main St, Los Angeles, CA 90001"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Notes for Driver (optional)
                    </label>
                    <Textarea
                      placeholder="e.g., Leave at front porch, ring doorbell..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Consent Section */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">3</span>
                  Confirm & Submit
                </h2>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={consentLocation}
                      onCheckedChange={(checked) => setConsentLocation(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      I consent to sharing my address for pickup routing and processing only. 
                      Data will not be shared externally beyond necessary API calls (e.g., Google Maps).
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-primary underline">
                        Terms of Service
                      </a>{' '}
                      including CRV compliance and the fee structure.
                    </span>
                  </label>

                  {/* Info box */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      <strong className="text-foreground">CRV Eligible Only:</strong> Items must have "CA CRV" 
                      on the label. Non-eligible items will be rejected by the driver at pickup.
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="eco"
                  size="xl"
                  className="w-full mt-6"
                  disabled={!consentLocation || !agreeTerms}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Submit Pickup Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestPickup;
