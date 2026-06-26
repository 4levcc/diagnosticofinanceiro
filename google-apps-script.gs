/**
 * Google Apps Script para receber os dados do Diagnóstico INOVARE
 * e gravar na planilha vinculada.
 *
 * Como usar:
 * 1. Acesse a planilha que será o banco de dados.
 * 2. Vá em Extensões > Apps Script.
 * 3. Cole este código no editor e salve (Ctrl+S / Cmd+S).
 * 4. Clique em "Implantar" > "Novo implantação" > tipo "Web app".
 * 5. Em "Executar como" escolha "Eu" e em "Quem pode acessar" escolha "Qualquer pessoa".
 * 6. Copie a URL gerada e cole no front-end na constante SCRIPT_URL.
 * 7. A primeira aba da planilha deve ter na linha 1 os cabeçalhos que batem com
 *    as chaves enviadas pelo front-end (Data, Nome, Email, CNPJ, Score Geral etc.).
 *    Se a aba estiver vazia, o script cria o cabeçalho automaticamente.
 */

// Se o script NÃO foi criado a partir da planilha (scripts.google.com),
// descomente a linha abaixo e insira o ID da planilha:
// const SPREADSHEET_ID = 'COLE_AQUI_O_ID_DA_PLANILHA';

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheets()[0]; // usa a primeira aba

    let headers = [];
    if (sheet.getLastRow() === 0) {
      headers = buildDefaultHeaders();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // e.parameter contém os dados quando Content-Type é application/x-www-form-urlencoded
    const params = e.parameter || {};

    // Log para depuração (Visualização > Logs do Apps Script)
    console.log('Parâmetros recebidos:', JSON.stringify(params));

    // Monta a linha na ordem das colunas existentes
    const row = headers.map(function(header) {
      if (!header) return '';
      const key = String(header).trim();
      return params.hasOwnProperty(key) ? params[key] : '';
    });

    // Adiciona campos novos que ainda não estão no cabeçalho
    Object.keys(params).forEach(function(key) {
      const trimmedKey = key.trim();
      if (trimmedKey && !headers.includes(trimmedKey)) {
        headers.push(trimmedKey);
        sheet.getRange(1, headers.length).setValue(trimmedKey);
        row.push(params[key]);
      }
    });

    // Insere a linha de respostas
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Dados gravados' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Erro no doPost:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Endpoint do Diagnóstico INOVARE ativo' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() {
  if (typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function buildDefaultHeaders() {
  return [
    'Data',
    'Nome',
    'Email',
    'CNPJ',
    'Score Geral',
    'Score Controles',
    'Score Capital',
    'Score Projeções',
    'Score Custos',
    'Score Resultados',
    'Score Indicadores'
    // As perguntas individuais serão adicionadas automaticamente na primeira resposta
  ];
}
