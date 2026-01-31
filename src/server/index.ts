import express from 'express';
import {
  InitGameResponse,
  FindClueRequest,
  FindClueResponse,
  AccuseRequest,
  AccuseResponse,
  PlayerProgress,
  LeaderboardResponse,
  LeaderboardStats,
  SuspectStats,
  DetectiveProfile,
  DetectiveLeaderboardEntry,
  DetectiveLeaderboardResponse,
  AchievementId,
  ACHIEVEMENTS,
  Case,
  // Weekly types
  WeeklyCase,
  WeeklyProgress,
  ChapterStatus,
  InitWeeklyGameResponse,
  CompleteChapterRequest,
  CompleteChapterResponse,
  WeeklyFindClueResponse,
  WeeklyAccuseResponse,
  WeeklyProgressResponse,
  WEEKLY_POINTS,
} from '../shared/types/game';
import { redis, reddit, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { getCurrentCase } from '../shared/data/cases';
import { getCurrentWeeklyCase } from '../shared/data/weekly-cases';

// Points awarded for solving a case
const POINTS_PER_SOLVE = 100;

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Helper to get player progress from Redis
async function getPlayerProgress(postId: string, odayNumber: number): Promise<PlayerProgress> {
  const userId = context.userId || 'anonymous';
  const key = `progress:${postId}:${userId}`;
  const data = await redis.get(key);

  if (data) {
    return JSON.parse(data) as PlayerProgress;
  }

  // Default progress
  return {
    odayNumber: odayNumber,
    cluesFound: [],
    suspectsInterrogated: [],
    solved: false,
    correct: false,
  };
}

// Helper to save player progress to Redis
async function savePlayerProgress(postId: string, progress: PlayerProgress): Promise<void> {
  const userId = context.userId || 'anonymous';
  const key = `progress:${postId}:${userId}`;
  await redis.set(key, JSON.stringify(progress));
}

// Helper to get detective profile from Redis
async function getDetectiveProfile(): Promise<DetectiveProfile> {
  const userId = context.userId || 'anonymous';
  const key = `detective:${userId}`;
  const data = await redis.get(key);

  if (data) {
    const profile = JSON.parse(data) as DetectiveProfile;
    // Ensure new fields exist for backwards compatibility
    return {
      ...profile,
      achievements: profile.achievements || [],
      currentStreak: profile.currentStreak || 0,
      longestStreak: profile.longestStreak || 0,
      totalAccusations: profile.totalAccusations || 0,
      correctAccusations: profile.correctAccusations || 0,
      consecutiveCorrect: profile.consecutiveCorrect || 0,
      gameStartTimes: profile.gameStartTimes || {},
    };
  }

  // Default profile
  return {
    odayNumber: 1,
    points: 0,
    solvedCases: [],
    username: context.username || 'Anonymous',
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    totalAccusations: 0,
    correctAccusations: 0,
    consecutiveCorrect: 0,
    gameStartTimes: {},
  };
}

// Helper to save detective profile to Redis
async function saveDetectiveProfile(profile: DetectiveProfile): Promise<void> {
  const userId = context.userId || 'anonymous';
  const key = `detective:${userId}`;
  await redis.set(key, JSON.stringify(profile));

  // Also update the leaderboard sorted set
  await redis.zAdd('leaderboard:points', { member: userId, score: profile.points });
}

// Helper to get today's date as ISO string (YYYY-MM-DD)
function getTodayDateString(): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return dateStr || new Date().toISOString().substring(0, 10);
}

// Helper to check if two dates are consecutive days
function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Helper to check and award achievements
async function checkAndAwardAchievements(
  profile: DetectiveProfile,
  currentCase: Case,
  postId: string,
  cluesFound: string[],
  isCorrect: boolean
): Promise<AchievementId[]> {
  const newAchievements: AchievementId[] = [];
  const now = Date.now();
  const today = getTodayDateString();

  // Helper to award an achievement if not already earned
  const awardIfNew = (achievementId: AchievementId) => {
    if (!profile.achievements.includes(achievementId)) {
      profile.achievements.push(achievementId);
      newAchievements.push(achievementId);
    }
  };

  // Update accusation stats
  profile.totalAccusations = (profile.totalAccusations || 0) + 1;

  if (isCorrect) {
    profile.correctAccusations = (profile.correctAccusations || 0) + 1;
    profile.consecutiveCorrect = (profile.consecutiveCorrect || 0) + 1;

    // Check streak
    if (profile.lastSolveDate) {
      if (areConsecutiveDays(profile.lastSolveDate, today)) {
        profile.currentStreak = (profile.currentStreak || 0) + 1;
      } else if (profile.lastSolveDate !== today) {
        // Streak broken, reset to 1
        profile.currentStreak = 1;
      }
    } else {
      profile.currentStreak = 1;
    }

    // Update longest streak
    if (profile.currentStreak > (profile.longestStreak || 0)) {
      profile.longestStreak = profile.currentStreak;
    }

    profile.lastSolveDate = today;

    // === ACHIEVEMENT CHECKS ===

    // 1. First Blood - solve on first day (check if case was created today)
    // For simplicity, we award this if they're among the first 10 solvers
    const solvedKey = `stats:${postId}:solved`;
    const solvedStr = await redis.get(solvedKey);
    const solvedCount = solvedStr ? parseInt(solvedStr, 10) : 0;
    if (solvedCount <= 10) {
      awardIfNew('first_blood');
    }

    // 2. Speed Demon - solve in under 5 minutes
    const startTime = profile.gameStartTimes?.[postId];
    if (startTime && (now - startTime) < 5 * 60 * 1000) {
      awardIfNew('speed_demon');
    }

    // 3. Thorough Detective - find all clues before accusing
    const totalClues = currentCase.clues.length;
    if (cluesFound.length >= totalClues) {
      awardIfNew('thorough');
    }

    // 4. Lone Wolf - solve when <10% got it right (checked later, after stats update)
    // We'll check this after the stats are updated

    // 5. Streak achievements
    if (profile.currentStreak >= 3) awardIfNew('streak_3');
    if (profile.currentStreak >= 7) awardIfNew('streak_7');
    if (profile.currentStreak >= 30) awardIfNew('streak_30');

    // 6. Perfect Record - 5 correct in a row
    if (profile.consecutiveCorrect >= 5) {
      awardIfNew('perfect_record');
    }

    // 7. Milestone achievements based on total solves
    const totalSolves = profile.solvedCases.length + 1; // +1 for current solve
    if (totalSolves >= 10) awardIfNew('veteran');
    if (totalSolves >= 25) awardIfNew('master');
    if (totalSolves >= 50) awardIfNew('legend');

  } else {
    // Wrong accusation - reset consecutive correct
    profile.consecutiveCorrect = 0;
  }

  return newAchievements;
}

// Helper to check Lone Wolf achievement (must be called after stats are updated)
async function checkLoneWolfAchievement(
  profile: DetectiveProfile,
  postId: string
): Promise<AchievementId | null> {
  const totalKey = `stats:${postId}:total`;
  const solvedKey = `stats:${postId}:solved`;

  const totalStr = await redis.get(totalKey);
  const solvedStr = await redis.get(solvedKey);

  const totalPlayers = totalStr ? parseInt(totalStr, 10) : 0;
  const solvedCount = solvedStr ? parseInt(solvedStr, 10) : 0;

  // Need at least 10 players for this to count
  if (totalPlayers >= 10) {
    const solveRate = (solvedCount / totalPlayers) * 100;
    if (solveRate < 10 && !profile.achievements.includes('lone_wolf')) {
      profile.achievements.push('lone_wolf');
      return 'lone_wolf';
    }
  }

  return null;
}

// Helper to award points for solving a case (returns points earned, 0 if already solved)
async function awardPointsForCase(caseId: string): Promise<{ pointsEarned: number; alreadySolved: boolean }> {
  const profile = await getDetectiveProfile();

  // Check if already solved this case
  if (profile.solvedCases.includes(caseId)) {
    return { pointsEarned: 0, alreadySolved: true };
  }

  // Award points
  profile.solvedCases.push(caseId);
  profile.points += POINTS_PER_SOLVE;
  profile.username = context.username || 'Anonymous';

  await saveDetectiveProfile(profile);

  return { pointsEarned: POINTS_PER_SOLVE, alreadySolved: false };
}

// Initialize game - get current case and player progress
router.get<object, InitGameResponse | { status: string; message: string }>(
  '/api/game/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const currentCase = getCurrentCase();
      const progress = await getPlayerProgress(postId, currentCase.dayNumber);

      res.json({
        type: 'init_game',
        postId: postId,
        currentCase: currentCase,
        progress: progress,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Find a clue
router.post<object, FindClueResponse | { status: string; message: string }, FindClueRequest>(
  '/api/game/find-clue',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { clueId } = req.body;
      const currentCase = getCurrentCase();
      const clue = currentCase.clues.find((c) => c.id === clueId);

      if (!clue) {
        res.status(404).json({
          status: 'error',
          message: 'Clue not found',
        });
        return;
      }

      // Get and update player progress
      const progress = await getPlayerProgress(postId, currentCase.dayNumber);

      if (!progress.cluesFound.includes(clueId)) {
        progress.cluesFound.push(clueId);
        await savePlayerProgress(postId, progress);
      }

      // Return the found clue with updated status
      const foundClue = { ...clue, found: true };

      res.json({
        type: 'find_clue',
        postId,
        clue: foundClue,
        progress,
      });
    } catch (error) {
      console.error(`API Find Clue Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to find clue',
      });
    }
  }
);

// Make accusation
router.post<object, AccuseResponse | { status: string; message: string }, AccuseRequest>(
  '/api/game/accuse',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { suspectId } = req.body;
      const currentCase = getCurrentCase();
      const suspect = currentCase.suspects.find((s) => s.id === suspectId);

      if (!suspect) {
        res.status(404).json({
          status: 'error',
          message: 'Suspect not found',
        });
        return;
      }

      // Get and update player progress
      const progress = await getPlayerProgress(postId, currentCase.dayNumber);
      progress.accusedSuspect = suspectId;
      progress.solved = true;
      progress.correct = suspect.isGuilty;

      await savePlayerProgress(postId, progress);

      // Track global statistics
      const accuseKey = `accuse:${postId}:${suspectId}`;
      await redis.incrBy(accuseKey, 1);

      // Track total players who made an accusation
      const totalKey = `stats:${postId}:total`;
      await redis.incrBy(totalKey, 1);

      if (progress.correct) {
        const statsKey = `stats:${postId}:solved`;
        await redis.incrBy(statsKey, 1);
      }

      // Award points if correct (server-side check for duplicate solves)
      let pointsEarned = 0;
      let alreadySolved = false;
      if (progress.correct) {
        const pointsResult = await awardPointsForCase(currentCase.id);
        pointsEarned = pointsResult.pointsEarned;
        alreadySolved = pointsResult.alreadySolved;
      }

      // Check and award achievements
      let newAchievements: AchievementId[] = [];
      if (!alreadySolved) {
        const profile = await getDetectiveProfile();
        newAchievements = await checkAndAwardAchievements(
          profile,
          currentCase,
          postId,
          progress.cluesFound,
          progress.correct
        );

        // Check Lone Wolf achievement after stats are updated
        if (progress.correct) {
          const loneWolf = await checkLoneWolfAchievement(profile, postId);
          if (loneWolf) {
            newAchievements.push(loneWolf);
          }
        }

        // Save updated profile with achievements
        await saveDetectiveProfile(profile);
      }

      // Post a comment on the game post (only for correct accusations, first time only)
      if (progress.correct && !alreadySolved) {
        const username = context.username || 'A detective';
        try {
          let commentText = `🔍 **${username}** solved the case and earned ${pointsEarned} points!`;
          if (newAchievements.length > 0) {
            const achievementNames = newAchievements.map(id => ACHIEVEMENTS[id].icon + ' ' + ACHIEVEMENTS[id].name);
            commentText += `\n\n🏆 **New Achievements:** ${achievementNames.join(', ')}`;
          }
          await reddit.submitComment({
            id: postId,
            text: commentText,
          });
        } catch (commentError) {
          console.error('Failed to post comment:', commentError);
        }
      }

      // Get updated profile for response
      const profile = await getDetectiveProfile();

      res.json({
        type: 'accuse',
        postId,
        correct: suspect.isGuilty,
        suspect,
        progress,
        pointsEarned,
        totalPoints: profile.points,
        alreadySolved,
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      });
    } catch (error) {
      console.error(`API Accuse Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to make accusation',
      });
    }
  }
);

// Get player progress
router.get<object, { type: string; postId: string; progress: PlayerProgress } | { status: string; message: string }>(
  '/api/game/progress',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const currentCase = getCurrentCase();
      const progress = await getPlayerProgress(postId, currentCase.dayNumber);

      res.json({
        type: 'get_progress',
        postId,
        progress,
      });
    } catch (error) {
      console.error(`API Progress Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to get progress',
      });
    }
  }
);

// Record game start time (for Speed Demon achievement)
router.post<object, { type: string; started: boolean } | { status: string; message: string }>(
  '/api/game/start',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const profile = await getDetectiveProfile();

      // Only record start time if not already set for this post
      if (!profile.gameStartTimes[postId]) {
        profile.gameStartTimes[postId] = Date.now();
        await saveDetectiveProfile(profile);
      }

      res.json({
        type: 'game_start',
        started: true,
      });
    } catch (error) {
      console.error(`API Game Start Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to record game start',
      });
    }
  }
);

// Admin usernames that can reset their progress for testing
const ADMIN_USERNAMES = ['ashscars'];

// Reset progress (admin only)
router.post<object, { type: string; postId: string; progress: PlayerProgress } | { status: string; message: string }>(
  '/api/game/reset',
  async (_req, res): Promise<void> => {
    const { postId, userId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    // Check if user is admin
    const username = context.username?.toLowerCase();
    if (!username || !ADMIN_USERNAMES.includes(username)) {
      res.status(403).json({
        status: 'error',
        message: 'Unauthorized: admin access required',
      });
      return;
    }

    try {
      const currentCase = getCurrentCase();

      // Create fresh progress
      const freshProgress: PlayerProgress = {
        odayNumber: currentCase.dayNumber,
        cluesFound: [],
        suspectsInterrogated: [],
        solved: false,
        correct: false,
      };

      await savePlayerProgress(postId, freshProgress);

      res.json({
        type: 'reset_progress',
        postId,
        progress: freshProgress,
      });
    } catch (error) {
      console.error(`API Reset Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to reset progress',
      });
    }
  }
);

// Get leaderboard stats
router.get<object, LeaderboardResponse | { status: string; message: string }>(
  '/api/game/leaderboard',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const currentCase = getCurrentCase();

      // Get total players and solved count
      const totalKey = `stats:${postId}:total`;
      const solvedKey = `stats:${postId}:solved`;

      const totalStr = await redis.get(totalKey);
      const solvedStr = await redis.get(solvedKey);

      const totalPlayers = totalStr ? parseInt(totalStr, 10) : 0;
      const solvedCount = solvedStr ? parseInt(solvedStr, 10) : 0;
      const solveRate = totalPlayers > 0 ? Math.round((solvedCount / totalPlayers) * 100) : 0;

      // Get accusation stats for each suspect
      const suspectStats: SuspectStats[] = [];

      for (const suspect of currentCase.suspects) {
        const accuseKey = `accuse:${postId}:${suspect.id}`;
        const accuseStr = await redis.get(accuseKey);
        const accusations = accuseStr ? parseInt(accuseStr, 10) : 0;
        const percentage = totalPlayers > 0 ? Math.round((accusations / totalPlayers) * 100) : 0;

        suspectStats.push({
          suspectId: suspect.id,
          suspectName: suspect.name,
          accusations,
          percentage,
        });
      }

      // Sort by accusations (most accused first)
      suspectStats.sort((a, b) => b.accusations - a.accusations);

      const stats: LeaderboardStats = {
        totalPlayers,
        solvedCount,
        solveRate,
        suspectStats,
      };

      res.json({
        type: 'leaderboard',
        postId,
        stats,
      });
    } catch (error) {
      console.error(`API Leaderboard Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to get leaderboard',
      });
    }
  }
);

// Get detective leaderboard (top detectives by points)
router.get<object, DetectiveLeaderboardResponse | { status: string; message: string }>(
  '/api/game/detective-leaderboard',
  async (_req, res): Promise<void> => {
    try {
      // Get top 10 detectives by points
      const topMembers = await redis.zRange('leaderboard:points', 0, 9, { reverse: true, by: 'rank' });

      const topDetectives: DetectiveLeaderboardEntry[] = [];

      for (const member of topMembers) {
        const key = `detective:${member.member}`;
        const data = await redis.get(key);
        if (data) {
          const profile = JSON.parse(data) as DetectiveProfile;
          topDetectives.push({
            odayNumber: profile.odayNumber,
            points: profile.points,
            solvedCount: profile.solvedCases.length,
            username: profile.username || 'Anonymous',
          });
        }
      }

      // Get current user's rank and profile
      const userId = context.userId || 'anonymous';
      let userRank: number | undefined;
      let userProfile: DetectiveProfile | undefined;

      if (userId !== 'anonymous') {
        const rank = await redis.zRank('leaderboard:points', userId);
        if (rank !== undefined) {
          // zRank returns 0-indexed, and we want descending order
          const totalMembers = await redis.zCard('leaderboard:points');
          userRank = totalMembers - rank;
        }
        userProfile = await getDetectiveProfile();
      }

      res.json({
        type: 'detective_leaderboard',
        topDetectives,
        userRank,
        userProfile,
      });
    } catch (error) {
      console.error(`API Detective Leaderboard Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to get detective leaderboard',
      });
    }
  }
);

// Get current user's detective profile
router.get<object, { type: string; profile: DetectiveProfile } | { status: string; message: string }>(
  '/api/game/profile',
  async (_req, res): Promise<void> => {
    try {
      const profile = await getDetectiveProfile();
      res.json({
        type: 'profile',
        profile,
      });
    } catch (error) {
      console.error(`API Profile Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to get profile',
      });
    }
  }
);

// ============================================
// WEEKLY CASE SYSTEM ENDPOINTS
// ============================================

// Helper to get current week info
function getCurrentWeekInfo(): { weekNumber: number; startDate: string; dayOfWeek: number } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1=Mon, 7=Sun

  // Calculate Monday of this week
  const monday = new Date(now);
  monday.setDate(now.getDate() - (adjustedDay - 1));

  // Calculate week number
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((monday.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7);

  return {
    weekNumber,
    startDate: monday.toISOString().split('T')[0] || '',
    dayOfWeek: adjustedDay,
  };
}

// Helper to get unlocked chapters based on current day
function getUnlockedChapters(): number[] {
  const { dayOfWeek } = getCurrentWeekInfo();
  const unlocked: number[] = [];
  for (let i = 1; i <= dayOfWeek; i++) {
    unlocked.push(i);
  }
  return unlocked;
}

// Helper to calculate chapter points
function calculateChapterPoints(
  consecutiveDays: number,
  isOnTime: boolean
): { basePoints: number; streakBonus: number; onTimeBonus: number } {
  const basePoints = WEEKLY_POINTS.CHAPTER_COMPLETE;
  const streakMultiplier = Math.min(consecutiveDays * WEEKLY_POINTS.STREAK_MULTIPLIER_PER_DAY, 0.5);
  const streakBonus = Math.floor(basePoints * streakMultiplier);
  const onTimeBonus = isOnTime ? WEEKLY_POINTS.ON_TIME_BONUS : 0;

  return { basePoints, streakBonus, onTimeBonus };
}

// Helper to get weekly progress from Redis
async function getWeeklyProgress(postId: string, caseId: string): Promise<WeeklyProgress> {
  const userId = context.userId || 'anonymous';
  const key = `weekly-progress:${postId}:${userId}`;
  const data = await redis.get(key);

  if (data) {
    return JSON.parse(data) as WeeklyProgress;
  }

  // Default weekly progress
  return {
    caseId,
    odayNumber: 1,
    chaptersCompleted: [],
    currentChapter: 1,
    cluesFoundByChapter: {},
    witnessesInterrogated: [],
    suspectsRevealed: [],
    solved: false,
    correct: false,
    dailyBonusEarned: {},
    consecutiveDaysPlayed: 0,
  };
}

// Helper to save weekly progress to Redis
async function saveWeeklyProgress(postId: string, progress: WeeklyProgress): Promise<void> {
  const userId = context.userId || 'anonymous';
  const key = `weekly-progress:${postId}:${userId}`;
  await redis.set(key, JSON.stringify(progress));
}

// Helper to build chapter statuses for UI
function buildChapterStatuses(weeklyCase: WeeklyCase, progress: WeeklyProgress): ChapterStatus[] {
  const unlockedChapters = getUnlockedChapters();

  return weeklyCase.chapters.map((chapter) => {
    const isUnlocked = unlockedChapters.includes(chapter.dayNumber);
    const isCompleted = progress.chaptersCompleted.includes(chapter.dayNumber);

    // Available if unlocked AND all previous chapters completed
    const previousChaptersComplete = weeklyCase.chapters
      .filter((c) => c.dayNumber < chapter.dayNumber)
      .every((c) => progress.chaptersCompleted.includes(c.dayNumber));

    const isAvailable = isUnlocked && previousChaptersComplete && !isCompleted;
    const isCurrent = isAvailable && !isCompleted;

    return {
      dayNumber: chapter.dayNumber,
      title: chapter.title,
      isUnlocked,
      isCompleted,
      isAvailable,
      isCurrent,
    };
  });
}

// Initialize weekly game
router.get<object, InitWeeklyGameResponse | { status: string; message: string }>(
  '/api/weekly/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const weeklyCase = getCurrentWeeklyCase();

      if (!weeklyCase) {
        res.status(404).json({
          status: 'error',
          message: 'No weekly case available',
        });
        return;
      }

      const progress = await getWeeklyProgress(postId, weeklyCase.id);
      const chapterStatuses = buildChapterStatuses(weeklyCase, progress);
      const { dayOfWeek } = getCurrentWeekInfo();

      res.json({
        type: 'init_weekly_game',
        postId,
        weeklyCase,
        progress,
        chapterStatuses,
        currentDayNumber: dayOfWeek,
        isAccusationUnlocked: dayOfWeek === 7,
      });
    } catch (error) {
      console.error(`API Weekly Init Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to initialize weekly game',
      });
    }
  }
);

// Complete a chapter
router.post<object, CompleteChapterResponse | { status: string; message: string }, CompleteChapterRequest>(
  '/api/weekly/complete-chapter',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { chapterDay } = req.body;
      const weeklyCase = getCurrentWeeklyCase();

      if (!weeklyCase) {
        res.status(404).json({
          status: 'error',
          message: 'No weekly case available',
        });
        return;
      }

      const chapter = weeklyCase.chapters.find((c) => c.dayNumber === chapterDay);
      if (!chapter) {
        res.status(404).json({
          status: 'error',
          message: 'Chapter not found',
        });
        return;
      }

      // Verify chapter is unlocked
      const unlockedChapters = getUnlockedChapters();
      if (!unlockedChapters.includes(chapterDay)) {
        res.status(403).json({
          status: 'error',
          message: 'Chapter not yet unlocked',
        });
        return;
      }

      const progress = await getWeeklyProgress(postId, weeklyCase.id);

      // Check if already completed
      if (progress.chaptersCompleted.includes(chapterDay)) {
        res.status(400).json({
          status: 'error',
          message: 'Chapter already completed',
        });
        return;
      }

      // Verify previous chapters are completed
      const previousChaptersComplete = weeklyCase.chapters
        .filter((c) => c.dayNumber < chapterDay)
        .every((c) => progress.chaptersCompleted.includes(c.dayNumber));

      if (!previousChaptersComplete) {
        res.status(403).json({
          status: 'error',
          message: 'Must complete previous chapters first',
        });
        return;
      }

      // Check if playing on time (same day as unlock)
      const { dayOfWeek } = getCurrentWeekInfo();
      const isOnTime = dayOfWeek === chapterDay;

      // Update consecutive days
      const today = getTodayDateString();
      if (progress.lastPlayedDate) {
        if (areConsecutiveDays(progress.lastPlayedDate, today)) {
          progress.consecutiveDaysPlayed += 1;
        } else if (progress.lastPlayedDate !== today) {
          progress.consecutiveDaysPlayed = 1;
        }
      } else {
        progress.consecutiveDaysPlayed = 1;
      }
      progress.lastPlayedDate = today;

      // Calculate points
      const { basePoints, streakBonus, onTimeBonus } = calculateChapterPoints(
        progress.consecutiveDaysPlayed,
        isOnTime
      );
      const totalPointsEarned = basePoints + streakBonus + onTimeBonus;

      // Mark chapter complete
      progress.chaptersCompleted.push(chapterDay);
      progress.currentChapter = Math.min(chapterDay + 1, 7);
      progress.dailyBonusEarned[chapterDay] = isOnTime;

      // Add revealed suspects from this chapter
      if (chapter.suspectsRevealed) {
        for (const suspectId of chapter.suspectsRevealed) {
          if (!progress.suspectsRevealed.includes(suspectId)) {
            progress.suspectsRevealed.push(suspectId);
          }
        }
      }

      await saveWeeklyProgress(postId, progress);

      // Award points to detective profile
      const profile = await getDetectiveProfile();
      profile.points += totalPointsEarned;
      await saveDetectiveProfile(profile);

      // Track stats
      await redis.incrBy(`weekly-stats:${postId}:chapter:${chapterDay}:completed`, 1);

      // Check if next chapter is unlocked
      const nextChapterUnlocked = unlockedChapters.includes(chapterDay + 1);

      res.json({
        type: 'complete_chapter',
        postId,
        progress,
        pointsEarned: totalPointsEarned,
        streakBonus,
        onTimeBonus,
        nextChapterUnlocked,
      });
    } catch (error) {
      console.error(`API Weekly Complete Chapter Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to complete chapter',
      });
    }
  }
);

// Find a clue in weekly mode
router.post<object, WeeklyFindClueResponse | { status: string; message: string }, { clueId: string; chapterDay: number }>(
  '/api/weekly/find-clue',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { clueId, chapterDay } = req.body;
      const weeklyCase = getCurrentWeeklyCase();

      if (!weeklyCase) {
        res.status(404).json({
          status: 'error',
          message: 'No weekly case available',
        });
        return;
      }

      const clue = weeklyCase.allClues.find((c) => c.id === clueId);
      if (!clue) {
        res.status(404).json({
          status: 'error',
          message: 'Clue not found',
        });
        return;
      }

      const progress = await getWeeklyProgress(postId, weeklyCase.id);

      // Initialize chapter clues array if needed
      if (!progress.cluesFoundByChapter[chapterDay]) {
        progress.cluesFoundByChapter[chapterDay] = [];
      }

      // Add clue if not already found
      if (!progress.cluesFoundByChapter[chapterDay].includes(clueId)) {
        progress.cluesFoundByChapter[chapterDay].push(clueId);
        await saveWeeklyProgress(postId, progress);
      }

      res.json({
        type: 'weekly_find_clue',
        postId,
        clue: { ...clue, found: true },
        progress,
        chapterDay,
      });
    } catch (error) {
      console.error(`API Weekly Find Clue Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to find clue',
      });
    }
  }
);

// Weekly accusation (only on Day 7)
router.post<object, WeeklyAccuseResponse | { status: string; message: string }, AccuseRequest>(
  '/api/weekly/accuse',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const { dayOfWeek } = getCurrentWeekInfo();

      // Verify it's Sunday (Day 7)
      if (dayOfWeek !== 7) {
        res.status(403).json({
          status: 'error',
          message: 'Accusations are only allowed on Sunday',
        });
        return;
      }

      const { suspectId } = req.body;
      const weeklyCase = getCurrentWeeklyCase();

      if (!weeklyCase) {
        res.status(404).json({
          status: 'error',
          message: 'No weekly case available',
        });
        return;
      }

      const suspect = weeklyCase.suspects.find((s) => s.id === suspectId);
      if (!suspect) {
        res.status(404).json({
          status: 'error',
          message: 'Suspect not found',
        });
        return;
      }

      const progress = await getWeeklyProgress(postId, weeklyCase.id);

      // Check if already made accusation
      if (progress.solved) {
        res.status(400).json({
          status: 'error',
          message: 'You have already made an accusation this week',
        });
        return;
      }

      // Update progress
      progress.accusedSuspect = suspectId;
      progress.solved = true;
      progress.correct = suspect.id === weeklyCase.guiltySubjectId;

      await saveWeeklyProgress(postId, progress);

      // Calculate points
      let pointsEarned = 0;
      let weeklyBonus = 0;
      let chaptersPlayedBonus = 0;

      if (progress.correct) {
        pointsEarned = WEEKLY_POINTS.CORRECT_ACCUSATION;

        // Full week bonus (completed all 7 chapters)
        if (progress.chaptersCompleted.length === 7) {
          weeklyBonus = WEEKLY_POINTS.FULL_WEEK_BONUS;
        }

        // Chapters played bonus (partial participation)
        chaptersPlayedBonus = progress.chaptersCompleted.length * 5;

        // All clues bonus
        const totalCluesFound = Object.values(progress.cluesFoundByChapter).flat().length;
        if (totalCluesFound >= weeklyCase.allClues.length) {
          pointsEarned += WEEKLY_POINTS.ALL_CLUES_BONUS;
        }
      }

      const totalPoints = pointsEarned + weeklyBonus + chaptersPlayedBonus;

      // Update detective profile
      const profile = await getDetectiveProfile();
      profile.points += totalPoints;

      if (progress.correct && !profile.solvedCases.includes(weeklyCase.id)) {
        profile.solvedCases.push(weeklyCase.id);
      }

      // Check achievements
      let newAchievements: AchievementId[] = [];
      if (progress.correct) {
        // Convert WeeklyCase to Case-like structure for achievement checking
        const caseForAchievements: Case = {
          id: weeklyCase.id,
          title: weeklyCase.title,
          dayNumber: 7,
          intro: weeklyCase.overallIntro,
          victimName: weeklyCase.victimName,
          victimDescription: weeklyCase.victimDescription,
          location: weeklyCase.location,
          crimeSceneObjects: [],
          suspects: weeklyCase.suspects,
          clues: weeklyCase.allClues,
        };

        const allCluesFound = Object.values(progress.cluesFoundByChapter).flat();
        newAchievements = await checkAndAwardAchievements(
          profile,
          caseForAchievements,
          postId,
          allCluesFound,
          true
        );
      }

      await saveDetectiveProfile(profile);

      // Track stats
      await redis.incrBy(`weekly-stats:${postId}:accusations:${suspectId}`, 1);
      await redis.incrBy(`weekly-stats:${postId}:total-accusations`, 1);
      if (progress.correct) {
        await redis.incrBy(`weekly-stats:${postId}:correct-accusations`, 1);
      }

      res.json({
        type: 'weekly_accuse',
        postId,
        correct: progress.correct,
        suspect,
        progress,
        pointsEarned,
        weeklyBonus,
        chaptersPlayedBonus,
        totalPoints: profile.points,
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
      });
    } catch (error) {
      console.error(`API Weekly Accuse Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to make accusation',
      });
    }
  }
);

// Get weekly progress
router.get<object, WeeklyProgressResponse | { status: string; message: string }>(
  '/api/weekly/progress',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    try {
      const weeklyCase = getCurrentWeeklyCase();

      if (!weeklyCase) {
        res.status(404).json({
          status: 'error',
          message: 'No weekly case available',
        });
        return;
      }

      const progress = await getWeeklyProgress(postId, weeklyCase.id);
      const chapterStatuses = buildChapterStatuses(weeklyCase, progress);

      res.json({
        type: 'weekly_progress',
        postId,
        progress,
        chapterStatuses,
      });
    } catch (error) {
      console.error(`API Weekly Progress Error:`, error);
      res.status(400).json({
        status: 'error',
        message: 'Failed to get weekly progress',
      });
    }
  }
);

// Internal endpoints
router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = process.env.WEBBIT_PORT || 3000;

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
