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

// Points System
export interface DetectiveProfile {
  odayNumber: number; // legacy field, kept for compatibility
  points: number;
  solvedCases: string[]; // case IDs that have been solved correctly
  username?: string;
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
