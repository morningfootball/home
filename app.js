(function () {
  const CFG = window.CONFIG || {};
  const LIVE = !!CFG.SCRIPT_URL;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fmtDate = d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const initials = n => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hue = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  function photoUrl(p) {
    const v = p && p.photo; if (!v) return '';
    if (/^(data:|https?:)/.test(v)) return v;
    return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(v) + '&sz=w400';
  }
  function avatar(p, size) {
    const u = photoUrl(p), st = `--s:${size || 36}px;--h:${hue(p.name)}`;
    return u ? `<img class="av" style="${st}" src="${esc(u)}" alt="${esc(p.name)}" loading="lazy">`
             : `<span class="av" style="${st}">${esc(initials(p.name))}</span>`;
  }
  function resizeImage(file, size) {
    size = size || 400;
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const m = Math.min(img.width, img.height), c = document.createElement('canvas');
        c.width = c.height = size;
        c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => rej(new Error('Could not read that image'));
      img.src = url;
    });
  }
  const isoShift = n => new Date(Date.now() - new Date().getTimezoneOffset() * 60000 - n * 86400000).toISOString().slice(0, 10);
  const missingDays = (count, from) => { const out = []; for (let i = from; i < from + count; i++) { const d = isoShift(i); if (!db.matches.concat(pendingM).some(m => m.played_on === d)) out.push(d); } return out; };
  function driveImg(id, sz) { return /^(data:|https?:)/.test(id) ? id : 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + sz; }
  const mediaThumb = it => it.type === 'photo' ? driveImg(it.file, 600)
    : it.file.startsWith('youtube:') ? 'https://img.youtube.com/vi/' + it.file.slice(8) + '/hqdefault.jpg'
    : it.file.startsWith('drive:') ? driveImg(it.file.slice(6), 600) : '';
  const mediaFull = it => driveImg(it.file, 1600);
  const videoEmbed = it => it.file.startsWith('youtube:') ? 'https://www.youtube-nocookie.com/embed/' + it.file.slice(8) + '?autoplay=1&rel=0' : 'https://drive.google.com/file/d/' + it.file.slice(6) + '/preview';
  const videoLink = it => it.file.startsWith('youtube:') ? 'https://youtu.be/' + it.file.slice(8) : 'https://drive.google.com/file/d/' + it.file.slice(6) + '/view';
  function fitImage(file, max) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => rej(new Error('Could not read that image'));
      img.src = url;
    });
  }
  const nameSelect = (id, cur) => `<div class="combo"><input id="${id}" data-combo="name" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Type your name" value="${esc(cur || '')}"></div>`;
  // type-to-search name picker: suggestions drop down as you type, and the field only keeps a name that is on the player list
  function comboItems(inp) {
    if (inp.dataset.combo === 'avail') { const used = new Set(F.lineup.map(x => x.player_id)); return db.players.filter(p => !used.has(p.id)).map(p => ({ label: p.name, id: p.id })); }
    return db.players.map(p => ({ label: p.name, id: p.id }));
  }
  function comboShow(inp) {
    const box = inp.parentElement; let ul = box.querySelector('.combo-list');
    if (!ul) { ul = document.createElement('ul'); ul.className = 'combo-list'; ul.setAttribute('role', 'listbox'); box.appendChild(ul); }
    const q = inp.value.trim().toLowerCase();
    let items = comboItems(inp).filter(x => x.label.toLowerCase().includes(q));
    items.sort((x, y) => (y.label.toLowerCase().startsWith(q) - x.label.toLowerCase().startsWith(q)) || x.label.localeCompare(y.label));
    ul.innerHTML = items.length ? items.map((x, k) => `<li role="option" data-id="${x.id}"${k === 0 && q ? ' class="on"' : ''}>${esc(x.label)}</li>`).join('') : '<li class="none">No player found with that name</li>';
    ul.hidden = false;
  }
  function comboPick(inp, li) {
    const id = +li.dataset.id, p = db.players.find(x => x.id === id); if (!p) return;
    const ul = inp.parentElement.querySelector('.combo-list'); if (ul) ul.hidden = true;
    if (inp.dataset.combo === 'avail') { F.lineup.push({ player_id: id, team: inp.dataset.team, goals: 0, assists: 0 }); viewMatchForm(); return; }
    inp.value = p.name; inp.dataset.skip = '1'; inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('input[data-combo]')) comboShow(e.target); });
  document.addEventListener('input', e => {
    if (!e.target.matches || !e.target.matches('input[data-combo]')) return;
    if (e.target.dataset.skip) { delete e.target.dataset.skip; return; }
    comboShow(e.target);
  });
  document.addEventListener('pointerdown', e => {
    const li = e.target.closest && e.target.closest('.combo-list li[data-id]');
    if (li) { e.preventDefault(); comboPick(li.closest('.combo').querySelector('input'), li); return; }
    document.querySelectorAll('.combo-list').forEach(u => { if (!u.parentElement.contains(e.target)) u.hidden = true; });
  });
  document.addEventListener('keydown', e => {
    const inp = e.target; if (!inp.matches || !inp.matches('input[data-combo]')) return;
    const ul = inp.parentElement.querySelector('.combo-list'); if (!ul || ul.hidden) return;
    const lis = [...ul.querySelectorAll('li[data-id]')]; let k = lis.findIndex(x => x.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!lis.length) return; if (k >= 0) lis[k].classList.remove('on');
      k = e.key === 'ArrowDown' ? (k + 1) % lis.length : (k <= 0 ? lis.length - 1 : k - 1);
      lis[k].classList.add('on'); lis[k].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') { e.preventDefault(); const t = k >= 0 ? lis[k] : lis.length === 1 ? lis[0] : null; if (t) comboPick(inp, t); }
    else if (e.key === 'Escape') ul.hidden = true;
  });
  document.addEventListener('focusout', e => {
    const inp = e.target; if (!inp.matches || !inp.matches('input[data-combo]')) return;
    if (inp.dataset.combo === 'name') {          // keep only a real player name
      const ex = db.players.find(p => p.name.toLowerCase() === inp.value.trim().toLowerCase());
      const v = ex ? ex.name : ''; if (inp.value !== v) { inp.value = v; inp.dataset.skip = '1'; inp.dispatchEvent(new Event('input', { bubbles: true })); const u = inp.parentElement.querySelector('.combo-list'); if (u) u.hidden = true; }
    }
    const u = inp.parentElement.querySelector('.combo-list'); if (u) setTimeout(() => (u.hidden = true), 0);
  });
  const hasToday = () => db.matches.some(m => m.played_on === todayISO());
  const mem = {};
  const lsGet = k => { try { const v = localStorage.getItem(k); if (v != null) return v; } catch (e) { } return mem[k] || ''; };
  const lsSet = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { } };
  const isMember = () => !!lsGet('fc_member');
  const canEditMatch = m => isAdmin() || (isMember() && m.played_on === todayISO());
  function askMemberCode() {
    return new Promise(res => {
      const m = $('#modal');
      $('#modalCard').innerHTML = `<h3>Match passcode</h3><p class="muted" style="margin:-6px 0 14px">Enter the match passcode your admin shared with the community. You only need to do this once on this device, unless an admin changes it.</p>
        <div class="f"><label for="mc">Match passcode</label><input id="mc" autocomplete="off"></div>
        <div class="row"><button id="mc-go">Continue</button><button class="ghost" id="mc-x">Cancel</button></div>`;
      m.hidden = false; $('#mc').focus();
      const done = v => { m.hidden = true; res(v); };
      $('#mc-go').onclick = () => done($('#mc').value.trim());
      $('#mc-x').onclick = () => done('');
      $('#mc').onkeydown = e => { if (e.key === 'Enter') done($('#mc').value.trim()); };
      m.onclick = e => { if (e.target === m) done(''); };
    });
  }
  const num = v => { const n = parseInt(v, 10); return isNaN(n) || n < 0 ? 0 : n; };

  /* ---------------- Data stores ---------------- */

  function sheetsStore() {
    const URL = CFG.SCRIPT_URL;
    let code = '', who = '', cb = null;
    try { code = localStorage.getItem('fc_code') || ''; who = localStorage.getItem('fc_who') || ''; } catch (e) { }
    const persist = () => { try { localStorage.setItem('fc_code', code); localStorage.setItem('fc_who', who); } catch (e) { } };
    async function post(body, retried) {
      // text/plain avoids a CORS preflight, which Apps Script does not support
      const r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ code, member: lsGet('fc_member') }, body)) });
      const j = await r.json();
      if (!j.ok) {
        if (j.error === 'MATCH_PASSCODE_REQUIRED') {
          if (retried) { lsSet('fc_member', ''); throw new Error('That match passcode is not right. Ask an admin for the current one.'); }
          const c = await askMemberCode();
          if (!c) throw new Error('The match passcode is needed to do this. Ask an admin for it.');
          lsSet('fc_member', c); return post(body, true);
        }
        throw new Error(j.error || 'Request failed');
      }
      return j;
    }
    return {
      async load() {
        const r = await fetch(URL + (URL.includes('?') ? '&' : '?') + 'action=load&t=' + Date.now());
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'Could not load data');
        return j.data;
      },
      async addPlayer(name, f) { return (await post(Object.assign({ action: 'addPlayer', name }, f || {}))).player; },
      async updatePlayer(id, f) { await post(Object.assign({ action: 'updatePlayer', id }, f)); },
      async deletePlayer(id) { await post({ action: 'deletePlayer', id }); },
      async submitPlayer(name, f) { await post(Object.assign({ action: 'submitPlayer', name }, f || {})); },
      async adminData() { return await post({ action: 'adminData' }); },
      async setPasscode(v) { await post({ action: 'setPasscode', passcode: v }); },
      async submitMedia(it) { const j = await post({ action: 'submitMedia', kind: it.kind, photoData: it.photoData, url: it.url, caption: it.caption, by: it.by }); return { pending: !!j.pending }; },
      async setPlayerPhoto(id, photoData, by) { await post({ action: 'setPlayerPhoto', player_id: id, photoData, by }); },
      async suggestChange(id, f) { await post({ action: 'suggestChange', player_id: id, name: f.name, position: f.position, by: f.by }); },
      async approveChange(id) { await post({ action: 'approveChange', id }); },
      async rejectChange(id) { await post({ action: 'rejectChange', id }); },
      async approveMedia(id) { await post({ action: 'approveMedia', id }); },
      async rejectMedia(id) { await post({ action: 'rejectMedia', id }); },
      async deleteMedia(id) { await post({ action: 'deleteMedia', id }); },
      async approveMatch(id) { await post({ action: 'approveMatch', id }); },
      async rejectMatch(id) { await post({ action: 'rejectMatch', id }); },
      async approvePlayer(id, o) { o = o || {}; await post({ action: 'approvePlayer', id, claim: o.claim !== false, mergeInto: o.mergeInto || 0 }); },
      async claimGuests(name, playerId) { await post({ action: 'claimGuests', name, player_id: playerId }); },
      async rejectPlayer(id) { await post({ action: 'rejectPlayer', id }); },
      async saveMatch(m) { const j = await post({ action: 'saveMatch', match: m, by: m.by }); return { id: j.id, pending: !!j.pending }; },
      async deleteMatch(id) { await post({ action: 'deleteMatch', id }); },
      async getUser() { return code && who ? { email: who } : null; },
      async signIn(_e, pass) {
        code = pass; try { who = (await post({ action: 'check' })).name; } catch (e) { code = ''; who = ''; throw e; }
        persist(); if (cb) cb({ email: who });
      },
      async signOut() { code = ''; who = ''; persist(); if (cb) cb(null); },
      onAuth(f) { cb = f; }
    };
  }

  function demoStore() {
    const KEY = 'fc_demo_v5';
    function svgPhoto(a, b, k) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4"><circle cx="300" cy="225" r="70"/><path d="M300 0v450"/><rect x="-4" y="140" width="110" height="170"/><rect x="494" y="140" width="110" height="170"/></g><circle cx="${140 + k * 70}" cy="${320 - k * 25}" r="22" fill="#fff"/></svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    let demoUser = null, demoCb = null;
    let d;
    function seed() {
      let s = 42;
      const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
      const names = ['Arjun', 'Rahul', 'Vikram', 'Sameer', 'Karan', 'Aman', 'Rohan', 'Imran', 'Dev', 'Nikhil', 'Siddharth', 'Faizan'];
      const out = { players: names.map((n, i) => ({ id: i + 1, name: n, photo: '', position: ['GK', 'DEF', 'MID', 'FWD'][i % 4], regular: i < 8 })), matches: [], lineups: [], nextP: 13, nextM: 1 };
      for (let i = 30; i >= 1; i--) {
        if (i === 4) continue; // a missing day, to try 'Add earlier day'
        const dt = new Date(Date.now() - i * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        const pool = out.players.map(p => p.id).sort(() => rnd() - 0.5).slice(0, 8 + Math.floor(rnd() * 3) * 1);
        const half = Math.floor(pool.length / 2);
        const A = pool.slice(0, half), B = pool.slice(half);
        const sa = Math.floor(rnd() * 7), sb = Math.floor(rnd() * 7);
        const id = out.nextM++;
        out.matches.push({ id, played_on: dt, score_a: sa, score_b: sb, notes: null, status: i === 9 ? 'pending' : 'approved', added_by: i === 9 ? 'Guest: Imran' : '' });
        [[A, 'A', sa], [B, 'B', sb]].forEach(([team, t, score]) => {
          const g = {}; team.forEach(p => g[p] = 0);
          for (let k = 0; k < score; k++) g[team[Math.floor(rnd() * team.length)]]++;
          team.forEach(p => out.lineups.push({ match_id: id, player_id: p, team: t, goals: g[p], assists: rnd() < 0.3 ? 1 : 0 }));
        });
      }
      out.players.push({ id: 13, name: 'Rohit', photo: '', position: 'MID', regular: false, status: 'pending', added_by: 'Guest: Imran' });
      out.nextP = 14;
      out.matchPass = 'kickoff';
      const cols = [['#1f7a4d', '#0e3b2a'], ['#2d5be3', '#10205e'], ['#ff6b1a', '#7a2a00'], ['#12804b', '#0b3d2e'], ['#586a80', '#0e1b2c'], ['#d5432e', '#5b1408']];
      const caps = ['Warm-up before kick-off', 'Team B after the win', 'Goal of the morning', 'Cooling down', 'Full squad today', 'Early start'];
      out.media = cols.map((c, i) => ({ id: i + 1, type: 'photo', file: svgPhoto(c[0], c[1], i), caption: caps[i], added_by: ['Arjun', 'Rahul', 'Vikram', 'Imran', 'Karan', 'Dev'][i], created: isoShift(i + 1), status: 'approved' }));
      out.media.push({ id: 8, type: 'photo', file: svgPhoto('#8a5cf5', '#2b1766', 3), caption: 'Post-match chai', added_by: 'Guest: Karan', created: isoShift(0), status: 'pending' });
      out.nextG = 9;
      return out;
    }
    function load0() { try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; } if (!d) d = seed(); }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { } }
    async function needMember() {
      if (demoUser) return;
      const pass = () => d.matchPass || 'kickoff';
      let c = lsGet('fc_member');
      if (c !== pass()) {
        c = await askMemberCode();
        if (!c) throw new Error('The match passcode is needed to do this. Ask an admin for it.');
        if (c !== pass()) throw new Error('That match passcode is not right. Ask an admin for the current one.');
        lsSet('fc_member', c);
      }
    }
    load0();
    return {
      reset() { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); },
      async load() {
        const live = d.matches.filter(m => m.status !== 'pending');
        const matches = live.slice().sort((a, b) => (a.played_on === b.played_on ? b.id - a.id : a.played_on < b.played_on ? 1 : -1));
        const ok = d.players.filter(p => p.status !== 'pending');
        const ids = new Set(ok.map(p => p.id)), mids = new Set(live.map(m => m.id));
        const media = (d.media || []).filter(x => x.status !== 'pending').sort((a, b) => b.id - a.id);
        return { players: ok.sort((a, b) => a.name.localeCompare(b.name)), matches, lineups: d.lineups.filter(l => ids.has(l.player_id) && mids.has(l.match_id)), media };
      },
      async submitMedia(it) {
        await needMember();
        const admin = !!demoUser;
        if (!admin && !d.players.some(p => p.status !== 'pending' && p.name === it.by)) throw new Error('Please choose your name from the players list');
        let file;
        if (it.kind === 'video') {
          const u = String(it.url || ''); let m;
          if ((m = /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(u))) file = 'youtube:' + m[1];
          else if ((m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([A-Za-z0-9_-]{10,})/.exec(u))) file = 'drive:' + m[1];
          else throw new Error('Paste a YouTube or Google Drive video link');
        } else file = it.photoData;
        d.media = d.media || [];
        d.media.push({ id: d.nextG++, type: it.kind === 'video' ? 'video' : 'photo', file, caption: String(it.caption || '').trim().slice(0, 140), added_by: admin ? 'Admin' : 'Guest: ' + String(it.by).trim(), created: todayISO(), status: admin ? 'approved' : 'pending' });
        save();
        return { pending: !admin };
      },
      async setPlayerPhoto(id, photoData, by) {
        await needMember();
        const p = d.players.find(x => x.id === id && x.status !== 'pending');
        if (!p) throw new Error('Player not found');
        if (!demoUser && !d.players.some(x => x.status !== 'pending' && x.name === by)) throw new Error('Please choose your name from the players list');
        if (p.photo && !demoUser) throw new Error('This player already has a photo. Ask an admin to change it.');
        p.photo = photoData; save();
      },
      async suggestChange(id, f) {
        await needMember();
        const p = d.players.find(x => x.id === id && x.status !== 'pending');
        if (!p) throw new Error('Player not found');
        if (!d.players.some(x => x.status !== 'pending' && x.name === f.by)) throw new Error('Please choose your name from the players list');
        const name = String(f.name || '').trim() || p.name, position = f.position || '';
        if (name === p.name && position === (p.position || '')) throw new Error('Nothing was changed');
        if (d.players.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) throw new Error('Another player has that name');
        d.changes = (d.changes || []).filter(c => c.player_id !== id);
        d.changes.push({ id: (d.nextC = (d.nextC || 0) + 1), player_id: id, name, position, added_by: f.by });
        save();
      },
      async approveChange(id) {
        const c = (d.changes || []).find(x => x.id === id), p = c && d.players.find(x => x.id === c.player_id);
        if (p) { p.name = c.name; p.position = c.position; }
        d.changes = (d.changes || []).filter(x => x.id !== id); save();
      },
      async rejectChange(id) { d.changes = (d.changes || []).filter(x => x.id !== id); save(); },
      async approveMedia(id) { d.media.find(x => x.id === id).status = 'approved'; save(); },
      async rejectMedia(id) { d.media = d.media.filter(x => x.id !== id); save(); },
      async deleteMedia(id) { d.media = d.media.filter(x => x.id !== id); save(); },
      async adminData() {
        const pm = d.matches.filter(m => m.status === 'pending').map(m => Object.assign({}, m, { lineup: d.lineups.filter(l => l.match_id === m.id) }));
        return { passcode: d.matchPass || 'kickoff', players: d.players.filter(p => p.status === 'pending').map(p => Object.assign({}, p, { guest_games: d.matches.filter(m => (m.guests || []).some(g => g.name.toLowerCase() === p.name.toLowerCase())).length })), matches: pm, changes: (d.changes || []).map(c => { const p = d.players.find(x => x.id === c.player_id) || {}; return Object.assign({}, c, { current_name: p.name || '', current_position: p.position || '' }); }), media: (d.media || []).filter(x => x.status === 'pending').map(x => Object.assign({}, x)) };
      },
      async setPasscode(v) { if (String(v).length < 4) throw new Error('The match passcode must be 4 to 40 characters'); d.matchPass = v; save(); },
      async approveMatch(id) { d.matches.find(m => m.id === id).status = 'approved'; save(); },
      async rejectMatch(id) { d.matches = d.matches.filter(m => m.id !== id); d.lineups = d.lineups.filter(l => l.match_id !== id); save(); },
      async submitPlayer(name, f) {
        f = f || {};
        if (!d.players.some(p => p.status !== 'pending' && p.name === f.by)) throw new Error('Please choose your name from the players list');
        if (d.players.some(p => p.name.toLowerCase() === name.toLowerCase())) throw new Error('A player with that name already exists or is waiting for approval');
        d.players.push({ id: d.nextP++, name, photo: f.photoData || '', position: f.position || '', regular: false, status: 'pending', added_by: 'Guest: ' + (f.by || '') });
        save();
      },
      claim(name, pid) {
        const k = name.toLowerCase();
        d.matches.forEach(m => {
          (m.guests || []).filter(g => g.name.toLowerCase() === k).forEach(g => {
            if (!d.lineups.some(l => l.match_id === m.id && l.player_id === pid)) d.lineups.push({ match_id: m.id, player_id: pid, team: g.team, goals: g.goals, assists: g.assists });
            m.guests = m.guests.filter(x => x !== g);
          });
        });
      },
      async approvePlayer(id, o) {
        o = o || {}; const p = d.players.find(x => x.id === id);
        if (o.mergeInto) { if (o.claim !== false) this.claim(p.name, o.mergeInto); d.players = d.players.filter(x => x.id !== id); }
        else { p.status = 'approved'; if (o.claim !== false) this.claim(p.name, p.id); }
        save();
      },
      async claimGuests(name, pid) { this.claim(name, pid); save(); },
      async rejectPlayer(id) { d.players = d.players.filter(p => p.id !== id); save(); },
      async addPlayer(name, f) { f = f || {}; const p = { id: d.nextP++, name, photo: f.photoData || '', position: f.position || '', regular: !!f.regular, status: 'approved' }; d.players.push(p); save(); return p; },
      async updatePlayer(id, f) {
        const p = d.players.find(x => x.id === id);
        p.name = f.name; p.position = f.position || ''; p.regular = !!f.regular;
        if (f.photoData) p.photo = f.photoData; else if (f.removePhoto) p.photo = '';
        save();
      },
      async deletePlayer(id) { d.players = d.players.filter(p => p.id !== id); d.lineups = d.lineups.filter(l => l.player_id !== id); save(); },
      async saveMatch(m) {
        await needMember();
        const admin = !!demoUser, today = todayISO();
        let id = m.id;
        const ex = id ? d.matches.find(x => x.id === id) : null;
        let status = 'approved';
        if (!admin) {
          if (!d.players.some(p => p.status !== 'pending' && p.name === m.by)) throw new Error('Please choose your name from the players list');
          if (m.played_on > today) throw new Error("The date can't be in the future");
          if (id) { if (!ex || ex.played_on !== today || m.played_on !== today || ex.status === 'pending') throw new Error('Only an admin can edit this match'); }
          else if (m.played_on !== today) status = 'pending';
        } else if (ex && ex.status === 'pending') status = 'pending';
        if (d.matches.some(x => x.played_on === m.played_on && x.id !== id)) throw new Error('A match for that date already exists or is waiting for approval');
        const by = admin ? 'Admin' : 'Guest: ' + String(m.by).trim();
        if (id) {
          Object.assign(ex, { played_on: m.played_on, score_a: m.score_a, score_b: m.score_b, notes: m.notes || null, added_by: by });
          d.lineups = d.lineups.filter(l => l.match_id !== id);
        } else {
          id = d.nextM++;
          d.matches.push({ id, played_on: m.played_on, score_a: m.score_a, score_b: m.score_b, notes: m.notes || null, status, added_by: by });
        }
        m.lineup.forEach(x => d.lineups.push({ match_id: id, player_id: x.player_id, team: x.team, goals: x.goals, assists: x.assists }));
        const rec = d.matches.find(x => x.id === id);
        rec.guests = (m.guests || []).slice(0, 6).map(g => ({ name: String(g.name || '').trim().slice(0, 40) || 'Guest', team: g.team === 'B' ? 'B' : 'A', goals: g.goals || 0, assists: g.assists || 0 }));
        save();
        return { id, pending: status === 'pending' };
      },
      async deleteMatch(id) {
        await needMember();
        const ex = d.matches.find(m => m.id === id);
        if (!demoUser && (!ex || ex.played_on !== todayISO() || ex.status === 'pending')) throw new Error('Only an admin can delete this match');
        d.matches = d.matches.filter(m => m.id !== id); d.lineups = d.lineups.filter(l => l.match_id !== id); save();
      },
      async getUser() { return demoUser; },
      async signIn(_e, pass) { if (pass !== 'admin') throw new Error('Wrong passcode'); demoUser = { email: 'Demo admin' }; if (demoCb) demoCb(demoUser); },
      async signOut() { demoUser = null; if (demoCb) demoCb(null); },
      onAuth(f) { demoCb = f; }
    };
  }

  const store = LIVE ? sheetsStore() : demoStore();

  /* ---------------- State ---------------- */

  let db = { players: [], matches: [], lineups: [], media: [] };
  let user = null;
  let pending = [], pendingM = [], pendingMed = [], pendingCh = [], matchPass = '';
  const isAdmin = () => !!user;
  const ui = { period: 'all', minG: 0, sort: { key: 'w', dir: -1 } };
  let F = null; // match form state

  /* ---------------- Helpers ---------------- */

  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3500);
  }
  const avatarById = (id, size) => avatar(db.players.find(x => x.id === id) || { name: '?' }, size);
  const pname = id => { const p = db.players.find(x => x.id === id); return p ? p.name : '?'; };
  const dots = form => form.length ? '<span class="formrow">' + form.map(r => `<span class="fm ${r}" title="${{ W: 'Win', D: 'Draw', L: 'Loss' }[r]}">${r}</span>`).join('') + '</span>' : '';
  function updateBadge() {
    [['players', pending.length + pendingCh.length], ['matches', pendingM.length], ['gallery', pendingMed.length]].forEach(([k, n]) => {
      const a = document.querySelector(`#nav a[data-r="${k}"]`); if (!a) return;
      const old = a.querySelector('.badge'); if (old) old.remove();
      if (isAdmin() && n) { const b = document.createElement('b'); b.className = 'badge'; b.textContent = n; b.title = n + ' waiting for approval'; a.appendChild(b); }
    });
  }
  async function reload() {
    db = await store.load(); db.media = db.media || [];
    if (isAdmin()) {
      try { const a = await store.adminData(); pending = a.players; pendingM = a.matches; pendingMed = a.media || []; pendingCh = a.changes || []; matchPass = a.passcode; }
      catch (e) { pending = []; pendingM = []; pendingMed = []; pendingCh = []; matchPass = ''; }
    } else { pending = []; pendingM = []; pendingMed = []; pendingCh = []; matchPass = ''; }
    updateBadge();
  }
  async function run(fn, okMsg) {
    try { await fn(); if (okMsg) toast(okMsg); } catch (e) { console.error(e); toast(e.message || 'Something went wrong', true); }
  }

  /* ---------------- Views ---------------- */

  const BALL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M12 6.5l4.2 3-1.6 5H9.4l-1.6-5z" fill="currentColor"/></svg>';
  const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const page = h => `<div class="wrap page">${h}</div>`;
  const ph = (title, sub, act) => `<div class="ph"><div><h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${act ? `<div class="ph-act">${act}</div>` : ''}</div>`;
  const pills = l => (l.goals ? `<span class="pill g" title="Goals">${BALL}${l.goals}</span>` : '') + (l.assists ? `<span class="pill as" title="Assists">A ${l.assists}</span>` : '');
  const metaTags = p => (p.position ? `<span class="tag">${esc(p.position)}</span>` : '') + (p.regular ? '<span class="tag reg">Regular</span>' : '');
  const ADD_BTN = '<a class="btn primary add-match" href="#/match/new">Add match</a>';
  const EARLIER_BTN = '<a class="btn ghost" href="#/match/earlier">Add earlier day</a>';

  function viewLeaderboard() {
    const all = Stats.computeStats(db, ui.period).filter(s => s.p > 0 && s.p >= ui.minG);
    const cols = [['name', 'Player', ''], ['p', 'P', ''], ['w', 'W', ''], ['d', 'D', 'hs'], ['l', 'L', 'hs'], ['winPct', 'Win %', ''],
      ['goals', 'Goals', ''], ['gpg', 'Per game', 'hs'], ['assists', 'Assists', 'hs'], ['pts', 'Pts', ''], ['form', 'Form', 'hs']];
    const { key, dir } = ui.sort;
    const rows = all.slice().sort((a, b) => {
      if (key === 'name') return dir * a.name.localeCompare(b.name);
      if (key === 'form') return 0;
      return (a[key] - b[key]) * dir || b.goals - a.goals || b.w - a.w || a.name.localeCompare(b.name);
    });
    const head = cols.map(([k, t, c]) => `<th data-k="${k}" class="${c} ${k === key ? 'sorted' : ''}">${t}${k === key ? (dir < 0 ? ' ▾' : ' ▴') : ''}</th>`).join('');
    const body = rows.map((s, i) => `<tr>
      <td class="pl"><span class="rk r${i < 3 ? i + 1 : 0}">${i + 1}</span>${avatarById(s.id, 30)}<a class="pname" href="#/player/${s.id}">${esc(s.name)}</a></td>
      <td>${s.p}</td><td>${s.w}</td><td class="hs">${s.d}</td><td class="hs">${s.l}</td><td>${s.winPct.toFixed(0)}%</td>
      <td><b>${s.goals}</b></td><td class="hs">${s.gpg.toFixed(2)}</td><td class="hs">${s.assists}</td><td><b>${s.pts}</b></td><td class="hs">${dots(s.form)}</td></tr>`).join('');
    const periods = [['all', 'All time'], ['year', 'This year'], ['month', 'This month']];
    $('#app').innerHTML = page(`${ph('Leaderboard', `${db.matches.length} matches, ${db.players.length} players`)}
      <div class="row" style="margin-bottom:16px">
        <div class="seg" role="group" aria-label="Period">${periods.map(([k, t]) => `<button class="${ui.period === k ? 'on' : ''}" data-per="${k}" aria-pressed="${ui.period === k}">${t}</button>`).join('')}</div>
        <span class="spacer"></span>
        <div class="row" style="gap:8px"><label for="ming" style="margin:0">Minimum games</label><select id="ming">${[0, 3, 5, 10].map(n => `<option value="${n}">${n === 0 ? 'Any' : n + ' or more'}</option>`).join('')}</select></div>
      </div>
      <div class="tablewrap"><table><thead><tr>${head}</tr></thead><tbody>${body || '<tr><td colspan="11" class="muted" style="text-align:center;padding:26px">No games in this period yet.</td></tr>'}</tbody></table></div>
      <p class="legend">P played, W won, D drawn, L lost. Points: 3 for a win, 1 for a draw. Tap a column heading to sort.</p>`);
    $('#ming').value = String(ui.minG);
    $('#ming').onchange = e => { ui.minG = +e.target.value; viewLeaderboard(); };
    document.querySelectorAll('[data-per]').forEach(b => b.onclick = () => { ui.period = b.dataset.per; viewLeaderboard(); });
    document.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => {
      const k = th.dataset.k; if (k === 'form') return;
      ui.sort = { key: k, dir: ui.sort.key === k ? -ui.sort.dir : (k === 'name' ? 1 : -1) };
      viewLeaderboard();
    });
  }

  function viewLanding() {
    const month = Stats.computeStats(db, 'month').filter(s => s.p > 0);
    const useMonth = month.length > 0;
    const st = useMonth ? month : Stats.computeStats(db, 'all').filter(s => s.p > 0);
    const label = useMonth ? 'This month' : 'All time';
    const totalGoals = db.lineups.reduce((a, l) => a + (l.goals || 0), 0);
    const monthGames = db.matches.filter(m => Stats.inPeriod(m.played_on, 'month', new Date())).length;
    const rankBy = key => st.slice().filter(s => s[key] > 0)
      .sort((a, b) => b[key] - a[key] || b.w - a.w || b.goals - a.goals || a.name.localeCompare(b.name));
    const top = key => rankBy(key).slice(0, 3)
      .map((s, i) => `<li><span class="rk r${i + 1}">${i + 1}</span>${avatarById(s.id, 32)}<a href="#/player/${s.id}">${esc(s.name)}</a><b>${s[key]}</b></li>`).join('') || '<li class="muted">No games yet</li>';
    const list = (title, key) => `<div class="panel"><h3>${title}</h3><ol class="mini">${top(key)}</ol></div>`;
    const hl = (cls, title, key, unit, detail) => {
      const r = rankBy(key), s = r[0];
      if (!s) return '';
      const tied = r.filter(x => x[key] === s[key] && x.id !== s.id).map(x => esc(x.name));
      return `<a class="hl ${cls}" href="#/player/${s.id}">
        <div class="hl-top"><span class="hl-title">${title}</span><span class="hl-per">${label}</span></div>
        <div class="hl-main">${avatarById(s.id, 84)}
          <div class="hl-who"><div class="hl-name">${esc(s.name)}</div><div class="hl-sub">${detail(s)}</div>${tied.length ? `<div class="hl-sub">Level with ${tied.slice(0, 3).join(', ')}${tied.length > 3 ? ' and ' + (tied.length - 3) + ' more' : ''}</div>` : ''}</div>
          <div class="hl-num"><b>${s[key]}</b><span>${unit}</span></div></div></a>`;
    };
    const highlights = hl('scorer', 'Top scorer', 'goals', 'goals', s => `${s.p} games, ${s.gpg.toFixed(2)} goals per game`)
      + hl('wins', 'Most wins', 'w', 'wins', s => `${s.p} games, ${s.winPct.toFixed(0)}% win rate`);
    const stat = (v, k) => `<div><b>${v}</b><span>${k}</span></div>`;
    $('#app').innerHTML = `
      <section class="hero"><div class="wrap hero-in">
        <h1 class="hero-t">${esc(CFG.SITE_NAME || 'Football Community')}</h1>
        ${CFG.TAGLINE ? `<p class="hero-s">${esc(CFG.TAGLINE)}</p>` : ''}
        ${CFG.PLAY_INFO ? `<p class="hero-i">${PIN}${esc(CFG.PLAY_INFO)}</p>` : ''}
        <div class="hero-stats">${stat(db.matches.length, 'Matches')}${stat(db.players.length, 'Players')}${stat(totalGoals, 'Goals')}${stat(monthGames, 'This month')}</div>
        <div class="hero-cta"><a class="btn primary" href="#/leaderboard">View leaderboard</a><a class="btn ghost-light" href="#/players">Meet the players</a></div>
      </div></section>
      <div class="wrap page" style="padding-top:0">
        ${highlights ? `<div class="hls">${highlights}</div>` : ''}
        <div class="head-row"><h2>Last match</h2><span class="spacer"></span><a href="#/matches">All matches</a></div>
        ${db.matches[0] ? matchCard(db.matches[0]) : '<p class="empty">No matches yet. Once the first match is added, the results show up here.</p>'}
        <h2>Leaders</h2>
        <div class="cards">${list('Top scorers', 'goals')}${list('Most wins', 'w')}${list('Most games', 'p')}</div>
        ${db.media.length ? `<div class="head-row"><h2>Gallery</h2><span class="spacer"></span><a href="#/gallery">Open gallery</a></div><div class="ggrid small">${db.media.slice(0, 4).map(gcard).join('')}</div>` : ''}
      </div>`;
    bindMatchDeletes();
    bindGallery(db.media);
  }

  function matchCard(m, o) {
    o = o || {};
    const ls = o.pending ? m.lineup : db.lineups.filter(l => l.match_id === m.id);
    const aw = m.score_a > m.score_b, bw = m.score_b > m.score_a, dr = m.score_a === m.score_b;
    const side = (t, won) => `<div class="bt ${t.toLowerCase()} ${!dr && !won ? 'dim' : ''}"><span class="tn">Team ${t}</span><span class="tr">${dr ? 'Draw' : won ? 'Won' : 'Lost'}</span></div>`;
    const team = t => {
      const items = ls.filter(l => l.team === t).sort((a, b) => b.goals - a.goals || pname(a.player_id).localeCompare(pname(b.player_id)))
        .map(l => `<li>${avatarById(l.player_id, 28)}<a href="#/player/${l.player_id}">${esc(pname(l.player_id))}</a><span class="pp">${pills(l)}</span></li>`).join('');
      const gitems = (m.guests || []).filter(g => g.team === t).map(g => `<li>${avatar({ name: g.name, photo: '' }, 28)}<span>${esc(g.name)} <small class="muted">(guest)</small>${isAdmin() && !o.pending ? ` <button class="linkbtn" data-mkp="${esc(g.name)}">Make player</button>` : ''}</span><span class="pp">${pills(g)}</span></li>`).join('');
      return `<div class="lu ${t.toLowerCase()}"><h4>Team ${t}</h4><ul>${items + gitems || '<li class="muted">No players recorded</li>'}</ul></div>`;
    };
    const admin = o.pending ? `<span class="spacer"></span><button class="small" data-mappr="${m.id}">Approve</button><button class="danger small" data-mrej="${m.id}">Reject</button>`
      : canEditMatch(m) ? `<span class="spacer"></span><a class="btn ghost small" href="#/match/${m.id}/edit">Edit</a><button class="danger small" data-del="${m.id}">Delete</button>` : '';
    const tags = o.pending ? `<span class="tag wait">Waiting for approval</span><span class="muted" style="font-weight:500">added by ${esc(String(m.added_by || '').replace(/^Guest: /, '') || 'unknown')}</span>` : (m.played_on === todayISO() ? '<span class="tag">Today</span>' : '');
    return `<article class="match"><div class="mh"><span>${fmtDate(m.played_on)}</span>${tags}${admin}</div>
      <div class="board">${side('A', aw)}<div class="bs"><b>${m.score_a}</b><i>–</i><b>${m.score_b}</b></div>${side('B', bw)}</div>
      <div class="lineups">${team('A')}${team('B')}</div>${m.notes ? `<p class="note">${esc(m.notes)}</p>` : ''}</article>`;
  }

  function bindMatchDeletes() {
    document.querySelectorAll('[data-mkp]').forEach(b => b.onclick = () => {
      const name = b.dataset.mkp;
      if (!confirm(`Add ${name} to the player list and count their guest games in the stats?`)) return;
      run(async () => {
        const ex = db.players.find(p => p.name.toLowerCase() === name.toLowerCase());
        const p = ex || await store.addPlayer(name);
        await store.claimGuests(name, p.id); await reload(); route();
      }, `${name} is now a player`);
    });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (!confirm('Delete this match? This cannot be undone.')) return;
      run(async () => { await store.deleteMatch(+b.dataset.del); await reload(); route(); }, 'Match deleted');
    });
  }

  function openPasscodeChange() {
    const m = $('#modal'), close = () => (m.hidden = true);
    $('#modalCard').innerHTML = `<h3>Change match passcode</h3>
      <p class="muted" style="margin:-6px 0 14px">People enter this once on their device to add a match. After you change it, share the new one with your community. Everyone will be asked for it again.</p>
      <div class="f"><label for="pc-n">New match passcode</label><input id="pc-n" value="${esc(matchPass)}" maxlength="40" autocomplete="off"></div>
      <div class="row"><button id="pc-save">Save passcode</button><button class="ghost" id="pc-x">Cancel</button></div>`;
    m.hidden = false; $('#pc-n').focus(); $('#pc-n').select();
    m.onclick = e => { if (e.target === m) close(); };
    $('#pc-x').onclick = close;
    $('#pc-save').onclick = () => {
      const v = $('#pc-n').value.trim();
      if (v.length < 4) return toast('Use at least 4 characters', true);
      run(async () => { await store.setPasscode(v); await reload(); close(); viewMatches(); }, 'Passcode changed. Share the new one with your community.');
    };
  }

  function viewMatches() {
    const admin = isAdmin();
    const passBox = admin ? `<section class="passbox"><div class="pb-t"><b>Match passcode</b><span class="muted">People need it to add a match. Share it only with your community.</span></div>
        <code id="mp">••••••</code><button class="ghost small" id="mp-show">Show</button><button class="small" id="mp-change">Change</button></section>` : '';
    const pendBox = admin && pendingM.length ? `<section class="pending"><h3>Matches waiting for approval (${pendingM.length})</h3>${pendingM.map(m => matchCard(m, { pending: true })).join('')}</section>` : '';
    $('#app').innerHTML = page(`${ph('Matches', `${db.matches.length} played, newest first`, EARLIER_BTN + ADD_BTN)}
      ${passBox}${pendBox}
      <p class="legend">${BALL.replace('width="13" height="13"', 'width="13" height="13" style="vertical-align:-2px"')} goals scored, A assists.</p>
      ${db.matches.map(matchCard).join('') || '<p class="empty">No matches yet.</p>'}`);
    bindMatchDeletes();
    if (!admin) return;
    let shown = false;
    $('#mp-show').onclick = () => { shown = !shown; $('#mp').textContent = shown ? matchPass : '••••••'; $('#mp-show').textContent = shown ? 'Hide' : 'Show'; };
    $('#mp-change').onclick = openPasscodeChange;
    document.querySelectorAll('[data-mappr]').forEach(b => b.onclick = () => run(async () => { await store.approveMatch(+b.dataset.mappr); await reload(); viewMatches(); }, 'Match approved'));
    document.querySelectorAll('[data-mrej]').forEach(b => b.onclick = () => {
      if (!confirm('Reject this match? It will be removed and will not appear on the site.')) return;
      run(async () => { await store.rejectMatch(+b.dataset.mrej); await reload(); viewMatches(); }, 'Match rejected');
    });
  }

  function viewPlayers() {
    const st = Stats.computeStats(db, 'all');
    const admin = isAdmin();
    const filt = ui.plFilter || 'all';
    const list = db.players.filter(p => filt === 'all' || p.regular)
      .sort((a, b) => (b.regular ? 1 : 0) - (a.regular ? 1 : 0) || a.name.localeCompare(b.name));
    const pendHtml = admin && pending.length ? `<section class="pending"><h3>Waiting for approval (${pending.length})</h3>${pending.map(p => `<div class="prow">${avatar(p, 46)}<div class="pr-info"><b>${esc(p.name)}</b><span class="muted">${esc(p.position || 'No position')}, suggested by ${esc(String(p.added_by || '').replace(/^Guest: /, '') || 'unknown')}</span>
        ${p.guest_games ? `<label class="claim"><input type="checkbox" data-claim="${p.id}" checked> Count ${p.guest_games} guest ${p.guest_games === 1 ? 'game' : 'games'} in their stats</label>` : ''}
        <label class="claim">Same person as <select data-merge="${p.id}"><option value="">Nobody, add as a new player</option>${db.players.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label></div><button class="small" data-appr="${p.id}">Approve</button><button class="danger small" data-rej="${p.id}">Reject</button></div>`).join('')}</section>` : '';
    const chHtml = admin && pendingCh.length ? `<section class="pending"><h3>Profile changes waiting (${pendingCh.length})</h3>${pendingCh.map(c => {
      const bits = [];
      if (c.name !== c.current_name) bits.push(`Name: ${esc(c.current_name)} → <b>${esc(c.name)}</b>`);
      if ((c.position || '') !== (c.current_position || '')) bits.push(`Position: ${esc(c.current_position || 'not set')} → <b>${esc(c.position || 'not set')}</b>`);
      return `<div class="prow"><div class="pr-info"><b>${esc(c.current_name)}</b><span class="muted">${bits.join('<br>')}<br>Asked by ${esc(c.added_by)}</span></div><div class="row" style="gap:8px"><button class="small" data-chappr="${c.id}">Approve</button><button class="danger small" data-chrej="${c.id}">Reject</button></div></div>`;
    }).join('')}</section>` : '';
    $('#app').innerHTML = page(`${ph('Players', `${list.length} ${filt === 'all' ? 'players' : 'regulars'}${admin ? '' : '. New players appear once an admin approves them.'}`, `<button id="addPlayer">${admin ? 'Add player' : 'Suggest a player'}</button>`)}
      ${pendHtml}
      ${chHtml}
      <div class="seg" role="group" aria-label="Filter" style="margin-bottom:18px">
        <button class="${filt === 'all' ? 'on' : ''}" data-f="all">All players</button><button class="${filt !== 'all' ? 'on' : ''}" data-f="regular">Regulars</button></div>
      <div class="pgrid">${list.map(p => { const s = st.find(x => x.id === p.id); return `<div class="pcard">
        <a class="pc-top" href="#/player/${p.id}">${avatar(p, 64)}<div><div class="pc-name">${esc(p.name)}</div><div class="tags">${metaTags(p)}</div></div></a>
        <div class="nums"><div><b>${s.p}</b><span>Games</span></div><div><b>${s.w}</b><span>Wins</span></div><div><b>${s.goals}</b><span>Goals</span></div></div>
        ${admin ? `<div class="row"><button class="ghost small" data-edit="${p.id}">Edit</button><button class="danger small" data-rm="${p.id}">Delete</button></div>` : ''}</div>`; }).join('') || '<p class="empty">No players here yet.</p>'}</div>`);
    document.querySelectorAll('.seg [data-f]').forEach(b => b.onclick = () => { ui.plFilter = b.dataset.f; viewPlayers(); });
    $('#addPlayer').onclick = () => openPlayerEdit(null);
    if (!admin) return;
    document.querySelectorAll('[data-chappr]').forEach(b => b.onclick = () => run(async () => { await store.approveChange(+b.dataset.chappr); await reload(); viewPlayers(); }, 'Change approved'));
    document.querySelectorAll('[data-chrej]').forEach(b => b.onclick = () => run(async () => { await store.rejectChange(+b.dataset.chrej); await reload(); viewPlayers(); }, 'Change rejected'));
    document.querySelectorAll('[data-appr]').forEach(b => b.onclick = () => {
      const id = +b.dataset.appr, cl = document.querySelector(`[data-claim="${id}"]`), mg = document.querySelector(`[data-merge="${id}"]`);
      run(async () => { await store.approvePlayer(id, { claim: cl ? cl.checked : false, mergeInto: mg && mg.value ? +mg.value : 0 }); await reload(); viewPlayers(); }, 'Player approved');
    });
    document.querySelectorAll('[data-rej]').forEach(b => b.onclick = () => {
      const p = pending.find(x => x.id === +b.dataset.rej);
      if (!confirm(`Reject ${p ? p.name : 'this player'}? They will be removed and will not appear on the site.`)) return;
      run(async () => { await store.rejectPlayer(+b.dataset.rej); await reload(); viewPlayers(); }, 'Player rejected');
    });
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openPlayerEdit(+b.dataset.edit));
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      const id = +b.dataset.rm;
      if (!confirm(`Delete ${pname(id)}? Their goals and appearances will be removed from all matches.`)) return;
      run(async () => { await store.deletePlayer(id); await reload(); viewPlayers(); }, 'Player deleted');
    });
  }

  function openProfileUpdate(id) {
    const p = db.players.find(x => x.id === id); if (!p) return;
    const ed = { data: null };
    const m = $('#modal'), close = () => (m.hidden = true);
    $('#modalCard').innerHTML = `<h3>Update ${esc(p.name)}</h3>
      <p class="muted" style="margin:-6px 0 14px">${p.photo ? 'Name and position changes are checked by an admin before they show.' : 'A new photo shows straight away. Name and position changes are checked by an admin first.'}</p>
      ${p.photo ? '' : `<div class="row" style="margin-bottom:16px"><span id="up-av">${avatar(p, 76)}</span><div><input id="up-file" type="file" accept="image/*"></div></div>`}
      <div class="f"><label for="up-n">Player name</label><input id="up-n" value="${esc(p.name)}" maxlength="40"></div>
      <div class="f"><label for="up-pos">Position</label><select id="up-pos">${['', 'GK', 'DEF', 'MID', 'FWD'].map(x => `<option value="${x}">${x || 'Not set'}</option>`).join('')}</select></div>
      <div class="f"><label for="up-by">Your name</label>${nameSelect('up-by', lsGet('fc_by'))}</div>
      <div class="row"><button id="up-save">Save</button><button class="ghost" id="up-x">Cancel</button></div>`;
    $('#up-pos').value = p.position || '';
    m.hidden = false; m.onclick = e => { if (e.target === m) close(); };
    $('#up-x').onclick = close;
    if ($('#up-file')) $('#up-file').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      run(async () => { ed.data = await resizeImage(f); $('#up-av').innerHTML = avatar({ name: p.name, photo: ed.data }, 76); });
    };
    $('#up-save').onclick = () => {
      const by = $('#up-by').value.trim(), name = $('#up-n').value.trim() || p.name, position = $('#up-pos').value;
      const changed = name !== p.name || position !== (p.position || '');
      if (!by) return toast('Choose your name from the list', true);
      if (!ed.data && !changed) return toast('Nothing was changed', true);
      if (changed && db.players.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) return toast('A player with that name already exists', true);
      lsSet('fc_by', by);
      const sv = $('#up-save'); sv.disabled = true; sv.textContent = 'Saving…';
      run(async () => {
        if (ed.data) await store.setPlayerPhoto(id, ed.data, by);
        if (changed) await store.suggestChange(id, { name, position, by });
        await reload(); close(); route();
        toast(changed ? (ed.data ? 'Photo added. An admin will check the name or position change.' : 'Thanks! An admin will check this change before it shows.') : 'Photo added');
      }).then(() => { sv.disabled = false; sv.textContent = 'Save'; });
    };
  }

  function openPlayerEdit(id) {
    const admin = isAdmin();
    const creating = id == null;
    const p = creating ? { name: '', position: '', regular: false, photo: '' } : db.players.find(x => x.id === id);
    if (!p || (!creating && !admin)) return;
    const suggest = creating && !admin;
    const ed = { data: null, remove: false };
    const m = $('#modal'), close = () => (m.hidden = true);
    $('#modalCard').innerHTML = `<h3>${suggest ? 'Suggest a player' : creating ? 'Add player' : 'Edit player'}</h3>
      ${suggest ? '<p class="muted" style="margin:-6px 0 14px">An admin checks new players before they appear on the site.</p>' : ''}
      <div class="row" style="margin-bottom:16px"><span id="pe-av">${avatar(p.name ? p : { name: '?' }, 76)}</span>
        <div><input id="pe-file" type="file" accept="image/*"><br><button class="ghost small" id="pe-rm" style="margin-top:6px">Remove photo</button></div></div>
      <div class="f"><label for="pe-n">Player name</label><input id="pe-n" value="${esc(p.name)}" maxlength="40" placeholder="Player name"></div>
      <div class="f"><label for="pe-pos">Position</label><select id="pe-pos">${['', 'GK', 'DEF', 'MID', 'FWD'].map(x => `<option value="${x}">${x || 'Not set'}</option>`).join('')}</select></div>
      ${suggest ? `<div class="f"><label for="pe-by">Your name</label>${nameSelect('pe-by', lsGet('fc_by'))}</div>`
        : `<div class="f"><label style="display:flex;gap:10px;align-items:center;color:var(--text)"><input id="pe-reg" type="checkbox" ${p.regular ? 'checked' : ''}> Regular player</label></div>`}
      <div class="row"><button id="pe-save">${suggest ? 'Send for approval' : creating ? 'Add player' : 'Save changes'}</button><button class="ghost" id="pe-x">Cancel</button></div>`;
    $('#pe-pos').value = p.position || '';
    m.hidden = false; m.onclick = e => { if (e.target === m) close(); };
    $('#pe-x').onclick = close;
    $('#pe-file').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      run(async () => { ed.data = await resizeImage(f); ed.remove = false; $('#pe-av').innerHTML = avatar({ name: $('#pe-n').value || p.name || '?', photo: ed.data }, 76); });
    };
    $('#pe-rm').onclick = () => { ed.data = null; ed.remove = true; $('#pe-av').innerHTML = avatar({ name: $('#pe-n').value || p.name || '?', photo: '' }, 76); };
    const label = suggest ? 'Send for approval' : creating ? 'Add player' : 'Save changes';
    $('#pe-save').onclick = () => {
      const name = $('#pe-n').value.trim(); if (!name) return toast('Enter the player’s name', true);
      if (db.players.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) return toast('A player with that name already exists', true);
      if (suggest && pending.some(x => x.name.toLowerCase() === name.toLowerCase())) return toast('That player is already waiting for approval', true);
      let by = '';
      if (suggest) { by = $('#pe-by').value.trim(); if (!by) return toast('Choose your name from the list so the admin knows who suggested this player', true); lsSet('fc_by', by); }
      const sv = $('#pe-save'); sv.disabled = true; sv.textContent = 'Saving…';
      run(async () => {
        const f = { position: $('#pe-pos').value, photoData: ed.data, removePhoto: ed.remove };
        if (suggest) { await store.submitPlayer(name, Object.assign(f, { by })); close(); toast('Thanks! An admin will check this player before they appear on the site.'); return; }
        f.regular = $('#pe-reg').checked;
        if (creating) await store.addPlayer(name, f); else await store.updatePlayer(id, Object.assign({ name }, f));
        await reload(); close(); route(); toast(creating ? 'Player added' : 'Player saved');
      }).then(() => { sv.disabled = false; sv.textContent = label; });
    };
  }

  function viewPlayer(id) {
    const p = db.players.find(x => x.id === id);
    if (!p) { $('#app').innerHTML = page('<p class="empty">Player not found. <a href="#/players" style="text-decoration:underline">Back to players</a></p>'); return; }
    const all = Stats.computeStats(db, 'all').find(s => s.id === id);
    const month = Stats.computeStats(db, 'month').find(s => s.id === id);
    const mine = db.matches.filter(m => db.lineups.some(l => l.match_id === m.id && l.player_id === id)).slice(0, 15);
    const rows = mine.map(m => {
      const l = db.lineups.find(x => x.match_id === m.id && x.player_id === id);
      const r = Stats.resultFor(l.team, m);
      const own = l.team === 'A' ? m.score_a : m.score_b, opp = l.team === 'A' ? m.score_b : m.score_a;
      return `<tr><td>${fmtDate(m.played_on)}</td><td><span class="fm ${r}">${r}</span></td><td>${own} – ${opp}</td><td>${l.goals}</td><td>${l.assists}</td></tr>`;
    }).join('');
    const cell = (v, k) => `<div><b>${v}</b><span>${k}</span></div>`;
    $('#app').innerHTML = page(`<a class="back" href="#/players">${CHEV}Players</a>
      <section class="phead">${avatar(p, 112)}<div style="flex:1;min-width:200px"><h1>${esc(p.name)}</h1>
        <div class="tags">${metaTags(p)}</div>
        <div class="pform">Last 5 ${dots(all.form) || '<span>No games yet</span>'}</div></div>
        <button class="ghost-light" id="editMe" style="background:transparent;border-color:rgba(255,255,255,.4)">${isAdmin() ? 'Edit player' : 'Update profile'}</button></section>
      <div class="strip">${cell(all.p, 'Games')}${cell(all.w, 'Wins')}${cell(all.d, 'Draws')}${cell(all.l, 'Losses')}${cell(all.winPct.toFixed(0) + '%', 'Win rate')}${cell(all.goals, 'Goals')}${cell(all.gpg.toFixed(2), 'Goals per game')}${cell(all.assists, 'Assists')}</div>
      <p class="muted" style="margin:14px 0 0">This month: ${month.p} games, ${month.w} wins, ${month.goals} goals.</p>
      <h2>Recent matches</h2>
      <div class="tablewrap"><table><thead><tr><th>Date</th><th>Result</th><th>Score</th><th>Goals</th><th>Assists</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted" style="text-align:center;padding:24px">No games yet.</td></tr>'}</tbody></table></div>`);
    $('#editMe').onclick = () => isAdmin() ? openPlayerEdit(id) : openProfileUpdate(id);
  }

  /* ---------------- Gallery ---------------- */

  const PLAY = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="rgba(14,27,44,.72)"/><path d="M9.5 7.5l7 4.5-7 4.5z" fill="#fff"/></svg>';
  const gcard = it => `<button class="gcard" data-g="${it.id}" aria-label="${esc(it.caption || (it.type === 'video' ? 'Video' : 'Photo'))}">${mediaThumb(it) ? `<img src="${esc(mediaThumb(it))}" alt="" loading="lazy" onerror="this.remove()">` : ''}${it.type === 'video' ? `<span class="play">${PLAY}</span>` : ''}${it.caption ? `<span class="gcap">${esc(it.caption)}</span>` : ''}</button>`;

  function openLightbox(list, idx) {
    if (idx < 0) return;
    let i = idx, x0 = null;
    const lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    document.body.appendChild(lb);
    const close = () => { document.removeEventListener('keydown', key); lb.remove(); };
    const go = d => { i = (i + d + list.length) % list.length; draw(); };
    const key = e => { if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); };
    function draw() {
      const it = list[i];
      lb.innerHTML = `<button class="lb-x" aria-label="Close">✕</button>
        ${list.length > 1 ? '<button class="lb-n prev" aria-label="Previous">‹</button><button class="lb-n next" aria-label="Next">›</button>' : ''}
        <div class="lb-stage">${it.type === 'photo' ? `<img src="${esc(mediaFull(it))}" alt="${esc(it.caption || 'Photo')}">` : `<iframe src="${esc(videoEmbed(it))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video"></iframe>`}</div>
        <div class="lb-cap"><div>${it.caption ? `<b>${esc(it.caption)}</b>` : ''}<span>Added by ${esc(it.added_by || 'a member')}${it.created ? ', ' + fmtDate(it.created) : ''}</span>${it.type === 'video' ? `<a href="${esc(videoLink(it))}" target="_blank" rel="noopener">Open the video in a new tab</a>` : ''}</div>${isAdmin() ? '<button class="danger small" id="lb-del">Delete</button>' : ''}</div>`;
      lb.querySelector('.lb-x').onclick = close;
      const p = lb.querySelector('.prev'), n = lb.querySelector('.next');
      if (p) { p.onclick = () => go(-1); n.onclick = () => go(1); }
      lb.onclick = e => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); };
      const st = lb.querySelector('.lb-stage');
      st.ontouchstart = e => { x0 = e.touches[0].clientX; };
      st.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50 && list.length > 1) go(dx < 0 ? 1 : -1); };
      const del = lb.querySelector('#lb-del');
      if (del) del.onclick = () => {
        if (!confirm('Delete this item from the gallery?')) return;
        run(async () => { await store.deleteMedia(it.id); await reload(); close(); route(); }, 'Deleted from the gallery');
      };
    }
    document.addEventListener('keydown', key);
    draw();
  }
  function bindGallery(list) {
    document.querySelectorAll('.gcard[data-g]').forEach(b => b.onclick = () => openLightbox(list, list.findIndex(x => x.id === +b.dataset.g)));
  }

  function openMediaAdd() {
    const admin = isAdmin();
    const st = { mode: 'photo', photos: [] };
    const m = $('#modal'), close = () => (m.hidden = true);
    $('#modalCard').innerHTML = `<h3>Add to the gallery</h3>
      ${admin ? '' : '<p class="muted" style="margin:-6px 0 14px">An admin checks every upload before it appears in the gallery.</p>'}
      
      <div id="ma-photo" class="f"><label for="ma-file">Choose up to 6 photos</label><input id="ma-file" type="file" accept="image/*" multiple><div id="ma-prev" class="ma-prev"></div></div>
      <div class="f"><label for="ma-cap">Caption (optional)</label><input id="ma-cap" maxlength="140"></div>
      ${admin ? '' : `<div class="f"><label for="ma-by">Your name</label>${nameSelect('ma-by', lsGet('fc_by'))}</div>`}
      <div class="row"><button id="ma-save">Add to gallery</button><button class="ghost" id="ma-x">Cancel</button></div>`;
    m.hidden = false; m.onclick = e => { if (e.target === m) close(); };
    $('#ma-x').onclick = close;
    $('#ma-file').onchange = e => {
      const files = [...e.target.files].slice(0, 6);
      $('#ma-prev').innerHTML = '<span class="muted">Preparing…</span>';
      run(async () => {
        st.photos = [];
        for (const f of files) st.photos.push(await fitImage(f, 1600));
        $('#ma-prev').innerHTML = st.photos.map(p => `<img src="${p}" alt="">`).join('');
      });
    };
    $('#ma-save').onclick = () => {
      const caption = $('#ma-cap').value.trim();
      const by = admin ? '' : $('#ma-by').value.trim();
      if (!admin && !by) return toast('Choose your name from the list', true);
      if (st.mode === 'photo' && !st.photos.length) return toast('Choose at least one photo', true);
      if (!admin) lsSet('fc_by', by);
      const sv = $('#ma-save'); sv.disabled = true;
      let pendingRes = false;
      run(async () => {
        for (let k = 0; k < st.photos.length; k++) { sv.textContent = `Uploading ${k + 1} of ${st.photos.length}…`; const r = await store.submitMedia({ kind: 'photo', photoData: st.photos[k], caption, by }); pendingRes = r.pending; }
        await reload(); close(); route();
        toast(pendingRes ? 'Thanks! An admin will check your upload before it appears in the gallery.' : 'Added to the gallery');
      }).then(() => { sv.disabled = false; sv.textContent = 'Add to gallery'; });
    };
  }

  function viewGallery() {
    const admin = isAdmin();
    const list = db.media.filter(x => x.type === 'photo');
    const pendBox = admin && pendingMed.length ? `<section class="pending"><h3>Waiting for approval (${pendingMed.length})</h3><div class="ggrid">${pendingMed.map(it => `<div class="gpend">${gcard(it)}<div class="gp-by muted">Added by ${esc(String(it.added_by || '').replace(/^Guest: /, '') || 'unknown')}</div><div class="row" style="gap:8px"><button class="small" data-gappr="${it.id}">Approve</button><button class="danger small" data-grej="${it.id}">Reject</button></div></div>`).join('')}</div></section>` : '';
    $('#app').innerHTML = page(`${ph('Gallery', `${db.media.length} ${db.media.length === 1 ? 'item' : 'items'} from the community`, '<button class="primary-btn" id="addMedia">Add photos</button>')}
      ${pendBox}
            ${list.length ? `<div class="ggrid">${list.map(gcard).join('')}</div>` : '<p class="empty">Nothing here yet. Add the first photo from this morning.</p>'}`);
    $('#addMedia').onclick = openMediaAdd;
    document.querySelectorAll('.ggrid > .gcard[data-g]').forEach(b => b.onclick = () => openLightbox(list, list.findIndex(x => x.id === +b.dataset.g)));
    document.querySelectorAll('.gpend .gcard[data-g]').forEach(b => b.onclick = () => openLightbox(pendingMed, pendingMed.findIndex(x => x.id === +b.dataset.g)));
    if (!admin) return;
    document.querySelectorAll('[data-gappr]').forEach(b => b.onclick = () => run(async () => { await store.approveMedia(+b.dataset.gappr); await reload(); viewGallery(); }, 'Approved'));
    document.querySelectorAll('[data-grej]').forEach(b => b.onclick = () => {
      if (!confirm('Reject this upload? It will be removed.')) return;
      run(async () => { await store.rejectMedia(+b.dataset.grej); await reload(); viewGallery(); }, 'Rejected');
    });
  }

  /* ---------------- Match form ---------------- */

  function newForm() { return { id: null, by: lsGet('fc_by'), played_on: todayISO(), score_a: 0, score_b: 0, notes: '', lineup: [], guests: [], touched: false }; }
  function formFromMatch(m) {
    return {
      id: m.id, played_on: m.played_on, score_a: m.score_a, score_b: m.score_b, notes: m.notes || '', touched: true,
      lineup: db.lineups.filter(l => l.match_id === m.id).map(l => ({ player_id: l.player_id, team: l.team, goals: l.goals || 0, assists: l.assists || 0 })),
      guests: (m.guests || []).map(g => ({ name: g.name, team: g.team, goals: g.goals || 0, assists: g.assists || 0 }))
    };
  }
  const sumGoals = t => F.lineup.concat(F.guests || []).filter(x => x.team === t).reduce((a, x) => a + x.goals, 0);

  function viewMatchForm() {
    if (F.id && !isAdmin() && !(isMember() && (db.matches.find(x => x.id === F.id) || {}).played_on === todayISO())) { $('#app').innerHTML = page(`<a class="back" href="#/matches">${CHEV}Matches</a>${ph('Admins only', 'Only an admin can edit this match. Use the Admin login button at the top of the page.')}`); return; }
    if (!F.id && !F.earlier && hasToday()) {
      const t = db.matches.find(m => m.played_on === todayISO());
      $('#app').innerHTML = page(`<a class="back" href="#/matches">${CHEV}Matches</a>${ph("Today's match is already added", 'Only one match can be recorded per day. You can still correct today’s match.')}
        <div class="row"><a class="btn primary" href="#/match/${t.id}/edit">Edit today's match</a><a class="btn ghost" href="#/match/earlier">Add an earlier day</a></div>`);
      return;
    }
    const used = new Set(F.lineup.map(x => x.player_id));
    const avail = db.players.filter(p => !used.has(p.id));
    const box = t => {
      const rows = F.lineup.filter(x => x.team === t).map(x => `<div class="pl-row">
        <span>${esc(pname(x.player_id))}</span>
        <input type="number" inputmode="numeric" min="0" data-f="goals" data-pid="${x.player_id}" value="${x.goals}" aria-label="Goals for ${esc(pname(x.player_id))}">
        <input type="number" inputmode="numeric" min="0" data-f="assists" data-pid="${x.player_id}" value="${x.assists}" aria-label="Assists for ${esc(pname(x.player_id))}">
        <button class="x" data-rm="${x.player_id}" aria-label="Remove ${esc(pname(x.player_id))}">✕</button></div>`).join('');
      const grows = (F.guests || []).map((g, gi) => ({ g, gi })).filter(o => o.g.team === t).map(({ g, gi }) => `<div class="pl-row">
        <input data-gname="${gi}" value="${esc(g.name)}" maxlength="40" placeholder="Guest name" aria-label="Guest name">
        <input type="number" inputmode="numeric" min="0" data-gf="goals" data-gi="${gi}" value="${g.goals}" aria-label="Goals for guest">
        <input type="number" inputmode="numeric" min="0" data-gf="assists" data-gi="${gi}" value="${g.assists}" aria-label="Assists for guest">
        <button class="x" data-rmg="${gi}" aria-label="Remove guest">✕</button></div>
        <button class="linkbtn gsug" data-sug="${gi}" ${g.suggested ? 'disabled' : ''}>${g.suggested ? 'Sent to admin' : isAdmin() ? 'Add to the player list' : 'Suggest for the player list'}</button>`).join('');
      return `<div class="pick ${t.toLowerCase()}"><div class="pick-h"><h3>Team ${t}</h3><span class="spacer"></span>
          <label for="sc-${t}">Score</label><input type="number" inputmode="numeric" min="0" id="sc-${t}" value="${t === 'A' ? F.score_a : F.score_b}"></div>
        <div class="pick-b"><div class="pl-row pl-head"><span>Player</span><span>Goals</span><span>Assists</span><span></span></div>${rows + grows || '<p class="muted" style="margin:6px 0 10px">No players yet.</p>'}
        <div class="add-row"><div class="combo"><input data-combo="avail" data-team="${t}" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Type a player’s name" aria-label="Add a player to Team ${t}"></div><button class="ghost" data-addg="${t}" ${(F.guests || []).length >= 6 ? 'disabled' : ''}>Add guest</button></div>
        ${isAdmin() ? `<div class="add-row"><input data-newname="${t}" placeholder="New player name" maxlength="40"><button class="ghost" data-newbtn="${t}">Add</button></div>` : ''}</div></div>`;
    };
    const ms = F.id ? [] : missingDays(10, 0);
    $('#app').innerHTML = page(`<a class="back" href="#/matches">${CHEV}Matches</a>${ph(F.id ? 'Edit match' : 'Add match', 'Pick who played on each team and enter goals. Scores fill in from the goals, and you can change them (for example, for own goals).')}
      ${ms.length ? `<div class="chips"><span class="muted">Days with no match</span>${ms.map(d => `<button class="ghost small" data-day="${d}">${d === todayISO() ? 'Today' : fmtDate(d).replace(/, \d{4}$/, '')}</button>`).join('')}</div>` : ''}
      <div class="row" style="margin-bottom:18px;align-items:flex-end">${isAdmin() ? '' : `<div style="flex:1;min-width:180px"><label for="f-by">Your name</label>${nameSelect('f-by', F.by || '')}</div>`}
        <div><label for="f-date">Date</label><input type="date" id="f-date" ${isAdmin() ? '' : `min="${isoShift(30)}"`} ${F.id && !isAdmin() ? 'disabled' : ''} max="${todayISO()}" value="${F.played_on}"></div>
        <div style="flex:1;min-width:200px"><label for="f-notes">Notes (optional)</label><input id="f-notes" style="width:100%" value="${esc(F.notes)}" maxlength="200"></div></div>
      <p class="legend" id="f-note" style="margin:0 0 14px" ${isAdmin() || F.id || F.played_on >= todayISO() ? 'hidden' : ''}>This match is for an earlier day, so an admin checks it before it appears on the site.</p>
      <div class="form-grid">${box('A')}${box('B')}</div>
      <p class="legend" style="margin-top:14px">Someone who is not a regular player? Use Add guest. Guests show on the match but do not count in player stats.</p>
      ${isAdmin() ? '' : '<p class="legend" style="margin-top:14px">Player not on the list? <a href="#/players" style="text-decoration:underline;font-weight:600">Suggest a new player</a>. An admin approves new players before they can be added to a match.</p>'}
      <div class="savebar"><button class="primary btn" id="save" style="background:var(--orange);color:var(--ink)">${F.id ? 'Save changes' : 'Save match'}</button><a href="#/matches" class="muted" style="font-weight:600">Cancel</a></div>`);

    const syncNote = () => { const n = $('#f-note'); if (n) n.hidden = isAdmin() || !!F.id || F.played_on >= todayISO(); };
    $('#f-date').oninput = e => { F.played_on = e.target.value; syncNote(); };
    document.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { F.played_on = b.dataset.day; $('#f-date').value = F.played_on; syncNote(); });
    $('#f-notes').oninput = e => (F.notes = e.target.value);
    if ($('#f-by')) $('#f-by').oninput = e => (F.by = e.target.value);
    ['A', 'B'].forEach(t => {
      $('#sc-' + t).oninput = e => { F.touched = true; F['score_' + t.toLowerCase()] = num(e.target.value); };
      const addNew = () => {
        const inp = document.querySelector(`[data-newname="${t}"]`); const name = inp.value.trim(); if (!name) return;
        const ex = db.players.find(p => p.name.toLowerCase() === name.toLowerCase());
        run(async () => {
          const p = ex || await store.addPlayer(name);
          if (!ex) db.players.push(p);
          if (!F.lineup.some(x => x.player_id === p.id)) F.lineup.push({ player_id: p.id, team: t, goals: 0, assists: 0 });
          viewMatchForm();
        });
      };
      if (isAdmin()) {
        document.querySelector(`[data-newbtn="${t}"]`).onclick = addNew;
        document.querySelector(`[data-newname="${t}"]`).onkeydown = e => { if (e.key === 'Enter') addNew(); };
      }
    });
    document.querySelectorAll('input[data-f]').forEach(inp => inp.oninput = () => {
      const x = F.lineup.find(l => l.player_id === +inp.dataset.pid); x[inp.dataset.f] = num(inp.value);
      if (!F.touched) { F.score_a = sumGoals('A'); F.score_b = sumGoals('B'); $('#sc-A').value = F.score_a; $('#sc-B').value = F.score_b; }
    });
    document.querySelectorAll('[data-addg]').forEach(b => b.onclick = () => { F.guests.push({ name: '', team: b.dataset.addg, goals: 0, assists: 0 }); viewMatchForm(); const n = document.querySelectorAll('[data-gname]'); if (n.length) n[n.length - 1].focus(); });
    document.querySelectorAll('[data-gname]').forEach(i => i.oninput = () => { F.guests[+i.dataset.gname].name = i.value; });
    document.querySelectorAll('input[data-gf]').forEach(inp => inp.oninput = () => {
      F.guests[+inp.dataset.gi][inp.dataset.gf] = num(inp.value);
      if (!F.touched) { F.score_a = sumGoals('A'); F.score_b = sumGoals('B'); $('#sc-A').value = F.score_a; $('#sc-B').value = F.score_b; }
    });
    document.querySelectorAll('[data-sug]').forEach(b => b.onclick = () => {
      const g = F.guests[+b.dataset.sug], name = String(g.name || '').trim();
      if (!name) return toast('Type the guest’s name first', true);
      if (db.players.concat(pending).some(p => p.name.toLowerCase() === name.toLowerCase())) return toast(`${name} is already on the player list or waiting for approval`, true);
      if (!isAdmin() && !String(F.by || '').trim()) return toast('Choose your name at the top first', true);
      run(async () => {
        if (isAdmin()) {
          const p = await store.addPlayer(name); db.players.push(p);
          F.lineup.push({ player_id: p.id, team: g.team, goals: g.goals, assists: g.assists }); F.guests.splice(+b.dataset.sug, 1);
          viewMatchForm();
        } else {
          await store.submitPlayer(name, { by: String(F.by).trim() }); g.suggested = true; viewMatchForm();
        }
      }, isAdmin() ? `${name} added to the player list` : 'Sent. An admin will approve them, then their games count in the stats.');
    });
    document.querySelectorAll('[data-rmg]').forEach(b => b.onclick = () => { F.guests.splice(+b.dataset.rmg, 1); viewMatchForm(); });
    document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      F.lineup = F.lineup.filter(l => l.player_id !== +b.dataset.rm); viewMatchForm();
    });
    $('#save').onclick = () => {
      const sv = $('#save');
      if (!isAdmin() && !String(F.by || '').trim()) return toast('Enter your name so we know who added this match', true);
      if (!F.played_on) return toast('Pick a date', true);
      if (F.played_on > todayISO()) return toast("The date can't be in the future", true);
      if (db.matches.concat(pendingM).some(m => m.played_on === F.played_on && m.id !== F.id)) return toast(`A match for ${fmtDate(F.played_on)} is already added or waiting for approval.`, true);
      const sides = F.lineup.concat(F.guests);
      if (!sides.some(x => x.team === 'A') || !sides.some(x => x.team === 'B')) return toast('Add at least one player to each team', true);
      F.guests.forEach(g => { g.name = String(g.name || '').trim() || 'Guest'; });
      sv.disabled = true; sv.textContent = 'Saving…';
      run(async () => {
        const res = await store.saveMatch({ id: F.id, played_on: F.played_on, score_a: F.score_a, score_b: F.score_b, notes: F.notes.trim(), lineup: F.lineup, guests: F.guests, by: String(F.by || '').trim() });
        if (!isAdmin()) lsSet('fc_by', String(F.by || '').trim());
        await reload(); F = null; location.hash = '#/matches';
        toast(res && res.pending ? 'Thanks! An admin will check this match before it appears on the site.' : 'Match saved');
      }).then(() => { sv.disabled = false; sv.textContent = F && F.id ? 'Save changes' : 'Save match'; });
    };
  }

  /* ---------------- Auth UI ---------------- */

  function renderAuth() {
    document.body.classList.toggle('is-admin', isAdmin());
    const box = $('#authBox');
    if (user) {
      box.innerHTML = `<span class="who">${esc(user.email)}</span><button class="ghost small" id="logout">Log out</button>`;
      $('#logout').onclick = () => store.signOut();
    } else {
      box.innerHTML = '<button class="ghost small" id="login">Admin login</button>';
      $('#login').onclick = openLogin;
    }
    const fl = $('#footLogin'); if (fl) fl.onclick = e => { e.preventDefault(); openLogin(); };
    const fi = $('#footInfo'); if (fi) fi.textContent = (window.CONFIG && CONFIG.SITE_NAME) || '';
  }
  function openLogin() {
    const m = $('#modal'); $('#modalCard').innerHTML = `<h3>Admin login</h3>
      <div class="f"><label for="lg-p">Admin passcode</label><input id="lg-p" type="password" autocomplete="current-password"></div>
      <div class="row"><button id="lg-go">Log in</button><button class="ghost" id="lg-x">Cancel</button></div>`;
    m.hidden = false; $('#lg-p').focus();
    const close = () => (m.hidden = true);
    $('#lg-x').onclick = close;
    const go = () => run(async () => { await store.signIn('', $('#lg-p').value.trim()); close(); }, 'Logged in as admin');
    $('#lg-go').onclick = go; $('#lg-p').onkeydown = e => { if (e.key === 'Enter') go(); };
    m.onclick = e => { if (e.target === m) close(); };
  }

  /* ---------------- Router ---------------- */

  function route() {
    document.body.classList.toggle('has-today', hasToday());
    updateBadge();
    const h = location.hash.replace(/^#/, '') || '/';
    document.querySelectorAll('#nav a').forEach(a => a.classList.remove('on'));
    const on = k => { const a = document.querySelector(`#nav a[data-r="${k}"]`); if (a) a.classList.add('on'); };
    let m;
    if (h === '/') { on('home'); viewLanding(); }
    else if (h === '/leaderboard') { on('leaderboard'); viewLeaderboard(); }
    else if (h === '/matches') { on('matches'); viewMatches(); }
    else if (h === '/players') { on('players'); viewPlayers(); }
    else if (h === '/gallery') { on('gallery'); viewGallery(); }
    else if ((m = h.match(/^\/player\/(\d+)$/))) { on('players'); viewPlayer(+m[1]); }
    else if (h === '/match/new') { on('new'); if (!F || F.id || F.earlier) F = newForm(); viewMatchForm(); }
    else if (h === '/match/earlier') {
      on('matches');
      if (!F || F.id || !F.earlier) { F = newForm(); F.earlier = true; F.played_on = missingDays(isAdmin() ? 60 : 14, 1)[0] || isoShift(1); }
      viewMatchForm();
    }
    else if ((m = h.match(/^\/match\/(\d+)\/edit$/))) {
      const mt = db.matches.find(x => x.id === +m[1]);
      if (!mt) { $('#app').innerHTML = page('<p class="empty">Match not found. <a href="#/matches" style="text-decoration:underline">Back to matches</a></p>'); return; }
      if (!F || F.id !== mt.id) F = formFromMatch(mt);
      viewMatchForm();
    } else { location.hash = '#/'; }
    window.scrollTo(0, 0);
  }

  /* ---------------- Boot ---------------- */

  async function boot() {
    $('#siteName').textContent = CFG.SITE_NAME || 'Football Community';
    document.title = CFG.SITE_NAME || 'Football Community';
    if (!LIVE) {
      const b = $('#demoBanner'); b.hidden = false;
      b.innerHTML = 'Preview with sample data. Admin login passcode: <b>admin</b>. Match passcode: <b>kickoff</b>. <a href="#" id="resetDemo">Reset demo data</a>';
      $('#resetDemo').onclick = e => { e.preventDefault(); store.reset(); };
    }
    try {
      user = await store.getUser();
      store.onAuth(async u => { user = u; renderAuth(); try { await reload(); } catch (e) { console.error(e); } route(); });
      renderAuth();
      await reload();
      route();
    } catch (e) {
      console.error(e);
      $('#app').innerHTML = `<div class="wrap page"><p class="empty"><b>The data could not be loaded.</b><br>${esc(e.message || '')}<br>If you just set this up, check SCRIPT_URL in config.js and that the Apps Script is deployed with access set to Anyone.</p></div>`;
    }
    window.addEventListener('hashchange', route);
  }
  boot();
})();
