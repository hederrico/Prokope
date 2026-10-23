# Interação e movimento

Como o Prokopē se comporta: como as telas se ligam, o que se mexe, o que cada toque faz e como uma ação numa tela aparece nas outras. O visual de cada tela está no quadro ([../telas/index.html](../telas/index.html)); aqui está o que acontece quando alguém usa.

## Ordem de leitura

1. [movimento.md](movimento.md): princípios, tokens de duração, curva e mola, coreografia, escada de celebração, movimento reduzido e código de referência.
2. [navegacao.md](navegacao.md): mapa do app, os quatro tipos de passagem entre telas, rotas, o que fica guardado e o computador.
3. [comunicacao.md](comunicacao.md): de onde vêm os dados, escrita sem internet, desfazer, onde cada ação aparece e o dia lógico.
4. [gestos-e-feedback.md](gestos-e-feedback.md): gestos, resposta ao toque, toasts, quando confirmar e teclado do iPhone.
5. [estados.md](estados.md): carregando, vazio, poucos dados, sem internet, erros, pausado, metas e dias.
6. [componentes.md](componentes.md): cada componente com os estados, as animações e a acessibilidade.
7. [acessibilidade.md](acessibilidade.md): VoiceOver, foco, letra grande, contraste e movimento reduzido.
8. As telas, grupo por grupo, em [telas/](telas/):
   - [entrada.md](telas/entrada.md): entrar, primeiro acesso e o computador
   - [hoje.md](telas/hoje.md): o dia, da manhã ao dia fechado
   - [registros.md](telas/registros.md): as folhas de registro
   - [habito-progresso.md](telas/habito-progresso.md): o detalhe do hábito e o progresso
   - [jornada.md](telas/jornada.md): fases, corrida e revisão de domingo
   - [ajustes-plano.md](telas/ajustes-plano.md): pilares e hábitos
   - [ajustes-rotina-conta.md](telas/ajustes-rotina-conta.md): horários, lembretes, aparência, pausa, a dois e conta
   - [estados.md](telas/estados.md): desfazer, outro dia, primeiro dia, offline e os outros estados

## Para sentir antes de construir

O [laboratório de movimento](laboratorio.html) mostra cada animação destes documentos funcionando, com a velocidade ajustável (para ver em câmera lenta), o modo reduzido e os dois temas. Abra direto no navegador; não precisa de servidor. A [abertura](abertura.html) compara as três propostas para a tela de quando o app abre, com o tempo dos dados ajustável.

## As dez regras

1. Movimento curto e calmo. Nada pisca e nada se mexe sozinho.
2. Toda animação liga uma ação ao resultado dela.
3. A celebração é proporcional: pequena no toque, média no dia fechado, confete só na fase nova.
4. O que falta nunca anima.
5. O toque responde em até 100 ms e nada bloqueia o próximo toque.
6. Desfazer em vez de confirmar. Confirmação só no que não volta.
7. As telas não passam dados entre si: todas leem da mesma fonte e se atualizam sozinhas.
8. Tudo funciona sem internet.
9. Todo gesto tem um botão visível que faz o mesmo.
10. Movimento reduzido troca deslocamento por opacidade, e o app continua completo.

Depois da revisão de usabilidade, os achados e as mudanças feitas nas telas estão em [../revisao/](../revisao/README.md). A ordem de construção está em [../desenvolvimento.md](../desenvolvimento.md).
