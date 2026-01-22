import express from 'express';
import {
  InitGameResponse,
  FindClueRequest,
  FindClueResponse,
  AccuseRequest,
  AccuseResponse,
  PlayerProgress,
} from '../shared/types/game';
import { redis, createServer, context } from '@devvit/web/server';
import { createPost } from './core/post';
import { getCurrentCase } from '../shared/data/cases';

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

      if (progress.correct) {
        const statsKey = `stats:${postId}:solved`;
        await redis.incrBy(statsKey, 1);
      }

      res.json({
        type: 'accuse',
        postId,
        correct: suspect.isGuilty,
        suspect,
        progress,
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
