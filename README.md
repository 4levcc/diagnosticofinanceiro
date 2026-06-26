# Diagnóstico de Maturidade Financeira — INOVARE

Aplicação front-end interativa para avaliação de maturidade financeira empresarial baseada em 6 dimensões e 49 indicadores.

## Estrutura

- `index.html` — Aplicação completa do diagnóstico (HTML + CSS + JS).
- `google-apps-script.gs` — Código do servidor para receber os dados e gravar na planilha Google.
- `test-payload.js` — Utilitário local para simular e validar o payload enviado ao Google Apps Script.
- `Landing Page - Diagnostico/` — Landing page do projeto.

## Integração com Google Planilhas

O formulário envia as respostas via `POST` para um Google Apps Script usando o formato `application/x-www-form-urlencoded`.

### Como configurar

1. Acesse a planilha que será usada como banco de dados.
2. Vá em **Extensões > Apps Script**.
3. Cole o conteúdo de `google-apps-script.gs` no editor e salve.
4. Clique em **Implantar > Novo implantação > Web app**.
5. Configure:
   - **Executar como:** Eu
   - **Quem pode acessar:** Qualquer pessoa
6. Copie a URL gerada e substitua a constante `SCRIPT_URL` em `index.html`.
7. Faça o deploy do front-end.

### Cabeçalhos da planilha

A primeira linha da aba deve conter os cabeçalhos correspondentes às chaves enviadas pelo front-end. Cabeçalhos principais:

- `Data`
- `Nome`
- `Email`
- `CNPJ`
- `Score Geral`
- `Score Controles`
- `Score Capital`
- `Score Projeções`
- `Score Custos`
- `Score Resultados`
- `Score Indicadores`

As perguntas individuais são enviadas no formato `[Dimensão] Texto da pergunta` e são adicionadas automaticamente pelo script na ordem exata em que aparecem no diagnóstico. O front-end envia um parâmetro oculto `_headers` com a ordem correta das colunas, garantindo que a planilha sempre siga a sequência: Data → Nome → Email → CNPJ → scores → perguntas.

## Teste local do payload

```bash
node test-payload.js
```

O script exibe o payload codificado e os parâmetros decodificados, simulando o que o Google Apps Script receberia em `e.parameter`.

## Debug no navegador

Ao clicar em **Acesso ao Resultado**, o console do navegador exibe:

```
[enviarParaPlanilha] Payload: Data=...&Nome=...
[enviarParaPlanilha] Entries: [...]
```

Use essas informações para verificar se todos os campos estão sendo enviados.
