// O Zeno em cena: o palco (um canvas só do tamanho dele, que o acompanha pela tela), o estado do corpo, o olhar,
// a fala, o desenho de cada quadro e os toques. Este arquivo, o boneco e o three.js chegam sob demanda, no primeiro
// enter() (src/zeno/index.ts). O comportamento é o do laboratório (docs/mascote/laboratorio.html), no estilo argila.
//
// O canvas não cobre a tela: a câmera é a da coluna inteira do app (a mesma conta do laboratório), e o desenho sai só
// do pedaço em volta dele (setViewOffset). Assim o Zeno fica igual ao do laboratório, com uma fração dos pixels.
import * as THREE from 'three';
import {
  applyLights,
  buildRig,
  L,
  makeCanvas,
  paintShell,
  R,
  releaseGpu,
  SHELL_C,
  SNOT_DIR,
  type Rig,
} from './character';
import type { Oklch } from './color';
import { talkSeconds, ZENO_LINES } from './lines';
import { FrameLoop } from './loop';
import {
  canvasBox,
  cornerSpot,
  drawRatio,
  spotAwayFrom,
  spotFor,
  unitPx,
  type Rect,
  type Spot,
  type StageMetrics,
} from './place';
import * as S from './scenes';
import {
  aim,
  clamp,
  easeOut,
  FACE,
  isSettled,
  lerp,
  makeParams,
  rand,
  SPRINGS,
  stepParam,
  type Param,
  type ParamName,
  type Pose,
  type SpringName,
} from './springs';
import type { ZenoGaze, ZenoPlace, ZenoScene, ZenoTap, ZenoTarget } from './types';

/**
 * O que o resto do app entrega ao Zeno e recebe dele (src/zeno/index.ts). Este pedaço não importa nada do app:
 * as cores dos pilares e o movimento reduzido chegam por aqui.
 */
export interface ZenoBridge {
  /** as cores das placas do casco, na ordem dos pilares ativos, no tema pedido */
  shell(dark: boolean): Oklch[];
  /** avisa quando os pilares mudam; devolve o cancelamento */
  onPillars(cb: () => void): () => void;
  /** o movimento reduzido: o do sistema ou "Animações" desligado */
  reduced(): boolean;
  /** avisa quando o movimento reduzido muda; devolve o cancelamento */
  onMotion(cb: () => void): () => void;
  presence(present: boolean): void;
  moved(): void;
  tapped(tap: ZenoTap): void;
}

export type Look = { type: 'camera' } | { type: 'none' } | { type: 'point'; v: THREE.Vector3 };
type EyeMode = 'open' | 'happy' | 'sleep';
type Sleep = 'pausa' | 'noite' | 'tedio' | null;

/** A cena foi interrompida por outra. */
export class Cancel {}

export interface Run {
  alive(): boolean;
  /** espera em tempo de cena; rejeita com Cancel se outra cena começar */
  wait(ms: number): Promise<void>;
}

interface Wait {
  at: number;
  res: () => void;
  rej: (e: Cancel) => void;
}

const FOV = 20;
/** Depois de sair de cena, quanto tempo o contexto do WebGL fica guardado antes de ser solto (ms). */
export const RELEASE_MS = 30_000;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hv = new THREE.Vector3();
const _dv = new THREE.Vector3();
const _bv = new THREE.Vector3();
const _pv = new THREE.Vector3();
const GLANCE = 'h1, h2, button, [role="button"], a[href], [data-tour], input';

export class ZenoRuntime {
  readonly P = makeParams();
  private readonly PL: Param[] = Object.values(this.P);
  readonly rig: Rig;
  readonly loop: FrameLoop;
  /** a coluna inteira do app: as contas (projetar, mirar, tocar) */
  private readonly viewCam = new THREE.PerspectiveCamera(FOV, 1, 1, 100);
  /** só o pedaço do canvas: o desenho */
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 1, 100);
  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private readonly snapCanvas: HTMLCanvasElement;
  private readonly hit: HTMLDivElement;
  private readonly probe: HTMLDivElement;

  simTime = 0;
  present = false;
  sleeping: Sleep = null;
  /** apontando: o braço fica no alvo até rest() */
  hold: { v: THREE.Vector3 } | null = null;
  W = 1;
  H = 1;
  private unit = 1;
  readonly home = new THREE.Vector3();
  spot: Spot = { side: 'left', row: 'bottom', x: 0, y: 0 };
  /** o último lugar pedido (enter, moveTo): a barra de abas que aparece ou a tela que gira refazem a conta */
  private place: ZenoPlace = 'bottom';

  private idleNext = 3;
  private lastUser = 0;
  private nextGaze = 0;
  private lastIdle = '';
  private look: Look = { type: 'camera' };
  private lookUntil = 0;
  private lookTimer: ReturnType<typeof setTimeout> | undefined;
  private idleX = 0;
  private idleY = 0;
  private nextSacc = 0;
  private eyeMode: EyeMode = 'open';
  private eyeSwap: { mode: EyeMode; t0: number; done: boolean } | null = null;
  private blinkT = -1;
  private nextBlink = 1;
  private talkStart = 0;
  private talkUntil = 0;
  private fading = false;
  private fadeTimer: ReturnType<typeof setTimeout> | undefined;
  private lastFadeFrame = -1;
  private shellFade: { t0: number; dur: number } | null = null;
  private shellPrev: HTMLCanvasElement | null = null;
  private shellNext: HTMLCanvasElement | null = null;
  private walkPhase = 0;
  private breathAmp = 0;
  private breathPhase = 0;
  private talkM = 0;
  private snotOn = 0;
  private popT = -1;
  private popMul = 1;

  private token = 0;
  private sceneRunning = false;
  private idleRunning = false;
  private readonly waits: Wait[] = [];
  private readonly timers = new Map<ReturnType<typeof setTimeout>, (e: Cancel) => void>();

  private dark: boolean;
  private reducedNow: boolean;
  private box: Rect | null = null;
  private hitBox = '';
  private lastAnchor: Rect | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly resize = new ResizeObserver(() => this.layout());

  constructor(
    private host: HTMLElement,
    private readonly bridge: ZenoBridge,
  ) {
    this.dark = isDark();
    this.reducedNow = bridge.reduced();
    this.rig = buildRig(bridge.shell(this.dark));
    applyLights(this.rig, this.dark);
    this.rig.zeno.visible = false;
    this.rig.shadow.visible = false;

    this.snapCanvas = document.createElement('canvas');
    this.snapCanvas.className = 'zn-gl zn-snap';
    this.hit = document.createElement('div');
    this.hit.className = 'zn-hit';
    this.hit.hidden = true;
    this.probe = document.createElement('div');
    this.probe.className = 'zn-probe';
    this.attach(host);

    this.loop = new FrameLoop({
      frame: this.frame,
      busy: () => this.busy(),
      calm: () => this.calm(),
      ready: () => !!this.renderer,
    });

    // o tema pintado (data-theme ou o do sistema), o movimento reduzido e os pilares
    new MutationObserver(() => this.onTheme()).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.onTheme());
    bridge.onMotion(() => this.onMotion());
    bridge.onPillars(() => this.updateShell(true));
    this.resize.observe(host);
    // a barra de abas aparece e some com a navegação: o lugar de baixo muda junto
    const app = host.closest('.sh-app');
    if (app)
      new MutationObserver(() => this.layout()).observe(app, { attributes: true, attributeFilter: ['data-tabs'] });
  }

  /** O palco mudou de lugar no DOM (o ZenoHost montou de novo). */
  attach(host: HTMLElement): void {
    const moved = this.host !== host;
    this.host = host;
    host.append(...[this.canvas, this.snapCanvas, this.hit, this.probe].filter((n) => n !== null));
    if (moved) {
      this.resize.disconnect();
      this.resize.observe(host);
    }
    if (this.renderer) this.layout();
  }

  /* ---------- palco: renderer, tamanho e lugar ---------- */

  /** Cria o canvas e o contexto do WebGL (no primeiro enter, ou depois de soltos). Falso se o aparelho não deixou. */
  ensureRenderer(): boolean {
    if (this.renderer) return true;
    clearTimeout(this.releaseTimer);
    const canvas = document.createElement('canvas');
    canvas.className = 'zn-gl';
    canvas.hidden = true;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (err) {
      console.warn('O Zeno não conseguiu o WebGL.', err);
      return false;
    }
    this.renderer.setClearColor(0x000000, 0);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.loop.stop();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.box = null;
      this.wake();
    });
    this.canvas = canvas;
    this.host.insertBefore(canvas, this.snapCanvas);
    this.layout();
    return true;
  }

  /** Solta o que pesa na GPU (o contexto, as geometrias e as texturas). O boneco continua montado na memória. */
  release(): void {
    if (this.present || !this.renderer) return;
    this.loop.stop();
    releaseGpu(this.rig);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas?.remove();
    this.renderer = null;
    this.canvas = null;
    this.box = null;
  }

  private scheduleRelease() {
    clearTimeout(this.releaseTimer);
    this.releaseTimer = setTimeout(() => this.release(), RELEASE_MS);
  }

  private appRect(): DOMRect {
    return this.host.getBoundingClientRect();
  }

  /** O que fica embaixo (a barra de abas, a área segura) e em cima (o cabeçalho da tela). */
  measure(): StageMetrics {
    const app = this.appRect();
    const cs = getComputedStyle(this.probe);
    const safeTop = parseFloat(cs.paddingTop) || 0;
    let bottom = parseFloat(cs.paddingBottom) || 0;
    const shell = this.host.closest('.sh-app');
    const tb = shell?.hasAttribute('data-tabs') ? shell.querySelector('.sh-tb') : null;
    if (tb) {
      const t = tb.getBoundingClientRect();
      if (t.height > 0 && t.top < app.bottom) bottom = Math.max(bottom, app.bottom - t.top);
    }
    // numa tela cheia, o pé preso (o Continuar do Começar) conta como a barra de abas: ele fica em cima do botão
    for (const el of (shell ?? document).querySelectorAll('.sh-full-foot')) {
      const f = el.getBoundingClientRect();
      if (f.height > 0 && f.top < app.bottom && f.top > app.top + app.height / 2)
        bottom = Math.max(bottom, app.bottom - f.top);
    }
    let top = safeTop;
    for (const el of (shell ?? document).querySelectorAll('.sh-main .sh-hd, .sh-main .sh-nb, .sh-main .sh-steptop')) {
      const b = el.getBoundingClientRect();
      if (b.height > 0 && b.bottom > app.top && b.top < app.top + app.height / 3)
        top = Math.max(top, b.bottom - app.top);
    }
    return { width: this.W, height: this.H, bottomInset: bottom, topInset: Math.min(top, this.H / 2), safeTop };
  }

  private layout = () => {
    const r = this.appRect();
    const W = Math.max(1, Math.round(r.width));
    const H = Math.max(1, Math.round(r.height));
    const resized = W !== this.W || H !== this.H;
    this.W = W;
    this.H = H;
    this.unit = unitPx(H);
    const dist = H / this.unit / 2 / Math.tan((FOV * Math.PI) / 360);
    for (const cam of [this.viewCam, this.camera]) {
      cam.aspect = W / H;
      cam.near = dist * 0.5;
      cam.far = dist * 2;
      cam.position.set(0, dist * Math.tan((4 * Math.PI) / 180), dist);
      cam.lookAt(0, 0, 0);
      // a câmera das contas nunca é desenhada: a matriz dela só fica certa com esta chamada
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();
    }
    if (this.renderer && this.canvas) {
      const b = canvasBox(0, 0, H);
      this.renderer.setPixelRatio(drawRatio(window.devicePixelRatio));
      this.renderer.setSize(b.width, b.height, false);
      for (const c of [this.canvas, this.snapCanvas]) {
        c.style.width = `${b.width}px`;
        c.style.height = `${b.height}px`;
      }
      this.snapCanvas.width = this.canvas.width;
      this.snapCanvas.height = this.canvas.height;
    }
    this.box = null;
    // o mesmo lugar (lado e fileira, ou o canto) com as medidas novas: desliza até lá, ou vai direto se a tela mudou
    // de tamanho
    const next = this.placeAgain();
    if (this.present && (next.x !== this.spot.x || next.y !== this.spot.y)) this.setHome(next, !resized);
    else if (!this.present) this.setHome(next);
    if (this.renderer && this.present) {
      this.draw(0);
      this.wake();
    }
  };

  /**
   * Muda o lugar. Com glide, o desenho continua onde estava e desliza até o lugar novo com a mola calma
   * (a barra de abas apareceu ou sumiu); depois de andar até o lugar, não sobra nada para deslizar.
   */
  setHome(spot: Spot, glide = false): void {
    const P = this.P;
    const fromX = this.home.x + P.rootX.v + P.glideX.v;
    const fromY = this.home.y + P.glideY.v;
    this.spot = spot;
    this.screenToPlane(spot.x, spot.y, this.home);
    if (!glide) return;
    P.rootX.v = P.rootX.t = P.rootX.vel = 0;
    P.rootX.tw = null;
    P.glideX.v = fromX - this.home.x;
    P.glideY.v = fromY - this.home.y;
    if (Math.abs(P.glideX.v) < 1e-3 && Math.abs(P.glideY.v) < 1e-3) {
      for (const p of [P.glideX, P.glideY]) p.v = p.t = p.vel = 0;
      return;
    }
    const snap = this.reduced();
    if (snap) this.crossfade();
    aim(P.glideX, 0, SPRINGS.calma, snap);
    aim(P.glideY, 0, SPRINGS.calma, snap);
    this.wake();
  }

  spotWorld(spot: Pick<Spot, 'x' | 'y'>): THREE.Vector3 {
    return this.screenToPlane(spot.x, spot.y);
  }

  /** Um lugar pedido pelo app. Embaixo, em cima e o canto sem lado ficam do lado onde ele já está. */
  resolvePlace(place: ZenoPlace): Spot {
    const m = this.measure();
    const side = this.present ? this.spot.side : 'left';
    if (place === 'bottom' || place === 'top') return spotFor(side, place, m);
    const app = this.appRect();
    const rel = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return { left: r.left - app.left, top: r.top - app.top, width: r.width, height: r.height };
    };
    if ('corner' in place) {
      const ledge = place.ledge ? resolveTarget(place.ledge) : null;
      const r = ledge?.isConnected ? rel(ledge) : null;
      return cornerSpot(place.side ?? side, place.corner, m, r ? r.top + r.height : null);
    }
    const el = resolveTarget(place.awayFrom);
    if (!el) return spotFor(side, 'bottom', m);
    return spotAwayFrom(rel(el), m, place.room, this.present ? this.spot : null);
  }

  /** O lugar pedido por último, com as medidas de agora (o alvo ou a borda que sumiu ficam no mesmo canto). */
  private placeAgain(): Spot {
    const p = this.place;
    const m = this.measure();
    if (typeof p === 'object') {
      const ref = 'corner' in p ? p.ledge : p.awayFrom;
      const el = ref ? resolveTarget(ref) : null;
      if (!ref || el?.isConnected) return this.resolvePlace(p);
      if ('corner' in p || p.room !== undefined) return cornerSpot(this.spot.side, this.spot.row, m);
    }
    return spotFor(this.spot.side, this.spot.row, m);
  }

  /** O corpo pega o toque (padrão) ou deixa passar para a tela de baixo (o tutorial, com a pessoa usando a tela). */
  setTouch(on: boolean): void {
    this.hit.style.pointerEvents = on ? '' : 'none';
  }

  /** O rootX (em relação ao lugar) que deixa ele inteiro fora da tela, do lado pedido. */
  offset(side: 'left' | 'right'): number {
    const edge = this.screenToPlane(side === 'left' ? 0 : this.W, this.spot.y);
    return side === 'left' ? edge.x - this.home.x - 1.4 : edge.x - this.home.x + 1.4;
  }

  screenToPlane(x: number, y: number, out = new THREE.Vector3()): THREE.Vector3 {
    const cam = this.viewCam;
    const p = new THREE.Vector3((x / this.W) * 2 - 1, -(y / this.H) * 2 + 1, 0.5).unproject(cam);
    const dir = p.sub(cam.position).normalize();
    return out.copy(cam.position).addScaledVector(dir, -cam.position.z / dir.z);
  }

  toScreen(v: THREE.Vector3): { x: number; y: number } {
    _pv.copy(v).project(this.viewCam);
    return { x: ((_pv.x + 1) / 2) * this.W, y: ((1 - _pv.y) / 2) * this.H };
  }

  /** O centro de um elemento de verdade da tela vira um ponto no espaço dele. */
  elWorld(el: Element): THREE.Vector3 {
    const a = el.getBoundingClientRect();
    const b = this.appRect();
    return this.screenToPlane(a.left + a.width / 2 - b.left, a.top + a.height / 2 - b.top);
  }

  groundAt(x: number): THREE.Vector3 {
    return this.screenToPlane(x, this.spot.y - 8);
  }

  headTop(): { x: number; y: number } {
    return this.toScreen(this.rig.head.localToWorld(_bv.set(0, 0.42, 0)));
  }

  /** Um lugar para olhar à toa: partes da tela, o chão e, só de vez em quando, quem está usando. */
  glance(): Look {
    const r = Math.random();
    if (r < 0.22) return S.CAMERA;
    const el = r < 0.75 ? this.pickGlance() : null;
    if (el) return { type: 'point', v: this.elWorld(el) };
    return { type: 'point', v: this.screenToPlane(rand(0.1, 0.9) * this.W, rand(0.35, 0.95) * this.H) };
  }

  private pickGlance(): Element | null {
    const app = this.appRect();
    const root = this.host.closest('.sh-app')?.querySelector('.sh-main') ?? document.body;
    const seen: Element[] = [];
    for (const el of root.querySelectorAll(GLANCE)) {
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.top >= app.top && b.bottom <= app.bottom) seen.push(el);
      if (seen.length >= 40) break;
    }
    return seen.length ? seen[Math.floor(Math.random() * seen.length)] : null;
  }

  /* ---------- parâmetros ---------- */
  reduced(): boolean {
    return this.reducedNow;
  }

  set(vals: Pose, spring: SpringName = 'calma'): void {
    const sp = SPRINGS[spring];
    const snap = this.reduced();
    if (snap) this.crossfade();
    for (const [n, val] of Object.entries(vals)) aim(this.P[n as ParamName], val as number, sp, snap);
    this.wake();
  }

  snapAll(vals: Pose): void {
    for (const [n, val] of Object.entries(vals)) {
      const p = this.P[n as ParamName];
      p.v = p.t = val as number;
      p.vel = 0;
      p.tw = null;
    }
    for (const d of this.rig.dangles) d.reset();
  }

  tween(name: ParamName, fn: (u: number) => number, ms: number): void {
    const p = this.P[name];
    p.t = fn(1);
    if (this.reduced()) {
      this.crossfade();
      p.v = p.t;
      p.vel = 0;
      p.tw = null;
      this.wake();
      return;
    }
    p.tw = { fn, t0: this.simTime, dur: ms / 1000 };
    this.wake();
  }

  private settled(): boolean {
    return this.PL.every(isSettled);
  }

  private aimParam(p: Param, val: number, spring: { k: number; c: number }) {
    if (p.t !== val) {
      p.t = val;
      p.k = spring.k;
      p.c = spring.c;
    }
    if (this.reduced()) {
      p.v = val;
      p.vel = 0;
    }
  }

  /* ---------- olhar: os olhos vão na frente e a cabeça vem depois ---------- */
  /** fade: no movimento reduzido, o olhar novo troca por opacidade (falso quando ele ainda está aparecendo) */
  lookAt(target: Look, holdMs = 0, fade = true): void {
    if (fade && this.reduced() && this.present) this.crossfade();
    this.look = target;
    this.lookUntil = holdMs ? this.simTime + holdMs / 1000 : 0;
    clearTimeout(this.lookTimer);
    // no movimento reduzido o laço para: o olhar volta por relógio
    if (holdMs && this.reduced())
      this.lookTimer = setTimeout(() => {
        if (this.look === target) this.lookAt(S.CAMERA);
      }, holdMs);
    this.wake();
  }

  private updateLook() {
    if (this.lookUntil && this.simTime > this.lookUntil) {
      this.look = S.CAMERA;
      this.lookUntil = 0;
    }
    const P = this.P;
    let yaw = 0;
    let pitch = 0;
    if (this.look.type !== 'none') {
      this.rig.head.getWorldPosition(_hv);
      _dv
        .copy(this.look.type === 'camera' ? this.viewCam.position : this.look.v)
        .sub(_hv)
        .applyAxisAngle(Y_AXIS, -(P.rootYaw.v + P.bodyTwist.v));
      yaw = Math.atan2(_dv.x, _dv.z);
      pitch = Math.atan2(_dv.y, Math.hypot(_dv.x, _dv.z));
    }
    this.aimParam(P.lookYaw, clamp(yaw * 0.7, -0.95, 0.95), SPRINGS.calma);
    this.aimParam(P.lookPitch, clamp(-pitch * 0.6, -0.4, 0.4), SPRINGS.calma);
    this.aimParam(P.eyeX, clamp(yaw * 1.3 + this.idleX + P.gazeX.v, -1, 1), SPRINGS.olho);
    this.aimParam(P.eyeY, clamp(pitch * 1.3 + this.idleY + P.gazeY.v, -1, 1), SPRINGS.olho);
  }

  /* ---------- olhos: aberto, feliz (∩) ou dormindo (∪). A troca passa por uma piscada ---------- */
  private showEyes(mode: EyeMode) {
    for (const s of [L, R]) {
      const E = this.rig.eyes[s];
      E.lid.visible = mode === 'open';
      E.happy.visible = mode === 'happy';
      E.sleep.visible = mode === 'sleep';
    }
  }

  resetEyes(): void {
    this.eyeMode = 'open';
    this.eyeSwap = null;
    this.showEyes('open');
  }

  eyesTo(mode: EyeMode): void {
    if (mode === (this.eyeSwap ? this.eyeSwap.mode : this.eyeMode)) return;
    if (this.reduced()) {
      this.crossfade();
      this.eyeMode = mode;
      this.eyeSwap = null;
      this.showEyes(mode);
      this.wake();
      return;
    }
    this.eyeSwap = { mode, t0: this.simTime, done: false };
    this.wake();
  }

  private eyeSwapMul(): number {
    const sw = this.eyeSwap;
    if (!sw) return 1;
    const u = (this.simTime - sw.t0) / 0.14;
    if (u >= 0.5 && !sw.done) {
      this.eyeMode = sw.mode;
      this.showEyes(this.eyeMode);
      sw.done = true;
    }
    if (u >= 1) {
      this.eyeSwap = null;
      return 1;
    }
    return u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
  }

  /* ---------- fala: a boca e a cabeça mexem pelo tempo da fala ---------- */
  say(text: string): void {
    // no movimento reduzido a boca não mexe (o texto continua no balão de quem conduz)
    if (this.reduced()) return;
    this.talkStart = this.simTime;
    this.talkUntil = this.simTime + talkSeconds(text);
    this.live();
  }

  /** ♪ quando ele cantarola */
  note(): void {
    if (this.reduced()) return;
    const p = this.headTop();
    const n = document.createElement('span');
    n.className = 'zn-note';
    n.textContent = '♪';
    n.style.left = `${p.x + rand(10, 26)}px`;
    n.style.top = `${p.y + 4}px`;
    this.host.appendChild(n);
    n.addEventListener('animationend', () => n.remove());
  }

  popSnot(): void {
    if (this.rig.snot.visible && !this.reduced()) this.popT = this.simTime;
    else this.snotOn = 0;
  }

  /* ---------- troca por opacidade (movimento reduzido) ---------- */
  crossfade(): void {
    const canvas = this.canvas;
    if (!this.renderer || !canvas || !this.rig.zeno.visible || this.lastFadeFrame === this.loop.frames) return;
    this.lastFadeFrame = this.loop.frames;
    this.draw(0);
    const snap = this.snapCanvas;
    const g = snap.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, snap.width, snap.height);
    g.drawImage(canvas, 0, 0, snap.width, snap.height);
    snap.style.transform = canvas.style.transform;
    snap.style.transition = canvas.style.transition = 'none';
    snap.style.opacity = '1';
    canvas.style.opacity = '0';
    this.fading = true;
    clearTimeout(this.fadeTimer);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        snap.style.transition = canvas.style.transition = 'opacity 150ms linear';
        snap.style.opacity = '0';
        canvas.style.opacity = '1';
        this.fadeTimer = setTimeout(() => {
          this.fading = false;
        }, 190);
      }),
    );
    this.wake();
  }

  /** Entrar e sair no movimento reduzido: o desenho aparece ou some por opacidade em 150 ms. */
  fadeStage(on: boolean): Promise<void> {
    const canvas = this.canvas;
    if (!canvas) return Promise.resolve();
    canvas.style.transition = 'none';
    canvas.style.opacity = on ? '0' : '1';
    this.fading = true;
    clearTimeout(this.fadeTimer);
    this.wake();
    return new Promise((res) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          canvas.style.transition = 'opacity 150ms linear';
          canvas.style.opacity = on ? '1' : '0';
          this.fadeTimer = setTimeout(() => {
            this.fading = false;
            res();
          }, 170);
        }),
      ),
    );
  }

  /* ---------- casco trocando de cor (240 ms) ---------- */
  private updateShell(animated: boolean) {
    const cols = this.bridge.shell(this.dark);
    const visible = this.present && !!this.renderer;
    if (!animated || this.reduced() || !visible) {
      if (this.reduced() && visible) this.crossfade();
      paintShell(this.rig.shellCanvas, cols);
      this.rig.shellTex.needsUpdate = true;
      if (visible) {
        this.draw(0);
        this.wake();
      }
      return;
    }
    this.shellPrev ??= makeCanvas(1024, 512);
    this.shellNext ??= makeCanvas(1024, 512);
    this.shellPrev.getContext('2d')?.drawImage(this.rig.shellCanvas, 0, 0);
    paintShell(this.shellNext, cols);
    this.shellFade = { t0: this.simTime, dur: 0.24 };
    this.wake();
  }

  private stepShell() {
    const f = this.shellFade;
    if (!f || !this.shellPrev || !this.shellNext) return;
    const u = clamp((this.simTime - f.t0) / f.dur, 0, 1);
    const g = this.rig.shellCanvas.getContext('2d');
    if (!g) return;
    g.globalAlpha = 1;
    g.drawImage(this.shellNext, 0, 0);
    g.globalAlpha = 1 - easeOut(u);
    g.drawImage(this.shellPrev, 0, 0);
    g.globalAlpha = 1;
    this.rig.shellTex.needsUpdate = true;
    if (u >= 1) this.shellFade = null;
  }

  private onTheme() {
    const dark = isDark();
    if (dark === this.dark) return;
    this.dark = dark;
    applyLights(this.rig, dark);
    this.updateShell(true);
  }

  private onMotion() {
    const reduced = this.bridge.reduced();
    if (reduced === this.reducedNow) return;
    this.reducedNow = reduced;
    if (this.present && this.renderer) {
      this.draw(0);
      this.wake();
    }
  }

  /* ---------- cena por quadro ---------- */
  private readonly frame = (dt: number) => {
    this.simTime += dt;
    for (let i = 0; i < this.waits.length;) {
      if (this.waits[i].at <= this.simTime) this.waits.splice(i, 1)[0].res();
      else i++;
    }
    this.update(dt);
    this.draw(dt);
  };

  private update(dt: number) {
    const P = this.P;
    for (const p of this.PL) stepParam(p, dt, this.simTime);
    this.stepShell();
    const reduced = this.reduced();
    const living = this.present && !this.sleeping && !reduced; // em cena e acordado: respira, pisca e olha em volta
    const dozing = this.present && !!this.sleeping && !reduced; // descansando: respira sem parar, mais devagar
    this.breathAmp += ((living || dozing ? 1 : 0) - this.breathAmp) * (1 - Math.exp(-dt * 2.2));
    if (!living && !dozing && this.breathAmp < 2e-3) this.breathAmp = 0;
    this.breathPhase += (dt * 2 * Math.PI) / (this.sleeping ? 5.2 : 3.6);
    const snotTarget = this.present && this.sleeping && this.eyeMode === 'sleep' ? 1 : 0;
    if (reduced) this.snotOn = snotTarget;
    else this.snotOn += (snotTarget - this.snotOn) * (1 - Math.exp(-dt * 1.2));
    if (!snotTarget && this.snotOn < 0.01) this.snotOn = 0;
    this.popMul = 1;
    if (this.popT >= 0) {
      const u = (this.simTime - this.popT) / 0.16;
      if (u >= 1) {
        this.popT = -1;
        this.snotOn = 0;
      } else this.popMul = 1 + u * 0.6;
    }
    if (living && this.eyeMode === 'open' && this.blinkT < 0 && this.simTime >= this.nextBlink) {
      this.blinkT = this.simTime;
      this.nextBlink = this.simTime + (Math.random() < 0.15 ? 0.32 : rand(2.4, 5.5));
    }
    if (living && this.look.type === 'camera' && this.simTime >= this.nextSacc) {
      if (this.idleX || this.idleY) {
        this.idleX = this.idleY = 0;
        this.nextSacc = this.simTime + rand(1.6, 3.4);
      } else {
        this.idleX = rand(-0.35, 0.35);
        this.idleY = rand(-0.22, 0.18);
        this.nextSacc = this.simTime + rand(0.45, 0.9);
      }
    }
    if (!living) this.idleX = this.idleY = 0;
    if (living && !this.sceneRunning) this.idleTick();
    this.updateLook();
    if (P.walk.v > 0.01) this.walkPhase += dt * 2 * Math.PI * 2.3;
    this.talkM =
      this.simTime < this.talkUntil && !reduced
        ? (0.25 + 0.55 * Math.abs(Math.sin(this.simTime * 13))) * Math.min(1, (this.talkUntil - this.simTime) * 6)
        : 0;
  }

  private apply() {
    const { P, rig } = this;
    const v = (n: ParamName) => P[n].v;
    const wk = v('walk');
    const sw = Math.sin(this.walkPhase);
    const l = v('limbs');
    const br = this.breathAmp * Math.sin(this.breathPhase) * (this.sleeping ? 1.8 : 1);
    rig.zeno.position.set(
      this.home.x + v('rootX') + v('glideX'),
      this.home.y + v('rootY') + v('glideY') + wk * 0.035 * Math.abs(sw),
      0,
    );
    rig.zeno.rotation.y = v('rootYaw');
    const sq = v('squash');
    const st = v('sit');
    const fl = v('flip');
    rig.zeno.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    rig.flipG.rotation.x = (-Math.PI / 2) * fl;
    rig.flipG.position.set(0, SHELL_C.y - 0.38 * fl, SHELL_C.z + 0.1 * fl);
    rig.hips.position.y = 0.4 + v('hipsY') - 0.26 * st + (this.sleeping ? 0.006 * br : 0);
    rig.body.rotation.set(v('bodyLean') - 0.1 * st, v('bodyTwist'), v('bodyTilt') + wk * 0.07 * sw);
    rig.torso.scale.set(1 - 0.006 * br, 1 + 0.014 * br, 1 - 0.006 * br);
    rig.neckPivot.position.y = 0.8 + 0.008 * br;
    // falando, a cabeça acompanha a boca com um balanço pequeno
    const talk =
      this.talkM > 0 ? Math.min(1, (this.simTime - this.talkStart) * 5, (this.talkUntil - this.simTime) * 5) : 0;
    rig.neckPivot.rotation.set(
      v('headPitch') + v('lookPitch') + talk * 0.045 * Math.sin(this.simTime * 7.5),
      v('headYaw') + v('lookYaw'),
      v('headRoll') + talk * 0.03 * Math.sin(this.simTime * 3.4),
    );
    const n = v('neck');
    rig.head.position.set(0, 0.28 + (n > 0 ? n * 0.13 : n * 0.3), 0.04 + n * 0.05);
    rig.neckMesh.scale.y = 1 + Math.max(0, n) * 0.9;
    for (const s of [L, R]) {
      const A = rig.arms[s];
      const k = s > 0 ? 'L' : 'R';
      A.sh.position.set(s * lerp(0.27, 0.36, l), lerp(0.5, 0.62, l), 0.12);
      A.sh.scale.setScalar(lerp(0.3, 1, l));
      A.sh.rotation.set(v(`a${k}`) - s * wk * 0.3 * sw, 0, v(`g${k}`));
      A.el.rotation.set(v(`ex${k}`), 0, v(`ez${k}`));
      const f = v(`f${k}`);
      A.finger.visible = f > 0.02;
      A.finger.scale.set(1, Math.max(0.001, f), 1);
      const G = rig.legs[s];
      G.position.y = lerp(0.16, 0, l);
      G.scale.setScalar(lerp(0.35, 1, l));
      G.rotation.x = v(`leg${k}`) + s * wk * 0.5 * sw - 1.45 * st;
    }
    rig.tail.scale.setScalar(lerp(0.5, 1, l));
    let blink = 1;
    if (this.blinkT >= 0) {
      const u = (this.simTime - this.blinkT) / 0.15;
      if (u >= 1) this.blinkT = -1;
      else blink = 1 - Math.sin(Math.PI * u);
    }
    const swap = this.eyeSwapMul();
    for (const s of [L, R]) {
      const E = rig.eyes[s];
      E.g.position.set(s * 0.135 + v('eyeX') * 0.03, 0.05 + v('eyeY') * 0.022, 0.322);
      E.g.scale.y = Math.max(0.02, swap);
      E.lid.scale.y = Math.max(0.05, v('eyeOpen') * blink);
    }
    const m = Math.max(v('mouth'), this.talkM);
    rig.mouthOpen.visible = m > 0.04;
    rig.mouthOpen.scale.set(0.042 + m * 0.008, 0.012 + m * 0.032, 0.02);
    rig.smile.visible = m < 0.3;
    const infl = this.reduced() ? 0.6 : (1 - Math.sin(this.breathPhase)) / 2;
    const sr = this.snotOn * lerp(0.02, 0.115, infl) * this.popMul;
    rig.snot.visible = sr > 0.004;
    rig.snotBall.scale.setScalar(Math.max(0.001, sr));
    rig.snotBall.position.copy(SNOT_DIR).multiplyScalar(sr * 0.9);
    (rig.snotBall.material as THREE.MeshLambertMaterial).opacity = 0.6 * (1 - (this.popMul - 1) / 0.6); // ao estourar, cresce e some
    const cp = v('cap');
    rig.cap.visible = cp > 0.003;
    rig.cap.scale.setScalar(Math.max(0.003, cp));
    const bk = v('book');
    rig.book.visible = bk > 0.003;
    rig.book.scale.setScalar(Math.max(0.003, bk));
    rig.shadow.visible = rig.zeno.visible;
    rig.shadow.position.set(rig.zeno.position.x, this.home.y + v('glideY') + 0.005, -0.3);
    const ss = Math.max(0.4, 1 - v('rootY') * 1.4);
    rig.shadow.scale.set(ss * (1 + sq * 0.5), ss, 1);
    (rig.shadow.material as THREE.MeshBasicMaterial).opacity = 0.2 * ss;
  }

  draw(dt: number): void {
    const renderer = this.renderer;
    if (!renderer || !this.canvas) return;
    this.apply();
    this.rig.zeno.updateMatrixWorld(true);
    const still = this.reduced();
    const fix = clamp(this.P.flip.v * 1.5, 0, 1);
    for (const d of this.rig.dangles) d.step(dt, this.P.rootYaw.v, still, fix);
    this.placeCanvas();
    renderer.render(this.rig.scene, this.camera);
    this.afterDraw();
  }

  /** O canvas acompanha o Zeno: o pedaço da tela em volta do pé dele, com o mesmo enquadramento da tela inteira. */
  private placeCanvas() {
    const canvas = this.canvas!;
    const p = this.toScreen(this.rig.zeno.position);
    const b = canvasBox(p.x, p.y, this.H);
    if (this.box && b.left === this.box.left && b.top === this.box.top) return;
    this.box = b;
    canvas.style.transform = `translate(${b.left}px, ${b.top}px)`;
    this.camera.setViewOffset(this.W, this.H, b.left, b.top, b.width, b.height);
  }

  /** Depois do quadro: a área de toque acompanha o corpo, e quem segue a cabeça (o balão) fica sabendo. */
  private afterDraw() {
    if (!this.present) {
      this.hit.hidden = true;
      if (this.lastAnchor) {
        this.lastAnchor = null;
        this.bridge.moved();
      }
      return;
    }
    const u = this.unit;
    const head = this.toScreen(this.rig.head.getWorldPosition(_hv));
    const body = this.toScreen(this.rig.shell.getWorldPosition(_hv));
    const feet = this.toScreen(this.rig.zeno.position);
    const left = Math.min(head.x - 0.4 * u, body.x - 0.5 * u);
    const right = Math.max(head.x + 0.4 * u, body.x + 0.5 * u);
    const top = Math.min(head.y - 0.36 * u, body.y - 0.5 * u);
    const bottom = Math.max(feet.y, body.y + 0.5 * u);
    const key = `${Math.round(left)},${Math.round(top)},${Math.round(right - left)},${Math.round(bottom - top)}`;
    if (key !== this.hitBox) {
      this.hitBox = key;
      this.hit.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      this.hit.style.width = `${Math.round(right - left)}px`;
      this.hit.style.height = `${Math.round(bottom - top)}px`;
    }
    this.hit.hidden = false;
    const a = this.headRect();
    const b = this.lastAnchor;
    if (!b || Math.abs(a.left - b.left) > 0.5 || Math.abs(a.top - b.top) > 0.5 || Math.abs(a.height - b.height) > 0.5) {
      this.lastAnchor = a;
      this.bridge.moved();
    }
  }

  /**
   * O retângulo da cabeça, em pixels do app, para o balão. É um retângulo calmo: acompanha o que muda o lugar da
   * cabeça (andar, deslizar, sentar, recolher no casco, a touca), mas não a respiração, o olhar, a fala, o pulo
   * nem o giro no casco, para o balão não tremer junto.
   */
  private headRect(): Rect {
    const { P, unit: u } = this;
    const n = P.neck.v;
    // a cabeça na pose de descanso: quadril (0,40) + pescoço (0,80) + cabeça (0,28), mais o que sentar e recolher mudam
    const y = 0.4 + P.hipsY.v - 0.26 * P.sit.v + 0.8 + 0.28 + (n > 0 ? n * 0.13 : n * 0.3);
    const c = this.toScreen(
      _bv.set(
        this.home.x + P.rootX.v + P.glideX.v + 0.08 * Math.sin(FACE),
        this.home.y + P.glideY.v + y,
        0.08 * Math.cos(FACE),
      ),
    );
    const top = c.y - (0.42 + P.cap.v * 0.3) * u;
    return { left: c.x - 0.4 * u, top, width: 0.8 * u, height: c.y + 0.34 * u - top };
  }

  anchor(): DOMRect | null {
    if (!this.present || !this.renderer) return null;
    const a = this.headRect();
    const app = this.appRect();
    return new DOMRect(app.left + a.left, app.top + a.top, a.width, a.height);
  }

  /* ---------- o laço só roda enquanto há o que mostrar ---------- */
  wake(): void {
    this.loop.wake();
  }

  private live() {
    this.idleNext = Math.max(this.idleNext, this.simTime + rand(3.5, 6.5));
    this.wake();
  }

  private touched() {
    this.lastUser = this.simTime;
    this.live();
  }

  private busy(): boolean {
    if (this.waits.length || this.sceneRunning || this.shellFade || this.eyeSwap || this.blinkT >= 0) return true;
    if (this.fading || this.popT >= 0 || this.talkUntil > this.simTime) return true;
    if (this.present && !this.reduced()) return true; // em cena, ele está sempre vivo: à toa ou dormindo
    if (this.breathAmp > 0 || !this.settled()) return true;
    return this.rig.dangles.some((d) => d.moving());
  }

  /** à toa ou dormindo, sem nenhuma ação no meio: respiração, piscadas e olhares bastam a 30 quadros por segundo */
  private calm(): boolean {
    return (
      !this.sceneRunning &&
      !this.waits.length &&
      !this.eyeSwap &&
      !this.fading &&
      !this.shellFade &&
      this.popT < 0 &&
      this.talkUntil <= this.simTime &&
      this.P.walk.v < 0.01 &&
      this.PL.every((p) => !p.tw)
    );
  }

  /* ---------- roteiro: cada cena espera em tempo de cena e pode ser interrompida ---------- */
  private newRun(): Run {
    const tok = ++this.token;
    for (const w of this.waits.splice(0)) w.rej(new Cancel());
    for (const [id, rej] of this.timers) {
      clearTimeout(id);
      rej(new Cancel());
    }
    this.timers.clear();
    return {
      alive: () => tok === this.token,
      wait: (ms) =>
        new Promise<void>((res, rej) => {
          if (tok !== this.token) {
            rej(new Cancel());
            return;
          }
          // no movimento reduzido nada se mexe entre as poses: a espera é por relógio, e o laço pode parar
          if (this.reduced()) {
            const id = setTimeout(() => {
              this.timers.delete(id);
              res();
            }, ms);
            this.timers.set(id, rej);
            return;
          }
          this.waits.push({ at: this.simTime + ms / 1000, res, rej });
          this.wake();
        }),
    };
  }

  /** Roda uma cena. A promessa sempre resolve: no fim, ou quando outra cena interrompe esta. */
  play(fn: (run: Run) => Promise<void>, idle = false): Promise<void> {
    const run = this.newRun();
    if (!idle) this.lastUser = this.simTime;
    this.sceneRunning = true;
    this.idleRunning = idle;
    this.live();
    const done = () => {
      if (!run.alive()) return;
      this.sceneRunning = false;
      this.idleRunning = false;
      this.live();
    };
    return fn(run).then(done, (e: unknown) => {
      if (e instanceof Cancel) return;
      console.error(e);
      done();
    });
  }

  /** chamado a cada quadro enquanto ele está acordado e sem cena */
  private idleTick() {
    const bored = this.simTime - this.lastUser;
    let act: ((z: ZenoRuntime, run: Run) => Promise<void>) | null = null;
    if (bored > 65) act = S.SCENES.cochilo;
    else if (bored > 40 && !S.seatedNow(this)) act = S.IDLE.tedio;
    else if (this.hold) {
      // apontando: o olhar vai do alvo para quem está usando, e volta
      if (this.simTime >= this.nextGaze && !this.lookUntil) {
        this.lookAt(this.look.type === 'camera' ? { type: 'point', v: this.hold.v } : S.CAMERA);
        this.nextGaze = this.simTime + rand(2, 4.5);
      }
    } else if (this.simTime >= this.idleNext) {
      const n = S.pickIdle(this.lastIdle, S.seatedNow(this));
      this.lastIdle = n;
      act = S.IDLE[n];
    } else if (this.simTime >= this.nextGaze && !this.lookUntil) {
      this.lookAt(this.glance());
      this.nextGaze = this.simTime + rand(2, 4.5);
    }
    if (act) {
      const fn = act;
      this.hold = null;
      this.sceneRunning = true;
      queueMicrotask(() => void this.play((run) => fn(this, run), true));
    }
  }

  /* ---------- entrar e sair de cena ---------- */
  showUp(): void {
    clearTimeout(this.releaseTimer);
    if (!this.present) {
      this.present = true;
      this.bridge.presence(true);
      document.addEventListener('pointerdown', this.onPointer, { capture: true, passive: true });
      document.addEventListener('keydown', this.onKey, { capture: true, passive: true });
    }
    this.rig.zeno.visible = true;
    if (this.canvas) {
      this.canvas.hidden = false;
      this.canvas.style.transition = 'none';
      this.canvas.style.opacity = '1';
    }
    this.wake();
  }

  hideAway(): void {
    const was = this.present;
    this.present = false;
    this.rig.zeno.visible = false;
    this.sleeping = null;
    this.hold = null;
    this.breathAmp = 0;
    this.snotOn = 0;
    this.popT = -1;
    this.talkUntil = 0;
    this.blinkT = -1;
    this.resetEyes();
    for (const p of this.PL) {
      p.v = p.t;
      p.vel = 0;
      p.tw = null;
    }
    this.snapAll({ walk: 0, rootX: 0, rootY: 0, rootYaw: FACE, glideX: 0, glideY: 0 });
    document.removeEventListener('pointerdown', this.onPointer, { capture: true });
    document.removeEventListener('keydown', this.onKey, { capture: true });
    this.draw(0);
    if (this.canvas) this.canvas.hidden = true;
    if (was) this.bridge.presence(false);
    this.scheduleRelease();
  }

  /* ---------- toques ---------- */
  private readonly onPointer = (e: PointerEvent) => {
    if (!this.present || !this.renderer) return;
    if (e.target === this.hit) this.tapBody();
    else this.tapScreen(e.clientX, e.clientY);
  };

  private readonly onKey = () => {
    if (!this.present) return;
    if (this.sleeping === 'tedio') this.wakeUp();
    else this.touched();
  };

  private tapBody() {
    if (this.sleeping === 'tedio') {
      this.wakeUp();
      return;
    }
    // no meio de uma cena pedida pelo app, ele não interrompe: só avisa
    if (this.sceneRunning && !this.idleRunning) {
      this.bridge.tapped({ type: 'body', line: null });
      return;
    }
    const text = this.sleeping ? null : S.pickBoopLine();
    void this.play((run) => S.boop(this, run, text));
    this.bridge.tapped({ type: 'body', line: text });
  }

  private tapScreen(x: number, y: number) {
    if (this.sleeping === 'tedio') {
      this.wakeUp();
      return;
    }
    if (this.sleeping) return;
    const app = this.appRect();
    this.lookAt({ type: 'point', v: this.screenToPlane(x - app.left, y - app.top) }, 1400);
    this.touched();
    this.bridge.tapped({ type: 'screen', x, y });
  }

  private wakeUp() {
    void this.play((run) => S.SCENES.acordar(this, run));
    this.bridge.tapped({ type: 'wake', line: ZENO_LINES.acordar ?? 'Opa, cochilei.' });
  }

  /* ---------- a API do controlador (src/zeno/index.ts) ---------- */
  async enter(place: ZenoPlace, wave: boolean): Promise<void> {
    if (!this.ensureRenderer()) return;
    if (this.present) {
      await this.moveTo(place);
      if (wave) await this.wave();
      return;
    }
    this.place = place;
    this.setHome(this.resolvePlace(place));
    await this.play(async (run) => {
      await S.walkIn(this, run, this.spot.side);
      if (wave) await S.wave(this, run);
    });
  }

  async leave(): Promise<void> {
    if (!this.present) return;
    await this.play(async (run) => {
      this.hold = null;
      await S.standUp(this, run);
      await S.wave(this, run);
      await run.wait(300);
      await S.walkOut(this, run, this.spot.side);
    });
    if (this.present) return; // outra cena entrou no meio (ele voltou)
    await this.loop.whenStopped();
  }

  moveTo(place: ZenoPlace): Promise<void> {
    const spot = this.resolvePlace(place);
    this.place = place;
    return this.play(async (run) => {
      this.hold = null;
      await S.standUp(this, run);
      await S.walkTo(this, run, spot);
    });
  }

  lookAtTarget(target: ZenoGaze, holdMs = 0): void {
    this.lastUser = this.simTime;
    if (target === 'person') this.lookAt(S.CAMERA, holdMs);
    else if (target === 'ground') this.lookAt({ type: 'point', v: this.groundAt(this.headTop().x + 30) }, holdMs);
    else if (target === 'around') {
      this.lookAt(S.CAMERA);
      this.nextGaze = this.simTime;
    } else {
      const el = resolveTarget(target);
      if (el) this.lookAt({ type: 'point', v: this.elWorld(el) }, holdMs);
    }
  }

  pointAt(target: ZenoTarget): Promise<void> {
    const el = resolveTarget(target);
    if (!el) return Promise.resolve();
    return new Promise<void>((resolve) => {
      void this.play(async (run) => {
        if (this.sleeping || this.P.sit.t > 0.5 || this.P.flip.t > 0.01 || this.P.limbs.t < 0.99)
          await S.standUp(this, run);
        await S.pointAt(this, run, this.elWorld(el), resolve);
      }).then(resolve);
    });
  }

  rest(): void {
    void this.play(async () => S.lowerArms(this));
    this.lookAt(S.CAMERA);
  }

  talk(text: string): void {
    this.lastUser = this.simTime;
    this.say(text);
  }

  wave(): Promise<void> {
    return this.play(async (run) => {
      this.hold = null;
      if (this.sleeping || this.P.flip.t > 0.01 || this.P.limbs.t < 0.99) await S.standUp(this, run);
      await S.wave(this, run);
    });
  }

  nod(): Promise<void> {
    return this.play((run) => S.nod(this, run, 1, 0.2));
  }

  hop(): Promise<void> {
    return this.play((run) => S.hop(this, run));
  }

  sit(): Promise<void> {
    return this.play(async (run) => {
      this.hold = null;
      await S.standUp(this, run, { sit: true });
    });
  }

  stand(): Promise<void> {
    return this.play((run) => S.standUp(this, run));
  }

  celebrate(level: 'small' | 'medium'): Promise<void> {
    return this.play(async (run) => {
      if (level === 'medium') {
        this.hold = null;
        await S.dayClosed(this, run, null);
        return;
      }
      if (this.sleeping) await S.standUp(this, run);
      await S.cheer(this, run, null);
    });
  }

  showShell(): Promise<void> {
    return this.play(async (run) => {
      this.hold = null;
      await S.showShell(this, run, null);
    });
  }

  async scene(id: ZenoScene): Promise<void> {
    if (!this.present) return;
    if (id !== 'checkin' && id !== 'obrigado') this.hold = null;
    await this.play((run) => S.SCENES[id](this, run));
    if (id === 'sair' && !this.present) await this.loop.whenStopped();
  }

  /** Para os testes e a tela /dev/zeno. */
  stats() {
    const rate = this.loop.rate;
    return {
      frames: this.loop.frames,
      drawing: this.loop.drawing,
      fps: this.loop.fps,
      rate,
      state: !rate ? 'parado' : rate === 60 ? 'em ação' : this.sleeping ? 'dormindo' : 'à toa',
      present: this.present,
      sleeping: this.sleeping,
      pointing: !!this.hold,
      seated: this.P.sit.t > 0.5,
      /** o tamanho da bolha de dormir agora (0 sem bolha) */
      bubble: this.rig.snot.visible ? this.rig.snotBall.scale.x : 0,
      triangles: this.rig.triangles,
      pixels: this.canvas ? `${this.canvas.width} × ${this.canvas.height}` : 'nenhum',
      released: !this.renderer,
      time: this.simTime,
      /** o lugar: lado, fileira e o ponto do chão, em pixels do app */
      spot: { ...this.spot },
      box: this.box ? { ...this.box } : null,
      size: { width: this.W, height: this.H },
    };
  }

  /** Só para capturas: segura o tempo da cena. */
  freeze(on: boolean): void {
    this.loop.frozen = on;
  }
}

function resolveTarget(t: ZenoTarget): Element | null {
  return typeof t === 'string' ? document.querySelector(t) : t;
}

/** O tema pintado: data-theme, ou o do sistema quando a pessoa escolheu Sistema. */
function isDark(): boolean {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}

export function createRuntime(host: HTMLElement, bridge: ZenoBridge): ZenoRuntime {
  return new ZenoRuntime(host, bridge);
}
