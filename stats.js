// Pure stats logic (no DOM). Works in the browser and in Node for testing.
(function (root) {
  function inPeriod(dateStr, period, now) {
    if (period === 'all') return true;
    const d = new Date(dateStr + 'T00:00:00');
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return true;
  }

  // Result of a match from team's point of view: 'W' | 'D' | 'L'
  function resultFor(team, m) {
    if (m.score_a === m.score_b) return 'D';
    const aWon = m.score_a > m.score_b;
    return (team === 'A') === aWon ? 'W' : 'L';
  }

  // db = {players, matches, lineups}; returns array of per-player stats
  function computeStats(db, period, now) {
    now = now || new Date();
    const matches = db.matches
      .filter(m => inPeriod(m.played_on, period || 'all', now))
      .slice()
      .sort((a, b) => (a.played_on === b.played_on ? a.id - b.id : a.played_on < b.played_on ? -1 : 1));
    const byMatch = {};
    db.lineups.forEach(l => { (byMatch[l.match_id] = byMatch[l.match_id] || []).push(l); });

    const stats = {};
    db.players.forEach(p => {
      stats[p.id] = { id: p.id, name: p.name, p: 0, w: 0, d: 0, l: 0, goals: 0, assists: 0, results: [] };
    });
    matches.forEach(m => {
      (byMatch[m.id] || []).forEach(l => {
        const s = stats[l.player_id];
        if (!s) return;
        const r = resultFor(l.team, m);
        s.p++;
        s[r.toLowerCase()]++;
        s.goals += l.goals || 0;
        s.assists += l.assists || 0;
        s.results.push(r);
      });
    });
    return Object.values(stats).map(s => ({
      ...s,
      winPct: s.p ? (s.w / s.p) * 100 : 0,
      gpg: s.p ? s.goals / s.p : 0,
      pts: s.w * 3 + s.d,
      form: s.results.slice(-5).reverse() // most recent first
    }));
  }

  const api = { computeStats, resultFor, inPeriod };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Stats = api;
})(typeof window !== 'undefined' ? window : globalThis);
