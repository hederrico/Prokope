// Progresso · medidas (habito-progresso.md): o peso (pontos do dia e a média de 7 dias), a cintura e os outros
// hábitos do tipo número, de qualquer pilar, na cor do pilar de cada um. A frase do título é sempre neutra
// ("desceu", "subiu" ou "ficou estável") e nunca muda de cor. O olho oculta os valores até sair da tela.
import { useState } from 'react';
import { m } from 'motion/react';
import { useNavigate } from 'react-router';
import { Button, Card, CardHeader, HabitList, HabitRow, SectionLabel } from '@/components/ui';
import { useOpenSheet } from '@/components/shell';
import { Icon } from '@/icons';
import { fadeUpItem, useCascadeOnce } from '@/motion';
import {
  WEIGHT_NEEDED,
  addDays,
  diffDays,
  formatNumber,
  useDomain,
  useHabitByRole,
  useMeasurements,
  weekdayLabel,
  useProfile,
  type ProgressView
} from '@/data';
import type { DayKey } from '@/types';
import { WaistChart } from './WaistChart';
import { WeightChart } from './WeightChart';
import { fmt1, pillarColor, shortMinutes } from './format';

export interface MeasuresViewProps {
  p: ProgressView;
  today: DayKey;
  onOpenDay: (day: DayKey) => void;
}


function amount(v: number, unit?: string): string {
  if (unit === 'min') return shortMinutes(v);
  return `${formatNumber(v)}${unit ? ` ${unit}` : ''}`;
}

function weeksText(n: number) {
  return n === 1 ? '1 semana' : `${n} semanas`;
}

export function MeasuresView({ p, today, onOpenDay }: MeasuresViewProps) {
  const cascade = useCascadeOnce('progresso:medidas');
  const navigate = useNavigate();
  const openSheet = useOpenSheet();
  const data = useDomain();
  const profile = useProfile();
  const weightHabit = useHabitByRole('weight');
  const waistHabit = useHabitByRole('waist');
  const { trendOnly } = useMeasurements('weight');
  const [hidden, setHidden] = useState(false);
  const ms = p.measures;
  if (!ms) return null;

  const range = p.range;
  const end = range.to > today ? today : range.to;
  const start = range.period === 'week' ? addDays(end, -21) : range.from;
  const trend = ms.weight;
  const points = trend.points.filter((pt) => pt.day >= start && pt.day <= end);
  const unit = weightHabit?.goal.unit ?? 'kg';
  const wPillar = pillarColor(weightHabit ? data.pillarById.get(weightHabit.pillarId) : null);

  // a frase do título: a do domínio no período atual, ou a da janela mostrada
  let delta: number | null = null;
  let weeks = 0;
  if (range.isCurrent && trend.ready && trend.delta !== null) {
    delta = trend.delta;
    weeks = trend.weeks;
  } else if (points.length >= WEIGHT_NEEDED) {
    const a = points[0];
    const b = points[points.length - 1];
    delta = Math.round((b.avg - a.avg) * 10) / 10;
    weeks = Math.max(1, Math.round(diffDays(b.day, a.day) / 7));
  }
  const show = (v: number) => (hidden ? '•••' : formatNumber(Math.abs(v)));
  const title =
    delta === null
      ? 'A média de 7 dias'
      : Math.abs(delta) < 0.2
        ? `A média ficou estável em ${weeksText(weeks)}`
        : `A média ${delta < 0 ? 'desceu' : 'subiu'} ${show(delta)} ${unit} em ${weeksText(weeks)}`;
  const sentence =
    delta === null
      ? 'Peso de cada dia e a média de 7 dias.'
      : Math.abs(delta) < 0.2
        ? `A média de 7 dias ficou estável em ${weeksText(weeks)}.`
        : `A média de 7 dias ${delta < 0 ? 'desceu' : 'subiu'} ${hidden ? '' : `${formatNumber(Math.abs(delta))} ${unit} `}em ${weeksText(weeks)}.`;
  const missing = Math.max(0, WEIGHT_NEEDED - trend.count);

  // cintura: as últimas medidas (até 4)
  const waist = ms.waist.slice(-4);
  const waistUnit = waistHabit?.goal.unit ?? 'cm';
  const wsPillar = pillarColor(waistHabit ? data.pillarById.get(waistHabit.pillarId) : null);
  let waistTitle = '';
  if (waist.length >= 2) {
    const d = Math.round((waist[waist.length - 1].value - waist[0].value) * 10) / 10;
    const wk = weeksText(Math.max(1, Math.round(diffDays(waist[waist.length - 1].day, waist[0].day) / 7)));
    waistTitle =
      Math.abs(d) < 0.2
        ? `Cintura estável em ${wk}`
        : `${hidden ? '•••' : formatNumber(Math.abs(d))} ${waistUnit} a ${d < 0 ? 'menos' : 'mais'} em ${wk}`;
  } else if (waist.length === 1) {
    waistTitle = `Primeira medida: ${hidden ? '•••' : fmt1(waist[0].value)} ${waistUnit}`;
  }
  const reviewDay = profile?.weeklyReview?.weekday;
  const waistSub =
    reviewDay !== undefined
      ? `Cintura em ${waistUnit} · medida ${reviewDay >= 5 ? 'no' : 'na'} ${weekdayLabel(reviewDay)}`
      : `Cintura em ${waistUnit}`;

  return (
    <m.div {...cascade}>
      <div className="pg-pad pg-stack">
        <m.div variants={fadeUpItem}>
          <Card padded pillar={wPillar}>
            <CardHeader
              title={title}
              subtitle={`Peso em ${unit} · média de 7 dias`}
              trailing={
                <button
                  type="button"
                  className="pk-reset pg-eye"
                  aria-pressed={hidden}
                  aria-label={hidden ? 'Mostrar os valores' : 'Ocultar os valores'}
                  onClick={() => setHidden((h) => !h)}
                >
                  <Icon name={hidden ? 'eye-slash' : 'eye'} weight="regular" />
                </button>
              }
            />
            {trend.count >= WEIGHT_NEEDED && points.length > 0 ? (
              <>
                <div style={{ margin: '16px 0 12px' }}>
                  <WeightChart
                    chartKey="pg:peso"
                    points={points}
                    from={start}
                    to={end}
                    today={today}
                    unit={unit}
                    trendOnly={trendOnly}
                    hidden={hidden}
                    sentence={sentence}
                    onOpenDay={onOpenDay}
                  />
                </div>
                <div className="pk-hmk" aria-hidden="true">
                  {!trendOnly && (
                    <span>
                      <i className="pg-kdot" />
                      Peso do dia
                    </span>
                  )}
                  <span>
                    <i className="pg-kline" />
                    Média de 7 dias
                  </span>
                </div>
              </>
            ) : (
              <p className="pg-wait-line">
                A tendência aparece com {WEIGHT_NEEDED} pesagens.{' '}
                {missing > 0 && `Falta${missing === 1 ? '' : 'm'} ${missing} ${missing === 1 ? 'pesagem' : 'pesagens'}.`}
              </p>
            )}
          </Card>
        </m.div>
        <m.div variants={fadeUpItem}>
          <Button variant="secondary" wide icon="plus" onClick={() => openSheet('peso')}>
            Registrar peso
          </Button>
        </m.div>
      </div>

      {waist.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-cintura">
          <SectionLabel id="pg-cintura" trailing={`últimas ${Math.min(4, waist.length)} semanas`}>
            {waistHabit?.name ?? 'Cintura'}
          </SectionLabel>
          <div className="pg-pad">
            <Card padded pillar={wsPillar}>
              <CardHeader title={waistTitle} subtitle={waistSub} />
              <div style={{ marginTop: 10 }}>
                <WaistChart chartKey="pg:cintura" points={waist} unit={waistUnit} label={waistTitle} hidden={hidden} />
              </div>
            </Card>
          </div>
        </m.section>
      )}

      {ms.numbers.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-outras">
          <SectionLabel id="pg-outras">Outras medidas</SectionLabel>
          <div className="pg-pad">
            <HabitList>
              {ms.numbers.map((n) => {
                const pil = data.pillarById.get(n.habit.pillarId);
                const g = n.habit.goal;
                const goalText = g.measuring || g.value === undefined ? 'só medindo' : `meta ${g.direction === 'atMost' ? 'até ' : ''}${amount(g.value, g.unit)}`;
                const sub = n.avg !== null ? `média de ${amount(n.avg, g.unit)} por dia · ${goalText}` : `sem registro no período · ${goalText}`;
                return (
                  <HabitRow
                    key={n.habit.id}
                    habit={{ name: n.habit.name, icon: n.habit.icon, pillar: pillarColor(pil) ?? 'accent' }}
                    subtitle={sub}
                    control={
                      <span className="pg-chevctl" aria-hidden="true">
                        <Icon name="caret-right" weight="bold" />
                      </span>
                    }
                    onOpen={() => navigate(`/progresso/habito/${encodeURIComponent(n.habit.id)}`)}
                  />
                );
              })}
            </HabitList>
          </div>
        </m.section>
      )}
      <div className="pg-spacer" />
    </m.div>
  );
}
