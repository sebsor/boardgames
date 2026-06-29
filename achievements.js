// achievements.js — Derives achievements from session data
// Run after any session is added. Returns newly earned achievements.

const ACHIEVEMENT_DEFS = [
  {
    id: 'FIRST_BLOOD',
    title: 'First Blood',
    desc: 'Win your very first game',
    icon: '🏆',
    check: (playerId, sessions) =>
      sessions.filter(s => s.winners.includes(playerId)).length >= 1,
  },
  {
    id: 'VETERAN',
    title: 'Veteran',
    desc: 'Play the same game 10 times',
    icon: '🎖️',
    check: (playerId, sessions) => {
      const counts = {};
      sessions.filter(s => s.players.includes(playerId)).forEach(s => {
        counts[s.gameId] = (counts[s.gameId] || 0) + 1;
      });
      return Object.values(counts).some(c => c >= 10);
    },
  },
  {
    id: 'SOCIAL',
    title: 'Social Butterfly',
    desc: 'Play with 5 different players',
    icon: '🦋',
    check: (playerId, sessions) => {
      const others = new Set();
      sessions
        .filter(s => s.players.includes(playerId))
        .forEach(s => s.players.forEach(p => { if (p !== playerId) others.add(p); }));
      return others.size >= 5;
    },
  },
  {
    id: 'COLLECTOR',
    title: 'Collector',
    desc: 'Play 10 different games',
    icon: '📦',
    check: (playerId, sessions) => {
      const games = new Set(sessions.filter(s => s.players.includes(playerId)).map(s => s.gameId));
      return games.size >= 10;
    },
  },
  {
    id: 'UNLUCKY',
    title: 'Unlucky Streak',
    desc: 'Play 10 sessions without a win',
    icon: '😬',
    check: (playerId, sessions) => {
      const mine = sessions.filter(s => s.players.includes(playerId));
      if (mine.length < 10) return false;
      const wins = mine.filter(s => s.winners.includes(playerId)).length;
      return wins === 0;
    },
  },
  {
    id: 'DOMINATOR',
    title: 'Dominator',
    desc: 'Win 5 sessions in a row',
    icon: '👑',
    check: (playerId, sessions) => {
      const mine = [...sessions.filter(s => s.players.includes(playerId))]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      let streak = 0;
      for (const s of mine) {
        if (s.winners.includes(playerId)) { streak++; if (streak >= 5) return true; }
        else streak = 0;
      }
      return false;
    },
  },
  {
    id: 'COOP_CHAMP',
    title: 'Cooperative Champion',
    desc: 'Win 5 co-op sessions',
    icon: '🤝',
    check: (playerId, sessions) =>
      sessions.filter(s => s.isCoop && s.players.includes(playerId) && s.winners.includes(playerId)).length >= 5,
  },
  {
    id: 'MARATHON',
    title: 'Marathon',
    desc: 'Play a session lasting over 3 hours',
    icon: '⏱️',
    check: (playerId, sessions) =>
      sessions.some(s => s.players.includes(playerId) && s.durationMinutes >= 180),
  },
];

const achievements = {
  // Returns full list with earned status for a given player
  getForPlayer(playerId) {
    const sessions = db.getSessions();
    const earned = new Set(
      db.getAchievements()
        .filter(a => a.playerId === playerId)
        .map(a => a.type)
    );
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      earned: earned.has(def.id),
      earnedAt: db.getAchievements().find(a => a.playerId === playerId && a.type === def.id)?.earnedAt || null,
    }));
  },

  // Re-evaluate all achievements for all players, save newly earned ones
  recalculate() {
    const sessions = db.getSessions();
    const players = db.getPlayers();
    const existing = db.getAchievements();
    const newOnes = [];

    for (const player of players) {
      for (const def of ACHIEVEMENT_DEFS) {
        const alreadyEarned = existing.some(a => a.playerId === player.id && a.type === def.id);
        if (!alreadyEarned && def.check(player.id, sessions)) {
          newOnes.push({
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            playerId: player.id,
            type: def.id,
            earnedAt: new Date().toISOString(),
          });
        }
      }
    }

    if (newOnes.length) {
      db.saveAchievements([...existing, ...newOnes]);
    }
    return newOnes;
  },
};
