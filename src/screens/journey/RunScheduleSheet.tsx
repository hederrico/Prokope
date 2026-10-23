// Folha "Dias de treino" (plano do treino guiado, Treino feito e Fase desbloqueada): os dias com DayPicker e o
// horário com TimeValue. Grava com setRunSchedule no hábito; o Hoje dos dias escolhidos ganha a linha do treino.
import { useState } from 'react';
import { Sheet, showUndo } from '@/components/shell';
import { Button, DayPicker, TimeValue, type PillarColor } from '@/components/ui';
import { setRunSchedule } from '@/actions';
import type { Weekday } from '@/types';
import { formatTime } from '@/data';
import { scheduleLabel } from './shared';
import './journey.css';

export interface RunScheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: number[];
  time: string | null;
  perWeek: number;
  pillar?: PillarColor;
  /** o treino guiado (sem ele, o primeiro) */
  habitId?: string | null;
}

export function RunScheduleSheet({ open, onOpenChange, days, time, perWeek, pillar, habitId }: RunScheduleSheetProps) {
  const [draft, setDraft] = useState({ days, time: time ?? '07:10' });
  // ao abrir, o rascunho volta para o que está salvo
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft({ days, time: time ?? '07:10' });
  }
  const save = async () => {
    const chosen = { days: draft.days as Weekday[], time: draft.time };
    onOpenChange(false);
    const undo = await setRunSchedule(chosen, habitId ?? undefined);
    showUndo(
      { title: 'Dias de treino salvos', detail: scheduleLabel(chosen.days, chosen.time), icon: 'calendar-dots' },
      () => void undo(),
    );
  };
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Dias de treino"
      footer={
        <Button wide disabled={!draft.days.length} onClick={() => void save()}>
          Salvar
        </Button>
      }
    >
      <div className="jr-sheet">
        <p className="jr-sheet-p">
          {perWeek === 1 ? '1 treino' : `${perWeek} treinos`} por semana. Um dia de descanso entre eles ajuda o corpo a
          se recuperar.
        </p>
        <DayPicker
          value={draft.days}
          onChange={(v) => setDraft((d) => ({ ...d, days: v }))}
          pillar={pillar}
          label="Dias de treino"
        />
        <div className="jr-frow">
          <span>Horário</span>
          <TimeValue
            kind="time"
            value={draft.time}
            onChange={(v) => setDraft((d) => ({ ...d, time: v }))}
            label="Horário do treino"
            display={formatTime(draft.time)}
          />
        </div>
      </div>
    </Sheet>
  );
}
