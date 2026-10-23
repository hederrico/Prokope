// Pilar (tela empurrada a partir de Pilares): o título na serifa, os hábitos do pilar, "Novo hábito em Corpo",
// Arquivar (sem confirmação, com Desfazer) e Apagar (pede confirmação numa folha; pilar sem hábitos apaga na hora).
// Editar abre o mesmo formulário do Novo pilar, com Salvar (docs/interacao/telas/ajustes-plano.md › Pilar · Corpo).
import { Navigate, useNavigate, useParams } from 'react-router';
import { NavBar, showUndo, useGoBack, useOpenSheet, useScreenTitle } from '@/components/shell';
import { AddRow, EmptyState, ListGroup, PillarBubble, SectionLabel, Tag } from '@/components/ui';
import {
  formatDayShort,
  formatPercent,
  logicalDay,
  useHabits,
  usePillar,
  usePillars,
  useProfile,
  useProgress,
} from '@/data';
import { archivePillar, deletePillar, restorePillar } from '@/actions';
import type { Habit, Pillar } from '@/types';
import { archivedDetail, byListOrder, exitSentence, habitLine, joinList } from './habitText';
import { Foot, Row } from './parts';
import './settings.css';

export default function PillarScreen() {
  const id = useParams().id ?? '';
  const navigate = useNavigate();
  const goBack = useGoBack();
  const openSheet = useOpenSheet();
  const detail = usePillar(id);
  const all = usePillars({ includeArchived: true }).map((p) => p.pillar);
  const profile = useProfile();
  const upcoming = useHabits('upcoming');
  const progress = useProgress('semana', 'visao');
  useScreenTitle(detail?.pillar.name);

  if (!detail) return <Navigate to="/ajustes/pilares" replace />;
  const { pillar, habits, exitPlan } = detail;
  const upcomingIds = new Set(upcoming.map((h) => h.habit.id));
  const sorted = byListOrder(
    habits.map((habit) => ({ habit })),
    pillar.id,
  ).map((x) => x.habit);
  const current = sorted.filter((h) => !upcomingIds.has(h.id));
  const later = sorted.filter((h) => upcomingIds.has(h.id));
  const ratio = progress.pillars.find((p) => p.pillar.id === pillar.id)?.ratio;
  const archived = pillar.archived;
  const count = current.length;

  const caption = archived
    ? pillar.archivedAt
      ? `Arquivado em ${formatDayShort(logicalDay(pillar.archivedAt))}`
      : 'Arquivado'
    : [
        count === 1 ? '1 hábito' : `${count} hábitos`,
        ratio !== undefined && ratio !== null && count ? `constância de ${formatPercent(ratio)} na semana` : null,
      ]
        .filter(Boolean)
        .join(' · ');

  const pillarName = (pid: string) => all.find((p) => p.id === pid)?.name ?? '';
  const pillarOf = (pid: string): Pillar | undefined => all.find((p) => p.id === pid);

  const habitRow = (h: Habit) => {
    const primary = pillarOf(h.pillarId);
    const shared = h.pillarId !== pillar.id;
    return (
      <Row
        key={h.id}
        icon={h.icon}
        pillar={primary?.color ?? pillar.color}
        title={h.name}
        subtitle={habitLine(h, profile, false)}
        badge={
          shared && primary ? (
            <Tag pillar={primary.color}>{`principal em ${primary.name}`}</Tag>
          ) : h.alsoIn.length ? (
            <Tag pillar={pillarOf(h.alsoIn[0])?.color}>{`também em ${pillarName(h.alsoIn[0])}`}</Tag>
          ) : undefined
        }
        muted={archived}
        label={`${h.name}. ${habitLine(h, profile, false)}${shared && primary ? `, principal em ${primary.name}` : ''}`}
        onClick={() => void navigate(`/ajustes/habitos/${encodeURIComponent(h.id)}`)}
      />
    );
  };

  const archive = async () => {
    const plan = exitPlan;
    const undo = await archivePillar(pillar.id);
    goBack('/ajustes/pilares');
    showUndo(
      { title: `${pillar.name} arquivado`, detail: archivedDetail(plan), pillar: pillar.color, icon: 'archive' },
      () => void undo(),
    );
  };

  const restore = async () => {
    const undo = await restorePillar(pillar.id);
    showUndo(
      { title: `${pillar.name} voltou`, pillar: pillar.color, icon: 'arrow-counter-clockwise' },
      () => void undo(),
    );
  };

  const remove = async () => {
    if (habits.length === 0) {
      // só nome, cor e ícone se perdem: apaga na hora, com Desfazer
      const undo = await deletePillar(pillar.id);
      goBack('/ajustes/pilares');
      showUndo({ title: `${pillar.name} apagado`, icon: 'trash-simple' }, () => void undo());
      return;
    }
    openSheet('apagar', { pilar: pillar.id });
  };

  // a frase fala do dia de hoje; os hábitos das próximas fases ganham uma frase própria
  const laterGoing = exitPlan.filter((f) => f.kind === 'goes' && upcomingIds.has(f.habit.id)).map((f) => f.habit);
  const exitText = [
    exitSentence(
      exitPlan.filter((f) => !upcomingIds.has(f.habit.id)),
      all,
    ),
    laterGoing.length
      ? `${joinList(laterGoing.map((h, i) => (i ? h.name.charAt(0).toLocaleLowerCase('pt-BR') + h.name.slice(1) : h.name)))} não ${laterGoing.length === 1 ? 'entra' : 'entram'} nas próximas fases.`
      : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="st-screen">
      <NavBar
        action={
          archived
            ? undefined
            : {
                label: 'Editar',
                onClick: () => void navigate(`/ajustes/pilares/${encodeURIComponent(pillar.id)}/editar`),
              }
        }
      />
      <div className="st-hero">
        <PillarBubble icon={pillar.icon} pillar={archived ? undefined : pillar.color} size="lg" raised={!archived} />
        <h1 className="ttl2" tabIndex={-1}>
          {pillar.name}
        </h1>
        <p className="cap">{caption}</p>
      </div>

      <SectionLabel trailing={String(current.length)}>Hábitos neste pilar</SectionLabel>
      <div className="st-pad">
        {current.length ? (
          <ListGroup>{current.map(habitRow)}</ListGroup>
        ) : (
          <EmptyState title="Nenhum hábito neste pilar." />
        )}
        {!archived && (
          <>
            <div className="st-gap" />
            <AddRow
              onClick={() => void navigate(`/ajustes/habitos/novo/tipo?pilar=${encodeURIComponent(pillar.id)}`)}
            >{`Novo hábito em ${pillar.name}`}</AddRow>
          </>
        )}
      </div>

      {later.length > 0 && (
        <>
          <SectionLabel trailing={String(later.length)}>Nas próximas fases</SectionLabel>
          <div className="st-pad">
            <ListGroup>{later.map(habitRow)}</ListGroup>
          </div>
        </>
      )}

      <div className="st-pad st-pad-top">
        <ListGroup>
          {archived ? (
            <Row
              icon="arrow-counter-clockwise"
              title="Restaurar pilar"
              subtitle="O pilar e os hábitos dele voltam para o seu dia."
              chevron={false}
              onClick={() => void restore()}
            />
          ) : (
            <Row
              icon="archive"
              title="Arquivar pilar"
              subtitle={exitText}
              chevron={false}
              label={`Arquivar pilar. ${exitText}`}
              onClick={() => void archive()}
            />
          )}
          <Row
            icon="trash-simple"
            title="Apagar pilar"
            subtitle={habits.length ? 'Pede confirmação antes' : 'Só o nome, a cor e o ícone se perdem'}
            tone="warn"
            onClick={() => void remove()}
          />
        </ListGroup>
      </div>
      {!archived && (
        <Foot>Arquivado, o pilar fica em Pilares › Arquivados, com o histórico, e volta com um toque.</Foot>
      )}
    </div>
  );
}
