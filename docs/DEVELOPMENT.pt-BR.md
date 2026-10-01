# Desenvolvimento

Como fazer o build do tema, checá-lo, regenerar as capturas de tela e publicá-lo. [English version](DEVELOPMENT.md).

## Preparação

```bash
git clone https://github.com/DigUu-RL/midnight-indigo.git
cd midnight-indigo
npm install
```

Node 22.18 ou mais recente: os scripts de build são TypeScript executado direto pelo type stripping do Node — sem etapa de compilação, sem bundler, sem `dist/`. O `typescript` é devDependency só para checagem.

Aperte `F5` no VS Code para abrir um Extension Development Host com o tema carregado. Mudanças no JSON do tema aparecem na hora; mudanças no `package.json` ou na injeção de gramática pedem um reload da janela.

## Gerado, não editado

Tudo em [`themes/`](../themes/), [`icons/svg/`](../icons/svg/) e [`icons/theme/`](../icons/theme/) é gerado. O VS Code lê esses arquivos diretamente, mas uma edição à mão se perde no próximo build — edite a fonte e refaça o build. O `npm run check` recusa um arquivo gerado que o build não escreveria.

As fontes ficam em [`tools/`](../tools/), uma pasta por assunto:

| Pasta | O que contém |
| --- | --- |
| [`shared/`](../tools/shared/) | Matemática de cor (sRGB, contraste WCAG, OKLCH dentro do gamut), o navegador headless, hashing |
| [`theme/`](../tools/theme/) | As paletas, os tokens, o build dos temas de cores e seus checks, a baseline v3.0.0, a auditoria de acessibilidade |
| [`syntax/`](../tools/syntax/) | As amostras de código e o corpus, e o check de sintaxe |
| [`icons/`](../tools/icons/) | A especificação dos ícones, a arte importada, o build, as medições e as auditorias |
| [`preview/`](../tools/preview/) | As capturas em [`docs/preview/`](preview/) |
| [`docs/`](../tools/docs/) | O inventário e o check de imagens |
| [`regression/`](../tools/regression/) | Os snapshots, e a regressão visual no navegador e no VS Code real |
| [`release/`](../tools/release/) | O check do conteúdo do pacote |

Os arquivos que mais importam:

| Arquivo | O que contém |
| --- | --- |
| [`tools/theme/theme-palette.ts`](../tools/theme/theme-palette.ts) | A tabela de papéis e os desenhos das oito famílias — veja o [`COLOR-SYSTEM.pt-BR.md`](COLOR-SYSTEM.pt-BR.md) |
| [`tools/theme/theme-tokens.ts`](../tools/theme/theme-tokens.ts) | Os tokens, cada um com a frase que diz para que serve, e os estados de interação — veja o [`DESIGN-SYSTEM.pt-BR.md`](DESIGN-SYSTEM.pt-BR.md) |
| [`tools/theme/build-color-themes.ts`](../tools/theme/build-color-themes.ts) | A estrutura do tema, escrita uma vez contra tokens, e cada check que o build faz |
| [`tools/theme/baseline.ts`](../tools/theme/baseline.ts) | O hash fixado da baseline, e as emendas a ela |
| [`tools/icons/icon-spec.ts`](../tools/icons/icon-spec.ts) | Que marca, pictograma ou letras cada ícone recebe, e em que cores — veja o [`ICON-SYSTEM.pt-BR.md`](ICON-SYSTEM.pt-BR.md) |
| [`tools/icons/build-theme.ts`](../tools/icons/build-theme.ts) | O mapeamento de extensões, nomes de arquivo, nomes de pasta e ids de linguagem, e o check de que ele é fechado |
| [`tools/icons/palette.ts`](../tools/icons/palette.ts) | Cada cor com que o build dos ícones pinta, entre elas os papéis das pastas |
| [`tools/check.ts`](../tools/check.ts) | Cada check offline; um novo é uma entrada em `CHECKS` |

## Comandos

```bash
npm run build                    # temas, depois ícones
npm run build:themes             # os oito temas de cores
npm run build:icons              # o conjunto de ícones
npm run check                    # cada check offline — precisa passar antes de um commit
npm run typecheck                # tsc, sem emitir

npm run measure:glyphs           # remede a arte depois de mudar uma marca ou pictograma
npm run audit:icons              # reaudita os ícones construídos
npm run audit:coverage           # resolve os nomes de arquivo de repositórios reais contra o tema de ícones
npm run audit:accessibility      # reescreve docs/ACCESSIBILITY.md
npm run inventory                # reescreve docs/INVENTORY.md, SYNTAX.md e TOKENS.md

npm run preview:theme            # o hero, as paletas e os cards de linguagem
npm run preview:gallery          # as duas galerias de ícones
npm run preview:workbench        # as capturas do workbench, a partir de capturas revisadas do VS Code real

npm run snapshot                 # reescreve os snapshots depois de uma mudança intencional
npm run regression               # prévias, baseline, medições e VS Code real, comparados
npm run regression -- --accept   # as capturas do último run viram as revisadas

npm run import:marks             # busca de novo a geometria oficial dos logotipos
npm run import:pictograms        # busca de novo os pictogramas no Iconify
npm run import:vscode-colors     # busca de novo os ids de cor documentados do VS Code
npm run check:images             # cada imagem que a documentação usa, badges incluídos (rede)
npm run check:package            # o que o vsce empacotaria, contra o que a extensão é

npm run package                  # midnight-indigo-<versão>.vsix
```

As medições, as auditorias e as capturas precisam de um navegador baseado em Chromium; defina `MIDNIGHT_INDIGO_BROWSER` se nenhum for encontrado. O `npm run regression` também precisa do VS Code. Os três scripts `import:` são os únicos que acessam a rede, e nenhum faz parte de um build.

## Checks

O `npm run check` roda, sem parar na primeira falha:

- o check de tipos;
- o build do tema, que mantém a baseline, as regras de tokens, o contraste, a separação de matizes, os estados de interação, os sinais, o Git, o terminal e o chat, e o manifesto;
- a auditoria de acessibilidade, contra o [`ACCESSIBILITY.pt-BR.md`](ACCESSIBILITY.pt-BR.md);
- o check de sintaxe, que tokeniza o corpus nas oito famílias com o semantic highlighting desligado e ligado;
- o build dos ícones e a auditoria óptica;
- um segundo build dos dois, que não pode mudar um byte, e os arquivos gerados contra a árvore;
- os quatro snapshots — estrutura, cada cor nas oito famílias, associações de ícones e geometria dos ícones;
- que cada captura e medição foi gerada a partir das entradas que estão na árvore;
- que cada imagem, página ou arquivo a que a documentação aponta está na árvore;
- o pacote: o que o `vsce` publicaria é exatamente o manifesto, as páginas que o Marketplace lê, e o que o `package.json` contribui;
- que o [`INVENTORY.md`](INVENTORY.md) ainda descreve a árvore.

O [`REGRESSION.pt-BR.md`](REGRESSION.pt-BR.md) explica os snapshots e a regressão por completo.

## Capturas de tela

As capturas são geradas, nunca editadas, e versionadas em [`docs/preview/`](preview/).

- **O hero, as paletas e os cards de linguagem** são renderizados com o [Shiki](https://shiki.style) alimentado pelos arquivos de tema deste repositório, pelas gramáticas que o VS Code traz e pela injeção de gramática da extensão, então uma captura não pode mostrar uma cor que o tema não produz. Acrescente uma amostra em [`tools/syntax/samples/`](../tools/syntax/samples/) e uma entrada em `LANGUAGES` no [`build-theme-preview.ts`](../tools/preview/build-theme-preview.ts) para cobrir outra linguagem.
- **As galerias de ícones** são os SVGs construídos sobre a cor da barra lateral. Rode-as depois do `npm run build:icons`.
- **As capturas do workbench** são o VS Code real, copiadas das capturas que o `npm run regression` tirou e que alguém revisou e aceitou. O script recusa uma captura tirada de temas ou ícones diferentes dos que estão na árvore.

O `npm run check` sabe quando uma captura foi gerada a partir de entradas que mudaram desde então, e diz o comando que a atualiza.

As capturas são referenciadas por caminho relativo. O GitHub o resolve no branch que estiver sendo lido, e o `vsce package` reescreve os links do README para o `raw/HEAD` do repositório, então o Marketplace mostra as capturas atuais do branch padrão sem nada para atualizar.

## Publicando

1. **Checar.** O `npm run check` passa.
2. **Olhar.** O `npm run regression` passa, ou cada folha que ele aponta foi olhada e aceita. Regenere o que o `npm run check` disser que está desatualizado.
3. **Registrar.** Mova o `[Unreleased]` do [`CHANGELOG.md`](../CHANGELOG.md) para a nova versão. Uma versão que muda a aparência de um tema instalado é major.
4. **Versionar.** `npm version <major|minor|patch> --no-git-tag-version`, e depois o commit.
5. **Empacotar.** `npm run package` escreve `midnight-indigo-<versão>.vsix`. O `vsce` é uma devDependency fixada, então a mesma árvore empacota do mesmo jeito.
6. **Instalar.** `code --install-extension midnight-indigo-<versão>.vsix --force` sobre a versão anterior, recarregar, e confirmar que os oito temas e o tema de ícones aparecem e que os selecionados continuam aplicados.
7. **Publicar.** `npx vsce publish --packagePath midnight-indigo-<versão>.vsix`, depois a tag `v<versão>` no commit, o push da tag, e o release no GitHub com a seção do changelog e o `.vsix` anexado.
