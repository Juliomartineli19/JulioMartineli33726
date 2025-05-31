const API_BASE_URL = 'http://cnms-parking-api.net.uztec.com.br';
const responseDiv = document.getElementById('response');

async function fetchData(endpoint, method = 'GET', body = null) {
    const url = `<span class="math-inline">\{API\_BASE\_URL\}</span>{endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url, options);
        const data = await res.json();
        responseDiv.textContent = JSON.stringify(data, null, 2); // Exibe a resposta formatada
        return data;
    } catch (error) {
        responseDiv.textContent = `Erro: ${error.message}`;
        console.error('Erro ao acessar a API:', error);
        return null;
    }
}

// Função para consultar vagas disponíveis
async function getAvailableSpots() {
    const data = await fetchData('/parking-spots/available');
    const availableSpotsDiv = document.getElementById('availableSpots');
    if (data && data.availableSpots !== undefined) {
        availableSpotsDiv.innerHTML = `<p>Vagas disponíveis: <strong>${data.availableSpots}</strong></p>`;
    } else {
        availableSpotsDiv.innerHTML = `<p>Não foi possível obter o número de vagas disponíveis.</p>`;
    }
}

// Função para registrar a entrada de um veículo
async function enterVehicle() {
    const plate = document.getElementById('plateInput').value;
    const vehicleType = document.getElementById('vehicleTypeInput').value;

    if (!plate) {
        alert('Por favor, insira a placa do veículo.');
        return;
    }

    const data = await fetchData('/parking-tickets/entry', 'POST', {
        plate: plate,
        vehicleType: vehicleType
    });
    if (data && data.id) {
        alert(`Entrada registrada com sucesso! Ticket ID: ${data.id}`);
    } else {
        alert('Falha ao registrar entrada. Verifique a placa e o tipo.');
    }
}

// Função para registrar a saída de um veículo
async function exitVehicle() {
    const plate = document.getElementById('exitPlateInput').value;

    if (!plate) {
        alert('Por favor, insira a placa do veículo para saída.');
        return;
    }

    const data = await fetchData('/parking-tickets/exit', 'POST', { plate: plate });
    if (data && data.exitTime) {
        alert(`Saída registrada com sucesso para a placa <span class="math-inline">\{plate\}\! Valor a pagar\: R</span>${data.totalCost.toFixed(2)}`);
    } else {
        alert('Falha ao registrar saída. Verifique a placa.');
    }
}

// Função para obter todos os tickets (exemplo, a API pode ter paginação)
async function getAllTickets() {
    const data = await fetchData('/parking-tickets');
    const allTicketsDiv = document.getElementById('allTickets');
    if (data && Array.isArray(data)) {
        let html = '<h3>Tickets Registrados:</h3><ul>';
        data.forEach(ticket => {
            html += `<li>ID: ${ticket.id}, Placa: ${ticket.plate}, Entrada: ${new Date(ticket.entryTime).toLocaleString()}, Saída: ${ticket.exitTime ? new Date(ticket.exitTime).toLocaleString() : 'N/A'}, Custo: ${ticket.totalCost ? `R$${ticket.totalCost.toFixed(2)}` : 'N/A'}</li>`;
        });
        html += '</ul>';
        allTicketsDiv.innerHTML = html;
    } else {
        allTicketsDiv.innerHTML = '<p>Não foi possível obter os tickets.</p>';
    }
}

// Opcional: Chama a função de vagas ao carregar a página
document.addEventListener('DOMContentLoaded', getAvailableSpots);