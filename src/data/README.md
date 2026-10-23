# Dados: a API para as telas

Tudo o que uma tela precisa para **ler** e **gravar** os dados da pessoa. Telas e componentes nunca falam com o Firestore nem com o IndexedDB, nunca recalculam constância, força ou dias sem, e nunca passam dados umas para as outras: cada tela lê dos hooks abaixo, e a navegação leva só ids e dias.

```ts
import { useToday, useSession, formatTime } from '@/data';   // leitura, sessão e ajudantes
import { toggleHabit, addEntry, logSlip } from '@/actions';    // escrita (cada uma devolve o desfazer)
import type { Habit, DayKey } from '@/types';                  // tipos do modelo
```

- **Dia** é sempre o dia lógico em texto, `'2026-10-22'` (`DayKey`). O dia vira às 4h no fuso do perfil.
- **Semana** é o `DayKey` da segunda-feira (`WeekKey`). Qualquer dia da semana serve onde um hook pede a semana.
- **Dia da semana** é número: `0` = segunda ... `6` = domingo.
- **Horário** é `'HH:mm'` (`'06:52'`). Na tela, use `formatTime('06:52')` → `"6h52"`.
- **Instante** é `number` em ms. Use `nowMs()` (de `@/stores/clock`) no lugar de `Date.now()` quando precisar da hora do app.
- **Unidades**: proteína em g, água em **ml** (3 L = `3000`), peso em kg, cintura em cm, minutos em min.

## Sumário

1. [Sessão](#sessão)
2. [Hora do app e capturas](#hora-do-app-e-capturas)
3. [Hooks de leitura](#hooks-de-leitura)
4. [Ações e o desfazer](#ações-e-o-desfazer)
5. [Celebrar ou não: de onde veio a mudança](#celebrar-ou-não-de-onde-veio-a-mudança)
6. [Rascunhos e o dia fechado](#rascunhos-e-o-dia-fechado)
7. [Tipos e estados](#tipos-e-estados)
8. [As regras, em uma linha cada](#as-regras-em-uma-linha-cada)
9. [Ícones, textos e outros ajudantes](#ícones-textos-e-outros-ajudantes)
10. [Modo demonstração e Firebase](#modo-demonstração-e-firebase)

---

## Sessão

`<DataProvider>` (já posto pela casca em `src/app/App.tsx`) liga o relógio, abre a fonte de dados, os ouvintes e o A dois.

```ts
const s = useSession();
s.status;            // 'loading' | 'signedOut' | 'denied' | 'ready'
s.mode;              // 'demo' | 'firebase' | null
s.user;              // { name: 'Henrique', email? } | null
s.needsOnboarding;   // conta sem plano: vá para /comecar/1
s.firebaseAvailable; // há configuração do Firebase no .env
s.error;             // 'O login não terminou. Tente de novo.' ou null (tela Entrar)
await s.enterDemo(); // modo demonstração (semeado com a história na primeira vez, ou de novo se ficou sem plano)
await s.enterDemo({ empty: true }); // conta vazia na demonstração: a guarda leva ao primeiro acesso (/comecar/1)
await s.signIn();    // Google por redirecionamento; sem Firebase, rejeita com FIREBASE_UNAVAILABLE
await s.signOut();
await s.resetDemo(); // apaga a demonstração e semeia de novo
```

- `status === 'denied'`: a conta não está na lista (`/entrar/sem-acesso`); o e-mail vem em `s.user.email`.
- Depois de `deleteAllData()`, o perfil some e `needsOnboarding` vira `true`. Na demonstração, a sessão grava um perfil novo sem plano (como no primeiro login), e recarregar continua no primeiro acesso, sem semear a história de novo.
- `useDataStatus()` → `{ status: 'idle' | 'loading' | 'ready', pendingWrites, error }`: use `status !== 'ready'` para o esqueleto do Hoje (espere 300 ms antes de mostrar). `pendingWrites` volta a `false` quando a escrita termina de gravar (no aparelho, na demonstração; no servidor, no Firebase), por um aviso só de metadados (`SnapshotMeta.metadataOnly`), que não troca os documentos nem a origem da mudança.
- `useConnection()` → `{ online, pending }`: o aviso "Sem internet" do Hoje e "registros esperando internet" em Dados e conta.
- `onWriteError((error, retry?) => ...)` e `WRITE_ERROR_MESSAGE`: a casca (`src/app/WriteErrorToast.tsx`) mostra o toast "Não deu para salvar. Tente de novo em instantes." quando o servidor recusa uma escrita; "Tentar de novo" chama `retry`, que grava o mesmo lote.

## Hora do app e capturas

```ts
const { now, today, minutes, clock, fixed } = useNow();
// minutes: minutos do dia lógico (7h42 = 462; 0h30 da madrugada = 1470)
```

- O relógio anda a cada minuto, troca o dia às 4h e confere tudo ao voltar para a frente (`visibilitychange`).
- **Para comparar com o quadro**, fixe a hora pela URL: `?agora=20:34` (hoje às 20h34) ou `?agora=2026-10-22T07:42`. A demonstração é semeada na hora fixada (use **Começar de novo** ou `resetDemo()` depois de mudar a hora). Em código: `setFixedNow(ms)` / `setFixedNow(null)`.

## Hooks de leitura

Todos atualizam sozinhos quando os dados mudam (neste aparelho, em outra aba ou em outro aparelho) e quando o dia vira. Os cálculos são feitos uma vez por versão dos dados e divididos entre as telas.

### Hoje

```ts
const t = useToday(day?);      // sem `day`, hoje; com `day`, "Ver outro dia" (/hoje?dia=...)
```

| Campo | O que é |
|---|---|
| `day`, `today`, `isToday`, `isPast` | o dia mostrado e o de hoje |
| `dateLabel` | `"Quinta, 22 de outubro"` |
| `greeting`, `name` | `"Bom dia"`, `"Henrique"` (título: `` `${greeting}, ${name}` ``) |
| `count` | `{ done: 3, total: 12 }`: o "3 de 12 feitos hoje" |
| `week` | a semana do topo (veja `useWeek`) com `constancy` (0,76 → "76% na semana") |
| `phase` | `{ number: 2, name: 'Alimentação', weekIndex: 2, weeks: 3 }` ou `null` |
| `layout` | os grupos e listas (abaixo) |
| `firstDay` | primeiro dia do plano sem nenhuma marca (convite "Comece por aqui") |
| `pause` | a pausa do app neste dia (`PauseCard`), ou `null` |
| `welcomeBack` | dia seguinte ao fim de uma pausa: "Bem-vindo de volta. Comece por um hábito." |
| `nudge` | o convite gentil: `{ habitId, day: ontem, doneToday }` ou `null` (no máximo um) |
| `review` | o convite da revisão: `{ week, step, started }` ou `null` ("Começar" ou "Continuar revisão") |
| `tweak` | o ajuste da última revisão (`{ week, text }`), a linha com `lightbulb` no cartão da semana |
| `checkin` | o check-in do dia, ou `null` |
| `quickAdds` | `{ [habitId]: QuickAdd[] }`: os 3 botões da hora de cada contador (ovo, leite, whey de manhã) |
| `tomorrowMorning` | "Amanhã cedo", no dia fechado |
| `activeRun` | treino em andamento, de qualquer treino guiado (faixa `RunStrip`; use `useRunLive()` para o relógio) |

`t.layout` (`TodayLayout`):

| Campo | O que é |
|---|---|
| `mode` | `'day'` (até 17h59), `'evening'` (18h, a Noite abre), `'night'` (a partir do horário do check-in, 20h30), `'closed'` (o dia fechou) |
| `groups` | `[{ key: 'morning' \| 'day' \| 'evening', title: 'Manhã', items, complete, folded, foldReason: 'far' \| 'complete' \| null }]`, na ordem Manhã, Ao longo do dia, Noite (grupos vazios saem) |
| `stillToday`, `doneToday` | no modo noite: "Ainda hoje" (o check-in vem primeiro) e "Feitos hoje" (inclui os dias sem) |
| `checkinOnTop` | passou do horário do check-in |
| `limits` | Limites da semana (`item.budget`) |
| `daysSince` | Dias sem (`item.daysSince`) |
| `counters` | proteína e água (para o cartão das metas da noite) |

Cada linha (`TodayItem`) traz o hábito e tudo para desenhar sem calcular:

```ts
item.habit            // o hábito (nome, ícone, tipo, papel, meta...)
item.pillar           // o pilar principal (a cor da linha)
item.state            // 'done' | 'partial' | 'notDone' | 'skipped' | 'paused' | ...
item.registered       // há registro (horário fora da tolerância: registered sem state 'done')
item.mark             // a marca do dia (time '06:52', rating 4, value...)
item.value            // total do contador (g, ml), número (kg), nota
item.goal             // meta do dia: { value: 80, unit: 'g', time: '06:50', toleranceMin: 15, perWeek: 6, partialMin }
item.counts           // entra no "x de N"
item.time             // horário do hábito no dia ('20:30')
item.isNew            // selo "novo" no primeiro dia do hábito
item.week             // "2 de 7 · meta 6": { done: 2, target: 6, days: [...] }
item.budget           // limites: { used: 1, limit: 2, full, over, resetsTomorrow }
item.daysSince        // dias sem: { current: 12, record: 21, total: 33, isRecord, ... }
item.markedNextMorning// o Deitar: sem controle à noite
```

- **Arrumação adiada.** A tela não pode pular debaixo do dedo: congele o layout e recalcule só nos eventos de aparição.
  ```ts
  const live = useToday(day);
  const layout = useFrozen(live.layout, `${day}|${search.get('folha') ?? ''}`); // recalcula ao fechar a folha e ao voltar para a frente
  ```
  Os números (`count`, `item.state` das linhas que você já mostra) podem vir do `live`, para animar na hora.
- **Folhas dos contadores e do sono:** `useCounter(habitId, day?)` e `useSleep(day?)` (abaixo).

### A semana do topo

```ts
const w = useWeek(day?);
w.days;       // 7 dias: { day, weekday: 'qui', date: 22, isToday, isFuture, beforeStart, paused, done, total, ratio, tappable }
w.constancy;  // 0..1 ou null
w.label;      // "19 – 25 de outubro"
w.previous;   // a semana anterior (só uma para trás)
```

`ratio` é o anel de cada dia (feitos / que contam). Dia futuro não é tocável; dia antes do começo do plano não tem anel.

### Hábito

```ts
const h = useHabit(id);          // { habit, pillar, alsoIn: Pillar[], today: HabitDay, pause, status, phase }
// status: 'active' | 'upcoming' (fase futura) | 'archived' | 'paused'
const st = useHabitStats(id, monthDay?);
st.strength;       // { value: 0.72 | null, occurrences, needed: 7 }  (null = "poucos dados")
st.week;           // { done: 3, target: 6 }
st.totals;         // { withDays: 24, withoutDays: 8, partialDays }
st.correlation;    // { ready, withDays, withoutDays, withAvg: 4.1, withoutAvg: 3.4, missingWith, missingWithout } | null
st.heatmap;        // 12 semanas × 7 dias de CalendarCell { day, state, isToday, ... }
st.month;          // { year, month, label: 'outubro de 2026', weeks: CalendarCell[][] } (inMonth para os dias de fora)
st.neverTwoInARow; // a faixa "nunca dois dias seguidos sem"
st.daily;          // contador: a semana em { day, total, goal, state }
st.daysSince;      // dias sem (tipo daysSince)
st.budget;         // limite (tipo budget)
const ds = useDaysSince(id);  // { current, record, total, periods: [{ start, end, days, current, record, slipId }], ifSlipToday }
const hd = useHabitDay(id, day?); // o estado num dia (folhas: a nota já dada, o horário salvo)
const lunch = useHabitByRole('lunch'); // o hábito de um papel: 'wake' | 'bed' | 'protein' | 'water' | 'lunch' | 'dinner' | 'checkin' | 'weight' | ...
```

- `ds.periods[0]` é o período atual; `ds.ifSlipToday` é a prévia da folha do deslize (`{ current: 0, record: 21, total: 32 }`).
- Na frase do insight, use `insightText(st.correlation, habit)` → "Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4."
- Com `!st.correlation.ready`, mostre a espera: "Faltam `missingWith` dias com caminhada" (sem contar os dias sem, como pede o estado "poucos dados").

### Registros (folhas)

```ts
const p = useCounter(proteinId, day?);
p.total; p.goal; p.left; p.over; p.reached;   // 46, 80, 34, 0, false
p.lines;          // linhas agrupadas: [{ key, item: 'Ovo', count: 3, amount: 18, at, entryIds }]
p.quickAdds;      // todos os botões (folha), na ordem da pessoa
p.quickAddsNow;   // os 3 da hora (Hoje)
p.scale;          // escala da barra: max(meta × 1,25; total × 1,1)

const s = useSleep(day?);   // { wake: { habit, day, state }, bed: { habit, day: ontem, state } }
const c = useCheckin(day?); // Checkin | null
const m = useMeasurements('weight'); // { list, trend, today: 83.6 | null, previous: 83.3 | null, trendOnly }
const d = useDaySummary(day); // folha "um dia": { label: 'Qua, 21 out', checkin, count, counters, weight, pause }
```

### Progresso

```ts
const p = useProgress(periodo, tema, { anchor?, phase? });
// periodo: 'semana' | 'mes' | 'fase'   tema: 'visao' | 'humor' | 'medidas' | <id do pilar>   (os mesmos da URL)
p.range;     // { label: '19 – 25 de outubro', sublabel, isCurrent, prev, next, from, to, phase }  (prev/next: âncoras ou null)
p.chips;     // [{ key: 'overview' | 'mood' | 'measures' | pillarId, label, pillar }]
p.constancy; // 0,76 (num período de fase concluída, a de fechamento)
p.pillars;   // [{ pillar, ratio }] do maior para o menor
p.insights;  // [{ habitId, text, correlation }] (só correlações prontas e a favor)
p.waiting;   // o padrão mais perto de aparecer (PatternWaitCard), quando ainda não há insight
p.waitingMore; // quantos outros padrões estão a caminho ("Mais 2 padrões a caminho")
p.previous;  // "Semana passada ›": { kind: 'week', key: '2026-10-12', ratio: 0.74 } ou a fase anterior
p.mood;      // tema humor: { days: [{ day, mood, energy, future }], avgMood, avgEnergy, insights }
p.measures;  // tema medidas: { weight: WeightTrend, lastWeight, waist: Measurement[], numbers: [{ habit, days, avg }] }
p.pillar;    // tema de pilar: { pillar, counters, habits, limits, daysSince, ratings } (a vista montada pelo tipo)
```

- `p.range.prev` / `p.range.next` são o próximo `anchor` (para 'fase', o número da fase em texto).
- `WeightTrend`: `{ ready, count, needed: 3, points: [{ day, value, avg }], avg, delta: -1.1, weeks: 3, direction: 'down' | 'up' | 'stable', title: 'Tendência −1,1 kg em 3 semanas', sentence }`. Com `trendOnly` (Ajustes › Aparência › Privacidade), desenhe só a média.
- Contadores do pilar: `counters[i].summary` = "80 g ou mais em 2 dos 3 dias fechados".

### Jornada, treinos guiados e revisão

```ts
const j = useJourney();
j.phases;   // PhaseView[]: { number, name, status: 'done' | 'current' | 'future', start, end, predicted, weeks,
            //   weekIndex, dayIndex, daysLeft, habits, constancy, weekBars: [{ index, start, end, ratio, current, future }], lastWeek }
j.current; j.next;
j.trainings; // um por Treino guiado ativo ou à espera da fase (sem arquivados e parados), na ordem dos hábitos:
             //   [{ habit, names: { effort: 'Correr', rest: 'Caminhar' }, startsOn, available, weeks: 13, perWeek: 2,
             //      next: { week, session }, effortByWeek: [480, 480, 540, ...] }]
j.reviews;  // [{ week, day, label: 'domingo, 18 out', context: 'semana 1 da fase 2', constancy: 0.74, status: 'done' | 'pending', endOfPhase }]
j.firstReviewDay; j.pause;

const r = useRunPlan(habitId?);  // o plano de um treino guiado; sem id, o primeiro (as rotas antigas da corrida)
r.habit;    // o hábito (null se o id não é de um treino guiado)
r.plan;     // o plano, sempre válido: { effort, rest, warmupMin, cooldownMin, weeks } (sem plano gravado, o modelo da corrida)
r.names;    // { effort: 'Pedalar', rest: 'Pedalar leve' }
r.weeks;    // as semanas: { week, label: '8× (1 + 1,5)', description, blocks, totalSeconds, effortSeconds, intervals, current, sessionsDone }
r.next;     // { week: 1, session: 1 } (pela contagem dos treinos feitos deste hábito)
r.perWeek; r.available; r.startsOn; r.schedule; r.history;
r.activeRun; // o treino em andamento, de qualquer treino guiado (um por vez)

const live = useRunLive(runId?);  // relógio do treino, 4× por segundo, sempre pela hora de início e pelas pausas
live.habit; live.names;           // o treino guiado do treino e os nomes do esforço e do descanso
live.position; // { block: { kind: 'effort' | 'rest' | 'warmup' | 'cooldown', seconds }, next, inBlock, remaining, interval: 3, intervals: 8, elapsed, total, done }

const rv = useReview(semana);      // qualquer dia da semana revista ('2026-10-11' abre 5 a 11 out)
rv.steps;        // 3 no fim da fase (com o convite), 2 no meio
rv.step;         // o passo guardado
rv.summary;      // { constancy, highlights: [{ text: 'Zero refrigerante a semana toda', ... }], gentle, previousTweak, endOfPhase, phase }
rv.suggestion;   // { suggestAdvance, constancy, threshold, next }
rv.next;         // a próxima fase (PhaseView, com os hábitos que entram)
rv.together; rv.waist; rv.lastWaist; rv.ramps; rv.readOnly;
const win = useReviewWindow(); // { week, day, opensAt, closesAt, open }
```

### Ajustes

```ts
usePillars({ includeArchived? });  // [{ pillar, habitCount }]
usePillar(id);                     // { pillar, habits, exitPlan: [{ kind: 'goes' | 'moves' | 'stays', habit, to? }] }
useHabits('active' | 'upcoming' | 'archived' | 'all'); // [{ habit, pillar, alsoIn, status, pausedUntil, startsOn }]
useProfile();                      // Profile | null (horários em profile.schedule, revisão, coleta, tolerância)
usePrefs();                        // { theme, motion, sound, runSound, weightTrendOnly }
usePause();                        // { current: a pausa de agora ou a próxima, app: a do app hoje, isScheduled }
useTogether();                     // { linked, link, partner: { id, name }, myShare, partnerShare, invite, invites, hugsToday }
useInvite(id);                     // Invite | null (não existe) | undefined (carregando)
```

- O `exitPlan` escreve as frases da folha "Apagar Corpo?": `goes` = "Futebol é apagado junto", `moves` = "A caminhada passa para Corpo", `stays` = "continua em Família".
- "Hábitos (16)": conte `useHabits('active').length`.

## Ações e o desfazer

Toda ação grava na hora (o cache local responde antes do servidor) e devolve `Promise<Undo>`. O `Undo` grava o inverso; chame no "Desfazer" do toast.

```ts
import { markHabit } from '@/actions';
import { showUndo } from '@/components/shell'; // o toast é da casca

async function onCheck() {
  const undo = await markHabit(habit.id, day);
  showUndo({ title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' }, () => void undo());
}
```

- Ações que criam algo trazem o id novo em `undo.id` (`createPillar`, `createHabit`, `startPause`, `startRun`, `logSlip`, `addEntry`).
- Um desfazer só vale uma vez. Não espere nada além do `await`: sem "salvando...".
- Sem internet, tudo funciona igual (a escrita espera na fila).

### Registros

| Ação | Faz |
|---|---|
| `toggleHabit(habitId, day?)` | marca ou desmarca (o `CheckButton`) |
| `markHabit(habitId, day?, { time?, value?, run?, note? })` | marca como feito. Horário: `{ time: '06:58' }` (fora da tolerância grava sem contar). Duração: `{ value: 12 }` (parcial a partir do mínimo) |
| `unmarkHabit(habitId, day?)` | desmarca (apaga a marca) |
| `setMark(habitId, day, 'done' \| 'partial' \| 'none')` | corrigir um dia; `'none'` apaga |
| `setTime(habitId, day, '06:52')` | registra um horário |
| `logSleep({ bed: '22:15', wake: '06:52' }, day?)` | a folha "Acordei às": o deitar vai para a noite anterior. Toast "Deitar e acordar registrados" |
| `rate(habitId, day, 4, { tags })` | nota de 1 a 5, com os chips do prato |
| `setChecklistItem(habitId, day, itemId, on)` | um passo de uma lista (ritual do sono) |
| `logNumber(habitId, day, value \| null)` | número livre de um hábito |
| `addEntry(habitId, { amount, item?, quickAddId?, count? }, day?)` | soma no contador: `addEntry(proteinId, { amount: 6, item: 'Ovo', quickAddId })`, `addEntry(waterId, { amount: 500, item: '500 ml' })`. Toques no mesmo botão em até 1,5 s juntam numa entrada ("Ovo × 3") |
| `removeEntry(entryId, { portions? })` | o − da linha: tira uma porção (`{ portions: 1 }`) ou a entrada |
| `removeEntries(entryIds)` | deslizar a linha inteira (use `line.entryIds`) |
| `spendBudget(habitId, day?)` | usa um do limite (o `PlusButton`). `useBudget` é o mesmo, mas o nome confunde o lint de hooks: use `spendBudget` |
| `logSlip(habitId, { day?, note? })`, `editSlip(slipId, { day, note })`, `deleteSlip(slipId)` | deslizes |
| `saveCheckin(day, { mood, energy, good, screenMinutes, youtubeMinutes })` | check-in (apague o rascunho depois) |
| `logMeasurement('weight' \| 'waist', day, 83.6)`, `deleteMeasurement(kind, day)` | peso e cintura (uma por dia, a nova substitui) |
| `skipToday(habitId, day?)`, `unskipToday(habitId, day?)` | "Hoje não se aplica" e "Voltar a contar hoje" |
| `archiveHabit(habitId)`, `restoreHabit(habitId)` | arquivar e desarquivar (os dias arquivados ficam fora das contas) |

### Plano

| Ação | Faz |
|---|---|
| `createPillar({ name, color, icon, description? })` | no fim da lista; id em `undo.id` |
| `updatePillar(id, { name?, color?, icon? })` | editar |
| `archivePillar(id)`, `restorePillar(id)` | arquiva com os hábitos só dele; o compartilhado passa para o extra (e volta ao restaurar) |
| `deletePillar(id)` | apaga de vez com os hábitos só dele e os registros deles (há desfazer; a folha decide se oferece) |
| `reorderPillars(ids)` | nova ordem, ao soltar o arrasto |
| `createHabit(draft)` | `draft`: `{ name, type, pillarId, icon?, alsoIn?, goal?, schedule?, quickAdds?, checklist?, training?, start?: 'now' \| <fase> \| <dia> }`. Numa fase futura, espera. Treino guiado sem `training` nasce com o modelo da corrida |
| `updateHabit(id, patch)` | meta, mínimo, horário, dias, pilar, ícone, botões... |
| `moveHabitToPhase(habitId, n)` | "Proteína movida para a fase 3" |
| `scheduleHabit(habitId, day, note?)` | um dia marcado (programa a dois no sábado) |
| `startPause({ start, end, reason?, habitIds? })` | `end` é o último dia pausado; `habitIds` null = o app inteiro |
| `updatePause(id, { end })`, `endPause(id, day?)`, `cancelPause(id)` | estender, encerrar (fim vira ontem), cancelar a marcada |

### Jornada

| Ação | Faz |
|---|---|
| `startPhase(n, startDay = amanhã)` | fecha a fase atual (constância de fechamento) e começa a `n`; o desfazer é o "Mudar de ideia" |
| `undoPhaseChoice(n)` | "Mudar de ideia" depois de reabrir o app (a fase `n` ainda não começou ou começou hoje) |
| `stayInPhase(n)` | a fase termina 7 dias depois |
| `updatePhase(n, { name?, weeks?, end? })`, `addPhase({ name, weeks })`, `setPhaseThreshold(0.7 \| null)` | Editar fases |
| `markPhaseCelebrated(n)` | a celebração da fase desbloqueada aconteceu (`phase.celebratedAt`) |
| `saveReviewStep(semana, passo, { tweakWorked?, tweak?, waist?, together? })` | guarda o passo; `waist` grava a cintura; `together` marca o dia do programa a dois |
| `finishReview(semana, { decision?: 'advance' \| 'stay' })` | conclui e guarda a constância e o resumo |
| `setRunSchedule({ days: [0, 2], time: '07:10' }, habitId?)` | dias e hora dos treinos de um treino guiado (sem id, o primeiro) |
| `startRun({ week, session, habitId? })`, `pauseRun(id)`, `resumeRun(id)`, `finishRun(id)`, `discardRun(id)` | o treino, com os blocos do plano do hábito; `finishRun` marca o hábito pelo plano: o treino inteiro é feito, a partir da metade é parcial, abaixo fica registrado sem contar (`mark.goal.value` = os minutos do treino). `readRunCopy()` lê a cópia local para retomar antes dos dados chegarem |

### Perfil, dados e A dois

| Ação | Faz |
|---|---|
| `setTheme('system' \| 'light' \| 'dark')`, `setMotion(on)`, `setSound(on)`, `setRunSound(on)`, `setWeightTrendOnly(on)` | preferências (o tema troca ao vivo pela casca) |
| `setScheduleTime('wake' \| 'bed' \| 'screensOff' \| 'chores' \| 'checkin' \| 'caffeine', '22:30')` | vale a partir de hoje; o que passou guarda a meta da época |
| `setWeeklyReview(6, '18:00')`, `setCollectionDays([0, 3])`, `setWeekendTolerance(on)`, `updateProfile({ name })` | rotina |
| `setupPlan(draft, { name? })` | primeiro acesso: grava perfil, pilares, hábitos e fases num lote |
| `exportData('csv' \| 'json')` | `{ filename: 'prokope-2026-10-22.csv', mime, content, toFile() }` (para `navigator.share({ files: [file.toFile()] })`) |
| `deleteAllData(onProgress?)` | apaga tudo (sem desfazer); a sessão pede o primeiro acesso |
| `createInvite()` | `undo.url` é o link `/convite/:id` para compartilhar; `undo.invite` |
| `cancelInvite(id)`, `declineInvite(id)`, `markInviteSeen(id)`, `acceptInvite(id)`, `unlink()` | convite e ligação |
| `setSharing({ mood: true })`, `setSharedHabit(habitId, on)`, `sendHug()` | o que mostrar e o carinho (um por minuto) |

## Celebrar ou não: de onde veio a mudança

```ts
const origin = useChangeOrigin('marks'); // 'local' (este aparelho: celebra) | 'remote' (outro aparelho: troca em micro) | 'initial'
```

Marcar um dia passado nunca celebra (isso é da tela: `day !== today`).

## Rascunhos e o dia fechado

```ts
const drafts = useDrafts();
drafts.checkins[day];                       // { mood?, energy?, good?, screenMinutes?, youtubeMinutes? }
drafts.setCheckinDraft(day, { mood: 4 });   // o rostinho tocado no cartão já vai para o rascunho
drafts.clearCheckinDraft(day);              // depois do saveCheckin
drafts.reviews[week]; drafts.setReviewDraft(week, { step, tweak, waist, together }); drafts.clearReviewDraft(week);
drafts.onboarding[conta]; drafts.setOnboarding(conta, passo, planDraft); drafts.clearOnboarding(conta);
drafts.habitForm; drafts.setHabitForm(draft | null);  // Novo hábito · tipo e detalhes
wasDayCelebrated(day); markDayCelebrated(day);        // o brilho do dia fechado, uma vez por dia
```

Na virada do dia, um rascunho de check-in com humor e energia vira check-in salvo (sozinho); sem os dois, é descartado.

## Tipos e estados

Os tipos estão em `src/types/model.ts`: `Profile`, `Pillar`, `Habit`, `Mark`, `Entry`, `Slip`, `Checkin`, `Measurement`, `Pause`, `Phase`, `Review`, `Run`, `Invite`, `Link`, `Hug`.

**Hábito** (`Habit`): `type` é `'check' | 'time' | 'counter' | 'rating' | 'number' | 'weekly' | 'budget' | 'daysSince' | 'checklist' | 'guided'`; `goal` = `{ value?, unit?, partialMin?, direction?, ramp?, perWeek?, time?, timeKey?, toleranceMin?, measuring? }`; `schedule` = `{ days, useCollectionDays?, moment: 'morning' | 'day' | 'evening' | 'free', time?, timeKey? }`; `pillarId` e `alsoIn`; `phase`, `startDay` (null = espera a fase), `role`, `icon`, `quickAdds`, `checklist`, `order`, `archived`.

**Treino guiado** (`type: 'guided'`): conta como vezes por semana (`goal.perWeek` = treinos por semana, nos dias de `schedule.days`, às `schedule.time`) e tem o plano em `training`: `{ effort: 'Correr', rest: 'Caminhar', warmupMin: 5, cooldownMin: 5, weeks: [{ kind: 'repeat', repeat: 8, effort: 1, rest: 1.5 } | { kind: 'sequence', steps: [15, 2, 8] } | { kind: 'continuous', minutes: 20 }] }` (minutos). Leia sempre por `trainingOf(habit)`, que devolve um plano válido (nomes vazios voltam ao padrão; sem plano, o modelo da corrida).

**Migração na leitura** (`src/domain/normalize.ts`): o store e o domínio passam cada hábito por `normalizeHabit`. A corrida de antes (`type: 'weekly'`, `role: 'run'`, sem `training`) chega como Treino guiado com o modelo "Corrida do zero aos 30 minutos", sem script. Os treinos feitos (`runs`) continuam ligados pelo id, e a semana e o treino atuais saem da contagem deles. A próxima gravação do hábito já sai no formato novo: `updateHabit` grava o documento inteiro, e um merge em qualquer outra ação (`commit`, em `actions/core.ts`) leva junto os campos da migração.

**Estado de um dia** (`HabitDayState`):

| Estado | Quando | Na tela |
|---|---|---|
| `done` | feito (ou nota dada, meta do contador batida, sem deslize no dia) | cheio, com ✓ |
| `partial` | abaixo da meta e a partir do mínimo | meio cheio, "parcial" |
| `notDone` | contava e não foi feito (hoje: ainda não) | trilho vazio |
| `skipped` | "hoje não se aplica" | círculo pontilhado, "não conta hoje" |
| `paused` | dentro de uma pausa (do app ou do hábito) | hachurado |
| `offSchedule` | fora da agenda (futebol num sábado) | pontilhado no calendário; não aparece no Hoje |
| `future` | depois de hoje | vazado, não tocável |
| `inactive` | antes de começar (fase futura) ou depois de arquivado | não aparece |

## As regras, em uma linha cada

- **Conta do dia:** contam marcar, horário, nota, lista, dias sem (feitos enquanto não há deslize) e vezes por semana com dia fixo; ficam fora contadores, limites e medidas; saem pausados, fora da agenda e "não conta hoje"; parcial conta como feito.
- **Constância:** pontos / dias que contavam (feito 1, parcial 0,5), com contadores na meta; pausas fora; **hoje entra só com o que já foi feito**. Se só os "dias sem" de hoje contam (primeiro dia da semana ou da fase, nada feito ainda), a constância é `null`, e não 100%.
- **Força:** média que pesa mais os dias recentes (meia-vida de 13 dias agendados, como no Loop), sem começar do zero; pede 7 dias.
- **Dias sem:** atual desde o último deslize (contando hoje), recorde e total; o dia do deslize sai do total; na pausa a contagem fica parada.
- **Limites:** de segunda a domingo; "dias" conta dias distintos.
- **Correlações:** só com 7 dias com e 7 sem, contando dias com check-in; os insights mostram só o que ajuda.
- **Peso:** média de 7 dias; a tendência compara a média de hoje com a de 3 semanas atrás e pede 3 pesagens.
- **Hoje:** a Noite abre às 18h; o check-in sobe no horário do check-in (20h30); o dia fecha quando todo hábito que conta e se marca no dia está feito (o deitar fica para a manhã).
- **Convite gentil:** o hábito mais firme que ficou sem registro ontem, no máximo um, fora pausa, primeiro dia e deitar.
- **Revisão:** abre no dia e na hora escolhidos e fica até 2 dias depois; depois, vira "pendente" na Jornada.
- **Fases:** datas das futuras são previsões; sugestão de avançar com a constância da fase ≥ limite (70%). "Do zero" nasce com a fase 1, sem fim; numa conta em que nenhuma fase começou, `addPhase` começa a nova hoje.
- **Pausa:** marcar feito (ou parcial) num dia pausado tira aquele dia da pausa, só para aquele hábito (conta na constância e na força).
- **Revisão:** sem nada feito, a linha não começa pelo zero: "Futebol ficou para a próxima semana".

## Ícones, textos e outros ajudantes

Tudo sai de `@/data`:

- **Ícones:** `ICON_CATALOG` (154 ícones: `{ name, label: 'Cofrinho', keywords, category }`), `ICON_CATEGORIES`, `searchIcons('agua')`, `suggestCategory('Finanças')` → `'dinheiro'`, `suggestIcon('Leitura')` → `'book-open'`, `iconLabel(name)`.
- **Textos:** `formatTime('06:52')` "6h52", `formatTimePadded` "06h52", `formatVolume(1500)` "1,5 L", `formatMinutes(108)` "1h 48min", `formatNumber(83.6)` "83,6", `formatAmount(46, 'g')`, `formatDayHeader(day)` "Quinta, 22 de outubro", `formatDayShort` "22 out", `formatDayCompact` "Qua, 21 out", `formatDayLong`, `formatRange(a, b)` "19 – 25 de outubro", `formatRelativeDay`, `formatPercent(0.76)` "76%", `formatClockSeconds(42)` "0:42", `weekdayName`, `weekdayShortLabel(0)` "seg", `moodWord(4)` "Bem", `energyWord(3)` "Ok", `mealWord(4)` "Bom", `greeting(minutes)`, `capitalize`.
- **Datas:** `addDays`, `diffDays`, `daysBetween`, `weekStart`, `weekDays`, `weekdayOf`, `isWeekend`, `monthDays`, `instantAt(day, '07:10')`, `timeOf(ms)`.
- **Primeiro acesso:** `defaultPlanDraft('template' | 'empty')`, `planChips(draft, pillarKey)`, `toggleChip(draft, chip, on)`, `laterSummary(pillarKey)` "Depois: ritual do sono e silêncio", `chosenCount(draft)` (7), `planStartDay(now, clock)` (amanhã depois das 20h), `TEMPLATE_PILLARS`, `DEFAULT_SCHEDULE`.
- **Treino guiado:** `trainingOf(habit)`, `planWeeks(plan)`, `planWeek(plan, n)`, `weekOfHabit(habit, n)`, `namesOf(plan)`, `sessionsPerWeek(habit)`, `nextSession(feitos, semanas, porSemana)`, `runPosition(week, segundos)`, `runElapsed(run, agora)`, `intervalsCompleted`, `effortSecondsDone`; textos `weekLabel`, `weekPhrase`, `gerund('Pedalar leve')` "pedalando leve", `effortTimeLabel(names)` "tempo correndo"; modelos `RUN_TEMPLATE` ("Corrida do zero aos 30 minutos"), `TRAINING_TEMPLATES`, `templateOf(plan)`, `runTemplatePlan()`, `blankPlan()`, `clonePlan()`; o plano do modelo pronto em `RUN_PLAN` e `runWeek(n)`.
- **Pilares:** `pillarUsingColor(color, pillars)` ("Damasco · também em Corpo"), `duplicatePillarName(name, pillars)` ("Já existe um pilar Corpo."), `firstFreeColor(PALETTE_KEYS, pillars)`.
- **Outros:** `quickAddsFor(habit, minutes)`, `groupEntries(entries)`, `insightText(correlation, habit)`, `isDoneLike(state)`, `nextRampStep(habit, day)`, `CORRELATION_NEEDED` (7), `WEIGHT_NEEDED` (3).

## Modo demonstração e Firebase

- **Demonstração** (`LocalSource`): os dados ficam no IndexedDB do aparelho, sobrevivem a recarregar, e duas abas conversam. A semente (`src/data/seed.ts`) conta a história do quadro a partir de hoje: hoje é a "quinta"; a fase 1 começou 31 dias antes; a fase 2 está na semana 2 de 3; os registros de hoje seguem a hora (depois das 7h10, ovo × 3 e leite; às 8h05, água...). Números de exemplo, sem dado pessoal.
- **A história e a hora fixada:** a semente conta a história até "hoje" (a quinta). Com `?agora=` depois de semeada (o domingo da revisão, por exemplo), os dias entre a quinta e a data fixada ficam sem registros: o Hoje de domingo mostra 0 g e a Revisão uma constância baixa. Para conferir esses quadros com dados, fixe a hora e use **Começar de novo** (a história recomeça com hoje = a data fixada).
- **Números da história na semente** (testados em `src/data/__tests__/seed.test.ts`): caminhada com 72% de força, 24 dias com e 8 sem (17 em outubro), humor 4,1 com e 3,4 sem; acordar no horário em 20 dias e fora em 12 (o resto do dia: 84% contra 61%); deitar até 22h e energia do dia seguinte 3,6 contra 2,8; outubro com 20 check-ins (sem 3 e 17), humor médio 3,8 e energia 3,2; proteína 46 g às 12h58 (o frango entra depois do almoço). A constância às 7h42 dá 75% (o quadro diz 76%), e Corpo e Alimentação dão 75% e 65% (71% e 64% no quadro): com só a caminhada no Corpo e 17 dias que contam na Alimentação até a quinta, a fórmula não chega aos números do quadro.
- **Só em desenvolvimento:** `?sem-acesso=pessoa@exemplo.com` abre "Conta sem acesso" sem Firebase.
- **Firebase** (`FirestoreSource`): `users/{uid}/{coleção}/{id}` e o perfil em `users/{uid}/profile/profile`; o A dois em `invites/{id}` e `links/{id}` (com `share`, `hugs`, `habits`), como em `firestore.rules`. As ações não esperam o servidor.
- Ids: `marks/{day}_{habitId}`, `checkins/{day}`, `measurements/{day}_{kind}`, `phases/{número}`, `reviews/{segunda da semana}`; o resto é gerado.
- Testes: `src/domain/__tests__`, `src/actions/__tests__`, `src/data/__tests__` (inclui os números da história).
