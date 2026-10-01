# Sistema de ícones

Como o **Midnight Icons** é desenhado, o que cobre, e como é checado. [English version](ICON-SYSTEM.md).

Um tema de ícones serve os oito temas de cores: 413 SVGs — 305 ícones de arquivos e linguagens, e 53 pastas com um estado aberto e um fechado — associados a 636 extensões, 372 nomes exatos de arquivo e 118 ids de linguagem. Os ícones mantêm as próprias cores em todos os temas: um arquivo Python é `#3776AB` e `#FFD43B` seja o editor em volta índigo ou verde, porque a marca é a identidade da linguagem, não do tema.

Tudo em [`icons/`](../icons/) é gerado. As fontes estão em [`tools/icons/`](../tools/icons/); o [`DEVELOPMENT.pt-BR.md`](DEVELOPMENT.pt-BR.md) explica como fazer o build.

## Uma regra: legível a 16px

Cada decisão abaixo vem do tamanho em que o VS Code realmente desenha um ícone de arquivo.

- **O logotipo é o ícone.** Não há moldura. Um ícone de arquivo é a marca da própria linguagem ou ferramenta, chapada, nas cores oficiais, preenchendo a caixa. Os contornos são importados da arte dos próprios projetos; só o tratamento é nosso.
- **Um logotipo conquista o lugar a 16px, ou não é usado.** Less, Stylus, EditorConfig, JSON, MySQL, Travis, Composer e Electron têm marcas oficiais; todas foram importadas e todas foram retiradas, porque a 16px um logotipo tipográfico, um mascote em traço ou um anel simples não dizem nada. O motivo está registrado em cada entrada de [`tools/icons/icon-spec.ts`](../tools/icons/icon-spec.ts).
- **Uma sombra pequena.** Cada marca sólida projeta uma sombra suave deslocada, no próprio matiz com a luz retirada — preto some num fundo quase preto, e uma sombra mais saturada que a marca vira uma franja colorida. Ela cai meio pixel a 16px. Desenhos em traço não projetam nenhuma: sob um traço mais fino que um pixel, uma sombra é uma segunda linha fora de registro.
- **Furos são furos.** Tudo o que é recortado de uma forma é transparente, para que o ícone leia sobre os fundos de hover e seleção do explorer. Marcas cujas letras são recortadas de um bloco — TypeScript, npm, Swift — têm as letras pintadas de volta na cor do logotipo.
- **Nada nosso é pontiagudo.** A 16px um vértice nu serrilha numa franja cinza. Os únicos cantos vivos do conjunto pertencem a logotipos, cuja geometria não é nossa para suavizar.
- **Sem selos.** Um padrão de nome de arquivo ganha um ícone próprio, e não um marcador sobre um ícone base, na cor da linguagem: `*.spec.ts` é um frasco, `*.service.ts` uma engrenagem, `*.guard.ts` um escudo, `*.dto.ts` um par de setas. Lê-se a linguagem e o papel de uma vez.
- **Letras são o último recurso, e ainda assim um objeto.** Um formato sem marca alguma é composto em letras — `PDF`, `ASM`, `INI` — sobre um traço da mesma cor, com um feixe de luz atravessando. Dezoito dos 305 ícones de arquivo são de letras.

## Posicionado pelo peso

Os ícones não são centralizados nem dimensionados à mão. `npm run measure:glyphs` rasteriza cada marca, pictograma e texto e registra a **tinta** — caixa, centro de massa, quanto dela é sólido — porque a caixa delimitadora não é o que o olho vê: o frasco se apoia no bulbo, um triângulo na base, e o SVG centraliza um texto pela largura de avanço, não pelas letras.

Cada peça é centralizada a meio caminho entre a caixa e o centro de massa, como um designer corrige um botão de play à mão. Quadrados são desenhados um pouco menores que discos, e logotipos tipográficos longos um pouco maiores, para que o conjunto se equilibre em peso.

Depois do build, `npm run audit:icons` rasteriza cada ícone construído e registra o centro óptico, a cobertura, o traço, os furos, os cantos, a sombra e a solidez a 16 e 32px; também desenha cada ícone de arquivo a 16px sobre a barra lateral e mede o quanto cada par se parece. O `npm run check` mantém cada ícone nos limites de [`tools/icons/icon-optics.ts`](../tools/icons/icon-optics.ts) — centro óptico a menos de dois terços de pixel, uma sombra que nunca pesa mais que a tinta, nenhum par de ícones de arquivo a menos de 8 ΔE em forma e cor — a não ser que a exceção tenha sido examinada e registrada com o motivo.

## Pastas dizem para que servem

Um ícone de arquivo diz que tecnologia é o arquivo; uma pasta diz para que ela serve. Uma pasta é um painel chapado de frente para quem olha, com uma silhueta afundada nele num tom mais escuro e um feixe de luz de borda dura atravessando a 40°. O estado aberto tira a parede da frente e mostra o corpo atrás.

A cor é o papel dela no projeto, em nove papéis:

| Papel | Cor | Pastas |
| --- | --- | --- |
| Interface | rosa | `components`, `views`, `layouts`, `styles`, `themes`, `design` |
| Conteúdo | cobre | `assets`, `images`, `media`, `audio`, `icons`, `fonts`, `public`, `docs`, `i18n` |
| Lógica | azul | `functions`, `utils`, `helpers`, `hooks`, `core`, `shared`, `plugins`, `packages` |
| Dados | dourado | `models`, `store`, `context`, `database`, `schemas`, `types`, `constants` |
| Rede | verde-azulado | `services`, `controllers`, `middleware`, `routes`, `api`, `server`, `jobs` |
| Qualidade | verde | `tests`, `mocks`, `validators`, `benchmarks` |
| Segurança | coral | `security`, `guards`, `keys` |
| Ferramentas | ardósia | `config`, `scripts`, `build`, `docker`, `workflows`, `ai` |
| Dormente | cinza | `logs`, `temp`, `archive` |

Cada pasta também reconhece seus sinônimos — `tests` reconhece `spec` e `e2e`, `ai` reconhece `.claude` e `prompts`, e assim por diante, 241 nomes ao todo. A pasta comum é um índigo lavanda.

As pastas são mais calmas que os logotipos de propósito: uma pasta é um painel sólido e um logotipo é uma marca com ar em volta, então com a mesma saturação as pastas pesariam mais que os arquivos dentro delas. Os sete matizes e a pasta comum compartilham um croma OKLCH abaixo do quartil inferior dos logotipos, e vizinhos no círculo alternam um degrau acima e abaixo em luminosidade. O build falha se uma pasta cair abaixo de 4.5:1 na barra lateral, uma silhueta abaixo de 3:1 na sua pasta, ou dois papéis ficarem a menos de 8 ΔE.

## Cobertura

| | |
| --- | --- |
| **Linguagens** | JS/TS/JSX/TSX, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C/C++/C#/F#/VB.NET, PHP, SQL, Perl, Lua, Dart, Elixir, Erlang, Haskell, Clojure, Scala, Groovy, R, Julia, Nim, Crystal, Zig, Objective-C, Solidity, Assembly, Elm, OCaml, Fortran, Racket, PureScript, Gleam, Haxe, Nix, WebAssembly, COBOL, Pascal, Ada, Tcl, ABAP, os Lisps, Prolog, AppleScript, AutoHotkey, awk |
| **Marcação, estilos e dados** | HTML, CSS, SCSS/Sass, Less, Stylus, JSON, YAML, TOML, INI, XML, ENV, Markdown/MDX, AsciiDoc, reStructuredText, LaTeX, CSV, JSON Lines, OpenAPI, Swagger |
| **Frameworks e runtimes** | Vue, Svelte, Astro, Angular, Next.js, Nuxt, Tailwind, Bootstrap, PostCSS, Node, Deno, Bun, Electron, Tauri, Flutter, Django, Laravel, Spring, arquivos de projeto .NET e Razor |
| **Build, testes e CI** | webpack, Vite, Rollup, esbuild, Turborepo, Nx, Lerna, Gradle, Maven, NuGet, MSBuild, Poetry, uv, Conda, Jest, Vitest, pytest, Cypress, Playwright, Mocha, Storybook, GitHub Actions, Dependabot, pre-commit, Codecov, Ruff, CircleCI, Travis, Bitbucket, GitLab CI, Azure, Jenkins, Renovate, as ferramentas do LLVM |
| **Infraestrutura e bancos de dados** | Docker, Compose, Kubernetes, Helm, Terraform, HCL, Ansible, Packer, Pulumi, Serverless, Netlify, Vercel, Cloudflare, MongoDB, PostgreSQL, MySQL, Redis, SQLite, Prisma, Firebase |
| **Hardware, gráficos e ciência** | Verilog, VHDL, dumps de forma de onda, layouts de PCB, device trees, shaders, CUDA, MATLAB, pacotes estatísticos, pesos de ML, CAD, G-code, texturas de GPU |
| **Assistentes de IA** | instruções, prompts, agentes, skills (`SKILL.md`), configuração MCP |
| **O resto do sistema de arquivos** | imagens, fotos RAW, arte vetorial, fontes, áudio, vídeo, legendas, arquivos compactados, instaladores, imagens de disco, e-books, certificados e chaves, PDF e documentos do Office, 3D, e-mail, calendários, geodados, capturas de pacotes, datasets, snapshots de teste, templates, catálogos de tradução, crash dumps e backups |
| **Arquivos de repositório** | `CODEOWNERS`, `SECURITY.md`, templates de issue e PR, configuração de commit e release, hooks do Husky, dev containers, `hosts`, crontabs, units do systemd, sitemaps, feeds, source maps, workspaces, segredos, avisos |
| **Padrões de nome** | `*.spec`, `*.test`, `*.d.ts`, `*.module`, `*.component`, `*.service`, `*.stories`, `*.config`, `*.min.js`, `*.guard`, `*.pipe`, `*.directive`, `*.controller`, `*.model`, `*.dto`, `*.entity` |

Arquivos também são reconhecidos pela pasta em que estão, como o VS Code permite: todo workflow em `.github/workflows` é GitHub Actions, os formulários em `ISSUE_TEMPLATE` são templates de issue, um arquivo Markdown numa pasta `agents` é um agente.

A cobertura é medida, não presumida. `npm run audit:coverage` resolve os nomes de arquivo de 47 repositórios públicos — ferramentas web, clusters, CI, observabilidade, dados, ciência, ML, ferramentas de assistentes, gráficos, hardware e .NET — do jeito que o VS Code resolve, e ordena o que cai na página genérica por quantos repositórios o contêm. 9.2% desses 812.272 arquivos caem nela. O que sobra no topo é ambíguo de propósito: `.in`, `.inc`, `.def`, `.dat` e `VERSION` significam algo diferente em cada ecossistema.

## De onde vem a arte

Nem os logotipos nem os pictogramas são desenhados aqui. Os dois são importados por um script que fixa as fontes e escreve um arquivo versionado, então o build dos ícones nunca acessa a rede. O [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md) traz cada licença.

| Fonte | Licença | Usada para |
| --- | --- | --- |
| [Simple Icons](https://simpleicons.org) 16.29.0 | CC0-1.0 | A fonte padrão das marcas: chapadas, em um só path |
| [devicon](https://github.com/devicons/devicon) v2.17.0 | MIT | Marcas realmente multicoloridas — Python, Java, Dart, Vue, HTML5, C#, Azure |
| [Phosphor](https://phosphoricons.com), via [Iconify](https://iconify.design) | MIT | Os pictogramas, no peso `duotone` para arquivos e `fill` para pastas |
| Material Symbols, Fluent, MingCute, Material Design Icons, via Iconify | Apache-2.0 / MIT | Pictogramas onde o desenho do Phosphor não sobrevive a 16px, cada um com o motivo na sua entrada |

Onde um projeto redesenhou o logotipo, o conjunto traz o atual: CSS é a marca rebeccapurple adotada em 2024, e o GitLab o tanuki simplificado em 2022. Algumas marcas que não sobrevivem a 16px, ou que não têm fonte redistribuível — PowerShell, o trio do Office, Groovy, Jenkins, Jest, Vim, Lua — são redesenhadas sólidas em [`tools/icons/marks.ts`](../tools/icons/marks.ts) a partir da arte oficial.

Os pictogramas são duotone: a cor do ícone mais um tom de superfície dela, um pouco menos da metade do caminho até o fundo. A superfície só é desenhada onde o desenho a sustenta — vidro e líquido, página e impressão, tela e prompt. Um painel solto atrás de um desenho, cuja borda as linhas atravessam, é medido e deixado de fora.

Qual desenho significa qual arquivo é a parte que continua nossa, e cada escolha está escrita ao lado do ícone a que leva — `dto` é um par de setas porque um DTO existe para atravessar uma fronteira, `husky` é um cachorro, `devcontainer` é um contêiner de navio.

Os logotipos são marcas registradas dos seus respectivos donos, usadas para identificar os tipos de arquivo a que pertencem.
