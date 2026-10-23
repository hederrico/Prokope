/* Prokopē · laboratório de movimento · o Hoje das cenas
   O Hoje revisado (SPEC › "Regras do Hoje" e interacao/telas/hoje.md), montado com os helpers da base:
   weekCard, fold, doPill, plusBtn, addPill, semTile, .qa e .nudge. Sem avatar e sem cartão da fase.
   Os números que as cenas animam ganham um <span class="lab-…"> para o Lab.roller. */
var LabHoje = (function () {
  'use strict';
  var L = Lab, $ = L.$, $$ = L.$$, DUR = L.DUR;
  var DATE = 'Quinta, 22 de outubro';

  function vals(feitos) { return [0.83, 0.75, 0.6, feitos / 12, 0, 0, 0]; }
  function head(title, date) { return hd({ date: date || DATE, title: title }); }
  /* cartão da semana com "x de 12 feitos hoje" e "76% na semana ›" */
  function week(feitos, o) { o = o || {}; return '<div class="pad' + (o.cls ? ' ' + o.cls : '') + '"' + (o.style ? ' style="' + o.style + '"' : '') + '>' + weekCard(feitos, 76, vals(feitos)) + '</div>'; }
  /* troca o "3 de 12" do cartão por um número que rola */
  function rollWeek(root, feitos) {
    var b = $('.wkh b.num', root);
    b.innerHTML = '<span class="lab-wn"></span> de 12';
    return L.roller($('.lab-wn', b), feitos);
  }

  var row = {
    peso: function () { return hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: vpill('83,6 kg', { icon: 'check' }), done: true }); },
    acordar: function (v) { return hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: vpill(v || '6h52', { icon: 'check' }), done: true }); },
    /* o: { n bolinhas, done, nudge (true ou a frase), roll (o número vira span), s (subtítulo no lugar de "n de 7") } */
    caminhada: function (o) {
      o = o || {};
      var n = o.n == null ? 2 : o.n;
      var s = o.s || (dots(7, n) + '<span>' + (o.roll ? '<span class="lab-r2"></span>' : n) + ' de 7 · meta 6</span>');
      return '<div data-pillar="familia" class="lab-walk">' +
        hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: s, r: chk(!!o.done, 'Caminhada com o cachorro'), done: o.done }) +
        (o.nudge ? '<div class="nudge"><span>' + (o.nudge === true ? 'Hoje é um bom dia para voltar.' : o.nudge) + '</span><span class="lk" role="button">Marcar ontem</span></div>' : '') + '</div>';
    },
    almoco: function (v) { return hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: v ? vpill(v) : doPill('Dar nota') }); },
    futebol: function (done) { return hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · ' + (done ? 1 : 0) + ' de 1 na semana', r: chk(!!done, 'Futebol'), done: done }); },
    telas: function () { return hr({ p: 'mente', ic: 'device-mobile-slash', t: 'Telas desligadas', s: 'às 21h · agora', r: chk(false, 'Telas desligadas') }); },
    deitar: function () { return hr({ p: 'mente', ic: 'moon-stars', t: 'Deitar', s: 'meta 22h · marque amanhã ao acordar' }); }
  };
  /* troca um texto com opacidade em micro (convite, número na serifa, dado de outro aparelho) */
  function swap(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    L.play(el, [{ opacity: 0 }, { opacity: 1 }], { dur: 'micro', ease: 'out' });
  }
  function list(rows) { return '<div class="card lst">' + rows.join('') + '</div>'; }

  /* cartão da proteína do Hoje, com os botões rápidos (.qa). meta: inclui a linha do selo "meta batida" */
  function protein(g, segs, foods, meta) {
    return '<div class="card p stack lab-prot" data-pillar="alim" style="gap:8px">' +
      '<div class="between"><span class="row"><span class="bub sm">' + ico('egg') + '</span><b style="font:600 16px/20px var(--font-ui)">Proteína</b></span>' +
      '<span class="sub num"><b><span class="lab-pt" data-v="' + g + '">' + g + ' g</span></b> <span class="faint">de 80 g</span></span></div>' +
      pbar(segs, 120, 80, 'meta 80 g') +
      (meta ? '<div class="lab-meta"><div>' + vpill('meta batida', { ok: true, icon: 'check' }) + '<span class="lab-over num">+<span class="lab-po"></span> g</span></div></div>' : '') +
      '<div class="qa">' + foods.map(function (f) {
        return '<span class="q" role="button" data-g="' + f[1] + '" aria-label="Somar ' + f[0] + ', ' + f[1] + ' gramas"><b>' + f[0] + '</b><small>+' + f[1] + ' g</small></span>';
      }).join('') + '<span class="q more" role="button" aria-label="Mais alimentos">' + ico('dots-three', 'bold') + '<small>Mais</small></span></div></div>';
  }
  /* linha da água: anel de 40 px e os botões de somar */
  function water(litros, o) {
    o = o || {};
    return '<div class="card lab-waterrow" data-pillar="alim"><div class="hr">' + ringBox(40, 5, o.roll ? 1 : Math.min(1, litros / 3), ico('drop'), 'var(--mark)', 'var(--wash)') +
      '<span class="ht"><b>Água</b><small class="num">' + (o.roll ? '<span class="lab-wv"></span>' : String(litros).replace('.', ',')) + ' de 3 L</small></span>' +
      (o.noAdd ? '' : '<span class="row" style="gap:6px">' + addPill('500 ml') + addPill('1 L') + '</span>') + '</div>' +
      (o.meta ? '<div class="lab-meta"><div style="padding:0 14px 12px 66px">' + vpill('meta batida', { ok: true, icon: 'check' }) + '<span class="lab-over num">+<span class="lab-wo"></span> L</span></div></div>' : '') + '</div>';
  }
  function limits() {
    function limit(ic, t, used, label) { return hr({ p: 'alim', ic: ic, t: t, s: slots(2, used, 'used') + '<span class="num">' + used + ' de 2</span>na semana', r: plusBtn(label) }); }
    return gl('Limites da semana') + '<div class="pad">' + list([limit('pizza', 'Refeições livres', 0, 'Usar uma refeição livre'), limit('cookie', 'Tranqueiras', 1, 'Registrar tranqueira hoje')]) + '</div>';
  }
  function diasSem() {
    return gl('Dias sem') + '<div class="pad dsr">' +
      semTile('alim', 'pint-glass', 12, 'refrigerante', '<span class="cap">recorde 21</span>') +
      semTile('mente', 'video-camera-slash', 32, 'Shorts e TikTok', '<span class="cap rec">' + ico('trophy', 'regular') + 'seu recorde</span>') + '</div>';
  }
  function noite() { return gl('Noite', 'a partir das 20h30') + '<div class="pad">' + fold(['broom|familia', 'trash|familia', 'bowl-food|alim'], 3, '6 hábitos', 'louça, lixo, jantar e mais 3') + '</div>'; }
  var MORNING_FOODS = [['Ovo', 6], ['Leite', 6], ['Whey', 22]];
  /* o Hoje das 7h42, inteiro (o: { walk: true marcada }) */
  function morning(o) {
    o = o || {};
    return head('Bom dia, Henrique') + week(o.walk ? 4 : 3) +
      gl('Manhã') + '<div class="pad">' + list([row.peso(), row.acordar(), row.caminhada({ n: o.walk ? 3 : 2, done: o.walk, nudge: o.walk ? 'De volta hoje.' : true })]) + '</div>' +
      gl('Ao longo do dia') + '<div class="pad stack">' + protein(24, [18, 6], MORNING_FOODS) + water(0, { noAdd: false }) + list([row.almoco(), row.futebol()]) + '</div>' +
      noite() + limits() + diasSem() + '<div style="height:24px"></div>';
  }

  /* controla o cartão da proteína: o total rola, cada porção é um segmento novo e, ao passar de 80 g,
     a linha acende e entra o selo (se o cartão tiver a linha do selo) */
  function proteinCtl(card, scope) {
    var SCALE = 120, GOAL = 80, el = $('.lab-pt', card), total = +el.dataset.v, hit = total >= GOAL, overOn = false;
    var rT = L.roller(el, total, { suffix: ' g' }), track = $('.pb-t', card), line = $('.pb-m', card), meta = $('.lab-meta', card), seal, over, rO;
    if (meta) {
      seal = $('.vpill', meta); over = $('.lab-over', meta); rO = L.roller($('.lab-po', meta), 0);
      L.set(meta, 'hpx', 0); L.set(seal, 'opacity', 0); L.set(over, 'opacity', 0);
    }
    function showOver() {
      if (!meta) return;
      rO.update(total - GOAL, { instant: !overOn });
      if (!overOn) { overOn = true; L.enter(over, { delay: 60 }); }
    }
    function lightUp() {
      line.classList.add('lit');
      if (!meta) return;
      var h = meta.firstChild.offsetHeight;
      if (L.reduced()) L.set(meta, 'hpx', h); else L.to(meta, 'hpx', h, 'base');
      L.enter(seal);
      if (total > GOAL) showOver();
    }
    function add(g) {
      var prev = total;
      total += g;
      rT.update(total);
      var seg = document.createElement('span');
      seg.className = 'pb-s'; track.appendChild(seg);
      var w = g / SCALE * 100;
      if (L.reduced()) { L.set(seg, 'w', w); L.set(seg, 'opacity', 0); L.to(seg, 'opacity', 1, 'micro'); }
      else { L.set(seg, 'w', 0); L.to(seg, 'w', w, { dur: 'fill', ease: 'out' }); }
      if (!hit && total >= GOAL) {
        hit = true;
        /* a linha acende quando a barra encosta nela, e não no fim da animação */
        scope.after(L.reduced() ? 0 : L.EF.out.inverse((GOAL - prev) / g) * DUR.fill, lightUp);
      } else if (hit && total > GOAL) showOver();
    }
    /* os botões rápidos somam na hora; o intervalo mínimo é de 120 ms (hoje.md, botões de somar) */
    $$('.q[data-g]', card).forEach(function (q) { L.tap(q, function () { add(+q.dataset.g); }, { guard: 120 }); });
    return { add: add, get total() { return total; } };
  }

  return { swap: swap, DATE: DATE, vals: vals, head: head, week: week, rollWeek: rollWeek, row: row, list: list, protein: protein, water: water,
    limits: limits, diasSem: diasSem, noite: noite, morning: morning, proteinCtl: proteinCtl, MORNING_FOODS: MORNING_FOODS };
})();
