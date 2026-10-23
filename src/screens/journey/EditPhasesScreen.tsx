// Editar jornada (jornada.md › Editar jornada): a sugestão para avançar e as fases, cada uma em duas partes: os
// hábitos que continuam das fases anteriores e os novos nesta fase. As fases se somam: um hábito entra numa fase e
// segue nas próximas, até a fase em que para. Cada fase tem "Adicionar hábito" (criar um novo ou trazer de outra
// fase), e o menu de cada linha diz o que muda: mover, tirar da fase, arquivar, parar nesta fase ou voltar a seguir.
// Tudo com Desfazer. As datas das fases futuras são previsões; a fase concluída não muda.
import { useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { NavBar, Sheet, showUndo, type UndoInput } from '@/components/shell';
import {
  AddRow,
  Button,
  ListGroup,
  ListItem,
  OptionCard,
  OptionGroup,
  PillarBubble,
  SectionLabel,
  Tag,
  TextField,
  TimeValue,
  useReduced,
  type PillarColor,
} from '@/components/ui';
import { Icon } from '@/icons';
import {
  addPhase,
  archiveHabit,
  keepHabitFollowing,
  moveHabitToPhase,
  removeHabitFromPhase,
  setPhaseThreshold,
  stopHabitAtPhase,
  updatePhase,
  type Undo,
} from '@/actions';
import {
  addDays,
  diffDays,
  formatDayMonth,
  formatDayShort,
  formatPercent,
  formatRange,
  useHabits,
  useJourney,
  useNow,
  usePillars,
  useProfile,
  type PhaseView,
} from '@/data';
import type { Pillar } from '@/types';
import { spring, tween } from '@/motion';
import {
  addCandidates,
  candidateSubtitle,
  candidateRows,
  habitsCount,
  journeyRows,
  participle,
  fromPhases,
  rowSubtitle,
  stopText,
  verb,
  type JourneyRow,
} from './editJourney';
import { phaseTitle } from './shared';
import './journey.css';

const THRESHOLDS = [
  { value: '0.6', title: '60%' },
  { value: '0.7', title: '70%' },
  { value: '0.8', title: '80%' },
  { value: 'none', title: 'Não sugerir' },
];

/** Acima disso, a lista dos que continuam chega recolhida, com a contagem. */
const FOLD_AT = 4;

type Part = 'carried' | 'entering' | 'loose';

interface MenuTarget {
  row: JourneyRow;
  /** a fase do cartão (null no grupo Sem fase) */
  phase: PhaseView | null;
  part: Part;
}

type SheetState =
  | { kind: 'threshold' }
  | { kind: 'duration'; phase: PhaseView }
  | { kind: 'menu'; target: MenuTarget }
  | { kind: 'move'; row: JourneyRow; from: PhaseView | null }
  | { kind: 'add'; phase: PhaseView }
  | { kind: 'new' };

function weeksText(weeks: number | null): string {
  if (weeks == null) return 'Sem fim';
  return weeks === 1 ? '1 semana' : `${weeks} semanas`;
}

/** Uma assinatura do que está em cada fase (quem entra, quem continua, quem para e as datas). */
function planSignature(phases: PhaseView[], loose: PhaseView['carried']): string {
  const ids = (list: PhaseView['carried']) => list.map((x) => `${x.habit.id}>${x.until ?? ''}`).join(',');
  return [
    ...phases.map((p) => `${p.number}:${p.start ?? ''}:${p.end ?? ''}:${ids(p.entering)}|${ids(p.carried)}`),
    ids(loose),
  ].join(';');
}

/** Faz a ação em todos os hábitos da linha (acordar e deitar juntos), com um desfazer só. */
async function forEachHabit(row: JourneyRow, fn: (id: string) => Promise<Undo>): Promise<Undo> {
  const undos: Undo[] = [];
  for (const h of row.habits) undos.push(await fn(h.id));
  return async () => {
    for (const u of undos.reverse()) await u();
  };
}

export default function EditPhasesScreen() {
  const j = useJourney();
  const profile = useProfile();
  const { today } = useNow();
  const navigate = useNavigate();
  const pillars = usePillars({ includeArchived: true });
  const allHabits = useHabits('all');
  const { hash } = useLocation();
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const pillarById = useMemo(() => {
    const map = new Map<string, Pillar>();
    for (const p of pillars) map.set(p.pillar.id, p.pillar);
    return map;
  }, [pillars]);
  const colorOf = (row: JourneyRow): PillarColor | undefined => pillarById.get(row.pillarId)?.color;

  // #fase-3: rola até a fase antes da primeira pintura, sem animação. Numa tela empurrada, a camada da casca
  // zera a rolagem depois dos efeitos da tela (o efeito dela roda por último): a rolagem vai num microtask, ainda
  // antes da pintura.
  useLayoutEffect(() => {
    const id = decodeURIComponent(hash.replace('#', ''));
    if (!id) return;
    const scroll = () =>
      document.getElementById(`jr-${id}`)?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    scroll();
    queueMicrotask(scroll);
  }, [hash]);

  const threshold = profile?.phaseThreshold ?? null;
  const thresholdText = threshold == null ? 'Não sugerir' : formatPercent(threshold);
  const tomorrow = addDays(today, 1);
  const firstNumber = j.phases[0]?.number ?? null;
  const loose = useMemo(() => journeyRows(j.loose), [j.loose]);
  // as linhas e os cartões só medem o layout quando o plano muda (uma ação daqui ou de outro aparelho): durante a
  // passagem da tela, que também renderiza, nada anda sozinho
  const plan = useMemo(() => planSignature(j.phases, j.loose), [j.phases, j.loose]);

  /** Fecha a folha, faz a ação e, quando a folha já saiu, mostra o toast com Desfazer. */
  const act = async (run: () => Promise<Undo>, toast: UndoInput) => {
    setSheet(null);
    const undo = await run();
    window.setTimeout(() => showUndo(toast, () => void undo()), 240);
  };

  const openMenu = (target: MenuTarget) => setSheet({ kind: 'menu', target });

  return (
    <>
      <NavBar />
      <div className="jr-pad jr-intro">
        <h1 className="ttl2 jr-title" tabIndex={-1}>
          Editar jornada
        </h1>
        <p className="lead">
          As fases se somam: o que entra numa fase segue nas próximas. A Revisão da semana sugere quando avançar, e quem
          decide é você.
        </p>
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
              first={p.number === firstNumber}
              today={today}
              tomorrow={tomorrow}
              colorOf={colorOf}
              pillarById={pillarById}
              plan={plan}
              onDuration={() => setSheet({ kind: 'duration', phase: p })}
              onMenu={openMenu}
              onAdd={() => setSheet({ kind: 'add', phase: p })}
            />
          ))}
          <m.div layout="position" layoutDependency={plan} transition={spring.calma}>
            <AddRow onClick={() => setSheet({ kind: 'new' })}>Nova fase</AddRow>
          </m.div>
          {loose.length > 0 && (
            <m.section
              layout="position"
              layoutDependency={plan}
              transition={spring.calma}
              className="pk-card p jr-fc"
              aria-labelledby="jr-loose-t"
            >
              <div className="jr-part">
                <h3 id="jr-loose-t" className="jr-loose-t">
                  Sem fase
                  <Count n={loose.length} />
                </h3>
                <p className="jr-pnote">Seguem no seu dia a dia em todas as fases.</p>
                <RowList
                  rows={loose}
                  at={null}
                  part="loose"
                  today={today}
                  plan={plan}
                  label="Hábitos sem fase"
                  colorOf={colorOf}
                  onMenu={(row) => openMenu({ row, phase: null, part: 'loose' })}
                />
              </div>
            </m.section>
          )}
        </div>
      </LayoutGroup>
      <p className="foot">
        Toque num hábito para ver o que dá para fazer com ele. Mudar datas não mexe no que já foi registrado.
      </p>
      <div style={{ height: 24 }} />

      <ThresholdSheet open={sheet?.kind === 'threshold'} onOpenChange={(o) => !o && setSheet(null)} value={threshold} />
      <DurationSheet
        phase={sheet?.kind === 'duration' ? sheet.phase : null}
        onOpenChange={(o) => !o && setSheet(null)}
      />
      <MenuSheet
        target={sheet?.kind === 'menu' ? sheet.target : null}
        today={today}
        colorOf={colorOf}
        onOpenChange={(o) => !o && setSheet(null)}
        onMove={(row, from) => {
          // uma folha depois da outra: a do menu sai antes de a do Mover para subir
          setSheet(null);
          window.setTimeout(() => setSheet({ kind: 'move', row, from }), 220);
        }}
        act={act}
      />
      <MoveSheet
        row={sheet?.kind === 'move' ? sheet.row : null}
        from={sheet?.kind === 'move' ? sheet.from : null}
        phases={j.phases}
        allHabits={allHabits}
        onOpenChange={(o) => !o && setSheet(null)}
        act={act}
      />
      <AddHabitSheet
        phase={sheet?.kind === 'add' ? sheet.phase : null}
        allHabits={allHabits}
        colorOf={colorOf}
        onOpenChange={(o) => !o && setSheet(null)}
        onCreate={(n) => {
          setSheet(null);
          void navigate(`/ajustes/habitos/novo/tipo?fase=${n}`);
        }}
        act={act}
      />
      <NewPhaseSheet open={sheet?.kind === 'new'} onOpenChange={(o) => !o && setSheet(null)} />
    </>
  );
}

// ---------- o cartão da fase ----------

function PhaseCard({
  p,
  first,
  today,
  tomorrow,
  colorOf,
  pillarById,
  plan,
  onDuration,
  onMenu,
  onAdd,
}: {
  p: PhaseView;
  first: boolean;
  today: string;
  tomorrow: string;
  colorOf: (row: JourneyRow) => PillarColor | undefined;
  pillarById: Map<string, Pillar>;
  plan: string;
  onDuration: () => void;
  onMenu: (target: MenuTarget) => void;
  onAdd: () => void;
}) {
  const title = phaseTitle(p);
  let subtitle = '';
  if (p.status === 'done' && p.start && p.end)
    subtitle = `${formatRange(p.start, p.end)} · ${weeksText(Math.max(1, Math.round((diffDays(p.end, p.start) + 1) / 7)))}`;
  else if (p.status === 'current' && p.start)
    subtitle = p.end ? formatRange(p.start, p.end) : `desde ${formatDayShort(p.start)}`;
  else if (p.status === 'future')
    subtitle = p.start ? `Pode começar em ${formatDayShort(p.start)}` : 'Depois da fase anterior';

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

  const carried = useMemo(() => journeyRows(p.carried), [p.carried]);
  const entering = useMemo(() => journeyRows(p.entering), [p.entering]);
  const editable = p.status !== 'done';
  // a primeira fase (ou uma sem nada das anteriores) não tem "novos": tudo nela começa ali
  const enteringTitle = first || !carried.length ? 'Hábitos desta fase' : 'Novos nesta fase';

  return (
    <m.section
      layout="position"
      layoutDependency={plan}
      transition={spring.calma}
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
      {!editable ? (
        <DoneHabits p={p} first={first} pillarById={pillarById} />
      ) : (
        <>
          {carried.length > 0 && (
            <CarriedPart p={p} rows={carried} today={today} plan={plan} colorOf={colorOf} onMenu={onMenu} />
          )}
          <div className="jr-part">
            <h4 className="jr-ptl">
              {enteringTitle}
              {entering.length > 0 && <Count n={entering.length} />}
            </h4>
            {entering.length ? (
              <RowList
                rows={entering}
                at={p.number}
                part="entering"
                today={today}
                plan={plan}
                label={enteringTitle}
                colorOf={colorOf}
                onMenu={(row) => onMenu({ row, phase: p, part: 'entering' })}
              />
            ) : (
              <p className="jr-empty-chips">
                {first ? 'Nenhum hábito nesta fase ainda.' : 'Nenhum hábito novo nesta fase ainda.'}
              </p>
            )}
          </div>
          <AddRow className="jr-addh" onClick={onAdd}>
            Adicionar hábito
          </AddRow>
        </>
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
                showUndo(
                  { title: `A fase ${p.number} termina em ${formatDayShort(v)}`, icon: 'calendar-check' },
                  () => void undo(),
                ),
              );
            }}
          />
        </div>
      )}
      {p.status === 'future' && (
        <div className="jr-frow">
          <span>Duração</span>
          <button
            type="button"
            className="jr-valbtn hit"
            onClick={onDuration}
            aria-label={`Duração, ${weeksText(p.weeks)}, alterar`}
          >
            {weeksText(p.weeks)}
          </button>
        </div>
      )}
    </m.section>
  );
}

/** A contagem ao lado do rótulo de uma parte: o número na tela, "10 hábitos" para o leitor de tela. */
function Count({ n }: { n: number }) {
  return (
    <>
      <span className="num" aria-hidden="true">
        {n}
      </span>
      <span className="pk-sr">{`, ${habitsCount(n)}`}</span>
    </>
  );
}

/** A fase concluída não muda: só o resumo dos hábitos que entraram nela. */
function DoneHabits({ p, first, pillarById }: { p: PhaseView; first: boolean; pillarById: Map<string, Pillar> }) {
  const habits = p.habits;
  const shown = habits.slice(0, 4);
  const more = habits.length - shown.length;
  const carried = journeyRows(p.carried).length;
  return (
    <div className="jr-few">
      <span className="jr-ics" aria-hidden="true">
        {shown.map((h) => (
          <PillarBubble key={h.id} icon={h.icon} pillar={pillarById.get(h.pillarId)?.color} size="xs" />
        ))}
        {more > 0 && <span className="pk-bub xs more">+{more}</span>}
      </span>
      {first ? habitsCount(habits.length) : `${habitsCount(habits.length)} ${habits.length === 1 ? 'novo' : 'novos'}`}
      {carried > 0 ? ` · ${carried} seguiram das anteriores` : ''}
    </div>
  );
}

/** "Continuam das fases anteriores": recolhida com a contagem quando é longa; abre no lugar, com a mola calma. */
function CarriedPart({
  p,
  rows,
  today,
  plan,
  colorOf,
  onMenu,
}: {
  p: PhaseView;
  rows: JourneyRow[];
  today: string;
  plan: string;
  colorOf: (row: JourneyRow) => PillarColor | undefined;
  onMenu: (target: MenuTarget) => void;
}) {
  const reduced = useReduced();
  const long = rows.length > FOLD_AT;
  const [open, setOpen] = useState(!long);
  const listId = `jr-cont-l-${p.number}`;
  const from = fromPhases(rows.map((r) => r.from ?? 0));
  const shown = rows.slice(0, 3);
  const extra = rows.length - shown.length;
  return (
    <div className="jr-part">
      <h4 className="jr-ptl">
        Continuam das fases anteriores
        <Count n={rows.length} />
      </h4>
      <p className="jr-pnote">Os hábitos das fases anteriores seguem com você.</p>
      {long && (
        <button
          type="button"
          className="pk-reset jr-fold"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${habitsCount(rows.length)} ${from}, ${open ? 'recolher a lista' : 'mostrar a lista'}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="jr-ics" aria-hidden="true">
            {shown.map((r) => (
              <PillarBubble key={r.key} icon={r.icon} pillar={colorOf(r)} size="xs" />
            ))}
            {extra > 0 && <span className="pk-bub xs more">+{extra}</span>}
          </span>
          <span className="jr-fold-t" aria-hidden="true">
            <b>{habitsCount(rows.length)}</b>
            <small>{`${from} · ${open ? 'recolher' : 'ver e mudar'}`}</small>
          </span>
          <m.span
            className="jr-fold-cv"
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={tween.micro}
          >
            <Icon name="caret-down" weight="bold" />
          </m.span>
        </button>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="list"
            id={listId}
            className="jr-fold-body"
            initial={long ? { height: 0 } : false}
            animate={{ height: 'auto', transition: reduced ? { duration: 0 } : spring.calma }}
            exit={{ height: 0, transition: reduced ? { duration: 0 } : spring.calma }}
          >
            <RowList
              rows={rows}
              at={p.number}
              part="carried"
              today={today}
              plan={plan}
              label="Continuam das fases anteriores"
              colorOf={colorOf}
              onMenu={(row) => onMenu({ row, phase: p, part: 'carried' })}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * As linhas de uma parte. Cada linha tem layoutId pela fase do cartão: a que muda de parte dentro do cartão
 * ("Novos" ↔ "Continuam") atravessa com layout calma; a que entra aparece com opacidade em micro; a que sai
 * deixa o lugar sem empurrar as de baixo debaixo do dedo (popLayout).
 */
function RowList({
  rows,
  at,
  part,
  today,
  plan,
  label,
  colorOf,
  onMenu,
}: {
  rows: JourneyRow[];
  at: number | null;
  part: Part;
  today: string;
  plan: string;
  label: string;
  colorOf: (row: JourneyRow) => PillarColor | undefined;
  onMenu: (row: JourneyRow) => void;
}) {
  return (
    <ul className="jr-hl" aria-label={label}>
      <AnimatePresence initial={false} mode="popLayout">
        {rows.map((row) => {
          const sub = rowSubtitle(row, part, at, today);
          const leaving = row.until != null && row.until === at;
          return (
            <m.li
              key={row.key}
              layout="position"
              layoutDependency={plan}
              layoutId={`jr-row-${at ?? 'x'}-${row.key}`}
              transition={spring.calma}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.micro }}
              exit={{ opacity: 0, transition: tween.exit }}
            >
              <button
                type="button"
                className={`pk-reset jr-hrow${leaving ? ' off' : ''}`}
                aria-label={`${row.name}${sub ? `, ${sub}` : ''}. Abre as opções`}
                onClick={() => onMenu(row)}
              >
                <PillarBubble icon={row.icon} pillar={colorOf(row)} size="xs" />
                <span className="jr-hrow-t">
                  <b>{row.name}</b>
                  {sub && <small>{sub}</small>}
                </span>
                <Icon name="dots-three" weight="bold" className="jr-hrow-i" />
              </button>
            </m.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

// ---------- folhas ----------

type Act = (run: () => Promise<Undo>, toast: UndoInput) => Promise<void>;

/**
 * O menu de uma linha. Cada opção diz o que acontece. Nos novos: Mover para, Tirar da fase e Arquivar. Nos que
 * continuam: Parar nesta fase (ou, se já para nela, Voltar a seguir). Sem fase: Pôr numa fase e Arquivar.
 */
function MenuSheet({
  target,
  today,
  colorOf,
  onOpenChange,
  onMove,
  act,
}: {
  target: MenuTarget | null;
  today: string;
  colorOf: (row: JourneyRow) => PillarColor | undefined;
  onOpenChange: (o: boolean) => void;
  onMove: (row: JourneyRow, from: PhaseView | null) => void;
  act: Act;
}) {
  if (!target) return <Sheet open={false} onOpenChange={onOpenChange} title="Hábito" />;
  const { row, phase, part } = target;
  const color = colorOf(row) ?? 'accent';
  const n = phase?.number ?? null;
  const current = phase?.status === 'current';
  const ids = row.habits.map((h) => h.id);
  const waiting = row.habits.every((h) => !h.startDay);
  const later = row.habits.find((h) => h.startDay && h.startDay > today)?.startDay ?? null;
  const toastBase = { pillar: color } as const;

  const where =
    part === 'carried'
      ? `Fase ${n} · da fase ${row.from}`
      : part === 'entering'
        ? `Fase ${n} · entra nesta fase`
        : 'Sem fase · segue em todas as fases';
  const stop = stopText(row, n, today);
  const detail = [where, stop].filter(Boolean).join(' · ');

  const items: React.ReactNode[] = [];
  if (part === 'entering' || part === 'loose') {
    items.push(
      <ListItem
        key="move"
        icon="path"
        title={part === 'loose' ? 'Pôr numa fase' : 'Mover para outra fase'}
        subtitle="Escolha em que fase ele entra. Os registros ficam como estão."
        onClick={() => onMove(row, phase)}
      />,
    );
  }
  if (part === 'entering') {
    items.push(
      <ListItem
        key="loose"
        icon="circle-dashed"
        title="Tirar da fase"
        subtitle={
          waiting
            ? 'Entra no dia a dia hoje, sem fase, e segue em todas as fases.'
            : later
              ? `Entra no dia a dia em ${formatDayShort(later)}, sem fase.`
              : 'Continua no dia a dia, sem fase, em todas as fases.'
        }
        chevron={false}
        onClick={() =>
          void act(() => removeHabitFromPhase(ids), {
            ...toastBase,
            title: waiting
              ? `${row.name} ${verb(row, 'entra', 'entram')} hoje, sem fase`
              : `${row.name} ${verb(row, 'segue', 'seguem')} sem fase`,
            icon: 'circle-dashed',
          })
        }
      />,
    );
  }
  if (part === 'carried' && phase) {
    const here = row.until === n;
    items.push(
      here ? (
        <ListItem
          key="follow"
          icon="arrow-counter-clockwise"
          title="Voltar a seguir"
          subtitle={
            row.stopped && row.stopDay && row.stopDay < today
              ? 'Volta para o dia a dia hoje e segue nas próximas fases. Os dias em que ficou fora não contam.'
              : `Segue na fase ${n} e nas próximas, como antes.`
          }
          chevron={false}
          onClick={() =>
            void act(() => keepHabitFollowing(ids), {
              ...toastBase,
              title: `${row.name} ${row.plural ? 'voltam' : 'volta'} a seguir`,
              detail: 'Nesta fase e nas próximas',
              icon: 'arrow-counter-clockwise',
            })
          }
        />
      ) : (
        <ListItem
          key="stop"
          icon="flag-checkered"
          title="Parar nesta fase"
          subtitle={
            current
              ? 'Sai do dia a dia a partir de hoje. Os dias antes continuam no histórico.'
              : `Sai do dia a dia quando a fase ${n} começar. Até lá, tudo segue igual, e os dias antes continuam no histórico.`
          }
          chevron={false}
          onClick={() =>
            void act(() => stopHabitAtPhase(ids, n!), {
              ...toastBase,
              title: current
                ? `${row.name} ${row.plural ? 'saem' : 'sai'} do dia a dia hoje`
                : `${row.name} ${row.plural ? 'param' : 'para'} na fase ${n}`,
              detail: current ? 'Os dias antes ficam no histórico' : 'Até lá, tudo segue igual',
              icon: 'flag-checkered',
            })
          }
        />
      ),
    );
  }
  if (part === 'entering' || part === 'loose') {
    items.push(
      <ListItem
        key="archive"
        icon="archive"
        title="Arquivar"
        subtitle={
          waiting
            ? 'Sai do plano. Dá para restaurar em Ajustes › Hábitos.'
            : 'Sai do Hoje. O histórico fica guardado e dá para restaurar em Ajustes › Hábitos.'
        }
        chevron={false}
        onClick={() =>
          void act(() => forEachHabit(row, archiveHabit), {
            ...toastBase,
            title: `${row.name} ${participle(row, 'arquivad')}`,
            icon: 'archive',
          })
        }
      />,
    );
  }

  return (
    <Sheet
      open
      onOpenChange={onOpenChange}
      label={`${row.name}, opções`}
      title={
        <span className="jr-mh">
          <PillarBubble icon={row.icon} pillar={color} />
          <span>
            <b>{row.name}</b>
            <small>{detail}</small>
          </span>
        </span>
      }
    >
      <div className="jr-menu">
        <ListGroup label="O que fazer">{items}</ListGroup>
      </div>
    </Sheet>
  );
}

/** "Mover para" (e "Pôr numa fase", no grupo Sem fase): as fases que não acabaram, cada uma dizendo quando entra. */
function MoveSheet({
  row,
  from,
  phases,
  allHabits,
  onOpenChange,
  act,
}: {
  row: JourneyRow | null;
  from: PhaseView | null;
  phases: PhaseView[];
  allHabits: ReturnType<typeof useHabits>;
  onOpenChange: (o: boolean) => void;
  act: Act;
}) {
  // um hábito sem fase que já está no dia a dia só entra na fase atual (numa futura, sairia do Hoje até lá)
  const inDay =
    !from &&
    !!row &&
    row.habits.some((h) => {
      const s = allHabits.find((i) => i.habit.id === h.id)?.status;
      return s === 'active' || s === 'paused';
    });
  const options = phases.filter((p) => p.status !== 'done' && (!inDay || p.status === 'current'));
  const current = row?.habits[0]?.phase ?? null;
  return (
    <Sheet open={!!row} onOpenChange={onOpenChange} title={from ? 'Mover para' : 'Pôr numa fase'}>
      {row && (
        <div className="jr-sheet">
          <p className="jr-sheet-p">
            {current != null
              ? `${row.name} ${row.plural ? 'estão' : 'está'} na fase ${current}. Os registros ficam como estão.`
              : inDay
                ? `${row.name} já ${row.plural ? 'estão' : 'está'} no seu dia a dia: ${row.plural ? 'entram' : 'entra'} na fase de agora e ${row.plural ? 'seguem' : 'segue'} nas próximas.`
                : `${row.name} ${row.plural ? 'entram' : 'entra'} na fase escolhida e ${row.plural ? 'seguem' : 'segue'} nas próximas.`}
          </p>
          <OptionGroup
            value={current != null ? String(current) : undefined}
            label={`Fase de ${row.name}`}
            pillar="accent"
            onChange={(v) => {
              const n = Number(v);
              if (n === current) return onOpenChange(false);
              void act(() => forEachHabit(row, (id) => moveHabitToPhase(id, n)), {
                title: `${row.name} ${participle(row, 'movid')} para a fase ${n}`,
                icon: 'path',
              });
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

/**
 * "Adicionar hábito" numa fase: criar um novo (abre o Novo hábito com a fase escolhida) ou trazer um que já existe,
 * de outra fase ou sem fase (escolher move para esta fase, com Desfazer).
 */
function AddHabitSheet({
  phase,
  allHabits,
  colorOf,
  onOpenChange,
  onCreate,
  act,
}: {
  phase: PhaseView | null;
  allHabits: ReturnType<typeof useHabits>;
  colorOf: (row: JourneyRow) => PillarColor | undefined;
  onOpenChange: (o: boolean) => void;
  onCreate: (n: number) => void;
  act: Act;
}) {
  const rows = useMemo(() => (phase ? candidateRows(addCandidates(allHabits, phase)) : []), [phase, allHabits]);
  const n = phase?.number ?? 0;
  const current = phase?.status === 'current';
  return (
    <Sheet open={!!phase} onOpenChange={onOpenChange} title={phase ? `Adicionar à fase ${n}` : 'Adicionar'}>
      {phase && (
        <div className="jr-sheet jr-menu">
          <ListGroup label="Hábito novo">
            <ListItem
              icon="plus-circle"
              pillar="accent"
              title="Criar hábito novo nesta fase"
              subtitle={current ? `Entra no Hoje hoje, na fase ${n}` : `Entra quando a fase ${n} começar`}
              onClick={() => onCreate(n)}
            />
          </ListGroup>
          <div>
            <SectionLabel inset level={3} trailing={rows.length ? String(rows.length) : undefined}>
              Trazer um que você já tem
            </SectionLabel>
            {rows.length ? (
              <ListGroup label="Hábitos de outras fases ou sem fase">
                {rows.map((row) => (
                  <ListItem
                    key={row.key}
                    icon={row.icon}
                    pillar={colorOf(row)}
                    title={row.name}
                    subtitle={candidateSubtitle(row, phase)}
                    chevron={false}
                    trailing={
                      <span className="rv">
                        <Icon name="plus" weight="bold" />
                      </span>
                    }
                    onClick={() =>
                      void act(() => forEachHabit(row, (id) => moveHabitToPhase(id, n)), {
                        title: `${row.name} ${participle(row, 'movid')} para a fase ${n}`,
                        pillar: colorOf(row),
                        icon: 'path',
                      })
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <p className="jr-sheet-p">Os outros hábitos já fazem parte desta fase.</p>
            )}
          </div>
          <p className="jr-sheet-p jr-sheet-small">
            {current
              ? 'Os hábitos das fases anteriores já seguem nesta fase.'
              : 'Os hábitos que já estão no seu dia a dia seguem nesta fase sem precisar trazer.'}
          </p>
        </div>
      )}
    </Sheet>
  );
}

function ThresholdSheet({
  open,
  onOpenChange,
  value,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: number | null;
}) {
  const current = value == null ? 'none' : String(value);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Sugerir a próxima fase">
      <div className="jr-sheet">
        <p className="jr-sheet-p">
          A Revisão da semana sugere avançar quando a constância da fase chega a este ponto. A escolha continua sendo
          sua.
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
                {
                  title:
                    next == null ? 'A revisão não sugere a próxima fase' : `Sugerir a partir de ${formatPercent(next)}`,
                  icon: 'trend-up',
                },
                () => void undo(),
              ),
            );
          }}
        >
          {THRESHOLDS.map((t) => (
            <OptionCard
              key={t.value}
              value={t.value}
              title={t.title}
              badge={t.value === '0.7' ? 'padrão' : undefined}
            />
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
              showUndo(
                { title: `Fase ${n}: ${weeksText(weeks).toLocaleLowerCase('pt-BR')}`, icon: 'calendar-check' },
                () => void undo(),
              ),
            );
          }}
        >
          Salvar
        </Button>
      }
    >
      <div className="jr-sheet">
        <Stepper weeks={weeks} onChange={setWeeks} />
        <Button
          variant={weeks == null ? 'tint' : 'secondary'}
          pillar="accent"
          wide
          onClick={() => setWeeks(weeks == null ? 3 : null)}
        >
          {weeks == null ? 'Com fim' : 'Sem fim'}
        </Button>
        <p className="jr-sheet-p">
          As datas das fases seguintes mudam junto. Elas são previsões até cada fase começar.
        </p>
      </div>
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
        <p className="jr-sheet-p">A fase nova entra no fim do caminho. Depois, use "Adicionar hábito" nela.</p>
      </div>
    </Sheet>
  );
}
