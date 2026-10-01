# Design system

As regras que o tema segue, em todas as famílias e em todas as superfícies. [English version](DESIGN-SYSTEM.md).

O Midnight Indigo é um tema ultra-escuro para sessões longas. Tudo abaixo serve a um objetivo: o código é a coisa mais clara e mais colorida da tela, e tudo ao redor diz o que significa com o mínimo de cores possível. De onde as cores vêm é o [sistema de cores](COLOR-SYSTEM.pt-BR.md); esta página trata de para onde elas vão.

Cada regra aqui é imposta. O build do tema, o check de sintaxe e a auditoria de acessibilidade rodam no `npm run check` e falham quando uma deixa de valer — veja [Imposto, não descrito](#imposto-não-descrito).

## Tokens, não cores

O tema não é escrito em cores. É escrito em 68 tokens, cada um uma função — `surfaceRaised`, `muted`, `error` — com uma frase dizendo para que serve, em [`tools/theme/theme-tokens.ts`](../tools/theme/theme-tokens.ts). Cada cor do VS Code que o tema define é escrita contra um token; cada família dá aos tokens valores diferentes. O [`TOKENS.md`](TOKENS.md) é gerado a partir do código e lista cada token com o seu valor em cada família.

| Grupo | O que contém |
| --- | --- |
| `surface` | Os fundos, do mais escuro ao mais claro: editor, moldura, barra lateral, linha atual, widgets elevados, hover, foco, seleção, e as duas bordas. |
| `text` | A escada de texto: ghost, faint, muted, secondary, normal, bright, white. |
| `accent` | A cor do próprio tema, a sua forma discreta, e o branco que lê sobre ela. |
| `syntax` | As onze tintas em que o código é escrito. |
| `state` | O foco, o cursor, os sinais, e os tipos de mudança do Git. |
| `link`, `chart`, `ansi` | Links, as séries em que gráficos desenham, e as dezesseis cores do terminal. |

Uma cor translúcida é um token em uma de nove opacidades nomeadas — a escada de overlays, de `trace` (7%) a `heavy` (67%) — e nenhuma outra.

## Fundos e texto

O editor é o fundo mais escuro. O chrome em volta dele — moldura, barra lateral, painel, faixa de abas — é um degrau mais claro, para que a borda da janela se leia; o que flutua ou recebe entrada é mais um degrau acima. Hover, foco e seleção continuam a mesma escada, então um estado é um fundo, não uma cor nova.

O texto segue uma escada. O texto corrido é `normal`; `bright` marca a única coisa atual de uma lista; `secondary` é lido depois dele; `muted` é o que deve recuar — comentários, placeholders, abas inativas — e nunca cai abaixo de 3:1; `faint` é para olhar de relance, como os números de linha.

## Estados de interação

Hover, foco, pressionado, selecionado, desabilitado, proeminente e perigo seguem uma gramática em todos os controles, tabelada no [`TOKENS.md`](TOKENS.md#interaction-states):

- **Hover** é o degrau mais fraco acima do repouso. Nunca é uma borda e nunca é o destaque.
- **Seleção** é sempre mais forte que o hover, para que uma linha selecionada nunca seja confundida com a que está sob o ponteiro.
- **Foco** é o único estado desenhado como anel. É sólido, nunca translúcido, e lê a 3:1 em todas as superfícies.
- **Pressionado** é mais forte que o hover, e nunca igual ao selecionado nem a um toggle ligado.
- **Proeminente** — o botão primário, um badge — é o destaque como preenchimento, com texto branco a 4.5:1.
- **Desabilitado** é metade do que seria: mantém a forma e perde o peso.

O build mede cerca de trinta controles em cada família como as cores que eles realmente compõem sobre o próprio fundo, e falha quando dois estados que precisam ser distinguidos ficam a menos de 3 ΔE.

## Sinais: um significado por cor

Uma cor que significa algo significa isso em todo lugar — de um squiggle à view Problems, ao terminal, a um diff e ao grafo do Source Control.

| Significado | Token | Onde aparece |
| --- | --- | --- |
| Algo está errado | `error` — um vermelho próprio, abaixo da faixa da sintaxe | squiggles de erro, testes que falharam, o vermelho do terminal, uma linha removida ou um arquivo apagado |
| Algo para olhar | `warning` — um amarelo próprio, no topo da faixa | squiggles de aviso, o amarelo do terminal, um conflito de merge |
| Algo para saber | `info` — o azul da família | squiggles de info, uma linha ou arquivo modificado, uma thread de comentário aberta |
| Algo passou | `success` — o verde da família | testes que passaram, uma linha adicionada, um arquivo não rastreado ou em stage |
| Uma sugestão | `hint` — o verde-azulado da família | pontos de dica, a lâmpada |

Erro e aviso eram tintas de sintaxe emprestadas, então um squiggle podia ter a cor da palavra que sublinhava. Agora são cores que nenhum token de código usa, a pelo menos 7 ΔE de cada tinta e do destaque. Os três squiggles também diferem em luminosidade, então podem ser distinguidos sem o matiz.

- **Diff, merge e Git.** A cor é o tipo de mudança — verde adicionado, azul modificado, vermelho removido, âmbar em conflito — e a letra do Git ao lado do arquivo diz o resto. Uma linha alterada é uma camada leve do seu tipo; o texto que mudou nela fica sobre uma mais forte.
- **O terminal.** As dezesseis cores mantêm os nomes. Vermelho é o erro e amarelo o aviso, então um build que falhou imprime na cor em que o editor marca um erro; o preto claro é o cinza dos comentários a 3:1, e cada uma das outras cores, menos o preto, lê a 4.5:1 no terminal, para que a correção de contraste mínimo do VS Code nunca precise repintar nenhuma.
- **Depuração e testes.** O frame da pilha pausado e o selecionado têm cada um o seu glifo, além de uma cor; código não coberto é uma faixa mais pesada que código coberto.

## A IA é o destaque, e só onde age

Chat, inline chat, edições sugeridas e a janela de Agents usam o destaque do próprio tema — índigo no Midnight Indigo, a cor de cada família nas outras — e só onde a IA fala ou age: o avatar, o comando com que um pedido se dirige a ela, a borda que corre enquanto ela trabalha, uma sessão em andamento, a sugestão dela na margem. Nunca é uma cor reservada só para a IA, e nunca um bloco saturado. O que você escreveu é um balão neutro; o que um agente mudou é o tipo de mudança que é, nas cores do Git.

## O código, e o que fica sobre ele

O código é escrito em onze tintas — veja o [`SYNTAX.md`](SYNTAX.md) para cada escopo e token semântico, linguagem por linguagem. Três regras valem em todo lugar:

- **Palavras-chave são negrito itálico**, em todas as famílias e linguagens: são a assinatura do tema, e a forma delas é uma pista que não depende de cor.
- **Operadores são só cor**, nunca negrito nem itálico. A pontuação tem a cor da palavra-chave, sem estilo.
- **Declarações em negrito, usos sem.** Uma função é negrito onde é declarada e normal onde é chamada; um tipo é negrito. Membros estáticos são itálicos.

O semantic highlighting vem ligado por padrão, então um nome é colorido pelo que o language server diz que ele é, e não pela aparência. As regras cobrem os tokens que TypeScript, Roslyn (C#), Pylance, rust-analyzer, gopls e o servidor Java enviam, e cada um é desenhado como o seu escopo TextMate — uma palavra tem a mesma cor com o semantic highlighting ligado ou desligado.

O que o editor desenha sobre o código é uma camada mais quieta abaixo dele:

- **Texto auxiliar recua.** Inlay hints, CodeLens e ghost text são o cinza dos comentários — legíveis a 3:1, nunca tão fortes quanto o texto corrido.
- **Ícones de símbolo são as cores da sintaxe.** Uma classe tem a cor de classe na lista de sugestões, no outline, nos breadcrumbs e no seletor de símbolos.
- **Destaques atrás do código mantêm o código legível.** A seleção, os resultados da busca, a palavra sob o cursor e qualquer outro intervalo pintado atrás do código aparecem contra o editor e mantêm cada tinta de código a 4.5:1 por cima.

## Legibilidade

O tema define metas próprias e mantém cada família nelas: 7:1 para código, 4.5:1 para os demais textos, 3:1 para o que deve recuar e para squiggles, anéis de foco e ícones. Pistas que não dependem de cor — palavras-chave em negrito itálico, nomes obsoletos riscados, o anel de foco sólido, squiggles separados em luminosidade — também são checadas, e cada sinal que se distingue pelo matiz é simulado sob protanopia, deuteranopia e tritanopia. O [`ACCESSIBILITY.pt-BR.md`](ACCESSIBILITY.pt-BR.md) tem as medições.

## O que o tema deixa para o VS Code

O tema define 871 das 971 cores que o VS Code documenta. As demais ficam com o VS Code de propósito — na maioria bordas e fundos cujo padrão é nada, e cores de texto que repintariam o código dentro de um destaque — e o [`INVENTORY.md`](INVENTORY.md) lista cada uma com o motivo.

## Imposto, não descrito

| Regra | Mantida por |
| --- | --- |
| Tokens, ordem, contraste, separação, estados, sinais, Git, terminal, chat | [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) — o build não escreve nada se uma falhar |
| Cada escopo e token semântico no seu papel, palavras-chave em negrito itálico | [`tools/syntax/check-syntax.ts`](../tools/syntax/check-syntax.ts), num corpus de código real nas oito famílias |
| Cada par na sua meta, pistas que não são cor, visão de cor | [`tools/theme/check-accessibility.ts`](../tools/theme/check-accessibility.ts) |
| Nada visível muda sem ser visto | [`tools/regression/`](../tools/regression/) — snapshots no `npm run check`, e o VS Code real no `npm run regression`; veja o [`REGRESSION.pt-BR.md`](REGRESSION.pt-BR.md) |

Como rodá-los está no [`DEVELOPMENT.pt-BR.md`](DEVELOPMENT.pt-BR.md).
