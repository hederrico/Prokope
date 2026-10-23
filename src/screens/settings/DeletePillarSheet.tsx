// Pilar · apagar (?folha=apagar&pilar=:id): explica o destino de cada hábito e recomenda Arquivar.
// "Apagar de vez" não tem Desfazer e ignora o toque nos primeiros 500 ms (um toque duplo não apaga sem querer).
// Depois de apagar, o app volta a Pilares, onde a linha recolhe; sem toast (ajustes-plano.md › Pilar · apagar).
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sheet, showUndo, type SheetScreenProps } from '@/components/shell';
import { Button, PillarBubble } from '@/components/ui';
import { useHabits, usePillar, usePillars } from '@/data';
import { archivePillar, deletePillar } from '@/actions';
import { archivedDetail, byListOrder } from './habitText';
import './settings.css';

export default function DeletePillarSheet({ params }: SheetScreenProps) {
  const id = params.get('pilar') ?? '';
  const navigate = useNavigate();
  const detail = usePillar(id);
  const pillars = usePillars({ includeArchived: true }).map((p) => p.pillar);
  const upcoming = useHabits('upcoming');
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!detail) {
    return (
      <Sheet title="Pilar apagado">
        <p className="lead">Este pilar já não existe.</p>
      </Sheet>
    );
  }
  const { pillar } = detail;
  // os hábitos de agora primeiro (os dele, depois os que vêm de outro pilar); os das próximas fases no fim
  const upcomingIds = new Set(upcoming.map((h) => h.habit.id));
  const exitPlan = [
    ...byListOrder(
      detail.exitPlan.filter((f) => !upcomingIds.has(f.habit.id)),
      pillar.id,
    ),
    ...byListOrder(
      detail.exitPlan.filter((f) => upcomingIds.has(f.habit.id)),
      pillar.id,
    ),
  ];
  const nameOf = (pid: string | undefined) => pillars.find((p) => p.id === pid)?.name ?? '';
  const colorOf = (pid: string | undefined) => pillars.find((p) => p.id === pid)?.color;

  const toPillars = () => navigate('/ajustes/pilares', { replace: true, state: { transition: 'pop' } });

  const archive = async () => {
    if (busy) return;
    setBusy(true);
    const undo = await archivePillar(pillar.id);
    void toPillars();
    showUndo(
      { title: `${pillar.name} arquivado`, detail: archivedDetail(exitPlan), pillar: pillar.color, icon: 'archive' },
      () => void undo(),
    );
  };

  const remove = async () => {
    if (!armed || busy) return;
    setBusy(true);
    await deletePillar(pillar.id);
    void toPillars();
  };

  return (
    <Sheet title={`Apagar ${pillar.name}?`}>
      <div className="st-sheet-body">
        <p className="lead">
          Apagar não dá para desfazer. Arquivar tira {pillar.name} do seu dia e guarda todo o histórico.
        </p>
        <div className="st-fate" role="list">
          {exitPlan.map((f) => (
            <div key={f.habit.id} role="listitem">
              <PillarBubble icon={f.habit.icon} pillar={colorOf(f.habit.pillarId) ?? pillar.color} size="sm" />
              <span>
                <b>{f.habit.name}</b>{' '}
                {f.kind === 'goes'
                  ? 'é apagado junto, com os registros.'
                  : f.kind === 'moves'
                    ? `passa para ${nameOf(f.to)}, com tudo o que já foi feito.`
                    : `continua em ${nameOf(f.habit.pillarId)}, com tudo o que já foi feito.`}
              </span>
            </div>
          ))}
        </div>
        <div className="st-btns">
          <Button wide icon="archive" onClick={() => void archive()}>
            Arquivar pilar
          </Button>
          <Button
            wide
            variant="secondary"
            icon="trash-simple"
            className="st-warn-text"
            aria-label={`Apagar ${pillar.name} de vez`}
            onClick={() => void remove()}
          >
            Apagar de vez
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
