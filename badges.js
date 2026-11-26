/* Badges: worked out from the recorded matches, nothing is typed in by hand.
   Each category has "ladders". A ladder has many small steps, grouped into four levels: Easy, Medium, Hard and Impossible. */
(function (root) {
  const S = (n, name, tier) => ({ n, name, tier });
  const CATEGORIES = [
    {
      id: 'showing', name: 'Showing up',
      ladders: [
        { id: 'games', name: 'Games played', unit: 'games', steps: [
          S(1, 'First Game', 'Easy'), S(3, 'Settling In', 'Easy'), S(5, 'Getting Going', 'Easy'), S(10, 'Double Digits', 'Easy'),
          S(15, 'Regular Face', 'Medium'), S(25, 'Quarter Century', 'Medium'), S(40, 'Forty Up', 'Medium'),
          S(60, 'Sixty Strong', 'Hard'), S(80, 'Eighty Club', 'Hard'), S(100, 'Century', 'Hard'),
          S(150, 'Old Faithful', 'Impossible'), S(200, 'Double Century', 'Impossible')] },
        { id: 'streak', name: 'Match days in a row', unit: 'in a row', hint: 'Play every match day. Days with no match do not break your run.', steps: [
          S(2, 'Back to Back', 'Easy'), S(3, 'Hat-trick of Days', 'Easy'), S(5, 'High Five', 'Easy'),
          S(7, 'Lucky Seven', 'Medium'), S(10, 'Perfect Ten', 'Medium'), S(15, 'Fifteen Straight', 'Medium'),
          S(20, 'Twenty Straight', 'Hard'), S(30, 'Iron Month', 'Hard'), S(40, 'Unbreakable', 'Hard'),
          S(50, 'Fifty Straight', 'Impossible'), S(75, 'Relentless', 'Impossible')] },
        { id: 'perfect', name: 'Perfect weeks in a row', unit: 'weeks', hint: 'Play every match of the week. Only weeks with at least 3 matches count.', steps: [
          S(1, 'Full Week', 'Easy'), S(2, 'Two Full Weeks', 'Easy'),
          S(3, 'Three Full Weeks', 'Medium'), S(4, 'Full Month', 'Medium'),
          S(5, 'Five Full Weeks', 'Hard'), S(6, 'Six Full Weeks', 'Hard'),
          S(8, 'Two Full Months', 'Impossible')] },
        { id: 'comeback', name: 'Comebacks', unit: 'comebacks', hint: 'Play again after missing 15 or more matches in a row.', steps: [
          S(1, 'Welcome Back', 'Easy'), S(3, 'Boomerang', 'Medium'), S(5, 'Phoenix', 'Hard'), S(10, 'Never Say Die', 'Impossible')] },
        { id: 'loyalty', name: 'Months in a row', unit: 'months', hint: 'Play at least one match in every month that has matches.', steps: [
          S(2, 'Two Months Running', 'Easy'), S(3, 'Season Ticket', 'Easy'),
          S(6, 'Half Year', 'Medium'),
          S(9, 'Nine Months', 'Hard'), S(12, 'Full Year', 'Hard'),
          S(24, 'Two Years', 'Impossible')] },
        { id: 'cheese', name: 'Say cheese', unit: '', hint: 'Add a profile photo.', steps: [
          { n: 1, name: 'Say Cheese', tier: 'Easy', label: 'PIC' }] }
      ]
    },
    {
      id: 'pitch', name: 'On the pitch',
      ladders: [
        { id: 'wins', name: 'Wins', unit: 'wins', steps: [
          S(1, 'First Win', 'Easy'), S(3, 'Winning Ways', 'Easy'), S(5, 'High Five Wins', 'Easy'), S(10, 'Ten Wins', 'Easy'),
          S(15, 'Fifteen Wins', 'Medium'), S(25, 'Silver Wins', 'Medium'), S(40, 'Forty Wins', 'Medium'),
          S(60, 'Sixty Wins', 'Hard'), S(80, 'Eighty Wins', 'Hard'), S(100, 'Hundred Wins', 'Impossible')] },
        { id: 'winstreak', name: 'Winning streak', unit: 'in a row', hint: 'Win the matches you play, one after another. A draw or a loss ends the run.', steps: [
          S(2, 'Two in a Row', 'Easy'), S(3, 'Hat-trick of Wins', 'Easy'), S(4, 'Four in a Row', 'Easy'), S(5, 'Five in a Row', 'Easy'),
          S(7, 'Lucky Seven Wins', 'Medium'), S(10, 'Ten in a Row', 'Medium'), S(12, 'Dozen Wins', 'Medium'),
          S(15, 'Fifteen in a Row', 'Hard'), S(20, 'Twenty in a Row', 'Hard'), S(25, 'Quarter Hundred', 'Hard'),
          S(30, 'Invincible', 'Impossible')] },
        { id: 'bigwin', name: 'Big wins', unit: 'goals', hint: 'Win a match by a big margin.', steps: [
          S(7, 'Big Win', 'Easy'), S(9, 'Thumping', 'Medium'), S(11, 'Hammering', 'Hard'), S(13, 'Demolition', 'Hard'), S(15, 'Annihilation', 'Impossible')] },
        { id: 'scored', name: 'Scored in games', unit: 'games', steps: [
          S(1, 'First Goal', 'Easy'), S(3, 'On the Scoresheet', 'Easy'), S(5, 'Scoring Touch', 'Easy'),
          S(10, 'Double Digits Scorer', 'Medium'), S(15, 'Regular Scorer', 'Medium'), S(25, 'Goal Machine', 'Medium'),
          S(40, 'Sharp Shooter', 'Hard'), S(60, 'Golden Boot', 'Hard'), S(80, 'Goal Legend', 'Impossible')] },
        { id: 'scorestreak', name: 'Scoring streak', unit: 'in a row', hint: 'Score in the matches you play, one after another.', steps: [
          S(2, 'Two Straight', 'Easy'), S(3, 'Hat-trick of Games', 'Easy'), S(4, 'Four Straight', 'Easy'),
          S(5, 'On Fire', 'Medium'), S(7, 'Seven Straight', 'Medium'), S(10, 'Ten Straight', 'Medium'),
          S(15, 'Fifteen Straight', 'Hard'), S(20, 'Twenty Straight', 'Hard'), S(25, 'Scoring Machine', 'Hard'),
          S(30, 'Relentless Scorer', 'Impossible'), S(40, 'Unstoppable', 'Impossible')] },
        { id: 'gk', name: 'Goalkeeper games', unit: 'games', hint: 'Play in goal.', steps: [
          S(1, 'First Gloves', 'Easy'), S(3, 'Safe Hands', 'Easy'), S(5, 'Between the Posts', 'Easy'), S(10, 'Last Line', 'Easy'),
          S(15, 'Wall', 'Medium'), S(25, 'Keeper Pro', 'Medium'), S(35, 'Reliable Keeper', 'Medium'),
          S(50, 'Iron Gloves', 'Hard'), S(65, 'Safe Pair of Hands', 'Hard'), S(80, 'Goal Guardian', 'Hard'),
          S(100, 'Legendary Keeper', 'Impossible')] },
        { id: 'gkwins', name: 'Wins in goal', unit: 'wins', hint: 'Win a match while playing in goal.', steps: [
          S(1, 'Winning Keeper', 'Easy'), S(3, 'Three Keeper Wins', 'Easy'), S(5, 'Five Keeper Wins', 'Easy'),
          S(10, 'Ten Keeper Wins', 'Medium'), S(15, 'Fifteen Keeper Wins', 'Medium'),
          S(25, 'Match Winner', 'Hard'), S(40, 'Keeper Legend', 'Impossible')] },
        { id: 'bounce', name: 'Back from a loss', unit: 'bounce-backs', hint: 'Win the very next match you play after a loss.', steps: [
          S(1, 'Bounce Back', 'Easy'), S(3, 'Fight Back', 'Easy'), S(5, 'Resilient', 'Easy'),
          S(10, 'Comeback Kid', 'Medium'), S(15, 'Never Down', 'Medium'),
          S(25, 'Rebound Master', 'Hard'), S(40, 'Unbreakable Spirit', 'Impossible')] },
        { id: 'close', name: 'Close calls', unit: 'close wins', hint: 'Win a match by exactly 1 goal.', steps: [
          S(1, 'Photo Finish', 'Easy'), S(3, 'Nail Biter', 'Easy'), S(5, 'Edge of the Seat', 'Easy'),
          S(10, 'Nerves of Steel', 'Medium'), S(15, 'Clutch', 'Medium'),
          S(25, 'Ice Cold', 'Hard'), S(40, 'Master of Margins', 'Impossible')] },
        { id: 'duo', name: 'Dynamic duo', unit: 'wins together', hint: 'Win matches playing on the same team as the same teammate.', steps: [
          S(3, 'Good Pair', 'Easy'), S(5, 'Partners', 'Easy'), S(8, 'Double Act', 'Easy'),
          S(12, 'Dream Team', 'Medium'), S(18, 'Inseparable', 'Medium'),
          S(25, 'Dynamic Duo', 'Hard'), S(40, 'Legendary Pair', 'Impossible')] },
        { id: 'allround', name: 'All-rounder', unit: '', hint: 'Play in goal and score in a match.', steps: [
          { n: 1, name: 'All-Rounder', tier: 'Hard', label: 'ALL' }] }
      ]
    }
  ];

  const weekStart = iso => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const PERFECT_MIN_MATCHES = 3, COMEBACK_GAP = 15;

  function longestRun(flags) {            // best run of true, and the run that is still going at the end
    let best = 0, cur = 0;
    flags.forEach(f => { cur = f ? cur + 1 : 0; if (cur > best) best = cur; });
    return { best, current: cur };
  }

  // value of each ladder for one player
  function values(db, pid, now) {
    const matches = db.matches.slice().sort((a, b) => a.played_on.localeCompare(b.played_on) || a.id - b.id);
    const played = new Set(db.lineups.filter(l => l.player_id === pid).map(l => l.match_id));
    const games = matches.filter(m => played.has(m.id)).length;
    const streak = longestRun(matches.map(m => played.has(m.id)));
    const thisWeek = weekStart(now), weeks = {};
    matches.forEach(m => { const w = weekStart(m.played_on); if (w >= thisWeek) return; (weeks[w] = weeks[w] || []).push(m); });   // finished weeks only
    const flags = Object.keys(weeks).sort().filter(w => weeks[w].length >= PERFECT_MIN_MATCHES).map(w => weeks[w].every(m => played.has(m.id)));
    const perfect = longestRun(flags);
    let seen = false, missed = 0, comebacks = 0;      // comeback: back after a long gap
    matches.forEach(m => { if (played.has(m.id)) { if (seen && missed >= COMEBACK_GAP) comebacks++; seen = true; missed = 0; } else if (seen) missed++; });
    const thisMonth = now.slice(0, 7), months = {};     // loyalty: months in a row, counting only months that have matches
    matches.forEach(m => { const k = m.played_on.slice(0, 7); months[k] = months[k] || played.has(m.id); if (played.has(m.id)) months[k] = true; });
    const mflags = Object.keys(months).sort().filter(k => !(k >= thisMonth && !months[k])).map(k => months[k]);
    // play-related: results seen from this player's side
    const seq = matches.filter(m => played.has(m.id)).map(m => {
      const l = db.lineups.find(x => x.match_id === m.id && x.player_id === pid), sa = +m.score_a || 0, sb = +m.score_b || 0;
      const r = sa === sb ? 'D' : ((sa > sb) === (l.team === 'A') ? 'W' : 'L');
      return { r, margin: Math.max(sa, sb), scored: +l.goals > 0, gk: !!l.gk };
    });
    const mates = {};
    matches.filter(m => played.has(m.id)).forEach((m, i) => {
      if (seq[i].r !== 'W') return;
      const me = db.lineups.find(x => x.match_id === m.id && x.player_id === pid);
      db.lineups.filter(x => x.match_id === m.id && x.team === me.team && x.player_id !== pid).forEach(x => { mates[x.player_id] = (mates[x.player_id] || 0) + 1; });
    });
    let duoBest = 0, duoWho = null; Object.keys(mates).forEach(k => { if (mates[k] > duoBest) { duoBest = mates[k]; duoWho = +k; } });
    const cnt = f => { const n = seq.filter(f).length; return { best: n, current: n }; };
    let bounce = 0; seq.forEach((x, i) => { if (i && seq[i - 1].r === 'L' && x.r === 'W') bounce++; });
    const play = {
      wins: cnt(x => x.r === 'W'), winstreak: longestRun(seq.map(x => x.r === 'W')), bigwin: (() => { const b = Math.max(0, ...seq.filter(x => x.r === 'W').map(x => x.margin)); return { best: b, current: b }; })(),
      scored: cnt(x => x.scored), scorestreak: longestRun(seq.map(x => x.scored)), gk: cnt(x => x.gk), gkwins: cnt(x => x.gk && x.r === 'W'),
      close: cnt(x => x.r === 'W' && x.margin === 1), duo: { best: duoBest, current: duoBest, partner: duoWho },
      allround: { best: seq.some(x => x.gk) && seq.some(x => x.scored) ? 1 : 0, current: 0 },
      cheese: { best: (db.players.find(p => p.id === pid) || {}).photo ? 1 : 0, current: 0 }, bounce: { best: bounce, current: bounce }
    };
    return Object.assign({ games: { best: games, current: games }, streak, perfect, comeback: { best: comebacks, current: comebacks }, loyalty: longestRun(mflags) }, play);
  }

  function compute(db, pid, now) {
    const v = values(db, pid, now);
    let total = 0;
    const categories = CATEGORIES.map(c => ({
      id: c.id, name: c.name,
      ladders: c.ladders.map(l => {
        const val = v[l.id], seen = {}, steps = l.steps.map(s => { seen[s.tier] = (seen[s.tier] || 0) + 1; return Object.assign({ earned: val.best >= s.n, pips: seen[s.tier] }, s); });
        const earned = steps.filter(s => s.earned), next = steps.find(s => !s.earned) || null;
        total += earned.length;
        return { id: l.id, name: l.name, unit: l.unit, hint: l.hint || '', best: val.best, current: val.current, steps, earned, top: earned[earned.length - 1] || null, next, toGo: next ? next.n - val.best : 0, partner: val.partner || null };
      })
    }));
    return { categories, total };
  }

  // ----- badge artwork: one design per ladder (ball, flame, calendar), looking richer as you climb -----
  const PAL = {
    Easy:       { hi: '#F3C79A', mid: '#C27A35', lo: '#7A431A', face: '#FBE6CF', ink: '#6B3A15', plate: '#7A431A', txt: '#FFF3E4' },
    Medium:     { hi: '#FAFCFE', mid: '#B8C2D0', lo: '#6F7C8E', face: '#EEF2F7', ink: '#3E4A5C', plate: '#4A586B', txt: '#FFFFFF' },
    Hard:       { hi: '#FFF0B3', mid: '#F2B722', lo: '#A8710B', face: '#FFF4CC', ink: '#7A5006', plate: '#A8710B', txt: '#FFFBEA' },
    Impossible: { hi: '#FFE9A0', mid: '#F5C84B', lo: '#8A6410', face: '#14233A', ink: '#F5C84B', plate: '#F5C84B', txt: '#0E1B2C' },
    locked:     { hi: '#E9EDF3', mid: '#D3DAE5', lo: '#B9C3D2', face: '#F1F4F8', ink: '#B2BCCB', plate: '#C9D1DE', txt: '#FFFFFF' }
  };
  const poly = (n, r, rot) => `<polygon points="${Array.from({ length: n }, (_, k) => { const a = (rot + 360 / n * k) * Math.PI / 180; return (40 + r * Math.sin(a)).toFixed(1) + ',' + (38 - r * Math.cos(a)).toFixed(1); }).join(' ')}"/>`;
  const star = (cx, cy, R, r) => Array.from({ length: 10 }, (_, k) => { const a = k * 36 * Math.PI / 180, q = k % 2 ? r : R; return (cx + q * Math.sin(a)).toFixed(1) + ',' + (cy - q * Math.cos(a)).toFixed(1); }).join(' ');
  const SHAPES = {   // outer shape and the same shape a little smaller for the face
    games:   { out: '<circle cx="40" cy="38" r="35"/>', face: '<circle cx="40" cy="38" r="28.5"/>' },
    streak:  { out: '<path d="M40 2 L73 13 V40 C73 61 57 75 40 83 C23 75 7 61 7 40 V13 Z"/>', face: '<path d="M40 8 L67 17 V40 C67 57 54 68 40 75 C26 68 13 57 13 40 V17 Z"/>' },
    wins:       { out: poly(8, 35, 22.5), face: poly(8, 28.5, 22.5) },
    winstreak:  { out: '<path d="M40 2 L73 13 V40 C73 61 57 75 40 83 C23 75 7 61 7 40 V13 Z"/>', face: '<path d="M40 8 L67 17 V40 C67 57 54 68 40 75 C26 68 13 57 13 40 V17 Z"/>' },
    bigwin:     { out: '<circle cx="40" cy="38" r="35"/>', face: '<circle cx="40" cy="38" r="28.5"/>' },
    scored:     { out: '<path d="M40 2 L72 20 V56 L40 74 L8 56 V20 Z"/>', face: '<path d="M40 9 L66 24 V52 L40 67 L14 52 V24 Z"/>' },
    scorestreak:{ out: '<rect x="5" y="3" width="70" height="70" rx="22"/>', face: '<rect x="11" y="9" width="58" height="58" rx="17"/>' },
    gk:         { out: '<path d="M40 2 L73 13 V40 C73 61 57 75 40 83 C23 75 7 61 7 40 V13 Z"/>', face: '<path d="M40 8 L67 17 V40 C67 57 54 68 40 75 C26 68 13 57 13 40 V17 Z"/>' },
    gkwins:     { out: poly(8, 35, 22.5), face: poly(8, 28.5, 22.5) },
    bounce:     { out: '<path d="M40 2 L78 38 L40 74 L2 38 Z"/>', face: '<path d="M40 9 L70 38 L40 67 L10 38 Z"/>' },
    close:      { out: poly(5, 37, 0), face: poly(5, 30.5, 0) },
    duo:        { out: poly(6, 36, 30), face: poly(6, 29.5, 30) },
    allround:   { out: poly(14, 36, 0), face: poly(14, 30, 0) },
    cheese:     { out: '<circle cx="40" cy="38" r="35"/>', face: '<circle cx="40" cy="38" r="28.5"/>' },
    comeback: { out: '<path d="M40 2 L78 38 L40 74 L2 38 Z"/>', face: '<path d="M40 9 L70 38 L40 67 L10 38 Z"/>' },
    loyalty: { out: '<rect x="5" y="3" width="70" height="70" rx="22"/>', face: '<rect x="11" y="9" width="58" height="58" rx="17"/>' },
    perfect: { out: '<path d="M40 2 L72 20 V56 L40 74 L8 56 V20 Z"/>', face: '<path d="M40 9 L66 24 V52 L40 67 L14 52 V24 Z"/>' }
  };
  const MOTIF = {
    games: c => {
      const rim = [0, 1, 2, 3, 4].map(k => { const a = (36 + 72 * k) * Math.PI / 180, cx = 40 + 17.5 * Math.sin(a), cy = 36 - 17.5 * Math.cos(a);
        return `<polygon points="${[0, 1, 2, 3, 4].map(m => { const t = (36 + 72 * k + 72 * m) * Math.PI / 180; return (cx + 6.5 * Math.sin(t)).toFixed(1) + "," + (cy - 6.5 * Math.cos(t)).toFixed(1); }).join(' ')}" fill="${c.ink}"/>`; }).join('');
      return `<defs><clipPath id="bc${uid}"><circle cx="40" cy="36" r="14.5"/></clipPath></defs>
      <circle cx="40" cy="36" r="14.5" fill="${c.face}"/>
      <g clip-path="url(#bc${uid})">${rim}</g>
      <polygon points="40,29.8 45.9,34.1 43.7,41 36.3,41 34.1,34.1" fill="${c.ink}"/>
      <path d="M40 29.8V22M45.9 34.1L53 31.4M43.7 41L48.3 47.5M36.3 41L31.7 47.5M34.1 34.1L27 31.4" stroke="${c.ink}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <circle cx="40" cy="36" r="14.5" fill="none" stroke="${c.ink}" stroke-width="2.2"/>`;
    },
    streak: c => `<path d="M40 17C44 24 51 28 51 38C51 47 46 54 40 54C34 54 29 47 29 38C29 32 32 28 35 24C36 28 38 29 39.5 29.5C39 25 38 21 40 17Z" fill="${c.ink}"/>
      <path d="M40 37C42.5 40.5 46 42.5 46 47C46 50.5 43.5 52.5 40 52.5C36.5 52.5 34 50.5 34 47C34 43 37.5 41.5 40 37Z" fill="${c.face}"/>`,
    wins: c => `<path d="M30 24h20v8c0 6-4.5 10-10 10s-10-4-10-10z" fill="${c.ink}"/><path d="M30 26h-5c0 6 3 9 7 9M50 26h5c0 6-3 9-7 9" stroke="${c.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="38" y="42" width="4" height="5" fill="${c.ink}"/><rect x="33" y="47" width="14" height="3.2" rx="1.6" fill="${c.ink}"/>`,
    winstreak: c => `<path d="M45 16L30 38h9.5l-3.5 16L51 30h-9.5z" fill="${c.ink}"/>`,
    bigwin: c => `<polygon points="${star(40, 36, 17, 7.5)}" fill="${c.ink}" stroke="${c.ink}" stroke-width="1.5" stroke-linejoin="round"/>`,
    scored: c => `<path d="M28 49V27h24v22" stroke="${c.ink}" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M34 27v22M40 27v22M46 27v22M28 34h24M28 41.5h24" stroke="${c.ink}" stroke-width="1.3"/>`,
    scorestreak: c => `<circle cx="40" cy="36" r="15" fill="none" stroke="${c.ink}" stroke-width="2.6"/><circle cx="40" cy="36" r="8.5" fill="none" stroke="${c.ink}" stroke-width="2.6"/><circle cx="40" cy="36" r="3.4" fill="${c.ink}"/>`,
    gk: c => `<text x="40" y="43" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="19" fill="${c.ink}">GK</text>`,
    gkwins: c => `<text x="40" y="36" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="14" fill="${c.ink}">GK</text><path d="M31 44.5l5 4 9-9" stroke="${c.ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(4 2)"/>`,
    bounce: c => `<path d="M26 47L34 33L41 41L53 23" stroke="${c.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M45 22.5H54.5V32" stroke="${c.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    close: c => `<circle cx="40" cy="40" r="12.5" fill="none" stroke="${c.ink}" stroke-width="3"/><rect x="36.5" y="21" width="7" height="4" rx="1" fill="${c.ink}"/><path d="M40 40V32" stroke="${c.ink}" stroke-width="3" stroke-linecap="round"/><path d="M40 40L46 44" stroke="${c.ink}" stroke-width="2.4" stroke-linecap="round"/>`,
    duo: c => `<circle cx="33" cy="27" r="5.2" fill="${c.ink}"/><circle cx="47" cy="27" r="5.2" fill="${c.ink}"/><path d="M23 46a10 10 0 0 1 20 0z" fill="${c.ink}"/><path d="M37 46a10 10 0 0 1 20 0z" fill="${c.ink}" opacity=".78"/>`,
    allround: c => `<path d="M26 31H53M47 25l6 6-6 6M54 43H27M33 37l-6 6 6 6" stroke="${c.ink}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    cheese: c => `<path d="M26 31h6l2-4h12l2 4h6a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H26a2 2 0 0 1-2-2V33a2 2 0 0 1 2-2z" fill="${c.ink}"/><circle cx="40" cy="40" r="6.5" fill="${c.face}"/><circle cx="40" cy="40" r="3.2" fill="${c.ink}"/>`,
    comeback: c => `<path d="M52 38A12 12 0 1 1 44 26.7" stroke="${c.ink}" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M40 19L49 27L38 31Z" fill="${c.ink}"/>`,
    loyalty: c => `<path d="M40 52C27 43 25 35 25 31.5C25 26.5 29 23.5 33 23.5C36 23.5 38.5 25 40 28C41.5 25 44 23.5 47 23.5C51 23.5 55 26.5 55 31.5C55 35 53 43 40 52Z" fill="${c.ink}"/>`,
    perfect: c => `<rect x="27" y="22" width="26" height="25" rx="4" fill="${c.face}" stroke="${c.ink}" stroke-width="2.2"/>
      <rect x="27" y="22" width="26" height="7.5" rx="3" fill="${c.ink}"/>
      <path d="M34 19.5V24M46 19.5V24" stroke="${c.ink}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M33.5 38.5L38.3 43L46.5 33.8" stroke="${c.ink}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
  };
  let uid = 0;
  const RANK = { Easy: 0, Medium: 1, Hard: 2, Impossible: 3 };
  // laurel branch: n leaves down each side of the badge
  function laurel(n, c) {
    let o = '';
    for (let i = 0; i < n; i++) for (const side of [-1, 1]) {
      const a = (112 + i * 17) * Math.PI / 180, r = 41.5, x = 40 + side * r * Math.sin(a), y = 38 - r * Math.cos(a);
      const rot = side * (180 - (112 + i * 17)) * -1 + (side < 0 ? 0 : 0);
      o += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.3" ry="5" transform="rotate(${(side * (112 + i * 17 - 180) * -1 + 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" />`;
    }
    return `<g class="bleaf" fill="${c.mid}" stroke="${c.lo}" stroke-width=".6">${o}</g>`;
  }
  function svg(ladderId, step, opts) {
    opts = opts || {};
    const earned = !!opts.earned, c = PAL[earned ? step.tier : 'locked'], sh = SHAPES[ladderId], id = 'bg' + (++uid);
    const pips = Math.max(1, opts.pips || 1), rank = RANK[step.tier] || 0;
    const dots = Array.from({ length: pips }, (_, i) => `<circle cx="${40 + (i - (pips - 1) / 2) * 8}" cy="88" r="2.6" fill="${earned ? c.mid : '#CBD3DF'}"/>`).join('');
    const rays = earned && rank === 3 ? `<g class="bfx bspin" stroke="${c.mid}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round">${Array.from({ length: 12 }, (_, k) => { const a = k * 30 * Math.PI / 180; return `<path d="M${(40 + 41 * Math.sin(a)).toFixed(1)} ${(38 - 41 * Math.cos(a)).toFixed(1)}L${(40 + 49 * Math.sin(a)).toFixed(1)} ${(38 - 49 * Math.cos(a)).toFixed(1)}"/>`; }).join('')}</g>` : '';
    const leaves = earned && rank >= 1 ? laurel(rank === 1 ? 3 : 5, c) : '';
    const crown = earned && rank === 3 ? `<path d="M30 4L32 -6L36.5 -1L40 -8L43.5 -1L48 -6L50 4Z" fill="${c.mid}" stroke="${c.lo}" stroke-width="1" stroke-linejoin="round"/><circle cx="40" cy="-8" r="1.6" fill="${c.hi}"/>` : '';
    const sparks = earned && rank === 3 ? [[8, 8], [72, 14], [66, 70], [12, 64]].map(([x, y], k) => `<path class="bfx btw" style="animation-delay:${k * .7}s" d="M${x} ${y - 3.5}L${x + 1} ${y - 1}L${x + 3.5} ${y}L${x + 1} ${y + 1}L${x} ${y + 3.5}L${x - 1} ${y + 1}L${x - 3.5} ${y}L${x - 1} ${y - 1}Z" fill="${c.hi}"/>`).join('') : '';
    const shine = earned && rank >= 2 ? `<clipPath id="${id}c">${sh.out}</clipPath><g clip-path="url(#${id}c)"><rect class="bfx bshine" x="-30" y="-10" width="16" height="110" fill="#fff" opacity=".55" transform="skewX(-20)"/></g>` : '';
    const n = String(step.label || step.n);
    return `<svg viewBox="0 0 80 92" width="100%" role="img" aria-label="${esc_(step.name)}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hi}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.lo}"/></linearGradient></defs>
      ${rays}${leaves}<g fill="url(#${id}r)">${sh.out}</g>
      <g fill="${c.face}" ${earned ? '' : 'opacity=".9"'}>${sh.face}</g>
      ${earned ? '' : '<g opacity=".75">'}${MOTIF[ladderId](c)}${earned ? '' : '</g>'}
      ${shine}${crown}${sparks}
      <rect x="22" y="59" width="36" height="16" rx="8" fill="${c.plate}"/>
      <text x="40" y="70.6" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${n.length > 2 ? 10.5 : 12}" fill="${c.txt}">${n}</text>
      ${dots}</svg>`;
  }
  const esc_ = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  root.Badges = { CATEGORIES, compute, svg };
  if (typeof module !== 'undefined') module.exports = root.Badges;
})(typeof window !== 'undefined' ? window : globalThis);
