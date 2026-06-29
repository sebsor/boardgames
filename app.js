// app.js — navigation, modal management, render orchestration

// ── Navigation ───────────────────────────────────────────

function navigateTo(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${viewName}`);
  const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (view) view.classList.add('active');
  if (btn) btn.classList.add('active');

  // Render the view
  const renderers = {
    home: renderHome,
    games: renderGames,
    log: renderLog,
    players: renderPlayers,
    tonight: renderTonight,
  };
  renderers[viewName]?.();

  // Scroll to top
  window.scrollTo(0, 0);
}

// Re-render the current active view
function renderCurrent() {
  const active = document.querySelector('.view.active');
  if (!active) return;
  const viewName = active.id.replace('view-', '');
  const renderers = {
    home: renderHome,
    games: renderGames,
    players: renderPlayers,
    tonight: renderTonight,
  };
  renderers[viewName]?.();
}

// Re-render everything relevant
function renderAll() {
  renderCurrent();
}

// ── Modals ───────────────────────────────────────────────

function openModal(modalId) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById(modalId).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  // Hide overlay only if no other modals are open
  const anyOpen = [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
  if (!anyOpen) {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Boot ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Wire up nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // Close modal on overlay click
  document.getElementById('modal-overlay').addEventListener('click', closeAllModals);

  // Initial render
  navigateTo('home');

  // Seed demo data if empty (remove before production)
  if (!db.getPlayers().length && !db.getGames().length) {
    seedDemoData();
  }
});

// ── Demo seed ────────────────────────────────────────────
// Gives you something to look at immediately. Delete this in production.

function seedDemoData() {
  const p1 = db.addPlayer({ name: 'Sebastian', avatar: '🧙', isAdmin: true });
  const p2 = db.addPlayer({ name: 'Emelie', avatar: '🧝', isAdmin: false });
  const p3 = db.addPlayer({ name: 'Johan', avatar: '🦊', isAdmin: false });

  const g1 = db.addGame({
    title: 'Spirit Island',
    bggId: '162886',
    thumbUrl: '',
    coverUrl: '',
    coverEmoji: '🌊',
    minPlayers: 1,
    maxPlayers: 4,
    complexity: 4.0,
    isCoop: true,
    expansions: [
      { id: 'exp1', title: 'Branch & Claw', owned: true },
      { id: 'exp2', title: 'Jagged Earth', owned: true },
    ],
  });

  const g2 = db.addGame({
    title: 'Root',
    bggId: '237182',
    thumbUrl: '',
    coverUrl: '',
    coverEmoji: '🦝',
    minPlayers: 2,
    maxPlayers: 4,
    complexity: 3.7,
    isCoop: false,
    expansions: [],
  });

  const g3 = db.addGame({
    title: 'Wingspan',
    bggId: '266192',
    thumbUrl: '',
    coverUrl: '',
    coverEmoji: '🦜',
    minPlayers: 1,
    maxPlayers: 5,
    complexity: 2.4,
    isCoop: false,
    expansions: [{ id: 'exp3', title: 'European Expansion', owned: false }],
  });

  // Seed some sessions
  const pastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  db.addSession({ gameId: g1.id, date: pastDate(2), durationMinutes: 150, isCoop: true, players: [p1.id, p2.id, p3.id], winners: [p1.id, p2.id, p3.id], notes: 'Beat invader deck on difficulty 4' });
  db.addSession({ gameId: g2.id, date: pastDate(7), durationMinutes: 90, isCoop: false, players: [p1.id, p2.id, p3.id], winners: [p2.id], notes: '' });
  db.addSession({ gameId: g3.id, date: pastDate(14), durationMinutes: 60, isCoop: false, players: [p1.id, p2.id], winners: [p1.id], notes: '' });
  db.addSession({ gameId: g2.id, date: pastDate(21), durationMinutes: 100, isCoop: false, players: [p1.id, p2.id, p3.id], winners: [p3.id], notes: '' });
  db.addSession({ gameId: g1.id, date: pastDate(30), durationMinutes: 180, isCoop: true, players: [p1.id, p2.id], winners: [], notes: 'Lost on the last round' });

  achievements.recalculate();
}
