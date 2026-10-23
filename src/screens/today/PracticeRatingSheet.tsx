// A folha da "Primeira nota" (?folha=primeira-nota), aberta pela linha dos Primeiros passos no Hoje: o mesmo jeito
// de dar nota das refeições (MealRatingSheet), com as cinco opções grandes e "Salvar nota 4", sem os chips do prato.
// A nota fica na linha de treino (src/stores/practice.ts); só a primeira vai para o perfil.
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useRef, useState } from 'react';
import { Sheet, type SheetScreenProps } from '@/components/shell';
import { Button, Radio } from '@/components/ui';
import { MEAL_WORDS } from '@/data';
import { usePractice } from '@/stores/practice';
import type { FirstStepRating } from '@/types';
import { Painted, SheetTitle } from '@/screens/sheets/parts';
import { practiceRateWith } from './practiceActions';
import './today.css';

export default function PracticeRatingSheet({ close }: SheetScreenProps) {
  const [rating, setRating] = useState<FirstStepRating | undefined>(() => usePractice.getState().rating ?? undefined);
  const saving = useRef(false);
  const title = 'Primeira nota';

  function save() {
    if (rating === undefined || saving.current) return;
    saving.current = true;
    close();
    practiceRateWith(rating);
  }

  return (
    <Sheet
      title={
        <SheetTitle icon="star" pillar="accent">
          {title}
        </SheetTitle>
      }
      label={title}
      className="rg-sheet"
      footer={
        <Button wide aria-disabled={rating === undefined} onClick={save} data-tour="pp-rate-save">
          {rating === undefined ? 'Escolha uma nota' : `Salvar nota ${rating}`}
        </Button>
      }
    >
      <Painted pillar="accent" className="rg-stack">
        <p className="rg-foot td-pp-note">Do mesmo jeito das refeições, de 1 a 5. Não entra nos seus números.</p>
        <RadioGroup
          value={rating ?? null}
          onValueChange={(v) => setRating(v as FirstStepRating)}
          aria-label="Primeira nota"
          className="rg-opts"
          data-tour="pp-rate-options"
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
      </Painted>
    </Sheet>
  );
}
