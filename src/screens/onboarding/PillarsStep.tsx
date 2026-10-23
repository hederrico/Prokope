// Seus pilares · 2 de 3 (entrada.md): cada pilar com o interruptor "no plano" e os hábitos da fase 1 em chips.
// Marcado = cor do pilar com ✓; desmarcado = neutro com +. As medições (peso, cintura, tempo de tela) vêm
// desmarcadas. A caminhada aparece em Corpo e em Família e troca junto nos dois. O nome ou o ícone abre o
// formulário do pilar; "Criar outro pilar" abre um novo. Pilar fora do plano nasce arquivado.
import { AnimatePresence, m } from 'motion/react';
import { AddRow, Card, Chip, EmptyState, PillarBubble, Switch, pillarAttrs } from '@/components/ui';
import { planChips, toggleChip, type DraftPillar, type PlanDraft } from '@/data';
import { cascade, fadeUp, fadeUpItem, spring, tween } from '@/motion/tokens';
import { laterLine } from './plan';
import { StepHead } from './StepHead';
import { useFirstShow } from './useFirstShow';

function PillarBlock({
  draft,
  pillar,
  onDraft,
  onEdit,
  isNew,
}: {
  draft: PlanDraft;
  pillar: DraftPillar;
  onDraft: (fn: (d: PlanDraft) => PlanDraft) => void;
  onEdit: () => void;
  isNew: boolean;
}) {
  const chips = draft.mode === 'template' ? planChips(draft, pillar.key) : [];
  const later = laterLine(pillar.key);
  const subtitle = later || pillar.description || '';
  const anyOn = chips.some((c) => c.on && !c.measurement);
  const attrs = pillarAttrs(pillar.color);
  const setEnabled = (on: boolean) =>
    onDraft((d) => ({ ...d, pillars: d.pillars.map((p) => (p.key === pillar.key ? { ...p, enabled: on } : p)) }));

  return (
    <m.div
      variants={fadeUpItem}
      {...(isNew ? fadeUp : {})}
      className={`ob-pil${pillar.enabled ? '' : ' ob-pil-off'} ${attrs.className ?? ''}`}
      data-hue={attrs['data-hue']}
      data-pillar={attrs['data-pillar']}
    >
      <div className="ob-pil-row">
        <button type="button" className="pk-reset ob-pil-open" onClick={onEdit}>
          <PillarBubble icon={pillar.icon} pillar={pillar.color} />
          <span className="pk-ht">
            <b>{pillar.name}</b>
            {subtitle && <small>{subtitle}</small>}
          </span>
          <span className="ob-sr">Mudar nome, cor ou ícone</span>
        </button>
        <Switch checked={pillar.enabled} onCheckedChange={setEnabled} label={`${pillar.name} no plano`} />
      </div>
      <AnimatePresence initial={false}>
        {pillar.enabled && (
          <m.div
            key="chips"
            className="ob-pc"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: spring.calma, opacity: tween.micro } }}
            exit={{ height: 0, opacity: 0, transition: { height: spring.calma, opacity: tween.exit } }}
          >
            <div className="ob-pc-in">
              {chips.length > 0 && (
                <div className="pk-chips" role="group" aria-label={`Hábitos de ${pillar.name}`}>
                  {chips.map((c) => (
                    <Chip
                      key={c.chip}
                      selected={c.on}
                      tint
                      icon={c.on ? undefined : 'plus'}
                      detail={c.alsoLabel}
                      pillar={pillar.color}
                      onPressedChange={(on) => onDraft((d) => toggleChip(d, c.chip, on))}
                    >
                      {c.label}
                    </Chip>
                  ))}
                </div>
              )}
              {!anyOn && <p className="cap">Sem hábito agora</p>}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

export function PillarsStep({
  draft,
  onDraft,
  onEditPillar,
  onNewPillar,
  newKeys,
}: {
  draft: PlanDraft;
  onDraft: (fn: (d: PlanDraft) => PlanDraft) => void;
  onEditPillar: (key: string) => void;
  onNewPillar: () => void;
  /** pilares criados agora (entram no fim da lista com fadeUp) */
  newKeys: Set<string>;
}) {
  const animateIn = useFirstShow(2);
  const empty = draft.pillars.length === 0;
  return (
    <>
      <StepHead
        step={2}
        title="Seus pilares"
        lead={
          draft.mode === 'template'
            ? 'Escolha o que entra agora. Os outros hábitos chegam nas próximas fases.'
            : 'Pilares são as áreas da vida que você quer cuidar, como sono, saúde ou casa.'
        }
      />
      <div className="ob-body">
        {empty ? (
          <EmptyState
            icon="circles-four"
            title="Nenhum pilar ainda"
            detail="Comece por um. Dá para criar outros depois."
          />
        ) : (
          <Card className="ob-pils">
            <m.div className="ob-pils-list" variants={cascade} initial={animateIn ? 'hidden' : false} animate="shown">
              {draft.pillars.map((p) => (
                <PillarBlock
                  key={p.key}
                  draft={draft}
                  pillar={p}
                  onDraft={onDraft}
                  onEdit={() => onEditPillar(p.key)}
                  isNew={newKeys.has(p.key)}
                />
              ))}
            </m.div>
          </Card>
        )}
        <AddRow onClick={onNewPillar}>{empty ? 'Criar o primeiro pilar' : 'Criar outro pilar'}</AddRow>
        {!empty && (
          <p className="ob-pils-foot">
            Toque no nome de um pilar para mudar a cor ou o ícone. Pilar fora do plano fica arquivado, com os hábitos
            guardados.
          </p>
        )}
      </div>
    </>
  );
}
