// PhasePath: o caminho das fases da Jornada (quadro: .xd-tl). As fases ficam na primária; os hábitos dentro
// mantêm a cor do próprio pilar. É uma lista: cada fase é um item com o nome completo para o leitor de tela.
// Na primeira montagem da sessão, os nós entram em cascata, o anel da fase atual se desenha em ring e as barras
// das semanas enchem em fill. Nas outras vezes, nada anima.
import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import clsx from 'clsx';
import type { PhaseView, PhaseWeek } from '@/data';
import { formatDayShort, formatPercent, formatRange, diffDays } from '@/data';
import type { Pause, Pillar } from '@/types';
import { Chip, Ring, Tag } from '@/components/ui';
import { Icon } from '@/icons';
import { cascadeDelay, distance, spring, tween } from '@/motion';
import { habitsPhrase, phaseTitle } from './shared';

export interface PhasePathProps {
  phases: PhaseView[];
  today: string;
  pillarById: Map<string, Pillar>;
  /** pausa do app em curso hoje (o cartão "Agora" mostra "Pausado até 2 jan") */
  pause: Pause | null;
  /** primeira montagem da sessão: anima */
  animate: boolean;
  /** fase que acabou de fechar (o anel vira check com a mola toque) */
  justClosed?: number | null;
  /** quantos hábitos das fases anteriores seguem ativos */
  carried: { count: number; phases: number[] };
  onOpenDone: (phase: PhaseView) => void;
  onOpenPhase: (phase: PhaseView) => void;
}

export function PhasePath({ phases, today, pillarById, pause, animate, justClosed, carried, onOpenDone, onOpenPhase }: PhasePathProps) {
  return (
    <ol className="jr-tl" aria-label="Fases">
      {phases.map((p, i) => {
        const last = i === phases.length - 1;
        const dash = p.status !== 'done';
        const motionProps = animate
          ? {
              initial: { opacity: 0, y: distance.rise },
              animate: { opacity: 1, y: 0, transition: { ...tween.base, delay: cascadeDelay(i) } },
            }
          : {};
        return (
          <m.li key={p.number} className={clsx('jr-ph', dash && !last && 'dash')} {...motionProps}>
            {p.status === 'done' && <DonePhase p={p} fresh={justClosed === p.number} onOpen={() => onOpenDone(p)} />}
            {p.status === 'current' && (
              <CurrentPhase
                p={p}
                today={today}
                pillarById={pillarById}
                pause={pause}
                animate={animate}
                carried={carried}
                onOpen={() => onOpenPhase(p)}
              />
            )}
            {p.status === 'future' && <FuturePhase p={p} onOpen={() => onOpenPhase(p)} />}
          </m.li>
        );
      })}
    </ol>
  );
}

function DonePhase({ p, fresh, onOpen }: { p: PhaseView; fresh: boolean; onOpen: () => void }) {
  const range = p.start && p.end ? formatRange(p.start, p.end) : '';
  const pct = p.constancy != null ? formatPercent(p.constancy) : null;
  return (
    <>
      <m.span
        className="jr-node done"
        aria-hidden="true"
        initial={fresh ? { scale: 0.6 } : false}
        animate={{ scale: 1, transition: { ...spring.toque, delay: 0.12 } }}
      >
        <m.span
          style={{ display: 'grid' }}
          initial={fresh ? { scale: 0.4, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1, transition: { ...spring.toque, delay: 0.18 } }}
        >
          <Icon name="check" weight="bold" />
        </m.span>
      </m.span>
      <button
        type="button"
        className="jr-pt"
        onClick={onOpen}
        aria-label={`${phaseTitle(p).replace(' · ', ', ')}, concluída${range ? `, ${range}` : ''}${pct ? `, ${pct}` : ''}. Abre a revisão do fim da fase`}
      >
        <span>
          <b>{phaseTitle(p)}</b>
          <span className="cap">{[range, 'concluída'].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="jr-pv num">
          {pct}
          <Icon name="caret-right" weight="bold" />
        </span>
      </button>
    </>
  );
}

function FuturePhase({ p, onOpen }: { p: PhaseView; onOpen: () => void }) {
  const when = p.start ? `Pode começar em ${formatDayShort(p.start)}` : 'Depois da fase anterior';
  const what = habitsPhrase(p.habits);
  return (
    <>
      <span className="jr-node next" aria-hidden="true">
        {p.number}
      </span>
      <button
        type="button"
        className="jr-pt next"
        onClick={onOpen}
        aria-label={`${phaseTitle(p).replace(' · ', ', ')}. ${when}. ${what}. Abre Editar fases`}
      >
        <span>
          <b>{phaseTitle(p)}</b>
          <span className="jr-date">{when}</span>
          {what && <span className="cap">{what}</span>}
        </span>
        <Icon name="caret-right" weight="bold" />
      </button>
    </>
  );
}

function weekFill(w: PhaseWeek, today: string): number {
  if (w.future) return 0;
  if (!w.current) return 1;
  const total = diffDays(w.end, w.start) + 1;
  return Math.min(1, Math.max(0, (diffDays(today, w.start) + 1) / total));
}

function CurrentPhase({
  p,
  today,
  pillarById,
  pause,
  animate,
  carried,
  onOpen,
}: {
  p: PhaseView;
  today: string;
  pillarById: Map<string, Pillar>;
  pause: Pause | null;
  animate: boolean;
  carried: { count: number; phases: number[] };
  onOpen: () => void;
}) {
  const totalDays = p.start && p.end ? diffDays(p.end, p.start) + 1 : null;
  const dayRatio = totalDays && p.dayIndex ? Math.min(1, p.dayIndex / totalDays) : 0.5;
  // o anel do nó se desenha na primeira montagem
  const [ring, setRing] = useState(animate ? 0 : dayRatio);
  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setRing(dayRatio));
    return () => cancelAnimationFrame(id);
  }, [animate, dayRatio]);
  const shownRing = animate ? ring : dayRatio;

  const paused = !!pause && pause.habitIds === null && pause.start <= today && pause.end >= today;
  const weekLabel = paused
    ? `Pausado até ${formatDayShort(pause!.end)}`
    : p.weekIndex
      ? `semana ${p.weekIndex}${p.weekBars.length ? ` de ${p.weekBars.length}` : ''}`
      : '';
  const current = p.weekBars.find((w) => w.current);
  const carriedText =
    carried.count > 0
      ? carried.phases.length === 1
        ? `Os ${carried.count} hábitos da fase ${carried.phases[0]} continuam com você.`
        : `Os ${carried.count} hábitos das fases anteriores continuam com você.`
      : null;
  const label = [
    `Fase ${p.number}, ${p.name}, agora`,
    weekLabel,
    current?.ratio != null ? `${formatPercent(current.ratio)} na semana` : null,
    `${p.habits.length} ${p.habits.length === 1 ? 'hábito novo' : 'hábitos novos'}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <span className="jr-node now" aria-hidden="true">
        <Ring size={34} stroke={3} value={shownRing} color="var(--accent-mark)" track="var(--accent-wash)">
          <b>{p.number}</b>
        </Ring>
      </span>
      <button type="button" className="jr-now" onClick={onOpen} aria-label={`${label}. Abre Editar fases`}>
        <span className="jr-between">
          <Tag dot upper lift pillar="accent">
            Agora
          </Tag>
          <span className="cap num">{weekLabel}</span>
        </span>
        <span>
          <b className="jr-t">{phaseTitle(p)}</b>
          {p.start && <span className="cap">{p.end ? formatRange(p.start, p.end) : `desde ${formatDayShort(p.start)}`}</span>}
        </span>
        {p.weekBars.length > 0 && (
          <span className="jr-wks" style={{ ['--n' as string]: p.weekBars.length }} aria-hidden="true">
            {p.weekBars.map((w) => {
              const fill = weekFill(w, today);
              const hatched = paused && w.current;
              return (
                <span key={w.index}>
                  <i className={hatched ? 'paused' : undefined}>
                    {!hatched && fill > 0 && (
                      <m.em
                        initial={animate ? { width: '0%' } : false}
                        animate={{ width: `${fill * 100}%` }}
                        transition={{ ...tween.fill, delay: animate ? 0.12 : 0 }}
                      />
                    )}
                  </i>
                  {`semana ${w.index}`}
                  {w.ratio != null && !w.future ? ` · ${formatPercent(w.ratio)}` : ''}
                </span>
              );
            })}
          </span>
        )}
        {p.habits.length > 0 && (
          <span className="jr-hc">
            {p.habits.map((h) => (
              <Chip key={h.id} icon={h.icon} iconWeight="duotone" pillar={pillarById.get(h.pillarId)?.color}>
                {h.name}
              </Chip>
            ))}
          </span>
        )}
        {carriedText && <span className="cap">{carriedText}</span>}
      </button>
    </>
  );
}
