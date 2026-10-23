// O tutorial com o Zeno: os capítulos e a leitura do estado guardado no perfil.
// A especificação está em docs/interacao/telas/tutorial.md.
import type { Profile, ProfilePrefs, TutorialChapter, TutorialState } from '@/types';

export interface ChapterInfo {
  id: TutorialChapter;
  title: string;
  /** a frase de Ajustes › Tutorial */
  summary: string;
  /** a aba onde o capítulo começa (o Zeno oferece o capítulo na primeira vez que a pessoa abre a aba) */
  tab: 'hoje' | 'progresso' | 'jornada' | 'ajustes';
  /** mostra as telas com a história de exemplo (modo exemplo), porque uma conta nova ainda não tem dados */
  example: boolean;
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { id: 'hoje', title: 'O dia', summary: 'Marcar, somar, dar nota, desfazer e o check-in', tab: 'hoje', example: false },
  { id: 'habito', title: 'O hábito e os padrões', summary: 'O calendário, a força e as comparações', tab: 'hoje', example: true },
  { id: 'progresso', title: 'O progresso', summary: 'A semana, os pilares, o humor e as medidas', tab: 'progresso', example: true },
  { id: 'jornada', title: 'A jornada', summary: 'As fases, o treino guiado e a revisão de domingo', tab: 'jornada', example: true },
  { id: 'ajustes', title: 'Os ajustes', summary: 'Pilares, hábitos, horários, aparência e a dois', tab: 'ajustes', example: false },
];

export function chapterInfo(id: TutorialChapter): ChapterInfo {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}

const EMPTY: Required<TutorialState> = { introAt: 0, done: {}, offered: {}, firstSteps: {} };

/** O estado do tutorial, com valor padrão para documentos antigos (sem o campo). introAt 0 = ainda não se apresentou. */
export function tutorialOf(profile: Pick<Profile, 'tutorial'> | null | undefined): Required<TutorialState> {
  const t = profile?.tutorial;
  if (!t) return EMPTY;
  return {
    introAt: typeof t.introAt === 'number' ? t.introAt : 0,
    done: t.done ?? {},
    offered: t.offered ?? {},
    firstSteps: t.firstSteps ?? {},
  };
}

/** "Mostrar o Zeno": documentos antigos não têm o campo, e vale mostrar. */
export function zenoShown(prefs: Pick<ProfilePrefs, 'zeno'> | null | undefined): boolean {
  return prefs?.zeno !== false;
}
