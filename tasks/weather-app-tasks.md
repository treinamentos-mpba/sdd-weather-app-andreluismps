# Backlog de Tarefas — Weather App

Fonte de verdade: `specs/weather-app-spec.md`; decisões técnicas: `plans/weather-app-plan.md`. Executar em ordem de dependência. Cada tarefa deve permanecer limitada ao escopo e aos critérios indicados.

## Entrega 1 — Domínio e base da aplicação

### T-01 — Definir contratos compartilhados

- **Tipo:** Data
- **Requisitos:** FR-01–FR-06; AC-02.1, AC-03.1, AC-05.2
- **Descrição:** criar os tipos `Unit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherData`, `RequestErrorKind` e `RequestState` conforme o plano.
- **Critérios de aceite:** os tipos são exportados de `src/types/weather.ts`; campos meteorológicos parciais são opcionais; TypeScript strict compila sem `any`.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`

### T-02 — Implementar funções puras de domínio

- **Tipo:** Data
- **Requisitos:** FR-03, FR-04; AC-03.1, AC-04.1–AC-04.3, NFR-08
- **Descrição:** implementar conversão/arredondamento de temperatura, geração das cinco datas no timezone da cidade, formatação regional e mapeamento de códigos WMO para rótulos pt-BR.
- **Critérios de aceite:** conversões seguem os exemplos da spec; as datas são hoje mais quatro dias no timezone informado; códigos WMO desconhecidos retornam “Condição não disponível”; funções não acessam rede, DOM ou estado React.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`, `src/lib/format.ts`, `src/lib/weatherCodes.ts`

### T-03 — Testar funções puras

- **Tipo:** Test
- **Requisitos:** FR-03, FR-04; AC-03.1, AC-04.1–AC-04.3, NFR-08
- **Descrição:** cobrir conversão, arredondamento, sequência de datas/timezone, formatação pt-BR e códigos WMO.
- **Critérios de aceite:** testes Vitest cobrem valores positivos, negativos, fracionários, empates, timezone diferente do host e código WMO desconhecido; resultados são determinísticos e todos passam.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`, `tests/unit/format.test.ts`, `tests/unit/weatherCodes.test.ts`

### T-04 — Criar shell da aplicação

- **Tipo:** UI
- **Requisitos:** NFR-01, NFR-08
- **Descrição:** recriar o bootstrap React e a composição inicial da página com a configuração Tailwind existente e o tema dark glassmorphism.
- **Critérios de aceite:** `App` renderiza no root; não há rolagem horizontal nos viewports 320 × 568 e 1280 × 720; o tema segue os estilos do projeto.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`

### T-05 — Criar componentes de estado

- **Tipo:** UI
- **Requisitos:** FR-05, FR-06; AC-01.4, AC-01.5, AC-05.1, AC-06.1, NFR-02
- **Descrição:** implementar estados reutilizáveis de loading, vazio e erro, incluindo texto e ação de retry quando aplicável.
- **Critérios de aceite:** loading, vazio e erro têm conteúdo visível; erro oferece “Tentar novamente”; status é anunciado a tecnologias assistivas; componentes recebem dados por props e não fazem requisições.
- **Dependências:** T-04
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`, `src/components/states/EmptyState.tsx`, `src/components/states/ErrorState.tsx`

### T-06 — Testar componentes de estado

- **Tipo:** Test
- **Requisitos:** FR-05, FR-06; AC-05.1, AC-06.1–AC-06.2, NFR-02
- **Descrição:** testar rendering, acessibilidade e interação dos componentes loading/empty/error.
- **Critérios de aceite:** Testing Library verifica texto, role/status acessível e callback de retry; testes cobrem loading, erro e vazio.
- **Dependências:** T-05
- **Arquivos prováveis:** `tests/unit/LoadingState.test.tsx`, `tests/unit/EmptyState.test.tsx`, `tests/unit/ErrorState.test.tsx`

## Entrega 2 — Busca e geocoding

### T-07 — Implementar SearchBar acessível

- **Tipo:** UI
- **Requisitos:** FR-01; AC-01.1, AC-01.5–AC-01.6, NFR-02
- **Descrição:** criar busca manual por nome, sem sugestões durante a digitação, e emitir a consulta ao submeter.
- **Critérios de aceite:** input possui label acessível; vazio/só espaços não chama o callback e apresenta a mensagem definida; acentos, apóstrofos e hífens chegam intactos ao callback.
- **Dependências:** T-04, T-05
- **Arquivos prováveis:** `src/components/SearchBar.tsx`

### T-08 — Testar SearchBar

- **Tipo:** Test
- **Requisitos:** FR-01; AC-01.1, AC-01.5–AC-01.6, NFR-02
- **Descrição:** testar submit manual, input inválido, caracteres especiais e teclado.
- **Critérios de aceite:** testes comprovam uma chamada por submit válido, nenhuma chamada para input vazio, preservação dos caracteres e interação por teclado/label.
- **Dependências:** T-07
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`

### T-09 — Implementar serviço de geocoding

- **Tipo:** Data
- **Requisitos:** FR-01, FR-05; AC-01.1–AC-01.4, AC-05.4, NFR-10
- **Descrição:** implementar `searchCities` encapsulando URL, query string, timeout, normalização e erros do endpoint público.
- **Critérios de aceite:** envia `name`, `count=5`, `language=pt`, `format=json`; codifica caracteres especiais; mapeia `City`; lista vazia é resultado vazio; não envia `apikey` nem chama `customer-`; timeout ocorre em 10 segundos.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-10 — Testar serviço de geocoding

- **Tipo:** Test
- **Requisitos:** FR-01, FR-05; AC-01.1–AC-01.6, AC-05.4, NFR-10
- **Descrição:** testar `searchCities` com `fetch` mockado.
- **Critérios de aceite:** validar URL/parâmetros, mapeamento de campos opcionais, cinco resultados no máximo, lista vazia, caracteres codificados, HTTP/network error e timeout; nenhuma chamada real.
- **Dependências:** T-09
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-11 — Implementar estado de busca em useWeather

- **Tipo:** Data
- **Requisitos:** FR-01, FR-05, FR-06; AC-01.1–AC-01.5, AC-05.4–AC-05.5, AC-06.1–AC-06.2
- **Descrição:** coordenar `idle/loading/success/empty/error` da busca, seleção de cidade, mensagem de erro e retry.
- **Critérios de aceite:** busca vazia não chama serviço; lista vazia produz `empty`; falha produz `error`; resultado de busca não seleciona cidade sem ação do usuário; retry repete a mesma consulta.
- **Dependências:** T-05, T-07, T-09, T-10
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-12 — Testar estado de busca

- **Tipo:** Test
- **Requisitos:** FR-01, FR-05, FR-06; AC-01.1–AC-01.5, AC-05.4–AC-05.5, AC-06.1–AC-06.2
- **Descrição:** testar transições do hook de busca com o service mockado.
- **Critérios de aceite:** cobrir idle/loading/results/empty/error, retry, input vazio e respostas de busca que chegam fora de ordem; loading termina em sucesso ou falha.
- **Dependências:** T-11
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

## Entrega 3 — Forecast e estado meteorológico

### T-13 — Implementar serviço de forecast

- **Tipo:** Data
- **Requisitos:** FR-02, FR-03, FR-05; AC-02.1, AC-03.1–AC-03.2, AC-05.2–AC-05.3, NFR-07, NFR-10
- **Descrição:** implementar `getWeather(city)` com os parâmetros do plano e normalização por timezone/data.
- **Critérios de aceite:** envia coordenadas, campos current/daily mínimos, `forecast_days=5`, `timezone=auto` e Celsius; gera exatamente as cinco datas esperadas e associa arrays pela data; lacunas não deslocam dias; payload estruturalmente inválido é distinto de parcial; não envia `apikey`/`customer-`; timeout de 10 segundos.
- **Dependências:** T-01, T-02, T-09
- **Arquivos prováveis:** `src/services/weatherService.ts`, `src/types/weather.ts`

### T-14 — Testar serviço de forecast

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03, FR-05; AC-02.1, AC-03.1–AC-03.2, AC-05.2–AC-05.3, NFR-07, NFR-10
- **Descrição:** testar query, parsing e normalização do forecast com `fetch` mockado.
- **Critérios de aceite:** cobrir timezone, cinco datas, associação por data com uma lacuna intermediária, arrays/campos opcionais, erro HTTP/rede, payload estrutural inválido, timeout e ausência de key/customer endpoint.
- **Dependências:** T-13
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`

### T-15 — Orquestrar seleção e forecast no hook

- **Tipo:** Data
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.1–AC-02.6, AC-03.1–AC-03.2, AC-05.1–AC-05.6, AC-06.1–AC-06.2
- **Descrição:** estender `useWeather` para solicitar clima ao selecionar cidade, coordenar estados current/forecast e ignorar respostas fora de ordem.
- **Critérios de aceite:** dados pertencem à cidade selecionada; mudança de cidade não exibe dados antigos como atuais; falha/retry, vazio sem cobertura, parcial e timeout seguem a spec; idade acima de duas horas gera aviso; respostas atrasadas não sobrescrevem a cidade atual.
- **Dependências:** T-11, T-13, T-14
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-16 — Testar fluxo do hook meteorológico

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.1–AC-02.6, AC-03.1–AC-03.2, AC-05.1–AC-05.6, AC-06.1–AC-06.2
- **Descrição:** testar o hook com services mockados, controlando relógio e ordem das respostas.
- **Critérios de aceite:** cobrir loading/success/empty/error, dados atuais, forecast com lacuna no meio, partial, cidade sem cobertura, timestamp ausente/antigo, timeout/retry e troca rápida A→B com resposta tardia de A ignorada.
- **Dependências:** T-15
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`

## Entrega 4 — Apresentação e unidade

### T-17 — Implementar apresentação do clima e forecast

- **Tipo:** UI
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.1, AC-03.1–AC-03.2, AC-05.2, AC-06.1–AC-06.2, NFR-01, NFR-02, NFR-08
- **Descrição:** implementar `CurrentWeather`, `ForecastList` e `ForecastCard` a partir de props, preservando dark glassmorphism e responsividade.
- **Critérios de aceite:** current mostra cidade, temperatura, condição pt-BR e horário de referência; forecast mostra cinco datas, condição e mín/máx; dados ausentes têm marcador visível; aviso stale aparece; layout não rola horizontalmente em 320 CSS px; markup usa roles/labels semânticos.
- **Dependências:** T-01, T-02, T-05, T-15
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`

### T-18 — Testar componentes meteorológicos

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03, FR-05; AC-02.1, AC-02.5–AC-02.6, AC-03.1–AC-03.2, AC-05.2, NFR-02
- **Descrição:** testar apresentação de dados completos, parciais, timestamp ausente e stale.
- **Critérios de aceite:** Testing Library verifica rótulos pt-BR, cinco dias na ordem, campos ausentes, avisos e acessibilidade; não há lógica de fetch nos componentes.
- **Dependências:** T-17
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`, `tests/unit/ForecastList.test.tsx`, `tests/unit/ForecastCard.test.tsx`

### T-19 — Implementar UnitToggle derivado

- **Tipo:** UI
- **Requisitos:** FR-04; AC-04.1–AC-04.4, NFR-02
- **Descrição:** criar o toggle acessível; derivar valores de exibição a partir de Celsius + `Unit`, sem persistir estado ou fazer request.
- **Critérios de aceite:** Celsius é inicial; alternar unidade atualiza todos os valores e símbolos; arredondamento segue a regra; toggle tem label/role e funciona por teclado; não usa storage nem dispara serviço.
- **Dependências:** T-02, T-17
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`, `src/lib/temperature.ts`

### T-20 — Testar alternância de unidade

- **Tipo:** Test
- **Requisitos:** FR-04; AC-04.1–AC-04.4
- **Descrição:** testar toggle e valores derivados com dados determinísticos.
- **Critérios de aceite:** validar os exemplos C/F da spec, Celsius após nova sessão, mudança de todos os valores visíveis e ausência de nova chamada de rede ao alternar.
- **Dependências:** T-19
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`, `tests/unit/temperature.test.ts`

### T-21 — Integrar os fluxos em App

- **Tipo:** UI
- **Requisitos:** FR-01–FR-06; AC-01.1–AC-06.2, NFR-01, NFR-02, NFR-08
- **Descrição:** compor busca, seleção, hook, clima, forecast, toggle e estados de loading/empty/error numa página responsiva.
- **Critérios de aceite:** fluxo completo funciona sem chamadas de rede nos componentes; seleção alimenta dados e UI; todas as mensagens de estado são acessíveis; tema dark glassmorphism preservado.
- **Dependências:** T-06, T-08, T-12, T-16, T-18, T-20
- **Arquivos prováveis:** `src/App.tsx`, `src/main.tsx`, `src/styles/index.css`

## Entrega 5 — Integração, NFRs e release

### T-22 — Validar fluxos E2E

- **Tipo:** Test
- **Requisitos:** FR-01–FR-06; AC-01.1–AC-06.2; NFR-06
- **Descrição:** criar cenários Playwright com interceptação determinística dos dois endpoints Open-Meteo.
- **Critérios de aceite:** passa fluxo busca→seleção→current/forecast→toggle; cobre no-result, falha geocoding, falha forecast, resposta parcial com data intermediária ausente, timeout e retry; após reload volta a Celsius sem cidade selecionada; não solicita geolocalização nem persiste cidade/unidade; todas as URLs interceptadas usam HTTPS e nenhuma envia `apikey` ou usa `customer-`; nenhuma chamada real.
- **Dependências:** T-21
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, `playwright.config.ts`

### T-23 — Verificar responsividade e acessibilidade

- **Tipo:** Test
- **Requisitos:** NFR-01, NFR-02
- **Descrição:** validar layout mobile/desktop e acessibilidade dos fluxos principais.
- **Critérios de aceite:** sem rolagem horizontal em 320×568 e 1280×720; fluxos WCAG 2.2 AA verificados por teclado, foco visível, leitor de tela e mensagens de estado.
- **Dependências:** T-21, T-22
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, relatório de verificação em `tasks/` ou documentação do release.

### T-24 — Medir desempenho e compatibilidade

- **Tipo:** Test
- **Requisitos:** NFR-03, NFR-05
- **Descrição:** medir latência de renderização com rede simulada e executar os fluxos na matriz de navegadores/plataformas suportada.
- **Critérios de aceite:** em 20 execuções por fluxo, ao menos 19 mostram loading em até 200 ms e dados em até 1 s após resposta; matriz de versões de navegador e sistema operacional registrada com busca, seleção, consulta e alternância concluídas.
- **Dependências:** T-21, T-22
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, `playwright.config.ts`, relatório de verificação em `tasks/` ou documentação do release.

### T-25 — Validar usabilidade com participantes

- **Tipo:** Test
- **Requisitos:** NFR-09
- **Descrição:** conduzir teste moderado com cinco participantes representativos das personas, cobrindo as três tarefas previstas.
- **Critérios de aceite:** pelo menos quatro dos cinco participantes concluem sem ajuda cada tarefa: buscar cidade e ver clima atual; consultar previsão de cinco dias; alternar unidade. Registrar resultados antes do release.
- **Dependências:** T-21
- **Arquivos prováveis:** roteiro e relatório de teste em documentação de release.

### T-26 — Confirmar gate de conformidade Open-Meteo

- **Tipo:** Infra
- **Requisitos:** NFR-10
- **Descrição:** documentar autorização vigente dos endpoints públicos sem `apikey`/`customer-`, cobertura, cotas e atribuição para o tipo de implantação pretendido.
- **Critérios de aceite:** registro do endpoint/plano, fonte oficial e data de verificação; atribuição aplicada; nenhuma URL usa `customer-` e nenhuma requisição envia `apikey`; se os termos não autorizarem o uso, release bloqueado e provedor reavaliado.
- **Dependências:** T-13
- **Arquivos prováveis:** documentação de release; `src/services/weatherService.ts` somente se uma URL/parametrização precisar ser corrigida.

### T-27 — Executar gates finais do projeto

- **Tipo:** Test
- **Requisitos:** FR-01–FR-06; NFR-01–NFR-10
- **Descrição:** executar os comandos de qualidade definidos pelo repositório após implementação e testes.
- **Critérios de aceite:** `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` passam; falhas são corrigidas ou registradas como bloqueios antes do release.
- **Dependências:** T-22, T-23, T-24, T-25, T-26
- **Arquivos prováveis:** sem arquivos de produto; correções nos arquivos das tarefas anteriores quando necessário.