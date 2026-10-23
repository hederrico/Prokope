/* Prokopē · laboratório de movimento · mola e curvas
   A mola usa os mesmos parâmetros do Motion: visualDuration (segundos até parecer parada) e bounce (0 a 1).
   Igual ao Motion: rigidez = (2π / (1,2 · visualDuration))², massa 1, amortecimento relativo = 1 − bounce (entre 0,05 e 1).
   Funciona no navegador (window.Mola) e no node (require('./mola.js')). Sem dependências. */
(function (root) {
  'use strict';

  /* limites de repouso do Motion: valores pequenos (escala, opacidade) usam os "granular" */
  var REST = { speed: { granular: 0.01, normal: 2 }, delta: { granular: 0.005, normal: 0.5 } };

  function clamp(min, max, v) { return Math.min(max, Math.max(min, v)); }

  /* parâmetros físicos a partir de { visualDuration, bounce } */
  function params(spec) {
    var vd = spec.visualDuration, w = (2 * Math.PI) / (vd * 1.2);
    var zeta = clamp(0.05, 1, 1 - (spec.bounce || 0));
    return { stiffness: w * w, damping: 2 * zeta * w, mass: 1, zeta: zeta, w0: w, visualDuration: vd, bounce: spec.bounce || 0 };
  }

  /* solução exata do oscilador. from, to: valores; v0: velocidade inicial em unidades por segundo.
     devolve { x(t), v(t) } com t em segundos */
  function solve(spec, from, to, v0) {
    var p = spec.w0 ? spec : params(spec), w = p.w0, z = p.zeta, y0 = from - to;
    v0 = v0 || 0;
    if (z < 1) {
      var a = z * w, wd = w * Math.sqrt(1 - z * z), B = (v0 + a * y0) / wd;
      return {
        x: function (t) { return to + Math.exp(-a * t) * (y0 * Math.cos(wd * t) + B * Math.sin(wd * t)); },
        v: function (t) { return Math.exp(-a * t) * (v0 * Math.cos(wd * t) - (a * B + y0 * wd) * Math.sin(wd * t)); }
      };
    }
    var Bc = v0 + w * y0;
    return {
      x: function (t) { return to + Math.exp(-w * t) * (y0 + Bc * t); },
      v: function (t) { return Math.exp(-w * t) * (v0 - w * Bc * t); }
    };
  }

  function rest(from, to) {
    var g = Math.abs(to - from) < 5;
    return { delta: g ? REST.delta.granular : REST.delta.normal, speed: g ? REST.speed.granular : REST.speed.normal };
  }

  /* tempo (s) até a mola ficar parada, pelo mesmo critério do Motion */
  function duration(spec, from, to, v0) {
    var s = solve(spec, from, to, v0), r = rest(from, to), step = 0.001;
    for (var t = 0; t < 10; t += step) {
      if (Math.abs(s.x(t) - to) <= r.delta && Math.abs(s.v(t)) <= r.speed) return t;
    }
    return 10;
  }

  /* curva para a Web Animations API: { easing: 'linear(...)', duration (s), peak } */
  function linear(spec, from, to, v0) {
    var d = to - from;
    if (Math.abs(d) < 1e-9) return null;
    var s = solve(spec, from, to, v0), T = duration(spec, from, to, v0);
    var n = clamp(16, 240, Math.ceil(T / 0.008)), pts = [], peak = 0;
    for (var i = 0; i <= n; i++) {
      var q = i === n ? 1 : (s.x(T * i / n) - from) / d;
      peak = Math.max(peak, q);
      pts.push(+q.toFixed(4));
    }
    return { easing: 'linear(' + pts.join(', ') + ')', duration: T, peak: peak };
  }

  /* integração quadro a quadro (para gestos): estado { x, v }; dt em segundos.
     Runge-Kutta 4 em passos de 1/480 s, para ficar igual à solução exata */
  function step(spec, state, to, dt) {
    var p = spec.w0 ? spec : params(spec), k = p.stiffness, c = p.damping, h = 1 / 480;
    function acc(x, v) { return -k * (x - to) - c * v; }
    var x = state.x, v = state.v, left = dt;
    while (left > 1e-9) {
      var dh = Math.min(h, left);
      var k1x = v, k1v = acc(x, v);
      var k2x = v + k1v * dh / 2, k2v = acc(x + k1x * dh / 2, v + k1v * dh / 2);
      var k3x = v + k2v * dh / 2, k3v = acc(x + k2x * dh / 2, v + k2v * dh / 2);
      var k4x = v + k3v * dh, k4v = acc(x + k3x * dh, v + k3v * dh);
      x += (k1x + 2 * k2x + 2 * k3x + k4x) * dh / 6;
      v += (k1v + 2 * k2v + 2 * k3v + k4v) * dh / 6;
      left -= dh;
    }
    state.x = x; state.v = v;
    return state;
  }
  function settled(state, to, from) {
    var r = rest(from === undefined ? state.x : from, to);
    return Math.abs(state.x - to) <= r.delta && Math.abs(state.v) <= r.speed;
  }

  /* cubic-bezier do CSS: progresso y para o tempo x (0 a 1), e a derivada dy/dx */
  function bezier(x1, y1, x2, y2) {
    function cx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function cy(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    function dx(t) { return 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; }
    function dy(t) { return 3 * y1 * (1 - t) * (1 - t) + 6 * (y2 - y1) * t * (1 - t) + 3 * (1 - y2) * t * t; }
    function tFor(x) {
      var t = x;
      for (var i = 0; i < 8; i++) { var e = cx(t) - x, d = dx(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      if (t < 0 || t > 1 || Math.abs(cx(t) - x) > 1e-4) { var lo = 0, hi = 1; t = x; for (var j = 0; j < 30; j++) { if (cx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
      return t;
    }
    var f = function (x) { if (x <= 0) return 0; if (x >= 1) return 1; return cy(tFor(x)); };
    f.slope = function (x) { x = clamp(0, 1, x); var t = tFor(x), d = dx(t); return d < 1e-6 ? 0 : dy(t) / d; };
    /* o primeiro x em que a curva chega ao progresso y (para "quando a barra encosta na linha") */
    f.inverse = function (y) { if (y <= 0) return 0; if (y >= 1) return 1; var lo = 0, hi = 1; for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
    f.css = 'cubic-bezier(' + [x1, y1, x2, y2].join(', ') + ')';
    return f;
  }

  var Mola = { params: params, solve: solve, duration: duration, linear: linear, step: step, settled: settled, bezier: bezier, rest: rest };
  if (typeof module !== 'undefined' && module.exports) module.exports = Mola; else root.Mola = Mola;
})(this);
