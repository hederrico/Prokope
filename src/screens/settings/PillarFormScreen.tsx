// Novo pilar e Editar pilar (tela cheia): prévia ao vivo, nome, a paleta de 12 cores com o aviso "também em" e a
// biblioteca de ícones. Criar só acende com um nome; Salvar só acende quando algo mudou. Criar troca esta tela
// pelo pilar novo, empurrado sobre Pilares (docs/interacao/telas/ajustes-plano.md › Novo pilar).
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { FullScreen, NavBar, useGoBack } from '@/components/shell';
import { Card, PillarBubble, SectionLabel, TextField } from '@/components/ui';
import { duplicatePillarName, firstFreeColor, usePillar, usePillars, useHabits } from '@/data';
import { createPillar, updatePillar } from '@/actions';
import type { IconName } from '@/icons';
import { PALETTE_KEYS, type PaletteKey } from '@/styles/palette';
import { ColorPalette } from './ColorPalette';
import { colorLabel } from './habitText';
import { IconPicker } from './IconPicker';
import { iconForName, suggestCategory } from './iconLibrary';
import { Foot } from './parts';
import './settings.css';

export default function PillarFormScreen() {
  const { id } = useParams();
  const editing = !!id;
  const detail = usePillar(id);
  if (editing && !detail) return <Navigate to="/ajustes/pilares" replace />;
  return <PillarForm key={id ?? 'novo'} editingId={id} initial={detail?.pillar} />;
}

function PillarForm({
  editingId,
  initial,
}: {
  editingId?: string;
  initial?: { name: string; color: PaletteKey; icon: IconName };
}) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const pillars = usePillars().map((p) => p.pillar);
  const active = useHabits('active');
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState<PaletteKey>(() => initial?.color ?? firstFreeColor(PALETTE_KEYS, pillars));
  const [icon, setIcon] = useState<IconName>(initial?.icon ?? 'circle-dashed');
  // o ícone segue a sugestão do nome até a pessoa escolher um (no Editar, já vem escolhido)
  const [iconChosen, setIconChosen] = useState(!!initial);
  const [suggested, setSuggested] = useState<string | null>(() => (initial ? suggestCategory(initial.name) : null));
  const [busy, setBusy] = useState(false);
  const inputWrap = useRef<HTMLDivElement>(null);

  // 300 ms depois de parar de digitar: a categoria que combina com o nome sobe, e o ícone sugerido entra
  useEffect(() => {
    const t = setTimeout(() => {
      const cat = name.trim() ? suggestCategory(name) : null;
      setSuggested(cat);
      if (!iconChosen) setIcon((name.trim() && iconForName(name)) || 'circle-dashed');
    }, 300);
    return () => clearTimeout(t);
  }, [name, iconChosen]);

  // o foco vai para o Nome (no iPhone, o teclado abre dentro do toque que abriu a tela)
  useEffect(() => {
    if (!editingId) inputWrap.current?.querySelector('input')?.focus();
  }, [editingId]);

  const trimmed = name.trim();
  const dup = duplicatePillarName(trimmed, pillars, editingId);
  const changed = !initial || trimmed !== initial.name || color !== initial.color || icon !== initial.icon;
  const canSave = !!trimmed && changed && !busy;
  const habitCount = editingId
    ? active.filter((h) => h.habit.pillarId === editingId || h.habit.alsoIn.includes(editingId)).length
    : 0;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    if (editingId) {
      await updatePillar(editingId, { name: trimmed, color, icon });
      goBack(`/ajustes/pilares/${encodeURIComponent(editingId)}`);
      return;
    }
    const undo = await createPillar({ name: trimmed, color, icon });
    // a tela cheia é trocada pelo pilar novo, empurrado sobre Pilares
    void navigate(`/ajustes/pilares/${encodeURIComponent(undo.id ?? '')}`, { replace: true });
  };

  return (
    <FullScreen
      top={
        <NavBar
          cancel
          onBack={() => goBack(editingId ? `/ajustes/pilares/${encodeURIComponent(editingId)}` : '/ajustes/pilares')}
          title={editingId ? 'Editar pilar' : 'Novo pilar'}
          action={{ label: editingId ? 'Salvar' : 'Criar', disabled: !canSave, onClick: () => void save() }}
        />
      }
    >
      <div className="st-screen">
        <div className="st-pad" style={{ paddingTop: 4 }} aria-hidden="true">
          <Card tint pillar={color} className="st-npv">
            <PillarBubble icon={icon} pillar={color} size="lg" raised />
            <span style={{ minWidth: 0 }}>
              <span className={`ttl2 st-npv-name${trimmed ? '' : ' ph'}`}>{trimmed || 'Novo pilar'}</span>
              <span className="cap">
                {editingId
                  ? `Prévia · ${habitCount === 1 ? '1 hábito' : `${habitCount} hábitos`}`
                  : 'Prévia · ainda sem hábitos'}
              </span>
            </span>
          </Card>
        </div>

        <SectionLabel>Nome</SectionLabel>
        <div className="st-pad" ref={inputWrap}>
          <TextField
            label="Nome"
            hideLabel
            value={name}
            onChange={setName}
            placeholder="Finanças, Estudos, Casa…"
            enterKeyHint="done"
            maxLength={40}
            error={dup ? `Já existe um pilar ${dup.name}.` : undefined}
          />
        </div>

        <SectionLabel trailing={colorLabel(color, pillars, editingId)}>Cor</SectionLabel>
        <div className="st-pad">
          <ColorPalette value={color} onChange={setColor} pillars={pillars} exceptId={editingId} />
        </div>
        <Foot>As cores com ícone já são de outro pilar. Pode repetir.</Foot>

        <SectionLabel>Ícone</SectionLabel>
        <div className="st-pad hued" data-hue={color}>
          <IconPicker
            value={icon}
            suggested={suggested}
            onChange={(i) => {
              setIcon(i);
              setIconChosen(true);
            }}
          />
        </div>
      </div>
    </FullScreen>
  );
}
