# Discovery — Weather App

## Contexto

A empresa solicitou uma aplicação de previsão do tempo. O briefing indica cinco necessidades principais: buscar cidades, consultar o clima atual, visualizar uma previsão de cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis.

O objetivo desta fase é esclarecer o problema e registrar requisitos, riscos e decisões pendentes antes de definir a especificação e a solução técnica.

## Personas

As personas abaixo são perfis-alvo do MVP, derivados do briefing e não apresentados como pesquisa empírica: Camila é o perfil primário; Marcos, o secundário; Joana representa os requisitos de acessibilidade.

### Camila — pessoa que planeja o deslocamento diário

- **Objetivo principal:** verificar rapidamente as condições do tempo para decidir como se preparar para sair.
- **Contexto de uso:** principalmente no celular, antes de sair de casa ou durante o deslocamento; consulta o clima atual da própria cidade.
- **Métrica de sucesso:** encontra a cidade correta e identifica as condições atuais em até 30 segundos, sem precisar consultar outra fonte.

### Marcos — pessoa que planeja atividades para os próximos dias

- **Objetivo principal:** escolher quando realizar atividades ao ar livre com base na previsão dos próximos cinco dias.
- **Contexto de uso:** costuma planejar no desktop, com consultas rápidas posteriores pelo celular; busca uma cidade de destino e compara os dias previstos.
- **Métrica de sucesso:** encontra a previsão da cidade pretendida e identifica as condições e temperaturas dos cinco dias sem ambiguidade sobre as datas.

### Joana — pessoa que usa leitor de tela

- **Objetivo principal:** consultar o clima atual e a previsão sem depender de informação transmitida apenas visualmente.
- **Contexto de uso:** usa leitor de tela no celular e navegação por teclado quando está no desktop.
- **Métrica de sucesso:** conclui a busca e consegue acessar a unidade selecionada, as condições atuais e a previsão de cinco dias usando suas tecnologias assistivas, sem bloqueios.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades.
- **RF-02 — Consultar clima atual:** exibir temperatura, condição com rótulo/ícone, horário de referência, umidade relativa (%), vento (km/h), precipitação (mm) e pressão de superfície (hPa) da cidade selecionada.
- **RF-03 — Consultar previsão:** exibir uma previsão do tempo para cinco dias.
- **RF-04 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit.
- **RF-05 — Informar falhas de consulta:** informar ao usuário quando não for possível carregar os dados meteorológicos, por exemplo, devido a uma falha de conexão ou indisponibilidade da fonte.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade:** a interface deve se adaptar a dispositivos móveis. O comportamento em tablets e desktops ainda precisa ser definido.
- **RNF-02 — Usabilidade:** busca, consulta da previsão e alternância de unidade devem ser compreensíveis e fáceis de acessar.
- **RNF-03 — Acessibilidade:** a interface deve oferecer navegação e controles acessíveis. Critérios e nível de conformidade precisam ser definidos.
- **RNF-04 — Desempenho:** busca e consulta do clima devem responder em tempo adequado. Metas de tempo ainda precisam ser acordadas.
- **RNF-05 — Disponibilidade:** a consulta do clima depende da disponibilidade da Open-Meteo. A meta mensurável de disponibilidade e a tolerância a interrupções ainda precisam ser definidas.
- **RNF-06 — Suporte a dispositivos móveis:** a interface deve permitir o uso das funções do app em dispositivos móveis.
- **RNF-07 — Compatibilidade:** o app deve funcionar nas versões atual e anterior dos principais navegadores: Chrome, Edge, Firefox e Safari, incluindo Chrome e Safari em dispositivos móveis.
- **RNF-08 — Privacidade e segurança:** toda comunicação deve usar HTTPS; localização precisa e histórico de buscas não devem ser armazenados sem consentimento explícito do usuário.
- **RNF-09 — Atualidade dos dados:** o app deve informar quando os dados meteorológicos foram atualizados e indicar quando ultrapassarem o limite máximo de idade definido para a fonte.
- **RNF-10 — Formatos regionais:** quando pt-BR for o idioma selecionado, textos, datas, horários e números devem respeitar esse idioma e formato regional.

## Riscos

Estimativas iniciais; revisar probabilidade e impacto após responder às perguntas em aberto.

| Categoria | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| Técnico | A API meteorológica ficar indisponível, mudar seu contrato ou impor limites de uso | Média | Alto: clima e previsão podem deixar de carregar ou ficar incompletos | Isolar a integração em um serviço, tratar erros e timeouts, monitorar limites e definir uma alternativa para indisponibilidade. |
| Técnico e produto | Dados meteorológicos imprecisos, desatualizados ou sem cobertura para a localidade | Média | Alto: decisões do usuário podem se basear em informação incorreta, reduzindo a confiança no app | Avaliar cobertura e atualização da fonte, exibir horário dos dados e sinalizar dados indisponíveis ou desatualizados. |
| Produto | A busca apresentar cidades homônimas ou selecionar uma localidade incorreta | Média | Médio: o usuário verá o clima de outra região | Mostrar estado/região e país nos resultados e permitir confirmar a localidade selecionada. |
| Produto | “Previsão de cinco dias” ser interpretada de forma diferente, inclusive quanto ao fuso horário | Média | Médio: a previsão pode parecer incompleta ou corresponder às datas erradas | Manter hoje mais os quatro dias seguintes; definir fuso e granularidade e deixar o período explícito na interface. |
| Técnico | Latência, falhas de rede ou excesso de requisições degradarem a busca e o carregamento | Média | Alto: a interface pode parecer travada ou impedir consultas | Definir metas de desempenho, limitar ou agrupar requisições quando aplicável e fornecer estados de carregamento, timeout e nova tentativa. |
| Técnico e produto | A interface ou os navegadores não oferecerem experiência consistente em dispositivos móveis | Média | Alto: usuários em telas pequenas podem não conseguir completar tarefas | Definir matriz de dispositivos e navegadores suportados e validar fluxos em larguras móveis e desktop. |
| Técnico e produto | Conversões ou rótulos de Celsius/Fahrenheit ficarem inconsistentes | Baixa | Médio: temperaturas podem ser interpretadas incorretamente | Usar Celsius como padrão, testar conversões e atualizar todos os valores e rótulos ao alternar. |
| Técnico e produto | Geolocalização ou histórico de buscas serem coletados ou armazenados sem expectativa clara do usuário | Baixa | Alto: pode haver perda de confiança e exposição de dados de localização | Preferir busca manual até decidir o uso de geolocalização; pedir consentimento e definir minimização e retenção de dados. |
| Produto | Barreiras de acessibilidade impedirem o uso por pessoas com deficiência | Média | Alto: parte dos usuários pode não conseguir buscar ou interpretar a previsão | Definir critérios de acessibilidade, usar semântica e teclado adequados e validar com ferramentas e testes assistivos. |
| Produto | Escopo não delimitado levar à inclusão de mapas, alertas, histórico ou favoritos sem validação | Média | Médio: aumenta esforço e pode atrasar as funções essenciais | Registrar explicitamente o que fica fora do escopo e priorizar funcionalidades com base nas necessidades dos usuários. |

## Decisões

1. **Fonte e modo de acesso: endpoints públicos da Open-Meteo, sem API key e sem recursos `customer-`.**  
    Justificativa: mantém o provedor escolhido sem credenciais de cliente no app.  
    Resolve: fecha o modo de acesso e exclui chamadas a endpoints reservados. Antes do release, ainda é necessário comprovar que os termos vigentes autorizam o tipo de implantação pretendido e que cobertura, cotas e atribuição são atendidas, conforme NFR-10 da spec.

2. **Previsão de cinco dias: hoje mais os quatro dias seguintes.**  
    Justificativa: inclui o dia corrente e mantém uma janela total de cinco dias.  
    Resolve: define resumos diários com condição, mínima e máxima, usando o fuso local da cidade; previsão horária fica fora do MVP.

3. **Unidade padrão: Celsius.**  
    Justificativa: estabelece um padrão inicial coerente com pt-BR. Fahrenheit continua disponível para temperatura.  
    Resolve: define Celsius como unidade inicial, conversão para Fahrenheit e ausência de persistência da preferência entre sessões.

4. **Sem autenticação e sem persistência de servidor.**  
    Justificativa: mantém o produto focado na consulta do clima, sem contas ou dados salvos.  
    Resolve: exclui autenticação, persistência de servidor e persistência local de cidade, buscas ou unidade.

5. **Idioma da interface: pt-BR.**  
    Justificativa: define uma experiência consistente para o público inicial.  
    Resolve: estabelece pt-BR para textos e formatos regionais; outros idiomas ficam fora do MVP.

6. **Público-alvo do MVP:** pessoas que consultam o clima atual para se preparar para o dia (primário) e pessoas que planejam atividades em outra cidade (secundário); acessibilidade por leitor de tela é requisito de uso.  
    Justificativa: delimita o produto conforme as tarefas do briefing sem afirmar que as personas vieram de pesquisa.  
    Resolve: define a prioridade das tarefas; a avaliação de usabilidade é critério de lançamento na spec.

7. **Busca:** consulta manual por nome, para localidades indexadas pelo provedor, com até cinco resultados e sem sugestões enquanto digita.  
    Justificativa: oferece seleção explícita e limita a lista de resultados.  
    Resolve: define regiões conforme a cobertura do provedor, interação, limite de resultados e dados de desambiguação (região/país; coordenadas como fallback).

8. **Contrato mínimo de dados:** clima atual inclui temperatura, condição, horário de referência, umidade relativa, velocidade do vento, precipitação e pressão de superfície; cada resumo diário inclui data, condição, mínima e máxima. Condições são rotuladas em pt-BR e têm ícone correspondente; código sem rótulo conhecido usa “Condição não disponível” e ícone genérico.  
    Justificativa: torna o conteúdo mínimo estável para interface e aceitação.  
    Resolve: define campos mínimos e comportamento para condição desconhecida.

9. **Atualidade:** dados atuais com horário de referência de até duas horas são aceitos como atuais; dados mais antigos são sinalizados. Sem horário utilizável, a interface informa que a atualidade não foi informada.  
    Justificativa: estabelece um limite explícito para o usuário e para os testes.  
    Resolve: define o limite de frescor e o fallback para timestamp ausente.

10. **Atualização e falhas:** buscar dados ao selecionar uma cidade ou em uma nova tentativa manual; sem atualização periódica, cache ou uso offline no MVP.  
     Justificativa: mantém o consumo e o comportamento da fonte previsíveis.  
     Resolve: define quando há requisições e exclui polling, cache e modo offline.

## Perguntas de Discovery (resolvidas na especificação)

As perguntas abaixo registram as incertezas originais do discovery. As decisões funcionais foram fechadas em [weather-app-spec.md](weather-app-spec.md); a única condição pendente para produção é a comprovação do gate NFR-10 nessa especificação.

1. **Quem são os usuários prioritários e qual decisão ou tarefa principal o app deve ajudá-los a realizar?**  
    Impacto: sem público e objetivo prioritários, não é possível priorizar conteúdo, fluxos ou critérios de sucesso.

2. **Como a busca por cidade deve funcionar: somente por nome ou com sugestões enquanto digita, e quais regiões deve cobrir?**  
    Impacto: define o comportamento da busca e a cobertura geográfica necessária.

3. **Quais informações devem identificar cada resultado da busca, especialmente cidades com nomes iguais?**  
    Impacto: sem região, estado ou país, o usuário pode selecionar a localidade errada.

4. **Quais condições compõem o “clima atual” que será exibido?**  
    Impacto: a equipe pode entregar dados diferentes do que os usuários esperam, afetando layout e integração.

5. **Com que frequência os dados devem ser atualizados e o usuário poderá atualizá-los manualmente?**  
    Impacto: afeta atualidade percebida, consumo da API e comportamento da interface.

6. **Qual fuso horário determina “hoje” para a previsão da cidade selecionada?**  
    Impacto: sem essa definição, as datas exibidas podem divergir do dia local da cidade.

7. **A previsão será diária, horária ou ambas, e quais informações deve apresentar em cada período?**  
    Impacto: determina volume de dados, complexidade da interface e necessidades da API.

8. **A alternância Celsius/Fahrenheit afeta apenas temperatura ou também outras unidades? A preferência será salva localmente?**  
    Impacto: afeta consistência dos valores e rótulos e determina se o navegador precisa armazenar preferências.

9. **A localização será escolhida manualmente, obtida por geolocalização ou ambas? Qual será o fluxo se a permissão for negada?**  
    Impacto: envolve permissões, privacidade e a possibilidade de usar o app sem conceder acesso à localização.

10. **Quais são as condições da Open-Meteo para cobertura, frequência de atualização, limites de uso e atribuição?**  
     Impacto: afeta confiabilidade, volume de requisições permitido e requisitos de exibição da fonte.

11. **Como o app deve se comportar sem conexão, sem resultados, diante de timeout ou indisponibilidade da fonte? Deve haver cache ou nova tentativa?**  
     Impacto: sem regras, estados de erro e dados antigos podem ser inconsistentes ou induzir o usuário ao erro.

12. **Qual é a idade máxima aceitável para os dados e como dados desatualizados devem ser identificados?**  
     Impacto: sem esse limite, não é possível decidir quando sinalizar que a previsão pode não refletir as condições atuais.

13. **Há necessidade de oferecer idiomas além de pt-BR?**  
     Impacto: idiomas adicionais afetam textos, formatos regionais, testes e esforço de manutenção.

14. **Quais dispositivos, tamanhos de tela e navegadores devem ser suportados?**  
     Impacto: sem uma matriz de suporte, responsividade e compatibilidade não podem ser verificadas de forma consistente.

15. **Quais critérios de acessibilidade devem ser atendidos, incluindo navegação por teclado e tecnologias assistivas?**  
     Impacto: requisitos vagos podem deixar barreiras de uso e dificultar a validação de conformidade.

16. **Quais metas de desempenho e disponibilidade são esperadas?**  
     Impacto: sem metas mensuráveis, não é possível avaliar se carregamento e dependência da fonte são aceitáveis.

17. **O app poderá armazenar cidade recente, localização ou preferência de unidade no navegador? Se sim, por quanto tempo e com qual consentimento?**  
     Impacto: apesar de não haver persistência de servidor, armazenamento local ainda afeta privacidade e comportamento entre sessões.

18. **Alertas meteorológicos, mapas, histórico, cidades favoritas ou notificações fazem parte do escopo?**  
     Impacto: sem delimitação, há risco de expectativas divergentes e expansão não planejada do produto.

## Suposições

- A busca é enviada manualmente, cobre as localidades indexadas pelo provedor e apresenta até cinco resultados.
- A cidade selecionada será a referência para exibir o clima atual e a previsão.
- O mínimo de dados é temperatura, condição, horário de referência, umidade relativa, vento, precipitação e pressão de superfície no clima atual; condição, mínima e máxima em cada resumo diário.
- Celsius é a unidade padrão e Fahrenheit também pode ser selecionado.
- Os dados meteorológicos serão obtidos exclusivamente dos endpoints públicos da Open-Meteo, sem API key e sem chamadas a recursos com prefixo `customer-`.
- O uso dos endpoints públicos em produção depende da comprovação dos termos, cobertura, cotas e atribuição especificados em NFR-10.
- Dados atuais com mais de duas horas serão sinalizados como desatualizados.
- A previsão é diária, cobre hoje e os quatro dias seguintes e usa o fuso local da cidade.
- A interface será em pt-BR.
- O suporte a dispositivos móveis implica uma interface responsiva e utilizável em telas pequenas.
- Não haverá geolocalização automática, autenticação, persistência local ou de servidor, cache, uso offline ou idiomas além de pt-BR no MVP.
