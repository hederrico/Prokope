// PatternWaitCard: o padrão em formação (estados.md › Progresso · poucos dados). Cartão tracejado com quanto falta,
// em frase e com as barrinhas. Os dias sem ficam em cinza neutro e nunca animam, para não virarem meta.
// No Progresso é um botão que abre o hábito; no hábito, aparece no lugar do insight, parado.
import clsx from 'clsx';
import { PillarBubble, pillarAttrs, type PillarColor } from '@/components/ui';
import { Icon, type IconName } from '@/icons';
import { capitalize } from '@/data';
import { waitingSentence } from '@/screens/habit/text';

export interface PatternWaitCardProps {
  habitName: string;
  /** "caminhada" */
  short: string;
  icon: IconName;
  pillar?: PillarColor;
  metric: 'mood' | 'energy';
  withDays: number;
  withoutDays: number;
  needed: number;
  /** cabeçalho com o nome do padrão (no Progresso) */
  showHeader?: boolean;
  /** "Você caminhou em quase todos os dias, então ainda não dá para comparar.": quando faltam só dias sem */
  almostAll?: string;
  onOpen?: () => void;
}

function Segments({ n, needed, neutral }: { n: number; needed: number; neutral?: boolean }) {
  return (
    <span className={clsx('pg-s7', neutral && 'n')} aria-hidden="true">
      {Array.from({ length: needed }, (_, i) => (
        <i key={i} className={i < n ? 'on' : undefined} />
      ))}
    </span>
  );
}

export function PatternWaitCard({
  habitName,
  short,
  icon,
  pillar,
  metric,
  withDays,
  withoutDays,
  needed,
  showHeader = true,
  almostAll,
  onOpen,
}: PatternWaitCardProps) {
  const missingWith = Math.max(0, needed - withDays);
  const missingWithout = Math.max(0, needed - withoutDays);
  const what = metric === 'mood' ? 'humor' : 'energia';
  const sentence =
    almostAll && missingWith === 0 ? almostAll : waitingSentence(missingWith, missingWithout, short, needed);
  const w = Math.min(withDays, needed);
  const wo = Math.min(withoutDays, needed);
  const a11y = `${capitalize(short)} e ${what}, em formação. ${
    missingWith > 0 ? `Faltam ${missingWith} ${missingWith === 1 ? 'dia' : 'dias'} com ${short}. ` : ''
  }Com ${short}, ${w} de ${needed}. Sem ${short}, ${wo} de ${needed}.`;
  const p = pillarAttrs(pillar);
  const body = (
    <>
      {showHeader && (
        <span className="pg-wh">
          <PillarBubble icon={icon} pillar={pillar} size="sm" />
          <span>
            <b>
              {capitalize(short)} e {what}
            </b>
            <span className="cap">o padrão mais perto de aparecer</span>
          </span>
        </span>
      )}
      <p>{sentence}</p>
      <span className="pg-cnts">
        <span className="pg-cnt">
          <span>Com {short}</span>
          <Segments n={w} needed={needed} />
          <em>
            {w} de {needed}
          </em>
        </span>
        <span className="pg-cnt">
          <span>Sem {short}</span>
          <Segments n={wo} needed={needed} neutral />
          <em>
            {wo} de {needed}
          </em>
        </span>
      </span>
      {missingWith > 0 && <small>Os dias sem chegam no tempo deles. Não precisa mudar nada.</small>}
    </>
  );
  if (onOpen) {
    return (
      <button
        type="button"
        className={clsx('pk-reset pg-wait pk-press', p.className)}
        data-pillar={p['data-pillar']}
        data-hue={p['data-hue']}
        aria-label={a11y}
        title={habitName}
        onClick={onOpen}
      >
        {body}
      </button>
    );
  }
  return (
    <div
      className={clsx('pg-wait', p.className)}
      data-pillar={p['data-pillar']}
      data-hue={p['data-hue']}
      role="group"
      aria-label={a11y}
    >
      {body}
    </div>
  );
}

/** "Mais 2 padrões a caminho" (não é tocável). */
export function MorePatterns({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <p className="pg-more">
      <Icon name="hourglass-medium" weight="regular" />
      {count === 1 ? 'Mais 1 padrão a caminho' : `Mais ${count} padrões a caminho`}
    </p>
  );
}
