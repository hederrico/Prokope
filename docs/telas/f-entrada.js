/* Entrada e Computador · login, primeiro acesso em 3 passos e o Hoje no PC (Grupo A · prefixo .xa-)
   Usa os componentes da base (stepTop, addRow, tval, days, tag, .opt e radio, fold, doPill, plusBtn, addPill, semTile).
   Ficam aqui só o que a base não tem: a ilustração da entrada, a roda de horário, a barra lateral do PC e a tecla (.xa-kbd). */
(function () {
  addCSS(
    /* ---------- entrar ---------- */
    '.xa-hero { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 32px; text-align: center; }' +
    '.xa-art { position: relative; width: 264px; height: 260px; margin-bottom: 32px; }' +
    '.xa-art::before { content: ""; position: absolute; inset: -40px -64px; border-radius: 50%; background: radial-gradient(closest-side, color-mix(in oklch, var(--accent-wash) 90%, transparent), transparent); }' +
    '.xa-art svg { position: relative; display: block; overflow: visible; }' +
    '.xa-trail { fill: none; stroke: var(--border-strong); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 5 8; }' +
    '.xa-walked { fill: none; stroke: var(--accent-mark); stroke-width: 4; stroke-linecap: round; }' +
    '.xa-pt { fill: var(--fill); stroke: var(--mark); stroke-width: 2; }' +
    '.xa-start { fill: var(--accent-mark); }' +
    '.xa-end { fill: none; stroke: var(--border-strong); stroke-width: 2; }' +
    '.xa-halo { fill: color-mix(in oklch, var(--accent-fill) 55%, transparent); }' +
    '.xa-here { fill: var(--accent-ink); stroke: var(--bg); stroke-width: 2; }' +
    '.xa-brand { font: 430 58px/1 var(--font-display); font-variation-settings: var(--display-vs); letter-spacing: -.025em; }' +
    '.xa-hero .xa-greek { margin-top: 10px; font: italic 400 22px/28px var(--font-display); color: var(--accent-ink); letter-spacing: .02em; }' +
    '.xa-hero .xa-tag { margin-top: 22px; font: 500 18px/24px var(--font-ui); color: var(--text); }' +
    '.xa-hero .xa-what { margin-top: 6px; font: 400 16px/22px var(--font-ui); color: var(--text-2); }' +
    '.xa-foot { flex: none; display: flex; flex-direction: column; gap: 14px; padding: 12px 24px 46px; }' +
    '.xa-legal { display: flex; justify-content: center; align-items: center; gap: 6px; font: 400 13px/18px var(--font-ui); color: var(--text-2); text-align: center; }' +
    '.xa-legal i { font-size: 15px; }' +

    /* ---------- primeiro acesso ---------- */
    '.xa-head { flex: none; display: flex; flex-direction: column; gap: 8px; padding: 14px 20px 4px; }' +
    '.xa-body { flex: none; display: flex; flex-direction: column; gap: 12px; padding: 20px 16px 0; }' +
    '.xa-o { align-items: start; padding: 16px; border-radius: 20px; }' +
    '.xa-o > span:first-child { display: flex; flex-direction: column; gap: 12px; }' +
    '.xa-oh { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 12px; align-items: center; }' +
    '.xa-oh b { display: block; margin-bottom: 3px; font: 600 17px/22px var(--font-ui); }' +
    '.xa-oh .bub.nt { background: var(--sunken); color: var(--text-2); }' +
    '.xa-o p { font: 400 15px/21px var(--font-ui); color: var(--text-2); }' +
    '.xa-o .radio { margin-top: 9px; }' +
    '.xa-pd { display: flex; flex-wrap: wrap; gap: 6px; }' +
    '.xa-pd .tag { background: var(--surface); }' +
    '.xa-lk { color: var(--accent-ink); font-weight: 600; }' +
    '.xa-pil .hr { padding-bottom: 8px; }' +
    '.xa-pc { padding: 0 14px 14px; }' +
    '.xa-col-l { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 14px; border-top: 1px solid var(--border); }' +
    '.xa-col-l .li { padding: 0; min-height: 0; }' +
    '.xa-cta { flex: none; display: flex; flex-direction: column; gap: 10px; padding: 12px 16px 44px; }' +
    '.xa-cta .foot { padding-top: 0; }' +
    /* roda do iPhone presa ao valor (desenho aproximado: quem desenha é o sistema, pelo campo de horário nativo) */
    '.xa-pop { position: absolute; z-index: 7; top: 522px; right: 26px; width: 236px; padding: 6px 0; border-radius: 14px; background: color-mix(in oklch, var(--raised) 94%, transparent); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); box-shadow: var(--shadow-2), 0 0 0 .5px var(--border-strong); }' +
    '.xa-wheel { position: relative; display: grid; grid-template-columns: 1fr 1fr; height: 180px; padding: 0 34px; overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 30%, #000 70%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0, #000 30%, #000 70%, transparent 100%); }' +
    '.xa-band { position: absolute; left: 10px; right: 10px; top: 50%; height: 38px; margin-top: -19px; border-radius: 9px; background: var(--sunken); }' +
    '.xa-wc { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; }' +
    '.xa-wc span { height: 36px; display: grid; place-items: center; font: 400 21px/1 var(--font-ui); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xa-wc span.on { font: 500 23px/1 var(--font-ui); color: var(--text); }' +
    '.tval.xa-act { background: var(--accent-wash); box-shadow: inset 0 0 0 1.5px var(--accent-mark); color: var(--accent-ink); }' +

    /* ---------- computador ---------- */
    '.xa-dk { flex: 1; min-height: 0; display: grid; grid-template-columns: 232px minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }' +
    '.xa-side { display: flex; flex-direction: column; gap: 2px; padding: 22px 14px 18px; background: color-mix(in oklch, var(--sunken) 55%, var(--bg)); border-right: 1px solid var(--border); }' +
    '.xa-logo { display: flex; align-items: center; gap: 10px; padding: 0 8px 18px; }' +
    '.xa-logo b { font: 480 23px/1 var(--font-display); font-variation-settings: var(--display-vs); letter-spacing: -.01em; }' +
    '.xa-mk { width: 32px; height: 32px; flex: none; border-radius: 10px; background: var(--accent-wash); display: grid; place-items: center; }' +
    '.xa-mk svg { display: block; overflow: visible; }' +
    '.xa-mt { fill: none; stroke: var(--accent-mark); stroke-width: 1.8; stroke-linecap: round; stroke-dasharray: 1.4 3.4; }' +
    '.xa-md { fill: none; stroke: var(--accent-ink); stroke-width: 2.2; stroke-linecap: round; }' +
    '.xa-mc { fill: var(--accent-ink); }' +
    '.xa-cmd { display: flex; align-items: center; gap: 10px; min-height: 40px; margin-bottom: 14px; padding: 0 8px 0 12px; border-radius: 11px; background: var(--surface); box-shadow: inset 0 0 0 1px var(--border); font: 500 15px/1 var(--font-ui); color: var(--text-2); }' +
    '.xa-cmd > i { font-size: 18px; color: var(--accent-ink); }' +
    '.xa-cmd .xa-kbd { margin-left: auto; }' +
    '.xa-kbd { display: inline-flex; align-items: center; justify-content: center; gap: 3px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 6px; background: var(--sunken); box-shadow: inset 0 -1px 0 var(--border-strong), inset 0 0 0 1px var(--border); font: 600 11px/1 var(--font-ui); color: var(--text-2); white-space: nowrap; }' +
    '.xa-kbd i { font-size: 12px; }' +
    '.xa-nav { display: flex; align-items: center; gap: 11px; min-height: 40px; padding: 0 10px; border-radius: 11px; font: 500 15px/1 var(--font-ui); color: var(--text-2); }' +
    '.xa-nav i { font-size: 20px; }' +
    '.xa-nav.on { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: var(--shadow-1); }' +
    '.xa-nav.on i { color: var(--accent-ink); }' +
    '.xa-sl { display: flex; justify-content: space-between; align-items: baseline; padding: 24px 10px 6px; font: 600 11px/14px var(--font-ui); letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); }' +
    '.xa-sl span { font: 500 11px/14px var(--font-ui); letter-spacing: 0; text-transform: none; }' +
    '.xa-pl { display: flex; align-items: center; gap: 10px; min-height: 34px; padding: 0 10px; font: 500 14px/1 var(--font-ui); color: var(--text); }' +
    '.xa-pl i { width: 10px; height: 10px; flex: none; border-radius: 50%; background: var(--fill); box-shadow: inset 0 0 0 1.5px var(--mark); }' +
    '.xa-pl span { margin-left: auto; font: 500 13px/1 var(--font-ui); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xa-keys { margin-top: auto; display: flex; align-items: center; gap: 8px; padding: 8px 10px; font: 500 13px/1 var(--font-ui); color: var(--text-3); }' +
    '.xa-main { min-width: 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 20px; padding: 26px 32px 24px; }' +
    '.xa-mh { display: flex; align-items: center; justify-content: space-between; gap: 24px; }' +
    '.xa-mh .lt { font-size: 36px; line-height: 42px; margin-top: 2px; }' +
    '.xa-date { font: var(--t-sub); color: var(--text-2); }' +
    '.xa-wk { width: 420px; flex: none; }' +
    '.xa-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; align-items: start; }' +
    '.xa-col { min-width: 0; display: flex; flex-direction: column; gap: 18px; }' +
    '.xa-sec { display: flex; flex-direction: column; gap: 10px; }' +
    '.xa-sec > .gl { padding-bottom: 0; }' +
    '.xa-dk .hr { padding: 6px 16px; }' +
    '.xa-hov { position: relative; background: color-mix(in oklch, var(--sunken) 70%, var(--surface)); }' +
    '.xa-hov .chk { border-color: var(--mark); color: color-mix(in oklch, var(--mark) 55%, transparent); }' +
    '.xa-cur { position: absolute; right: 12px; bottom: 0; font-size: 20px; color: var(--text); filter: drop-shadow(0 0 1.5px var(--surface)) drop-shadow(0 1px 2px oklch(0% 0 0 / .25)); }' +
    '.xa-t { font: 600 16px/20px var(--font-ui); }' +
    '.xa-water .ringbox .rc { color: var(--ink); font-size: 18px; }' +
    /* registrar pelo teclado (Ctrl K) */
    '.xa-pal { position: absolute; z-index: 8; top: 96px; left: 50%; width: 600px; margin-left: -184px; display: flex; flex-direction: column; border-radius: 20px; background: var(--raised); box-shadow: var(--shadow-2), 0 0 0 1px var(--border); overflow: hidden; }' +
    '.xa-pin { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 0 16px 0 18px; border-bottom: 1px solid var(--border); font: 400 18px/1 var(--font-ui); color: var(--text-3); }' +
    '.xa-pin > i { font-size: 22px; color: var(--text-2); }' +
    '.xa-pin .xa-kbd { margin-left: auto; }' +
    '.xa-caret { width: 2px; height: 24px; margin-right: -8px; border-radius: 1px; background: var(--accent-mark); }' +
    '.xa-pr { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 12px; align-items: center; min-height: 54px; margin: 0 8px; padding: 8px 10px; border-radius: 12px; }' +
    '.xa-pr.on { background: var(--accent-wash); }' +
    '.xa-pr b { display: block; font: 500 15px/20px var(--font-ui); }' +
    '.xa-pr small { display: block; font: var(--t-caption); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xa-pr.on small { color: var(--text-2); }' +
    '.xa-pv { font: 600 14px/1 var(--font-ui); color: var(--ink); font-variant-numeric: tabular-nums; }' +
    '.xa-pks { display: flex; gap: 4px; }' +
    '.xa-pal > .gl { padding: 14px 18px 6px; }' +
    '.xa-pf { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 8px; padding: 12px 18px; border-top: 1px solid var(--border); font: var(--t-caption); color: var(--text-3); }' +
    '.xa-pf span { display: inline-flex; align-items: center; gap: 6px; }'
  );

  /* ---------- peças do primeiro acesso ---------- */
  function head(n, title, lead) {
    return '<div class="xa-head"><span class="eyebrow">Passo ' + n + ' de 3</span><h1 class="lt">' + title + '</h1><p class="lead">' + lead + '</p></div>';
  }
  function cta(label, cap, flat) {
    return (flat ? '' : '<div class="spacer"></div>') + '<div class="xa-cta">' + btn(label, { w: true }) + (cap ? '<p class="foot c">' + cap + '</p>' : '') + '</div>';
  }

  /* ---------- 1 · entrar ---------- */
  var TRAIL = 'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 110 70 110 70 88 C70 71 166 71 166 54 C166 40 146 30 124 30';
  var WALKED = 'M120 222 C86 222 46 206 46 184 C46 158 194 158 194 132 C194 125.4 182.8 120.8 167.2 117';
  var art = '<div class="xa-art"><svg viewBox="0 0 240 236" width="264" height="260" aria-hidden="true">' +
    '<path class="xa-trail" d="' + TRAIL + '"/><path class="xa-walked" d="' + WALKED + '"/>' +
    '<circle class="xa-start" cx="120" cy="222" r="4.5"/><circle class="xa-end" cx="124" cy="30" r="4"/>' +
    [['mente', 46, 184], ['alim', 194, 132], ['corpo', 70, 88], ['familia', 166, 54]].map(function (p) {
      return '<circle class="xa-pt" data-pillar="' + p[0] + '" cx="' + p[1] + '" cy="' + p[2] + '" r="9"/>';
    }).join('') +
    '<circle class="xa-halo" cx="167.2" cy="117" r="11.5"/><circle class="xa-here" cx="167.2" cy="117" r="5.5"/>' +
    '</svg></div>';

  var login = '<div class="xa-hero">' + art +
    '<h1 class="xa-brand">Prokopē</h1><p class="xa-greek" lang="el">προκοπή</p>' +
    '<p class="xa-tag">Um pouco de progresso, todo dia.</p>' +
    '<p class="xa-what">Poucos hábitos por vez, no seu ritmo.</p></div>' +
    '<div class="xa-foot">' + btn('Entrar com Google', { kind: 's', w: true, icon: 'google-logo' }) +
    '<p class="xa-legal">' + ico('lock-simple', 'regular') + 'Seus registros ficam na sua conta. Ninguém mais vê.</p></div>';

  addFrame('entrada', 'Entrar',
    'Em cinco segundos a tela diz o que é (hábitos, poucos por vez) e quem vê (só você). O login é só com Google e funciona também no app instalado na Tela de Início do iPhone.',
    phone({ time: '7:02', body: login }));

  /* ---------- 2 · como começar ---------- */
  var pdots = '<span class="xa-pd">' + [['mente', 'Mente'], ['alim', 'Alimentação'], ['corpo', 'Corpo'], ['familia', 'Família']].map(function (p) {
    return tag(p[1], { p: p[0], dot: true });
  }).join('') + '</span>';

  var start = stepTop(1, 3) + head(1, 'Como você quer começar?', 'Dá para mudar tudo depois, em Ajustes.') +
    '<div class="xa-body" role="radiogroup" aria-label="Como começar">' +
      '<div class="opt on xa-o"><span><span class="xa-oh"><span class="bub" data-pillar="accent">' + ico('path') + '</span>' +
        '<span><b>Com o plano base</b>' + tag('Sugerido', { p: 'accent' }) + '</span></span>' +
        '<p>4 pilares e 7 hábitos para começar. No próximo passo, você escolhe quais ficam.</p>' + pdots + '</span>' + radio(true) + '</div>' +
      '<div class="opt xa-o"><span><span class="xa-oh"><span class="bub nt">' + ico('pencil-simple-line') + '</span>' +
        '<span><b>Do zero</b></span></span>' +
        '<p>Você cria pilares e hábitos, um de cada vez.</p></span>' + radio(false) + '</div>' +
      '<p class="foot" style="padding:4px 8px 0">' + ico('footprints', 'regular') + 'Os hábitos chegam aos poucos, em fases de 3 semanas. Você decide quando avançar.</p>' +
    '</div>' + '<div class="spacer"></div><div class="xa-cta">' + btn('Continuar', { w: true }) +
    '<p class="foot c">Entrou como Henrique · <span class="xa-lk hit" role="button">Trocar de conta</span></p></div>';

  addFrame('entrada', 'Começar · 1 de 3',
    'O plano base deixa o primeiro dia pronto, e o passo seguinte mostra cada hábito que vem nele. Embaixo fica a conta que entrou, para quem divide o computador ou errou de conta.',
    phone({ time: '7:03', body: start }));

  /* ---------- 3 · pilares e hábitos ---------- */
  function hab(t, on, small) {
    return chip(t, { tint: on, icon: on ? 'check' : 'plus', small: small }).replace('<span class="chip', '<span role="button" aria-pressed="' + on + '" class="chip');
  }
  function pil(p, ic, name, later, chips) {
    return '<div class="xa-pil" data-pillar="' + p + '">' + hr({ p: p, ic: ic, t: name, s: later, r: sw(true, name + ' no plano') }) +
      '<div class="chips xa-pc">' + chips + '</div></div>';
  }
  var pillars = stepTop(2, 3, { back: true }) + head(2, 'Seus pilares', 'Escolha o que entra agora. Os outros hábitos chegam nas próximas fases.') +
    '<div class="xa-body"><div class="card lst">' +
      pil('mente', 'moon-stars', 'Mente', 'Depois: ritual do sono e silêncio',
        hab('Acordar e deitar', true) + hab('Telas às 21h', true) + hab('Check-in', true) + hab('Sem Shorts e TikTok', false)) +
      pil('alim', 'bowl-food', 'Alimentação', 'Depois: proteína, água, refeições', hab('Zero refrigerante', true)) +
      pil('corpo', 'person-simple-run', 'Corpo', 'Depois: academia e corrida', hab('Caminhada', true, 'também em Família')) +
      pil('familia', 'heart', 'Família', 'Depois: programa a dois',
        hab('Louça', true) + hab('Lixo e recicláveis', true) + hab('Caminhada com o cachorro', true)) +
    '</div>' +
    addRow('Criar outro pilar') +
    '<p class="foot" style="padding:0 6px">Toque no nome de um pilar para mudar a cor ou o ícone. Pilar fora do plano fica arquivado, com os hábitos guardados.</p></div>' +
    cta('Continuar', '7 hábitos escolhidos', true);

  addFrame('entrada', 'Seus pilares · 2 de 3',
    'Cada hábito do plano aparece no seu pilar e sai com um toque, então quem tem outra rotina não herda o plano de outra pessoa. Tela com rolagem e botão fixo embaixo, mostrada inteira.',
    phone({ time: '7:04', tall: true, body: pillars }));

  /* ---------- 4 · rotina ---------- */
  var coleta = '<div class="xa-col-l">' +
    li({ ic: 'trash', p: 'familia', t: 'Coleta do lixo', s: 'o lixo entra no Hoje nesses dias', right: '<span></span>' }) +
    days([0, 3], { p: 'familia', label: 'Dias de coleta do lixo' }) + '</div>';

  function routineBody(flat, active, short) {
    function tv(t, key) { var h = tval(t); return key === active ? h.replace('class="tval', 'class="tval xa-act') : h; }
    return stepTop(3, 3, { back: true }) + head(3, 'Sua rotina', 'Toque num horário para ajustar ao seu ritmo.') +
      '<div class="xa-body">' +
        lg([
          li({ ic: 'alarm', p: 'mente', t: 'Acordar', s: 'até 15 min de diferença conta', right: tv('06:50', 'acordar') }),
          li({ ic: 'broom', p: 'familia', t: 'Tarefas da casa', s: 'louça e lixo', right: tv('20:30', 'casa') }),
          li({ ic: 'sparkle', p: 'mente', t: 'Check-in', s: 'humor, energia e 3 coisas boas', right: tv('20:30', 'checkin') }),
          li({ ic: 'device-mobile-slash', p: 'mente', t: 'Telas desligadas', s: '1h antes de deitar', right: tv('21:00', 'telas') }),
          li({ ic: 'moon-stars', p: 'mente', t: 'Deitar', s: '8h50 até acordar', right: tv('22:00', 'deitar') })
        ]) +
        '<div class="insight" data-pillar="accent">' + ico('sun-horizon') + '<p>No fim de semana, até 1h de diferença conta como feito.</p></div>' +
        (short ? '' : '<div class="lg">' +
          li({ ic: 'calendar-check', t: 'Revisão da semana', s: 'resumo em 3 passos', right: tv('dom, 18:00', 'revisao') }) +
          coleta +
        '</div>') +
      '</div>' + cta('Começar a fase 1', 'Fase 1 · Base · 7 hábitos · começa hoje', flat);
  }

  addFrame('entrada', 'Sua rotina · 3 de 3',
    'Os horários viram metas com folga, e o que chega perto conta como feito. O botão abre direto o primeiro Hoje, com os 7 hábitos já no lugar. Tela com rolagem, mostrada inteira.',
    phone({ time: '7:05', tall: true, body: routineBody(true) }));

  /* ---------- 4b · ajustar um horário: a roda do próprio iPhone, presa ao valor ---------- */
  function wcol(list, sel) { return '<div class="xa-wc" aria-hidden="true">' + list.map(function (v, i) { return '<span class="' + (i === sel ? 'on' : '') + '">' + v + '</span>'; }).join('') + '</div>'; }
  var wheelPop = '<div class="xa-pop" aria-hidden="true"><div class="xa-wheel"><span class="xa-band"></span>' +
    wcol(['20', '21', '22', '23', '00'], 2) + wcol(['58', '59', '00', '01', '02'], 2) + '</div></div>';

  addFrame('entrada', 'Sua rotina · ajustar horário',
    'Tocar num horário abre a roda do próprio iPhone, presa ao valor (o campo de horário nativo), sem folha nem botão de salvar. As telas desligadas acompanham o horário de deitar enquanto você não muda as duas separadamente.',
    phone({ time: '7:05', body: routineBody(false, 'deitar', true), overlay: wheelPop }));

  /* ---------- 5 · computador ---------- */
  var mark = '<span class="xa-mk"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
    '<path class="xa-mt" d="M7 21 C7 16.5 17 16.5 17 12 C17 7.5 7 7.5 7 3"/><path class="xa-md" d="M7 21 C7 16.5 17 16.5 17 12"/>' +
    '<circle class="xa-mc" cx="17" cy="12" r="2.6"/></svg></span>';
  function kbd(t) { return '<span class="xa-kbd">' + t + '</span>'; }

  var side = '<aside class="xa-side" aria-label="Seções">' +
    '<div class="xa-logo">' + mark + '<b>Prokopē</b></div>' +
    '<div class="xa-cmd" role="button" aria-keyshortcuts="Control+K">' + ico('plus-circle', 'regular') + 'Registrar' + kbd('Ctrl K') + '</div>' +
    [['sun', 'Hoje', 1], ['chart-line-up', 'Progresso'], ['path', 'Jornada'], ['gear-six', 'Ajustes']].map(function (n) {
      return '<span class="xa-nav' + (n[2] ? ' on' : '') + '" role="link"' + (n[2] ? ' aria-current="page"' : '') + '>' + ico(n[0], n[2] ? 'fill' : 'regular') + n[1] + '</span>';
    }).join('') +
    '<div class="xa-sl">Pilares<span>esta semana</span></div>' +
    [['mente', 'Mente', 82], ['alim', 'Alimentação', 64], ['corpo', 'Corpo', 71], ['familia', 'Família', 88]].map(function (p) {
      return '<span class="xa-pl" role="link" data-pillar="' + p[0] + '"><i></i>' + p[1] + '<span>' + p[2] + '%</span></span>';
    }).join('') +
    '<div class="xa-keys">' + kbd('?') + 'Atalhos do teclado</div>' +
    '</aside>';

  function sec(label, body, right) { return '<div class="xa-sec"><div class="gl in">' + label + (right ? '<span>' + right + '</span>' : '') + '</div>' + body + '</div>'; }
  function limit(ic, t, used, total, label) {
    return hr({ p: 'alim', ic: ic, t: t, s: slots(total, used, 'used') + '<span class="num">' + used + ' de ' + total + '</span>na semana', r: plusBtn(label) });
  }

  var futebol = hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · 0 de 1 na semana', r: chk(false, 'Futebol') })
    .replace('class="hr"', 'class="hr xa-hov"').replace(/<\/div>$/, '<span class="xa-cur" aria-hidden="true">' + ico('cursor', 'fill') + '</span></div>');

  var protein = '<div class="card p stack" data-pillar="alim" style="gap:8px">' +
    '<div class="between"><span class="row"><span class="bub sm">' + ico('egg') + '</span><b class="xa-t">Proteína</b></span>' +
    '<span class="sub num"><b>46 g</b> <span class="faint">de 80 g</span></span></div>' +
    pbar([18, 6, 22], 120, 80, 'meta 80 g') +
    '<div class="qa">' + [['Frango', 30], ['Feijão', 7], ['Queijo', 5]].map(function (f) {
      return '<span class="q" role="button" aria-label="Somar ' + f[0] + ', ' + f[1] + ' gramas"><b>' + f[0] + '</b><small>+' + f[1] + ' g</small></span>';
    }).join('') + '<span class="q more" role="button">' + ico('dots-three', 'bold') + '<small>Mais</small></span></div></div>';

  var water = '<div class="card hr xa-water" data-pillar="alim">' + ringBox(40, 5, 1.5 / 3, ico('drop'), 'var(--mark)', 'var(--wash)') +
    '<span class="ht"><b>Água</b><small class="num">1,5 L de 3 L</small></span>' +
    '<span class="row" style="gap:6px">' + addPill('500 ml') + addPill('1 L') + '</span></div>';

  var left = '<div class="xa-col">' +
    sec('Manhã', fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'peso, acordar e caminhada')) +
    sec('Ao longo do dia', protein + water +
      '<div class="card lst">' + hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: doPill('Dar nota') }) + futebol + '</div>') +
    sec('Noite', fold(['broom|familia', 'trash|familia', 'bowl-food|alim'], 3, '6 hábitos', 'louça, lixo, jantar e mais 3'), 'a partir das 20h30') +
    '</div>';

  var insight = '<div class="insight" data-pillar="familia">' + ico('salsicha') +
    '<div><p>Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.</p><small>24 dias com · 8 dias sem</small></div></div>';

  var right = '<div class="xa-col">' +
    sec('Limites da semana', '<div class="card lst">' + limit('pizza', 'Refeições livres', 0, 2, 'Usar uma refeição livre') + limit('cookie', 'Tranqueiras', 1, 2, 'Usar uma tranqueira') + '</div>') +
    sec('Dias sem', '<div class="dsr">' +
      semTile('alim', 'pint-glass', 12, 'refrigerante', '<span class="cap">recorde 21</span>') +
      semTile('mente', 'video-camera-slash', 32, 'Shorts e TikTok', '<span class="cap rec">' + ico('trophy', 'regular') + 'seu recorde</span>') + '</div>') +
    insight + '</div>';

  var main = '<main class="xa-main">' +
    '<div class="xa-mh"><div><span class="xa-date">Quinta, 22 de outubro</span><h1 class="lt">Boa tarde, Henrique</h1></div>' +
      '<div class="xa-wk">' + weekCard(4, 76, [0.83, 0.75, 0.6, 4 / 12, 0, 0, 0]) + '</div></div>' +
    '<div class="xa-cols">' + left + right + '</div>' +
    '</main>';

  addFrame('computador', 'Computador · Hoje',
    'Às 12h41, com os mesmos números e as mesmas regras do Hoje do celular nessa hora: a coluna da esquerda é o dia, e a da direita o que não tem hora. A linha sob o mouse antecipa o check, e as setas com Espaço fazem o mesmo pelo teclado.',
    '<div class="phone desk"><div class="xa-dk">' + side + main + '</div></div>', { desk: true });

  /* ---------- 6 · computador · registrar pelo teclado ---------- */
  function prow(p, ic, t, s, rt, on) {
    return '<div class="xa-pr' + (on ? ' on' : '') + '" role="option" aria-selected="' + !!on + '" data-pillar="' + p + '"><span class="bub sm">' + ico(ic) + '</span><span><b>' + t + '</b><small>' + s + '</small></span>' + rt + '</div>';
  }
  var palette = '<div class="dim" aria-hidden="true"></div><div class="xa-pal" role="dialog" aria-modal="true" aria-label="Registrar">' +
    '<div class="xa-pin">' + ico('magnifying-glass', 'regular') + '<span class="xa-caret"></span>Registrar ou buscar um hábito' + kbd('Esc') + '</div>' +
    '<div class="gl in">Para agora</div><div role="listbox" aria-label="Para agora">' +
    prow('alim', 'fork-knife', 'Nota do almoço', 'aperte de 1 a 5', '<span class="xa-pks">' + kbd('1') + kbd('2') + kbd('3') + kbd('4') + kbd('5') + '</span>', true) +
    prow('alim', 'egg', 'Frango', 'proteína · 46 de 80 g', '<span class="xa-pv">+30 g</span>') +
    prow('alim', 'drop', 'Água', '1,5 L de 3 L', '<span class="xa-pv">+500 ml</span>') +
    prow('corpo', 'soccer-ball', 'Futebol', 'hoje · 0 de 1 na semana', '<span class="xa-pv">marcar</span>') + '</div>' +
    '<div class="xa-pf"><span>' + kbd(ico('arrow-up', 'bold')) + kbd(ico('arrow-down', 'bold')) + 'escolher</span><span>' + kbd(ico('arrow-elbow-down-left', 'bold')) + 'registrar</span>' +
      '<span>' + kbd('Ctrl Z') + 'desfazer</span><span>' + kbd('?') + 'todos os atalhos</span></div>' +
    '</div>';

  addFrame('computador', 'Computador · registrar pelo teclado',
    'Ctrl K abre de qualquer tela. Sem digitar nada, aparecem os registros mais prováveis para a hora; ao digitar, a lista filtra por hábito e alimento, e Enter registra com o aviso de desfazer embaixo.',
    '<div class="phone desk"><div class="xa-dk">' + side + main + '</div>' + palette + '</div>', { desk: true });
})();
