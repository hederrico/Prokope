// Editar fases (jornada.md › Editar fases): a sugestão para avançar, as fases com os hábitos de cada uma, as datas
// e a duração, e "Nova fase". As datas das fases futuras são previsões; o passado não muda.
import { useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { NavBar, Sheet, showUndo } from '@/components/shell';
import {
  AddRow,
  Button,
  Chip,
  ListGroup,
  ListItem,
  OptionCard,
  OptionGroup,
  PillarBubble,
  SectionLabel,
  Tag,
  TextField,
  TimeValue,
} from '@/components/ui';
import { Icon } from '@/icons';
import { addPhase, moveHabitToPhase, setPhaseThreshold, updatePhase } from '@/actions';
import {
  addDays,
  diffDays,
  formatDayMonth,
  formatDayShort,
  formatPercent,
  formatRange,
  useJourney,
  useNow,
  usePillars,
  useProfile,
  type PhaseView,
} from '@/data';
import type { Habit, Pillar } from '@/types';
import { spring, tween } from '@/motion';
import { phaseTitle } from './shared';
import './journey.css';

const THRESHOLDS = [
  { value: '0.6', title: '60%' },
  { value: '0.7', title: '70%' },
  { value: '0.8', title: '80%' },
  { value: 'none', title: 'Não sugerir' },
];

/** "movida", "movido", "movidas" (concordância pelo fim do nome, o melhor palpite sem gênero no dado). */
function movedWord(name: string): string {
  const last = name.trim().split(/\s+/)[0].toLocaleLowerCase('pt-BR');
  if (last.endsWith('as')) return 'movidas';
  if (last.endsWith('os')) return 'movidos';
  if (last.endsWith('a')) return 'movida';
  return 'movido';
}

function weeksText(weeks: number | null): string {
  if (weeks == null) return 'Sem fim';
  return weeks === 1 ? '1 semana' : `${weeks} semanas`;
}

export default function EditPhasesScreen() {
  const j = useJourney();
  const profile = useProfile();
  const { today } = useNow();
  const pillars = usePillars({ includeArchived: true });
  const { hash } = useLocation();
  const [sheet, setSheet] = useState<
    | { kind: 'threshold' }
    | { kind: 'duration'; phase: PhaseView }
    | { kind: 'move'; habit: Habit }
    | { kind: 'new' }
    | null
  >(null);

  const pillarById = useMemo(() => {
    const map = new Map<string, Pillar>();
    for (const p of pillars) map.set(p.pillar.id, p.pillar);
    return map;
  }, [pillars]);

  // #fase-3: rola até a fase antes da primeira pintura, sem animação
  useLayoutEffect(() => {
    const id = decodeURIComponent(hash.replace('#', ''));
    if (!id) return;
    const el = document.getElementById(`jr-${id}`);
    el?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
  }, [hash]);

  const threshold = profile?.phaseThreshold ?? null;
  const thresholdText = threshold == null ? 'Não sugerir' : formatPercent(threshold);
  const tomorrow = addDays(today, 1);

  return (
    <>
      <NavBar />
      <div className="jr-pad jr-intro">
        <h1 className="ttl2 jr-title" tabIndex={-1}>
          Fases
        </h1>
        <p className="lead">A Revisão da semana sugere a próxima fase. Quem decide é você.</p>
      </div>

      <SectionLabel>Sugestão para avançar</SectionLabel>
      <div className="jr-pad">
        <ListGroup>
          <ListItem
            icon="trend-up"
            pillar="accent"
            title="Sugerir a próxima fase"
            subtitle={threshold == null ? 'a Revisão da semana não sugere' : 'com constância a partir de'}
            value={thresholdText}
            onClick={() => setSheet({ kind: 'threshold' })}
          />
        </ListGroup>
      </div>

      <SectionLabel trailing={String(j.phases.length)}>Suas fases</SectionLabel>
      <LayoutGroup>
        <div className="jr-pad jr-cards">
          {j.phases.map((p) => (
            <PhaseCard
              key={p.number}
              p={p}
              pillarById={pillarById}
              tomorrow={tomorrow}
              onDuration={() => setSheet({ kind: 'duration', phase: p })}
              onMove={(h) => setSheet({ kind: 'move', habit: h })}
            />
          ))}
          <AddRow onClick={() => setSheet({ kind: 'new' })}>Nova fase</AddRow>
        </div>
      </LayoutGroup>
      <p className="foot">Toque num hábito para mudá-lo de fase. Mudar datas não mexe no que já foi registrado.</p>
      <div style={{ height: 24 }} />

      <ThresholdSheet
        open={sheet?.kind === 'threshold'}
        onOpenChange={(o) => !o && setSheet(null)}
        value={threshold}
      />
      <DurationSheet
        phase={sheet?.kind === 'duration' ? sheet.phase : null}
        onOpenChange={(o) => !o && setSheet(null)}
      />
      <MoveSheet
        habit={sheet?.kind === 'move' ? sheet.habit : null}
        phases={j.phases}
        onOpenChange={(o) => !o && setSheet(null)}
      />
      <NewPhaseSheet open={sheet?.kind === 'new'} onOpenChange={(o) => !o && setSheet(null)} />
    </>
  );
}

function PhaseCard({
  p,
  pillarById,
  tomorrow,
  onDuration,
  onMove,
}: {
  p: PhaseView;
  pillarById: Map<string, Pillar>;
  tomorrow: string;
  onDuration: () => void;
  onMove: (h: Habit) => void;
}) {
  const title = phaseTitle(p);
  let subtitle = '';
  if (p.status === 'done' && p.start && p.end)
    subtitle = `${formatRange(p.start, p.end)} · ${weeksText(Math.max(1, Math.round((diffDays(p.end, p.start) + 1) / 7)))}`;
  else if (p.status === 'current' && p.start) subtitle = p.end ? formatRange(p.start, p.end) : `desde ${formatDayShort(p.start)}`;
  else if (p.status === 'future') subtitle = p.start ? `Pode começar em ${formatDayShort(p.start)}` : 'Depois da fase anterior';

  let trailing = null;
  if (p.status === 'done' && p.constancy != null)
    trailing = (
      <Tag icon="check" pillar="accent">
        {formatPercent(p.constancy)}
      </Tag>
    );
  if (p.status === 'current')
    trailing = (
      <Tag dot upper pillar="accent">
        Agora
      </Tag>
    );

  return (
    <section
      id={`jr-fase-${p.number}`}
      className="pk-card p jr-fc"
      role="group"
      aria-label={`Fase ${p.number}, ${p.name}`}
    >
      <div className="pk-ch">
        <span>
          <h3>{title}</h3>
          {/* as datas previstas trocam com opacidade em micro quando a fase anterior muda */}
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={subtitle}
              className="cap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.micro }}
            >
              {subtitle}
            </m.span>
          </AnimatePresence>
        </span>
        {trailing}
      </div>
      {p.status === 'done' ? (
        <DoneHabits habits={p.habits} pillarById={pillarById} />
      ) : p.habits.length ? (
        <div className="pk-chips" role="list" aria-label={`Hábitos da fase ${p.number}`}>
          {p.habits.map((h) => (
            <m.span key={h.id} layoutId={`jr-chip-${h.id}`} layout="position" transition={spring.calma} role="listitem" style={{ display: 'inline-flex' }}>
              <Chip
                icon={h.icon}
                iconWeight="duotone"
                pillar={pillarById.get(h.pillarId)?.color}
                onClick={() => onMove(h)}
              >
                {h.name}
              </Chip>
            </m.span>
          ))}
        </div>
      ) : (
        <p className="jr-empty-chips">Nenhum hábito nesta fase ainda.</p>
      )}
      {p.status === 'current' && (
        <div className="jr-frow">
          <span>Termina em</span>
          <TimeValue
            kind="date"
            value={p.end ?? ''}
            min={tomorrow}
            display={p.end ? formatDayShort(p.end) : 'Sem fim'}
            label={p.end ? `Termina em ${formatDayMonth(p.end)}, alterar` : 'Sem data de fim, escolher'}
            onChange={(v) => {
              if (v < tomorrow) return;
              void updatePhase(p.number, { end: v }).then((undo) =>
                showUndo({ title: `A fase ${p.number} termina em ${formatDayShort(v)}`, icon: 'calendar-check' }, () => void undo()),
              );
            }}
          />
        </div>
      )}
      {p.status === 'future' && (
        <div className="jr-frow">
          <span>Duração</span>
          <button type="button" className="jr-valbtn hit" onClick={onDuration} aria-label={`Duração, ${weeksText(p.weeks)}, alterar`}>
            {weeksText(p.weeks)}
          </button>
        </div>
      )}
    </section>
  );
}

function DoneHabits({ habits, pillarById }: { habits: Habit[]; pillarById: Map<string, Pillar> }) {
  const shown = habits.slice(0, 4);
  const more = habits.length - shown.length;
  return (
    <div className="jr-few">
      <span className="jr-ics" aria-hidden="true">
        {shown.map((h) => (
          <PillarBubble key={h.id} icon={h.icon} pillar={pillarById.get(h.pillarId)?.color} size="xs" />
        ))}
        {more > 0 && <span className="pk-bub xs more">+{more}</span>}
      </span>
      {habits.length === 1 ? '1 hábito' : `${habits.length} hábitos`}
    </div>
  );
}

// ---------- folhas ----------

function ThresholdSheet({ open, onOpenChange, value }: { open: boolean; onOpenChange: (o: boolean) => void; value: number | null }) {
  const current = value == null ? 'none' : String(value);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Sugerir a próxima fase">
      <div className="jr-sheet">
        <p className="jr-sheet-p">
          A Revisão da semana sugere avançar quando a constância da fase chega a este ponto. A escolha continua sendo sua.
        </p>
        <OptionGroup
          value={current}
          label="Constância para sugerir a próxima fase"
          pillar="accent"
          onChange={(v) => {
            const next = v === 'none' ? null : Number(v);
            onOpenChange(false);
            void setPhaseThreshold(next).then((undo) =>
              showUndo(
                { title: next == null ? 'A revisão não sugere a próxima fase' : `Sugerir a partir de ${formatPercent(next)}`, icon: 'trend-up' },
                () => void undo(),
              ),
            );
          }}
        >
          {THRESHOLDS.map((t) => (
            <OptionCard key={t.value} value={t.value} title={t.title} badge={t.value === '0.7' ? 'padrão' : undefined} />
          ))}
        </OptionGroup>
      </div>
    </Sheet>
  );
}

function Stepper({ weeks, onChange }: { weeks: number | null; onChange: (w: number | null) => void }) {
  const n = weeks ?? 0;
  return (
    <div className="jr-stepper">
      <button
        type="button"
        className="jr-stepbtn"
        aria-label="Uma semana a menos"
        disabled={weeks == null || n <= 1}
        onClick={() => onChange(Math.max(1, n - 1))}
      >
        <Icon name="minus" weight="bold" />
      </button>
      <output aria-live="polite">
        {weeks == null ? (
          'Sem fim'
        ) : (
          <>
            {n}
            <small>{n === 1 ? 'semana' : 'semanas'}</small>
          </>
        )}
      </output>
      <button
        type="button"
        className="jr-stepbtn"
        aria-label="Uma semana a mais"
        disabled={weeks != null && n >= 8}
        onClick={() => onChange(weeks == null ? 1 : Math.min(8, n + 1))}
      >
        <Icon name="plus" weight="bold" />
      </button>
    </div>
  );
}

function DurationSheet({ phase, onOpenChange }: { phase: PhaseView | null; onOpenChange: (o: boolean) => void }) {
  const [weeks, setWeeks] = useState<number | null>(phase?.weeks ?? 3);
  const [seen, setSeen] = useState<number | null>(null);
  if (phase && seen !== phase.number) {
    setSeen(phase.number);
    setWeeks(phase.weeks);
  }
  if (!phase && seen !== null) setSeen(null);
  const shown = phase ?? null;
  return (
    <Sheet
      open={!!phase}
      onOpenChange={onOpenChange}
      title={shown ? `Duração da fase ${shown.number}` : 'Duração'}
      footer={
        <Button
          wide
          onClick={() => {
            if (!shown) return;
            const n = shown.number;
            onOpenChange(false);
            void updatePhase(n, { weeks }).then((undo) =>
              showUndo({ title: `Fase ${n}: ${weeksText(weeks).toLocaleLowerCase('pt-BR')}`, icon: 'calendar-check' }, () => void undo()),
            );
          }}
        >
          Salvar
        </Button>
      }
    >
      <div className="jr-sheet">
        <Stepper weeks={weeks} onChange={setWeeks} />
        <Button variant={weeks == null ? 'tint' : 'secondary'} pillar="accent" wide onClick={() => setWeeks(weeks == null ? 3 : null)}>
          {weeks == null ? 'Com fim' : 'Sem fim'}
        </Button>
        <p className="jr-sheet-p">As datas das fases seguintes mudam junto. Elas são previsões até cada fase começar.</p>
      </div>
    </Sheet>
  );
}

function MoveSheet({
  habit,
  phases,
  onOpenChange,
}: {
  habit: Habit | null;
  phases: PhaseView[];
  onOpenChange: (o: boolean) => void;
}) {
  const options = phases.filter((p) => p.status !== 'done');
  return (
    <Sheet open={!!habit} onOpenChange={onOpenChange} title="Mover para">
      {habit && (
        <div className="jr-sheet">
          <p className="jr-sheet-p">
            {habit.name} está na fase {habit.phase}. Os registros ficam como estão.
          </p>
          <OptionGroup
            value={String(habit.phase ?? '')}
            label={`Fase de ${habit.name}`}
            pillar="accent"
            onChange={(v) => {
              const n = Number(v);
              if (n === habit.phase) return onOpenChange(false);
              onOpenChange(false);
              void moveHabitToPhase(habit.id, n).then((undo) =>
                showUndo(
                  { title: `${habit.name} ${movedWord(habit.name)} para a fase ${n}`, icon: 'path' },
                  () => void undo(),
                ),
              );
            }}
          >
            {options.map((p) => (
              <OptionCard
                key={p.number}
                value={String(p.number)}
                title={phaseTitle(p)}
                description={
                  p.status === 'current'
                    ? 'Agora: entra no Hoje hoje mesmo'
                    : p.start
                      ? `Pode começar em ${formatDayShort(p.start)}`
                      : 'Depois da fase anterior'
                }
              />
            ))}
          </OptionGroup>
        </div>
      )}
    </Sheet>
  );
}

function NewPhaseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState('');
  const [weeks, setWeeks] = useState<number | null>(3);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName('');
      setWeeks(3);
    }
  }
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Nova fase"
      keyboardAware
      footer={
        <Button
          wide
          disabled={!name.trim()}
          onClick={() => {
            const input = { name: name.trim(), weeks };
            onOpenChange(false);
            void addPhase(input).then((undo) =>
              showUndo({ title: `Fase ${input.name} criada`, icon: 'path' }, () => void undo()),
            );
          }}
        >
          Criar
        </Button>
      }
    >
      <div className="jr-sheet">
        <TextField label="Nome da fase" value={name} onChange={setName} placeholder="Ex.: Leveza" maxLength={40} />
        <div>
          <span className="pk-flabel">Duração</span>
          <Stepper weeks={weeks} onChange={setWeeks} />
          <Button variant="secondary" wide onClick={() => setWeeks(weeks == null ? 3 : null)}>
            {weeks == null ? 'Com fim' : 'Sem fim'}
          </Button>
        </div>
        <p className="jr-sheet-p">A fase nova entra no fim do caminho. Depois, toque num hábito para trazê-lo para ela.</p>
      </div>
    </Sheet>
  );
}
