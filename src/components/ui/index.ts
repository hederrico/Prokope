// Design system do Prokopē: componentes de apresentação (recebem dados por props e não leem stores).
// Nomes e props de docs/interacao/componentes.md; medidas e cores de docs/telas/base.css (classes pk-* em ui.css).
// A galeria com todos os estados está em /dev/componentes (src/screens/dev/ComponentGallery.tsx).
import './ui.css';

export { pillarAttrs, type HabitVisual, type PillarColor, type PillarTone } from './pillar';
export { useReduced, useDelayedValue, spellUnits, fmtNumber } from './lib';

// linha do hábito e registro
export { HabitRow, HabitList, type HabitRowProps } from './HabitRow';
export { CheckButton, type CheckButtonProps } from './CheckButton';
export { ValuePill, type ValuePillProps } from './ValuePill';
export { ActionPill, type ActionPillProps } from './ActionPill';
export { PlusButton, type PlusButtonProps } from './PlusButton';
export { QuickAddButton, type QuickAddButtonProps } from './QuickAddButton';
export { QuickAddTile, QuickAddMore, type QuickAddTileProps } from './QuickAddTile';
export { QuickAddGrid, type QuickAddGridProps } from './QuickAddGrid';
export { WeekDots, type WeekDotsProps } from './WeekDots';
export { RatingRow, type RatingRowProps, type RatingValue } from './RatingRow';
export { RatingFaces, type RatingFacesProps } from './RatingFaces';
export { Face, FACE_WORDS, type FaceProps, type FaceKind, type FaceLevel } from './Face';

// semana, metas e contadores
export { WeekStrip, weekDayLabel, dayParts, toWeekDays, type WeekStripProps, type WeekDay } from './WeekStrip';
export { WeekCard, type WeekCardProps } from './WeekCard';
export { GoalBar, goalBarScale, goalBarLabel, type GoalBarProps } from './GoalBar';
export { Ring, type RingProps } from './Ring';
export { BudgetSlots, type BudgetSlotsProps } from './BudgetSlots';
export { BudgetRow, type BudgetRowProps } from './BudgetRow';
export { DaysSinceTile, daysSinceLabel, type DaysSinceTileProps } from './DaysSinceTile';
export { RollingNumber, type RollingNumberProps } from './RollingNumber';
export { NumberFlow, type NumberFlowProps } from './NumberFlow';

// controles
export { Chip, ChipRow, type ChipProps } from './Chip';
export { Button, type ButtonProps } from './Button';
export { Switch, type SwitchProps } from './Switch';
export { SegmentedControl, type SegmentedControlProps } from './SegmentedControl';
export { TextField, type TextFieldProps } from './TextField';
export { ListItem, type ListItemProps } from './ListItem';
export { ListGroup, type ListGroupProps } from './ListGroup';
export { SectionLabel, type SectionLabelProps } from './SectionLabel';
export { OptionCard, OptionGroup, type OptionCardProps, type OptionGroupProps } from './OptionCard';
export { Radio } from './Radio';
export { DayPicker, type DayPickerProps } from './DayPicker';
export { TimeValue, formatShortDate, type TimeValueProps } from './TimeValue';

// dados e informação
export { Heatmap, type HeatmapProps, type HeatState } from './Heatmap';
export { HeatmapKey, type HeatmapKeyProps } from './HeatmapKey';
export { Stat, type StatProps } from './Stat';
export { StatGroup, type StatGroupProps } from './StatGroup';
export { InsightCard, type InsightCardProps } from './InsightCard';
export { Tag, type TagProps } from './Tag';
export { MiniBar, type MiniBarProps } from './MiniBar';
export { CardHeader, type CardHeaderProps } from './CardHeader';

// estrutura e estados
export { Card, type CardProps } from './Card';
export { FoldedGroup, type FoldedGroupProps } from './FoldedGroup';
export { AddRow, type AddRowProps } from './AddRow';
export { ProfileCard, type ProfileCardProps } from './ProfileCard';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Skeleton, SkeletonGroup, type SkeletonProps, type SkeletonGroupProps } from './Skeleton';
export { SkeletonRow, type SkeletonRowProps } from './SkeletonRow';
export { PillarBubble, type PillarBubbleProps } from './PillarBubble';
