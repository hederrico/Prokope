/* Registros rápidos · folhas que abrem a partir do Hoje (proteína, água, deitar e acordar, almoço, check-in, deslize, peso)
   Regra das folhas:
   - folha que soma (proteína, água): cada toque já salva e a folha fica aberta; sem botão Salvar.
     A linha nova entra na lista com um − visível, que tira uma porção: é o desfazer dentro da folha.
   - folha que responde uma pergunta (deitar e acordar, nota, check-in, peso, deslize): um único botão no pé,
     que repete a escolha, salva e fecha. Depois de fechar, a tela de origem mostra Desfazer por 5 s.
   - todas têm alça, título com a bolha do pilar e X. Com teclado, o botão fica preso acima dele e o conteúdo rola. */
(function () {
  var date = 'Quinta, 22 de outubro';
  var VALS = [0.83, 0.75, 0.6];

  addCSS(
    '.xb-bg { padding-bottom: 24px; }' +
    /* título da folha com bolha do pilar */
    '.xb-ttl { display: flex; align-items: center; gap: 10px; }' +
    '.xb .pb { --sep: var(--raised); }' +
    '.xb-sheet .foot { padding: 0 4px; }' +
    /* lista do dia: cada linha tem um − visível para tirar uma porção */
    '.xb-list { background: var(--sunken); border-radius: 16px; }' +
    '.xb-list > * + * { border-top: 1px solid var(--border); }' +
    '.xb-it { display: grid; grid-template-columns: 42px 28px minmax(0, 1fr) auto 32px; gap: 10px; align-items: center; min-height: 52px; padding: 6px 10px 6px 14px; }' +
    '.xb-it time { font: 500 13px/1 var(--font-ui); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xb-it b { font: 500 16px/20px var(--font-ui); }' +
    '.xb-it .v { font: 600 15px/1 var(--font-ui); font-variant-numeric: tabular-nums; }' +
    '.xb-xs { width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; font-size: 16px; background: var(--surface); color: var(--ink); }' +
    '.xb-min { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; background: var(--surface); color: var(--text-2); box-shadow: inset 0 0 0 1px var(--border-strong); }' +
    /* proteína: os botões rápidos da base (.qa .q), maiores e com ícone na folha */
    '.xb-sum { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }' +
    '.xb-sum .big { line-height: 44px; }' +
    '.xb-sum .big small { font: 600 24px/1 var(--font-ui); letter-spacing: 0; margin-left: 3px; }' +
    '.xb-sum .of { font: 500 17px/1 var(--font-ui); color: var(--text-3); margin-left: 8px; }' +
    '.xb-qa .q { min-height: 72px; border-radius: 16px; }' +
    '.xb-qa .q i { font-size: 22px; margin-bottom: 2px; color: var(--ink); }' +
    '.xb-qa .q.more i { color: var(--text-2); }' +
    /* água: dois botões grandes com a mesma peça .q */
    '.xb-ring { display: flex; justify-content: center; padding: 2px 0 4px; }' +
    '.xb-ring .rc { gap: 2px; }' +
    '.xb-ring .rc i { font-size: 24px; color: var(--ink); margin-bottom: 4px; }' +
    '.xb-ring .rc b { font: 600 38px/40px var(--font-ui); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }' +
    '.xb-two { grid-template-columns: 1fr 1fr; gap: 10px; }' +
    '.xb-two .q { min-height: 76px; border-radius: 20px; gap: 3px; }' +
    '.xb-two .q b { display: flex; align-items: center; gap: 6px; font: 600 20px/24px var(--font-ui); color: var(--ink); font-variant-numeric: tabular-nums; }' +
    '.xb-two .q b i { font-size: 18px; }' +
    '.xb-two .q small { font: var(--t-caption); color: var(--text-2); }' +
    /* deitar e acordar: retorno da meta em cada linha */
    '.xb-ok { display: inline-flex; align-items: center; gap: 4px; color: var(--success-ink); font-weight: 600; }' +
    '.xb-ok i { font-size: 13px; }' +
    /* nota: número dentro da opção da base (.opt) */
    '.xb-opts { display: flex; flex-direction: column; gap: 6px; }' +
    '.xb-opts .opt { min-height: 50px; padding: 8px 14px 8px 8px; }' +
    '.xb-o { display: flex; align-items: center; gap: 12px; font: 500 16px/20px var(--font-ui); }' +
    '.xb-o .n { width: 34px; height: 34px; flex: none; border-radius: 50%; border: 1.5px solid var(--border-strong); display: grid; place-items: center; font: 600 15px/1 var(--font-ui); color: var(--text-2); }' +
    '.opt.on .xb-o { font-weight: 600; color: var(--ink); }' +
    '.opt.on .xb-o .n { background: var(--fill); border-color: var(--mark); color: var(--on); }' +
    /* chips das folhas com 44 px de altura */
    '.xb-chips .chip { min-height: 44px; padding: 0 14px; }' +
    /* check-in */
    '.xb-grp { display: flex; flex-direction: column; }' +
    '.xb-grp .gl.in span { color: var(--text-3); }' +
    '.xb-gf { display: flex; flex-direction: column; gap: 8px; }' +
    '.xb-gf .fld { gap: 10px; }' +
    '.xb-n { width: 22px; height: 22px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--accent-wash); color: var(--accent-ink); font: 600 12px/1 var(--font-ui); }' +
    '.xb-gf .xb-ph { color: var(--text-3); }' +
    '.xb-gf .xb-ph .xb-n { background: transparent; color: var(--text-3); box-shadow: inset 0 0 0 1.5px var(--border-strong); }' +
    '.xb-gf .xb-on { background: var(--surface); box-shadow: inset 0 0 0 2px var(--accent-mark); }' +
    '.xb-caret { display: inline-block; width: 2px; height: 20px; margin-left: 1px; border-radius: 1px; background: var(--accent-mark); vertical-align: -4px; }' +
    /* deslize: números da base (.stats) sobre fundo afundado */
    '.xb-stats { border-radius: 18px; background: var(--sunken); }' +
    '.xb-stats .stat { display: flex; align-items: center; gap: 6px; }' +
    '.xb-stats .was { color: var(--text-3); font-weight: 500; }' +
    '.xb-stats .stat i { font-size: 16px; color: var(--text-3); }' +
    /* peso */
    '.xb-wbox { display: flex; align-items: center; justify-content: center; min-height: 92px; border-radius: 20px; background: var(--sunken); box-shadow: inset 0 0 0 2px var(--accent-mark); }' +
    '.xb-wbox .big { display: flex; align-items: baseline; font-size: 52px; line-height: 56px; }' +
    '.xb-wbox .xb-caret { width: 3px; height: 44px; margin: 0 2px 0 3px; align-self: center; }' +
    '.xb-wbox small { font: 600 22px/1 var(--font-ui); letter-spacing: 0; color: var(--text-3); margin-left: 4px; }' +
    /* folha sobre o teclado: o pé da folha encosta no topo do teclado; o meio rola */
    '.xb-kbs { padding-bottom: 12px; }' +
    '.xb-kbs.t { bottom: 342px; }' +
    '.xb-kbs.n { bottom: 292px; }' +
    '.xb-scroll { flex: 1; min-height: 0; overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 40px, #000 calc(100% - 16px), transparent 100%); mask-image: linear-gradient(to bottom, transparent 0, #000 40px, #000 calc(100% - 16px), transparent 100%); }' +
    '.xb-scroll > div { display: flex; flex-direction: column; gap: 16px; margin-top: -64px; }' +
    /* teclado do iPhone (desenho de referência) */
    '.xb-kb { position: absolute; left: 0; right: 0; bottom: 0; z-index: 8; background: var(--kb-bg); color: var(--kb-ink); font-family: -apple-system, system-ui, "Segoe UI", sans-serif;' +
      ' --kb-bg: oklch(86% .005 260); --kb-acc: oklch(93% .004 260); --kb-key: oklch(99.5% 0 0); --kb-fn: oklch(74% .007 260); --kb-ink: oklch(16% 0 0); --kb-dim: oklch(50% .01 260); --kb-line: oklch(80% .006 260); --kb-sh: oklch(45% .01 260 / .45); --kb-link: oklch(52% .19 258); }' +
    ':root[data-theme="dark"] .xb-kb { --kb-bg: oklch(24% .004 260); --kb-acc: oklch(27% .004 260); --kb-key: oklch(43% .004 260); --kb-fn: oklch(33% .004 260); --kb-ink: oklch(97% 0 0); --kb-dim: oklch(72% .006 260); --kb-line: oklch(33% .004 260); --kb-sh: oklch(0% 0 0 / .55); --kb-link: oklch(74% .13 258); }' +
    '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .xb-kb { --kb-bg: oklch(24% .004 260); --kb-acc: oklch(27% .004 260); --kb-key: oklch(43% .004 260); --kb-fn: oklch(33% .004 260); --kb-ink: oklch(97% 0 0); --kb-dim: oklch(72% .006 260); --kb-line: oklch(33% .004 260); --kb-sh: oklch(0% 0 0 / .55); --kb-link: oklch(74% .13 258); } }' +
    '.xb-acc { display: flex; align-items: center; gap: 24px; height: 44px; padding: 0 18px; background: var(--kb-acc); border-bottom: 1px solid var(--kb-line); font-size: 20px; color: var(--kb-dim); }' +
    '.xb-acc b { margin-left: auto; font: 600 17px/1 -apple-system, system-ui, sans-serif; color: var(--kb-link); }' +
    '.xb-pred { display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; height: 44px; }' +
    '.xb-pred span { text-align: center; font-size: 16px; line-height: 22px; }' +
    '.xb-pred span + span { border-left: 1px solid var(--kb-line); }' +
    '.xb-keys { display: flex; flex-direction: column; gap: 12px; padding: 4px 3px 0; }' +
    '.xb-kr { display: flex; justify-content: center; gap: 6px; }' +
    '.xb-kr.r3 { justify-content: space-between; }' +
    '.xb-kg { display: flex; gap: 6px; }' +
    '.xb-k { flex: 0 0 33px; height: 42px; border-radius: 5px; background: var(--kb-key); box-shadow: 0 1px 0 var(--kb-sh); display: grid; place-items: center; font-size: 22px; line-height: 1; }' +
    '.xb-k.fn { flex-basis: 43px; background: var(--kb-fn); font-size: 20px; }' +
    '.xb-k.sm { font-size: 16px; }' +
    '.xb-k.sp { flex: 1 1 auto; font-size: 16px; }' +
    '.xb-k.rt { flex-basis: 92px; }' +
    '.xb-kbot { display: flex; justify-content: space-between; align-items: flex-start; height: 46px; padding: 10px 24px 0; font-size: 25px; color: var(--kb-dim); }' +
    '.xb-np { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 6px; }' +
    '.xb-nk { height: 46px; border-radius: 5px; background: var(--kb-key); box-shadow: 0 1px 0 var(--kb-sh); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }' +
    '.xb-nk b { font-size: 25px; font-weight: 400; line-height: 26px; }' +
    '.xb-nk small { font-size: 11px; font-weight: 600; line-height: 12px; letter-spacing: .12em; }' +
    '.xb-nk.e { background: transparent; box-shadow: none; font-size: 24px; }' +
    '.xb-nk.e b { font-size: 28px; }' +
    '.xb-npb { height: 34px; }'
  );

  /* ---------- fundo: o Hoje novo, na hora de cada folha (regras do Hoje no SPEC) ---------- */
  function wk(n) { return '<div class="pad">' + weekCard(n, 76, VALS.concat([n / 12, 0, 0, 0])) + '</div>'; }
  var manhaFeita = fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'peso, acordar e caminhada');
  function bg(kind, n) {
    if (kind === 'cedo') {
      var acordou = n > 2;
      return '<div class="xb-bg">' + hd({ date: date, title: 'Bom dia, Henrique' }) + wk(n) + gl('Manhã') +
        '<div class="pad"><div class="card lst">' +
          hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: doPill('Registrar') }) +
          hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: acordou ? vpill('6h52', { icon: 'check' }) : doPill('Registrar'), done: acordou }) +
          hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, 2) + '2 de 7 · meta 6', r: chk(false, 'Caminhada com o cachorro') }) +
        '</div></div></div>';
    }
    if (kind === 'noite') {
      return '<div class="xb-bg">' + hd({ date: date, title: 'Boa noite, Henrique' }) + gl('Ainda hoje', '4') +
        '<div class="pad stack"><div class="card p stack" data-pillar="accent" style="background:var(--accent-wash);box-shadow:none;gap:14px">' +
          '<b style="font:600 16px/20px var(--font-ui)">Check-in do dia</b>' + rf('mood', 4) + '</div></div></div>';
    }
    var nota = n > 4 ? doPill('4 · Bom') : doPill('Dar nota');
    return '<div class="xb-bg">' + hd({ date: date, title: 'Boa tarde, Henrique' }) + wk(n) + gl('Manhã') +
      '<div class="pad">' + manhaFeita + '</div>' + gl('Ao longo do dia') +
      '<div class="pad"><div class="card lst">' +
        hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: nota }) +
        hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · 0 de 1 na semana', r: chk(false, 'Futebol') }) +
      '</div></div></div>';
  }
  function ttl(p, ic, text) { return '<span class="xb-ttl"><span class="bub sm" data-pillar="' + p + '">' + ico(ic) + '</span>' + text + '</span>'; }
  /* rótulo de grupo dentro da folha (.gl.in da base) */
  function gin(text, right) { return gl(text, right).replace('class="gl"', 'class="gl in"'); }
  function sh(title, body, o) { return sheet(title, body, o).replace('class="sheet"', 'class="sheet xb-sheet"'); }
  /* linha da lista do dia (a mais recente no topo): o − tira uma porção (Ovo × 3 vira × 2); na última porção, apaga a linha */
  function item(time, ic, name, val) {
    return '<div class="xb-it"><time>' + time + '</time><span class="xb-xs">' + ico(ic) + '</span><b>' + name + '</b>' +
      '<span class="v">' + (val || '') + '</span><span class="xb-min hit" role="button" aria-label="Tirar uma porção de ' + name + '">' + ico('minus', 'bold') + '</span></div>';
  }
  /* folha encostada no teclado: kind 't' (texto) ou 'n' (decimal) */
  function kbSheet(kind, title, body, o) { return sheet(title, body, o).replace('class="sheet"', 'class="sheet xb-sheet xb-kbs ' + kind + '"'); }
  function accBar() { return '<div class="xb-acc">' + ico('caret-up', 'bold') + ico('caret-down', 'bold') + '<b>OK</b></div>'; }
  function kbText(preds, ret) {
    function row(keys) { return keys.split('').map(function (k) { return '<span class="xb-k">' + k + '</span>'; }).join(''); }
    return '<div class="xb-kb" aria-hidden="true">' + accBar() +
      '<div class="xb-pred">' + preds.map(function (p) { return '<span>' + p + '</span>'; }).join('') + '</div>' +
      '<div class="xb-keys">' +
        '<div class="xb-kr">' + row('qwertyuiop') + '</div>' +
        '<div class="xb-kr">' + row('asdfghjkl') + '</div>' +
        '<div class="xb-kr r3"><span class="xb-k fn">' + ico('arrow-fat-up', 'regular') + '</span><span class="xb-kg">' + row('zxcvbnm') + '</span><span class="xb-k fn">' + ico('backspace', 'regular') + '</span></div>' +
        '<div class="xb-kr"><span class="xb-k fn sm">123</span><span class="xb-k fn">' + ico('smiley', 'regular') + '</span><span class="xb-k sp">espaço</span><span class="xb-k fn sm rt">' + ret + '</span></div>' +
      '</div>' +
      '<div class="xb-kbot">' + ico('globe', 'regular') + ico('microphone', 'regular') + '</div></div>';
  }
  /* teclado decimal (inputmode="decimal"): a vírgula fica no canto de baixo à esquerda */
  function kbDecimal() {
    var k = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
    return '<div class="xb-kb" aria-hidden="true">' + accBar() + '<div class="xb-np">' +
      k.map(function (x) { return '<span class="xb-nk"><b>' + x[0] + '</b><small>' + (x[1] || '&nbsp;') + '</small></span>'; }).join('') +
      '<span class="xb-nk e"><b>,</b></span><span class="xb-nk"><b>0</b></span><span class="xb-nk e">' + ico('backspace', 'regular') + '</span>' +
      '</div><div class="xb-npb"></div></div>';
  }

  /* ---------- 1. proteína ---------- */
  var foods = [['egg', 'Ovo', 6], ['cheese', 'Queijo', 5], ['coffee-bean', 'Feijão', 7], ['cow', 'Leite', 6],
    ['jar-label', 'Whey', 22], ['jar', 'Iogurte', 10], ['bird', 'Frango', 30]];
  var proteinSheet =
    '<div class="xb-sum" data-pillar="alim"><span><span class="big num">46<small>g</small></span><span class="of num">de 80 g</span></span>' + vpill('faltam 34 g') + '</div>' +
    '<div class="xb" data-pillar="alim">' + pbar([18, 6, 22], 100, 80, 'meta 80 g') + '</div>' +
    '<div>' + gin('Hoje', '− tira uma porção') +
      '<div class="xb-list" data-pillar="alim">' +
        item('10h30', 'jar-label', 'Whey', '22 g') + item('7h10', 'cow', 'Leite', '6 g') + item('7h10', 'egg', 'Ovo × 3', '18 g') +
      '</div></div>' +
    '<div class="qa xb-qa" data-pillar="alim">' + foods.map(function (f) {
      return '<span class="q" role="button" aria-label="Somar ' + f[1] + ', ' + f[2] + ' gramas">' + ico(f[0]) + '<b>' + f[1] + '</b><small>+' + f[2] + ' g</small></span>';
    }).join('') + '<span class="q more" role="button">' + ico('plus', 'bold') + '<b>Outro</b><small>digitar</small></span></div>';

  addFrame('registros', 'Proteína',
    'Cada toque salva na hora e a folha fica aberta, para registrar o café da manhã inteiro. Os botões ficam no pé, sempre no mesmo lugar, e o − de cada linha corrige um toque a mais sem gesto escondido.',
    phone({ time: '12:41', body: bg('tarde', 4), overlay: sh(ttl('alim', 'egg', 'Proteína'), proteinSheet) }));

  /* ---------- 2. água ---------- */
  var waterSheet =
    '<div class="xb-ring" data-pillar="alim">' + ringBox(184, 16, 1.5 / 3, ico('drop') + '<b>1,5 L</b><span class="cap num">de 3 L</span>', 'var(--mark)', 'var(--wash)') + '</div>' +
    '<div>' + gin('Hoje', '− tira uma porção') +
      '<div class="xb-list" data-pillar="alim">' + item('11h40', 'drop', 'Garrafa', '1 L') + item('8h05', 'drop', 'Garrafinha', '500 ml') + '</div></div>' +
    '<div class="qa xb-two" data-pillar="alim">' +
      '<span class="q" role="button" aria-label="Somar 500 mililitros"><b>' + ico('plus', 'bold') + '500 ml</b><small>garrafinha</small></span>' +
      '<span class="q" role="button" aria-label="Somar 1 litro"><b>' + ico('plus', 'bold') + '1 L</b><small>garrafa</small></span></div>';

  addFrame('registros', 'Água',
    'A mesma regra da proteína: cada toque salva, a folha fica aberta e o − desfaz um engano. Só dois tamanhos, no alcance do polegar, para registrar sem pensar.',
    phone({ time: '15:20', body: bg('tarde', 5), overlay: sh(ttl('alim', 'drop', 'Água'), waterSheet) }));

  /* ---------- 3. deitar e acordar (o deitar de ontem é marcado de manhã) ---------- */
  function ok(t) { return '<span class="xb-ok">' + ico('check-circle', 'bold') + t + '</span>'; }
  var wakeSheet =
    '<p class="lead">O deitar de ontem vem junto, para o celular ficar longe à noite.</p>' +
    '<div class="lg" data-pillar="mente">' +
      li({ ic: 'moon-stars', p: 'mente', t: 'Deitei ontem', s: 'meta 22h · ' + ok('conta como feito'), right: tval('22:15', { raised: true }) }) +
      li({ ic: 'alarm', p: 'mente', t: 'Acordei hoje', s: 'meta 6h50 · ' + ok('conta como feito'), right: tval('06:52', { raised: true }) }) +
    '</div>' +
    '<p class="foot">' + ico('info', 'regular') + 'Até 15 min de diferença da meta conta como feito.</p>' +
    btn('Salvar <span class="num">22h15 e 6h52</span>', { w: true });

  addFrame('registros', 'Acordei às',
    'Uma folha só para as duas horas: o acordar abre no horário de agora e o deitar na meta, e cada valor abre a roda nativa do iPhone. O botão repete as duas horas, salva e fecha.',
    phone({ time: '6:58', body: bg('cedo', 2), overlay: sh(ttl('mente', 'alarm', 'Deitar e acordar'), wakeSheet) }));

  /* ---------- 4. nota do almoço ---------- */
  var grades = ['Improvisado', 'Fraco', 'Ok', 'Bom', 'Completo'];
  var lunchSheet =
    '<div class="xb-opts" data-pillar="alim" role="radiogroup" aria-label="Nota do almoço">' + grades.map(function (g, i) {
      return '<div class="opt' + (i === 3 ? ' on' : '') + '"><span class="xb-o"><span class="n">' + (i + 1) + '</span>' + g + '</span>' + radio(i === 3) + '</div>';
    }).join('') + '</div>' +
    '<div class="xb-grp" data-pillar="alim">' + gin('Neste almoço', 'opcional') + '<div class="chips xb-chips">' +
      chip('Proteína', { tint: true, icon: 'check', sel: true }) + chip('Salada ou legume', { tint: true, icon: 'check', sel: true }) +
      chip('Carboidrato', { tint: true, icon: 'check', sel: true }) + chip('Sentado, sem tela', { icon: 'plus', iw: 'regular', sel: false }) +
    '</div></div>' +
    btn('Salvar nota 4', { w: true });

  addFrame('registros', 'Nota do almoço',
    'Cada nota tem uma palavra, para ninguém precisar decorar a escala. O que teve no prato é opcional, e o botão repete a nota antes de salvar e fechar. O jantar usa a mesma folha.',
    phone({ time: '13:05', body: bg('tarde', 4), overlay: sh(ttl('alim', 'fork-knife', 'Como foi o almoço?'), lunchSheet) }));

  /* ---------- 5. check-in (abre pelo rostinho tocado no Hoje, com o humor já marcado) ---------- */
  /* placeholder com classe própria: a classe "ph" de fld() colide com a fonte de ícones do Phosphor */
  function good(n, text, cls) { return '<div class="fld' + (cls ? ' ' + cls : '') + '"><span class="xb-n">' + n + '</span>' + text + '</div>'; }
  var energyGrp = '<div class="xb-grp">' + gin('Energia') + rf('energy', 3) + '</div>';
  var screensGrp = '<div class="xb-grp">' + gin('Tempo de tela', 'opcional') +
    lg([
      li({ ic: 'device-mobile', p: 'mente', t: 'Total no iPhone', right: tval('1h 48min') }),
      li({ ic: 'youtube-logo', p: 'mente', t: 'YouTube', right: tval('35 min') })
    ]) +
    '<p class="foot">' + ico('info', 'regular') + 'Copie de Ajustes › Tempo de Uso, no iPhone.</p></div>';
  var checkinSheet =
    '<div class="xb-grp">' + gin('Humor') + rf('mood', 4) + '</div>' + energyGrp +
    '<div class="xb-grp">' + gin('3 coisas boas de hoje', 'opcional') + '<div class="xb-gf">' +
      good(1, 'Passeio com o cachorro no fim da tarde') + good(2, 'Almoço caprichado') + good(3, 'Mais uma, se quiser', 'xb-ph') +
    '</div></div>' + screensGrp +
    '<span class="spacer"></span>' +
    btn('Salvar check-in', { w: true });

  addFrame('registros', 'Check-in',
    'Abre pelo rostinho tocado no cartão do Hoje, então o humor já vem marcado: com a energia e o Salvar, preso no pé, são 3 toques. O resto é opcional, e fechar sem salvar guarda um rascunho até o fim do dia.',
    phone({ time: '20:36', body: bg('noite'), overlay: sh(ttl('mente', 'sparkle', 'Check-in do dia'), checkinSheet, { top: 56 }) }));

  /* ---------- 5b. check-in com o teclado aberto ---------- */
  var typingSheet =
    '<div class="xb-scroll"><div>' + energyGrp +
      '<div class="xb-grp">' + gin('3 coisas boas de hoje', 'opcional') + '<div class="xb-gf">' +
        good(1, 'Passeio com o cachorro no fim da tarde') + good(2, 'Almoço caprichado') +
        good(3, '<span>Gol no futebol<span class="xb-caret"></span></span>', 'xb-on') +
      '</div></div>' + screensGrp +
    '</div></div>' +
    btn('Salvar check-in', { w: true });

  addFrame('registros', 'Check-in · teclado aberto',
    'A folha encolhe até o topo do teclado e o meio rola até o campo em uso, que nunca fica escondido. O Salvar fica preso logo acima do teclado, e o “seguinte” leva ao próximo campo.',
    phone({ time: '20:38', body: bg('noite'),
      overlay: kbSheet('t', ttl('mente', 'sparkle', 'Check-in do dia'), typingSheet, { top: 56 }) + kbText(['futebol', 'futebolzinho', 'futebol!'], 'seguinte') }));

  /* ---------- 6. registrar deslize ---------- */
  var slipSheet =
    '<p class="lead">Tudo bem, acontece. A contagem de dias sem refrigerante recomeça amanhã, e o seu recorde de 21 dias continua guardado.</p>' +
    '<div class="stats xb-stats">' +
      '<div><span class="k">atual</span><span class="stat num"><span class="was">12</span>' + ico('arrow-right', 'bold') + '0</span></div>' +
      '<div><span class="k">' + ico('lock-simple', 'regular') + 'recorde</span><span class="stat num">21</span></div>' +
      '<div><span class="k">total</span><span class="stat num"><span class="was">33</span>' + ico('arrow-right', 'bold') + '32</span></div>' +
    '</div>' +
    btn('Registrar deslize', { kind: 's', w: true });

  addFrame('registros', 'Registrar deslize',
    'A folha mostra o que muda e o que fica guardado antes do toque, com botão neutro e nada em vermelho. Depois de registrar, a tela de origem oferece Desfazer por 5 segundos.',
    phone({ time: '16:10', body: bg('tarde', 5), overlay: sh(ttl('alim', 'pint-glass', 'Registrar um deslize?'), slipSheet) }));

  /* ---------- 7. registrar peso (números de exemplo) ---------- */
  var weightSheet =
    '<p class="foot" style="color:var(--text-2)">' + ico('sun-horizon', 'regular') + 'Melhor de manhã, antes do café.</p>' +
    '<div class="xb-wbox"><span class="big num">83,6<span class="xb-caret"></span><small>kg</small></span></div>' +
    '<p class="foot c">' + ico('clock-counter-clockwise', 'regular') + 'Última pesagem: ontem, <span class="num">83,3 kg</span></p>' +
    btn('Salvar <span class="num">83,6 kg</span>', { w: true });

  addFrame('registros', 'Registrar peso',
    'Abre pela linha Peso da manhã ou pelo Progresso, já com o teclado decimal, e mostra a última pesagem como referência, sem comparação colorida. Pesos desta tela são números de exemplo.',
    phone({ time: '7:04', body: bg('cedo', 3),
      overlay: kbSheet('n', ttl('alim', 'scales', 'Peso de hoje'), weightSheet) + kbDecimal() }));
})();
