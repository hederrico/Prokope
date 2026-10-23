/* Prokopē · laboratório de movimento · demonstrações 7 a 10
   Folha, empurrar e voltar, trocar de aba e toast. Os gestos seguem o dedo e, ao soltar,
   a mola é integrada quadro a quadro a partir da velocidade do dedo (Lab.drive). */
(function () {
  'use strict';
  var L = Lab, HJ = LabHoje, $ = L.$, $$ = L.$$;
  var date = HJ.DATE;
  function clamp(a, b, v) { return Math.max(a, Math.min(b, v)); }

  /* =============== 7 · FOLHA =============== */
  L.demo({
    n: 7, id: 'folha', name: 'Folha',
    lede: 'Sobe com a mola folha enquanto o fundo escurece. O arrasto para baixo segue o dedo, com resistência acima da altura natural; soltando depois de 30% da altura ou a mais de 600 px/s, ela fecha. Senão, volta com a mola.',
    hint: 'Toque no cartão da proteína (os botões rápidos somam sem abrir). Arraste a folha para baixo (ou para cima, para sentir a resistência); toque fora ou no X para fechar.',
    tokens: [L.tok('folha'), 'fundo · base · até 38% no claro e 55% no escuro', 'fechar · base · --ease-exit', 'arrasto · fecha com 30% ou 600 px/s', 'soltar · mola folha com a velocidade do dedo'],
    build: function (stage, scope) {
      var isOpen, sh, dim, H, y0, total, roll, track;
      function body() {
        return HJ.head('Boa tarde, Henrique') + HJ.week(4) +
          gl('Manhã') + '<div class="pad">' + fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'peso, acordar e caminhada') + '</div>' +
          gl('Ao longo do dia') + '<div class="pad stack">' + HJ.protein(46, [18, 6, 22], [['Frango', 30], ['Feijão', 7], ['Queijo', 5]]) +
          HJ.water(1.5) + HJ.list([HJ.row.almoco(), HJ.row.futebol()]) + '</div>';
      }
      function sheetBody() {
        var foods = [['Ovo', 6], ['Queijo', 5], ['Feijão', 7], ['Leite', 6], ['Whey', 22], ['Iogurte', 10], ['Frango', 30]];
        return '<div class="stack" data-pillar="alim" style="gap:14px">' +
          '<div class="lab-shv"><b class="num"><span class="lab-sv"></span></b><span class="sub faint">de 80 g hoje</span></div>' +
          pbar([18, 6, 22], 120, 80, 'meta 80 g') +
          '<div class="chips">' + foods.map(function (f) { return chip(f[0], { icon: 'plus', small: f[1] + ' g' }); }).join('') + '</div>' +
          '<p class="cap">Cada toque já salva. A folha fica aberta para somar mais.</p></div>';
      }
      function finish() { if (!isOpen) { sh.hidden = true; dim.hidden = true; } }
      function open() {
        if (isOpen) return;
        isOpen = true;
        var wasHidden = sh.hidden;
        sh.hidden = false; dim.hidden = false;
        H = sh.offsetHeight;
        if (L.reduced()) {
          L.set(sh, 'y', 0);
          if (wasHidden) { L.set(sh, 'opacity', 0); L.set(dim, 'opacity', 0); }
          L.to(sh, 'opacity', 1, 'micro'); L.to(dim, 'opacity', 1, 'micro');
          return;
        }
        L.set(sh, 'opacity', 1);
        if (wasHidden) { L.set(sh, 'y', H + 24); L.set(dim, 'opacity', 0); }
        L.to(sh, 'y', 0, 'folha');
        L.to(dim, 'opacity', 1, 'base');
      }
      function close() {
        if (!isOpen) return;
        isOpen = false;
        if (L.reduced()) {
          L.to(dim, 'opacity', 0, 'micro');
          L.to(sh, 'opacity', 0, 'micro').then(scope.live(finish));
          return;
        }
        L.to(dim, 'opacity', 0, { dur: 'base', ease: 'exit' });
        L.to(sh, 'y', H + 24, { dur: 'base', ease: 'exit' }).then(scope.live(finish));
      }
      function dimFor(y) { return clamp(0, 1, 1 - Math.max(0, y) / H); }
      function add(g) {
        total += g; roll.update(total);
        var seg = document.createElement('span'); seg.className = 'pb-s'; track.appendChild(seg);
        if (L.reduced()) { L.set(seg, 'w', g / 1.2); L.set(seg, 'opacity', 0); L.to(seg, 'opacity', 1, 'micro'); }
        else { L.set(seg, 'w', 0); L.to(seg, 'w', g / 1.2, { dur: 'fill', ease: 'out' }); }
      }
      function reset() {
        isOpen = false; total = 46;
        stage.innerHTML = phone({ time: '12:41', h: 720, tab: 'hoje', body: body(),
          overlay: sheet('<span class="row" data-pillar="alim" style="gap:10px"><span class="bub sm">' + ico('egg') + '</span>Proteína</span>', sheetBody()) });
        var ph = stage.firstChild;
        dim = $('.dim', ph); sh = $('.sheet', ph);
        sh.classList.add('lab-sheet');
        sh.hidden = true; dim.hidden = true;
        roll = L.roller($('.lab-sv', sh), total, { suffix: ' g' });
        track = $('.pb-t', sh);
        /* o corpo do cartão e o Mais abrem a folha; os botões rápidos somam na hora */
        var card = $('.lab-prot', ph);
        card.classList.add('lab-opener');
        HJ.proteinCtl(card, scope);
        L.tap(card, open);
        L.tap($('.q.more', card), open);
        L.tap($('.xbtn', sh), close);
        $('.xbtn', sh).setAttribute('aria-label', 'Fechar');
        dim.addEventListener('click', close);
        $$('.chip', sh).forEach(function (c) {
          var g = parseInt($('small', c).textContent, 10);
          L.tap(c, function () { add(g); }, { guard: false });
        });
        L.drag(sh, {
          axis: 'y',
          begin: function () {
            H = sh.offsetHeight;
            y0 = L.get(sh, 'y');
            L.set(sh, 'y', y0); L.set(dim, 'opacity', L.get(dim, 'opacity'));
            if (L.reduced()) L.set(sh, 'opacity', 1);
          },
          move: function (dx, dy) {
            var y = y0 + dy;
            if (y < 0) y = -L.rubber(-y, H);
            L.set(sh, 'y', y);
            L.set(dim, 'opacity', dimFor(y));
          },
          end: function (dx, dy, vx, vy) {
            var y = L.get(sh, 'y');
            if (y > 0.3 * H || vy > 600) {
              isOpen = false;
              if (L.reduced()) {
                L.to(dim, 'opacity', 0, 'micro');
                L.to(sh, 'opacity', 0, 'micro').then(scope.live(finish));
              } else {
                L.drive(sh, 'y', H + 24, 'folha', vy, function (v) { L.set(dim, 'opacity', dimFor(v)); }, scope).then(scope.live(finish));
              }
            } else {
              isOpen = true;
              L.drive(sh, 'y', 0, 'folha', vy, function (v) { L.set(dim, 'opacity', dimFor(v)); }, scope);
            }
          }
        });
      }
      return { reset: reset, play: function () { if (isOpen) close(); else open(); } };
    }
  });

  /* =============== 8 · EMPURRAR E VOLTAR =============== */
  var HABITS = [
    { p: 'alim', ic: 'scales', t: 'Peso', k: 'Alimentação · ao acordar · números de exemplo', st: [['83,6', 'kg hoje'], ['84,2', 'média de 7 dias'], ['−1,1', 'kg em 3 semanas']] },
    { p: 'mente', ic: 'alarm', t: 'Acordar', k: 'Mente · meta 6h50', st: [['5 de 7', 'na semana'], ['81%', 'força'], ['6h51', 'média']] },
    { p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', k: 'Corpo e Família · 20 min', st: [['2 de 7', 'na semana'], ['72%', 'força'], ['24', 'desde 21 set']] },
    { p: 'alim', ic: 'fork-knife', t: 'Almoço', k: 'Alimentação · nota de 1 a 5', st: [['3,8', 'média da semana'], ['4', 'ontem'], ['18', 'notas']] },
    { p: 'corpo', ic: 'soccer-ball', t: 'Futebol', k: 'Corpo · às quintas', st: [['0 de 1', 'na semana'], ['80%', 'força'], ['4', 'desde 21 set']] },
    { p: 'alim', ic: 'pint-glass', t: 'Zero refrigerante', k: 'Alimentação · dias sem', st: [['12', 'dias sem'], ['21', 'recorde'], ['33', 'no total']] },
    { p: 'mente', ic: 'video-camera-slash', t: 'Sem Shorts e TikTok', k: 'Mente · dias sem', st: [['32', 'dias sem'], ['32', 'recorde'], ['32', 'no total']] }
  ];
  function heatFor(i) {
    var s = [], seed = 7 + i * 13;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var d = 0; d < 35; d++) {
      if (d > 31) s.push('f'); else if (d === 31) s.push('t' + (rnd() > 0.5 ? ' d' : ''));
      else { var r = rnd(); s.push(r > 0.32 ? 'd' : r > 0.18 ? 'p' : ''); }
    }
    return s;
  }
  L.demo({
    n: 8, id: 'empurrar', name: 'Empurrar e voltar',
    lede: 'A tela do hábito entra da direita com a mola calma; a lista recua 25% e escurece 6%. O Voltar faz o caminho inverso, e o arrasto da borda esquerda deixa a tela seguir o dedo.',
    hint: 'Toque no nome de um hábito ou num cartão de dias sem. Volte por "Hoje" ou arraste a partir da faixa listrada da borda (20 px): passando de 35% da largura ou a mais de 500 px/s, completa; senão, volta.',
    tokens: [L.tok('calma'), 'tela de trás · −25% e 6% mais escura', 'arrasto · completa com 35% ou 500 px/s', 'soltar · mola calma com a velocidade do dedo', 'reduzido · opacidade em micro'],
    build: function (stage, scope) {
      var A, B, shade, edge, nav, pushed, W, x0;
      function screenB(i) {
        var h = HABITS[i];
        return nb({ back: 'Hoje', act: 'Editar' }) +
          '<div class="lab-hero" data-pillar="' + h.p + '"><span class="bub lg">' + ico(h.ic) + '</span><h1 class="ttl2">' + h.t + '</h1><span class="cap">' + h.k + '</span></div>' +
          '<div class="pad stack" data-pillar="' + h.p + '"><div class="card lab-3">' + h.st.map(function (x) { return '<div><b>' + x[0] + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div>' +
          '<div class="card p stack" style="gap:10px"><div class="between"><b style="font:600 16px/20px var(--font-ui)">Últimas 5 semanas</b><span class="cap">toque num dia</span></div>' +
          '<div style="display:flex;justify-content:center">' + heat(heatFor(i)) + '</div></div></div>' +
          '<div class="lab-edge" title="Arraste daqui para voltar"></div>';
      }
      function hideB(ok) { if (ok && !pushed) { B.hidden = true; L.set(A, 'xp', 0); L.set(shade, 'opacity', 0); } }
      function link(v) { var q = v / 100; L.set(A, 'xp', -25 + 25 * q); L.set(shade, 'opacity', 0.06 * (1 - q)); }
      function bindB() {
        edge = $('.lab-edge', B);
        L.tap($('.nb .back', B), back, { scale: false });
        L.drag(edge, {
          axis: 'x',
          begin: function () {
            W = nav.offsetWidth;
            x0 = L.get(B, 'xp') / 100 * W;
            L.set(B, 'xp', x0 / W * 100); L.set(A, 'xp', L.get(A, 'xp')); L.set(shade, 'opacity', L.get(shade, 'opacity'));
            if (L.reduced()) L.set(B, 'opacity', 1);
          },
          move: function (dx) {
            var p = clamp(0, W, x0 + dx) / W * 100;
            L.set(B, 'xp', p); link(p);
          },
          end: function (dx, dy, vx) {
            var p = L.get(B, 'xp') / 100;
            if (p > 0.35 || vx > 500) {
              pushed = false;
              if (L.reduced()) {
                L.to(A, 'xp', 0, 'micro'); L.to(shade, 'opacity', 0, 'micro');
                L.to(B, 'opacity', 0, 'micro').then(scope.live(hideB));
              } else L.drive(B, 'xp', 100, 'calma', vx / W * 100, link, scope).then(scope.live(hideB));
            } else {
              pushed = true;
              L.drive(B, 'xp', 0, 'calma', vx / W * 100, link, scope);
            }
          }
        });
      }
      function push(i) {
        var wasHidden = B.hidden;
        B.innerHTML = screenB(i); bindB();
        pushed = true; B.hidden = false;
        if (L.reduced()) {
          L.set(B, 'xp', 0); L.set(A, 'xp', 0); L.set(shade, 'opacity', 0);
          if (wasHidden) L.set(B, 'opacity', 0);
          L.to(B, 'opacity', 1, 'micro');
          return;
        }
        L.set(B, 'opacity', 1);
        if (wasHidden) L.set(B, 'xp', 100);
        L.to(B, 'xp', 0, 'calma'); L.to(A, 'xp', -25, 'calma'); L.to(shade, 'opacity', 0.06, 'calma');
      }
      function back() {
        if (!pushed) return;
        pushed = false;
        if (L.reduced()) { L.to(B, 'opacity', 0, 'micro').then(scope.live(hideB)); return; }
        L.to(B, 'xp', 100, 'calma').then(scope.live(hideB));
        L.to(A, 'xp', 0, 'calma'); L.to(shade, 'opacity', 0, 'calma');
      }
      function reset() {
        pushed = false;
        var list = HJ.head('Bom dia, Henrique') + HJ.week(3) +
          gl('Manhã') + '<div class="pad">' + HJ.list([HJ.row.peso(), HJ.row.acordar(), HJ.row.caminhada({ nudge: true })]) + '</div>' +
          gl('Ao longo do dia') + '<div class="pad">' + HJ.list([HJ.row.almoco(), HJ.row.futebol()]) + '</div>' + HJ.diasSem() + '<div style="height:20px"></div>';
        stage.innerHTML = phone({ time: '7:44', h: 720, tab: 'hoje', body: '<div class="lab-nav"><div class="lab-scrn a">' + list + '<div class="lab-shade"></div></div><div class="lab-scrn b" hidden></div></div>' });
        nav = $('.lab-nav', stage); A = $('.lab-scrn.a', stage); B = $('.lab-scrn.b', stage); shade = $('.lab-shade', A);
        L.set(shade, 'opacity', 0);
        /* o ícone e o nome abrem o hábito; o controle da direita é outro botão (aqui ele não faz nada) */
        $$('.hr', A).concat($$('.ds', A)).forEach(function (r, i) {
          r.classList.add('lab-row-open');
          L.tap(r, function (e) { if (e && e.target && e.target.closest && e.target.closest('.chk, .dop, .vpill, .addp, .nudge')) return; push(i); }, { scale: r.classList.contains('ds') ? 0.97 : false });
        });
      }
      return { reset: reset, play: function () { if (pushed) back(); else push(2); } };
    }
  });

  /* =============== 9 · TROCAR DE ABA =============== */
  L.demo({
    n: 9, id: 'abas', name: 'Trocar de aba',
    lede: 'A barra de abas do app. O conteúdo troca só por opacidade, em micro e sem deslocamento; o ícone da aba nova passa de Regular para Fill com a mola toque. Cada aba guarda a própria rolagem.',
    hint: 'Toque nas abas. Role o Hoje e toque nele de novo: ele volta ao topo com a mola calma.',
    tokens: ['conteúdo · opacidade · micro · 150 ms', 'ícone · Regular → Fill · ' + L.tok('toque'), 'aba ativa · rola ao topo · calma'],
    build: function (stage, scope) {
      var names = ['sun', 'chart-line-up', 'path', 'gear-six'], panes, tabs, cur, scroller;
      function paneHtml() {
        var hoje = HJ.morning();
        var bars = [['Família', 'familia', 88], ['Mente', 'mente', 82], ['Corpo', 'corpo', 71], ['Alimentação', 'alim', 64]];
        var prog = hd({ date: 'Semana 2 de 3 · fase 2', title: 'Progresso' }) +
          '<div class="pad stack">' + seg(['Semana', 'Mês', 'Fase'], 0) +
          '<div class="card p stack" style="gap:4px"><span class="cap">Constância da semana</span><span class="stat num">76%</span></div>' +
          '<div class="card lab-bars">' + bars.map(function (b) { return '<div data-pillar="' + b[1] + '"><b style="font-weight:500">' + b[0] + '</b><i style="--v:' + b[2] + '%"></i><span>' + b[2] + '%</span></div>'; }).join('') + '</div>' +
          '<div class="insight" data-pillar="familia">' + ico('salsicha') + '<p>Nos dias com caminhada, seu humor médio foi 4,1 contra 3,4.<small>14 dias com e 8 sem</small></p></div></div>';
        var jor = hd({ date: 'Fase 2 de 4', title: 'Jornada' }) + '<div class="pad stack">' + lg([
          li({ ic: 'check-circle', p: 'accent', t: 'Fase 1 · Base', s: '21 set – 11 out · fechou com 81%' }),
          li({ ic: 'plant', p: 'accent', t: 'Fase 2 · Alimentação', s: 'agora · semana 2 de 3' }),
          li({ ic: 'sneaker-move', p: 'accent', t: 'Fase 3 · Movimento', s: 'a partir de 2 nov' }),
          li({ ic: 'moon-stars', p: 'accent', t: 'Fase 4 · Profundidade', s: 'a partir de 23 nov' })
        ]) + '</div>';
        var aj = hd({ title: 'Ajustes' }) + '<div class="pad stack">' + lg([
          li({ ic: 'circles-four', t: 'Pilares' }), li({ ic: 'list-checks', t: 'Hábitos' }),
          li({ ic: 'clock', t: 'Horários' }), li({ ic: 'alarm', t: 'Lembretes' }), li({ ic: 'paint-brush', t: 'Aparência' })
        ]) + lg([li({ ic: 'pause-circle', t: 'Pausar' }), li({ ic: 'heart', t: 'A dois' }), li({ ic: 'database', t: 'Dados e conta' })]) + '</div>';
        return [hoje, prog, jor, aj].map(function (h, i) { return '<div class="lab-pane' + (i ? ' off' : '') + '">' + h + '</div>'; }).join('');
      }
      function toTop(p) {
        if (scroller) scroller.stop();
        if (L.reduced() || p.scrollTop === 0) { p.scrollTop = 0; return; }
        var st = { x: p.scrollTop, v: 0 }, from = st.x;
        scroller = scope.loop(function (dt) {
          Mola.step(L.SP.calma, st, 0, dt);
          var end = Mola.settled(st, 0, from);
          p.scrollTop = end ? 0 : st.x;
          return !end;
        });
      }
      function go(i) {
        if (i === cur) { toTop(panes[i]); return; }
        var prev = cur, pp = panes[prev], np = panes[i];
        cur = i;
        np.classList.remove('off');
        L.to(pp, 'opacity', 0, 'micro').then(scope.live(function (ok) { if (ok && cur !== prev) pp.classList.add('off'); }));
        if (L.get(np, 'opacity') > 0.99) L.set(np, 'opacity', 0);
        L.to(np, 'opacity', 1, 'micro');
        tabs.forEach(function (t, j) {
          t.classList.toggle('on', j === i);
          $('i', t).className = (j === i ? 'ph-fill' : 'ph') + ' ph-' + names[j];
          t.setAttribute('aria-selected', String(j === i));
        });
        if (!L.reduced()) L.to($('i', tabs[i]), 'scale', 1, 'toque', { from: 0.8 });
      }
      function reset() {
        cur = 0; scroller = null;
        stage.innerHTML = phone({ time: '7:45', h: 720, tab: 'hoje', body: '<div class="lab-panes">' + paneHtml() + '</div>' });
        panes = $$('.lab-pane', stage);
        panes.forEach(function (p, i) { L.set(p, 'opacity', i ? 0 : 1); p.addEventListener('wheel', function () { if (scroller) scroller.stop(); }, { passive: true }); });
        tabs = $$('.tb > span', stage);
        tabs.forEach(function (t, i) { t.setAttribute('role', 'tab'); L.tap(t, function () { go(i); }, { scale: false, guard: false }); });
      }
      return { reset: reset, play: function () { go((cur + 1) % 4); } };
    }
  });

  /* =============== 10 · TOAST =============== */
  var TOASTS = {
    marcada: { p: 'familia', ic: 'check', t: 'Caminhada marcada', s: '3 de 7 na semana', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', ms: 5000 },
    ovo: { p: 'alim', ic: 'egg', t: 'Ovo · 6 g', s: '52 de 80 g hoje', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', ms: 5000 },
    deslize: { p: 'alim', ic: 'pint-glass', t: 'Deslize registrado', s: 'O recorde de 21 dias continua guardado.', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', ms: 5000 },
    erro: { p: 'accent', ic: 'arrows-clockwise', t: 'Não deu para salvar.', s: 'Tente de novo em instantes.', act: 'Tentar de novo', ms: 0 },
    versao: { p: 'accent', ic: 'sparkle', t: 'Nova versão do Prokopē', s: 'Leva um segundo e nada se perde', act: 'Atualizar', ms: 0 }
  };
  L.demo({
    n: 10, id: 'toast', name: 'Toast',
    lede: 'Um por vez, 8 px acima da barra de abas. Um novo substitui o anterior: o antigo some em micro enquanto o novo sobe em base. O fio esvazia durante os 5 s do Desfazer; arrastar para baixo dispensa.',
    hint: 'Toque nos botões em sequência rápida para ver a troca. Arraste o toast para baixo para dispensar.',
    tokens: ['entrar · fadeUp · base · 240 ms', 'sair · opacidade · micro · --ease-exit', 'fio · 5 s · linear', 'erro e versão nova · até dispensar', 'arrasto · dispensa com 24 px ou 400 px/s'],
    build: function (stage, scope) {
      var toaster;
      function show(k) { toaster.show(TOASTS[k]); }
      function reset() {
        stage.innerHTML = phone({ time: '7:43', h: 560, tab: 'hoje',
          body: HJ.head('Bom dia, Henrique') + HJ.week(4) + gl('Manhã') +
            '<div class="pad">' + HJ.list([HJ.row.peso(), HJ.row.acordar(), HJ.row.caminhada({ n: 3, done: true, nudge: 'De volta hoje.' })]) + '</div>' });
        toaster = L.toaster(stage.firstChild, scope);
      }
      function play() {
        show('marcada');
        scope.after(1300, function () { show('ovo'); }, 'seq');
      }
      return {
        reset: reset, play: play,
        extra: [['Caminhada', function () { show('marcada'); }], ['Ovo · 6 g', function () { show('ovo'); }], ['Deslize', function () { show('deslize'); }],
          ['Não deu para salvar', function () { show('erro'); }], ['Versão nova', function () { show('versao'); }]]
      };
    }
  });
})();
