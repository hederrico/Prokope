// Primeiro acesso em 3 passos (docs/interacao/telas/entrada.md › Começar, Seus pilares, Sua rotina).
// StepTop parado em cima (sem X: o primeiro acesso não pode ser interrompido), o conteúdo trocando com StepTransition
// (24 px pela direita; voltar faz o inverso) e o botão preso embaixo. O rascunho fica no aparelho, por conta, e
// nada vai para os dados antes de "Começar a fase 1": aí setupPlan grava tudo num lote e o primeiro Hoje entra.
// Ao reabrir no meio, abre direto no passo salvo, sem animação.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { setupPlan } from '@/actions';
import { FullScreen, StepTop, StepTransition, useFlowStep } from '@/components/shell';
import { Button, NumberFlow } from '@/components/ui';
import { TEMPLATE_PHASES, planStartDay, useNow, useSession, type DraftPillar } from '@/data';
import { PillarForm } from './PillarForm';
import { PillarsStep } from './PillarsStep';
import { RoutineStep } from './RoutineStep';
import { StartStep } from './StartStep';
import { countChosen, withMode, withPillar } from './plan';
import { useOnboardingDraft } from './useOnboardingDraft';
import './onboarding.css';

const clampStep = (n: number) => Math.min(3, Math.max(1, Math.round(n) || 1));

export default function OnboardingScreen() {
  const session = useSession();
  const navigate = useNavigate();
  const { step: urlStep, goTo } = useFlowStep();
  const ob = useOnboardingDraft();
  const { draft, update } = ob;
  const { now, today, clock } = useNow();

  // ao abrir: o passo salvo (sem passagem). Sem rascunho, o fluxo começa no 1.
  const [resumeTo] = useState(() => clampStep(ob.savedStep ?? 1));
  const [resumed, setResumed] = useState(() => clampStep(urlStep) === resumeTo);
  if (!resumed && clampStep(urlStep) === resumeTo) setResumed(true);
  const step = resumed ? clampStep(urlStep) : resumeTo;
  useLayoutEffect(() => {
    if (!resumed || urlStep !== clampStep(urlStep)) goTo(resumeTo);
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { saveStep } = ob;
  useEffect(() => {
    if (resumed) saveStep(step);
  }, [resumed, step, saveStep]);

  // formulário do pilar (passo 2)
  const [form, setForm] = useState<{ open: boolean; key: string | null; seq: number }>({
    open: false,
    key: null,
    seq: 0,
  });
  const [newKeys, setNewKeys] = useState<Set<string>>(() => new Set());
  const editing = form.key ? (draft.pillars.find((p) => p.key === form.key) ?? null) : null;
  const savePillar = (p: DraftPillar) => {
    if (!draft.pillars.some((x) => x.key === p.key)) setNewKeys((s) => new Set(s).add(p.key));
    update((d) => withPillar(d, p));
  };

  // fim: grava o plano e abre o primeiro Hoje
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);
  const { clear } = ob;
  useEffect(
    () => () => {
      if (finished.current) clear();
    },
    [clear],
  );
  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      await setupPlan(draft, { name: session.user?.name || undefined });
      finished.current = true;
      void navigate('/hoje', { replace: true });
    } catch {
      // a casca mostra o toast de escrita recusada; a pessoa fica no passo 3, com o rascunho
      setBusy(false);
    }
  }

  async function switchAccount() {
    clear();
    const firebase = session.mode === 'firebase';
    await session.signOut();
    if (firebase && session.firebaseAvailable) await session.signIn().catch(() => undefined);
  }

  const enabled = draft.pillars.filter((p) => p.enabled);
  const chosen = countChosen(draft);
  const startsTomorrow = planStartDay(now, clock) !== today;
  const phase = TEMPLATE_PHASES[0];
  const template = draft.mode === 'template';

  const next = () => (step < 3 ? goTo(step + 1) : void finish());
  const canContinue = step !== 2 || enabled.length > 0;

  // Enter continua, com o foco fora de campo (computador)
  const nextRef = useRef(next);
  useLayoutEffect(() => {
    nextRef.current = canContinue ? next : () => undefined;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (
        t?.closest('input, select, textarea, button, [role="button"], [role="radio"], [role="switch"], [role="dialog"]')
      )
        return;
      e.preventDefault();
      nextRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  let caption: ReactNode;
  if (step === 1) {
    caption = (
      <>
        Entrou como {session.user?.name || 'você'} ·{' '}
        <button type="button" className="ob-link hit" onClick={() => void switchAccount()}>
          Trocar de conta
        </button>
      </>
    );
  } else if (step === 2) {
    if (!draft.pillars.length) caption = 'Crie pelo menos um pilar';
    else if (!enabled.length) caption = 'Escolha pelo menos um pilar';
    else if (!template) caption = 'Os hábitos você cria depois, em cada pilar';
    else
      caption = (
        <>
          <NumberFlow value={chosen} aria-hidden="true" />
          <span className="ob-sr">{chosen}</span> {chosen === 1 ? 'hábito escolhido' : 'hábitos escolhidos'}
        </>
      );
  } else {
    const when = startsTomorrow ? 'começa amanhã' : 'começa hoje';
    caption = template
      ? `Fase ${phase?.number ?? 1} · ${phase?.name ?? 'Base'} · ${chosen} ${chosen === 1 ? 'hábito' : 'hábitos'} · ${when}`
      : `Seu plano ${when}`;
  }

  const label = step < 3 ? 'Continuar' : template ? `Começar a fase ${phase?.number ?? 1}` : 'Começar';

  return (
    <FullScreen
      top={<StepTop step={step} total={3} onBack={() => goTo(step - 1)} />}
      footer={
        <div className="ob-cta">
          <Button wide disabled={!canContinue || busy} onClick={next}>
            {label}
          </Button>
          <p className="ob-cap" aria-live={step === 2 ? 'polite' : undefined}>
            {caption}
          </p>
        </div>
      }
    >
      <StepTransition step={step}>
        {step === 1 && <StartStep draft={draft} onMode={(m) => update((d) => withMode(d, m))} />}
        {step === 2 && (
          <PillarsStep
            draft={draft}
            onDraft={update}
            onEditPillar={(key) => setForm((f) => ({ open: true, key, seq: f.seq + 1 }))}
            onNewPillar={() => setForm((f) => ({ open: true, key: null, seq: f.seq + 1 }))}
            newKeys={newKeys}
          />
        )}
        {step === 3 && <RoutineStep draft={draft} onDraft={update} />}
      </StepTransition>
      <PillarForm
        key={form.seq}
        open={form.open}
        pillar={editing}
        pillars={draft.pillars}
        onSave={savePillar}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />
    </FullScreen>
  );
}
