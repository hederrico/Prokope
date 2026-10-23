/* Hábito e Progresso · detalhe do hábito (caminhada, dias sem), correção de um dia e as vistas do Progresso.
   Usa os componentes da base (ch, tag, mbar, heatKey, budget, .stats, .stat). Ficam aqui só o calendário do mês
   (MonthCalendar), o seletor de período (PeriodSelector) e os gráficos em SVG próprio. Prefixo das classes: .xc- */
(function () {
  addCSS(
    /* comuns */
    '.xc-pc { --xc-bar: color-mix(in oklab, var(--fill), var(--mark)); }' +
    '.xc-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }' +
    '.xc-svg { display: block; overflow: visible; }' +
    '.xc-svg text { font-family: var(--font-ui); font-variant-numeric: tabular-nums; }' +
    '.xc-grid { stroke: var(--border); stroke-width: 1; }' +
    '.xc-base { stroke: var(--border-strong); stroke-width: 1; }' +
    '.xc-ax { font-size: 11px; font-weight: 500; fill: var(--text-3); }' +
    '.xc-ax.on { font-weight: 700; fill: var(--text); }' +
    '.xc-val { font-size: 13px; font-weight: 600; fill: var(--text); }' +
    '.xc-val.soft { fill: var(--text-2); font-weight: 500; }' +
    '.xc-chev { color: var(--text-3); font-size: 16px; display: grid; place-items: center; }' +
    /* legendas de gráfico pelo heatKey() da base: ponto, linha e listrado */
    '.hmk i.xc-kdot { width: 8px; height: 8px; border-radius: 50%; background: color-mix(in oklab, var(--mark) 42%, var(--surface)); }' +
    '.hmk i.xc-kline { width: 16px; height: 3px; border-radius: 2px; background: var(--mark); }' +
    '.hmk i.xc-khatch { background: repeating-linear-gradient(135deg, var(--xc-bar) 0 2px, color-mix(in oklab, var(--xc-bar) 35%, var(--surface)) 2px 4.2px); }' +
    /* setas de mês, semana ou fase: alvo de 44 */
    '.xc-ar { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--accent-ink); font-size: 18px; }' +
    '.xc-ar.off { color: var(--text-3); opacity: .45; }' +
    '.xc-mn { display: flex; margin: -10px -12px 0 0; }' +

    /* MonthCalendar: o mesmo no hábito e no humor. Estados com as letras do heatmap da base:
       d feito (✓) · p parcial (metade cheia) · n sem registro (trilho) · x pausado · u fora da agenda · f por vir · t hoje · sel tocado */
    '.xc-calh, .xc-calg { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }' +
    '.xc-calh { margin: 12px 0 6px; }' +
    '.xc-calh span { text-align: center; font: 600 11px/14px var(--font-ui); color: var(--text-3); }' +
    '.xc-c { height: 48px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font: 600 11px/12px var(--font-ui); color: var(--text); font-variant-numeric: tabular-nums; }' +
    '.xc-c .face { width: 24px; height: 24px; }' +
    '.xc-c .xc-fs { display: block; width: 24px; height: 24px; }' +
    '.xc-c.n { background: var(--track); color: var(--text-2); }' +
    '.xc-c.f { box-shadow: inset 0 0 0 1.5px var(--border); color: var(--text-3); font-weight: 500; }' +
    '.xc-c.e { visibility: hidden; }' +
    '.xc-c.t { box-shadow: 0 0 0 1.5px var(--surface), 0 0 0 3px var(--text); }' +
    '.xc-c.sel { box-shadow: 0 0 0 2px var(--surface), 0 0 0 4.5px var(--accent-mark); }' +
    '.xc-hab .xc-c > i { display: block; height: 16px; font-size: 15px; line-height: 16px; }' +
    '.xc-hab .xc-c.d { background: var(--fill); color: var(--on); }' +
    '.xc-hab .xc-c.p { background: linear-gradient(to top, var(--fill) 50%, var(--track) 50%); }' +
    '.xc-hab .xc-c.x { background: repeating-linear-gradient(135deg, var(--track) 0 3px, transparent 3px 7px); box-shadow: inset 0 0 0 1px var(--track); color: var(--text-2); }' +
    '.xc-hab .xc-c.u { border: 1.5px dotted var(--border-strong); color: var(--text-3); }' +

    /* hábito */
    '.xc-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 8px 24px 20px; }' +
    '.xc-hero .ttl2 { margin-top: 6px; }' +
    '.xc-tags { display: flex; gap: 6px; justify-content: center; }' +
    '.xc-wst .dots { gap: 4px; padding: 1px 0; }' +
    '.xc-wst .dots i { width: 8px; height: 8px; }' +
    '.xc-why { display: flex; align-items: flex-start; gap: 8px; padding: 11px 14px 13px; border-top: 1px solid var(--border); font: 500 13px/18px var(--font-ui); color: var(--text-2); }' +
    '.xc-why i { flex: none; font-size: 16px; margin-top: 1px; color: var(--ink); }' +
    '.xc-nv { display: flex; align-items: center; gap: 10px; margin: 14px 0 12px; padding: 10px 12px; border-radius: 12px; background: var(--wash); font: 500 14px/19px var(--font-ui); color: var(--text); }' +
    '.xc-nv i { flex: none; font-size: 20px; color: var(--ink); }' +
    '.xc-fx { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }' +
    '.xc-fx > span { display: flex; align-items: center; gap: 8px; padding: 8px 9px; border-radius: 12px; background: var(--surface); }' +
    '.xc-fx .face { width: 24px; height: 24px; flex: none; }' +
    '.xc-fx b { display: block; font: 600 17px/20px var(--font-ui); }' +
    '.xc-fx > span > span { font: 500 11px/14px var(--font-ui); color: var(--text-2); }' +
    '.xc-huge { font-size: 100px; line-height: .92; letter-spacing: -.03em; margin-top: 2px; }' +
    '.xc-hs { font: 500 17px/22px var(--font-ui); color: var(--text-2); }' +
    '.xc-per + .xc-per { margin-top: 16px; }' +
    '.xc-pt { display: flex; align-items: baseline; gap: 6px; min-width: 0; }' +
    '.xc-pt b { font: 600 16px/20px var(--font-ui); }' +
    '.xc-pr { display: flex; align-items: center; gap: 6px; }' +
    '.xc-pbar { position: relative; display: block; height: 12px; margin-top: 8px; border-radius: 99px; background: var(--track); }' +
    '.xc-pbar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 99px; background: var(--xc-bar); }' +
    '.xc-per.now .xc-pbar i { background: var(--mark); }' +
    '.xc-per.now .xc-pbar i::after { content: ""; position: absolute; right: -3px; top: 50%; width: 14px; height: 14px; margin-top: -7px; border-radius: 50%; background: var(--mark); box-shadow: 0 0 0 2.5px var(--surface); }' +
    '.xc-hist > .cap { margin-top: 14px; }' +
    '.xc-foot { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; padding-bottom: 12px; }' +
    '.xc-shab { gap: 12px; }' +
    '.xc-shab b { display: block; font: 600 16px/20px var(--font-ui); }' +

    /* PeriodSelector, título e chips do Progresso */
    '.xc-hd .hd-row { min-height: 44px; }' +
    '.xc-pn { display: inline-flex; align-items: center; height: 44px; border-radius: 999px; background: var(--sunken); }' +
    '.xc-pl { display: flex; flex-direction: column; align-items: center; min-width: 128px; text-align: center; }' +
    '.xc-pl b { font: 600 15px/19px var(--font-ui); color: var(--text); font-variant-numeric: tabular-nums; }' +
    '.xc-pl small { font: 500 11px/13px var(--font-ui); color: var(--text-3); }' +
    '.xc-filt { overflow: hidden; padding-bottom: 8px; }' +
    '.xc-filt .chips { flex-wrap: nowrap; gap: 6px; padding: 0 16px; }' +
    '.xc-cd { width: 8px; height: 8px; flex: none; border-radius: 50%; background: var(--mark); }' +
    '.chip.sel .xc-cd { box-shadow: 0 0 0 1.5px var(--bg); }' +
    '.xc-rn { font-size: 38px; line-height: 1; letter-spacing: -.02em; }' +
    '.xc-wkr { display: flex; align-items: center; gap: 20px; margin-top: 14px; }' +
    '.xc-wkr .rc .cap { margin-top: 4px; line-height: 14px; }' +
    '.xc-past { flex: 1; min-width: 0; display: flex; flex-direction: column; }' +
    '.xc-past > div { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 44px; }' +
    '.xc-past > div + div { border-top: 1px solid var(--border); }' +
    '.xc-past .cap { font: 500 13px/16px var(--font-ui); color: var(--text-2); }' +
    '.xc-past b { font: 600 17px/20px var(--font-ui); }' +
    '.xc-pil { display: grid; grid-template-columns: 10px 104px minmax(0, 1fr) 40px 16px; align-items: center; gap: 10px; min-height: 52px; padding: 10px 12px 10px 16px; }' +
    '.xc-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--mark); }' +
    '.xc-pil b { display: block; font: 500 16px/20px var(--font-ui); }' +
    '.xc-pil small { display: block; font: var(--t-caption); color: var(--text-3); }' +
    '.xc-pil em { font: 600 15px/1 var(--font-ui); font-style: normal; text-align: right; }' +

    /* medidas */
    '.xc-pts { fill: color-mix(in oklab, var(--mark) 42%, var(--surface)); }' +
    '.xc-ma { fill: none; stroke: var(--mark); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }' +
    '.xc-end { fill: var(--mark); stroke: var(--surface); stroke-width: 2.5; }' +
    '.xc-ln2 { fill: none; stroke: var(--mark); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }' +
    '.xc-dt { fill: var(--surface); stroke: var(--mark); stroke-width: 2; }' +
    '.xc-dt.on { fill: var(--mark); stroke: var(--surface); stroke-width: 2.5; }' +

    /* humor */
    '.xc-cal { --m1: color-mix(in oklab, var(--accent-mark) 10%, var(--surface)); --m2: color-mix(in oklab, var(--accent-mark) 24%, var(--surface)); --m3: color-mix(in oklab, var(--accent-mark) 40%, var(--surface)); --m4: color-mix(in oklab, var(--accent-mark) 57%, var(--surface)); --m5: color-mix(in oklab, var(--accent-mark) 76%, var(--surface)); }' +
    ':root[data-theme="dark"] .xc-cal { --m1: color-mix(in oklab, var(--accent-mark) 11%, var(--surface)); --m2: color-mix(in oklab, var(--accent-mark) 20%, var(--surface)); --m3: color-mix(in oklab, var(--accent-mark) 30%, var(--surface)); --m4: color-mix(in oklab, var(--accent-mark) 40%, var(--surface)); --m5: color-mix(in oklab, var(--accent-mark) 52%, var(--surface)); }' +
    '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .xc-cal { --m1: color-mix(in oklab, var(--accent-mark) 11%, var(--surface)); --m2: color-mix(in oklab, var(--accent-mark) 20%, var(--surface)); --m3: color-mix(in oklab, var(--accent-mark) 30%, var(--surface)); --m4: color-mix(in oklab, var(--accent-mark) 40%, var(--surface)); --m5: color-mix(in oklab, var(--accent-mark) 52%, var(--surface)); } }' +
    '.xc-c.l1 { background: var(--m1); } .xc-c.l2 { background: var(--m2); } .xc-c.l3 { background: var(--m3); } .xc-c.l4 { background: var(--m4); } .xc-c.l5 { background: var(--m5); }' +
    '.xc-cal .hmk i.xc-km4 { background: var(--m4); }' +
    '.xc-mlg { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; margin: 18px 0 12px; }' +
    '.xc-mlg > div { display: flex; flex-direction: column; align-items: center; gap: 5px; font: 500 11px/13px var(--font-ui); color: var(--text-2); text-align: center; }' +
    '.xc-mlg .xc-c { width: 36px; height: 32px; border-radius: 10px; }' +
    '.xc-mlg .xc-c .face { width: 22px; height: 22px; }' +
    '.xc-avg { display: flex; align-items: center; gap: 12px; padding: 14px; }' +
    '.xc-avg .face { width: 38px; height: 38px; }' +
    '.xc-avg .stat { display: block; }' +

    /* folha do dia */
    '.xc-fb { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: var(--accent-wash); border: 1px solid var(--accent-mark); }' +
    '.xc-fb .face { width: 32px; height: 32px; flex: none; }' +
    '.xc-fb b { display: block; font: 600 16px/20px var(--font-ui); color: var(--accent-ink); }' +
    '.xc-fb small { display: block; font: var(--t-caption); color: var(--text-2); }' +
    '.xc-good { display: flex; flex-direction: column; gap: 8px; }' +
    '.xc-gi { display: flex; align-items: center; gap: 10px; font: 400 16px/22px var(--font-ui); }' +
    '.xc-gi::before { content: ""; width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--accent-mark); }' +
    '.xc-ds { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 12px 0; border-radius: 14px; background: var(--sunken); }' +
    '.xc-ds > div { display: flex; flex-direction: column; gap: 2px; padding: 0 14px; }' +
    '.xc-ds > div + div { border-left: 1px solid var(--border); }' +
    '.xc-ds b { font: 600 17px/22px var(--font-ui); font-variant-numeric: tabular-nums; }' +

    /* alimentação */
    '.xc-trk { fill: var(--track); }' +
    '.xc-bar { fill: var(--xc-bar); }' +
    '.xc-bar.today { fill: url(#xc-hatch); }' +
    '.xc-hb { fill: color-mix(in oklab, var(--xc-bar) 35%, var(--surface)); }' +
    '.xc-hl { fill: var(--xc-bar); }' +
    '.xc-meta { stroke: var(--text-2); stroke-width: 1.5; stroke-dasharray: 4 3; }' +
    '.xc-mt { font-size: 11px; font-weight: 600; fill: var(--text-2); }' +
    '.xc-wat { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 14px; }' +
    '.xc-wat > div { display: flex; flex-direction: column; align-items: center; gap: 4px; }' +
    '.xc-wat .rc { color: var(--ink); font-size: 15px; }' +
    '.xc-wat .xc-wd2 { margin-top: 4px; font: 500 11px/13px var(--font-ui); color: var(--text-3); }' +
    '.xc-wat .xc-wd2.on { font-weight: 700; color: var(--text); }' +
    '.xc-wat .xc-wv { font: 600 13px/16px var(--font-ui); color: var(--text); font-variant-numeric: tabular-nums; min-height: 16px; }' +
    '.xc-nt { display: flex; flex-direction: column; gap: 10px; padding: 14px; }' +
    '.xc-nt .row b { font: 600 15px/20px var(--font-ui); }' +
    '.xc-ntv { display: flex; align-items: baseline; gap: 5px; }'
  );

  /* ---------- helpers ---------- */
  var WD = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  function insight(p, ic, text, small) {
    return '<div class="insight" data-pillar="' + p + '">' + ico(ic) + '<div><p>' + text + '</p>' + (small ? '<small>' + small + '</small>' : '') + '</div></div>';
  }
  function f1(n) { return n.toFixed(1).replace('.', ','); }
  function spacer(h) { return '<div style="height:' + h + 'px;flex:none"></div>'; }
  function chev() { return '<span class="xc-chev">' + ico('caret-right', 'bold') + '</span>'; }
  /* setas para voltar e avançar o mês; a da frente fica apagada no período atual */
  function arrows() {
    return '<span class="xc-mn"><span class="xc-ar" role="button" aria-label="Mês anterior">' + ico('caret-left', 'bold') + '</span>' +
      '<span class="xc-ar off" role="button" aria-disabled="true" aria-label="Próximo mês">' + ico('caret-right', 'bold') + '</span></span>';
  }
  /* coluna com topo arredondado e base reta (x, topo, base, largura, raio) */
  function colPath(x, top, base, w, r) {
    r = Math.min(r, (base - top) / 2, w / 2);
    return 'M' + x + ' ' + base + 'V' + (top + r).toFixed(1) + 'Q' + x + ' ' + top.toFixed(1) + ' ' + (x + r) + ' ' + top.toFixed(1) +
      'H' + (x + w - r) + 'Q' + (x + w) + ' ' + top.toFixed(1) + ' ' + (x + w) + ' ' + (top + r).toFixed(1) + 'V' + base + 'Z';
  }
  /* MonthCalendar de outubro de 2026, que começa numa quinta: 3 casas vazias antes do dia 1 */
  function octGrid(cell) {
    var s = '<div class="xc-calh" aria-hidden="true">' + WD.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div><div class="xc-calg">';
    for (var e = 0; e < 3; e++) s += '<span class="xc-c e"></span>';
    for (var d = 1; d <= 31; d++) s += cell(d);
    return s + '</div>';
  }

  /* cabeçalho das vistas do Progresso: PeriodSelector em cima (semana, mês ou fase), título, chips.
     Visão geral, Humor e Medidas (todo hábito do tipo número) são fixos; depois vêm os pilares da própria pessoa, na ordem dela.
     shift simula a rolagem dos chips. */
  var PROG_CHIPS = [['Visão geral'], ['Humor'], ['Medidas'], ['Mente', 'mente'], ['Alimentação', 'alim'], ['Corpo', 'corpo'], ['Família', 'familia']];
  function progHead(sel, period, rel, shift) {
    var nav = '<span class="xc-pn" role="group" aria-label="Período"><span class="xc-ar" role="button" aria-label="Período anterior">' + ico('caret-left', 'bold') + '</span>' +
      '<span class="xc-pl"><b>' + period + '</b><small>' + rel + '</small></span>' +
      '<span class="xc-ar off" role="button" aria-disabled="true" aria-label="Próximo período">' + ico('caret-right', 'bold') + '</span></span>';
    return '<div class="hd xc-hd"><div class="hd-row">' + nav + '</div><h1 class="lt">Progresso</h1></div>' +
      '<div class="xc-filt"><div class="chips" style="transform:translateX(-' + (shift || 0) + 'px)">' + PROG_CHIPS.map(function (c, i) {
        return '<span class="chip' + (i === sel ? ' sel' : '') + '" role="button" aria-pressed="' + (i === sel) + '"' + (c[1] ? ' data-pillar="' + c[1] + '"' : '') + '>' +
          (c[1] ? '<i class="xc-cd"></i>' : '') + c[0] + '</span>';
      }).join('') + '</div></div>';
  }
  var WEEK = ['19 – 25 de outubro', 'esta semana'];

  /* =============== HÁBITO · CAMINHADA COM O CACHORRO =============== */
  /* desde o início (21 set, segunda) até 25 out, uma semana por bloco, de segunda a domingo.
     d feito · p menos de 20 min · . sem caminhada · f por vir. 24 feitas e 8 sem (o parcial conta como sem). */
  var walkWeeks = ['dd.dd.d', 'd.ddd.d', 'dd.dddd', 'ddpd.dd', 'dd.dfff'];
  var walk = walkWeeks.join('');
  function walkDay(d) { return walk.charAt(d + 9) || 'f'; } /* 1 out é o índice 10 */
  var octWalks = 0;
  for (var od = 1; od <= 22; od++) if (walkDay(od) === 'd') octWalks++;

  function walkCal(selDay) {
    var words = { d: 'caminhada feita', p: 'parcial, menos de 20 min', n: 'sem caminhada', f: 'por vir' };
    return octGrid(function (d) {
      var st = walkDay(d), k = st === '.' ? 'n' : st;
      var cls = k + (d === 22 ? ' t' : '') + (d === selDay ? ' sel' : '');
      var lab = d + ' de outubro' + (d === 22 ? ', hoje' : '') + ', ' + words[k];
      return '<span class="xc-c ' + cls + '"' + (k === 'f' ? ' aria-label="' + lab + '"' : ' role="button" aria-label="' + lab + '"') + '>' +
        d + (k === 'd' ? ico('check', 'bold') : '<i></i>') + '</span>';
    });
  }

  var walkHero = '<div class="xc-hero" data-pillar="familia"><span class="bub lg">' + ico('salsicha') + '</span>' +
    '<h1 class="ttl2">Caminhada com o cachorro</h1>' +
    '<div class="xc-tags">' + tag('Família', { p: 'familia', dot: true }) + tag('Corpo', { p: 'corpo', dot: true }) + '</div>' +
    '<p class="sub muted">20 min ou mais · meta 6 de 7 dias</p></div>';

  var walkStats = '<div class="card" data-pillar="familia"><div class="stats xc-wst">' +
    '<div><span class="k">Força do hábito</span><span class="stat num">72%</span>' + mbar(72) + '</div>' +
    '<div><span class="k">Nesta semana</span><span class="stat num">3<small>de 7</small></span>' + dots(7, 3) + '</div>' +
    '<div><span class="k">Total</span><span class="stat num">24</span><span class="cap">caminhadas</span></div></div>' +
    '<div class="xc-why">' + ico('info') + '<span>A força do hábito sobe a cada caminhada e desce devagar nos dias sem. Ela nunca zera.</span></div></div>';

  function walkCalCard(selDay) {
    return '<div class="card p xc-hab" data-pillar="familia">' + ch('Outubro', octWalks + ' caminhadas · toque para corrigir', arrows()) +
      walkCal(selDay) +
      '<div class="xc-nv">' + ico('seal-check') + '<span>Desde 21 de setembro, você nunca ficou dois dias seguidos sem caminhar.</span></div>' +
      heatKey([['d', 'Feito'], ['p', 'Parcial'], ['', 'Sem caminhada'], ['f', 'Por vir'], ['d t', 'Hoje']]) + '</div>';
  }

  var walkInsight = '<div class="insight" data-pillar="familia">' + ico('smiley') + '<div>' +
    '<p>Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.</p>' +
    '<div class="xc-fx"><span class="on">' + face('mood', 4) + '<span><b class="num">4,1</b>com caminhada</span></span>' +
    '<span class="on">' + face('mood', 3) + '<span><b class="num">3,4</b>sem caminhada</span></span></div>' +
    '<small>24 dias com · 8 dias sem</small></div></div>';

  var walkActions = lg([
    li({ ic: 'pause-circle', t: 'Pausar este hábito', s: 'Dias pausados não contam na força do hábito' }),
    li({ ic: 'archive', t: 'Arquivar', s: 'Sai do Hoje. O histórico fica guardado.' })
  ]);

  function walkBody(selDay) {
    return nb({ back: 'Hoje', act: ico('dots-three', 'bold'), actLabel: 'Mais' }) + walkHero +
      '<div class="pad stack">' + walkStats + walkCalCard(selDay) + walkInsight + '</div>' +
      '<div class="pad" style="padding-top:20px">' + walkActions + '</div>' + spacer(24);
  }

  addFrame('habito', 'Hábito · Caminhada com o cachorro',
    'O hábito que conta em dois pilares mostra as duas etiquetas e usa a cor do pilar principal. O calendário é o mesmo do Humor, com dias grandes o bastante para tocar e corrigir, e o Mais no topo abre o menu do hábito.',
    phone({ time: '18:12', tall: true, tab: 'hoje', body: walkBody(0) }));

  /* =============== HÁBITO · CORRIGIR UM DIA =============== */
  function opt(ic, t, s, on) {
    return li({ ic: ic, p: 'familia', t: t, s: s, right: radio(on) });
  }
  var fixSheet = '<div class="row xc-shab" data-pillar="familia"><span class="bub sm">' + ico('salsicha') + '</span>' +
      '<span><b>Caminhada com o cachorro</b><span class="cap">ontem · meta de 20 min ou mais</span></span></div>' +
    '<div role="radiogroup" aria-label="Como foi a caminhada">' + lg([
      opt('check-circle', 'Feito', '20 min ou mais', false),
      opt('circle-half', 'Parcial', 'menos de 20 min', false),
      opt('circle-dashed', 'Sem caminhada', 'como está agora', true)
    ]) + '</div>' +
    '<p class="foot c" style="padding-top:0">Escolher já salva, e dá para desfazer. A força do hábito e a semana se ajustam sozinhas.</p>';

  addFrame('habito', 'Hábito · corrigir um dia',
    'Tocar num dia do calendário abre esta escolha, com a data no título para não haver engano de dia. Escolher já salva e mostra Desfazer por 5 segundos, sem botão de confirmar.',
    phone({ time: '18:13', tab: 'hoje', body: '<div style="margin-top:-372px">' + walkBody(21) + '</div>', overlay: sheet('Quarta, 21 de outubro', fixSheet) }));

  /* =============== HÁBITO · ZERO REFRIGERANTE =============== */
  function period(n, d, pct, now, badge) {
    return '<div class="xc-per' + (now ? ' now' : '') + '" role="button"><div class="between"><span class="xc-pt"><b class="num">' + n + '</b><span class="cap">' + d + '</span></span>' +
      '<span class="xc-pr">' + (badge || '') + chev() + '</span></div><span class="xc-pbar" aria-hidden="true"><i style="width:' + pct.toFixed(2) + '%"></i></span></div>';
  }

  var sodaHero = '<div class="xc-hero" data-pillar="alim" style="padding-top:4px;padding-bottom:16px"><span class="bub lg">' + ico('pint-glass') + '</span>' +
    '<h1 class="ttl3" style="margin-top:2px">Zero refrigerante</h1>' +
    '<span class="disp-num xc-huge">12</span><span class="xc-hs">dias sem refrigerante</span></div>';

  var sodaStats = '<div class="card stats" data-pillar="alim">' +
    '<div><span class="k">' + ico('trophy') + 'Recorde</span><span class="stat num">21<small>dias</small></span><span class="cap">20 set – 10 out</span></div>' +
    '<div><span class="k">Total</span><span class="stat num">33<small>dias sem</small></span><span class="cap">desde 20 de setembro</span></div></div>';

  var sodaHist = '<div class="card p xc-hist xc-pc" data-pillar="alim">' +
    period('21 dias', '20 set – 10 out', 100, false, tag('recorde', { icon: 'trophy', iw: 'fill' })) +
    period('12 dias', '11 out – hoje', 12 / 21 * 100, true, tag('agora')) +
    '<p class="cap">Mais 9 dias e você iguala o seu recorde.</p></div>';

  addFrame('habito', 'Hábito · Zero refrigerante',
    'A contagem atual é o centro da tela, com o recorde sempre à vista. Um deslize fecha um período e abre outro, e tocar num período corrige a data de um deslize marcado por engano.',
    phone({ time: '10:24', tab: 'hoje', body:
      nb({ back: 'Hoje', act: ico('dots-three', 'bold'), actLabel: 'Mais' }) + sodaHero +
      '<div class="pad">' + sodaStats + '</div>' + gl('Períodos') + '<div class="pad">' + sodaHist + '</div>' +
      '<div class="spacer"></div><div class="pad xc-foot">' + btn('Registrar deslize', { kind: 's', w: true }) +
      '<p class="cap center">Um deslize zera só a contagem atual.</p></div>' }));

  /* =============== PROGRESSO · VISÃO GERAL =============== */
  var wkCard = '<div class="card p">' + ch('Constância da semana', 'Fase 2 · Alimentação · semana 2 de 3') +
    '<div class="xc-wkr">' + ringBox(132, 12, 0.76, '<span class="disp num xc-rn">76%</span><span class="cap">até agora</span>', 'var(--accent-mark)', 'var(--accent-wash)') +
    '<div class="xc-past"><div role="button"><span class="cap">Semana passada</span><span class="xc-pr"><b class="num">74%</b>' + chev() + '</span></div>' +
    '<div role="button"><span class="cap">Fase 1 · Base</span><span class="xc-pr"><b class="num">81%</b>' + chev() + '</span></div></div></div></div>';

  var pillars = [['familia', 'Família', 88], ['mente', 'Mente', 82], ['corpo', 'Corpo', 71], ['alim', 'Alimentação', 64, 'foco da fase 2']];
  var pilList = '<div class="card lst">' + pillars.map(function (p) {
    return '<div class="xc-pil" data-pillar="' + p[0] + '" role="button"><i class="xc-dot"></i><span><b>' + p[1] + '</b>' + (p[3] ? '<small>' + p[3] + '</small>' : '') + '</span>' +
      mbar(p[2], true) + '<em class="num">' + p[2] + '%</em>' + chev() + '</div>';
  }).join('') + '</div>';

  addFrame('progresso', 'Progresso · visão geral',
    'Um só nível de escolha: os chips dizem o que ver (Visão geral, Humor, Medidas e os pilares da pessoa) e o seletor no topo anda por semana, mês ou fase. Semana passada abre a revisão daquele domingo, e Fase 1 mostra o Progresso da fase inteira.',
    phone({ time: '18:15', tall: true, tab: 'prog', body:
      progHead(0, WEEK[0], WEEK[1]) + '<div class="pad">' + wkCard + '</div>' +
      gl('Pilares', 'do maior para o menor') + '<div class="pad">' + pilList + '</div>' +
      gl('O que os seus dados mostram') + '<div class="pad stack">' +
        insight('mente', 'alarm', 'Nos dias em que você acordou no horário, a constância do resto do dia foi 84%. Nos outros, 61%.', '20 dias com · 12 sem · desde 21 de setembro') +
        insight('alim', 'egg', 'A proteína chegou a 80 g em 2 dos 3 dias fechados desta semana. Na semana passada, isso aconteceu em 1 de 7.', 'Fase 2 · Alimentação') +
      '</div>' + spacer(24) }));

  /* =============== PROGRESSO · HUMOR =============== */
  /* outubro: 1 é quinta. 0 = sem check-in; depois do 22, por vir */
  var moodOct = [4, 4, 0, 5, 3, 4, 3, 4, 4, 5, 3, 2, 3, 4, 4, 4, 0, 5, 4, 4, 3, 4];
  function moodCal(selDay) {
    return octGrid(function (d) {
      var m = moodOct[d - 1], sel = d === selDay ? ' sel' : '';
      if (d > 22) return '<span class="xc-c f" aria-label="' + d + ' de outubro, por vir">' + d + '<i class="xc-fs"></i></span>';
      if (!m) return '<span class="xc-c n' + sel + '" role="button" aria-label="' + d + ' de outubro, sem check-in">' + d + '<i class="xc-fs"></i></span>';
      return '<span class="xc-c on l' + m + (d === 22 ? ' t' : '') + sel + '" role="button" aria-label="' + d + ' de outubro' + (d === 22 ? ', hoje' : '') + ', humor ' + FACE_WORDS.mood[m - 1] + '">' + d + face('mood', m) + '</span>';
    });
  }
  function humorBody(selDay) {
    var calCard = '<div class="card p xc-cal">' + ch('Humor de cada dia', '20 check-ins em 22 dias · toque num dia para ver') + moodCal(selDay) +
      '<div class="xc-mlg" aria-hidden="true">' + [1, 2, 3, 4, 5].map(function (l) { return '<div><span class="xc-c on l' + l + '">' + face('mood', l) + '</span>' + FACE_WORDS.mood[l - 1] + '</div>'; }).join('') + '</div>' +
      heatKey([['', 'Sem check-in'], ['f', 'Por vir'], ['t xc-km4', 'Hoje']]) + '</div>';
    var avgs = '<div class="xc-two">' +
      '<div class="card xc-avg"><span class="on">' + face('mood', 4) + '</span><span><b class="stat num">3,8</b><span class="cap">humor médio</span></span></div>' +
      '<div class="card xc-avg"><span class="on">' + face('energy', 3) + '</span><span><b class="stat num">3,2</b><span class="cap">energia média</span></span></div></div>';
    return progHead(1, 'Outubro', 'este mês') + '<div class="pad stack">' + calCard + avgs + '</div>' +
      gl('O que os seus dados mostram') + '<div class="pad stack">' +
        insight('accent', 'moon-stars', 'Nas noites em que você deitou até 22h, a energia do dia seguinte foi 3,6. Nas outras, 2,8.', '10 noites com · 10 sem') +
        insight('accent', 'sun', 'Os 3 dias em que você se sentiu muito bem caíram no fim de semana.', '4, 10 e 18 de outubro') +
      '</div>' + spacer(24);
  }

  addFrame('progresso', 'Progresso · humor',
    'Cada dia leva a cor e o rostinho, para a grade ser lida sem depender da cor, e dia sem check-in fica como trilho vazio, sem marca de falta. O período desta vista é o mês.',
    phone({ time: '20:44', tall: true, tab: 'prog', body: humorBody(0) }));

  /* =============== PROGRESSO · UM DIA =============== */
  function fbox(kind, l, label) {
    return '<div class="xc-fb on">' + face(kind, l) + '<span><b>' + FACE_WORDS[kind][l - 1] + '</b><small>' + label + '</small></span></div>';
  }
  var daySheet = '<div class="xc-two">' + fbox('mood', 3, 'humor') + fbox('energy', 2, 'energia') + '</div>' +
    '<div><span class="flabel">3 coisas boas</span><div class="xc-good">' +
      ['Café da manhã sem pressa', 'Uma conversa boa no trabalho', 'Chuva fresca no fim da tarde'].map(function (t) { return '<div class="xc-gi">' + t + '</div>'; }).join('') +
    '</div></div>' +
    '<div class="xc-ds"><div><span class="cap">Hábitos</span><b>7 de 12</b></div><div><span class="cap">Proteína</span><b>71 g</b></div><div><span class="cap">Água</span><b>3,2 L</b></div></div>' +
    btn('Editar este dia', { kind: 's', w: true, icon: 'pencil-simple' });

  addFrame('progresso', 'Progresso · um dia',
    'No celular não existe hover: tocar num dia, seja célula, barra ou ponto de qualquer gráfico, abre este resumo. Editar leva ao Hoje daquela data, onde dá para marcar o que ficou esquecido.',
    phone({ time: '20:46', tab: 'prog', body: '<div style="margin-top:-152px">' + humorBody(21) + '</div>', overlay: sheet('Quarta, 21 de outubro', daySheet) }));

  /* =============== PROGRESSO · MEDIDAS (peso e cintura) =============== */
  /* dados de exemplo: 25 a 30 set (só para a média) e 1 a 22 out; null = sem pesagem */
  var wPrev = [85.2, 84.8, 85.1, 84.6, 84.8, 85.1];
  var wDays = [84.3, 84.6, 84.8, null, 84.2, 84.6, 84.2, 84.7, 83.9, 84.3, 84.3, null, 83.8, 84.3, 83.9, 83.8, 84.2, 83.6, 83.8, null, 83.3, 83.6];
  var all = wPrev.concat(wDays), ma = [];
  wDays.forEach(function (v, i) {
    var s = 0, c = 0;
    for (var k = i; k <= i + 6; k++) if (all[k] != null) { s += all[k]; c++; }
    ma.push(s / c);
  });
  var maDelta = ma[21] - ma[0];
  /* frase neutra: desceu, subiu ou ficou estável, sem elogio nem cobrança */
  var weightTitle = Math.abs(maDelta) < 0.3 ? 'A média ficou estável em 3 semanas' :
    'A média ' + (maDelta < 0 ? 'desceu ' : 'subiu ') + f1(Math.abs(maDelta)) + ' kg em 3 semanas';

  function weightChart() {
    /* eixo com folga (82,6 a 85,4) para a oscilação de um dia não parecer drama */
    var x0 = 26, x1 = 284, yTop = 14, yBot = 126, lo = 82.6, hi = 85.4;
    function x(i) { return x0 + i * (x1 - x0) / 21; }
    function y(v) { return yBot - (v - lo) / (hi - lo) * (yBot - yTop); }
    var s = '<svg class="xc-svg" viewBox="0 0 326 152" width="326" height="152" role="img" aria-label="Peso diário de 1 a 22 de outubro, com a média de 7 dias indo de ' + f1(ma[0]) + ' para ' + f1(ma[21]) + ' kg">';
    [83, 84, 85].forEach(function (t) {
      s += '<line class="xc-grid" x1="22" x2="292" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/>' +
        '<text class="xc-ax" x="0" y="' + (y(t) + 4).toFixed(1) + '">' + t + '</text>';
    });
    wDays.forEach(function (v, i) { if (v != null) s += '<circle class="xc-pts" cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3.2"/>'; });
    s += '<path class="xc-ma" d="' + ma.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('') + '"/>';
    s += '<circle class="xc-end" cx="' + x(21).toFixed(1) + '" cy="' + y(ma[21]).toFixed(1) + '" r="5"/>';
    s += '<text class="xc-val" x="' + (x(21) + 9).toFixed(1) + '" y="' + (y(ma[21]) + 4.5).toFixed(1) + '">' + f1(ma[21]) + '</text>';
    [[0, '1 out'], [7, '8 out'], [14, '15 out'], [21, 'hoje']].forEach(function (l) {
      s += '<text class="xc-ax' + (l[0] === 21 ? ' on' : '') + '" x="' + x(l[0]).toFixed(1) + '" y="148" text-anchor="middle">' + l[1] + '</text>';
    });
    return s + '</svg>';
  }

  /* cintura de exemplo, medida nos domingos */
  var waist = [['27 set', 96.5], ['4 out', 96.0], ['11 out', 96.0], ['18 out', 95.0]];
  function waistChart() {
    function x(k) { return 36 + k * (290 - 36) / 3; }
    function y(v) { return 66 - (v - 94.5) / 2.5 * 40; }
    var s = '<svg class="xc-svg" viewBox="0 0 326 96" width="326" height="96" role="img" aria-label="Cintura de 96,5 cm em 27 de setembro a 95,0 cm em 18 de outubro">';
    s += '<path class="xc-ln2" d="' + waist.map(function (w, k) { return (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(w[1]).toFixed(1); }).join('') + '"/>';
    waist.forEach(function (w, k) {
      var last = k === waist.length - 1;
      s += '<circle class="xc-dt' + (last ? ' on' : '') + '" cx="' + x(k).toFixed(1) + '" cy="' + y(w[1]).toFixed(1) + '" r="' + (last ? 5 : 4.5) + '"/>' +
        '<text class="xc-val' + (last ? '' : ' soft') + '" x="' + x(k).toFixed(1) + '" y="' + (y(w[1]) - 11).toFixed(1) + '" text-anchor="middle">' + f1(w[1]) + '</text>' +
        '<text class="xc-ax' + (last ? ' on' : '') + '" x="' + x(k).toFixed(1) + '" y="92" text-anchor="middle">' + w[0] + '</text>';
    });
    return s + '</svg>';
  }

  addFrame('progresso', 'Progresso · medidas',
    'Medidas reúne os hábitos do tipo número, de qualquer pilar, na cor do pilar de cada um. A média de 7 dias é a leitura principal, o eixo tem folga para a oscilação de um dia não parecer drama, e tocar no gráfico mostra a data e o peso numa etiqueta (números de exemplo).',
    phone({ time: '18:16', tall: true, tab: 'prog', body:
      progHead(2, WEEK[0], WEEK[1]) +
      '<div class="pad stack">' +
        '<div class="card p" data-pillar="alim">' + ch(weightTitle, 'Peso em kg · média de 7 dias') +
          '<div style="margin:16px 0 12px">' + weightChart() + '</div>' + heatKey([['xc-kdot', 'Peso do dia'], ['xc-kline', 'Média de 7 dias']]) + '</div>' +
        btn('Registrar peso', { kind: 's', w: true, icon: 'plus' }) +
      '</div>' +
      gl('Cintura', 'últimas 4 semanas') +
      '<div class="pad"><div class="card p" data-pillar="alim">' + ch('1,5 cm a menos em 3 semanas', 'Cintura em cm · medida no domingo') +
        '<div style="margin-top:10px">' + waistChart() + '</div></div></div>' +
      gl('Outras medidas') +
      '<div class="pad"><div class="card">' +
        hr({ p: 'mente', ic: 'device-mobile', t: 'Tempo de tela fora do trabalho', s: 'média de 2h05 por dia · só medindo', r: chev() }) +
      '</div></div>' + spacer(24) }));

  /* =============== PROGRESSO · ALIMENTAÇÃO =============== */
  var protDays = ['seg', 'ter', 'qua', 'hoje', 'sex', 'sáb', 'dom'];
  var prot = [84, 92, 71, 46, null, null, null];
  function proteinChart() {
    var W = 326, PW = 292, slot = PW / 7, top = 10, base = 122, max = 110, bw = 24, todayI = 3;
    function y(v) { return base - v / max * (base - top); }
    var s = '<svg class="xc-svg" viewBox="0 0 326 166" width="326" height="166" role="img" aria-label="Proteína por dia: segunda 84 g, terça 92 g, quarta 71 g, hoje 46 g até agora. Meta de 80 g.">' +
      '<defs><pattern id="xc-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="xc-hb" width="5" height="5"/><rect class="xc-hl" width="2.2" height="5"/></pattern></defs>';
    prot.forEach(function (v, i) {
      var bx = +(slot * (i + 0.5) - bw / 2).toFixed(1);
      s += '<path class="xc-trk" d="' + colPath(bx, top, base, bw, 7) + '"/>';
      if (v != null) s += '<path class="xc-bar' + (i === todayI ? ' today' : '') + '" d="' + colPath(bx, y(v), base, bw, 7) + '"/>';
    });
    s += '<line class="xc-base" x1="0" x2="' + PW + '" y1="' + base + '" y2="' + base + '"/>';
    s += '<line class="xc-meta" x1="0" x2="' + (PW + 4) + '" y1="' + y(80).toFixed(1) + '" y2="' + y(80).toFixed(1) + '"/>';
    s += '<text class="xc-mt" x="' + W + '" y="' + (y(80) + 4).toFixed(1) + '" text-anchor="end">80 g</text>';
    protDays.forEach(function (dname, i) {
      var cx = (slot * (i + 0.5)).toFixed(1);
      s += '<text class="xc-ax' + (i === todayI ? ' on' : '') + '" x="' + cx + '" y="' + (base + 18) + '" text-anchor="middle">' + dname + '</text>';
      if (prot[i] != null) s += '<text class="xc-val" x="' + cx + '" y="' + (base + 37) + '" text-anchor="middle">' + prot[i] + '</text>';
    });
    return s + '</svg>';
  }

  var water = [3.0, 2.5, 3.2, 1.5, null, null, null];
  var waterRow = '<div class="xc-wat">' + water.map(function (v, i) {
    var center = v != null && v >= 3 ? ico('check', 'bold') : (i === 3 ? ico('drop') : '');
    return '<div>' + ringBox(36, 4.5, v != null ? v / 3 : 0, center, 'var(--mark)', 'var(--track)') +
      '<span class="xc-wd2' + (i === 3 ? ' on' : '') + '">' + protDays[i] + '</span><span class="xc-wv">' + (v != null ? f1(v) : '') + '</span></div>';
  }).join('') + '</div>';

  function noteTile(ic, t, v) {
    return '<div class="card xc-nt" data-pillar="alim"><div class="row"><span class="bub sm">' + ico(ic) + '</span><b>' + t + '</b></div>' +
      '<div class="xc-ntv"><b class="stat num">' + f1(v) + '</b><span class="cap">de 5</span></div>' + mbar(v / 5 * 100) + '</div>';
  }

  addFrame('progresso', 'Progresso · alimentação',
    'Os títulos dizem o que foi feito, e a barra de hoje fica listrada até o dia fechar, para 46 g às 13h não parecerem um dia fraco. Tocar numa barra ou num dia da água abre o resumo daquele dia.',
    phone({ time: '12:58', tall: true, tab: 'prog', body:
      progHead(4, WEEK[0], WEEK[1], 200) +
      '<div class="pad stack">' +
        '<div class="card p xc-pc" data-pillar="alim">' + ch('80 g ou mais em 2 dos 3 dias fechados', 'Proteína por dia, em gramas') +
          '<div style="margin:14px 0 12px">' + proteinChart() + '</div>' + heatKey([['xc-khatch', 'hoje, até agora']]) + '</div>' +
        '<div class="card p" data-pillar="alim">' + ch('3 L ou mais em 2 dos 3 dias fechados', 'Água por dia · meta 3 L') + waterRow + '</div>' +
      '</div>' +
      gl('Limites da semana') +
      '<div class="pad"><div class="card lst">' +
        budget({ p: 'alim', t: 'Refeições livres', s: 'até 2 por semana', used: 0, total: 2 }) +
        budget({ p: 'alim', t: 'Tranqueiras', s: 'até 2 dias por semana', used: 1, total: 2 }) +
      '</div></div>' +
      gl('Dias sem') +
      '<div class="pad"><div class="card">' +
        hr({ p: 'alim', ic: 'pint-glass', t: 'Zero refrigerante', s: 'recorde 21 dias', r: '<span class="row" style="gap:6px">' + vpill('12 dias') + chev() + '</span>' }) +
      '</div></div>' +
      gl('Notas dos pratos', 'média da semana') +
      '<div class="pad"><div class="xc-two">' + noteTile('fork-knife', 'Almoço', 3.6) + noteTile('bowl-food', 'Jantar', 3.9) + '</div></div>' + spacer(24) }));
})();
