// As linhas e os cartões do Hoje, montados a partir de cada TodayItem (o tipo e o papel do hábito decidem o
// controle). Regras do quadro: o controle à direita registra (círculo marca, pílula abre a folha, "+" usa o limite,
// botões de proteína e água somam na hora); o ícone e o nome abrem o hábito; o toque longo abre o menu.
import { useMemo, type ReactNode } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import {
  ActionPill,
  BudgetSlots,
  CheckButton,
  DaysSinceTile,
  Face,
  GoalBar,
  HabitList,
  HabitRow,
  NumberFlow,
  PillarBubble,
  PlusButton,
  QuickAddButton,
  QuickAddGrid,
  RatingFaces,
  Ring,
  Tag,
  ValuePill,
  WeekDots,
  type FaceLevel,
} from '@/components/ui';
import { Icon } from '@/icons';
import {
  formatAmount,
  formatNumber,
  formatTime,
  isDoneLike,
  mealWord,
  moodWord,
  energyWord,
  useCheckin,
  useCounter,
  useRunPlan,
  useDrafts,
  type TodayItem,
} from '@/data';
import { useNavigate } from 'react-router';
import { tween } from '@/motion/tokens';
import { prepareRun } from '@/screens/run/engine';
import { runPath } from '@/screens/run/paths';
import { shortOf, timeCaption } from './copy';
import { useTodayCtx } from './context';
import { weekLen } from './useTodayActions';
import { pillarColor, visualOf } from './visual';

/** A legenda da linha (e o texto dela para o leitor de tela). */
function subtitleFor(
  item: TodayItem,
  ctx: ReturnType<typeof useTodayCtx>,
): { node: ReactNode; text: string; accent?: boolean } {
  const h = item.habit;
  const done = isDoneLike(item.state);
  if (item.state === 'skipped') return { node: 'não conta hoje', text: 'não conta hoje' };
  if (ctx.isPast && item.counts && !done && !item.registered) {
    return { node: 'sem registro · dá para marcar', text: 'sem registro, dá para marcar', accent: true };
  }
  if (h.type === 'daysSince' && item.daysSince) {
    // nas listas (Feitos hoje): "32 dias sem Shorts e TikTok"; o deslize fica no detalhe do hábito
    const n = item.daysSince.current;
    const what = h.shortName?.trim() || shortOf(h);
    const t = `${n} ${n === 1 ? 'dia' : 'dias'} sem ${what}`;
    return { node: t, text: t };
  }
  // treino guiado: a semana e o treino do plano ("semana 3, treino 1 · 7h10"), no lugar das bolinhas da semana
  if (h.type === 'guided') {
    return { node: <RunCaption item={item} />, text: h.description ?? '' };
  }
  if (h.type === 'budget' && item.budget) {
    const b = item.budget;
    const tail = b.full && b.resetsTomorrow ? ' · a semana recomeça amanhã' : ' na semana';
    return {
      node: (
        <>
          <BudgetSlots total={b.limit} used={Math.min(b.used, b.limit)} />
          <span>
            <span className="pk-num">
              <NumberFlow value={b.used} delay={60} /> de {b.limit}
            </span>
            {tail}
          </span>
        </>
      ),
      text: `${b.used} de ${b.limit}${tail}`,
    };
  }
  if (item.week && h.type !== 'weekly' && ctx.firstDay) {
    // primeiro dia: sem bolinhas vazias, a meta escrita ("20 min · meta 6 de 7 dias")
    const len = weekLen(item);
    const amount = item.goal.value !== undefined ? formatAmount(item.goal.value, item.goal.unit) : null;
    const s = [amount, item.week.target < len ? `meta ${item.week.target} de ${len} dias` : null]
      .filter(Boolean)
      .join(' · ');
    return { node: s, text: s };
  }
  if (item.week && h.type !== 'weekly') {
    const len = weekLen(item);
    const meta = item.week.target < len ? ` · meta ${item.week.target}` : '';
    return {
      node: (
        <>
          <WeekDots total={len} done={Math.min(len, item.week.done)} />
          <span className="pk-num">
            <NumberFlow value={item.week.done} delay={60} /> de {len}
            {meta}
          </span>
        </>
      ),
      text: `${item.week.done} de ${len} na semana${meta ? `, meta ${item.week.target}` : ''}`,
    };
  }
  if (h.type === 'weekly' && item.week) {
    const w = item.week;
    return {
      node: (
        <span className="pk-num">
          {ctx.isPast ? '' : 'hoje · '}
          <NumberFlow value={w.done} delay={60} /> de {w.target} na semana
        </span>
      ),
      text: `${ctx.isPast ? '' : 'hoje, '}${w.done} de ${w.target} na semana`,
    };
  }
  if (h.type === 'time') {
    const t = item.goal.time ? `meta ${formatTime(item.goal.time)}` : (h.description ?? '');
    const s = item.markedNextMorning && !item.registered && !ctx.isPast ? `${t} · marque amanhã ao acordar` : t;
    return { node: s, text: s };
  }
  if (h.type === 'counter') {
    const g =
      item.goal.value !== undefined ? `meta ${formatAmount(item.goal.value, item.goal.unit)}` : (h.description ?? '');
    return { node: g, text: g };
  }
  if (h.type === 'number') {
    const s = item.registered
      ? (h.description ?? '')
      : item.goal.measuring
        ? 'só medindo, sem meta'
        : (h.description ?? '');
    return { node: s, text: s };
  }
  if (h.role === 'checkin' && item.time) {
    const s = [formatTime(item.time), h.description].filter(Boolean).join(' · ');
    return { node: s, text: s };
  }
  if (item.time && (h.type === 'check' || h.type === 'checklist')) {
    const caption = timeCaption(h, item.time, ctx.minutes, done || ctx.isPast);
    const s = h.schedule.useCollectionDays || h.role === 'trash' ? `coleta hoje · ${caption}` : caption;
    return { node: s, text: s };
  }
  const s = h.description ?? (h.type === 'rating' ? 'nota de 1 a 5' : '');
  return { node: s, text: s };
}

function RunCaption({ item }: { item: TodayItem }) {
  const plan = useRunPlan(item.habit.id);
  const time = item.time ? ` · ${formatTime(item.time)}` : '';
  // feito no dia: o treino que foi feito; senão, o próximo do plano
  const at = item.mark?.run ?? plan.next;
  return (
    <>
      semana {at.week}, treino {at.session}
      {time}
    </>
  );
}

/** O controle do treino guiado: "Começar" abre o próximo treino do plano do hábito; feito, os minutos. */
function RunControl({ item }: { item: TodayItem }) {
  const plan = useRunPlan(item.habit.id);
  const navigate = useNavigate();
  if (isDoneLike(item.state) || item.registered) {
    const minutes = item.mark?.run ? Math.round(item.mark.run.seconds / 60) : (item.value ?? 0);
    // o ✓ só quando o treino contou (inteiro ou a partir da metade); abaixo disso, só os minutos
    const counted = isDoneLike(item.state);
    return (
      <ValuePill
        value={`${minutes} min`}
        icon={counted ? 'check' : null}
        label={`${item.habit.name}, ${minutes} minutos${counted ? ', feito' : ''}`}
        pillar={pillarColor(item)}
      />
    );
  }
  return (
    <ActionPill
      label={`${item.habit.name}, semana ${plan.next.week}, treino ${plan.next.session}. Começar`}
      onClick={() => {
        // dentro do toque: o iPhone só libera o áudio e a trava da tela depois de um gesto
        prepareRun();
        void navigate(runPath(item.habit.id, plan.next.week, plan.next.session));
      }}
    >
      Começar
    </ActionPill>
  );
}

/** O controle à direita da linha, pelo tipo do hábito. */
function controlFor(item: TodayItem, ctx: ReturnType<typeof useTodayCtx>): ReactNode {
  const h = item.habit;
  const name = h.name;
  const pillar = pillarColor(item);
  const done = isDoneLike(item.state);
  const sheet = ctx.sheetFor(item);
  const openSheet = sheet ? () => ctx.openSheet(sheet[0], sheet[1]) : undefined;

  if (item.state === 'skipped') {
    return (
      <button
        type="button"
        className="pk-reset td-skip hit"
        aria-label={`${name} não conta ${ctx.isPast ? 'neste dia' : 'hoje'}. Opções`}
        onClick={() => ctx.openMenu(h.id)}
      />
    );
  }
  if (h.type === 'guided') return <RunControl item={item} />;

  switch (h.type) {
    case 'time': {
      if (item.registered && item.mark?.time) {
        const v = formatTime(item.mark.time);
        return (
          <ValuePill
            value={v}
            icon={done ? 'check' : null}
            state="done"
            pillar={pillar}
            label={`${name}, ${v}${done ? ', feito' : ''}. Abre o horário`}
            onClick={openSheet}
          />
        );
      }
      if (item.markedNextMorning) return null;
      if (ctx.isPast) {
        return (
          <ActionPill label={`${name}, sem registro. Registrar`} onClick={openSheet ?? (() => ctx.openHabit(h.id))}>
            Registrar
          </ActionPill>
        );
      }
      return (
        <CheckButton
          checked={false}
          label={item.goal.time ? `${name}, meta ${formatTime(item.goal.time)}` : name}
          pillar={pillar}
          quiet={ctx.paused || ctx.remote}
          onCheckedChange={(v) => ctx.check(item, v)}
        />
      );
    }
    case 'rating': {
      const r = item.mark?.rating ?? (item.registered ? item.value : null);
      if (r) {
        const v = `${r} · ${mealWord(r)}`;
        return (
          <ValuePill
            value={v}
            icon={null}
            pillar={pillar}
            label={`${name}, nota ${r}, ${mealWord(r)}. Mudar a nota`}
            onClick={openSheet}
          />
        );
      }
      return (
        <ActionPill label={`${name}, sem nota. Dar nota`} onClick={openSheet ?? (() => ctx.openHabit(h.id))}>
          Dar nota
        </ActionPill>
      );
    }
    case 'number': {
      if (item.registered && item.value !== null) {
        const v = `${formatNumber(item.value)}${item.goal.unit ? ` ${item.goal.unit}` : ''}`;
        return (
          <ValuePill
            value={v}
            icon="check"
            pillar={pillar}
            label={`${name}, ${v}, registrado. Corrigir`}
            onClick={openSheet}
          />
        );
      }
      const label = h.role === 'weight' ? 'Pesar' : 'Registrar';
      return (
        <ActionPill label={`${name}, sem registro. ${label}`} onClick={openSheet ?? (() => ctx.openHabit(h.id))}>
          {label}
        </ActionPill>
      );
    }
    case 'counter': {
      const v = formatAmount(item.value ?? 0, item.goal.unit);
      const reached = item.goal.value !== undefined && (item.value ?? 0) >= item.goal.value;
      return (
        <ValuePill
          value={v}
          icon={reached ? 'check' : null}
          pillar={pillar}
          label={`${name}, ${v}${reached ? ', meta batida' : ''}. Abre a folha`}
          onClick={openSheet ?? (() => ctx.openHabit(h.id))}
        />
      );
    }
    case 'daysSince':
      return null;
    case 'budget':
      return (
        <PlusButton
          full={!!item.budget?.full}
          label={`${name}, ${item.budget?.used ?? 0} de ${item.budget?.limit ?? 0} na semana. Usar um`}
          onClick={() => ctx.spend(item)}
        />
      );
    default:
      break;
  }
  if (h.role === 'checkin') {
    if (done) {
      const c = item.value;
      return (
        <ValuePill
          value={c ? moodWord(c) : 'feito'}
          icon="check"
          pillar={pillar}
          label={`${name}, feito. Abre o check-in`}
          onClick={openSheet}
        />
      );
    }
    return (
      <ActionPill label={`${name}. Fazer`} onClick={() => ctx.openSheet('checkin')}>
        Fazer
      </ActionPill>
    );
  }
  return (
    <CheckButton
      checked={done}
      partial={item.state === 'partial'}
      label={item.time ? `${name}, ${timeCaption(h, item.time, ctx.minutes, true)}` : name}
      pillar={pillar}
      quiet={ctx.paused || ctx.isPast || ctx.remote}
      onCheckedChange={(v) => ctx.check(item, v)}
    />
  );
}

export interface ItemRowProps {
  item: TodayItem;
  /** classes extras (cascata, flip) */
  className?: string;
  /** sem controle (Amanhã cedo) e com uma legenda própria */
  readOnly?: { subtitle: ReactNode; text: string };
  /** Lista completa: o horário do hábito abre a legenda ("até 20h30 · coleta hoje") */
  withTime?: boolean;
}

/**
 * A legenda com o horário na frente: a frase do horário que já estava nela ("meta 6h50", "às 21h", "até 20h30")
 * vem para o começo, em destaque; sem frase, entra o horário ("20h30 · coleta hoje · ainda dá tempo").
 */
function timeFirst(
  sub: { node: ReactNode; text: string; accent?: boolean },
  time: string,
): { node: ReactNode; text: string; accent?: boolean } {
  const t = formatTime(time);
  let phrase = t;
  let restNode: ReactNode = sub.node;
  let restText = sub.text;
  if (typeof sub.node === 'string') {
    const parts = sub.node.split(' · ');
    const at = parts.findIndex((p) => p === t || p === `meta ${t}` || p === `até ${t}` || p === `às ${t}`);
    if (at >= 0) {
      phrase = parts[at]!;
      restNode = parts.filter((_, i) => i !== at).join(' · ');
      restText = restNode as string;
    }
  }
  const hasRest = restNode !== '' && restNode != null;
  return {
    // texto: uma frase só, que quebra como texto; com bolinhas da semana, as peças lado a lado
    node:
      typeof restNode === 'string' || !hasRest ? (
        <span>
          <span className="td-at pk-num">{phrase}</span>
          {hasRest && ` · ${restNode as string}`}
        </span>
      ) : (
        <>
          <span className="td-at pk-num">{phrase}</span>
          <span className="td-at-sep">·</span>
          {restNode}
        </>
      ),
    text: [phrase, restText].filter(Boolean).join(', '),
    accent: sub.accent,
  };
}

/** Uma linha de hábito do Hoje. */
export function ItemRow({ item, className, readOnly, withTime }: ItemRowProps) {
  const ctx = useTodayCtx();
  const plain = readOnly ?? subtitleFor(item, ctx);
  const sub = withTime && item.time && !readOnly && 'node' in plain ? timeFirst(plain, item.time) : plain;
  const subtitle = 'node' in sub ? sub.node : sub.subtitle;
  const accent = 'accent' in sub && sub.accent;
  const isNew = item.isNew && !readOnly;
  const control = readOnly ? null : controlFor(item, ctx);
  const done = isDoneLike(item.state);
  const node = (
    <>
      {subtitle}
      {isNew && <Tag pillar={pillarColor(item)}>novo</Tag>}
    </>
  );
  return (
    <HabitRow
      habit={visualOf(item)}
      subtitle={
        subtitle === '' && !isNew ? undefined : <span className={clsx('td-sub', accent && 'td-accent')}>{node}</span>
      }
      control={control}
      done={done && !readOnly}
      muted={item.state === 'skipped'}
      onOpen={() => ctx.openHabit(item.habit.id)}
      onLongPress={readOnly ? undefined : () => ctx.openMenu(item.habit.id)}
      a11yLabel={`${item.habit.name}. ${sub.text ? `${sub.text}. ` : ''}Abre o hábito`}
      className={clsx('td-fl', `td-fl-${item.habit.id}`, className)}
    />
  );
}

/** O convite gentil, dentro da linha (uma li logo depois da linha do hábito, sem divisória). */
export function NudgeStrip({
  item,
  text,
  action,
  onAction,
  enter,
}: {
  item: Pick<TodayItem, 'pillar'>;
  text: string;
  action?: string;
  onAction?: () => void;
  /** entra com fadeUp (primeiro dia, +180 ms depois da cascata) */
  enter?: boolean;
}) {
  const c = pillarColor(item);
  const hued = c !== 'accent' && !['mente', 'alim', 'corpo', 'familia'].includes(c);
  return (
    <m.li
      className={clsx('td-nudge-li', hued && 'hued')}
      data-pillar={hued ? undefined : c}
      data-hue={hued ? c : undefined}
      initial={enter ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0, transition: { ...tween.base, delay: enter ? 0.18 : 0 } }}
      exit={{ opacity: 0, height: 0, transition: tween.base }}
    >
      <div className="pk-nudge">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { ...tween.micro, delay: 0.06 } }}
            exit={{ opacity: 0, transition: { ...tween.micro, delay: 0.06 } }}
          >
            {text}
          </m.span>
        </AnimatePresence>
        {action && onAction && (
          <button type="button" className="pk-reset lk" onClick={onAction}>
            {action}
          </button>
        )}
      </div>
    </m.li>
  );
}

// ---------- contadores ----------

/** Proteína (e qualquer contador com botões de comida): total, barra com a meta e os 3 botões da hora. */
export function CounterCard({
  item,
  quick,
}: {
  item: TodayItem;
  quick: { id: string; name: string; amount: number }[];
}) {
  const ctx = useTodayCtx();
  const c = useCounter(item.habit.id, ctx.day);
  const pillar = pillarColor(item);
  const unit = item.goal.unit ?? '';
  const total = c?.total ?? item.value ?? 0;
  const goal = item.goal.value ?? 0;
  const segments = useMemo(() => (c ? [...c.entries].sort((a, b) => a.at - b.at).map((e) => e.amount) : []), [c]);
  const sheet = ctx.sheetFor(item);
  const open = () => (sheet ? ctx.openSheet(sheet[0], sheet[1]) : ctx.openHabit(item.habit.id));
  const hued = pillar !== 'accent' && !['mente', 'alim', 'corpo', 'familia'].includes(pillar);
  return (
    <div
      className={clsx('pk-card p td-counter td-fl', `td-fl-${item.habit.id}`, hued && 'hued')}
      data-pillar={hued ? undefined : pillar}
      data-hue={hued ? pillar : undefined}
    >
      <div className="td-counter-h">
        <button
          type="button"
          className="pk-reset td-counter-name"
          onClick={open}
          aria-label={`${item.habit.name}, ${formatAmount(total, unit)} de ${formatAmount(goal, unit)}. Abre a folha`}
        >
          <PillarBubble icon={item.habit.icon} pillar={pillar} size="sm" />
          <b>{item.habit.name}</b>
        </button>
        <span className="td-counter-t pk-num" aria-hidden="true">
          <b>
            <NumberFlow value={total} suffix={unit ? ` ${unit}` : ''} />
          </b>{' '}
          <span className="faint">de {formatAmount(goal, unit)}</span>
        </span>
      </div>
      <GoalBar
        segments={segments}
        goal={goal}
        unit={unit}
        unitName={unit === 'g' ? 'gramas' : undefined}
        pillar={pillar}
      />
      {!ctx.isPast && (
        <QuickAddGrid
          items={quick.map((q) => ({ id: q.id, name: q.name, grams: q.amount }))}
          onAdd={(id) => {
            const q = quick.find((x) => x.id === id);
            if (q) ctx.add(item, q);
          }}
          onMore={open}
          pillar={pillar}
        />
      )}
    </div>
  );
}

/** A água: anel de 40 px, "1,5 L de 3 L" e os botões "+ 500 ml" e "+ 1 L" (somem às 20h30). */
export function WaterRow({ item, quick }: { item: TodayItem; quick: { id: string; name: string; amount: number }[] }) {
  const ctx = useTodayCtx();
  const pillar = pillarColor(item);
  const total = item.value ?? 0;
  const goal = item.goal.value ?? 0;
  const ml = item.goal.unit === 'ml';
  const fmt = (v: number) => (ml ? formatNumber(v / 1000, 2) : formatNumber(v));
  const goalText = formatAmount(goal, item.goal.unit);
  const reached = goal > 0 && total >= goal;
  const sheet = ctx.sheetFor(item);
  const open = () => (sheet ? ctx.openSheet(sheet[0], sheet[1]) : ctx.openHabit(item.habit.id));
  const showButtons = !ctx.isPast && !ctx.night;
  const subtitle = (
    <span className="pk-num td-water-t">
      <span>
        <NumberFlow value={ml ? total / 1000 : total} suffix={ml && total > 0 ? ' L' : ''} /> de {goalText}
      </span>
      {reached && (
        <span className="td-ok">
          <Icon name="check" weight="bold" />
          meta batida
        </span>
      )}
    </span>
  );
  return (
    <HabitList className="td-water">
      <HabitRow
        habit={visualOf(item)}
        leading={
          <Ring
            size={40}
            stroke={5}
            value={goal ? total / goal : 0}
            color="var(--mark)"
            track="var(--wash)"
            timing="ring"
          >
            <Icon name={item.habit.icon} weight="duotone" />
          </Ring>
        }
        subtitle={subtitle}
        a11yLabel={`${item.habit.name}, ${fmt(total)} de ${goalText}${reached ? ', meta batida' : ''}. Abre a folha`}
        control={
          showButtons && quick.length > 0 ? (
            <>
              {[...quick]
                .sort((a, b) => a.amount - b.amount)
                .slice(0, 2)
                .map((q) => (
                  <QuickAddButton key={q.id} amount={q.name} pillar={pillar} onClick={() => ctx.add(item, q)} />
                ))}
            </>
          ) : ctx.isPast ? (
            <ValuePill
              value={formatAmount(total, item.goal.unit)}
              icon={reached ? 'check' : null}
              pillar={pillar}
              label={`${item.habit.name}, ${formatAmount(total, item.goal.unit)}. Abre a folha`}
              onClick={open}
            />
          ) : undefined
        }
        onOpen={open}
        onLongPress={() => ctx.openMenu(item.habit.id)}
        className={clsx('td-fl', `td-fl-${item.habit.id}`)}
      />
    </HabitList>
  );
}

/** O cartão das metas da noite: proteína e água à vista, sem botões; o toque abre a folha. */
export function NightGoals({ items }: { items: TodayItem[] }) {
  const ctx = useTodayCtx();
  if (!items.length) return null;
  return (
    <div className="pk-card td-goals" data-flip="goals">
      {items.map((item) => {
        const pillar = pillarColor(item);
        const total = item.value ?? 0;
        const goal = item.goal.value ?? 0;
        const reached = goal > 0 && total >= goal;
        const sheet = ctx.sheetFor(item);
        const value = formatAmount(total, item.goal.unit);
        return (
          <button
            key={item.habit.id}
            type="button"
            className="pk-reset td-goal pk-press"
            onClick={() => (sheet ? ctx.openSheet(sheet[0], sheet[1]) : ctx.openHabit(item.habit.id))}
            aria-label={`${item.habit.name}, ${value}${reached ? ', meta batida' : ` de ${formatAmount(goal, item.goal.unit)}`}. Abre a folha`}
          >
            <PillarBubble icon={item.habit.icon} pillar={pillar} size="sm" />
            <span>
              <b className="pk-num">{value}</b>
              {reached ? (
                <small className="ok">
                  <Icon name="check" weight="bold" />
                  meta batida
                </small>
              ) : (
                <small>de {formatAmount(goal, item.goal.unit)}</small>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- check-in da noite ----------

/** O cartão do check-in no topo de Ainda hoje: tocar num rosto já abre a folha com o humor escolhido. */
export function CheckinCard({ item }: { item: TodayItem }) {
  const ctx = useTodayCtx();
  const drafts = useDrafts();
  const draft = drafts.checkins[ctx.day];
  const checkin = useCheckin(ctx.day);
  const done = isDoneLike(item.state) && !!checkin;
  return (
    // td-fl-<id>: a faixa do dia acha o cartão como acha uma linha
    <div className={`pk-card p td-ci td-fl-${item.habit.id}`} data-pillar="accent" data-flip="checkin">
      <AnimatePresence mode="wait" initial={false}>
        {done && checkin ? (
          <m.button
            key="sum"
            type="button"
            className="pk-reset td-ci-sum"
            onClick={() => ctx.openSheet('checkin')}
            aria-label={`Check-in do dia feito. Humor ${moodWord(checkin.mood)}, energia ${energyWord(checkin.energy)}. Abre o check-in`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: tween.exit }}
          >
            <span className="pk-bub td-ci-bub" aria-hidden="true">
              <Icon name="sparkle" weight="duotone" />
            </span>
            <span className="td-ci-t" aria-hidden="true">
              <b>{item.habit.name}</b>
              <span className="td-ci-faces">
                <span>
                  <Face kind="mood" level={checkin.mood as FaceLevel} />
                  {moodWord(checkin.mood)}
                </span>
                <span>
                  <Face kind="energy" level={checkin.energy as FaceLevel} />
                  {energyWord(checkin.energy)}
                </span>
              </span>
            </span>
            <Icon name="caret-right" weight="bold" className="td-ci-cv" />
          </m.button>
        ) : (
          <m.div
            key="ask"
            className="td-ci-ask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: tween.exit }}
          >
            <div className="td-ci-h">
              <span className="pk-bub td-ci-bub" aria-hidden="true">
                <Icon name={item.habit.icon} weight="duotone" />
              </span>
              <span>
                <b>{item.habit.name}</b>
                <span className="td-ci-sub">Como você está agora? Leva 2 minutos.</span>
              </span>
            </div>
            <RatingFaces
              kind="mood"
              value={draft?.mood as FaceLevel | undefined}
              label="Como você está agora? Humor"
              onChange={(v) => {
                drafts.setCheckinDraft(ctx.day, { mood: v });
                // a folha sobe 150 ms depois, para a pessoa ver a escolha
                window.setTimeout(() => ctx.openSheet('checkin', { humor: v }), 150);
              }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- limites e dias sem ----------

export function LimitsList({ items }: { items: TodayItem[] }) {
  return (
    <HabitList label="Limites da semana">
      {items.map((item) => (
        <ItemRow key={item.habit.id} item={item} />
      ))}
    </HabitList>
  );
}

export function DaysSinceGrid({ items }: { items: TodayItem[] }) {
  const ctx = useTodayCtx();
  return (
    <div className="pk-dsr" data-flip="dsr">
      {items.map((item) =>
        item.daysSince ? (
          <DaysSinceTile
            key={item.habit.id}
            habit={visualOf(item)}
            days={item.daysSince.current}
            record={item.daysSince.record}
            what={item.habit.shortName?.trim() || shortOf(item.habit)}
            onOpen={() => ctx.openHabit(item.habit.id)}
          />
        ) : null,
      )}
    </div>
  );
}
