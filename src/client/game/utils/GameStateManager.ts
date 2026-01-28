import { Case, PlayerProgress, InitGameResponse } from '../../../shared/types/game';

/**
 * Tracks dialogue state for a single suspect
 */
interface SuspectDialogueState {
  askedQuestionIds: string[];
  currentDialogueOptionIds: string[];
}

/**
 * Game state that persists across scene transitions
 */
interface GameState {
  currentCase: Case | null;
  progress: PlayerProgress | null;
  dialogueStates: Map<string, SuspectDialogueState>;
  currentSuspectIndex: number;
  lastLoadTime: number;
}

/**
 * Singleton manager for game state that persists across scene transitions.
 * Prevents data from being reloaded unnecessarily and maintains dialogue history.
 */
class GameStateManagerClass {
  private state: GameState = {
    currentCase: null,
    progress: null,
    dialogueStates: new Map(),
    currentSuspectIndex: 0,
    lastLoadTime: 0,
  };

  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.state.currentCase || !this.state.progress) {
      return false;
    }
    return Date.now() - this.state.lastLoadTime < this.CACHE_DURATION;
  }

  /**
   * Load game data from API or return cached data
   */
  async loadGameData(forceRefresh = false): Promise<{ currentCase: Case; progress: PlayerProgress }> {
    if (!forceRefresh && this.isCacheValid()) {
      return {
        currentCase: this.state.currentCase!,
        progress: this.state.progress!,
      };
    }

    try {
      const response = await fetch('/api/game/init');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = (await response.json()) as InitGameResponse;

      // Check if case changed (new day) - if so, reset dialogue states
      if (this.state.currentCase && this.state.currentCase.id !== data.currentCase.id) {
        this.state.dialogueStates.clear();
      }

      this.state.currentCase = data.currentCase;
      this.state.progress = data.progress;
      this.state.lastLoadTime = Date.now();

      return {
        currentCase: data.currentCase,
        progress: data.progress,
      };
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }

  /**
   * Get current case (returns null if not loaded)
   */
  getCurrentCase(): Case | null {
    return this.state.currentCase;
  }

  /**
   * Get player progress (returns null if not loaded)
   */
  getProgress(): PlayerProgress | null {
    return this.state.progress;
  }

  /**
   * Update progress (e.g., after finding a clue)
   */
  updateProgress(progress: PlayerProgress): void {
    this.state.progress = progress;
  }

  /**
   * Get dialogue state for a specific suspect
   */
  getSuspectDialogueState(suspectId: string): SuspectDialogueState {
    if (!this.state.dialogueStates.has(suspectId)) {
      this.state.dialogueStates.set(suspectId, {
        askedQuestionIds: [],
        currentDialogueOptionIds: [],
      });
    }
    return this.state.dialogueStates.get(suspectId)!;
  }

  /**
   * Record that a question was asked to a suspect
   */
  recordAskedQuestion(suspectId: string, questionId: string): void {
    const state = this.getSuspectDialogueState(suspectId);
    if (!state.askedQuestionIds.includes(questionId)) {
      state.askedQuestionIds.push(questionId);
    }
  }

  /**
   * Set the current available dialogue options for a suspect
   */
  setCurrentDialogueOptions(suspectId: string, optionIds: string[]): void {
    const state = this.getSuspectDialogueState(suspectId);
    state.currentDialogueOptionIds = optionIds;
  }

  /**
   * Get the current available dialogue options for a suspect
   */
  getCurrentDialogueOptions(suspectId: string): string[] {
    const state = this.getSuspectDialogueState(suspectId);
    return state.currentDialogueOptionIds;
  }

  /**
   * Check if a question has been asked to a suspect
   */
  hasAskedQuestion(suspectId: string, questionId: string): boolean {
    const state = this.getSuspectDialogueState(suspectId);
    return state.askedQuestionIds.includes(questionId);
  }

  /**
   * Get all asked questions for a suspect
   */
  getAskedQuestions(suspectId: string): string[] {
    const state = this.getSuspectDialogueState(suspectId);
    return [...state.askedQuestionIds];
  }

  /**
   * Reset dialogue state for all suspects (e.g., when starting a new game)
   */
  resetDialogueStates(): void {
    this.state.dialogueStates.clear();
  }

  /**
   * Reset all state (for new game or logout)
   */
  resetAll(): void {
    this.state = {
      currentCase: null,
      progress: null,
      dialogueStates: new Map(),
      currentSuspectIndex: 0,
      lastLoadTime: 0,
    };
  }

  /**
   * Force refresh on next load
   */
  invalidateCache(): void {
    this.state.lastLoadTime = 0;
  }

  /**
   * Get the current suspect index
   */
  getCurrentSuspectIndex(): number {
    return this.state.currentSuspectIndex;
  }

  /**
   * Set the current suspect index
   */
  setCurrentSuspectIndex(index: number): void {
    this.state.currentSuspectIndex = index;
  }
}

// Export singleton instance
export const GameStateManager = new GameStateManagerClass();
