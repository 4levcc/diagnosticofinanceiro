/**
 * Google Apps Script para receber os dados do Diagnóstico INOVARE
 * e gravar na planilha vinculada, além de chamar a API do Gemini.
 */

// Chave da API do Google Gemini
const GEMINI_API_KEY = 'AIzaSyBRZ5uVUMhgnmIuPl5P6EhDwivJhexS6e4';

// ATENÇÃO: Se este script não foi criado por dentro de uma planilha (Extensões > Apps Script),
// você PRECISA colocar o ID da sua planilha abaixo. O ID fica na URL da planilha:
// https://docs.google.com/spreadsheets/d/AQUI_FICA_O_ID/edit
const SPREADSHEET_ID = '1YDUnC-jqlBaB1LZrvs_2VwRvL8BGxSBFlFpnAi9o670';

function doPost(e) {
  try {
    const ss = getSpreadsheet();
    let sheet = ss.getSheets()[0];
    if (sheet.getName() !== 'leads') {
      sheet.setName('leads');
    }

    const respostasSheet = ss.getSheetByName('Respostas');
    if (respostasSheet) {
      ss.deleteSheet(respostasSheet);
    }

    const params = e.parameter || {};
    console.log('Parâmetros recebidos:', JSON.stringify(params));

    let orderedHeaders = [];
    if (params._headers) {
      orderedHeaders = String(params._headers)
        .split('|')
        .map(function(h) { return h.trim(); })
        .filter(function(h) { return h && h !== '_headers'; });
    }

    let currentHeaders = [];
    if (sheet.getLastRow() > 0) {
      currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    let finalHeaders = orderedHeaders.length > 0 ? orderedHeaders.slice() : currentHeaders.slice();
    currentHeaders.forEach(function(h) {
      const trimmed = String(h).trim();
      if (trimmed && !finalHeaders.includes(trimmed)) {
        finalHeaders.push(trimmed);
      }
    });

    if (finalHeaders.length === 0) {
      finalHeaders = buildDefaultHeaders();
    }

    if (finalHeaders.length > sheet.getLastColumn()) {
      sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    } else {
      sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]);
    }

    const row = finalHeaders.map(function(header) {
      const key = String(header).trim();
      return params.hasOwnProperty(key) ? params[key] : '';
    });

    sheet.appendRow(row);

    // ==========================================
    // CHAMADA À API DO GEMINI PARA INSIGHTS
    // ==========================================
    let aiInsights = null;
    let aiError = null;
    try {
      aiInsights = generateGeminiInsights(params);
    } catch (aiErr) {
      console.error('Erro ao gerar insights com IA:', aiErr);
      aiError = aiErr.toString();
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Dados gravados com sucesso',
        aiInsights: aiInsights,
        aiError: aiError
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Erro no doPost:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function generateGeminiInsights(params) {
  // Extrai as pontuações do objeto params para montar o prompt
  const scores = {
    geral: params['Score Geral'] || 'N/A',
    controles: params['Score Controles'] || 'N/A',
    capital: params['Score Capital'] || 'N/A',
    projecoes: params['Score Projeções'] || 'N/A',
    custos: params['Score Custos'] || 'N/A',
    resultados: params['Score Resultados'] || 'N/A',
    indicadores: params['Score Indicadores'] || 'N/A'
  };

  const prompt = `
Você é um consultor financeiro sênior da INOVARE Consultoria Empresarial, especialista em PMEs.
Analise os resultados do diagnóstico financeiro de uma empresa e forneça recomendações práticas e diretas.

A empresa obteve as seguintes pontuações (de 0 a 100%):
- Score Geral: ${scores.geral}
- Controles Financeiros: ${scores.controles}
- Capital de Giro: ${scores.capital}
- Projeções Financeiras: ${scores.projecoes}
- Custos e Preço: ${scores.custos}
- Controle de Resultados: ${scores.resultados}
- Indicadores: ${scores.indicadores}

Retorne um objeto JSON contendo exatamente as seguintes chaves (escreva em português brasileiro profissional e motivador, sendo conciso):
{
  "executiveSummary": "Um resumo de 2 a 3 frases sobre o momento da empresa e o principal gap que a impede de crescer, sem usar jargões excessivos.",
  "priorities": [
    { "dimension": "Nome da dimensão mais crítica (menor nota)", "reason": "Por que esta é a prioridade 1 (1 frase)" },
    { "dimension": "Nome da segunda dimensão mais crítica", "reason": "Por que esta é a prioridade 2 (1 frase)" },
    { "dimension": "Nome da terceira dimensão mais crítica", "reason": "Por que esta é a prioridade 3 (1 frase)" }
  ],
  "recommendations": {
    "controles": "Um parágrafo curto de recomendação prática para melhorar Controles Financeiros com base na nota.",
    "capital": "Um parágrafo curto de recomendação prática para melhorar Capital de Giro.",
    "projecoes": "Um parágrafo curto de recomendação prática para melhorar Projeções Financeiras.",
    "custos": "Um parágrafo curto de recomendação prática para melhorar Custos e Preço.",
    "resultados": "Um parágrafo curto de recomendação prática para melhorar Controle de Resultados.",
    "indicadores": "Um parágrafo curto de recomendação prática para melhorar Indicadores."
  }
}
Não inclua crases no formato JSON, retorne apenas o objeto JSON válido.
`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;
  const payload = {
    "contents": [{
      "parts": [{"text": prompt}]
    }],
    "generationConfig": {
      "response_mime_type": "application/json"
    }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  
  if (responseCode === 200) {
    const json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates.length > 0) {
      const text = json.candidates[0].content.parts[0].text;
      return JSON.parse(text); // O retorno deve ser um JSON devido ao response_mime_type
    }
    throw new Error('Resposta do Gemini sem candidates: ' + response.getContentText());
  } else {
    console.error('Erro na API do Gemini:', response.getContentText());
    throw new Error('Gemini retornou HTTP ' + responseCode + ': ' + response.getContentText());
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

