// Hábito · corrigir um dia (?folha=corrigir&habito=:id&dia=2026-10-21): Feito, Parcial e Sem, com a data no título.
// Num hábito de horário: No horário, Após o horário (só quando é o que está anotado) e Sem registro.
// O estado atual já vem marcado. Escolher grava (setMark), segura 200 ms e fecha; o toast "Caminhada marcada na
// quarta" traz o Desfazer. A opção já marcada só fecha. Um segundo toque em 300 ms é ignorado. Dia passado não celebra.
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { animate } from 'motion/react';
import { PillarBubble, Radio, type PillarColor } from '@/components/ui';
import { Sheet, showUndo, type SheetScreenProps } from '@/components/shell';
import { Icon, type IconName } from '@/icons';
import { spring } from '@/motion';
import { setMark } from '@/actions';
import { capitalize, formatDayHeader, useDaySummary, useHabit, useHabitDay, useNow } from '@/data';
import { agree, article, goalText, onDay, partialText, relativeDay, shortOf } from './text';
import './habit.css';

// 'late': horário anotado depois da meta (só aparece como o estado atual; para mudar, outro horário na folha do registro)
type Choice = 'done' | 'partial' | 'late' | 'none';

export default function FixDaySheet({ params, close }: SheetScreenProps) {
  const { today } = useNow();
  const id = params.get('habito') ?? undefined;
  const raw = params.get('dia');
  const day = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
  const h = useHabit(id);
  const hd = useHabitDay(id, day);
  const summary = useDaySummary(day);
  const [busy, setBusy] = useState<Choice | null>(null);
  // o estado de antes da escolha (a gravação chega antes de a folha fechar)
  const [from, setFrom] = useState<Choice | null>(null);
  const lastTap = useRef(-Infinity);
  const radios = useRef(new Map<Choice, HTMLElement>());

  if (!h || !hd) {
    return (
      <Sheet title={formatDayHeader(day)}>
        <p className="cap">Este hábito não existe mais.</p>
      </Sheet>
    );
  }
  const habit = h.habit;
  const short = shortOf(habit);
  const pillar = (h.pillar?.color as PillarColor | undefined) ?? 'accent';
  const goal = hd.goal;
  const isTime = habit.type === 'time';
  // horário anotado depois da meta: não é "sem registro", é "após o horário"
  const late = isTime && !hd.mark?.skipped && hd.mark?.status !== 'done' && hd.mark?.status !== 'partial' && !!hd.mark?.time;
  const current: Choice =
    hd.mark?.skipped
      ? 'none'
      : hd.mark?.status === 'done'
        ? 'done'
        : hd.mark?.status === 'partial'
          ? 'partial'
          : late
            ? 'late'
            : 'none';
  const before = from ?? current;
  const selected = busy ?? current;
  const g = goalText(habit, goal);
  const part = partialText(goal);
  const showPartial = goal.partialMin !== undefined || current === 'partial';
  // dia dentro de uma pausa (do app ou do hábito): a linha fica mesmo depois de marcar feito, que tira só este
  // hábito da pausa naquele dia (a regra é do domínio)
  const habitPause = h.pause && h.pause.start <= day && day <= h.pause.end ? h.pause : null;
  const pause = hd.state === 'paused' ? (summary.pause ?? h.pause) : (summary.pause ?? habitPause);

  // no horário: "No horário", "Após o horário" (só quando é o que está anotado) e "Sem registro"; nunca "Sem acordar"
  const options: { key: Choice; icon: IconName; title: string; sub: string }[] = isTime
    ? [
        { key: 'done', icon: 'check-circle', title: 'No horário', sub: g ? `meta ${g}` : 'no horário' },
        ...(current === 'late'
          ? [{ key: 'late' as const, icon: 'clock' as const, title: 'Após o horário', sub: 'anotado depois da meta' }]
          : []),
        {
          key: 'none',
          icon: 'circle-dashed',
          title: 'Sem registro',
          sub: current === 'late' ? 'apaga o horário anotado' : 'nada anotado neste dia',
        },
      ]
    : [
        { key: 'done', icon: 'check-circle', title: 'Feito', sub: habit.description ?? g ?? `${short} ${agree(short, 'feito')}` },
        ...(showPartial
          ? [{ key: 'partial' as const, icon: 'circle-half' as const, title: 'Parcial', sub: part ?? 'conta meio dia' }]
          : []),
        { key: 'none', icon: 'circle-dashed', title: `Sem ${short}`, sub: 'sem registro' },
      ];

  const choose = async (key: Choice, at: number) => {
    if (at - lastTap.current < 300 || busy) return;
    lastTap.current = at;
    // "Após o horário" só existe como o estado atual: tocar nele só fecha
    if (key === current || key === 'late') {
      close();
      return;
    }
    setFrom(current);
    setBusy(key);
    const el = radios.current.get(key);
    if (el) void animate(el, { scale: [0.8, 1] }, spring.toque);
    // grava antes de fechar: o app pode ser fechado a qualquer momento
    const undo = await setMark(habit.id, day, key);
    await new Promise((r) => setTimeout(r, 200));
    close();
    const name = capitalize(short);
    const when = onDay(day, today);
    const title =
      key === 'done'
        ? isTime
          ? `${name} no horário ${when}`
          : `${name} ${agree(name, 'marcado')} ${when}`
        : key === 'partial'
          ? `${name} parcial ${when}`
          : `${name} ${agree(name, 'desmarcado')} ${when}`;
    window.setTimeout(() => {
      showUndo({ title, pillar, icon: key === 'none' ? 'arrow-counter-clockwise' : 'check' }, () => void undo());
    }, 240);
  };

  return (
    <Sheet title={formatDayHeader(day)} label={`${formatDayHeader(day)}, ${habit.name}`}>
      <div className="hb-fix">
        {pause && (
          <p className="hb-pauseline">
            <Icon name="pause-circle" weight="regular" />
            Dia pausado{pause.reason ? ` · ${pause.reason}` : ''}
          </p>
        )}
        <div className="hb-shab">
          <PillarBubble icon={habit.icon} pillar={pillar} size="sm" />
          <span>
            <b>{habit.name}</b>
            <span className="cap">
              {relativeDay(day, today)}
              {g ? ` · meta de ${g}` : ''}
            </span>
          </span>
        </div>
        <div className="pk-lg hb-opts" role="radiogroup" aria-label={`Como foi ${article(short)} ${short}`}>
          {options.map((o) => {
            const on = selected === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={on}
                className={clsx('pk-reset pk-li hb-opt')}
                onClick={(e) => void choose(o.key, e.timeStamp)}
              >
                <PillarBubble icon={o.icon} pillar={pillar} size="li" />
                <span>
                  <b>{o.title}</b>
                  <small>{before === o.key ? 'como está agora' : o.sub}</small>
                </span>
                <span
                  className="hb-radio"
                  ref={(el) => {
                    if (el) radios.current.set(o.key, el);
                  }}
                >
                  <Radio checked={on} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="hb-note">Escolher já salva, e dá para desfazer. A força do hábito e a semana se ajustam sozinhas.</p>
      </div>
    </Sheet>
  );
}
