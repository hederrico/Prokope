// Pilares: a ordem daqui vale para o app todo. A alça arrasta (sem toque longo) e o resto da linha abre o pilar.
// Reordenar: Reorder do Motion com a alça como único ponto de arrasto; a linha sobe (1,03, sombra --shadow-2, --raised),
// segue o dedo só no eixo vertical, as vizinhas andam com layout calma e a ordem grava ao soltar (reorderPillars).
// Sem toast: arrastar de volta já desfaz. Teclado: Tab chega à alça, Espaço pega, setas movem, Espaço solta, Esc cancela.
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { useNavigate } from 'react-router';
import { NavBar } from '@/components/shell';
import { AddRow, EmptyState, PillarBubble, SectionLabel } from '@/components/ui';
import { formatDayShort, logicalDay, useHabits, usePillars, type PillarListItem } from '@/data';
import { reorderPillars } from '@/actions';
import { Icon } from '@/icons';
import { spring } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';
import { Foot } from './parts';
import './settings.css';

function countLabel(n: number): string {
  return n === 1 ? '1 hábito' : `${n} hábitos`;
}

export default function PillarsScreen() {
  const navigate = useNavigate();
  const all = usePillars({ includeArchived: true });
  const current = useHabits('active');
  // "5 hábitos": os que estão no dia agora (os das próximas fases ainda não contam)
  const active = all
    .filter((p) => !p.pillar.archived)
    .map((p) => ({
      ...p,
      habitCount: current.filter((h) => h.habit.pillarId === p.pillar.id || h.habit.alsoIn.includes(p.pillar.id))
        .length,
    }));
  const archived = all.filter((p) => p.pillar.archived);

  return (
    <div className="st-screen">
      <NavBar title="Pilares" />
      {active.length > 1 && <Foot className="st-hint">Arraste pela alça para mudar a ordem.</Foot>}
      <div className="st-pad">
        {active.length > 0 && <PillarReorderList items={active} />}
        <div className="st-gap" />
        <AddRow onClick={() => void navigate('/ajustes/pilares/novo')}>Novo pilar</AddRow>
      </div>

      <SectionLabel>Arquivados</SectionLabel>
      <div className="st-pad">
        {archived.length === 0 ? (
          <EmptyState
            icon="archive"
            title="Nenhum pilar arquivado."
            detail="Arquivar tira o pilar e os hábitos dele do seu dia. O histórico fica guardado."
          />
        ) : (
          <ul className="st-plist archived">
            {archived.map(({ pillar, habitCount }) => (
              <li key={pillar.id} className="st-pil nogrip">
                <button
                  type="button"
                  className="pk-reset st-pil-main"
                  onClick={() => void navigate(`/ajustes/pilares/${encodeURIComponent(pillar.id)}`)}
                >
                  <PillarBubble icon={pillar.icon} />
                  <span>
                    <b>{pillar.name}</b>
                    <small>
                      {pillar.archivedAt
                        ? `Arquivado em ${formatDayShort(logicalDay(pillar.archivedAt))}`
                        : countLabel(habitCount)}
                    </small>
                  </span>
                  <span className="chev" aria-hidden="true">
                    <Icon name="caret-right" weight="bold" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A lista que reordena (ReorderList do quadro). A ordem vive no estado local durante o arrasto. */
function PillarReorderList({ items }: { items: PillarListItem[] }) {
  const ids = items.map((p) => p.pillar.id);
  const key = ids.join('|');
  const [order, setOrder] = useState(ids);
  const [lifted, setLifted] = useState<string | null>(null);
  const [kbGrab, setKbGrab] = useState<{ id: string; from: string[] } | null>(null);
  const [announce, setAnnounce] = useState('');
  const dragging = lifted !== null || kbGrab !== null;
  const orderRef = useRef(order);
  useLayoutEffect(() => {
    orderRef.current = order;
  }, [order]);

  // os dados mudaram fora do arrasto (outro aparelho, pilar novo): a lista segue os dados
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key && !dragging) {
    setSeenKey(key);
    setOrder(ids);
  }

  const byId = new Map(items.map((p) => [p.pillar.id, p]));
  const shown = order.filter((id) => byId.has(id));
  const one = shown.length <= 1;

  const save = (next: string[]) => {
    if (next.join('|') !== key) void reorderPillars(next);
  };

  const position = (id: string, list: string[]) =>
    `${byId.get(id)?.pillar.name ?? ''}, posição ${list.indexOf(id) + 1} de ${list.length}`;

  const move = (id: string, delta: number) => {
    const i = order.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    next.splice(i, 1);
    next.splice(j, 0, id);
    setOrder(next);
    setAnnounce(position(id, next));
  };

  return (
    <>
      <Reorder.Group
        axis="y"
        as="ul"
        values={shown}
        onReorder={(next: string[]) => setOrder(next)}
        className="st-plist"
        aria-label="Pilares"
      >
        {shown.map((id) => (
          <PillarItem
            key={id}
            item={byId.get(id)!}
            grip={!one}
            lifted={lifted === id}
            grabbed={kbGrab?.id === id}
            onLift={() => setLifted(id)}
            onDrop={(cancelled, from) => {
              setLifted(null);
              if (cancelled) setOrder(from);
              else save(orderRef.current);
            }}
            getOrder={() => orderRef.current}
            onKey={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (kbGrab) {
                  setKbGrab(null);
                  setAnnounce(`${byId.get(id)?.pillar.name} solto na posição ${order.indexOf(id) + 1}`);
                  save(order);
                } else {
                  setKbGrab({ id, from: order });
                  setAnnounce(`${position(id, order)}. Use as setas para mover.`);
                }
              } else if (kbGrab && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                move(id, e.key === 'ArrowUp' ? -1 : 1);
              } else if (kbGrab && e.key === 'Escape') {
                e.preventDefault();
                setOrder(kbGrab.from);
                setKbGrab(null);
                setAnnounce('Ordem mantida');
              }
            }}
            onBlurGrip={() => {
              if (kbGrab?.id === id) {
                setKbGrab(null);
                save(order);
              }
            }}
          />
        ))}
      </Reorder.Group>
      <span className="pk-sr" aria-live="polite">
        {announce}
      </span>
    </>
  );
}

function PillarItem({
  item,
  grip,
  lifted,
  grabbed,
  onLift,
  onDrop,
  getOrder,
  onKey,
  onBlurGrip,
}: {
  item: PillarListItem;
  grip: boolean;
  lifted: boolean;
  grabbed: boolean;
  onLift: () => void;
  onDrop: (cancelled: boolean, from: string[]) => void;
  getOrder: () => string[];
  onKey: (e: React.KeyboardEvent) => void;
  onBlurGrip: () => void;
}) {
  const navigate = useNavigate();
  const controls = useDragControls();
  const reduced = usePrefersReducedMotion();
  const { pillar, habitCount } = item;
  const fromRef = useRef<string[]>([]);
  const cancelled = useRef(false);
  const active = useRef(false);

  // soltar sem arrastar (a linha subiu e desce) ou cancelar (uma ligação, por exemplo)
  useEffect(() => {
    if (!lifted) return;
    const up = () => {
      // dá um quadro para o onDragEnd do Motion chegar primeiro
      requestAnimationFrame(() => {
        if (active.current) {
          active.current = false;
          onDrop(cancelled.current, fromRef.current);
        }
      });
    };
    const cancel = () => {
      cancelled.current = true;
      up();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', esc);
    };
  }, [lifted, onDrop]);

  return (
    <Reorder.Item
      value={pillar.id}
      as="li"
      dragListener={false}
      dragControls={controls}
      dragElastic={0.3}
      dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
      tabIndex={-1}
      className={clsx('st-pil', !grip && 'nogrip', (lifted || grabbed) && 'lifted')}
      animate={{ scale: (lifted || grabbed) && !reduced ? 1.03 : 1 }}
      transition={{ ...spring.calma, scale: spring.toque }}
      onDragEnd={() => {
        if (!active.current) return;
        active.current = false;
        onDrop(cancelled.current, fromRef.current);
      }}
    >
      {grip && (
        <button
          type="button"
          className="pk-reset st-grip hit"
          aria-label={`Mover ${pillar.name}`}
          aria-pressed={grabbed}
          aria-describedby={`grip-help-${pillar.id}`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            fromRef.current = getOrder();
            cancelled.current = false;
            active.current = true;
            onLift();
            controls.start(e);
          }}
          onKeyDown={onKey}
          onBlur={onBlurGrip}
        >
          <Icon name="dots-six-vertical" weight="bold" />
          <span id={`grip-help-${pillar.id}`} className="pk-sr">
            Espaço pega a linha, as setas movem, Espaço solta e Esc cancela.
          </span>
        </button>
      )}
      <button
        type="button"
        className="pk-reset st-pil-main"
        onClick={() => void navigate(`/ajustes/pilares/${encodeURIComponent(pillar.id)}`)}
      >
        <PillarBubble icon={pillar.icon} pillar={pillar.color} />
        <span>
          <b>{pillar.name}</b>
          <small>{countLabel(habitCount)}</small>
        </span>
        <span className="chev" aria-hidden="true">
          <Icon name="caret-right" weight="bold" />
        </span>
      </button>
    </Reorder.Item>
  );
}
