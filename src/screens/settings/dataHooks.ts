// Hooks de Dados e conta: exportar (com o segundo toque quando o arquivo demora) e o "Registrando desde".
import { useRef, useState } from 'react';
import { logicalDay, useJourney, useProfile } from '@/data';
import { buildExport, deliverFile, type ExportFile } from './exportFile';

export type ExportState = { phase: 'idle' } | { phase: 'working' } | { phase: 'ready'; file: ExportFile };

export function useExport(format: 'csv' | 'json') {
  const [state, setState] = useState<ExportState>({ phase: 'idle' });
  const slow = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const run = async (): Promise<boolean> => {
    if (state.phase === 'ready') {
      await deliverFile(state.file);
      setState({ phase: 'idle' });
      return true;
    }
    if (state.phase === 'working') return false;
    // nada aparece antes de 300 ms; passando disso, "Preparando o arquivo…"
    slow.current = setTimeout(() => setState({ phase: 'working' }), 300);
    const { file, ms } = await buildExport(format);
    clearTimeout(slow.current);
    if (ms > 300) {
      // o iPhone só abre a folha de compartilhar dentro de um toque recente: o segundo toque salva
      setState({ phase: 'ready', file });
      return false;
    }
    setState({ phase: 'idle' });
    await deliverFile(file);
    return true;
  };
  return { state, run };
}

/** "Registrando desde 21 de setembro": o começo do plano (a fase 1) ou a criação da conta. */
export function useSinceDay(): string | null {
  const profile = useProfile();
  const journey = useJourney();
  const first = journey.phases.find((p) => p.start && !p.predicted)?.start;
  if (first) return first;
  return profile?.createdAt ? logicalDay(profile.createdAt) : null;
}
