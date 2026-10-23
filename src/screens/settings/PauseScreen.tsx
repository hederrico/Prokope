// Pausar: o app inteiro ou alguns hábitos, sempre com data de volta. Começa e Volta abrem o calendário em folha;
// "Pausar 10 dias" grava sem confirmar e o aviso traz Desfazer. Com uma pausa ativa ou marcada, a mesma rota mostra
// Pausar · em pausa, com a Volta para estender ou encurtar e "Encerrar a pausa" (ajustes-rotina-conta.md › Pausar).
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useSearchParams } from 'react-router';
import { NavBar, showUndo } from '@/components/shell';
import { Button, Chip, ChipRow, NumberFlow, SectionLabel, SegmentedControl } from '@/components/ui';
import { addDays, diffDays, formatDayMonth, formatDayShort, useHabits, usePause } from '@/data';
import { useNow } from '@/data/useDomain';
import { cancelPause, endPause, startPause, updatePause } from '@/actions';
import { Icon, type IconName } from '@/icons';
import { fadeUp, spring, tween } from '@/motion/tokens';
import type { DayKey, Pause, PauseReason } from '@/types';
import { byListOrder, joinList, longWeekdayMonth, shortWeekdayDate } from './habitText';
import { Foot, Row, ValueButton } from './parts';
import { DateSheet, PauseStrip } from './PauseParts';
import './settings.css';

const REASONS: { value: PauseReason; label: string; icon?: IconName }[] = [
  { value: 'vacation', label: 'Férias' },
  { value: 'sick', label: 'Doença', icon: 'thermometer-simple' },
  { value: 'travel', label: 'Viagem', icon: 'airplane-tilt' },
  { value: 'other', label: 'Outro' },
];

export default function PauseScreen() {
  const pause = usePause();
  const { today } = useNow();
  const current = pause.current;
  return (
    <div className="st-screen">
      <NavBar />
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={current ? `p-${current.id}` : 'form'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: tween.base }}
          exit={{ opacity: 0, transition: tween.exit }}
        >
          {current ? (
            <InPause pause={current} today={today} scheduled={pause.isScheduled} />
          ) : (
            <PauseForm today={today} />
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}

function PauseForm({ today }: { today: DayKey }) {
  const [search] = useSearchParams();
  const fromHabit = search.get('habito');
  const habits = useHabits('active');
  const [mode, setMode] = useState<'app' | 'some'>(fromHabit ? 'some' : 'app');
  const [picked, setPicked] = useState<string[]>(fromHabit ? [fromHabit] : []);
  const [start, setStart] = useState<DayKey>(today);
  const [back, setBack] = useState<DayKey>(addDays(today, 7));
  const [reason, setReason] = useState<PauseReason | null>(null);
  const [sheet, setSheet] = useState<'start' | 'back' | null>(null);
  const [busy, setBusy] = useState(false);

  const end = addDays(back, -1);
  const total = diffDays(end, start) + 1;
  const unique = byListOrder([...new Map(habits.map((h) => [h.habit.id, h])).values()]);
  // vindo de "Pausar este hábito" (?habito=): já marcado; um id que não está entre os ativos não conta
  const chosen = picked.filter((id) => unique.some((u) => u.habit.id === id));
  const disabled = busy || (mode === 'some' && chosen.length === 0);

  const go = async () => {
    if (disabled) return;
    setBusy(true);
    const undo = await startPause({ start, end, reason, habitIds: mode === 'some' ? chosen : null });
    const title =
      start > today
        ? `Pausa marcada · ${formatDayShort(start)} a ${formatDayShort(end)}`
        : `Pausa começou · até ${formatDayShort(end)}`;
    showUndo({ title, icon: 'pause' }, () => void undo());
  };

  return (
    <>
      <div className="st-pad st-phero">
        <h1 className="ttl2" tabIndex={-1}>
          Uma pausa também faz parte.
        </h1>
        <p className="lead">Durante a pausa, o Hoje fica em silêncio e nada fica pendente.</p>
      </div>
      <div className="st-pad" style={{ paddingTop: 8 }}>
        <SegmentedControl
          label="O que pausar"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'app', label: 'O app inteiro' },
            { value: 'some', label: 'Alguns hábitos' },
          ]}
        />
      </div>

      <AnimatePresence initial={false}>
        {mode === 'some' && (
          <m.div
            key="some"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: spring.calma }}
            exit={{ height: 0, opacity: 0, transition: tween.base }}
            style={{ overflow: 'hidden' }}
          >
            <SectionLabel trailing={chosen.length ? `${chosen.length} de ${unique.length}` : undefined}>
              Hábitos
            </SectionLabel>
            <m.div className="st-pad" {...fadeUp}>
              <ul className="pk-lg st-pause-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {unique.map(({ habit, pillar }) => {
                  const on = picked.includes(habit.id);
                  return (
                    <li key={habit.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        className="pk-reset pk-li st-row"
                        onClick={() => setPicked((p) => (on ? p.filter((x) => x !== habit.id) : [...p, habit.id]))}
                      >
                        <span aria-hidden="true" className="pk-bub li hued" data-hue={pillar?.color}>
                          <Icon name={habit.icon} />
                        </span>
                        <span className="st-row-t">
                          <b>{habit.name}</b>
                        </span>
                        <span className={`st-check${on ? ' on' : ''}`} aria-hidden="true">
                          <Icon name="check" weight="bold" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {chosen.length === 0 && (
                <p className="foot" style={{ color: 'var(--text-2)' }}>
                  Escolha pelo menos um hábito.
                </p>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <SectionLabel>Datas</SectionLabel>
      <div className="st-pad">
        <ul className="pk-lg" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li>
            <Row
              title="Começa"
              trailing={
                <ValueButton label={`Começa, ${longWeekdayMonth(start)}. Ajustável.`} onClick={() => setSheet('start')}>
                  {shortWeekdayDate(start)}
                </ValueButton>
              }
            />
          </li>
          <li>
            <Row
              title="Volta"
              trailing={
                <ValueButton label={`Volta, ${longWeekdayMonth(back)}. Ajustável.`} onClick={() => setSheet('back')}>
                  {shortWeekdayDate(back)}
                </ValueButton>
              }
            />
          </li>
          <li>
            <PauseStrip start={start} end={end} today={today} />
          </li>
        </ul>
      </div>

      <SectionLabel trailing="opcional">Motivo</SectionLabel>
      <div className="st-pad">
        <ChipRow className="st-chips" label="Motivo">
          {REASONS.map((r) => (
            <Chip
              key={r.value}
              selected={reason === r.value}
              icon={reason === r.value ? 'check' : r.icon}
              iconWeight={reason === r.value ? 'bold' : 'regular'}
              onPressedChange={(on) => setReason(on ? r.value : null)}
            >
              {r.label}
            </Chip>
          ))}
        </ChipRow>
      </div>
      <Foot icon="info">
        Dias pausados não contam na constância nem na força dos hábitos. Os dias sem ficam parados e seguem de onde
        estavam.
      </Foot>

      <div className="st-pad st-cta">
        <Button wide icon="pause" iconWeight="fill" disabled={disabled} onClick={() => void go()}>
          <span>
            Pausar <NumberFlow value={total} /> {total === 1 ? 'dia' : 'dias'}
          </span>
        </Button>
        <p className="cap">Dá para encerrar antes, aqui ou no Hoje.</p>
      </div>

      <DateSheet
        open={sheet === 'start'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Começa"
        value={start}
        min={today}
        today={today}
        range={{ start, end }}
        role="start"
        onPick={(d) => {
          setStart(d);
          // a volta acompanha: a pausa mantém a duração
          if (back <= d) setBack(addDays(d, Math.max(1, diffDays(back, start))));
        }}
      />
      <DateSheet
        open={sheet === 'back'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Volta"
        value={back}
        min={addDays(start, 1)}
        today={today}
        range={{ start, end }}
        role="back"
        onPick={setBack}
      />
    </>
  );
}

function InPause({ pause, today, scheduled }: { pause: Pause; today: DayKey; scheduled: boolean }) {
  const habits = useHabits('all');
  const [sheet, setSheet] = useState<'start' | 'back' | null>(null);
  const [busy, setBusy] = useState(false);
  const back = addDays(pause.end, 1);
  const reason = REASONS.find((r) => r.value === pause.reason)?.label;
  const names = pause.habitIds
    ? joinList(
        pause.habitIds.map((id) => habits.find((h) => h.habit.id === id)?.habit.name).filter((n): n is string => !!n),
      )
    : null;

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    if (scheduled) {
      const undo = await cancelPause(pause.id);
      showUndo({ title: 'Pausa cancelada', icon: 'pause' }, () => void undo());
    } else {
      const undo = await endPause(pause.id);
      showUndo({ title: 'Pausa encerrada', icon: 'play' }, () => void undo());
    }
  };

  const badge = scheduled ? 'Pausa marcada' : 'Em pausa';
  return (
    <>
      <div className="st-pad st-phero">
        <span className="st-badge">
          <Icon name="pause" weight="fill" />
          {reason ? `${badge} · ${reason}` : badge}
        </span>
        <h1 className="ttl2" tabIndex={-1}>
          {scheduled
            ? `De ${formatDayMonth(pause.start)} a ${formatDayMonth(pause.end)}.`
            : `Até ${longWeekdayMonth(pause.end)}.`}
        </h1>
        <p className="lead">
          {names
            ? `Em pausa: ${names}. O resto do dia segue normal.`
            : scheduled
              ? 'Até lá, o Hoje segue normal. Na pausa, nada fica pendente.'
              : 'Nada fica pendente. Na volta, tudo continua de onde parou.'}
        </p>
      </div>

      <SectionLabel>Sua pausa</SectionLabel>
      <div className="st-pad">
        <ul className="pk-lg" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <li>
            <PauseStrip start={pause.start} end={pause.end} today={today} inPause={!scheduled} />
          </li>
          {scheduled && (
            <li>
              <Row
                title="Começa"
                trailing={
                  <ValueButton
                    label={`Começa, ${longWeekdayMonth(pause.start)}. Ajustável.`}
                    onClick={() => setSheet('start')}
                  >
                    {shortWeekdayDate(pause.start)}
                  </ValueButton>
                }
              />
            </li>
          )}
          <li>
            <Row
              title="Volta"
              subtitle="Mude para estender ou encurtar"
              trailing={
                <ValueButton label={`Volta, ${longWeekdayMonth(back)}. Ajustável.`} onClick={() => setSheet('back')}>
                  {shortWeekdayDate(back)}
                </ValueButton>
              }
            />
          </li>
        </ul>
      </div>
      <Foot icon="info">
        {scheduled
          ? `A pausa começa ${formatDayShort(pause.start)}, na virada do dia. Até lá, dá para mudar ou cancelar aqui.`
          : `Os contadores de dias sem estão parados e voltam a contar no dia ${Number(back.slice(8))}, de onde pararam.`}
      </Foot>

      <div className="st-pad st-cta">
        <Button wide variant="secondary" disabled={busy} onClick={() => void finish()}>
          {scheduled ? 'Cancelar a pausa' : 'Encerrar a pausa'}
        </Button>
        <p className="cap">
          {scheduled
            ? 'Cancelar não muda nada no seu dia.'
            : 'Hoje passa a contar só o que ainda não passou do horário.'}
        </p>
      </div>

      <DateSheet
        open={sheet === 'back'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Volta"
        value={back}
        min={addDays(pause.start > today ? pause.start : today, 1)}
        today={today}
        range={{ start: pause.start, end: pause.end }}
        role="back"
        onPick={(d) => {
          void updatePause(pause.id, { end: addDays(d, -1) }).then((undo) =>
            showUndo({ title: `Pausa até ${formatDayShort(addDays(d, -1))}`, icon: 'pause' }, () => void undo()),
          );
        }}
      />
      <DateSheet
        open={sheet === 'start'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Começa"
        value={pause.start}
        min={today}
        today={today}
        range={{ start: pause.start, end: pause.end }}
        role="start"
        onPick={(d) => {
          const len = diffDays(pause.end, pause.start);
          void updatePause(pause.id, { start: d, end: addDays(d, len) });
        }}
      />
    </>
  );
}
