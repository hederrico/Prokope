// A casca do app: abas, barras do topo, folhas, toasts e as passagens entre telas.
// Como as telas usam: ScreenHeader (aba), NavBar (empurrada e formulário), FullScreen + StepTop + StepTransition
// (tela cheia e fluxos), Sheet (folhas), showUndo/showToast (avisos), useGoBack/useOpenSheet/useMirrorPaths (navegação).
export { NavBar, type NavBarProps } from './NavBar';
export { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';
export { StepTop, type StepTopProps } from './StepTop';
export { StepTransition } from './StepTransition';
export { FullScreen, type FullScreenProps } from './FullScreen';
export { TabBar, type TabBarProps } from './TabBar';
export { Sheet, useSheetClose, type SheetProps } from './Sheet';
export {
  showToast,
  showUndo,
  dismissToast,
  holdToasts,
  type ToastInput,
  type ToastAction,
  type UndoInput,
} from './toast';
export {
  habitPath,
  pastReviewPath,
  useBackTarget,
  useCurrentTab,
  useFlowStep,
  useGoBack,
  useMirrorPaths,
  useOpenSheet,
  useScreenTitle,
  useSheetNavigation,
  type BackTarget,
  type NavState,
} from './navigation';
export { useShellState } from './shellState';
export type { PillarColor, SheetScreenProps, TransitionType } from './types';
