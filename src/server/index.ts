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
} from '../shared/types/game';
import { redis, reddit, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { getCurrentCase } from '../shared/data/cases';

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
    return JSON.parse(data) as DetectiveProfile;
  }

  // Default profile
  return {
    odayNumber: 1,
    points: 0,
    solvedCases: [],
    username: context.username || 'Anonymous',
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

      // Post a comment on the game post (only for correct accusations, first time only)
      if (progress.correct && !alreadySolved) {
        const username = context.username || 'A detective';
        try {
          await reddit.submitComment({
            id: postId,
            text: `🔍 **${username}** solved the case and earned ${pointsEarned} points!`,
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
