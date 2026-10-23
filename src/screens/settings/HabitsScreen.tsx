// Hábitos (Ajustes): Ativos por pilar, Próximas fases por fase e Arquivados por data. Cada linha diz o tipo, a meta e
// a fase; um hábito em dois pilares aparece nos dois grupos, sempre na cor do principal, com "principal em" e
// "também em". O toque abre o hábito (/ajustes/habitos/:id), que tem Editar (ajustes-plano.md › Hábitos).
import { useRef } from 'react';
import { m } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { NavBar } from '@/components/shell';
import { AddRow, EmptyState, ListGroup, SectionLabel, SegmentedControl, Tag } from '@/components/ui';
import { formatDayShort, logicalDay, useHabits, useJourney, usePillars, useProfile, type HabitListItem } from '@/data';
import { tween } from '@/motion/tokens';
import type { Pillar } from '@/types';
import { byListOrder, habitLine, joinList } from './habitText';
import { Foot, Row } from './parts';
import './settings.css';

type View = 'ativos' | 'proximas' | 'arquivados';

export default function HabitsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const profile = useProfile();
  const pillars = usePillars().map((p) => p.pillar);
  const all = useHabits('all');
  const journey = useJourney();
  const hasPhases = journey.phases.length > 0;
  const raw = search.get('ver');
  const view: View = raw === 'proximas' && hasPhases ? 'proximas' : raw === 'arquivados' ? 'arquivados' : 'ativos';
  const top = useRef<HTMLDivElement>(null);

  const active = all.filter((h) => h.status === 'active' || h.status === 'paused');
  const upcoming = all.filter((h) => h.status === 'upcoming');
  const archived = all.filter((h) => h.status === 'archived');

  const setView = (v: View) => {
    const next = new URLSearchParams(search);
    if (v === 'ativos') next.delete('ver');
    else next.set('ver', v);
    setSearch(next, { replace: true });
    // a lista volta ao topo
    let el: HTMLElement | null = top.current;
    while (el && !(el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'visible')) {
      el = el.parentElement;
    }
    el?.scrollTo({ top: 0 });
  };

  const pillarById = (id: string) => pillars.find((p) => p.id === id);
  const open = (id: string) => void navigate(`/ajustes/habitos/${encodeURIComponent(id)}`);

  const row = (item: HabitListItem, group: Pillar | null, showPhase: boolean, sub?: string) => {
    const h = item.habit;
    const primary = item.pillar;
    const line = sub ?? habitLine(h, profile, showPhase && hasPhases);
    let badge: React.ReactNode;
    let badgeText = '';
    if (item.status === 'paused' && item.pausedUntil) {
      badgeText = `Pausado até ${formatDayShort(item.pausedUntil)}`;
      badge = (
        <Tag icon="pause" iconWeight="fill">
          {badgeText}
        </Tag>
      );
    } else if (group && primary && group.id !== primary.id) {
      badgeText = `principal em ${primary.name}`;
      badge = <Tag pillar={primary.color}>{badgeText}</Tag>;
    } else if (group && item.alsoIn.length) {
      const other = item.alsoIn[0];
      badgeText = `também em ${other.name}`;
      badge = <Tag pillar={other.color}>{badgeText}</Tag>;
    }
    return (
      <Row
        key={`${group?.id ?? 'x'}-${h.id}`}
        icon={h.icon}
        pillar={primary?.color}
        title={h.name}
        subtitle={line}
        badge={badge}
        label={`${h.name}. ${line}${badgeText ? `, ${badgeText}` : ''}`}
        onClick={() => open(h.id)}
      />
    );
  };

  const activeIds = new Set(active.map((h) => h.habit.id));
  const phasesWaiting = [...new Set(upcoming.map((h) => h.habit.phase).filter((p): p is number => !!p))].sort();

  let body: React.ReactNode;
  if (view === 'ativos') {
    const groups = pillars
      .map((p) => ({
        pillar: p,
        items: byListOrder(
          active.filter((h) => h.habit.pillarId === p.id || h.habit.alsoIn.includes(p.id)),
          p.id,
        ),
      }))
      .filter((g) => g.items.length);
    const orphans = active.filter((h) => !h.pillar || !pillarById(h.habit.pillarId));
    body = (
      <>
        {groups.map((g) => (
          <section key={g.pillar.id} aria-label={`${g.pillar.name}, ${g.items.length} hábitos`}>
            <SectionLabel trailing={String(g.items.length)}>{g.pillar.name}</SectionLabel>
            <div className="st-pad">
              <ListGroup>{g.items.map((h) => row(h, g.pillar, true))}</ListGroup>
            </div>
          </section>
        ))}
        {orphans.length > 0 && (
          <>
            <SectionLabel trailing={String(orphans.length)}>Sem pilar</SectionLabel>
            <div className="st-pad">
              <ListGroup>{orphans.map((h) => row(h, null, true))}</ListGroup>
            </div>
          </>
        )}
        {groups.length === 0 && orphans.length === 0 && (
          <div className="st-pad" style={{ paddingTop: 16 }}>
            <EmptyState title="Nenhum hábito ativo." detail="Crie o primeiro e ele entra no seu dia." />
          </div>
        )}
        <div className="st-pad" style={{ paddingTop: 16 }}>
          <AddRow onClick={() => void navigate('/ajustes/habitos/novo/tipo')}>Novo hábito</AddRow>
        </div>
        <Foot center className="st-habits-foot">
          {`${activeIds.size === 1 ? '1 hábito ativo' : `${activeIds.size} hábitos ativos`}.`}
          {upcoming.length > 0 &&
            ` Mais ${upcoming.length} ${upcoming.length === 1 ? 'espera' : 'esperam'} ${
              phasesWaiting.length === 1 ? 'na fase' : 'nas fases'
            } ${joinList(phasesWaiting.map(String))}.`}{' '}
          Toque num hábito para ver o histórico e editar.
        </Foot>
      </>
    );
  } else if (view === 'proximas') {
    const byPhase = journey.phases
      .filter((p) => p.status === 'future' || upcoming.some((h) => h.habit.phase === p.number))
      .map((p) => ({ phase: p, items: byListOrder(upcoming.filter((h) => h.habit.phase === p.number)) }))
      .filter((g) => g.items.length);
    const loose = upcoming.filter((h) => !h.habit.phase);
    body =
      byPhase.length || loose.length ? (
        <>
          {byPhase.map((g) => (
            <section key={g.phase.number}>
              <SectionLabel trailing={String(g.items.length)}>
                {`Fase ${g.phase.number}${g.phase.start ? ` · a partir de ${formatDayShort(g.phase.start)}` : ''}`}
              </SectionLabel>
              <div className="st-pad">
                <ListGroup>{g.items.map((h) => row(h, null, false))}</ListGroup>
              </div>
            </section>
          ))}
          {loose.length > 0 && (
            <>
              <SectionLabel>Começam depois</SectionLabel>
              <div className="st-pad">
                <ListGroup>
                  {loose.map((h) =>
                    row(h, null, false, h.startsOn ? `Começa em ${formatDayShort(h.startsOn)}` : undefined),
                  )}
                </ListGroup>
              </div>
            </>
          )}
          <Foot center className="st-habits-foot">
            Cada fase traz os hábitos dela quando começa. A revisão da semana pergunta antes.
          </Foot>
        </>
      ) : (
        <div className="st-pad" style={{ paddingTop: 16 }}>
          <EmptyState title="Nenhum hábito esperando uma fase." />
        </div>
      );
  } else {
    const sorted = [...archived].sort((a, b) => (b.habit.archivedAt ?? 0) - (a.habit.archivedAt ?? 0));
    body = sorted.length ? (
      <>
        <SectionLabel trailing={String(sorted.length)}>Arquivados</SectionLabel>
        <div className="st-pad">
          <ListGroup>
            {sorted.map((h) =>
              row(
                h,
                null,
                false,
                h.habit.archivedAt
                  ? `Arquivado em ${formatDayShort(h.habit.archivedDay ?? logicalDay(h.habit.archivedAt))}`
                  : undefined,
              ),
            )}
          </ListGroup>
        </div>
        <Foot center className="st-habits-foot">
          O histórico de cada hábito arquivado fica guardado. Dá para restaurar pela tela dele.
        </Foot>
      </>
    ) : (
      <div className="st-pad" style={{ paddingTop: 16 }}>
        <EmptyState icon="archive" title="Nenhum hábito arquivado." />
      </div>
    );
  }

  const options: { value: View; label: string }[] = hasPhases
    ? [
        { value: 'ativos', label: 'Ativos' },
        { value: 'proximas', label: 'Próximas fases' },
        { value: 'arquivados', label: 'Arquivados' },
      ]
    : [
        { value: 'ativos', label: 'Ativos' },
        { value: 'arquivados', label: 'Arquivados' },
      ];

  return (
    <div className="st-screen" ref={top}>
      <NavBar
        title="Hábitos"
        action={{ label: 'Novo hábito', icon: 'plus', onClick: () => void navigate('/ajustes/habitos/novo/tipo') }}
      />
      <div className="st-pad st-seg">
        <SegmentedControl options={options} value={view} onChange={setView} label="Mostrar" />
      </div>
      <m.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={tween.micro}>
        {body}
      </m.div>
    </div>
  );
}
