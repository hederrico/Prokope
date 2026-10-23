// Revisão passada (jornada.md › Revisão passada), em /jornada/revisoes/:semana e /progresso/revisoes/:semana:
// os passos da revisão um abaixo do outro, em texto, sem campos e sem botões. Só leitura.
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { NavBar } from '@/components/shell';
import { Card, PillarBubble, Ring, SectionLabel, WeekDots, pillarAttrs } from '@/components/ui';
import type { IconName } from '@/icons';
import {
  addDays,
  capitalize,
  formatDayLong,
  formatDayShort,
  formatNumber,
  formatPercent,
  formatRange,
  useHabits,
  useJourney,
  useMeasurements,
  useReview,
  weekStart,
  type ReviewLine,
} from '@/data';
import type { Habit, Pillar } from '@/types';
import { lineDots, splitLine } from '@/screens/review/lines';
import { phaseTitle } from './shared';
import './journey.css';
import '@/screens/review/review.css';

const WORKED: Record<string, string> = { yes: 'Sim', partly: 'Em parte', no: 'Não' };

export default function PastReviewScreen() {
  const { semana = '' } = useParams();
  const rv = useReview(semana || undefined);
  const j = useJourney();
  const habits = useHabits('all');
  const waists = useMeasurements('waist');
  const byId = useMemo(() => {
    const map = new Map<string, { habit: Habit; pillar: Pillar | null }>();
    for (const h of habits) map.set(h.habit.id, { habit: h.habit, pillar: h.pillar });
    return map;
  }, [habits]);

  if (!rv) return <NavBar />;
  const r = rv.review;
  const s = rv.summary;
  const reviewDay = rv.window.day;
  const phaseNumber = r?.phase ?? s.phase;
  const phase = j.phases.find((p) => p.number === phaseNumber);
  const endOfPhase = r?.endOfPhase ?? s.endOfPhase;
  let context = '';
  if (endOfPhase && phaseNumber) context = `fim da fase ${phaseNumber}`;
  else if (phaseNumber && phase?.start)
    context = `semana ${Math.floor((Date.parse(rv.week) - Date.parse(weekStart(phase.start))) / 604_800_000) + 1} da fase ${phaseNumber}`;
  const ratio = r?.constancy ?? s.constancy;
  // o que foi guardado no fechamento; sem isso, o resumo calculado da semana
  const savedHighlights = r?.highlights?.length ? r.highlights : null;
  const savedGentle = r?.gentle?.length ? r.gentle : null;
  const waist = r?.waist ?? waists.list.find((x) => x.day >= rv.week && x.day <= addDays(rv.week, 6))?.value ?? null;
  const together = r?.together ?? null;
  const togetherHabit = together ? byId.get(together.habitId)?.habit : null;
  const decision = r?.decision ?? null;
  const nextPhase = phaseNumber ? j.phases.find((p) => p.number === phaseNumber + 1) : null;

  return (
    <>
      <NavBar />
      <div className="jr-pad jr-pr-head">
        <span className="eyebrow" style={{ color: 'var(--accent-ink)' }}>
          Revisão da semana
        </span>
        <h1 className="ttl2 jr-title" tabIndex={-1}>
          {capitalize(formatDayLong(reviewDay))}
        </h1>
        <p className="sub">
          {formatRange(rv.week, addDays(rv.week, 6))}
          {context ? ` · ${context}` : ''}
        </p>
        {ratio != null && (
          <div className="jr-pr-ring">
            <Ring size={72} stroke={7} value={ratio} color="var(--accent-mark)" track="var(--accent-wash)" label={`${formatPercent(ratio)} na semana`}>
              <span className="disp rv-num">{formatPercent(ratio)}</span>
            </Ring>
            <p>de constância na semana{r?.status !== 'done' ? ', até agora' : ''}.</p>
          </div>
        )}
      </div>

      <SectionLabel>O que deu certo</SectionLabel>
      <div className="jr-pad">
        {savedHighlights ? (
          <Card className="jr-pr-text">
            <ul className="rv-cmp">
              {savedHighlights.map((t) => (
                <li key={t} className="rv-hr" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                  <span>
                    <b>{t}</b>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : s.highlights.length ? (
          <Card>
            <ul className="rv-cmp">
              {s.highlights.map((l) => (
                <li key={l.habitId}>
                  <Line l={l} info={byId.get(l.habitId)} />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <div className="jr-pr-text">
            <p>Uma semana de recomeço. Ela também conta.</p>
          </div>
        )}
      </div>

      {(savedGentle || s.gentle) && (
        <>
          <SectionLabel>Para olhar com carinho</SectionLabel>
          <div className="jr-pad">
            <div className="jr-pr-text">
              <p>{savedGentle ? savedGentle[0] : `${s.gentle!.text}.`}</p>
            </div>
          </div>
        </>
      )}

      {s.previousTweak && (
        <>
          <SectionLabel>O ajuste funcionou?</SectionLabel>
          <div className="jr-pad">
            <div className="jr-pr-text">
              <p>“{s.previousTweak.text}”</p>
              <span className="cap">{r?.tweakWorked ? WORKED[r.tweakWorked] : 'Sem resposta'}</span>
            </div>
          </div>
        </>
      )}

      {(r?.tweak || waist != null || together) && (
        <>
          <SectionLabel>Para a semana seguinte</SectionLabel>
          <div className="jr-pad">
            <div className="jr-pr-text" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {r?.tweak && (
                <div>
                  <span className="cap" style={{ marginTop: 0 }}>
                    Ajuste
                  </span>
                  <p>{r.tweak}</p>
                </div>
              )}
              {waist != null && (
                <div>
                  <span className="cap" style={{ marginTop: 0 }}>
                    Cintura
                  </span>
                  <p>{formatNumber(waist)} cm</p>
                </div>
              )}
              {together && (
                <div>
                  <span className="cap" style={{ marginTop: 0 }}>
                    {togetherHabit?.name ?? 'Programa a dois'}
                  </span>
                  <p>
                    {capitalize(formatDayLong(together.day))}
                    {together.note ? ` · ${together.note}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {decision && phase && (
        <>
          <SectionLabel>A fase</SectionLabel>
          <div className="jr-pad">
            <div className="jr-pr-text">
              <p>
                {decision === 'advance'
                  ? nextPhase
                    ? `Começou a ${phaseTitle(nextPhase)}${nextPhase.start ? ` em ${formatDayShort(nextPhase.start)}` : ''}.`
                    : 'Seguiu para a próxima fase.'
                  : `Ficou mais uma semana na ${phaseTitle(phase)}.`}
              </p>
            </div>
          </div>
        </>
      )}
      <p className="foot">Só leitura. O que foi registrado nesta semana continua no Progresso.</p>
      <div style={{ height: 24 }} />
    </>
  );
}

function Line({ l, info }: { l: ReviewLine; info: { habit: Habit; pillar: Pillar | null } | undefined }) {
  const { title, sub } = splitLine(l, info?.habit);
  const dots = lineDots(l);
  const attrs = pillarAttrs(info?.pillar?.color);
  return (
    <div className={['rv-hr', attrs.className].filter(Boolean).join(' ')} data-pillar={attrs['data-pillar']} data-hue={attrs['data-hue']}>
      <PillarBubble icon={(info?.habit.icon ?? 'check') as IconName} pillar={info?.pillar?.color} />
      <span>
        <b>{title}</b>
        {sub && (
          <small>
            <WeekDots total={dots.total} done={dots.on} />
            {sub}
          </small>
        )}
      </span>
    </div>
  );
}
