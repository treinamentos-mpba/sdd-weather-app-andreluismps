# Discovery — Weather App

## Contexto

A empresa solicitou uma aplicação de previsão do tempo. O briefing indica cinco necessidades principais: buscar cidades, consultar o clima atual, visualizar uma previsão de cinco dias, alternar entre Celsius e Fahrenheit e usar o produto em dispositivos móveis.

O objetivo desta fase é esclarecer o problema e registrar requisitos, riscos e decisões pendentes antes de definir a especificação e a solução técnica.

## Personas

As personas abaixo são hipóteses iniciais derivadas do briefing e devem ser validadas com usuários reais.

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
- **RF-02 — Consultar clima atual:** exibir as condições meteorológicas atuais da cidade selecionada.
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

1. **Fonte de dados: Open-Meteo, sem API key.**  
    Justificativa: permite usar dados meteorológicos sem exigir cadastro ou gerenciar uma chave de API para o treinamento.  
    Resolve: define o provedor e elimina a necessidade de credenciais. Cobertura, limites de uso, atribuição e frequência de atualização ainda precisam ser confirmados.

2. **Previsão de cinco dias: hoje mais os quatro dias seguintes.**  
    Justificativa: inclui as condições do dia corrente e mantém uma janela total de cinco dias.  
    Resolve: define quais datas compõem o período. O fuso horário e a granularidade da previsão continuam em aberto.

3. **Unidade padrão: Celsius.**  
    Justificativa: estabelece um padrão inicial coerente com o público e o idioma definidos para a interface. Fahrenheit continua disponível pela alternância solicitada.  
    Resolve: define a unidade exibida inicialmente; a preferência entre sessões e as unidades de outras grandezas continuam em aberto.

4. **Sem autenticação e sem persistência de servidor.**  
    Justificativa: mantém o produto focado na consulta do clima, sem contas ou armazenamento de dados em um backend.  
    Resolve: exclui login e persistência de servidor do escopo. Persistência local no navegador ainda precisa ser decidida.

5. **Idioma da interface: pt-BR.**  
    Justificativa: define um idioma consistente para textos e apresentação inicial do produto.  
    Resolve: estabelece pt-BR como idioma da interface; a necessidade de suportar outros idiomas continua em aberto.

## Perguntas em Aberto

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

- “Buscar cidades” significa que o usuário poderá informar o nome de uma cidade e escolher um resultado.
- A cidade selecionada será a referência para exibir o clima atual e a previsão.
- Celsius é a unidade padrão e Fahrenheit também pode ser selecionado.
- Os dados meteorológicos serão fornecidos pela Open-Meteo, sem API key.
- A interface será em pt-BR.
- O suporte a dispositivos móveis implica uma interface responsiva e utilizável em telas pequenas.
- Não haverá autenticação nem persistência de servidor. Geolocalização automática, persistência local e uso offline continuam sem decisão.
