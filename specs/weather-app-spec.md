# Especificação de Produto — Weather App

## Overview

O Weather App é uma aplicação web em pt-BR para pessoas que precisam consultar o clima atual de uma localidade e planejar atividades nos próximos dias. O segmento primário é quem decide como se preparar para o dia; o secundário é quem planeja atividades em outra cidade. O fluxo deve ser utilizável em dispositivos móveis e desktop. Joana representa um perfil de acessibilidade a ser atendido, não uma alegação de pesquisa já realizada.

O escopo acordado inclui busca de cidades, consulta do clima atual, previsão de cinco dias (hoje e os quatro dias seguintes) e alternância de temperatura entre Celsius e Fahrenheit. A unidade inicial será Celsius; a interface será em pt-BR. Open-Meteo é o provedor escolhido; o app usará apenas endpoints públicos, sem API key e sem chamadas a recursos com prefixo `customer-`. Não haverá autenticação nem persistência de servidor.

Camila e Marcos são personas-alvo adotadas para delimitar o MVP a partir do briefing. A validação de usabilidade com usuários é uma condição de lançamento descrita em NFR-09, mas não impede a aprovação do escopo funcional.

## Functional Requirements

- **FR-01 — Buscar e selecionar cidade:** o usuário deve poder enviar manualmente uma busca pelo nome de uma localidade em qualquer país indexado pelo provedor e selecionar um dos até cinco resultados retornados. A busca não faz sugestões enquanto a pessoa digita.
- **FR-02 — Consultar clima atual:** após selecionar uma cidade, o usuário deve poder ver temperatura, condição meteorológica rotulada em pt-BR com ícone correspondente, umidade relativa (%), velocidade do vento (km/h), precipitação (mm), pressão de superfície (hPa) e horário de referência/observação retornado pela fonte.
- **FR-03 — Consultar previsão de cinco dias:** o usuário deve poder ver resumos diários de hoje e dos quatro dias seguintes, no fuso horário local da cidade selecionada, com data, condição rotulada em pt-BR e temperaturas mínima e máxima.
- **FR-04 — Alternar unidade de temperatura:** o usuário deve poder alternar entre Celsius e Fahrenheit; Celsius é a unidade inicial.
- **FR-05 — Informar e recuperar falhas de consulta:** se a busca ou os dados meteorológicos não puderem ser carregados, o sistema deve informar o usuário e oferecer uma ação explícita para tentar novamente.
- **FR-06 — Informar carregamento:** enquanto uma busca ou consulta meteorológica estiver em andamento, o sistema deve indicar que está carregando e encerrar esse estado quando houver sucesso ou falha.

## User Stories

- **US-01 (FR-01):** Como Camila, quero buscar e selecionar minha cidade para consultar as condições do tempo no lugar onde moro.
- **US-02 (FR-02):** Como Camila, quero ver o clima atual da minha cidade para decidir como me preparar para sair.
- **US-03 (FR-01):** Como Marcos, quero buscar e selecionar uma cidade de destino para consultar a previsão do lugar onde pretendo realizar atividades.
- **US-04 (FR-03):** Como Marcos, quero ver a previsão de hoje e dos quatro dias seguintes para escolher quando realizar atividades ao ar livre.
- **US-05 (FR-04):** Como Camila, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade que prefiro.
- **US-06 (FR-05):** Como Joana, quero receber uma mensagem acessível quando os dados não puderem ser carregados para entender que a consulta falhou e não confiar em informações indisponíveis.
- **US-07 (FR-06):** Como Camila, quero saber quando uma busca ou consulta ainda está sendo processada para entender que o app está respondendo.

## Acceptance Criteria

Cada critério usa Given/When/Then e deve ser validado com respostas de teste determinísticas. O horário do clima atual é o horário de referência/observação retornado pela fonte, não o horário local em que a resposta chegou ao navegador. A precisão de exibição das temperaturas é definida nos critérios de FR-04.

### FR-01 — Buscar e selecionar cidade

- **AC-01.1 — Busca com resultados**
  - **Given** a tela de busca está disponível e uma consulta corresponde a pelo menos uma cidade
  - **When** o usuário envia o nome da cidade
  - **Then** o app exibe até cinco resultados correspondentes como opções selecionáveis, sem iniciar a busca antes do envio.
- **AC-01.2 — Seleção de resultado**
  - **Given** o app exibe resultados de busca
  - **When** o usuário seleciona uma opção
  - **Then** essa localidade fica selecionada para as consultas de clima atual e previsão.
- **AC-01.3 — Resultados homônimos**
  - **Given** a busca retorna cidades com o mesmo nome e regiões diferentes
  - **When** os resultados são exibidos
  - **Then** cada opção inclui o nome da cidade, a região administrativa e o país quando esses dados estiverem disponíveis; se ainda houver resultados indistinguíveis, inclui suas coordenadas.
- **AC-01.4 — Busca sem resultados**
  - **Given** o geocoding conclui com sucesso e retorna uma lista vazia
  - **When** o app processa a resposta
  - **Then** exibe “Nenhuma cidade encontrada”, não seleciona uma cidade e não solicita dados meteorológicos.
- **AC-01.5 — Consulta vazia**
  - **Given** o campo de busca está vazio ou contém somente espaços
  - **When** o usuário envia a busca
  - **Then** o app não inicia uma consulta de cidade e exibe “Informe o nome de uma cidade para iniciar a busca”.
- **AC-01.6 — Caracteres especiais**
  - **Given** o usuário informa um nome de cidade com acentos, apóstrofo ou hífen, como “São Paulo”, “L'Haÿ-les-Roses” ou “Aix-en-Provence”
  - **When** envia a busca
  - **Then** o texto enviado ao serviço preserva esses caracteres após codificação da requisição e os resultados correspondentes são exibidos sem tratar a entrada como marcação ou comando.

### FR-02 — Consultar clima atual

- **AC-02.1 — Dados atuais carregados**
  - **Given** uma cidade está selecionada e a fonte retorna temperatura, condição, umidade relativa, velocidade do vento, precipitação, pressão de superfície e horário de referência
  - **When** os dados são carregados
  - **Then** o app exibe o nome da cidade, temperatura na unidade selecionada, condição em pt-BR com ícone correspondente, umidade em %, vento em km/h, precipitação em mm, pressão em hPa e o horário de referência da fonte.
- **AC-02.2 — Dados pertencem à cidade selecionada**
  - **Given** duas cidades diferentes têm respostas de clima distintas
  - **When** o usuário seleciona uma delas
  - **Then** os dados exibidos correspondem à cidade selecionada, não à outra cidade.
- **AC-02.3 — Troca de cidade sem dados obsoletos**
  - **Given** o clima da cidade A está visível
  - **When** o usuário seleciona a cidade B
  - **Then** a interface identifica B como a cidade em consulta e não apresenta os dados de A como se fossem de B.
- **AC-02.4 — Respostas fora de ordem**
  - **Given** a solicitação da cidade A continua pendente quando o usuário seleciona a cidade B
  - **When** a resposta de B chega e depois chega a resposta atrasada de A
  - **Then** a interface mantém os dados de B e ignora a resposta atrasada de A.
- **AC-02.5 — Horário de referência ausente**
  - **Given** a fonte retorna temperatura e condição, mas não retorna horário de referência
  - **When** o clima atual é exibido
  - **Then** o app mostra temperatura e condição, exibe “Atualidade não informada” e não usa o horário de recebimento da resposta como se fosse o horário da observação.
- **AC-02.6 — Dados atuais desatualizados**
  - **Given** a fonte retorna um horário de referência mais antigo que duas horas em relação ao relógio do cenário
  - **When** o clima atual é exibido
  - **Then** o app mantém os dados com um aviso visível “Dados desatualizados”; com idade igual ou inferior a duas horas, não exibe esse aviso.
- **AC-02.7 — Condição meteorológica e ícone**
  - **Given** a fonte retorna um código WMO conhecido
  - **When** o clima atual é exibido
  - **Then** o rótulo em pt-BR e o ícone correspondem ao mesmo código; o ícone é decorativo para tecnologias assistivas, pois o rótulo textual fornece a condição.
- **AC-02.8 — Código meteorológico desconhecido**
  - **Given** a fonte retorna um código WMO sem mapeamento
  - **When** o clima atual é exibido
  - **Then** o app exibe “Condição não disponível” e usa o ícone genérico definido no mapeamento.

### FR-03 — Consultar previsão de cinco dias

- **AC-03.1 — Período da previsão**
  - **Given** uma cidade está selecionada, seu fuso horário está definido como o do cenário de teste e a data local nesse fuso é 2026-04-10
  - **When** a previsão é carregada
  - **Then** o app exibe exatamente cinco resumos diários, para 2026-04-10, 2026-04-11, 2026-04-12, 2026-04-13 e 2026-04-14, nessa ordem.
- **AC-03.2 — Conteúdo diário**
  - **Given** a fonte retorna condição, temperatura mínima e temperatura máxima para cada uma das cinco datas
  - **When** a previsão é exibida
  - **Then** cada resumo diário mostra a data local, a condição rotulada em pt-BR e as temperaturas mínima e máxima correspondentes àquela data.

### FR-04 — Alternar unidade de temperatura

- **AC-04.1 — Unidade inicial**
  - **Given** uma sessão nova é iniciada
  - **When** o clima atual ou a previsão é exibido pela primeira vez
  - **Then** todas as temperaturas são arredondadas ao inteiro mais próximo, com empates afastados de zero, apresentadas em Celsius e identificadas com °C.
- **AC-04.2 — Alternar para Fahrenheit**
  - **Given** as temperaturas de origem incluem 0 °C, -10 °C, 20 °C e 1,4 °C
  - **When** o usuário seleciona Fahrenheit
  - **Then** os valores correspondentes são exibidos como 32 °F, 14 °F, 68 °F e 35 °F, e todas as temperaturas visíveis são identificadas com °F.
- **AC-04.3 — Alternar de volta para Celsius**
  - **Given** as temperaturas de origem do cenário anterior estão visíveis em Fahrenheit
  - **When** o usuário seleciona Celsius
  - **Then** os valores correspondentes são exibidos como 0 °C, -10 °C, 20 °C e 1 °C, e todas as temperaturas visíveis são identificadas com °C.
- **AC-04.4 — Unidade não persistida entre sessões**
  - **Given** o usuário selecionou Fahrenheit durante uma sessão
  - **When** recarrega o app ou inicia uma nova sessão
  - **Then** a unidade volta a Celsius, sem ler ou gravar a preferência no armazenamento local ou no servidor.

### FR-05 — Informar falhas de consulta

- **AC-05.1 — Falha da fonte**
  - **Given** o app solicita dados meteorológicos e a fonte retorna um erro ou fica indisponível
  - **When** a tentativa termina sem dados válidos
  - **Then** o app exibe “Não foi possível carregar o clima. Tente novamente.”, disponível também às tecnologias assistivas.
- **AC-05.2 — Resposta incompleta**
  - **Given** a fonte retorna dados válidos para o clima atual, mas não retorna alguns dias da previsão, ou retorna apenas parte dos campos de uma seção
  - **When** o app processa a resposta
  - **Then** a seção com dados válidos continua visível; a previsão mantém cinco datas em sequência, os dias/campos ausentes são marcados como indisponíveis e a seção parcial exibe “Alguns dados não estão disponíveis”, sem inventar valores.
- **AC-05.3 — Timeout da consulta meteorológica**
  - **Given** uma solicitação de dados meteorológicos não recebeu resposta após 10 segundos
  - **When** o limite de espera é atingido
  - **Then** o carregamento termina e o app exibe “Não foi possível carregar o clima. Tente novamente.”; uma resposta que chegue depois do timeout não substitui esse estado.
- **AC-05.4 — Falha no geocoding**
  - **Given** a solicitação de busca de cidades falha por erro, indisponibilidade ou timeout
  - **When** o app recebe a falha ou a solicitação permanece sem resposta por 10 segundos
  - **Then** exibe “Não foi possível buscar cidades. Tente novamente.” e não trata a falha como uma busca sem resultados.
- **AC-05.5 — Nova tentativa**
  - **Given** uma busca ou consulta meteorológica falhou e a mensagem de erro está visível
  - **When** o usuário ativa “Tentar novamente”
  - **Then** o app repete a mesma operação para a mesma consulta ou cidade selecionada e, se tiver sucesso, exibe os resultados e remove a mensagem de erro anterior.
- **AC-05.6 — Cidade sem cobertura meteorológica**
  - **Given** o geocoding encontrou e o usuário selecionou uma cidade, mas a Open-Meteo não retornou dados meteorológicos para ela
  - **When** a consulta meteorológica termina sem dados para essa localização
  - **Then** o app mantém o nome da cidade selecionada e exibe “Previsão não disponível para esta cidade”, sem confundir o caso com cidade inexistente.

### FR-06 — Informar carregamento

- **AC-06.1 — Solicitação em andamento**
  - **Given** o usuário iniciou uma busca ou consulta e a resposta ainda não chegou
  - **When** a solicitação está pendente
  - **Then** o app apresenta um indicador de carregamento visível e disponível às tecnologias assistivas.
- **AC-06.2 — Solicitação concluída**
  - **Given** há um indicador de carregamento visível
  - **When** a solicitação termina com sucesso, erro ou timeout
  - **Then** o indicador é removido e o resultado ou estado correspondente é apresentado.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** os fluxos principais devem ser utilizáveis sem rolagem horizontal em larguras de 320 CSS px ou superiores.
- **NFR-02 — Acessibilidade:** os fluxos principais devem atender WCAG 2.2 nível AA, incluindo operação por teclado, foco visível e mensagens de estado disponíveis a leitores de tela.
- **NFR-03 — Desempenho da interface:** em pelo menos 95% de 20 execuções por fluxo, o indicador de carregamento deve aparecer em até 200 ms após a ação do usuário e, após uma resposta válida da fonte, a tela deve exibir os dados em até 1 segundo. A latência da fonte externa não faz parte deste limite de renderização.
- **NFR-04 — Resiliência a falhas externas:** a indisponibilidade da Open-Meteo não deve encerrar nem tornar inutilizável a aplicação; a pessoa deve poder iniciar uma nova tentativa. O produto não garante o SLA do provedor externo.
- **NFR-05 — Compatibilidade:** na data de cada release, dar suporte às versões major atual e anterior de Chrome, Edge, Firefox e Safari em desktop, ao Safari no iOS atual e na versão major anterior do iOS, e ao Chrome nas versões major atual e anterior do Android.
- **NFR-06 — Privacidade e segurança:** toda comunicação externa deve usar HTTPS. A versão inicial não solicita geolocalização nem armazena buscas, cidade selecionada ou unidade em cookies, armazenamento local, armazenamento de sessão ou servidor.
- **NFR-07 — Atualidade dos dados:** exibir o horário de referência/observação retornado pela fonte. Considerar os dados atuais por até duas horas; acima desse limite, exibir aviso de desatualização. Se a fonte não fornecer horário utilizável, indicar “Atualidade não informada”.
- **NFR-08 — Localização regional:** todos os textos da interface devem estar em pt-BR; datas e horas devem seguir formatos pt-BR e o fuso horário local da cidade selecionada.
- **NFR-09 — Usabilidade:** em teste moderado com cinco participantes representativos das personas, pelo menos quatro devem concluir cada tarefa sem ajuda do moderador: buscar a cidade e ver o clima atual, consultar a previsão de cinco dias e alternar a unidade.
- **NFR-10 — Conformidade do provedor:** usar exclusivamente endpoints públicos da Open-Meteo, sem parâmetro `apikey` e sem chamadas a URLs com prefixo `customer-`. Antes do release, registrar evidência oficial vigente de que os termos autorizam o tipo de implantação pretendido, cobrem as localidades-alvo, atendem às cotas previstas e têm os requisitos de atribuição satisfeitos. Se os endpoints públicos não autorizarem o uso pretendido, bloquear o release e reabrir a escolha do provedor; não migrar para recursos `customer-` nem inserir chave no cliente.

### Verificação dos requisitos não funcionais

- **NFR-01:** validar os fluxos de busca, clima atual e previsão nos viewports 320 × 568 e 1280 × 720; não deve haver rolagem horizontal e os controles principais devem permanecer acessíveis.
- **NFR-02:** executar verificação automatizada de acessibilidade sem violações críticas ou graves nos fluxos principais e validar por teclado que todos os controles são alcançáveis e têm foco visível; leitor de tela deve anunciar carregamento e erro.
- **NFR-03:** com resposta de API simulada e instantânea, medir 20 execuções por fluxo; em pelo menos 19, o indicador deve aparecer em até 200 ms e os dados em até 1 s após a resposta.
- **NFR-04:** simular falha da Open-Meteo, verificar que a página permanece utilizável e confirmar que uma nova tentativa pode ser iniciada e concluída.
- **NFR-05:** registrar as versões de navegador e sistema operacional testadas no release; em cada combinação suportada, completar busca, seleção de cidade, consulta do clima e alternância de unidade.
- **NFR-06:** após recarregar a página, confirmar que cidade e unidade não foram persistidas e que não houve solicitação de permissão de geolocalização; verificar que chamadas externas usam HTTPS.
- **NFR-07:** com relógio controlado e limite máximo configurado no cenário, dados com idade igual ou inferior ao limite não exibem aviso; dados com idade superior exibem o aviso; sem horário utilizável da fonte, exibir “Atualidade não informada”.
- **NFR-08:** verificar textos e formatos de data/hora em pt-BR usando a zona horária da cidade selecionada.
- **NFR-09:** registrar a conclusão das três tarefas definidas pelo requisito por participante e aprovar quando pelo menos quatro dos cinco concluírem cada tarefa sem ajuda.
- **NFR-10:** verificar que as requisições não contêm o parâmetro `apikey` e que nenhuma URL usa o prefixo `customer-`; anexar ao registro de aprovação a data e a evidência oficial de autorização dos endpoints públicos para o tipo de implantação, cobertura, cotas e atribuição. Não liberar produção se os termos não autorizarem o uso pretendido.

## Rastreabilidade

Cada linha conecta a história aos requisitos funcionais, critérios de aceite e requisitos não funcionais que devem orientar a decomposição em tarefas e os testes. Os NFRs indicados são aplicáveis ao fluxo descrito; os demais NFRs continuam valendo como requisitos globais do produto.

| User Story | Requisito(s) funcional(is) | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|---|
| **US-01 — Buscar a cidade habitual** | FR-01, FR-02 | AC-01.1–AC-01.6; AC-02.1–AC-02.6; AC-05.4–AC-05.6; AC-06.1–AC-06.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10 |
| **US-02 — Consultar clima atual** | FR-02 | AC-02.1–AC-02.6; AC-04.1–AC-04.3; AC-05.1–AC-05.3; AC-05.5–AC-05.6; AC-06.1–AC-06.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10 |
| **US-03 — Buscar cidade de destino** | FR-01 | AC-01.1–AC-01.6; AC-05.4–AC-05.5; AC-06.1–AC-06.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-08, NFR-09, NFR-10 |
| **US-04 — Consultar previsão de cinco dias** | FR-03 | AC-01.2; AC-03.1–AC-03.2; AC-04.1–AC-04.3; AC-05.2–AC-05.3; AC-05.5–AC-05.6; AC-06.1–AC-06.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10 |
| **US-05 — Alternar unidade de temperatura** | FR-04 | AC-04.1–AC-04.4 | NFR-01, NFR-02, NFR-03, NFR-05, NFR-06, NFR-08, NFR-09 |
| **US-06 — Entender uma falha de consulta** | FR-05 | AC-05.1–AC-05.6; AC-06.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-09, NFR-10 |
| **US-07 — Saber que a consulta está em andamento** | FR-06 | AC-06.1–AC-06.2; AC-05.3–AC-05.5 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05 |

## Edge Cases

| Caso | Comportamento esperado |
|---|---|
| Cidade inexistente | Exibir “Nenhuma cidade encontrada”, não selecionar uma cidade e permitir que o usuário edite a busca. |
| Input vazio ou só com espaços | Não solicitar geocoding; exibir “Informe o nome de uma cidade para iniciar a busca”. |
| Geocoding sem resultados | Tratar uma lista vazia como estado sem resultados, não como falha de API; não consultar clima sem cidade selecionada. |
| Caracteres especiais | Preservar e codificar acentos, apóstrofos e hífens na consulta; não interpretá-los como marcação ou comando. |
| Cidades homônimas | Mostrar região e país quando disponíveis; acrescentar coordenadas se os resultados continuarem indistinguíveis. |
| Falha de API | Exibir mensagem específica para busca ou clima, não confundir falha com lista vazia e permitir nova tentativa. |
| Timeout | Após 10 segundos sem resposta, encerrar o carregamento, exibir a mensagem da operação e permitir nova tentativa. |
| Resposta parcial | Manter seções independentes com dados válidos; mostrar cinco datas na previsão e marcar dias/campos ausentes como indisponíveis, sem inventar valores. |
| Cidade sem cobertura meteorológica | Manter a cidade selecionada e informar que não há previsão disponível; não apresentar o caso como cidade inexistente. |
| Dados desatualizados | Comparar o horário de referência com o relógio do cenário; acima de duas horas exibir o aviso, e sem horário utilizável indicar que a atualidade não foi informada. |
| Datas e horário de verão | Usar o fuso local da cidade selecionada para definir hoje e a sequência dos cinco dias. |
| Valores negativos, fracionários ou ausentes na conversão | Arredondar ao inteiro mais próximo, com empates afastados de zero; não calcular nem exibir conversão para dado ausente. |
| Carregamento em andamento | Exibir indicador visível e acessível enquanto houver solicitação pendente e removê-lo após sucesso, falha ou timeout. |
| Recarregamento da página | Iniciar em Celsius e sem cidade previamente selecionada; não restaurar valores da sessão anterior. |
| Resposta atrasada de uma cidade anterior | Ignorar a resposta e manter na tela apenas os dados da cidade selecionada mais recentemente. |
| Tela pequena ou tecnologia assistiva | Preservar acesso a busca, resultados, dados e mensagens por teclado, leitor de tela e viewport de 320 CSS px. |

## Assumptions

- O usuário informa o nome de uma cidade e escolhe um resultado; a busca manual é o fluxo base.
- A cidade selecionada determina os dados de clima atual e previsão exibidos.
- Open-Meteo é a fonte de dados escolhida; somente endpoints públicos são usados, sem API key e sem acesso a recursos com prefixo `customer-`.
- “Cinco dias” significa hoje mais os quatro dias seguintes.
- A busca é enviada manualmente, cobre as localidades indexadas pelo provedor e mostra no máximo cinco resultados.
- A consulta atual e a previsão são obtidas ao selecionar uma cidade ou ao tentar novamente; não há atualização periódica automática.
- As datas da previsão usam o fuso horário local da cidade selecionada.
- Condições meteorológicas são apresentadas com rótulos em pt-BR; um código de condição sem mapeamento é exibido como “Condição não disponível”.
- Dados do clima atual com idade superior a duas horas são sinalizados como desatualizados.
- Celsius é a unidade inicial e Fahrenheit também está disponível.
- Temperaturas são exibidas como números inteiros; arredondar ao inteiro mais próximo e, em empate, afastar de zero.
- A interface inicial será em pt-BR.
- O produto não terá autenticação nem persistência de servidor.
- Cidade selecionada e unidade são válidas somente durante a sessão atual; ao recarregar, o app volta ao estado inicial.
- Solicitações a geocoding ou previsão sem resposta após 10 segundos são tratadas como timeout.
- O produto não envia API key nem chama endpoints com prefixo `customer-`; o uso dos endpoints públicos em produção depende da autorização e evidências descritas em NFR-10.
- A aplicação exibe um estado de carregamento para cada solicitação pendente.
- As personas descritas são hipóteses, não resultados de pesquisa com usuários.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| A Open-Meteo ficar indisponível, mudar seu contrato ou impor limites | Média | Alto: consultas podem falhar ou ficar incompletas | Confirmar condições de uso e atribuição antes do lançamento; tratar falhas e timeouts e oferecer nova tentativa manual. |
| Dados desatualizados ou sem cobertura para uma cidade | Média | Alto: usuários podem tomar decisões com informação inadequada | Confirmar cobertura e atualização da fonte, exibir horário dos dados e sinalizar dados antigos ou indisponíveis. |
| Resultados homônimos levarem à seleção da cidade errada | Média | Médio: previsão de outra localidade | Apresentar contexto suficiente para distinguir os resultados. |
| Usuários esperarem previsão horária além dos resumos diários | Média | Médio: a previsão diária pode não atender todos os cenários de planejamento | Comunicar que o MVP oferece resumos diários e avaliar previsão horária apenas como evolução futura, sem incluí-la no escopo atual. |
| Erros de conversão ou rótulos de unidade inconsistentes | Baixa | Médio: temperaturas podem ser interpretadas incorretamente | Validar conversões e verificar todos os valores e rótulos após alternar unidades. |
| Barreiras de acessibilidade impedirem o uso dos fluxos principais | Média | Alto: alguns usuários não conseguem consultar o app | Definir critérios de conformidade e validar com teclado e tecnologias assistivas. |
| Escopo crescer com recursos não solicitados | Média | Médio: aumento de esforço e atraso nas funções essenciais | Manter recursos não priorizados fora do escopo inicial e revisar sua inclusão com stakeholders. |

## Out of Scope

- Autenticação, contas de usuário e persistência de servidor.
- Chamadas a recursos Open-Meteo com prefixo `customer-` ou que exijam parâmetro `apikey`.
- Geolocalização automática, cache e operação offline.
- Persistência local de cidade selecionada, buscas ou unidade de temperatura.
- Mapas, alertas meteorológicos, notificações, histórico de consultas e cidades favoritas na versão inicial.
- Comparação simultânea de várias cidades ou mais de uma cidade selecionada por vez.
- Métricas além do mínimo especificado: índice UV, qualidade do ar, radar, visibilidade, ponto de orvalho, direção e rajadas de vento.
- Previsões horárias; a versão inicial apresenta resumos diários.
- Previsões para períodos além de hoje e dos quatro dias seguintes.
- Sugestões de busca enquanto a pessoa digita e atualização automática periódica.
- Idiomas além de pt-BR na versão inicial.

## Open Questions

As decisões funcionais do MVP estão fechadas: a integração usa endpoints públicos, sem API key e sem recursos `customer-`. O gate NFR-10 permanece para documentar que os termos vigentes permitem o tipo de implantação pretendido e que cobertura, cotas e atribuição são atendidas. Sem essa evidência, a aplicação pode ser desenvolvida e testada, mas não liberada para produção.