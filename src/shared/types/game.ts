// Game Types for Reddit Noir: The Daily Murder Mystery

export interface Clue {
  id: string;
  name: string;
  description: string;
  found: boolean;
  linkedTo?: string; // suspect id this clue points to
}

export interface DialogueOption {
  id: string;
  text: string;
  response: string;
  unlocksClue?: string; // clue id to unlock
  nextOptions?: string[]; // follow-up dialogue option ids
  isSuspicious?: boolean;
}

export interface Suspect {
  id: string;
  name: string;
  description: string;
  alibi: string;
  isGuilty: boolean;
  dialogueOptions: DialogueOption[];
  portrait?: string; // asset key
  notes?: string
}

export interface CrimeSceneObject {
  id: string;
  name: string;
  x: number; // percentage position 0-100
  y: number; // percentage position 0-100
  width: number;
  height: number;
  description: string;
  clueId?: string; // clue to reveal when examined
  sprite?: string; // asset key
}

export interface Case {
  id: string;
  title: string;
  dayNumber: number;
  intro: string;
  victimName: string;
  victimDescription: string;
  location: string;
  crimeSceneObjects: CrimeSceneObject[];
  suspects: Suspect[];
  clues: Clue[];
  caseNotes?: string
}

export interface PlayerProgress {
  odayNumber: number;
  cluesFound: string[];
  suspectsInterrogated: string[];
  accusedSuspect?: string;
  solved: boolean;
  correct: boolean;
}

// API Types
export type InitGameResponse = {
  type: 'init_game';
  postId: string;
  currentCase: Case;
  progress: PlayerProgress;
};

export type FindClueRequest = {
  clueId: string;
};

export type FindClueResponse = {
  type: 'find_clue';
  postId: string;
  clue: Clue;
  progress: PlayerProgress;
};

export type AccuseRequest = {
  suspectId: string;
};

export type AccuseResponse = {
  type: 'accuse';
  postId: string;
  correct: boolean;
  suspect: Suspect;
  progress: PlayerProgress;
  pointsEarned?: number | undefined;
  totalPoints?: number | undefined;
  alreadySolved?: boolean | undefined;
  newAchievements?: AchievementId[] | undefined;
};

export type GetProgressResponse = {
  type: 'get_progress';
  postId: string;
  progress: PlayerProgress;
};

export interface SuspectStats {
  suspectId: string;
  suspectName: string;
  accusations: number;
  percentage: number;
}

export interface LeaderboardStats {
  totalPlayers: number;
  solvedCount: number;
  solveRate: number;
  suspectStats: SuspectStats[];
}

export type LeaderboardResponse = {
  type: 'leaderboard';
  postId: string;
  stats: LeaderboardStats;
};

// Achievement System
export type AchievementId =
  | 'first_blood'      // Solve a case on the first day it's available
  | 'speed_demon'      // Solve a case in under 5 minutes
  | 'thorough'         // Find all clues before making an accusation
  | 'lone_wolf'        // Solve when <10% of players got it right
  | 'streak_3'         // 3-day solve streak
  | 'streak_7'         // 7-day solve streak
  | 'streak_30'        // 30-day solve streak
  | 'perfect_record'   // 5 correct accusations in a row
  | 'veteran'          // Solve 10 cases total
  | 'master'           // Solve 25 cases total
  | 'legend';          // Solve 50 cases total

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;        // Emoji or icon identifier
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number; // Timestamp when unlocked
}

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Solve a case on the first day it\'s available',
    icon: '🩸',
    rarity: 'rare',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Solve a case in under 5 minutes',
    icon: '⚡',
    rarity: 'epic',
  },
  thorough: {
    id: 'thorough',
    name: 'Thorough Detective',
    description: 'Find all clues before making an accusation',
    icon: '🔍',
    rarity: 'common',
  },
  lone_wolf: {
    id: 'lone_wolf',
    name: 'Lone Wolf',
    description: 'Solve a case when less than 10% of players got it right',
    icon: '🐺',
    rarity: 'legendary',
  },
  streak_3: {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Maintain a 3-day solve streak',
    icon: '🔥',
    rarity: 'common',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day solve streak',
    icon: '💪',
    rarity: 'rare',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day solve streak',
    icon: '👑',
    rarity: 'legendary',
  },
  perfect_record: {
    id: 'perfect_record',
    name: 'Perfect Record',
    description: '5 correct accusations in a row',
    icon: '✨',
    rarity: 'epic',
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran Detective',
    description: 'Solve 10 cases total',
    icon: '🎖️',
    rarity: 'common',
  },
  master: {
    id: 'master',
    name: 'Master Detective',
    description: 'Solve 25 cases total',
    icon: '🏆',
    rarity: 'rare',
  },
  legend: {
    id: 'legend',
    name: 'Living Legend',
    description: 'Solve 50 cases total',
    icon: '⭐',
    rarity: 'legendary',
  },
};

// Detective rank based on total cases solved
export type DetectiveRank = 'Rookie' | 'Junior' | 'Senior' | 'Veteran' | 'Ace' | 'Master' | 'Legend';

export function getDetectiveRank(solvedCount: number): DetectiveRank {
  if (solvedCount >= 50) return 'Legend';
  if (solvedCount >= 25) return 'Master';
  if (solvedCount >= 15) return 'Ace';
  if (solvedCount >= 10) return 'Veteran';
  if (solvedCount >= 5) return 'Senior';
  if (solvedCount >= 2) return 'Junior';
  return 'Rookie';
}

// Points System
export interface DetectiveProfile {
  odayNumber: number; // legacy field, kept for compatibility
  points: number;
  solvedCases: string[]; // case IDs that have been solved correctly
  username?: string;
  // New achievement-related fields
  achievements: AchievementId[];
  currentStreak: number;
  longestStreak: number;
  lastSolveDate?: string; // ISO date string (YYYY-MM-DD)
  totalAccusations: number;
  correctAccusations: number;
  consecutiveCorrect: number; // Current streak of correct accusations
  gameStartTimes: Record<string, number>; // postId -> timestamp when game started
}

export interface DetectiveLeaderboardEntry {
  odayNumber: number; // legacy field
  points: number;
  solvedCount: number;
  username: string;
}

export interface DetectiveLeaderboardResponse {
  type: 'detective_leaderboard';
  topDetectives: DetectiveLeaderboardEntry[];
  userRank?: number;
  userProfile?: DetectiveProfile;
}

export interface PointsEarnedResponse {
  type: 'points_earned';
  pointsEarned: number;
  totalPoints: number;
  alreadySolved: boolean;
}
