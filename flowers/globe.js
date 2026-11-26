// Глобус с маршрутами, самолётами и кольцом цветов
window.Globe = (() => {
  'use strict';
  const RAD = Math.PI / 180;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPB = [30.3, 59.9];
  const COUNTRIES = [
    { id: 'ecuador', n: 'Эквадор', at: [-78.5, -1] },
    { id: 'colombia', n: 'Колумбия', at: [-74.5, 5], up: true },
    { id: 'kenya', n: 'Кения', at: [37.5, 0] },
    { id: 'netherlands', n: 'Голландия', at: [5.3, 52.2] },
    { id: 'italy', n: 'Италия', at: [12.5, 42.5] },
    { id: 'chile', n: 'Чили', at: [-71, -33] }
  ];
  const PLANE = new Path2D('M12 0 L8.5 1.4 L3 1.6 L-3 10.5 L-5.4 10.5 L-2.4 1.7 L-7.4 1.5 L-9.6 4.4 L-11.2 4.4 L-10 0 L-11.2 -4.4 L-9.6 -4.4 L-7.4 -1.5 L-2.4 -1.7 L-5.4 -10.5 L-3 -10.5 L3 -1.6 L8.5 -1.4 Z');
  const vec = ([lo, la]) => [Math.cos(la * RAD) * Math.sin(lo * RAD), Math.sin(la * RAD), Math.cos(la * RAD) * Math.cos(lo * RAD)];
  const slerp = (a, b, t) => {
    const d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) || 1e-6, s = Math.sin(d), p = Math.sin((1 - t) * d) / s, q = Math.sin(t * d) / s;
    return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q];
  };
  // маршруты считаются один раз: точки на дуге с подъёмом над поверхностью
  const ROUTES = COUNTRIES.map(c => Array.from({ length: 61 }, (_, i) => ({ p: slerp(vec(c.at), vec(SPB), i / 60), h: 1 + .07 * Math.sin(Math.PI * i / 60) })));

  function create(canvas, o) {
    const ctx = canvas.getContext('2d');
    const state = { lon: -32, lat: 20, w: 0, h: 0, touched: false, held: false };
    let land = null, hits = [], spin = 0, last = 0, cl, sl, cp, sp, v;
    fetch('../vendor/land-110m.json').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => { land = topojson.feature(j, 'land'); }).catch(() => {});
    const ortho = d3.geoOrthographic().clipAngle(90).precision(.5), pen = d3.geoPath(ortho, ctx), grid = d3.geoGraticule10();
    const resize = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      state.w = canvas.clientWidth; state.h = canvas.clientHeight;
      canvas.width = Math.round(state.w * d); canvas.height = Math.round(state.h * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const project = (p, h = 1) => {
      const x = p[0] * cl - p[2] * sl, z0 = p[2] * cl + p[0] * sl, y = p[1] * cp - z0 * sp, z = z0 * cp + p[1] * sp;
      return { x: v.x + x * v.r * h, y: v.y - y * v.r * h, z, front: z > 0 || Math.hypot(x, y) * h > 1 };
    };
    const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); };
    const dot = (p, r, color) => { circle(p.x, p.y, r); ctx.fillStyle = color; ctx.fill(); };
    const label = (x, y, text, color, size) => {
      ctx.font = `600 ${size}px 'Inter Tight', system-ui, sans-serif`;
      const w = ctx.measureText(text).width;
      if (x + w > state.w - 4) x -= w + 20;   // подпись не уезжает за край
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
    };
    function sphere() {
      const { x, y, r } = v;
      let g = ctx.createRadialGradient(x, y, r * .86, x, y, r * 1.36); g.addColorStop(0, 'rgba(90,150,255,.38)'); g.addColorStop(1, 'rgba(90,150,255,0)');
      circle(x, y, r * 1.36); ctx.fillStyle = g; ctx.fill();
      g = ctx.createRadialGradient(x - r * .4, y - r * .45, r * .1, x, y, r); g.addColorStop(0, '#1c4584'); g.addColorStop(1, '#08183a');
      circle(x, y, r); ctx.fillStyle = g; ctx.fill();
      ortho.rotate([-state.lon, -state.lat]).translate([x, y]).scale(r);
      ctx.beginPath(); pen(grid); ctx.strokeStyle = 'rgba(150,190,245,.16)'; ctx.lineWidth = 1; ctx.stroke();
      if (land) {
        g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.05); g.addColorStop(0, '#4c9e7c'); g.addColorStop(1, '#1d5547');
        ctx.beginPath(); pen(land); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(170,236,205,.55)'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      g = ctx.createRadialGradient(x - r * .28, y - r * .32, r * .35, x, y, r); g.addColorStop(0, 'rgba(2,8,22,0)'); g.addColorStop(1, 'rgba(2,8,22,.55)');
      circle(x, y, r); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(130,180,255,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
    function plane(path, u, size, main) {
      const n = path.length - 1;
      const at = t => { const x = Math.max(0, Math.min(.999, t)) * n, k = Math.floor(x), q = x - k, a = path[k], b = path[k + 1]; return { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, front: a.front && b.front }; };
      const p = at(u); if (!p.front) return;
      const ahead = at(u + .012), behind = at(u - .012), fade = Math.max(0, Math.min(1, u * 9, (1 - u) * 9)), tail = main ? .2 : .09;
      ctx.strokeStyle = '#fff';
      for (let k = 0; k < 12; k++) {
        const from = u - tail * k / 12; if (from <= 0) break;
        const a = at(from), b = at(u - tail * (k + 1) / 12); if (!a.front || !b.front) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineWidth = (main ? 4 : 2) * (1 - k / 12); ctx.globalAlpha = (main ? .75 : .35) * (1 - k / 12) * fade; ctx.stroke();
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(ahead.y - behind.y, ahead.x - behind.x));
      const k = Math.max(main ? 9 : 6, size) / 12 * (1 + .25 * Math.sin(Math.PI * u)); ctx.scale(k, k);
      ctx.globalAlpha = (main ? 1 : .6) * fade; if (main) { ctx.shadowColor = 'rgba(255,201,163,.95)'; ctx.shadowBlur = 12; }
      ctx.fillStyle = '#fff'; ctx.fill(PLANE); ctx.restore(); ctx.globalAlpha = 1;
    }
    // дальняя половина кольца рисуется до шара, ближняя — после
    function ring(near) {
      const list = o.ring(), n = list.length;
      list.forEach((item, k) => {
        const a = k / n * Math.PI * 2 + spin, z = Math.sin(a); if ((z >= 0) !== near) return;
        const q = 1 + z * .22, x = v.x + Math.cos(a) * v.r * 1.42, y = v.y + z * v.r * .52 + v.r * .22, size = v.r * .34 * q, im = item.image;
        if (!im.complete || !im.naturalWidth) return;
        ctx.globalAlpha = near ? 1 : .5; ctx.drawImage(im, x - size / 2, y - size / 2, size, size); ctx.globalAlpha = 1;
        if (near) hits.push({ x, y, r: Math.max(22, size / 2), run: () => o.pick(item.flower) });
      });
    }
    function frame(time) {
      requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(8, (time - (last || time)) / 16.7)); last = time;
      if (!calm) { spin += .0035 * dt; if (!state.touched) state.lon = -32 + 26 * Math.sin(time / 11000); }
      v = o.view(state.w, state.h);
      cl = Math.cos(state.lon * RAD); sl = Math.sin(state.lon * RAD); cp = Math.cos(state.lat * RAD); sp = Math.sin(state.lat * RAD);
      ctx.clearRect(0, 0, state.w, state.h); hits = [];
      if (v.r < 20) return;
      ring(false); sphere();
      const current = o.country(), wide = v.r > 150, paths = ROUTES.map(r => r.map(q => project(q.p, q.h)));
      COUNTRIES.forEach((c, k) => {
        const on = c.n === current;
        ctx.beginPath(); let down = false;
        for (const p of paths[k]) { if (!p.front) { down = false; continue; } if (down) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); down = true; }
        ctx.strokeStyle = on ? '#ffc9a3' : 'rgba(255,201,163,.24)'; ctx.lineWidth = on ? 2.5 : 1; ctx.setLineDash(on ? [] : [3, 5]); ctx.stroke(); ctx.setLineDash([]);
        const p = project(vec(c.at)); if (p.z <= 0) return;
        dot(p, on ? (wide ? 7 : 5) : (wide ? 4.5 : 3), on ? '#fff' : '#ffb3c4');
        hits.push({ x: p.x, y: p.y, r: 22, run: () => o.open(c) });
        if (on) label(p.x + 10, p.y + 4, c.n, '#fff', wide ? 14 : 12);
        else if (wide) label(p.x + 9, p.y + (c.up ? -8 : 4), c.n, 'rgba(255,255,255,.75)', 12);
      });
      const home = project(vec(SPB));
      if (home.z > 0) { dot(home, wide ? 7 : 5, '#ffc9a3'); label(home.x + 10, home.y + 1, 'Петербург', '#ffe2cc', wide ? 14 : 12); }
      COUNTRIES.forEach((c, k) => {
        if (c.n === current) [0, .5].forEach(s => plane(paths[k], calm ? .35 + s * .6 : (time / 6000 + s) % 1, v.r * .085, true));
        else plane(paths[k], calm ? .5 : (time / 11000 + k * .19) % 1, v.r * .045, false);
      });
      ring(true);
    }
    // поворот пальцем или мышью; короткое касание — нажатие
    let id = null, px = 0, py = 0, moved = 0;
    canvas.addEventListener('pointerdown', e => { if (id !== null || e.button) return; id = e.pointerId; px = e.clientX; py = e.clientY; moved = 0; state.held = true; try { canvas.setPointerCapture(id); } catch (err) { /* указатель уже отпущен */ } });
    canvas.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) { state.touched = true; state.lon -= dx * .25; state.lat = Math.max(-60, Math.min(70, state.lat + dy * .22)); }
    });
    const release = e => {
      if (e.pointerId !== id) return;
      id = null; state.held = false;
      if (moved > 8 || e.type !== 'pointerup') return;
      const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top;
      for (let i = hits.length - 1; i >= 0; i--) if (Math.hypot(hits[i].x - x, hits[i].y - y) < hits[i].r) { hits[i].run(); return; }
    };
    canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
    addEventListener('resize', resize); resize(); requestAnimationFrame(frame);
    return state;
  }
  return { create, COUNTRIES, calm };
})();
