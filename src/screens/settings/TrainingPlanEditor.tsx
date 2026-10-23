// O editor do plano do Treino guiado (ajustes-plano.md › Plano do treino). Mora em dois lugares: no formulário do
// hábito (a linha "Plano · 13 semanas ›" empurra esta parte dentro da mesma tela cheia) e em Editar plano, a partir
// do plano na Jornada (/jornada/treino/:id/plano). É controlado: cada mudança volta por onChange, e quem hospeda
// decide quando gravar (Criar ou Salvar).
// O desenho segue o plano da Jornada: o resumo com as barrinhas, as semanas na mesma lista (número, blocos, barra do
// esforço) e, por semana, uma folha com o formato (repetições, sequência ou contínuo), os minutos com − e +,
// e "Duplicar" e "Remover". Remover e trocar de modelo avisam com Desfazer.
import { useState } from 'react';
import { Sheet, showUndo } from '@/components/shell';
import {
  AddRow,
  Button,
  Card,
  ListGroup,
  MiniBar,
  SectionLabel,
  SegmentedControl,
  type PillarColor,
} from '@/components/ui';
import { effortTimeLabel, gerund, namesOf, planWeeks, TRAINING_TEMPLATES, type TrainingNames } from '@/data';
import { Icon } from '@/icons';
import type { TrainingPlan, TrainingWeek } from '@/types';
import { aroundText, minutesOf, runWeekLabel } from '@/screens/journey/shared';
import { IntervalStrip } from '@/screens/run/IntervalStrip';
import { GoalStepper } from './GoalStepper';
import { ChoiceSheet, Foot, Row, type Choice } from './parts';
import {
  addWeek,
  applyTemplate,
  BLANK_KEY,
  convertWeek,
  duplicateWeek,
  planShape,
  removeWeek,
  setWeek,
  templateKey,
  type WeekKind,
} from './trainingEdit';
import '@/screens/journey/journey.css';
import './settings.css';
import './training.css';

const lower = (s: string) => s.toLocaleLowerCase('pt-BR');
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "8 min correndo", "8 min de trote". */
function effortShort(names: TrainingNames, seconds: number): string {
  const g = gerund(names.effort);
  return `${minutesOf(seconds)} min ${g ?? `de ${lower(names.effort)}`}`;
}

export interface TrainingPlanEditorProps {
  plan: TrainingPlan;
  onChange: (plan: TrainingPlan) => void;
  /** treinos por semana (só para a frase de cima) */
  perWeek: number;
  pillar?: PillarColor;
  /** o nome do hábito na frase de cima ("Bicicleta · 3 treinos por semana") */
  name?: string;
}

type SheetName = 'warmup' | 'cooldown' | 'template';

export function TrainingPlanEditor({ plan, onChange, perWeek, pillar, name }: TrainingPlanEditorProps) {
  const names = namesOf(plan);
  const weeks = planWeeks(plan);
  const [editing, setEditing] = useState<number | null>(null);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const maxEffort = Math.max(1, ...weeks.map((w) => w.effortSeconds));
  const tKey = templateKey(plan);
  const template = TRAINING_TEMPLATES.find((t) => t.key === tKey);

  const templateChoices: Choice<string>[] = [
    ...TRAINING_TEMPLATES.map((t) => ({ value: t.key, label: t.name, detail: planShape(t.plan) })),
    { value: BLANK_KEY, label: 'Montar do zero', detail: 'Começa com 1 semana, para você montar do seu jeito' },
  ];

  const useTemplate = (key: string) => {
    if (key === tKey) return;
    const before = plan;
    onChange(applyTemplate(plan, key));
    const name = templateChoices.find((c) => c.value === key)?.label ?? '';
    showUndo({ title: 'Plano trocado', detail: name, icon: 'repeat', pillar }, () => onChange(before));
  };

  return (
    <div className="st-screen st-tp">
      <div className="st-pad">
        <p className="sub muted st-tp-lede">
          {`${name?.trim() ? `${name.trim()} · ` : ''}${plural(perWeek, 'treino', 'treinos')} por semana. Toque numa semana para mudar os blocos, duplicar ou remover.`}
        </p>
        <Card padded pillar={pillar} className="st-tp-sum">
          <span className="jr-spark" aria-hidden="true">
            {weeks.map((w) => (
              <i
                key={w.week}
                className={w.week === weeks.length ? 'on' : undefined}
                style={{ height: `${(w.effortSeconds / maxEffort) * 100}%` }}
              />
            ))}
          </span>
          <p className="cap">
            <b>{template ? template.name : 'Seu plano'}</b>
            {planShape(plan)}
          </p>
        </Card>
      </div>

      <SectionLabel>Em todo treino</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <Row
            title="Aquecimento"
            value={plan.warmupMin > 0 ? `${minutesOf(plan.warmupMin * 60)} min` : 'Sem'}
            onClick={() => setSheet('warmup')}
          />
          <Row
            title="Volta à calma"
            value={plan.cooldownMin > 0 ? `${minutesOf(plan.cooldownMin * 60)} min` : 'Sem'}
            onClick={() => setSheet('cooldown')}
          />
        </ListGroup>
      </div>

      <SectionLabel trailing={effortTimeLabel(names)}>
        {weeks.length === 1 ? 'A semana' : `As ${weeks.length} semanas`}
      </SectionLabel>
      <div className="st-pad">
        <Card pillar={pillar}>
          <ul className="jr-weeks" aria-label="Semanas do plano">
            {weeks.map((w, i) => (
              <li key={w.week}>
                <button
                  type="button"
                  className="jr-wr st-tp-wr"
                  aria-label={`${w.description} Editar`}
                  onClick={() => setEditing(i)}
                >
                  <span className="jr-wn" aria-hidden="true">
                    {w.week}
                  </span>
                  <span>
                    <b>{runWeekLabel(w)}</b>
                    <small className="st-tp-tot">{minutesOf(w.totalSeconds)} min no total</small>
                  </span>
                  <MiniBar value={(w.effortSeconds / maxEffort) * 100} pillar={pillar} />
                  <span className="cap num st-tp-min" aria-hidden="true">
                    {minutesOf(w.effortSeconds)} min
                    <Icon name="caret-right" weight="bold" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <div className="st-gap" />
        <AddRow
          onClick={() => {
            onChange(addWeek(plan));
            setEditing(weeks.length);
          }}
        >
          Adicionar semana
        </AddRow>
      </div>
      <Foot>{aroundText(plan.warmupMin, plan.cooldownMin)}</Foot>

      <SectionLabel>Modelo</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <Row
            icon="sparkle"
            pillar={pillar}
            title="Começar de um modelo"
            subtitle={template ? `Agora: ${template.name}` : 'Troca as semanas; os nomes ficam'}
            onClick={() => setSheet('template')}
          />
        </ListGroup>
      </div>

      <WeekSheet index={editing} plan={plan} pillar={pillar} onChange={onChange} onClose={() => setEditing(null)} />
      <MinutesSheet
        open={sheet === 'warmup'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Aquecimento"
        caption="antes dos blocos"
        value={plan.warmupMin}
        onChange={(v) => onChange({ ...plan, warmupMin: v })}
      />
      <MinutesSheet
        open={sheet === 'cooldown'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Volta à calma"
        caption="depois dos blocos"
        value={plan.cooldownMin}
        onChange={(v) => onChange({ ...plan, cooldownMin: v })}
      />
      <ChoiceSheet
        open={sheet === 'template'}
        onOpenChange={(v) => !v && setSheet(null)}
        title="Começar de um modelo"
        value={tKey}
        options={templateChoices}
        onChange={useTemplate}
      />
    </div>
  );
}

/** Aquecimento ou volta à calma: minutos com − e + (0 = sem). */
function MinutesSheet({
  open,
  onOpenChange,
  title,
  caption,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  caption: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <Button wide onClick={() => onOpenChange(false)}>
          Pronto
        </Button>
      }
    >
      <div className="st-field-row">
        <div className="pk-lg st-meta">
          <GoalStepper
            label={title}
            value={value}
            step={1}
            min={0}
            max={30}
            unit="min"
            caption={value === 0 ? `sem ${lower(title)}` : caption}
            onChange={onChange}
          />
        </div>
        <p className="foot st-foot">Vale para todo treino do plano. Com 0, o treino vai direto aos blocos.</p>
      </div>
    </Sheet>
  );
}

const KINDS: { value: WeekKind; label: string }[] = [
  { value: 'repeat', label: 'Repetições' },
  { value: 'sequence', label: 'Sequência' },
  { value: 'continuous', label: 'Contínuo' },
];

/** A folha de uma semana: a fileira de blocos, o formato, os minutos, e Duplicar ou Remover. */
function WeekSheet({
  index,
  plan,
  pillar,
  onChange,
  onClose,
}: {
  index: number | null;
  plan: TrainingPlan;
  pillar?: PillarColor;
  onChange: (plan: TrainingPlan) => void;
  onClose: () => void;
}) {
  // a última semana aberta fica desenhada enquanto a folha desce
  const [shown, setShown] = useState<number | null>(index);
  if (index !== null && index !== shown) setShown(index);
  const i = index ?? shown;
  const names = namesOf(plan);
  const weeks = planWeeks(plan);
  const spec: TrainingWeek | undefined = i !== null ? plan.weeks[i] : undefined;
  const built = i !== null ? weeks[i] : undefined;
  const set = (w: TrainingWeek) => i !== null && onChange(setWeek(plan, i, w));
  const e = lower(names.effort);
  const r = lower(names.rest);

  const duplicate = () => {
    if (i === null) return;
    const before = plan;
    onChange(duplicateWeek(plan, i));
    onClose();
    showUndo({ title: `Semana ${i + 1} duplicada`, detail: `A cópia é a semana ${i + 2}`, icon: 'copy', pillar }, () =>
      onChange(before),
    );
  };
  const remove = () => {
    if (i === null || plan.weeks.length <= 1) return;
    const before = plan;
    onChange(removeWeek(plan, i));
    onClose();
    showUndo({ title: `Semana ${i + 1} removida`, icon: 'trash-simple', pillar }, () => onChange(before));
  };

  return (
    <Sheet
      open={index !== null}
      onOpenChange={(v) => !v && onClose()}
      title={i !== null ? `Semana ${i + 1}` : 'Semana'}
      footer={
        <Button wide onClick={onClose}>
          Pronto
        </Button>
      }
    >
      {spec && built && (
        <div className="st-field-row st-tp-week">
          <Card padded pillar={pillar} className="st-tp-prev">
            <IntervalStrip blocks={built.blocks} />
            <p className="cap num">
              {`${minutesOf(built.totalSeconds)} min no total · ${effortShort(names, built.effortSeconds)}`}
            </p>
            <span className="pk-sr">{built.description}</span>
          </Card>
          <SegmentedControl
            label="Formato da semana"
            options={KINDS}
            value={spec.kind}
            onChange={(k) => set(convertWeek(spec, k))}
          />
          <div className="pk-lg st-meta">
            {spec.kind === 'repeat' && (
              <>
                <GoalStepper
                  label="Repetições"
                  value={spec.repeat}
                  step={1}
                  min={1}
                  max={30}
                  caption={spec.repeat === 1 ? 'vez' : 'vezes'}
                  onChange={(v) => set({ ...spec, repeat: v })}
                />
                <GoalStepper
                  label={names.effort}
                  value={spec.effort}
                  step={0.5}
                  min={0.5}
                  max={60}
                  unit="min"
                  caption={`${e}, a cada vez`}
                  onChange={(v) => set({ ...spec, effort: v })}
                />
                <GoalStepper
                  label={names.rest}
                  value={spec.rest}
                  step={0.5}
                  min={0.5}
                  max={30}
                  unit="min"
                  caption={`${r}, a cada vez`}
                  onChange={(v) => set({ ...spec, rest: v })}
                />
              </>
            )}
            {spec.kind === 'sequence' &&
              spec.steps.map((m, k) => (
                <GoalStepper
                  key={k}
                  label={`${k % 2 === 0 ? names.effort : names.rest}, bloco ${k + 1}`}
                  value={m}
                  step={0.5}
                  min={0.5}
                  max={120}
                  unit="min"
                  caption={`${k + 1}º · ${k % 2 === 0 ? e : r}`}
                  onChange={(v) => set({ ...spec, steps: spec.steps.map((x, j) => (j === k ? v : x)) })}
                />
              ))}
            {spec.kind === 'continuous' && (
              <GoalStepper
                label={names.effort}
                value={spec.minutes}
                step={1}
                min={1}
                max={180}
                unit="min"
                caption={`${e} sem parar`}
                onChange={(v) => set({ ...spec, minutes: v })}
              />
            )}
          </div>
          {spec.kind === 'sequence' && (
            <div className="st-tp-seq">
              <AddRow onClick={() => set({ ...spec, steps: [...spec.steps, spec.steps[spec.steps.length - 2] ?? 1] })}>
                {`Mais um bloco de ${spec.steps.length % 2 === 0 ? e : r}`}
              </AddRow>
              {spec.steps.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => set({ ...spec, steps: spec.steps.slice(0, -1) })}>
                  Tirar o último bloco
                </Button>
              )}
            </div>
          )}
          <div className="st-tp-acts">
            <Button variant="secondary" icon="copy" onClick={duplicate}>
              Duplicar
            </Button>
            <Button
              variant="secondary"
              icon="trash-simple"
              className="st-warn-text"
              disabled={plan.weeks.length <= 1}
              onClick={remove}
            >
              Remover
            </Button>
          </div>
          {plan.weeks.length <= 1 && <p className="foot st-foot">O plano precisa de pelo menos uma semana.</p>}
        </div>
      )}
    </Sheet>
  );
}
