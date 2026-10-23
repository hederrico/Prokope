// O cabeçalho de cada passo do primeiro acesso: "Passo n de 3", o título na serifa e a frase de apoio.
// O título recebe o foco a cada passo (StepTransition).
export function StepHead({ step, title, lead }: { step: number; title: string; lead: string }) {
  return (
    <div className="ob-head">
      <span className="eyebrow">Passo {step} de 3</span>
      <h1 className="lt" tabIndex={-1}>
        {title}
      </h1>
      <p className="lead">{lead}</p>
    </div>
  );
}
