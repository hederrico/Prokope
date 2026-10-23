// Jornada (aba): o caminho das fases, um cartão por treino guiado e as Revisões da semana (jornada.md › Jornada).
// É o plano: o que passou, a fase de agora e o que pode vir. Os números ficam em Progresso.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ScreenHeader, useMirrorPaths } from '@/components/shell';
import { Card, EmptyState, ListGroup, ListItem, PillarBubble, SectionLabel } from '@/components/ui';
import { Icon } from '@/icons';
import { useFirstMount } from '@/motion';
import {
  capitalize,
  formatDayHeader,
  formatDayMonth,
  formatDayShort,
  formatPercent,
  useJourney,
  useNow,
  usePillars,
  useReview,
  useReviewWindow,
  weekdayName,
  type PhaseView,
  type ReviewListItem,
  type TrainingSummary,
} from '@/data';
import type { Pillar } from '@/types';
import { trainingPlanPath } from '@/screens/run/paths';
import { PhasePath } from './PhasePath';
import { countsInTheDay } from './shared';
import './journey.css';
import { isExampleActive } from '@/data/example';

export default function JourneyScreen() {
  const j = useJourney();
  const { today } = useNow();
  const win = useReviewWindow();
  const pillars = usePillars({ includeArchived: true });
  const navigate = useNavigate();
  const paths = useMirrorPaths();
  const first = useFirstMount('jornada.caminho');
  // fase trocada: na primeira vez que a Jornada abre depois da troca, o nó da fase que fechou vira check com a mola toque
  const [justClosed] = useState(() => {
    const seen = readSeenPhase();
    const cur = j.current?.number ?? null;
    return seen != null && cur != null && cur > seen ? seen : null;
  });
  const currentNumber = j.current?.number ?? null;
  useEffect(() => {
    if (currentNumber != null) writeSeenPhase(currentNumber);
  }, [currentNumber]);

  const pillarById = useMemo(() => {
    const m = new Map<string, Pillar>();
    for (const p of pillars) m.set(p.pillar.id, p.pillar);
    return m;
  }, [pillars]);

  const since = j.phases.find((p) => p.start)?.start ?? null;
  const current = j.current;
  const carried = useMemo(() => {
    if (!current) return { count: 0, phases: [] as number[] };
    const before = j.phases.filter((p) => p.number < current.number);
    const count = before.reduce(
      (n, p) =>
        n +
        p.habits.filter(
          // os que pararam nesta fase ou antes dela não seguem com você
          (h) =>
            h.startDay &&
            h.startDay <= today &&
            countsInTheDay(h) &&
            (h.untilPhase == null || h.untilPhase > current.number),
        ).length,
      0,
    );
    return { count, phases: before.map((p) => p.number) };
  }, [j.phases, current, today]);

  const endReviewOf = (p: PhaseView): string => {
    const r = j.reviews.find((x) => x.status === 'done' && x.endOfPhase && x.phase === p.number);
    return r?.day ?? p.end ?? p.start ?? today;
  };

  const nextLabel = win.open
    ? 'aberta agora'
    : `próxima: ${weekdayName(win.day)}, ${formatDayShort(win.day)}`;

  return (
    <>
      <ScreenHeader
        context={formatDayHeader(today)}
        title="Jornada"
        trailing={
          <button type="button" className="jr-hdact hit" onClick={() => void navigate('/jornada/fases')}>
            <Icon name="pencil-simple" weight="bold" />
            Editar jornada
          </button>
        }
      />
      {since && <p className="jr-lede">Seu plano em fases, desde {formatDayMonth(since)}.</p>}

      <PhasePath
        phases={j.phases}
        today={today}
        pillarById={pillarById}
        pause={j.pause}
        animate={first}
        justClosed={justClosed}
        carried={carried}
        onOpenDone={(p) => void navigate(paths.pastReview(endReviewOf(p)))}
        onOpenPhase={(p) => void navigate(`/jornada/fases#fase-${p.number}`)}
      />

      {j.trainings.length > 0 && (
        <div className="jr-pad jr-trainings" style={{ marginTop: 24 }}>
          {j.trainings.map((t) => (
            <TrainingCard
              key={t.habit.id}
              t={t}
              pillar={pillarById.get(t.habit.pillarId)}
              onOpen={() => void navigate(trainingPlanPath(t.habit.id))}
            />
          ))}
        </div>
      )}

      <SectionLabel trailing={j.reviews.length ? nextLabel : undefined}>Revisões da semana</SectionLabel>
      <div className="jr-pad">
        {j.reviews.length === 0 ? (
          <EmptyState
            icon="calendar-check"
            title={
              j.firstReviewDay
                ? `A primeira Revisão da semana é no ${weekdayName(j.firstReviewDay)}, ${formatDayShort(j.firstReviewDay)}.`
                : 'A primeira Revisão da semana aparece aqui.'
            }
          />
        ) : (
          <>
            <ListGroup label="Revisões da semana">
              {j.reviews.map((r) =>
                r.status === 'pending' ? (
                  <PendingRow key={`p-${r.week}`} r={r} />
                ) : (
                  <ListItem
                    key={r.week}
                    icon={r.endOfPhase ? 'flag-banner' : 'calendar-check'}
                    pillar="accent"
                    title={capitalize(r.label)}
                    subtitle={r.context ? capitalize(r.context) : undefined}
                    value={r.constancy != null ? formatPercent(r.constancy) : undefined}
                    onClick={() => void navigate(paths.pastReview(r.day))}
                  />
                ),
              )}
            </ListGroup>
            <p className="foot jr-list-foot">Cada revisão abre só para leitura.</p>
          </>
        )}
      </div>
      <div style={{ height: 24 }} />
    </>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * O cartão de um treino guiado: o nome do hábito, o que ele é, as barrinhas das semanas (a de agora em destaque;
 * antes de começar, a última, que é onde o plano chega) e onde a pessoa está.
 */
function TrainingCard({ t, pillar, onOpen }: { t: TrainingSummary; pillar?: Pillar; onOpen: () => void }) {
  const h = t.habit;
  const max = Math.max(1, ...t.effortByWeek);
  const what = h.description?.trim()
    ? capitalize(h.description.trim())
    : `${t.names.effort} e ${t.names.rest.toLocaleLowerCase('pt-BR')}`;
  const size = `${plural(t.weeks, 'semana', 'semanas')} · ${plural(t.perWeek, 'treino', 'treinos')} por semana`;
  const waiting = h.phase ? `Entra com a fase ${h.phase}` : t.startsOn ? `Começa em ${formatDayShort(t.startsOn)}` : 'Ainda não começou';
  const where = t.available
    ? `Semana ${t.next.week} · treino ${t.next.session} de ${t.perWeek} · ${plural(t.weeks, 'semana', 'semanas')}`
    : `${waiting} · ${size}`;
  return (
    <Card
      padded
      pillar={pillar?.color}
      className="jr-runcard"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${h.name}, plano de treino. ${what}. ${
        t.available ? `Semana ${t.next.week}, treino ${t.next.session} de ${t.perWeek}` : waiting
      }, ${size.replace(' · ', ', ')}`}
    >
      <span className="jr-row">
        <PillarBubble icon={h.icon} pillar={pillar?.color} />
        <span>
          <b className="jr-t">{h.name}</b>
          <span className="cap">{what}</span>
        </span>
        <Icon name="caret-right" weight="bold" className="jr-caret" />
      </span>
      <span className="jr-spark" aria-hidden="true">
        {t.effortByWeek.map((s, i) => {
          const week = i + 1;
          const on = t.available ? week === t.next.week : week === t.weeks;
          return <i key={week} className={on ? 'on' : undefined} style={{ height: `${(s / max) * 100}%` }} />;
        })}
      </span>
      <p className="cap">{where}</p>
    </Card>
  );
}

// a última fase atual vista nesta tela (só uma lembrança da interface, neste aparelho); o modo exemplo não lê nem grava
const SEEN_KEY = 'pk-jornada-fase-vista';
function readSeenPhase(): number | null {
  if (isExampleActive()) return null;
  try {
    const v = localStorage.getItem(SEEN_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}
function writeSeenPhase(n: number) {
  if (isExampleActive()) return;
  try {
    localStorage.setItem(SEEN_KEY, String(n));
  } catch {
    /* sem armazenamento */
  }
}

/** A revisão que passou da janela sem ser feita: "Domingo, 1 nov · Fazer", no passo guardado. */
function PendingRow({ r }: { r: ReviewListItem }) {
  const rv = useReview(r.week);
  const navigate = useNavigate();
  const step = Math.min(Math.max(1, rv?.step ?? 1), rv?.steps ?? 3);
  return (
    <ListItem
      icon="calendar-check"
      pillar="accent"
      title={capitalize(r.label)}
      subtitle={r.context ? capitalize(r.context) : 'Revisão da semana'}
      trailing={
        <span className="jr-fazer">
          Fazer
          <Icon name="caret-right" weight="bold" />
        </span>
      }
      onClick={() => void navigate(`/revisao/${r.week}/${step}`)}
    />
  );
}
