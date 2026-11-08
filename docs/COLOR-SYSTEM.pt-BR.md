# Sistema de cores

Como as oito paletas são feitas. [English version](COLOR-SYSTEM.md).

O Midnight Indigo é um tema em oito cores: Indigo, Purple, Pink, Red, Orange, Green, Cyan e Blue. Elas compartilham uma estrutura — os mesmos [tokens](TOKENS.md), as mesmas regras, o mesmo piso de legibilidade — e cada uma é desenhada para o seu próprio matiz, em vez de girada a partir de outra. As oito estão escritas em [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts); o valor de cada token em cada família está tabelado no [`TOKENS.md`](TOKENS.md).

Como as cores são *usadas* — qual token vai onde e por quê — é o [design system](DESIGN-SYSTEM.pt-BR.md). Esta página trata de onde as cores vêm.

## O fundo

O editor fica em `#020108` no Indigo: quase preto, com o tom da família, nunca preto puro. Cada família tem o seu quase-preto, todos praticamente na mesma luminosidade — `#000305` no Cyan, `#040201` no Orange — para que as cores de destaque fiquem saturadas sem ofuscar, e a janela tenha a cor do tema mesmo onde nada está desenhado.

Acima do fundo há uma escada de superfícies — moldura, barra lateral, linha atual, widgets elevados, hover, foco, seleção — cada uma um degrau mais clara que a de baixo. O build falha se a escada de qualquer família andar para trás.

## Construído em OKLCH

Cada cor é calculada em [OKLCH](https://bottosson.github.io/posts/oklab/), cujo `L` é luminosidade percebida. O `L` do HSL não é: é o ponto médio entre o maior e o menor canal, então o matiz 60 e o matiz 240 com o mesmo `S` e `L` são um farol e um hematoma. Oito paletas só podem ser mantidas nas mesmas metas se uma luminosidade significar a mesma coisa nos oito matizes.

O croma é escrito como número absoluto, e não como fração do que cada matiz comporta. O croma do OKLCH já é perceptualmente comparável, e normalizá-lo pelo gamut sRGB desfaz isso: testado, produziu palavras-chave `#FF53F7` na variante vermelha. O gamut só entra como teto ([abaixo](#contraste-resolvido-croma-com-teto-separação-buscada)).

## O Indigo é uma medição; as sete são desenhadas

O Indigo é o original, e a paleta dele é uma medição dele. Medidas em OKLCH, 30 das suas 39 cores originais ficam dentro de uma faixa de 19 graus em torno do matiz 290 — os fundos, as bordas, a seleção, a escada de texto, e as variáveis, propriedades, operadores e comentários, um matiz visto em trinta luminosidades — e o resto são as cores com identidade própria: o destaque, as palavras-chave e seu parceiro escuro, e as seis tintas semânticas. Essa tabela de papéis, `ROLES`, constrói o Indigo e mais nada.

As outras sete não tiram nada dela. Cada uma é desenhada do zero: o seu próprio fundo e escada de superfícies, a sua escada de texto, as suas onze tintas de sintaxe, o seu destaque e os seus sinais, cada papel em luminosidade, croma e matiz absolutos. Não há multiplicador, nem deslocamento a partir do Indigo, nem correção aplicada depois — os números no arquivo são a paleta.

## Uma família é um desenho, não uma rotação

Um gerador antigo movia todas as cores pelo mesmo ângulo, que é o que `hue-rotate()` faz: toda variante tinha as mesmas colunas de luminosidade e croma do Indigo, e do outro lado do círculo a família caía em cima da própria sintaxe — a variante verde saía com o chrome no matiz 150 e as strings no 124. O sucessor dele nomeava por família os matizes das cores que têm identidade, mas ainda construía todos os outros números a partir das medições do Indigo, e isso aparecia: nas sete, as duas tintas de sintaxe mais próximas ficavam a 5,9 a 7,6 ΔE uma da outra — perto o bastante para confundir.

Agora cada família parte de um conceito, e as tintas são colocadas para ele. As convenções são mantidas onde há espaço — string verde, função azul, número quente — e redecididas onde a família é dona daquele matiz:

| Família | Conceito | Palavras-chave | A decisão principal | Tintas mais próximas, antes → agora |
| --- | --- | --- | --- | --- |
| **Indigo** | o original | rosa, como sempre foi | — mantido no que foi publicado | — |
| **Purple** | Ametista | violeta, o único roxo saturado do código | propriedades em orquídea e parâmetros de tipo em ameixa escura; tipos em ciano em vez de turquesa, longe das strings menta | 7,6 → 13,7 ΔE |
| **Pink** | Flor neon | rosa-choque, a pétala | propriedades em lilás e parâmetros de tipo em violeta escuro; strings verde-folha e tipos em água; números damasco e membros de enum salmão, separados pela luminosidade | 7,3 → 12,4 ΔE |
| **Red** | Brasa | carmim-rosado, a metade quente da brasa | o erro é a metade escarlate, mais adiante no círculo, mais escura e mais saturada; propriedades em orquídea e parâmetros de tipo em magenta escuro; números âmbar e membros de enum laranja, separados pela luminosidade; strings verdes e tipos petróleo | 6,4 → 12,4 ΔE |
| **Orange** | Crepúsculo | laranja, o sol no horizonte | números no rosa do céu e membros de enum em coral, do outro lado do zero do círculo em relação à keyword; parâmetros de tipo em índigo e propriedades em lavanda, a noite chegando; strings verdes, funções azul-céu e tipos em água | 6,3 → 14,6 ΔE |
| **Green** | Floresta | esmeralda, a copa | a keyword é dona do verde, então as strings saem dele para o trigo, que é também o laranja dos gráficos; números em coral e membros de enum em rosa-orquídea; propriedades em violeta e parâmetros de tipo em uva escura, o complemento do verde; tipos turquesa, um azul limpo nas funções, interfaces lima | 7,0 → 14,5 ΔE |
| **Cyan** | Abissal | ciano, a superfície do mar | tipos em jade, longe o bastante para serem verdes e não um segundo ciano, e strings em alga, separadas deles pela luminosidade; funções em azul profundo; números em coral, membros de enum em rosa-concha e interfaces em areia, que são também o laranja dos gráficos; propriedades em orquídea e parâmetros de tipo em magenta mais escuro | 6,2 → 12,0 ΔE |
| **Blue** | Cobalto | cobalto, o pigmento | funções em ciano-gelo acima da keyword, que são também o ciano do terminal; tipos verde-mar e strings menta, separados pela luminosidade; números terracota, membros de enum rosa e interfaces palha como contraponto quente; propriedades em violeta e parâmetros de tipo em magenta escuro; o erro puxa para o vermelhão e fica um pouco mais escuro, 0,05 abaixo da keyword que desenha o squiggle de info | 5,9 → 12,6 ΔE |

### Palavras-chave na cor da própria família

A palavra-chave é a palavra mais forte do código, então é ela que diz qual tema é este. O Indigo escreve as suas no seu rosa; as outras sete escrevem as suas na própria cor, numa luminosidade e num croma que fazem aquele matiz parecer ele mesmo em negrito itálico. São negrito itálico em todas as famílias e linguagens.

Isso só funciona se nada mais no código estiver perto do matiz da família. No Indigo, as propriedades e os operadores têm a cor da família; nas sete, as propriedades são um violeta, orquídea ou lilás longe da keyword, e os operadores são um quase-cinza do fundo, separados das variáveis pela luminosidade.

### Contraste resolvido, croma com teto, separação buscada

Os números de uma família começam como um brief: o matiz dos fundos e a luminosidade e o croma de cada degrau da escada, o matiz e o croma do texto, onde cada tinta de sintaxe começa, o destaque, e o erro e o aviso. Cada número de um brief é uma decisão. O [`tools/theme/design-families.ts`](../tools/theme/design-families.ts) os completa de três jeitos:

- **O contraste é resolvido, não esperado.** Uma cor que precisa ser lida sobre um fundo é clareada até ser: as tintas e o texto do corpo a 7:1 no fundo, os parâmetros de tipo e o texto secundário a 4.5:1, o texto apagado e o esmaecido a 3:1. O destaque é escurecido até o branco ser lido sobre ele a 4.5:1, porque o rótulo de um botão é texto.
- **O croma tem teto.** Nenhuma tinta usa mais de 86% do croma que o sRGB comporta na sua luminosidade e matiz: o último trecho antes da borda do gamut é onde a cor deixa de ser saturada e vira neon.
- **A separação é buscada.** Uma busca local move uma tinta por vez — luminosidade, croma ou matiz, cada um dentro de limites definidos por papel — e mantém todo movimento que não piora a paleta. Pior é medido em ΔE OKLab entre as onze tintas, porque distância em matiz não diz nada sobre duas tintas separadas pela luminosidade, que é como metade delas são. Uma tinta mais forte que a keyword custa, e uma tinta perto demais do erro ou do aviso também. A busca roda a partir de sementes fixas, então o mesmo brief sempre dá a mesma paleta.

A saturação que uma família aguenta faz parte do brief dela, e não é uma regra aplicada às oito. O sRGB comporta muito mais croma nos matizes quentes que nos frios na mesma luminosidade: o croma do Indigo no matiz 27 deixa um fundo bordô, e nos matizes âmbar um quase-preto tingido fica marrom. Por isso Red e Orange têm fundos discretos (croma 0,018 e 0,011), e Purple e Blue, onde o sRGB comporta mais naquela luminosidade, têm veludo (0,029 e 0,035).

## Sinais são cores próprias

Erro e aviso não são tintas de sintaxe. Cada família põe um vermelho saturado mais escuro que todas as tintas de código menos os parâmetros de tipo, e um amarelo saturado entre as mais claras, longe de cada tinta de código e do destaque, para que um squiggle nunca tenha a cor da palavra que sublinha. Sucesso, info e dica emprestam cada um uma das tintas da própria família — em geral as strings, as funções e os tipos, mas onde a família é dona daquela cor a keyword faz o papel: o sucesso do Green, a dica do Cyan e a info do Blue são as keywords deles. Cada empréstimo é checado para ficar a menos de 50° da cor que representa. O [design system](DESIGN-SYSTEM.pt-BR.md#sinais-um-significado-por-cor) diz onde cada um é usado.

## O que o build checa

O [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) se recusa a escrever os temas quando qualquer um destes deixa de valer, em qualquer família:

- **Separação.** Nas sete, duas das onze tintas de sintaxe nunca ficam a menos de 12 ΔE em OKLab. O build nomeia o par e a família. O Indigo é isento porque é anterior ao piso e é mantido no que foi publicado: seus membros de enum e números estão a 19.5° e diferem em luminosidade.
- **Teto de gamut.** Nas sete, nenhuma tinta de sintaxe usa mais de 86% do croma que o sRGB comporta na sua luminosidade e matiz. O build mede o hex e admite dois pontos pelo que o arredondamento para 8 bits acrescenta.
- **A keyword lidera.** Nas sete, nenhuma tinta além dos parâmetros de tipo tem mais croma que a keyword, por mais de 0.01: a keyword é a assinatura da família.
- **Legibilidade.** Cada tinta de código lê a 7:1 (WCAG AAA) no editor, e os parâmetros de tipo a 4.5:1. A escada de texto tem metas próprias; o cinza dos comentários fica abaixo de AA de propósito e nunca abaixo de 3:1. O branco sobre o destaque lê a 4.5:1. A auditoria completa, lida de volta dos arquivos de tema publicados, é o [`ACCESSIBILITY.pt-BR.md`](ACCESSIBILITY.pt-BR.md).
- **Ordem.** As superfícies e a escada de texto mantêm a ordem.
- **Só tokens.** Nenhuma cor chega a um tema a não ser que seja um token, ou um token em uma das nove opacidades nomeadas.
- **Sinais.** Erro e aviso ficam a pelo menos 7 ΔE de cada tinta de código e do destaque, e cada sinal a menos de 50° da cor de que leva o nome. Erro, aviso e info, os três squiggles, ficam a 20 ΔE um do outro e diferem em pelo menos 0.05 de luminosidade, então são três pesos mesmo para quem não distingue os matizes.

## O Indigo é mantido no que foi publicado

O [`tools/theme/indigo-baseline.json`](../tools/theme/indigo-baseline.json) é o Midnight Indigo exatamente como a v3.0.0 o publicou, fixado pelo SHA-256. O build garante que a variante Indigo ainda o reproduz byte a byte — cada cor do workbench, cada regra TextMate, cada regra semântica — para que a matemática das paletas possa mudar sem mover o tema que já está aberto no editor de alguém.

Quando um valor publicado precisa mudar, a baseline não é editada. A mudança é uma emenda em [`tools/theme/baseline.ts`](../tools/theme/baseline.ts): a chave, o que era, o que é, e por quê. O build recusa uma emenda cujo valor antigo não é o que o arquivo diz. Cores que a baseline nunca teve podem ser acrescentadas em volta dela. O [`INVENTORY.md`](INVENTORY.md#baseline-amendments) lista cada emenda com o motivo.

## Acrescentando uma família

1. **Escreva o brief.** Uma entrada em `BRIEFS` no [`tools/theme/design-families.ts`](../tools/theme/design-families.ts), com um comentário dizendo o que a família é: o matiz do fundo e cada degrau da escada, o matiz e o croma do texto, onde cada tinta começa, o destaque, o erro e o aviso.
2. **Rascunhe.** `npm run design:families -- --family=<nome>` imprime as medições, os 68 tokens e o design como literal, com a tinta que propõe para sucesso, info, dica e as cores de gráfico restantes. Não escreve nada.
3. **Congele.** Leia, julgue e cole o literal em `DESIGNS` no [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts) como foi impresso. O build lê os números e nunca roda a busca, então nada move uma família sem uma mudança na própria entrada dela.
4. **Dê o nome.** O nome dela em `Family`, `FAMILY_ORDER`, `TITLE` e em `contributes.themes` no `package.json`.

É mais de uma linha de propósito: as partes que têm identidade são as que valem ser decididas. O build avisa se duas tintas ficaram perto demais, se uma caiu abaixo da meta ou passou do teto de gamut, ou se o manifesto e os temas discordam.
