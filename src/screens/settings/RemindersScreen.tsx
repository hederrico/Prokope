// Lembretes: o app não manda notificações. A tela entrega os alarmes sugeridos, lidos de Horários e escritos como no
// Relógio ("06:50"), o passo a passo para criar no iPhone e a dica da Agenda de Sono. Só leitura: nada é tocável
// (docs/interacao/telas/ajustes-rotina-conta.md › Lembretes).
import { AnimatePresence, m } from 'motion/react';
import { NavBar } from '@/components/shell';
import { InsightCard, PillarBubble, SectionLabel } from '@/components/ui';
import { formatTime, useHabits, useProfile } from '@/data';
import { tween } from '@/motion/tokens';
import { Foot } from './parts';
import { suggestedAlarms } from './schedule';
import './settings.css';

/** "6h50, Acordar, todo dia" (o leitor nunca lê "06:50"). */
function alarmLabel(time: string, label: string, when: string): string {
  return `${formatTime(time)}, ${label}, ${when}`;
}

export default function RemindersScreen() {
  const profile = useProfile();
  const habits = useHabits('all');
  const alarms = suggestedAlarms(profile, habits);
  const wake = profile?.schedule?.wake;
  const bed = profile?.schedule?.bed;
  // com 1h para desacelerar, o modo de sono começa 1h antes de deitar
  const windDown = bed
    ? formatTime(`${String((Number(bed.slice(0, 2)) + 23) % 24).padStart(2, '0')}:${bed.slice(3)}`)
    : null;

  return (
    <div className="st-screen">
      <NavBar title="Lembretes" />
      <div className="st-pad">
        <InsightCard
          pillar="accent"
          icon="alarm"
          animateIn={false}
          className="st-insight"
          text="Os lembretes ficam nos alarmes do iPhone, que tocam até no silencioso. O Prokopē não manda notificações."
        />
      </div>

      {alarms.length > 0 && (
        <>
          <SectionLabel trailing="vêm de Horários">Alarmes sugeridos</SectionLabel>
          <div className="st-pad">
            <ul className="pk-lg" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <AnimatePresence initial={false} mode="popLayout">
                {alarms.map((a) => (
                  <m.li
                    key={`${a.label}-${a.time}`}
                    className="st-al"
                    aria-label={alarmLabel(a.time, a.label, a.when)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={tween.micro}
                  >
                    <span className="tm" aria-hidden="true">
                      {a.time}
                    </span>
                    <span aria-hidden="true">
                      <b>{a.label}</b>
                      <small>{a.when}</small>
                    </span>
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <Foot icon="info">Mudou um horário em Horários? Mude o alarme no iPhone também.</Foot>
        </>
      )}

      <SectionLabel>Como criar no iPhone</SectionLabel>
      <div className="st-pad">
        <ol className="st-card st-steps">
          <li>
            <span aria-hidden="true">1</span>
            <p>
              Abra o app <b>Relógio</b> e toque em <b>Alarmes</b>.
            </p>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <p>
              Toque em <b>+</b>, escolha o horário e, em <b>Repetir</b>, marque os dias.
            </p>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <p>
              Em <b>Etiqueta</b>, escreva o texto do alarme e toque em <b>Salvar</b>.
            </p>
          </li>
        </ol>
      </div>

      {wake && bed && (
        <>
          <SectionLabel>Dica</SectionLabel>
          <div className="st-pad">
            <div className="st-card st-tip">
              <PillarBubble icon="bed" size="li" />
              <span>
                <b>Agenda de Sono do iPhone</b>
                <p>
                  No app <b>Saúde</b>, a Agenda de Sono junta o alarme das {formatTime(wake)} e a hora de deitar. Com 1h
                  para desacelerar, o iPhone entra no modo de sono às {windDown}
                  {profile?.schedule?.screensOff ===
                  `${String((Number(bed.slice(0, 2)) + 23) % 24).padStart(2, '0')}:${bed.slice(3)}`
                    ? ', junto com as telas desligadas'
                    : ''}
                  .
                </p>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
