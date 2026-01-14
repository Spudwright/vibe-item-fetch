import { useState } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  calculateFullCRV,
  calculateUserPayout,
  formatCurrency,
  materialInfo,
  commonSizes,
  type CRVItem,
  type MaterialType,
} from '@/lib/crv-utils';

const CRVCalculator = () => {
  const [items, setItems] = useState<CRVItem[]>([
    { id: '1', description: '', materialType: 'aluminum', sizeOz: 12, quantity: 10 },
  ]);
  const [userTotalRedeemed, setUserTotalRedeemed] = useState(0);

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

  const fullCRV = calculateFullCRV(items);
  const { payout, fee, feeRate } = calculateUserPayout(fullCRV, userTotalRedeemed);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl eco-gradient shadow-eco mb-4">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              CRV Calculator
            </h2>
            <p className="text-muted-foreground">
              Estimate your earnings before scheduling a pickup.
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-muted/50 animate-fade-in"
                >
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
                    <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })
                      }
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addItem} className="w-full mb-8">
              <Plus className="w-4 h-4" />
              Add More Items
            </Button>

            {/* User tier selection */}
            <div className="p-4 rounded-xl bg-muted/50 mb-6">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Your lifetime redemption total (for fee tier):
              </label>
              <div className="flex gap-2">
                <Button
                  variant={userTotalRedeemed < 100 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserTotalRedeemed(0)}
                >
                  Under $100 (50% fee)
                </Button>
                <Button
                  variant={userTotalRedeemed >= 100 ? 'gold' : 'outline'}
                  size="sm"
                  onClick={() => setUserTotalRedeemed(100)}
                >
                  $100+ (40% fee)
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-muted text-center">
                <p className="text-xs text-muted-foreground mb-1">Full CRV Value</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {formatCurrency(fullCRV)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Our Fee ({(feeRate * 100).toFixed(0)}%)
                </p>
                <p className="font-display text-2xl font-bold text-destructive">
                  -{formatCurrency(fee)}
                </p>
              </div>
              <div className="p-4 rounded-xl gold-gradient text-center">
                <p className="text-xs text-foreground/70 mb-1">Your Payout</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {formatCurrency(payout)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CRVCalculator;
