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
 */

// Se o script NÃO foi criado a partir da planilha (scripts.google.com),
// descomente a linha abaixo e insira o ID da planilha:
// const SPREADSHEET_ID = 'COLE_AQUI_O_ID_DA_PLANILHA';

function doPost(e) {
  try {
    const ss = getSpreadsheet();

    // Renomeia a primeira aba para "leads" se ainda não estiver
    let sheet = ss.getSheets()[0];
    if (sheet.getName() !== 'leads') {
      sheet.setName('leads');
    }

    // Remove a aba "Respostas" se existir
    const respostasSheet = ss.getSheetByName('Respostas');
    if (respostasSheet) {
      ss.deleteSheet(respostasSheet);
    }

    // e.parameter contém os dados quando Content-Type é application/x-www-form-urlencoded
    const params = e.parameter || {};

    // Log para depuração (Visualização > Logs do Apps Script)
    console.log('Parâmetros recebidos:', JSON.stringify(params));

    // A ordem dos cabeçalhos vem do front-end no parâmetro _headers
    // (ex: "Data|Nome|Email|CNPJ|Score Geral|[Controles] Pergunta 1|...")
    let orderedHeaders = [];
    if (params._headers) {
      orderedHeaders = String(params._headers)
        .split('|')
        .map(function(h) { return h.trim(); })
        .filter(function(h) { return h && h !== '_headers'; });
    }

    // Lê os cabeçalhos atuais da planilha
    let currentHeaders = [];
    if (sheet.getLastRow() > 0) {
      currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Determina o cabeçalho final:
    // 1. Usa a ordem enviada pelo front-end (_headers)
    // 2. Preserva no final quaisquer colunas extras que já existam na planilha
    let finalHeaders = orderedHeaders.length > 0 ? orderedHeaders.slice() : currentHeaders.slice();
    currentHeaders.forEach(function(h) {
      const trimmed = String(h).trim();
      if (trimmed && !finalHeaders.includes(trimmed)) {
        finalHeaders.push(trimmed);
      }
    });

    // Se ainda não houver cabeçalhos, usa o padrão básico
    if (finalHeaders.length === 0) {
      finalHeaders = buildDefaultHeaders();
    }

    // Atualiza a linha de cabeçalhos na planilha
    if (finalHeaders.length > sheet.getLastColumn()) {
      sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    } else {
      sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    }

    // Monta a linha de respostas na ordem exata dos cabeçalhos
    const row = finalHeaders.map(function(header) {
      const key = String(header).trim();
      return params.hasOwnProperty(key) ? params[key] : '';
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
  return ['Data', 'Nome', 'Email', 'CNPJ', 'Score Geral'];
}
