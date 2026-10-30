Prompts
Use estes prompts no Copilot Chat. Adapte conforme necessário.

P1.1 — Entender o projeto
Explique a estrutura deste repositório. Quais pastas guardam a especificação,
o plano, as tarefas, o código e os testes? Qual é o fluxo de trabalho proposto?
P1.2 — Entender as instruções
Leia `.github/copilot-instructions.md` e resuma em 5 bullets as convenções mais
importantes que devo seguir neste projeto.
P1.3 — Entender os agentes
Explique o papel de cada agente em `.github/agents/`. Em que ordem eu deveria
usá-los seguindo Spec-Driven Development?
P1.4 — Validar o ambiente
Quais comandos pnpm este projeto disponibiliza? Para cada um, explique o que faz
e quando devo rodar.
P1.5 — Diagnóstico de problema (se algo falhar)
Ao rodar `pnpm dev` recebi o seguinte erro:

<cole o erro aqui>

Diagnostique a causa provável e proponha a correção passo a passo.
P1.6 — Preparar o mindset SDD
Vou construir um Weather App usando Spec-Driven Development. Liste, em ordem,
os artefatos que devo produzir ANTES de escrever qualquer código de feature e
por que cada um importa.
P1.7 — Tour de Agent Mode
Estou no Agent Mode. Sem alterar nada ainda, descreva como você abordaria a
construção deste Weather App passo a passo, respeitando o fluxo
Spec → Plan → Tasks → Code → Test → Review.
P1.8 — Checklist final
Gere um checklist objetivo para confirmar que meu ambiente está 100% pronto
para começar o Module 02 deste treinamento.

Prompts — (Discovery)
Dica: estes prompts funcionam bem no Copilot Chat (Ask). Para gerar o arquivo direto, use o Agent Mode.

P2.1 — Análise inicial do briefing
Aja como um Business Analyst sênior. A partir do briefing abaixo, produza uma
análise de discovery estruturada com as seções: Contexto, Requisitos Funcionais,
Requisitos Não-Funcionais, Riscos, Perguntas em Aberto e Suposições.

Briefing:
"""
Sua empresa solicitou uma aplicação de previsão do tempo. Usuários devem poder:
buscar cidades, ver o clima atual, ver a previsão de 5 dias, alternar entre
Celsius e Fahrenheit e usar em dispositivos móveis.
"""

Salve o resultado em `specs/discovery.md`.
P2.2 — Separar funcional de não-funcional
Revise minha lista de requisitos e me diga, item a item, se cada um é funcional
ou não-funcional. Aponte itens classificados incorretamente e sugira pelo menos
4 requisitos não-funcionais que provavelmente estão faltando para um web app
de clima (performance, acessibilidade, responsividade, disponibilidade).
P2.3 — Caçar ambiguidades (PM cético)
Aja como um Product Manager cético fazendo discovery. Liste todas as
ambiguidades e lacunas deste briefing de Weather App. Para cada ponto, gere uma
"pergunta em aberto" e descreva o IMPACTO de seguir sem resposta.
P2.4 — Mapa de riscos
Liste os principais riscos técnicos e de produto para este Weather App. Para
cada risco, forneça: probabilidade (baixa/média/alta), impacto e uma estratégia
de mitigação. Formate como tabela markdown.
P2.5 — Personas e objetivos
Proponha 2 a 3 personas para este Weather App. Para cada persona, descreva o
objetivo principal, o contexto de uso (mobile/desktop) e a métrica de sucesso
do ponto de vista dela.
P2.6 — Fechar decisões (trade-offs)
Vou fechar as seguintes decisões para destravar a especificação:
- Fonte de dados: Open-Meteo (sem API key)
- "5 dias" = hoje + 4 dias
- Unidade padrão: Celsius
- Sem autenticação e sem persistência de servidor
- Idioma da UI: pt-BR

Adicione uma seção "Decisões" ao `specs/discovery.md` registrando cada decisão
com uma breve justificativa e o que ela resolve das perguntas em aberto.
P2.7 — Auto-crítica do discovery
Releia `specs/discovery.md` e critique como um arquiteto de soluções: o que
ainda está vago, o que pode gerar retrabalho e o que falta para começar a
especificação com segurança?
P2.8 — Resumo executivo
Gere um resumo executivo de 5 linhas do discovery, adequado para apresentar a
stakeholders não-técnicos.



Prompts — (Specification)
Para gerar/editar arquivos diretamente, use o Agent Mode com o Spec Agent (.github/agents/spec.agent.md).

P3.1 — Gerar a especificação
Use `specs/discovery.md` como entrada. Gere uma especificação de produto
completa em `specs/weather-app-spec.md` com as seções: Overview, Functional
Requirements, User Stories, Acceptance Criteria, Non-Functional Requirements,
Edge Cases, Assumptions, Risks, Out of Scope e Open Questions.

Não escreva código. Cada requisito funcional deve ter pelo menos um critério de
aceite verificável.
P3.2 — User stories com valor
Reescreva as User Stories no formato "Como [persona], quero [ação] para
[valor]". Use as personas definidas no discovery. Garanta pelo menos 5 stories,
cada uma claramente conectada a um requisito funcional.
P3.3 — Critérios de aceite (Given/When/Then)
Para cada requisito funcional da spec, escreva critérios de aceite no formato
Given/When/Then. Os critérios devem ser objetivos e testáveis (servirão de base
para os testes automatizados nos módulos seguintes).
P3.4 — Edge cases
Liste os edge cases que esta especificação ainda não cobre para um Weather App:
cidade inexistente, input vazio, caracteres especiais, falha de API, timeout,
geocoding sem resultados e resposta parcial. Para cada um, descreva o
comportamento esperado da aplicação.
P3.5 — Revisão crítica
Revise `specs/weather-app-spec.md` e identifique:
- Requisitos faltantes
- Ambiguidades
- Inconsistências
- Critérios de aceite fracos ou não verificáveis
Liste cada problema com uma sugestão de correção.
P3.6 — Aprofundar e tornar production-ready
Torne esta especificação mais detalhada e pronta para produção, sem inflar com
texto desnecessário. Foque em precisão e testabilidade.
P3.7 — Validar prontidão
Esta especificação é suficiente para desenvolver a aplicação sem novas perguntas?
Se não, liste exatamente o que falta. Se sim, confirme e garanta que a seção
"Out of Scope" está completa.
P3.8 — Rastreabilidade
Crie uma tabela de rastreabilidade ligando cada User Story aos seus Acceptance
Criteria e aos requisitos não-funcionais relevantes. Isso vai facilitar a
quebra de tarefas e os testes.


Prompts — (Technical Plan)
Use o Agent Mode com o Plan Agent (.github/agents/plan.agent.md).

P4.1 — Gerar o plano técnico
Use `specs/weather-app-spec.md` como fonte da verdade. Gere
`plans/weather-app-plan.md` com as seções: Architecture, Tech Stack, Project
Structure, Data Model, Data Flow, External APIs, State Management, Error
Handling, Testing Strategy e Risks & Trade-offs.

Não gere o código final — defina decisões e contratos (tipos/interfaces).
Prefira simplicidade; evite over-engineering.
P4.2 — Modelo de dados (contratos TypeScript)
Proponha as interfaces TypeScript principais para este Weather App: City,
CurrentWeather, ForecastDay, WeatherData e o tipo Unit ('celsius' | 'fahrenheit').
Baseie os campos nos dados disponíveis na Open-Meteo. Inclua comentários curtos
explicando cada campo.
P4.3 — Endpoints da Open-Meteo
Documente os endpoints de geocoding e de forecast da Open-Meteo necessários para
atender a spec. Para cada um: URL, parâmetros relevantes (current, daily,
timezone), e um exemplo resumido de resposta JSON. Indique como mapear a resposta
para os tipos do modelo de dados.
P4.4 — Arquitetura e estrutura
Proponha a arquitetura em camadas e a estrutura de pastas de `src/` para separar
apresentação (components), orquestração/estado (hooks), acesso a dados (services)
e funções puras (lib). Justifique a separação de responsabilidades e como isso
facilita os testes.
P4.5 — Estado e tratamento de erros
Defina a estratégia de estado: onde o estado vive, quais estados explícitos
existem (idle, loading, success, error, empty) e como a conversão Celsius/
Fahrenheit é feita derivando na renderização (sem novo request). Em seguida,
defina a estratégia de tratamento de erros (rede, API, timeout, resposta parcial).
P4.6 — Estratégia de testes e trade-offs
Defina a Testing Strategy: o que cobrir com Vitest (funções puras de conversão,
services com mock de fetch, componentes nos estados loading/erro/vazio/sucesso) e
o que cobrir com Playwright (fluxos E2E + viewport mobile). Liste os principais
trade-offs técnicos do plano e alternativas consideradas.
P4.7 — Diagrama de fluxo (mermaid)
Gere um diagrama mermaid representando o fluxo de dados: input de busca →
service de geocoding → seleção de cidade → service de forecast → hook de estado →
componentes de UI. Inclua os caminhos de erro e vazio.
P4.8 — Revisão do plano
Revise `plans/weather-app-plan.md`: o plano cobre todos os requisitos da spec?
Há decisões faltando, over-engineering ou contradições com as instruções do
projeto em `.github/copilot-instructions.md`?


Prompts — (Tasks)
Use o Agent Mode com o Task Agent (.github/agents/task.agent.md).

P5.1 — Gerar o backlog
Use `plans/weather-app-plan.md` como entrada. Gere `tasks/weather-app-tasks.md`
com tarefas no formato T-NN. Para cada tarefa inclua: ID, título, descrição
curta, critérios de aceite, dependências, arquivos prováveis e tipo
(UI/Data/Test/Infra). Organize por entrega e ordene por dependência.
P5.2 — Forçar granularidade
Revise as tarefas. Quais estão grandes demais (mais de 1-2 arquivos relevantes
ou misturando UI + dados + testes)? Quebre cada uma dessas em subtarefas menores
e testáveis, mantendo o formato T-NN.
P5.3 — Critérios de aceite
Para cada tarefa, garanta critérios de aceite objetivos e verificáveis,
rastreáveis aos requisitos da spec quando possível.
P5.4 — Dependências e ordem
Adicione as dependências entre as tarefas e reordene o backlog para respeitar a
ordem de implementação: tipos → funções puras → services → hook → componentes →
integração → testes → hardening.
P5.5 — Tarefas de teste explícitas
Garanta tarefas dedicadas a: testes unitários da conversão de unidade, testes do
service com mock de fetch, testes de componentes nos estados loading/erro/vazio,
e testes E2E do fluxo principal (incluindo viewport mobile).
P5.6 — Rastreabilidade
Crie uma tabela ligando cada requisito funcional da spec às tarefas que o
implementam. Aponte qualquer requisito que ainda não tenha tarefa correspondente.
P5.7 — Estimar e priorizar
Classifique as tarefas por prioridade (P0/P1/P2) e por tamanho relativo
(P/M/G). Sugira uma sequência de entrega em "fatias verticais" que produza algo
visível o quanto antes.
P5.8 — Preparar delegação ao Coding Agent
Escolha a tarefa T-01 e gere um prompt de implementação completo e
autocontido (contexto + critérios de aceite + arquivos) pronto para entregar ao
Coding Agent no próximo módulo.



Prompts — (Building the UI)
Use o Agent Mode com o Code Agent (.github/agents/code.agent.md) e o prompt implementation-prompt. Implemente uma tarefa por vez.

P6.1 — Tipos + fixture
Implemente os tipos em `src/types/weather.ts` conforme o plano (Unit, City,
CurrentWeather, ForecastDay, WeatherData). Em seguida, crie um objeto mock de
WeatherData (cidade de exemplo, clima atual e 5 dias) que eu possa usar para
desenvolver a UI sem a API.
P6.2 — SearchBar
Implemente o componente `src/components/SearchBar.tsx`. Requisitos:
- input com label acessível e role="search"
- não dispara busca com input vazio (trim)
- prop onSearch(city: string) e prop disabled
- estilo Tailwind glassmorphism conforme as instruções do projeto
P6.3 — UnitToggle
Implemente `src/components/UnitToggle.tsx` com dois botões (°C/°F). Use
aria-pressed para indicar o ativo, role="group" com aria-label, e navegação por
teclado. Props: unit e onChange.
P6.4 — CurrentWeather
Implemente `src/components/CurrentWeather.tsx`: hero com temperatura grande,
ícone do clima (de lib/weatherCodes), condição e métricas (umidade, vento,
precipitação, pressão). Use lib/temperature para exibir na unidade atual.
Props: city, current, unit.
P6.5 — ForecastList + ForecastCard
Implemente `src/components/ForecastList.tsx` e `ForecastCard.tsx`. Grid
responsivo grid-cols-2 sm:grid-cols-3 lg:grid-cols-5. Cada card: rótulo do dia
(de lib/format), ícone, máx/mín (na unidade atual) e probabilidade de chuva.
P6.6 — Estados
Implemente `src/components/states/LoadingState.tsx`, `ErrorState.tsx` e
`EmptyState.tsx`. Loading com role="status"; Error com mensagem e botão "tentar
novamente" (prop onRetry); Empty com título e dica.
P6.7 — Integrar no App
Monte o layout completo em `src/App.tsx` usando o mock de WeatherData. Header
com marca + SearchBar + UnitToggle. Conteúdo alternando entre os estados
(idle/loading/empty/error/success). Mantenha unit como estado de UI e converta
as temperaturas na renderização.
P6.8 — Revisão de UI e acessibilidade
Revise os componentes criados quanto a acessibilidade (roles, labels, foco,
contraste) e responsividade (320px a desktop). Liste melhorias concretas e
aplique as mais importantes.



Prompts — (Integrating APIs)
Use o Code Agent + implementation-prompt. Uma tarefa por vez.

P7.1 — Service de geocoding
Implemente `searchCities(name: string): Promise<City[]>` em
`src/services/weatherService.ts` usando o endpoint de geocoding da Open-Meteo.
Regras: retornar [] para input vazio sem chamar a rede; mapear results para City[];
lançar WeatherServiceError em resposta não-ok. Use encodeURIComponent no nome.
P7.2 — Service de forecast
Implemente `getWeather(city: City): Promise<WeatherData>` chamando o endpoint de
forecast com current e daily. Mapeie a resposta (arrays paralelos de daily) para
ForecastDay[] de 5 itens e current para CurrentWeather. Lance WeatherServiceError
se current ou daily estiverem ausentes (resposta incompleta).
P7.3 — Timeout e erros
Adicione um helper fetchWithTimeout usando AbortController (10s). Converta
AbortError em "A requisição demorou demais." e falhas de rede em "Falha de rede."
Ambas como WeatherServiceError. Garanta clearTimeout no finally.
P7.4 — Hook useWeather
Implemente `src/hooks/useWeather.ts`. Exponha: status
('idle'|'loading'|'success'|'error'|'empty'), data, cities, error, query e as
ações search(name), selectCity(city) e retry(). search deve buscar cidades e,
havendo resultado, carregar o clima da primeira; sem resultado, status 'empty'.
retry refaz a última operação.
P7.5 — Conectar o App
Substitua o mock no App pelo hook useWeather. Renderize o estado correto
(idle/loading/empty/error/success). Mantenha unit como estado de UI e passe para
os componentes de apresentação. ErrorState deve chamar retry.
P7.6 — Diagnóstico de integração
Estou recebendo <descreva o comportamento/erro> ao integrar a Open-Meteo.
Verifique o mapeamento da resposta, os parâmetros da URL e o tratamento de erro.
Aponte a causa provável e a correção.
P7.7 — Revisão da camada de dados
Revise `src/services/weatherService.ts` e `src/hooks/useWeather.ts`: o acesso a
dados está realmente isolado? Os erros são tratados de forma consistente? Há
algum estado duplicado entre o hook e os componentes?



Prompts — (Testing)
Use o Test Agent (.github/agents/test.agent.md) + test-prompt.

P8.1 — Testes de conversão
Gere testes Vitest para `src/lib/temperature.ts` em
`tests/unit/temperature.test.ts`. Cubra: 0°C→32°F, 100°C→212°F, -40°C→-40°F,
convertTemperature por unidade, formatTemperature (arredondamento + símbolo) e
unitLabel.
P8.2 — Testes de libs
Gere testes para `src/lib/weatherCodes.ts` (código conhecido + fallback de
desconhecido) e `src/lib/format.ts` (índice 0 → "Hoje", 1 → "Amanhã", demais →
dia da semana; getShortDate).
P8.3 — Testes do service (mock de fetch)
Gere testes para `src/services/weatherService.ts` usando vi.stubGlobal('fetch',
...). Cubra: searchCities com input vazio (não chama fetch), mapeamento de
results, results ausente (vazio) e resposta não-ok (erro). Para getWeather:
mapeamento de current+daily para 5 dias, precipitação null → 0, e resposta
incompleta (current/daily ausentes) lançando WeatherServiceError.
P8.4 — Testes de componentes
Gere testes com Testing Library para SearchBar (input vazio não dispara onSearch;
termo dispara com o valor) e para a conversão de unidade: ao renderizar
UnitToggle + CurrentWeather com temperatura 0°C, clicar em °F deve exibir 32°.
Use queries acessíveis (getByRole, getByLabelText).
P8.5 — E2E do fluxo principal
Gere um teste Playwright em `tests/e2e/weather.spec.ts`. Use page.route para
mockar geocoding e forecast com respostas determinísticas. Fluxo: preencher a
busca, clicar em Buscar, ver o nome da cidade, ver a região "Previsão de 5 dias"
e, ao clicar em °F, ver a temperatura convertida.
P8.6 — E2E de estado vazio e mobile
Adicione dois testes E2E: (1) quando o geocoding retorna {} (sem results), a UI
mostra "Nenhuma cidade encontrada"; (2) em viewport mobile (375x812), o fluxo
principal de busca renimage o clima corretamente.
P8.7 — Cobertura e lacunas
Rode mentalmente os edge cases da spec contra a suíte atual. Quais casos ainda
não têm teste? Gere os testes faltantes priorizando os de maior risco (conversão
incorreta, falha de API, resposta parcial).
P8.8 — Estabilidade dos testes
Revise os testes E2E quanto a flakiness: há esperas implícitas frágeis ou
seletores não-acessíveis? Sugira melhorias para torná-los determinísticos.


Prompts — (Hardening)
P9.1 — Auditoria de acessibilidade
Faça uma auditoria de acessibilidade do app (src/). Verifique navegação por
teclado, foco visível, roles/labels semânticos (busca, grupo de unidade, status,
alert de erro) e contraste. Liste problemas em ordem de severidade e proponha
correções mínimas e idiomáticas em React + Tailwind.
P9.2 — Resiliência a falhas
Revise o tratamento de falhas em src/services/weatherService.ts e
src/hooks/useWeather.ts. Garanta timeout claro, mensagens amigáveis e um botão de
retry que refaz a última operação. Sugira testes que simulem rede offline.
P9.3 — Respostas parciais
Identifique todos os campos da resposta da Open-Meteo que podem vir null/ausentes
e garanta fallback seguro na UI (ex.: "—" ou 0), sem NaN/undefined visível.
Mostre os ajustes em mapeamento e componentes.
P9.4 — Edge cases → testes
Liste os edge cases da spec (specs/weather-app-spec.md) que ainda não têm teste e
gere testes Vitest/Playwright para eles: busca vazia, só espaços, caracteres
especiais, geocoding sem resultados e forecast incompleto.
P9.5 — Performance e UX
Sugira melhorias de performance/UX de baixo risco: memoização onde fizer
sentido, aria-busy durante loading, foco no resultado após busca, estados
hover/disabled coerentes. Aplique as que forem claramente benéficas.
P9.6 — Revisão final de qualidade
Rode lint, build, testes unitários e E2E. Se algo falhar, diagnostique e corrija.
Confirme que todos os critérios de aceite da spec estão atendidos.


Prompts — (Review)
Use o Review Agent (.github/agents/review.agent.md) + review-prompt.

P10.1 — Auto-revisão geral
Revise as mudanças desta branch como um revisor sênior. Foque em: corretude,
aderência à spec (specs/weather-app-spec.md), segurança, acessibilidade,
tratamento de erros e clareza. Liste achados por severidade com sugestão de
correção.
P10.2 — Revisão focada em segurança
Faça uma revisão de segurança do código de acesso a dados (src/services). Há
risco de injeção, vazamento de dados, uso inseguro de URLs ou ausência de
timeout? Aplique o OWASP Top 10 ao que for relevante para um app front-end.
P10.3 — Triagem do Copilot Code Review
Para cada comentário do Copilot Code Review abaixo, diga se devo aceitar,
discutir ou recusar — com justificativa curta baseada na spec e nas convenções
do projeto:
[cole os comentários]
P10.4 — Verificar validações SDD
Explique o que cada workflow .github/workflows/validate-spec.yml,
validate-plan.yml e validate-tasks.yml verifica e o que eu preciso garantir para
que passem neste PR.
P10.5 — Descrição do PR
Escreva a descrição deste Pull Request seguindo o template do repositório:
resumo do que foi feito, por quê, links para specs/plans/tasks, como testar e
checklist de qualidade.
P10.6 — Resposta a um comentário
Escreva uma resposta profissional e concisa ao comentário de revisão abaixo,
indicando o que mudei (ou por que mantive a decisão):
[cole o comentário]
