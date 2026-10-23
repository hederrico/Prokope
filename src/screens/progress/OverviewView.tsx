// Progresso · visão geral (habito-progresso.md): a constância do período no anel, a semana passada e a fase
// anterior, os pilares do maior para o menor e o que os dados mostram (ou o padrão em formação, com poucos dados).
// O anel desenha em ring; com +120 ms, as barras dos pilares enchem em fill (30 ms entre elas).
import { m } from 'motion/react';
import { useNavigate } from 'react-router';
import { Card, CardHeader, MiniBar, Ring, SectionLabel, pillarAttrs } from '@/components/ui';
import { fadeUpItem, useCascadeOnce } from '@/motion';
import { pastReviewPath } from '@/components/shell';
import {
  diffDays,
  formatPercent,
  useDomain,
  useHabits,
  useJourney,
  useProgress,
  useWeek,
  type ProgressView
} from '@/data';
import type { DayKey } from '@/types';
import { shortOf } from '@/screens/habit/text';
import { useDrawGate, useDrawnValue } from './draw';
import { MorePatterns, PatternWaitCard } from './PatternWaitCard';
import { Chevron, InsightItem } from './shared';
import { overviewInsights } from './insights';
import { pillarColor } from './format';

export interface OverviewViewProps {
  p: ProgressView;
  today: DayKey;
  onTheme: (key: string) => void;
  onPhase: (n: number) => void;
  onMonth: (anchor: DayKey) => void;
}

function PillarBar({ k, ratio, delay, started }: { k: string; ratio: number; delay: number; started: boolean }) {
  const v = useDrawnValue(k, Math.round(ratio * 100), 0, started, delay);
  return <MiniBar value={v} thick />;
}

export function OverviewView({ p, today, onTheme, onPhase, onMonth }: OverviewViewProps) {
  const navigate = useNavigate();
  const journey = useJourney();
  const cascade = useCascadeOnce('progresso:visao');
  const range = p.range;
  const { observe: ringObserve, started: ringStarted, first: ringFirst } = useDrawGate<HTMLDivElement>('pg:ring', { durationMs: 600 });
  const ringValue = useDrawnValue('pg:ring', p.constancy ?? 0, 0, ringStarted);
  const { observe: barsObserve, started: barsStarted } = useDrawGate<HTMLUListElement>('pg:pilares', { durationMs: 400 + p.pillars.length * 30 });

  // a fase que contém o começo do período ("Fase 2 · Alimentação · semana 2 de 3")
  const phase =
    journey.phases.find((ph) => ph.start && ph.start <= range.from && (!ph.end || ph.end >= range.from)) ??
    journey.phases.find((ph) => ph.start && ph.start <= range.to && (!ph.end || ph.end >= range.to)) ??
    null;
  const weekIndex = phase?.start ? Math.floor(Math.max(0, diffDays(range.from, phase.start)) / 7) + 1 : null;
  let context = phase ? `Fase ${phase.number} · ${phase.name}` : '';
  if (phase && range.period === 'week' && weekIndex && phase.weeks) context += ` · semana ${weekIndex} de ${phase.weeks}`;
  if (phase && range.period === 'phase' && phase.weeks) context += ` · ${phase.weeks} semanas`;

  const title =
    range.period === 'week' ? 'Constância da semana' : range.period === 'month' ? 'Constância do mês' : 'Constância da fase';
  const ringCap = range.isCurrent
    ? 'até agora'
    : range.period === 'week'
      ? 'na semana'
      : range.period === 'month'
        ? 'no mês'
        : 'no fechamento';

  // o mês anterior (só no período de mês)
  const prevMonth = useProgress('mes', 'visao', { anchor: range.period === 'month' && range.prev ? range.prev : today });
  // a última fase concluída (ou a atual, antes de concluir alguma)
  const doneOrCurrent =
    [...journey.phases].reverse().find((ph) => ph.status === 'done') ?? journey.phases.find((ph) => ph.status === 'current');

  const week = useWeek(range.period === 'week' ? range.from : today);
  const habits = useHabits('active');
  const fewData = range.period === 'week' && !p.previous;

  const rows: { key: string; label: string; value: string; onClick?: () => void }[] = [];
  if (fewData) {
    const registered = week.days.filter((d) => !d.isFuture && !d.beforeStart && d.done > 0).length;
    rows.push({ key: 'dias', label: 'Dias registrados', value: String(registered) });
    rows.push({ key: 'habitos', label: 'Hábitos na fase', value: String(habits.length) });
  } else {
    if (range.period === 'week' && p.previous) {
      const prevKey = String(p.previous.key);
      rows.push({
        key: 'prev',
        label: range.isCurrent ? 'Semana passada' : 'Semana anterior',
        value: p.previous.ratio !== null ? formatPercent(p.previous.ratio) : '—',
        onClick: () => navigate(pastReviewPath(prevKey, 'progresso')),
      });
    } else if (range.period === 'month' && range.prev && prevMonth.constancy !== null) {
      rows.push({
        key: 'prev',
        label: range.isCurrent ? 'Mês passado' : 'Mês anterior',
        value: formatPercent(prevMonth.constancy),
        onClick: () => onMonth(range.prev!),
      });
    } else if (range.period === 'phase' && p.previous) {
      const n = Number(p.previous.key);
      rows.push({
        key: 'prev',
        label: 'Fase anterior',
        value: p.previous.ratio !== null ? formatPercent(p.previous.ratio) : '—',
        onClick: () => onPhase(n),
      });
    }
    if (range.period !== 'phase' && doneOrCurrent) {
      rows.push({
        key: 'phase',
        label: `Fase ${doneOrCurrent.number} · ${doneOrCurrent.name}`,
        value: doneOrCurrent.constancy !== null ? formatPercent(doneOrCurrent.constancy) : '—',
        onClick: () => onPhase(doneOrCurrent.number),
      });
    }
  }

  // "foco da fase 2": o pilar com o nome da fase do período mostrado
  const focusOf = (name: string) =>
    phase && phase.name.trim().toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR')
      ? `foco da fase ${phase.number}`
      : null;

  const data = useDomain();
  // até 3 padrões, sem repetir hábito: o resto do dia, a meta da semana de um contador (só na semana atual)
  // e as correlações com o humor que o domínio já calcula
  const focusPillar = phase ? (p.pillars.find((x) => focusOf(x.pillar.name))?.pillar.id ?? null) : null;
  const cards = overviewInsights(data, today, {
    currentWeek: range.period === 'week' && range.isCurrent,
    focusPillar,
    insights: p.insights,
  });
  const waiting = p.insights.length === 0 ? p.waiting : null;
  const waitHabit = waiting ? data.habitById.get(waiting.habitId) : null;
  // quantos outros padrões estão a caminho, além do cartão (contados no domínio)
  const others = waiting ? p.waitingMore : 0;
  const pct = p.constancy !== null ? Math.round(p.constancy * 100) : null;

  return (
    <m.div {...cascade}>
      <m.div className="pg-pad" variants={fadeUpItem}>
        <Card padded>
          <CardHeader title={title} subtitle={context || undefined} />
          <div className="pg-wkr" ref={ringObserve}>
            <Ring
              size={132}
              stroke={12}
              value={ringValue}
              color="var(--accent-mark)"
              track="var(--accent-wash)"
              timing={ringFirst ? 'ring' : 'fill'}
              label={pct !== null ? `${title}, ${pct}% ${ringCap}` : undefined}
            >
              <span className="pg-rn" aria-hidden="true">
                {pct !== null ? `${pct}%` : '—'}
              </span>
              <span className="cap" aria-hidden="true">
                {ringCap}
              </span>
            </Ring>
            {rows.length > 0 && (
              <div className="pg-past">
                {rows.map((r) =>
                  r.onClick ? (
                    <button key={r.key} type="button" className="pk-reset" onClick={r.onClick}>
                      <span className="cap">{r.label}</span>
                      <span className="pg-pr">
                        <b>{r.value}</b>
                        <Chevron />
                      </span>
                    </button>
                  ) : (
                    <div key={r.key}>
                      <span className="cap">{r.label}</span>
                      <b>{r.value}</b>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </Card>
      </m.div>

      {p.pillars.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-pilares">
          <SectionLabel id="pg-pilares" trailing="do maior para o menor">
            Pilares
          </SectionLabel>
          <div className="pg-pad">
            <Card>
              <ul className="pg-pils" ref={barsObserve}>
                {p.pillars.map((row, i) => {
                  const focus = focusOf(row.pillar.name);
                  const pa = pillarAttrs(pillarColor(row.pillar));
                  const ratio = row.ratio ?? 0;
                  return (
                    <li key={row.pillar.id} className={pa.className} data-pillar={pa['data-pillar']} data-hue={pa['data-hue']}>
                      <button
                        type="button"
                        className="pk-reset pg-pil pk-press"
                        onClick={() => onTheme(row.pillar.id)}
                      >
                        <i className="pg-dot" aria-hidden="true" />
                        <span>
                          <b>{row.pillar.name}</b>
                          {focus && <small>{focus}</small>}
                        </span>
                        <PillarBar k={`pg:pil:${row.pillar.id}`} ratio={ratio} delay={120 + i * 30} started={barsStarted} />
                        <em>{formatPercent(ratio)}</em>
                        <Chevron />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </m.section>
      )}

      {(cards.length > 0 || waiting) && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-dados">
          <SectionLabel id="pg-dados">O que os seus dados mostram</SectionLabel>
          <div className="pg-pad pg-stack">
            {cards.map((c) => {
              const h = c.habitId ? data.habitById.get(c.habitId) : null;
              return (
                <InsightItem
                  key={c.key}
                  text={c.text}
                  basis={c.basis}
                  icon={c.icon ?? 'sparkle'}
                  pillar={h ? pillarColor(data.pillarById.get(h.pillarId)) : undefined}
                />
              );
            })}
            {waiting && waitHabit && (
              <>
                <PatternWaitCard
                  habitName={waitHabit.name}
                  short={shortOf(waitHabit)}
                  icon={waitHabit.icon}
                  pillar={pillarColor(data.pillarById.get(waitHabit.pillarId))}
                  metric={waiting.metric}
                  withDays={waiting.withDays}
                  withoutDays={waiting.withoutDays}
                  needed={waiting.needed}
                  onOpen={() => navigate(`/progresso/habito/${encodeURIComponent(waitHabit.id)}`)}
                />
                <MorePatterns count={others} />
              </>
            )}
          </div>
        </m.section>
      )}
      <div className="pg-spacer" />
    </m.div>
  );
}
