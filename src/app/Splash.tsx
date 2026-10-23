// Abertura calma enquanto a sessão carrega: só o nome, que aparece depois de 300 ms (se a sessão responder antes,
// nada pisca). Sem girador e sem "Carregando..." (estados.md › Carregando).
export function Splash() {
  return (
    <div className="sh-splash" role="status" aria-label="Abrindo o Prokopē">
      <p aria-hidden="true">Prokopē</p>
    </div>
  );
}
