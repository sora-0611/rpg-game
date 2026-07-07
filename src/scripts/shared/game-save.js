(function () {
  'use strict';

  const SAVE_KEY = 'rpg-game-save';

  function createDefaultMapProgress() {
    return {
      1: { visited: false, bossDefeated: false, openedChestIds: [], visitedPositions: [] },
      2: { visited: false, bossDefeated: false, openedChestIds: [], visitedPositions: [] },
      3: { visited: false, bossDefeated: false, openedChestIds: [], visitedPositions: [] },
    };
  }

  function createDefaultSharedState() {
    return {
      version: '1.0.0',
      scene: 'MAP_SELECT',
      playTime: 0,
      isLoaded: false,
      player: {
        coin: 0,
        currentMapId: 1,
        pos: { x: 1, y: 1 },
      },
      party: [
        { characterId: 'A', name: 'キャラクターA', enhanceLevel: 1 },
        { characterId: 'B', name: 'キャラクターB', enhanceLevel: 1 },
        { characterId: 'C', name: 'キャラクターC', enhanceLevel: 1 },
      ],
      inventory: [],
      mapProgress: createDefaultMapProgress(),
      battle: {
        isActive: false,
        isBoss: false,
        currentEnemyId: null,
        enemies: [],
        turn: 0,
        isPlayerTurn: true,
        log: [],
        canEscape: true,
      },
      ui: {
        menuOpen: false,
        itemWindowOpen: false,
        dialogOpen: false,
        message: '',
      },
      flags: {
        seenTutorial: false,
        finalBossDefeated: false,
      },
      settings: {
        bgmVolume: 100,
        seVolume: 100,
        textSpeed: 'normal',
        performance: 'high',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  function sanitizeSharedState(state) {
    const baseState = createDefaultSharedState();
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return baseState;
    }

    const sanitizedState = {
      ...baseState,
      ...state,
      player: {
        ...baseState.player,
        ...(state.player || {}),
      },
      playerPosition: state.playerPosition || state.player?.pos || null,
      party: Array.isArray(state.party) ? state.party : baseState.party,
      inventory: Array.isArray(state.inventory) ? state.inventory : baseState.inventory,
      mapProgress: {
        ...baseState.mapProgress,
        ...(state.mapProgress || {}),
      },
      battle: {
        ...baseState.battle,
        ...(state.battle || {}),
      },
      ui: {
        ...baseState.ui,
        ...(state.ui || {}),
      },
      flags: {
        ...baseState.flags,
        ...(state.flags || {}),
      },
      settings: {
        ...baseState.settings,
        ...(state.settings || {}),
      },
      version: typeof state.version === 'string' ? state.version : baseState.version,
      scene: typeof state.scene === 'string' ? state.scene : baseState.scene,
      playTime: typeof state.playTime === 'number' ? state.playTime : baseState.playTime,
      isLoaded: Boolean(state.isLoaded),
      updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : new Date().toISOString(),
    };

    if (typeof sanitizedState.player.coin !== 'number' || sanitizedState.player.coin < 0) {
      sanitizedState.player.coin = baseState.player.coin;
    }

    if (!sanitizedState.player.pos || typeof sanitizedState.player.pos !== 'object') {
      sanitizedState.player.pos = { x: 1, y: 1 };
    }

    Object.keys(sanitizedState.mapProgress).forEach(mapId => {
      const progress = sanitizedState.mapProgress[mapId];
      if (!progress || typeof progress !== 'object') {
        sanitizedState.mapProgress[mapId] = baseState.mapProgress[mapId];
        return;
      }
      sanitizedState.mapProgress[mapId] = {
        ...baseState.mapProgress[mapId],
        ...progress,
        openedChestIds: Array.isArray(progress.openedChestIds) ? progress.openedChestIds : [],
        visitedPositions: Array.isArray(progress.visitedPositions) ? progress.visitedPositions : [],
      };
    });

    return sanitizedState;
  }

  function saveSharedGameState(state) {
    try {
      const sanitizedState = sanitizeSharedState(state);
      localStorage.setItem(SAVE_KEY, JSON.stringify(sanitizedState));
      return true;
    } catch (error) {
      console.error('セーブに失敗しました。', error);
      return false;
    }
  }

  function loadSharedGameState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return createDefaultSharedState();
      }
      const parsed = JSON.parse(raw);
      return sanitizeSharedState(parsed);
    } catch (error) {
      console.warn('セーブの読み込みに失敗しました。', error);
      return createDefaultSharedState();
    }
  }

  function hasSharedSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  function clearSharedSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  if (typeof window !== 'undefined') {
    window.GAME_SAVE = {
      SAVE_KEY,
      createDefaultSharedState,
      sanitizeSharedState,
      saveSharedGameState,
      loadSharedGameState,
      hasSharedSave,
      clearSharedSave,
    };
  }
})();
