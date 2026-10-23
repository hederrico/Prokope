// Novo hábito · tipo (tela cheia): os 9 tipos em 3 grupos. O toque guarda o tipo no rascunho e troca a rota, com
// replace, para os detalhes (?tipo=contador). Cancelar descarta o rascunho (ajustes-plano.md › Novo hábito · tipo).
import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { FullScreen, NavBar, useGoBack } from '@/components/shell';
import { ListGroup, SectionLabel } from '@/components/ui';
import { useDrafts } from '@/data';
import { Icon } from '@/icons';
import type { HabitType } from '@/types';
import { TYPE_GROUPS } from './habitForm';
import { Row } from './parts';
import './settings.css';

export default function NewHabitTypeScreen() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const [search] = useSearchParams();
  const draft = useDrafts((s) => s.habitForm);
  const setDraft = useDrafts((s) => s.setHabitForm);
  // voltando dos detalhes ("‹ Tipo"), o rascunho continua; chegando de novo, começa limpo
  const fromDetails = (location.state as { fromDetails?: boolean } | null)?.fromDetails === true;

  useEffect(() => {
    if (!fromDetails) setDraft(null);
  }, [fromDetails, setDraft]);

  const chosen = fromDetails ? draft?.type : undefined;
  const pillar = search.get('pilar');
  // vindo de Editar jornada (?fase=3): a fase segue para os detalhes, e Cancelar volta para lá
  const phase = search.get('fase');

  const choose = (type: HabitType) => {
    const params = new URLSearchParams();
    params.set('tipo', type);
    if (pillar) params.set('pilar', pillar);
    if (phase) params.set('fase', phase);
    void navigate(`/ajustes/habitos/novo/detalhes?${params}`, { replace: true, state: { transition: 'push' } });
  };

  return (
    <FullScreen
      top={
        <NavBar
          cancel
          title="Novo hábito"
          onBack={() => {
            setDraft(null);
            goBack(
              phase ? '/jornada/fases' : pillar ? `/ajustes/pilares/${encodeURIComponent(pillar)}` : '/ajustes/habitos',
            );
          }}
        />
      }
    >
      <div className="st-screen st-types">
        <div className="st-pad">
          <div className="st-q">
            <h2 className="ttl2">Que tipo de hábito?</h2>
            <p className="sub muted">O tipo define como você marca no Hoje.</p>
          </div>
        </div>
        {TYPE_GROUPS.map((g) => (
          <section key={g.title}>
            <SectionLabel>{g.title}</SectionLabel>
            <div className="st-pad">
              <ListGroup>
                {g.types.map((t) => (
                  <Row
                    key={t.type}
                    icon={t.icon}
                    pillar="accent"
                    title={t.title}
                    subtitle={t.example}
                    value={
                      chosen === t.type ? (
                        <span className="st-chosen">
                          <Icon name="check" weight="bold" />
                          escolhido
                        </span>
                      ) : (
                        t.badge
                      )
                    }
                    label={[t.title, t.example, chosen === t.type ? 'escolhido' : t.badge].filter(Boolean).join('. ')}
                    onClick={() => choose(t.type)}
                  />
                ))}
              </ListGroup>
            </div>
          </section>
        ))}
      </div>
    </FullScreen>
  );
}
