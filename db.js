// db.js — Data layer abstraction
// All data access goes through this module.
// When switching to Firebase, only this file changes.

const KEYS = {
  GAMES:    'tt_games',
  PLAYERS:  'tt_players',
  SESSIONS: 'tt_sessions',
  ACHIEVEMENTS: 'tt_achievements',
};

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch { return []; }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Games ────────────────────────────────────────────────

const db = {
  // Games
  getGames() { return load(KEYS.GAMES); },

  getGame(id) { return this.getGames().find(g => g.id === id) || null; },

  addGame(game) {
    const games = this.getGames();
    const newGame = { ...game, id: uuid(), addedAt: new Date().toISOString() };
    games.push(newGame);
    save(KEYS.GAMES, games);
    return newGame;
  },

  updateGame(id, changes) {
    const games = this.getGames().map(g => g.id === id ? { ...g, ...changes } : g);
    save(KEYS.GAMES, games);
  },

  deleteGame(id) {
    save(KEYS.GAMES, this.getGames().filter(g => g.id !== id));
    // Also remove sessions for this game
    save(KEYS.SESSIONS, this.getSessions().filter(s => s.gameId !== id));
  },

  // Players
  getPlayers() { return load(KEYS.PLAYERS); },

  getPlayer(id) { return this.getPlayers().find(p => p.id === id) || null; },

  addPlayer(player) {
    const players = this.getPlayers();
    const newPlayer = { ...player, id: uuid(), addedAt: new Date().toISOString() };
    players.push(newPlayer);
    save(KEYS.PLAYERS, players);
    return newPlayer;
  },

  updatePlayer(id, changes) {
    const players = this.getPlayers().map(p => p.id === id ? { ...p, ...changes } : p);
    save(KEYS.PLAYERS, players);
  },

  deletePlayer(id) {
    save(KEYS.PLAYERS, this.getPlayers().filter(p => p.id !== id));
  },

  // Sessions
  getSessions() { return load(KEYS.SESSIONS); },

  getSessionsForGame(gameId) {
    return this.getSessions().filter(s => s.gameId === gameId);
  },

  getSessionsForPlayer(playerId) {
    return this.getSessions().filter(s => s.players.includes(playerId));
  },

  addSession(session) {
    const sessions = this.getSessions();
    const newSession = { ...session, id: uuid(), loggedAt: new Date().toISOString() };
    sessions.push(newSession);
    save(KEYS.SESSIONS, sessions);
    return newSession;
  },

  deleteSession(id) {
    save(KEYS.SESSIONS, this.getSessions().filter(s => s.id !== id));
  },

  // Achievements
  getAchievements() { return load(KEYS.ACHIEVEMENTS); },

  saveAchievements(achievements) {
    save(KEYS.ACHIEVEMENTS, achievements);
  },

  // ── Derived stats ──────────────────────────────────────

  // Win rate for a player across all their sessions (or filtered by game)
  getWinRate(playerId, gameId = null) {
    let sessions = this.getSessionsForPlayer(playerId);
    if (gameId) sessions = sessions.filter(s => s.gameId === gameId);
    if (!sessions.length) return null;
    const wins = sessions.filter(s => s.winners.includes(playerId)).length;
    return { wins, plays: sessions.length, rate: Math.round((wins / sessions.length) * 100) };
  },

  // Game health: total plays + last played date
  getGameHealth(gameId) {
    const sessions = this.getSessionsForGame(gameId);
    if (!sessions.length) return { plays: 0, lastPlayed: null };
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { plays: sessions.length, lastPlayed: sorted[0].date };
  },

  // Recent sessions, newest first
  getRecentSessions(limit = 10) {
    return [...this.getSessions()]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },

  // Games filtered by player count and max complexity
  getGamesForTonight(playerCount, maxComplexity) {
    return this.getGames().filter(g => {
      const countOk = g.minPlayers <= playerCount && g.maxPlayers >= playerCount;
      const complexOk = maxComplexity === 'any' || g.complexity <= parseFloat(maxComplexity);
      return countOk && complexOk;
    });
  },
};
