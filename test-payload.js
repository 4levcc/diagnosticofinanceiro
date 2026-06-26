// Teste local da construção do payload enviado ao Google Apps Script
// Rode: node test-payload.js

const dimensions = [
  { id: 'controles', name: 'Controles Internos', items: [
    { label: 'Existem controles formais' },
    { label: 'Auditoria interna' }
  ]},
  { id: 'capital', name: 'Gestão de Capital', items: [
    { label: 'Fluxo de caixa' }
  ]}
];

const state = {
  controles: [3, 2],
  capital: [4]
};

function getDimAvg(id) {
  const vals = state[id].filter(v => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const dimNames = {
  controles: 'Controles',
  capital: 'Capital'
};

const nome = 'João Silva';
const email = 'joao@email.com';
const cnpj = '12.345.678/0001-90';

const scoreGeralRaw = ((dimensions.map(d => getDimAvg(d.id)).reduce((a, b) => a + b, 0) / dimensions.length - 1) / 3 * 100);
const scoreGeral = (isFinite(scoreGeralRaw) ? scoreGeralRaw : 0).toFixed(1) + '%';

const payloadEntries = [
  ['Data', new Date().toLocaleString('pt-BR')],
  ['Nome', nome],
  ['Email', email],
  ['CNPJ', cnpj],
  ['Score Geral', scoreGeral]
];

dimensions.forEach((dim) => {
  const dimPrefix = dimNames[dim.id];
  const dimAvgRaw = ((getDimAvg(dim.id) - 1) / 3 * 100);
  payloadEntries.push([`Score ${dimPrefix}`, (isFinite(dimAvgRaw) ? dimAvgRaw : 0).toFixed(1) + '%']);
  dim.items.forEach((item, idx) => {
    payloadEntries.push([`[${dimPrefix}] ${item.label}`, state[dim.id][idx] || 0]);
  });
});

const urlParams = new URLSearchParams();
payloadEntries.forEach(([key, value]) => urlParams.append(key, value));
urlParams.append('_headers', payloadEntries.map(([key]) => key).join('|'));
const body = urlParams.toString();

console.log('Payload gerado:');
console.log(body);
console.log('\nEntries:');
payloadEntries.forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Simula o que o Apps Script receberia em e.parameter
const parsed = {};
for (const [k, v] of urlParams.entries()) {
  parsed[k] = v;
}
console.log('\nParâmetros decodificados (simulação e.parameter):');
console.log(parsed);
