const STORAGE_KEY = 'ordens_servico';
let ordens = [];
let proximoId = 1;
let graficoStatus = null;
let graficoUrgencia = null;

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function diasAtePrazo(dataPrazo) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const prazo = new Date(dataPrazo);
    prazo.setHours(0,0,0,0);
    return Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
}

function ordenarOSLista(ativas) {
    return [...ativas].sort((a, b) => {
        const aUrgenteOuProximo = a.urgencia || diasAtePrazo(a.prazo) <= 2;
        const bUrgenteOuProximo = b.urgencia || diasAtePrazo(b.prazo) <= 2;
        const aPronto = a.status === 'pronto';
        const bPronto = b.status === 'pronto';
        let prioridadeA = aPronto ? 2 : (aUrgenteOuProximo ? 0 : 1);
        let prioridadeB = bPronto ? 2 : (bUrgenteOuProximo ? 0 : 1);
        if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;
        const diffA = diasAtePrazo(a.prazo);
        const diffB = diasAtePrazo(b.prazo);
        if (diffA !== diffB) return diffA - diffB;
        return parseInt(a.id.replace('OS-','')) - parseInt(b.id.replace('OS-',''));
    });
}

function carregarDados() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) {
        ordens = JSON.parse(dados);
        if (ordens.length > 0) {
            const ids = ordens.map(o => parseInt(o.id.replace('OS-', '')));
            proximoId = Math.max(...ids) + 1;
        }
    } else {
        ordens = [
            { id: 'OS-1', cliente: 'Maria Silva', telefone: '(11) 98765-4321', email: 'maria@email.com', equipamento: 'Notebook Dell', descricaoServico: 'Trocar teclado', dataEntrada: '2026-05-18', prazo: '2026-05-21', urgencia: false, status: 'analisado' },
            { id: 'OS-2', cliente: 'Carlos Souza', telefone: '(21) 91234-5678', email: '', equipamento: 'PC Gamer', descricaoServico: 'Upgrade placa de vídeo', dataEntrada: '2026-05-20', prazo: '2026-05-22', urgencia: true, status: 'em_andamento' },
            { id: 'OS-3', cliente: 'Ana Lima', telefone: '(31) 99876-5432', email: 'ana@email.com', equipamento: 'MacBook Pro', descricaoServico: 'Trocar SSD', dataEntrada: '2026-05-19', prazo: '2026-05-23', urgencia: false, status: 'pronto' }
        ];
        proximoId = 4;
        salvarDados();
    }
    renderizarTabelas();
    atualizarGraficos();
}
function salvarDados() { localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens)); }
function gerarId() { return `OS-${proximoId++}`; }

const modal = document.getElementById('modal');
const btnAbrir = document.getElementById('btnAbrirModal');
const spanClose = document.querySelector('.close-modal');

function abrirModal(editId = null) {
    modal.style.display = 'block';
    if (editId) {
        const os = ordens.find(o => o.id === editId);
        if (os) {
            document.getElementById('edit-id').value = os.id;
            document.getElementById('cliente').value = os.cliente;
            document.getElementById('telefone').value = os.telefone || '';
            document.getElementById('email').value = os.email || '';
            document.getElementById('equipamento').value = os.equipamento || '';
            document.getElementById('descricaoServico').value = os.descricaoServico || '';
            document.getElementById('dataEntrada').value = os.dataEntrada;
            document.getElementById('prazo').value = os.prazo;
            document.getElementById('urgencia').checked = os.urgencia;
            document.getElementById('status').value = os.status;
            document.getElementById('modal-title').textContent = `✏️ Editando OS ${os.id}`;
        }
    } else {
        limparFormModal();
        document.getElementById('modal-title').textContent = '➕ Nova OS';
    }
}
function fecharModal() { modal.style.display = 'none'; limparFormModal(); }
function limparFormModal() {
    document.getElementById('edit-id').value = '';
    document.getElementById('cliente').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('equipamento').value = '';
    document.getElementById('descricaoServico').value = '';
    document.getElementById('dataEntrada').value = '';
    document.getElementById('prazo').value = '';
    document.getElementById('urgencia').checked = false;
    document.getElementById('status').value = 'analisado';
}
btnAbrir.onclick = () => abrirModal();
spanClose.onclick = fecharModal;
window.onclick = (e) => { if (e.target === modal) fecharModal(); };

function salvarOS() {
    const cliente = document.getElementById('cliente').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const email = document.getElementById('email').value.trim();
    const equipamento = document.getElementById('equipamento').value.trim();
    const descricaoServico = document.getElementById('descricaoServico').value.trim();
    const dataEntrada = document.getElementById('dataEntrada').value;
    const prazo = document.getElementById('prazo').value;
    const urgencia = document.getElementById('urgencia').checked;
    const status = document.getElementById('status').value;
    const editId = document.getElementById('edit-id').value;

    if (!cliente || !dataEntrada || !prazo) {
        alert('Preencha cliente, data de entrada e prazo.');
        return;
    }
    if (editId) {
        const os = ordens.find(o => o.id === editId);
        if (os) {
            Object.assign(os, { cliente, telefone, email, equipamento, descricaoServico, dataEntrada, prazo, urgencia, status });
        }
    } else {
        ordens.push({ id: gerarId(), cliente, telefone, email, equipamento, descricaoServico, dataEntrada, prazo, urgencia, status });
    }
    salvarDados();
    renderizarTabelas();
    atualizarGraficos();
    fecharModal();
}
function editarOS(id) { abrirModal(id); }
function excluirOS(id) {
    if (confirm(`Excluir OS ${id}?`)) {
        ordens = ordens.filter(o => o.id !== id);
        salvarDados();
        renderizarTabelas();
        atualizarGraficos();
        if (document.getElementById('edit-id').value === id) fecharModal();
    }
}
function cancelarEdicao() { fecharModal(); }

function renderizarTabelas() {
    const termoBusca = document.getElementById('busca').value.toLowerCase().trim();
    let ativas = ordens.filter(o => o.status !== 'entregue');
    const entregues = ordens.filter(o => o.status === 'entregue');
    if (termoBusca) {
        ativas = ativas.filter(os => 
            os.id.toLowerCase().includes(termoBusca) ||
            os.cliente.toLowerCase().includes(termoBusca) ||
            (os.equipamento && os.equipamento.toLowerCase().includes(termoBusca)) ||
            (os.telefone && os.telefone.toLowerCase().includes(termoBusca)) ||
            (os.descricaoServico && os.descricaoServico.toLowerCase().includes(termoBusca))
        );
    }
    const ativasOrdenadas = ordenarOSLista(ativas);
    const tbodyAtivas = document.querySelector('#tabela-ativas tbody');
    tbodyAtivas.innerHTML = '';
    ativasOrdenadas.forEach(os => {
        let contato = '';
        if (os.telefone) contato += `📞 ${escapeHTML(os.telefone)}`;
        if (os.email) { if (contato) contato += '<br>'; contato += `✉️ ${escapeHTML(os.email)}`; }
        if (!contato) contato = '-';
        let prazoClass = '';
        const dias = diasAtePrazo(os.prazo);
        if (os.urgencia || (dias <= 2 && dias >= 0)) prazoClass = 'class="prazo-urgente"';
        else if (dias < 0) prazoClass = 'class="prazo-vencido"';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHTML(os.id)}</strong></td>
            <td>${escapeHTML(os.cliente)}</td>
            <td>${contato}</td>
            <td>${escapeHTML(os.equipamento || '-')}</td>
            <td>${escapeHTML(os.descricaoServico || '-')}</td>
            <td ${prazoClass}>${formatarData(os.prazo)} ${os.urgencia ? '🔴' : ''}</td>
            <td>${traduzirStatus(os.status)}</td>
            <td class="acoes">
                <button onclick="editarOS('${escapeHTML(os.id)}')">✏️</button>
                <button onclick="excluirOS('${escapeHTML(os.id)}')">🗑️</button>
                <button onclick="baixarPDFIndividual('${escapeHTML(os.id)}')">📄</button>
            </td>
        `;
        tbodyAtivas.appendChild(tr);
    });
    const tbodyEntregues = document.querySelector('#tabela-entregues tbody');
    tbodyEntregues.innerHTML = '';
    entregues.sort((a,b)=>parseInt(a.id.replace('OS-',''))-parseInt(b.id.replace('OS-','')));
    entregues.forEach(os => {
        let contato = '';
        if (os.telefone) contato += `📞 ${escapeHTML(os.telefone)}`;
        if (os.email) { if (contato) contato += '<br>'; contato += `✉️ ${escapeHTML(os.email)}`; }
        if (!contato) contato = '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHTML(os.id)}</strong></td>
            <td>${escapeHTML(os.cliente)}</td>
            <td>${contato}</td>
            <td>${escapeHTML(os.equipamento || '-')}</td>
            <td>${escapeHTML(os.descricaoServico || '-')}</td>
            <td>${formatarData(os.prazo)}</td>
            <td class="acoes"><button onclick="editarOS('${escapeHTML(os.id)}')">✏️</button>
            <button onclick="excluirOS('${escapeHTML(os.id)}')">🗑️</button>
            <button onclick="baixarPDFIndividual('${escapeHTML(os.id)}')">📄</button></td>
        `;
        tbodyEntregues.appendChild(tr);
    });
}

function atualizarGraficos() {
    if (graficoStatus) graficoStatus.destroy();
    if (graficoUrgencia) graficoUrgencia.destroy();
    const naoEntregues = ordens.filter(o => o.status !== 'entregue');
    const contagemStatus = { analisado: 0, em_andamento: 0, pronto: 0 };
    naoEntregues.forEach(os => contagemStatus[os.status]++);
    const ctxStatus = document.getElementById('grafico-status').getContext('2d');
    graficoStatus = new Chart(ctxStatus, {
        type: 'doughnut',
        data: { labels: ['Analisado', 'Em andamento', 'Pronto'], datasets: [{ data: [contagemStatus.analisado, contagemStatus.em_andamento, contagemStatus.pronto], backgroundColor: ['#D4AF37', '#3A7B8C', '#154C56'], borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#e0e0e0' } } } }
    });
    let urgenteSim = 0, urgenteNao = 0;
    naoEntregues.forEach(os => os.urgencia ? urgenteSim++ : urgenteNao++);
    const ctxUrgencia = document.getElementById('grafico-urgencia').getContext('2d');
    graficoUrgencia = new Chart(ctxUrgencia, {
        type: 'bar',
        data: { labels: ['Urgente', 'Normal'], datasets: [{ label: 'Quantidade', data: [urgenteSim, urgenteNao], backgroundColor: ['#e74c3c', '#5F7D8C'], borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: '#e0e0e0' }, grid: { color: '#333' } }, x: { ticks: { color: '#e0e0e0' } } } }
    });
}

function exportarListaExcel(tipo) {
    let lista = [];
    if (tipo === 'ativas') lista = ordens.filter(o => o.status !== 'entregue');
    else if (tipo === 'entregues') lista = ordens.filter(o => o.status === 'entregue');
    else lista = [...ordens];
    let csv = 'ID;Cliente;Telefone;Email;Equipamento;Serviço;Data Entrada;Prazo;Urgente;Status\n';
    lista.forEach(os => {
        csv += `${os.id};${os.cliente};${os.telefone || ''};${os.email || ''};${os.equipamento || ''};${os.descricaoServico || ''};${formatarData(os.dataEntrada)};${formatarData(os.prazo)};${os.urgencia ? 'Sim' : 'Não'};${traduzirStatusTexto(os.status)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lista_os_${tipo}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}
function exportarListaPDF(tipo) {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) { alert('jsPDF não carregou.'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let lista = [], titulo = '';
    if (tipo === 'ativas') { lista = ordens.filter(o => o.status !== 'entregue'); titulo = 'OS em Aberto'; }
    else if (tipo === 'entregues') { lista = ordens.filter(o => o.status === 'entregue'); titulo = 'OS Entregues'; }
    else { lista = [...ordens]; titulo = 'Todas as OS'; }
    const dados = lista.map(os => [os.id, os.cliente, os.telefone || '', os.equipamento || '', os.descricaoServico || '', formatarData(os.prazo), os.urgencia ? 'Sim' : 'Não', traduzirStatusTexto(os.status)]);
    if (typeof doc.autoTable === 'function') {
        doc.autoTable({ head: [['ID','Cliente','Telefone','Equipamento','Serviço','Prazo','Urgente','Status']], body: dados, startY: 20, styles: { fontSize: 8, textColor: [0,0,0] }, headStyles: { fillColor: [21,76,86] } });
    } else {
        doc.setFontSize(10);
        let y = 25;
        dados.forEach(linha => { doc.text(linha.join(' | '), 14, y); y += 7; });
    }
    doc.text(titulo, 14, 15);
    doc.save(`lista_os_${tipo}_${new Date().toISOString().slice(0,10)}.pdf`);
}
function baixarPDFIndividual(id) {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) { alert('jsPDF não carregou.'); return; }
    const os = ordens.find(o => o.id === id);
    if (!os) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Ordem de Serviço: ${os.id}`, 14, 20);
    doc.setFontSize(12);
    let y = 30;
    const campos = [['Cliente:', os.cliente],['Telefone:', os.telefone||'Não informado'],['E-mail:', os.email||'Não informado'],['Equipamento:', os.equipamento||'Não informado'],['Serviço:', os.descricaoServico||'Não informado'],['Data entrada:', formatarData(os.dataEntrada)],['Prazo:', formatarData(os.prazo)],['Urgente:', os.urgencia ? 'Sim' : 'Não'],['Status:', traduzirStatusTexto(os.status)]];
    campos.forEach(([label, valor]) => { doc.text(`${label} ${valor}`, 14, y); y += 8; });
    doc.save(`os_${os.id}_${os.cliente.replace(/\s/g, '_')}.pdf`);
}

function exportarBackup() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (!dados) { alert('Sem dados.'); return; }
    const blob = new Blob([dados], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_os_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
}
function importarBackupPrompt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => { if (e.target.files[0]) importarBackup(e.target.files[0]); };
    input.click();
}
function importarBackup(file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const dadosJson = evt.target.result;
            const parsed = JSON.parse(dadosJson);
            if (!Array.isArray(parsed)) throw new Error('Inválido');
            if (confirm(`Substituir ${ordens.length} OS por ${parsed.length} do backup?`)) {
                localStorage.setItem(STORAGE_KEY, dadosJson);
                location.reload();
            }
        } catch(err) { alert('Arquivo inválido'); }
    };
    reader.readAsText(file);
}
function formatarData(dataISO) { if (!dataISO) return ''; const [ano, mes, dia] = dataISO.split('-'); return `${dia}/${mes}/${ano}`; }
function traduzirStatus(status) { const mapa = { 'analisado':'📋 Analisado','em_andamento':'🔧 Em andamento','pronto':'✅ Pronto','entregue':'📦 Entregue' }; return mapa[status] || status; }
function traduzirStatusTexto(status) { const mapa = { 'analisado':'Analisado','em_andamento':'Em andamento','pronto':'Pronto','entregue':'Entregue' }; return mapa[status] || status; }

carregarDados();