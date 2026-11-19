/* Base fotorrealista: texturas procedurais, galpão industrial, luz de galpão, seleção de peças e rótulos (three.js r128) */
const W = (() => {
  const T = THREE;
  const LOW = /[?&]q=low/.test(location.search);
  const TS = LOW ? 256 : 512;

  /* ---------- ruído ---------- */
  function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  function vnoise(size, cells, rand) {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rand();
    const out = new Float32Array(size * size), k = cells / size;
    for (let y = 0; y < size; y++) {
      const fy = y * k, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * (3 - 2 * ty), y1 = (y0 + 1) % cells;
      for (let x = 0; x < size; x++) {
        const fx = x * k, x0 = Math.floor(fx), tx = fx - x0, sx = tx * tx * (3 - 2 * tx), x1 = (x0 + 1) % cells;
        const a = g[y0 * cells + x0], b = g[y0 * cells + x1], c = g[y1 * cells + x0], d = g[y1 * cells + x1];
        out[y * size + x] = a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy;
      }
    }
    return out;
  }
  function fbm(size, base, oct, seed) {
    const r = rng(seed), out = new Float32Array(size * size); let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) { const n = vnoise(size, base << o, r); for (let i = 0; i < out.length; i++) out[i] += n[i] * amp; tot += amp; amp *= 0.5; }
    for (let i = 0; i < out.length; i++) out[i] /= tot; return out;
  }
  function canvas(size, fn) { const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); fn(g, size); return c; }
  function fromPixels(size, px) { return canvas(size, (g) => { const im = g.createImageData(size, size); for (let i = 0; i < size * size; i++) { const p = px(i); im.data[i * 4] = p[0]; im.data[i * 4 + 1] = p[1]; im.data[i * 4 + 2] = p[2]; im.data[i * 4 + 3] = p[3] ?? 255; } g.putImageData(im, 0, 0); }); }
  function normalFrom(h, size, str) {
    return fromPixels(size, (i) => {
      const x = i % size, y = (i / size) | 0;
      const l = h[y * size + (x - 1 + size) % size], r = h[y * size + (x + 1) % size], u = h[((y - 1 + size) % size) * size + x], d = h[((y + 1) % size) * size + x];
      let nx = (l - r) * str, ny = (u - d) * str, nz = 1; const m = Math.hypot(nx, ny, nz); nx /= m; ny /= m; nz /= m;
      return [(nx * 0.5 + 0.5) * 255, (ny * 0.5 + 0.5) * 255, (nz * 0.5 + 0.5) * 255];
    });
  }
  const texCache = new WeakMap();
  function tex(c, repeat, srgb = true) {
    const key = (repeat ? repeat.join('x') : '1x1') + srgb; let m = texCache.get(c); if (!m) texCache.set(c, m = {}); if (m[key]) return m[key];
    const t = m[key] = new T.CanvasTexture(c); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    t.wrapS = t.wrapT = T.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
  }
  const hexRGB = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());

  /* ---------- conjuntos de textura ---------- */
  function concreteSet(tint = 0x8d8f8f, seed = 7) {
    return once('conc' + tint + seed, () => {
      const s = TS * 2 > 1024 ? 1024 : TS * 2, big = fbm(s, 3, 4, seed), fine = fbm(s, 64, 2, seed + 3), stain = fbm(s, 6, 3, seed + 9);
      const [r, g, b] = hexRGB(tint);
      const col = fromPixels(s, (i) => {
        let v = 0.78 + big[i] * 0.32 + (fine[i] - 0.5) * 0.22; const st = Math.max(0, stain[i] - 0.6) * 2.2; v *= 1 - st * 0.35;
        return [r * v, g * v, b * v * 0.98];
      });
      const g2 = col.getContext('2d'); const R = rng(seed + 21);
      g2.strokeStyle = 'rgba(20,20,20,.35)'; g2.lineWidth = 2; g2.strokeRect(0, 0, s, s);
      for (let k = 0; k < 4; k++) { g2.strokeStyle = 'rgba(30,30,30,.25)'; g2.lineWidth = 1; g2.beginPath(); let x = R() * s, y = R() * s; g2.moveTo(x, y); for (let j = 0; j < 14; j++) { x += (R() - 0.5) * 40; y += (R() - 0.3) * 30; g2.lineTo(x, y); } g2.stroke(); }
      for (let k = 0; k < 3; k++) { const x = R() * s, y = R() * s, rr = 30 + R() * 80; const gr = g2.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(25,22,18,.18)'); gr.addColorStop(1, 'rgba(25,22,18,0)'); g2.fillStyle = gr; g2.beginPath(); g2.arc(x, y, rr, 0, 7); g2.fill(); }
      const rough = fromPixels(s, (i) => { const v = 200 + (fine[i] - 0.5) * 60 - Math.max(0, stain[i] - 0.58) * 300; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = fine[i] * 0.6 + big[i] * 0.4;
      return { map: col, rough, normal: normalFrom(h, s, 3) };
    });
  }
  function paintSet(color, wear = 0.5, seed = 3) {
    return once('paint' + color + wear + seed, () => {
      const s = TS, n = fbm(s, 4, 5, seed), chip = fbm(s, 16, 3, seed + 5), grime = fbm(s, 2, 3, seed + 8);
      const [r, g, b] = hexRGB(color);
      const th = 1 - wear * 0.32;
      const col = fromPixels(s, (i) => {
        const y = ((i / s) | 0) / s; const v = 0.9 + n[i] * 0.16; const dirt = Math.pow(y, 3) * 0.35 * wear + grime[i] * 0.1;
        if (chip[i] > th + 0.12) return [72, 64, 58];
        if (chip[i] > th + 0.08) return [118, 84, 58];
        return [r * v * (1 - dirt), g * v * (1 - dirt), b * v * (1 - dirt * 1.1)];
      });
      const rough = fromPixels(s, (i) => { const v = chip[i] > th + 0.08 ? 235 : 120 + n[i] * 70; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = chip[i] > th + 0.08 ? 0 : 0.6 + n[i] * 0.05;
      return { map: col, rough, normal: normalFrom(h, s, 2.2) };
    });
  }
  function brushedSet(tint = 0xb8bcc0, seed = 11) {
    return once('br' + tint + seed, () => {
      const s = TS, R = rng(seed); const [r, g, b] = hexRGB(tint); const n = fbm(s, 4, 3, seed);
      const rows = new Float32Array(s); for (let y = 0; y < s; y++) rows[y] = R();
      const col = fromPixels(s, (i) => { const y = (i / s) | 0; const v = 0.86 + rows[y] * 0.1 + n[i] * 0.08; return [r * v, g * v, b * v]; });
      const rough = fromPixels(s, (i) => { const y = (i / s) | 0; const v = 70 + rows[y] * 60 + n[i] * 50; return [v, v, v]; });
      return { map: col, rough };
    });
  }
  function claddingSet(seed = 13) {
    return once('clad' + seed, () => {
      const s = TS, n = fbm(s, 6, 4, seed), d = fbm(s, 3, 3, seed + 2);
      const col = fromPixels(s, (i) => { const x = i % s, y = (i / s) | 0; const seam = (x % (s / 2) < 4) ? 0.7 : 1; const band = (y % (s / 8) < 2) ? 0.88 : 1; const v = (0.78 + n[i] * 0.18 - d[i] * 0.1) * seam * band; return [196 * v, 200 * v, 204 * v]; });
      const rough = fromPixels(s, (i) => { const v = 90 + n[i] * 80 + d[i] * 40; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) { const x = i % s; h[i] = (x % (s / 2) < 4) ? 0.2 : 0.6; }
      return { map: col, rough, normal: normalFrom(h, s, 2) };
    });
  }
  function corrugatedSet(color = 0x9aa3a8, seed = 17) {
    return once('corr' + color + seed, () => {
      const s = TS, n = fbm(s, 3, 4, seed), streak = fbm(s, 24, 2, seed + 1); const [r, g, b] = hexRGB(color);
      const col = fromPixels(s, (i) => { const x = i % s, y = (i / s) | 0; const rib = 0.95 + 0.05 * Math.sin(x / s * Math.PI * 12); const run = Math.max(0, streak[(i % s) + 0] - 0.55) * (y / s) * 0.8; const v = (0.8 + n[i] * 0.25) * rib * (1 - run); return [r * v, g * v, b * v]; });
      const rough = fromPixels(s, (i) => { const v = 130 + n[i] * 80; return [v, v, v]; });
      const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = 0.5 + 0.5 * Math.sin((i % s) / s * Math.PI * 12);
      return { map: col, rough, normal: normalFrom(h, s, 5) };
    });
  }
  function rubberSet(seed = 19) {
    return once('rub' + seed, () => { const s = TS, n = fbm(s, 32, 3, seed), w = fbm(s, 4, 3, seed + 3); const col = fromPixels(s, (i) => { const v = 30 + n[i] * 16 + w[i] * 10; return [v, v * 0.98, v * 0.96]; }); const rough = fromPixels(s, (i) => { const v = 200 + n[i] * 40; return [v, v, v]; }); return { map: col, rough }; });
  }
  function bauxiteSet(seed = 23) {
    return once('bx' + seed, () => { const s = TS, n = fbm(s, 24, 4, seed), b = fbm(s, 4, 3, seed + 1); const col = fromPixels(s, (i) => { const v = 0.6 + n[i] * 0.5 + b[i] * 0.2; return [128 * v, 62 * v, 38 * v]; }); const h = new Float32Array(s * s); for (let i = 0; i < h.length; i++) h[i] = n[i]; return { map: col, normal: normalFrom(h, s, 6) }; });
  }
  function gridAlpha(cells = 16) {
    return once('grid' + cells, () => canvas(256, (g, s) => { g.fillStyle = '#000'; g.fillRect(0, 0, s, s); g.strokeStyle = '#fff'; g.lineWidth = 3; const st = s / cells; for (let i = 0; i <= cells; i++) { g.beginPath(); g.moveTo(i * st, 0); g.lineTo(i * st + s / 2, s); g.stroke(); g.beginPath(); g.moveTo(i * st, 0); g.lineTo(i * st - s / 2, s); g.stroke(); } }));
  }

  /* ---------- materiais ---------- */
  const envI = { v: 0.55 };
  function std(o) { const m = new T.MeshStandardMaterial(o); m.envMapIntensity = o.envI ?? envI.v; return m; }
  const MAT = {
    concrete: (rep = [8, 8], tint, seed) => { const s = concreteSet(tint, seed); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(0.6, 0.6), roughness: 1, metalness: 0 }); },
    paint: (color, o = {}) => { const s = paintSet(color, o.wear ?? 0.5, o.seed ?? 3); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(0.5, 0.5), roughness: o.rough ?? 0.9, metalness: o.metal ?? 0.25, side: o.side ?? T.FrontSide }); },
    steel: (o = {}) => { const s = brushedSet(o.tint ?? 0xb8bcc0, o.seed ?? 11); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: o.rough ?? 1, metalness: o.metal ?? 0.9, envI: 0.9 }); },
    galv: (o = {}) => { const s = paintSet(0xa9adb0, 0.15, 31); const rep = o.rep || [1, 1]; return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: 0.8, metalness: 0.75, envI: 0.8 }); },
    clad: (rep = [1, 1]) => { const s = claddingSet(); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), roughness: 1, metalness: 0.85, envI: 0.9 }); },
    corr: (color, rep = [6, 1]) => { const s = corrugatedSet(color); return std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), normalMap: tex(s.normal, rep, false), normalScale: new T.Vector2(1, 1), roughness: 1, metalness: 0.45 }); },
    rubber: (rep = [1, 1]) => { const s = rubberSet(); const m = std({ map: tex(s.map, rep), roughnessMap: tex(s.rough, rep, false), roughness: 1, metalness: 0 }); return m; },
    bauxite: (rep = [1, 1]) => { const s = bauxiteSet(); return std({ map: tex(s.map, rep), normalMap: tex(s.normal, rep, false), roughness: 0.95, metalness: 0 }); },
    flat: (color, o = {}) => std({ color, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0.1, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side ?? T.FrontSide, depthWrite: o.depthWrite ?? true }),
    guard: (color = 0xd8a21c) => { const a = tex(gridAlpha(14), [3, 3], false); const s = paintSet(color, 0.35, 41); return std({ map: tex(s.map, [1, 1]), alphaMap: a, alphaTest: 0.5, transparent: false, side: T.DoubleSide, roughness: 0.7, metalness: 0.3 }); },
  };

  /* ---------- geometria ---------- */
  function mesh(geo, mat, o = {}) { const m = new T.Mesh(geo, mat); m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true; return m; }
  const rbox = (w, h, d, mat, r = 0.03, o) => mesh(new T.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), mat, o);
  const box = (w, h, d, mat, o) => mesh(new T.BoxGeometry(w, h, d), mat, o);
  const cyl = (r1, r2, h, mat, seg = 32, o, open) => mesh(new T.CylinderGeometry(r1, r2, h, seg, 1, !!open), mat, o);
  const cylX = (r, len, mat, seg = 32, o) => { const m = cyl(r, r, len, mat, seg, o); m.rotation.z = Math.PI / 2; return m; };
  const cylZ = (r, len, mat, seg = 32, o) => { const m = cyl(r, r, len, mat, seg, o); m.rotation.x = Math.PI / 2; return m; };
  const sphere = (r, mat, o, ws = 24, hs = 16) => mesh(new T.SphereGeometry(r, ws, hs), mat, o);
  const torus = (R, r, mat, arc = Math.PI * 2, o) => mesh(new T.TorusGeometry(R, r, 14, 48, arc), mat, o);
  const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };
  function ibeam(len, h, w, mat, axis = 'y') {
    const g = new T.Group(); const t = Math.max(0.03, h * 0.08);
    g.add(at(box(w, t, len, mat), 0, h / 2 - t / 2, 0)); g.add(at(box(w, t, len, mat), 0, -h / 2 + t / 2, 0)); g.add(box(t * 0.8, h - 2 * t, len, mat));
    if (axis === 'y') g.rotation.x = Math.PI / 2; if (axis === 'x') g.rotation.y = Math.PI / 2; return g;
  }
  function textPlate(lines, o = {}) {
    const w = o.w || 512, h = o.h || 160;
    const c = canvas(1, () => { }); c.width = w; c.height = h; const g = c.getContext('2d');
    g.fillStyle = o.bg || '#1b1f24'; g.fillRect(0, 0, w, h);
    if (o.border !== false) { g.strokeStyle = o.fg || '#f2f2f2'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); }
    g.fillStyle = o.fg || '#f2f2f2'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines]; const fs = o.size || Math.min(72, h / (L.length + 0.6));
    L.forEach((t, i) => { g.font = `${i === 0 ? 700 : 500} ${i === 0 ? fs : fs * 0.62}px "IBM Plex Mono", "DejaVu Sans Mono", monospace`; g.fillText(t, w / 2, h / 2 + (i - (L.length - 1) / 2) * fs * 0.95); });
    if (o.fade) { g.fillStyle = 'rgba(200,190,170,' + o.fade + ')'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * w, Math.random() * h, 4, 3); }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return std({ map: t, roughness: 0.5, metalness: 0.1 });
  }
  function plate(lines, pw, ph, o = {}) { const h = o.h || 160, w = o.w || Math.min(1024, Math.max(128, Math.round(h * pw / ph))); return mesh(new T.PlaneGeometry(pw, ph), textPlate(lines, Object.assign({}, o, { w, h })), { cast: false }); }
  function padlock(color = 0xd9531e, tag = true) {
    const g = new T.Group();
    g.add(rbox(0.11, 0.1, 0.05, MAT.flat(color, { rough: 0.35, metal: 0.2 }), 0.012));
    const sh = torus(0.034, 0.008, MAT.steel(), Math.PI); sh.position.y = 0.05; g.add(sh);
    if (tag) { const t = mesh(new T.PlaneGeometry(0.075, 0.13), textPlate(['PERIGO', 'NÃO OPERE'], { bg: '#b3261e', fg: '#ffffff', w: 192, h: 330, size: 46 }), { cast: true }); t.position.set(0.07, -0.08, 0.03); t.rotation.z = -0.12; g.add(t); }
    return g;
  }
  /* ---------- trabalhador ---------- */
  function lathe(pts, mat, seg = 18, o) { return mesh(new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg), mat, o); }
  function capsule(r1, r2, len, mat, seg = 16) { // de y=0 até y=-len
    const P = []; const n = 6;
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + i / n * Math.PI / 2; P.push([Math.max(0.0001, r1 * Math.cos(a)), -len + r1 + r1 * Math.sin(a)]); }
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI / 2; P.push([Math.max(0.0001, r2 * Math.cos(a)), -r2 + r2 * Math.sin(a)]); }
    return lathe(P, mat, seg);
  }
  function person(o = {}) {
    const g = new T.Group(); g.name = 'pessoa';
    const sc = o.suit ?? 0x2b3a55;
    const suit = MAT.paint(sc, { wear: 0.18, seed: 51, metal: 0, rough: 1, rep: [2, 2] });
    const suitD = MAT.paint(new T.Color(sc).multiplyScalar(0.72).getHex(), { wear: 0.15, seed: 52, metal: 0, rough: 1 });
    const L = (h) => new T.Color(h).convertSRGBToLinear().getHex();
    const skin = MAT.flat(L(o.skin ?? 0x8d5f43), { rough: 0.62, metal: 0 }); skin.envMapIntensity = 0.25;
    const refl = MAT.flat(0xc9ccce, { emissive: 0x9a9a9a, ei: 0.22, rough: 0.35, metal: 0.4 });
    const boot = MAT.flat(L(0x2a2018), { rough: 0.7, metal: 0 }), sole = MAT.flat(L(0x111111), { rough: 0.9 }); boot.envMapIntensity = 0.3;
    const glove = MAT.flat(L(o.glove ?? 0x8a6a3a), { rough: 0.9, metal: 0 }); glove.envMapIntensity = 0.25;
    const helmM = MAT.flat(L(o.helmet ?? 0xf0efe9), { rough: 0.35, metal: 0 });
    const belt = MAT.flat(0x1c1d1f, { rough: 0.6, metal: 0.2 });
    const band = (r, y, parent, sz = 1, h = 0.035) => { const b = cyl(r, r, h, refl, 20, { cast: false }); b.position.y = y; b.scale.z = sz; parent.add(b); };
    // pernas
    const legs = [];
    [-1, 1].forEach(s => {
      const hip = new T.Group(); hip.position.set(s * 0.095, 0, 0);
      hip.add(lathe([[0.001, 0.08], [0.06, 0.085], [0.063, 0.16], [0.066, 0.26], [0.07, 0.36], [0.066, 0.46], [0.07, 0.52], [0.08, 0.62], [0.088, 0.74], [0.094, 0.86], [0.09, 0.93], [0.06, 0.97], [0.001, 0.98]], suit, 20));
      band(0.068, 0.27, hip); band(0.07, 0.35, hip);
      hip.add(at(cyl(0.062, 0.066, 0.1, boot, 16), 0, 0.1, 0));
      hip.add(at(rbox(0.11, 0.09, 0.27, boot, 0.04), 0, 0.055, 0.045));
      hip.add(at(rbox(0.118, 0.025, 0.285, sole, 0.01), 0, 0.012, 0.045));
      hip.rotation.y = s * 0.08; hip.rotation.z = s * 0.012;
      g.add(hip); legs.push(hip);
    });
    // quadril e tronco
    const pel = lathe([[0.001, 0.86], [0.12, 0.865], [0.165, 0.9], [0.175, 0.98], [0.168, 1.04]], suit); pel.scale.z = 0.68; g.add(pel);
    const bl = cyl(0.172, 0.172, 0.05, belt, 24); bl.scale.z = 0.7; bl.position.y = 1.03; g.add(bl);
    g.add(at(rbox(0.07, 0.05, 0.02, MAT.steel(), 0.01), 0, 1.03, 0.122));
    const torso = lathe([[0.165, 1.04], [0.16, 1.1], [0.168, 1.2], [0.185, 1.3], [0.198, 1.38], [0.2, 1.44], [0.17, 1.49], [0.08, 1.53], [0.001, 1.54]], suit, 24);
    torso.scale.set(1.04, 1, 0.62); g.add(torso);
    [[0.183, 1.28], [0.194, 1.37]].forEach(([r, y]) => { const b = cyl(r + 0.004, r + 0.004, 0.04, refl, 24, { cast: false }); b.scale.set(1.04, 1, 0.62); b.position.y = y; g.add(b); });
    [-1, 1].forEach(s => { g.add(at(rbox(0.1, 0.11, 0.02, suitD, 0.01), s * 0.085, 1.32, 0.118)); g.add(at(box(0.1, 0.02, 0.022, suitD), s * 0.085, 1.38, 0.12)); });
    g.add(at(box(0.012, 0.42, 0.01, suitD), 0, 1.27, 0.122));
    const collar = cyl(0.068, 0.078, 0.05, suitD, 18); collar.position.y = 1.535; g.add(collar);
    // braços
    const arms = [], hands = [];
    [-1, 1].forEach(s => {
      const sh = new T.Group(); sh.position.set(s * 0.2, 1.46, 0);
      sh.add(capsule(0.05, 0.062, 0.31, suit));
      band(0.064, -0.13, sh);
      const el = new T.Group(); el.position.y = -0.29; sh.add(el);
      el.add(capsule(0.04, 0.05, 0.28, suit));
      band(0.051, -0.1, el);
      el.add(sphere(0.051, suit, undefined, 16, 12));
      const wr = new T.Group(); wr.position.y = -0.265; el.add(wr);
      wr.add(at(cyl(0.044, 0.04, 0.05, glove, 14), 0, 0, 0));
      wr.add(at(rbox(0.045, 0.1, 0.085, glove, 0.02), 0, -0.065, 0.008));
      const th = rbox(0.025, 0.06, 0.025, glove, 0.01); th.position.set(-s * 0.025, -0.05, 0.04); th.rotation.z = s * 0.4; wr.add(th);
      sh.rotation.z = s * 0.1; sh.rotation.x = 0.04; el.rotation.x = -0.28; wr.rotation.z = -s * 0.08;
      g.add(sh); arms.push(sh); hands.push(wr); sh.userData.elbow = el;
    });
    if (o.pose === 'hold') { arms[1].rotation.set(-0.35, 0, 0.12); arms[1].userData.elbow.rotation.x = -1.15; }
    if (o.pose === 'point') { arms[1].rotation.set(-1.2, 0, 0.15); arms[1].userData.elbow.rotation.x = -0.15; }
    // pescoço e cabeça
    g.add(at(cyl(0.048, 0.054, 0.1, skin, 16), 0, 1.58, 0.005));
    const head = new T.Group(); head.position.set(0, 1.7, 0.01); g.add(head);
    const skull = sphere(0.1, skin, undefined, 28, 20); skull.scale.set(0.9, 1.12, 1.0); head.add(skull);
    const jaw = sphere(0.075, skin, undefined, 20, 14); jaw.scale.set(1.0, 0.8, 1.0); jaw.position.set(0, -0.06, 0.018); head.add(jaw);
    const nose = cyl(0.0, 0.016, 0.04, skin, 10); nose.rotation.x = Math.PI / 2 + 0.25; nose.position.set(0, -0.005, 0.108); head.add(nose);
    [-1, 1].forEach(s => { const e = sphere(0.022, skin, undefined, 10, 8); e.scale.set(0.5, 1, 0.8); e.position.set(s * 0.09, -0.005, -0.005); head.add(e); });
    const brow = box(0.12, 0.012, 0.02, MAT.flat(0x2a1d16, { rough: 0.9 })); brow.position.set(0, 0.035, 0.095); head.add(brow);
    // óculos de segurança
    const lens = mesh(new T.CylinderGeometry(0.105, 0.105, 0.04, 28, 1, true, -0.95, 1.9), MAT.flat(0x1e2a33, { rough: 0.05, metal: 0.5, opacity: 0.82, side: T.DoubleSide }), { cast: false });
    lens.scale.set(0.95, 1, 1); lens.position.set(0, 0.012, 0.0); head.add(lens);
    const arm1 = box(0.006, 0.008, 0.1, MAT.flat(0x1b1b1b)); arm1.position.set(-0.088, 0.015, -0.035); head.add(arm1); const arm2 = arm1.clone(); arm2.position.x = 0.088; head.add(arm2);
    // capacete com aba
    const shell = lathe([[0.001, 0.145], [0.05, 0.142], [0.09, 0.125], [0.118, 0.09], [0.128, 0.05], [0.13, 0.03]], helmM, 28); shell.scale.set(1, 1, 1.12); shell.position.y = 0.0; head.add(shell);
    const ridge = box(0.02, 0.025, 0.25, helmM); ridge.position.set(0, 0.145, 0); head.add(ridge);
    const brim = mesh(new T.RingGeometry(0.12, 0.175, 32, 1, -Math.PI * 0.05, Math.PI * 1.1), helmM); brim.rotation.x = -Math.PI / 2 + 0.12; brim.position.set(0, 0.03, 0.025); brim.scale.set(1, 1.15, 1); brim.material.side = T.DoubleSide; head.add(brim);
    const rim = torus(0.13, 0.008, helmM); rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.12, 1); rim.position.y = 0.03; head.add(rim);
    const strap = torus(0.095, 0.004, MAT.flat(0x222222), Math.PI); strap.rotation.set(0, Math.PI / 2, Math.PI); strap.position.set(0, -0.02, 0); head.add(strap);
    head.rotation.x = 0.04; head.rotation.y = o.look ?? 0;
    g.userData.arms = arms; g.userData.hands = hands; g.userData.head = head;
    // respiração e olhar leve
    g.userData.ph = Math.random() * 6;
    g.onBeforeRender = () => { };
    PEOPLE.push(g);
    return g;
  }
  const PEOPLE = [];
  function animPeople(t) { PEOPLE.forEach(p => { const ph = p.userData.ph; p.userData.head.rotation.y = (p.userData.look0 ??= p.userData.head.rotation.y) + Math.sin(t * 0.35 + ph) * 0.18; p.children.forEach(c => { }); }); }

  /* ---------- cena ---------- */
  function create(el, o) {
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure ?? 0.78;
    el.appendChild(renderer.domElement);
    const ov = document.createElement('div'); ov.className = 'v-ov'; el.appendChild(ov);
    const scene = new T.Scene(); const bg = new T.Color(o.bg ?? 0x1b2026); scene.background = bg; scene.fog = new T.Fog(o.fog ?? o.bg ?? 0x1b2026, o.fogNear ?? 22, o.fogFar ?? 75);
    const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture; envI.v = o.env ?? 0.42;
    const camera = new T.PerspectiveCamera(o.fov ?? 40, 1.6, 0.1, 300); camera.position.set(...o.cam);
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.target.set(...o.target); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false;
    controls.maxPolarAngle = o.maxPolar ?? 1.45; controls.minDistance = o.minD ?? 3; controls.maxDistance = o.maxD ?? 26;
    scene.add(new T.HemisphereLight(o.sky ?? 0xbcc8d6, o.gnd ?? 0x3a332c, o.hemi ?? 0.28));
    const sun = new T.DirectionalLight(o.sunColor ?? 0xffe2bd, o.sunI ?? 3.0); sun.position.set(...(o.sun ?? [10, 16, 6])); sun.castShadow = true;
    sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048); const sc = o.shadowSize ?? 14;
    Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 1, far: 70 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    sun.target.position.set(...o.target); scene.add(sun); scene.add(sun.target);
    const labels = [], ticks = [], v = new T.Vector3(); let sideW = 0;
    function resize() {
      const w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h); camera.aspect = w / h;
      sideW = o.side ? o.side() : 0;
      if (sideW > 0 && w > 760) camera.setViewOffset(w + sideW, h, sideW, 0, w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(el); window.addEventListener('resize', resize); resize();
    let tween = null;
    function focus(p, dist) {
      const to = new T.Vector3(...p); const dir = new T.Vector3(...o.cam).sub(to); dir.y = Math.max(dir.y, dir.length() * 0.25); dir.normalize();
      const d = dist ?? Math.min(camera.position.distanceTo(controls.target), 9);
      tween = { t: 0, fT: controls.target.clone(), tT: to, fC: camera.position.clone(), tC: to.clone().add(dir.multiplyScalar(d)) };
    }
    function home() { tween = { t: 0, fT: controls.target.clone(), tT: new T.Vector3(...o.target), fC: camera.position.clone(), tC: new T.Vector3(...o.cam) }; }
    let last = performance.now(), paused = false;
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (tween) { tween.t = Math.min(1, tween.t + dt / 0.9); const e = 1 - Math.pow(1 - tween.t, 3); controls.target.lerpVectors(tween.fT, tween.tT, e); camera.position.lerpVectors(tween.fC, tween.tC, e); if (tween.t >= 1) tween = null; }
      ticks.forEach(f => f(dt, now / 1000)); animPeople(now / 1000);
      controls.update(); if (!paused) renderer.render(scene, camera);
      const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
      labels.forEach(L => {
        if (L.obj) L.obj.getWorldPosition(v).add(L.off); else v.copy(L.pos);
        v.project(camera); const hide = v.z > 1 || L.hidden || ctx.hideLabels && !L.always;
        L.el.style.display = hide ? 'none' : '';
        if (!hide) L.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px,${(-v.y * 0.5 + 0.5) * h}px)`;
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    /* seleção */
    const ray = new T.Raycaster(), ptr = new T.Vector2(); let down = null; const pickCbs = [], hits = {};
    function pickAt(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      for (const hh of ray.intersectObjects(scene.children, true)) {
        let vis = true, w = hh.object; while (w) { if (w.visible === false) { vis = false; break; } w = w.parent; }
        if (!vis || hh.object.userData.through) continue;
        let ob = hh.object; while (ob && !ob.userData.hit) ob = ob.parent;
        return ob ? ob.userData.hit : null;
      }
      return null;
    }
    let hover = null, lastMove = 0;
    function setGlow(id, on) { (hits[id] || []).forEach(g => g.traverse(m => { if (m.isMesh && m.material && m.material.emissive) { if (on) { m.userData.e0 = m.userData.e0 ?? m.material.emissive.getHex(); m.material.emissive.setHex(0x3a4f66); } else if (m.userData.e0 !== undefined) m.material.emissive.setHex(m.userData.e0); } })); }
    renderer.domElement.addEventListener('pointermove', e => {
      const n = performance.now(); if (n - lastMove < 60) return; lastMove = n;
      const id = pickAt(e); if (id !== hover) { if (hover) setGlow(hover, false); hover = id; if (id) setGlow(id, true); renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; ctx.onHover && ctx.onHover(id); }
    });
    renderer.domElement.addEventListener('pointerleave', () => { if (hover) setGlow(hover, false); hover = null; ctx.onHover && ctx.onHover(null); });
    renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      const id = pickAt(e); pickCbs.forEach(cb => cb(id, e));
    });
    renderer.domElement.style.cursor = 'grab';
    const ctx = {
      T, scene, camera, renderer, controls, el, ov, sun, focus, home, hideLabels: false,
      tick: f => ticks.push(f), onPick: cb => pickCbs.push(cb), pause: p => { paused = p; },
      hit(group, id) {
        group.traverse(m => { if (m.isMesh && m.material) m.material = m.material.clone(); });
        group.userData.hit = id; (hits[id] = hits[id] || []).push(group); if (!group.parent) scene.add(group); return group;
      },
      glow: setGlow,
      label(opt) {
        const elL = document.createElement('div'); elL.className = 'v-tag ' + (opt.cls || ''); elL.innerHTML = opt.html || '';
        if (opt.onClick) { elL.style.pointerEvents = 'auto'; elL.style.cursor = 'pointer'; elL.addEventListener('click', e => { e.stopPropagation(); opt.onClick(); }); }
        ov.appendChild(elL);
        const L = { el: elL, obj: opt.obj || null, off: new T.Vector3(...(opt.off || [0, 0, 0])), pos: new T.Vector3(...(opt.pos || [0, 0, 0])), hidden: !!opt.hidden, always: !!opt.always };
        labels.push(L); return L;
      },
      resize,
    };
    window.__w = ctx;
    return ctx;
  }

  /* ---------- galpão ---------- */
  function shed(ctx, o = {}) {
    const { scene } = ctx; const w = o.w ?? 40, d = o.d ?? 28, h = o.h ?? 11, z0 = o.z0 ?? -10;
    const floor = mesh(new T.PlaneGeometry(w + 30, d + 30), MAT.concrete([(w + 30) / 9, (d + 30) / 9], o.floorTint ?? 0x767774, o.seed ?? 7), { cast: false });
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const colM = MAT.paint(o.steel ?? 0x56616b, { wear: 0.35, seed: 61, rep: [1, 4] });
    const wallM = MAT.corr(o.wall ?? 0x8e979c, [w / 4, 1]);
    if (!o.noBack) {
      const back = mesh(new T.PlaneGeometry(w, h), wallM, { cast: false }); at(back, 0, h / 2, z0); scene.add(back);
      const plinth = box(w, 1.2, 0.3, MAT.concrete([w / 4, 0.3], 0x7d7f7e, 9)); at(plinth, 0, 0.6, z0 + 0.15); scene.add(plinth);
      if (o.windows !== false) {
        const win = mesh(new T.PlaneGeometry(w * 0.9, 1.4), MAT.flat(0xeef3f7, { emissive: 0xdfe8f0, ei: o.winI ?? 1.4, rough: 0.2 }), { cast: false }); at(win, 0, h - 1.8, z0 + 0.02); scene.add(win);
        for (let x = -w * 0.45; x <= w * 0.45; x += 2.4) scene.add(at(box(0.08, 1.45, 0.06, colM), x, h - 1.8, z0 + 0.05));
      }
    }
    if (!o.noSides) [-w / 2, w / 2].forEach(x => { const s = mesh(new T.PlaneGeometry(d, h), wallM.clone(), { cast: false }); s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; at(s, x, h / 2, z0 + d / 2); scene.add(s); });
    for (let x = -w / 2 + 2; x <= w / 2 - 2; x += o.bay ?? 6) {
      const c = ibeam(h, 0.5, 0.3, colM, 'y'); at(c, x, h / 2, z0 + 0.5); scene.add(c);
      const tr = ibeam(d, 0.6, 0.25, colM, 'z'); at(tr, x, h + 0.3, z0 + d / 2); scene.add(tr);
      const li = Math.round((x + w / 2 - 2) / (o.bay ?? 6));
      if (!o.noLights) {
        const lamp = new T.Group(); lamp.add(cyl(0.32, 0.45, 0.35, MAT.paint(0x3c4247, { wear: 0.2 }), 24)); const lens = cyl(0.42, 0.42, 0.02, MAT.flat(0xfff3dd, { emissive: 0xfff1d6, ei: 2.2 }), 24, { cast: false }); lens.position.y = -0.18; lamp.add(lens);
        lamp.add(at(cyl(0.01, 0.01, 1.2, MAT.steel(), 6), 0, 0.75, 0)); at(lamp, x, h - 1, z0 + d * 0.45); scene.add(lamp);
        if (li % 2 === 1 && !LOW) { const pl = new T.PointLight(o.lampColor ?? 0xffe6c4, o.lampI ?? 0.9, 22, 1.4); pl.position.set(x, h - 1.4, z0 + d * 0.45); scene.add(pl); }
      }
    }
    if (o.roof !== false) { const roof = mesh(new T.PlaneGeometry(w, d), MAT.corr(0x6b7277, [w / 2.4, 1]), { cast: false }); roof.rotation.x = Math.PI / 2; at(roof, 0, h + 0.62, z0 + d / 2); roof.material.side = T.DoubleSide; scene.add(roof); }
  }
  function floorLine(ctx, x, z, len, rot = 0, color = 0xd9a21c, wid = 0.1) {
    const m = MAT.paint(color, { wear: 0.9, seed: 71, rough: 0.8, metal: 0 }); m.transparent = false;
    const p = mesh(new T.PlaneGeometry(len, wid), m, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = rot; at(p, x, 0.006, z); ctx.scene.add(p); return p;
  }
  function beams(ctx, list) {
    const c = canvas(64, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, 'rgba(255,240,215,.22)'); gr.addColorStop(1, 'rgba(255,240,215,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
    const t = new T.CanvasTexture(c);
    list.forEach(([x, y, z, w, h, ry, rx]) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false })); m.position.set(x, y, z); m.rotation.set(rx ?? -0.5, ry ?? 0, 0); m.userData.through = true; ctx.scene.add(m); });
  }
  function dust(ctx, n = 350, area = [30, 8, 20], color = 0xfff1dc, center = [0, 3, 0]) {
    const g = new T.BufferGeometry(); const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { p[i * 3] = center[0] + (Math.random() - 0.5) * area[0]; p[i * 3 + 1] = center[1] + Math.random() * area[1]; p[i * 3 + 2] = center[2] + (Math.random() - 0.5) * area[2]; }
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    const spr = new T.CanvasTexture(canvas(32, (c, s) => { const gr = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, s, s); }));
    const pts = new T.Points(g, new T.PointsMaterial({ color, size: 0.05, map: spr, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending }));
    pts.userData.through = true; ctx.scene.add(pts);
    ctx.tick((dt) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3 + 1] += dt * 0.05 * ((i % 5) - 2) * 0.3; a[i * 3] += dt * 0.04; if (a[i * 3] > center[0] + area[0] / 2) a[i * 3] -= area[0]; if (a[i * 3 + 1] > center[1] + area[1]) a[i * 3 + 1] = center[1]; if (a[i * 3 + 1] < center[1]) a[i * 3 + 1] = center[1] + area[1]; } g.attributes.position.needsUpdate = true; });
  }
  function steam(ctx, x, y, z, n = 18, spread = 0.4) {
    const tx = new T.CanvasTexture(canvas(64, (c, s) => { const gr = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, s, s); }));
    const list = []; const grp = new T.Group(); grp.userData.through = true;
    for (let i = 0; i < n; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.4, color: 0xeef2f5 })); sp.userData = { ph: Math.random(), dx: (Math.random() - 0.5) * spread, through: true }; grp.add(sp); list.push(sp); }
    ctx.scene.add(grp); const st = { on: true, rate: 1 };
    ctx.tick((dt, t) => { grp.visible = st.on; list.forEach(s => { const p = (t * 0.28 * st.rate + s.userData.ph) % 1; s.position.set(x + s.userData.dx + p * 0.6, y + p * 2.2, z + Math.sin(t + s.userData.ph * 9) * 0.15); s.scale.setScalar(0.3 + p * 1.4); s.material.opacity = 0.45 * (1 - p) * Math.min(1, p * 6); }); });
    return st;
  }

  return { create, shed, floorLine, beams, dust, steam, MAT, mesh, rbox, box, cyl, cylX, cylZ, sphere, torus, at, ibeam, plate, textPlate, padlock, person, LOW };
})();
