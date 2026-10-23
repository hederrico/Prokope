/* Hoje · manhã, tarde, noite, dia fechado e domingo (telas de referência para o estilo dos outros arquivos)
   As peças do Hoje estão na base (weekCard, fold, doPill, plusBtn, addPill, semTile, .qa, .nudge). As regras estão no SPEC, em "Regras do Hoje":
   - Toque no controle à direita registra (círculo marca, pílula abre a folha do registro, + usa um do limite).
     Toque no ícone ou no nome abre o hábito. Toque longo abre o menu do hábito (grupo I).
   - Momento do dia ainda distante (a Noite antes das 18h) ou já completo recolhe numa linha (fold), que abre no lugar.
   - "Feitos hoje" conta 12 hábitos: os de marcar e os dias sem. Proteína, água, limites e peso ficam fora.
   - O deitar é marcado na manhã seguinte, junto com o acordar, para o celular não voltar à mão depois das 21h. */
(function () {
  var date = 'Quinta, 22 de outubro';

  addCSS(
    '.xh-t { font: 600 16px/20px var(--font-ui); }' +
    '.xh-water .ringbox .rc { color: var(--ink); font-size: 18px; }' +
    /* check-in e metas da noite */
    '.xh-ci { background: var(--accent-wash); box-shadow: none; gap: 14px; }' +
    '.xh-mt { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }' +
    '.xh-mt > span { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 10px 14px; }' +
    '.xh-mt > span + span { border-left: 1px solid var(--border); }' +
    '.xh-mt b { display: block; font: 600 16px/20px var(--font-ui); font-variant-numeric: tabular-nums; }' +
    '.xh-mt small { display: flex; align-items: center; gap: 4px; font: var(--t-caption); color: var(--text-3); }' +
    '.xh-mt small.ok { color: var(--success-ink); }' +
    '.xh-mt small i { font-size: 13px; }' +
    /* dia fechado */
    '.xh-closed { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 0 32px; }' +
    '.xh-glow { border-radius: 50%; filter: drop-shadow(0 0 22px color-mix(in oklch, var(--accent-fill) 70%, transparent)); }' +
    /* domingo: convite da revisão, com a semana dentro */
    '.xh-rev { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--accent-wash); box-shadow: none; }' +
    '.xh-rev .wk { background: transparent; box-shadow: none; padding: 2px 0; }' +
    '.xh-rev .eyebrow { margin-bottom: 2px; }'
  );

  /* ---------- peças locais, montadas com os helpers da base ---------- */
  function limit(ic, t, used, total, label) {
    return hr({ p: 'alim', ic: ic, t: t, s: slots(total, used, 'used') + '<span class="num">' + used + ' de ' + total + '</span>na semana', r: plusBtn(label) });
  }
  function protein(g, segs, foods) {
    return '<div class="card p stack" data-pillar="alim" style="gap:8px">' +
      '<div class="between"><span class="row"><span class="bub sm">' + ico('egg') + '</span><b class="xh-t">Proteína</b></span>' +
      '<span class="sub num"><b>' + g + ' g</b> <span class="faint">de 80 g</span></span></div>' +
      pbar(segs, 120, 80, 'meta 80 g') +
      '<div class="qa">' + foods.map(function (f) {
        return '<span class="q" role="button" aria-label="Somar ' + f[0] + ', ' + f[1] + ' gramas"><b>' + f[0] + '</b><small>+' + f[1] + ' g</small></span>';
      }).join('') +
      '<span class="q more" role="button" aria-label="Mais alimentos">' + ico('dots-three', 'bold') + '<small>Mais</small></span></div></div>';
  }
  function water(text, pct) {
    return '<div class="card hr xh-water" data-pillar="alim">' + ringBox(40, 5, pct, ico('drop'), 'var(--mark)', 'var(--wash)') +
      '<span class="ht"><b>Água</b><small class="num">' + text + '</small></span>' +
      '<span class="row" style="gap:6px">' + addPill('500 ml') + addPill('1 L') + '</span></div>';
  }
  var bottom =
    gl('Limites da semana') +
    '<div class="pad"><div class="card lst">' +
      limit('pizza', 'Refeições livres', 0, 2, 'Usar uma refeição livre') + limit('cookie', 'Tranqueiras', 1, 2, 'Registrar tranqueira hoje') +
    '</div></div>' +
    gl('Dias sem') +
    '<div class="pad dsr">' +
      semTile('alim', 'pint-glass', 12, 'refrigerante', '<span class="cap">recorde 21</span>') +
      semTile('mente', 'video-camera-slash', 32, 'Shorts e TikTok', '<span class="cap rec">' + ico('trophy', 'regular') + 'seu recorde</span>') +
    '</div><div style="height:24px"></div>';

  /* ---------- manhã ---------- */
  var morning = hd({ date: date, title: 'Bom dia, Henrique' }) +
    '<div class="pad">' + weekCard(3, 76, [0.83, 0.75, 0.6, 3 / 12, 0, 0, 0]) + '</div>' +
    gl('Manhã') +
    '<div class="pad"><div class="card lst">' +
      hr({ p: 'alim', ic: 'scales', t: 'Peso', s: 'média de 7 dias no Progresso', r: vpill('83,6 kg', { icon: 'check' }), done: true }) +
      hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'meta 6h50', r: vpill('6h52', { icon: 'check' }), done: true }) +
      '<div data-pillar="familia">' +
        hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, 2) + '2 de 7 · meta 6', r: chk(false, 'Caminhada com o cachorro') }) +
        '<div class="nudge"><span>Hoje é um bom dia para voltar.</span><span class="lk" role="button">Marcar ontem</span></div>' +
      '</div>' +
    '</div></div>' +
    gl('Ao longo do dia') +
    '<div class="pad stack">' + protein(24, [18, 6], [['Ovo', 6], ['Leite', 6], ['Whey', 22]]) + water('0 de 3 L', 0) +
      '<div class="card lst">' +
        hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: doPill('Dar nota') }) +
        hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · 0 de 1 na semana', r: chk(false, 'Futebol') }) +
      '</div></div>' +
    gl('Noite', 'a partir das 20h30') +
    '<div class="pad">' + fold(['broom|familia', 'trash|familia', 'bowl-food|alim'], 3, '6 hábitos', 'louça, lixo, jantar e mais 3') + '</div>' +
    bottom;

  addFrame('hoje', 'Hoje · manhã',
    'Toque no controle à direita registra, e toque no ícone ou no nome abre o hábito. A Noite, ainda longe, fica recolhida, e o convite gentil aparece em um hábito só, com o atalho para marcar ontem quando foi esquecimento (peso de exemplo).',
    phone({ time: '7:42', tall: true, tab: 'hoje', body: morning }));

  /* ---------- tarde ---------- */
  var afternoon = hd({ date: date, title: 'Boa tarde, Henrique' }) +
    '<div class="pad">' + weekCard(4, 76, [0.83, 0.75, 0.6, 4 / 12, 0, 0, 0]) + '</div>' +
    gl('Manhã') +
    '<div class="pad">' + fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'peso, acordar e caminhada') + '</div>' +
    gl('Ao longo do dia') +
    '<div class="pad stack">' + protein(46, [18, 6, 22], [['Frango', 30], ['Feijão', 7], ['Queijo', 5]]) + water('1,5 L de 3 L', 0.5) +
      '<div class="card lst">' +
        hr({ p: 'alim', ic: 'fork-knife', t: 'Almoço', s: 'nota de 1 a 5', r: doPill('Dar nota') }) +
        hr({ p: 'corpo', ic: 'soccer-ball', t: 'Futebol', s: 'hoje · 0 de 1 na semana', r: chk(false, 'Futebol') }) +
      '</div></div>';

  addFrame('hoje', 'Hoje · tarde',
    'Quando um momento do dia fica completo, ele recolhe numa linha, e os botões da proteína mudam com a hora: no almoço, frango e feijão. Tocar num dia passado da semana abre aquele dia para corrigir.',
    phone({ time: '12:41', tab: 'hoje', body: afternoon }));

  /* ---------- noite ---------- */
  var checkin = '<div class="card p stack xh-ci" data-pillar="accent">' +
    '<div class="row" style="gap:12px"><span class="bub" style="background:var(--surface)">' + ico('sparkle') + '</span>' +
    '<span class="grow"><b class="xh-t" style="display:block">Check-in do dia</b><span class="sub muted" style="font-weight:400">Como você está agora? Leva 2 minutos.</span></span></div>' +
    rf('mood', 0) + '</div>';

  var metas = '<div class="card xh-mt" data-pillar="alim">' +
    '<span><span class="bub sm">' + ico('egg') + '</span><span><b>86 g</b><small class="ok">' + ico('check', 'bold') + 'meta batida</small></span></span>' +
    '<span><span class="bub sm">' + ico('drop') + '</span><span><b>2,5 L</b><small>de 3 L</small></span></span></div>';

  var night = hd({ date: date, title: 'Boa noite, Henrique' }) +
    gl('Ainda hoje', '4') +
    '<div class="pad stack">' + checkin +
      '<div class="card lst">' +
        hr({ p: 'familia', ic: 'trash', t: 'Lixo e recicláveis', s: 'coleta hoje · ainda dá tempo', r: chk(false, 'Lixo e recicláveis') }) +
        hr({ p: 'mente', ic: 'device-mobile-slash', t: 'Telas desligadas', s: 'às 21h · em 26 min', r: chk(false, 'Telas desligadas') }) +
        hr({ p: 'mente', ic: 'moon-stars', t: 'Deitar', s: 'meta 22h · marque amanhã ao acordar' }) +
      '</div>' +
      fold(['alarm|mente', 'salsicha|familia', 'fork-knife|alim', 'soccer-ball|corpo'], 4, 'Feitos hoje · 8', 'toque para ver ou desmarcar') +
      metas +
    '</div>';

  addFrame('hoje', 'Hoje · noite',
    'A partir das 20h30 a tela se divide em Ainda hoje e Feitos hoje, com o check-in no topo: tocar num rosto já abre a folha com o humor marcado. A água continua à vista, sem botão de somar e sem convite para beber.',
    phone({ time: '20:34', tab: 'hoje', body: night }));

  /* ---------- dia fechado ---------- */
  var closed = '<div class="xh-closed">' +
    '<span class="xh-glow">' + ringBox(196, 14, 11 / 12, '<span class="disp num" style="font-size:60px;line-height:1">11</span><span class="cap">de 12</span>', 'var(--accent-mark)', 'var(--accent-wash)') + '</span>' +
    '<h1 class="ttl2" style="margin-top:22px">Dia fechado</h1>' +
    '<p class="sub muted center" style="font-weight:400;max-width:300px">Telas desligadas às 21h04. Boa noite. O deitar você marca amanhã, junto com o acordar.</p>' +
    btn('Ver o dia', { kind: 'g' }) + '</div>' +
    gl('Amanhã cedo') +
    '<div class="pad" style="padding-bottom:20px"><div class="card lst">' +
      hr({ p: 'mente', ic: 'alarm', t: 'Acordar', s: 'sexta · meta 6h50' }) +
      hr({ p: 'familia', ic: 'salsicha', t: 'Caminhada com o cachorro', s: dots(7, 3) + '3 de 7 · meta 6' }) +
    '</div></div>';

  addFrame('hoje', 'Hoje · dia fechado',
    'Abre quando as telas são desligadas, o último toque da noite, e o anel brilha uma vez. Só o que foi feito aparece, e Ver o dia abre a lista para desfazer algum engano.',
    phone({ time: '21:04', tab: 'hoje', body: closed }));

  /* ---------- domingo, fim da fase 2 (números ilustrativos) ---------- */
  var review = '<div class="card xh-rev" data-pillar="accent">' +
    '<div class="row" style="gap:12px"><span class="bub" style="background:var(--surface)">' + ico('calendar-check') + '</span>' +
      '<span class="grow"><span class="eyebrow">Revisão da semana</span><b class="xh-t" style="display:block">A fase 2 termina hoje</b></span></div>' +
    week([0.85, 0.8, 0.9, 0.7, 0.75, 0.85, 0.6], 6, [26, 27, 28, 29, 30, 31, 1]) +
    '<p class="sub" style="font-weight:400">Em 5 minutos, você vê o que deu certo e escolhe o próximo passo.</p>' +
    btn('Começar revisão', { w: true }) + '</div>';

  var sunday = hd({ date: 'Domingo, 1 de novembro', title: 'Boa tarde, Henrique' }) +
    '<div class="pad">' + review + '</div>' +
    gl('Manhã') +
    '<div class="pad">' + fold(['scales|alim', 'alarm|mente', 'salsicha|familia'], 0, 'Tudo feito', ico('check', 'bold') + 'acordar às 7h35 e mais 2') + '</div>' +
    gl('Ao longo do dia') +
    '<div class="pad stack">' + protein(62, [18, 22, 22], [['Frango', 30], ['Feijão', 7], ['Ovo', 6]]) + water('2 L de 3 L', 2 / 3) + '</div>';

  addFrame('hoje', 'Hoje · domingo',
    'No domingo, o cartão da semana vira o convite da revisão e leva à Revisão · 1 de 3. Fica no topo até segunda à noite (vira Continuar revisão se ficar pela metade) e depois segue na Jornada.',
    phone({ time: '18:00', tab: 'hoje', body: sunday }));
})();
