/* Prokopē · laboratório de movimento · demonstrações 1 a 6
   Tokens, marcar um hábito, contador de proteína, água, rostinhos e controles pequenos.
   Cada demonstração monta a cena com os helpers de base.js e anima com o motor (lab.js). */
(function () {
  'use strict';
  var L = Lab, H = LabHoje, $ = L.$, $$ = L.$$, DUR = L.DUR;

  /* =============== 1 · TOKENS =============== */
  L.demo({
    n: 1, id: 'tokens', name: 'Tokens', wide: true,
    lede: 'As sete durações e as três curvas como bolinhas numa pista, e as quatro molas como gráfico da posição no tempo, com a bolinha percorrendo a curva.',
    hint: 'Toque numa linha ou num gráfico para tocar só ele.',
    tokens: ['press', 'micro', 'base', 'fill', 'ring', 'glow', 'confetti', 'out', 'inOut', 'exit', 'calma', 'toque', 'folha', 'festa'].map(function (k) { return L.tok(k); }),
    build: function (stage, scope) {
      var durs = ['press', 'micro', 'base', 'fill', 'ring', 'glow', 'confetti'];
      var curves = [['out', '--ease-out', 'entrar e preencher'], ['inOut', '--ease-in-out', 'mover o que já está na tela'], ['exit', '--ease-exit', 'sair']];
      var springs = ['calma', 'toque', 'folha', 'festa'];
      var GX = 26, GW = 200, GY = 108, GH = 76, loops = {};

      function track() { return '<span class="lab-track"><span class="lab-run"><i class="lab-ball"></i></span></span>'; }
      function curveSvg(k) {
        var e = L.EASE[k];
        return '<svg class="lab-cv" viewBox="0 0 30 30" aria-hidden="true"><rect x=".5" y=".5" width="29" height="29" rx="5"/><path d="M4 26 C' +
          (4 + e[0] * 22) + ' ' + (26 - e[1] * 22) + ', ' + (4 + e[2] * 22) + ' ' + (26 - e[3] * 22) + ', 26 4"/></svg>';
      }
      function graph(k) {
        var s = L.SPRING[k], sol = Mola.solve(L.SP[k], 0, 1, 0), d = '', vx = GX + s.visualDuration * GW;
        for (var i = 0; i <= 200; i++) { var t = i / 200; d += (i ? ' L' : 'M') + (GX + t * GW).toFixed(1) + ' ' + (GY - sol.x(t) * GH).toFixed(1); }
        return '<figure class="lab-gr" data-k="' + k + '"><svg viewBox="0 0 236 128" role="img" aria-label="Mola ' + k + '">' +
          '<line class="ax" x1="' + GX + '" y1="' + GY + '" x2="' + (GX + GW) + '" y2="' + GY + '"/>' +
          '<line class="tg" x1="' + GX + '" y1="' + (GY - GH) + '" x2="' + (GX + GW) + '" y2="' + (GY - GH) + '"/>' +
          '<line class="vd" x1="' + vx + '" y1="' + (GY - GH - 10) + '" x2="' + vx + '" y2="' + GY + '"/>' +
          '<text x="' + vx + '" y="' + (GY - GH - 14) + '" text-anchor="middle">' + Math.round(s.visualDuration * 1000) + ' ms</text>' +
          '<text x="' + (GX - 6) + '" y="' + (GY - GH + 3) + '" text-anchor="end">alvo</text>' +
          '<text x="' + GX + '" y="' + (GY + 15) + '">0</text><text x="' + (GX + GW / 2) + '" y="' + (GY + 15) + '" text-anchor="middle">0,5 s</text><text x="' + (GX + GW) + '" y="' + (GY + 15) + '" text-anchor="end">1 s</text>' +
          '<path class="cu" d="' + d + '"/><circle class="dt" r="4.5" cx="' + GX + '" cy="' + GY + '"/></svg>' +
          '<figcaption><b>' + k + '</b><span>' + Math.round(s.visualDuration * 1000) + ' ms · bounce ' + L.br(s.bounce) + '</span></figcaption>' + track() + '</figure>';
      }
      function ball(run, how) {
        if (L.reduced()) { L.set(run, 'xp', 100); L.set(run, 'opacity', 0); L.to(run, 'opacity', 1, 'micro'); return; }
        L.set(run, 'opacity', 1);
        L.to(run, 'xp', 100, how, { from: 0, velocity: 0 });
      }
      function runGraph(fig) {
        var k = fig.dataset.k, sol = Mola.solve(L.SP[k], 0, 1, 0), dot = $('.dt', fig), tau = 0;
        if (loops[k]) loops[k].stop();
        function put(t) { dot.setAttribute('cx', (GX + t * GW).toFixed(1)); dot.setAttribute('cy', (GY - sol.x(t) * GH).toFixed(1)); }
        ball($('.lab-run', fig), { spring: k });
        if (L.reduced()) { put(1); return; }
        put(0);
        loops[k] = scope.loop(function (dt) { tau = Math.min(1, tau + dt); put(tau); return tau < 1; });
      }
      function reset() {
        stage.innerHTML = '<div class="lab-tk">' +
          '<section><h3>Durações</h3><p>todas com --ease-out</p>' + durs.map(function (k) {
            return '<div class="lab-tr" data-k="' + k + '"><span class="lab-tl"><b>' + k + '</b><small>' + DUR[k].toLocaleString('pt-BR') + ' ms</small></span>' + track() + '</div>';
          }).join('') + '</section>' +
          '<section><h3>Curvas</h3><p>as três com 600 ms, para comparar</p>' + curves.map(function (c) {
            return '<div class="lab-tr c" data-e="' + c[0] + '">' + curveSvg(c[0]) + '<span class="lab-tl"><b>' + c[1] + '</b><small>' + c[2] + '</small></span>' + track() + '</div>';
          }).join('') + '</section>' +
          '<section><h3>Molas</h3><p>a linha tracejada é o alvo; a pontilhada, o visualDuration</p><div class="lab-gs">' + springs.map(graph).join('') + '</div></section></div>';
        $$('.lab-tr[data-k]', stage).forEach(function (r) { r.addEventListener('click', function () { ball($('.lab-run', r), { dur: r.dataset.k, ease: 'out' }); }); });
        $$('.lab-tr[data-e]', stage).forEach(function (r) { r.addEventListener('click', function () { ball($('.lab-run', r), { dur: 'ring', ease: r.dataset.e }); }); });
        $$('.lab-gr', stage).forEach(function (f) { f.addEventListener('click', function () { runGraph(f); }); });
        loops = {};
      }
      function play() {
        $$('.lab-tr[data-k]', stage).forEach(function (r) { ball($('.lab-run', r), { dur: r.dataset.k, ease: 'out' }); });
        $$('.lab-tr[data-e]', stage).forEach(function (r) { ball($('.lab-run', r), { dur: 'ring', ease: r.dataset.e }); });
        $$('.lab-gr', stage).forEach(runGraph);
      }
      return { reset: reset, play: play };
    }
  });

  /* =============== 2 · MARCAR UM HÁBITO =============== */
  L.demo({
    n: 2, id: 'marcar', name: 'Marcar um hábito',
    lede: 'A coreografia do toque, do dedo para longe: o círculo encolhe, preenche e o ✓ se desenha; a +60 ms a bolinha enche, "2 de 7" vira "3 de 7" e o convite vira "De volta hoje."; a +120 ms o "3 de 12 feitos hoje" e o anel de hoje andam em fill. A +200 ms sobe o toast com Desfazer.',
    hint: 'Toque no círculo da caminhada. Desfazer, no toast ou tocando de novo, volta pelo mesmo caminho, em micro e sem quique.',
    tokens: [L.tok('press', 'círculo a 0,9'), L.tok('toque', 'círculo e ✓'), '+60 ms · bolinha 0,6 → 1 em micro, "3 de 7" em fill, convite em micro', '+120 ms · "4 de 12" e anel de hoje em fill', '+200 ms · toast · fadeUp em base', 'desmarcar · micro'],
    build: function (stage, scope) {
      var on, ph, chkEl, chkC, rW, r2, wkRing, toaster, walk, dot, nudge;
      function reset() {
        on = false;
        stage.innerHTML = L.frag(
          H.week(3, { style: 'padding-top:16px' }) + gl('Manhã') +
          '<div class="pad">' + H.list([H.row.peso(), H.row.acordar(), H.row.caminhada({ roll: true, nudge: true })]) + '</div>' +
          '<div style="height:100px"></div>' + tb('hoje'));
        ph = stage.firstChild;
        wkRing = L.ringCtl($('.wkd.today .ringsvg', ph), 3 / 12);
        rW = H.rollWeek(ph, 3);
        r2 = L.roller($('.lab-r2', ph), 2);
        walk = $('.lab-walk .hr', ph);
        dot = $$('.dots i', walk)[2];
        nudge = $('.nudge > span', ph);
        chkEl = $('.chk', walk);
        chkC = L.checkCtl(chkEl);
        toaster = L.toaster(ph, scope);
        L.tap(chkEl, function () { mark(!on, true); }, { scale: 0.9 });
      }
      function mark(x, fromTap) {
        on = x;
        scope.cancel('chain');
        if (x && !fromTap) L.pulse(chkEl, 0.9);
        /* 0 ms: o que foi tocado */
        chkC.to(x);
        /* +60 ms: a consequência local */
        scope.after(60, function () {
          dot.classList.toggle('on', x);
          if (x && !L.reduced()) L.to(dot, 'scale', 1, 'micro', { from: 0.6 });
          r2.update(x ? 3 : 2);
          walk.classList.toggle('done', x);
          H.swap(nudge, x ? 'De volta hoje.' : 'Hoje é um bom dia para voltar.');
        }, 'chain');
        /* +120 ms: o reflexo distante */
        scope.after(120, function () {
          wkRing.to(x ? 4 / 12 : 3 / 12, { dur: 'fill', ease: 'out' });
          rW.update(x ? 4 : 3);
        }, 'chain');
        if (x) scope.after(200, function () {
          toaster.show({ p: 'familia', ic: 'check', t: 'Caminhada marcada', s: '3 de 7 na semana', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', ms: 5000, onAction: function () { mark(false); } });
        }, 'chain');
        else toaster.hide();
      }
      return { reset: reset, play: function () { mark(!on); } };
    }
  });

  /* =============== 3 · CONTADOR DE PROTEÍNA =============== */
  L.demo({
    n: 3, id: 'proteina', name: 'Contador de proteína',
    lede: 'O cartão da proteína do Hoje. Cada botão rápido soma na hora: o total rola dígito a dígito e a barra ganha um segmento novo. Quando a barra encosta na linha de 80 g, a linha acende e entra o selo; depois da meta aparece quanto passou.',
    hint: 'Toque em Ovo, Leite ou Whey. Toques seguidos continuam do valor em que o número está (o intervalo mínimo é de 120 ms).',
    tokens: [L.tok('press', '0,97'), 'número · fill · --ease-out', 'segmento · fill', 'linha da meta · mark → ink · micro', 'selo · fadeUp · base', 'altura do selo · base'],
    build: function (stage, scope) {
      var ctl, tiles;
      function reset() {
        stage.innerHTML = L.frag('<div class="pad lab-fpad">' + H.protein(24, [18, 6], H.MORNING_FOODS, true) + '</div>');
        ctl = H.proteinCtl($('.lab-prot', stage), scope);
        tiles = $$('.q[data-g]', stage);
      }
      function play() {
        if (ctl.total >= 86) reset();
        var seq = ctl.total < 80 ? [2, 2, 0, 1, 0] : [0];
        seq.forEach(function (i, k) {
          scope.after(k * 650, function () { L.pulse(tiles[i]); ctl.add(+tiles[i].dataset.g); }, 'seq');
        });
      }
      return { reset: reset, play: play };
    }
  });

  /* =============== 4 · ÁGUA =============== */
  L.demo({
    n: 4, id: 'agua', name: 'Água',
    lede: 'A linha da água do Hoje, às 7h42, em 0 de 3 L. Cada toque soma na hora: o anel de 40 px anda em ring e "0 de 3 L" rola para "0,5 de 3 L" em fill. Na meta entra o selo, como na proteína.',
    hint: 'Toque em 500 ml ou 1 L.',
    tokens: [L.tok('press', '0,97'), L.tok('ring', 'anel'), 'número · fill', 'selo · fadeUp · base'],
    build: function (stage, scope) {
      var total, hit, overOn, ring, rV, rO, meta, seal, over, pills;
      function r1(x) { return Math.round(x * 10) / 10; }
      function reset() {
        total = 0; hit = false; overOn = false;
        stage.innerHTML = L.frag('<div class="pad lab-fpad">' + H.water(0, { roll: true, meta: true }) + '</div>');
        var root = stage.firstChild;
        ring = L.ringCtl($('.ringsvg', root), 0);
        rV = L.roller($('.lab-wv', root), 0, { decimals: 1 });
        rO = L.roller($('.lab-wo', root), 0, { decimals: 1 });
        meta = $('.lab-meta', root); seal = $('.vpill', meta); over = $('.lab-over', meta);
        L.set(meta, 'hpx', 0); L.set(seal, 'opacity', 0); L.set(over, 'opacity', 0);
        pills = $$('.addp', root);
        L.tap(pills[0], function () { add(0.5); }, { guard: 120 });
        L.tap(pills[1], function () { add(1); }, { guard: 120 });
      }
      function showOver() {
        rO.update(r1(total - 3), { instant: !overOn });
        if (!overOn) { overOn = true; L.enter(over, { delay: 60 }); }
      }
      function lightUp() {
        var h = meta.firstChild.offsetHeight;
        if (L.reduced()) L.set(meta, 'hpx', h); else L.to(meta, 'hpx', h, 'base');
        L.enter(seal);
        if (total > 3) showOver();
      }
      function add(l) {
        var prevPct = Math.min(1, total / 3);
        total = r1(total + l);
        var pct = Math.min(1, total / 3);
        rV.update(total);
        ring.to(pct, { dur: 'ring', ease: 'out' });
        if (!hit && total >= 3) {
          hit = true;
          scope.after(L.reduced() ? 0 : L.EF.out.inverse(pct > prevPct ? (1 - prevPct) / (pct - prevPct) : 1) * DUR.ring, lightUp);
        } else if (hit && total > 3) showOver();
      }
      function play() {
        if (total >= 3.5) reset();
        var seq = total < 3 ? [0.5, 1, 0.5, 0.5, 0.5] : [0.5];
        seq.forEach(function (l, i) { scope.after(i * 800, function () { L.pulse(pills[l === 1 ? 1 : 0]); add(l); }, 'seq'); });
      }
      return { reset: reset, play: play };
    }
  });

  /* =============== 5 · ROSTINHOS =============== */
  L.demo({
    n: 5, id: 'rostinhos', name: 'Rostinhos',
    lede: 'Humor e energia do check-in. O rostinho escolhido aparece com a mola toque e o fundo vai para o tom claro da primária; o anterior só perde a cor.',
    hint: 'Toque num rostinho. Trocar de ideia no meio continua do ponto em que ele está.',
    tokens: [L.tok('press', '0,97'), L.tok('toque'), 'fundo e contorno · micro · 150 ms'],
    build: function (stage, scope) {
      var rows;
      function pick(row, i) {
        var tiles = $$(':scope > div', row);
        tiles.forEach(function (t, j) { t.classList.toggle('on', j === i); });
        var face = $('.face', tiles[i]);
        if (!L.reduced()) L.to(face, 'scale', 1, 'toque', { from: Math.min(L.get(face, 'scale'), 0.8) });
      }
      function reset() {
        stage.innerHTML = L.frag('<div class="pad lab-fpad stack" style="gap:18px">' +
          '<div class="stack" style="gap:10px"><span class="lab-q">Humor</span>' + rf('mood', 0) + '</div>' +
          '<div class="stack" style="gap:10px"><span class="lab-q">Energia</span>' + rf('energy', 0) + '</div></div>');
        rows = $$('.rf', stage);
        rows.forEach(function (row) {
          $$(':scope > div', row).forEach(function (tile, i) {
            L.tap(tile, function () { pick(row, i); }, { guard: false });
            tile.setAttribute('aria-label', $('span', tile).textContent);
          });
        });
      }
      function play() {
        L.pulse($$(':scope > div', rows[0])[3]); pick(rows[0], 3);
        scope.after(700, function () { L.pulse($$(':scope > div', rows[1])[2]); pick(rows[1], 2); }, 'seq');
      }
      return { reset: reset, play: play };
    }
  });

  /* =============== 6 · CONTROLES PEQUENOS =============== */
  L.demo({
    n: 6, id: 'controles', name: 'Controles pequenos',
    lede: 'Chip, interruptor e controle segmentado trocam em micro. A cor muda no lugar; o que anda de um lado para o outro (a bolinha, o marcador) usa --ease-in-out.',
    hint: 'Toque nos dias, nos interruptores e nas opções.',
    tokens: [L.tok('micro'), '--ease-in-out · bolinha e marcador', L.tok('press') + ' · volta com toque'],
    build: function (stage, scope) {
      var chips, sws, sg, thumb, opts;
      function place(i, animate) {
        var o = opts[i], x = o.offsetLeft, w = o.offsetWidth;
        opts.forEach(function (s, j) { s.classList.toggle('on', j === i); });
        if (!animate || L.reduced()) { L.set(thumb, 'x', x); L.set(thumb, 'wpx', w); return; }
        L.to(thumb, 'x', x, { dur: 'micro', ease: 'inOut' });
        L.to(thumb, 'wpx', w, { dur: 'micro', ease: 'inOut' });
      }
      function reset() {
        stage.innerHTML = L.frag('<div class="pad lab-fpad stack" style="gap:18px">' +
          '<div class="stack" style="gap:8px"><span class="lab-q">Dias de coleta do lixo</span><div class="chips">' +
            ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(function (d, i) { return chip(d, { sel: i === 0 || i === 3 }); }).join('') + '</div></div>' +
          lg([li({ t: 'Tolerância de 1h', s: 'no fim de semana', right: sw(true) }), li({ t: 'Som suave ao marcar', s: 'desligado por padrão', right: sw(false) })]) +
          '<div class="stack" style="gap:8px"><span class="lab-q">Período</span>' + seg(['Semana', 'Mês', 'Fase'], 0) + '</div>' +
          '</div>');
        var root = stage.firstChild;
        chips = $$('.chip', root);
        chips.forEach(function (c) { L.tap(c, function () { c.classList.toggle('sel'); c.setAttribute('aria-pressed', String(c.classList.contains('sel'))); }); });
        sws = $$('.sw', root);
        sws.forEach(function (s) {
          s.classList.add('lab-sw');
          s.setAttribute('role', 'switch');
          L.tap(s, function () { s.classList.toggle('on'); s.setAttribute('aria-checked', String(s.classList.contains('on'))); }, { scale: false });
          s.setAttribute('aria-checked', String(s.classList.contains('on')));
        });
        sg = $('.sg', root); sg.classList.add('lab-sg');
        thumb = document.createElement('i'); thumb.className = 'lab-sgt'; sg.insertBefore(thumb, sg.firstChild);
        opts = $$('span', sg);
        opts.forEach(function (o, i) { L.tap(o, function () { place(i, true); }, { scale: false }); });
        place(0, false);
      }
      function play() {
        L.pulse(chips[1]); chips[1].classList.toggle('sel');
        scope.after(500, function () { sws[1].classList.toggle('on'); }, 'seq');
        scope.after(1000, function () { place(1, true); }, 'seq');
        scope.after(1500, function () { place(2, true); }, 'seq');
      }
      return { reset: reset, play: play };
    }
  });
})();
