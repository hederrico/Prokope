// Folha do peso (?folha=peso): registros.md › Registrar peso; quadro: f-registros.js › 7.
// Sobe com o teclado decimal. O campo aceita vírgula e ponto (uma casa), de 20 a 300 kg; o botão repete o valor,
// grava (logMeasurement) e fecha. A última pesagem fica de referência, sem comparação colorida. Com "Mostrar só a
// tendência" (Ajustes › Aparência › Privacidade), a folha não mostra o número de outros dias.
import { useRef, useState } from 'react';
import { logMeasurement } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button } from '@/components/ui';
import { formatNumber, formatRelativeDay, useHabitByRole, useMeasurements, weekdayName } from '@/data';
import { Icon } from '@/icons';
import { blurActive, closeThenUndo, keepFocus } from './feedback';
import { cleanDecimal, parseDecimal, validWeight } from './lib';
import { DayNote, SheetTitle } from './parts';
import { useHabitPillar, useSheetDay } from './hooks';

export default function WeightSheet({ params, close }: SheetScreenProps) {
  const sd = useSheetDay(params);
  const { day, today } = sd;
  const habit = useHabitByRole('weight');
  const pillar = useHabitPillar(habit?.id);
  const m = useMeasurements('weight');
  const inputRef = useRef<HTMLInputElement>(null);
  const saving = useRef(false);
  // uma segunda pesagem no mesmo dia substitui a primeira: a folha abre com o valor de hoje
  const [text, setText] = useState(() => {
    const v = day === today ? m.today : (m.list.find((x) => x.day === day)?.value ?? null);
    return v !== null ? formatNumber(v, 1) : '';
  });

  const last = m.list.filter((x) => x.day < day).sort((a, b) => (a.day < b.day ? 1 : -1))[0] ?? null;
  const value = parseDecimal(text);
  const ok = validWeight(value);
  const shown = ok ? formatNumber(value, 1) : '';
  const hide = m.trendOnly;
  const lastText = last
    ? hide
      ? `${sd.isPast ? 'Pesagem anterior' : 'Última pesagem'}: ${formatRelativeDay(last.day, today)}`
      : `${sd.isPast ? 'Pesagem anterior' : 'Última pesagem'}: ${formatRelativeDay(last.day, today)}, ${formatNumber(last.value, 1)} kg`
    : 'Primeira pesagem';
  // "Confira o número" só depois de um número que já não vai dar certo (8 ainda pode virar 83,6)
  const wrong = text !== '' && !text.endsWith(',') && !ok && ((value ?? 0) > 300 || text.length >= 3);

  async function save() {
    if (!ok || saving.current) return;
    saving.current = true;
    blurActive();
    const undo = await logMeasurement('weight', day, value);
    closeThenUndo(close, { title: 'Peso registrado', detail: sd.label ?? undefined, pillar, icon: 'check' }, undo);
  }

  const title = sd.isPast ? `Peso de ${weekdayName(day)}` : 'Peso de hoje';

  return (
    <Sheet
      title={
        <SheetTitle icon={habit?.icon ?? 'scales'} pillar={pillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      keyboardAware
      initialFocus={inputRef}
      footer={
        <Button wide aria-disabled={!ok} onPointerDown={keepFocus} onClick={() => void save()}>
          {ok ? (
            hide ? (
              'Salvar peso'
            ) : (
              <>
                Salvar <span className="num">{shown} kg</span>
              </>
            )
          ) : (
            'Digite o peso'
          )}
        </Button>
      }
    >
      <div className="rg-stack">
        <DayNote label={sd.label} />
        <p className="rg-foot" style={{ color: 'var(--text-2)' }}>
          <Icon name="sun-horizon" weight="regular" />
          Melhor de manhã, antes do café.
        </p>
        <div className="rg-wbox" onClick={() => inputRef.current?.focus()}>
          <span className="rg-big">
            <span className="rg-auto" data-value={text || (hide || !last ? '0,0' : formatNumber(last.value, 1))}>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                size={1}
                enterKeyHint="done"
                autoComplete="off"
                value={text}
                placeholder={hide || !last ? '0,0' : formatNumber(last.value, 1)}
                aria-label={`Peso de hoje, em quilos.${last && !hide ? ` Última pesagem: ${formatRelativeDay(last.day, today)}, ${formatNumber(last.value, 1)}.` : ''}`}
                aria-describedby="rg-weight-help"
                onChange={(e) => setText(cleanDecimal(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void save();
                  }
                }}
              />
            </span>
            <small aria-hidden="true">kg</small>
          </span>
        </div>
        <p id="rg-weight-help" className="rg-foot c" style={wrong ? { color: 'var(--text-2)' } : undefined}>
          {wrong ? (
            <>
              <Icon name="info" weight="regular" />
              Confira o número
            </>
          ) : (
            <>
              <Icon name="clock-counter-clockwise" weight="regular" />
              <span className="num">{lastText}</span>
            </>
          )}
        </p>
      </div>
    </Sheet>
  );
}
