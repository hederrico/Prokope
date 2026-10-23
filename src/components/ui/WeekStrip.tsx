// WeekStrip: a semana com anéis, um por dia. Quadro: week(vals, hoje, nums, head).
// Hoje: anel em --accent-ink e número em destaque. Passado: anel parcial ou cheio (sem registro, só o trilho).
// Pausado: trilho tracejado. Futuro: vazado e não tocável. Escolhido (Hoje · outro dia): fundo --accent-wash e contorno.
// O anel de hoje anda em fill, +120 ms depois do toque. Na montagem, os anéis já estão no valor.
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { choreography } from '@/motion/tokens';
import { Ring } from './Ring';
import './ui.css';

export type WeekDay = {
  /** AAAA-MM-DD */
  date: string;
  /** fração do dia feita, de 0 a 1 */
  value: number;
  state: 'done' | 'empty' | 'paused' | 'future';
};

export type WeekStripProps = {
  days: WeekDay[];
  /** AAAA-MM-DD de hoje (dia lógico) */
  today: string;
  /** dia escolhido no "Hoje · outro dia" */
  selected?: string;
  /** toque num dia passado (ou hoje) */
  onSelect?: (date: string) => void;
  /** conteúdo acima dos anéis, no mesmo cartão (o WeekCard usa) */
  head?: ReactNode;
  /** conteúdo abaixo dos anéis, no mesmo cartão (ajuste da semana) */
  foot?: ReactNode;
  /** sem cartão (dentro de outro cartão, como o convite da revisão) */
  bare?: boolean;
  className?: string;
};

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Partes de uma data AAAA-MM-DD, sem fuso (meio-dia local evita a virada do horário de verão). */
export function dayParts(date: string): { weekday: number; day: number } {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1, 12);
  return { weekday: dt.getDay(), day: dt.getDate() };
}

/** Converte a semana do domínio (WeekDayView de src/domain/views.ts) para os dias da WeekStrip.
 *  Antes do começo do plano, o dia fica vazado e sem toque, como o futuro. */
export function toWeekDays(
  days: { day: string; ratio: number; isFuture: boolean; paused: boolean; beforeStart?: boolean }[],
): WeekDay[] {
  return days.map((d) => ({
    date: d.day,
    value: d.ratio,
    state: d.isFuture || d.beforeStart ? 'future' : d.paused ? 'paused' : d.ratio > 0 ? 'done' : 'empty',
  }));
}

/** Nome lido de um dia: "Quinta, 22. 25% do dia feito." */
export function weekDayLabel(day: WeekDay, today: string): string {
  const { weekday, day: n } = dayParts(day.date);
  const base = `${NAMES[weekday]}, ${n}${day.date === today ? ', hoje' : ''}`;
  if (day.state === 'future') return base;
  if (day.state === 'paused') return `${base}. Pausado.`;
  return `${base}. ${Math.round(day.value * 100)}% do dia feito.`;
}

export function WeekStrip({ days, today, selected, onSelect, head, foot, bare, className }: WeekStripProps) {
  const list = (
    <ul className="pk-wk" aria-label="Semana">
      {days.map((d) => {
        const { weekday, day } = dayParts(d.date);
        const isToday = d.date === today;
        const future = d.state === 'future' || d.date > today;
        const inner = (
          <>
            <span aria-hidden="true">{LETTERS[weekday]}</span>
            <span className="rg" aria-hidden="true">
              <Ring
                size={36}
                stroke={3.5}
                value={future ? 0 : d.value}
                color={isToday ? 'var(--accent-ink)' : 'var(--accent-mark)'}
                timing="fill"
                delay={isToday ? choreography.distant * 1000 : 0}
                dashedTrack={d.state === 'paused'}
              />
              <b>{day}</b>
            </span>
          </>
        );
        const cls = clsx('pk-wkd', isToday && 'today', future && 'future', selected === d.date && 'sel');
        return (
          <li key={d.date} className={cls}>
            {!future && onSelect ? (
              <button
                type="button"
                className="pk-reset in pk-wkd-b"
                aria-label={weekDayLabel(d, today)}
                aria-current={selected === d.date ? 'date' : undefined}
                onClick={() => onSelect(d.date)}
              >
                {inner}
              </button>
            ) : (
              <span className="in" role="img" aria-label={weekDayLabel(d, today)}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
  if (bare) return <div className={clsx('pk-wkbare', className)}>{list}</div>;
  return (
    <div className={clsx('pk-card', head != null && 'pk-wkc', className)}>
      {head != null && <div className="pk-wkh">{head}</div>}
      {list}
      {foot}
    </div>
  );
}
