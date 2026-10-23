// A barra da tela empurrada e do formulário (componentes.md › NavBar; quadro: nb()).
// Tela empurrada: "‹ Hoje" (o nome da tela anterior) à esquerda, título opcional, ação à direita.
// Formulário em tela cheia: "Cancelar", o título e "Criar" (ao criar) ou "Salvar" (ao editar), desabilitada até
// o campo obrigatório ser preenchido. Com título na serifa logo abaixo, a barra fica só com o voltar.
import { Icon, type IconName } from '@/icons';
import { useBackTarget, useGoBack } from './navigation';

export interface NavBarProps {
  /** nome da tela anterior no voltar (padrão: o da pilha da aba) */
  back?: string;
  /** o que o voltar ou o Cancelar fazem (padrão: voltar para a tela anterior) */
  onBack?: () => void;
  /** formulário: "Cancelar" no lugar do voltar (ou outro texto) */
  cancel?: boolean | string;
  /** sem voltar (raiz de um fluxo) */
  noBack?: boolean;
  title?: string;
  action?: { label: string; icon?: IconName; onClick: () => void; disabled?: boolean };
  className?: string;
}

export function NavBar({ back, onBack, cancel, noBack, title, action, className }: NavBarProps) {
  const target = useBackTarget();
  const goBack = useGoBack();
  const label = back ?? target?.label ?? 'Voltar';
  const leave = onBack ?? (() => goBack());

  let left = <span />;
  if (cancel) {
    left = (
      <button type="button" className="sh-nb-left hit" onClick={leave}>
        <span>{typeof cancel === 'string' ? cancel : 'Cancelar'}</span>
      </button>
    );
  } else if (!noBack) {
    left = (
      <button type="button" className="sh-nb-left hit" aria-label={`Voltar para ${label}`} onClick={leave}>
        <Icon name="caret-left" weight="bold" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={className ? `sh-nb ${className}` : 'sh-nb'}>
      {left}
      {title ? (
        <h1 className="sh-nb-title" tabIndex={-1}>
          {title}
        </h1>
      ) : (
        <span />
      )}
      {action ? (
        <button
          type="button"
          className="sh-nb-act hit"
          aria-label={action.icon ? action.label : undefined}
          aria-disabled={action.disabled || undefined}
          onClick={() => {
            if (!action.disabled) action.onClick();
          }}
        >
          {action.icon ? <Icon name={action.icon} weight="bold" /> : action.label}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
