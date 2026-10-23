/* Prokopē · laboratório de movimento · demonstrações 11 a 16
   Dia fechado, novo recorde e deslize, fase desbloqueada, carregando, cascata, outro dia e sem internet. */
(function () {
  'use strict';
  var L = Lab, HJ = LabHoje, $ = L.$, $$ = L.$$, DUR = L.DUR;
  function clamp(a, b, v) { return Math.max(a, Math.min(b, v)); }

  /* =============== 11 · DIA FECHADO =============== */
  L.demo({
    n: 11, id: 'dia-fechado', name: 'Dia fechado',
    lede: 'O último hábito que se marca no dia (o deitar fica para amanhã). Até 500 ms, a coreografia normal, e "10 de 12" vira "11 de 12". Então a lista sai com opacidade e o anel de 196 px anda de 10 para 11 de 12 em ring; quando ele para, brilha uma vez e assenta, e "Dia fechado" entra com fadeUp. O Desfazer reabre o dia sem animação de perda.',
    hint: 'Marque "Telas desligadas". Use o Desfazer do toast, ou Tocar de novo, para reabrir o dia.',
    tokens: ['0 a 500 ms · coreografia de marcar', '+500 ms · lista sai em base · --ease-exit', L.tok('ring', 'anel de 10 para 11'), '"11" na serifa · troca em micro', '+1.100 ms · ' + L.tok('glow', 'assenta em 0,6'), '+1.250 ms · "Ver o dia" e "Amanhã cedo" em cascata', 'desfazer · anel em fill, lista volta em base'],
    build: function (stage, scope) {
      var on, closed, ph, listV, closedV, ring, rW, wkRing, chkC, chkEl, row, glow, glowAnim, num, toaster, late;
      function reset() {
        on = false; closed = false; glowAnim = null;
        var listView = HJ.head('Boa noite, Henrique') + HJ.week(10) + gl('Ainda hoje', '2') +
          '<div class="pad stack">' + HJ.list([HJ.row.telas(), HJ.row.deitar()]) +
          fold(['alarm|mente', 'salsicha|familia', 'fork-knife|alim', 'soccer-ball|corpo'], 6, 'Feitos hoje · 10', 'toque para ver ou desmarcar') + '</div>';
        var closedView = '<div class="lab-closed">' +
          '<span class="lab-glowbox"><span class="lab-glow"></span>' +
            ringBox(196, 14, 1, '<span class="disp num lab-cn" style="font-size:60px;line-height:1">10</span><span class="cap">de 12</span>', 'var(--accent-mark)', 'var(--accent-wash)') + '</span>' +
          '<div class="lab-dft"><h1 class="ttl2">Dia fechado</h1><p class="sub muted center">Telas desligadas às 21h04. Boa noite. O deitar você marca amanhã, junto com o acordar.</p></div>' +
          '<span class="lab-dfv">' + btn('Ver o dia', { kind: 'g' }) + '</span></div>' +
          '<div class="lab-dfam">' + gl('Amanhã cedo') + '<div class="pad" style="padding-bottom:16px">' + HJ.list([
            hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'sexta · meta 6h50' }),
            hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, 3) + '3 de 7 · meta 6' })]) + '</div></div>';
        stage.innerHTML = phone({ time: '21:04', h: 740, tab: 'hoje', body: '<div class="lab-dfs"><div class="lab-dfl">' + listView + '</div><div class="lab-dfc">' + closedView + '</div></div>' });
        ph = stage.firstChild;
        listV = $('.lab-dfl', ph); closedV = $('.lab-dfc', ph);
        L.set(closedV, 'opacity', 0); closedV.style.visibility = 'hidden';
        late = [$('.lab-dft', ph), $('.lab-dfv', ph), $('.lab-dfam', ph)];
        late.forEach(function (el) { L.set(el, 'opacity', 0); });
        ring = L.ringCtl($('.lab-dfc .ringsvg', ph), 10 / 12);
        num = $('.lab-cn', ph); glow = $('.lab-glow', ph);
        wkRing = L.ringCtl($('.wkd.today .ringsvg', ph), 10 / 12);
        rW = HJ.rollWeek(ph, 10);
        row = $('.lab-dfl .hr', ph); chkEl = $('.chk', row); chkC = L.checkCtl(chkEl);
        toaster = L.toaster(ph, scope);
        L.tap(chkEl, function () { mark(!on, true); }, { scale: 0.9 });
      }
      function stopGlow() {
        if (glowAnim) { var o = +getComputedStyle(glow).opacity; glowAnim.cancel(); glowAnim = null; L.set(glow, 'opacity', o); L.set(glow, 'scale', 1); }
      }
      /* brilha uma vez e assenta em 0,6 */
      function shine() {
        stopGlow();
        if (L.reduced()) { L.to(glow, 'opacity', 0.6, 'micro'); return; }
        L.set(glow, 'opacity', 0);
        var a = glowAnim = L.play(glow, [{ opacity: 0, scale: 0.94, offset: 0 }, { opacity: 1, scale: 1.03, offset: 0.35 }, { opacity: 0.6, scale: 1, offset: 1 }], { dur: 'glow', ease: 'inOut', fill: 'forwards' });
        a.onfinish = function () { if (glowAnim === a) { glowAnim = null; L.set(glow, 'opacity', 0.6); L.set(glow, 'scale', 1); a.cancel(); } };
      }
      function closeDay() {
        closed = true;
        listV.style.pointerEvents = 'none';
        L.to(listV, 'opacity', 0, { dur: 'base', ease: 'exit' });
        closedV.style.visibility = '';
        L.to(closedV, 'opacity', 1, 'base');
        ring.to(11 / 12, { dur: 'ring', ease: 'out' });
        HJ.swap(num, '11');
        var t = L.reduced() ? DUR.micro : DUR.ring;
        scope.after(t, function () { shine(); L.enter(late[0]); }, 'chain');
        scope.after(t + 150, function () { L.enter(late[1]); L.enter(late[2], { delay: 30 }); }, 'chain');
      }
      function reopen() {
        closed = false;
        stopGlow(); L.to(glow, 'opacity', 0, 'micro');
        ring.to(10 / 12, { dur: 'fill', ease: 'out' });
        HJ.swap(num, '10');
        late.forEach(function (el) { L.leave(el); });
        scope.after(DUR.fill, function () {
          L.to(closedV, 'opacity', 0, 'base').then(scope.live(function (ok) { if (ok && !closed) closedV.style.visibility = 'hidden'; }));
          listV.style.pointerEvents = '';
          L.to(listV, 'opacity', 1, 'base');
        }, 'chain');
      }
      function mark(x, fromTap) {
        on = x;
        scope.cancel('chain');
        if (x && !fromTap) L.pulse(chkEl, 0.9);
        chkC.to(x);
        scope.after(60, function () { row.classList.toggle('done', x); }, 'chain');
        scope.after(120, function () { wkRing.to(x ? 11 / 12 : 10 / 12, { dur: 'fill', ease: 'out' }); rW.update(x ? 11 : 10); }, 'chain');
        if (x) {
          scope.after(200, function () {
            toaster.show({ p: 'mente', ic: 'check', t: 'Telas desligadas', s: '11 de 12 feitos hoje', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', ms: 5000, onAction: function () { mark(false); } });
          }, 'chain');
          scope.after(500, closeDay, 'chain');
        } else {
          toaster.hide();
          if (closed) reopen();
        }
      }
      return { reset: reset, play: function () { mark(!on); } };
    }
  });

  /* =============== 12 · NOVO RECORDE E DESLIZE =============== */
  L.demo({
    n: 12, id: 'recorde', name: 'Novo recorde e deslize',
    lede: '"Dias sem" passando de 21 para 22: o número rola e o selo "novo recorde" entra com a mola festa. No deslize, o número desce devagar até 0 e o recorde fica em destaque, sem tremida e sem cor de alerta.',
    hint: 'Use Mais um dia e Registrar deslize, em qualquer ordem.',
    tokens: ['número · fill · como o NumberFlow', L.tok('festa', 'selo'), 'deslize · desce até 0 em fill', 'recorde em destaque · base', 'frase · fadeUp · base'],
    build: function (stage, scope) {
      var cur, rec, total, badgeOn, rD, rR, rT, badge, recCell, note;
      function reset() {
        cur = 21; rec = 21; total = 42; badgeOn = false;
        stage.innerHTML = L.frag(
          '<div class="lab-rec" data-pillar="alim"><span class="bub lg">' + ico('pint-glass') + '</span>' +
            '<h1 class="ttl3" style="margin-top:6px">Zero refrigerante</h1>' +
            '<span class="disp-num"><span class="lab-dn"></span></span><span class="lab-rhs">dias sem refrigerante</span>' +
            '<span class="lab-bslot"><span class="lab-badge">' + ico('trophy', 'fill') + 'novo recorde</span></span></div>' +
          '<div class="pad lab-fpad" data-pillar="alim" style="padding-top:8px"><div class="card lab-rstats">' +
            '<div class="lab-rk"><span class="k">' + ico('trophy') + 'Recorde</span><span class="v"><span class="lab-rr"></span><small>dias</small></span></div>' +
            '<div><span class="k">' + ico('calendar-blank') + 'Total</span><span class="v"><span class="lab-rt"></span><small>dias</small></span></div></div>' +
            '<p class="lab-rnote"><span></span></p></div>');
        var root = stage.firstChild;
        rD = L.roller($('.lab-dn', root), cur, { proportional: true });
        rR = L.roller($('.lab-rr', root), rec);
        rT = L.roller($('.lab-rt', root), total);
        badge = $('.lab-badge', root); recCell = $('.lab-rk', root); note = $('.lab-rnote span', root);
        L.set(badge, 'opacity', 0); L.set(note, 'opacity', 0);
      }
      function sayNote(text) {
        if (text) { note.textContent = text; L.set(note, 'opacity', 0); L.enter(note); }
        else L.leave(note);
      }
      function plus() {
        cur += 1; total += 1;
        rD.update(cur); rT.update(total);
        if (recCell.classList.contains('hl')) { recCell.classList.remove('hl'); sayNote(''); }
        if (cur > rec) {
          rec = cur; rR.update(rec);
          if (!badgeOn) {
            badgeOn = true;
            if (L.reduced()) { L.set(badge, 'scale', 1); L.to(badge, 'opacity', 1, 'micro'); }
            else {
              L.set(badge, 'scale', 0.5);
              L.to(badge, 'scale', 1, 'festa', { delay: 120 });
              L.to(badge, 'opacity', 1, 'base', { delay: 120 });
            }
          }
        }
      }
      function slip() {
        if (cur === 0) return;
        cur = 0;
        rD.update(0, { how: { dur: 'fill', ease: 'inOut' } });
        if (badgeOn) { badgeOn = false; L.leave(badge); }
        recCell.classList.add('hl');
        scope.after(DUR.fill, function () { sayNote('Tudo bem, acontece. A contagem recomeça amanhã e o seu recorde de ' + rec + ' dias continua guardado.'); }, 'note');
      }
      return { reset: reset, play: plus, extra: [['Mais um dia', function () { plus(); }, 'plus'], ['Registrar deslize', function () { slip(); }]] };
    }
  });

  /* =============== 13 · FASE DESBLOQUEADA =============== */
  L.demo({
    n: 13, id: 'fase', name: 'Fase desbloqueada',
    lede: 'O único confete do app: 40 peças nas cores dos pilares caem devagar, uma vez, em confetti; 18 pousam ao redor do emblema e ficam paradas, como na tela da Jornada. O título "Movimento" entra com a mola festa. No reduzido, o confete já aparece parado.',
    hint: 'Toque em Tocar. Mude o tema depois: as peças paradas trocam de cor junto.',
    tokens: [L.tok('confetti', '40 peças · uma vez'), L.tok('festa', 'título · 16 px'), 'resto · fadeUp · cascata de 30 ms', 'reduzido · confete parado'],
    build: function (stage, scope) {
      var canvas, ctx, W, H, pieces, cols, loop, items, title, drawFinal = null;
      var KEYS = ['--mente-mark', '--alim-mark', '--corpo-mark', '--familia-mark', '--accent-mark'];
      function readCols() { var cs = getComputedStyle(canvas); cols = KEYS.map(function (k) { return cs.getPropertyValue(k).trim() || '#999'; }); }
      function setup() {
        var dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        readCols();
        /* pousos: longe do emblema, do texto e do pé (mesma regra da tela da Jornada) */
        var win = canvas.parentNode.getBoundingClientRect();
        function rel(el) { var r = el.getBoundingClientRect(); return { l: r.left - win.left, t: r.top - win.top, r: r.right - win.left, b: r.bottom - win.top }; }
        var emb = rel($('.lab-emb', stage)), cx = (emb.l + emb.r) / 2, cy = (emb.t + emb.b) / 2;
        var txt = [rel($('.lab-eye', stage)), rel(title), rel($('.lab-winc p', stage))], foot = rel($('.lab-foot', stage)).t;
        var seed = 11;
        function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
        var rest = [];
        for (var tries = 0; rest.length < 18 && tries < 4000; tries++) {
          var x = 18 + rnd() * (W - 36), y = 14 + rnd() * (foot - 40);
          if (Math.hypot(x - cx, y - cy) < 96) continue;
          if (txt.some(function (b) { return x > b.l - 18 && x < b.r + 18 && y > b.t - 14 && y < b.b + 14; })) continue;
          if (rest.some(function (p) { return Math.abs(p[0] - x) < 42 && Math.abs(p[1] - y) < 42; })) continue;
          rest.push([x, y]);
        }
        pieces = [];
        for (var i = 0; i < 40; i++) {
          var stays = i < rest.length, p = { k: i % 4, c: i % 5, stays: stays, delay: rnd() * 380 };
          p.dur = Math.min(1600 - p.delay, 1050 + rnd() * 400);
          p.r0 = rnd() * 360; p.spin = (rnd() - 0.5) * 540;
          p.sw = 5 + rnd() * 12; p.f = 1.1 + rnd(); p.ph = rnd() * 6.28;
          if (stays) { p.x1 = rest[i][0]; p.y1 = rest[i][1]; p.x0 = p.x1 + (rnd() - 0.5) * 50; p.y0 = p.y1 - 170 - rnd() * 170; p.r1 = Math.round(rnd() * 180); }
          else { p.x0 = 10 + rnd() * (W - 20); p.y0 = -30 + rnd() * 240; p.x1 = p.x0 + (rnd() - 0.5) * 70; p.y1 = p.y0 + 260 + rnd() * 160; }
          pieces.push(p);
        }
      }
      function shape(p, x, y, rot, a) {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot * Math.PI / 180);
        ctx.fillStyle = ctx.strokeStyle = cols[p.c];
        if (p.k === 0) { ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, 6.2832); ctx.fill(); }
        else if (p.k === 1) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-2, -5.5, 4, 11, 2); else ctx.rect(-2, -5.5, 4, 11); ctx.fill(); }
        else if (p.k === 2) { ctx.lineJoin = 'round'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -4.6); ctx.lineTo(4.2, 3.1); ctx.lineTo(-4.2, 3.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else { ctx.lineCap = 'round'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.quadraticCurveTo(-3.25, -3.6, 0, 0); ctx.quadraticCurveTo(3.25, 3.6, 6.5, 0); ctx.stroke(); }
        ctx.restore();
      }
      function frame(t) {
        ctx.clearRect(0, 0, W, H);
        pieces.forEach(function (p) {
          var u = clamp(0, 1, (t - p.delay) / p.dur);
          if (u <= 0) return;
          var sway = Math.sin(p.f * 6.2832 * (t / 1000) + p.ph) * p.sw;
          if (p.stays) {
            var e = 1 - Math.pow(1 - u, 3);
            shape(p, p.x0 + (p.x1 - p.x0) * e + sway * (1 - e), p.y0 + (p.y1 - p.y0) * e, p.r0 + (p.r1 - p.r0) * e, Math.min(1, u * 8));
          } else {
            shape(p, p.x0 + (p.x1 - p.x0) * u + sway, p.y0 + (p.y1 - p.y0) * u, p.r0 + p.spin * u, Math.min(1, u * 8) * (u < 0.55 ? 1 : (1 - u) / 0.45));
          }
        });
      }
      function still() { ctx.clearRect(0, 0, W, H); pieces.forEach(function (p) { if (p.stays) shape(p, p.x1, p.y1, p.r1, 1); }); }
      function reset() {
        stage.innerHTML = phone({ time: '18:34', h: 760, body:
          '<div class="lab-win" data-pillar="accent"><canvas class="lab-conf" aria-hidden="true"></canvas>' +
            '<div class="lab-winc"><span class="lab-emb">' + ico('path') + '</span>' +
              '<span class="lab-eye">Fase 3</span><h1 class="lab-big">Movimento</h1>' +
              '<p class="sub muted center">A fase 2 fechou com 78%. Academia, corrida e menos tela entram no seu dia a partir de amanhã, segunda, 2 de novembro.</p></div>' +
            '<div class="pad stack lab-foot" style="gap:14px"><div class="card hr" data-pillar="corpo"><span class="bub">' + ico('person-simple-run') + '</span>' +
              '<span class="ht"><b>Primeiro treino de corrida</b><small>Segunda, 7h10 · 30 min</small></span><span class="faint">' + ico('caret-right', 'bold') + '</span></div>' +
              btn('Ver meu dia', { w: true }) + '</div></div>' });
        canvas = $('canvas', stage); title = $('.lab-big', stage);
        items = [$('.lab-emb', stage), $('.lab-eye', stage), title, $('.lab-winc p', stage), $('.lab-foot', stage)];
        setup(); still();
        drawFinal = still;
      }
      function play() {
        if (loop) loop.stop();
        setup(); readCols();
        items.forEach(function (el) { L.set(el, 'opacity', 0); L.set(el, 'y', 0); L.set(el, 'scale', 1); });
        if (L.reduced()) {
          still(); L.set(canvas, 'opacity', 0); L.to(canvas, 'opacity', 1, 'micro');
          items.forEach(function (el) { L.to(el, 'opacity', 1, 'micro'); });
          return;
        }
        L.set(canvas, 'opacity', 1);
        /* emblema, sobretítulo, título (festa), frase e pé em cascata de 30 ms */
        [0, 1, 3, 4].forEach(function (i) { L.set(items[i], 'y', 8); L.enter(items[i], { delay: [0, 30, 0, 90, 120][i] }); });
        L.set(title, 'y', 16); L.set(title, 'scale', 0.92);
        L.to(title, 'y', 0, 'festa', { delay: 60 }); L.to(title, 'scale', 1, 'festa', { delay: 60 });
        L.to(title, 'opacity', 1, 'base', { delay: 60 });
        var t = 0;
        ctx.clearRect(0, 0, W, H);
        loop = scope.loop(function (dt) {
          t += dt * 1000;
          if (t >= DUR.confetti) { still(); return false; }
          frame(t);
        });
      }
      document.addEventListener('lab:theme', function () { if (canvas && canvas.isConnected) { requestAnimationFrame(function () { readCols(); if (!loop || loop.dead) still(); }); } });
      return { reset: reset, play: play };
    }
  });

  /* =============== 14 · CARREGANDO =============== */
  L.demo({
    n: 14, id: 'carregando', name: 'Carregando',
    lede: 'O esqueleto só aparece se a espera passar de 300 ms. A data e o nome já vêm do aparelho; o resto tem as formas do conteúdo, parado, com no máximo uma respiração de opacidade. Quando os dados chegam, troca em base sem nada pular de lugar.',
    hint: 'Resposta rápida chega em 120 ms e o esqueleto nunca aparece. Resposta lenta chega em 1,8 s.',
    tokens: ['espera · 300 ms', 'esqueleto entra · micro', 'respiração · 1 → 0,7 a cada 1,6 s', 'troca · opacidade · base · 240 ms', 'reduzido · esqueleto parado'],
    build: function (stage, scope) {
      var real, skel, log, breath;
      function content() {
        return HJ.week(3) + gl('Manhã') + '<div class="pad">' + HJ.list([HJ.row.peso(), HJ.row.acordar(), HJ.row.caminhada({ nudge: true })]) + '</div>' +
          gl('Ao longo do dia') + '<div class="pad" style="padding-bottom:16px">' + HJ.protein(24, [18, 6], HJ.MORNING_FOODS) + '</div>';
      }
      function say(h) { log.innerHTML = h; }
      function stopBreath() { if (breath) { breath.cancel(); breath = null; } }
      function load(ms) {
        scope.cancel('load'); stopBreath();
        var arrived = false, shown = false;
        L.set(real, 'opacity', 0); L.set(skel, 'opacity', 0);
        say('Pedindo os dados…');
        scope.after(300, function () {
          if (arrived) return;
          shown = true;
          L.to(skel, 'opacity', 1, 'micro');
          if (!L.reduced()) breath = L.play(skel.firstChild, [{ opacity: 1 }, { opacity: 0.7 }, { opacity: 1 }], { dur: 1600, ease: 'inOut', iterations: Infinity });
          say('<b>300 ms</b> e nada ainda: o esqueleto aparece.');
        }, 'load');
        scope.after(ms, function () {
          arrived = true;
          if (shown) {
            L.to(skel, 'opacity', 0, 'base').then(scope.live(function (ok) { if (ok) stopBreath(); }));
            L.to(real, 'opacity', 1, 'base');
            say('Chegou em <b>' + (ms / 1000).toLocaleString('pt-BR') + ' s</b>: o conteúdo troca com o esqueleto em base, no mesmo lugar.');
          } else {
            L.set(real, 'opacity', 1);
            say('Chegou em <b>' + ms + ' ms</b>, antes dos 300 ms: o esqueleto nunca apareceu.');
          }
        }, 'load');
      }
      function reset() {
        breath = null;
        stage.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:12px">' +
          L.frag(HJ.head('Bom dia, Henrique') +
            '<div class="lab-load"><div class="lab-real">' + content() + '</div><div class="lab-skel" aria-hidden="true"><div>' + content() + '</div></div></div>') +
          '<p class="lab-log" aria-live="polite"></p></div>';
        real = $('.lab-real', stage); skel = $('.lab-skel', stage); log = $('.lab-log', stage);
        L.set(skel, 'opacity', 0);
        say('Toque em uma das respostas para simular o primeiro acesso.');
      }
      return { reset: reset, play: function () { load(1800); }, extra: [['Resposta rápida', function () { load(120); }, 'lightning'], ['Resposta lenta', function () { load(1800); }, 'hourglass']] };
    }
  });

  /* =============== 15 · CASCATA =============== */
  L.demo({
    n: 15, id: 'cascata', name: 'Cascata',
    lede: 'Na primeira abertura da sessão, os 6 primeiros blocos do Hoje (cabeçalho, cartão da semana, rótulo e as 3 primeiras linhas) entram com fadeUp, 30 ms um depois do outro; o resto vem com o sexto. Anéis, barras e números já aparecem no valor. Quando os dados só atualizam, nada entra de novo.',
    hint: 'Dados atualizados simula a caminhada marcada no computador: troca em micro, sem mola e sem toast.',
    tokens: ['fadeUp · 8 px · base · 240 ms', 'cascata · 30 ms · 6 blocos', 'outro aparelho · troca em micro'],
    build: function (stage, scope) {
      var blocks, remote, chkC, wkRing, wn, walk, dot, walkTxt, nudge;
      function reset() {
        remote = false;
        stage.innerHTML = L.frag(
          '<div class="lab-cas">' + HJ.head('Bom dia, Henrique') + '</div>' +
          HJ.week(3, { cls: 'lab-cas' }) +
          '<div class="lab-cas">' + gl('Manhã') + '</div>' +
          '<div class="pad"><div class="card lst lab-cas">' + HJ.row.peso() + '<div class="lab-cas">' + HJ.row.acordar() + '</div><div class="lab-cas">' + HJ.row.caminhada({ nudge: true }) + '</div></div></div>' +
          '<div class="lab-cas">' + gl('Ao longo do dia') + '<div class="pad stack" style="padding-bottom:16px">' + HJ.protein(24, [18, 6], HJ.MORNING_FOODS) + HJ.water(0) + '</div></div>', { h: 720 });
        var root = stage.firstChild;
        blocks = $$('.lab-cas', root);
        wkRing = L.ringCtl($('.wkd.today .ringsvg', root), 3 / 12);
        wn = $('.wkh b.num', root);
        walk = $('.lab-walk .hr', root); dot = $$('.dots i', walk)[2];
        walkTxt = $('.ht small > span', walk); nudge = $('.nudge > span', root);
        chkC = L.checkCtl($('.chk', walk));
      }
      function play() {
        blocks.forEach(function (b) { L.set(b, 'opacity', 0); L.set(b, 'y', 0); });
        blocks.forEach(function (b, i) { L.enter(b, { delay: L.reduced() ? 0 : Math.min(i, 5) * 30 }); });
      }
      /* uma mudança que chegou de outro aparelho: troca em micro, sem cascata, sem mola e sem celebração */
      function update() {
        remote = !remote;
        var x = remote;
        chkC.to(x, { quiet: true });
        wkRing.to(x ? 4 / 12 : 3 / 12, null, { quiet: true });
        HJ.swap(wn, x ? '4 de 12' : '3 de 12');
        HJ.swap(walkTxt, (x ? 3 : 2) + ' de 7 · meta 6');
        HJ.swap(nudge, x ? 'De volta hoje.' : 'Hoje é um bom dia para voltar.');
        dot.classList.toggle('on', x); walk.classList.toggle('done', x);
      }
      return { reset: reset, play: play, extra: [['Dados atualizados', update, 'arrows-clockwise']] };
    }
  });

  /* =============== 16 · OUTRO DIA E SEM INTERNET =============== */
  var DAYS = [
    { name: 'Segunda, 19 de outubro', peso: '84,1 kg', wake: '6h48', walk: 1, prot: '82 g', water: '3 L', nota: '4 · Bom' },
    { name: 'Terça, 20 de outubro', peso: '83,9 kg', wake: '6h55', walk: 2, prot: '74 g', water: '2,5 L', nota: '3 · Ok' },
    { name: 'Quarta, 21 de outubro', peso: '83,8 kg', wake: '6h49', walk: 0, prot: '71 g', water: '2,5 L', nota: '3 · Ok' },
    { name: 'Hoje', today: true }
  ];
  function dayList(i) {
    var d = DAYS[i];
    if (d.today) {
      return gl('Manhã') + '<div class="pad">' + HJ.list([HJ.row.peso(), HJ.row.acordar(), HJ.row.caminhada({ nudge: true })]) + '</div>' +
        gl('Ao longo do dia') + '<div class="pad stack">' + HJ.protein(24, [18, 6], HJ.MORNING_FOODS) + HJ.water(0) + HJ.list([HJ.row.almoco(), HJ.row.futebol()]) + '</div>';
    }
    return gl('Manhã') + '<div class="pad">' + HJ.list([
        hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: vpill(d.peso, { icon: 'check' }), done: true }),
        HJ.row.acordar(d.wake),
        d.walk ? HJ.row.caminhada({ n: d.walk, done: true }) : HJ.row.caminhada({ s: 'sem registro · dá para marcar' })
      ]) + '</div>' +
      gl('Ao longo do dia') + '<div class="pad">' + HJ.list([
        hr({ p: 'alim', ic: 'egg', t: 'Proteína', s: 'meta 80 g', r: vpill(d.prot) }),
        hr({ p: 'alim', ic: 'drop', t: 'Água', s: 'meta 3 L', r: vpill(d.water) }),
        HJ.row.almoco(d.nota)
      ]) + '</div>';
  }
  L.demo({
    n: 16, id: 'outro-dia', name: 'Outro dia e sem internet',
    lede: 'Tocar num dia da semana troca a lista com opacidade e 12 px na direção do tempo (o passado vem da esquerda), e a faixa "você está vendo um dia que passou" desce em base. Sem internet, um aviso neutro desce; quando ela volta, vira "Tudo em dia" por 2 s e sobe.',
    hint: 'Toque em segunda, terça ou quarta na semana do topo. Use os botões para a internet cair e voltar.',
    tokens: ['lista · 12 px · entra em base, sai em micro', 'faixa · desce em base, sobe em micro', 'Voltar para hoje · fadeUp', 'sem internet · desce em base', '"Tudo em dia" · 2 s · sobe em micro'],
    build: function (stage, scope) {
      var day, days, cur, wkds, past, net, pill, pd, o1, o2, netOn;
      function band(w, show) {
        var inner = w.firstChild, h = inner.offsetHeight;
        if (show) {
          if (L.reduced()) { L.set(w, 'hpx', h); L.set(inner, 'y', 0); return L.to(inner, 'opacity', 1, 'micro'); }
          if (L.get(inner, 'opacity') < 0.02) L.set(inner, 'y', -10);
          L.to(w, 'hpx', h, 'base'); L.to(inner, 'y', 0, 'base');
          return L.to(inner, 'opacity', 1, 'base');
        }
        if (L.reduced()) return L.to(inner, 'opacity', 0, 'micro').then(scope.live(function (ok) { if (ok) L.set(w, 'hpx', 0); }));
        L.to(w, 'hpx', 0, { dur: 'micro', ease: 'exit' }); L.to(inner, 'y', -10, { dur: 'micro', ease: 'exit' });
        return L.to(inner, 'opacity', 0, { dur: 'micro', ease: 'exit' });
      }
      function select(d) {
        wkds.forEach(function (w, j) { w.classList.toggle('sel', j === d && d !== 3); });
      }
      function go(d) {
        if (d === day || d > 3) return;
        var toPast = d < day, from = toPast ? -12 : 12;
        var old = cur, nw = document.createElement('div');
        nw.innerHTML = dayList(d); days.appendChild(nw); cur = nw;
        if (L.reduced()) {
          L.set(nw, 'opacity', 0); L.to(nw, 'opacity', 1, 'micro');
          L.to(old, 'opacity', 0, 'micro').then(function () { old.remove(); });
        } else {
          L.set(nw, 'x', from); L.set(nw, 'opacity', 0);
          L.to(nw, 'x', 0, 'base'); L.to(nw, 'opacity', 1, 'base');
          L.to(old, 'x', -from, { dur: 'micro', ease: 'exit' });
          L.to(old, 'opacity', 0, { dur: 'micro', ease: 'exit' }).then(function () { old.remove(); });
        }
        old.style.pointerEvents = 'none';
        select(d);
        if (d < 3) {
          if (day < 3) swapText(pd, DAYS[d].name); else pd.textContent = DAYS[d].name;
          band(past, true);
          L.enter(pill);
        } else {
          band(past, false);
          L.leave(pill, { hide: true });
        }
        day = d;
      }
      function swapText(el, text) { el.textContent = text; L.play(el, [{ opacity: 0 }, { opacity: 1 }], { dur: 'micro' }); }
      function offline(x) {
        scope.cancel('net');
        if (x) {
          netOn = true;
          L.set(o2, 'opacity', 0); L.set(o1, 'opacity', 1);
          band(net, true);
        } else {
          if (!netOn) return;
          netOn = false;
          L.to(o1, 'opacity', 0, 'micro'); L.to(o2, 'opacity', 1, 'micro');
          scope.after(2000, function () { band(net, false); }, 'net');
        }
      }
      function reset() {
        day = 3; netOn = false;
        var body = HJ.head('Bom dia, Henrique') +
          '<div class="lab-band lab-bnet"><div><div class="lab-off">' +
            '<div class="o1">' + ico('cloud-slash', 'regular') + '<span><b>Sem internet.</b> Tudo continua salvo aqui e sobe quando voltar.</span></div>' +
            '<div class="o2">' + ico('cloud-check', 'regular') + '<span><b>Tudo em dia.</b></span></div></div></div></div>' +
          '<div class="lab-band lab-bpast"><div><div class="lab-past"><span class="bub">' + ico('clock-counter-clockwise') + '</span>' +
            '<span><b class="lab-pd">' + DAYS[2].name + '</b><small>Você está vendo um dia que passou</small></span></div></div></div>' +
          HJ.week(3, { style: 'padding-top:4px' }) +
          '<div class="lab-days"><div>' + dayList(3) + '</div></div><div style="height:16px"></div>';
        stage.innerHTML = phone({ time: '7:46', h: 760, tab: 'hoje', body: body,
          overlay: '<div class="lab-backpill" hidden>' + btn('Voltar para hoje', { icon: 'arrow-u-up-left' }) + '</div>' });
        var ph = stage.firstChild;
        days = $('.lab-days', ph); cur = days.firstChild;
        past = $('.lab-bpast', ph); net = $('.lab-bnet', ph); pd = $('.lab-pd', ph);
        o1 = $('.o1', ph); o2 = $('.o2', ph);
        pill = $('.lab-backpill', ph);
        [past, net].forEach(function (w) { L.set(w, 'hpx', 0); L.set(w.firstChild, 'opacity', 0); });
        L.set(pill, 'opacity', 0);
        var wk = $('.wk', ph); wk.classList.add('lab-wk');
        wkds = $$('.wkd', wk);
        wkds.forEach(function (w, i) {
          if (i > 3) return;
          w.setAttribute('aria-label', i === 3 ? 'Hoje' : DAYS[i].name);
          L.tap(w, function () { go(i); }, { scale: false, guard: false });
        });
        L.tap($('.btn', pill), function () { go(3); });
      }
      function play() {
        go(1);
        scope.after(1600, function () { go(3); }, 'seq');
        scope.after(3000, function () { offline(true); }, 'seq');
        scope.after(4600, function () { offline(false); }, 'seq');
      }
      return { reset: reset, play: play, extra: [['Sem internet', function () { offline(true); }, 'cloud-slash'], ['Internet voltou', function () { offline(false); }, 'cloud-check']] };
    }
  });
})();
