import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronRight, Trophy, Target, Flame } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import UserStatsCard from '@/components/UserStatsCard';
import LevelBadge from '@/components/LevelBadge';
import XPProgressBar from '@/components/XPProgressBar';
import { getLevelInfo, LEVEL_THRESHOLDS, ACHIEVEMENTS } from '@/lib/gamification';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  full_name: string | null;
  email: string | null;
  level: number;
  current_xp: number;
  total_points: number;
  total_items_recycled: number;
  crv_balance: number;
}

const UserProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, level, current_xp, total_points, total_items_recycled, crv_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30 py-10">
          <div className="container mx-auto px-4 max-w-2xl space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const levelInfo = getLevelInfo(profile?.level || 1);
  const nextLevelXP = LEVEL_THRESHOLDS[profile?.level || 1] || 0;

  // Calculate unlocked achievements
  const unlockedAchievements = [];
  if ((profile?.total_items_recycled || 0) >= 1) unlockedAchievements.push(ACHIEVEMENTS.first_pickup);
  if ((profile?.total_items_recycled || 0) >= 100) unlockedAchievements.push(ACHIEVEMENTS.hundred_items);
  if ((profile?.total_items_recycled || 0) >= 1000) unlockedAchievements.push(ACHIEVEMENTS.thousand_items);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30 py-10">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          {/* Profile Header */}
          <Card className="overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
            <CardContent className="pt-0 -mt-10">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-lg">
                  <LevelBadge level={profile?.level || 1} size="lg" />
                </div>
                <div className="flex-1 pb-2">
                  <h1 className="font-display text-xl font-bold">
                    {profile?.full_name || 'Recycler'}
                  </h1>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{levelInfo.icon}</span>
                  <span className="font-semibold">{levelInfo.title}</span>
                </div>
                <XPProgressBar totalXP={profile?.current_xp || 0} />
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <UserStatsCard
            level={profile?.level || 1}
            totalXP={profile?.current_xp || 0}
            totalPoints={profile?.total_points || 0}
            totalItemsRecycled={profile?.total_items_recycled || 0}
            crvBalance={profile?.crv_balance || 0}
          />

          {/* Level Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {LEVEL_THRESHOLDS.slice(0, 8).map((threshold, index) => {
                  const level = index + 1;
                  const info = getLevelInfo(level);
                  const isUnlocked = (profile?.level || 1) >= level;
                  const isCurrent = (profile?.level || 1) === level;

                  return (
                    <div
                      key={level}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrent ? 'bg-primary/10 border border-primary/30' : 
                        isUnlocked ? 'opacity-100' : 'opacity-50'
                      }`}
                    >
                      <LevelBadge level={level} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{info.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {threshold.toLocaleString()} XP
                        </p>
                      </div>
                      {isUnlocked && (
                        <span className="text-xs text-primary font-medium">✓ Unlocked</span>
                      )}
                    </div>
                  );
                })}
                {(profile?.level || 1) < 8 && (
                  <p className="text-xs text-center text-muted-foreground">
                    + {LEVEL_THRESHOLDS.length - 8} more levels to unlock!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
                  const isUnlocked = unlockedAchievements.includes(achievement);
                  return (
                    <div
                      key={key}
                      className={`text-center p-3 rounded-xl border transition-all ${
                        isUnlocked 
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                          : 'bg-muted/30 border-border opacity-50'
                      }`}
                      title={achievement.description}
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <p className="text-xs font-medium mt-1 line-clamp-1">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground">+{achievement.points} pts</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => navigate('/my-pickups')}
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  My Pickups
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-between text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
