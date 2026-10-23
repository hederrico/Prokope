// Peças do formulário de hábito: a prévia no Hoje, a escada do "Subir aos poucos" (GoalRamp), os botões rápidos
// editáveis e a lista de passos, cada um com a sua folha (ajustes-plano.md › Novo hábito · detalhes).
import clsx from 'clsx';
import { useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Sheet, showUndo } from '@/components/shell';
import { Button, Card, GoalBar, PillarBubble, TextField, pillarAttrs, type PillarColor } from '@/components/ui';
import { formatNumber, formatTime } from '@/data';
import { Icon, type IconName } from '@/icons';
import { dur, ease, spring, tween } from '@/motion/tokens';
import type { ChecklistItem, HabitGoal, QuickAdd } from '@/types';
import { goalAmount } from './habitText';
import { rampSteps, unitName, type FormState } from './habitForm';
import { GoalStepper } from './GoalStepper';
import './settings.css';

let localId = 0;
const newLocalId = () => `novo-${Date.now().toString(36)}-${++localId}`;

// ---------- prévia ----------

/** O mesmo cartão do Hoje, com o lápis que troca o ícone. É aria-hidden: repete os campos. */
export function HabitPreview({
  form,
  pillar,
  icon,
  scheduleTime,
  onPickIcon,
}: {
  form: FormState;
  pillar: PillarColor | undefined;
  icon: IconName;
  /** horário da meta quando vem de Horários */
  scheduleTime?: string;
  onPickIcon: () => void;
}) {
  const g = form.goal;
  const name = form.name.trim();
  let right: React.ReactNode;
  if (form.type === 'counter' && g.value) {
    // unidade curta junto do número ("0 g de 80 g"); palavra só no fim ("0 de 5 vezes")
    const short = !!g.unit && g.unit.length <= 3;
    right = (
      <span className="st-pv-val num">
        <b>{short ? goalAmount(0, g.unit) : '0'}</b> <span className="faint">de {goalAmount(g.value, g.unit)}</span>
      </span>
    );
  } else if (form.type === 'time') {
    const t = scheduleTime ?? g.time;
    right = t ? <span className="st-pv-val faint">meta {formatTime(t)}</span> : null;
  } else if (form.type === 'weekly' || form.type === 'budget') {
    right = (
      <span className="st-pv-val num">
        <b>0</b> <span className="faint">de {g.perWeek ?? 0} na semana</span>
      </span>
    );
  } else if (form.type === 'checklist') {
    right = (
      <span className="st-pv-val num">
        <b>0</b> <span className="faint">de {form.checklist.length} passos</span>
      </span>
    );
  } else if (form.type === 'daysSince') {
    right = <span className="st-pv-val faint">0 dias</span>;
  } else if (form.type === 'rating') {
    right = <span className="st-pv-val faint">Dar nota</span>;
  } else if (form.type === 'number') {
    right = <span className="st-pv-val faint">— {g.unit ?? ''}</span>;
  } else {
    right = (
      <span className="pk-chk" aria-hidden="true" style={{ width: 28, height: 28 }}>
        <Icon name="check" weight="bold" />
      </span>
    );
  }
  return (
    <Card padded pillar={pillar} className="st-pv">
      <div className="st-pv-top">
        <span>
          <button type="button" className="pk-reset st-pvb-btn hit" aria-label="Trocar o ícone" onClick={onPickIcon}>
            <span className="st-pvb">
              <PillarBubble icon={icon} pillar={pillar} size="sm" />
              <span className="st-pen" aria-hidden="true">
                <Icon name="pencil-simple" weight="bold" />
              </span>
            </span>
          </button>
          <b className={clsx('st-pvh', !name && 'ph')} aria-hidden="true">
            {name || 'Nome do hábito'}
          </b>
        </span>
        <span aria-hidden="true">{right}</span>
      </div>
      {form.type === 'counter' && g.value ? (
        <div aria-hidden="true">
          <GoalBar segments={[]} goal={g.value} unit={g.unit ?? ''} pillar={pillar} status={false} />
        </div>
      ) : null}
    </Card>
  );
}

// ---------- escada ----------

export function GoalRamp({ goal, pillar }: { goal: HabitGoal; pillar?: PillarColor }) {
  const ramp = goal.ramp;
  const steps = ramp && goal.value !== undefined ? rampSteps(goal.value, ramp) : [];
  const first = steps[0]?.value ?? 0;
  const last = steps[steps.length - 1]?.value ?? 1;
  const span = last - first || 1;
  const colorAttrs = pillarAttrs(pillar);
  return (
    <AnimatePresence initial={false}>
      {ramp && steps.length > 0 && (
        <m.div
          key="ramp"
          className="st-ramp"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1, transition: spring.calma }}
          exit={{ height: 0, opacity: 0, transition: tween.base }}
        >
          <div
            className={clsx('st-stairs', colorAttrs.className)}
            aria-hidden="true"
            data-pillar={colorAttrs['data-pillar']}
            data-hue={colorAttrs['data-hue']}
          >
            {steps.map((s, i) => (
              <div key={`${i}-${s.value}`}>
                <m.i
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: dur.fill, ease: ease.out, delay: i * 0.03 }}
                  style={{ height: 14 + Math.round(((s.value - first) / span) * 24) }}
                />
                <b>{goalAmount(s.value, goal.unit)}</b>
                <small>{s.when}</small>
              </div>
            ))}
          </div>
          <p className="cap st-ask">
            <Icon name="calendar-check" weight="regular" />
            <span>A revisão da semana pergunta antes de cada subida.</span>
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/** A folha da subida: degrau, intervalo e teto. */
export function RampSheet({
  open,
  onOpenChange,
  goal,
  step,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: HabitGoal;
  step: number;
  onChange: (ramp: NonNullable<HabitGoal['ramp']>) => void;
}) {
  const ramp = goal.ramp;
  if (!ramp) return null;
  const value = goal.value ?? 0;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Subir aos poucos"
      footer={
        <Button wide onClick={() => onOpenChange(false)}>
          Pronto
        </Button>
      }
    >
      <div className="pk-lg st-meta">
        <GoalStepper
          label="Degrau"
          value={ramp.step}
          step={step}
          unit={goal.unit}
          caption="a cada subida"
          onChange={(v) => onChange({ ...ramp, step: v, max: Math.max(ramp.max, value + v) })}
        />
        <GoalStepper
          label="Intervalo"
          value={ramp.everyWeeks}
          step={1}
          max={12}
          caption={ramp.everyWeeks === 1 ? 'semana' : 'semanas'}
          onChange={(v) => onChange({ ...ramp, everyWeeks: v })}
        />
        <GoalStepper
          label="Teto"
          value={ramp.max}
          step={step}
          min={value + ramp.step}
          unit={goal.unit}
          caption="até onde sobe"
          onChange={(v) => onChange({ ...ramp, max: v })}
        />
      </div>
    </Sheet>
  );
}

// ---------- botões rápidos ----------

export function QuickAddsEditor({
  items,
  unit,
  pillar,
  onChange,
}: {
  items: QuickAdd[];
  unit?: string;
  pillar?: PillarColor;
  onChange: (next: QuickAdd[]) => void;
}) {
  const [editing, setEditing] = useState<QuickAdd | 'new' | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const open = (q: QuickAdd | 'new') => {
    setEditing(q);
    setName(q === 'new' ? '' : q.name);
    setAmount(q === 'new' ? '' : formatNumber(q.amount, 2));
  };
  const parsed = Number(amount.replace(',', '.'));
  const valid = !!name.trim() && Number.isFinite(parsed) && parsed > 0;
  const save = () => {
    if (!valid || !editing) return;
    if (editing === 'new')
      onChange([
        ...items,
        { id: newLocalId(), name: name.trim(), amount: parsed, hours: ['morning', 'midday', 'evening'] },
      ]);
    else onChange(items.map((q) => (q.id === editing.id ? { ...q, name: name.trim(), amount: parsed } : q)));
    setEditing(null);
  };
  const remove = () => {
    if (!editing || editing === 'new') return;
    const before = items;
    const gone = editing;
    onChange(items.filter((q) => q.id !== gone.id));
    setEditing(null);
    showUndo({ title: `${gone.name} apagado`, icon: 'trash-simple' }, () => onChange(before));
  };
  const attrs = pillarAttrs(pillar);
  return (
    <>
      <div
        className={clsx('pk-card st-qbs', attrs.className)}
        data-pillar={attrs['data-pillar']}
        data-hue={attrs['data-hue']}
      >
        <div className="st-qa">
          <AnimatePresence initial={false}>
            {items.map((q) => (
              <m.button
                key={q.id}
                layout
                type="button"
                className="pk-reset st-q-tile"
                aria-label={`Editar ${q.name}, ${formatNumber(q.amount, 2)} ${unitName(unit)}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: tween.base }}
                exit={{ opacity: 0, scale: 0.9, transition: tween.base }}
                transition={spring.calma}
                onClick={() => open(q)}
              >
                <b>{q.name}</b>
                <small>{goalAmount(q.amount, unit)}</small>
              </m.button>
            ))}
          </AnimatePresence>
          <m.button
            layout
            transition={spring.calma}
            type="button"
            className="pk-reset st-q-tile more"
            aria-label="Novo botão rápido"
            onClick={() => open('new')}
          >
            <Icon name="plus" weight="bold" />
            <small>Novo</small>
          </m.button>
        </div>
      </div>
      <Sheet
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={editing === 'new' ? 'Novo botão' : (editing?.name ?? '')}
        keyboardAware
        footer={
          <Button wide disabled={!valid} onClick={save}>
            {editing === 'new' ? 'Adicionar' : 'Pronto'}
          </Button>
        }
      >
        <div className="st-field-row">
          <TextField label="Nome" value={name} onChange={setName} placeholder="Ovo, copo, página…" maxLength={24} />
          <TextField
            label="Quantidade"
            value={amount}
            onChange={setAmount}
            inputMode="decimal"
            unit={unit}
            placeholder="6"
          />
          {editing !== 'new' && editing && (
            <Button variant="secondary" wide icon="trash-simple" className="st-warn-text" onClick={remove}>
              Apagar botão
            </Button>
          )}
        </div>
      </Sheet>
    </>
  );
}

// ---------- lista de passos ----------

export function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (next: ChecklistItem[]) => void;
}) {
  const [editing, setEditing] = useState<ChecklistItem | 'new' | null>(null);
  const [name, setName] = useState('');
  const open = (c: ChecklistItem | 'new') => {
    setEditing(c);
    setName(c === 'new' ? '' : c.name);
  };
  const save = () => {
    if (!name.trim() || !editing) return;
    if (editing === 'new') onChange([...items, { id: newLocalId(), name: name.trim() }]);
    else onChange(items.map((c) => (c.id === editing.id ? { ...c, name: name.trim() } : c)));
    setEditing(null);
  };
  const remove = () => {
    if (!editing || editing === 'new') return;
    const before = items;
    const gone = editing;
    onChange(items.filter((c) => c.id !== gone.id));
    setEditing(null);
    showUndo({ title: 'Passo apagado', detail: gone.name, icon: 'trash-simple' }, () => onChange(before));
  };
  return (
    <>
      {items.length > 0 && (
        <ul className="pk-lg">
          {items.map((c, i) => (
            <li key={c.id}>
              <button type="button" className="pk-reset pk-li noic st-row" onClick={() => open(c)}>
                <span className="st-row-t">
                  <b>{`${i + 1}. ${c.name}`}</b>
                </span>
                <span className="rv">
                  <Icon name="caret-right" weight="bold" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="st-gap" />
      <button type="button" className="pk-reset pk-addrow pk-press" onClick={() => open('new')}>
        <span aria-hidden="true">
          <Icon name="plus" weight="bold" />
        </span>
        Novo passo
      </button>
      <Sheet
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={editing === 'new' ? 'Novo passo' : 'Passo'}
        keyboardAware
        footer={
          <Button wide disabled={!name.trim()} onClick={save}>
            {editing === 'new' ? 'Adicionar' : 'Pronto'}
          </Button>
        }
      >
        <div className="st-field-row">
          <TextField label="Passo" value={name} onChange={setName} placeholder="Luzes baixas à noite" maxLength={60} />
          {editing !== 'new' && editing && (
            <Button variant="secondary" wide icon="trash-simple" className="st-warn-text" onClick={remove}>
              Apagar passo
            </Button>
          )}
        </div>
      </Sheet>
    </>
  );
}
