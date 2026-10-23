// Folha da nota da refeição (?folha=nota&refeicao=almoco|jantar): registros.md › Nota do almoço;
// quadro: f-registros.js › 4. Cinco opções grandes com número e palavra, os chips do prato (opcionais)
// e o botão que repete a nota ("Salvar nota 4"), grava (rate) e fecha.
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useRef, useState } from 'react';
import { rate } from '@/actions';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, Chip, ChipRow, Radio, SectionLabel } from '@/components/ui';
import { MEAL_WORDS, useHabitByRole, useHabitDay } from '@/data';
import { closeThenUndo } from './feedback';
import { DayNote, Painted, SheetTitle } from './parts';
import { useHabitPillar, useSheetDay } from './hooks';

/** Os chips do prato quando o hábito não traz os seus (a lista do hábito, em Ajustes, vale primeiro). */
const PLATE_TAGS = ['Proteína', 'Salada ou legume', 'Carboidrato', 'Sentado, sem tela'];

export default function MealRatingSheet({ params, close }: SheetScreenProps) {
  const dinner = params.get('refeicao') === 'jantar';
  const habit = useHabitByRole(dinner ? 'dinner' : 'lunch');
  const pillar = useHabitPillar(habit?.id);
  const sd = useSheetDay(params);
  const hd = useHabitDay(habit?.id, sd.day);
  const [rating, setRating] = useState<number | undefined>(() => hd?.mark?.rating);
  const [tags, setTags] = useState<string[]>(() => hd?.mark?.tags ?? []);
  const saving = useRef(false);

  if (!habit) {
    return (
      <Sheet title={dinner ? 'Jantar' : 'Almoço'}>
        <p className="rg-empty">Esta refeição não está no plano.</p>
      </Sheet>
    );
  }

  const meal = habit.name.toLocaleLowerCase('pt-BR');
  const base = habit.checklist.length ? habit.checklist.map((c) => c.name) : PLATE_TAGS;
  const options = [...new Set([...base, ...(hd?.mark?.tags ?? [])])];
  const title = `Como foi o ${meal}?`;

  async function save() {
    if (!habit || rating === undefined || saving.current) return;
    saving.current = true;
    const chosen = options.filter((o) => tags.includes(o));
    const undo = await rate(habit.id, sd.day, rating, { tags: chosen });
    closeThenUndo(
      close,
      { title: `${habit.name} · nota ${rating}`, detail: sd.label ?? undefined, pillar, icon: 'check' },
      undo,
    );
  }

  return (
    <Sheet
      title={
        <SheetTitle icon={habit.icon} pillar={pillar}>
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      footer={
        <Button wide aria-disabled={rating === undefined} onClick={() => void save()}>
          {rating === undefined ? 'Escolha uma nota' : `Salvar nota ${rating}`}
        </Button>
      }
    >
      <Painted pillar={pillar} className="rg-stack">
        <DayNote label={sd.label} />
        <RadioGroup
          value={rating ?? null}
          onValueChange={(v) => setRating(v as number)}
          aria-label={`Nota do ${meal}`}
          className="rg-opts"
        >
          {MEAL_WORDS.map((word, i) => (
            <BaseRadio.Root key={word} value={i + 1} aria-label={`${i + 1}, ${word}`} className="pk-opt pk-press">
              <span className="rg-o" aria-hidden="true">
                <span className="n">{i + 1}</span>
                {word}
              </span>
              <Radio />
            </BaseRadio.Root>
          ))}
        </RadioGroup>
        <div className="rg-grp">
          <SectionLabel inset level={3} trailing="opcional">
            {`Neste ${meal}`}
          </SectionLabel>
          <ChipRow className="rg-chips" label={`Neste ${meal}, opcional`}>
            {options.map((o) => (
              <Chip
                key={o}
                selected={tags.includes(o)}
                tint
                icon="plus"
                iconWeight="regular"
                onPressedChange={(on) => setTags((t) => (on ? [...t, o] : t.filter((x) => x !== o)))}
              >
                {o}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </Painted>
    </Sheet>
  );
}
