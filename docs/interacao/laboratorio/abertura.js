/* Prokopē · abertura: três propostas para a tela que aparece enquanto o app carrega, com a arte do caminho da tela
   Entrar. Cada celular simula uma abertura: nada até 300 ms (estados.md), a abertura enquanto os dados não chegam e
   a saída para o Hoje ou para Entrar. O tempo dos dados, a velocidade, o movimento e o tema vêm do topo da página. */
var Abertura = (function () {
  'use strict';
  var L = Lab, H = LabHoje, $ = L.$, $$ = L.$$;

  var TRAIL = 'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 110 70 110 70 88 C70 71 166 71 166 54 C166 40 146 30 124 30';
  var WALKED = 'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 125.4 182.8 120.8 167.2 117';
  /* os pilares do plano base, nas curvas do caminho (como na tela Entrar) */
  var PTS = [['mente', 46, 184], ['alim', 194, 132], ['corpo', 70, 88], ['familia', 166, 54]];
  var WAIT = 300;            // nada aparece antes de 300 ms
  var CAP = 0.92, TAU = 2200; // progresso 1 − e^(−t/τ): rápido no começo, cada vez mais devagar, sem passar de 92%
  var STEP = 13;             // um passo: o tracinho (5) mais o vão (8) do caminho tracejado
  var EASE = 'cubic-bezier(.2, .8, .2, 1)', EASE_IO = 'cubic-bezier(.65, 0, .35, 1)', SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';

  var VARIANTS = [
    {
      id: 'caminhada', letter: 'A', name: 'Caminhada', best: true,
      lede: 'Uma linha percorre o caminho com você na ponta e acende cada pilar ao passar. Anda rápido no começo e cada vez mais devagar, sem chegar ao fim antes dos dados. Quando eles chegam, ela completa o caminho e o app entra.',
      tokens: ['espera · 300 ms', 'progresso · 1 − e^(−t/2,2 s), até 92%', 'pilar acende · micro, com mola', 'fim do caminho · base', 'saída · base']
    },
    {
      id: 'pegadas', letter: 'B', name: 'Pegadas',
      lede: 'Os tracinhos do caminho acendem um por um, como passos, e cada pilar acende quando os passos chegam nele. O mesmo ritmo da Caminhada, num desenho mais leve e sem a linha cheia.',
      tokens: ['espera · 300 ms', 'um passo a cada 13 de caminho', 'pilar acende · micro, com mola', 'últimos passos · base', 'saída · base']
    },
    {
      id: 'respiracao', letter: 'C', name: 'Respiração',
      lede: 'A arte da tela Entrar, parada. Só o "você está aqui" respira, de 1 a 0,7 de opacidade a cada 1,6 s, como os esqueletos de estados.md. É a mais calma, mas não diz quanto falta.',
      tokens: ['espera · 300 ms', 'respiração · 1,6 s, 1 → 0,7', 'saída · base']
    }
  ];

  var S = { load: 1200, dest: 'hoje' };
  var runs = [];
  var uid = 0;

  /* ---------- desenho ---------- */
  function art(o) {
    o = o || {};
    var mask = 'ab-m' + (++uid);
    return '<div class="ab-art"><svg viewBox="0 0 240 236" aria-hidden="true">' +
      (o.steps ? '<defs><mask id="' + mask + '" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="236">' +
        '<path class="ab-mask" d="' + TRAIL + '"/></mask></defs>' : '') +
      '<path class="ab-trail" d="' + TRAIL + '"/>' +
      (o.walked ? '<path class="ab-walked" d="' + WALKED + '"/>' : '') +
      (o.line ? '<path class="ab-go' + (o.full ? ' full' : '') + '" d="' + TRAIL + '"/>' : '') +
      (o.steps ? '<path class="ab-steps" d="' + TRAIL + '" mask="url(#' + mask + ')"/>' : '') +
      '<circle class="ab-start" cx="120" cy="222" r="4.5"/>' +
      '<circle class="ab-end" cx="124" cy="30" r="4"/>' +
      PTS.map(function (p) {
        return '<circle class="ab-pt' + (o.dim ? ' off' : '') + '" data-pillar="' + p[0] + '" cx="' + p[1] + '" cy="' + p[2] + '" r="9"/>';
      }).join('') +
      (o.here ? '<g class="ab-hg' + (o.breathe ? ' ab-breathe' : '') + '"><circle class="ab-halo" cx="167.2" cy="117" r="11.5"/>' +
        '<circle class="ab-here" cx="167.2" cy="117" r="5.5"/></g>' : '') +
      (o.tip ? '<circle class="ab-here ab-tip" cx="0" cy="0" r="5.5"/>' : '') +
      (o.arrive ? '<g class="ab-arrive' + (o.full ? ' on' : '') + '"><circle class="ab-halo" cx="124" cy="30" r="11.5"/><circle class="ab-here" cx="124" cy="30" r="5.5"/></g>' : '') +
      '</svg></div>';
  }

  /* a composição da tela Entrar; na abertura, o texto de baixo e os botões guardam o lugar sem aparecer */
  function hero(artHtml, opening) {
    var later = opening ? ' ab-ghost' : ' ab-later';
    return '<div class="ab-hero">' + artHtml +
      '<h1 class="ab-brand">Prokopē</h1><p class="ab-greek" lang="el">προκοπή</p>' +
      '<p class="ab-tag' + later + '">Um pouco de progresso, todo dia.</p>' +
      '<p class="ab-what' + later + '">Poucos hábitos por vez, no seu ritmo.</p></div>' +
      '<div class="ab-foot' + later + '">' + btn('Entrar com Google', { kind: 's', w: true, icon: 'google-logo' }) +
      btn('Explorar com dados de exemplo', { kind: 'g', w: true }) +
      '<p class="ab-legal">' + ico('lock-simple', 'regular') + 'Seus registros ficam na sua conta. Ninguém mais vê.</p></div>';
  }

  function splashArt(v, reduced) {
    /* movimento reduzido: o último quadro, parado (no app, vale para a Caminhada escolhida) */
    if (reduced && v.id !== 'respiracao') return art({ line: true, full: true, arrive: true });
    if (reduced || v.id === 'respiracao') return art({ walked: true, here: true, breathe: !reduced });
    if (v.id === 'caminhada') return art({ line: true, dim: true, tip: true, arrive: true });
    return art({ steps: true, dim: true, arrive: true });
  }

  function build(v, reduced) {
    var splash = '<div class="ab-splash" role="status" aria-label="Abrindo o Prokopē">' + hero(splashArt(v, reduced), true) + '</div>';
    if (S.dest === 'entrar') {
      return phone({ time: '7:02', cls: 'ab-phone', body: '<div class="ab-dest ab-entrar">' + hero(art({ walked: true, here: true }), false) + '</div>', overlay: splash });
    }
    var hoje = H.head('Bom dia, Henrique') + H.week(3) + gl('Manhã') +
      '<div class="pad">' + H.list([H.row.peso(), H.row.acordar(), H.row.caminhada({ n: 2, nudge: true })]) + '</div>';
    return phone({ time: '7:02', cls: 'ab-phone', tab: 'hoje', body: '<div class="ab-dest">' + hoje + '</div>', overlay: splash });
  }

  /* ---------- tempo ---------- */
  function fade(el, from, to, ms, o) {
    o = o || {};
    if (!el) return null;
    var kf = [{ opacity: from, transform: 'translateY(' + (o.rise || 0) + 'px)' }, { opacity: to, transform: 'none' }];
    return el.animate(kf, { duration: ms, delay: o.delay || 0, easing: o.easing || EASE, fill: 'both' });
  }
  function secs(ms) { return (Math.round(ms / 100) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 1 }) + ' s'; }

  /* o comprimento do caminho em que fica cada pilar (o ponto do caminho mais perto dele). O caminho é sempre o mesmo:
     calcula uma vez, numa passada só pelo caminho (getPointAtLength é lento, e chamá-lo milhares de vezes travava a página) */
  var lensCache = null;
  function pillarLengths(path) {
    if (lensCache) return lensCache;
    var total = path.getTotalLength(), best = PTS.map(function () { return [0, Infinity]; });
    for (var l = 0; l <= total; l += 1) {
      var q = path.getPointAtLength(l);
      PTS.forEach(function (p, i) {
        var d = (q.x - p[1]) * (q.x - p[1]) + (q.y - p[2]) * (q.y - p[2]);
        if (d < best[i][1]) best[i] = [l, d];
      });
    }
    lensCache = best.map(function (b) { return b[0]; });
    return lensCache;
  }

  function stop(run) {
    cancelAnimationFrame(run.raf);
    run.timers.forEach(clearTimeout);
    run.timers = [];
  }
  function later(run, fn, ms) { run.timers.push(setTimeout(fn, ms)); }

  function play(run) {
    stop(run);
    var v = run.v, T = L.T, reduced = L.reduced();
    run.stage.innerHTML = build(v, reduced);
    var ph = $('.phone', run.stage), sp = $('.ab-splash', ph);
    var shown = [$('.ab-art', sp), $('.ab-brand', sp), $('.ab-greek', sp)];
    shown.forEach(function (el) { el.style.opacity = 0; });
    $$('.ab-later', ph).forEach(function (el) { el.style.opacity = 0; });
    var breath = $('.ab-breathe', sp);
    if (breath) breath.style.animationDuration = T(1600) + 'ms';

    var trail = $('.ab-trail', sp), total = trail.getTotalLength(), lens = pillarLengths(trail);
    var go = $('.ab-go', sp), mask = $('.ab-mask', sp), tip = $('.ab-tip', sp), arrive = $('.ab-arrive', sp);
    var pts = $$('.ab-pt', sp), lit = [];
    if (arrive && !arrive.classList.contains('on')) arrive.style.opacity = 0;
    if (tip) tip.style.opacity = 0;
    var p = 0;

    function draw(pp) {
      p = pp;
      var len = p * total;
      if (go) go.style.strokeDasharray = len + ' 9999';
      if (mask) mask.style.strokeDasharray = (len < 5 ? 0 : Math.floor(len / STEP) * STEP + 5) + ' 9999';
      if (tip) {
        var q = trail.getPointAtLength(len);
        tip.setAttribute('cx', q.x); tip.setAttribute('cy', q.y);
      }
      lens.forEach(function (l, i) {
        if (lit[i] || len + 0.5 < l) return;
        lit[i] = true;
        pts[i].classList.remove('off');
        pts[i].animate([{ transform: 'scale(.55)' }, { transform: 'scale(1)' }], { duration: T('base'), easing: SPRING });
      });
    }
    var animated = !reduced && !!(go || mask);
    if (animated) draw(0);

    var t0 = performance.now(), load = T(S.load), wait = T(WAIT);
    var arrivedAt;

    function exit() {
      var out = T('base');
      fade(sp, 1, 0, out, { easing: EASE }).onfinish = function () { sp.remove(); };
      if (S.dest === 'entrar') {
        $$('.ab-later', ph).forEach(function (el, i) { fade(el, 0, 1, T('base'), { rise: 8, delay: T(60) * i + T(80) }); });
      }
      arrivedAt = performance.now() - t0 + out;
      report(arrivedAt * L.S.speed);
    }

    function finish() {
      cancelAnimationFrame(run.raf);
      if (!animated) { exit(); return; }
      var from = p, start = performance.now(), dur = T('base');
      (function step(now) {
        var k = Math.min(1, (now - start) / dur), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        draw(from + (1 - from) * e);
        if (k < 1) { run.raf = requestAnimationFrame(step); return; }
        if (tip) tip.style.opacity = 0;
        if (arrive) arrive.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: T('micro'), easing: SPRING, fill: 'forwards' });
        exit();
      })(start);
    }

    function report(appAt) {
      var t = S.load <= WAIT
        ? 'Os dados chegaram em ' + secs(S.load) + ': a abertura nem aparece, e o app entra em ' + secs(appAt) + '.'
        : 'Abertura de 0,3 s a ' + secs(S.load) + ' · o app aparece inteiro em <b>' + secs(appAt) + '</b>' +
          (appAt - S.load > 300 ? ' (fechar o caminho soma ' + secs(appAt - S.load - 240) + ')' : '') + '.';
      if (reduced) t += ' Movimento reduzido: a arte fica parada e só a opacidade muda.';
      run.log.innerHTML = t;
    }

    run.log.textContent = 'Abrindo…';
    if (load <= wait) {
      later(run, exit, load);
      return;
    }
    later(run, function () {
      shown.forEach(function (el) { fade(el, 0, 1, T('base')); });
      if (!animated) return;
      if (tip) fade(tip, 0, 1, T('micro'));
      var begin = performance.now();
      (function tick(now) {
        draw(CAP * (1 - Math.exp(-(now - begin) / T(TAU))));
        run.raf = requestAnimationFrame(tick);
      })(begin);
    }, wait);
    later(run, finish, load);
  }

  /* ---------- página ---------- */
  function seg(group, attr, value, onPick) {
    $$('[' + attr + ']', group).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute(attr) === String(value)));
      b.addEventListener('click', function () {
        $$('[' + attr + ']', group).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        onPick(b.getAttribute(attr));
      });
    });
  }
  function playAll() { runs.forEach(play); }

  function boot() {
    var grid = $('#ab-grid');
    VARIANTS.forEach(function (v) {
      var card = document.createElement('article');
      card.className = 'lab-card ab-card';
      card.id = 'v-' + v.id;
      card.innerHTML = '<header class="lab-ch"><span class="lab-n">' + v.letter + '</span><div><h2>' + v.name +
        (v.best ? ' <span class="ab-best">Recomendada</span>' : '') + '</h2><p>' + v.lede + '</p></div></header>' +
        '<div class="lab-stage ab-stage"></div><p class="lab-log ab-log"></p>' +
        '<div class="lab-tok">' + v.tokens.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div>';
      grid.appendChild(card);
      runs.push({ v: v, stage: $('.ab-stage', card), log: $('.ab-log', card), timers: [], raf: 0 });
    });
    var ctl = $('#ab-ctl');
    seg(ctl, 'data-load', S.load, function (x) { S.load = +x; playAll(); });
    seg(ctl, 'data-dest', S.dest, function (x) { S.dest = x; playAll(); });
    $('#ab-play').addEventListener('click', playAll);
    /* velocidade e movimento do topo valem na próxima abertura: abre de novo */
    $$('[data-speed], [data-motion]').forEach(function (b) { b.addEventListener('click', function () { setTimeout(playAll, 0); }); });
    playAll();
  }

  return { boot: boot, play: playAll };
})();
