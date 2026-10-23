// As rotas do treino guiado (navegacao.md › Rotas). Cada treino guiado tem as suas: o plano, o editor do plano, o
// treino em andamento e o treino feito. As rotas antigas da corrida (/jornada/corrida, /corrida/:semana/:treino)
// continuam valendo para o primeiro treino guiado.
const id = (habitId: string) => encodeURIComponent(habitId);

/** O plano na Jornada: /jornada/treino/:id. */
export const trainingPlanPath = (habitId: string) => `/jornada/treino/${id(habitId)}`;

/** Editar o plano (tela cheia): /jornada/treino/:id/plano. */
export const trainingEditPath = (habitId: string) => `/jornada/treino/${id(habitId)}/plano`;

/** O treino em andamento: /treino/:habito/:semana/:treino (um treino antigo sem hábito fica na rota antiga). */
export const runPath = (habitId: string, week: number, session: number) =>
  habitId ? `/treino/${id(habitId)}/${week}/${session}` : `/corrida/${week}/${session}`;

/** O treino feito: /treino/:habito/:semana/:treino/feito. */
export const runDonePath = (habitId: string, week: number, session: number) =>
  `${runPath(habitId, week, session)}/feito`;
