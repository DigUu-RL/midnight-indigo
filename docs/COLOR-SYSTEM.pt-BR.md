# Sistema de cores

Como as oito paletas são feitas. [English version](COLOR-SYSTEM.md).

O Midnight Indigo é um tema em oito cores: Indigo, Purple, Pink, Red, Orange, Green, Cyan e Blue. Elas compartilham uma estrutura — os mesmos [tokens](TOKENS.md), as mesmas regras, o mesmo piso de legibilidade — e cada uma é desenhada para o seu próprio matiz, em vez de girada a partir de outra. As oito estão escritas em [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts); o valor de cada token em cada família está tabelado no [`TOKENS.md`](TOKENS.md).

Como as cores são *usadas* — qual token vai onde e por quê — é o [design system](DESIGN-SYSTEM.pt-BR.md). Esta página trata de onde as cores vêm.

## O fundo

O editor fica em `#020108` no Indigo: quase preto, com o tom da família, nunca preto puro. Cada família tem o seu quase-preto na mesma luminosidade — `#000303` no Cyan, `#040100` no Orange — para que as cores de destaque fiquem saturadas sem ofuscar, e a janela tenha a cor do tema mesmo onde nada está desenhado.

Acima do fundo há uma escada de superfícies — moldura, barra lateral, linha atual, widgets elevados, hover, foco, seleção — cada uma um degrau mais clara que a de baixo. O build falha se a escada de qualquer família andar para trás.

## Construído em OKLCH

Cada cor é calculada em [OKLCH](https://bottosson.github.io/posts/oklab/), cujo `L` é luminosidade percebida. O `L` do HSL não é: é o ponto médio entre o maior e o menor canal, então o matiz 60 e o matiz 240 com o mesmo `S` e `L` são um farol e um hematoma. Uma única tabela de papéis só serve para oito matizes se uma luminosidade significar a mesma coisa em todos eles.

O croma fica absoluto dentro de uma faixa, e não como fração do que cada matiz comporta. O croma do OKLCH já é perceptualmente comparável, e normalizá-lo pelo gamut sRGB desfaz isso: testado, produziu palavras-chave `#FF53F7` na variante vermelha.

## A maior parte do tema é um matiz só

Medidas em OKLCH, 30 das 39 cores originais do Indigo ficam dentro de uma faixa de 19 graus em torno do matiz 290: os fundos, as bordas, a seleção, a escada de texto, e as variáveis, propriedades, operadores e comentários. São um matiz visto em trinta luminosidades.

Então isso é compartilhado: dê o matiz a uma família e o workbench inteiro segue. O que não segue é tudo o que tem identidade própria — o destaque, as palavras-chave e seu parceiro escuro, e as seis tintas semânticas (strings, funções, números, tipos, interfaces, membros de enum). Essas são nomeadas por família, porque elas *são* a paleta.

## Uma família é um desenho, não uma rotação

Um gerador anterior movia todas as cores pelo mesmo ângulo, que é o que `hue-rotate()` faz: toda variante tinha as mesmas colunas de luminosidade e croma do Indigo, e do outro lado do círculo a família caía em cima da própria sintaxe — a variante verde saía com o chrome no matiz 150 e as strings no 124.

Agora cada família nomeia os seus matizes. As convenções são mantidas onde há espaço — string verde, função azul, número quente — e redecididas onde a família é dona daquele matiz:

| Família | Palavras-chave | O que se moveu para abrir espaço |
| --- | --- | --- |
| **Indigo** | rosa, como sempre foi | — o original |
| **Purple** | violeta | — |
| **Pink** | rosa-choque | — |
| **Red** | um coral claro | mantido longe do vermelho mais escuro e saturado em que um erro é desenhado |
| **Orange** | laranja | números são um vermelho quente e membros de enum rosados, do outro lado do zero do círculo em relação ao chrome |
| **Green** | verde | strings são verde-amareladas, interfaces trocam o lima pelo dourado — as variáveis ficam no matiz 152, onde uma string verde estaria |
| **Cyan** | ciano | os tipos cruzam para o jade, do outro lado das strings |
| **Blue** | pervinca | as funções vão para um azul-ciano, 43° longe do chrome; os tipos voltam ao verde-azulado |

### Palavras-chave na cor da própria família

A palavra-chave é a palavra mais forte do código, então é ela que diz qual tema é este. O Indigo escreve as suas no seu rosa; as outras sete escrevem as suas na própria cor, cada uma desenhada para a sua família (com luminosidade e croma próprios, via `redrawn`), e não emprestada de outro papel. São negrito itálico em todas as famílias e linguagens.

As palavras-chave só podem ir para o matiz da família se o que estava lá sair. Propriedades e operadores eram da cor da família por definição, e no matiz da palavra-chave ficavam a 2 a 7 ΔE dela — a mesma cor. Então, nas sete, as propriedades assumem o magenta ou violeta que as palavras-chave tinham, e os operadores viram um tom discreto da família, separado das variáveis pela luminosidade.

### Saturação e luminosidade por família

Cada família tem três multiplicadores de saturação — para os fundos, para a escada de texto e a sintaxe da família, e para as tintas. O croma do Indigo no matiz 27 deixa o fundo bordô; nos matizes âmbar, onde o sRGB é mais largo, um quase-preto tingido fica marrom. Red e Orange ficam abaixo de 1. Cyan e Green, onde o sRGB é mais estreito, ganham espaço para usar o que o matiz deles comporta. É isso que permite a duas variantes diferirem em saturação e intervalo, e não só no ponto onde o círculo foi girado.

A luminosidade percebida ainda não é tudo: um matiz saturado perto de 100 com `L` 0.73 parece cáqui, não verde-amarelo. Onde uma família move o matiz de um papel, a luminosidade do papel acompanha o movimento pela diferença entre onde aquele matiz fica no Indigo e onde a família o colocou — um papel que não se moveu não recebe nada. A correção só vale onde a cor é clara o bastante para ser lida como cor; aplicada aos fundos quase pretos, ela os deixava de um cinza amarronzado.

## Sinais são cores próprias

Erro e aviso não são tintas de sintaxe. Cada família põe um vermelho saturado abaixo da faixa da sintaxe e um amarelo saturado no topo dela, longe de cada tinta de código e do destaque, para que um squiggle nunca tenha a cor da palavra que sublinha. Sucesso, info e dica são as tintas verde, azul e verde-azulada da própria família, escolhidas por família e checadas para ficar a menos de 50° da cor que representam. O [design system](DESIGN-SYSTEM.pt-BR.md#sinais-um-significado-por-cor) diz onde cada um é usado.

## O que o build checa

O [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) se recusa a escrever os temas quando qualquer um destes deixa de valer, em qualquer família:

- **Separação.** Dois papéis que precisam ser distinguidos nunca ficam a menos de 22° de matiz. O build nomeia o par e a família. O Indigo é isento porque é anterior ao piso: seus membros de enum e números estão a 19.5° e diferem em luminosidade.
- **Legibilidade.** Cada tinta de código lê a 7:1 (WCAG AAA) no editor, e os parâmetros de tipo a 4.5:1. A escada de texto tem metas próprias; o cinza dos comentários fica abaixo de AA de propósito e nunca abaixo de 3:1. A auditoria completa, lida de volta dos arquivos de tema publicados, é o [`ACCESSIBILITY.pt-BR.md`](ACCESSIBILITY.pt-BR.md).
- **Ordem.** As superfícies e a escada de texto mantêm a ordem.
- **Só tokens.** Nenhuma cor chega a um tema a não ser que seja um token, ou um token em uma das nove opacidades nomeadas.
- **Sinais.** Erro e aviso ficam a pelo menos 7 ΔE de cada tinta de código e do destaque, e cada sinal a menos de 50° da cor de que leva o nome.

## O Indigo é mantido no que foi publicado

O [`tools/theme/indigo-baseline.json`](../tools/theme/indigo-baseline.json) é o Midnight Indigo exatamente como a v3.0.0 o publicou, fixado pelo SHA-256. O build garante que a variante Indigo ainda o reproduz byte a byte — cada cor do workbench, cada regra TextMate, cada regra semântica — para que a matemática das paletas possa mudar sem mover o tema que já está aberto no editor de alguém.

Quando um valor publicado precisa mudar, a baseline não é editada. A mudança é uma emenda em [`tools/theme/baseline.ts`](../tools/theme/baseline.ts): a chave, o que era, o que é, e por quê. O build recusa uma emenda cujo valor antigo não é o que o arquivo diz. Cores que a baseline nunca teve podem ser acrescentadas em volta dela. O [`INVENTORY.md`](INVENTORY.md#baseline-amendments) lista cada emenda com o motivo.

## Acrescentando uma família

Uma família é uma entrada em `VARIANTS` em [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts): um matiz, três multiplicadores de saturação, um destaque, onde as palavras-chave e as seis tintas semânticas ficam no círculo, onde ficam o erro e o aviso, e qual das suas tintas faz o sucesso, a info, a dica e as cores de gráfico restantes. Depois, o nome dela em `Family`, `FAMILY_ORDER`, `TITLE` e em `contributes.themes` no `package.json`. É mais de uma linha de propósito: as partes que têm identidade são as que valem ser decididas. O resto segue, e o build avisa se dois papéis ficaram perto demais, se uma tinta caiu abaixo da meta, ou se o manifesto e os temas discordam.
