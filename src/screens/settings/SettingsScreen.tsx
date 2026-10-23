// Ajustes (aba): o perfil, que leva a Dados e conta, e os grupos Meu plano, Rotina e App (com o Tutorial no fim),
// com bolhas neutras.
// É um menu parado: nada anima ao aparecer, e os valores chegam prontos (docs/interacao/telas/ajustes-plano.md).
// No modo demonstração, um grupo a mais deixa começar de novo a história de exemplo ou testar o primeiro acesso
// (uma conta vazia, sem Firebase).
import { useNavigate } from 'react-router';
import { ScreenHeader, showToast } from '@/components/shell';
import { ListGroup, ListItem, ProfileCard, SectionLabel } from '@/components/ui';
import {
  formatDayShort,
  formatTime,
  useHabits,
  usePause,
  usePillars,
  usePrefs,
  useProfile,
  useSession,
  useTogether,
} from '@/data';
import { Foot } from './parts';
import './settings.css';

const THEME_LABEL = { system: 'Sistema', light: 'Claro', dark: 'Escuro' } as const;

export default function SettingsScreen() {
  const navigate = useNavigate();
  const session = useSession();
  const profile = useProfile();
  const prefs = usePrefs();
  const habits = useHabits('active');
  const pillars = usePillars();
  const pause = usePause();
  const together = useTogether();
  const demo = session.mode === 'demo';

  // a caminhada aparece em dois pilares, mas conta uma vez só
  const habitCount = new Set(habits.map((h) => h.habit.id)).size;

  const p = pause.current;
  const pauseLine = p
    ? pause.isScheduled
      ? `Pausa marcada para ${formatDayShort(p.start)}`
      : `Pausado até ${formatDayShort(p.end)}`
    : 'Férias, doença, viagem';

  const wake = profile?.schedule?.wake;
  const bed = profile?.schedule?.bed;
  const scheduleLine =
    wake && bed ? `Acordar ${formatTime(wake)} · deitar ${formatTime(bed)}` : 'Acordar, deitar e a revisão';

  const togetherValue = together.linked ? 'Ligado' : together.invite ? 'Convite pronto' : 'Desligado';

  return (
    <div className="st-screen st-tab">
      <ScreenHeader title="Ajustes" />
      <div className="st-pad">
        <ProfileCard
          name={session.user?.name || profile?.name || 'Você'}
          detail={demo ? 'Demonstração · seus dados' : 'Conta Google · seus dados'}
          detailIcon={demo ? 'device-mobile' : 'google-logo'}
          onClick={() => void navigate('/ajustes/dados')}
        />
      </div>

      <SectionLabel>Meu plano</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            icon="list-checks"
            title="Hábitos"
            value={String(habitCount)}
            onClick={() => void navigate('/ajustes/habitos')}
          />
          <ListItem
            icon="columns"
            title="Pilares"
            value={String(pillars.length)}
            onClick={() => void navigate('/ajustes/pilares')}
          />
          <ListItem
            icon="pause-circle"
            title="Pausar"
            subtitle={pauseLine}
            onClick={() => void navigate('/ajustes/pausar')}
          />
        </ListGroup>
      </div>

      <SectionLabel>Rotina</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            icon="clock"
            title="Horários"
            subtitle={scheduleLine}
            onClick={() => void navigate('/ajustes/horarios')}
          />
          <ListItem
            icon="alarm"
            title="Lembretes"
            subtitle="Alarmes do iPhone"
            onClick={() => void navigate('/ajustes/lembretes')}
          />
        </ListGroup>
      </div>

      <SectionLabel>App</SectionLabel>
      <div className="st-pad">
        <ListGroup>
          <ListItem
            icon="circle-half"
            title="Aparência"
            value={THEME_LABEL[prefs.theme] ?? 'Sistema'}
            onClick={() => void navigate('/ajustes/aparencia')}
          />
          <ListItem
            icon="heart"
            title="A dois"
            value={togetherValue}
            onClick={() => void navigate('/ajustes/a-dois')}
          />
          {/* o fim do grupo App: é sobre o app em si, e é o que menos se abre (o alvo do capítulo "Os ajustes") */}
          <div data-tour="ajustes-tutorial">
            <ListItem
              icon="compass"
              title="Tutorial"
              subtitle="Os capítulos com o Zeno"
              onClick={() => void navigate('/ajustes/tutorial')}
            />
          </div>
        </ListGroup>
      </div>

      {demo && (
        <>
          <SectionLabel>Demonstração</SectionLabel>
          <div className="st-pad">
            <ListGroup>
              <ListItem
                icon="arrow-counter-clockwise"
                title="Começar de novo a demonstração"
                subtitle="Volta à história de exemplo, do jeito que ela começa."
                chevron={false}
                onClick={() => {
                  void session
                    .resetDemo()
                    .then(() =>
                      showToast({ title: 'A demonstração começou de novo', icon: 'arrow-counter-clockwise' }),
                    );
                }}
              />
              <ListItem
                icon="door-open"
                title="Testar o primeiro acesso"
                subtitle="Uma conta vazia, como no primeiro login. Os dados de exemplo voltam ao entrar de novo."
                chevron={false}
                onClick={() => void session.enterDemo({ empty: true })}
              />
            </ListGroup>
          </div>
        </>
      )}

      <Foot center className="st-version">
        Prokopē · versão 0.1
      </Foot>
    </div>
  );
}
