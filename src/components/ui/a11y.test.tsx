// Acessibilidade e toque dos componentes mais usados: papéis, nomes, estados e a regra do toque da linha.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CheckButton } from './CheckButton';
import { DayPicker } from './DayPicker';
import { GoalBar } from './GoalBar';
import { HabitRow } from './HabitRow';
import { QuickAddButton } from './QuickAddButton';
import { QuickAddTile } from './QuickAddTile';
import { RatingFaces } from './RatingFaces';
import { Ring } from './Ring';
import { Switch } from './Switch';
import { WeekCard } from './WeekCard';
import { WeekStrip, type WeekDay } from './WeekStrip';

const walk = { name: 'Caminhada com o cachorro', icon: 'salsicha', pillar: 'familia' } as const;

afterEach(() => {
  vi.useRealTimers();
});

describe('CheckButton', () => {
  it('é uma caixa de seleção com o nome do hábito e o estado', () => {
    const { rerender } = render(<CheckButton checked={false} label="Louça, até 20h30" onCheckedChange={() => {}} />);
    const box = screen.getByRole('checkbox', { name: 'Louça, até 20h30' });
    expect(box).toHaveAttribute('aria-checked', 'false');
    rerender(<CheckButton checked label="Louça, até 20h30" onCheckedChange={() => {}} />);
    expect(box).toHaveAttribute('aria-checked', 'true');
  });

  it('parcial é "mixed"', () => {
    render(<CheckButton checked={false} partial label="Corrida" onCheckedChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Corrida' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('marca no toque e ignora um segundo toque em até 300 ms', () => {
    const on = vi.fn();
    render(<CheckButton checked={false} label="Louça" onCheckedChange={on} />);
    const box = screen.getByRole('checkbox', { name: 'Louça' });
    fireEvent.click(box);
    fireEvent.click(box);
    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith(true);
  });

  it('vibra ao marcar, menos com vibrate={false} (dia passado)', async () => {
    const vibrate = vi.fn(() => true);
    const had = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true });
    try {
      // a vibração ignora toques a menos de 60 ms um do outro
      await new Promise((r) => setTimeout(r, 80));
      const { unmount } = render(<CheckButton checked={false} vibrate={false} label="Louça" onCheckedChange={() => {}} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Louça' }));
      expect(vibrate).not.toHaveBeenCalled();
      unmount();
      render(<CheckButton checked={false} label="Lixo" onCheckedChange={() => {}} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Lixo' }));
      expect(vibrate).toHaveBeenCalledTimes(1);
    } finally {
      if (had) Object.defineProperty(navigator, 'vibrate', had);
      else delete (navigator as { vibrate?: unknown }).vibrate;
    }
  });
});

describe('HabitRow', () => {
  it('tem dois alvos irmãos: a linha (nome e subtítulo) e o controle', () => {
    const open = vi.fn();
    const mark = vi.fn();
    render(
      <ul>
        <HabitRow
          habit={walk}
          subtitle="2 de 7 · meta 6"
          control={<CheckButton checked={false} label="Caminhada com o cachorro" onCheckedChange={mark} />}
          onOpen={open}
          onLongPress={() => {}}
        />
      </ul>,
    );
    const row = screen.getByRole('button', { name: 'Caminhada com o cachorro, 2 de 7 · meta 6' });
    const ctl = screen.getByRole('checkbox', { name: 'Caminhada com o cachorro' });
    expect(row.contains(ctl)).toBe(false);
    expect(ctl.contains(row)).toBe(false);
    fireEvent.click(row);
    expect(open).toHaveBeenCalledTimes(1);
    expect(mark).not.toHaveBeenCalled();
  });

  it('o toque longo de 500 ms abre o menu e não abre o hábito', () => {
    vi.useFakeTimers();
    const open = vi.fn();
    const menu = vi.fn();
    render(
      <ul>
        <HabitRow habit={walk} onOpen={open} onLongPress={menu} />
      </ul>,
    );
    const row = screen.getByRole('button', { name: 'Caminhada com o cachorro' });
    fireEvent.pointerDown(row, { button: 0, clientX: 10, clientY: 10 });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(menu).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(menu).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(row);
    fireEvent.click(row);
    expect(open).not.toHaveBeenCalled();
  });

  it('arrastar o dedo cancela o toque longo', () => {
    vi.useFakeTimers();
    const menu = vi.fn();
    render(
      <ul>
        <HabitRow habit={walk} onOpen={() => {}} onLongPress={menu} />
      </ul>,
    );
    const row = screen.getByRole('button', { name: 'Caminhada com o cachorro' });
    fireEvent.pointerDown(row, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(row, { clientX: 10, clientY: 40 });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(menu).not.toHaveBeenCalled();
  });

  it('tem a alternativa ao toque longo: "Mais opções" e Shift+F10', () => {
    const menu = vi.fn();
    render(
      <ul>
        <HabitRow habit={walk} onOpen={() => {}} onLongPress={menu} />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mais opções de Caminhada com o cachorro' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Caminhada com o cachorro' }), { key: 'F10', shiftKey: true });
    expect(menu).toHaveBeenCalledTimes(2);
  });

  it('o convite gentil tem a ação como botão', () => {
    const act2 = vi.fn();
    render(
      <ul>
        <HabitRow habit={walk} nudge={{ text: 'Hoje é um bom dia para voltar.', action: 'Marcar ontem', onAction: act2 }} />
      </ul>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Marcar ontem' }));
    expect(act2).toHaveBeenCalled();
  });
});

describe('GoalBar', () => {
  it('é um medidor com o total e a meta por extenso', () => {
    render(<GoalBar segments={[18, 6, 22]} goal={80} unit="g" unitName="gramas" />);
    const meter = screen.getByRole('meter', { name: '46 de 80 gramas' });
    expect(meter).toHaveAttribute('aria-valuenow', '46');
    expect(meter).toHaveAttribute('aria-valuemax', '80');
    expect(screen.getByText('meta 80 g')).toBeInTheDocument();
  });

  it('meta batida mostra o selo', () => {
    render(<GoalBar segments={[18, 6, 22, 30, 10]} goal={80} unit="g" unitName="gramas" />);
    expect(screen.getByText('meta batida')).toBeInTheDocument();
  });
});

describe('WeekStrip e WeekCard', () => {
  const days: WeekDay[] = [
    { date: '2026-10-19', value: 0.83, state: 'done' },
    { date: '2026-10-20', value: 0.75, state: 'done' },
    { date: '2026-10-21', value: 0.6, state: 'done' },
    { date: '2026-10-22', value: 0.25, state: 'done' },
    { date: '2026-10-23', value: 0, state: 'future' },
    { date: '2026-10-24', value: 0, state: 'future' },
    { date: '2026-10-25', value: 0, state: 'future' },
  ];

  it('é uma lista; dia passado é botão e o futuro não é tocável', () => {
    const sel = vi.fn();
    render(<WeekStrip days={days} today="2026-10-22" onSelect={sel} />);
    expect(screen.getByRole('list', { name: 'Semana' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quinta, 22, hoje. 25% do dia feito.' }));
    expect(sel).toHaveBeenCalledWith('2026-10-22');
    expect(screen.queryByRole('button', { name: /Sexta, 23/ })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('outro dia: o escolhido tem aria-pressed e o de hoje, aria-current="date"', () => {
    render(<WeekStrip days={days} today="2026-10-22" selected="2026-10-21" onSelect={() => {}} />);
    const wed = screen.getByRole('button', { name: /^Quarta, 21/ });
    const thu = screen.getByRole('button', { name: /^Quinta, 22, hoje/ });
    expect(wed).toHaveAttribute('aria-pressed', 'true');
    expect(wed).not.toHaveAttribute('aria-current');
    expect(thu).toHaveAttribute('aria-pressed', 'false');
    expect(thu).toHaveAttribute('aria-current', 'date');
  });

  it('"76% na semana" abre o Progresso', () => {
    const go = vi.fn();
    render(<WeekCard doneToday={3} totalToday={12} weekPct={76} days={days} today="2026-10-22" onOpenProgress={go} />);
    fireEvent.click(screen.getByRole('button', { name: '76% na semana. Abre o Progresso' }));
    expect(go).toHaveBeenCalled();
  });
});

describe('controles', () => {
  it('rostinhos: grupo de rádio "Humor" com cada rosto nomeado', () => {
    const on = vi.fn();
    render(<RatingFaces kind="mood" value={4} onChange={on} />);
    expect(screen.getByRole('radiogroup', { name: 'Humor' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Bem, 4 de 5' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Muito bem, 5 de 5' }));
    expect(on).toHaveBeenCalledWith(5);
  });

  it('interruptor com papel switch e nome', () => {
    const on = vi.fn();
    render(<Switch checked={false} onCheckedChange={on} label="Tolerância de 1h" />);
    const sw = screen.getByRole('switch', { name: 'Tolerância de 1h' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(on).toHaveBeenCalledWith(true);
  });

  it('dias da semana como caixas de seleção', () => {
    const on = vi.fn();
    render(<DayPicker value={[0, 3]} onChange={on} label="Dias de coleta" />);
    expect(screen.getByRole('group', { name: 'Dias de coleta' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Segunda' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Terça' }));
    expect(on).toHaveBeenCalledWith([0, 1, 3]);
  });

  it('botões de somar dizem a unidade por extenso', () => {
    render(
      <>
        <QuickAddButton amount="500 ml" onClick={() => {}} />
        <QuickAddTile name="Ovo" grams={6} onAdd={() => {}} />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Somar 500 mililitros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Somar ovo, 6 gramas' })).toBeInTheDocument();
  });

  it('anel com label vira medidor; sem label, é decorativo', () => {
    const { container } = render(
      <>
        <Ring size={40} value={0.5} label="Água, 1,5 de 3 litros" />
        <Ring size={36} value={0.25} />
      </>,
    );
    expect(screen.getByRole('meter', { name: 'Água, 1,5 de 3 litros' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getAllByRole('meter')).toHaveLength(1);
    container.querySelectorAll('svg').forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });
});
