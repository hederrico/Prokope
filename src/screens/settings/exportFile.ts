// Exportar (Dados e conta e Apagar todos os dados): o arquivo sai dos dados já na memória. No iPhone, abre a folha de
// compartilhar (o iPhone só abre essa folha dentro de um toque recente); no computador, baixa.
import { exportData, type ExportFile } from '@/actions';

export type { ExportFile };

/** Gera o arquivo e diz quanto tempo levou (passando de 300 ms, a tela pede um segundo toque para salvar). */
export async function buildExport(format: 'csv' | 'json'): Promise<{ file: ExportFile; ms: number }> {
  const t0 = performance.now();
  const file = await exportData(format);
  return { file, ms: performance.now() - t0 };
}

/** Abre a folha de compartilhar com o arquivo; sem ela (computador), baixa. */
export async function deliverFile(file: ExportFile): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const f = file.toFile();
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (coarse && typeof navigator.share === 'function' && navigator.canShare?.({ files: [f] })) {
    try {
      await navigator.share({ files: [f], title: file.filename });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = file.filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
