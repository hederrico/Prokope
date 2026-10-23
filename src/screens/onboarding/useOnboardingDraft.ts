// O rascunho do primeiro acesso, por conta (useDrafts().onboarding, salvo no aparelho). Nada vai para os dados
// antes do passo 3: fechar o app guarda o passo e as escolhas.
import { useCallback } from 'react';
import { defaultPlanDraft, useDrafts, useSession, type PlanDraft } from '@/data';

export interface OnboardingDraft {
  account: string;
  /** o passo salvo, ou null quando o primeiro acesso ainda não começou neste aparelho */
  savedStep: number | null;
  draft: PlanDraft;
  update: (fn: (d: PlanDraft) => PlanDraft) => void;
  saveStep: (step: number) => void;
  clear: () => void;
}

export function useOnboardingDraft(): OnboardingDraft {
  const session = useSession();
  const account = session.user?.email || session.mode || 'demo';
  const saved = useDrafts((s) => s.onboarding[account]);
  const draft = saved?.draft ?? defaultPlanDraft('template');
  const step = saved?.step ?? 1;

  const update = useCallback(
    (fn: (d: PlanDraft) => PlanDraft) => {
      const cur = useDrafts.getState().onboarding[account];
      useDrafts.getState().setOnboarding(account, cur?.step ?? step, fn(cur?.draft ?? defaultPlanDraft('template')));
    },
    [account, step],
  );
  const saveStep = useCallback(
    (n: number) => {
      const cur = useDrafts.getState().onboarding[account];
      if (cur?.step === n) return;
      useDrafts.getState().setOnboarding(account, n, cur?.draft ?? defaultPlanDraft('template'));
    },
    [account],
  );
  const clear = useCallback(() => useDrafts.getState().clearOnboarding(account), [account]);

  return { account, savedStep: saved ? saved.step : null, draft, update, saveStep, clear };
}
