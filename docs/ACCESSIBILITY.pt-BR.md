# Acessibilidade

> Gerado por `npm run audit:accessibility` a partir dos oito arquivos de tema, e mantido por `npm run check`. Não edite à mão. [English version](ACCESSIBILITY.md).

O Midnight Indigo é um tema ultra-escuro feito para sessões longas. Esta página mede cada par pelo qual o tema responde, nas oito variantes, contra metas que são do próprio tema e são impostas: uma variante que perde uma não passa no check.

## Metas

| Meta |  |
| --- | --- |
| **corpo 7:1** | O código, e o texto no meio dele: WCAG AAA. Lido por horas, então a meta mais alta. |
| **texto 4.5:1** | Qualquer outro texto — menus, botões, terminal, chat — e os parâmetros de tipo: WCAG AA. |
| **auxiliar 3:1** | Texto feito para recuar: comentários, CodeLens, inlay hints, placeholders, números de linha. Legível, sem competir com o código. |
| **componente 3:1** | O que é visto e não lido: um squiggle, um anel de foco, um ícone. WCAG 1.4.11. |
| **isento** | Controles desabilitados e espaços renderizados, que a WCAG deixa de fora de propósito. Medidos aqui, não impostos. |

## Contraste

Cada razão é medida como o VS Code pinta: um overlay é composto sobre o que está por baixo antes, já que uma cor translúcida não tem contraste próprio. Onde uma linha de código aponta a pior tinta, é a que tem menos folga naquela variante.

| Área | Par | Meta | Indigo | Purple | Pink | Red | Orange | Green | Cyan | Blue |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Código | Toda tinta exceto comentários e parâmetros de tipo (a pior): `normal`, `property` | corpo 7:1 | 7.1 | 7.0 | 7.1 | 7.5 | 9.1 | 8.1 | 7.4 | 7.2 |
| Código | O mesmo, sob uma seleção: `normal`, `property` | texto 4.5:1 | 5.4 | 5.3 | 5.3 | 5.6 | 6.7 | 5.8 | 5.3 | 5.3 |
| Código | Parâmetros de tipo (generics) | texto 4.5:1 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 | 4.5 |
| Código | Parâmetros de tipo, sob uma seleção | auxiliar 3:1 | 3.4 | 3.4 | 3.4 | 3.4 | 3.3 | 3.2 | 3.2 | 3.3 |
| Código | Comentários | auxiliar 3:1 | 4.0 | 4.0 | 4.0 | 4.0 | 4.4 | 4.2 | 4.2 | 4.1 |
| Código | Comentários, sob uma seleção | auxiliar 3:1 | 3.0 | 3.0 | 3.0 | 3.0 | 3.3 | 3.0 | 3.0 | 3.0 |
| Foreground principal | `editor.foreground` no editor | corpo 7:1 | 7.1 | 7.0 | 7.1 | 7.5 | 9.1 | 8.1 | 7.4 | 7.2 |
| Foreground principal | `foreground` no editor | corpo 7:1 | 7.1 | 7.0 | 7.1 | 7.5 | 9.1 | 8.1 | 7.4 | 7.2 |
| Foreground principal | `foreground` na side bar | texto 4.5:1 | 7.1 | 7.0 | 7.0 | 7.5 | 9.0 | 8.1 | 7.4 | 7.2 |
| Foreground secundário | `sideBar.foreground` | texto 4.5:1 | 5.9 | 5.9 | 5.8 | 6.2 | 7.6 | 6.7 | 6.1 | 6.0 |
| Foreground secundário | `descriptionForeground` num widget | texto 4.5:1 | 5.7 | 5.7 | 5.7 | 6.0 | 7.3 | 6.5 | 5.9 | 5.8 |
| CodeLens | No editor | auxiliar 3:1 | 4.0 | 4.0 | 4.0 | 4.0 | 4.4 | 4.2 | 4.2 | 4.1 |
| Inlay hints | No seu chip | auxiliar 3:1 | 3.8 | 3.8 | 3.8 | 3.8 | 4.2 | 4.0 | 4.0 | 3.9 |
| Inlay hints | No seu chip, na linha atual | auxiliar 3:1 | 3.7 | 3.7 | 3.7 | 3.7 | 4.1 | 3.9 | 3.9 | 3.8 |
| Diagnósticos | `editorError.foreground` (squiggle) | componente 3:1 | 6.0 | 6.2 | 6.1 | 6.1 | 6.0 | 6.0 | 6.0 | 6.1 |
| Diagnósticos | `editorWarning.foreground` (squiggle) | componente 3:1 | 12.3 | 12.2 | 12.4 | 12.4 | 12.3 | 12.1 | 12.3 | 11.9 |
| Diagnósticos | `editorInfo.foreground` (squiggle) | componente 3:1 | 9.3 | 9.2 | 9.4 | 9.2 | 9.3 | 9.2 | 9.1 | 9.6 |
| Diagnósticos | `editorHint.foreground` (squiggle) | componente 3:1 | 12.1 | 12.0 | 12.1 | 12.0 | 12.1 | 12.1 | 12.5 | 12.1 |
| Diagnósticos | `list.errorForeground` (nome de arquivo) | texto 4.5:1 | 6.0 | 6.2 | 6.0 | 6.1 | 6.0 | 6.0 | 5.9 | 6.0 |
| Diagnósticos | `list.warningForeground` (nome de arquivo) | texto 4.5:1 | 12.2 | 12.1 | 12.3 | 12.3 | 12.2 | 12.0 | 12.3 | 11.8 |
| Terminal | `terminal.foreground` | corpo 7:1 | 7.1 | 7.0 | 7.1 | 7.5 | 9.1 | 8.1 | 7.4 | 7.2 |
| Terminal | ANSI Red | texto 4.5:1 | 6.0 | 6.2 | 6.1 | 6.1 | 6.0 | 6.0 | 6.0 | 6.1 |
| Terminal | ANSI Green | texto 4.5:1 | 11.7 | 11.9 | 11.1 | 10.9 | 11.6 | 13.1 | 12.6 | 11.8 |
| Terminal | ANSI Yellow | texto 4.5:1 | 12.3 | 12.2 | 12.4 | 12.4 | 12.3 | 12.1 | 12.3 | 11.9 |
| Terminal | ANSI Blue | texto 4.5:1 | 9.3 | 9.2 | 9.4 | 9.2 | 9.3 | 9.2 | 9.1 | 9.6 |
| Terminal | ANSI Magenta | texto 4.5:1 | 8.0 | 8.4 | 8.3 | 8.9 | 9.1 | 8.8 | 8.7 | 8.9 |
| Terminal | ANSI Cyan | texto 4.5:1 | 12.1 | 12.0 | 12.1 | 12.0 | 12.1 | 12.1 | 12.5 | 12.1 |
| Terminal | ANSI White | texto 4.5:1 | 7.1 | 7.0 | 7.1 | 7.5 | 9.1 | 8.1 | 7.4 | 7.2 |
| Terminal | ANSI BrightRed | texto 4.5:1 | 9.1 | 9.3 | 9.1 | 9.2 | 9.1 | 9.1 | 9.0 | 9.2 |
| Terminal | ANSI BrightGreen | texto 4.5:1 | 14.4 | 14.9 | 13.8 | 13.5 | 14.4 | 16.2 | 15.5 | 14.6 |
| Terminal | ANSI BrightYellow | texto 4.5:1 | 15.9 | 15.9 | 16.1 | 16.0 | 15.9 | 15.7 | 16.0 | 15.5 |
| Terminal | ANSI BrightBlue | texto 4.5:1 | 12.0 | 11.9 | 12.1 | 12.0 | 12.0 | 12.0 | 11.9 | 12.3 |
| Terminal | ANSI BrightMagenta | texto 4.5:1 | 10.0 | 10.2 | 10.1 | 11.4 | 11.5 | 11.4 | 11.2 | 11.4 |
| Terminal | ANSI BrightCyan | texto 4.5:1 | 15.2 | 15.1 | 15.2 | 15.1 | 15.2 | 15.2 | 15.6 | 15.3 |
| Terminal | ANSI BrightWhite | texto 4.5:1 | 17.5 | 17.4 | 17.5 | 18.7 | 20.2 | 18.8 | 17.6 | 17.5 |
| Terminal | ANSI BrightBlack (saída esmaecida) | auxiliar 3:1 | 4.0 | 4.0 | 4.0 | 4.0 | 4.4 | 4.2 | 4.2 | 4.1 |
| Terminal | Texto sob uma seleção | texto 4.5:1 | 5.4 | 5.3 | 5.3 | 5.6 | 6.7 | 5.8 | 5.3 | 5.3 |
| Chat | Um pedido, no seu balão | texto 4.5:1 | 6.7 | 6.6 | 6.6 | 7.0 | 8.5 | 7.5 | 6.9 | 6.8 |
| Chat | Um slash command, num pedido | texto 4.5:1 | 7.0 | 7.0 | 7.0 | 7.4 | 8.7 | 7.7 | 7.1 | 7.0 |
| Chat | Chat inline | texto 4.5:1 | 6.8 | 6.8 | 6.8 | 7.2 | 8.7 | 7.7 | 7.1 | 6.9 |
| Chat | Placeholder do chat inline | auxiliar 3:1 | 3.8 | 3.8 | 3.8 | 3.9 | 4.2 | 4.0 | 4.0 | 3.9 |
| Agents | O painel Agents | texto 4.5:1 | 5.9 | 5.9 | 5.8 | 6.2 | 7.6 | 6.7 | 6.1 | 6.0 |
| Agents | A sessão ativa | texto 4.5:1 | 7.1 | 7.0 | 7.0 | 7.5 | 9.0 | 8.1 | 7.4 | 7.2 |
| Agents | Uma sessão inativa | texto 4.5:1 | 6.0 | 5.9 | 5.9 | 6.3 | 7.7 | 6.8 | 6.2 | 6.0 |
| Agents | O input do chat | texto 4.5:1 | 6.8 | 6.8 | 6.8 | 7.2 | 8.7 | 7.7 | 7.1 | 6.9 |
| Agents | O placeholder do input | auxiliar 3:1 | 3.8 | 3.8 | 3.8 | 3.9 | 4.2 | 4.0 | 4.0 | 3.9 |
| Botões | Primário | texto 4.5:1 | 4.9 | 5.0 | 4.9 | 4.8 | 4.6 | 4.6 | 4.6 | 4.6 |
| Botões | Primário, sob o ponteiro | texto 4.5:1 | 10.3 | 10.5 | 10.3 | 10.3 | 9.9 | 9.8 | 9.9 | 10.0 |
| Botões | Secundário | texto 4.5:1 | 7.5 | 7.5 | 7.4 | 7.9 | 9.4 | 8.1 | 7.5 | 7.5 |
| Botões | Um checkbox | texto 4.5:1 | 6.8 | 6.8 | 6.8 | 7.2 | 8.7 | 7.7 | 7.1 | 6.9 |
| Seleções | Texto na seleção do editor | texto 4.5:1 | 5.4 | 5.3 | 5.3 | 5.6 | 6.7 | 5.8 | 5.3 | 5.3 |
| Seleções | A linha selecionada de uma lista | texto 4.5:1 | 8.0 | 8.0 | 8.0 | 8.5 | 10.1 | 8.9 | 8.2 | 8.1 |
| Seleções | O item selecionado de um menu | texto 4.5:1 | 7.5 | 7.5 | 7.4 | 7.9 | 9.4 | 8.1 | 7.5 | 7.5 |
| Foco | O anel, sobre o editor | componente 3:1 | 4.3 | 4.1 | 4.3 | 4.4 | 4.6 | 4.5 | 4.5 | 4.5 |
| Foco | O anel, sobre a side bar | componente 3:1 | 4.2 | 4.1 | 4.2 | 4.3 | 4.5 | 4.5 | 4.5 | 4.5 |
| Foco | O anel, sobre a activity bar | componente 3:1 | 4.3 | 4.1 | 4.3 | 4.3 | 4.5 | 4.5 | 4.5 | 4.5 |
| Foco | O anel, sobre a status bar | componente 3:1 | 4.1 | 4.0 | 4.1 | 4.2 | 4.4 | 4.3 | 4.3 | 4.3 |
| Foco | O anel, sobre um widget | componente 3:1 | 4.1 | 4.0 | 4.1 | 4.2 | 4.4 | 4.3 | 4.3 | 4.3 |
| Foco | O anel, sobre um input | componente 3:1 | 4.1 | 4.0 | 4.1 | 4.2 | 4.4 | 4.3 | 4.3 | 4.3 |
| Foco | A linha focada de uma lista | componente 3:1 | 4.2 | 4.1 | 4.2 | 4.3 | 4.5 | 4.5 | 4.5 | 4.5 |
| Números de linha | Um número de linha | auxiliar 3:1 | 3.1 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.1 |
| Números de linha | O número da linha do cursor | texto 4.5:1 | 8.7 | 8.6 | 8.6 | 9.5 | 11.5 | 9.8 | 9.2 | 8.8 |
| Ícones | Um ícone inativo da activity bar | componente 3:1 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 | 3.0 |
| Placeholders | Num input | auxiliar 3:1 | 3.8 | 3.8 | 3.8 | 3.9 | 4.2 | 4.0 | 4.0 | 3.9 |
| Placeholders | Num editor vazio | auxiliar 3:1 | 4.0 | 4.0 | 4.0 | 4.0 | 4.4 | 4.2 | 4.2 | 4.1 |
| Placeholders | Ghost text (uma sugestão) | auxiliar 3:1 | 4.0 | 4.0 | 4.0 | 4.0 | 4.4 | 4.2 | 4.2 | 4.1 |
| Desabilitado | `disabledForeground` | isento | 2.5 | 2.4 | 2.4 | 2.5 | 2.9 | 2.7 | 2.5 | 2.5 |
| Desabilitado | Espaços renderizados | isento | 1.4 | 1.4 | 1.4 | 1.4 | 1.4 | 1.5 | 1.5 | 1.4 |
| Status bar | Um item | texto 4.5:1 | 5.7 | 5.7 | 5.7 | 6.0 | 7.3 | 6.5 | 5.9 | 5.8 |
| Status bar | Durante o debug | texto 4.5:1 | 5.0 | 4.9 | 5.0 | 5.2 | 5.5 | 5.3 | 4.9 | 5.0 |
| Status bar | Um item de erro | texto 4.5:1 | 10.8 | 10.4 | 10.5 | 11.2 | 12.2 | 11.8 | 11.1 | 11.0 |
| Status bar | Um item de aviso | texto 4.5:1 | 7.8 | 7.7 | 7.7 | 8.2 | 8.8 | 8.2 | 7.7 | 7.9 |

## Sem cor

Nada crítico depende de enxergar um matiz. Isto vale em todas as variantes, e o check falha se deixar de valer:

- Keywords são bold italic, então o papel mais frequente também se distingue pela forma das letras.
- Um nome obsoleto é riscado: `*.deprecated` vindo do servidor de linguagem, `invalid.deprecated` da gramática. O VS Code risca sozinho o nome que um diagnóstico marca como obsoleto (TypeScript, C#).
- O foco é um anel sólido (`focusBorder`, `list.focusOutline`), nunca um tom translúcido que possa sumir no que está por baixo.
- Uma seleção muda a superfície: as seleções do editor, das listas e do terminal ficam a pelo menos 3 ΔE do fundo.
- Erro, aviso e info diferem em luminosidade além do matiz (pelo menos 0,05 no L do OKLCH), então se separam numa tela em tons de cinza.

### Visão de cor

Os sinais que diferem pelo matiz, simulados para as três deficiências mais comuns (Machado et al., 2009, severidade total) e medidos em ΔE OKLab × 100 — cerca de 2 é a menor diferença que alguém nota lado a lado. Um par sem outra pista é mantido em 10; um par que o VS Code também distingue por forma ou letra, em 3. Cada célula é a pior das oito variantes.

| Sinais | Outra pista | Normal | Protanopia | Deuteranopia | Tritanopia |
| --- | --- | ---: | ---: | ---: | ---: |
| `editorError.foreground` / `editorWarning.foreground` | nenhuma — só cor | 25 | 25 | 17 | 23 |
| `editorError.foreground` / `editorInfo.foreground` | nenhuma — só cor | 32 | 26 | 20 | 38 |
| `editorWarning.foreground` / `editorInfo.foreground` | nenhuma — só cor | 29 | 22 | 27 | 18 |
| `editorError.foreground` / `editorHint.foreground` | hints são pontos, não squiggle | 34 | 30 | 16 | 41 |
| `gitDecoration.addedResourceForeground` / `gitDecoration.deletedResourceForeground` | as letras A e D; a remoção é riscada | 30 | 26 | 13 | 34 |
| `gitDecoration.addedResourceForeground` / `gitDecoration.modifiedResourceForeground` | as letras A/U e M | 14 | 13 | 14 | 4 |
| `gitDecoration.modifiedResourceForeground` / `gitDecoration.deletedResourceForeground` | as letras M e D | 32 | 26 | 20 | 38 |
| `gitDecoration.conflictingResourceForeground` / `gitDecoration.addedResourceForeground` | a letra C / ! | 9 | 8 | 8 | 8 |
| `editorGutter.addedBackground` / `editorGutter.modifiedBackground` | a barra de modificação é hachurada | 14 | 13 | 14 | 4 |
| `editorGutter.addedBackground` / `editorGutter.deletedBackground` | a remoção é um triângulo | 30 | 26 | 13 | 34 |
| `testing.iconPassed` / `testing.iconFailed` | um tique e um xis | 30 | 26 | 13 | 34 |

## Ambientes

Uma tela com metade do brilho, modelada como o dobro do reflexo que a WCAG assume (o código explica por que é um modelo e não uma medição). Os pares com menos folga:

| Par | Cheio | Metade |
| --- | ---: | ---: |
| Texto no editor | 7.0 | 4.0 |
| Comentários no editor | 4.0 | 2.5 |
| Parâmetros de tipo no editor | 4.5 | 2.8 |
| Números de linha | 3.0 | 2.0 |

Em OLED, o fundo do editor nunca é `#000000`, mas o seu canal mais claro fica poucos passos acima de zero, então quase tudo fica perto de apagado: a rolagem rápida pode borrar ali, como em qualquer tema ultra-escuro. Isso é a identidade, não um defeito que esta auditoria tenta corrigir. O que um painel com pouco brilho também pode esmagar é um fundo quase preto que precisa ser visto contra o editor; cada um aparece aqui pela sua distância do editor em ΔE:

|  | Fundo | Canal mais claro | `editor.lineHighlightBackground` | `editorWidget.background` | `editor.selectionBackground` |
| --- | --- | ---: | ---: | ---: | ---: |
| Indigo | `#020108` | 8 | 4.8 | 5.9 | 19.6 |
| Purple | `#040105` | 5 | 4.5 | 5.8 | 19.5 |
| Pink | `#050002` | 5 | 5.3 | 6.8 | 20.1 |
| Red | `#050101` | 5 | 4.6 | 5.7 | 19.0 |
| Orange | `#040100` | 4 | 5.3 | 6.4 | 19.4 |
| Green | `#000300` | 3 | 4.8 | 6.1 | 19.3 |
| Cyan | `#000303` | 3 | 4.5 | 5.8 | 18.4 |
| Blue | `#000209` | 9 | 4.6 | 5.6 | 18.9 |

Zoom, escala da UI, zoom do editor e outras fontes monoespaçadas não mudam uma cor, então são revisados, não medidos: o tema foi visto no VS Code com a janela ampliada, a fonte do editor aumentada, e em Consolas, Cascadia Mono, Courier New e Lucida Console, para confirmar que keywords bold italic, o riscado e as marcas finas (squiggles, anéis de foco, guias de colchetes) sobrevivem a cada uma.
