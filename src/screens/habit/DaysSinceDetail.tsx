// Hábito · dias sem (zero refrigerante): a contagem atual no centro, na serifa, com o recorde sempre à vista,
// os períodos (do mais novo para o mais antigo) e "Registrar deslize", que abre a folha do deslize.
// Um deslize fecha um período e abre outro; tocar num período abre a folha do deslize que o limita, para corrigir.
// Sem cor de alerta. Quando a contagem passa o recorde, o selo "recorde" vai para o período atual com a mola festa.
import clsx from 'clsx';
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Button, Card, PillarBubble, RollingNumber, SectionLabel, Tag, type PillarColor } from '@/components/ui';
import { useOpenSheet } from '@/components/shell';
import { Icon } from '@/icons';
import { fadeUp, fadeUpItem, useCascadeOnce } from '@/motion';
import { formatDayMonth, formatDayShort, useDaysSince, useFrozen, useNow, type DaysSincePeriod } from '@/data';
import { useSearchParams } from 'react-router';
import type { Habit } from '@/types';
import { useDrawGate, useDrawnValue } from '@/screens/progress/draw';
import { shortOf } from './text';

function rangeText(p: DaysSincePeriod, today: string) {
  return `${formatDayShort(p.start)} – ${p.end === today && p.current ? 'hoje' : formatDayShort(p.end)}`;
}

function PeriodBar({ k, pct, now, delay, started }: { k: string; pct: number; now: boolean; delay: number; started: boolean }) {
  const v = useDrawnValue(k, pct, 0, started, delay);
  return (
    <span className="hb-pbar" aria-hidden="true">
      <i style={{ width: `${v}%` }} />
      {now && <span className="hb-knob" style={{ left: `${v}%`, opacity: started ? 1 : 0 }} />}
    </span>
  );
}

export function DaysSinceDetail({ habit, pillar }: { habit: Habit; pillar?: PillarColor }) {
  const [params] = useSearchParams();
  const sheet = params.get('folha') ?? '';
  // com a folha do deslize aberta, a contagem espera ela fechar para descer (o 12 desce até 0 depois)
  const live = useDaysSince(habit.id);
  const frozen = useFrozen(live, sheet);
  const ds = sheet ? frozen : live;
  const { today } = useNow();
  const openSheet = useOpenSheet();
  const cascade = useCascadeOnce(`habito:${habit.id}`);
  const { observe, started } = useDrawGate<HTMLDivElement>(`hb:periodos:${habit.id}`, { durationMs: 500 });
  // o selo de recorde muda de período (novo recorde): entra com a mola festa, uma vez
  const recordStart = ds?.periods.find((p) => p.record)?.start ?? null;
  const [rec, setRec] = useState({ start: recordStart, moved: false });
  if (rec.start !== recordStart) setRec({ start: recordStart, moved: rec.start !== null && recordStart !== null });
  if (!ds) return null;
  const short = shortOf(habit);
  const recordPeriod = ds.periods.find((p) => p.record) ?? null;
  const recordMoved = rec.moved;

  const missing = ds.record - ds.current;
  const caption = ds.paused
    ? 'A contagem fica parada durante a pausa.'
    : ds.isRecord && ds.periods.length > 1
      ? 'Este é o seu recorde.'
      : missing > 0 && ds.periods.length > 1
        ? `Mais ${missing} ${missing === 1 ? 'dia' : 'dias'} e você iguala o seu recorde.`
        : null;
  const dias = (n: number) => (n === 1 ? 'dia' : 'dias');
  const heroLabel = `${ds.current} ${dias(ds.current)} sem ${short}. Recorde de ${ds.record} ${dias(ds.record)}.`;

  return (
    <m.div className="hb-screen" {...cascade}>
      <m.div variants={fadeUpItem} className="hb-hero hb-ds-hero">
        <PillarBubble icon={habit.icon} pillar={pillar} size="lg" />
        <h1 tabIndex={-1}>{habit.name}</h1>
        <RollingNumber value={ds.current} className="hb-huge" />
        <span className="hb-hs" aria-hidden="true">
          {dias(ds.current)} sem {short}
        </span>
        <span className="pk-sr" aria-live="polite">
          {heroLabel}
        </span>
      </m.div>

      <m.div variants={fadeUpItem} className="hb-pad">
        <Card pillar={pillar} className="pk-stats hb-stats2">
          <div className="pk-stat">
            <span className="k">
              <Icon name="trophy" weight="duotone" />
              Recorde
            </span>
            <span className="v">
              {ds.record}
              <small>{dias(ds.record)}</small>
            </span>
            {recordPeriod && <span className="cap">{rangeText(recordPeriod, today)}</span>}
          </div>
          <div className="pk-stat">
            <span className="k">Total</span>
            <span className="v">
              {ds.total}
              <small>{ds.total === 1 ? 'dia sem' : 'dias sem'}</small>
            </span>
            {habit.startDay && <span className="cap">desde {formatDayMonth(habit.startDay)}</span>}
          </div>
        </Card>
      </m.div>

      <m.section variants={fadeUpItem} aria-labelledby={`hb-periodos-${habit.id}`}>
        <SectionLabel id={`hb-periodos-${habit.id}`}>Períodos</SectionLabel>
        <div className="hb-pad">
          <Card padded pillar={pillar} className="hb-hist hb-pc">
            <div ref={observe}>
              <ul className="hb-pers">
                <AnimatePresence initial={false}>
                  {/* na ordem do quadro: do mais antigo para o atual (o período novo entra embaixo) */}
                  {[...ds.periods].reverse().map((p, k) => {
                    const i = ds.periods.length - 1 - k;
                    // a folha do deslize que limita o período: o que o fechou, ou o que o abriu (no atual)
                    const slipId = p.current ? (ds.periods[i + 1]?.slipId ?? null) : p.slipId;
                    const pct = ds.record > 0 ? (p.days / ds.record) * 100 : p.current ? 0 : 100;
                    const label = `${p.days} ${dias(p.days)}, de ${formatDayMonth(p.start)} a ${
                      p.current ? 'hoje' : formatDayMonth(p.end)
                    }${p.record ? ', recorde' : ''}${p.current ? ', agora' : ''}`;
                    const top = (
                      <span className="hb-per-top">
                        <span className="hb-pt">
                          <b>
                            {p.days} {dias(p.days)}
                          </b>
                          <span className="cap">{rangeText(p, today)}</span>
                        </span>
                        <span className="hb-pr">
                          {p.record && (
                            <Tag
                              key={`r${p.start}`}
                              pillar={pillar}
                              icon="trophy"
                              iconWeight="fill"
                              celebrate={recordMoved && p.current ? 'festa' : undefined}
                            >
                              recorde
                            </Tag>
                          )}
                          {p.current && <Tag pillar={pillar}>agora</Tag>}
                          {slipId && (
                            <span className="hb-chev" aria-hidden="true">
                              <Icon name="caret-right" weight="bold" />
                            </span>
                          )}
                        </span>
                      </span>
                    );
                    const bar = (
                      <PeriodBar
                        k={`hb:per:${habit.id}:${p.start}`}
                        pct={Math.min(100, pct)}
                        now={p.current}
                        delay={k * 30}
                        started={started}
                      />
                    );
                    return (
                      <m.li key={p.start} {...fadeUp}>
                        {slipId ? (
                          <button
                            type="button"
                            className={clsx('pk-reset hb-per pk-press', p.current && 'now')}
                            aria-label={label}
                            onClick={() => openSheet('deslize', { habito: habit.id, deslize: slipId })}
                          >
                            {top}
                            {bar}
                          </button>
                        ) : (
                          <div className={clsx('hb-per', p.current && 'now')} role="group" aria-label={label}>
                            {top}
                            {bar}
                          </div>
                        )}
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
            {caption && <p className="cap">{caption}</p>}
          </Card>
        </div>
      </m.section>

      <div className="hb-grow" />
      <m.div variants={fadeUpItem} className="hb-foot">
        <Button variant="secondary" wide onClick={() => openSheet('deslize', { habito: habit.id })}>
          Registrar deslize
        </Button>
        <p className="cap">Um deslize zera só a contagem atual.</p>
      </m.div>
    </m.div>
  );
}
