/* Estados e feedback: desfazer, outro dia, menu do hábito, primeiro dia, poucos dados, offline, carregando, pausa,
   instalar, conta sem acesso e nova versão (grupo I, prefixo .xs-). Quase tudo é uma variação do Hoje e segue as
   Regras do Hoje do SPEC, com as peças da base (weekCard, fold, doPill, plusBtn, addPill, semTile, budget, toast). */
(function () {
  var date = 'Quinta, 22 de outubro';

  addCSS(
    '.xs-t16 { display: block; font: 600 16px/20px var(--font-ui); }' +
    '.xs-water .ringbox .rc { color: var(--ink); font-size: 18px; }' +

    /* ---------- semana com estados que week() não tem: dia escolhido, sem anel, pausado, carregando ---------- */
    '.xs-wk .wkd { position: relative; isolation: isolate; }' +
    '.xs-wk .wkd.sel { color: var(--text); }' +
    '.xs-wk .wkd.sel::before { content: ""; position: absolute; z-index: -1; inset: -7px 2px; border-radius: 14px; background: var(--accent-wash); box-shadow: inset 0 0 0 1.5px var(--accent-mark); }' +
    '.xs-wk .wkd.none .rg b { color: var(--text-3); font-weight: 500; }' +
    '.xs-pz { border-radius: 50%; background: repeating-linear-gradient(135deg, var(--track) 0 2.5px, transparent 2.5px 6px); box-shadow: inset 0 0 0 1.5px var(--track); }' +
    '.xs-wk .wkd.today .xs-pz { box-shadow: inset 0 0 0 2px var(--accent-mark); }' +
    '.xs-wk .wkd.pz .rg b { color: var(--text-2); }' +
    '.xs-skc { border-radius: 50%; background: var(--sunken); }' +
    '.xs-wk .wkd.skel .rg b { color: var(--text-3); font-weight: 500; }' +

    /* ---------- outro dia ---------- */
    '.xs-past { display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: center; gap: 12px; margin-top: 2px; padding: 12px 14px; border-radius: 18px; background: var(--accent-wash); }' +
    '.xs-past .bub { background: var(--surface); color: var(--accent-ink); }' +
    '.xs-past b { display: block; font: 600 16px/21px var(--font-ui); }' +
    '.xs-past small { display: block; margin-top: 1px; font: 500 13px/17px var(--font-ui); color: var(--accent-ink); }' +
    '.xs-back { position: absolute; left: 50%; bottom: 92px; z-index: 8; transform: translateX(-50%); }' +
    '.xs-back .btn { min-height: 44px; padding: 10px 18px; font-size: 16px; box-shadow: var(--shadow-2); }' +
    '.xs-forgot .ht small { color: var(--accent-ink); }' +

    /* ---------- menu do hábito ---------- */
    '.xs-mh { display: flex; align-items: center; gap: 12px; min-width: 0; }' +
    '.xs-mh b { display: block; font: 500 22px/26px var(--font-display); font-variation-settings: var(--display-vs); }' +
    '.xs-mh small { display: block; margin-top: 2px; font: var(--t-caption); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xs-menu .lg { background: var(--surface); }' +
    '.xs-menu .li { min-height: 56px; }' +
    '.xs-menu .li .lic { font-size: 19px; }' +

    /* ---------- progresso com poucos dados (cabeçalho igual ao do Progresso do grupo C) ---------- */
    '.xs-hd .hd-row { min-height: 44px; }' +
    '.xs-pn { display: inline-flex; align-items: center; min-height: 44px; border-radius: 999px; background: var(--sunken); }' +
    '.xs-ar { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 50%; color: var(--text-3); opacity: .45; font-size: 18px; }' +
    '.xs-pl { display: flex; flex-direction: column; align-items: center; min-width: 128px; text-align: center; }' +
    '.xs-pl b { font: 600 15px/19px var(--font-ui); font-variant-numeric: tabular-nums; }' +
    '.xs-pl small { font: 500 11px/13px var(--font-ui); color: var(--text-3); }' +
    '.xs-filt { overflow: hidden; padding-bottom: 8px; }' +
    '.xs-filt .chips { flex-wrap: nowrap; gap: 6px; padding: 0 16px; }' +
    '.xs-cd { width: 8px; height: 8px; flex: none; border-radius: 50%; background: var(--mark); }' +
    '.chip.sel .xs-cd { box-shadow: 0 0 0 1.5px var(--bg); }' +
    '.xs-wkr { display: flex; align-items: center; gap: 20px; margin-top: 14px; }' +
    '.xs-rn { font-size: 38px; line-height: 1; letter-spacing: -.02em; }' +
    '.xs-wkr .rc .cap { margin-top: 4px; line-height: 14px; }' +
    '.xs-side { flex: 1; min-width: 0; display: flex; flex-direction: column; }' +
    '.xs-side > div { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 10px 0; }' +
    '.xs-side > div + div { border-top: 1px solid var(--border); }' +
    '.xs-side .cap { font: 500 13px/16px var(--font-ui); color: var(--text-2); }' +
    '.xs-side b { font: 600 17px/20px var(--font-ui); }' +
    '.xs-pil { display: grid; grid-template-columns: 10px 104px minmax(0, 1fr) 44px; align-items: center; gap: 10px; min-height: 52px; padding: 10px 16px; }' +
    '.xs-pil > i { width: 10px; height: 10px; border-radius: 50%; background: var(--mark); }' +
    '.xs-pil b { font: 500 16px/20px var(--font-ui); }' +
    '.xs-pil em { font: 600 15px/1 var(--font-ui); font-style: normal; text-align: right; font-variant-numeric: tabular-nums; }' +
    '.xs-wait { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 16px; border: 1.5px dashed var(--border-strong); }' +
    '.xs-wait > p { font: 500 15px/21px var(--font-ui); }' +
    '.xs-wait > small { font: var(--t-caption); color: var(--text-2); }' +
    '.xs-wh { display: flex; align-items: center; gap: 10px; }' +
    '.xs-wh b { display: block; font: 600 15px/20px var(--font-ui); }' +
    '.xs-wh .cap { display: block; }' +
    '.xs-cnt { display: grid; grid-template-columns: 104px minmax(0, 1fr) 44px; align-items: center; gap: 6px 10px; font: 500 13px/16px var(--font-ui); color: var(--text-2); }' +
    '.xs-cnt em { font-style: normal; font-weight: 600; color: var(--text); text-align: right; font-variant-numeric: tabular-nums; }' +
    '.xs-s7 { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; }' +
    '.xs-s7 i { height: 8px; border-radius: 99px; background: var(--track); }' +
    '.xs-s7 i.on { background: var(--fill); box-shadow: inset 0 0 0 1px var(--mark); }' +
    '.xs-s7.n i.on { background: var(--border-strong); box-shadow: none; }' +
    '.xs-more { display: flex; align-items: center; gap: 8px; padding: 2px 4px; font: var(--t-caption); color: var(--text-3); }' +
    '.xs-more i { font-size: 15px; }' +

    /* ---------- sem internet ---------- */
    '.xs-off { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 12px; background: var(--sunken); font: 500 13px/17px var(--font-ui); color: var(--text-2); }' +
    '.xs-off i { font-size: 17px; flex: none; }' +
    '.xs-off b { color: var(--text); font-weight: 600; }' +

    /* ---------- carregando ---------- */
    '.xs-sk { display: block; flex: none; border-radius: 6px; background: var(--track); }' +
    '.xs-sk.c { border-radius: 50%; }' +
    '.xs-sk.b { width: 40px; height: 40px; border-radius: 13px; }' +
    '.xs-sk.l { height: 12px; border-radius: 99px; }' +
    '.xs-skr { display: grid; grid-template-columns: 40px minmax(0, 1fr) 40px; gap: 12px; align-items: center; min-height: 62px; padding: 11px 14px; }' +
    '.xs-skr > span:nth-child(2) { display: flex; flex-direction: column; gap: 8px; }' +
    '.xs-skg { padding: 26px 20px 12px; }' +

    /* ---------- pausa ---------- */
    '.xs-pause { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 24px 20px 10px; }' +
    '.xs-pause p { max-width: 296px; font: 400 15px/21px var(--font-ui); color: var(--text-2); }' +
    '.xs-pause .ttl2 { margin-top: 4px; }' +
    '.xs-pause .bub.lg { background: var(--accent-wash); color: var(--accent-ink); }' +

    /* ---------- tela cheia (instalar, conta sem acesso) ---------- */
    '.xs-hero { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 28px; text-align: center; }' +
    '.xs-hero h1 { text-wrap: balance; }' +
    '.xs-hero p { font: 400 16px/23px var(--font-ui); color: var(--text-2); }' +
    '.xs-foot { flex: none; display: flex; flex-direction: column; gap: 6px; padding: 12px 24px 46px; }' +
    '.xs-legal { display: flex; justify-content: center; align-items: center; gap: 6px; padding-top: 6px; font: var(--t-caption); color: var(--text-3); text-align: center; }' +
    '.xs-legal i { font-size: 14px; }' +
    '.xs-who { display: inline-flex; align-items: center; gap: 8px; margin: 2px 0 4px; padding: 6px 14px 6px 6px; border-radius: 999px; background: var(--surface); box-shadow: var(--shadow-1), inset 0 0 0 1px var(--border); font: 500 15px/20px var(--font-ui); color: var(--text); }' +
    '.xs-ini { width: 28px; height: 28px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--sunken); color: var(--text-2); font: 600 13px/1 var(--font-ui); }' +

    /* ---------- instalar no iPhone ---------- */
    '.xs-inst { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 14px; padding: 20px 16px 0; }' +
    '.xs-brand { display: flex; align-items: center; gap: 12px; padding: 0 4px; }' +
    '.xs-brand b { display: block; font: 480 22px/26px var(--font-display); font-variation-settings: var(--display-vs); }' +
    '.xs-brand small { display: block; font: var(--t-caption); color: var(--text-3); }' +
    '.xs-app { width: 56px; height: 56px; flex: none; border-radius: 14px; background: var(--accent-wash); display: grid; place-items: center; box-shadow: var(--shadow-1), inset 0 0 0 1px color-mix(in oklch, var(--accent-mark) 25%, transparent); }' +
    '.xs-app.sm { width: 32px; height: 32px; border-radius: 8px; }' +
    '.xs-app svg { display: block; overflow: visible; }' +
    '.xs-mt { fill: none; stroke: var(--accent-mark); stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 1.4 3.4; }' +
    '.xs-md { fill: none; stroke: var(--accent-ink); stroke-width: 2.2; stroke-linecap: round; }' +
    '.xs-mc { fill: var(--accent-ink); }' +
    '.xs-inst .ttl2 { padding: 4px 4px 0; }' +
    '.xs-steps .li { grid-template-columns: 28px minmax(0, 1fr) 32px; min-height: 64px; }' +
    '.xs-n { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-wash); color: var(--accent-ink); font: 700 14px/1 var(--font-ui); }' +
    '.xs-ios { width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; background: var(--sunken); color: var(--accent-ink); font-size: 19px; }' +
    '.xs-steps small i { font-size: 13px; vertical-align: -2px; }' +
    '.xs-saf { flex: none; position: relative; z-index: 3; padding: 8px 12px 34px; background: color-mix(in oklch, var(--surface) 94%, transparent); border-top: 1px solid var(--border); }' +
    '.xs-url { min-height: 44px; border-radius: 14px; background: var(--sunken); display: flex; align-items: center; justify-content: center; gap: 6px; font: 400 15px/1 var(--font-ui); color: var(--text); }' +
    '.xs-url i { font-size: 13px; color: var(--text-3); }' +
    '.xs-sti { display: grid; grid-template-columns: repeat(5, 1fr); justify-items: center; padding-top: 8px; font-size: 24px; color: var(--accent-ink); }' +
    '.xs-sti > span { position: relative; width: 44px; height: 40px; display: grid; place-items: center; }' +
    '.xs-sti > span.off { color: var(--text-3); }' +
    '.xs-sti > span.on::after { content: ""; position: absolute; inset: 0 2px; border-radius: 12px; box-shadow: 0 0 0 2px var(--accent-mark); }'
  );

  /* ================= peças ================= */
  function pad(html, style) { return '<div class="pad"' + (style ? ' style="' + style + '"' : '') + '>' + html + '</div>'; }
  function spacer(h) { return '<div style="height:' + h + 'px;flex:none"></div>'; }
  function appMark(cls, size) {
    return '<span class="xs-app' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '">' +
      '<path class="xs-mt" d="M7 21 C7 16.5 17 16.5 17 12 C17 7.5 7 7.5 7 3"/><path class="xs-md" d="M7 21 C7 16.5 17 16.5 17 12"/>' +
      '<circle class="xs-mc" cx="17" cy="12" r="2.6"/></svg></span>';
  }

  /* semana com estados por dia (week() da base não tem escolhido, sem anel, pausado nem carregando).
     d: [letra, dia, valor 0-1, estados separados por espaço: today future sel none pz skel]; head: HTML acima dos anéis */
  var L = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  function days7(nums, vals, states) { return nums.map(function (n, i) { return [L[i], n, vals[i] || 0, states[i] || '']; }); }
  function wk(list, head) {
    var inner = list.map(function (d) {
      var st = d[3].split(' '), has = function (x) { return st.indexOf(x) > -1; };
      var cls = 'wkd' + ['today', 'future', 'sel', 'none', 'pz', 'skel'].filter(has).map(function (x) { return ' ' + x; }).join('');
      var rg;
      if (has('pz')) rg = '<span class="rg xs-pz"><b>' + d[1] + '</b></span>';
      else if (has('skel')) rg = '<span class="rg xs-skc"><b>' + d[1] + '</b></span>';
      else if (has('none')) rg = '<span class="rg"><b>' + d[1] + '</b></span>';
      else rg = '<span class="rg">' + ring(36, 3.5, d[2], has('today') ? 'var(--accent-ink)' : 'var(--accent-mark)') + '<b>' + d[1] + '</b></span>';
      return '<div class="' + cls + '">' + d[0] + rg + '</div>';
    }).join('');
    return head ? '<div class="card wkc xs-wk"><div class="wkh">' + head + '</div><div class="wk">' + inner + '</div></div>'
      : '<div class="card wk xs-wk">' + inner + '</div>';
  }
  function weekHead(left, right) { return '<span class="sub">' + left + '</span>' + (right || ''); }
  var goWeek = '<span class="cap wkgo"><span class="num">76%</span> na semana' + ico('caret-right', 'bold') + '</span>';

  /* ---------- o Hoje da quinta (Regras do Hoje) ---------- */
  function protein(g, segs, foods) {
    return '<div class="card p stack" data-pillar="alim" style="gap:8px">' +
      '<div class="between"><span class="row"><span class="bub sm">' + ico('egg') + '</span><b class="xs-t16">Proteína</b></span>' +
      '<span class="sub num"><b>' + g + ' g</b> <span class="faint">de 80 g</span></span></div>' +
      pbar(segs, 120, 80, 'meta 80 g') +
      '<div class="qa">' + foods.map(function (f) { return '<span class="q" role="button"><b>' + f[0] + '</b><small>+' + f[1] + ' g</small></span>'; }).join('') +
      '<span class="q more" role="button">' + ico('dots-three', 'bold') + '<small>Mais</small></span></div></div>';
  }
  function water(text, pct) {
    return '<div class="card hr xs-water" data-pillar="alim">' + ringBox(40, 5, pct, ico('drop'), 'var(--mark)', 'var(--wash)') +
      '<span class="ht"><b>Água</b><small class="num">' + text + '</small></span>' +
      '<span class="row" style="gap:6px">' + addPill('500 ml') + addPill('1 L') + '</span></div>';
  }
  function walkRow(done, nudge) {
    var n = done ? 3 : 2;
    var row = hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, n) + n + ' de 7 · meta 6', r: chk(done, 'Caminhada com o cachorro'), done: done });
    /* nudge: true mostra o convite; 'back' é o instante depois de marcar (a frase troca e o convite sai na próxima arrumação) */
    var nd = nudge === 'back' ? '<div class="nudge"><span>De volta hoje.</span></div>'
      : '<div class="nudge"><span>Hoje é um bom dia para voltar.</span><span class="lk" role="button">Marcar ontem</span></div>';
    return nudge ? '<div data-pillar="familia">' + row + nd + '</div>' : row;
  }
  var lunchFoot = '<div class="card lst">' +
    hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: doPill('Dar nota') }) +
    hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · 0 de 1 na semana', r: chk(false, 'Futebol') }) + '</div>';
  var bottom =
    gl('Limites da semana') +
    pad('<div class="card lst">' +
      hr({ p: 'alim', ic: 'pizza', t: 'Refeições livres', s: slots(2, 0, 'used') + '<span class="num">0 de 2</span> na semana', r: plusBtn('Usar uma refeição livre') }) +
      hr({ p: 'alim', ic: 'cookie', t: 'Tranqueiras', s: slots(2, 1, 'used') + '<span class="num">1 de 2</span> na semana', r: plusBtn('Usar um dia de tranqueira') }) + '</div>') +
    gl('Dias sem') +
    '<div class="pad dsr">' +
      semTile('alim', 'pint-glass', 12, 'refrigerante', '<span class="cap">recorde 21</span>') +
      semTile('mente', 'device-mobile-slash', 32, 'Shorts e TikTok', '<span class="cap rec">' + ico('trophy', 'regular') + 'seu recorde</span>') +
    '</div>' + spacer(24);

  /* manhã da quinta. o: { n feitos, walk, nudge, band (aviso abaixo do cabeçalho) } */
  function morning(o) {
    return hd({ date: date, title: 'Bom dia, Henrique' }) + (o.band || '') +
      pad(weekCard(o.n, 76, [0.83, 0.75, 0.6, o.n / 12, 0, 0, 0])) +
      gl('Manhã') +
      pad('<div class="card lst">' +
        hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: vpill('83,6 kg', { icon: 'check' }), done: true }) +
        hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: vpill('06h52', { icon: 'check' }), done: true }) +
        walkRow(o.walk, o.nudge) + '</div>') +
      gl('Ao longo do dia') +
      '<div class="pad stack">' + protein(24, [18, 6], [['Ovo', 6], ['Leite', 6], ['Whey', 22]]) + water('0 de 3 L', 0) + lunchFoot + '</div>' +
      gl('Noite', 'a partir das 20h30') +
      pad(fold(['broom|familia', 'trash|familia', 'bowl-food|alim'], 3, '6 hábitos', 'louça, lixo, jantar e mais 3')) + bottom;
  }
  /* tarde da quinta, às 12h41 */
  var afternoon = hd({ date: date, title: 'Boa tarde, Henrique' }) +
    pad(weekCard(4, 76, [0.83, 0.75, 0.6, 4 / 12, 0, 0, 0])) +
    gl('Manhã') +
    pad(fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'peso, acordar e caminhada')) +
    gl('Ao longo do dia') +
    '<div class="pad stack">' + protein(46, [18, 6, 22], [['Frango', 30], ['Feijão', 7], ['Queijo', 5]]) + water('1,5 L de 3 L', 0.5) + lunchFoot + '</div>';

  /* =============== 1 · HOJE · DESFAZER =============== */
  addFrame('estados', 'Hoje · desfazer',
    'Marcar é instantâneo e nunca pede confirmação: o toast oferece Desfazer por 5 segundos, acima das abas, onde o polegar já está. O convite vira "De volta hoje." e sai na próxima arrumação do Hoje; uma ação nova substitui o toast e confirma a anterior.',
    phone({ time: '7:43', tab: 'hoje', body: morning({ n: 4, walk: true, nudge: 'back' }),
      overlay: toast({ p: 'familia', ic: 'check', t: 'Caminhada marcada', s: '3 de 7 na semana', act: 'Desfazer', actIcon: 'arrow-counter-clockwise', fio: 0.6 }) }));

  /* =============== 2 · HOJE · OUTRO DIA =============== */
  var pastBand = pad('<div class="xs-past" role="status"><span class="bub">' + ico('clock-counter-clockwise') + '</span>' +
    '<span><b>Quarta, 21 de outubro</b><small>Você está vendo um dia que passou</small></span></div>', 'padding-top:6px');
  var backPill = '<div class="xs-back">' + btn('Voltar para hoje', { icon: 'arrow-u-up-left' }) + '</div>';
  var wedWeek = wk(days7([19, 20, 21, 22, 23, 24, 25], [0.83, 0.75, 0.6, 4 / 12], ['', '', 'sel', 'today', 'future', 'future', 'future']),
    weekHead('<b class="num">7 de 12</b> <span class="muted" style="font-weight:400">feitos na quarta</span>', goWeek));

  var wed = pastBand + pad(wedWeek, 'padding-top:12px') +
    gl('Manhã') +
    pad('<div class="card lst">' +
      hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: vpill('83,3 kg', { icon: 'check' }), done: true }) +
      hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: vpill('06h49', { icon: 'check' }), done: true }) +
      '<div class="xs-forgot">' + hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: 'sem registro · dá para marcar', r: chk(false, 'Caminhada com o cachorro, quarta') }) + '</div>' +
    '</div>') +
    gl('Ao longo do dia') +
    pad('<div class="card lst">' +
      hr({ p: 'alim', ic: 'egg', t: 'Proteína', s: 'meta 80 g', r: vpill('71 g') }) +
      hr({ p: 'alim', ic: 'drop', t: 'Água', s: 'meta 3 L', r: vpill('2,5 L') }) +
      hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: doPill('3 · Ok') }) +
    '</div>') +
    gl('Noite') +
    pad('<div class="card lst">' +
      hr({ p: 'familia', ic: 'broom', t: 'Louça', s: 'até 20h30', r: chk(true, 'Louça'), done: true }) +
      hr({ p: 'alim', ic: 'bowl-food', t: 'Jantar', s: 'nota de 1 a 5', r: doPill('4 · Bom') }) +
    '</div>');

  addFrame('estados', 'Hoje · outro dia',
    'Tocar num dia passado da semana, ou no "Marcar ontem" do convite, abre aquele dia no mesmo layout, com o hábito esquecido em destaque. A faixa no topo diz onde você está, o Voltar para hoje fica perto do polegar e o toast nomeia o dia ("Caminhada marcada na quarta").',
    phone({ time: '7:46', tab: 'hoje', body: wed, overlay: backPill }));

  /* =============== 3 · MENU DO HÁBITO =============== */
  var menuTitle = '<span class="xs-mh" data-pillar="mente"><span class="bub">' + ico('alarm') + '</span>' +
    '<span><b>Acordar</b><small>Mente · meta 6h50 · hoje às 06h52</small></span></span>';
  var menu = '<div class="xs-menu stack" style="gap:12px">' +
    lg([
      li({ ic: 'clock-counter-clockwise', t: 'Registrar outro horário', s: 'Abre a roda de horário' }),
      li({ ic: 'calendar-minus', t: 'Hoje não se aplica', s: 'O dia sai da conta, como uma pausa de um dia', chev: false })
    ]) +
    lg([li({ ic: 'eye', t: 'Ver hábito' }), li({ ic: 'pencil-simple', t: 'Editar hábito' })]) + '</div>';

  addFrame('estados', 'Menu do hábito',
    'O toque longo numa linha abre uma folha baixa, que deixa as opções sempre no terço de baixo, qualquer que seja a altura da linha. Primeiro vem o que muda hoje, depois o que leva para outra tela; Ver hábito repete o toque no nome, como segundo caminho. Em hábitos de sim ou não, a linha do horário some.',
    phone({ time: '7:42', tab: 'hoje', body: morning({ n: 3, walk: false, nudge: true }), overlay: sheet(menuTitle, menu, { label: 'Acordar, opções' }) }));

  /* =============== 4 · HOJE · PRIMEIRO DIA =============== */
  var firstWeek = wk(days7([21, 22, 23, 24, 25, 26, 27], [0], ['today', 'future', 'future', 'future', 'future', 'future', 'future']),
    weekHead('<b>Primeiro dia</b> <span class="muted" style="font-weight:400">da fase 1</span>', '<span class="cap">semana 1 de 3</span>'));
  function oneDay(html) { return html.replace(/dias sem/g, 'dia sem'); }

  var first = hd({ date: 'Segunda, 21 de setembro', title: 'Bom dia, Henrique' }) +
    pad(firstWeek) +
    gl('Manhã') +
    pad('<div class="card lst">' +
      hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'só medindo, sem meta', r: doPill('Pesar') }) +
      '<div data-pillar="mente">' + hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: chk(false, 'Acordar') }) +
        '<div class="nudge"><span>Comece por aqui.</span><span class="lk" role="button">Acordei às 06h58</span></div></div>' +
      hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: '20 min · meta 6 de 7 dias', r: chk(false, 'Caminhada com o cachorro') }) +
    '</div>') +
    gl('Noite', 'a partir das 20h30') +
    pad(fold(['broom|familia', 'trash|familia', 'sparkle|mente'], 2, '5 hábitos', 'louça, lixo, check-in e mais 2')) +
    gl('Dias sem') +
    '<div class="pad dsr">' +
      oneDay(semTile('alim', 'pint-glass', 1, 'refrigerante', '<span class="cap">desde ontem</span>')) +
      oneDay(semTile('mente', 'device-mobile-slash', 1, 'Shorts e TikTok', '<span class="cap">desde ontem</span>')) +
    '</div>';

  addFrame('estados', 'Hoje · primeiro dia',
    'Sem histórico, o cartão da semana troca a contagem por "Primeiro dia da fase 1", e nenhum gráfico vazio aparece (dias antes do começo ficariam sem anel). O convite fica na linha do primeiro hábito provável, já com o registro pronto, e some assim que algo é marcado.',
    phone({ time: '6:58', tab: 'hoje', body: first }));

  /* =============== 5 · PROGRESSO · POUCOS DADOS =============== */
  function s7(n, neutral) { var s = '<span class="xs-s7' + (neutral ? ' n' : '') + '" aria-hidden="true">'; for (var i = 0; i < 7; i++) s += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return s + '</span>'; }
  var CHIPS = [['Visão geral'], ['Humor'], ['Medidas'], ['Mente', 'mente'], ['Alimentação', 'alim'], ['Corpo', 'corpo'], ['Família', 'familia']];
  var progHead = '<div class="hd xs-hd"><div class="hd-row"><span class="xs-pn" role="group" aria-label="Período"><span class="xs-ar" role="button" aria-disabled="true" aria-label="Período anterior">' + ico('caret-left', 'bold') + '</span>' +
    '<span class="xs-pl"><b>21 – 27 de setembro</b><small>esta semana</small></span><span class="xs-ar" role="button" aria-disabled="true" aria-label="Próximo período">' + ico('caret-right', 'bold') + '</span></span></div>' +
    '<h1 class="lt">Progresso</h1></div>' +
    '<div class="xs-filt"><div class="chips">' + CHIPS.map(function (c, i) {
      return '<span class="chip' + (i === 0 ? ' sel' : '') + '" role="button" aria-pressed="' + (i === 0) + '"' + (c[1] ? ' data-pillar="' + c[1] + '"' : '') + '>' + (c[1] ? '<i class="xs-cd"></i>' : '') + c[0] + '</span>';
    }).join('') + '</div></div>';
  var wk1 = '<div class="card p">' + ch('Constância da semana', 'Fase 1 · Base · semana 1 de 3') +
    '<div class="xs-wkr">' + ringBox(132, 12, 0.79, '<span class="disp num xs-rn">79%</span><span class="cap">até agora</span>', 'var(--accent-mark)', 'var(--accent-wash)') +
    '<div class="xs-side"><div><span class="cap">Dias registrados</span><b class="num">4</b></div>' +
    '<div><span class="cap">Hábitos na fase</span><b class="num">7</b></div></div></div></div>';
  var pil1 = '<div class="card lst">' + [['alim', 'Alimentação', 100], ['familia', 'Família', 88], ['mente', 'Mente', 80], ['corpo', 'Corpo', 75]].map(function (p) {
    return '<div class="xs-pil" data-pillar="' + p[0] + '"><i></i><b>' + p[1] + '</b>' + mbar(p[2]) + '<em>' + p[2] + '%</em></div>';
  }).join('') + '</div>';
  var waiting = '<div class="xs-wait" data-pillar="familia">' +
    '<div class="xs-wh"><span class="bub sm">' + ico('salsicha') + '</span><span><b>Caminhada e humor</b><span class="cap">o padrão mais perto de aparecer</span></span></div>' +
    '<p>Os padrões aparecem com 7 dias com e 7 sem. Faltam 4 dias com caminhada.</p>' +
    '<div class="stack" style="gap:10px">' +
      '<div class="xs-cnt"><span>Com caminhada</span>' + s7(3) + '<em>3 de 7</em></div>' +
      '<div class="xs-cnt"><span>Sem caminhada</span>' + s7(1, true) + '<em>1 de 7</em></div>' +
    '</div>' +
    '<small>Os dias sem chegam no tempo deles. Não precisa mudar nada.</small></div>' +
    '<div class="xs-more">' + ico('hourglass-medium', 'regular') + 'Mais 2 padrões a caminho</div>';

  addFrame('estados', 'Progresso · poucos dados',
    'A constância e os pilares aparecem desde o primeiro dia, e só os padrões esperam: o cartão tracejado mostra quanto falta. Os dias sem ficam em cinza neutro, para ninguém pular um dia só para destravar o padrão. Tela com rolagem, mostrada inteira.',
    phone({ time: '20:52', tall: true, tab: 'prog', body:
      progHead + pad(wk1) + gl('Pilares', 'do maior para o menor') + pad(pil1) +
      gl('O que os seus dados mostram') + '<div class="pad stack">' + waiting + '</div>' + spacer(24) }));

  /* =============== 6 · HOJE · SEM INTERNET =============== */
  var offBand = pad('<div class="xs-off" role="status">' + ico('cloud-slash', 'regular') + '<span><b>Sem internet.</b> Tudo continua salvo aqui e sobe quando voltar.</span></div>', 'padding-bottom:12px');

  addFrame('estados', 'Hoje · sem internet',
    'No passeio com o cachorro o sinal cai e nada muda: marcar, somar e desfazer funcionam igual, salvos no aparelho. O aviso fica abaixo do cabeçalho, neutro, e quando a internet volta vira "Tudo em dia" por 2 segundos e sai.',
    phone({ time: '7:51', tab: 'hoje', body: morning({ n: 4, walk: true, band: offBand }) }));

  /* =============== 7 · HOJE · CARREGANDO =============== */
  function sk(w, h, cls) { return '<span class="xs-sk' + (cls ? ' ' + cls : '') + '" style="width:' + w + (typeof w === 'number' ? 'px' : '') + ';height:' + h + 'px"></span>'; }
  function skRow(w1, w2) { return '<div class="xs-skr"><span class="xs-sk b"></span><span>' + sk(w1, 12, 'l') + sk(w2, 10, 'l') + '</span>' + sk(40, 40, 'c') + '</div>'; }
  var loading = '<div aria-busy="true" aria-label="Carregando o seu dia">' + hd({ date: date, title: 'Bom dia, Henrique' }) +
    pad(wk(days7([19, 20, 21, 22, 23, 24, 25], [], ['skel', 'skel', 'skel', 'skel today', 'skel', 'skel', 'skel']), sk(132, 14, 'l') + sk(96, 12, 'l'))) +
    '<div class="xs-skg">' + sk(64, 10, 'l') + '</div>' +
    pad('<div class="card lst">' + skRow('42%', '58%') + skRow('36%', '30%') + skRow('76%', '40%') + '</div>') +
    '<div class="xs-skg">' + sk(110, 10, 'l') + '</div>' +
    pad('<div class="card lst">' + skRow('46%', '30%') + skRow('64%', '38%') + '</div>') + '</div>';

  addFrame('estados', 'Hoje · carregando',
    'Só no primeiro acesso num aparelho novo, antes do cache existir, e só se a espera passar de 300 ms. A data, o nome e a semana já vêm do aparelho e da conta, então só a lista espera, com formas paradas e sem brilho correndo.',
    phone({ time: '7:40', tab: 'hoje', body: loading }));

  /* =============== 8 · HOJE · PAUSADO =============== */
  var pauseWeek = wk(days7([21, 22, 23, 24, 25, 26, 27], [0.8, 0.75, 0.9], ['', '', '', 'pz', 'pz', 'pz', 'pz today']));
  var pauseCard = '<div class="card xs-pause" data-pillar="accent"><span class="bub lg">' + ico('tree-palm') + '</span>' +
    '<h2 class="ttl2">Pausa até 2 de janeiro</h2>' + tag('Férias', { p: 'accent' }) +
    '<p>Nada fica pendente. Estes dias não contam na constância nem na força dos hábitos.</p>' +
    '<span class="cap">Tudo volta no domingo, 3 de janeiro, com a revisão da semana.</span>' +
    btn('Encerrar a pausa', { kind: 'g' }) + '</div>';

  var paused = hd({ date: 'Domingo, 27 de dezembro', title: 'Bom dia, Henrique' }) +
    '<div class="pad stack">' + pauseWeek + pauseCard + '</div>' +
    '<div class="spacer"></div>' +
    pad(fold(['salsicha|familia', 'sparkle|mente', 'scales|alim'], 0, 'Registrar algo, se quiser', 'fica no histórico, e o dia segue fora da conta'), 'padding-bottom:16px');

  addFrame('estados', 'Hoje · pausado',
    'Na pausa o Hoje não cobra nada: a semana hachura os dias pausados e o centro diz até quando vai. Registrar continua possível, recolhido perto do polegar, e Encerrar a pausa é discreto e tem Desfazer.',
    phone({ time: '10:12', tab: 'hoje', body: paused }));

  /* =============== 9 · INSTALAR NO IPHONE =============== */
  var install = '<div class="xs-inst">' +
    '<div class="xs-brand">' + appMark('', 30) + '<span><b>Prokopē</b><small>prokope.web.app</small></span></div>' +
    '<h1 class="ttl2">Instale na Tela de Início</h1>' +
    '<p class="lead" style="padding:0 4px">Instalado, o Prokopē abre como app, em tela cheia, e o login com Google funciona sem tropeço.</p>' +
    '<div class="lg xs-steps">' +
      '<div class="li"><span class="xs-n">1</span><span><b>Toque em Compartilhar</b><small>Na barra do Safari, aqui embaixo. Se não aparecer, toque antes em ' + ico('dots-three', 'bold') + '.</small></span><span class="xs-ios">' + ico('export', 'regular') + '</span></div>' +
      '<div class="li"><span class="xs-n">2</span><span><b>Adicionar à Tela de Início</b><small>Role a lista, se precisar, e toque em Adicionar.</small></span><span class="xs-ios">' + ico('plus-square', 'regular') + '</span></div>' +
      '<div class="li"><span class="xs-n">3</span><span><b>Abra pelo ícone novo</b><small>Entre com Google por lá. Esta aba pode ser fechada.</small></span>' + appMark('sm', 20) + '</div>' +
    '</div>' +
    '<div class="spacer"></div>' + btn('Agora não', { kind: 'g', w: true }) + '</div>' +
    '<div class="xs-saf" aria-hidden="true"><div class="xs-url">' + ico('lock-simple', 'fill') + 'prokope.web.app</div>' +
      '<div class="xs-sti"><span>' + ico('caret-left', 'regular') + '</span><span class="off">' + ico('caret-right', 'regular') + '</span>' +
      '<span class="on">' + ico('export', 'regular') + '</span><span>' + ico('book-open', 'regular') + '</span><span>' + ico('copy', 'regular') + '</span></div></div>';

  addFrame('estados', 'Instalar no iPhone',
    'Aparece no lugar da tela de entrada quando o Prokopē abre no Safari do iPhone fora da Tela de Início. O app instalado guarda o login separado do Safari, então entrar antes de instalar seria trabalho dobrado; "Agora não" segue para a entrada e só volta a perguntar em 7 dias.',
    phone({ time: '7:00', body: install }));

  /* =============== 10 · CONTA SEM ACESSO =============== */
  var noAccess = '<div class="xs-hero"><span class="bub lg" data-pillar="accent">' + ico('hand-waving') + '</span>' +
    '<h1 class="ttl2" style="margin-top:6px">Esta conta ainda não tem acesso</h1>' +
    '<span class="xs-who"><span class="xs-ini" aria-hidden="true">P</span>pessoa.exemplo@gmail.com</span>' +
    '<p>O Prokopē está aberto só para algumas contas. Peça ao dono do app para liberar este e-mail e depois entre de novo.</p></div>' +
    '<div class="xs-foot">' + btn('Entrar com outra conta', { kind: 's', w: true, icon: 'google-logo' }) +
    btn('Copiar o e-mail', { kind: 'g', w: true, icon: 'copy', iw: 'regular' }) +
    '<p class="xs-legal">' + ico('lock-simple', 'regular') + 'Nada desta conta foi guardado.</p></div>';

  addFrame('estados', 'Conta sem acesso',
    'Aparece depois do Google quando o e-mail não está na lista de contas liberadas. O e-mail fica à vista para a pessoa conferir se escolheu a conta certa, e Copiar ajuda a pedir acesso por mensagem.',
    phone({ time: '7:03', body: noAccess }));

  /* =============== 11 · NOVA VERSÃO PRONTA =============== */
  addFrame('estados', 'Nova versão pronta',
    'Só aparece com o Hoje parado, nunca logo depois de marcar algo nem com uma folha aberta, e fica até a pessoa atualizar ou arrastar para baixo. Se ela não atualizar, a versão nova entra na próxima vez que o app abrir do zero.',
    phone({ time: '12:41', tab: 'hoje', body: afternoon,
      overlay: toast({ p: 'accent', ic: 'sparkle', t: 'Nova versão do Prokopē', s: 'Leva um segundo e nada se perde', act: 'Atualizar', fill: true }) }));
})();
