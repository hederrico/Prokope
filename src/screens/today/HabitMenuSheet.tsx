// Menu do hábito (telas/estados.md › Menu do hábito; quadro "Menu do hábito"): uma folha baixa com o que muda
// hoje (Registrar outro horário, Hoje não se aplica) e o que leva a outra tela (Ver hábito, Editar hábito).
// Os de sim ou não, os contadores e os limites não têm "Registrar outro horário"; os "dias sem" só têm Ver e Editar.
import { useLocation, useNavigate } from 'react-router';
import { skipToday, unskipToday } from '@/actions';
import {
  Sheet,
  habitPath,
  showUndo,
  useCurrentTab,
  useSheetNavigation,
  type SheetScreenProps,
} from '@/components/shell';
import { ListGroup, ListItem, PillarBubble, type PillarColor } from '@/components/ui';
import {
  formatAmount,
  formatTime,
  formatTimePadded,
  isDoneLike,
  mealWord,
  useHabit,
  useHabitDay,
  useNow,
  weekdayName,
} from '@/data';
import { toastName } from './useTodayActions';
import './today.css';

const TIME_SHEET_ROLES = new Set(['wake', 'bed']);

export default function HabitMenuSheet({ params, close }: SheetScreenProps) {
  const id = params.get('habito') ?? undefined;
  const dia = params.get('dia');
  const { today } = useNow();
  const day = dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && dia < today ? dia : today;
  const isToday = day === today;
  const view = useHabit(id);
  const hd = useHabitDay(id, day);
  const navigate = useNavigate();
  const tab = useCurrentTab();
  const { pathname } = useLocation();
  const { open } = useSheetNavigation();

  if (!view || !hd) {
    return <Sheet title="Hábito">{null}</Sheet>;
  }
  const { habit, pillar } = view;
  const color = (pillar?.color as PillarColor | undefined) ?? 'accent';
  const when = isToday ? 'hoje' : `na ${weekdayName(day)}`;
  const skipped = hd.state === 'skipped';

  // "Mente · meta 6h50 · hoje às 06h52"
  const goal =
    hd.goal.time !== undefined
      ? `meta ${formatTime(hd.goal.time)}`
      : habit.type === 'counter' && hd.goal.value !== undefined
        ? `meta ${formatAmount(hd.goal.value, hd.goal.unit)}`
        : habit.type === 'weekly' && hd.goal.perWeek
          ? `${hd.goal.perWeek} por semana`
          : hd.goal.perWeek
            ? `meta ${hd.goal.perWeek} na semana`
            : null;
  const record = skipped
    ? `não conta ${isToday ? 'hoje' : 'neste dia'}`
    : hd.mark?.time && hd.registered
      ? `${when} às ${formatTimePadded(hd.mark.time)}`
      : hd.mark?.rating
        ? `${when}: ${hd.mark.rating} · ${mealWord(hd.mark.rating)}`
        : isDoneLike(hd.state)
          ? `feito ${when}`
          : null;
  const detail = [pillar?.name, goal, record].filter(Boolean).join(' · ');

  const onHabitScreen = new RegExp(`/habitos?/${encodeURIComponent(habit.id)}/?$`).test(pathname);
  const canTime = habit.type === 'time' && !!habit.role && TIME_SHEET_ROLES.has(habit.role);
  const canSkip = habit.type !== 'daysSince' && habit.type !== 'budget';

  const toggleSkip = async () => {
    close();
    if (skipped) {
      await unskipToday(habit.id, day);
      return;
    }
    const undo = await skipToday(habit.id, day);
    // o menu fecha em base; depois entra o toast
    window.setTimeout(
      () =>
        showUndo(
          {
            title: `${toastName({ habit })} não conta ${isToday ? 'hoje' : `na ${weekdayName(day)}`}`,
            pillar: color,
            icon: 'calendar-minus',
          },
          () => void undo(),
        ),
      240,
    );
  };

  return (
    <Sheet
      label={`${habit.name}, opções`}
      title={
        <span className="td-mh">
          <PillarBubble icon={habit.icon} pillar={color} />
          <span>
            <b>{habit.name}</b>
            {detail && <small>{detail}</small>}
          </span>
        </span>
      }
    >
      <div className="td-menu">
        {(canTime || canSkip) && (
          <ListGroup label="Hoje">
            {canTime && (
              <ListItem
                icon="clock-counter-clockwise"
                title="Registrar outro horário"
                subtitle="Abre a roda de horário"
                onClick={() => open('acordar', {}, { replace: true })}
              />
            )}
            {canSkip && (
              <ListItem
                icon={skipped ? 'arrow-counter-clockwise' : 'calendar-minus'}
                title={
                  skipped
                    ? `Voltar a contar ${isToday ? 'hoje' : 'neste dia'}`
                    : isToday
                      ? 'Hoje não se aplica'
                      : 'Não se aplica neste dia'
                }
                subtitle={skipped ? 'O dia volta para a conta' : 'O dia sai da conta, como uma pausa de um dia'}
                chevron={false}
                onClick={() => void toggleSkip()}
              />
            )}
          </ListGroup>
        )}
        <ListGroup label="Hábito">
          {/* em cima da própria tela do hábito, "Ver hábito" não leva a lugar nenhum */}
          {!onHabitScreen && (
            <ListItem
              icon="eye"
              title="Ver hábito"
              onClick={() => void navigate(habitPath(habit.id, tab), { replace: true })}
            />
          )}
          <ListItem
            icon="pencil-simple"
            title="Editar hábito"
            onClick={() => void navigate(`/ajustes/habitos/${encodeURIComponent(habit.id)}/editar`, { replace: true })}
          />
        </ListGroup>
      </div>
    </Sheet>
  );
}
