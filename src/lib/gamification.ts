// Gamification system for CRV recycling

import type { MaterialType } from './crv-utils';

// Points per item by material type
export const MATERIAL_POINTS: Record<MaterialType, number> = {
  aluminum: 10,  // Most valuable - easy to recycle
  plastic: 7,    // Medium value
  glass: 5,      // Lower points - heavier, harder to transport
};

// Bonus points for larger containers
export const SIZE_BONUS = (sizeOz: number): number => {
  if (sizeOz >= 64) return 5;
  if (sizeOz >= 24) return 3;
  return 0;
};

// Calculate points for a single item
export const calculateItemPoints = (
  materialType: MaterialType,
  sizeOz: number,
  quantity: number
): number => {
  const basePoints = MATERIAL_POINTS[materialType];
  const sizeBonus = SIZE_BONUS(sizeOz);
  return (basePoints + sizeBonus) * quantity;
};

// Level thresholds - XP needed to reach each level
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2200,   // Level 7
  3000,   // Level 8
  4000,   // Level 9
  5500,   // Level 10
  7500,   // Level 11
  10000,  // Level 12
  15000,  // Level 13
  20000,  // Level 14
  30000,  // Level 15 (max)
];

// Level titles and colors
export const LEVEL_INFO: Record<number, { title: string; color: string; icon: string }> = {
  1: { title: 'Recycling Rookie', color: 'bg-slate-500', icon: '🌱' },
  2: { title: 'Eco Starter', color: 'bg-slate-600', icon: '🌿' },
  3: { title: 'Green Collector', color: 'bg-emerald-500', icon: '♻️' },
  4: { title: 'Sustainability Scout', color: 'bg-emerald-600', icon: '🔋' },
  5: { title: 'Earth Guardian', color: 'bg-teal-500', icon: '🌍' },
  6: { title: 'Eco Warrior', color: 'bg-teal-600', icon: '⚡' },
  7: { title: 'Planet Protector', color: 'bg-cyan-500', icon: '🛡️' },
  8: { title: 'Recycling Champion', color: 'bg-blue-500', icon: '🏆' },
  9: { title: 'Environmental Hero', color: 'bg-blue-600', icon: '🦸' },
  10: { title: 'Eco Master', color: 'bg-indigo-500', icon: '✨' },
  11: { title: 'Green Legend', color: 'bg-violet-500', icon: '🌟' },
  12: { title: 'Sustainability Sage', color: 'bg-purple-500', icon: '🔮' },
  13: { title: 'Earth Ambassador', color: 'bg-fuchsia-500', icon: '👑' },
  14: { title: 'Recycling Overlord', color: 'bg-amber-500', icon: '💎' },
  15: { title: 'Eco Legend', color: 'bg-gradient-to-r from-amber-400 to-yellow-300', icon: '🏅' },
};

// Get level from total XP
export const getLevelFromXP = (totalXP: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

// Get XP progress toward next level
export const getXPProgress = (totalXP: number): { 
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressXP: number;
  progressPercent: number;
} => {
  const currentLevel = getLevelFromXP(totalXP);
  const currentLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progressXP = totalXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPercent = currentLevel >= 15 ? 100 : Math.min(100, (progressXP / neededXP) * 100);

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progressXP,
    progressPercent,
  };
};

// Get level info with fallback
export const getLevelInfo = (level: number) => {
  return LEVEL_INFO[Math.min(Math.max(level, 1), 15)] || LEVEL_INFO[1];
};

// Streak bonuses (future feature)
export const STREAK_MULTIPLIERS = {
  3: 1.1,   // 3 pickups in a week = 10% bonus
  5: 1.25,  // 5 pickups = 25% bonus
  7: 1.5,   // 7 pickups = 50% bonus
};

// Achievement thresholds
export const ACHIEVEMENTS = {
  first_pickup: { name: 'First Steps', description: 'Complete your first pickup', icon: '🎉', points: 50 },
  ten_pickups: { name: 'Getting Started', description: 'Complete 10 pickups', icon: '🔥', points: 200 },
  hundred_items: { name: 'Centurion', description: 'Recycle 100 items', icon: '💯', points: 300 },
  thousand_items: { name: 'Eco Champion', description: 'Recycle 1,000 items', icon: '🏅', points: 1000 },
  aluminum_master: { name: 'Can Crusher', description: 'Recycle 500 aluminum cans', icon: '🥫', points: 500 },
  glass_master: { name: 'Glass Guardian', description: 'Recycle 200 glass bottles', icon: '🍾', points: 500 },
  plastic_master: { name: 'Plastic Pioneer', description: 'Recycle 300 plastic bottles', icon: '🧴', points: 500 },
};

// Format large numbers
export const formatPoints = (points: number): string => {
  if (points >= 10000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toLocaleString();
};
