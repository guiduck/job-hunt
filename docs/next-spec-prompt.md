## Command
speckit.plan

## Objective
Planejar a implementacao de `specs/013-serpapi-career-search/spec.md`: busca de vagas em career
pages/ATS curados sem exigir nome de empresa, separacao de vagas com email e candidaturas externas,
avaliacao por IA e aplicacao manual por URL.

## Source Request
O usuario quer expandir o modo `Full-time` com um botao abaixo da busca LinkedIn para procurar vagas
externas em sites curados usando a chave de busca ja configurada no projeto. A busca deve aceitar
keywords como `react frontend remoto`, permitir marcar/desmarcar fontes, nao exigir empresa/board/tenant
do operador e salvar vagas sem email como candidaturas externas com URL oficial para aplicar.

## Project Context
- Stack: FastAPI, PostgreSQL, worker separado, extensao Plasmo/React.
- Modo prioritario: `job` / Full-time.
- LinkedIn continua como captura assistida pelo usuario e usa scroll/captura propria.
- Career-page search nao usa `max scrolls`; usa apenas keywords, fontes selecionadas e numero maximo
  de oportunidades.
- O spike antigo de fonte externa com descoberta de email foi descartado; esta feature nao retoma esse
  objetivo.
- Nova direcao: encontrar URLs oficiais de candidatura simples, avaliar aderencia com IA, separar
  revisao de vagas com email e vagas externas.
- Preservar: ownership por usuario, source_query/source_url/source_evidence, dedupe, filtros atuais,
  envio Gmail apenas para vagas com email, AI field assistant backend-only.

## Requirements
- Criar plano para uma busca de career pages curadas via provider de busca configurado no backend.
- Fontes ativas iniciais: InHire, Ashby, Lever, Greenhouse, SmartRecruiters, Trampos e Catho.
- Fontes brasileiras futuras devem ficar comentadas/documentadas para pesquisa: Programathor, Remotar,
  GeekHunter, Vagas.com.br e InfoJobs.
- Search UI deve ter botao separado para career-page search e checkboxes de fontes.
- Jobs UI deve separar `With email` e `External applications`.
- Cards de vagas externas devem reaproveitar a mesma estrutura dos cards atuais quando houver dados.
- Vagas externas devem ter uma unica acao primaria para abrir a URL da vaga/candidatura.
- Selecao multipla em vagas externas deve existir apenas para deletar; nao abrir varias abas em massa.
- Detalhe de vaga externa nao deve criar uma experiencia rica nova alem da descricao/evidencia.
- Dashboard deve mostrar contagem de vagas com email e vagas externas ainda nao aplicadas.
- Vagas externas devem poder ser marcadas manualmente como aplicadas.
- IA avaliadora deve avaliar o payload/texto da vaga e registrar decisao, score/motivo e sinais.
- O plano deve cobrir cache/rate limit/custo para nao gastar chamadas duplicadas sem necessidade.

## Existing Artifact Considerations
- `.specify/feature.json` aponta para `specs/013-serpapi-career-search`.
- `docs/search-improvements.md`, `docs/roadmap.md` e `docs/handoff.md` ja registram a mudanca de
  direcao.
- A implementacao deve preservar contratos existentes sempre que possivel e fazer mudancas aditivas.
- O proximo fechamento de implementacao deve atualizar docs, handoff, roadmap e este arquivo.

## Risks / Assumptions
- Risco principal: resultados de busca podem trazer paginas antigas ou nao serem paginas de vaga; o
  plano deve incluir filtro de recencia, validacao de URL, dedupe e rejeicao segura.
- Assumimos que a chave de busca existente fica no backend/worker e nao sera exposta na extensao.
- Assumimos que aplicar em sites externos permanece manual e apoiado pelo AI field assistant, sem
  submissao automatica de formularios.

## Expected Output
- `plan.md` completo para a spec 013.
- Artefatos de design necessarios: research, data-model, quickstart e contratos relevantes.
- Evitar plano que dependa de empresa/board/tenant digitado pelo usuario como requisito central.
