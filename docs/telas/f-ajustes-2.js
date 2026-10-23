/* Ajustes · parte 2: Horários, Lembretes, Aparência, Pausar, A dois, Dados e conta (Grupo F, prefixo .xf-)
   Usa os componentes da base: days(), tval(), tag(), mbar(), addRow(), .lead, .foot, .profile, btn kind 'warn'. */
(function () {
  addCSS(
    '.xf-box { padding: 12px; }' +
    '.xf-lead { padding: 2px 20px 0; }' +
    /* alarmes sugeridos: o horário aparece como no app Relógio */
    '.xf-al { display: grid; grid-template-columns: 86px minmax(0, 1fr); gap: 10px; align-items: center; min-height: 62px; padding: 10px 16px; }' +
    '.xf-al + .xf-al { border-top: 1px solid var(--border); }' +
    '.xf-al .tm { font: 300 30px/34px var(--font-ui); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }' +
    '.xf-al b { display: block; font: 500 16px/20px var(--font-ui); }' +
    '.xf-al small { display: block; margin-top: 2px; font: var(--t-caption); color: var(--text-3); }' +
    /* passos numerados */
    '.xf-steps { display: flex; flex-direction: column; gap: 14px; padding: 16px; }' +
    '.xf-step { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 12px; align-items: start; }' +
    '.xf-step > span { width: 26px; height: 26px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-ink); display: grid; place-items: center; font: 600 13px/1 var(--font-ui); }' +
    '.xf-step p { padding-top: 3px; font: 400 15px/21px var(--font-ui); }' +
    '.xf-step p b, .xf-tip p b { font-weight: 600; }' +
    '.xf-tip { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: start; padding: 14px; }' +
    '.xf-tip .lic { width: 32px; height: 32px; border-radius: 9px; background: var(--sunken); color: var(--text-2); display: grid; place-items: center; font-size: 18px; }' +
    '.xf-tip > span > b { display: block; font: 600 15px/20px var(--font-ui); }' +
    '.xf-tip p { margin-top: 3px; font: 400 14px/20px var(--font-ui); color: var(--text-2); }' +
    /* prévias de tema: mini telas com as cores fixas de cada tema (a mbar da base lê --track e --mark daqui) */
    '.xf-themes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 6px 22px 0; }' +
    '.xf-th { display: flex; flex-direction: column; align-items: center; gap: 10px; }' +
    '.xf-th > b { font: 500 15px/20px var(--font-ui); }' +
    '.xf-th.on > b { font-weight: 700; }' +
    '.xf-mini { position: relative; width: 100%; aspect-ratio: 10 / 17; border-radius: 18px; overflow: hidden; box-shadow: 0 0 0 1px var(--border-strong); }' +
    '.xf-th.on .xf-mini { box-shadow: 0 0 0 2.5px var(--accent-mark), 0 0 0 6px var(--accent-wash); }' +
    '.xf-scr { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 6px; padding: 20px 8px 0; background: var(--mb); }' +
    '.xf-scr.l { --mb: oklch(98.2% .004 75); --ms: oklch(100% 0 0); --mt: oklch(25.5% .012 75); --m3: oklch(84% .008 75); --mtr: oklch(92% .007 75); --mbd: oklch(90.5% .008 75);' +
      ' --pm: oklch(85% .075 285); --pa: oklch(90.5% .075 150); --pc: oklch(81.5% .075 60); --pf: oklch(85% .075 355); --acc: oklch(64% .115 230); --shd: 0 1px 2px oklch(25% .02 75 / .10); --track: var(--mtr); --mark: var(--pa); }' +
    '.xf-scr.d { --mb: oklch(17% .006 75); --ms: oklch(23% .007 75); --mt: oklch(93.5% .008 75); --m3: oklch(40% .01 75); --mtr: oklch(31% .008 75); --mbd: oklch(30% .008 75);' +
      ' --pm: oklch(78% .08 285); --pa: oklch(82% .08 150); --pc: oklch(73% .08 60); --pf: oklch(78% .08 355); --acc: oklch(78% .08 230); --shd: none; --track: var(--mtr); --mark: var(--pa); }' +
    '.xf-scr.half { clip-path: polygon(100% 0, 100% 100%, 0 100%); }' +
    '.xf-scr .mbar { height: 5px; }' +
    '.xf-isl { position: absolute; top: 6px; left: 50%; width: 30px; height: 8px; margin-left: -15px; border-radius: 5px; background: #000; }' +
    '.xf-ln { display: block; height: 4px; border-radius: 2px; background: var(--m3); }' +
    '.xf-tt { display: block; width: 64%; height: 8px; margin-bottom: 2px; border-radius: 3px; background: var(--mt); }' +
    '.xf-mwk { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 3px; padding: 5px 4px; border-radius: 7px; background: var(--ms); box-shadow: var(--shd); }' +
    '.xf-mwk i { display: block; aspect-ratio: 1; border-radius: 50%; border: 1.5px solid var(--mtr); }' +
    '.xf-mwk i.on { border-color: var(--acc); }' +
    '.xf-mc { display: flex; flex-direction: column; gap: 6px; padding: 6px; border-radius: 8px; background: var(--ms); box-shadow: var(--shd); }' +
    '.xf-mr { display: grid; grid-template-columns: 11px minmax(0, 1fr) 9px; gap: 5px; align-items: center; }' +
    '.xf-mr b { display: block; width: 11px; height: 11px; border-radius: 3.5px; background: var(--c); }' +
    '.xf-mr u { display: block; width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--m3); }' +
    '.xf-mr u.on { background: var(--c); border-color: var(--c); }' +
    '.xf-mtb { position: absolute; left: 0; right: 0; bottom: 0; height: 22px; display: flex; justify-content: space-around; align-items: center; padding: 0 12px 3px; background: var(--ms); border-top: 1px solid var(--mbd); }' +
    '.xf-mtb i { display: block; width: 7px; height: 7px; border-radius: 2.5px; background: var(--m3); }' +
    '.xf-mtb i.on { background: var(--acc); }' +
    /* aviso do sistema dentro de um grupo (Reduzir Movimento ligado no iPhone) e interruptor travado */
    '.xf-sys { display: flex; align-items: flex-start; gap: 8px; margin: -4px 14px 12px 58px; padding: 9px 11px; border-radius: 12px; background: var(--accent-wash); color: var(--text); font: 400 13px/18px var(--font-ui); }' +
    '.xf-sys i { flex: none; font-size: 16px; margin-top: 1px; color: var(--accent-ink); }' +
    '.xf-sys + .li { border-top: 1px solid var(--border); }' +
    '.sw.xf-dis { opacity: .45; }' +
    /* cabeçalho de tela com título na serifa (a barra fica só com o voltar) */
    '.xf-hero { display: flex; flex-direction: column; gap: 8px; padding-top: 6px; padding-bottom: 6px; }' +
    '.xf-hero.c { align-items: center; text-align: center; }' +
    '.xf-badge { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-ink); font: 600 13px/16px var(--font-ui); }' +
    '.xf-badge i { font-size: 14px; }' +
    /* faixa dos dias pausados: mesma hachura do heatmap; a volta é um bloco vazado com ▶; hoje tem anel */
    '.xf-range { padding: 12px 14px 14px; border-top: 1px solid var(--border); }' +
    '.xf-range.first { border-top: 0; }' +
    '.xf-cells { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 4px; margin-top: 10px; }' +
    '.xf-cells > span { display: flex; flex-direction: column; align-items: center; gap: 5px; }' +
    '.xf-cells i { display: block; width: 100%; height: 24px; border-radius: 7px; background: repeating-linear-gradient(135deg, var(--accent-fill) 0 2.5px, transparent 2.5px 6.5px); box-shadow: inset 0 0 0 1.5px var(--accent-mark); }' +
    '.xf-cells small { font: 500 11px/13px var(--font-ui); color: var(--text-2); font-variant-numeric: tabular-nums; white-space: nowrap; }' +
    '.xf-cells .nm small { color: var(--accent-ink); font-weight: 700; }' +
    '.xf-cells .ps i { opacity: .5; }' +
    '.xf-cells .td i { box-shadow: inset 0 0 0 1.5px var(--accent-mark), 0 0 0 2px var(--surface), 0 0 0 3.5px var(--text); }' +
    '.xf-cells .td small { color: var(--text); font-weight: 700; }' +
    '.xf-cells .bk i { display: grid; place-items: center; background: var(--surface); box-shadow: inset 0 0 0 1.5px var(--border-strong); color: var(--text-2); font-size: 12px; }' +
    '.xf-chips { flex-wrap: nowrap; }' +
    '.xf-chips .chip { padding: 7px 10px; }' +
    /* A dois (primária: A dois não é um pilar) */
    '.bub.lg.xf-heart { width: 64px; height: 64px; border-radius: 22px; background: var(--accent-wash); color: var(--accent-ink); font-size: 34px; }' +
    '.xf-prev { padding: 12px 14px 14px; background: var(--sunken); }' +
    '.xf-prev > span { display: block; margin-bottom: 8px; font: var(--t-caption); color: var(--text-3); }' +
    '.xf-peer { display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 12px; border-radius: 16px; background: var(--surface); box-shadow: var(--shadow-1); }' +
    '.xf-peer b { display: block; font: 600 15px/20px var(--font-ui); }' +
    '.xf-peer small { display: block; font: var(--t-caption); color: var(--text-3); }' +
    '.xf-hug { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-ink); font: 600 14px/1 var(--font-ui); }' +
    '.xf-hug i { font-size: 18px; }' +
    '.xf-add { margin-top: 12px; }' +
    /* convite recebido */
    '.xf-inv { display: flex; flex-direction: column; gap: 16px; padding-top: 6px; }' +
    '.xf-pair { display: flex; justify-content: center; }' +
    '.xf-pair .avatar { width: 56px; height: 56px; font-size: 22px; box-shadow: 0 0 0 3px var(--raised); }' +
    '.xf-pair .bub { width: 56px; height: 56px; margin-left: -12px; border-radius: 50%; background: var(--accent-fill); color: var(--accent-on); font-size: 28px; box-shadow: 0 0 0 3px var(--raised); }' +
    '.xf-pts { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 18px; background: var(--surface); box-shadow: var(--shadow-1); }' +
    '.xf-pt { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 12px; align-items: center; }' +
    '.xf-pt > span { width: 32px; height: 32px; border-radius: 9px; background: var(--sunken); color: var(--text-2); display: grid; place-items: center; font-size: 18px; }' +
    '.xf-pt p { font: 400 15px/20px var(--font-ui); }' +
    '.xf-acts { display: flex; flex-direction: column; gap: 4px; }' +
    /* Dados e conta */
    '.xf-danger .lic { background: var(--warning-wash); color: var(--warning-ink); }' +
    '.xf-danger b { color: var(--warning-ink); }' +
    '.xf-confirm { display: flex; flex-direction: column; gap: 12px; margin: 0 12px 12px; padding: 14px; border-radius: 14px; background: var(--warning-wash); }' +
    '.xf-confirm p { font: 400 15px/21px var(--font-ui); color: var(--text); }' +
    '.xf-confirm .flabel { padding: 0 2px 6px; font: 500 14px/18px var(--font-ui); color: var(--text-2); }' +
    '.xf-confirm .flabel b { color: var(--text); font-weight: 700; }' +
    '.xf-confirm .fld { background: var(--surface); box-shadow: inset 0 0 0 1px var(--border-strong); }' +
    '.xf-confirm .row { gap: 8px; }' +
    '.xf-confirm .row .btn { flex: 1; }' +
    '.xf-hr { height: 1px; background: color-mix(in oklch, var(--warning-ink) 18%, transparent); }' +
    /* botão de atenção ainda travado: contorno, sem o fundo cheio */
    '.btn.warn.xf-off { background: transparent; color: var(--warning-ink); box-shadow: inset 0 0 0 1.5px color-mix(in oklch, var(--warning-ink) 35%, transparent); opacity: .7; }'
  );

  function foot(text, icon) { return '<p class="foot">' + (icon ? ico(icon, 'regular') : '') + text + '</p>'; }
  function pad(html, extra) { return '<div class="pad"' + (extra ? ' style="' + extra + '"' : '') + '>' + html + '</div>'; }
  var end = '<div style="height:28px"></div>';

  /* ---------- 1. Horários ---------- */
  var horarios = nb({ back: 'Ajustes', title: 'Horários' }) +
    '<p class="lead xf-lead">Cada horário é a meta dos hábitos ligados a ele e a hora do alarme sugerido.</p>' +
    gl('Todo dia') +
    pad(lg([
      li({ ic: 'alarm', p: 'mente', t: 'Acordar', s: '15 min de tolerância', right: tval('06:50') }),
      li({ ic: 'coffee', p: 'mente', t: 'Fim da cafeína ' + tag('fase 4'), s: 'Ritual do sono · começa em 23 nov', right: tval('14:00', { off: true }) }),
      li({ ic: 'broom', p: 'familia', t: 'Tarefas da casa', s: 'Louça, lixo e recicláveis', right: tval('20:30') }),
      li({ ic: 'sparkle', p: 'mente', t: 'Check-in', s: 'A noite do Hoje começa aqui', right: tval('20:30') }),
      li({ ic: 'device-mobile-slash', p: 'mente', t: 'Telas desligadas', s: 'O Hoje avisa quanto falta', right: tval('21:00') }),
      li({ ic: 'moon-stars', p: 'mente', t: 'Deitar', s: 'Alarme de preparar 10 min antes', right: tval('22:00') })
    ])) +
    foot('Vale a partir de hoje, e os dias que passaram ficam como estavam. O alarme que você criou no iPhone não muda sozinho.', 'info') +
    gl('Toda semana') +
    pad(lg([
      li({ ic: 'calendar-check', t: 'Revisão da semana', s: 'Resumo e um ajuste', right: tval('dom, 18:00') })
    ])) +
    gl('Fim de semana') +
    pad(lg([li({ t: 'Tolerância de 1h', s: 'Sábado e domingo, acordar e deitar até 1h fora do horário contam como feito.', right: sw(true, 'Tolerância de 1h no fim de semana') })])) +
    gl('Dias de coleta do lixo') +
    pad('<div class="lg xf-box">' + days([0, 3], { p: 'familia', label: 'Dias de coleta do lixo' }) + '</div>') +
    foot('Lixo e recicláveis aparece no Hoje só nesses dias, até 20h30.') + end;

  addFrame('ajustes', 'Horários',
    'Quando o nome não diz, a linha conta onde o horário é usado. Tocar no horário abre a roda do iPhone; ao mudar, o aviso “Deitar às 22h30” traz Desfazer e lembra de mudar o alarme. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:50', tall: true, tab: 'aj', body: horarios }));

  /* ---------- 2. Lembretes ---------- */
  function alarm(t, label, when) { return '<div class="xf-al"><span class="tm">' + t + '</span><span><b>' + label + '</b><small>' + when + '</small></span></div>'; }
  function step(n, text) { return '<div class="xf-step"><span>' + n + '</span><p>' + text + '</p></div>'; }

  var lembretes = nb({ back: 'Ajustes', title: 'Lembretes' }) +
    pad('<div class="insight" data-pillar="accent" style="margin-top:4px"><span>' + ico('alarm') + '</span><p>Os lembretes ficam nos alarmes do iPhone, que tocam até no silencioso. O Prokopē não manda notificações.</p></div>') +
    gl('Alarmes sugeridos', 'vêm de Horários') +
    pad('<div class="lg">' +
      alarm('06:50', 'Acordar', 'todo dia') +
      alarm('20:30', 'Louça, lixo e check-in', 'todo dia') +
      alarm('21:00', 'Telas desligadas', 'todo dia') +
      alarm('21:50', 'Preparar para deitar', 'todo dia · 10 min antes de deitar') +
      alarm('18:00', 'Revisão da semana', 'domingo') +
    '</div>') +
    foot('Mudou um horário em Horários? Mude o alarme no iPhone também.', 'info') +
    gl('Como criar no iPhone') +
    pad('<div class="lg xf-steps">' +
      step(1, 'Abra o app <b>Relógio</b> e toque em <b>Alarmes</b>.') +
      step(2, 'Toque em <b>+</b>, escolha o horário e, em <b>Repetir</b>, marque os dias.') +
      step(3, 'Em <b>Etiqueta</b>, escreva o texto do alarme e toque em <b>Salvar</b>.') +
    '</div>') +
    gl('Dica') +
    pad('<div class="lg xf-tip"><span class="lic">' + ico('bed') + '</span>' +
      '<span><b>Agenda de Sono do iPhone</b><p>No app <b>Saúde</b>, a Agenda de Sono junta o alarme das 6h50 e a hora de deitar. Com 1h para desacelerar, o iPhone entra no modo de sono às 21h, junto com as telas desligadas.</p></span></div>') + end;

  addFrame('ajustes', 'Lembretes',
    'O app não pede permissão de notificação: entrega a lista pronta para virar alarme, com os horários lidos de Horários e escritos como no Relógio. A dica usa a Agenda de Sono, que cobre acordar, telas e deitar sem depender do app. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:51', tall: true, tab: 'aj', body: lembretes }));

  /* ---------- 3. Aparência ---------- */
  function miniScreen(theme) {
    return '<div class="xf-scr ' + theme + '"><i class="xf-isl"></i>' +
      '<i class="xf-ln" style="width:42%"></i><i class="xf-tt"></i>' +
      '<div class="xf-mwk">' + [1, 1, 1, 1, 0, 0, 0].map(function (o) { return '<i class="' + (o ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="xf-mc">' + [['--pm', 1, 70], ['--pf', 1, 82], ['--pa', 0, 58], ['--pc', 0, 74]].map(function (r) {
        return '<span class="xf-mr" style="--c:var(' + r[0] + ')"><b></b><i class="xf-ln" style="width:' + r[2] + '%"></i><u class="' + (r[1] ? 'on' : '') + '"></u></span>';
      }).join('') + '</div>' +
      '<div class="xf-mc"><i class="xf-ln" style="width:46%"></i>' + mbar(58) + '</div>' +
      '<div class="xf-mtb"><i class="on"></i><i></i><i></i><i></i></div></div>';
  }
  function themeOpt(name, inner, on) {
    return '<div class="xf-th' + (on ? ' on' : '') + '" role="radio" aria-checked="' + !!on + '" aria-label="Tema ' + name + '"><div class="xf-mini" aria-hidden="true">' + inner + '</div><b>' + name + '</b>' + radio(on).replace(' role="radio" aria-checked="' + !!on + '"', ' aria-hidden="true"') + '</div>';
  }
  var motionOff = sw(false, 'Animações').replace('class="sw"', 'class="sw xf-dis" aria-disabled="true"');

  var aparencia = nb({ back: 'Ajustes', title: 'Aparência' }) +
    gl('Tema') +
    '<div class="xf-themes" role="radiogroup" aria-label="Tema">' +
      themeOpt('Sistema', miniScreen('l') + miniScreen('d half'), true) +
      themeOpt('Claro', miniScreen('l')) +
      themeOpt('Escuro', miniScreen('d')) +
    '</div>' +
    foot('Em Sistema, o Prokopē acompanha o claro e o escuro do iPhone ao longo do dia.') +
    gl('Movimento e som') +
    pad('<div class="lg">' +
      li({ ic: 'wave-sine', t: 'Animações', s: 'O check dá uma mola, os números rolam e o dia fechado brilha.', right: motionOff }) +
      '<div class="xf-sys">' + ico('info', 'regular') + '<span>O Reduzir Movimento está ligado no iPhone, então aqui nada se desloca. Para mudar: Ajustes do iPhone › Acessibilidade › Movimento.</span></div>' +
      li({ ic: 'speaker-simple-low', t: 'Som suave ao marcar', s: 'Um toque baixinho. Respeita o silencioso.', right: sw(false, 'Som suave ao marcar') }) +
    '</div>');

  addFrame('ajustes', 'Aparência',
    'Tocar numa prévia já troca o tema, sem botão de salvar. Com o Reduzir Movimento do iPhone, o interruptor Animações fica desligado e travado, com o aviso de onde mudar; sem ele, o aviso some e vale a escolha da pessoa.',
    phone({ time: '12:53', tab: 'aj', body: aparencia }));

  /* ---------- 4. Pausar ---------- */
  /* faixa de dias: 10 pausados + o dia da volta. o: { today: dia de hoje dentro da pausa } */
  function strip(o) {
    o = o || {};
    var passed = true;
    return [24, 25, 26, 27, 28, 29, 30, 31, 1, 2].map(function (d) {
      if (d === o.today) passed = false;
      var cls = (d === 1 ? 'nm' : '') + (o.today && passed ? ' ps' : '') + (d === o.today ? ' td' : '');
      return '<span class="' + cls + '"><i></i><small>' + (d === 1 ? '1 jan' : d) + '</small></span>';
    }).join('') + '<span class="bk"><i>' + ico('play', 'fill') + '</i><small>3</small></span>';
  }
  function cells(o, label) { return '<div class="xf-cells" role="img" aria-label="' + label + '">' + strip(o) + '</div>'; }

  var pausar = nb({ back: 'Ajustes' }) +
    '<div class="pad xf-hero"><h1 class="ttl2">Uma pausa também faz parte.</h1><p class="lead">Durante a pausa, o Hoje fica em silêncio e nada fica pendente.</p></div>' +
    pad(seg(['O app inteiro', 'Alguns hábitos'], 0, 'O que pausar'), 'padding-top:8px') +
    gl('Datas') +
    pad('<div class="lg">' +
      li({ t: 'Começa', right: tval('qui, 24 dez') }) +
      li({ t: 'Volta', right: tval('dom, 3 jan') }) +
      '<div class="xf-range"><div class="between"><span class="cap num">10 dias de pausa</span><span class="cap">volta no domingo, 3 jan</span></div>' +
        cells({}, 'Pausa de 24 de dezembro a 2 de janeiro, volta no dia 3') + '</div>' +
    '</div>') +
    gl('Motivo', 'opcional') +
    pad('<div class="chips xf-chips">' +
      chip('Férias', { sel: true, icon: 'check' }) +
      chip('Doença', { sel: false, icon: 'thermometer-simple', iw: 'regular' }) +
      chip('Viagem', { sel: false, icon: 'airplane-tilt', iw: 'regular' }) +
      chip('Outro', { sel: false }) +
    '</div>') +
    foot('Dias pausados não contam na constância nem na força dos hábitos. Os dias sem ficam parados e seguem de onde estavam.', 'info') +
    '<div class="spacer"></div>' +
    pad(btn('Pausar 10 dias', { w: true, icon: 'pause', iw: 'fill' }) + '<p class="cap center" style="margin-top:10px">Dá para encerrar antes, aqui ou no Hoje.</p>', 'padding-bottom:14px');

  addFrame('ajustes', 'Pausar',
    'A pessoa escolhe o dia em que a pausa começa e o dia em que volta, do jeito que pensa nas férias; cada data abre um calendário em folha, ao alcance do polegar. Pausar não pede confirmação: o aviso traz Desfazer, e até o dia 24 dá para mudar ou cancelar aqui.',
    phone({ time: '12:54', tab: 'aj', body: pausar }));

  /* ---------- 4b. Pausar · em pausa ---------- */
  var emPausa = nb({ back: 'Ajustes' }) +
    '<div class="pad xf-hero"><span class="xf-badge">' + ico('pause', 'fill') + 'Em pausa · Férias</span>' +
      '<h1 class="ttl2">Até sábado, 2 de janeiro.</h1><p class="lead">Nada fica pendente. Na volta, tudo continua de onde parou.</p></div>' +
    gl('Sua pausa') +
    pad('<div class="lg">' +
      '<div class="xf-range first"><div class="between"><span class="cap num">dia 4 de 10</span><span class="cap">volta no domingo, 3 jan</span></div>' +
        cells({ today: 27 }, 'Dia 4 de 10 da pausa, volta no dia 3 de janeiro') + '</div>' +
      li({ t: 'Volta', s: 'Mude para estender ou encurtar', right: tval('dom, 3 jan') }) +
    '</div>') +
    foot('Os contadores de dias sem estão parados e voltam a contar no dia 3, de onde pararam.', 'info') +
    '<div class="spacer"></div>' +
    pad(btn('Encerrar a pausa', { kind: 's', w: true }) +
      '<p class="cap center" style="margin-top:10px">Hoje passa a contar só o que ainda não passou do horário.</p>', 'padding-bottom:14px');

  addFrame('ajustes', 'Pausar · em pausa',
    'Imaginando 27 de dezembro, no meio das férias. Encerrar a pausa usa o mesmo nome e o mesmo Desfazer do Hoje pausado; quem prefere voltar amanhã muda a data de volta.',
    phone({ time: '9:10', tab: 'aj', body: emPausa }));

  /* ---------- 5. A dois ---------- */
  var adois = nb({ back: 'Ajustes' }) +
    '<div class="pad xf-hero c"><span class="bub lg xf-heart">' + ico('heart') + '</span>' +
      '<h1 class="ttl2" style="margin-top:4px">Um espaço a dois, sem placar</h1>' +
      '<p class="lead" style="max-width:310px">Cada pessoa continua vendo só os próprios dados. Aqui vocês escolhem o que compartilhar.</p></div>' +
    gl('Convite') +
    pad('<div class="lg xf-box stack" style="gap:10px">' + btn('Compartilhar convite', { w: true, icon: 'share-network' }) + '</div>') +
    foot('O convite é um link que vale por 7 dias e funciona uma vez. Mande pelo WhatsApp ou como preferir. Qualquer um dos dois pode desfazer a ligação.') +
    gl('O que a outra pessoa vê') +
    pad('<div class="lg">' +
      '<div class="xf-prev"><span>Assim você aparece no Hoje dela</span>' +
        '<div class="xf-peer"><span class="avatar">H</span><span class="grow"><b>Henrique</b><small>Nada compartilhado</small></span>' +
        '<span class="xf-hug" role="button">' + ico('hand-heart') + 'Carinho</span></div></div>' +
      li({ ic: 'smiley', p: 'accent', t: 'Como estou hoje', s: 'O rostinho do humor do dia, sem números.', right: sw(false, 'Mostrar como estou hoje') }) +
    '</div>') +
    gl('Hábitos a dois') +
    pad(lg([li({ ic: 'calendar-heart', p: 'familia', t: 'Programa a dois', s: '1 por semana · entra na fase 4', right: sw(false, 'Programa a dois como hábito a dois') })]) +
      '<div class="xf-add">' + addRow('Escolher outro hábito') + '</div>') +
    foot('Um hábito vira a dois só quando os dois ligam. Os dois veem e qualquer um marca.') +
    foot('Ninguém vê número, contagem ou sequência do outro. A única interação é mandar um carinho.', 'hand-heart') + end;

  addFrame('ajustes', 'A dois',
    'Tudo começa desligado, e a prévia mostra exatamente o que a outra pessoa veria: o nome e o botão de carinho, mais nada. O convite vai para uma conta Google e aparece no app dela, sem link para encaminhar. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:56', tall: true, tab: 'aj', body: adois }));

  /* ---------- 5b. A dois · convite recebido ---------- */
  function pt(icon, text) { return '<div class="xf-pt"><span>' + ico(icon) + '</span><p>' + text + '</p></div>'; }
  var behind = hd({ date: 'Quinta, 22 de outubro', title: 'Boa noite' }) +
    '<div class="pad stack">' + week([0.8, 0.7, 0.9, 0.6, 0, 0, 0], 3) + '<div class="card" style="height:150px"></div></div>';
  var invite = '<div class="xf-inv">' +
    '<div class="xf-pair" aria-hidden="true"><span class="avatar">H</span><span class="bub">' + ico('heart') + '</span></div>' +
    '<h3 class="ttl2 center">Henrique convidou você para um espaço a dois</h3>' +
    '<div class="xf-pts">' +
      pt('eye-slash', 'Cada um continua vendo só os próprios dados.') +
      pt('toggle-left', 'Você escolhe o que mostrar. Tudo começa desligado.') +
      pt('hand-heart', 'Dá para mandar um carinho. Sem placar e sem números.') +
    '</div>' +
    '<div class="xf-acts">' + btn('Aceitar convite', { w: true }) + btn('Agora não', { kind: 'g', w: true }) + '</div>' +
    '<p class="cap center">Recusar não avisa ninguém. A ligação se desfaz em Ajustes&nbsp;›&nbsp;A&nbsp;dois.</p>' +
  '</div>';

  addFrame('ajustes', 'A dois · convite recebido',
    'O que a outra pessoa vê ao abrir o próprio Prokopē, por cima do Hoje dela. Aceitar não compartilha nada por si só: a folha confirma a ligação e leva para A dois, com tudo desligado.',
    phone({ time: '19:40', body: behind, overlay: sheet('', invite, { label: 'Convite para um espaço a dois' }) }));

  /* ---------- 6. Dados e conta ---------- */
  var share = '<span class="rv">' + ico('export', 'regular') + '</span>';
  var warnOff = btn('Apagar tudo', { kind: 'warn', sm: true, icon: 'trash-simple' }).replace('class="btn warn sm"', 'class="btn warn sm xf-off" aria-disabled="true"');
  var dados = nb({ back: 'Ajustes', title: 'Dados e conta' }) +
    pad('<div class="lg profile" style="margin-top:4px"><span class="avatar">H</span><span class="grow"><b>Henrique</b>' +
      '<small>' + ico('google-logo', 'regular') + 'Conta Google conectada</small><small>Registrando desde 21 de setembro</small></span></div>') +
    gl('Seus dados') +
    pad(lg([
      li({ ic: 'file-csv', t: 'Exportar em CSV', s: 'Abre no Numbers, no Excel e no Planilhas', right: share }),
      li({ ic: 'file-code', t: 'Exportar em JSON', s: 'Cópia completa, para guardar ou levar a outro app', right: share })
    ])) +
    foot('Inclui registros, pilares, hábitos e fases. O iPhone pergunta onde salvar.') +
    gl('Conta') +
    pad(lg([li({ ic: 'sign-out', t: 'Sair da conta', s: 'Os registros continuam salvos na sua conta.', chev: false })])) +
    '<div style="height:28px"></div>' +
    pad('<div class="lg">' +
      li({ ic: 'trash-simple', t: 'Apagar todos os dados' }).replace('class="li"', 'class="li xf-danger"') +
      '<div class="xf-confirm">' +
        '<p>Apaga para sempre 32 dias de registros, 4 pilares, 16 hábitos e as fases desta conta. Sua conta Google continua igual.</p>' +
        btn('Exportar em JSON antes', { kind: 's', sm: true, w: true, icon: 'export', iw: 'regular' }) +
        '<div class="xf-hr"></div>' +
        '<div><span class="flabel">Para confirmar, digite <b>apagar</b></span>' + fld('apagar', { ph: true }) + '</div>' +
        '<div class="row">' + btn('Cancelar', { kind: 's', sm: true }) + warnOff + '</div>' +
      '</div>' +
    '</div>') + end;

  addFrame('ajustes', 'Dados e conta',
    'Apagar fica sozinho no fim, longe de Sair, e abre uma tela própria, cujo conteúdo o quadro mostra aberto sob a linha: primeiro a cópia, depois a palavra apagar, e só então o botão de atenção acende. Sair não pede confirmação, porque basta entrar de novo. Tela com rolagem, mostrada inteira.',
    phone({ time: '12:58', tall: true, tab: 'aj', body: dados }));
})();
