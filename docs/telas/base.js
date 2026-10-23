/* Prokopē · telas v0.1 · helpers compartilhados e o quadro.
   Cada arquivo f-*.js chama addFrame(seção, nome, nota, html, opções) usando os helpers abaixo.
   Os helpers devolvem strings de HTML. Nada aqui depende de biblioteca. */

var SECTIONS = [
  ['entrada', 'Entrada', 'Login e primeiro acesso'],
  ['hoje', 'Hoje', 'O dia, da manhã à noite'],
  ['registros', 'Registros rápidos', 'Folhas que abrem a partir do Hoje'],
  ['habito', 'Hábito', 'O detalhe de cada hábito'],
  ['progresso', 'Progresso', 'Como você está indo'],
  ['jornada', 'Jornada', 'Fases, corrida e revisão de domingo'],
  ['ajustes', 'Ajustes', 'Pilares, hábitos, rotina e conta'],
  ['estados', 'Estados e feedback', 'Desfazer, primeiro dia, offline e outros momentos'],
  ['computador', 'Computador', 'O mesmo app no PC']
];
var FRAMES = [];
var EXTRA_CSS = [];

/* registra uma tela. opts: { w } largura do rótulo quando o quadro não é um celular */
function addFrame(section, name, note, html, opts) { FRAMES.push({ section: section, name: name, note: note, html: html, opts: opts || {} }); }
/* CSS extra de um arquivo de telas; use um prefixo próprio nas classes (ex.: .xj-) */
function addCSS(css) { EXTRA_CSS.push(css); }

/* ---------- paleta de pilares (12 cores) ---------- */
var PALETTE = {
  coral: [25], damasco: [60, '81.5%', '61%', '46.5%', '73%'], mel: [90], oliva: [120],
  salvia: [150, '90.5%', '64.5%', '45.5%', '82%'], menta: [175], agua: [205], ceu: [235],
  indigo: [262], lavanda: [285], ameixa: [320], rosa: [355]
};
var PALETTE_NAMES = { coral: 'Coral', damasco: 'Damasco', mel: 'Mel', oliva: 'Oliva', salvia: 'Sálvia', menta: 'Menta', agua: 'Água', ceu: 'Céu', indigo: 'Índigo', lavanda: 'Lavanda', ameixa: 'Ameixa', rosa: 'Rosa' };
/* style="" para um elemento com class="hued" */
function hueStyle(key) {
  var p = PALETTE[key];
  return '--h:' + p[0] + ';--fl:' + (p[1] || '85%') + ';--ml:' + (p[2] || '64%') + ';--il:' + (p[3] || '47.5%') + ';--dfl:' + (p[4] || '78%');
}

/* ---------- ícones ----------
   ico('egg') duotone · ico('egg','regular') · ico('sun','fill') · ico('check','bold') · ico('salsicha') cachorro próprio */
function ico(name, weight) {
  weight = weight || 'duotone';
  if (name === 'salsicha') return '<i class="pk-icon pk-salsicha' + (weight === 'duotone' ? ' pk-duo' : '') + '" aria-hidden="true"></i>';
  return '<i class="' + (weight === 'regular' ? 'ph' : 'ph-' + weight) + ' ph-' + name + '" aria-hidden="true"></i>';
}
/* texto sem HTML, para aria-label */
function txt(h) { return String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

/* ---------- estrutura do celular ---------- */
function sb(time) {
  return '<div class="sb"><span>' + (time || '9:41') + '</span><span class="island"></span><span class="sbi">' +
    ico('cell-signal-full', 'fill') + ico('wifi-high', 'fill') + ico('battery-full', 'fill') + '</span></div>';
}
/* barra de abas: 'hoje' | 'prog' | 'jor' | 'aj' */
function tb(active) {
  var tabs = [['hoje', 'sun', 'Hoje'], ['prog', 'chart-line-up', 'Progresso'], ['jor', 'path', 'Jornada'], ['aj', 'gear-six', 'Ajustes']];
  return '<nav class="tb" role="tablist" aria-label="Seções">' + tabs.map(function (t) {
    var on = t[0] === active;
    return '<span role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '">' + ico(t[1], on ? 'fill' : 'regular') + t[2] + '</span>';
  }).join('') + '</nav>';
}
/* o celular. o: { time, body, tab, tall, h, overlay, cls, nohome } */
function phone(o) {
  var cls = 'phone' + (o.tall ? ' tall' : '') + (o.cls ? ' ' + o.cls : '');
  return '<div class="' + cls + '"' + (o.h ? ' style="height:' + o.h + 'px"' : '') + '>' + sb(o.time) +
    '<div class="scr">' + o.body + '</div>' + (o.tab ? tb(o.tab) : '') + (o.overlay || '') +
    (o.nohome ? '' : '<span class="hi"></span>') + '</div>';
}
/* folha que sobe de baixo; vai em phone({ overlay: sheet(...) }). o: { top } para folha alta; { label } nomeia a folha sem título.
   Fecha pelo X, arrastando para baixo ou tocando no fundo. O foco entra no título e fica preso na folha. */
function sheet(title, body, o) {
  o = o || {};
  var name = o.label || txt(title);
  return '<div class="dim" aria-hidden="true"></div><div class="sheet" role="dialog" aria-modal="true"' + (name ? ' aria-label="' + name + '"' : '') +
    (o.top ? ' style="top:' + o.top + 'px"' : '') + '><span class="grab" aria-hidden="true"></span>' +
    (title ? '<div class="sh-h"><h3>' + title + '</h3><span class="xbtn" role="button" aria-label="Fechar">' + ico('x', 'bold') + '</span></div>' : '') + body + '</div>';
}
/* cabeçalho com título grande. o: { date, title, right } */
function hd(o) {
  return '<div class="hd"><div class="hd-row"><span class="date">' + (o.date || '') + '</span>' + (o.right || '') + '</div><h1 class="lt">' + o.title + '</h1></div>';
}
/* barra de navegação de tela empurrada. o: { back, title, act, left, actLabel (nome da ação quando act é só ícone) }
   Tela empurrada: back ('‹ Hoje'). Formulário modal: left ('Cancelar') e act ('Criar' ao criar, 'Salvar' ao editar). */
function nb(o) {
  var left = o.left ? '<span class="back" role="button">' + o.left + '</span>'
    : (o.back ? '<span class="back" role="button" aria-label="Voltar para ' + txt(o.back) + '">' + ico('caret-left', 'bold') + o.back + '</span>' : '<span></span>');
  var act = o.act ? ' role="button"' + (txt(o.act) ? '' : ' aria-label="' + (o.actLabel || 'Adicionar') + '"') : '';
  return '<div class="nb">' + left + '<span class="nbt"' + (o.title ? ' role="heading" aria-level="1"' : '') + '>' + (o.title || '') + '</span><span class="act"' + act + '>' + (o.act || '') + '</span></div>';
}
function gl(label, right) { return '<div class="gl">' + label + (right ? '<span>' + right + '</span>' : '') + '</div>'; }

/* ---------- peças ---------- */
function ring(size, sw, pct, col, trk) {
  var r = (size - sw) / 2, c = 2 * Math.PI * r;
  return '<svg class="ringsvg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" aria-hidden="true">' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" style="fill:none;stroke:' + (trk || 'var(--track)') + ';stroke-width:' + sw + '"/>' +
    (pct > 0 ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" style="fill:none;stroke:' + (col || 'var(--accent-mark)') + ';stroke-width:' + sw +
      ';stroke-linecap:round;stroke-dasharray:' + c.toFixed(2) + ';stroke-dashoffset:' + (c * (1 - Math.min(1, pct))).toFixed(2) + '"/>' : '') + '</svg>';
}
/* anel com conteúdo no centro */
function ringBox(size, sw, pct, center, col, trk) {
  return '<span class="ringbox" style="width:' + size + 'px;height:' + size + 'px">' + ring(size, sw, pct, col, trk) + '<span class="rc">' + center + '</span></span>';
}
/* semana com anéis. vals: 7 números de 0 a 1; today: índice; nums: dias do mês;
   head (opcional): HTML acima dos anéis, no mesmo cartão (é o que weekCard() usa). Cada dia abre aquele dia. */
function week(vals, today, nums, head) {
  var d = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'], full = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  nums = nums || [19, 20, 21, 22, 23, 24, 25];
  var days = d.map(function (x, i) {
    var cls = 'wkd' + (i === today ? ' today' : '') + (i > today ? ' future' : '');
    var lab = full[i] + ', ' + nums[i] + (i > today ? '' : '. ' + Math.round((vals[i] || 0) * 100) + '% do dia feito');
    return '<div role="listitem" aria-label="' + lab + '" class="' + cls + '"><span aria-hidden="true">' + x + '</span><span class="rg" aria-hidden="true">' +
      ring(36, 3.5, vals[i] || 0, i === today ? 'var(--accent-ink)' : 'var(--accent-mark)') + '<b>' + nums[i] + '</b></span></div>';
  }).join('');
  if (head) return '<div class="card wkc"><div class="wkh">' + head + '</div><div class="wk" role="list" aria-label="Semana">' + days + '</div></div>';
  return '<div class="card wk" role="list" aria-label="Semana">' + days + '</div>';
}
/* círculo de marcar. label (opcional): nome do hábito, para o leitor de tela */
function chk(on, label) {
  return '<span class="chk' + (on ? ' on' : '') + '" role="checkbox" aria-checked="' + !!on + '"' + (label ? ' aria-label="' + label + '"' : '') + '>' + ico('check', 'bold') + '</span>';
}
function vpill(text, o) { o = o || {}; return '<span class="vpill' + (o.ghost ? ' ghost' : '') + (o.ok ? ' ok' : '') + '">' + (o.icon ? ico(o.icon, 'bold') : '') + text + '</span>'; }
/* bolinhas e slots são decorativos: sempre vêm com o texto "x de y" ao lado */
function dots(total, on) { var s = '<span class="dots" aria-hidden="true">'; for (var i = 0; i < total; i++) s += '<i class="' + (i < on ? 'on' : '') + '"></i>'; return s + '</span>'; }
/* nota de 1 a 5 só para leitura (Progresso). Na linha do Hoje, use doPill('Dar nota'), que abre a folha da nota */
function r5(sel) {
  var s = '<span class="r5" role="img" aria-label="' + (sel ? 'Nota ' + sel + ' de 5' : 'Sem nota') + '">';
  for (var i = 1; i <= 5; i++) s += '<span class="' + (i === sel ? 'on' : '') + '" aria-hidden="true">' + i + '</span>';
  return s + '</span>';
}
/* metas (kind 'on') e orçamentos (kind 'used') da semana */
function slots(total, n, kind) { var s = '<span class="slots" aria-hidden="true">'; for (var i = 0; i < total; i++) s += '<i class="' + (i < n ? (kind || 'on') : '') + '"></i>'; return s + '</span>'; }
/* linha de hábito. o: { p pilar, ic ícone, t título, s subtítulo (html), r lado direito (html), done } */
function hr(o) {
  return '<div class="hr' + (o.done ? ' done' : '') + '" data-pillar="' + (o.p || 'accent') + '"><span class="bub">' + ico(o.ic) + '</span>' +
    '<span class="ht"><b>' + o.t + '</b>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span>' + (o.r || '') + '</div>';
}
/* chip. Com o.sel definido (true ou false), vira botão de ligar e desligar (aria-pressed) */
function chip(text, o) {
  o = o || {};
  var a = o.sel !== undefined ? ' role="button" aria-pressed="' + !!o.sel + '"' : '';
  return '<span class="chip' + (o.sel ? ' sel' : '') + (o.tint ? ' tint' : '') + (o.ok ? ' ok' : '') + '"' + a + '>' + (o.icon ? ico(o.icon, o.iw || 'bold') : '') + text + (o.small ? ' <small>' + o.small + '</small>' : '') + '</span>';
}
/* botão. o: { kind 'p'|'s'|'g'|'tintb'|'warn', sm, w, icon } */
function btn(text, o) {
  o = o || {};
  return '<span class="btn ' + (o.kind || 'p') + (o.sm ? ' sm' : '') + (o.w ? ' w' : '') + '" role="button">' + (o.icon ? ico(o.icon, o.iw || 'bold') : '') + text + '</span>';
}
/* interruptor. label (opcional): o que ele liga */
function sw(on, label) { return '<span class="sw' + (on ? ' on' : '') + '" role="switch" aria-checked="' + !!on + '"' + (label ? ' aria-label="' + label + '"' : '') + '></span>'; }
/* controle segmentado. label (opcional): nome do grupo */
function seg(opts, sel, label) {
  return '<div class="sg" role="radiogroup"' + (label ? ' aria-label="' + label + '"' : '') + '>' + opts.map(function (o, i) {
    return '<span role="radio" aria-checked="' + (i === sel) + '" class="' + (i === sel ? 'on' : '') + '">' + o + '</span>';
  }).join('') + '</div>';
}
function fld(text, o) { o = o || {}; return '<div class="fld' + (o.ph ? ' fld-ph' : '') + '">' + (o.icon ? ico(o.icon, 'regular') : '') + text + '</div>'; }
/* item de lista estilo Ajustes. o: { ic, p pilar, hue chave da paleta, t, s, rv texto à direita, chev, right html } */
function li(o) {
  var icon = '';
  if (o.ic) {
    var attr = o.hue ? ' class="lic hued" style="' + hueStyle(o.hue) + '"' : (o.p ? ' class="lic" data-pillar="' + o.p + '"' : ' class="lic"');
    icon = '<span' + attr + '>' + ico(o.ic) + '</span>';
  }
  var right = o.right || ('<span class="rv">' + (o.rv || '') + (o.chev === false ? '' : ico('caret-right', 'bold')) + '</span>');
  return '<div class="li' + (o.ic ? '' : ' noic') + '">' + icon + '<span><b>' + o.t + '</b>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span>' + right + '</div>';
}
function lg(items) { return '<div class="lg">' + items.join('') + '</div>'; }
/* barra com segmentos e linha de meta. segs: gramas; scale: valor do fim da barra; meta: valor da linha;
   aria (opcional): frase para o leitor de tela (padrão "46 de 80") */
function pbar(segs, scale, meta, label, thin, aria) {
  var tot = segs.reduce(function (a, b) { return a + b; }, 0);
  var h = '<div class="pb" role="img" aria-label="' + (aria || (meta ? tot + ' de ' + meta : String(tot))) + '"><div class="pb-t' + (thin ? ' thin' : '') + '">' +
    segs.map(function (g) { return '<span class="pb-s" style="width:' + (g / scale * 100).toFixed(2) + '%"></span>'; }).join('') + '</div>';
  if (meta) h += '<span class="pb-m" style="left:' + (meta / scale * 100).toFixed(2) + '%" aria-hidden="true"><span>' + (label || 'meta ' + meta) + '</span></span>';
  return h + '</div>';
}
/* heatmap: estados por dia, de cima para baixo e da esquerda para a direita (7 por coluna).
   d feito · p parcial (meio quadrado) · '' não feito · x pausado · u fora da agenda · f futuro · acrescente ' t' para hoje.
   label (opcional): frase para o leitor de tela; sem ela, conta feitos e parciais */
function heat(states, label) {
  if (!label) {
    var c = { d: 0, p: 0 };
    states.forEach(function (s) { var k = String(s).split(' ')[0]; if (k in c) c[k]++; });
    label = c.d + ' dias feitos, ' + c.p + ' parciais';
  }
  return '<div class="hm" role="img" aria-label="' + label + '">' + states.map(function (s) { return '<i class="' + s + '"></i>'; }).join('') + '</div>';
}
/* legenda do heatmap. items: [['d', 'Feito'], ['p', 'Parcial'], ['', 'Sem registro'], ['d t', 'Hoje']] */
function heatKey(items) {
  return '<div class="hmk" aria-hidden="true">' + items.map(function (x) { return '<span><i class="' + x[0] + '"></i>' + x[1] + '</span>'; }).join('') + '</div>';
}

/* rostinhos: kind 'mood' muda a boca, 'energy' muda os olhos; level 1 a 5 */
function face(kind, l) {
  function mouth(d, closed) { return closed ? '<path class="solid" d="' + d + '"/>' : '<path class="ln" d="' + d + '"/>'; }
  var s = '<svg class="face" viewBox="0 0 32 32" aria-hidden="true"><circle class="f" cx="16" cy="16" r="13"/>';
  if (kind === 'mood') {
    s += '<circle class="dot" cx="11.8" cy="13.4" r="1.15"/><circle class="dot" cx="20.2" cy="13.4" r="1.15"/>';
    s += [mouth('M11 22.2 Q16 17.4 21 22.2'), mouth('M11.6 21.4 Q16 19.3 20.4 21.4'), mouth('M11.6 20.6 L20.4 20.6'), mouth('M11 19.6 Q16 23.8 21 19.6'), mouth('M10.6 18.8 Q16 26.2 21.4 18.8 Z', true)][l - 1];
  } else {
    s += [
      '<path class="ln" d="M9.7 14 Q11.8 15.8 13.9 14"/><path class="ln" d="M18.1 14 Q20.2 15.8 22.3 14"/>',
      '<path class="ln" d="M9.8 13.2 L13.8 13.2"/><path class="ln" d="M18.2 13.2 L22.2 13.2"/><ellipse class="dot" cx="11.8" cy="14.3" rx="1.25" ry=".75"/><ellipse class="dot" cx="20.2" cy="14.3" rx="1.25" ry=".75"/>',
      '<circle class="dot" cx="11.8" cy="13.6" r="1.25"/><circle class="dot" cx="20.2" cy="13.6" r="1.25"/>',
      '<ellipse class="dot" cx="11.8" cy="13.3" rx="1.35" ry="1.8"/><ellipse class="dot" cx="20.2" cy="13.3" rx="1.35" ry="1.8"/>',
      '<ellipse class="dot" cx="11.8" cy="13" rx="1.5" ry="2.3"/><ellipse class="dot" cx="20.2" cy="13" rx="1.5" ry="2.3"/><path class="ln" d="M27.4 4.6 L29.2 2.8"/><path class="ln" d="M29.4 8.6 L31.6 8.2"/>'
    ][l - 1];
    s += [mouth('M13.4 21.4 L18.6 21.4'), mouth('M12.6 21.2 Q16 20.4 19.4 21.2'), mouth('M11.8 20.6 L20.2 20.6'), mouth('M11.2 19.8 Q16 23.2 20.8 19.8'), mouth('M10.8 18.8 Q16 25.6 21.2 18.8 Z', true)][l - 1];
  }
  return s + '</svg>';
}
var FACE_WORDS = { mood: ['Muito mal', 'Mal', 'Ok', 'Bem', 'Muito bem'], energy: ['Esgotado', 'Baixa', 'Ok', 'Boa', 'Alta'] };
/* fileira de 5 rostinhos com palavras; sel = nível escolhido (0 = nenhum) */
function rf(kind, sel) {
  var s = '<div class="rf" role="radiogroup" aria-label="' + (kind === 'mood' ? 'Humor' : 'Energia') + '">';
  for (var l = 1; l <= 5; l++) s += '<div role="radio" aria-checked="' + (l === sel) + '" aria-label="' + FACE_WORDS[kind][l - 1] + ', ' + l + ' de 5" class="' + (l === sel ? 'on' : '') + '">' +
    face(kind, l) + '<span aria-hidden="true">' + FACE_WORDS[kind][l - 1] + '</span></div>';
  return s + '</div>';
}

/* ================= COMPONENTES (base comum; as classes estão no fim de base.css) ================= */
/* linha tracejada de adicionar, no fim da lista */
function addRow(text) { return '<div class="addrow" role="button"><span>' + ico('plus', 'bold') + '</span>' + text + '</div>'; }
/* dias da semana. sel: índices marcados (0 = seg). o: { p pilar, single (escolha única), label } */
function days(sel, o) {
  o = o || {};
  var n = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], full = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
  var role = o.single ? 'radio' : 'checkbox';
  return '<div class="days" role="' + (o.single ? 'radiogroup' : 'group') + '"' + (o.p ? ' data-pillar="' + o.p + '"' : '') + (o.label ? ' aria-label="' + o.label + '"' : '') + '>' +
    n.map(function (d, i) {
      var on = (sel || []).indexOf(i) > -1;
      return '<span role="' + role + '" aria-checked="' + on + '" aria-label="' + full[i] + '" class="' + (on ? 'on' : '') + '">' + d + ico('check', 'bold') + '</span>';
    }).join('') + '</div>';
}
/* valor de horário ou data tocável. o: { off (ainda não vale), raised (sobre fundo sunken) } */
function tval(t, o) { o = o || {}; return '<span class="tval num' + (o.off ? ' off' : '') + (o.raised ? ' raised' : '') + '" role="button">' + t + '</span>'; }
/* topo de fluxo em passos (primeiro acesso, revisão). o: { back (a partir do passo 2), close } */
function stepTop(n, total, o) {
  o = o || {};
  var s = '';
  for (var i = 1; i <= total; i++) s += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
  return '<div class="steptop">' +
    (o.back && n > 1 ? '<span class="ibtn" role="button" aria-label="Voltar">' + ico('caret-left', 'bold') + '</span>' : '<span></span>') +
    '<span class="steps" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + n + '" aria-label="Passo ' + n + ' de ' + total + '">' + s + '</span>' +
    (o.close ? '<span class="xbtn" role="button" aria-label="Fechar">' + ico('x', 'bold') + '</span>' : '<span></span>') + '</div>';
}
/* barra fina de porcentagem (força, pilares, notas) */
function mbar(pct, thick) { return '<span class="mbar' + (thick ? ' thick' : '') + '" aria-hidden="true"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></span>'; }
/* selo pequeno. o: { p pilar, icon, iw, dot, up (caixa alta), lift (fundo branco sobre wash) } */
function tag(text, o) {
  o = o || {};
  return '<span class="tag' + (o.dot ? ' dot' : '') + (o.up ? ' up' : '') + (o.lift ? ' lift' : '') + '"' + (o.p ? ' data-pillar="' + o.p + '"' : '') + '>' +
    (o.icon ? ico(o.icon, o.iw || 'bold') : '') + text + '</span>';
}
/* limite da semana (tranqueiras, refeições livres), com quanto já foi usado. o: { p, t, s, used, total } */
function budget(o) {
  return '<div class="between budget" data-pillar="' + (o.p || 'accent') + '"><span><b>' + o.t + '</b><span class="cap">' + o.s + '</span></span>' +
    '<span class="row" style="gap:8px">' + slots(o.total, o.used, 'used') + '<span class="cap num">' + o.used + ' de ' + o.total + '</span></span></div>';
}
/* cabeçalho de cartão: título, legenda e algo à direita */
function ch(t, s, right) { return '<div class="ch"><span><b>' + t + '</b>' + (s ? '<span class="cap">' + s + '</span>' : '') + '</span>' + (right || '') + '</div>'; }
function radio(on) { return '<span class="radio' + (on ? ' on' : '') + '" role="radio" aria-checked="' + !!on + '"></span>'; }
/* aviso com Desfazer, 5 s, acima das abas (desenho do grupo I).
   toast('Caminhada marcada') ou toast({ p, ic, t, s, act ('Desfazer'), actIcon, fio (0 a 1), fill, low (tela sem abas) }) */
function toast(a, b) {
  var o = typeof a === 'object' ? a : (function (x) { x.t = a; return x; })(b || {});
  var act = o.act || 'Desfazer';
  return '<div class="toast' + (o.ic ? '' : ' noic') + (o.low ? ' low' : '') + '" role="status" data-pillar="' + (o.p || 'accent') + '">' +
    (o.ic ? '<span class="tic">' + ico(o.ic, 'bold') + '</span>' : '') +
    '<span class="tt"><b>' + o.t + '</b>' + (o.s ? '<small>' + o.s + '</small>' : '') + '</span>' +
    '<span class="tact' + (o.fill ? ' fill' : '') + '" role="button">' + (o.actIcon ? ico(o.actIcon, 'bold') : '') + act + '</span>' +
    (o.fio != null ? '<span class="fio" aria-hidden="true"><i style="width:' + Math.round(o.fio * 100) + '%"></i></span>' : '') + '</div>';
}

/* ================= PEÇAS DO HOJE (vindas de f-hoje.js; regras no SPEC) ================= */
/* cartão da semana com o resumo do dia. O topo abre o Progresso; cada dia abre aquele dia.
   feitos: hábitos feitos hoje (de 12); pct: constância da semana; vals: 7 valores de 0 a 1; today e nums opcionais */
function weekCard(feitos, pct, vals, today, nums) {
  var head = '<span class="sub"><b class="num">' + feitos + ' de 12</b> <span class="muted">feitos hoje</span></span>' +
    '<span class="cap wkgo" role="button" aria-label="' + pct + '% na semana. Abre o Progresso"><span class="num">' + pct + '%</span> na semana' + ico('caret-right', 'bold') + '</span>';
  return week(vals, today == null ? 3 : today, nums, head);
}
/* momento do dia recolhido (distante ou completo), que abre no lugar.
   icons: ['broom|familia', ...]; mais: quantos ícones não couberam (0 = nenhum) */
function fold(icons, mais, titulo, sub) {
  return '<div class="card fold" role="button" aria-expanded="false"><span class="ics" aria-hidden="true">' + icons.map(function (x) {
    var p = x.split('|'); return '<span class="bub" data-pillar="' + p[1] + '">' + ico(p[0]) + '</span>';
  }).join('') + (mais ? '<span class="bub more">+' + mais + '</span>' : '') + '</span>' +
    '<span><b>' + titulo + '</b><small>' + sub + '</small></span><span class="cv" aria-hidden="true">' + ico('caret-down', 'bold') + '</span></div>';
}
/* pílula que abre a folha do registro ("Dar nota", ou a nota dada: "4 · Bom") */
function doPill(texto) { return '<span class="dop" role="button">' + texto + '</span>'; }
/* "+" que usa um do limite da semana */
function plusBtn(label) { return '<span class="chk plus" role="button" aria-label="' + (label || 'Usar um') + '">' + ico('plus', 'bold') + '</span>'; }
/* pílula que soma na hora ("500 ml"), com Desfazer */
function addPill(texto) { return '<span class="addp" role="button" aria-label="Somar ' + txt(texto) + '">' + ico('plus', 'bold') + texto + '</span>'; }
/* cartão de dias sem: número grande na serifa, sem controle (o deslize fica no detalhe do hábito).
   rec: HTML à direita do ícone, como '<span class="cap">recorde 21</span>' */
function semTile(p, ic, n, what, rec) {
  return '<div class="ds" data-pillar="' + p + '" role="button" aria-label="' + n + ' dias sem ' + what + '"><span class="between"><span class="bub sm">' + ico(ic) + '</span>' + (rec || '') + '</span>' +
    '<span class="dn">' + n + '</span><span class="dl">dias sem ' + what + '</span></div>';
}

/* ================= QUADRO ================= */
var Board = (function () {
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var z = 1;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function setTheme(v) {
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.themeBtn === (v || 'system'))); });
  }
  function setZoom(v) {
    z = Math.max(0.25, Math.min(2, Math.round(v * 100) / 100));
    var board = document.getElementById('board'), canvas = document.getElementById('canvas');
    board.style.zoom = z;
    board.style.width = (canvas.clientWidth / z) + 'px';
    document.getElementById('zoomv').textContent = Math.round(z * 100) + '%';
    store('pk-telas-zoom', String(z));
  }
  function fit() {
    var cw = document.getElementById('canvas').clientWidth;
    setZoom(Math.min(1, cw / (390 * 3 + 56 * 2 + 128)));
  }

  function render() {
    if (EXTRA_CSS.length) { var st = document.createElement('style'); st.textContent = EXTRA_CSS.join('\n'); document.head.appendChild(st); }
    var only = params.get('only') ? params.get('only').split(',') : null;
    var board = document.getElementById('board'), side = document.getElementById('side');
    var html = '', nav = '', n = 0, total = 0;
    SECTIONS.forEach(function (s) { total += FRAMES.filter(function (f) { return f.section === s[0]; }).length; });
    if (!only) {
      html += '<div class="cover"><span class="ey">Prokopē · telas v0.2 · 22 de outubro de 2026</span><h1>Todas as telas</h1>' +
        '<p>O app inteiro como ele foi pensado: ' + total + ' telas em ' + SECTIONS.length + ' fluxos. Os dados são ilustrativos e imaginam uma quinta-feira na semana 2 da fase 2 (Alimentação). Use o tema no topo para ver tudo no claro e no escuro, e a lista ao lado para pular para uma tela.</p>' +
        '<div class="flows">' + SECTIONS.map(function (s) {
          var c = FRAMES.filter(function (f) { return f.section === s[0]; }).length;
          return '<div><b>' + s[1] + ' · ' + c + '</b><span>' + s[2] + '</span></div>';
        }).join('') + '</div></div>';
    }
    SECTIONS.forEach(function (s) {
      var list = FRAMES.filter(function (f) { return f.section === s[0]; });
      var visible = !only || only.indexOf(s[0]) > -1;
      nav += '<h6>' + s[1] + '<span>' + list.length + '</span></h6>';
      var frames = '';
      list.forEach(function (f) {
        n++;
        var id = 'f' + n;
        nav += '<a data-go="' + id + '"><i class="ph ph-' + (f.opts.desk ? 'desktop' : 'device-mobile') + '"></i>' + f.name + '</a>';
        if (visible) frames += '<div class="cv-frame" id="' + id + '"><div class="cv-label"><small>' + String(n).padStart(2, '0') + '</small>' + f.name + '</div>' + f.html + (f.note ? '<p class="cv-note"' + (f.opts.desk ? ' style="max-width:720px"' : '') + '>' + f.note + '</p>' : '') + '</div>';
      });
      if (visible && list.length) html += '<section class="cv-section" id="s-' + s[0] + '"><header><b>' + s[1] + '</b><span>' + s[2] + '</span><em>' + list.length + '</em></header><div class="cv-frames">' + frames + '</div></section>';
    });
    board.innerHTML = html;
    side.innerHTML = nav;
    document.getElementById('count').textContent = total + ' telas';
    side.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go]'); if (!a) return;
      var el = document.getElementById(a.dataset.go); if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400);
    });
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.dataset.themeBtn); store('pk-telas-theme', b.dataset.themeBtn); });
    });
    document.getElementById('zin').addEventListener('click', function () { setZoom(z + 0.1); });
    document.getElementById('zout').addEventListener('click', function () { setZoom(z - 0.1); });
    document.getElementById('zfit').addEventListener('click', fit);
    document.getElementById('z100').addEventListener('click', function () { setZoom(1); });
    window.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea')) return;
      if (e.key === '+' || e.key === '=') setZoom(z + 0.1);
      else if (e.key === '-') setZoom(z - 0.1);
      else if (e.key === '0') setZoom(1);
      else if (e.key === '1') fit();
    });
    window.addEventListener('resize', function () { setZoom(z); });
    setTheme(params.get('theme') || read('pk-telas-theme') || 'system');
    if (params.get('zoom')) setZoom(parseFloat(params.get('zoom')));
    else if (read('pk-telas-zoom')) setZoom(parseFloat(read('pk-telas-zoom')));
    else fit();
  }
  return { render: render };
})();
