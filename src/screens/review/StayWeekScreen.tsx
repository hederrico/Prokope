// Revisão · mais uma semana (jornada.md › Revisão · mais uma semana): o outro final da revisão, com o mesmo cuidado
// num nível mais calmo. Sem confete, sem festa e sem vibração. Diz até quando a fase segue e quando o convite volta.
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { m } from 'motion/react';
import { FullScreen, useGoBack } from '@/components/shell';
import { Button, ListGroup, ListItem } from '@/components/ui';
import { Icon } from '@/icons';
import { addDays, formatDayLong, formatDayShort, useJourney, useProfile, useReview, weekStart } from '@/data';
import { distance, tween, usePrefersReducedMotion } from '@/motion';
import { phaseTitle } from '@/screens/journey/shared';
import './review.css';

export default function StayWeekScreen() {
  const { semana = '' } = useParams();
  const rv = useReview(semana || undefined);
  const j = useJourney();
  const profile = useProfile();
  const goBack = useGoBack();
  const reduced = usePrefersReducedMotion();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const phaseNumber = rv?.summary.phase ?? j.current?.number ?? null;
  const phase = j.phases.find((p) => p.number === phaseNumber) ?? j.current;
  const next = j.phases.find((p) => phase && p.number === phase.number + 1) ?? null;
  const end = phase?.end ?? null;
  const reviewWeekday = profile?.weeklyReview?.weekday ?? 6;
  const inviteDay = end ? addDays(weekStart(end), reviewWeekday) : null;
  const tweak = rv?.review?.tweak ?? null;

  useEffect(() => {
    if (phase) titleRef.current?.focus({ preventScroll: true });
  }, [phase?.number]); // eslint-disable-line react-hooks/exhaustive-deps

  const enter = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
      : { initial: { opacity: 0, y: distance.rise }, animate: { opacity: 1, y: 0, transition: { ...tween.base, delay } } };

  if (!phase) return <FullScreen />;

  return (
    <FullScreen
      footer={
        <m.div className="rv-wfoot" {...enter(0.15)}>
          {(tweak || next) && (
            <ListGroup>
              {tweak && <ListItem icon="pencil-simple" pillar="accent" title="Seu ajuste da semana" subtitle={tweak} chevron={false} />}
              {next && (
                <ListItem
                  icon="path"
                  pillar="accent"
                  title={phaseTitle(next)}
                  subtitle={inviteDay ? `O convite volta na Revisão da semana de ${formatDayShort(inviteDay)}.` : 'O convite volta numa próxima Revisão da semana.'}
                  chevron={false}
                />
              )}
            </ListGroup>
          )}
          <Button wide onClick={() => goBack('/hoje')}>
            Ver meu dia
          </Button>
        </m.div>
      }
    >
      <div className="rv-win" data-pillar="accent">
        <div className="rv-winc rv-stay">
          <m.span className="rv-emb2" aria-hidden="true" {...enter(0)}>
            <Icon name="plant" weight="duotone" />
          </m.span>
          <m.h1 ref={titleRef} tabIndex={-1} aria-describedby="rv-stay-p" style={{ marginTop: 30 }} {...enter(0)}>
            <span className="eyebrow">{phaseTitle(phase)}</span>
            <span className="rv-big2">Mais uma semana</span>
          </m.h1>
          <m.p id="rv-stay-p" {...enter(0.15)}>
            {end
              ? `A fase ${phase.number} segue até ${formatDayLong(end)}. Firmar o que já começou também é avançar.`
              : 'Firmar o que já começou também é avançar.'}
          </m.p>
        </div>
      </div>
    </FullScreen>
  );
}
