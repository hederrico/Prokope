import { render } from '@testing-library/react';
import { Icon, isIconName } from '@/icons';

describe('Icon', () => {
  it('desenha um ícone do Phosphor pelo nome, decorativo', () => {
    const { container } = render(<Icon name="sun" weight="fill" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 256 256');
  });

  it('desenha a Salsicha nos quatro pesos, com a máscara do Fill única por ícone', () => {
    const { container } = render(
      <>
        <Icon name="salsicha" weight="regular" />
        <Icon name="salsicha" weight="duotone" />
        <Icon name="salsicha" weight="bold" />
        <Icon name="salsicha" weight="fill" />
        <Icon name="salsicha" weight="fill" />
      </>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(5);
    const masks = [...container.querySelectorAll('mask')].map((m) => m.id);
    expect(masks).toHaveLength(2);
    expect(new Set(masks).size).toBe(2);
  });

  it('reconhece nomes de ícone vindos dos dados', () => {
    expect(isIconName('salsicha')).toBe(true);
    expect(isIconName('person-simple-walk')).toBe(true);
    expect(isIconName('dog')).toBe(false);
  });
});
