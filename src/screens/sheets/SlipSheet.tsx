// Folha do deslize (?folha=deslize&habito=:id, sobre a tela do Hábito): registros.md › Registrar deslize;
// quadro: f-registros.js › 6. Tom gentil: mostra o que muda (atual 12 → 0, total 33 → 32) e o que fica guardado
// (o recorde), com botão neutro. Sem vibração, sem som e sem cor de alerta. Os números ficam parados (é prévia).
// Com &deslize=:id, edita um deslize do histórico: muda o dia (editSlip) ou apaga (deleteSlip), sempre com Desfazer.
// Com &dia=AAAA-MM-DD, registra o deslize num dia que passou.
import { useRef, useState } from 'react';
import { deleteSlip, editSlip, logSlip } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, ListGroup, PillarBubble, TimeValue, type PillarColor } from '@/components/ui';
import { formatDayCompact, formatNumber, plural, useDaysSince, useHabit, type DaysSince } from '@/data';
import { Icon } from '@/icons';
import type { DayKey, Habit } from '@/types';
import { closeThenUndo } from './feedback';
import { useSheetDay, type SheetDay } from './hooks';
import { DayNote, Painted, SheetTitle } from './parts';

function Change({ from, to }: { from: number; to: number }) {
  if (from === to) return <span className="v">{formatNumber(from, 0)}</span>;
  return (
    <span className="v">
      <span className="was">{formatNumber(from, 0)}</span>
      <Icon name="arrow-right" weight="bold" />
      {formatNumber(to, 0)}
    </span>
  );
}

export default function SlipSheet({ params, close }: SheetScreenProps) {
  const id = params.get('habito') ?? undefined;
  const slipId = params.get('deslize');
  const view = useHabit(id);
  const ds = useDaysSince(id);
  const sd = useSheetDay(params);

  if (!view || !ds) {
    return (
      <Sheet title="Registrar um deslize?">
        <p className="rg-empty">Este hábito não foi encontrado.</p>
      </Sheet>
    );
  }
  const pillar = (view.pillar?.color ?? undefined) as PillarColor | undefined;
  if (slipId) return <EditSlip habit={view.habit} pillar={pillar} ds={ds} slipId={slipId} close={close} sd={sd} />;
  return <NewSlip habit={view.habit} pillar={pillar} ds={ds} close={close} sd={sd} />;
}

interface Props {
  habit: Habit;
  pillar: PillarColor | undefined;
  ds: DaysSince;
  close: () => void;
  sd: SheetDay;
}

function NewSlip({ habit, pillar, ds, close, sd }: Props) {
  const saving = useRef(false);
  const title = 'Registrar um deslize?';
  const what = (habit.shortName ?? habit.name).toLocaleLowerCase('pt-BR');
  const after = ds.ifSlipToday;
  const record = sd.isPast ? ds.record : after.record;
  const days = plural(record, 'dia', 'dias');
  const kept = record > 0 ? `O recorde de ${days} continua guardado.` : '';
  const lead = sd.isPast
    ? `Tudo bem, acontece. O deslize entra na contagem de dias sem ${what}` +
      (record > 0 ? `, e o seu recorde de ${days} continua guardado.` : '.')
    : `Tudo bem, acontece. A contagem de dias sem ${what} recomeça amanhã` +
      (record > 0 ? `, e o seu recorde de ${days} continua guardado.` : '.');

  async function save() {
    if (saving.current) return;
    saving.current = true;
    const undo = await logSlip(habit.id, sd.isPast ? { day: sd.day } : {});
    closeThenUndo(close, { title: 'Deslize registrado.', detail: kept || undefined, pillar }, undo);
  }

  const spoken = sd.isPast
    ? `Registrar deslize em ${sd.label}. ${kept}`
    : `Registrar deslize. A contagem atual vai de ${ds.current} para ${after.current}. ${kept}`;

  return (
    <Sheet
      title={
        <SheetTitle icon={habit.icon} pillar={pillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      footer={
        <Button variant="secondary" wide aria-label={spoken.trim()} onClick={() => void save()}>
          Registrar deslize
        </Button>
      }
    >
      <Painted pillar={pillar} className="rg-stack">
        <DayNote label={sd.label} />
        <p className="lead">{lead}</p>
        {!sd.isPast && (
          <div className="pk-stats rg-stats">
            <div className="pk-stat">
              <span className="k">atual</span>
              <Change from={ds.current} to={after.current} />
            </div>
            <div className="pk-stat">
              <span className="k">
                <Icon name="lock-simple" weight="regular" />
                recorde
              </span>
              <Change from={ds.record} to={after.record} />
            </div>
            <div className="pk-stat">
              <span className="k">total</span>
              <Change from={ds.total} to={after.total} />
            </div>
          </div>
        )}
      </Painted>
    </Sheet>
  );
}

function EditSlip({ habit, pillar, ds, close, sd, slipId }: Props & { slipId: string }) {
  const period = ds.periods.find((p) => p.slipId === slipId);
  const [day, setDay] = useState<DayKey | undefined>(() => period?.slipDay ?? undefined);
  const busy = useRef(false);
  const title = 'Editar deslize';

  if (!period?.slipDay || !day) {
    return (
      <Sheet title={title}>
        <p className="rg-empty">Este deslize não foi encontrado.</p>
      </Sheet>
    );
  }
  const original = period.slipDay;
  const taken = day !== original && ds.periods.some((p) => p.slipDay === day);
  const changed = day !== original && !taken;

  async function move() {
    if (!changed || busy.current || !day) return;
    busy.current = true;
    const undo = await editSlip(slipId, { day });
    closeThenUndo(close, { title: `Deslize movido para ${formatDayCompact(day)}`, pillar }, undo);
  }

  async function remove() {
    if (busy.current) return;
    busy.current = true;
    const undo = await deleteSlip(slipId);
    closeThenUndo(close, { title: 'Deslize apagado', detail: formatDayCompact(original), pillar }, undo);
  }

  return (
    <Sheet
      title={
        <SheetTitle icon={habit.icon} pillar={pillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      footer={
        <div style={{ display: 'grid', gap: 4 }}>
          <Button wide aria-disabled={!changed} onClick={() => void move()}>
            {changed ? `Mudar para ${formatDayCompact(day)}` : 'Salvar'}
          </Button>
          <Button variant="ghost" wide onClick={() => void remove()}>
            Apagar este deslize
          </Button>
        </div>
      }
    >
      <Painted pillar={pillar} className="rg-stack">
        <ListGroup className="rg-lg">
          <div className="rg-li">
            <PillarBubble icon="calendar-blank" pillar={pillar} size="li" />
            <b aria-hidden="true">Dia do deslize</b>
            <TimeValue
              kind="date"
              raised
              value={day}
              min={habit.startDay ?? undefined}
              max={sd.today}
              onChange={(v) => v <= sd.today && setDay(v as DayKey)}
              label={`Dia do deslize, ${formatDayCompact(day)}. Alterar dia`}
            />
          </div>
        </ListGroup>
        <p className="rg-foot" style={taken ? { color: 'var(--text-2)' } : undefined}>
          <Icon name="info" weight="regular" />
          {taken ? 'Já há um deslize neste dia.' : 'A contagem de dias sem se ajusta ao dia escolhido.'}
        </p>
      </Painted>
    </Sheet>
  );
}
