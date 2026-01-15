import { Recycle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { materialInfo, formatCurrency } from '@/lib/crv-utils';

const CRVRatesCard = () => {
  const rates = [
    { size: 'Under 24 oz', rate: 0.05, examples: '12oz cans, 16oz bottles, 20oz bottles' },
    { size: '24 oz and larger', rate: 0.10, examples: '24oz bottles, 32oz bottles, 64oz jugs' },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Recycle className="w-5 h-5 text-primary" />
          California Redemption Value (CRV)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What you earn per container when recycling in California
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate Cards */}
        <div className="grid grid-cols-2 gap-3">
          {rates.map((item) => (
            <div
              key={item.size}
              className="p-4 rounded-xl bg-card border border-border text-center"
            >
              <p className="text-3xl font-display font-bold text-primary">
                {formatCurrency(item.rate)}
              </p>
              <p className="text-sm font-medium mt-1">{item.size}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.examples}</p>
            </div>
          ))}
        </div>

        {/* Material Types */}
        <div className="pt-2">
          <p className="text-sm font-medium mb-2 flex items-center gap-1">
            <Info className="w-4 h-4 text-muted-foreground" />
            Accepted Materials
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(materialInfo).map(([key, info]) => (
              <div
                key={key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${info.color} text-foreground`}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Quick math:</strong> 20 small cans = $1.00 • 10 large bottles = $1.00
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CRVRatesCard;
