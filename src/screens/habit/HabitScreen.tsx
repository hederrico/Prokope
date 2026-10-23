// Hábito (/hoje/habito/:id, /progresso/habito/:id, /ajustes/habitos/:id): o detalhe de qualquer tipo de hábito.
// Sim ou não (e vezes por semana, lista, horário, contador, nota, número, limite): o topo, os números (força do
// hábito, a semana, o total), o calendário do mês para corrigir um dia, o insight (ou a espera, com poucos dados)
// e Pausar e Arquivar. "Dias sem" tem a tela própria (DaysSinceDetail). O voltar diz a origem (a pilha da aba).
// Ao aparecer: cascata de 30 ms em topo, números, calendário e insight; a MiniBar da força enche em fill.
import { useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Card,
  CardHeader,
  EmptyState,
  HeatmapKey,
  InsightCard,
  ListGroup,
  ListItem,
  MiniBar,
  NumberFlow,
  PillarBubble,
  Tag,
  WeekDots,
  pillarAttrs,
  type HeatmapKeyProps,
  type PillarColor,
} from '@/components/ui';
import { NavBar, showUndo, useCurrentTab, useGoBack, useOpenSheet, useScreenTitle } from '@/components/shell';
import { Icon } from '@/icons';
import { fadeUpItem, useCascadeOnce } from '@/motion';
import { archiveHabit, restoreHabit } from '@/actions';
import {
  addDays,
  capitalize,
  formatDayMonth,
  formatDayShort,
  formatNumber,
  monthName,
  parseDay,
  useFrozen,
  useHabit,
  useHabitStats,
  useNow,
  type HabitStatsView,
  type HabitView,
} from '@/data';
import type { DayKey, Habit } from '@/types';
import { DailyBarsChart } from '@/screens/progress/DailyBarsChart';
import { DayRings } from '@/screens/progress/DayRings';
import { useDrawGate, useDrawnValue } from '@/screens/progress/draw';
import { PatternWaitCard } from '@/screens/progress/PatternWaitCard';
import { fmt1, shortMinutes } from '@/screens/progress/format';
import { habitCells, sheetForDay } from './cells';
import { DaysSinceDetail } from './DaysSinceDetail';
import { MonthArrows, MonthCalendar } from './MonthCalendar';
import { agree, countNoun, habitSubtitle, pluralNoun, shortOf } from './text';
import './habit.css';

function valueText(v: number, unit?: string) {
  if (unit === 'min') return shortMinutes(v);
  return formatNumber(v);
}

// ---------- topo ----------

function Hero({ h, pillar, onEdit }: { h: HabitView; pillar?: PillarColor; onEdit?: () => void }) {
  const habit = h.habit;
  const notes: string[] = [];
  if (h.status === 'paused' && h.pause) notes.push(`pausado até ${formatDayShort(h.pause.end)}`);
  if (h.status === 'archived') notes.push('arquivado');
  if (h.status === 'upcoming') notes.push(habit.phase ? `começa na fase ${habit.phase}` : 'ainda não começou');
  const sub = [habitSubtitle(habit, h.today.goal), ...notes].filter(Boolean).join(' · ');
  return (
    <div className="hb-hero">
      <PillarBubble icon={habit.icon} pillar={pillar} size="lg" />
      <h1 tabIndex={-1}>{habit.name}</h1>
      {(h.pillar || h.alsoIn.length > 0) && (
        <div className="hb-tags">
          {h.pillar && (
            <Tag pillar={pillar} dot>
              {h.pillar.name}
            </Tag>
          )}
          {h.alsoIn.map((p) => (
            <Tag key={p.id} pillar={p.color as PillarColor} dot>
              {p.name}
            </Tag>
          ))}
        </div>
      )}
      {sub &&
        (onEdit && h.status !== 'archived' ? (
          <button type="button" className="pk-reset hb-sub hb-sub-btn" aria-label={`${sub}. Editar o hábito`} onClick={onEdit}>
            {sub}
          </button>
        ) : (
          <p className="hb-sub">{sub}</p>
        ))}
    </div>
  );
}

// ---------- números ----------

interface StatItem {
  key: string;
  label: string;
  value: ReactNode;
  extra?: ReactNode;
  muted?: boolean;
  /** o que o leitor de tela diz: "Força do hábito, 72%" */
  spoken: string;
}

function StrengthBar({ id, value }: { id: string; value: number }) {
  const { observe, started, first } = useDrawGate<HTMLSpanElement>(`hb:forca:${id}`, { durationMs: 400 });
  const v = useDrawnValue(`hb:forca:${id}`, value, 0, started, first ? 0 : 60);
  return (
    <span ref={observe}>
      <MiniBar value={v} />
    </span>
  );
}

function monthCells(st: HabitStatsView, today: DayKey) {
  return st.month.weeks.flat().filter((c) => c.inMonth && c.day <= today);
}

function statItems(habit: Habit, st: HabitStatsView, today: DayKey): { items: StatItem[]; why: string | null } {
  const short = shortOf(habit);
  const strengthItem = (): StatItem => {
    const v = st.strength.value;
    return {
      key: 'forca',
      label: 'Força do hábito',
      spoken: v === null ? `Força do hábito, aparece com ${st.strength.needed} dias` : `Força do hábito, ${Math.round(v * 100)}%`,
      muted: v === null,
      value:
        v === null ? (
          '—'
        ) : (
          <NumberFlow value={v} delay={60} format={{ style: 'percent', maximumFractionDigits: 0 }} />
        ),
      extra:
        v === null ? (
          <span className="cap">aparece com {st.strength.needed} dias</span>
        ) : (
          <StrengthBar id={habit.id} value={Math.round(v * 100)} />
        ),
    };
  };
  const weekTotal = habit.type === 'weekly' ? st.week.target : Math.max(st.week.scheduled, st.week.done);
  const weekItem: StatItem = {
    key: 'semana',
    label: 'Nesta semana',
    spoken: `Nesta semana, ${st.week.done} de ${weekTotal}`,
    value: (
      <>
        <NumberFlow value={st.week.done} delay={120} />
        <small>de {weekTotal}</small>
      </>
    ),
    extra: weekTotal <= 14 ? <WeekDots total={weekTotal} done={Math.min(st.week.done, weekTotal)} /> : undefined,
  };
  const total = st.totals.withDays;
  const totalNoun =
    habit.type === 'time'
      ? total === 1
        ? 'dia no horário'
        : 'dias no horário'
      : habit.type === 'counter'
        ? total === 1
          ? 'dia na meta'
          : 'dias na meta'
        : habit.type === 'rating'
          ? total === 1
            ? 'nota'
            : 'notas'
          : countNoun(total, short);
  const totalItem: StatItem = {
    key: 'total',
    label: 'Total',
    spoken: `Total, ${total} ${totalNoun}`,
    value: <NumberFlow value={total} delay={120} />,
    extra: <span className="cap">{totalNoun}</span>,
  };
  const eachNoun = pluralNoun(short) ? short : 'dia feito';
  const why = `A força do hábito sobe a cada ${eachNoun} e desce devagar nos dias sem. Ela nunca zera.`;

  switch (habit.type) {
    case 'rating': {
      const vals = monthCells(st, today)
        .map((c) => c.value)
        .filter((v): v is number => !!v);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      return {
        items: [
          {
            key: 'media',
            label: 'Média do mês',
            spoken: avg !== null ? `Média do mês, ${fmt1(avg)} de 5` : 'Média do mês, sem notas',
            muted: avg === null,
            value: (
              <>
                {avg !== null ? <NumberFlow value={avg} format={{ maximumFractionDigits: 1 }} /> : '—'}
                <small>de 5</small>
              </>
            ),
            extra: avg !== null ? <StrengthBar id={habit.id} value={(avg / 5) * 100} /> : undefined,
          },
          weekItem,
          totalItem,
        ],
        why: null,
      };
    }
    case 'number': {
      const all = st.heatmap.flat().filter((c) => c.day <= today && c.value !== null);
      const last7 = all.filter((c) => c.day > addDays(today, -7));
      const avg = last7.length ? last7.reduce((a, c) => a + (c.value ?? 0), 0) / last7.length : null;
      const lastOne = all[all.length - 1];
      const unit = habit.goal.unit;
      return {
        items: [
          {
            key: 'media',
            label: 'Média de 7 dias',
            spoken: avg !== null ? `Média de 7 dias, ${valueText(avg, unit)} ${unit ?? ''}`.trim() : 'Média de 7 dias, sem registro',
            muted: avg === null,
            value: avg !== null ? valueText(avg, unit) : '—',
            extra: unit && unit !== 'min' ? <span className="cap">{unit}</span> : undefined,
          },
          {
            key: 'ultimo',
            label: 'Último',
            spoken: lastOne ? `Último, ${valueText(lastOne.value!, unit)} ${unit ?? ''}`.trim() : 'Último, sem registro',
            muted: !lastOne,
            value: lastOne ? valueText(lastOne.value!, unit) : '—',
            extra: lastOne ? <span className="cap">{formatDayShort(lastOne.day)}</span> : undefined,
          },
          {
            ...totalItem,
            spoken: `Total, ${total} ${total === 1 ? 'registro' : 'registros'}`,
            extra: <span className="cap">{total === 1 ? 'registro' : 'registros'}</span>,
          },
        ],
        why: null,
      };
    }
    case 'budget': {
      const b = st.budget;
      return {
        items: [
          {
            key: 'semana',
            label: 'Nesta semana',
            spoken: `Nesta semana, ${b?.used ?? 0} de ${b?.limit ?? 0}`,
            value: (
              <>
                <NumberFlow value={b?.used ?? 0} delay={60} />
                <small>de {b?.limit ?? 0}</small>
              </>
            ),
            extra: b ? <WeekDots total={Math.max(b.limit, b.used)} done={b.used} /> : undefined,
          },
          {
            ...totalItem,
            spoken: `Total, ${total} ${total === 1 ? 'dia com uso' : 'dias com uso'}`,
            extra: <span className="cap">{total === 1 ? 'dia com uso' : 'dias com uso'}</span>,
          },
        ],
        why: null,
      };
    }
    default:
      return { items: [strengthItem(), weekItem, totalItem], why };
  }
}

function StatsCard({ habit, st, pillar, today }: { habit: Habit; st: HabitStatsView; pillar?: PillarColor; today: DayKey }) {
  const { items, why } = statItems(habit, st, today);
  return (
    <Card pillar={pillar}>
      <div className="pk-stats hb-wst">
        {items.map((it) => (
          <div key={it.key} className="pk-stat" role="group" aria-label={it.spoken}>
            <span className="k" aria-hidden="true">
              {it.label}
            </span>
            <span className={it.muted ? 'v muted' : 'v'} aria-hidden="true">
              {it.value}
            </span>
            {it.extra && (
              <span className="hb-x" aria-hidden="true">
                {it.extra}
              </span>
            )}
          </div>
        ))}
      </div>
      {why && (
        <p className="hb-why">
          <Icon name="info" weight="regular" />
          <span>{why}</span>
        </p>
      )}
    </Card>
  );
}

// ---------- semana do contador ----------

function CounterWeek({
  habit,
  st,
  today,
  pillar,
  onOpenDay,
}: {
  habit: Habit;
  st: HabitStatsView;
  today: DayKey;
  pillar?: PillarColor;
  onOpenDay: (d: DayKey) => void;
}) {
  const unit = habit.goal.unit;
  const liquid = unit === 'ml' || unit === 'L';
  const days = st.daily.map((d) => ({ day: d.day, total: d.total, isToday: d.day === today, future: d.day > today }));
  const goal = st.daily.find((d) => d.goal !== undefined)?.goal ?? habit.goal.value;
  const closed = st.daily.filter((d) => d.day < today && d.state !== 'inactive' && d.state !== 'paused');
  const hit = closed.filter((d) => d.state === 'done').length;
  const goalTxt = goal === undefined ? '' : unit === 'ml' ? `${formatNumber(goal / 1000, 2)} L` : `${formatNumber(goal)} ${unit ?? ''}`.trim();
  const title = goal === undefined ? 'Esta semana' : `${goalTxt} ou mais em ${hit} ${closed.length === 1 ? 'do dia fechado' : `dos ${closed.length} dias fechados`}`;
  return (
    <Card padded pillar={pillar} className="hb-week pg-pc">
      <CardHeader title={title} subtitle={liquid ? `Esta semana · meta ${goalTxt}` : `Esta semana, em ${unit === 'g' ? 'gramas' : (unit ?? 'unidades')}`} />
      {liquid ? (
        <DayRings chartKey={`hb:aneis:${habit.id}`} days={days} goal={goal ?? 0} unit={unit} onSelect={onOpenDay} />
      ) : (
        <div style={{ margin: '14px 0 4px' }}>
          <DailyBarsChart
            chartKey={`hb:barras:${habit.id}`}
            days={days}
            goal={goal}
            unit={unit}
            label={`${habit.name} nesta semana. ${title}.`}
            onSelect={onOpenDay}
          />
        </div>
      )}
    </Card>
  );
}

// ---------- calendário ----------

function CalendarCard({
  habit,
  st,
  today,
  pillar,
  selected,
  onSelect,
  onMonth,
  gridKey,
  direction,
  hasPrev,
}: {
  habit: Habit;
  st: HabitStatsView;
  today: DayKey;
  pillar?: PillarColor;
  selected: DayKey | null;
  onSelect: (day: DayKey) => void;
  onMonth: (dir: -1 | 1) => void;
  gridKey: string;
  direction: number;
  hasPrev: boolean;
}) {
  const short = shortOf(habit);
  const cells = habitCells(st.month.weeks, habit, today);
  const inMonth = st.month.weeks.flat().filter((c) => c.inMonth);
  const done = inMonth.filter((c) => c.state === 'done').length;
  const isCurrent = st.month.year === parseDay(today).year && st.month.month === parseDay(today).month;
  const title = capitalize(monthName(st.month.month)) + (st.month.year !== parseDay(today).year ? ` de ${st.month.year}` : '');
  const opens = sheetForDay(habit, today).name;
  const action = opens === 'corrigir' ? 'toque para corrigir' : 'toque num dia para ver';
  const noun =
    habit.type === 'budget'
      ? done === 1
        ? 'dia com uso'
        : 'dias com uso'
      : habit.type === 'rating'
        ? done === 1
          ? 'nota'
          : 'notas'
        : habit.type === 'number'
          ? done === 1
            ? 'registro'
            : 'registros'
          : habit.type === 'time'
            ? done === 1
              ? 'dia no horário'
              : 'dias no horário'
            : habit.type === 'counter'
              ? done === 1
                ? 'dia na meta'
                : 'dias na meta'
              : countNoun(done, short);
  const doneLabel =
    habit.type === 'budget' ? 'Usou' : habit.type === 'number' ? 'Com registro' : habit.type === 'rating' ? 'Com nota' : 'Feito';
  const noneLabel =
    habit.type === 'budget'
      ? 'Não usou'
      : habit.type === 'number'
        ? 'Sem registro'
        : habit.type === 'rating'
          ? 'Sem nota'
          : `Sem ${short}`;
  const key: HeatmapKeyProps['items'] = [{ state: 'done', label: doneLabel }];
  if (habit.goal.partialMin !== undefined || inMonth.some((c) => c.state === 'partial'))
    key.push({ state: 'partial', label: 'Parcial' });
  key.push({ state: 'none', label: noneLabel });
  if (inMonth.some((c) => c.state === 'paused' || c.state === 'skipped')) key.push({ state: 'paused', label: 'Pausado' });
  if (inMonth.some((c) => c.state === 'offSchedule')) key.push({ state: 'off', label: 'Fora da agenda' });
  if (inMonth.some((c) => c.state === 'future') || isCurrent) key.push({ state: 'future', label: 'Por vir' });
  if (isCurrent) key.push({ state: 'today', label: 'Hoje' });
  const showNever =
    isCurrent && st.neverTwoInARow && habit.startDay && (habit.type === 'check' || habit.type === 'checklist' || habit.type === 'time');

  return (
    <Card padded pillar={pillar} className="hb-cal">
      <CardHeader
        title={title}
        subtitle={`${done} ${noun} · ${action}`}
        trailing={
          <MonthArrows
            onPrev={() => onMonth(-1)}
            onNext={() => onMonth(1)}
            prevDisabled={!hasPrev}
            nextDisabled={isCurrent}
          />
        }
      />
      <MonthCalendar
        variant="habit"
        weeks={cells}
        selected={selected}
        onSelect={onSelect}
        gridKey={gridKey}
        direction={direction}
        label={`${title}, ${habit.name}`}
      />
      {showNever && (
        <p className="hb-nv">
          <Icon name="seal-check" weight="duotone" />
          <span>
            Desde {formatDayMonth(habit.startDay!)}, você nunca ficou dois dias seguidos sem {short}.
          </span>
        </p>
      )}
      <HeatmapKey items={key} pillar={pillar} />
    </Card>
  );
}

// ---------- insight ----------

function HabitInsight({ habit, st, pillar }: { habit: Habit; st: HabitStatsView; pillar?: PillarColor }) {
  const c = st.correlation;
  if (!c) return null;
  const short = shortOf(habit);
  const what = c.metric === 'mood' ? 'humor' : 'energia';
  if (!c.ready) {
    return (
      <PatternWaitCard
        habitName={habit.name}
        short={short}
        icon={habit.icon}
        pillar={pillar}
        metric={c.metric}
        withDays={c.withDays}
        withoutDays={c.withoutDays}
        needed={c.needed}
        showHeader={false}
        almostAll
      />
    );
  }
  const diff = c.diff ?? 0;
  if (diff <= -0.2) return null;
  if (diff < 0.2) {
    return (
      <div
        className={`hb-neutral ${pillarAttrs(pillar).className ?? ''}`}
        data-pillar={pillarAttrs(pillar)['data-pillar']}
        data-hue={pillarAttrs(pillar)['data-hue']}
      >
        <Icon name="smiley" weight="duotone" />
        <span>
          Por enquanto, o {what} fica parecido nos dias com e sem {short}.
        </span>
      </div>
    );
  }
  // a base é a história do hábito: os dias com e sem desde o começo (o "Total" logo acima)
  const w = st.totals.withDays;
  const wo = st.totals.withoutDays;
  const base = `${w} ${w === 1 ? 'dia' : 'dias'} com · ${wo} ${wo === 1 ? 'dia' : 'dias'} sem`;
  const text = `Nos dias com ${short}, ${c.metric === 'mood' ? 'seu humor médio foi' : 'sua energia média foi'} ${fmt1(c.withAvg ?? 0)}. Nos outros, ${fmt1(c.withoutAvg ?? 0)}.`;
  return (
    <InsightCard
      pillar={pillar ?? 'accent'}
      icon={c.metric === 'mood' ? 'smiley' : 'lightning'}
      text={text}
      basis={base}
      compare={{
        with: c.withAvg ?? 0,
        without: c.withoutAvg ?? 0,
        withLabel: `com ${short}`,
        withoutLabel: `sem ${short}`,
        kind: c.metric,
      }}
    />
  );
}

// ---------- a tela ----------

function HabitDetail({ h, pillar }: { h: HabitView; pillar?: PillarColor }) {
  const habit = h.habit;
  const { today } = useNow();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const openSheet = useOpenSheet();
  const cascade = useCascadeOnce(`habito:${habit.id}`);
  const [month, setMonth] = useState<{ anchor: DayKey | null; dir: number }>({ anchor: null, dir: 0 });
  const live = useHabitStats(habit.id, month.anchor ?? undefined);
  const sheet = params.get('folha') ?? '';
  // com uma folha aberta, os números e o calendário esperam ela fechar para andar (a coreografia depois de
  // corrigir um dia); sem folha, acompanham os dados na hora (o Desfazer do toast volta pelo mesmo caminho)
  const frozen = useFrozen(live, `${sheet}|${month.anchor ?? ''}`);
  const st = sheet ? frozen : live;
  const selected = sheet && sheet !== 'menu' ? params.get('dia') : null;
  if (!st) return null;

  const openDay = (day: DayKey) => {
    const s = sheetForDay(habit, day);
    openSheet(s.name, s.args);
  };
  const monthStart = `${st.month.year}-${String(st.month.month).padStart(2, '0')}-01`;
  const hasPrev = !!habit.startDay && habit.startDay < monthStart;
  const changeMonth = (dir: -1 | 1) => {
    const next = dir < 0 ? addDays(monthStart, -1).slice(0, 8) + '01' : addDays(monthStart, 32).slice(0, 8) + '01';
    const isNow = next.slice(0, 7) === today.slice(0, 7);
    setMonth({ anchor: isNow ? null : next, dir });
  };

  const archive = async () => {
    const short = capitalize(shortOf(habit));
    const undo = await archiveHabit(habit.id);
    goBack();
    window.setTimeout(
      () => showUndo({ title: `${short} ${agree(short, 'arquivado')}`, pillar, icon: 'archive' }, () => void undo()),
      200,
    );
  };
  const restore = async () => {
    const short = capitalize(shortOf(habit));
    const undo = await restoreHabit(habit.id);
    showUndo({ title: `${short} de volta`, pillar, icon: 'arrow-counter-clockwise' }, () => void undo());
  };

  return (
    <m.div className="hb-screen" {...cascade}>
      <m.div variants={fadeUpItem}>
        <Hero h={h} pillar={pillar} onEdit={() => navigate(`/ajustes/habitos/${encodeURIComponent(habit.id)}/editar`)} />
      </m.div>
      <div className="hb-pad hb-stack">
        <m.div variants={fadeUpItem} className="hb-stack">
          <StatsCard habit={habit} st={st} pillar={pillar} today={today} />
          {habit.type === 'counter' && st.daily.length > 0 && (
            <CounterWeek habit={habit} st={st} today={today} pillar={pillar} onOpenDay={openDay} />
          )}
        </m.div>
        <m.div variants={fadeUpItem}>
          <CalendarCard
            habit={habit}
            st={st}
            today={today}
            pillar={pillar}
            selected={selected}
            onSelect={openDay}
            onMonth={changeMonth}
            gridKey={monthStart}
            direction={month.dir}
            hasPrev={hasPrev}
          />
        </m.div>
        <m.div variants={fadeUpItem}>
          <HabitInsight habit={habit} st={st} pillar={pillar} />
        </m.div>
      </div>
      <div className="hb-pad" style={{ paddingTop: 20 }}>
        {h.status === 'archived' ? (
          <ListGroup>
            <ListItem
              icon="arrow-counter-clockwise"
              title="Desarquivar"
              subtitle="Volta para o Hoje. Os dias arquivados ficam fora das contas."
              onClick={() => void restore()}
            />
          </ListGroup>
        ) : (
          <ListGroup>
            <ListItem
              icon="pause-circle"
              title="Pausar este hábito"
              subtitle="Dias pausados não contam na força do hábito"
              onClick={() => navigate(`/ajustes/pausar?habito=${encodeURIComponent(habit.id)}`)}
            />
            <ListItem
              icon="archive"
              title="Arquivar"
              subtitle="Sai do Hoje. O histórico fica guardado."
              onClick={() => void archive()}
            />
          </ListGroup>
        )}
      </div>
      <div style={{ height: 24, flex: 'none' }} />
    </m.div>
  );
}

export default function HabitScreen() {
  const id = useParams().id;
  const h = useHabit(id);
  const openSheet = useOpenSheet();
  const navigate = useNavigate();
  const tab = useCurrentTab();
  useScreenTitle(h?.habit.name);

  if (!h) {
    return (
      <>
        <NavBar />
        <div className="hb-missing">
          <EmptyState title="Este hábito não existe mais." detail="Ele pode ter sido apagado em outro aparelho." />
        </div>
      </>
    );
  }
  const pillar = (h.pillar?.color as PillarColor | undefined) ?? undefined;
  return (
    <>
      {/* em Ajustes › Hábitos, "Editar" abre o formulário; no Hoje e no Progresso, o Mais abre o menu do hábito */}
      <NavBar
        action={
          tab === 'ajustes'
            ? { label: 'Editar', onClick: () => navigate(`/ajustes/habitos/${encodeURIComponent(h.habit.id)}/editar`) }
            : { label: 'Mais', icon: 'dots-three', onClick: () => openSheet('menu', { habito: h.habit.id }) }
        }
      />
      {h.habit.type === 'daysSince' ? <DaysSinceDetail habit={h.habit} pillar={pillar} /> : <HabitDetail h={h} pillar={pillar} />}
    </>
  );
}
