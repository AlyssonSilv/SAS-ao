/* Cenas 3D das situações: casa de bombas (Refinaria), ponte rolante (Redução) e correia transportadora (Porto) */
const SCN = (() => {
  const { MAT, mesh, rbox, box, cyl, cylX, cylZ, sphere, torus, at, ibeam, plate, padlock, person } = W;
  const T = THREE;

  function dialTex(max = 10, unit = 'bar') {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#f4f2ec'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
    g.strokeStyle = '#1b1f24'; g.lineWidth = 3; g.font = '600 22px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1b1f24';
    for (let i = 0; i <= max * 2; i++) { const a = (-225 + i / (max * 2) * 270) * Math.PI / 180; const r1 = i % 2 ? 100 : 92; g.lineWidth = i % 2 ? 2 : 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1); g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); g.stroke(); if (!(i % 2)) g.fillText(String(i / 2), 128 + Math.cos(a) * 74, 128 + Math.sin(a) * 74); }
    g.strokeStyle = '#b3261e'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 108, (-225 + 0.7 * 270) * Math.PI / 180, 45 * Math.PI / 180); g.stroke();
    g.font = '600 20px "IBM Plex Mono", monospace'; g.fillText(unit, 128, 180);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function handwheel(r, color = 0x8a2a1f) {
    const g = new T.Group(); const m = MAT.paint(color, { wear: 0.45, seed: 81 });
    const rim = torus(r, r * 0.09, m); g.add(rim);
    for (let i = 0; i < 3; i++) { const s = box(r * 2, r * 0.1, r * 0.08, m); s.rotation.z = i * Math.PI / 3; g.add(s); }
    g.add(cylZ(r * 0.18, r * 0.25, m, 16)); return g;
  }
  function flange(r, x, y, z, axis = 'x', mat) {
    const f = axis === 'x' ? cylX(r, 0.07, mat, 32) : axis === 'z' ? cylZ(r, 0.07, mat, 32) : cyl(r, r, 0.07, mat, 32); return at(f, x, y, z);
  }
  function gateValve(ctx, x, y, z, axis, wheelDir, mat) {
    const g = new T.Group(); const body = MAT.paint(0x2e3338, { wear: 0.4, seed: 83 });
    g.add(at(rbox(0.55, 0.62, 0.55, body, 0.08), 0, 0, 0));
    if (axis === 'x') { g.add(flange(0.38, -0.32, 0, 0, 'x', body)); g.add(flange(0.38, 0.32, 0, 0, 'x', body)); }
    else { g.add(flange(0.36, 0, -0.33, 0, 'y', body)); g.add(flange(0.36, 0, 0.33, 0, 'y', body)); }
    const stemLen = 0.75; const stem = wheelDir === 'up' ? at(cyl(0.05, 0.05, stemLen, MAT.steel(), 12), 0, 0.3 + stemLen / 2, 0) : at(cylZ(0.05, stemLen, MAT.steel(), 12), 0, 0, 0.3 + stemLen / 2); g.add(stem);
    const bon = wheelDir === 'up' ? at(cyl(0.16, 0.2, 0.28, body, 20), 0, 0.42, 0) : at(cylZ(0.18, 0.28, body, 20), 0, 0, 0.42); g.add(bon);
    const hw = handwheel(0.3); if (wheelDir === 'up') { hw.rotation.x = Math.PI / 2; hw.position.set(0, 0.3 + stemLen, 0); } else hw.position.set(0, 0, 0.3 + stemLen); g.add(hw);
    at(g, x, y, z); g.userData.wheel = hw; return g;
  }
  function cabinet(w, h, d, color, wear = 0.25, seed = 91) { return rbox(w, h, d, MAT.paint(color, { wear, seed, rep: [1, 1] }), 0.03); }
  function lamp(color, on) { return sphere(0.04, MAT.flat(color, { emissive: color, ei: on ? 2.5 : 0.05, rough: 0.2 }), { cast: false }, 16, 10); }
  function setLamp(m, on) { m.material.emissiveIntensity = on ? 2.5 : 0.05; }

  /* ================= REFINARIA · BP-201 ================= */
  function pump(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { running: true, pressure: 4.2, draining: false, hot: true } };
    W.shed(ctx, { w: 36, d: 26, h: 10, z0: -9, wall: 0x8c9599, steel: 0x58636c, bay: 6, lampI: 0.8 });
    W.beams(ctx, [[-8, 6, -4, 3, 9, 0.2, -0.55], [4, 6, -4, 3, 9, 0.2, -0.55], [14, 6, -4, 3, 9, 0.2, -0.55]]);
    W.dust(ctx, 300, [30, 7, 16], 0xfff1dc, [0, 0.5, -1]);
    W.floorLine(ctx, 1, 2.6, 22); W.floorLine(ctx, 1, -2.6, 22); W.floorLine(ctx, -10.95, 0, 5.3, Math.PI / 2); W.floorLine(ctx, 12.95, 0, 5.3, Math.PI / 2);
    // rack de tubos ao fundo
    const rackM = MAT.paint(0x56616b, { wear: 0.4, seed: 63, rep: [1, 3] });
    for (let x = -14; x <= 16; x += 6) { const c = ibeam(5.2, 0.3, 0.2, rackM); at(c, x, 2.6, -6.4); scene.add(c); }
    scene.add(at(ibeam(32, 0.35, 0.2, rackM, 'x'), 1, 5.2, -6.4));
    [[0.34, -6.0], [0.26, -6.75], [0.2, -6.4]].forEach(([r, z], i) => { const p = cylX(r, 32, MAT.clad([12, 1]), 28); at(p, 1, 5.6 + r, z); scene.add(p); if (i === 0) for (let x = -12; x <= 14; x += 3.5) scene.add(flange(r + 0.04, x, 5.6 + r, z, 'x', MAT.steel())); });
    // vaso isolado
    const vs = cyl(1.8, 1.8, 7, MAT.clad([5, 3]), 40); at(vs, 13, 3.5, -5.2); scene.add(vs); scene.add(at(sphere(1.8, MAT.clad([5, 2])), 13, 7, -5.2));
    scene.add(at(plate(['TQ-205', 'LICOR'], 1.2, 0.45, { bg: '#e9e6dc', fg: '#1b1f24' }), 13, 2.4, -3.38));
    // pedestal e base
    scene.add(at(box(7.8, 0.35, 2.3, MAT.concrete([3, 1], 0x8f908e, 5)), -0.1, 0.175, 0));
    const skid = MAT.paint(0x5d666e, { wear: 0.55, seed: 65, rep: [3, 1] });
    scene.add(at(rbox(7.2, 0.22, 1.7, skid, 0.02), -0.1, 0.46, 0));
    const tag = plate(['BP-201'], 0.9, 0.24, { bg: '#e9e6dc', fg: '#1b1f24' }); at(tag, 0.9, 0.46, 0.856); scene.add(tag);
    // motor
    const green = MAT.paint(0x3f5b4b, { wear: 0.35, seed: 67 });
    const motor = new T.Group();
    motor.add(at(cylX(0.56, 1.7, green, 48), -1.65, 1.17, 0));
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const f = box(1.45, 0.1, 0.035, green); f.position.set(-1.6, 1.17 + Math.sin(a) * 0.58, Math.cos(a) * 0.58); f.rotation.x = -a; motor.add(f); }
    motor.add(at(cylX(0.6, 0.5, MAT.paint(0x34493d, { wear: 0.3, seed: 69 }), 48), -2.72, 1.17, 0));
    const grill = mesh(new T.CircleGeometry(0.5, 32), MAT.flat(0x15181b, { rough: 0.9 })); grill.rotation.y = -Math.PI / 2; at(grill, -2.98, 1.17, 0); motor.add(grill);
    motor.add(at(rbox(0.5, 0.36, 0.5, green, 0.04), -1.6, 1.9, 0));
    motor.add(at(rbox(1.5, 0.24, 1.1, green, 0.03), -1.6, 0.68, 0));
    const np = plate(['M-201', '75 kW · 440 V'], 0.36, 0.2, { bg: '#c9ccc8', fg: '#1b1f24' }); at(np, -1.3, 1.17, 0.625); motor.add(np);
    motor.add(at(cylX(0.07, 0.6, MAT.steel(), 16), -0.55, 1.17, 0));
    R.parts.motor = ctx.hit(motor, 'motor'); R.anchors.motor = [-1.6, 2.3, 0]; R.names.motor = 'M-201 · Motor da bomba';
    // acoplamento + proteção
    const acopl = new T.Group(); const spin = new T.Group(); spin.position.set(-0.2, 1.17, 0);
    spin.add(at(cylX(0.26, 0.16, MAT.steel(), 32), -0.1, 0, 0)); spin.add(at(cylX(0.26, 0.16, MAT.steel(), 32), 0.1, 0, 0));
    spin.add(at(cylX(0.22, 0.06, MAT.flat(0x7a2a18, { rough: 0.9 }), 24), 0, 0, 0));
    for (let i = 0; i < 6; i++) { const b = box(0.36, 0.035, 0.035, MAT.steel()); b.position.set(0, Math.cos(i) * 0.2, Math.sin(i) * 0.2); spin.add(b); }
    acopl.add(spin); R.spin = spin;
    const guard = new T.Group(); const gm = MAT.guard(); const gw = 0.95, gh = 0.95;
    const gshape = mesh(new T.CylinderGeometry(0.46, 0.46, gw, 24, 1, true, 0, Math.PI), gm); gshape.rotation.z = Math.PI / 2; gshape.rotation.y = Math.PI; guard.add(at(gshape, 0, 0, 0));
    [-gw / 2, gw / 2].forEach(x => { const ring = torus(0.46, 0.018, MAT.paint(0xd8a21c, { wear: 0.4 }), Math.PI); ring.rotation.y = Math.PI / 2; at(ring, x, 0, 0); guard.add(ring); });
    guard.add(at(box(gw, 0.04, 0.95, MAT.paint(0xd8a21c, { wear: 0.4 })), 0, -0.02, 0));
    guard.position.set(-0.2, 1.17, 0); acopl.add(guard); R.guard = guard;
    R.parts.acopl = ctx.hit(acopl, 'acopl'); R.anchors.acopl = [-0.2, 1.17, 0]; R.names.acopl = 'Acoplamento e proteção';
    // bomba
    const castM = MAT.paint(0x4c5661, { wear: 0.5, seed: 71 });
    const bomba = new T.Group();
    bomba.add(at(cylX(0.27, 0.8, castM, 28), 0.5, 1.17, 0));
    bomba.add(at(rbox(0.9, 0.5, 0.8, castM, 0.05), 0.5, 0.8, 0));
    bomba.add(at(cylX(0.86, 0.62, castM, 64), 1.28, 1.17, 0));
    const vol = torus(0.74, 0.2, castM); vol.rotation.y = Math.PI / 2; at(vol, 1.28, 1.17, 0); bomba.add(vol);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; [-0.33, 0.33].forEach(dx => bomba.add(at(cylX(0.045, 0.07, MAT.steel(), 6), 1.28 + dx, 1.17 + Math.sin(a) * 0.76, Math.cos(a) * 0.76))); }
    bomba.add(at(cylX(0.3, 0.2, castM, 28), 1.7, 1.17, 0));
    R.parts.bomba = ctx.hit(bomba, 'bomba'); R.anchors.bomba = [1.28, 1.17, 0]; R.names.bomba = 'BP-201 · Bomba de licor';
    // linha de sucção isolada (licor quente)
    const linha = new T.Group();
    linha.add(at(cylX(0.32, 1.7, MAT.clad([2, 1]), 28), 2.75, 1.17, 0));
    linha.add(at(cylX(0.32, 5.6, MAT.clad([5, 1]), 28), 7.4, 1.17, 0));
    linha.add(flange(0.36, 1.85, 1.17, 0, 'x', MAT.steel()));
    for (let x = 6; x <= 10; x += 2) { linha.add(at(box(0.12, 0.9, 0.5, rackM), x, 0.45, 0)); }
    const hot = plate(['LICOR 105 °C'], 0.9, 0.18, { bg: '#d9a21c', fg: '#1b1f24' }); hot.rotation.y = 0; at(hot, 6.6, 1.17, 0.33); linha.add(hot);
    R.parts.linha = ctx.hit(linha, 'linha'); R.anchors.linha = [7.2, 1.17, 0]; R.names.linha = 'Linha de sucção · licor quente';
    R.steam = W.steam(ctx, 9.6, 1.5, 0, 12, 0.3);
    // válvula de sucção
    const vsuc = gateValve(ctx, 4.25, 1.17, 0, 'x', 'up'); R.wheelSuc = vsuc.userData.wheel;
    R.parts.vsuc = ctx.hit(vsuc, 'vsuc'); R.anchors.vsuc = [4.25, 1.6, 0]; R.names.vsuc = 'V-201 · Válvula de sucção';
    const capS = new T.Group(); capS.add(cyl(0.34, 0.34, 0.2, MAT.paint(0xa83a16, { wear: 0.3, seed: 85 }), 32)); const lS = padlock(); lS.position.set(0.42, -0.05, 0.08); capS.add(lS);
    capS.position.set(4.25, 2.22, 0); capS.visible = false; scene.add(capS); R.capSuc = capS;
    // recalque
    const disc = new T.Group();
    disc.add(at(cyl(0.24, 0.24, 0.5, castM, 24), 1.28, 2.25, 0));
    disc.add(at(cyl(0.26, 0.26, 1.5, MAT.clad([1, 2]), 24), 1.28, 4.0, 0));
    const elb = torus(0.42, 0.26, MAT.clad([2, 1]), Math.PI / 2); elb.rotation.z = Math.PI / 2; at(elb, 1.7, 4.75, 0); scene.add(elb);
    disc.add(at(cylX(0.26, 6.5, MAT.clad([6, 1]), 24), 5.0, 5.17, 0));
    scene.add(disc);
    const vrec = gateValve(ctx, 1.28, 2.95, 0, 'y', 'z'); R.wheelRec = vrec.userData.wheel;
    R.parts.vrec = ctx.hit(vrec, 'vrec'); R.anchors.vrec = [1.28, 2.95, 0.6]; R.names.vrec = 'V-202 · Válvula de recalque';
    const capR = new T.Group(); capR.add(cylZ(0.34, 0.2, MAT.paint(0xa83a16, { wear: 0.3, seed: 85 }), 32)); const lR = padlock(); lR.position.set(0.4, -0.08, 0.1); capR.add(lR);
    capR.position.set(1.28, 2.95, 1.05); capR.visible = false; scene.add(capR); R.capRec = capR;
    // manômetro
    const man = new T.Group();
    man.add(at(cylZ(0.03, 0.35, MAT.steel(), 10), 1.28, 3.6, 0.38));
    man.add(at(cylZ(0.2, 0.09, MAT.steel(), 32), 1.28, 3.6, 0.6));
    const face = mesh(new T.CircleGeometry(0.175, 40), new T.MeshStandardMaterial({ map: dialTex(10, 'bar'), roughness: 0.3, metalness: 0 }), { cast: false }); at(face, 1.28, 3.6, 0.648); man.add(face);
    const glass = mesh(new T.CircleGeometry(0.18, 40), MAT.flat(0xffffff, { opacity: 0.12, rough: 0.05, metal: 0 }), { cast: false }); at(glass, 1.28, 3.6, 0.655); glass.userData.through = true; man.add(glass);
    const needle = box(0.012, 0.15, 0.006, MAT.flat(0x111111, { rough: 0.4 }), { cast: false }); needle.geometry.translate(0, 0.06, 0); at(needle, 1.28, 3.6, 0.652); man.add(needle); R.needle = needle;
    R.parts.manometro = ctx.hit(man, 'manometro'); R.anchors.manometro = [1.28, 3.6, 0.65]; R.names.manometro = 'PI-202 · Manômetro do recalque';
    // dreno
    const dreno = new T.Group();
    dreno.add(at(cylZ(0.05, 0.55, MAT.steel(), 12), 1.28, 0.62, 0.65));
    dreno.add(at(rbox(0.16, 0.14, 0.14, MAT.steel(), 0.02), 1.28, 0.62, 0.98));
    const lever = box(0.28, 0.03, 0.04, MAT.paint(0xa8231c, { wear: 0.3 })); at(lever, 1.4, 0.71, 0.98); dreno.add(lever); R.drainLever = lever;
    dreno.add(at(cyl(0.04, 0.04, 0.28, MAT.steel(), 10), 1.28, 0.44, 1.02));
    dreno.add(at(rbox(0.7, 0.12, 0.5, MAT.steel({ tint: 0x8e9398 }), 0.02), 1.28, 0.06, 1.1));
    R.parts.dreno = ctx.hit(dreno, 'dreno'); R.anchors.dreno = [1.28, 0.6, 1.0]; R.names.dreno = 'Dreno da carcaça';
    const dripM = MAT.flat(0xc98a2a, { rough: 0.1, metal: 0.1 }); R.drips = []; for (let i = 0; i < 5; i++) { const d = sphere(0.025, dripM, { cast: false }); d.visible = false; d.userData.through = true; scene.add(d); R.drips.push(d); }
    const puddle = mesh(new T.CircleGeometry(0.2, 24), MAT.flat(0x8a5a1c, { rough: 0.05, metal: 0.2 }), { cast: false }); puddle.rotation.x = -Math.PI / 2; at(puddle, 1.28, 0.125, 1.1); puddle.scale.setScalar(0.01); scene.add(puddle); R.puddle = puddle;
    // CCM-2A
    const ccm = new T.Group(); const cx = -7.2, cz = -2.2; const panelM = MAT.paint(0xc5c7c2, { wear: 0.18, seed: 93 });
    [-1, 0, 1].forEach(i => ccm.add(at(rbox(1.0, 2.3, 0.7, panelM, 0.02), cx + i * 1.02, 1.15, cz)));
    ccm.add(at(box(3.12, 0.12, 0.74, MAT.paint(0x8b8f8c, { wear: 0.3 })), cx, 2.36, cz));
    ccm.add(at(plate(['CCM-2A · 440 V'], 1.6, 0.18, { bg: '#1b1f24', fg: '#f2f2f2' }), cx, 2.16, cz + 0.356));
    R.drawers = {}; const dn = [['G2', 'G2 · BP-202', 1.68, false], ['G1', 'G1 · BP-201', 1.08, true], ['G3', 'G3 · AGITADOR', 0.48, true]];
    dn.forEach(([k, txt, y, on]) => {
      ccm.add(at(rbox(0.9, 0.52, 0.04, MAT.paint(0xbfc1bc, { wear: 0.15, seed: 95 }), 0.01), cx, y, cz + 0.36));
      const pl = plate([txt], 0.5, 0.09, { bg: '#f1efe8', fg: '#1b1f24', border: false, fade: k === 'G2' ? 0.0 : 0 }); at(pl, cx - 0.12, y + 0.17, cz + 0.385); ccm.add(pl);
      const lg = lamp(0x2fbf5a, on); at(lg, cx - 0.32, y - 0.1, cz + 0.39); ccm.add(lg);
      const lr = lamp(0xd93a2b, !on); at(lr, cx - 0.2, y - 0.1, cz + 0.39); ccm.add(lr);
      const h = new T.Group(); h.position.set(cx + 0.28, y - 0.04, cz + 0.4); h.add(at(cyl(0.06, 0.06, 0.04, MAT.flat(0x1b1f24), 20), 0, 0, 0)); h.children[0].rotation.x = Math.PI / 2; h.add(at(rbox(0.05, 0.2, 0.05, MAT.flat(0x1b1f24, { rough: 0.4 }), 0.015), 0, 0.06, 0.03)); h.rotation.z = on ? 0 : -Math.PI / 2; ccm.add(h);
      const lk = padlock(); lk.position.set(cx + 0.28, y - 0.2, cz + 0.45); lk.visible = false; scene.add(lk);
      R.drawers[k] = { on, lg, lr, h, lk, team: [] };
    });
    [-1, 1].forEach(i => { for (let j = 0; j < 3; j++) ccm.add(at(rbox(0.9, 0.52, 0.04, MAT.paint(0xbfc1bc, { wear: 0.15, seed: 97 + j }), 0.01), cx + i * 1.02, 1.68 - j * 0.6, cz + 0.36)); });
    R.drawers.G1.team = [0x2f6db5, 0x6b4fa8].map((c, i) => { const l = padlock(c, false); l.position.set(cx + 0.14 - i * 0.12, 0.88, cz + 0.45); l.visible = false; scene.add(l); return l; });
    R.parts.ccm = ctx.hit(ccm, 'ccm'); R.anchors.ccm = [cx, 1.4, cz + 0.4]; R.names.ccm = 'CCM-2A · Centro de controle de motores';
    // cabo CCM-motor (eletrocalha)
    const tray = MAT.galv(); scene.add(at(box(0.3, 0.06, 5.2, tray), cx + 1.6, 2.6, cz + 0.6 + 1.9));
    const curve = new T.CatmullRomCurve3([new T.Vector3(cx + 1.6, 2.6, 1.0), new T.Vector3(-3.5, 2.4, 0.6), new T.Vector3(-1.9, 2.1, 0.2), new T.Vector3(-1.6, 1.95, 0)]);
    scene.add(mesh(new T.TubeGeometry(curve, 40, 0.04, 8), MAT.flat(0x1d2024, { rough: 0.7 })));
    // botoeira local
    const bot = new T.Group(); const bx = -3.8, bz = 1.6;
    bot.add(at(cyl(0.04, 0.04, 1.4, MAT.galv(), 12), bx, 0.7, bz));
    bot.add(at(rbox(0.3, 0.42, 0.2, MAT.paint(0xd8a21c, { wear: 0.4, seed: 99 }), 0.03), bx, 1.52, bz));
    bot.add(at(cylZ(0.05, 0.05, MAT.flat(0x1f8a43, { rough: 0.4 }), 20), bx, 1.6, bz + 0.12)); bot.add(at(cylZ(0.06, 0.06, MAT.flat(0xb3261e, { rough: 0.4 }), 20), bx, 1.43, bz + 0.12));
    bot.add(at(plate(['BP-201'], 0.22, 0.06, { bg: '#1b1f24', fg: '#f2f2f2', border: false }), bx, 1.7, bz + 0.105));
    R.parts.botoeira = ctx.hit(bot, 'botoeira'); R.anchors.botoeira = [bx, 1.5, bz]; R.names.botoeira = 'Botoeira local liga/desliga';
    // EPI
    const epi = new T.Group(); const ex = -10.4, ez = -1.0;
    epi.add(at(cabinet(1.0, 1.9, 0.5, 0xc5c7c2, 0.2, 101), ex, 0.95, ez));
    epi.add(at(plate(['EPI', 'PRODUTO QUÍMICO'], 0.8, 0.3, { bg: '#1f6f3f', fg: '#ffffff' }), ex, 1.62, ez + 0.26));
    const shield = mesh(new T.SphereGeometry(0.16, 16, 10, 0, Math.PI, 0, Math.PI / 2), MAT.flat(0xcfe3ef, { opacity: 0.5, rough: 0.05 })); shield.rotation.x = Math.PI / 2; at(shield, ex - 0.2, 1.1, ez + 0.3); epi.add(shield);
    epi.add(at(rbox(0.16, 0.26, 0.04, MAT.flat(0x2f4a6b, { rough: 0.7 }), 0.02), ex + 0.2, 1.05, ez + 0.28));
    epi.add(at(rbox(0.3, 0.55, 0.03, MAT.flat(0x2a6a3a, { rough: 0.6 }), 0.02), ex + 0.02, 0.55, ez + 0.28));
    R.parts.epi = ctx.hit(epi, 'epi'); R.anchors.epi = [ex, 1.2, ez + 0.3]; R.names.epi = 'Armário de EPI · produto químico';
    // operador da área
    const op = person({ suit: 0x2b3a55 }); op.position.set(6.2, 0, 2.2); op.rotation.y = -0.5;
    R.parts.operador = ctx.hit(op, 'operador'); R.anchors.operador = [6.2, 1.4, 2.2]; R.names.operador = 'Operador da área';
    // você (mantenedor)
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c }); me.position.set(-1.8, 0, 2.4); me.rotation.y = 2.6; scene.add(me); R.me = me;
    // animação
    let pv = R.state.pressure, shake = 0;
    ctx.tick((dt, t) => {
      if (R.state.running) { R.spin.rotation.x += dt * 30; shake = Math.sin(t * 90) * 0.004; } else { shake = 0; }
      motor.position.y = shake;
      pv += (R.state.pressure - pv) * Math.min(1, dt * 1.5); R.needle.rotation.z = -(-225 + Math.min(10, pv) / 10 * 270) * Math.PI / 180 - Math.PI / 2;
      R.steam.on = R.state.hot; R.steam.rate = R.state.hot ? 1 : 0.4;
      R.drips.forEach((d, i) => { d.visible = R.state.draining; if (R.state.draining) { const p = (t * 1.5 + i / 5) % 1; d.position.set(1.28, 0.3 - p * 0.18, 1.02); } });
      if (R.state.draining) R.puddle.scale.setScalar(Math.min(1, R.puddle.scale.x + dt * 0.08));
    });
    R.setDrawer = (k, on) => { const d = R.drawers[k]; d.on = on; setLamp(d.lg, on); setLamp(d.lr, !on); d.h.rotation.z = on ? 0 : -Math.PI / 2; };
    R.view = { cam: [3.5, 4.6, 11.5], target: [-0.6, 1.4, 0] };
    return R;
  }

  /* ================= REDUÇÃO · PR-301 ================= */
  function crane(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { moving: true, down: false, area: false } };
    W.shed(ctx, { w: 40, d: 28, h: 13, z0: -10, wall: 0x6e757a, steel: 0x4c545b, bay: 6.5, lampI: 0.7, lampColor: 0xffd9a8, winI: 0.9, floorTint: 0x7b7c7a, seed: 8 });
    W.beams(ctx, [[-10, 8, -5, 3.5, 11, 0.15, -0.5], [6, 8, -5, 3.5, 11, 0.15, -0.5]]);
    W.dust(ctx, 400, [34, 9, 18], 0xffd2a0, [0, 0.5, -2]);
    // linha de cubas ao fundo
    const potM = MAT.paint(0x4a4f53, { wear: 0.6, seed: 111, rep: [2, 1] });
    for (let x = -18; x <= 18; x += 4.2) { scene.add(at(rbox(3.8, 1.3, 3.2, potM, 0.05), x, 0.65, -7.6)); const glow = box(3.2, 0.06, 0.06, MAT.flat(0xff7a2a, { emissive: 0xff6a1a, ei: 2.2 }), { cast: false }); at(glow, x, 1.32, -6.0); scene.add(glow); scene.add(at(box(0.16, 2.4, 0.16, MAT.steel({ tint: 0x6a6e72 })), x - 1.4, 2.4, -7.6)); }
    const warm = new T.PointLight(0xff8a3a, 1.2, 22, 1.8); warm.position.set(0, 2, -6); scene.add(warm);
    // caminho de rolamento
    const runM = MAT.paint(0x4c545b, { wear: 0.4, seed: 113, rep: [6, 1] });
    [-8.2, 8.2].forEach(x => { for (let z = -6.5; z <= 6.5; z += 6.5) { const c = ibeam(8.2, 0.5, 0.35, runM); at(c, x, 4.1, z); scene.add(c); } scene.add(at(ibeam(16, 0.6, 0.35, runM, 'z'), x, 8.5, 0)); scene.add(at(box(0.12, 0.14, 16, MAT.steel()), x + (x < 0 ? 0.3 : -0.3), 8.88, 0)); });
    // ponte
    const yel = MAT.paint(0xd2a024, { wear: 0.6, seed: 115, rep: [6, 1] });
    const bridge = new T.Group();
    bridge.add(at(rbox(16.2, 0.95, 0.55, yel, 0.03), 0, 9.45, -0.75)); bridge.add(at(rbox(16.2, 0.95, 0.55, yel, 0.03), 0, 9.45, 1.0));
    [-8.0, 8.0].forEach(x => bridge.add(at(rbox(0.9, 0.8, 3.2, MAT.paint(0xb88c1e, { wear: 0.6, seed: 117 }), 0.04), x, 9.25, 0.12)));
    const bpl = plate(['PR-301 · 10 t'], 2.2, 0.42, { bg: '#1b1f24', fg: '#e8b93a' }); at(bpl, -3.2, 9.45, 1.28); bridge.add(bpl);
    scene.add(bridge);
    // passarela da ponte + painel
    scene.add(at(box(5, 0.05, 0.9, MAT.galv()), -5.2, 8.95, 1.8));
    for (let x = -7.6; x <= -2.8; x += 1.2) scene.add(at(cyl(0.025, 0.025, 1.0, MAT.paint(0xd2a024, { wear: 0.4 }), 8), x, 9.45, 2.2));
    scene.add(at(cylX(0.025, 5, MAT.paint(0xd2a024, { wear: 0.4 }), 8), -5.2, 9.95, 2.2));
    const painel = new T.Group();
    painel.add(at(cabinet(1.2, 1.1, 0.5, 0xc5c7c2, 0.3, 119), -6.2, 9.5, 1.6));
    painel.add(at(plate(['PAINEL PR-301'], 0.9, 0.14, { bg: '#1b1f24', fg: '#f2f2f2' }), -6.2, 9.9, 1.856));
    const pl1 = lamp(0x2fbf5a, true), pl2 = lamp(0xe8b93a, true); at(pl1, -6.45, 9.6, 1.87); at(pl2, -6.25, 9.6, 1.87); painel.add(pl1); painel.add(pl2); R.lampMain = pl1; R.lampCmd = pl2;
    R.parts.painel = ctx.hit(painel, 'painel'); R.anchors.painel = [-6.2, 9.5, 1.85]; R.names.painel = 'Painel elétrico da ponte';
    // carro, cabo, gancho, carga
    const trolley = new T.Group();
    trolley.add(at(rbox(1.9, 0.75, 2.3, MAT.paint(0xc7951f, { wear: 0.55, seed: 121 }), 0.04), 0, 10.3, 0.12));
    trolley.add(at(cylX(0.36, 1.4, MAT.steel({ tint: 0x8d9196 }), 28), 0, 9.75, 0.12));
    trolley.add(at(rbox(0.6, 0.45, 0.6, MAT.paint(0x3f5b4b, { wear: 0.3 }), 0.03), 0.7, 10.85, 0.12));
    const cable = cyl(0.025, 0.025, 1, MAT.steel({ tint: 0x6c7076 }), 8); trolley.add(cable);
    const cable2 = cyl(0.025, 0.025, 1, MAT.steel({ tint: 0x6c7076 }), 8); trolley.add(cable2);
    const hook = new T.Group();
    hook.add(rbox(0.5, 0.55, 0.32, MAT.paint(0xd2a024, { wear: 0.5 }), 0.05));
    hook.add(at(cylZ(0.18, 0.34, MAT.steel(), 20), 0, 0.12, 0));
    const hk = torus(0.15, 0.045, MAT.steel({ tint: 0x7d8186 }), Math.PI * 1.45); hk.position.y = -0.44; hk.rotation.z = -0.4; hook.add(hk);
    const load = new T.Group();
    const anode = MAT.paint(0x2f3236, { wear: 0.15, seed: 123, rough: 1, metal: 0 });
    load.add(at(rbox(1.7, 0.6, 0.75, anode, 0.04), 0, -1.75, 0)); load.add(at(rbox(1.7, 0.6, 0.75, anode, 0.04), 0, -2.37, 0));
    const chM = MAT.steel({ tint: 0x8a8e93 }); [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].forEach(([x, z]) => { const c = cyl(0.02, 0.02, 1.25, chM, 6); c.position.set(x / 2, -0.88, z / 2); c.rotation.z = -x * 0.55; c.rotation.x = z * 0.55; load.add(c); });
    const lpl = plate(['2 t'], 0.4, 0.2, { bg: '#f1efe8', fg: '#1b1f24' }); at(lpl, 0, -1.75, 0.38); load.add(lpl);
    hook.add(load); trolley.add(hook); scene.add(trolley);
    R.trolley = trolley; R.hook = hook;
    // calços
    const wood = MAT.paint(0x8a6a44, { wear: 0.1, seed: 125, rough: 1, metal: 0 });
    scene.add(at(rbox(0.3, 0.3, 1.2, wood, 0.02), 0.45, 0.15, 0.12)); scene.add(at(rbox(0.3, 0.3, 1.2, wood, 0.02), 1.55, 0.15, 0.12));
    // isolamento de área
    const kit = new T.Group(); const coneM = MAT.paint(0xe0571e, { wear: 0.35, seed: 127 });
    for (let i = 0; i < 3; i++) kit.add(at(cyl(0.04, 0.2, 0.6, coneM, 20), 4.4, 0.3 + i * 0.1, 3.6));
    kit.add(at(box(0.42, 0.04, 0.42, MAT.flat(0x1b1f24)), 4.4, 0.02, 3.6));
    for (let i = 0; i < 3; i++) kit.add(at(cyl(0.03, 0.03, 1.0, MAT.paint(0xe8e6e0, { wear: 0.3 }), 8), 5.0 + i * 0.12, 0.5, 3.4));
    R.parts.area = ctx.hit(kit, 'area'); R.anchors.area = [4.6, 0.7, 3.6]; R.names.area = 'Kit de isolamento de área';
    const ring = new T.Group(); const pts = [[-2.2, -2.0], [3.2, -2.0], [3.2, 2.3], [-2.2, 2.3]];
    pts.forEach(([x, z]) => { ring.add(at(cyl(0.04, 0.2, 0.7, coneM, 20), x + 1, 0.35, z)); ring.add(at(cyl(0.02, 0.02, 0.9, MAT.paint(0xe8e6e0), 8), x + 1, 0.8, z)); });
    for (let i = 0; i < 4; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % 4]; const len = Math.hypot(x2 - x1, z2 - z1); const ch = box(len, 0.03, 0.03, MAT.flat(0xc9301e, { rough: 0.6 })); ch.position.set((x1 + x2) / 2 + 1, 1.15, (z1 + z2) / 2); ch.rotation.y = -Math.atan2(z2 - z1, x2 - x1); ring.add(ch); }
    ring.visible = false; scene.add(ring); R.ring = ring;
    // chave seccionadora do barramento
    const chave = new T.Group(); const kx = -7.6, kz = 0.8;
    chave.add(at(cabinet(0.7, 0.9, 0.35, 0x8d9296, 0.35, 129), kx + 0.45, 1.6, kz));
    chave.add(at(cylZ(0.13, 0.05, MAT.flat(0xd2a024, { rough: 0.5 }), 24), kx + 0.45, 1.65, kz + 0.2));
    const knob = new T.Group(); knob.position.set(kx + 0.45, 1.65, kz + 0.24); knob.add(rbox(0.06, 0.24, 0.06, MAT.flat(0xb3261e, { rough: 0.4 }), 0.02)); chave.add(knob); R.knob = knob;
    chave.add(at(plate(['Q1 · BARRAMENTO PR-301'], 0.6, 0.08, { bg: '#1b1f24', fg: '#f2f2f2', border: false }), kx + 0.45, 1.98, kz + 0.18));
    chave.add(at(cyl(0.04, 0.04, 6.2, MAT.galv(), 8), kx + 0.45, 5.2, kz));
    R.parts.chave = ctx.hit(chave, 'chave'); R.anchors.chave = [kx + 0.45, 1.6, kz + 0.2]; R.names.chave = 'Q1 · Chave do barramento (440 V)';
    const lkC = padlock(); lkC.position.set(kx + 0.62, 1.45, kz + 0.26); lkC.visible = false; scene.add(lkC); R.lockChave = lkC;
    // QA-02
    const aux = new T.Group(); const ax = -5.2, az = -4.6;
    aux.add(at(cabinet(0.6, 0.75, 0.25, 0xc5c7c2, 0.3, 131), ax, 1.7, az + 0.15));
    const lev = rbox(0.08, 0.2, 0.06, MAT.flat(0x2f6db5, { rough: 0.4 }), 0.02); at(lev, ax, 1.75, az + 0.32); aux.add(lev); R.lever = lev;
    aux.add(at(plate(['QA-02 · 220 V', 'COMANDO / FREIO PR-301'], 0.55, 0.14, { bg: '#1b1f24', fg: '#f2f2f2' }), ax, 2.2, az + 0.3));
    aux.add(at(cyl(0.05, 0.05, 1.4, MAT.galv(), 10), ax, 0.7, az)); aux.add(at(cyl(0.025, 0.025, 6.5, MAT.galv(), 8), ax, 5.3, az + 0.15)); aux.add(at(box(0.5, 0.06, 0.5, MAT.galv()), ax, 0.03, az));
    R.parts.aux = ctx.hit(aux, 'aux'); R.anchors.aux = [ax, 1.8, az + 0.3]; R.names.aux = 'QA-02 · Alimentação auxiliar 220 V';
    const lkA = padlock(); lkA.position.set(ax + 0.18, 1.55, az + 0.34); lkA.visible = false; scene.add(lkA); R.lockAux = lkA;
    // caixa de bloqueio coletivo
    const cx = new T.Group(); const bxp = [7.6, 1.6, 1.4];
    cx.add(at(cabinet(0.6, 0.7, 0.25, 0xb3261e, 0.3, 133), ...bxp));
    cx.add(at(plate(['BLOQUEIO', 'COLETIVO'], 0.45, 0.16, { bg: '#f1efe8', fg: '#b3261e' }), bxp[0], bxp[1] + 0.15, bxp[2] + 0.13));
    R.parts.caixa = ctx.hit(cx, 'caixa'); R.anchors.caixa = [bxp[0], bxp[1], bxp[2] + 0.15]; R.names.caixa = 'Caixa de bloqueio coletivo';
    R.boxLocks = [0xd9531e, 0x2f6db5, 0x6b4fa8].map((c, i) => { const l = padlock(c, false); l.position.set(bxp[0] - 0.15 + i * 0.15, bxp[1] - 0.22, bxp[2] + 0.16); l.visible = false; scene.add(l); return l; });
    // operador com controle
    const op = person({ suit: 0x2b3a55, pose: 'hold', skin: 0xb07c5c }); op.position.set(4.8, 0, 2.6); op.rotation.y = -0.6;
    const pend = rbox(0.12, 0.26, 0.08, MAT.paint(0xd2a024, { wear: 0.3 }), 0.02); pend.position.set(0, -0.1, 0.05); pend.rotation.x = 1.0; op.userData.hands[1].add(pend);
    R.parts.controle = ctx.hit(op, 'controle'); R.anchors.controle = [4.8, 1.3, 2.6]; R.names.controle = 'Operador com o controle da ponte';
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c }); me.position.set(-4.6, 0, 3.4); me.rotation.y = 2.4; scene.add(me);
    // animação
    let tx = 0, hy = -3.0;
    ctx.tick((dt, t) => {
      const targetX = R.state.moving ? Math.sin(t * 0.35) * 3.5 : 1.0; tx += (targetX - tx) * Math.min(1, dt * (R.state.moving ? 4 : 1.5)); trolley.position.x = tx;
      const targetY = R.state.down ? -6.5 : -3.6; hy += (targetY - hy) * Math.min(1, dt * 0.9);
      hook.position.set(0, 9.75 + hy, 0.12); hook.rotation.z = R.state.moving ? Math.sin(t * 1.3) * 0.03 : 0;
      const len = -hy - 0.3; [cable, cable2].forEach((c, i) => { c.scale.y = len; c.position.set(i ? 0.12 : -0.12, 9.6 - len / 2, 0.12); });
    });
    R.view = { cam: [10, 7.5, 18], target: [-0.5, 4.8, 0] };
    return R;
  }

  /* ================= PORTO · CT-101 ================= */
  function conveyor(ctx) {
    const { scene } = ctx; const R = { parts: {}, anchors: {}, names: {}, state: { running: true, tension: true } };
    W.shed(ctx, { w: 40, d: 22, h: 10, z0: -9, wall: 0x8a8580, steel: 0x5a6168, bay: 6, noBack: true, noSides: true, lampI: 0.4, floorTint: 0x8a7468, seed: 12 });
    W.dust(ctx, 500, [36, 6, 18], 0xd99a7a, [0, 0.4, 0]);
    // cais, mar e navio
    const sea = mesh(new T.PlaneGeometry(240, 120), MAT.flat(0x34474f, { rough: 0.15, metal: 0.4 }), { cast: false }); sea.rotation.x = -Math.PI / 2; at(sea, 0, -1.2, -78); scene.add(sea);
    scene.add(at(box(240, 1.6, 2, MAT.concrete([40, 1], 0x8a8784, 13)), 0, -0.4, -18.2));
    const hull = MAT.paint(0x4a2622, { wear: 0.5, seed: 141, rep: [8, 1] });
    scene.add(at(rbox(90, 9, 16, hull, 0.4), 6, 2.4, -48)); scene.add(at(box(90.2, 1.2, 16.2, MAT.paint(0x1d2226, { wear: 0.3 })), 6, -1.4, -48));
    scene.add(at(rbox(12, 10, 13, MAT.paint(0xe8e6e0, { wear: 0.3, seed: 143 }), 0.2), 40, 11.8, -48));
    for (let i = 0; i < 4; i++) scene.add(at(box(0.6, 7, 0.6, MAT.paint(0xd2a024, { wear: 0.4 })), -20 + i * 12, 10.5, -46));
    // carregador de navio
    const sl = MAT.paint(0x5a6168, { wear: 0.5, seed: 145 });
    scene.add(at(box(1.2, 14, 1.2, sl), -14, 7, -15)); scene.add(at(box(1.2, 14, 1.2, sl), -9, 7, -15)); scene.add(at(box(26, 1.4, 1.6, sl), -11, 14, -22));
    // estrutura da correia
    const H = 1.25, X0 = -13, X1 = 13; const galv = MAT.galv({ rep: [8, 1] });
    [-0.78, 0.78].forEach(z => { scene.add(at(box(X1 - X0, 0.2, 0.08, galv), 0, H - 0.25, z)); scene.add(at(box(X1 - X0, 0.12, 0.06, galv), 0, 0.42, z)); });
    for (let x = X0 + 0.6; x <= X1 - 0.4; x += 2.4) [-0.78, 0.78].forEach(z => scene.add(at(box(0.1, H - 0.2, 0.1, galv), x, (H - 0.2) / 2, z)));
    // roletes de carga
    const rollM = MAT.paint(0x2f3438, { wear: 0.3, seed: 147 }); const R0 = 0.07, cw = 0.42, ang = Math.PI / 6;
    R.idlers = [];
    for (let x = X0 + 0.8; x <= X1 - 0.8; x += 1.2) {
      const g = new T.Group(); g.position.set(x, H, 0);
      g.add(at(cylZ(R0, cw, rollM, 16), 0, 0, 0));
      [-1, 1].forEach(s => { const r = cylZ(R0, cw, rollM, 16); r.rotation.x = Math.PI / 2 + s * ang; r.position.set(0, Math.sin(ang) * (cw / 2 + 0.02) + 0.01, s * (cw / 2 + Math.cos(ang) * cw / 2 + 0.02)); g.add(r); });
      g.add(at(box(0.06, 0.06, 1.5, galv), 0, -0.1, 0));
      [-0.7, 0.7].forEach(z => g.add(at(box(0.05, 0.36, 0.05, galv), 0, 0.05, z)));
      g.add(at(cylZ(R0 * 0.9, 1.3, rollM, 12), 0, -0.82, 0));
      scene.add(g); R.idlers.push(g);
    }
    // correia (calha) + retorno
    const beltM = MAT.rubber([16, 1]);
    const bc = mesh(new T.PlaneGeometry(X1 - X0, cw + 0.02), beltM); bc.rotation.x = -Math.PI / 2; at(bc, 0, H + R0 + 0.01, 0); scene.add(bc);
    [-1, 1].forEach(s => { const b = mesh(new T.PlaneGeometry(X1 - X0, cw), beltM); b.rotation.x = -Math.PI / 2 - s * ang * -1; b.rotation.x = -Math.PI / 2 + s * ang; at(b, 0, H + R0 + 0.01 + Math.sin(ang) * cw / 2, s * (cw / 2 + Math.cos(ang) * cw / 2)); b.material.side = T.DoubleSide; scene.add(b); });
    const ret = mesh(new T.PlaneGeometry(X1 - X0, 1.1), beltM); ret.rotation.x = Math.PI / 2; at(ret, 0, H - 0.82 - R0 - 0.01, 0); ret.material.side = T.DoubleSide; scene.add(ret);
    // bauxita
    const bxm = MAT.bauxite([24, 1]);
    const pile = mesh(new T.CylinderGeometry(0.32, 0.32, X1 - X0 - 1, 20, 1, false, 0, Math.PI), bxm); pile.rotation.z = Math.PI / 2; pile.scale.set(0.5, 1, 1); at(pile, 0, H + R0 + 0.06, 0); scene.add(pile); R.pileTex = bxm.map;
    // tambores e acionamento
    const drum = (x) => { const d = cylZ(0.42, 1.25, MAT.steel({ tint: 0x6f7378 }), 32); at(d, x, H - 0.38, 0); scene.add(d); return d; };
    R.headDrum = drum(X1 + 0.2); R.tailDrum = drum(X0 - 0.2);
    const drv = new T.Group(); drv.add(at(rbox(0.8, 0.7, 0.7, MAT.paint(0x4c5661, { wear: 0.4 }), 0.05), X1 + 0.2, H - 0.4, 1.25));
    drv.add(at(cylX(0.34, 1.1, MAT.paint(0x3f5b4b, { wear: 0.35 }), 32), X1 + 0.2, H - 0.4, 2.3)); drv.children[1].rotation.set(Math.PI / 2, 0, 0);
    scene.add(at(box(1.6, 0.25, 2.2, galv), X1 + 0.2, 0.12, 1.8)); scene.add(drv);
    scene.add(at(plate(['CT-101 · BAUXITA'], 1.6, 0.26, { bg: '#1b1f24', fg: '#e8b93a' }), -4, H - 0.25, 0.83));
    // esticador por gravidade
    const est = new T.Group(); const ex = 8.4;
    [-0.6, 0.6].forEach(z => est.add(at(box(0.12, 3.2, 0.12, galv), ex, 1.6 - 0.0, z + 1.6)));
    est.add(at(box(0.12, 0.12, 1.4, galv), ex, 3.2, 1.6));
    const cw8 = rbox(0.9, 0.7, 0.9, MAT.concrete([1, 1], 0x9a9895, 21), 0.04); at(cw8, ex, 2.0, 1.6); est.add(cw8); R.counter = cw8;
    est.add(at(cyl(0.015, 0.015, 1.2, MAT.steel(), 6), ex, 2.85, 1.6));
    est.add(at(plate(['CONTRAPESO', '3,5 t'], 0.6, 0.22, { bg: '#d9a21c', fg: '#1b1f24' }), ex, 2.0, 2.06));
    const pin = cylZ(0.04, 1.4, MAT.flat(0xb3261e, { rough: 0.4 }), 10); at(pin, ex, 1.55, 1.6); pin.visible = false; est.add(pin); R.pin = pin;
    R.parts.esticador = ctx.hit(est, 'esticador'); R.anchors.esticador = [ex, 2.0, 2.0]; R.names.esticador = 'Esticador por gravidade (contrapeso)';
    // cabo de emergência
    const cabo = new T.Group(); const cy = H + 0.15, cz = 1.0;
    cabo.add(at(cylX(0.008, X1 - X0 - 1, MAT.flat(0xd2a024, { rough: 0.5 }), 6), 0, cy, cz));
    [-10, -2, 6].forEach(x => { cabo.add(at(rbox(0.2, 0.26, 0.16, MAT.paint(0xd2a024, { wear: 0.4 }), 0.02), x, cy, cz + 0.04)); cabo.add(at(box(0.05, 0.4, 0.05, galv), x, cy - 0.3, cz)); });
    R.parts.cabo = ctx.hit(cabo, 'cabo'); R.anchors.cabo = [-2, cy, cz]; R.names.cabo = 'Cabo de emergência (puxar para parar)';
    // rolete travado
    const jam = R.idlers[R.idlers.length / 2 | 0]; jam.children[0].material = MAT.paint(0x7a3b22, { wear: 0.9, seed: 149 });
    const jamHit = new T.Group(); jamHit.position.copy(jam.position); const jb = box(0.35, 0.3, 1.5, MAT.flat(0x000000, { opacity: 0.001 })); jb.material.transparent = true; jb.material.depthWrite = false; jb.castShadow = false; jamHit.add(jb);
    R.parts.rolete = ctx.hit(jamHit, 'rolete'); R.anchors.rolete = [jam.position.x, H, 0]; R.names.rolete = 'Rolete de carga travado';
    R.jam = jam;
    // botoeira local
    const bot = new T.Group(); const bx = -6.2, bz = 2.0;
    bot.add(at(cyl(0.04, 0.04, 1.4, galv, 10), bx, 0.7, bz));
    bot.add(at(rbox(0.3, 0.42, 0.2, MAT.paint(0xd8a21c, { wear: 0.5, seed: 151 }), 0.03), bx, 1.52, bz));
    bot.add(at(cylZ(0.05, 0.05, MAT.flat(0x1f8a43), 20), bx, 1.6, bz + 0.12)); bot.add(at(cylZ(0.06, 0.06, MAT.flat(0xb3261e), 20), bx, 1.43, bz + 0.12));
    R.parts.botoeira = ctx.hit(bot, 'botoeira'); R.anchors.botoeira = [bx, 1.5, bz]; R.names.botoeira = 'Botoeira local CT-101';
    // painel elétrico
    const pn = new T.Group(); const px = -10.5, pz = -2.8;
    pn.add(at(cabinet(1.6, 2.1, 0.6, 0xc5c7c2, 0.35, 153), px, 1.05, pz));
    pn.add(at(plate(['QD-CT101 · 440 V'], 1.2, 0.16, { bg: '#1b1f24', fg: '#f2f2f2' }), px, 1.9, pz + 0.31));
    const pk = new T.Group(); pk.position.set(px + 0.35, 1.25, pz + 0.33); pk.add(rbox(0.07, 0.24, 0.06, MAT.flat(0x1b1f24), 0.02)); pn.add(pk); R.panelKnob = pk;
    const pg = lamp(0x2fbf5a, true), pr = lamp(0xd93a2b, false); at(pg, px - 0.3, 1.5, pz + 0.32); at(pr, px - 0.15, 1.5, pz + 0.32); pn.add(pg); pn.add(pr); R.pLamps = [pg, pr];
    R.parts.painel = ctx.hit(pn, 'painel'); R.anchors.painel = [px, 1.3, pz + 0.3]; R.names.painel = 'QD-CT101 · Painel da correia';
    const lkP = padlock(); lkP.position.set(px + 0.5, 1.05, pz + 0.36); lkP.visible = false; scene.add(lkP); R.lockPanel = lkP;
    // caixa coletiva
    const cxx = new T.Group(); const cp = [-9.2, 1.2, pz + 0.05];
    cxx.add(at(cabinet(0.5, 0.6, 0.22, 0xb3261e, 0.3, 155), ...cp));
    cxx.add(at(plate(['BLOQUEIO', 'COLETIVO'], 0.4, 0.14, { bg: '#f1efe8', fg: '#b3261e' }), cp[0], cp[1] + 0.13, cp[2] + 0.115));
    R.parts.caixa = ctx.hit(cxx, 'caixa'); R.anchors.caixa = [cp[0], cp[1], cp[2] + 0.12]; R.names.caixa = 'Caixa de bloqueio coletivo';
    R.boxLocks = [0xd9531e, 0x2f6db5, 0x1f8a43].map((c, i) => { const l = padlock(c, i === 2); l.position.set(cp[0] - 0.13 + i * 0.13, cp[1] - 0.2, cp[2] + 0.13); l.visible = false; scene.add(l); return l; });
    // pessoas
    const op = person({ suit: 0x2b3a55 }); op.position.set(3.2, 0, 3.0); op.rotation.y = -0.7;
    R.parts.operador = ctx.hit(op, 'operador'); R.anchors.operador = [3.2, 1.4, 3.0]; R.names.operador = 'Operador da área';
    const ct = person({ suit: 0x5a6b2a, helmet: 0x2f6db5 }); ct.position.set(-2.4, 0, 3.4); ct.rotation.y = 0.3;
    R.parts.contratado = ctx.hit(ct, 'contratado'); R.anchors.contratado = [-2.4, 1.4, 3.4]; R.names.contratado = 'Mecânico da contratada';
    const me = person({ suit: 0x3d4a3a, helmet: 0xd8a21c }); me.position.set(-4.4, 0, 2.6); me.rotation.y = 2.8; scene.add(me);
    // animação
    let sp = 1;
    ctx.tick((dt) => {
      sp += ((R.state.running ? 1 : 0) - sp) * Math.min(1, dt * 1.2);
      R.pileTex.offset.x -= dt * 0.35 * sp; beltM.map.offset.x -= dt * 0.8 * sp;
      R.headDrum.rotation.y += 0; [R.headDrum, R.tailDrum].forEach(d => d.rotateY(-dt * 4 * sp));
      R.idlers.forEach(g => { if (g !== R.jam) g.children[0].rotateY(dt * 9 * sp); });
      const ty = R.state.tension ? 2.0 : 1.95; R.counter.position.y += (ty - R.counter.position.y) * dt * 2;
    });
    R.setPanel = (on) => { R.pLamps[0].material.emissiveIntensity = on ? 2.5 : 0.05; R.pLamps[1].material.emissiveIntensity = on ? 0.05 : 2.5; R.panelKnob.rotation.z = on ? 0 : -Math.PI / 2; };
    R.view = { cam: [2.5, 4.6, 11], target: [-1.5, 1.2, 0] };
    return R;
  }
  return { pump, crane, conveyor };
})();
