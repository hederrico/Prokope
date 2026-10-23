// ProfileCard: o perfil em Ajustes e em Dados e conta. Quadro: classe .profile. É o único lugar do avatar.
// Avatar de 56 px com a inicial (decorativo), nome e "Conta Google conectada". VoiceOver: "Henrique, conta Google conectada."
import clsx from 'clsx';
import { Icon, type IconName } from '@/icons';
import './ui.css';

export type ProfileCardProps = {
  name: string;
  email?: string;
  /** linha de baixo; o padrão é "Conta Google conectada" (ou o e-mail) */
  detail?: string;
  detailIcon?: IconName;
  /** "desde 21 de setembro" */
  since?: string;
  onClick?: () => void;
  className?: string;
};

export function ProfileCard({ name, email, detail, detailIcon = 'google-logo', since, onClick, className }: ProfileCardProps) {
  const line = detail ?? (email ? email : 'Conta Google conectada');
  const initial = name.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
  const body = (
    <>
      <span className="pk-avatar" aria-hidden="true">
        {initial}
      </span>
      <span style={{ minWidth: 0 }}>
        <b>{name}</b>
        <small>
          <Icon name={detailIcon} weight="regular" />
          {line}
          {since && <> · {since}</>}
        </small>
      </span>
      {onClick && (
        <span className="chev" aria-hidden="true">
          <Icon name="caret-right" weight="bold" />
        </span>
      )}
    </>
  );
  const label = `${name}, ${line.charAt(0).toLocaleLowerCase('pt-BR')}${line.slice(1)}${since ? `, ${since}` : ''}`;
  if (onClick) {
    return (
      <button type="button" className={clsx('pk-reset pk-lg pk-profile', className)} aria-label={label} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={clsx('pk-lg pk-profile', className)}>{body}</div>;
}
