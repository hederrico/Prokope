/* Jornada · fases, plano de corrida, treino em andamento e revisão da semana (Grupo D) */
(function () {
  addCSS([
    /* caminho das fases (fases na primária; os hábitos dentro mantêm a cor do pilar) */
    '.xd-lede { margin-top: 4px !important; font-weight: 400; color: var(--text-2); }',
    '.xd-hdact { color: var(--accent-ink); font: 600 16px/20px var(--font-ui); display: inline-flex; align-items: center; gap: 4px; }',
    '.xd-hdact i { font-size: 17px; }',
    '.xd-tl { display: flex; flex-direction: column; padding: 6px 16px 0; }',
    '.xd-ph { position: relative; display: grid; grid-template-columns: 34px minmax(0, 1fr); column-gap: 14px; padding-bottom: 22px; }',
    '.xd-ph:last-child { padding-bottom: 2px; }',
    '.xd-ph::before { content: ""; position: absolute; left: 16px; top: 40px; bottom: 6px; width: 2px; border-radius: 2px; background: var(--accent-mark); }',
    '.xd-ph.dash::before { width: 0; border-radius: 0; background: none; border-left: 2px dashed var(--border-strong); }',
    '.xd-ph:last-child::before { display: none; }',
    '.xd-node { position: relative; z-index: 1; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font: 600 14px/1 var(--font-ui); font-variant-numeric: tabular-nums; }',
    '.xd-node.done { background: var(--fill); color: var(--on); font-size: 17px; }',
    '.xd-node.now { background: var(--bg); }',
    '.xd-node.now b { font: 600 14px/1 var(--font-ui); color: var(--ink); }',
    '.xd-node.next { background: var(--bg); box-shadow: inset 0 0 0 2px var(--border-strong); color: var(--text-3); }',
    '.xd-pt { min-width: 0; padding-top: 6px; }',
    '.xd-pt .cap { display: block; }',
    '.xd-pt.next b { color: var(--text-2); }',
    '.xd-pt .xd-date { display: block; margin-top: 2px; font: var(--t-caption); color: var(--text-2); }',
    '.xd-t, .xd-pt b { display: block; font: 600 16px/20px var(--font-ui); }',
    '.xd-pv { font: 600 15px/1 var(--font-ui); color: var(--text-2); display: flex; align-items: center; gap: 4px; }',
    '.xd-pv i { font-size: 14px; color: var(--text-3); }',
    '.xd-now { min-width: 0; padding: 14px; border-radius: 18px; background: var(--wash); display: flex; flex-direction: column; gap: 12px; }',
    '.xd-now .cap { display: block; color: var(--text-2); }',
    '.xd-wks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; }',
    '.xd-wks span { display: flex; flex-direction: column; gap: 5px; font: var(--t-micro); color: var(--text-2); font-variant-numeric: tabular-nums; white-space: nowrap; }',
    '.xd-wks i { height: 6px; border-radius: 99px; background: color-mix(in oklch, var(--fill) 40%, var(--surface)); }',
    '.xd-wks i.on { background: var(--mark); }',
    '.xd-wks i.half { background: linear-gradient(90deg, var(--mark) 0 57%, color-mix(in oklch, var(--fill) 40%, var(--surface)) 57% 100%); }',
    '.xd-pc { display: contents; }',
    '.xd-hc { gap: 6px; }',
    '.xd-hc .chip { border-color: transparent; padding: 5px 10px 5px 8px; font-size: 13px; line-height: 17px; }',
    '.xd-hc .chip i { font-size: 15px; color: var(--ink); }',
    '.xd-spark { display: flex; align-items: flex-end; gap: 4px; height: 40px; }',
    '.xd-spark i { flex: 1; border-radius: 3px; background: var(--fill); }',
    '.xd-spark i:last-child { background: var(--mark); }',

    /* editar fases */
    '.xd-fc { display: flex; flex-direction: column; gap: 12px; }',
    '.xd-fc .chip { background: var(--sunken); }',
    '.xd-frow { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid var(--border); font: 400 15px/20px var(--font-ui); color: var(--text-2); }',
    '.xd-few { display: flex; align-items: center; gap: 10px; font: 500 14px/18px var(--font-ui); color: var(--text-2); }',

    /* plano de corrida */
    '.xd-hero { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding-top: 6px; }',
    '.xd-hero .bub.lg { margin-bottom: 4px; }',
    '.xd-strip { display: flex; align-items: flex-end; gap: 2px; height: 44px; }',
    '.xd-strip i { display: block; min-width: 0; height: 20px; border-radius: 4px; background: var(--fill); }',
    '.xd-strip i.t { height: 44px; background: var(--mark); }',
    '.xd-strip i.c { background: color-mix(in oklch, var(--fill) 55%, var(--track)); }',
    '.xd-strip i.fut { background: transparent; box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--fill) 85%, var(--text-3)); }',
    '.xd-strip i.cur { box-shadow: 0 0 0 2px var(--wash), 0 0 0 3.5px var(--text); }',
    '.xd-brk { display: flex; gap: 6px; margin-top: 8px; }',
    '.xd-brk span { min-width: 0; padding-top: 5px; border-top: 1.5px solid var(--border-strong); text-align: center; white-space: nowrap; font: var(--t-micro); color: var(--text-2); font-variant-numeric: tabular-nums; }',
    '.xd-leg { display: flex; flex-direction: column; gap: 9px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }',
    '.xd-lr { display: flex; align-items: center; gap: 10px; font: 400 15px/20px var(--font-ui); }',
    '.xd-lr.tot { padding-top: 9px; border-top: 1px solid var(--border); font-weight: 600; }',
    '.xd-lr .num { color: var(--text-2); }',
    '.xd-lr.tot .num { color: var(--text); }',
    '.xd-sw { width: 14px; height: 18px; flex: none; display: flex; align-items: flex-end; justify-content: center; }',
    '.xd-sw i { width: 10px; height: 9px; border-radius: 3px; background: var(--fill); }',
    '.xd-sw i.t { height: 18px; background: var(--mark); }',
    '.xd-sw i.c { background: color-mix(in oklch, var(--fill) 55%, var(--track)); }',
    '.xd-wr { display: grid; grid-template-columns: 28px minmax(0, 1fr) 60px 42px; gap: 12px; align-items: center; padding: 10px 14px; }',
    '.xd-wn { width: 28px; height: 28px; border-radius: 50%; background: var(--sunken); color: var(--text-2); display: grid; place-items: center; font: 600 13px/1 var(--font-ui); font-variant-numeric: tabular-nums; }',
    '.xd-wr.on .xd-wn { background: var(--fill); color: var(--on); }',
    '.xd-wr b { display: block; font: 600 15px/20px var(--font-ui); font-variant-numeric: tabular-nums; white-space: nowrap; }',
    '.xd-wr small { display: block; font: var(--t-caption); color: var(--ink); }',
    '.xd-wr .cap { text-align: right; }',

    /* corrida em andamento: trote em cor cheia, caminhada em tom claro (nome e ícone mudam junto). No escuro, o trote usa um damasco profundo para não ofuscar */
    '.phone.xd-trot { --xd-bg: var(--corpo-ink); background: var(--xd-bg); color: var(--surface); }',
    '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .phone.xd-trot { --xd-bg: oklch(38% .07 60); color: var(--corpo-ink); } }',
    ':root[data-theme="dark"] .phone.xd-trot { --xd-bg: oklch(38% .07 60); color: var(--corpo-ink); }',
    '.phone.xd-trot .hi { background: currentColor; }',
    '.phone.xd-walk { background: var(--corpo-wash); }',
    '.xd-run { flex: 1; display: flex; flex-direction: column; padding-bottom: 40px; }',
    '.xd-runtop { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; min-height: 52px; padding: 0 12px; text-align: center; }',
    '.xd-runtop b { display: block; font: 600 17px/22px var(--font-ui); }',
    '.xd-awake { display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; font: var(--t-caption); opacity: .8; }',
    '.xd-awake i { font-size: 14px; }',
    '.xd-rbtn { width: 44px; height: 44px; flex: none; border-radius: 50%; display: grid; place-items: center; font-size: 22px; background: color-mix(in oklch, currentColor 14%, transparent); }',
    '.xd-walk .xd-rbtn { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }',
    '.xd-runc { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }',
    '.xd-state { display: inline-flex; align-items: center; gap: 10px; font: 700 44px/1 var(--font-ui); letter-spacing: -0.02em; }',
    '.xd-state i { font-size: 42px; }',
    '.xd-walk .xd-state { color: var(--ink); }',
    '.xd-clock { font: 600 92px/1 var(--font-ui); letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }',
    '.xd-left { margin-top: 4px; font: 500 16px/20px var(--font-ui); opacity: .8; }',
    '.xd-walk .xd-left { color: var(--text-2); opacity: 1; }',
    '.xd-next { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 18px 0 14px; border-radius: 999px; background: color-mix(in oklch, currentColor 14%, transparent); font: 500 17px/22px var(--font-ui); }',
    '.xd-next i { font-size: 21px; }',
    '.xd-next b { font-weight: 700; font-variant-numeric: tabular-nums; }',
    '.xd-walk .xd-next { background: var(--surface); box-shadow: var(--shadow-1); color: var(--text); }',
    '.xd-walk .xd-next i { color: var(--ink); }',
    '.xd-runb { display: flex; flex-direction: column; gap: 12px; padding-top: 6px; padding-bottom: 26px; }',
    '.xd-runb p { font: 500 15px/20px var(--font-ui); text-align: center; font-variant-numeric: tabular-nums; opacity: .85; }',
    '.xd-walk .xd-runb p { color: var(--text-2); opacity: 1; }',
    '.xd-trot .xd-strip i { background: currentColor; opacity: .5; }',
    '.xd-trot .xd-strip i.fut { background: transparent; box-shadow: inset 0 0 0 1.5px currentColor; opacity: .45; }',
    '.xd-trot .xd-strip i.cur { opacity: 1; box-shadow: none; outline: 2px solid currentColor; outline-offset: 2px; }',
    '.xd-ctl { display: flex; justify-content: center; gap: 56px; }',
    '.xd-cb { display: flex; flex-direction: column; align-items: center; gap: 8px; font: 600 14px/18px var(--font-ui); }',
    '.xd-walk .xd-cb { color: var(--text-2); }',
    '.xd-rb { width: 80px; height: 80px; border-radius: 50%; display: grid; place-items: center; font-size: 32px; }',
    '.xd-rb.p { background: var(--ink); color: var(--surface); }',
    '.xd-rb.s { background: var(--surface); color: var(--text); box-shadow: inset 0 0 0 1px var(--border-strong); }',
    '.xd-trot .xd-rb.p { color: inherit; background: currentColor; }',
    '.xd-trot .xd-rb.p i { color: var(--xd-bg); }',
    '.xd-trot .xd-rb.s { background: transparent; color: inherit; box-shadow: inset 0 0 0 2px currentColor; }',
    '.xd-back { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px; align-items: center; padding: 12px 14px; }',
    '.xd-back .bub { width: 36px; height: 36px; border-radius: 11px; font-size: 20px; }',
    '.xd-back b { display: block; font: 600 15px/20px var(--font-ui); }',
    '.xd-back small { display: block; margin-top: 2px; font: var(--t-caption); color: var(--text-2); }',

    /* treino feito */
    '.xd-done { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 56px 24px 0; text-align: center; }',
    '.xd-done .ringbox .rc i { font-size: 34px; color: var(--ink); }',
    '.xd-done .ringbox .rc b { margin-top: 4px; font: 600 28px/1 var(--font-ui); font-variant-numeric: tabular-nums; }',
    '.xd-done h1 { margin-top: 22px !important; }',
    '.xd-done .stats { width: 100%; margin-top: 26px; text-align: left; }',
    '.xd-dstrip { width: 100%; padding: 14px 16px; }',

    /* revisão */
    '.xd-rvh { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 16px 0; }',
    '.xd-rring { margin-top: 14px; }',
    '.xd-rring .rc .cap { margin-top: 3px; }',
    '.xd-cmp .hr { grid-template-columns: 32px minmax(0, 1fr) auto; padding: 8px 14px; }',
    '.xd-cmp .bub { width: 32px; height: 32px; border-radius: 10px; font-size: 18px; }',
    '.xd-cmp .ht b { font-size: 15px; }',
    '.xd-care { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--wash); }',
    '.xd-care p { font: 500 15px/21px var(--font-ui); color: var(--text); }',
    '.xd-care .cap { display: flex; align-items: center; gap: 8px; margin-top: 6px; color: var(--text-2); white-space: nowrap; }',
    '.xd-sf { background: var(--surface) !important; }',
    '.xd-foot { padding-top: 16px; padding-bottom: 34px; }',
    '.xd-form { display: flex; flex-direction: column; gap: 20px; padding-top: 10px; }',
    '.xd-form .foot { padding: 6px 4px 0; }',
    '.xd-area { align-items: flex-start; min-height: 76px; }',
    '.xd-offc { padding: 20px; border-radius: 24px; background: var(--wash); display: flex; flex-direction: column; gap: 16px; }',
    '.xd-offp { font: 400 16px/23px var(--font-ui); color: var(--text); }',
    '.xd-opts { display: flex; flex-direction: column; gap: 10px; }',
    '.xd-opt { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 12px; align-items: center; min-height: 72px; padding: 12px 16px 12px 14px; border-radius: 20px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--border-strong); }',
    '.xd-opt b { display: block; font: 600 17px/22px var(--font-ui); }',
    '.xd-opt small { display: block; margin-top: 2px; font: 400 14px/19px var(--font-ui); color: var(--text-2); }',

    /* fase desbloqueada e mais uma semana */
    '.xd-win { position: relative; flex: 1; display: flex; flex-direction: column; }',
    '.xd-conf { position: absolute; left: 0; top: 0; pointer-events: none; }',
    '.xd-winc { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; padding: 92px 32px 0; }',
    '.xd-emb { width: 112px; height: 112px; border-radius: 50%; display: grid; place-items: center; font-size: 56px; background: var(--fill); color: var(--on); box-shadow: 0 0 0 10px var(--wash), 0 0 44px 8px color-mix(in oklch, var(--fill) 50%, transparent); }',
    '.xd-winc .eyebrow { margin-top: 30px; }',
    '.xd-big { margin-top: 4px !important; font: 400 60px/1.05 var(--font-display); font-variation-settings: var(--display-vs); letter-spacing: -0.02em; }',
    '.xd-winc p { margin-top: 14px !important; max-width: 310px; font-weight: 400; }',
    '.xd-stay { padding-top: 76px; }',
    '.xd-emb2 { width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; font-size: 46px; background: var(--wash); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--fill); }',
    '.xd-big2 { margin-top: 6px !important; font: 400 42px/1.1 var(--font-display); font-variation-settings: var(--display-vs); letter-spacing: -0.015em; text-align: center; }'
  ].join('\n'));

  /* ---------- peças ---------- */
  /* treino da semana 1: c aquecimento ou volta à calma, t trote, w caminhada */
  function week1() {
    var b = [['c', 5]];
    for (var i = 0; i < 8; i++) b.push(['t', 1], ['w', 1.5]);
    b.push(['c', 5]);
    return b;
  }
  /* fileira de blocos proporcionais; cur = índice do bloco atual (sem cur, a fileira é neutra; cur além do fim, tudo feito) */
  function strip(cur) {
    return '<div class="xd-strip" aria-hidden="true">' + week1().map(function (b, i) {
      var st = cur === undefined ? '' : (i < cur ? ' done' : (i === cur ? ' cur' : ' fut'));
      return '<i class="' + b[0] + st + '" style="flex:' + b[1] + '"></i>';
    }).join('') + '</div>';
  }
  /* chip de hábito com a cor do próprio pilar */
  function hchip(p, ic, t) { return '<span class="xd-pc" data-pillar="' + p + '">' + chip(t, { icon: ic, iw: 'duotone' }) + '</span>'; }
  var caret = '<span class="faint">' + ico('caret-right', 'bold') + '</span>';
  var ph2 = [['alim', 'egg', 'Proteína'], ['alim', 'drop', 'Água'], ['alim', 'fork-knife', 'Almoço e jantar'], ['alim', 'cookie', 'Tranqueiras'], ['alim', 'pizza', 'Refeições livres']];
  var ph3 = [['corpo', 'barbell', 'Academia'], ['corpo', 'person-simple-run', 'Corrida'], ['mente', 'youtube-logo', 'YouTube até 60 min'], ['mente', 'device-mobile', 'Tempo de tela']];
  var ph4 = [['mente', 'bed', 'Ritual do sono'], ['mente', 'ear-slash', 'Momentos de silêncio'], ['familia', 'calendar-heart', 'Programa a dois'], ['familia', 'hand-heart', 'Pequeno gesto']];
  function chips(list) { return '<div class="chips xd-hc">' + list.map(function (h) { return hchip(h[0], h[1], h[2]); }).join('') + '</div>'; }

  /* ---------- 1. Jornada ---------- */
  var timeline = '<div class="xd-tl" data-pillar="accent">' +
    '<div class="xd-ph"><span class="xd-node done">' + ico('check', 'bold') + '</span>' +
      '<div class="xd-pt between"><span><b>Fase 1 · Base</b><span class="cap">21 set – 11 out · concluída</span></span>' +
      '<span class="xd-pv num">81%' + ico('caret-right', 'bold') + '</span></div></div>' +

    '<div class="xd-ph dash"><span class="xd-node now">' + ringBox(34, 3, 0.52, '<b>2</b>', 'var(--mark)', 'var(--wash)') + '</span>' +
      '<div class="xd-now">' +
        '<div class="between">' + tag('Agora', { dot: true, up: true, lift: true }) + '<span class="cap num">semana 2 de 3</span></div>' +
        '<div><b class="xd-t">Fase 2 · Alimentação</b><span class="cap">12 out – 1 nov</span></div>' +
        '<div class="xd-wks"><span><i class="on"></i>semana 1 · 74%</span><span><i class="half"></i>semana 2 · 76%</span><span><i></i>semana 3</span></div>' +
        chips(ph2) +
        '<p class="cap">Os 7 hábitos da fase 1 continuam com você.</p>' +
      '</div></div>' +

    '<div class="xd-ph dash"><span class="xd-node next">3</span>' +
      '<div class="xd-pt next between"><span><b>Fase 3 · Movimento</b><span class="xd-date">Pode começar em 2 nov</span><span class="cap">Academia, corrida e menos tela</span></span>' + caret + '</div></div>' +

    '<div class="xd-ph"><span class="xd-node next">4</span>' +
      '<div class="xd-pt next between"><span><b>Fase 4 · Profundidade</b><span class="xd-date">Pode começar em 23 nov</span><span class="cap">Sono, silêncio e tempo a dois</span></span>' + caret + '</div></div>' +
  '</div>';

  var trot = [8, 8, 9, 10, 12, 12, 15, 16, 20, 23, 20, 25, 30];
  var runCard = '<div class="pad" style="margin-top:24px"><div class="card p stack" data-pillar="corpo" style="gap:14px">' +
    '<div class="row" style="gap:12px"><span class="bub">' + ico('person-simple-run') + '</span>' +
      '<span class="grow"><b class="xd-t">Plano de corrida</b><span class="cap">Do zero aos 30 minutos</span></span>' + caret + '</div>' +
    '<div class="xd-spark" aria-hidden="true">' + trot.map(function (m) { return '<i style="height:' + (m / 30 * 100).toFixed(1) + '%"></i>'; }).join('') + '</div>' +
    '<p class="cap">Entra com a fase 3 · 13 semanas · 2 treinos por semana</p>' +
  '</div></div>';

  var journey = hd({ date: 'Quinta, 22 de outubro', title: 'Jornada',
      right: '<span class="xd-hdact hit" role="button">' + ico('pencil-simple', 'bold') + 'Editar fases</span>' }) +
    '<p class="pad sub xd-lede" style="margin:-8px 0 12px !important">Seu plano em fases, desde 21 de setembro.</p>' +
    timeline + runCard +
    gl('Revisões da semana', 'próxima: domingo, 25 out') +
    '<div class="pad">' + lg([
      li({ ic: 'calendar-check', p: 'accent', t: 'Domingo, 18 out', s: 'Semana 1 da fase 2', rv: '74%' }),
      li({ ic: 'flag-banner', p: 'accent', t: 'Domingo, 11 out', s: 'Fim da fase 1', rv: '81%' })
    ]) + '<p class="foot">Cada revisão abre só para leitura.</p></div><div style="height:24px"></div>';

  addFrame('jornada', 'Jornada',
    'Jornada é o plano (o que passou, a fase de agora e o que pode vir); os números ficam em Progresso. As fases seguintes dizem quando podem começar, porque quem decide é você na Revisão da semana. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:48', tall: true, tab: 'jor', body: journey }));

  /* ---------- 2. Editar fases ---------- */
  function phaseCard(head, body, row) {
    return '<div class="card p xd-fc" data-pillar="accent">' + head + body + (row || '') + '</div>';
  }
  function frow(label, val) { return '<div class="xd-frow"><span>' + label + '</span>' + tval(val) + '</div>'; }
  var ph1icons = ['alarm|mente', 'salsicha|familia', 'pint-glass|alim', 'broom|familia'];
  var editPhases = nb({ back: 'Jornada' }) +
    '<div class="pad"><h1 class="ttl2">Fases</h1><p class="lead" style="margin-top:6px">A Revisão da semana sugere a próxima fase. Quem decide é você.</p></div>' +
    gl('Sugestão para avançar') +
    '<div class="pad">' + lg([li({ ic: 'trend-up', p: 'accent', t: 'Sugerir a próxima fase', s: 'com constância a partir de', rv: '70%' })]) + '</div>' +
    gl('Suas fases', '4') +
    '<div class="pad stack">' +
      phaseCard(ch('Fase 1 · Base', '21 set – 11 out · 3 semanas', tag('81%', { icon: 'check' })),
        '<div class="xd-few"><span class="ics" aria-hidden="true">' + ph1icons.map(function (x) {
          var p = x.split('|'); return '<span class="bub" data-pillar="' + p[1] + '">' + ico(p[0]) + '</span>';
        }).join('') + '<span class="bub more">+3</span></span>7 hábitos</div>') +
      phaseCard(ch('Fase 2 · Alimentação', '12 out – 1 nov', tag('Agora', { dot: true, up: true })), chips(ph2), frow('Termina em', '1 nov')) +
      phaseCard(ch('Fase 3 · Movimento', 'Pode começar em 2 nov'), chips(ph3), frow('Duração', '3 semanas')) +
      phaseCard(ch('Fase 4 · Profundidade', 'Pode começar em 23 nov'), chips(ph4), frow('Duração', 'Sem fim')) +
      addRow('Nova fase') +
    '</div>' +
    '<p class="foot">Toque num hábito para mudá-lo de fase. Mudar datas não mexe no que já foi registrado.</p>' +
    '<div style="height:24px"></div>';

  addFrame('jornada', 'Editar fases',
    'Fases saiu de Ajustes e mora na Jornada. As datas das próximas fases são previsões, porque cada uma começa quando você escolhe na revisão; o limite de 70% só decide quando o convite aparece. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:50', tall: true, tab: 'jor', body: editPhases }));

  /* ---------- 3. Plano de corrida ---------- */
  function lgRow(cls, t, v, tot) {
    return '<div class="xd-lr' + (tot ? ' tot' : '') + '"><span class="xd-sw">' + (cls ? '<i class="' + cls + '"></i>' : '') + '</span>' +
      '<span class="grow">' + t + '</span><span class="num">' + v + '</span></div>';
  }
  var workout = '<div class="card p" data-pillar="corpo">' + strip() +
    '<div class="xd-brk" aria-hidden="true"><span style="flex:5">5 min</span><span style="flex:20">8 × (1 + 1,5)</span><span style="flex:5">5 min</span></div>' +
    '<div class="xd-leg">' +
      lgRow('c', 'Aquecimento caminhando', '5 min') +
      lgRow('t', 'Trote', '8 × 1 min') +
      lgRow('w', 'Caminhada', '8 × 1,5 min') +
      lgRow('c', 'Volta à calma', '5 min') +
      lgRow('', 'Total', '30 min', true) +
    '</div></div>';

  var W = [['8 × (1 + 1,5)', 8], ['8 × (1 + 1)', 8], ['6 × (1,5 + 1,5)', 9], ['5 × (2 + 1,5)', 10], ['4 × (3 + 1,5)', 12],
    ['3 × (4 + 1,5)', 12], ['3 × (5 + 2)', 15], ['2 × (8 + 2)', 16], ['2 × (10 + 2)', 20], ['15 + 2 + 8', 23],
    ['20 min contínuos', 20], ['25 min contínuos', 25], ['30 min contínuos', 30]];
  var weeks = W.map(function (w, i) {
    return '<div class="xd-wr' + (i === 0 ? ' on' : '') + '"><span class="xd-wn">' + (i + 1) + '</span>' +
      '<span><b>' + w[0] + '</b>' + (i === 0 ? '<small>a partir de 2 nov</small>' : '') + '</span>' +
      mbar(w[1] / 30 * 100) + '<span class="cap num">' + w[1] + ' min</span></div>';
  }).join('');

  var plan = nb({ back: 'Jornada' }) +
    '<div class="pad xd-hero" data-pillar="corpo"><span class="bub lg">' + ico('person-simple-run') + '</span>' +
      '<h1 class="ttl2">Do zero aos 30 minutos</h1>' +
      '<p class="sub muted" style="font-weight:400">13 semanas, 2 treinos por semana. Entra no seu dia junto com a fase 3.</p></div>' +
    '<div class="pad" style="margin-top:16px">' + lg([
      li({ ic: 'calendar-dots', p: 'corpo', t: 'Dias de treino', rv: 'Seg e qua · 7h10' })
    ]) + '</div>' +
    gl('Semana 1 · o treino', '30 min') +
    '<div class="pad">' + workout + '</div>' +
    gl('As 13 semanas', 'tempo de trote') +
    '<div class="pad"><div class="card lst" data-pillar="corpo">' + weeks + '</div>' +
      '<p class="foot">Em minutos, trote + caminhada. Todo treino começa e termina com 5 min de caminhada. Dá para repetir uma semana quantas vezes quiser.</p></div>' +
    '<div style="height:24px"></div>';

  addFrame('jornada', 'Plano de corrida',
    'O plano fica à vista antes da fase 3, e os dias de treino já podem ser escolhidos. Quando a fase começa, Começar treino fica fixo no rodapé. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:49', tall: true, tab: 'jor', body: plan }));

  /* ---------- 4. Corrida em andamento (trote) ---------- */
  function runTop() {
    return '<div class="xd-runtop"><span class="xd-rbtn hit" role="button" aria-label="Minimizar">' + ico('caret-down', 'bold') + '</span>' +
      '<span><b>Semana 1 · treino 1</b><span class="xd-awake">' + ico('lightbulb', 'regular') + 'Tela acesa</span></span>' +
      '<span class="xd-rbtn hit" role="switch" aria-checked="true" aria-label="Som nas trocas">' + ico('speaker-high', 'fill') + '</span></div>';
  }
  function runCtl() {
    return '<div class="xd-ctl">' +
      '<span class="xd-cb"><span class="xd-rb s" role="button" aria-label="Encerrar treino. Toque longo">' + ico('stop', 'fill') + '</span>Segure para encerrar</span>' +
      '<span class="xd-cb"><span class="xd-rb p" role="button" aria-label="Pausar">' + ico('pause', 'fill') + '</span>Pausar</span>' +
    '</div>';
  }
  var run = '<div class="xd-run">' + runTop() +
    '<div class="xd-runc" aria-live="polite">' +
      '<span class="xd-state">' + ico('person-simple-run', 'bold') + 'Trote</span>' +
      ringBox(248, 14, 0.7, '<span class="xd-clock">0:18</span><span class="xd-left">faltam</span>', 'currentColor', 'color-mix(in oklch, currentColor 22%, transparent)') +
      '<span class="xd-next">' + ico('person-simple-walk', 'bold') + 'Depois: caminhada <b>1:30</b></span>' +
    '</div>' +
    '<div class="pad xd-runb">' + strip(5) + '<p>Tempo total 10:42 · intervalo 3 de 8</p></div>' +
    runCtl() + '</div>';

  addFrame('jornada', 'Corrida em andamento',
    'Para ler de longe e no sol: trote em cor cheia, caminhada em tom claro, e o número grande é o que falta para a troca. Sem vibração no Safari, a troca vem com um som curto opcional e uma contagem 3, 2, 1; Minimizar volta ao app com o treino numa faixa no topo do Hoje.',
    phone({ time: '6:21', cls: 'xd-trot', body: run }));

  /* ---------- 5. Corrida · de volta ao app (caminhada) ---------- */
  var back = '<div class="xd-run" data-pillar="corpo">' + runTop() +
    '<div class="pad"><div class="card xd-back" role="status"><span class="bub">' + ico('lock-simple-open') + '</span>' +
      '<span><b>O treino seguiu com a tela bloqueada</b><small>A caminhada começou há 50 s. Os avisos voltaram.</small></span></div></div>' +
    '<div class="xd-runc">' +
      '<span class="xd-state">' + ico('person-simple-walk', 'bold') + 'Caminhada</span>' +
      ringBox(224, 14, 50 / 90, '<span class="xd-clock" style="font-size:80px">0:40</span><span class="xd-left">faltam</span>', 'var(--mark)', 'color-mix(in oklch, var(--fill) 45%, var(--wash))') +
      '<span class="xd-next">' + ico('person-simple-run', 'bold') + 'Depois: trote <b>1:00</b></span>' +
    '</div>' +
    '<div class="pad xd-runb">' + strip(6) + '<p>Tempo total 11:50 · intervalo 3 de 8</p></div>' +
    runCtl() + '</div>';

  addFrame('jornada', 'Corrida · de volta ao app',
    'No iPhone, o app para de rodar quando a tela bloqueia ou a pessoa troca de app. O tempo vem da hora de início, então o treino continua certo e, na volta, este aviso diz em que parte ele está e some sozinho em 5 segundos.',
    phone({ time: '6:22', cls: 'xd-walk', body: back }));

  /* ---------- 6. Treino feito ---------- */
  var done = '<div class="xd-win" data-pillar="corpo"><div class="xd-done">' +
      ringBox(168, 12, 1, ico('check', 'bold') + '<b>30 min</b>', 'var(--mark)', 'var(--wash)') +
      '<h1 class="lt">Treino feito</h1><p class="sub muted" style="font-weight:400">Semana 1 · treino 1 de 2</p>' +
      '<div class="card stats" style="flex-wrap:wrap">' +
        '<div><span class="k">' + ico('repeat', 'regular') + 'Intervalos</span><span class="stat num">8<small>de 8</small></span></div>' +
        '<div><span class="k">' + ico('person-simple-run', 'regular') + 'Trote</span><span class="stat num">8<small>min</small></span></div>' +
        '<div><span class="k">' + ico('person-simple-walk', 'regular') + 'Caminhada</span><span class="stat num">22<small>min</small></span></div>' +
      '</div>' +
      '<div class="card" style="width:100%;margin-top:12px"><div class="xd-dstrip">' + strip(99) + '</div></div>' +
    '</div>' +
    '<div class="pad stack xd-foot" style="gap:14px">' +
      lg([li({ ic: 'calendar-dots', p: 'corpo', t: 'Próximo treino', rv: 'Qua, 4 nov · 7h10' })]) +
      btn('Voltar ao dia', { w: true }) +
    '</div></div>';

  addFrame('jornada', 'Treino feito',
    'O anel fecha uma vez e a Corrida entra como feita no Hoje, sem confete. Encerrado antes, a mesma tela mostra o que foi feito (por exemplo, 5 de 8 intervalos) e conta como treino da semana.',
    phone({ time: '6:41', body: done }));

  /* ---------- 7. Revisão · 1 de 3 ---------- */
  var good = '<div class="card lst xd-cmp">' +
    hr({ p: 'mente', ic: 'device-mobile-slash', t: 'Telas desligadas', s: dots(7, 7) + '7 de 7 noites' }) +
    hr({ p: 'alim', ic: 'egg', t: 'Proteína acima de 80 g', s: dots(7, 5) + 'em 5 dias' }) +
    hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, 6) + '6 de 7 dias' }) +
    hr({ p: 'alim', ic: 'pint-glass', t: 'Zero refrigerante', s: dots(7, 7) + 'a semana toda' }) +
  '</div>';
  var care = '<div class="xd-care" data-pillar="mente"><span class="bub sm xd-sf">' + ico('moon-stars') + '</span>' +
    '<span><p>Deitar às 22h aconteceu em 3 de 7 noites.</p><span class="cap">' + dots(7, 3) + 'Dá para ajustar na próxima tela.</span></span></div>';

  var rv1 = stepTop(1, 3, { back: true, close: true }) +
    '<div class="xd-rvh"><h1 class="lt">Sua semana</h1><p class="sub muted" style="font-weight:400">26 out – 1 nov · fim da fase 2</p>' +
      '<div class="xd-rring">' + ringBox(108, 10, 0.78, '<span class="disp num" style="font-size:34px;line-height:1">78%</span><span class="cap">na semana</span>', 'var(--accent-mark)', 'var(--accent-wash)') + '</div></div>' +
    gl('O que deu certo') + '<div class="pad">' + good + '</div>' +
    gl('Para olhar com carinho') + '<div class="pad">' + care + '</div>' +
    '<div class="spacer"></div><div class="pad xd-foot">' + btn('Continuar', { w: true }) + '</div>';

  addFrame('jornada', 'Revisão · 1 de 3',
    'Abre pelo cartão Revisão da semana do Hoje, no domingo a partir das 18h, e começa pelo que deu certo. O X fecha a qualquer momento e guarda o passo; o cartão do Hoje vira Continuar revisão.',
    phone({ time: '18:30', body: rv1 }));

  /* ---------- 8. Revisão · 2 de 3 ---------- */
  var rv2 = stepTop(2, 3, { back: true, close: true }) +
    '<div class="pad xd-form">' +
      '<h1 class="ttl2">Uma coisa para ajustar na próxima semana?</h1>' +
      '<div><div class="fld xd-area">Começar a desligar as telas às 20h45 para deitar no horário.</div>' +
        '<p class="foot">Aparece no Hoje como lembrete durante a semana.</p></div>' +
      '<div><span class="flabel">Cintura de hoje</span><div class="fld"><span class="grow num">94,5</span><span class="faint">cm</span></div>' +
        '<p class="foot">Semana passada: 94,8 cm</p></div>' +
      '<div><div class="between"><span class="flabel">Programa a dois</span><span class="cap" style="padding-bottom:6px">2 a 8 nov · 1 por semana</span></div>' +
        '<div style="margin-bottom:10px">' + days([5], { p: 'familia', single: true, label: 'Dia do programa a dois' }) + '</div>' +
        fld('Piquenique no parque') + '</div>' +
    '</div>' +
    '<div class="spacer"></div><div class="pad xd-foot stack" style="gap:8px">' + btn('Continuar', { w: true }) +
      '<p class="foot c" style="padding-top:0">Tudo nesta tela é opcional.</p></div>';

  addFrame('jornada', 'Revisão · 2 de 3',
    'Tudo é opcional, então Continuar também serve para pular. O ajuste é escrito com as próprias palavras e a cintura (número de exemplo) abre o teclado decimal.',
    phone({ time: '18:32', body: rv2 }));

  /* ---------- 9. Revisão · 3 de 3 ---------- */
  var offer = '<div class="pad" data-pillar="accent"><div class="xd-offc">' +
    '<div class="row" style="gap:14px"><span class="bub lg xd-sf">' + ico('path') + '</span>' +
      '<span><span class="eyebrow">Fase 3 disponível</span><h1 class="ttl2">Movimento</h1></span></div>' +
    '<p class="xd-offp">A fase 2 fechou com 78% de constância. Se fizer sentido para você, estes hábitos entram a partir de amanhã:</p>' +
    '<div class="card lst xd-cmp">' +
      hr({ p: 'corpo', ic: 'barbell', t: 'Academia', s: '2× por semana · no condomínio' }) +
      hr({ p: 'corpo', ic: 'person-simple-run', t: 'Corrida', s: '2× por semana · plano de 13 semanas' }) +
      hr({ p: 'mente', ic: 'youtube-logo', t: 'YouTube até 60 min', s: 'por dia' }) +
      hr({ p: 'mente', ic: 'device-mobile', t: 'Tempo de tela até 1h40', s: 'por dia · 20% abaixo da sua média' }) +
    '</div></div></div>';

  function opt(ic, t, s) {
    return '<div class="xd-opt" data-pillar="accent" role="button"><span class="bub">' + ico(ic) + '</span><span><b>' + t + '</b><small>' + s + '</small></span></div>';
  }
  var rv3 = stepTop(3, 3, { back: true, close: true }) + '<div style="height:8px"></div>' + offer +
    '<div class="spacer"></div><div class="pad xd-foot stack" style="gap:10px"><div class="xd-opts">' +
      opt('sneaker-move', 'Começar a fase 3', 'Os 4 hábitos entram amanhã, 2 nov.') +
      opt('plant', 'Ficar mais uma semana', 'A fase 2 segue até 8 nov.') +
    '</div><p class="foot c" style="padding-top:2px">As duas escolhas estão certas.</p></div>';

  addFrame('jornada', 'Revisão · 3 de 3',
    'Duas opções do mesmo tamanho e cor, cada uma dizendo o que acontece depois. Abaixo de 70% de constância, Ficar mais uma semana vem primeiro e o texto sugere firmar a fase, e a escolha continua sendo sua.',
    phone({ time: '18:33', body: rv3 }));

  /* ---------- 10. Fase desbloqueada ---------- */
  /* confete parado: poucas formas pequenas nas cores dos pilares, ao redor do emblema e longe do texto */
  function confetti() {
    var seed = 11;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var cols = ['var(--mente-mark)', 'var(--alim-mark)', 'var(--corpo-mark)', 'var(--familia-mark)', 'var(--accent-mark)'];
    var cx = 195, cy = 148, pts = [], s = '<svg class="xd-conf" viewBox="0 0 390 330" width="390" height="330" aria-hidden="true">';
    for (var tries = 0; pts.length < 18 && tries < 2000; tries++) {
      var x = 18 + rnd() * 354, y = 12 + rnd() * 300, dx = x - cx, dy = y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < 96) continue;
      if (y > 200 && Math.abs(dx) < 168) continue;
      if (pts.some(function (p) { return Math.abs(p[0] - x) < 42 && Math.abs(p[1] - y) < 42; })) continue;
      pts.push([x, y]);
      var n = pts.length, c = cols[n % cols.length], rot = Math.round(rnd() * 180), k = n % 4;
      var tr = ' transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot + ')"';
      if (k === 0) s += '<circle' + tr + ' r="3.4" style="fill:' + c + '"/>';
      else if (k === 1) s += '<rect' + tr + ' x="-2" y="-5.5" width="4" height="11" rx="2" style="fill:' + c + '"/>';
      else if (k === 2) s += '<path' + tr + ' d="M0 -4.6 L4.2 3.1 L-4.2 3.1 Z" style="fill:' + c + ';stroke:' + c + ';stroke-width:1.4;stroke-linejoin:round"/>';
      else s += '<path' + tr + ' d="M-6.5 0 Q-3.2 -3.6 0 0 T6.5 0" style="fill:none;stroke:' + c + ';stroke-width:2;stroke-linecap:round"/>';
    }
    return s + '</svg>';
  }

  var win = '<div class="xd-win" data-pillar="accent">' + confetti() +
    '<div class="xd-winc"><span class="xd-emb">' + ico('path') + '</span>' +
      '<span class="eyebrow">Fase 3</span><h1 class="xd-big">Movimento</h1>' +
      '<p class="sub muted center">A fase 2 fechou com 78%. Academia, corrida e menos tela entram no seu dia a partir de amanhã, segunda, 2 de novembro.</p></div>' +
    '<div class="pad stack xd-foot" style="gap:14px">' +
      '<div class="card hr" data-pillar="corpo"><span class="bub">' + ico('person-simple-run') + '</span>' +
        '<span class="ht"><b>Primeiro treino de corrida</b><small>Segunda, 7h10 · 30 min</small></span>' + caret + '</div>' +
      btn('Ver meu dia', { w: true }) +
    '</div></div>';

  addFrame('jornada', 'Fase desbloqueada',
    'Único momento com confete: cai uma vez e fica parado, e a frase começa pelo que foi feito. Ver meu dia volta ao Hoje de domingo, que ganha o cartão Amanhã começa a fase 3.',
    phone({ time: '18:34', body: win }));

  /* ---------- 11. Revisão · mais uma semana ---------- */
  var stay = '<div class="xd-win" data-pillar="accent">' +
    '<div class="xd-winc xd-stay"><span class="xd-emb2">' + ico('plant') + '</span>' +
      '<span class="eyebrow">Fase 2 · Alimentação</span><h1 class="xd-big2">Mais uma semana</h1>' +
      '<p class="sub muted center">A fase 2 segue até domingo, 8 de novembro. Firmar o que já começou também é avançar.</p></div>' +
    '<div class="pad stack xd-foot" style="gap:14px">' + lg([
        li({ ic: 'pencil-simple', p: 'accent', t: 'Seu ajuste da semana', s: 'Começar a desligar as telas às 20h45 para deitar no horário.', chev: false }),
        li({ ic: 'path', p: 'accent', t: 'Fase 3 · Movimento', s: 'O convite volta na Revisão da semana de 8 nov.', chev: false })
      ]) +
      btn('Ver meu dia', { w: true }) +
    '</div></div>';

  addFrame('jornada', 'Revisão · mais uma semana',
    'O outro final da revisão, sem confete e com o mesmo cuidado do primeiro. Mostra a nova data da fase 2 e quando o convite volta, para a escolha não parecer um passo para trás.',
    phone({ time: '18:34', body: stay }));
})();
