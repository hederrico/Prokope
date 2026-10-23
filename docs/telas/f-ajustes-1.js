/* Ajustes · parte 1 (Grupo E): Ajustes, pilares, novo pilar, pilar e apagar pilar, hábitos e novo hábito */
(function () {
  var caret = ico('caret-right', 'bold');

  addCSS(
    /* Pilares: linha com alça de arrastar */
    '.xe-pil { display: grid; grid-template-columns: 24px 40px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 12px 14px 12px 8px; }' +
    '.xe-pil + .xe-pil { border-top: 1px solid var(--border); }' +
    '.xe-grip { display: grid; place-items: center; height: 40px; font-size: 20px; color: var(--text-3); }' +
    '.xe-pil b { display: block; font: 600 16px/20px var(--font-ui); }' +
    '.xe-pil small { display: block; margin-top: 2px; font: var(--t-caption); color: var(--text-3); font-variant-numeric: tabular-nums; }' +
    '.xe-pil .faint { font-size: 16px; }' +
    '.xe-gap { height: 12px; }' +

    /* Novo pilar: prévia, cores e grade de ícones */
    '.xe-npv { display: flex; align-items: center; gap: 14px; padding: 14px; }' +
    '.xe-npv .bub { background: var(--surface); }' +
    '.xe-npv .ttl2 { display: block; color: var(--ink); }' +
    '.xe-colors { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px 0; justify-items: center; padding: 2px 0; }' +
    '.xe-colors span { width: 44px; height: 44px; border-radius: 50%; background: var(--fill); box-shadow: inset 0 0 0 1.5px var(--mark); display: grid; place-items: center; color: var(--on); font-size: 18px; }' +
    '.xe-colors span.used i { font-size: 17px; opacity: .8; }' +
    '.xe-colors span.on { box-shadow: inset 0 0 0 1.5px var(--mark), 0 0 0 2.5px var(--bg), 0 0 0 4.5px var(--text); }' +
    '.xe-cats { margin-right: -16px; -webkit-mask-image: linear-gradient(to right, #000 82%, transparent); mask-image: linear-gradient(to right, #000 82%, transparent); }' +
    '.xe-np { flex: 1; min-height: 0; display: flex; flex-direction: column; }' +
    '.xe-np .gl { padding-top: 14px; }' +
    '.xe-np .foot { padding-top: 10px; }' +
    '.xe-fill { flex: 1; min-height: 0; padding-bottom: 30px; }' +
    '.xe-icg { flex: 1; min-height: 0; align-content: start; position: relative; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; padding: 2px 6px 6px; border-radius: 16px; background: var(--sunken); overflow: hidden; }' +
    '.xe-icg .gl.in { grid-column: 1 / -1; padding: 10px 6px 2px; font-size: 11px; }' +
    '.xe-icg .gl.in span { color: var(--ink); }' +
    '.xe-ic { height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 22px; color: var(--text-2); }' +
    '.xe-ic.on { background: var(--fill); color: var(--on); box-shadow: inset 0 0 0 1.5px var(--mark); }' +
    '.xe-icg::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 34px; background: linear-gradient(to bottom, transparent, var(--sunken) 85%); pointer-events: none; }' +

    /* Pilar · Corpo */
    '.xe-hero { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 4px 20px 4px; }' +
    '.xe-hero .ttl2 { margin-top: 4px; }' +
    '.xe-danger .lic { background: var(--warning-wash); color: var(--warning-ink); }' +
    '.xe-danger b { color: var(--warning-ink); }' +
    '.btn.s.xe-wt { color: var(--warning-ink); }' +
    '.xe-fate { display: flex; flex-direction: column; gap: 10px; }' +
    '.xe-fate > div { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: center; }' +
    '.xe-fate .bub { width: 32px; height: 32px; border-radius: 10px; font-size: 18px; }' +
    '.xe-fate span { font: 400 15px/20px var(--font-ui); color: var(--text-2); }' +
    '.xe-fate span b { font-weight: 600; color: var(--text); }' +

    /* Hábitos */
    '.li small .tag { margin: 4px 0 0; padding: 2px 8px; font-size: 11px; }' +

    /* Novo hábito · tipo */
    '.xe-q { padding: 4px 4px 2px; }' +
    '.xe-q p { margin-top: 2px; }' +
    '.xe-tp .gl { padding: 14px 20px 7px; }' +
    '.xe-tp .li { min-height: 56px; padding-top: 8px; padding-bottom: 8px; }' +
    '.xe-tp .li .rv { font-size: 13px; }' +

    /* Novo hábito · detalhes */
    '.xe-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--mark); }' +
    '.xe-pvb { position: relative; }' +
    '.xe-pen { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 50%; background: var(--surface); color: var(--text-2); box-shadow: 0 0 0 1.5px var(--border-strong); display: grid; place-items: center; font-size: 10px; }' +
    '.xe-pvh { font: 600 16px/20px var(--font-ui); }' +
    '.xe-meta > * + * { border-top: 1px solid var(--border); }' +
    '.xe-step { display: flex; align-items: center; justify-content: space-between; padding: 14px; }' +
    '.xe-sb { width: 44px; height: 44px; border-radius: 50%; background: var(--sunken); color: var(--text); display: grid; place-items: center; font-size: 19px; }' +
    '.xe-sv { display: flex; flex-direction: column; align-items: center; gap: 2px; }' +
    '.xe-up .li { padding-bottom: 6px; }' +
    '.xe-stairs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; align-items: end; padding: 8px 14px 10px; }' +
    '.xe-stairs div { display: flex; flex-direction: column; align-items: center; gap: 5px; }' +
    '.xe-stairs i { display: block; width: 100%; border-radius: 8px 8px 4px 4px; background: color-mix(in oklch, var(--fill) 40%, transparent); box-shadow: inset 0 0 0 1.5px var(--fill); }' +
    '.xe-stairs div:first-child i { background: var(--fill); box-shadow: none; }' +
    '.xe-stairs b { font: 600 13px/16px var(--font-ui); font-variant-numeric: tabular-nums; }' +
    '.xe-stairs small { margin-top: -4px; font: var(--t-micro); color: var(--text-3); }' +
    '.xe-ask { display: flex; align-items: flex-start; gap: 8px; padding: 0 14px 14px; }' +
    '.xe-ask i { flex: none; font-size: 16px; color: var(--text-3); margin-top: 1px; }' +
    '.xe-qbs { padding: 12px; }' +
    '.xe-qbs .qa { margin-top: 0; }'
  );

  /* cor da paleta usada por cada pilar atual: o swatch mostra o ícone do pilar dono */
  var USED = { lavanda: 'moon-stars', salvia: 'bowl-food', damasco: 'person-simple-run', rosa: 'heart' };
  function colorGrid(sel) {
    return '<div class="xe-colors" role="radiogroup" aria-label="Cor">' + Object.keys(PALETTE).map(function (k) {
      var on = k === sel, used = USED[k];
      return '<span class="hued' + (on ? ' on' : '') + (used && !on ? ' used' : '') + '" style="' + hueStyle(k) + '" role="radio" aria-checked="' + on + '" aria-label="' + PALETTE_NAMES[k] + '">' +
        (on ? ico('check', 'bold') : used ? ico(USED[k], 'bold') : '') + '</span>';
    }).join('') + '</div>';
  }

  /* ---------- 1. Ajustes ---------- */
  var profile = '<div class="lg profile" role="button"><span class="avatar">H</span><span class="grow"><b>Henrique</b><small>' +
    ico('google-logo', 'regular') + 'Conta Google · seus dados</small></span><span class="faint">' + caret + '</span></div>';

  var settings = hd({ title: 'Ajustes' }) +
    '<div class="pad">' + profile + '</div>' +
    gl('Meu plano') + '<div class="pad">' + lg([
      li({ ic: 'list-checks', t: 'Hábitos', rv: '16' }),
      li({ ic: 'columns', t: 'Pilares', rv: '4' }),
      li({ ic: 'pause-circle', t: 'Pausar', s: 'Férias, doença, viagem' })
    ]) + '</div>' +
    gl('Rotina') + '<div class="pad">' + lg([
      li({ ic: 'clock', t: 'Horários', s: 'Acordar 6h50 · deitar 22h' }),
      li({ ic: 'alarm', t: 'Lembretes', s: 'Alarmes do iPhone' })
    ]) + '</div>' +
    gl('App') + '<div class="pad">' + lg([
      li({ ic: 'circle-half', t: 'Aparência', rv: 'Sistema' }),
      li({ ic: 'heart', t: 'A dois', rv: 'Desligado' })
    ]) + '</div>' +
    '<p class="foot c" style="padding:24px 20px 26px">Prokopē · versão 0.1</p>';

  addFrame('ajustes', 'Ajustes',
    'Hábitos vem primeiro porque é o que mais se ajusta, e Pausar fica no plano, fácil de achar num dia difícil. As fases são editadas pela Jornada, e o cartão do perfil leva a Dados e conta.',
    phone({ time: '18:20', tall: true, tab: 'aj', body: settings }));

  /* ---------- 2. Pilares ---------- */
  function pilRow(p, ic, t, n) {
    return '<div class="xe-pil" data-pillar="' + p + '" role="button"><span class="xe-grip hit" role="button" aria-label="Mover ' + t + '">' + ico('dots-six-vertical', 'bold') + '</span>' +
      '<span class="bub">' + ico(ic) + '</span><span class="grow"><b>' + t + '</b><small>' + n + '</small></span>' +
      '<span class="faint">' + caret + '</span></div>';
  }

  var pillars = nb({ back: 'Ajustes', title: 'Pilares' }) +
    '<p class="foot" style="padding-top:4px;padding-bottom:10px">Arraste pela alça para mudar a ordem.</p>' +
    '<div class="pad">' +
      '<div class="lg">' +
        pilRow('mente', 'moon-stars', 'Mente', '5 hábitos') +
        pilRow('alim', 'bowl-food', 'Alimentação', '7 hábitos') +
        pilRow('corpo', 'person-simple-run', 'Corpo', '2 hábitos') +
        pilRow('familia', 'heart', 'Família', '3 hábitos') +
      '</div><div class="xe-gap"></div>' + addRow('Novo pilar') +
    '</div>' +
    gl('Arquivados') +
    '<div class="pad"><div class="empty">' + ico('archive', 'regular') + '<b>Nenhum pilar arquivado.</b>' +
      '<span class="cap">Arquivar tira o pilar e os hábitos dele do seu dia. O histórico fica guardado.</span></div></div>';

  addFrame('ajustes', 'Pilares',
    'A ordem daqui vale para o app todo. A alça arrasta e o resto da linha abre o pilar, por isso não existe modo Editar.',
    phone({ time: '18:21', tab: 'aj', body: pillars }));

  /* ---------- 3. Novo pilar ---------- */
  var mel = hueStyle('mel');
  var cats = ['Todos', 'Mente e sono', 'Alimentação', 'Corpo', 'Família e casa', 'Saúde', 'Trabalho', 'Dinheiro', 'Lazer', 'Relações', 'Deixar de lado'];
  var money = ['wallet', 'piggy-bank', 'coins', 'money', 'bank', 'credit-card', 'receipt', 'hand-coins', 'chart-pie-slice', 'chart-line-up', 'shopping-bag', 'tag'];
  var mind = ['brain', 'moon-stars', 'bed', 'alarm', 'sun-horizon', 'book-open', 'notebook', 'lightbulb', 'flower-lotus', 'yin-yang', 'wind', 'sparkle'];
  function icCell(n) { return '<span class="xe-ic' + (n === 'piggy-bank' ? ' on' : '') + '" role="radio" aria-checked="' + (n === 'piggy-bank') + '">' + ico(n) + '</span>'; }
  function glIn(t, r) { return gl(t, r).replace('class="gl"', 'class="gl in"'); }

  var newPillar = nb({ left: 'Cancelar', title: 'Novo pilar', act: 'Criar' }) + '<div class="xe-np">' +
    '<div class="pad" style="padding-top:4px">' +
      '<div class="card tint hued xe-npv" style="' + mel + '"><span class="bub lg">' + ico('piggy-bank') + '</span>' +
        '<span class="grow"><span class="ttl2">Finanças</span><span class="cap">Prévia · ainda sem hábitos</span></span></div>' +
    '</div>' +
    gl('Nome') + '<div class="pad">' + fld('Finanças') + '</div>' +
    gl('Cor', 'Mel') + '<div class="pad">' + colorGrid('mel') + '</div>' +
    '<p class="foot">As cores com ícone já são de outro pilar. Pode repetir.</p>' +
    gl('Ícone') +
    '<div class="pad stack xe-fill" style="gap:10px">' +
      fld('Buscar: sono, água, dinheiro…', { ph: true, icon: 'magnifying-glass' }) +
      '<div class="chips nowrap xe-cats">' + cats.map(function (c, i) { return chip(c, { sel: i === 0 }); }).join('') + '</div>' +
      '<div class="xe-icg hued" style="' + mel + '" role="radiogroup" aria-label="Ícone">' +
        glIn('Dinheiro', 'sugerido pelo nome') + money.map(icCell).join('') +
        glIn('Mente e sono') + mind.map(icCell).join('') +
      '</div>' +
    '</div></div>';

  addFrame('ajustes', 'Novo pilar',
    'Criar só acende com um nome, e a busca ignora acentos (“agua” acha Água). Cor já usada mostra o ícone do pilar dono e, se escolhida, o rótulo vira “Damasco · também em Corpo”, sem bloquear.',
    phone({ time: '18:22', body: newPillar }));

  /* ---------- 3b. Pilar · Corpo ---------- */
  var corpoBody = nb({ back: 'Pilares', act: 'Editar' }) +
    '<div class="xe-hero" data-pillar="corpo"><span class="bub lg">' + ico('person-simple-run') + '</span>' +
      '<h1 class="ttl2">Corpo</h1><p class="cap">2 hábitos · constância de 71% na semana</p></div>' +
    gl('Hábitos neste pilar', '2') +
    '<div class="pad">' + lg([
      li({ ic: 'soccer-ball', p: 'corpo', t: 'Futebol', s: 'Vezes por semana · quinta' }),
      li({ ic: 'salsicha', p: 'familia', t: 'Caminhada com o cachorro', s: 'Sim ou não · meta 6 de 7 ' + tag('principal em Família', { p: 'familia' }) })
    ]) + '<div class="xe-gap"></div>' + addRow('Novo hábito em Corpo') + '</div>' +
    '<div class="pad" style="padding-top:24px">' + lg([
      li({ ic: 'archive', t: 'Arquivar pilar', s: 'Futebol sai do seu dia. A caminhada continua em Família.', chev: false }),
      li({ ic: 'trash-simple', t: 'Apagar pilar', s: 'Pede confirmação antes' }).replace('class="li"', 'class="li xe-danger"')
    ]) + '</div>' +
    '<p class="foot">Arquivado, o pilar fica em Pilares › Arquivados, com o histórico, e volta com um toque.</p>';

  addFrame('ajustes', 'Pilar · Corpo',
    'Tela nova: o pilar que abre ao tocar na lista; Editar abre o mesmo formulário do Novo pilar, com Salvar. Arquivar é reversível, então não pede confirmação: a linha avisa antes o que acontece com cada hábito, e o aviso traz Desfazer.',
    phone({ time: '18:23', tab: 'aj', body: corpoBody }));

  /* ---------- 3c. Pilar · apagar ---------- */
  var deleteSheet = sheet('Apagar Corpo?',
    '<p class="lead">Apagar não dá para desfazer. Arquivar tira Corpo do seu dia e guarda todo o histórico.</p>' +
    '<div class="xe-fate">' +
      '<div data-pillar="corpo"><span class="bub">' + ico('soccer-ball') + '</span><span><b>Futebol</b> é apagado junto, com os registros.</span></div>' +
      '<div data-pillar="familia"><span class="bub">' + ico('salsicha') + '</span><span><b>Caminhada com o cachorro</b> continua em Família, com tudo o que já foi feito.</span></div>' +
    '</div>' +
    '<div class="stack" style="gap:10px;margin-top:4px">' + btn('Arquivar pilar', { w: true, icon: 'archive' }) +
      btn('Apagar de vez', { kind: 's', w: true, icon: 'trash-simple' }).replace('btn s', 'btn s xe-wt') + '</div>');

  addFrame('ajustes', 'Pilar · apagar',
    'Tela nova. Apagar um pilar com hábitos é a única ação daqui que pede confirmação, e a folha recomenda Arquivar. Um hábito que também vive em outro pilar nunca é apagado junto.',
    phone({ time: '18:24', tab: 'aj', body: corpoBody, overlay: deleteSheet }));

  /* ---------- 4. Hábitos ---------- */
  var groups = [
    ['mente', 'Mente', [
      { ic: 'alarm', t: 'Acordar', s: 'Horário · meta 6h50 · fase 1' },
      { ic: 'device-mobile-slash', t: 'Telas desligadas', s: 'Sim ou não · 21h · fase 1' },
      { ic: 'moon-stars', t: 'Deitar', s: 'Horário · meta 22h · fase 1' },
      { ic: 'sparkle', t: 'Check-in do dia', s: 'Nota de 1 a 5 e texto · 20h30 · fase 1' },
      { ic: 'video-camera-slash', t: 'Sem Shorts e TikTok', s: 'Dias sem · já ativo' }
    ]],
    ['alim', 'Alimentação', [
      { ic: 'pint-glass', t: 'Zero refrigerante', s: 'Dias sem · fase 1' },
      { ic: 'egg', t: 'Proteína', s: 'Contador · meta 80 g, subindo · fase 2' },
      { ic: 'drop', t: 'Água', s: 'Contador · meta 3 L · fase 2' },
      { ic: 'fork-knife', t: 'Almoço e jantar', s: 'Nota de 1 a 5 · fase 2' },
      { ic: 'cookie', t: 'Tranqueiras', s: 'Limite por semana · até 2 dias · fase 2' },
      { ic: 'pizza', t: 'Refeições livres', s: 'Limite por semana · até 2 · fase 2' },
      { ic: 'scales', t: 'Peso e cintura', s: 'Número · diário e semanal · fase 1' }
    ]],
    ['corpo', 'Corpo', [
      { ic: 'soccer-ball', t: 'Futebol', s: 'Vezes por semana · quinta · já ativo' },
      { ic: 'salsicha', p: 'familia', t: 'Caminhada com o cachorro', s: 'Sim ou não · meta 6 de 7 · fase 1 ' + tag('principal em Família', { p: 'familia' }) }
    ]],
    ['familia', 'Família', [
      { ic: 'broom', t: 'Louça', s: 'Sim ou não · até 20h30 · fase 1' },
      { ic: 'trash', t: 'Lixo e recicláveis', s: 'Sim ou não · seg e qui · fase 1' },
      { ic: 'salsicha', t: 'Caminhada com o cachorro', s: 'Sim ou não · meta 6 de 7 · fase 1 ' + tag('também em Corpo', { p: 'corpo' }) }
    ]]
  ];

  var habits = nb({ back: 'Ajustes', title: 'Hábitos', act: ico('plus', 'bold'), actLabel: 'Novo hábito' }) +
    '<div class="pad" style="padding-top:6px">' + seg(['Ativos', 'Próximas fases', 'Arquivados'], 0, 'Mostrar') + '</div>' +
    groups.map(function (g) {
      return gl(g[1], String(g[2].length)) + '<div class="pad">' + lg(g[2].map(function (h) {
        return li({ ic: h.ic, p: h.p || g[0], t: h.t, s: h.s });
      })) + '</div>';
    }).join('') +
    '<div class="pad" style="padding-top:16px">' + addRow('Novo hábito') + '</div>' +
    '<p class="foot c" style="padding:16px 28px 28px">16 hábitos ativos. Mais 8 esperam nas fases 3 e 4. Toque num hábito para ver o histórico e editar.</p>';

  addFrame('ajustes', 'Hábitos',
    'Os nomes são os mesmos do Hoje, e cada linha diz o tipo, a meta e a fase. A caminhada aparece nos dois pilares, sempre na cor de Família, que é o principal. Tela com rolagem, mostrada inteira.',
    phone({ time: '18:25', tall: true, tab: 'aj', body: habits }));

  /* ---------- 5. Novo hábito · tipo ---------- */
  var typeGroups = [
    ['Fazer algo', [
      ['check-circle', 'Sim ou não', 'Louça feita', 'mais simples'],
      ['calendar-check', 'Vezes por semana', 'Academia 2×'],
      ['clock', 'Horário', 'Acordei às 6h52'],
      ['list-checks', 'Lista de passos', 'Ritual do sono']
    ]],
    ['Medir algo', [
      ['plus-minus', 'Contador', 'Proteína: 46 de 80 g'],
      ['hash', 'Número', 'Peso, minutos de tela'],
      ['star', 'Nota de 1 a 5', 'Almoço nota 4']
    ]],
    ['Deixar ou diminuir algo', [
      ['calendar-slash', 'Dias sem', '12 dias sem refrigerante'],
      ['gauge', 'Limite por semana', 'Até 2 refeições livres']
    ]]
  ];

  var typePick = nb({ left: 'Cancelar', title: 'Novo hábito' }) +
    '<div class="xe-tp">' +
      '<div class="pad"><div class="xe-q"><h2 class="ttl2">Que tipo de hábito?</h2><p class="sub muted" style="font-weight:400">O tipo define como você marca no Hoje.</p></div></div>' +
      typeGroups.map(function (g) {
        return gl(g[0]) + '<div class="pad">' + lg(g[1].map(function (t) {
          return li({ ic: t[0], p: 'accent', t: t[1], s: t[2], rv: t[3] || '' });
        })) + '</div>';
      }).join('') +
    '</div>';

  addFrame('ajustes', 'Novo hábito · tipo',
    'Os nove tipos vêm agrupados pelo que a pessoa quer: fazer, medir ou deixar algo. Os exemplos são os mesmos para qualquer conta, e Sim ou não fica marcado como o mais simples.',
    phone({ time: '18:26', body: typePick }));

  /* ---------- 6. Novo hábito · detalhes ---------- */
  var pilarRv = '<span class="rv"><span class="xe-dot" data-pillar="alim"></span>Alimentação' + caret + '</span>';

  var preview = '<div class="card p stack" data-pillar="alim" style="gap:4px">' +
    '<div class="between"><span class="row"><span class="bub sm xe-pvb">' + ico('egg') +
      '<span class="xe-pen hit" role="button" aria-label="Trocar o ícone">' + ico('pencil-simple', 'bold') + '</span></span><b class="xe-pvh">Proteína</b></span>' +
    '<span class="sub num"><b>0 g</b> <span class="faint">de 80 g</span></span></div>' +
    pbar([], 120, 80, 'meta 80 g', true) + '</div>';

  var stepper = '<div class="xe-step"><span class="xe-sb" role="button" aria-label="Diminuir meta">' + ico('minus', 'bold') + '</span>' +
    '<span class="xe-sv"><span class="stat num">80 g</span><span class="cap">por dia</span></span>' +
    '<span class="xe-sb" role="button" aria-label="Aumentar meta">' + ico('plus', 'bold') + '</span></div>';

  var stairs = '<div class="xe-stairs" data-pillar="alim" aria-hidden="true">' + [[80, 'agora', 14], [90, 'em 2 sem', 22], [100, 'em 4 sem', 30], [110, 'em 6 sem', 38]].map(function (s) {
    return '<div><i style="height:' + s[2] + 'px"></i><b>' + s[0] + ' g</b><small>' + s[1] + '</small></div>';
  }).join('') + '</div>';

  var quick = [['Ovo', 6], ['Queijo', 5], ['Feijão', 7], ['Leite', 6], ['Whey', 22], ['Iogurte', 10], ['Frango', 30]];

  var details = nb({ back: 'Tipo', title: 'Novo hábito', act: 'Criar' }) +
    gl('Prévia no Hoje', 'Contador') +
    '<div class="pad">' + preview + '</div>' +
    gl('Nome') +
    '<div class="pad">' + fld('Proteína') + '</div>' +
    gl('Meta') +
    '<div class="pad"><div class="lg xe-meta">' + stepper +
      li({ t: 'Unidade', rv: 'gramas (g)' }) +
      '<div class="xe-up">' + li({ t: 'Subir aos poucos', s: '+10 g a cada 2 semanas, até 110 g', right: sw(true, 'Subir aos poucos') }) + stairs +
        '<p class="cap xe-ask">' + ico('calendar-check', 'regular') + '<span>A revisão da semana pergunta antes de cada subida.</span></p></div>' +
    '</div></div>' +
    gl('Botões rápidos', '7') +
    '<div class="pad"><div class="card xe-qbs" data-pillar="alim"><div class="qa">' +
      quick.map(function (q) { return '<span class="q" role="button" aria-label="Editar ' + q[0] + ', ' + q[1] + ' gramas"><b>' + q[0] + '</b><small>' + q[1] + ' g</small></span>'; }).join('') +
      '<span class="q more" role="button">' + ico('plus', 'bold') + '<small>Novo</small></span>' +
    '</div></div></div>' +
    '<p class="foot">O Hoje mostra 3 por vez, os mais usados naquela hora. Toque num botão para editar ou apagar.</p>' +
    gl('Onde e quando', 'pode deixar assim') +
    '<div class="pad">' + lg([
      li({ t: 'Pilar', right: pilarRv }),
      li({ t: 'Momento do dia', rv: 'Ao longo do dia' }),
      li({ t: 'Dias', rv: 'Todos os dias' }),
      li({ t: 'Começa', rv: 'Agora, na fase 2' })
    ]) + '</div>' +
    '<div style="height:44px"></div>';

  addFrame('ajustes', 'Novo hábito · detalhes',
    'Nome, meta e botões vêm primeiro; o resto chega preenchido, e o ícone muda tocando na prévia. A meta nunca sobe sozinha: a revisão da semana pergunta antes. Tela com rolagem, mostrada inteira.',
    phone({ time: '18:27', tall: true, body: details }));
})();
