// Ajudantes puros das folhas de registro: ícone de alimento, nome do volume de água, textos de horário e peso.
import { addDays, formatMinutes, formatNumber, formatVolume, suggestIcon, weekdayName } from '@/data';
import { isIconName, type IconName } from '@/icons';
import type { DayKey, TimeHM } from '@/types';

const norm = (s: string) =>
  s
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

// palavras comuns de alimentos → ícone (os botões rápidos não guardam ícone; o nome é da pessoa)
const FOOD_ICONS: [RegExp, IconName][] = [
  [/\bovos?\b|omelete|clara/, 'egg'],
  [/queijo|requeij|ricota|cottage|muçarela|mussarela/, 'cheese'],
  [/feij|lentilha|grao de bico|ervilha|soja|tofu/, 'coffee-bean'],
  [/leite|kefir/, 'cow'],
  [/whey|proteina em po|shake|albumina/, 'jar-label'],
  [/iogurte|coalhada|skyr/, 'jar'],
  [/frango|peru|galinha|chester/, 'bird'],
  [/peixe|atum|salmao|sardinha|tilapia|camarao/, 'fish'],
  [/carne|bife|patinho|alcatra|picanha|hamburguer|costela/, 'hamburger'],
  [/pao|torrada|tapioca/, 'bread'],
  [/castanha|amendoim|nozes|amendoa/, 'grains'],
  [/abacate/, 'avocado'],
  [/agua|garraf|copo/, 'drop'],
];

/** Ícone de um botão rápido ou de uma linha pelo nome do alimento; senão, o do hábito. */
export function foodIcon(name: string | null | undefined, fallback: IconName): IconName {
  if (!name) return fallback;
  const n = norm(name);
  for (const [re, icon] of FOOD_ICONS) if (re.test(n)) return icon;
  const s = suggestIcon(name);
  return s && isIconName(s) ? s : fallback;
}

/** "500 ml", "1 L", "1,5 l": o nome do botão é só o volume. */
export function isVolumeName(name: string | null | undefined): boolean {
  return !!name && /^\s*\d+(?:[.,]\d+)?\s*(ml|l)\s*$/i.test(name);
}

/** O recipiente de um volume: copo, garrafinha, garrafa. */
export function containerWord(ml: number): string {
  if (ml <= 300) return 'copo';
  if (ml <= 750) return 'garrafinha';
  return 'garrafa';
}

export function capitalizeFirst(text: string): string {
  return text ? text[0]!.toLocaleUpperCase('pt-BR') + text.slice(1) : text;
}

/** "Whey removido", "Garrafa removida" (o gênero pelo fim da palavra, que basta para os nomes curtos). */
export function removedLabel(name: string): string {
  return `${name} ${/a$/i.test(name.trim()) ? 'removida' : 'removido'}`;
}

/** Valor com unidade, para leitura: "18 gramas", "1,5 litro", "500 mililitros". */
export function spokenAmount(value: number, unit: string | undefined): string {
  if (unit === 'ml') {
    if (value >= 1000) {
      const l = value / 1000;
      return `${formatNumber(l, 2)} ${l === 1 ? 'litro' : 'litros'}`;
    }
    return `${Math.round(value)} mililitros`;
  }
  if (unit === 'g') return `${formatNumber(value)} ${value === 1 ? 'grama' : 'gramas'}`;
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`;
}

/** Texto curto de um valor: "18 g", "1,5 L". */
export function shortAmount(value: number, unit: string | undefined): string {
  if (unit === 'ml') return formatVolume(value);
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`;
}

/** Minutos do dia lógico (0h30 vira 24h30 quando o dia vira às 4h). */
export function logicalMinutes(time: TimeHM, dayStartHour = 4): number {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return (h < dayStartHour ? h + 24 : h) * 60 + m;
}

/** Diferença do horário para a meta, quando passou da tolerância: "20 min depois da meta". */
export function lateText(time: TimeHM, goal: TimeHM, dayStartHour = 4): string {
  const diff = logicalMinutes(time, dayStartHour) - logicalMinutes(goal, dayStartHour);
  return `${formatMinutes(Math.abs(diff))} ${diff >= 0 ? 'depois' : 'antes'} da meta`;
}

/** Limpa o que foi digitado no peso: só algarismos e uma vírgula, até 3 inteiros e 1 casa. */
export function cleanDecimal(text: string): string {
  let s = text.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '');
  const [rawInt = '', dec] = s.split(',');
  const int = rawInt.replace(/^0+(?=\d)/, '').slice(0, 3);
  if (dec !== undefined) return `${int || '0'},${dec.slice(0, 1)}`;
  return int;
}

/** O número do texto do peso, ou null. */
export function parseDecimal(text: string): number | null {
  if (!text || text.endsWith(',')) return text ? Number(text.slice(0, -1)) || null : null;
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export const WEIGHT_MIN = 20;
export const WEIGHT_MAX = 300;

export function validWeight(n: number | null): n is number {
  return n !== null && n >= WEIGHT_MIN && n <= WEIGHT_MAX;
}

/** Número inteiro digitado (só algarismos, até 4): minutos, gramas. */
export function parseWhole(text: string): number | null {
  const d = text.replace(/\D/g, '').slice(0, 4);
  return d ? Number(d) : null;
}

/** "hoje", "ontem", "na quarta", "no sábado" (para "Acordei na quarta"). */
export function onDay(day: DayKey, today: DayKey): string {
  if (day === today) return 'hoje';
  if (day === addDays(today, -1)) return 'ontem';
  const name = weekdayName(day);
  return `${name === 'sábado' || name === 'domingo' ? 'no' : 'na'} ${name}`;
}
