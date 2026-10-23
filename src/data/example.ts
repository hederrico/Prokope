// Modo exemplo: enquanto o Zeno mostra o hábito, o Progresso e a Jornada, as telas leem a história de exemplo da
// demonstração, numa cópia em memória. Nada do que a pessoa toca ali é salvo, e os dados dela ficam intocados.
// Versão provisória (contrato da rodada do Zeno): nunca entra. O agente do modo exemplo troca pela de verdade.

export interface ExampleMode {
  /** as telas estão mostrando o exemplo */
  active: boolean;
  /** troca as telas para o exemplo; resolve quando os dados do exemplo já estão na tela */
  enter(): Promise<void>;
  /** volta para os dados da pessoa; resolve quando eles já estão na tela */
  leave(): Promise<void>;
}

const off: ExampleMode = { active: false, enter: () => Promise.resolve(), leave: () => Promise.resolve() };

export function useExample(): ExampleMode {
  return off;
}
