// Hoje (docs/interacao/telas/hoje.md e telas/estados.md; quadros "hoje" e os do Hoje em "estados").
// Monta o cabeçalho, a semana (ou o convite da revisão), os momentos do dia, os limites e os dias sem, e troca de
// modo pelo horário só quando a tela aparece. O agrupamento fica congelado (arrumação adiada) e os números vêm ao
// vivo, para animar na hora sem nada mudar de lugar debaixo do dedo.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m, PresenceContext } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { endPause, markHabit } from '@/actions';
import { previousEntry } from '@/app/history';
import { ScreenHeader, habitPath, showUndo, useOpenSheet } from '@/components/shell';
import { FoldedGroup, HabitList, SectionLabel, type PillarColor } from '@/components/ui';
import {
  formatDayHeader,
  formatTime,
  greeting,
  isDoneLike,
  timeOf,
  useChangeOrigin,
  useDataStatus,
  useNow,
  useSession,
  useToday,
  useTogether,
  wasDayCelebrated,
  type TodayItem,
  type TodayLayout,
  type TodayView,
} from '@/data';
import type { DayKey } from '@/types';
import { distance, dur, ease, tween } from '@/motion/tokens';
import { haptic } from '@/motion/haptics';
import { useFirstMount } from '@/motion/variants';
import { listNames, shortOf, withParticiple } from './copy';
import { TodayContext, useTodayCtx, type TodayCtx } from './context';
import { DayClosedView } from './DayClosedView';
import {
  BackToToday,
  HugCard,
  OfflineNotice,
  PastDayBanner,
  PauseCard,
  PeerCard,
  RunStrip,
  TodaySkeleton,
} from './parts';
import { CheckinCard, CounterCard, DaysSinceGrid, ItemRow, LimitsList, NightGoals, NudgeStrip, WaterRow } from './rows';
import { pillarColor } from './visual';
import { ReviewInvite, TodayWeekCard, TweakLine, type WeekHead } from './TodayWeek';
import { useArrangement } from './useArrangement';
import { useFlip } from './useFlip';
import { useTodayActions } from './useTodayActions';
import './today.css';

// ---------- estado de interface (por dia, só nesta sessão) ----------

const foldState = new Map<string, boolean>();
let skeletonWasShown = false;

function useFold(id: string): [boolean, () => void] {
  const [open, setOpen] = useState(() => foldState.get(id) ?? false);
  const toggle = useCallback(() => {
    setOpen((v) => {
      foldState.set(id, !v);
      return !v;
    });
  }, [id]);
  return [open, toggle];
}

const SHEETS_BY_ROLE: Record<string, [string, Record<string, string>?]> = {
  protein: ['proteina'],
  water: ['agua'],
  wake: ['acordar'],
  bed: ['acordar'],
  lunch: ['nota', { refeicao: 'almoco' }],
  dinner: ['nota', { refeicao: 'jantar' }],
  checkin: ['checkin'],
  weight: ['peso'],
};

function validDay(value: string | null, today: DayKey): DayKey | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value < today ? value : null;
}

/** Todos os itens de um layout, pelo id do hábito (para ler o estado ao vivo de uma linha congelada). */
function indexItems(layout: TodayLayout): Map<string, TodayItem> {
  const map = new Map<string, TodayItem>();
  const add = (list: TodayItem[]) => list.forEach((i) => map.set(i.habit.id, i));
  layout.groups.forEach((g) => add(g.items));
  add(layout.limits);
  add(layout.daysSince);
  add(layout.counters);
  add(layout.stillToday);
  add(layout.doneToday);
  return map;
}

/** Contadores que viram a linha da água (anel e "+ 500 ml"), e não o cartão com a barra. */
function isWaterLike(item: TodayItem): boolean {
  return item.habit.role === 'water' || item.goal.unit === 'ml' || item.goal.unit === 'L';
}

/** Cascata da primeira abertura: 6 blocos, 30 ms um depois do outro; o resto entra com o sexto. */
function cascadeCounter(start: number) {
  let n = start;
  return () => `td-c${Math.min(5, n++)}`;
}

// ---------- a tela ----------

export default function TodayScreen() {
  const { status } = useDataStatus();
  const session = useSession();
  const { today, minutes } = useNow();
  if (status !== 'ready' || session.status !== 'ready') {
    return <TodayLoading today={today} minutes={minutes} name={session.user?.name ?? ''} />;
  }
  return <TodayReady />;
}

function TodayLoading({ today, minutes, name }: { today: DayKey; minutes: number; name: string }) {
  useEffect(() => {
    const id = window.setTimeout(() => (skeletonWasShown = true), 300);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="td-root">
      <ScreenHeader
        context={formatDayHeader(today)}
        title={name ? `${greeting(minutes)}, ${name}` : greeting(minutes)}
      />
      <TodaySkeleton today={today} />
    </div>
  );
}

function TodayReady() {
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { today, minutes } = useNow();
  const day = validDay(search.get('dia'), today);
  const shownDay = day ?? today;
  const isPast = !!day;
  const live = useToday(shownDay);
  const openSheet = useOpenSheet();
  const together = useTogether();
  const origin = useChangeOrigin();
  const rootRef = useRef<HTMLDivElement>(null);

  // a arrumação acontece quando uma folha fecha (menos o check-in, que vira o resumo no próprio cartão)
  const folha = search.get('folha');
  const [sheet, setSheet] = useState<{ open: string | null; closes: number }>({ open: folha, closes: 0 });
  if (sheet.open !== folha) {
    setSheet({
      open: folha,
      closes: sheet.open && !folha && sheet.open !== 'checkin' ? sheet.closes + 1 : sheet.closes,
    });
  }

  // direção da troca de dia (o passado vem da esquerda)
  const [dayNav, setDayNav] = useState({ day: shownDay, dir: 0 });
  if (dayNav.day !== shownDay) setDayNav({ day: shownDay, dir: shownDay < dayNav.day ? -1 : 1 });

  // o dia sai da URL ao voltar para a frente depois de 30 min, e na virada do dia lógico
  const hiddenAt = useRef(0);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (day && hiddenAt.current && Date.now() - hiddenAt.current > 30 * 60_000)
        void navigate('/hoje', { replace: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [day, navigate]);
  const seenToday = useRef(today);
  useEffect(() => {
    if (seenToday.current === today) return;
    seenToday.current = today;
    if (day) void navigate('/hoje', { replace: true });
  }, [today, day, navigate]);

  // ---------- dia fechado: 500 ms depois do último toque a lista sai e entra o anel ----------
  const closedLive = !isPast && live.layout.mode === 'closed';
  const [closed, setClosed] = useState({ shown: closedLive, celebrate: false });
  useEffect(() => {
    if (closedLive && !closed.shown) {
      const local = origin === 'local';
      const celebrate = local && !wasDayCelebrated(today);
      const id = window.setTimeout(
        () => {
          setClosed({ shown: true, celebrate });
          rootRef.current
            ?.closest<HTMLElement>('[data-screen-scroll]')
            ?.scrollTo({ top: 0, behavior: local ? 'smooth' : 'auto' });
        },
        local ? 500 : 0,
      );
      return () => window.clearTimeout(id);
    }
    if (!closedLive && closed.shown) {
      // desfazer: o anel recua em fill e depois a lista volta em base, sem animação de perda
      const id = window.setTimeout(() => setClosed({ shown: false, celebrate: false }), 420);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [closedLive, closed.shown, origin, today]);
  const showClosed = closed.shown && !isPast;

  const actions = useTodayActions({ day: shownDay, today, count: live.count, paused: !!live.pause });
  const highlight = (location.state as { highlight?: string } | null)?.highlight ?? null;

  const ctx = useMemo<TodayCtx>(
    () => ({
      day: shownDay,
      today,
      isPast,
      minutes,
      night: !isPast && live.layout.checkinOnTop,
      paused: !!live.pause,
      remote: origin === 'remote',
      firstDay: !isPast && live.firstDay,
      highlight,
      check: actions.check,
      add: actions.add,
      spend: actions.spend,
      openSheet: (name, args) => openSheet(name, args),
      openHabit: (id) => void navigate(habitPath(id, 'hoje')),
      openMenu: (id) => openSheet('menu', { habito: id }),
      sheetFor: (item) => (item.habit.role ? (SHEETS_BY_ROLE[item.habit.role] ?? null) : null),
    }),
    [
      shownDay,
      today,
      isPast,
      minutes,
      live.layout.checkinOnTop,
      live.pause,
      origin,
      live.firstDay,
      highlight,
      actions,
      openSheet,
      navigate,
    ],
  );

  const selectDay = useCallback(
    (d: DayKey) => {
      if (d === today) {
        if (previousEntry() === '/hoje') navigate(-1);
        else void navigate('/hoje', { replace: true });
        return;
      }
      if (d === shownDay) return;
      void navigate(`/hoje?dia=${d}`, { replace: isPast });
    },
    [today, shownDay, isPast, navigate],
  );
  const openProgress = useCallback(() => void navigate('/progresso?periodo=semana&tema=visao'), [navigate]);

  const first = useFirstMount('hoje');
  const cascade = first && !skeletonWasShown;
  const headerKey = isPast ? 'past' : showClosed ? 'none' : 'hd';

  return (
    // a camada da aba nasce dentro de um AnimatePresence com initial={false}, que bloquearia o "initial" de tudo
    // o que entra depois aqui dentro (convites, dia fechado, carinho): o Hoje começa um contexto de presença novo
    <PresenceContext.Provider value={null}>
      <TodayContext.Provider value={ctx}>
        <div
          ref={rootRef}
          className={clsx('td-root', cascade && 'td-cascade', skeletonWasShown && first && 'td-fadein')}
        >
          {live.activeRun && !isPast && <RunStrip pillar={runPillar(live)} />}
          <AnimatePresence mode="popLayout" initial={false}>
            {headerKey === 'past' && <PastDayBanner key="past" day={shownDay} />}
            {headerKey === 'hd' && (
              <m.div
                key="hd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tween.base }}
                exit={{ opacity: 0, transition: tween.exit }}
              >
                <ScreenHeader context={live.dateLabel} title={`${live.greeting}, ${live.name}`} className="td-c0" />
              </m.div>
            )}
          </AnimatePresence>
          {/* no código, a pílula vem logo depois da faixa, mesmo aparecendo embaixo */}
          <AnimatePresence>{isPast && <BackToToday key="back" onBack={() => selectDay(today)} />}</AnimatePresence>
          {!isPast && !showClosed && <OfflineNotice />}
          {!isPast && !showClosed && together.hugsToday.length > 0 && <HugCard />}
          <div className="td-days">
            <AnimatePresence mode="popLayout" initial={false} custom={dayNav.dir}>
              <m.div
                key={shownDay}
                className="td-day"
                custom={dayNav.dir}
                variants={{
                  enter: (d: number) => ({ x: d * distance.day, opacity: 0 }),
                  in: { x: 0, opacity: 1, transition: tween.base },
                  out: (d: number) => ({ x: -d * distance.day, opacity: 0, transition: tween.exit }),
                }}
                initial="enter"
                animate="in"
                exit="out"
              >
                {/* cada dia leva o próprio contexto: o dia que sai continua desenhado como era */}
                <TodayContext.Provider value={ctx}>
                  <DayBody
                    live={live}
                    refreshKey={String(sheet.closes)}
                    closed={showClosed ? closed : null}
                    onSelectDay={selectDay}
                    onProgress={openProgress}
                    showPeer={!isPast && together.linked}
                  />
                </TodayContext.Provider>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </TodayContext.Provider>
    </PresenceContext.Provider>
  );
}

function runPillar(live: TodayView): string | undefined {
  for (const item of indexItems(live.layout).values())
    if (item.habit.id === live.activeRun?.habitId) return item.pillar?.color;
  return 'corpo';
}

// ---------- o corpo de um dia (chave: o dia) ----------

interface DayBodyProps {
  live: TodayView;
  refreshKey: string;
  closed: { celebrate: boolean } | null;
  onSelectDay: (d: DayKey) => void;
  onProgress: () => void;
  showPeer: boolean;
}

function DayBody({ live, refreshKey, closed, onSelectDay, onProgress, showPeer }: DayBodyProps) {
  const ctx = useTodayCtx();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const arr = useArrangement(live, refreshKey);
  const frozen = arr.value;
  useFlip(rootRef, arr.version, arr.reason === 'sheet');
  const items = useMemo(() => indexItems(live.layout), [live]);
  const liveOf = useCallback((i: TodayItem) => items.get(i.habit.id) ?? i, [items]);

  // destaque vindo do "Marcar ontem": a lista já abre rolada até a linha
  useEffect(() => {
    if (!ctx.highlight) return;
    rootRef.current
      ?.querySelector<HTMLElement>(`.td-fl-${CSS.escape(ctx.highlight)}`)
      ?.scrollIntoView({ block: 'center' });
  }, [ctx.highlight]);

  // ---------- convites dentro da linha ----------
  const frozenNudge = frozen.nudge && !frozen.nudge.doneToday ? frozen.nudge : null;
  const nudge = frozenNudge && live.nudge?.habitId === frozenNudge.habitId ? live.nudge : null;
  const firstTarget = !ctx.isPast && live.firstDay ? firstDayTarget(live, ctx.minutes) : null;
  const welcomeTarget =
    !ctx.isPast && live.welcomeBack && live.count.done === 0 && !live.firstDay
      ? firstOpen(frozen.layout, liveOf)
      : null;

  const nudgeFor = (item: TodayItem): ReactNode => {
    if (ctx.isPast) return null;
    const id = item.habit.id;
    if (nudge && nudge.habitId === id) {
      return (
        <NudgeStrip
          key={`nudge-${id}`}
          item={item}
          text={nudge.doneToday ? 'De volta hoje.' : 'Hoje é um bom dia para voltar.'}
          action={nudge.doneToday ? undefined : 'Marcar ontem'}
          onAction={() => void navigate(`/hoje?dia=${nudge.day}`, { state: { highlight: id } })}
        />
      );
    }
    if (firstTarget?.habit.id === id) return <FirstDayNudge key={`first-${id}`} item={liveOf(item)} />;
    if (welcomeTarget?.habit.id === id) {
      return <NudgeStrip key={`wb-${id}`} item={item} text="Bem-vindo de volta. Comece por um hábito." />;
    }
    return null;
  };

  const next = cascadeCounter(1);

  // ---------- semana (ou o convite da revisão) ----------
  const head: WeekHead = ctx.isPast
    ? {
        kind: 'past',
        day: ctx.day,
        done: live.count.done,
        total: live.count.total,
        constancy: live.week.constancy,
        onProgress,
      }
    : live.firstDay
      ? {
          kind: 'first',
          phase: live.phase?.number ?? null,
          weekIndex: live.phase?.weekIndex ?? null,
          weeks: live.phase?.weeks ?? null,
        }
      : live.pause
        ? { kind: 'none' }
        : { kind: 'today', done: live.count.done, total: live.count.total, constancy: live.week.constancy, onProgress };
  const tweak = !ctx.isPast && !live.pause && live.tweak ? live.tweak : null;
  const review = !ctx.isPast && frozen.review && live.review ? live.review : null;
  const weekBlock = (
    <div className={clsx('td-pad', next())} data-flip="week">
      <AnimatePresence mode="popLayout" initial={false}>
        {review ? (
          <m.div
            key="rev"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: tween.exit }}
          >
            <ReviewInvite
              review={review}
              today={ctx.today}
              onSelect={onSelectDay}
              onStart={() => void navigate(`/revisao/${review.week}/${review.started ? review.step : 1}`)}
            />
          </m.div>
        ) : (
          <m.div
            key="wk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: tween.exit }}
          >
            <TodayWeekCard
              week={live.week}
              today={ctx.today}
              head={head}
              selected={ctx.isPast ? ctx.day : undefined}
              onSelect={onSelectDay}
              footer={
                tweak ? (
                  <TweakLine text={tweak.text} onOpen={() => void navigate(`/jornada/revisoes/${tweak.week}`)} />
                ) : undefined
              }
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ---------- pausa ----------
  if (live.pause) {
    return (
      <div className="td-body td-body-fill">
        {weekBlock}
        <PausedDay live={live} />
      </div>
    );
  }

  // ---------- dia fechado: a lista sai com opacidade em base e o anel entra no lugar ----------
  const layout = frozen.layout;
  const night = !ctx.isPast && (layout.mode === 'night' || layout.mode === 'closed');
  const all = [...items.values()];
  const later = all.find((i) => i.markedNextMorning) ?? null;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {closed ? (
        <m.div key="closed" className="td-body td-body-fill" {...SWAP}>
          <DayClosedView
            day={ctx.day}
            done={live.count.done}
            total={live.count.total}
            celebrate={closed.celebrate}
            last={lastMarked(live.layout.doneToday)}
            nextMorning={later ? { later, with: all.find((i) => i.habit.role === 'wake') ?? null } : null}
            doneItems={live.layout.doneToday}
            tomorrow={live.tomorrowMorning}
            minutes={ctx.minutes}
          />
        </m.div>
      ) : (
        <m.div key="list" ref={rootRef} className="td-body" {...SWAP}>
          {/* à noite a tela se divide em Ainda hoje e Feitos hoje, com o check-in no topo (sem o cartão da semana) */}
          {!night && weekBlock}
          {night ? (
            <NightBlocks layout={layout} liveOf={liveOf} next={next} nudgeFor={nudgeFor} />
          ) : (
            <DayBlocks layout={layout} quick={frozen.quickAdds} liveOf={liveOf} next={next} nudgeFor={nudgeFor} />
          )}
          {layout.limits.length > 0 && (
            <section aria-label="Limites da semana" data-flip="limits">
              <SectionLabel className={next()}>Limites da semana</SectionLabel>
              <div className={clsx('td-pad', next())}>
                <LimitsList items={layout.limits.map(liveOf)} />
              </div>
            </section>
          )}
          {layout.daysSince.length > 0 && (
            <section aria-label="Dias sem" data-flip="dsr">
              <SectionLabel className={next()}>Dias sem</SectionLabel>
              <div className={clsx('td-pad', next())}>
                <DaysSinceGrid items={layout.daysSince.map(liveOf)} />
              </div>
            </section>
          )}
          {showPeer && (
            <section aria-label="A dois" data-flip="peer">
              <SectionLabel className={next()}>A dois</SectionLabel>
              <div className={clsx('td-pad', next())}>
                <PeerCard />
              </div>
            </section>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** Troca entre a lista e o dia fechado: opacidade em base (a saída com --ease-exit). */
const SWAP = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: tween.base },
  exit: { opacity: 0, transition: { duration: dur.base, ease: ease.exit } },
};

/** O último registro do dia (para a frase do dia fechado). */
function lastMarked(items: TodayItem[]): TodayItem | null {
  let best: TodayItem | null = null;
  for (const i of items) {
    if (!i.mark || i.habit.type === 'daysSince') continue;
    if (!best || i.mark.at > (best.mark?.at ?? 0)) best = i;
  }
  return best;
}

/** O primeiro hábito sem registro do primeiro momento aberto (boas-vindas depois da pausa). */
function firstOpen(layout: TodayLayout, liveOf: (i: TodayItem) => TodayItem): TodayItem | null {
  for (const g of layout.groups) {
    if (g.folded) continue;
    for (const i of g.items) {
      const l = liveOf(i);
      if (l.counts && !l.registered && l.habit.type !== 'counter') return i;
    }
  }
  return null;
}

/** O convite do primeiro dia: até as 10h no acordar, depois no primeiro sem registro do momento, à noite no check-in. */
function firstDayTarget(live: TodayView, minutes: number): TodayItem | null {
  const all = live.layout.groups.flatMap((g) => g.items);
  if (live.layout.checkinOnTop) return all.find((i) => i.habit.role === 'checkin' && !i.registered) ?? null;
  if (minutes < 10 * 60) {
    const wake = all.find((i) => i.habit.role === 'wake' && !i.registered);
    if (wake) return wake;
  }
  const moment = minutes < 12 * 60 ? 'morning' : minutes < 18 * 60 ? 'day' : 'evening';
  const group =
    live.layout.groups.find((g) => g.key === moment && !g.folded) ?? live.layout.groups.find((g) => !g.folded);
  return group?.items.find((i) => i.counts && !i.registered && i.habit.type !== 'number') ?? null;
}

/** "Comece por aqui." com o registro já pronto ("Acordei às 6h58", com o horário de agora). */
function FirstDayNudge({ item }: { item: TodayItem }) {
  const ctx = useTodayCtx();
  const { now, clock } = useNow();
  const h = item.habit;
  if (h.type === 'time') {
    const time = timeOf(now, clock);
    return (
      <NudgeStrip
        item={item}
        enter
        text="Comece por aqui."
        action={`${h.role === 'wake' ? 'Acordei' : 'Registrar'} às ${formatTime(time)}`}
        onAction={() => {
          haptic();
          void markHabit(h.id, ctx.day, { time }).then((undo) =>
            window.setTimeout(
              () =>
                showUndo(
                  {
                    title: withParticiple(h.name, 'registrad'),
                    detail: formatTime(time),
                    pillar: pillarColor(item),
                    icon: 'check',
                  },
                  () => void undo(),
                ),
              200,
            ),
          );
        }}
      />
    );
  }
  const sheet = ctx.sheetFor(item);
  const label =
    h.role === 'checkin' ? 'Fazer o check-in' : h.type === 'rating' ? 'Dar nota' : sheet ? 'Registrar' : 'Marcar';
  return (
    <NudgeStrip
      item={item}
      enter
      text="Comece por aqui."
      action={label}
      onAction={() => (sheet ? ctx.openSheet(sheet[0], sheet[1]) : ctx.check(item, true))}
    />
  );
}

// ---------- modo dia (e fim de tarde) ----------

interface BlocksProps {
  layout: TodayLayout;
  liveOf: (i: TodayItem) => TodayItem;
  next: () => string;
  nudgeFor: (item: TodayItem) => ReactNode;
}

function DayBlocks({ layout, quick, liveOf, next, nudgeFor }: BlocksProps & { quick: TodayView['quickAdds'] }) {
  const ctx = useTodayCtx();
  return (
    <>
      {layout.groups.map((g) => {
        const times = g.items
          .map((i) => i.time)
          .filter((t): t is string => !!t)
          .sort();
        const from = g.foldReason === 'far' && times.length ? `a partir das ${formatTime(times[0]!)}` : undefined;
        // num dia passado não há botões de somar: proteína e água viram linhas com o valor
        const asCard = (i: TodayItem) => i.habit.type === 'counter' && !ctx.isPast;
        const counters = g.folded ? [] : g.items.filter(asCard);
        // "não conta hoje" desce para o fim do grupo na arrumação (o estado congelado decide)
        const rows = g.folded ? [] : g.items.filter((i) => !asCard(i)).sort(skippedLast);
        return (
          <section key={g.key} aria-label={g.title} data-flip={`g-${g.key}`}>
            <SectionLabel trailing={from} className={next()}>
              {g.title}
            </SectionLabel>
            {g.folded ? (
              <div className={clsx('td-pad', next())} data-flip={`g-${g.key}-fold`}>
                <GroupFold groupKey={g.key} items={g.items} reason={g.foldReason} liveOf={liveOf} />
              </div>
            ) : (
              <div className="td-pad td-stack" data-flip={`g-${g.key}-open`}>
                {counters.map((fi) => {
                  const item = liveOf(fi);
                  const q = (quick[item.habit.id] ?? []).map((x) => ({ id: x.id, name: x.name, amount: x.amount }));
                  return (
                    <div key={item.habit.id} className={next()}>
                      {isWaterLike(item) ? <WaterRow item={item} quick={q} /> : <CounterCard item={item} quick={q} />}
                    </div>
                  );
                })}
                {rows.length > 0 && (
                  <RowList
                    label={g.title}
                    items={rows}
                    liveOf={liveOf}
                    nudgeFor={nudgeFor}
                    classes={listCascade(next)}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

function skippedLast(a: TodayItem, b: TodayItem): number {
  return Number(a.state === 'skipped') - Number(b.state === 'skipped');
}

/** Um cartão de linhas: o cartão entra na cascata com a 1ª linha; a 2ª e a 3ª, cada uma no seu tempo. */
function RowList({
  label,
  items,
  liveOf,
  nudgeFor,
  classes,
}: Pick<BlocksProps, 'liveOf' | 'nudgeFor'> & { label: string; items: TodayItem[]; classes: string[] }) {
  return (
    <HabitList className={classes[0]} label={label}>
      {items.map((fi, i) => {
        const item = liveOf(fi);
        return [<ItemRow key={item.habit.id} item={item} className={i > 0 ? classes[i] : undefined} />, nudgeFor(item)];
      })}
    </HabitList>
  );
}

/** As classes da cascata de um cartão de linhas (o cartão com a 1ª linha, depois a 2ª e a 3ª). */
function listCascade(next: () => string): string[] {
  return [next(), next(), next()];
}

/** Um momento recolhido: distante ("6 hábitos · louça, lixo, jantar e mais 3") ou completo ("Tudo feito"). */
function GroupFold({
  groupKey,
  items,
  reason,
  liveOf,
}: {
  groupKey: string;
  items: TodayItem[];
  reason: 'far' | 'complete' | null;
  liveOf: (i: TodayItem) => TodayItem;
}) {
  const ctx = useTodayCtx();
  const [open, toggle] = useFold(`${ctx.day}|${groupKey}|${reason}`);
  const complete = reason === 'complete';
  return (
    <FoldedGroup
      icons={items.slice(0, 3).map((i) => ({ icon: i.habit.icon, pillar: pillarColor(i) as PillarColor }))}
      more={Math.max(0, items.length - 3)}
      title={complete ? 'Tudo feito' : `${items.length} ${items.length === 1 ? 'hábito' : 'hábitos'}`}
      subtitle={listNames(items.map((i) => shortOf(i.habit)))}
      complete={complete}
      expanded={open}
      onToggle={toggle}
    >
      {items.map((i) => (
        <ItemRow key={i.habit.id} item={liveOf(i)} />
      ))}
    </FoldedGroup>
  );
}

// ---------- modo noite ----------

function NightBlocks({ layout, liveOf, next, nudgeFor }: BlocksProps) {
  const ctx = useTodayCtx();
  const still = layout.stillToday.map(liveOf);
  const checkin = still.find((i) => i.habit.role === 'checkin') ?? null;
  const rows = still.filter((i) => i !== checkin);
  const left = still.filter((i) => !isDoneLike(i.state) && i.state !== 'skipped').length;
  const done = layout.doneToday.map(liveOf);
  const doneNow = done.filter((i) => isDoneLike(i.state) || i.state === 'skipped').length;
  const [open, toggle] = useFold(`${ctx.day}|done`);
  const counters = layout.counters.map(liveOf);
  return (
    <section aria-label="Ainda hoje" data-flip="night">
      <SectionLabel trailing={<span className="pk-num">{left}</span>} className={next()}>
        Ainda hoje
      </SectionLabel>
      <div className="td-pad td-stack">
        {checkin && (
          <div className={next()}>
            <CheckinCard item={checkin} />
          </div>
        )}
        {rows.length > 0 && (
          <RowList label="Ainda hoje" items={rows} liveOf={liveOf} nudgeFor={nudgeFor} classes={listCascade(next)} />
        )}
        {done.length > 0 && (
          <div className={next()} data-flip="done-fold">
            <FoldedGroup
              icons={done.slice(0, 4).map((i) => ({ icon: i.habit.icon, pillar: pillarColor(i) as PillarColor }))}
              more={Math.max(0, done.length - 4)}
              title={`Feitos hoje · ${doneNow}`}
              subtitle="toque para ver ou desmarcar"
              expanded={open}
              onToggle={toggle}
            >
              {done.map((i) => (
                <ItemRow key={i.habit.id} item={i} />
              ))}
            </FoldedGroup>
          </div>
        )}
        {counters.length > 0 && (
          <div className={next()}>
            <NightGoals items={counters} />
          </div>
        )}
      </div>
    </section>
  );
}

// ---------- pausa ----------

function PausedDay({ live }: { live: TodayView }) {
  const ctx = useTodayCtx();
  const pause = live.pause!;
  const items = live.layout.groups.flatMap((g) => g.items).filter((i) => i.habit.type !== 'counter');
  const [open, toggle] = useFold(`${ctx.day}|pause`);
  const end = async () => {
    const undo = await endPause(pause.id, ctx.day);
    window.setTimeout(
      () => showUndo({ title: 'Pausa encerrada', pillar: 'accent', icon: 'check' }, () => void undo()),
      240,
    );
  };
  return (
    <>
      <div className="td-pad td-pause-wrap">
        <PauseCard pause={pause} past={ctx.isPast} onEnd={() => void end()} />
      </div>
      <div className="td-spacer" />
      {items.length > 0 && (
        <div className="td-pad td-pause-fold">
          <FoldedGroup
            icons={items.slice(0, 3).map((i) => ({ icon: i.habit.icon, pillar: pillarColor(i) as PillarColor }))}
            title="Registrar algo, se quiser"
            subtitle="fica no histórico, e o dia segue fora da conta"
            expanded={open}
            onToggle={toggle}
          >
            {items.map((i) => (
              <ItemRow key={i.habit.id} item={i} />
            ))}
          </FoldedGroup>
        </div>
      )}
    </>
  );
}
