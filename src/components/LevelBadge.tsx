import { getLevelInfo } from '@/lib/gamification';
import { cn } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

const LevelBadge = ({ level, size = 'md', showTitle = false }: LevelBadgeProps) => {
  const info = getLevelInfo(level);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold text-white shadow-lg',
          info.color,
          sizeClasses[size]
        )}
        title={info.title}
      >
        {level}
      </div>
      {showTitle && (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{info.icon} {info.title}</span>
        </div>
      )}
    </div>
  );
};

export default LevelBadge;
