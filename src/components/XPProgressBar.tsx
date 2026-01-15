import { getXPProgress, getLevelInfo, formatPoints } from '@/lib/gamification';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface XPProgressBarProps {
  totalXP: number;
  showDetails?: boolean;
}

const XPProgressBar = ({ totalXP, showDetails = true }: XPProgressBarProps) => {
  const { currentLevel, nextLevelXP, progressXP, progressPercent, currentLevelXP } = getXPProgress(totalXP);
  const currentInfo = getLevelInfo(currentLevel);
  const nextInfo = getLevelInfo(Math.min(currentLevel + 1, 15));
  const isMaxLevel = currentLevel >= 15;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentInfo.icon}</span>
          <span className="font-medium">{currentInfo.title}</span>
        </div>
        {!isMaxLevel && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            <span>Next: {nextInfo.title}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <Progress 
          value={progressPercent} 
          className="h-3 bg-muted"
        />
        {/* Animated glow effect */}
        <div 
          className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-primary/50 to-primary opacity-75 blur-sm transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Level {currentLevel}</span>
          {isMaxLevel ? (
            <span className="text-amber-500 font-medium">✨ MAX LEVEL ✨</span>
          ) : (
            <span>
              {formatPoints(progressXP)} / {formatPoints(nextLevelXP - currentLevelXP)} XP
            </span>
          )}
          <span>Level {Math.min(currentLevel + 1, 15)}</span>
        </div>
      )}
    </div>
  );
};

export default XPProgressBar;
