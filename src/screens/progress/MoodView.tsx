// Progresso · humor (habito-progresso.md): o humor de cada dia no MonthCalendar (variant mood), as médias de humor
// e energia e o que os dados mostram. Cada dia leva a cor e o rostinho; dia sem check-in fica como trilho vazio.
// Tocar num dia passado ou de hoje abre "Progresso · um dia".
import { m } from 'motion/react';
import { Card, CardHeader, Face, HeatmapKey, SectionLabel, type FaceLevel } from '@/components/ui';
import { fadeUpItem, useCascadeOnce } from '@/motion';
import {
  MOOD_WORDS,
  addDays,
  monthName,
  parseDay,
  useDomain,
  weekStart,
  energyWord,
  moodWord,
  type ProgressView
} from '@/data';
import type { DayKey } from '@/types';
import { MonthCalendar, type CalCell } from '@/screens/habit/MonthCalendar';
import { CorrelationInsight } from './shared';
import { fmt1 } from './format';

export interface MoodViewProps {
  p: ProgressView;
  today: DayKey;
  selected: DayKey | null;
  onOpenDay: (day: DayKey) => void;
}

const level = (v: number) => Math.max(1, Math.min(5, Math.round(v))) as FaceLevel;

export function MoodView({ p, today, selected, onOpenDay }: MoodViewProps) {
  const cascade = useCascadeOnce('progresso:humor');
  const data = useDomain();
  const mood = p.mood;
  const range = p.range;
  if (!mood) return null;

  const byDay = new Map(mood.days.map((d) => [d.day, d]));
  const spansMonths = parseDay(range.from).month !== parseDay(range.to).month;
  const weeks: CalCell[][] = [];
  for (let w = weekStart(range.from); w <= range.to; w = addDays(w, 7)) {
    const row: CalCell[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(w, i);
      const info = byDay.get(day);
      const { date, month } = parseDay(day);
      const base = `${date} de ${monthName(month)}${day === today ? ', hoje' : ''}`;
      if (!info) {
        row.push({ day, date, state: 'e', label: '', tappable: false });
      } else if (info.future) {
        row.push({ day, date, state: 'f', label: `${base}, por vir`, tappable: false });
      } else {
        row.push({
          day,
          date,
          state: 'n',
          mood: info.mood,
          isToday: day === today,
          label: info.mood ? `${base}, humor ${MOOD_WORDS[level(info.mood) - 1]}` : `${base}, sem check-in`,
          tappable: true,
          monthTag: spansMonths && date === 1 ? monthName(month).slice(0, 3) : undefined,
        });
      }
    }
    weeks.push(row);
  }
  const past = mood.days.filter((d) => !d.future);
  const withCheckin = past.filter((d) => d.mood !== null).length;
  const count = `${withCheckin} ${withCheckin === 1 ? 'check-in' : 'check-ins'} em ${past.length} ${past.length === 1 ? 'dia' : 'dias'} · toque num dia para ver`;

  return (
    <m.div {...cascade}>
      <div className="pg-pad pg-stack">
        <m.div variants={fadeUpItem}>
          <Card padded className="mc-mood">
            <CardHeader title="Humor de cada dia" subtitle={count} />
            <MonthCalendar
              variant="mood"
              weeks={weeks}
              selected={selected}
              onSelect={onOpenDay}
              label="Humor de cada dia"
            />
            <div className="mc-legend" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((l) => (
                <div key={l}>
                  <span className={`mc-c l${l}`}>
                    <Face kind="mood" level={l as FaceLevel} selected />
                  </span>
                  {MOOD_WORDS[l - 1]}
                </div>
              ))}
            </div>
            <HeatmapKey
              className="mc-mood-key"
              items={[
                { state: 'none', label: 'Sem check-in' },
                { state: 'future', label: 'Por vir' },
                { state: 'today', label: 'Hoje' },
              ]}
            />
          </Card>
        </m.div>
        <m.div className="pg-two" variants={fadeUpItem}>
          <Card className="pg-avg">
            {mood.avgMood !== null && <Face kind="mood" level={level(mood.avgMood)} selected />}
            <span>
              <b>{mood.avgMood !== null ? fmt1(mood.avgMood) : '—'}</b>
              <span className="cap">humor médio</span>
            </span>
            <span className="pk-sr">
              {mood.avgMood !== null ? `Humor médio ${fmt1(mood.avgMood)}, ${moodWord(mood.avgMood)}` : ''}
            </span>
          </Card>
          <Card className="pg-avg">
            {mood.avgEnergy !== null && <Face kind="energy" level={level(mood.avgEnergy)} selected />}
            <span>
              <b>{mood.avgEnergy !== null ? fmt1(mood.avgEnergy) : '—'}</b>
              <span className="cap">energia média</span>
            </span>
            <span className="pk-sr">
              {mood.avgEnergy !== null ? `Energia média ${fmt1(mood.avgEnergy)}, ${energyWord(mood.avgEnergy)}` : ''}
            </span>
          </Card>
        </m.div>
      </div>
      {mood.insights.length > 0 && (
        <m.section variants={fadeUpItem} aria-labelledby="pg-humor-dados">
          <SectionLabel id="pg-humor-dados">O que os seus dados mostram</SectionLabel>
          <div className="pg-pad pg-stack">
            {mood.insights.map((ins) => {
              const h = data.habitById.get(ins.habitId);
              if (!h) return null;
              return <CorrelationInsight key={`${ins.habitId}:${ins.correlation.metric}`} insight={ins} habit={h} pillar="accent" />;
            })}
          </div>
        </m.section>
      )}
      <div className="pg-spacer" />
    </m.div>
  );
}
