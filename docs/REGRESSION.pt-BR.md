# Regressão visual

*[English](REGRESSION.md)*

Uma mudança que altera o que o tema desenha não pode ser incorporada sem que alguém a veja. Dois comandos sustentam isso: `npm run check`, offline e rápido, a cada mudança; e `npm run regression`, num navegador e no VS Code real, antes de um release e depois de qualquer mudança no que é desenhado.

## `npm run check`

Roda sem rede, sem navegador e sem VS Code, e nunca escreve na árvore. Além da checagem de tipos, dos builds do tema e dos ícones e de suas próprias checagens (baseline, pisos de contraste, acessibilidade, corpus de sintaxe, óptica dos ícones), ele garante:

| Checagem | O que recusa |
| --- | --- |
| build is deterministic | um segundo build que escreve bytes diferentes |
| generated files are committed | um arquivo de `themes/` ou `icons/` que não é o que o build escreve a partir das fontes — uma mudança de fonte commitada sem a sua saída. A árvore é devolvida como estava e a checagem falha; quem escreve é `npm run build` |
| outputs are declared | um tema ou tema de ícones no disco que o `package.json` não contribui (iria no pacote e nada o carregaria), ou uma contribuição sem arquivo |
| snapshots | qualquer mudança nos snapshots abaixo que não tenha sido registrada com `npm run snapshot` |
| rendered outputs are current | uma captura em `docs/preview/`, ou uma medição de ícone em `tools/icons/`, renderizada a partir de entradas que mudaram desde então |
| inventory is up to date | `docs/INVENTORY.md`, `TOKENS.md`, `SYNTAX.md` — incluindo o hash de cada captura |

### Snapshots

`tools/regression/snapshots/` diz o que a extensão desenha, um fato por linha, para que uma mudança apareça como poucas linhas de diff em vez de oito arquivos JSON reescritos:

- `structure.txt` — o que todos os temas compartilham: as regras TextMate e seus escopos em ordem, os seletores semânticos, quantas cores de workbench define; as definições do tema de ícones e quantos nomes cada tabela mapeia. A checagem também falha se as oito variantes deixarem de compartilhar uma só estrutura.
- `colours.tsv` — cada cor de workbench, regra TextMate e regra semântica, uma linha cada, com as oito variantes lado a lado.
- `icon-associations.txt` — um conjunto fixo de caminhos e nomes de pasta reais, e o ícone que a resolução do VS Code dá a cada um.
- `icon-geometry.txt` — onde fica a tinta de cada ícone gerado: sua caixa, seu centro de massa, sua área.

Quando a checagem falha, ela imprime as próprias linhas alteradas — `~ editor.background  pink #050002 → #000000` — então a falha já é a revisão. Se toda mudança é intencional, `npm run snapshot` os reescreve, e eles são commitados junto com a mudança.

### Saídas renderizadas

As capturas e as medições dos ícones precisam de um navegador, então são commitadas, e a checagem não consegue renderizá-las de novo. `tools/regression/rendered-from.json` registra o hash de tudo a partir do que cada uma foi renderizada — os temas, os samples, os SVGs dos ícones e o script, para as previews; os desenhos, as marcas e os textos dos letreiros, para as medições. Cada produtor grava seu registro quando roda; a checagem recalcula os hashes e diz o comando a rodar para qualquer um que tenha mudado.

## `npm run regression`

Precisa do Edge ou do Chrome e de um VS Code instalado, e escreve apenas em `.regression/` (ignorada pelo Git). Quatro estágios, cada um selecionável com `--only=`:

| Estágio | O que faz | Falha quando |
| --- | --- | --- |
| `previews` | renderiza de novo cada captura de `docs/preview/` e compara os pixels com os commitados | qualquer pixel difere — o renderizador desenhou diferente |
| `baseline` | fotografa cada sample de código no Midnight Indigo como a v3.0.0 o lançou e o põe ao lado do de hoje, com um diff do que mudou | nunca; é uma imagem para a revisão |
| `measure` | mede de novo a arte e os letreiros dos ícones e compara com `tools/icons/glyph-bounds.json` e `text-bounds.json` | qualquer número difere — uma fonte ou o renderizador mudou por baixo dos ícones |
| `vscode` | fotografa o corpus de workbench e o corpus de código no VS Code real, nas oito variantes e no baseline, e compara cada captura com a última rodada revisada | uma captura mudou, ou nunca foi revisada |

`.regression/current/report.html` aponta para cada folha de contato e cada diff.

### O corpus no VS Code

A janela é o VS Code instalado num perfil descartável, com uma pasta de extensões vazia, o tema carregado da árvore de trabalho e uma extensão auxiliar (`tools/regression/vscode-helper/`) que executa comandos para o harness e fornece os dados de que as superfícies precisam: diagnósticos, uma execução de testes com cobertura, threads de comentários, notificações, um log, um quick pick, uma sessão de depuração, um participante de chat e um modelo para ele.

**Workbench** — Explorer, Search, Source Control, Run & Debug, Extensions, Problems, Output, Terminal, Command Palette, Quick Input, Settings, Outline, Breadcrumbs, IntelliSense, Diff Editor, Sticky Scroll, Inlay Hints, Notifications, Chat, Agents, Testing / Coverage, Notebook, Welcome / Walkthrough, Minimap e Overview Ruler, Comments.

**Código** — TypeScript, TSX, JavaScript, C#, Python, Rust, Go, Java, Kotlin, PHP, PowerShell, JSON, YAML, Markdown, HTML, CSS, SCSS, SQL, Shell, a partir de `tools/syntax/samples/`.

Cada superfície é montada num workspace que a rodada cria do zero (`tools/regression/workspace.ts`), e tudo o que faria duas rodadas diferirem é desligado ou fixado: a página é diagramada em 1366×768 qualquer que seja o tamanho com que a janela abre, toda superfície começa da mesma barra lateral (pastas recolhidas, outros painéis fechados, sem barra lateral secundária), as barras de rolagem ficam sempre visíveis em vez de sumir, o cursor não pisca, o Git blame fica oculto, as sessões de chat são arquivadas antes de uma ser fotografada e o chat é maximizado, e a lista de pastas recentes da página inicial nunca entra no quadro. Duas rodadas em ordens diferentes dão os mesmos pixels.

### Revisando

1. `npm run regression` — ou uma parte: `--only=vscode --surfaces=chat,terminal --variants=indigo,pink --languages=TypeScript`.
2. Para cada superfície apontada, abra a folha em `.regression/current/sheets/` (as nove variantes lado a lado) e os diffs em `.regression/current/vscode-diff/` (pixels alterados em magenta).
3. Quando toda mudança for intencional: `npm run regression -- --accept`. As capturas viram as revisadas, com as quais a próxima rodada compara.

As capturas revisadas são de uma versão do VS Code, registrada ao lado delas; uma rodada noutra versão avisa isso primeiro, já que parte das mudanças será do próprio VS Code.

Cada superfície também registra do que as suas capturas foram tiradas — o hash dos temas, dos ícones, da injeção de gramática, do que o `package.json` contribui e do corpus — num `inputs.txt` ao lado delas. As capturas do workbench no README são capturas revisadas copiadas pelo `npm run preview:workbench`, que recusa uma superfície cujo registro não seja o da árvore, então uma captura de um tema antigo não chega à página do Marketplace.
