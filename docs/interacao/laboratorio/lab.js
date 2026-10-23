/* Prokopē · laboratório de movimento · motor
   - tokens de movimento.md (durações, curvas, molas)
   - controles do topo: velocidade, movimento reduzido e tema
   - animação por canais (translate, scale, opacity, stroke-dashoffset, width...) com mola ou curva.
     A mola vira uma curva linear() do CSS e roda na Web Animations API; quando uma animação é
     interrompida, a próxima parte do valor e da velocidade atuais, sem salto.
   - gestos: a mola é integrada quadro a quadro com a velocidade do dedo (Mola.step)
   - peças: número que rola (como o NumberFlow), anel, ✓ que se desenha, toast, toque com escala
   - o cartão de cada demonstração (Lab.demo) e o índice
   Depende de mola.js e dos helpers de ../telas/base.js (ico, chk, hr, ringBox...). */
var Lab = (function () {
  'use strict';
  var root = document.documentElement;
  var Q = new URLSearchParams(location.search);

  /* ================= tokens ================= */
  var DUR = { press: 100, micro: 150, base: 240, fill: 400, ring: 600, glow: 900, confetti: 1600 };
  var EASE = { out: [0.2, 0.8, 0.2, 1], inOut: [0.65, 0, 0.35, 1], exit: [0.4, 0, 1, 1], spring: [0.34, 1.56, 0.64, 1], linear: [0, 0, 1, 1] };
  var EASE_TOKEN = { out: '--ease-out', inOut: '--ease-in-out', exit: '--ease-exit', spring: '--ease-spring', linear: 'linear' };
  var SPRING = {
    calma: { visualDuration: 0.35, bounce: 0 },
    toque: { visualDuration: 0.25, bounce: 0.25 },
    folha: { visualDuration: 0.4, bounce: 0.08 },
    festa: { visualDuration: 0.6, bounce: 0.35 }
  };
  var EF = {}, SP = {};
  Object.keys(EASE).forEach(function (k) { EF[k] = Mola.bezier.apply(null, EASE[k]); });
  Object.keys(SPRING).forEach(function (k) { SP[k] = Mola.params(SPRING[k]); });

  function br(n) { return String(n).replace('.', ','); }
  function msTxt(n) { return n.toLocaleString('pt-BR') + ' ms'; }
  /* texto do token para a linha de baixo do cartão: tok('toque') → "toque · 250 ms · bounce 0,25" */
  function tok(name, extra) {
    var s;
    if (SPRING[name]) s = name + ' · ' + msTxt(Math.round(SPRING[name].visualDuration * 1000)) + ' · bounce ' + br(SPRING[name].bounce);
    else if (DUR[name]) s = name + ' · ' + msTxt(DUR[name]);
    else if (EASE_TOKEN[name]) s = EASE_TOKEN[name];
    else s = name;
    return extra ? s + ' · ' + extra : s;
  }

  /* ================= estado: velocidade, movimento, tema ================= */
  var S = { speed: 1, motion: 'system', theme: 'system' };
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return S.motion === 'reduced' || (S.motion === 'system' && mq.matches); }
  /* duração real em ms, já com a velocidade: T('base') ou T(240) */
  function T(x) { return (typeof x === 'string' ? DUR[x] : x) / S.speed; }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function cssVars() {
    Object.keys(DUR).forEach(function (k) { root.style.setProperty('--lab-' + k, T(k) + 'ms'); });
    root.classList.toggle('lab-reduced', reduced());
    var sys = document.getElementById('lab-sys');
    if (sys) sys.textContent = reduced() ? 'agora reduzido' : 'agora completo';
  }

  /* ================= canais ================= */
  var CH = {
    x: { rest: 0, css: function (v) { return { translate: v + 'px 0px' }; } },
    xp: { rest: 0, css: function (v) { return { translate: v + '% 0px' }; } },
    y: { rest: 0, css: function (v) { return { translate: '0px ' + v + 'px' }; } },
    yp: { rest: 0, css: function (v) { return { translate: '0px ' + v + '%' }; } },
    roll: { rest: 0, css: function (v) { return { translate: '0px ' + (-v) + 'lh' }; } },
    scale: { rest: 1, css: function (v) { return { scale: String(v) }; } },
    sx: { rest: 1, css: function (v) { return { scale: v + ' 1' }; } },
    opacity: { rest: 1, css: function (v) { return { opacity: String(v) }; } },
    dash: { rest: 0, css: function (v) { return { strokeDashoffset: v + 'px' }; } },
    w: { rest: 0, css: function (v) { return { width: v + '%' }; } },
    wpx: { rest: 0, css: function (v) { return { width: v + 'px' }; } },
    hpx: { rest: 0, css: function (v) { return { height: v + 'px' }; } }
  };
  var bag = new WeakMap();
  function chan(el, name) {
    var b = bag.get(el); if (!b) { b = {}; bag.set(el, b); }
    if (!b[name]) b[name] = { value: CH[name].rest, run: null };
    return b[name];
  }
  function sampleC(c, t) { return c.run ? c.run.sample(t === undefined ? performance.now() : t) : { x: c.value, v: 0 }; }
  function apply(el, name, v) { var o = CH[name].css(v); for (var k in o) el.style[k] = o[k]; }
  /* valor atual (mesmo no meio de uma animação) */
  function get(el, name) { return sampleC(chan(el, name)).x; }
  /* põe o valor na hora, parando o que estiver rodando */
  function set(el, name, v) {
    var c = chan(el, name);
    if (c.run) { var r = c.run; c.run = null; r.stop(); }
    c.value = v; apply(el, name, v);
  }
  function resolve(how) {
    if (typeof how === 'string') {
      if (SPRING[how]) return { spring: how };
      if (DUR[how] !== undefined) return { dur: DUR[how], ease: 'out' };
    }
    how = how || {};
    if (how.spring) return { spring: how.spring };
    return { dur: typeof how.dur === 'string' ? DUR[how.dur] : (how.dur === undefined ? DUR.base : how.dur), ease: how.ease || 'out' };
  }

  /* anima um canal até target. how: 'toque' | 'base' | { dur: 'fill', ease: 'inOut' } | { spring: 'festa' }
     o: { delay (ms, antes da velocidade), from, velocity (unidades/s), keep (mola mesmo no reduzido) }
     devolve uma promessa: true se terminou, false se foi interrompida */
  function to(el, name, target, how, o) {
    o = o || {};
    var c = chan(el, name), t0 = performance.now(), cur = sampleC(c, t0);
    if (c.run) { var old = c.run; c.run = null; old.stop(); }
    var from = o.from !== undefined ? o.from : cur.x;
    var v0 = o.velocity !== undefined ? o.velocity : (o.from !== undefined ? 0 : cur.v);
    var h = resolve(how);
    if (h.spring && reduced() && !o.keep) h = { dur: DUR.micro, ease: 'out' };
    var delay = T(o.delay || 0), res, p = new Promise(function (r) { res = r; });
    c.value = target;
    if (Math.abs(target - from) < 1e-7 && (!h.spring || Math.abs(v0) < 1e-3)) { apply(el, name, target); res(true); return p; }
    var simDur, sampler, easing;
    if (h.spring) {
      var lin = Mola.linear(SP[h.spring], from, target, v0);
      if (!lin) { apply(el, name, target); res(true); return p; }
      var sol = Mola.solve(SP[h.spring], from, target, v0);
      simDur = lin.duration; easing = lin.easing;
      sampler = function (tau) { return { x: sol.x(tau), v: sol.v(tau) }; };
    } else {
      var f = EF[h.ease];
      simDur = Math.max(1, h.dur) / 1000; easing = f.css;
      sampler = function (tau) { var u = tau / simDur; return { x: from + (target - from) * f(u), v: (target - from) * f.slope(u) / simDur }; };
    }
    var spd = S.speed, realDur = simDur * 1000 / spd;
    apply(el, name, from);
    var a = el.animate([CH[name].css(from), CH[name].css(target)], { duration: realDur, delay: delay, easing: easing, fill: 'both' });
    var run = {
      sample: function (now) {
        var e = now - t0 - delay;
        if (e <= 0) return { x: from, v: 0 };
        if (e >= realDur) return { x: target, v: 0 };
        return sampler(e * spd / 1000);
      },
      stop: function () { a.cancel(); res(false); }
    };
    c.run = run;
    a.onfinish = function () { if (c.run === run) { c.run = null; apply(el, name, target); } a.cancel(); res(true); };
    return p;
  }

  /* quadros-chave livres (brilho, respiração), com a velocidade aplicada */
  function play(el, kf, o) {
    o = o || {};
    var h = resolve(o.how || { dur: o.dur, ease: o.ease });
    return el.animate(kf, { duration: T(h.dur), easing: EF[h.ease].css, delay: T(o.delay || 0), iterations: o.iterations || 1, direction: o.direction || 'normal', fill: o.fill || 'none' });
  }

  /* mola integrada quadro a quadro, a partir do valor atual e da velocidade do dedo (unidades/s).
     onFrame(x) roda a cada quadro, para mover junto o que depende do valor (fundo, tela de trás).
     No reduzido vira uma transição de 150 ms sem quique. */
  function drive(el, name, target, spring, v0, onFrame, scope) {
    var c = chan(el, name), cur = sampleC(c);
    if (c.run) { var old = c.run; c.run = null; old.stop(); }
    var st = { x: cur.x, v: v0 === undefined ? cur.v : v0 }, from = st.x, raf = 0, dead = false, last = performance.now(), res;
    var p = new Promise(function (r) { res = r; });
    var tw = reduced() ? { from: st.x, t: 0, dur: DUR.micro / 1000 } : null;
    var run = { sample: function () { return { x: st.x, v: st.v }; }, stop: function () { dead = true; cancelAnimationFrame(raf); res(false); } };
    c.run = run; c.value = target;
    function frame(now) {
      if (dead) return;
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) * S.speed, end;
      last = now;
      if (tw) { tw.t += dt; var u = Math.min(1, tw.t / tw.dur); st.x = tw.from + (target - tw.from) * EF.out(u); st.v = 0; end = u >= 1; }
      else { Mola.step(SP[spring], st, target, dt); end = Mola.settled(st, target, from); }
      if (end) { st.x = target; st.v = 0; }
      apply(el, name, st.x);
      if (onFrame) onFrame(st.x);
      if (end) { if (c.run === run) c.run = null; res(true); return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    if (scope) scope.own(run);
    return p;
  }

  /* resistência acima do limite (a mesma do iOS): d px de arrasto viram menos que dim px */
  function rubber(d, dim) { return (1 - 1 / (d * 0.55 / dim + 1)) * dim; }

  /* ================= escopo de cada demonstração ================= */
  function Scope(stage) {
    var timers = [], owned = [];
    var sc = {
      gen: 0,
      after: function (ms, fn, tag) {
        var rec = { tag: tag };
        rec.id = setTimeout(function () { timers.splice(timers.indexOf(rec), 1); fn(); }, T(ms));
        timers.push(rec); return rec;
      },
      cancel: function (tagOrRec) {
        timers = timers.filter(function (r) { if (r === tagOrRec || (r.tag !== undefined && r.tag === tagOrRec)) { clearTimeout(r.id); return false; } return true; });
      },
      /* laço por quadro: fn(dt em segundos já com a velocidade, agora) devolve false para parar */
      loop: function (fn) {
        var rec = { dead: false, raf: 0 }, last = performance.now();
        rec.stop = function () { rec.dead = true; cancelAnimationFrame(rec.raf); };
        function f(now) {
          if (rec.dead) return;
          var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) * S.speed; last = now;
          if (fn(dt, now) === false) { rec.dead = true; return; }
          rec.raf = requestAnimationFrame(f);
        }
        rec.raf = requestAnimationFrame(f); owned.push(rec);
        return rec;
      },
      own: function (r) { owned.push(r); },
      /* função que só roda se a demonstração não foi recomeçada desde que ela foi criada */
      live: function (fn) { var g = sc.gen; return function () { if (g === sc.gen) return fn.apply(this, arguments); }; },
      clear: function () {
        timers.forEach(function (r) { clearTimeout(r.id); }); timers = [];
        owned.forEach(function (r) { r.stop(); }); owned = [];
        stage.getAnimations({ subtree: true }).forEach(function (a) { a.cancel(); });
        sc.gen++;
      }
    };
    return sc;
  }

  /* ================= toque ================= */
  /* toque com escala: pressiona em press (0,97 ou 0,9 no ✓) e volta com a mola toque.
     Arrastar para fora cancela; Enter e Espaço também acionam; ignora um segundo toque em 300 ms */
  function tap(el, fn, o) {
    o = o || {};
    var down = false, last = -1e9, s = o.scale || 0.97;
    if (!el.hasAttribute('role') && el.tagName !== 'BUTTON') el.setAttribute('role', 'button');
    if (!el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') el.setAttribute('tabindex', '0');
    el.style.touchAction = 'manipulation';
    el.classList.add('lab-tap');
    function fire(e) {
      var t = performance.now();
      if (o.guard !== false && t - last < (o.guard || 300)) return;
      last = t; fn(e);
    }
    el.addEventListener('pointerdown', function (e) { if (e.button !== 0 || e.labTapDown) return; e.labTapDown = true; down = true; if (o.scale !== false) press(el, s); });
    el.addEventListener('pointerleave', function () { if (down) { down = false; if (o.scale !== false) release(el); } });
    el.addEventListener('pointercancel', function () { if (down) { down = false; if (o.scale !== false) release(el); } });
    el.addEventListener('pointerup', function (e) { if (!down) return; down = false; if (o.scale !== false) release(el); if (e.labTap) return; e.labTap = true; fire(e); });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); if (o.scale !== false) pulse(el, s); fire(e);
    });
  }
  function press(el, s) {
    if (reduced()) { to(el, 'opacity', 0.7, 'press'); return; }
    to(el, 'scale', s || 0.97, { dur: 'press', ease: 'out' });
  }
  function release(el) {
    if (reduced()) { to(el, 'opacity', 1, 'micro'); return; }
    to(el, 'scale', 1, 'toque');
  }
  /* o mesmo toque, para o botão "Tocar" */
  function pulse(el, s) {
    press(el, s);
    setTimeout(function () { release(el); }, T('press'));
  }

  /* ================= arrasto ================= */
  /* o: { axis 'x'|'y', filter(e), begin(e), move(dx, dy, e), end(dx, dy, vx, vy) }.
     O movimento é ouvido na janela desde o toque (o dedo sai logo de uma borda de 20 px), mas o ponteiro
     só é capturado depois de 5 px, para os toques nos filhos continuarem funcionando.
     A velocidade é medida nos últimos 80 ms; se o dedo parou antes de soltar, ela é zero. */
  function drag(el, o) {
    var a = null;
    el.style.touchAction = 'none';
    /* sem seleção de texto: com o mouse, um texto selecionado vira arrasto nativo e o navegador cancela o ponteiro */
    el.style.userSelect = 'none'; el.style.webkitUserSelect = 'none';
    function stopListening() {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
    }
    el.addEventListener('pointerdown', function (e) {
      if (a) stopListening();
      a = null;
      if (e.button !== 0) return;
      if (o.filter && !o.filter(e)) return;
      a = { id: e.pointerId, x0: e.clientX, y0: e.clientY, pts: [[e.timeStamp, e.clientX, e.clientY]], on: false };
      window.addEventListener('pointermove', move, true);
      window.addEventListener('pointerup', end, true);
      window.addEventListener('pointercancel', end, true);
    });
    function move(e) {
      if (!a || e.pointerId !== a.id) return;
      var dx = e.clientX - a.x0, dy = e.clientY - a.y0;
      if (!a.on) {
        var main = o.axis === 'x' ? dx : dy, cross = o.axis === 'x' ? dy : dx;
        if (Math.abs(main) < 5) { if (Math.abs(cross) > 10) { a = null; stopListening(); } return; }
        a.on = true;
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        if (o.begin) o.begin(e);
      }
      a.pts.push([e.timeStamp, e.clientX, e.clientY]);
      while (a.pts.length > 2 && e.timeStamp - a.pts[0][0] > 100) a.pts.shift();
      o.move(dx, dy, e);
    }
    function end(e) {
      if (!a || e.pointerId !== a.id) return;
      var w = a; a = null;
      stopListening();
      if (!w.on) return;
      var lastPt = w.pts[w.pts.length - 1], first = w.pts[0];
      /* cancelado pelo navegador: solta no último ponto conhecido, sem velocidade */
      if (e.type === 'pointercancel') { o.end(lastPt[1] - w.x0, lastPt[2] - w.y0, 0, 0); return; }
      for (var i = 0; i < w.pts.length; i++) { if (e.timeStamp - w.pts[i][0] <= 80) { first = w.pts[i]; break; } }
      var dt = (e.timeStamp - first[0]) / 1000, vx = 0, vy = 0;
      if (dt > 0.008 && e.timeStamp - lastPt[0] < 80) { vx = (e.clientX - first[1]) / dt; vy = (e.clientY - first[2]) / dt; }
      o.end(e.clientX - w.x0, e.clientY - w.y0, vx, vy);
    }
  }

  /* ================= entrar e sair ================= */
  /* fadeUp de movimento.md: sobe 8 px com opacidade em base; no reduzido, só opacidade em micro */
  function enter(el, o) {
    o = o || {};
    el.hidden = false;
    var y = o.y === undefined ? 8 : o.y;
    if (reduced()) { set(el, 'y', 0); return to(el, 'opacity', 1, 'micro', { delay: o.delay }); }
    if (get(el, 'opacity') < 0.02) set(el, 'y', y);
    to(el, 'y', 0, o.how || 'base', { delay: o.delay });
    return to(el, 'opacity', 1, o.how || 'base', { delay: o.delay });
  }
  /* saída: só opacidade, em micro com --ease-exit */
  function leave(el, o) {
    o = o || {};
    return to(el, 'opacity', 0, { dur: 'micro', ease: 'exit' }, { delay: o.delay }).then(function (ok) { if (ok && o.hide) el.hidden = true; return ok; });
  }
  function hide(el) { set(el, 'opacity', 0); el.hidden = true; }

  /* ================= número que rola (como o NumberFlow) =================
     Cada algarismo é uma coluna com uma fita 0–9 repetida 3 vezes; a fita rola na direção da mudança.
     Inteiros alinham pela unidade e decimais pela vírgula; colunas novas entram abrindo a largura,
     as que sobram saem fechando. proportional: true mede a largura de cada algarismo (Fraunces). */
  var NF = {};
  function nf(dec) { return NF[dec] || (NF[dec] = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: dec, useGrouping: false })); }
  function numParts(str) {
    var i = str.indexOf(','), ip = i < 0 ? str : str.slice(0, i), fp = i < 0 ? '' : str.slice(i + 1), out = [];
    for (var k = 0; k < ip.length; k++) out.push({ key: 'i' + (ip.length - 1 - k), d: +ip[k] });
    if (i >= 0) { out.push({ key: 'dec', sym: ',' }); for (k = 0; k < fp.length; k++) out.push({ key: 'f' + k, d: +fp[k] }); }
    return out;
  }
  function keyOrder(key) { if (key === 'dec') return 0; var n = +key.slice(1); return key[0] === 'i' ? -1 - n : 1 + n; }
  function mod10(n) { return ((n % 10) + 10) % 10; }

  function roller(el, value, o) {
    o = o || {};
    var dec = o.decimals || 0, prop = !!o.proportional, cols = {}, cur = value, widths = null;
    el.classList.add('lab-roll');
    el.innerHTML = '<span class="lab-roll-in" aria-hidden="true"></span>' + (o.suffix ? '<span aria-hidden="true">' + o.suffix + '</span>' : '') + '<span class="lab-sr"></span>';
    var box = el.firstChild, sr = el.lastChild;
    function measure() {
      if (!prop) return;
      var m = document.createElement('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
      el.appendChild(m); widths = [];
      for (var d = 0; d < 10; d++) { m.textContent = String(d); widths[d] = m.getBoundingClientRect().width; }
      el.removeChild(m);
    }
    function make(p) {
      var e = document.createElement('span'), c = { key: p.key, el: e };
      e.dataset.k = p.key;
      if (p.sym) { e.className = 'lab-rsym'; e.textContent = p.sym; c.sym = true; return c; }
      e.className = 'lab-rd';
      var s = document.createElement('span'), h = '';
      s.className = 'lab-rs';
      for (var k = 0; k < 30; k++) h += '<span>' + (k % 10) + '</span>';
      s.innerHTML = h; e.appendChild(s);
      c.strip = s; c.d = p.d;
      return c;
    }
    function natural(c) { return prop && !c.sym ? widths[c.d] : c.w; }
    function insert(c) {
      var ord = keyOrder(c.key), kids = box.children, ref = null;
      for (var i = 0; i < kids.length; i++) { if (keyOrder(kids[i].dataset.k) > ord) { ref = kids[i]; break; } }
      box.insertBefore(c.el, ref);
      c.w = c.el.getBoundingClientRect().width || c.w;
    }
    function build(ps) {
      box.textContent = ''; cols = {};
      if (prop && !widths) measure();
      ps.forEach(function (p) {
        var c = cols[p.key] = make(p);
        if (!c.sym) set(c.strip, 'roll', 10 + p.d);
        insert(c);
        if (prop && !c.sym) set(c.el, 'wpx', widths[p.d]);
      });
    }
    function label(str) { sr.textContent = str + (o.suffix || ''); }
    function update(value, u) {
      u = u || {};
      var str = nf(dec).format(value), ps = numParts(str), dir = value > cur ? 1 : value < cur ? -1 : 0;
      cur = value; label(str);
      if (reduced() || u.instant) { build(ps); return; }
      var how = u.how || { dur: 'fill', ease: 'out' }, delay = u.delay || 0, keep = {};
      ps.forEach(function (p) {
        keep[p.key] = true;
        var c = cols[p.key];
        if (c && c.exiting) {
          c.exiting = false;
          to(c.el, 'opacity', 1, how, { delay: delay });
          if (!c.sym) { c.d = p.d; spin(c, p.d, dir, how, delay); }
          to(c.el, 'wpx', natural(c), how, { delay: delay }).then(function (ok) { if (ok && !prop && !c.exiting) c.el.style.width = ''; });
          return;
        }
        if (!c) {
          c = cols[p.key] = make(p);
          if (!c.sym) set(c.strip, 'roll', 10 + p.d - dir);
          insert(c);
          var w = natural(c);
          set(c.el, 'wpx', 0); set(c.el, 'opacity', 0);
          to(c.el, 'opacity', 1, how, { delay: delay });
          to(c.el, 'wpx', w, how, { delay: delay }).then(function (ok) { if (ok && !prop && !c.exiting) c.el.style.width = ''; });
          if (!c.sym) to(c.strip, 'roll', 10 + p.d, how, { delay: delay });
          return;
        }
        if (!c.sym) spin(c, p.d, dir, how, delay);
      });
      Object.keys(cols).forEach(function (k) {
        var c = cols[k];
        if (keep[k] || c.exiting) return;
        c.exiting = true;
        var w = c.el.getBoundingClientRect().width;
        to(c.el, 'opacity', 0, { dur: (how.dur ? resolve(how).dur : DUR.fill) * 0.6, ease: 'exit' }, { delay: delay });
        to(c.el, 'wpx', 0, how, { from: w, delay: delay }).then(function (ok) { if (ok && c.exiting) { c.el.remove(); delete cols[k]; } });
      });
    }
    function spin(c, d, dir, how, delay) {
      var s = sampleC(chan(c.strip, 'roll')), pn = mod10(s.x - 10) + 10, t;
      if (dir > 0) { t = Math.ceil(pn - 1e-3); while (mod10(t) !== d) t++; }
      else if (dir < 0) { t = Math.floor(pn + 1e-3); while (mod10(t) !== d) t--; }
      else { t = Math.round(pn); var up = t, dn = t; while (mod10(up) !== d) up++; while (mod10(dn) !== d) dn--; t = up - pn < pn - dn ? up : dn; }
      c.d = d;
      if (Math.abs(t - pn) < 1e-3 && Math.abs(s.v) < 1e-3) set(c.strip, 'roll', t);
      else to(c.strip, 'roll', t, how, { from: pn, velocity: s.v, delay: delay });
      if (prop) to(c.el, 'wpx', widths[d], how, { delay: delay });
    }
    var str0 = nf(dec).format(value);
    build(numParts(str0)); label(str0);
    if (prop && document.fonts) document.fonts.ready.then(function () {
      widths = null; measure();
      Object.keys(cols).forEach(function (k) { var c = cols[k]; if (!c.sym && !c.exiting) set(c.el, 'wpx', widths[c.d]); });
    });
    return { update: update, get value() { return cur; } };
  }

  /* ================= anel ================= */
  /* controla um <svg class="ringsvg"> de ring()/ringBox() desenhado com pct 1 */
  function ringCtl(svg, pct) {
    var cs = svg.querySelectorAll('circle'), arc = cs[1];
    var r = +arc.getAttribute('r'), C = 2 * Math.PI * r;
    arc.style.strokeDasharray = C.toFixed(2) + 'px';
    function clamp01(p) { return Math.max(0, Math.min(1, p)); }
    var api = {
      C: C, pct: pct,
      get arc() { return arc; },
      set: function (p) { api.pct = p; set(arc, 'dash', C * (1 - clamp01(p))); set(arc, 'opacity', p <= 0.0005 ? 0 : 1); },
      /* o: opções de to(); o.quiet troca por opacidade (movimento reduzido ou dado vindo de outro aparelho) */
      to: function (p, how, o) {
        api.pct = p; var q = clamp01(p);
        if (reduced() || (o && o.quiet)) {
          var old = arc, nw = old.cloneNode(false);
          set(nw, 'dash', C * (1 - q)); set(nw, 'opacity', 0);
          old.parentNode.insertBefore(nw, old.nextSibling); arc = nw;
          to(nw, 'opacity', q <= 0.0005 ? 0 : 1, 'micro', o);
          return to(old, 'opacity', 0, 'micro', o).then(function () { old.remove(); });
        }
        if (q > 0.0005) set(arc, 'opacity', 1);
        return to(arc, 'dash', C * (1 - q), how || { dur: 'ring', ease: 'out' }, o);
      }
    };
    api.set(pct);
    return api;
  }

  /* ================= ✓ que se desenha ================= */
  /* troca o ícone do chk() por uma camada de preenchimento e o ✓ do Phosphor (bold) em SVG */
  function checkCtl(el) {
    var on = el.classList.contains('on');
    el.classList.add('lab-chk');
    el.innerHTML = '<span class="lab-chk-f"></span><svg class="lab-chk-v" viewBox="0 0 256 256" aria-hidden="true"><path pathLength="1" d="M40 144 L96 200 L224 72"/></svg>';
    var f = el.firstChild, v = el.lastChild, path = v.firstChild;
    function now(x) {
      on = x; el.classList.toggle('on', x);
      set(f, 'scale', x ? 1 : 0); set(f, 'opacity', 1); set(v, 'opacity', x ? 1 : 0); set(path, 'dash', x ? 0 : 1);
    }
    now(on);
    return {
      get on() { return on; },
      set: now,
      /* o.quiet: troca de 150 ms sem mola (movimento reduzido ou dado vindo de outro aparelho) */
      to: function (x, o) {
        on = x; el.classList.toggle('on', x);
        if (reduced() || (o && o.quiet)) {
          set(f, 'scale', 1); set(path, 'dash', 0);
          to(f, 'opacity', x ? 1 : 0, 'micro'); to(v, 'opacity', x ? 1 : 0, 'micro');
          return;
        }
        set(f, 'opacity', 1);
        if (x) {
          var s = get(f, 'scale');
          to(f, 'scale', 1, 'toque', s < 0.35 ? { from: 0.35 } : {});
          set(v, 'opacity', 1);
          to(path, 'dash', 0, 'toque', { delay: 40 });
        } else {
          to(path, 'dash', 1, { dur: 'micro', ease: 'exit' });
          to(v, 'opacity', 0, { dur: 'micro', ease: 'exit' }, { delay: 90 });
          to(f, 'scale', 0, { dur: 'micro', ease: 'out' });
        }
      }
    };
  }

  /* ================= toast ================= */
  /* um por vez: o novo substitui o anterior. Usa o toast() da base, dentro de host (o celular).
     o: { p pilar, ic, t título, s linha de baixo, act ação, actIcon, onAction, ms (0 = até dispensar), fio (mostra o fio esvaziando), low } */
  function toaster(host, scope) {
    var cur = null;
    function show(o) {
      if (cur) dismiss(cur);
      var t = { o: o }, fio = o.fio !== undefined ? o.fio : !!(o.ms && o.act), box = document.createElement('div');
      box.innerHTML = toast({ p: o.p, ic: o.ic, t: o.t, s: o.s, act: o.act || 'Desfazer', actIcon: o.actIcon, fio: fio ? 1 : null, low: o.low });
      var el = box.firstChild;
      el.setAttribute('aria-live', 'polite');
      /* o toast() da base sempre traz uma ação; um aviso sem ação esconde o botão */
      if (!o.act) { el.removeChild(el.querySelector('.tact')); el.classList.add('lab-noact'); }
      host.appendChild(el); t.el = el; cur = t;
      set(el, 'opacity', 0);
      if (!reduced()) set(el, 'y', 8);
      enter(el);
      if (o.ms) {
        if (fio) { var bar = el.querySelector('.fio i'); set(bar, 'sx', 1); to(bar, 'sx', 0, { dur: o.ms, ease: 'linear' }); }
        t.timer = scope.after(o.ms, function () { dismiss(t); });
      }
      var b = el.querySelector('.tact');
      if (b) tap(b, function () { if (o.onAction) o.onAction(); dismiss(t); });
      drag(el, {
        axis: 'y',
        begin: function () { t.y0 = get(el, 'y'); },
        move: function (dx, dy) { set(el, 'y', dy > 0 ? t.y0 + dy : t.y0 - rubber(-dy, 40)); },
        end: function (dx, dy, vx, vy) {
          if (dy > 24 || vy > 400) { to(el, 'y', get(el, 'y') + 24, { dur: 'micro', ease: 'exit' }); dismiss(t); }
          else drive(el, 'y', 0, 'toque', vy);
        }
      });
      return t;
    }
    function dismiss(t) {
      if (!t || t.gone) return;
      t.gone = true; if (cur === t) cur = null;
      if (t.timer) scope.cancel(t.timer);
      t.el.style.pointerEvents = 'none';
      leave(t.el).then(function (ok) { if (ok) t.el.remove(); });
    }
    return { show: show, hide: function () { dismiss(cur); }, get current() { return cur; } };
  }

  /* ================= pedaço de tela ================= */
  function frag(body, o) {
    o = o || {};
    return '<div class="phone lab-frag' + (o.cls ? ' ' + o.cls : '') + '"' + (o.h ? ' style="height:' + o.h + 'px"' : '') + '>' + body + '</div>';
  }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ================= cartões ================= */
  var DEMOS = [];
  function demo(d) { DEMOS.push(d); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function button(ctl, label, kind, icon, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lab-b ' + kind;
    b.innerHTML = (icon || '') + '<span>' + label + '</span>';
    b.addEventListener('click', fn); ctl.appendChild(b); return b;
  }
  function resetDemo(d) { d.scope.clear(); if (d.api.reset) d.api.reset(); }
  function replay(d) {
    resetDemo(d);
    if (d.api.play) requestAnimationFrame(function () { requestAnimationFrame(d.scope.live(function () { d.api.play(); })); });
  }
  function resetAll() { DEMOS.forEach(function (d) { if (d.api) resetDemo(d); }); }

  function controls() {
    function mark(attr, v) { $$('[' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(v))); }); }
    function setTheme(v) {
      S.theme = v;
      if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
      mark('data-theme-btn', v);
      document.dispatchEvent(new CustomEvent('lab:theme'));
    }
    $$('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () { S.speed = +b.dataset.speed; mark('data-speed', b.dataset.speed); cssVars(); });
    });
    $$('[data-motion]').forEach(function (b) {
      b.addEventListener('click', function () { S.motion = b.dataset.motion; mark('data-motion', S.motion); cssVars(); resetAll(); });
    });
    $$('[data-theme-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.dataset.themeBtn); store('pk-lab-theme', b.dataset.themeBtn); });
    });
    var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
    (mqDark.addEventListener ? mqDark.addEventListener.bind(mqDark, 'change') : mqDark.addListener.bind(mqDark))(function () { document.dispatchEvent(new CustomEvent('lab:theme')); });
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(function () { cssVars(); if (S.motion === 'system') resetAll(); });
    var sp = parseFloat(Q.get('speed'));
    S.speed = [1, 0.5, 0.25].indexOf(sp) > -1 ? sp : 1;
    S.motion = ['system', 'reduced', 'full'].indexOf(Q.get('motion')) > -1 ? Q.get('motion') : 'system';
    mark('data-speed', S.speed); mark('data-motion', S.motion);
    setTheme(Q.get('theme') || read('pk-lab-theme') || 'system');
  }

  function boot() {
    controls(); cssVars();
    var only = Q.get('only') ? Q.get('only').split(',') : null;
    var grid = $('#lab-grid'), idx = $('#lab-index'), nav = '';
    DEMOS.sort(function (a, b) { return a.n - b.n; });
    DEMOS.forEach(function (d) {
      nav += '<a href="#d-' + d.id + '" data-id="' + d.id + '"><small>' + pad2(d.n) + '</small>' + d.name + '</a>';
      if (only && only.indexOf(d.id) < 0) return;
      var card = document.createElement('article');
      card.className = 'lab-card' + (d.wide ? ' wide' : '');
      card.id = 'd-' + d.id;
      card.innerHTML = '<header class="lab-ch"><span class="lab-n">' + pad2(d.n) + '</span><div><h2>' + d.name + '</h2><p>' + d.lede + '</p></div></header>' +
        '<div class="lab-stage"></div><div class="lab-ctl"></div>' + (d.hint ? '<p class="lab-hint">' + ico('hand-tap', 'regular') + '<span>' + d.hint + '</span></p>' : '') +
        '<div class="lab-tok">' + (d.tokens || []).map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
      grid.appendChild(card);
      var stage = $('.lab-stage', card);
      d.scope = Scope(stage); d.card = card;
      d.api = d.build(stage, d.scope) || {};
      var ctl = $('.lab-ctl', card);
      if (d.api.play) button(ctl, 'Tocar', 'p', ico('play', 'fill'), function () { d.api.play(); });
      (d.api.extra || []).forEach(function (x) { button(ctl, x[0], 's', x[2] ? ico(x[2], 'bold') : '', x[1]); });
      button(ctl, 'Repetir', 's', ico('arrow-counter-clockwise', 'bold'), function () { replay(d); });
      if (d.api.reset) d.api.reset();
    });
    idx.innerHTML = '<b>Demonstrações</b>' + nav;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          $$('a', idx).forEach(function (a) { a.classList.toggle('on', 'd-' + a.dataset.id === e.target.id); });
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      $$('.lab-card').forEach(function (c) { io.observe(c); });
    }
    /* ?play=marcar,proteina ou ?play=all toca ao abrir (para conferir sem clicar) */
    var pl = Q.get('play');
    if (pl) setTimeout(function () {
      DEMOS.forEach(function (d) { if (d.api && d.api.play && (pl === 'all' || pl.split(',').indexOf(d.id) > -1)) d.api.play(); });
    }, 400);
  }

  return {
    DUR: DUR, EASE: EASE, EF: EF, SPRING: SPRING, SP: SP, S: S,
    tok: tok, br: br, T: T, reduced: reduced,
    to: to, set: set, get: get, play: play, drive: drive, rubber: rubber,
    tap: tap, pulse: pulse, press: press, release: release, drag: drag,
    enter: enter, leave: leave, hide: hide,
    roller: roller, ringCtl: ringCtl, checkCtl: checkCtl, toaster: toaster,
    frag: frag, $: $, $$: $$, demo: demo, boot: boot
  };
})();
