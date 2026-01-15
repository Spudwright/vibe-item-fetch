import { Card, CardContent } from '@/components/ui/card';
import { Recycle, Zap, TrendingUp, Trophy } from 'lucide-react';
import LevelBadge from './LevelBadge';
import XPProgressBar from './XPProgressBar';
import { formatPoints } from '@/lib/gamification';

interface UserStatsCardProps {
  level: number;
  totalXP: number;
  totalPoints: number;
  totalItemsRecycled: number;
  crvBalance: number;
}

const UserStatsCard = ({
  level,
  totalXP,
  totalPoints,
  totalItemsRecycled,
  crvBalance,
}: UserStatsCardProps) => {
  const stats = [
    {
      icon: Trophy,
      label: 'Total Points',
      value: formatPoints(totalPoints),
      color: 'text-amber-500',
    },
    {
      icon: Recycle,
      label: 'Items Recycled',
      value: formatPoints(totalItemsRecycled),
      color: 'text-emerald-500',
    },
    {
      icon: TrendingUp,
      label: 'CRV Earned',
      value: `$${(crvBalance / 100).toFixed(2)}`,
      color: 'text-primary',
    },
  ];

  return (
    <Card className="overflow-hidden">
      {/* Header with level */}
      <div className="p-4 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <LevelBadge level={level} size="lg" />
          <div className="flex-1">
            <XPProgressBar totalXP={totalXP} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStatsCard;
