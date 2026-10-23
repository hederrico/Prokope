# Estados

Regras para os momentos fora do caminho feliz: carregando, vazio, poucos dados, sem internet, erro, pausado, fora da agenda e os outros. Cada estado diz quando aparece, o que mostra e como entra e sai. As telas desenhadas estão na seção "Estados e feedback" do quadro (`docs/telas/index.html`), e o comportamento de cada uma está em [telas/estados.md](telas/estados.md).

## Carregando

- **Quando:** só no primeiro acesso num aparelho novo, sem cache. Nas outras vezes, o Firestore responde do cache antes da primeira pintura.
- **Espera antes de mostrar:** 300 ms. Se os dados chegarem antes, o esqueleto nunca aparece.
- **Como é:** as mesmas formas da tela (cabeçalho, semana, cartões) em `surface-2`, paradas. Nada de brilho passando: no máximo uma respiração de opacidade de 1 a 0,7 a cada 1,6 s, e parada com movimento reduzido.
- **Saída:** troca para o conteúdo com opacidade em `base`, sem pular de lugar, porque o esqueleto tem o tamanho do conteúdo.
- **Nunca:** girador no meio da tela, texto "Carregando...".

## Primeiro dia e vazio

- **Primeiro dia:** sem histórico, a semana mostra só os dias desde o começo, e o Hoje convida a marcar o primeiro hábito. Gráficos sem dados não aparecem; no lugar entra uma frase do que vai aparecer ali.
- **Lista vazia** (nenhum pilar arquivado, nenhum registro hoje): uma linha em `text-3`, sem ilustração. Exemplo: "Nenhum pilar arquivado."
- **Ação no vazio:** quando existe uma ação óbvia, a frase vem com ela ("Nenhum hábito neste pilar. Criar hábito").

## Poucos dados

- **Quando:** correlações pedem 7 dias com o hábito e 7 sem. A força do hábito pede 7 dias desde o começo. A tendência do peso pede 3 pesagens.
- **O que mostra:** quanto falta, em frase e com uma barrinha: "Os padrões aparecem com 7 dias com e 7 sem. Faltam 4 dias com caminhada."
- **Tom:** expectativa, nunca erro. Sem ícone de alerta.
- **Saída:** no dia em que o dado fica suficiente, o insight entra com `fadeUp` na primeira vez que a pessoa abre a tela.

## Sem internet

- **Quando:** `navigator.onLine` falso ou o Firestore sem conexão por mais de 3 s.
- **O que mostra:** um aviso fino no topo do Hoje, abaixo do cabeçalho: "Sem internet. Tudo continua salvo aqui e sobe quando voltar." Ícone `cloud-slash`, cor neutra.
- **Nada bloqueia:** marcar, somar e salvar o check-in funcionam igual.
- **Entrada e saída:** desce em `base` e sobe em `micro`. Quando a internet volta, o texto troca por "Tudo em dia" por 2 s antes de sair.
- **Outras telas:** não mostram aviso. Ajustes › Dados e conta mostra quantos registros esperam para subir.

## Erros

| Erro | O que a pessoa vê | Saída |
|---|---|---|
| Conta fora da lista permitida | Tela "Esta conta ainda não tem acesso", com o e-mail e "Entrar com outra conta" | Trocar de conta |
| Login cancelado ou falhou | Volta para Entrar, com a frase "O login não terminou. Tente de novo." acima do botão | Tentar de novo |
| Escrita recusada pelo servidor | Toast "Não deu para salvar. Tente de novo em instantes." e o valor volta ao anterior | Tentar de novo no toast |
| Versão antiga com dado novo (raro) | Toast de versão nova | Atualizar |

Erros nunca usam vermelho. A cor de atenção (`warn`) fica para o que pede cuidado antes de agir, como "Apagar todos os dados".

## Pausado

- **App inteiro:** o Hoje mostra o estado pausado: "Pausa até 2 de janeiro · Férias", sem a lista cobrando. A pessoa ainda pode registrar algo se quiser, e "Encerrar a pausa" fica à vista.
- **Um hábito:** a linha some do Hoje e aparece em Ajustes › Hábitos com "Pausado até 5 nov".
- **Nas contas:** dias pausados não entram na constância nem na força. No heatmap, eles ficam hachurados.
- **Fim da pausa:** no primeiro dia depois, o Hoje volta com uma frase de boas-vindas no lugar do cartão gentil: "Bem-vindo de volta. Comece por um hábito."

## Fora da agenda e "hoje não se aplica"

- **Fora da agenda:** hábitos com dias definidos (futebol na quinta, lixo na segunda e na quinta) só aparecem no Hoje nos dias deles. No heatmap, os outros dias ficam pontilhados.
- **Hoje não se aplica:** pelo menu do hábito, a pessoa tira um hábito só daquele dia (doente, viagem). O dia vira pausa de um dia só para aquele hábito. A linha fica no lugar, em `text-3`, com "não conta hoje" e um "Desfazer" no toast. Na próxima vez que o Hoje aparece, ela vai para o fim do grupo.

## Metas

| Estado | Como aparece |
|---|---|
| Ainda não começou | Trilho vazio, número em `text-3` |
| Andando | Barra ou anel no `fill` do pilar, número em `text` |
| Parcial | Fez menos que a meta e pelo menos o mínimo configurado no hábito. Meio cheio no calendário e "parcial" no texto; conta meio dia na constância e na força |
| Meta batida | Linha de meta acesa e o selo "meta batida" com ✓ |
| Passou da meta | A barra continua além da linha e mostra "+6 g" |
| Orçamento usado (refeições livres, tranqueiras) | Os espaços usados preenchem; o último usado é neutro, nunca alerta. Passar do limite mostra "3 de 2" em `text-2`, sem cor nova |

## Dias

| Dia | Na semana do topo | Ao tocar |
|---|---|---|
| Hoje | Anel em volta e o valor de hoje | Já está nele |
| Passado com registro | Anel parcial ou cheio | Abre o dia para corrigir |
| Passado sem registro | Trilho vazio | Abre o dia para corrigir |
| Pausado | Hachurado | Abre o dia, com a pausa explicada |
| Futuro | Vazado | Nada (não é tocável) |

- A semana do topo alcança a semana atual e a anterior (deslizando para o lado), o que cobre o domingo numa segunda-feira. Mais longe que isso, só pelo heatmap da tela do hábito.
- Marcar um dia passado não celebra: o ✓ aparece, sem brilho e sem dia fechado.

## Dia fechado

- **Quando:** o último hábito que se marca no próprio dia é marcado. Na rotina da história, é "Telas desligadas", às 21h04. O deitar não entra nessa conta: ele é marcado na manhã seguinte, junto com o acordar, para o celular não voltar à mão depois das 21h.
- **O que mostra:** o anel em 11 de 12, "Dia fechado", a frase "O deitar você marca amanhã, junto com o acordar.", o próximo compromisso ("até amanhã às 6h50") e "Ver o dia" para corrigir algo.
- **Uma vez:** a celebração acontece só no momento em que fecha. Reabrir o app no mesmo dia mostra o estado fechado, parado.
- **Desfazer:** desmarcar um hábito reabre o dia sem animação de perda: o anel recua em `fill` e a lista volta.

## Instalar e versão nova

- **Instalar no iPhone:** aparece quando o app abre no Safari e não está instalado (`navigator.standalone` falso). Pode ser dispensado com "Agora não", e volta a aparecer só depois de 7 dias.
- **Versão nova:** veja [comunicacao.md](comunicacao.md).
