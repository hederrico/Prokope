// Capítulo "O dia" (docs/interacao/telas/tutorial.md › Capítulo "O dia"). Formato em ../types.ts.
// No Hoje, com os dados da pessoa: o Zeno mostra onde ficam os hábitos, e os gestos de verdade (marcar, desfazer,
// somar, dar nota) são treinados no grupo Primeiros passos, que não entra nos números. O capítulo funciona de manhã,
// à noite (Ainda hoje e Feitos hoje), no dia fechado e em "Seu plano começa amanhã" (primeiro acesso depois das 20h):
// cada passo procura o alvo que existe naquele estado, e o que não existe sai da conta.
import { currentEntry, previousEntry } from '@/app/history';
import { holdToasts } from '@/components/shell';
import { formatTime } from '@/data';
import { scheduleTimeOn } from '@/domain/habitState';
import { todayViewOf } from '@/domain/today';
import { useClockStore } from '@/stores/clock';
import { useDataStore } from '@/stores/data';
import { queryTarget } from '../dom';
import type { TourContext, TourScript } from '../types';

/** O alvo está na tela agora. */
const has = (name: string) => !!queryTarget(name);

/** Espera uma condição (a tela do Hoje desenhada), até `ms`. */
function until(ok: () => boolean, ms: number): Promise<void> {
  const start = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (ok() || performance.now() - start > ms) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
}

/** O plano ainda não começou: o primeiro acesso terminou depois das 20h, e a fase 1 começa amanhã. */
function startsLater(): boolean {
  const today = useClockStore.getState().today;
  const starts = Object.values(useDataStore.getState().phases)
    .map((p) => p.start)
    .filter((d): d is string => !!d);
  return starts.length > 0 && starts.every((d) => d > today);
}

/** A frase do primeiro passo, pelo que a tela mostra: os momentos, a noite, a linha do tempo ou o plano de amanhã. */
function dayText(): string {
  if (startsLater()) return 'Este é o seu dia. Seu plano começa amanhã, e os hábitos aparecem aqui.';
  const night = queryTarget('hoje-grupo')?.getAttribute('aria-label') === 'Ainda hoje';
  if (night) return 'Este é o seu dia. À noite, ele se divide em Ainda hoje e Feitos hoje.';
  const view = todayViewOf(useDataStore.getState().profile?.prefs?.todayView);
  if (view === 'timeline') return 'Este é o seu dia, em ordem de horário, com a linha do agora.';
  return 'Este é o seu dia. Os hábitos ficam em Manhã, Ao longo do dia e Noite.';
}

/** O horário do check-in da pessoa ("20h30"), o mesmo do Hoje: o de Ajustes › Horários, ou o do hábito. */
function checkinTime(ctx: TourContext): { label: string; minutes: number } | null {
  const habit = ctx.habits().find((h) => h.role === 'checkin');
  const profile = useDataStore.getState().profile;
  if (!habit || !profile) return null;
  const day = useClockStore.getState().today;
  const key = habit.goal.timeKey ?? habit.schedule.timeKey;
  const time = habit.goal.timeKey
    ? scheduleTimeOn(habit.goal.timeKey, day, profile)
    : (habit.goal.time ?? (key ? scheduleTimeOn(key, day, profile) : habit.schedule.time));
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  return { label: formatTime(time), minutes: (h ?? 0) * 60 + (m ?? 0) };
}

/** A frase do check-in: à noite ele já está na tela; de dia, o Zeno conta quando ele aparece. */
function checkinText(ctx: TourContext): string {
  const t = checkinTime(ctx);
  if (t && useClockStore.getState().minutes >= t.minutes) return 'Este é o check-in: como foi o dia, em poucos toques.';
  return `À noite, a partir das ${t?.label ?? '20h30'}, aparece o check-in: como foi o dia, em poucos toques.`;
}

/** Fecha a folha de treino aberta no meio (sair do tutorial na nota): volta para o Hoje sem a folha. */
function closeSheet(ctx: TourContext) {
  if (typeof location === 'undefined' || !/[?&]folha=/.test(location.search)) return;
  if (previousEntry() === '/hoje' && currentEntry() !== '/hoje') history.back();
  else ctx.navigate('/hoje');
}

/** O grupo Primeiros passos, a região que o balão e o Zeno não cobrem nos passos de fazer. */
const GROUP = '[data-tour="pp-group"]';
/** A folha da nota de treino (a nota e o "Salvar" ficam dentro dela). */
const SHEET = '[role="dialog"]';

export const hoje: TourScript = {
  run: 'hoje',
  enter: async (ctx) => {
    // o grupo Primeiros passos entra no topo da lista com fadeUp, no Hoje de hoje (sem outro dia e sem folha)
    ctx.setPractice(true);
    if (ctx.path() !== '/hoje' || /[?&](dia|folha)=/.test(location.search)) ctx.navigate('/hoje');
    // as condições dos passos olham o Hoje desenhado (a conta "3 de 11" sai delas no começo)
    await until(() => has('pp-group') && (has('hoje-grupo') || has('hoje-fechado')), 4000);
  },
  leave: (ctx, reason) => {
    holdToasts(false);
    if (reason === 'stop') closeSheet(ctx);
    // o grupo sai com opacidade; a entrada "Primeiros passos com o Zeno" fica na Jornada
    ctx.setPractice(false);
  },
  steps: [
    {
      id: 'dia',
      where: '/hoje',
      target: 'hoje-grupo',
      when: () => has('hoje-grupo'),
      text: dayText,
      zeno: 'point',
    },
    {
      id: 'fechado',
      where: '/hoje',
      target: 'hoje-fechado',
      when: () => has('hoje-fechado'),
      text: 'Este é o seu dia, já fechado. Em Ver o dia, fica tudo o que você marcou.',
      zeno: 'point',
    },
    {
      id: 'primeiros',
      where: '/hoje',
      target: 'pp-group',
      text: 'Separei três primeiros passos para treinar. Eles não contam nos seus números.',
      zeno: 'point',
    },
    {
      id: 'marcar',
      where: '/hoje',
      target: 'pp-mark',
      around: GROUP,
      text: 'Toque no círculo para marcar.',
      wait: { event: 'pp-mark' },
      reply: { text: 'Isso. Um pé depois do outro.', zeno: 'celebrate' },
      zeno: 'point',
    },
    {
      id: 'desfazer',
      where: '/hoje',
      // o toast da marcação de treino; se ele já saiu, o passo sai da conta
      target: 'toast',
      text: 'Marcou sem querer? O Desfazer fica aqui embaixo por alguns segundos.',
      zeno: 'point',
      timeout: 1500,
      // o fio do Desfazer para enquanto o Zeno aponta para ele
      enter: () => holdToasts(true),
      leave: () => holdToasts(false),
    },
    {
      id: 'somar',
      where: '/hoje',
      target: 'pp-add',
      around: GROUP,
      text: 'Alguns hábitos somam, como a água. Toque no +.',
      wait: { event: 'pp-add' },
      reply: { text: 'Isso. Cada toque soma um.', zeno: 'nod' },
      zeno: 'point',
    },
    {
      id: 'nota',
      where: '/hoje',
      target: 'pp-rate',
      around: GROUP,
      text: 'As refeições recebem uma nota de 1 a 5. Toque em Dar nota.',
      wait: 'tap',
      zeno: 'point',
    },
    {
      id: 'nota-escolher',
      where: '/hoje',
      // dentro da folha "Primeira nota" (?folha=primeira-nota)
      target: 'pp-rate-options',
      around: SHEET,
      text: 'Escolha uma nota. Qualquer uma vale.',
      wait: 'tap',
      zeno: 'point',
    },
    {
      id: 'nota-salvar',
      where: '/hoje',
      target: 'pp-rate-save',
      around: SHEET,
      text: 'Agora é só salvar.',
      wait: { event: 'pp-rate' },
      // a nota 1 e a nota 5 recebem o mesmo agradecimento
      reply: { text: 'Obrigado por contar.', zeno: 'celebrate' },
      zeno: 'point',
    },
    {
      id: 'habito',
      where: '/hoje',
      target: 'hoje-linha',
      when: () => has('hoje-linha'),
      text: 'Toque no nome para ver o calendário do hábito. Segure a linha para o menu: dá para tirar só hoje da conta.',
      zeno: 'point',
    },
    {
      id: 'dias-sem',
      where: '/hoje',
      target: 'hoje-dias-sem',
      // só se o plano tiver um "dias sem"
      when: (ctx) => ctx.hasHabitType('daysSince') && has('hoje-dias-sem'),
      text: 'Aqui ficam os dias sem. A conta cresce sozinha, um dia de cada vez.',
      zeno: 'point',
    },
    {
      id: 'limites',
      where: '/hoje',
      target: 'hoje-limites',
      // só se o plano tiver um limite na semana (refeições livres, tranqueiras)
      when: (ctx) => ctx.hasHabitType('budget') && has('hoje-limites'),
      text: 'Alguns hábitos têm um limite na semana, como as refeições livres. Toque no + quando usar um.',
      zeno: 'point',
    },
    {
      id: 'semana',
      where: '/hoje',
      target: 'hoje-semana',
      when: () => has('hoje-semana'),
      text: 'Aqui fica a sua semana. Toque num dia que passou para corrigir.',
      zeno: 'point',
    },
    {
      id: 'jeitos',
      where: '/hoje',
      target: 'hoje-jeito',
      when: () => has('hoje-jeito'),
      text: 'Este botão troca o jeito de ver o dia: resumo, lista completa ou linha do tempo.',
      zeno: 'point',
    },
    {
      id: 'checkin',
      where: '/hoje',
      target: 'hoje-checkin',
      when: () => has('hoje-checkin'),
      text: checkinText,
      zeno: 'point',
    },
    {
      id: 'fim',
      where: '/hoje',
      text: 'Pronto. Os Primeiros passos ficaram guardados na sua Jornada. Para rever, é em Ajustes › Tutorial.',
      zeno: 'party',
    },
  ],
};
