import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MATERIAL_POINTS, SIZE_BONUS, calculateItemPoints, formatPoints } from '@/lib/gamification';
import { materialInfo, type CRVItem } from '@/lib/crv-utils';
import { Zap, TrendingUp, Gift } from 'lucide-react';

interface PointsBreakdownProps {
  items?: CRVItem[];
  showRates?: boolean;
}

const PointsBreakdown = ({ items, showRates = true }: PointsBreakdownProps) => {
  // Calculate total points from items
  const totalPoints = items?.reduce((sum, item) => {
    return sum + calculateItemPoints(item.materialType, item.sizeOz, item.quantity);
  }, 0) || 0;

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          Points System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showRates && (
          <>
            {/* Material Points */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <Gift className="w-4 h-4 text-muted-foreground" />
                Points per Item
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(MATERIAL_POINTS).map(([material, points]) => {
                  const info = materialInfo[material as keyof typeof materialInfo];
                  return (
                    <div
                      key={material}
                      className={`p-3 rounded-lg ${info.color} text-center transition-transform hover:scale-105`}
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <p className="text-xs font-medium mt-1">{info.label.split(' ')[0]}</p>
                      <p className="text-lg font-bold text-primary">+{points}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Size Bonuses */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Size Bonuses
              </p>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 p-2 rounded-lg bg-muted text-center">
                  <p className="font-medium">24oz+</p>
                  <p className="text-primary font-bold">+3 pts</p>
                </div>
                <div className="flex-1 p-2 rounded-lg bg-muted text-center">
                  <p className="font-medium">64oz+</p>
                  <p className="text-primary font-bold">+5 pts</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Total from items */}
        {items && items.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Your Points This Pickup</span>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xl font-bold text-primary">
                  +{formatPoints(totalPoints)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Points = XP for leveling up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsBreakdown;
