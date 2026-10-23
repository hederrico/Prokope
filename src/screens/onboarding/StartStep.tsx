// Começar · 1 de 3 (entrada.md): "Com o plano base" (sugerido, já escolhido) ou "Do zero".
// Os cartões são um radiogroup "Como começar"; cada um é um radio com o texto inteiro. Entram em cascade.
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { m } from 'motion/react';
import { OptionGroup, PillarBubble, Radio, Tag } from '@/components/ui';
import { TEMPLATE_PHASES, TEMPLATE_PILLARS, defaultPlanDraft, type PlanDraft } from '@/data';
import { Icon } from '@/icons';
import { cascade, fadeUpItem } from '@/motion/tokens';
import { countChosen } from './plan';
import { StepHead } from './StepHead';
import { useFirstShow } from './useFirstShow';

export function StartStep({ draft, onMode }: { draft: PlanDraft; onMode: (mode: PlanDraft['mode']) => void }) {
  const animateIn = useFirstShow(1);
  const habits = countChosen(defaultPlanDraft('template'));
  const pillars = TEMPLATE_PILLARS.length;
  const baseText = `${pillars} pilares e ${habits} hábitos para começar. No próximo passo, você escolhe quais ficam.`;
  const zeroText = 'Você cria pilares e hábitos, um de cada vez.';
  const weeks = TEMPLATE_PHASES[0]?.weeks;

  return (
    <>
      <StepHead step={1} title="Como você quer começar?" lead="Dá para mudar tudo depois, em Ajustes." />
      <div className="ob-body">
        <OptionGroup<PlanDraft['mode']> value={draft.mode} onChange={onMode} label="Como começar" className="ob-opts">
          <m.div variants={cascade} initial={animateIn ? 'hidden' : false} animate="shown" className="pk-opts ob-opts">
            <m.div variants={fadeUpItem}>
              <BaseRadio.Root
                value="template"
                className="pk-reset pk-opt ob-opt"
                aria-label={`Com o plano base, sugerido. ${baseText}`}
              >
                <span>
                  <span className="ob-oh">
                    <PillarBubble icon="path" pillar="accent" />
                    <span>
                      <b>Com o plano base</b>
                      <Tag pillar="accent">Sugerido</Tag>
                    </span>
                  </span>
                  <span className="ob-od">{baseText}</span>
                  <span className="ob-pd">
                    {TEMPLATE_PILLARS.map((p) => (
                      <Tag key={p.key} pillar={p.color} dot>
                        {p.name}
                      </Tag>
                    ))}
                  </span>
                </span>
                <Radio />
              </BaseRadio.Root>
            </m.div>
            <m.div variants={fadeUpItem}>
              <BaseRadio.Root value="empty" className="pk-reset pk-opt ob-opt" aria-label={`Do zero. ${zeroText}`}>
                <span>
                  <span className="ob-oh">
                    <PillarBubble icon="pencil-simple-line" />
                    <span>
                      <b>Do zero</b>
                    </span>
                  </span>
                  <span className="ob-od">{zeroText}</span>
                </span>
                <Radio />
              </BaseRadio.Root>
            </m.div>
          </m.div>
        </OptionGroup>
        <p className="ob-note">
          <Icon name="footprints" weight="regular" />
          {weeks
            ? `Os hábitos chegam aos poucos, em fases de ${weeks} semanas. Você decide quando avançar.`
            : 'Os hábitos chegam aos poucos, em fases. Você decide quando avançar.'}
        </p>
      </div>
    </>
  );
}
