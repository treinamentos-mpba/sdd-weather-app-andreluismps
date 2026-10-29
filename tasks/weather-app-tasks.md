# Backlog de Tarefas — Weather App

Fonte de verdade: `specs/weather-app-spec.md`; decisões técnicas: `plans/weather-app-plan.md`. Ordem de execução: tipos → funções puras → services → hooks → components → integração → testes → hardening. Cada tarefa tem critérios próprios e altera no máximo dois arquivos relevantes.

## Entrega 1 — Tipos

### T-01 — Definir contratos compartilhados

- **Tipo:** Data
- **Requisitos:** FR-01–FR-06; AC-02.1, AC-02.7–AC-02.9, AC-03.1, AC-05.2
- **Descrição:** declarar os contratos de cidade, clima atual, dia de previsão, dados meteorológicos, unidade e estado de requisição conforme o plano.
- **Critérios de aceite:** `City`, `CurrentWeather`, `WeatherCodePresentation`, `ForecastDay`, `WeatherData`, `Unit`, `RequestErrorKind` e `RequestState` são exportados; `CurrentWeather` inclui umidade (%), vento (km/h), precipitação (mm) e pressão (hPa) opcionais; campos sujeitos a resposta parcial são opcionais; não há `any` nesses contratos.
- **Dependências:** —
- **Arquivos prováveis:** `src/types/weather.ts`

## Entrega 2 — Funções puras

### T-02 — Implementar conversão de temperatura

- **Tipo:** Data
- **Requisitos:** FR-04; AC-04.1–AC-04.3
- **Descrição:** implementar conversão C/F e arredondamento como função pura.
- **Critérios de aceite:** conversões incluem 0 °C → 32 °F, -10 °C → 14 °F, 20 °C → 68 °F e 1,4 °C → 35 °F; empates são arredondados afastando de zero.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/temperature.ts`

### T-03 — Implementar datas e formatação regional

- **Tipo:** Data
- **Requisitos:** FR-03; AC-03.1–AC-03.2, NFR-08
- **Descrição:** gerar as datas locais esperadas e formatar datas/horas em pt-BR.
- **Critérios de aceite:** com data de referência 2026-04-10 e timezone `Europe/Berlin`, retorna `2026-04-10` a `2026-04-14`; o mesmo resultado ocorre independentemente do timezone do host.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/format.ts`

### T-04 — Implementar mapeamento de códigos WMO

- **Tipo:** Data
- **Requisitos:** FR-02, FR-03; AC-02.1, AC-02.7–AC-02.8, AC-03.2
- **Descrição:** mapear códigos WMO conhecidos para rótulo pt-BR e ícone decorativo.
- **Critérios de aceite:** códigos conhecidos retornam rótulo e ícone correspondentes; códigos desconhecidos retornam “Condição não disponível” e ícone genérico; o rótulo permanece disponível como texto acessível.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`

## Entrega 3 — Services

### T-05 — Implementar serviço de geocoding

- **Tipo:** Data
- **Requisitos:** FR-01, FR-05; AC-01.1–AC-01.4, AC-05.4, NFR-10
- **Descrição:** encapsular `searchCities`, URL, query string, timeout, normalização e erros do endpoint público.
- **Critérios de aceite:** envia `name`, `count=5`, `language=pt`, `format=json`; codifica caracteres especiais; mapeia `City`; lista vazia é resultado vazio; não envia `apikey` nem chama `customer-`; timeout ocorre em 10 segundos.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/services/weatherService.ts`

### T-06 — Implementar serviço de forecast

- **Tipo:** Data
- **Requisitos:** FR-02, FR-03, FR-05; AC-02.1, AC-03.1–AC-03.2, AC-05.2–AC-05.3, NFR-07, NFR-10
- **Descrição:** implementar `getWeather(city)` com os parâmetros do plano e normalização por timezone/data.
- **Critérios de aceite:** envia coordenadas, temperatura/condição/umidade/vento/precipitação/pressão em `current`, campos diários mínimos, `forecast_days=5`, `timezone=auto`, Celsius, vento `kmh` e precipitação `mm`; gera exatamente as cinco datas esperadas e associa arrays pela data; lacunas não deslocam dias; payload estruturalmente inválido é distinto de parcial; não envia `apikey`/`customer-`; timeout ocorre em 10 segundos.
- **Dependências:** T-01, T-02, T-03, T-04, T-05
- **Arquivos prováveis:** `src/services/weatherService.ts`

## Entrega 4 — Hooks

### T-07 — Implementar estado de busca em useWeather

- **Tipo:** Data
- **Requisitos:** FR-01, FR-05, FR-06; AC-01.1–AC-01.5, AC-05.4–AC-05.5, AC-06.1–AC-06.2
- **Descrição:** coordenar `idle/loading/success/empty/error` da busca, seleção de cidade, mensagem de erro e retry.
- **Critérios de aceite:** busca vazia não chama serviço; lista vazia produz `empty`; falha produz `error`; busca não seleciona cidade automaticamente; retry repete a mesma consulta.
- **Dependências:** T-01, T-05
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

### T-08 — Orquestrar seleção e forecast no hook

- **Tipo:** Data
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.1–AC-02.6, AC-03.1–AC-03.2, AC-05.1–AC-05.6, AC-06.1–AC-06.2
- **Descrição:** estender `useWeather` para solicitar clima ao selecionar cidade, coordenar estados current/forecast e ignorar respostas fora de ordem.
- **Critérios de aceite:** dados pertencem à cidade selecionada; mudança de cidade não apresenta dados antigos como atuais; falha/retry, empty sem cobertura, parcial e timeout seguem a spec; idade acima de duas horas gera aviso; resposta atrasada não sobrescreve a cidade atual.
- **Dependências:** T-06, T-07
- **Arquivos prováveis:** `src/hooks/useWeather.ts`

## Entrega 5 — Components

### T-09 — Implementar indicador de carregamento

- **Tipo:** UI
- **Requisitos:** FR-06; AC-06.1–AC-06.2, NFR-02
- **Descrição:** criar o estado visual e acessível para operações pendentes.
- **Critérios de aceite:** enquanto pendente, renderiza indicador visível em elemento com `role="status"`; componente não faz requisições.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`

### T-10 — Implementar estado vazio

- **Tipo:** UI
- **Requisitos:** FR-01, FR-05; AC-01.4–AC-01.5, AC-05.6
- **Descrição:** criar apresentação reutilizável para busca sem resultados e cidade sem cobertura.
- **Critérios de aceite:** recebe a mensagem por props; para lista de geocoding vazia renderiza “Nenhuma cidade encontrada”; para cidade sem cobertura renderiza “Previsão não disponível para esta cidade”.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`

### T-11 — Implementar estado de erro

- **Tipo:** UI
- **Requisitos:** FR-05; AC-05.1, AC-05.3–AC-05.5, NFR-02
- **Descrição:** criar mensagem de erro e ação acessível de retry.
- **Critérios de aceite:** mensagem fica em elemento com `role="alert"`; ativar retry por clique ou teclado chama o callback recebido por props exatamente uma vez.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`

### T-12 — Implementar SearchBar

- **Tipo:** UI
- **Requisitos:** FR-01; AC-01.1, AC-01.5–AC-01.6, NFR-02
- **Descrição:** criar busca manual sem sugestões durante a digitação.
- **Critérios de aceite:** input possui label; submit válido chama callback uma vez; vazio/só espaços não chama callback e mostra mensagem; caracteres especiais são preservados.
- **Dependências:** T-01, T-09, T-10
- **Arquivos prováveis:** `src/components/SearchBar.tsx`

### T-13 — Implementar CurrentWeather

- **Tipo:** UI
- **Requisitos:** FR-02, FR-05; AC-02.1–AC-02.9, AC-05.2, NFR-01, NFR-02, NFR-08
- **Descrição:** apresentar temperatura hero, ícone WMO, condição, referência temporal e métricas atuais com suas unidades.
- **Critérios de aceite:** usa props, não faz `fetch`; exibe temperatura convertida, condição/ícone correspondentes, umidade %, vento km/h, precipitação mm e pressão hPa; métricas ausentes são indicadas sem inventar valores; mantém avisos stale/sem timestamp, dark glassmorphism e acessibilidade.
- **Dependências:** T-01, T-02, T-04
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`

### T-14 — Implementar ForecastCard

- **Tipo:** UI
- **Requisitos:** FR-03, FR-05; AC-03.2, AC-05.2, NFR-01, NFR-02, NFR-08
- **Descrição:** apresentar um resumo diário com data, condição e mín/máx, incluindo campos ausentes.
- **Critérios de aceite:** recebe um `ForecastDay` por props, formata data pt-BR e timezone da cidade, mostra dados ausentes como indisponíveis e não inventa valores.
- **Dependências:** T-01, T-02, T-03, T-04
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`

### T-15 — Implementar ForecastList

- **Tipo:** UI
- **Requisitos:** FR-03, FR-05; AC-03.1–AC-03.2, AC-05.2, NFR-01
- **Descrição:** montar a sequência de cinco cards a partir do forecast normalizado.
- **Critérios de aceite:** renderiza exatamente cinco posições, na ordem das datas esperadas, inclusive quando uma data não tem valores; não desloca os dados entre dias.
- **Dependências:** T-01, T-14
- **Arquivos prováveis:** `src/components/ForecastList.tsx`

### T-16 — Implementar UnitToggle derivado

- **Tipo:** UI
- **Requisitos:** FR-04; AC-04.1–AC-04.4, NFR-02
- **Descrição:** criar toggle acessível; derivar valores de exibição a partir de Celsius + `Unit`, sem persistir estado ou fazer request.
- **Critérios de aceite:** Celsius é inicial; alternar unidade atualiza todos os valores e símbolos; arredondamento segue a regra; toggle tem label/role e funciona por teclado; não usa storage nem dispara serviço.
- **Dependências:** T-01, T-02
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`

## Entrega 6 — Integração

### T-17 — Criar shell visual e estilos globais

- **Tipo:** UI
- **Requisitos:** NFR-01, NFR-08
- **Descrição:** criar a estrutura visual inicial de `App` e os estilos globais do shell.
- **Critérios de aceite:** `App` renderiza um landmark `main`; Tailwind preserva o tema dark glassmorphism; não há rolagem horizontal em 320 × 568 e 1280 × 720.
- **Dependências:** T-01
- **Arquivos prováveis:** `src/App.tsx`, `src/styles/index.css`

### T-18 — Integrar os fluxos e inicializar React

- **Tipo:** UI
- **Requisitos:** FR-01–FR-06; AC-01.1–AC-06.2, NFR-01, NFR-02, NFR-08
- **Descrição:** compor busca, seleção, hook, clima atual, forecast, toggle e estados; conectar o App ao ponto de entrada React.
- **Critérios de aceite:** com services mockados, submeter busca e selecionar resultado exibe a cidade escolhida, clima atual e cinco datas; selecionar Fahrenheit atualiza todos os valores sem aumentar chamadas; busca vazia e erro mostram o estado correto; serviços são chamados pelo hook, não pelos componentes; `main.tsx` monta um único App e `pnpm dev` inicia sem erro de runtime.
- **Dependências:** T-07–T-17
- **Arquivos prováveis:** `src/App.tsx`, `src/main.tsx`

## Entrega 7 — Testes

### T-19 — Testar conversão de temperatura

- **Tipo:** Test
- **Requisitos:** FR-04; AC-04.1–AC-04.3
- **Descrição:** testar conversão e arredondamento de valores positivos, negativos e fracionários.
- **Critérios de aceite:** testes Vitest validam explicitamente 0 °C → 32 °F, -10 °C → 14 °F, 20 °C → 68 °F, 1,4 °C → 35 °F e os casos de empate.
- **Dependências:** T-02
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`

### T-20 — Testar datas e formatação regional

- **Tipo:** Test
- **Requisitos:** FR-03; AC-03.1–AC-03.2, NFR-08
- **Descrição:** testar sequência de cinco dias, troca de data por timezone e formatação pt-BR.
- **Critérios de aceite:** datas retornam hoje e os quatro dias seguintes no timezone informado, independente do timezone do host; formatos são pt-BR.
- **Dependências:** T-03
- **Arquivos prováveis:** `tests/unit/format.test.ts`

### T-21 — Testar mapeamento WMO

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03; AC-02.1, AC-02.7–AC-02.8, AC-03.2
- **Descrição:** testar códigos WMO conhecidos/desconhecidos e seus rótulos/ícones.
- **Critérios de aceite:** códigos suportados retornam rótulo e ícone esperados; código desconhecido retorna “Condição não disponível” e ícone genérico.
- **Dependências:** T-04
- **Arquivos prováveis:** `tests/unit/weatherCodes.test.ts`

### T-22 — Testar estados de interface

- **Tipo:** Test
- **Requisitos:** FR-05, FR-06; AC-05.1, AC-06.1–AC-06.2, NFR-02
- **Descrição:** testar estados reutilizáveis de loading, vazio e erro.
- **Critérios de aceite:** verifica `role="status"`, as mensagens de busca sem resultados/cidade sem cobertura, `role="alert"` e uma chamada de retry por ativação.
- **Dependências:** T-09–T-11
- **Arquivos prováveis:** `tests/unit/states.test.tsx`

### T-23 — Testar SearchBar

- **Tipo:** Test
- **Requisitos:** FR-01; AC-01.1, AC-01.5–AC-01.6, NFR-02
- **Descrição:** testar submit manual, input inválido, caracteres especiais e teclado.
- **Critérios de aceite:** callback chamado uma vez por submit válido; nenhum callback para vazio/só espaços; caracteres preservados; input tem label e é operável por teclado.
- **Dependências:** T-12
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`

### T-24 — Testar serviço de geocoding

- **Tipo:** Test
- **Requisitos:** FR-01, FR-05; AC-01.1–AC-01.6, AC-05.4, NFR-10
- **Descrição:** testar `searchCities` com `fetch` mockado.
- **Critérios de aceite:** validar URL/parâmetros, mapeamento de campos opcionais, no máximo cinco resultados, lista vazia, caracteres codificados, HTTP/network error e timeout de 10 segundos; nenhuma chamada real.
- **Dependências:** T-05
- **Arquivos prováveis:** `tests/unit/geocodingService.test.ts`

### T-25 — Testar serviço de forecast

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03, FR-05; AC-02.1, AC-03.1–AC-03.2, AC-05.2–AC-05.3, NFR-07, NFR-10
- **Descrição:** testar query, parsing e normalização do forecast com `fetch` mockado.
- **Critérios de aceite:** cobrir timezone, cinco datas, associação por data com lacuna intermediária, arrays/campos opcionais, erro HTTP/rede, payload estrutural inválido, timeout e ausência de `apikey`/`customer-`.
- **Dependências:** T-06
- **Arquivos prováveis:** `tests/unit/forecastService.test.ts`

### T-26 — Testar estado de busca

- **Tipo:** Test
- **Requisitos:** FR-01, FR-05, FR-06; AC-01.1–AC-01.5, AC-05.4–AC-05.5, AC-06.1–AC-06.2
- **Descrição:** testar transições do hook de busca com services mockados.
- **Critérios de aceite:** cobre idle/loading/success/empty/error, retry, input vazio e respostas de busca fora de ordem; loading termina em sucesso/falha.
- **Dependências:** T-07, T-24
- **Arquivos prováveis:** `tests/unit/useWeatherSearch.test.ts`

### T-27 — Testar fluxo do hook meteorológico

- **Tipo:** Test
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.1–AC-02.6, AC-03.1–AC-03.2, AC-05.1–AC-05.6, AC-06.1–AC-06.2
- **Descrição:** testar o hook com services mockados, controlando relógio e ordem das respostas.
- **Critérios de aceite:** cobre loading/success/empty/error, forecast com lacuna, parcial, sem cobertura, timestamp ausente/antigo, timeout/retry e troca A→B com resposta tardia de A ignorada.
- **Dependências:** T-08, T-24–T-26
- **Arquivos prováveis:** `tests/unit/useWeatherForecast.test.ts`

### T-28 — Testar CurrentWeather

- **Tipo:** Test
- **Requisitos:** FR-02; AC-02.1–AC-02.9, AC-05.2, NFR-02
- **Descrição:** testar apresentação de clima atual completo, parcial, stale, sem timestamp e códigos WMO desconhecidos.
- **Critérios de aceite:** verifica conteúdo pt-BR, unidade, condição/ícone, umidade %, vento km/h, precipitação mm, pressão hPa, aviso de duas horas, fallback de horário e atributos acessíveis.
- **Dependências:** T-13
- **Arquivos prováveis:** `tests/unit/CurrentWeather.test.tsx`

### T-29 — Testar ForecastCard

- **Tipo:** Test
- **Requisitos:** FR-03, FR-05; AC-03.2, AC-05.2, NFR-02
- **Descrição:** testar resumo diário completo e parcial.
- **Critérios de aceite:** verifica data local, rótulo WMO, mín/máx e marcadores de ausência.
- **Dependências:** T-14
- **Arquivos prováveis:** `tests/unit/ForecastCard.test.tsx`

### T-30 — Testar ForecastList

- **Tipo:** Test
- **Requisitos:** FR-03, FR-05; AC-03.1–AC-03.2, AC-05.2
- **Descrição:** testar sequência completa e lacuna intermediária no array de forecast.
- **Critérios de aceite:** renderiza cinco datas consecutivas em timezone controlado; a lacuna permanece na data correta, sem deslocar os dados seguintes.
- **Dependências:** T-15, T-29
- **Arquivos prováveis:** `tests/unit/ForecastList.test.tsx`

### T-31 — Testar alternância de unidade

- **Tipo:** Test
- **Requisitos:** FR-04; AC-04.1–AC-04.4
- **Descrição:** testar toggle e valores derivados com dados determinísticos.
- **Critérios de aceite:** valida exemplos C/F, Celsius após nova sessão, atualização de todos os valores visíveis e ausência de chamada de rede ao alternar.
- **Dependências:** T-16, T-19
- **Arquivos prováveis:** `tests/unit/UnitToggle.test.tsx`

### T-32 — Testar integração em App e fluxos E2E

- **Tipo:** Test
- **Requisitos:** FR-01–FR-06; AC-01.1–AC-06.2, NFR-06
- **Descrição:** testar a integração com Playwright, interceptando as duas rotas Open-Meteo com respostas determinísticas.
- **Critérios de aceite:** busca→seleção→clima/forecast→toggle passa em desktop e em viewport mobile de 320 × 568; vazio, falhas, parcial com data intermediária ausente, timeout e retry também são cobertos; reload restaura Celsius sem cidade; sem geolocalização/persistência; URLs HTTPS sem `apikey`/`customer-`; nenhuma chamada real.
- **Dependências:** T-18, T-22–T-31
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, `playwright.config.ts`

## Entrega 8 — Hardening e release

### T-33 — Verificar responsividade e acessibilidade

- **Tipo:** Test
- **Requisitos:** NFR-01, NFR-02
- **Descrição:** validar layout mobile/desktop e acessibilidade dos fluxos principais.
- **Critérios de aceite:** sem rolagem horizontal em 320×568 e 1280×720; verificação automatizada sem violações críticas/graves; controles alcançáveis por teclado com foco visível; leitor de tela anuncia loading e erro.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, relatório de verificação em documentação de release.

### T-34 — Medir desempenho de interface

- **Tipo:** Test
- **Requisitos:** NFR-03
- **Descrição:** medir latência de renderização com rede simulada e instantânea.
- **Critérios de aceite:** em 20 execuções por fluxo, ao menos 19 mostram loading em até 200 ms e dados em até 1 s após resposta.
- **Dependências:** T-32
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`, relatório de verificação em documentação de release.

### T-35 — Verificar compatibilidade de navegadores

- **Tipo:** Test
- **Requisitos:** NFR-05
- **Descrição:** executar os fluxos na matriz de navegadores e plataformas suportada.
- **Critérios de aceite:** versões major atual/anterior de Chrome, Edge, Firefox e Safari desktop, Safari iOS e Chrome Android completam busca, seleção, consulta e alternância; matriz testada registrada.
- **Dependências:** T-32
- **Arquivos prováveis:** `playwright.config.ts`, relatório de verificação em documentação de release.

### T-36 — Validar usabilidade com participantes

- **Tipo:** Test
- **Requisitos:** NFR-09
- **Descrição:** conduzir teste moderado com cinco participantes representativos das personas, cobrindo as três tarefas previstas.
- **Critérios de aceite:** pelo menos quatro dos cinco participantes concluem sem ajuda cada tarefa: buscar cidade e ver clima atual; consultar previsão de cinco dias; alternar unidade. Resultados registrados antes do release.
- **Dependências:** T-32, T-33
- **Arquivos prováveis:** roteiro e relatório de teste em documentação de release.

### T-37 — Confirmar gate de conformidade Open-Meteo

- **Tipo:** Infra
- **Requisitos:** NFR-10
- **Descrição:** documentar autorização vigente dos endpoints públicos sem `apikey`/`customer-`, cobertura, cotas e atribuição para o tipo de implantação pretendido.
- **Critérios de aceite:** registro do endpoint/plano, fonte oficial e data de verificação; atribuição aplicada; nenhuma URL usa `customer-` e nenhuma requisição envia `apikey`; se os termos não autorizarem o uso, release bloqueado e provedor reavaliado.
- **Dependências:** T-06, T-25
- **Arquivos prováveis:** documentação de release; `src/services/weatherService.ts` somente se URL/parametrização precisar ser corrigida.

### T-38 — Executar gates finais do projeto

- **Tipo:** Test
- **Requisitos:** FR-01–FR-06; NFR-01–NFR-10
- **Descrição:** executar os comandos de qualidade definidos pelo repositório após implementação, testes e gates de release.
- **Critérios de aceite:** `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` passam; falhas são corrigidas ou registradas como bloqueios antes do release.
- **Dependências:** T-32–T-37
- **Arquivos prováveis:** sem arquivos de produto; correções nos arquivos das tarefas anteriores quando necessário.

## Matriz de Rastreabilidade FR → Tarefas

| Requisito funcional da spec | Tarefas de implementação | Tarefas de teste | Lacunas |
|---|---|---|---|
| **FR-01 — Buscar e selecionar cidade** | T-12 SearchBar; T-05 geocoding; T-07 estado de busca; T-18 integração | T-23 SearchBar; T-24 service de geocoding; T-26 hook de busca; T-32 E2E | Nenhuma identificada. |
| **FR-02 — Consultar clima atual** | T-06 service de forecast; T-08 hook de forecast; T-13 CurrentWeather; T-18 integração | T-25 service de forecast; T-27 hook meteorológico; T-28 componente; T-32 E2E | Nenhuma identificada. |
| **FR-03 — Consultar previsão de cinco dias** | T-03 datas/timezone; T-06 service de forecast; T-08 hook; T-14 ForecastCard; T-15 ForecastList; T-18 integração | T-20 datas; T-25 service; T-27 hook; T-29 card; T-30 lista; T-32 E2E | Nenhuma identificada. |
| **FR-04 — Alternar unidade de temperatura** | T-02 conversão; T-16 UnitToggle; T-18 integração | T-19 conversão; T-31 toggle; T-32 E2E | Nenhuma identificada. |
| **FR-05 — Informar e recuperar falhas de consulta** | T-05/T-06 services; T-07/T-08 hooks; T-10 EmptyState; T-11 ErrorState; T-18 integração | T-22 estados; T-24/T-25 services; T-26/T-27 hooks; T-32 E2E | Nenhuma identificada. |
| **FR-06 — Informar carregamento** | T-07/T-08 hooks; T-09 LoadingState; T-18 integração | T-22 estados; T-26/T-27 hooks; T-32 E2E | Nenhuma identificada. |

## Prioridade e Tamanho

**Prioridade:** P0 desbloqueia a primeira fatia utilizável (busca e clima atual); P1 completa o MVP e os gates necessários antes do release; P2 seria trabalho opcional pós-MVP. Não há tarefas P2 neste backlog, pois todas estão ligadas a requisitos aceitos ou a gates de lançamento.

**Tamanho relativo:** P é uma mudança/teste focalizado; M cobre um módulo ou vários cenários de uma fronteira; G envolve integração ampla, matriz de ambientes ou coordenação manual. G é um alerta para planejar checkpoints, não autorização para ampliar a tarefa.

| ID | Prioridade | Tamanho |
|---|---|---|
| T-01 | P0 | M |
| T-02 | P1 | P |
| T-03 | P0 | P |
| T-04 | P0 | P |
| T-05 | P0 | M |
| T-06 | P0 | M |
| T-07 | P0 | M |
| T-08 | P0 | M |
| T-09 | P0 | P |
| T-10 | P0 | P |
| T-11 | P0 | P |
| T-12 | P0 | M |
| T-13 | P0 | M |
| T-14 | P1 | P |
| T-15 | P1 | P |
| T-16 | P1 | P |
| T-17 | P0 | M |
| T-18 | P0 | G |
| T-19 | P1 | P |
| T-20 | P0 | P |
| T-21 | P0 | P |
| T-22 | P0 | P |
| T-23 | P0 | P |
| T-24 | P0 | M |
| T-25 | P0 | M |
| T-26 | P0 | M |
| T-27 | P0 | M |
| T-28 | P0 | P |
| T-29 | P1 | P |
| T-30 | P1 | P |
| T-31 | P1 | P |
| T-32 | P1 | G |
| T-33 | P1 | M |
| T-34 | P1 | M |
| T-35 | P1 | G |
| T-36 | P1 | G |
| T-37 | P1 | M |
| T-38 | P1 | P |

## Sequência de Fatias Verticais

Executar e demonstrar cada fatia ponta a ponta. T-18 é a composição cumulativa do App: integrá-la progressivamente, começando pela busca e clima atual, e acrescentar forecast e unidade nas fatias seguintes; a tarefa só é concluída quando todos os seus critérios finais passam.

| Ordem | Resultado visível | Tarefas de implementação | Validação associada |
|---|---|---|---|
| 1 — Busca e seleção | A pessoa envia um nome, vê até cinco resultados e seleciona uma cidade; vazio, erro e carregamento têm feedback. | T-01, T-05, T-07, T-09–T-12, T-17, T-18 (etapa de busca) | T-22, T-23, T-24, T-26 |
| 2 — Clima atual | A cidade selecionada mostra temperatura, condição pt-BR, horário de referência e aviso de dados desatualizados. | T-06, T-08, T-13, T-18 (etapa de clima atual) | T-25, T-27, T-28 |
| 3 — Previsão diária | A tela mostra cinco datas no timezone da cidade, inclusive quando há lacuna de dados. | T-03, T-14, T-15, T-18 (etapa de forecast) | T-20, T-29, T-30 |
| 4 — Unidade | A pessoa alterna C/F e todos os valores mudam sem nova chamada. | T-02, T-16, T-18 (etapa de unidade) | T-19, T-31 |
| 5 — Release | Fluxos completos, NFRs e conformidade do provedor verificados. | — | T-32–T-38 |