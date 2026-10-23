// Progresso (aba): o seletor de período (semana, mês ou fase, voltando no tempo), os chips Visão geral, Humor,
// Medidas e um por pilar da pessoa, na ordem dela, e a vista escolhida. Tudo fica na URL:
// /progresso?periodo=semana|mes|fase&tema=visao|humor|medidas|<pilar>&semana=AAAA-MM-DD&mes=AAAA-MM&fase=N.
// Trocar de período anda 12 px na direção do tempo com opacidade em base; trocar de tema troca em micro.
import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, m } from 'motion/react';
import { useSearchParams } from 'react-router';
import { ScreenHeader, useOpenSheet } from '@/components/shell';
import { pillarAttrs, useReduced } from '@/components/ui';
import { Icon } from '@/icons';
import { distance, fadeUp, spring, tween } from '@/motion';
import {
  addDays,
  capitalize,
  diffDays,
  monthName,
  parseDay,
  useNow,
  useJourney,
  useProgress,
  weekStart
} from '@/data';
import type { DayKey } from '@/types';
import { MeasuresView } from './MeasuresView';
import { MoodView } from './MoodView';
import { OverviewView } from './OverviewView';
import { PeriodSelector } from './PeriodSelector';
import { PillarView } from './PillarView';
import { pillarColor } from './format';
import './progress.css';

type Periodo = 'semana' | 'mes' | 'fase';

const THEME_URL: Record<string, string> = { overview: 'visao', mood: 'humor', measures: 'medidas' };
const THEME_KEY: Record<string, string> = { visao: 'overview', humor: 'mood', medidas: 'measures' };

function relWeeks(n: number) {
  if (n === 0) return 'esta semana';
  if (n === 1) return 'semana passada';
  return `há ${n} semanas`;
}

export default function ProgressScreen() {
  const [params, setParams] = useSearchParams();
  const { today } = useNow();
  const openSheet = useOpenSheet();
  const reduced = useReduced();

  const periodo: Periodo = (['semana', 'mes', 'fase'] as const).find((x) => x === params.get('periodo')) ?? 'semana';
  const temaParam = params.get('tema') ?? 'visao';
  const semana = params.get('semana');
  const mes = params.get('mes');
  const faseParam = params.get('fase');
  const anchor: DayKey | undefined =
    periodo === 'semana' && semana && /^\d{4}-\d{2}-\d{2}$/.test(semana)
      ? semana
      : periodo === 'mes' && mes && /^\d{4}-\d{2}$/.test(mes)
        ? `${mes}-01`
        : undefined;
  const fase = periodo === 'fase' && faseParam ? Number(faseParam) || undefined : undefined;

  const p = useProgress(periodo, temaParam, { anchor: anchor && anchor <= today ? anchor : undefined, phase: fase });
  const range = p.range;
  // antes do começo do plano não há o que ver: a seta de voltar desliga na primeira semana (ou no primeiro mês)
  const journey = useJourney();
  const planStart = journey.phases.find((ph) => ph.start && ph.status !== 'future')?.start ?? null;
  const prevAnchor =
    range.prev && planStart && range.period !== 'phase'
      ? (range.period === 'week' ? addDays(weekStart(range.prev), 6) : range.prev) < planStart
        ? null
        : range.prev
      : range.prev;
  const themeKey = THEME_KEY[temaParam] ?? (p.chips.some((c) => c.key === temaParam) ? temaParam : 'overview');

  // ---------- URL ----------
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const anchorPatch = (period: Periodo, a: string | null): Record<string, string | null> => ({
    periodo: period,
    semana: period === 'semana' ? a : null,
    mes: period === 'mes' ? a : null,
    fase: period === 'fase' ? a : null,
  });
  const goAnchor = (a: string | null) => {
    if (a === null) return;
    if (periodo === 'semana') update(anchorPatch('semana', weekStart(a) === weekStart(today) ? null : weekStart(a)));
    else if (periodo === 'mes') update(anchorPatch('mes', a.slice(0, 7) === today.slice(0, 7) ? null : a.slice(0, 7)));
    else update(anchorPatch('fase', a));
  };
  const setTheme = (key: string) => {
    const url = THEME_URL[key] ?? key;
    if (key === 'mood' && periodo === 'semana') {
      // o período vira o mês que contém a semana escolhida
      const ref = range.to > today ? today : range.to;
      update({ tema: url, ...anchorPatch('mes', ref.slice(0, 7) === today.slice(0, 7) ? null : ref.slice(0, 7)) });
      return;
    }
    update({ tema: url });
  };
  const goPhase = (n: number) => update(anchorPatch('fase', String(n)));
  const goMonth = (a: DayKey) => update(anchorPatch('mes', a.slice(0, 7) === today.slice(0, 7) ? null : a.slice(0, 7)));
  const backToNow = () => {
    if (periodo === 'fase') update(anchorPatch('fase', null));
    else update(anchorPatch(periodo, null));
  };

  // ---------- rótulos do seletor ----------
  let label = range.label;
  let sublabel = range.sublabel;
  if (range.period === 'week') {
    sublabel = relWeeks(Math.round(diffDays(weekStart(today), range.from) / 7));
  } else if (range.period === 'month') {
    const { year, month } = parseDay(range.from);
    label = capitalize(monthName(month)) + (year !== parseDay(today).year ? ` de ${year}` : '');
    const back = (parseDay(today).year - year) * 12 + parseDay(today).month - month;
    sublabel = back === 0 ? 'este mês' : back === 1 ? 'mês passado' : `há ${back} meses`;
  }
  const nowLabel =
    range.period === 'week' ? 'Voltar para esta semana' : range.period === 'month' ? 'Voltar para este mês' : 'Voltar para a fase atual';

  // ---------- troca de conteúdo ----------
  const contentKey = `${themeKey}|${range.from}`;
  const [last, setLast] = useState({ key: contentKey, theme: themeKey, from: range.from, change: 'none', dir: 0 });
  if (last.key !== contentKey) {
    setLast({
      key: contentKey,
      theme: themeKey,
      from: range.from,
      change: last.theme !== themeKey ? 'theme' : 'period',
      dir: range.from > last.from ? 1 : -1,
    });
  }
  const initial =
    last.change === 'none'
      ? false
      : last.change === 'theme'
        ? { opacity: 0 }
        : { opacity: 0, x: (reduced ? 0 : last.dir) * distance.day };

  // ---------- chips: a fileira rola até o escolhido ----------
  const rowRef = useRef<HTMLDivElement>(null);
  const firstScroll = useRef(true);
  useLayoutEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip) return;
    const rr = row.getBoundingClientRect();
    const cr = chip.getBoundingClientRect();
    const left = cr.left - rr.left + row.scrollLeft;
    const target = Math.max(0, Math.min(row.scrollWidth - row.clientWidth, left - (row.clientWidth - cr.width) / 2));
    const visible = cr.left >= rr.left && cr.right <= rr.right;
    if (visible) {
      firstScroll.current = false;
      return;
    }
    if (firstScroll.current || reduced) {
      firstScroll.current = false;
      row.scrollLeft = target;
      return;
    }
    const ctl = animate(row.scrollLeft, target, { ...spring.calma, onUpdate: (v) => (row.scrollLeft = v) });
    return () => ctl.stop();
  }, [themeKey, reduced]);

  // o chip escolhido responde com a mola toque
  const pressed = useRef<string | null>(null);
  useEffect(() => {
    const key = pressed.current;
    pressed.current = null;
    if (!key || reduced) return;
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(key)}"]`);
    if (el) void animate(el, { scale: [0.94, 1] }, spring.toque);
  }, [themeKey, reduced]);

  const sheet = params.get('folha');
  const selectedDay = sheet === 'dia' ? params.get('dia') : null;
  const openDay = (day: DayKey) => openSheet('dia', { dia: day });

  return (
    <>
      <ScreenHeader
        className="pg-hd"
        title="Progresso"
        trailing={
          <>
            <PeriodSelector
              label={label}
              sublabel={sublabel}
              onPrev={prevAnchor ? () => goAnchor(prevAnchor) : null}
              onNext={range.next ? () => goAnchor(range.next) : null}
            />
            {!range.isCurrent && (
              <m.button type="button" className="pk-reset pg-now hit" onClick={backToNow} {...fadeUp}>
                <Icon name="arrow-counter-clockwise" weight="bold" />
                {nowLabel}
              </m.button>
            )}
          </>
        }
      />
      <div className="pg-filt" ref={rowRef} role="group" aria-label="O que ver">
        {p.chips.map((c) => {
          const on = c.key === themeKey;
          const pa = pillarAttrs(pillarColor(c.pillar));
          return (
            <button
              key={c.key}
              type="button"
              data-chip={c.key}
              className={clsx('pk-reset pk-chip hit', on && 'sel', pa.className)}
              data-pillar={pa['data-pillar']}
              data-hue={pa['data-hue']}
              aria-pressed={on}
              onClick={() => {
                if (on) return;
                pressed.current = c.key;
                setTheme(c.key);
              }}
            >
              {c.pillar && <i className="pg-cd" aria-hidden="true" />}
              {c.label}
            </button>
          );
        })}
      </div>
      <m.div
        key={contentKey}
        initial={initial}
        animate={{ opacity: 1, x: 0 }}
        transition={last.change === 'theme' ? tween.micro : tween.base}
      >
        {themeKey === 'overview' && (
          <OverviewView p={p} today={today} onTheme={setTheme} onPhase={goPhase} onMonth={goMonth} />
        )}
        {themeKey === 'mood' && <MoodView p={p} today={today} selected={selectedDay} onOpenDay={openDay} />}
        {themeKey === 'measures' && <MeasuresView p={p} today={today} onOpenDay={openDay} />}
        {themeKey !== 'overview' && themeKey !== 'mood' && themeKey !== 'measures' && (
          <PillarView p={p} today={today} onOpenDay={openDay} />
        )}
      </m.div>
    </>
  );
}

