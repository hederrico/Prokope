// Progresso · um dia (?folha=dia&dia=2026-10-21): o resumo do dia inteiro, só leitura. O humor e a energia,
// as 3 coisas boas, os hábitos do dia e os contadores com registro. "Editar este dia" leva ao Hoje daquela data.
// Num dia sem check-in, os rostinhos dão lugar a "Sem check-in neste dia"; num dia pausado, entra a linha da pausa.
import { useNavigate } from 'react-router';
import { Button, Face, type FaceLevel } from '@/components/ui';
import { Sheet, useOpenSheet, type SheetScreenProps } from '@/components/shell';
import { Icon } from '@/icons';
import {
  ENERGY_WORDS,
  MOOD_WORDS,
  formatDayHeader,
  formatNumber,
  formatVolume,
  useDaySummary,
  useNow,
} from '@/data';
import './progress.css';

const lv = (v: number) => Math.max(1, Math.min(5, Math.round(v))) as FaceLevel;

function amount(total: number, unit?: string) {
  if (unit === 'ml') return formatVolume(total);
  return `${formatNumber(total)}${unit ? ` ${unit}` : ''}`;
}

export default function DaySheet({ params }: SheetScreenProps) {
  const { today } = useNow();
  const raw = params.get('dia');
  const day = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const s = useDaySummary(day);
  const navigate = useNavigate();
  const openSheet = useOpenSheet();
  const ci = s.checkin;
  const hasFaces = !!ci && ci.mood > 0 && ci.energy > 0;

  const numbers: { k: string; label: string; value: string }[] = [];
  if (s.count.total > 0)
    numbers.push({
      k: 'habitos',
      label: 'Hábitos',
      value: `${s.count.done} de ${s.count.total}`,
    });
  for (const c of s.counters) {
    if (c.total <= 0) continue;
    const v = amount(c.total, c.habit.goal.unit);
    numbers.push({ k: c.habit.id, label: c.habit.name, value: v });
  }
  const shown = numbers.slice(0, 3);

  const edit = () => {
    const path = day === today ? '/hoje' : `/hoje?dia=${day}`;
    void navigate(path, { replace: true });
  };

  return (
    <Sheet
      title={formatDayHeader(day)}
      footer={
        <Button variant="secondary" wide icon="pencil-simple" onClick={edit}>
          Editar este dia
        </Button>
      }
    >
      <div className="pg-day">
        {s.pause && (
          <p className="pg-pauseline">
            <Icon name="pause-circle" weight="regular" />
            Dia pausado{s.pause.reason ? ` · ${s.pause.reason}` : ''}
          </p>
        )}
        {hasFaces ? (
          <div className="pg-two">
            <div className="pg-fb">
              <Face kind="mood" level={lv(ci!.mood)} selected />
              <span>
                <b>{MOOD_WORDS[lv(ci!.mood) - 1]}</b>
                <small>humor</small>
              </span>
            </div>
            <div className="pg-fb">
              <Face kind="energy" level={lv(ci!.energy)} selected />
              <span>
                <b>{ENERGY_WORDS[lv(ci!.energy) - 1]}</b>
                <small>energia</small>
              </span>
            </div>
          </div>
        ) : (
          <div className="pg-nockin">
            <span>Sem check-in neste dia</span>
            <Button variant="ghost" size="sm" onClick={() => openSheet('checkin', { dia: day }, { replace: true })}>
              Fazer o check-in deste dia
            </Button>
          </div>
        )}
        {ci && ci.good?.filter(Boolean).length > 0 && (
          <div>
            <span className="pg-flabel">
              {ci.good.filter(Boolean).length === 1 ? '1 coisa boa' : `${ci.good.filter(Boolean).length} coisas boas`}
            </span>
            <ul className="pg-good">
              {ci.good.filter(Boolean).map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}
        {shown.length > 0 && (
          <dl className="pg-ds">
            {shown.map((n) => (
              <div key={n.k}>
                <dt>{n.label}</dt>
                <dd>{n.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Sheet>
  );
}
