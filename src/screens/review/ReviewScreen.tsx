// Revisão da semana · passos 1 a 3 (jornada.md › Revisão da semana). Começa pelo que deu certo; o passo 2 é todo
// opcional; no fim da fase, o passo 3 convida para a próxima com duas escolhas do mesmo peso.
// O ‹ volta um passo; o X fecha, guarda o passo e o rascunho e não pergunta nada.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { m } from 'motion/react';
import { FullScreen, StepTop, StepTransition, pastReviewPath, showToast, useFlowStep, useGoBack } from '@/components/shell';
import { Button, Card, DayPicker, PillarBubble, Ring, SectionLabel, TextField, WeekDots, pillarAttrs } from '@/components/ui';
import type { IconName } from '@/icons';
import { finishReview, saveReviewStep, startPhase, stayInPhase, type ReviewStepPatch } from '@/actions';
import {
  addDays,
  formatDayShort,
  formatNumber,
  formatPercent,
  formatRange,
  useDataStatus,
  useDrafts,
  useHabits,
  useJourney,
  useNow,
  useReview,
  weekStart,
  type ReviewDraft,
  type ReviewLine,
  type ReviewView,
} from '@/data';
import type { Habit, Pillar } from '@/types';
import { cascadeDelay, distance, tween, usePrefersReducedMotion } from '@/motion';
import { lineDots, offerRow, splitLine } from './lines';
import './review.css';

type HabitInfo = { habit: Habit; pillar: Pillar | null };

export default function ReviewScreen() {
  const { semana = '' } = useParams();
  const { step: rawStep, goTo } = useFlowStep();
  const rv = useReview(semana || undefined);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const habits = useHabits('all');
  const drafts = useDrafts();
  const { status } = useDataStatus();

  const week = rv?.week ?? (semana ? weekStart(semana) : '');
  const steps = rv ? (rv.steps === 3 && rv.next ? 3 : 2) : 3;
  const n = Math.min(steps, Math.max(1, rawStep));
  const draft = drafts.reviews[week];
  // o passo 2 grava o rascunho a cada 300 ms; antes de trocar de passo ou fechar, o que falta vai junto
  const flushRef = useRef<() => void>(() => {});
  const byId = useMemo(() => {
    const map = new Map<string, HabitInfo>();
    for (const h of habits) map.set(h.habit.id, { habit: h.habit, pillar: h.pillar });
    return map;
  }, [habits]);

  // revisão já feita: abre a leitura
  useEffect(() => {
    if (rv?.readOnly) void navigate(pastReviewPath(rv.window.day, 'jornada'), { replace: true });
  }, [rv?.readOnly, rv?.window.day, navigate]);
  // espera as fases chegarem: antes disso, a revisão de fim de fase pareceria de 2 passos
  if (!rv || status !== 'ready') return <FullScreen />;

  /** O que está no rascunho, no formato da ação. */
  const patchFromDraft = (d: ReviewDraft | undefined): ReviewStepPatch => {
    const out: ReviewStepPatch = {};
    if (!d) return out;
    if (d.tweakWorked !== undefined) out.tweakWorked = d.tweakWorked;
    if (d.tweak !== undefined) out.tweak = d.tweak.trim() || null;
    if (d.waist !== undefined) {
      const v = Number(String(d.waist).replace(',', '.'));
      out.waist = d.waist.trim() && Number.isFinite(v) && v > 0 ? v : null;
    }
    if (d.together !== undefined) out.together = d.together;
    return out;
  };

  const close = () => {
    flushRef.current();
    const d = useDrafts.getState().reviews[week];
    drafts.setReviewDraft(week, { step: n });
    void saveReviewStep(week, n, patchFromDraft(d));
    goBack('/hoje');
  };

  const next = async () => {
    flushRef.current();
    const d = useDrafts.getState().reviews[week];
    if (n < steps) {
      drafts.setReviewDraft(week, { step: n + 1 });
      void saveReviewStep(week, n + 1, patchFromDraft(d));
      goTo(n + 1);
      return;
    }
    // revisão do meio da fase: conclui e volta ao Hoje
    await saveReviewStep(week, n, patchFromDraft(d));
    await finishReview(week);
    drafts.clearReviewDraft(week);
    goBack('/hoje');
    showToast({ title: 'Revisão da semana feita' });
  };

  return (
    <FullScreen
      top={
        <StepTop
          step={n}
          total={steps}
          onBack={() => {
            flushRef.current();
            goTo(n - 1);
          }}
          onClose={close}
        />
      }
      footer={n === 3 ? <ChoiceFooter rv={rv} week={week} /> : <StepFooter n={n} steps={steps} onNext={() => void next()} />}
    >
      <StepTransition step={n}>
        {n === 1 && <StepOne rv={rv} byId={byId} draft={draft} week={week} />}
        {n === 2 && <StepTwo rv={rv} byId={byId} draft={draft} week={week} flushRef={flushRef} />}
        {n === 3 && <StepThree rv={rv} byId={byId} />}
      </StepTransition>
    </FullScreen>
  );
}

function StepFooter({ n, steps, onNext }: { n: number; steps: number; onNext: () => void }) {
  return (
    <div className="rv-foot">
      <Button wide onClick={onNext}>
        {n === steps ? 'Concluir' : 'Continuar'}
      </Button>
      {n === 2 && <p className="foot">Tudo nesta tela é opcional.</p>}
    </div>
  );
}

// ---------- passo 1 ----------

function weekContext(rv: ReviewView, phaseStart: string | null): string {
  const s = rv.summary;
  if (s.endOfPhase && s.phase) return `fim da fase ${s.phase}`;
  if (s.phase && phaseStart) {
    const i = Math.floor((Date.parse(rv.week) - Date.parse(weekStart(phaseStart))) / 604_800_000) + 1;
    return `semana ${i} da fase ${s.phase}`;
  }
  return '';
}

function StepOne({
  rv,
  byId,
  draft,
  week,
}: {
  rv: ReviewView;
  byId: Map<string, HabitInfo>;
  draft: ReviewDraft | undefined;
  week: string;
}) {
  const reduced = usePrefersReducedMotion();
  const j = useJourney();
  const drafts = useDrafts();
  const s = rv.summary;
  const phase = j.phases.find((p) => p.number === s.phase);
  const context = weekContext(rv, phase?.start ?? null);
  const ratio = s.constancy ?? 0;
  // o anel se desenha 120 ms depois da entrada
  const [ring, setRing] = useState(reduced ? ratio : 0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRing(ratio));
    return () => cancelAnimationFrame(id);
  }, [ratio]);
  const lines = s.highlights;
  const careDelay = reduced ? 0 : cascadeDelay(Math.max(0, lines.length - 1)) + tween.base.duration + 0.15;
  const worked = draft?.tweakWorked ?? rv.review?.tweakWorked ?? null;

  return (
    <div>
      <div className="rv-head">
        <h1 className="lt">Sua semana</h1>
        <p className="sub">
          {formatRange(rv.week, addDays(rv.week, 6))}
          {context ? ` · ${context}` : ''}
        </p>
        <div className="rv-ring">
          <Ring
            size={108}
            stroke={10}
            value={ring}
            delay={120}
            color="var(--accent-mark)"
            track="var(--accent-wash)"
            label={s.constancy != null ? `${formatPercent(s.constancy)} na semana` : undefined}
          >
            <span className="disp rv-num">{s.constancy != null ? formatPercent(s.constancy) : '–'}</span>
            <span className="cap">na semana</span>
          </Ring>
        </div>
      </div>

      {lines.length > 0 && (
        <>
          <SectionLabel>O que deu certo</SectionLabel>
          <div className="rv-pad">
            <Card>
              <ul className="rv-cmp">
                {lines.map((l, i) => (
                  <m.li
                    key={l.habitId}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
                    animate={{ opacity: 1, y: 0, transition: { ...tween.base, delay: reduced ? 0 : cascadeDelay(i) } }}
                  >
                    <HighlightRow l={l} info={byId.get(l.habitId)} />
                  </m.li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}

      {s.gentle && (
        <>
          <SectionLabel>Para olhar com carinho</SectionLabel>
          <m.div
            className="rv-pad"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: distance.rise }}
            animate={{ opacity: 1, y: 0, transition: { ...tween.base, delay: careDelay } }}
          >
            <CareCard l={s.gentle} info={byId.get(s.gentle.habitId)} />
          </m.div>
        </>
      )}

      {s.previousTweak && (
        <>
          <SectionLabel>O ajuste funcionou?</SectionLabel>
          <div className="rv-pad">
            <Card className="rv-tweak">
              <p>“{s.previousTweak.text}”</p>
              <div className="rv-three" role="radiogroup" aria-label="O ajuste funcionou?">
                {(
                  [
                    ['yes', 'Sim'],
                    ['partly', 'Em parte'],
                    ['no', 'Não'],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={worked === v}
                    onClick={() => drafts.setReviewDraft(week, { tweakWorked: worked === v ? null : v })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
      <div style={{ height: 16 }} />
    </div>
  );
}

function HighlightRow({ l, info }: { l: ReviewLine; info: HabitInfo | undefined }) {
  const { title, sub } = splitLine(l, info?.habit);
  const dots = lineDots(l);
  const attrs = pillarAttrs(info?.pillar?.color);
  return (
    <div className={['rv-hr', attrs.className].filter(Boolean).join(' ')} data-pillar={attrs['data-pillar']} data-hue={attrs['data-hue']}>
      <PillarBubble icon={(info?.habit.icon ?? 'check') as IconName} pillar={info?.pillar?.color} />
      <span>
        <b>{title}</b>
        {sub && (
          <small>
            <WeekDots total={dots.total} done={dots.on} />
            {sub}
          </small>
        )}
      </span>
    </div>
  );
}

function CareCard({ l, info }: { l: ReviewLine; info: HabitInfo | undefined }) {
  const dots = lineDots(l);
  const color = info?.pillar?.color;
  const attrs = pillarAttrs(color ?? 'accent');
  return (
    <div className={['rv-care', attrs.className].filter(Boolean).join(' ')} data-pillar={attrs['data-pillar']} data-hue={attrs['data-hue']}>
      <PillarBubble icon={(info?.habit.icon ?? 'heart') as IconName} pillar={color} />
      <span>
        <p>{l.text}.</p>
        <span className="cap">
          <WeekDots total={dots.total} done={dots.on} />
          Dá para ajustar na próxima tela.
        </span>
      </span>
    </div>
  );
}

// ---------- passo 2 ----------

function StepTwo({
  rv,
  byId,
  draft,
  week,
  flushRef,
}: {
  rv: ReviewView;
  byId: Map<string, HabitInfo>;
  draft: ReviewDraft | undefined;
  week: string;
  flushRef: React.RefObject<() => void>;
}) {
  const drafts = useDrafts();
  const r = rv.review;
  const [tweak, setTweak] = useState(draft?.tweak ?? r?.tweak ?? '');
  const [waist, setWaist] = useState(draft?.waist ?? (r?.waist != null ? formatNumber(r.waist) : ''));
  const together = draft?.together !== undefined ? draft.together : (r?.together ?? null);
  // o ajuste vai para o rascunho a cada 300 ms
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latestRef = useRef({ tweak, waist });
  useLayoutEffect(() => {
    latestRef.current = { tweak, waist };
    flushRef.current = () => {
      clearTimeout(timerRef.current);
      useDrafts.getState().setReviewDraft(week, latestRef.current);
    };
  });
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => useDrafts.getState().setReviewDraft(week, { tweak, waist }), 300);
    return () => clearTimeout(timerRef.current);
  }, [tweak, waist, week]);
  // ao sair do passo, o que ficou pendente vai para o rascunho
  useEffect(() => () => flushRef.current(), [flushRef]);

  const nextWeek = addDays(rv.week, 7);
  const t = rv.together;
  const tInfo = t ? byId.get(t.id) : undefined;
  const chosen = together?.day ? Math.round((Date.parse(together.day) - Date.parse(nextWeek)) / 86_400_000) : null;
  const last = rv.lastWaist;

  return (
    <div className="rv-form">
      <h1 className="ttl2">Uma coisa para ajustar na próxima semana?</h1>
      <div className="rv-area">
        <TextField
          label="Ajuste da próxima semana"
          hideLabel
          multiline
          value={tweak}
          onChange={setTweak}
          placeholder="Ex.: separar a roupa da caminhada na noite anterior"
          maxLength={160}
        />
        <p className="foot">Aparece no Hoje como lembrete durante a semana.</p>
      </div>
      {rv.waist && (
        <div>
          <TextField
            label="Cintura de hoje"
            value={waist}
            onChange={(v) => setWaist(v.replace(/[^\d.,]/g, ''))}
            inputMode="decimal"
            enterKeyHint="done"
            unit="cm"
            placeholder={last ? formatNumber(last.value) : undefined}
          />
          {last && (
            <p className="foot">
              {last.day >= rv.week ? 'Última medida' : 'Semana passada'}: {formatNumber(last.value)} cm
            </p>
          )}
        </div>
      )}
      {t && (
        <div>
          <div className="rv-between">
            <span className="rv-flabel">{t.name}</span>
            <span className="cap">
              {formatRange(nextWeek, addDays(nextWeek, 6))} · {t.goal.perWeek ?? 1} por semana
            </span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <DayPicker
              single
              value={chosen != null && chosen >= 0 && chosen < 7 ? [chosen] : []}
              onChange={(v) =>
                drafts.setReviewDraft(week, {
                  together: { habitId: t.id, day: addDays(nextWeek, v[0] ?? 0), note: together?.note },
                })
              }
              pillar={tInfo?.pillar?.color}
              label={`Dia do ${t.name.toLocaleLowerCase('pt-BR')}`}
            />
          </div>
          <TextField
            label={`O que vão fazer (${t.name.toLocaleLowerCase('pt-BR')})`}
            hideLabel
            value={together?.note ?? ''}
            onChange={(v) =>
              drafts.setReviewDraft(week, {
                together: { habitId: t.id, day: together?.day ?? addDays(nextWeek, 5), note: v },
              })
            }
            placeholder="O que vão fazer? (opcional)"
            maxLength={80}
          />
        </div>
      )}
    </div>
  );
}

// ---------- passo 3 ----------

function StepThree({ rv, byId }: { rv: ReviewView; byId: Map<string, HabitInfo> }) {
  const next = rv.next!;
  const sug = rv.suggestion;
  const current = rv.summary.phase;
  const pct = sug.constancy != null ? formatPercent(sug.constancy) : null;
  const below = sug.threshold != null && !sug.suggestAdvance;
  const lead = below
    ? `A fase ${current} está com ${pct ?? 'pouca'} de constância. Mais uma semana pode firmar o que começou. Se preferir seguir, estes hábitos entram a partir de amanhã:`
    : `A fase ${current} fechou${pct ? ` com ${pct} de constância` : ''}. Se fizer sentido para você, estes hábitos entram a partir de amanhã:`;
  return (
    <div className="rv-pad" style={{ paddingTop: 8 }}>
      <div className="rv-offer">
        <div className="rv-offer-h">
          <PillarBubble icon="path" pillar="accent" size="lg" />
          <span>
            <span className="eyebrow">Fase {next.number} disponível</span>
            <h1 className="ttl2">{next.name}</h1>
          </span>
        </div>
        <p>{lead}</p>
        {next.habits.length > 0 && (
          <Card>
            <ul className="rv-cmp">
              {next.habits.map((h) => {
                const info = byId.get(h.id);
                const row = offerRow(h);
                return (
                  <li key={h.id} className="rv-hr" style={{ minHeight: 56 }}>
                    <PillarBubble icon={h.icon} pillar={info?.pillar?.color} />
                    <span>
                      <b>{row.title}</b>
                      {row.sub && <small>{row.sub}</small>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

/** As duas escolhas da Revisão 3: o mesmo tamanho e a mesma cor, cada uma dizendo o que acontece depois. */
function ChoiceFooter({ rv, week }: { rv: ReviewView; week: string }) {
  const navigate = useNavigate();
  const j = useJourney();
  const { today } = useNow();
  const drafts = useDrafts();
  const [busy, setBusy] = useState(false);
  const next = rv.next;
  if (!next) return null;
  const currentNumber = rv.summary.phase ?? j.current?.number ?? next.number - 1;
  const current = j.phases.find((p) => p.number === currentNumber);
  const tomorrow = addDays(today, 1);
  const stayUntil = current?.end ? addDays(current.end, 7) : addDays(today, 7);
  const below = rv.suggestion.threshold != null && !rv.suggestion.suggestAdvance;
  const count = next.habits.length;

  const advance = async () => {
    setBusy(true);
    await startPhase(next.number);
    await finishReview(week, { decision: 'advance' });
    drafts.clearReviewDraft(week);
    void navigate(`/fase/${next.number}`, { replace: true, state: { transition: 'none' } });
  };
  const stay = async () => {
    setBusy(true);
    await stayInPhase(currentNumber);
    await finishReview(week, { decision: 'stay' });
    drafts.clearReviewDraft(week);
    void navigate(`/revisao/${week}/fim`, { replace: true, state: { transition: 'none' } });
  };

  const go = {
    icon: 'sneaker-move' as IconName,
    title: `Começar a fase ${next.number}`,
    sub:
      count > 0
        ? `${count === 1 ? 'O hábito entra' : `Os ${count} hábitos entram`} amanhã, ${formatDayShort(tomorrow)}.`
        : `A fase começa amanhã, ${formatDayShort(tomorrow)}.`,
    onClick: advance,
  };
  const keep = {
    icon: 'plant' as IconName,
    title: 'Ficar mais uma semana',
    sub: `A fase ${currentNumber} segue até ${formatDayShort(stayUntil)}.`,
    onClick: stay,
  };
  const options = below ? [keep, go] : [go, keep];

  return (
    <div className="rv-foot">
      <div className="rv-opts">
        {options.map((o) => (
          <ChoiceCard key={o.title} {...o} disabled={busy} />
        ))}
      </div>
      <p className="foot">As duas escolhas estão certas.</p>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  sub,
  onClick,
  disabled,
}: {
  icon: IconName;
  title: string;
  sub: string;
  onClick: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <button type="button" className="rv-opt" disabled={disabled} aria-label={`${title}. ${sub}`} onClick={() => void onClick()}>
      <PillarBubble icon={icon} pillar="accent" />
      <span>
        <b>{title}</b>
        <small>{sub}</small>
      </span>
    </button>
  );
}
