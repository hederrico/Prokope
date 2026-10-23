// Novo hábito · detalhes e Editar hábito (tela cheia). Nome, meta e botões rápidos vêm primeiro; o resto chega
// preenchido ("Onde e quando · pode deixar assim"). O ícone muda tocando no lápis da prévia. "Criar" ao criar e
// "Salvar" ao editar, desabilitados sem nome (ajustes-plano.md › Novo hábito · detalhes).
// No Treino guiado, a linha "Plano · 13 semanas ›" empurra o editor do plano dentro da mesma tela cheia (o conteúdo
// faz o passo de 24 px; "‹ Novo hábito" volta), e o plano vai junto no Criar ou no Salvar.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, m, type Variants } from 'motion/react';
import { FullScreen, NavBar, Sheet, showUndo, useGoBack } from '@/components/shell';
import { Button, DayPicker, ListGroup, SectionLabel, Switch, TextField, TimeValue } from '@/components/ui';
import {
  formatDayShort,
  formatTime,
  planWeeks,
  suggestIcon,
  templateOf,
  useDrafts,
  useHabit,
  useJourney,
  usePillars,
  useProfile,
} from '@/data';
import { createHabit, moveHabitToPhase, updateHabit } from '@/actions';
import { useNow } from '@/data/useDomain';
import { distance, dur, ease, tween } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion';
import type { Habit, HabitGoal, Weekday } from '@/types';
import { aroundText, scheduleLabel } from '@/screens/journey/shared';
import { TrainingPlanEditor } from './TrainingPlanEditor';
import { planShape } from './trainingEdit';
import './training.css';
import { ChoiceSheet, Dot, Foot, Row, type Choice } from './parts';
import { GoalStepper } from './GoalStepper';
import { ChecklistEditor, GoalRamp, HabitPreview, QuickAddsEditor, RampSheet } from './HabitFormParts';
import { IconPicker } from './IconPicker';
import { suggestCategory } from './iconLibrary';
import { daysLabel, goalAmount } from './habitText';
import {
  ALL_WEEKDAYS,
  MOMENTS,
  UNITS,
  draftToForm,
  formFromHabit,
  formToDraft,
  isHabitType,
  momentLabel,
  newForm,
  previewLabel,
  rampSentence,
  rampText,
  stepFor,
  unitLabel,
  type FormState,
} from './habitForm';
import './settings.css';

export default function HabitFormScreen() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const view = useHabit(id);
  const pillars = usePillars().map((p) => p.pillar);
  const journey = useJourney();

  if (id) {
    if (!view) return <Navigate to="/ajustes/habitos" replace />;
    return <HabitForm key={id} editing={view.habit} initial={formFromHabit(view.habit)} />;
  }
  const tipo = search.get('tipo');
  const pilar = search.get('pilar');
  if (!isHabitType(tipo)) {
    return <Navigate to={`/ajustes/habitos/novo/tipo${pilar ? `?pilar=${encodeURIComponent(pilar)}` : ''}`} replace />;
  }
  const draft = useDrafts.getState().habitForm;
  const pillarId =
    (pilar && pillars.some((p) => p.id === pilar) ? pilar : null) ?? draft?.pillarId ?? pillars[0]?.id ?? '';
  const start = journey.current ? journey.current.number : 'now';
  const initial = newForm(tipo, draft ? draftToForm(draft) : {}, pillarId, start);
  return <HabitForm key={`novo-${tipo}`} initial={initial} origin={pilar} />;
}

type SheetName =
  | 'icon'
  | 'pillar'
  | 'moment'
  | 'days'
  | 'start'
  | 'phase'
  | 'unit'
  | 'unitOther'
  | 'partial'
  | 'ramp'
  | 'name';

// a parte do plano entra como um passo: 24 px pela direita com opacidade em base; a que sai, 24 px para a esquerda
// em micro (voltar faz o inverso). Reduzido: só opacidade, em micro.
const partVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * distance.screen }),
  center: { opacity: 1, x: 0, transition: tween.base },
  exit: (dir: number) => ({ opacity: 0, x: -dir * distance.screen, transition: { duration: dur.micro, ease: ease.exit } }),
};
const reducedPartVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: tween.micro },
  exit: { opacity: 0, transition: tween.micro },
};

/** Ao entrar uma parte: a rolagem vai para `scrollTo` (o topo, ou onde o formulário estava) e o foco para o título. */
function PartStart({ scrollTo }: { scrollTo: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (scrollTo === null) return;
    const scroller = ref.current?.closest<HTMLElement>('[data-screen-scroll]');
    if (scroller) scroller.scrollTop = scrollTo;
    const h = ref.current?.closest<HTMLElement>('.sh-full')?.querySelector<HTMLElement>('h1');
    h?.focus({ preventScroll: true });
  }, [scrollTo]);
  return <span ref={ref} hidden />;
}

function HabitForm({ initial, editing, origin }: { initial: FormState; editing?: Habit; origin?: string | null }) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const profile = useProfile();
  const pillars = usePillars().map((p) => p.pillar);
  const journey = useJourney();
  const { today } = useNow();
  const setDraft = useDrafts((s) => s.setHabitForm);
  const [form, setForm] = useState<FormState>(initial);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const [days, setDays] = useState<Weekday[]>(initial.days);
  const [otherUnit, setOtherUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const nameWrap = useRef<HTMLDivElement>(null);
  const isNew = !editing;
  const reduced = usePrefersReducedMotion();
  // Treino guiado: a parte do plano (empurrada dentro da tela), os nomes do esforço e do descanso e o horário
  const [planOpen, setPlanOpen] = useState(false);
  const [partDir, setPartDir] = useState(1);
  const [partScroll, setPartScroll] = useState<number | null>(null);
  const formScroll = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [nameKind, setNameKind] = useState<'effort' | 'rest'>('effort');
  const [nameDraft, setNameDraft] = useState('');
  const [time, setTime] = useState(initial.time ?? '07:00');
  const guided = form.type === 'guided' && !!form.training;
  const openPlan = () => {
    formScroll.current = bodyRef.current?.closest<HTMLElement>('[data-screen-scroll]')?.scrollTop ?? 0;
    setPartDir(1);
    setPartScroll(0);
    setPlanOpen(true);
  };
  const closePlan = () => {
    setPartDir(-1);
    setPartScroll(formScroll.current);
    setPlanOpen(false);
  };
  const openName = (kind: 'effort' | 'rest') => {
    setNameKind(kind);
    setNameDraft(form.training?.[kind] ?? '');
    setSheet('name');
  };

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const setGoal = (patch: Partial<HabitGoal>) => setForm((f) => ({ ...f, goal: { ...f.goal, ...patch } }));

  // o rascunho acompanha o formulário novo (sobrevive ao "‹ Tipo" e a fechar sem querer)
  useEffect(() => {
    if (isNew) setDraft(formToDraft(form));
  }, [form, isNew, setDraft]);

  // 300 ms depois de parar de digitar, o ícone sugerido pelo nome entra (enquanto a pessoa não escolheu um)
  useEffect(() => {
    if (form.iconChosen) return;
    const t = setTimeout(() => {
      const s = form.name.trim() ? suggestIcon(form.name) : null;
      setForm((f) => (f.iconChosen || f.icon === s ? f : { ...f, icon: s }));
    }, 300);
    return () => clearTimeout(t);
  }, [form.name, form.iconChosen]);

  // depois do passo, o foco vai para o Nome
  useEffect(() => {
    if (isNew) nameWrap.current?.querySelector('input')?.focus({ preventScroll: true });
  }, [isNew]);

  const pillar = pillars.find((p) => p.id === form.pillarId) ?? pillars[0];
  const color = pillar?.color;
  const icon = form.icon ?? 'circle-dashed';
  const g = form.goal;
  const unitStep = stepFor(g.unit);
  const scheduleTime = g.timeKey ? profile?.schedule?.[g.timeKey] : undefined;
  const name = form.name.trim();

  const changed = !editing || JSON.stringify(formFromHabit(editing)) !== JSON.stringify({ ...form, days: form.days });
  const canSave = !!name && changed && !busy;

  // ---------- começa e fase ----------
  const current = journey.current;
  const startChoices: Choice<string>[] = [];
  if (journey.phases.length) {
    if (current) startChoices.push({ value: `f${current.number}`, label: `Agora, na fase ${current.number}` });
    for (const p of journey.phases.filter((x) => x.status === 'future')) {
      startChoices.push({
        value: `f${p.number}`,
        label: `Na fase ${p.number}${p.start ? `, ${formatDayShort(p.start)}` : ''}`,
        detail: p.name,
      });
    }
  }
  if (!current) startChoices.unshift({ value: 'now', label: 'Hoje' });
  const startValue = typeof form.start === 'number' ? `f${form.start}` : form.start;
  const startLabel =
    startChoices.find((c) => c.value === startValue)?.label ??
    (typeof form.start === 'string' && form.start !== 'now' ? `Em ${formatDayShort(form.start)}` : 'Hoje');
  const phaseChoices: Choice<string>[] = journey.phases.map((p) => ({
    value: String(p.number),
    label: `Fase ${p.number}`,
    detail: p.status === 'future' && p.start ? `${p.name} · a partir de ${formatDayShort(p.start)}` : p.name,
  }));

  // ---------- salvar ----------
  const save = async () => {
    if (!canSave || !pillar) return;
    setBusy(true);
    const goal: HabitGoal = { ...form.goal };
    const trainingPatch = guided ? { training: form.training } : {};
    const timePatch = guided && form.time ? { time: form.time } : {};
    if (editing) {
      await updateHabit(editing.id, {
        name,
        icon,
        pillarId: form.pillarId,
        goal,
        schedule: { ...editing.schedule, days: form.days, moment: form.moment, ...timePatch },
        quickAdds: form.quickAdds,
        checklist: form.checklist,
        ...trainingPatch,
      });
      if (form.phase !== null && form.phase !== editing.phase) await moveHabitToPhase(editing.id, form.phase);
      goBack(`/ajustes/habitos/${encodeURIComponent(editing.id)}`);
      return;
    }
    const undo = await createHabit({
      name,
      type: form.type,
      pillarId: form.pillarId,
      icon,
      goal,
      schedule: { days: form.days, moment: form.moment, ...timePatch },
      quickAdds: form.quickAdds,
      checklist: form.checklist,
      start: form.start,
      ...trainingPatch,
    });
    setDraft(null);
    goBack(origin ? `/ajustes/pilares/${encodeURIComponent(origin)}` : '/ajustes/habitos');
    const future = typeof form.start === 'number' ? journey.phases.find((p) => p.number === form.start) : null;
    if (future && future.status === 'future') {
      showUndo(
        {
          title: `${name} entra na fase ${future.number}${future.start ? `, em ${formatDayShort(future.start)}` : ''}`,
          pillar: color,
          icon: 'calendar-check',
        },
        () => void undo(),
      );
    }
  };

  const toType = () => {
    setDraft(formToDraft(form));
    const params = new URLSearchParams();
    if (origin) params.set('pilar', origin);
    const q = params.toString();
    void navigate(`/ajustes/habitos/novo/tipo${q ? `?${q}` : ''}`, {
      replace: true,
      state: { fromDetails: true, transition: 'pop' },
    });
  };

  // ---------- meta de cada tipo ----------
  let meta: React.ReactNode = null;
  if (form.type === 'counter') {
    const value = g.value ?? unitStep;
    meta = (
      <div className="pk-lg st-meta">
        <GoalStepper
          value={value}
          step={unitStep}
          unit={g.unit}
          caption="por dia"
          onChange={(v) =>
            setGoal({
              value: v,
              ...(g.ramp ? { ramp: { ...g.ramp, max: Math.max(g.ramp.max, v + g.ramp.step) } } : {}),
              ...(g.partialMin !== undefined && g.partialMin >= v ? { partialMin: undefined } : {}),
            })
          }
        />
        <Row title="Unidade" value={unitLabel(g.unit)} onClick={() => setSheet('unit')} />
        <Row
          title="Mínimo para parcial"
          subtitle="Abaixo da meta e a partir do mínimo, o dia conta como parcial."
          value={g.partialMin ? goalAmount(g.partialMin, g.unit) : 'Desligado'}
          onClick={() => setSheet('partial')}
        />
        <div className="st-up">
          <Row
            title="Subir aos poucos"
            subtitle={
              g.ramp ? (
                <button
                  type="button"
                  className="pk-reset"
                  style={{ textAlign: 'left', color: 'inherit', textDecoration: 'underline dotted' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheet('ramp');
                  }}
                >
                  {rampText(g.ramp, g.unit)}
                </button>
              ) : (
                'A meta sobe um degrau de cada vez, se você quiser.'
              )
            }
            trailing={
              <Switch
                label="Subir aos poucos"
                checked={!!g.ramp}
                onCheckedChange={(on) =>
                  setGoal({
                    ramp: on
                      ? {
                          step: unitStep * 2,
                          everyWeeks: 2,
                          max: value + unitStep * 6,
                          ask: true,
                          since: today,
                        }
                      : null,
                  })
                }
              />
            }
          />
          <GoalRamp goal={{ ...g, value }} pillar={color} />
          {g.ramp && <span className="pk-sr">{rampSentence(value, g.ramp, g.unit)}</span>}
        </div>
      </div>
    );
  } else if (form.type === 'time') {
    meta = (
      <div className="pk-lg st-meta">
        {scheduleTime ? (
          <Row title="Horário" subtitle="Muda em Ajustes › Horários" value={formatTime(scheduleTime)} chevron={false} />
        ) : (
          <Row
            title="Horário"
            trailing={
              <TimeValue
                kind="time"
                label="Horário da meta"
                value={g.time ?? '07:00'}
                onChange={(t) => setGoal({ time: t })}
              />
            }
          />
        )}
        <GoalStepper
          label="Tolerância"
          value={g.toleranceMin ?? 15}
          step={5}
          min={0}
          max={120}
          unit="min"
          caption="para mais ou para menos"
          onChange={(v) => setGoal({ toleranceMin: v })}
        />
      </div>
    );
  } else if (form.type === 'weekly') {
    meta = (
      <div className="pk-lg st-meta">
        <GoalStepper
          value={g.perWeek ?? 1}
          step={1}
          max={7}
          caption={(g.perWeek ?? 1) === 1 ? 'vez por semana' : 'vezes por semana'}
          onChange={(v) => setGoal({ perWeek: v })}
        />
      </div>
    );
  } else if (guided && form.training) {
    // treinos por semana e os nomes do esforço e do descanso (o resto do treino fica no plano)
    const perWeek = g.perWeek ?? 2;
    meta = (
      <div className="pk-lg st-meta">
        <GoalStepper
          label="Treinos por semana"
          value={perWeek}
          step={1}
          max={7}
          caption={perWeek === 1 ? 'treino por semana' : 'treinos por semana'}
          onChange={(v) => setGoal({ perWeek: v })}
        />
        <Row
          title="Esforço"
          subtitle="O que você faz nos blocos fortes"
          value={form.training.effort}
          label={`Esforço, ${form.training.effort}. Mudar o nome`}
          onClick={() => openName('effort')}
        />
        <Row
          title="Descanso"
          subtitle="Entre um esforço e outro"
          value={form.training.rest}
          label={`Descanso, ${form.training.rest}. Mudar o nome`}
          onClick={() => openName('rest')}
        />
      </div>
    );
  } else if (form.type === 'budget') {
    meta = (
      <div className="pk-lg st-meta">
        <GoalStepper
          label="Limite"
          value={g.perWeek ?? 2}
          step={1}
          max={14}
          caption="por semana, no máximo"
          onChange={(v) => setGoal({ perWeek: v })}
        />
      </div>
    );
  } else if (form.type === 'number') {
    meta = (
      <div className="pk-lg st-meta">
        <Row title="Unidade" value={unitLabel(g.unit)} onClick={() => setSheet('unit')} />
      </div>
    );
  } else if (form.type === 'check' && (g.perWeek || g.value)) {
    // editar um "sim ou não" com meta da semana ou duração (a caminhada: 20 min, 6 de 7)
    meta = (
      <div className="pk-lg st-meta">
        {g.perWeek ? (
          <GoalStepper
            value={g.perWeek}
            step={1}
            max={7}
            caption="dias por semana"
            onChange={(v) => setGoal({ perWeek: v })}
          />
        ) : null}
        {g.value ? (
          <>
            <GoalStepper
              label="Duração"
              value={g.value}
              step={stepFor(g.unit)}
              unit={g.unit}
              caption="por dia"
              onChange={(v) => setGoal({ value: v })}
            />
            <Row
              title="Mínimo para parcial"
              value={g.partialMin ? goalAmount(g.partialMin, g.unit) : 'Desligado'}
              onClick={() => setSheet('partial')}
            />
          </>
        ) : null}
      </div>
    );
  }

  const showDays = form.type !== 'daysSince' && form.type !== 'budget';
  const fixedDays = editing?.schedule.useCollectionDays;
  const unitChoices: Choice<string>[] = [
    ...(form.type === 'number'
      ? [
          { value: 'kg', label: 'quilos (kg)' },
          { value: 'cm', label: 'centímetros (cm)' },
          { value: 'min', label: 'minutos' },
          { value: 'vezes', label: 'vezes' },
        ]
      : UNITS.map((u) => ({ value: u.value, label: u.label }))),
    { value: '__outra', label: 'Outra', detail: 'Escreva a sua' },
  ];

  const planWeekCount = form.training ? planWeeks(form.training).length : 0;
  const planTemplate = form.training ? templateOf(form.training) : null;

  return (
    <FullScreen
      top={
        planOpen && form.training ? (
          <NavBar back={isNew ? 'Novo hábito' : 'Editar hábito'} onBack={closePlan} title="Plano" />
        ) : isNew ? (
          <NavBar
            back="Tipo"
            onBack={toType}
            title="Novo hábito"
            action={{ label: 'Criar', disabled: !canSave, onClick: () => void save() }}
          />
        ) : (
          <NavBar
            cancel
            title="Editar hábito"
            onBack={() => goBack(`/ajustes/habitos/${encodeURIComponent(editing!.id)}`)}
            action={{ label: 'Salvar', disabled: !canSave, onClick: () => void save() }}
          />
        )
      }
    >
      <AnimatePresence mode="wait" initial={false} custom={partDir}>
        {planOpen && form.training ? (
          <m.div
            key="plano"
            className="st-tp-host"
            custom={partDir}
            variants={reduced ? reducedPartVariants : partVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <PartStart scrollTo={partScroll} />
            <TrainingPlanEditor
              plan={form.training}
              onChange={(t) => update({ training: t })}
              perWeek={g.perWeek ?? 2}
              pillar={color}
              name={form.name}
            />
          </m.div>
        ) : (
      // o formulário (o conteúdo fica no recuo de antes; a parte do plano entra no lugar dele)
      <m.div
        key="formulario"
        ref={bodyRef}
        className="st-screen"
        custom={partDir}
        variants={reduced ? reducedPartVariants : partVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        <PartStart scrollTo={partScroll} />
        <SectionLabel trailing={previewLabel(form)}>Prévia no Hoje</SectionLabel>
        <div className="st-pad">
          <HabitPreview
            form={form}
            pillar={color}
            icon={icon}
            scheduleTime={scheduleTime}
            onPickIcon={() => setSheet('icon')}
          />
        </div>

        <SectionLabel>Nome</SectionLabel>
        <div className="st-pad" ref={nameWrap}>
          <TextField
            label="Nome"
            hideLabel
            value={form.name}
            onChange={(v) => update({ name: v })}
            placeholder={form.type === 'guided' ? 'Corrida, Bicicleta, Natação…' : 'Proteína, Leitura, Louça…'}
            enterKeyHint="done"
            maxLength={40}
          />
        </div>

        {meta && (
          <>
            <SectionLabel>{guided ? 'Treino' : 'Meta'}</SectionLabel>
            <div className="st-pad">{meta}</div>
          </>
        )}

        {guided && form.training && (
          <>
            <SectionLabel trailing={planTemplate ? 'modelo pronto' : undefined}>Plano</SectionLabel>
            <div className="st-pad">
              <ListGroup>
                <Row
                  title="Plano"
                  subtitle={planTemplate ? planTemplate.name : planShape(form.training)}
                  value={`${planWeekCount} ${planWeekCount === 1 ? 'semana' : 'semanas'}`}
                  label={`Plano, ${planWeekCount} ${planWeekCount === 1 ? 'semana' : 'semanas'}. ${
                    planTemplate ? planTemplate.name : planShape(form.training)
                  }. Editar o plano`}
                  onClick={openPlan}
                />
              </ListGroup>
            </div>
            <Foot>{`${aroundText(form.training.warmupMin, form.training.cooldownMin)} No plano, cada semana tem os blocos de ${form.training.effort.toLocaleLowerCase('pt-BR')} e ${form.training.rest.toLocaleLowerCase('pt-BR')}.`}</Foot>
          </>
        )}

        {form.type === 'counter' && (
          <>
            <SectionLabel trailing={form.quickAdds.length ? String(form.quickAdds.length) : undefined}>
              Botões rápidos
            </SectionLabel>
            <div className="st-pad">
              <QuickAddsEditor
                items={form.quickAdds}
                unit={g.unit}
                pillar={color}
                onChange={(q) => update({ quickAdds: q })}
              />
            </div>
            <Foot>O Hoje mostra 3 por vez, os mais usados naquela hora. Toque num botão para editar ou apagar.</Foot>
          </>
        )}

        {form.type === 'checklist' && (
          <>
            <SectionLabel trailing={form.checklist.length ? String(form.checklist.length) : undefined}>
              Passos
            </SectionLabel>
            <div className="st-pad">
              <ChecklistEditor items={form.checklist} onChange={(c) => update({ checklist: c })} />
            </div>
          </>
        )}

        <SectionLabel trailing="pode deixar assim">Onde e quando</SectionLabel>
        <div className="st-pad">
          <ListGroup>
            <Row
              title="Pilar"
              value={
                pillar ? (
                  <>
                    <Dot color={pillar.color} />
                    {pillar.name}
                  </>
                ) : (
                  'Escolher'
                )
              }
              label={`Pilar, ${pillar?.name ?? 'nenhum'}`}
              onClick={() => setSheet('pillar')}
            />
            <Row title="Momento do dia" value={momentLabel(form.moment)} onClick={() => setSheet('moment')} />
            {showDays &&
              (fixedDays ? (
                <Row title="Dias" subtitle="Muda em Ajustes › Horários" value="Dias de coleta" chevron={false} />
              ) : (
                <Row
                  title={guided ? 'Dias de treino' : 'Dias'}
                  value={
                    guided
                      ? scheduleLabel(form.days, form.time)
                      : form.days.length === 7
                        ? 'Todos os dias'
                        : daysLabel(form.days)
                  }
                  onClick={() => {
                    setDays(form.days);
                    setTime(form.time ?? '07:00');
                    setSheet('days');
                  }}
                />
              ))}
            {isNew ? (
              <Row title="Começa" value={startLabel} onClick={() => setSheet('start')} />
            ) : form.phase !== null && phaseChoices.length ? (
              <Row title="Fase" value={`Fase ${form.phase}`} onClick={() => setSheet('phase')} />
            ) : null}
          </ListGroup>
        </div>
        <div className="st-form-end" />
      </m.div>
        )}
      </AnimatePresence>

      {/* ---------- folhas ---------- */}
      <Sheet open={sheet === 'icon'} onOpenChange={(v) => !v && setSheet(null)} title="Ícone" tall>
        <div className="hued" data-hue={color}>
          <IconPicker
            value={icon}
            suggested={name ? suggestCategory(name) : null}
            onChange={(i) => {
              update({ icon: i, iconChosen: true });
              setTimeout(() => setSheet(null), 200);
            }}
          />
        </div>
      </Sheet>
      <ChoiceSheet
        open={sheet === 'pillar'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Pilar"
        value={form.pillarId}
        options={pillars.map((p) => ({ value: p.id, label: p.name, icon: p.icon, pillar: p.color }))}
        onChange={(v) => update({ pillarId: v })}
      />
      <ChoiceSheet
        open={sheet === 'moment'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Momento do dia"
        value={form.moment}
        options={MOMENTS.map((m) => ({ value: m.value, label: m.label }))}
        onChange={(v) => update({ moment: v })}
      />
      <Sheet
        open={sheet === 'days'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={guided ? 'Dias de treino' : 'Dias'}
        footer={
          <Button
            wide
            disabled={!days.length}
            onClick={() => {
              update(guided ? { days, time } : { days });
              setSheet(null);
            }}
          >
            Pronto
          </Button>
        }
      >
        <div className="st-field-row">
          {guided && (
            <p className="lead" style={{ margin: 0 }}>
              {`${g.perWeek ?? 2} ${(g.perWeek ?? 2) === 1 ? 'treino' : 'treinos'} por semana. Um dia de descanso entre eles ajuda o corpo a se recuperar.`}
            </p>
          )}
          <DayPicker
            value={days}
            onChange={(d) => setDays(d as Weekday[])}
            pillar={color}
            label={guided ? 'Dias de treino' : 'Dias do hábito'}
          />
          {guided ? (
            <div className="st-tp-time">
              <span>Horário</span>
              <TimeValue
                kind="time"
                value={time}
                onChange={setTime}
                label="Horário do treino"
                display={formatTime(time)}
              />
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDays([...ALL_WEEKDAYS])}>
              Todos os dias
            </Button>
          )}
        </div>
      </Sheet>
      <Sheet
        open={sheet === 'name'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={nameKind === 'rest' ? 'Descanso' : 'Esforço'}
        keyboardAware
        footer={
          <Button
            wide
            disabled={!nameDraft.trim()}
            onClick={() => {
              if (form.training) update({ training: { ...form.training, [nameKind]: nameDraft.trim() } });
              setSheet(null);
            }}
          >
            Pronto
          </Button>
        }
      >
        <div className="st-field-row">
          <TextField
            label={nameKind === 'rest' ? 'Nome do descanso' : 'Nome do esforço'}
            value={nameDraft}
            onChange={setNameDraft}
            placeholder={nameKind === 'rest' ? 'Caminhar, Pedalar leve, Descansar…' : 'Correr, Pedalar, Nadar…'}
            enterKeyHint="done"
            maxLength={24}
          />
          <p className="foot st-foot">
            {nameKind === 'rest'
              ? 'Aparece no treino entre os esforços: "Depois: caminhar 1:30".'
              : 'Aparece no treino em letra grande enquanto o bloco dura, e nos avisos de cada troca.'}
          </p>
        </div>
      </Sheet>
      <ChoiceSheet
        open={sheet === 'start'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Começa"
        value={startValue}
        options={startChoices}
        onChange={(v) => update({ start: v.startsWith('f') ? Number(v.slice(1)) : v })}
      />
      <ChoiceSheet
        open={sheet === 'phase'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Fase"
        value={form.phase !== null ? String(form.phase) : undefined}
        options={phaseChoices}
        onChange={(v) => update({ phase: Number(v) })}
      />
      <ChoiceSheet
        open={sheet === 'unit'}
        onOpenChange={(v) => !v && setSheet((s) => (s === 'unit' ? null : s))}
        title="Unidade"
        value={g.unit && unitChoices.some((u) => u.value === g.unit) ? g.unit : g.unit ? '__outra' : undefined}
        options={unitChoices}
        onChange={(v) => {
          if (v === '__outra') {
            setOtherUnit(g.unit && !unitChoices.some((u) => u.value === g.unit) ? g.unit : '');
            setTimeout(() => setSheet('unitOther'), 220);
            return;
          }
          const step = stepFor(v);
          setGoal({
            unit: v,
            ...(form.type === 'counter' && g.value !== undefined ? { value: Math.max(step, g.value) } : {}),
          });
        }}
      />
      <Sheet
        open={sheet === 'unitOther'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Outra unidade"
        keyboardAware
        footer={
          <Button
            wide
            disabled={!otherUnit.trim()}
            onClick={() => {
              setGoal({ unit: otherUnit.trim() });
              setSheet(null);
            }}
          >
            Pronto
          </Button>
        }
      >
        <TextField
          label="Unidade"
          value={otherUnit}
          onChange={setOtherUnit}
          placeholder="copos, km, capítulos…"
          maxLength={16}
        />
      </Sheet>
      <Sheet
        open={sheet === 'partial'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Mínimo para parcial"
        footer={
          <Button wide onClick={() => setSheet(null)}>
            Pronto
          </Button>
        }
      >
        <div className="st-field-row">
          <p className="lead" style={{ margin: 0 }}>
            Abaixo da meta e a partir do mínimo, o dia conta como parcial: meio cheio no calendário.
          </p>
          <div className="pk-lg st-meta">
            <GoalStepper
              label="Mínimo"
              value={g.partialMin ?? Math.max(stepFor(g.unit), Math.round((g.value ?? 2) / 2))}
              step={stepFor(g.unit)}
              max={Math.max(stepFor(g.unit), (g.value ?? 1) - stepFor(g.unit))}
              unit={g.unit}
              caption="conta como parcial"
              onChange={(v) => setGoal({ partialMin: v })}
            />
          </div>
          {g.partialMin ? (
            <Button variant="ghost" size="sm" onClick={() => setGoal({ partialMin: undefined })}>
              Sem mínimo
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGoal({ partialMin: Math.max(stepFor(g.unit), Math.round((g.value ?? 2) / 2)) })}
            >
              Usar este mínimo
            </Button>
          )}
        </div>
      </Sheet>
      <RampSheet
        open={sheet === 'ramp'}
        onOpenChange={(v) => !v && setSheet(null)}
        goal={g}
        step={unitStep}
        onChange={(ramp) => setGoal({ ramp })}
      />
    </FullScreen>
  );
}
