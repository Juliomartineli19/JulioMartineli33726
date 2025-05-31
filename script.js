/**
 * @file script.js
 * @description Lógica JavaScript para interagir com a API de gerenciamento de estacionamento.
 * Inclui funções para registrar entrada/saída, consultar tempo, verificar status,
 * atualizar dados e cancelar registros de veículos.
 */

// Objeto que contém todos os endpoints da API de estacionamento.
// Cada chave representa uma funcionalidade e seu valor é a URL correspondente.
const ENDPOINTS = {
    create: 'http://cnms-parking-api.net.uztec.com.br/api/v1/entry',    // Endpoint para registrar a entrada de um veículo
    stayTime: 'http://cnms-parking-api.net.uztec.com.br/api/v1/time/',  // Endpoint para consultar o tempo de permanência
    exit: 'http://cnms-parking-api.net.uztec.com.br/api/v1/exit/',      // Endpoint para registrar a saída de um veículo
    verify: 'http://cnms-parking-api.net.uztec.com.br/api/v1/check/',  // Endpoint para verificar se um veículo está no estacionamento
    update: 'http://cnms-parking-api.net.uztec.com.br/api/v1/update/',  // Endpoint para atualizar os dados de um veículo
    cancel: 'http://cnms-parking-api.net.uztec.com.br/api/v1/cancel/'  // Endpoint para cancelar/remover um registro
};

/**
 * Função genérica para enviar requisições HTTP para a API.
 * Trata as respostas e erros de forma padronizada.
 * @param {string} url - A URL completa do endpoint da API.
 * @param {string} method - O método HTTP (GET, POST, PATCH, PUT, DELETE). Padrão: 'GET'.
 * @param {object|null} payload - O corpo da requisição, se houver (para POST, PUT, PATCH). Padrão: null.
 * @returns {Promise<object>} Uma promessa que resolve com os dados JSON da resposta da API.
 * @throws {Error} Lança um erro se a requisição falhar ou a resposta não for OK.
 */
async function sendRequest(url, method = 'GET', payload = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        // Adiciona o corpo da requisição apenas se houver um payload
        body: payload ? JSON.stringify(payload) : null
    };

    try {
        const response = await fetch(url, options);

        // Verifica se a resposta da rede foi bem-sucedida (status 2xx)
        if (!response.ok) {
            let errorData;
            try {
                // Tenta parsear a resposta como JSON para obter detalhes do erro
                errorData = await response.json();
            } catch (jsonError) {
                // Se não for JSON, tenta ler como texto simples
                errorData = await response.text();
            }
            // Lança um erro com detalhes sobre a falha da requisição
            throw new Error(`Requisição falhou (${response.status} ${response.statusText}): ${JSON.stringify(errorData) || errorData}`);
        }

        // Retorna os dados JSON da resposta
        return await response.json();
    } catch (error) {
        // Captura erros de rede ou erros lançados acima e os re-lança
        console.error('Erro na função sendRequest:', error);
        throw error; // Propaga o erro para o chamador
    }
}

/**
 * Exibe uma mensagem de resultado na interface do usuário.
 * @param {HTMLElement} resultElement - O elemento HTML onde a mensagem será exibida.
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} isSuccess - True se a operação foi bem-sucedida, false caso contrário.
 */
function displayResult(resultElement, message, isSuccess) {
    resultElement.textContent = message;
    // Remove classes anteriores e adiciona a classe apropriada para estilização
    resultElement.classList.remove('success', 'error');
    resultElement.classList.add(isSuccess ? 'success' : 'error');
    // Opcional: Limpa a mensagem após alguns segundos
    setTimeout(() => {
        resultElement.textContent = '';
        resultElement.classList.remove('success', 'error');
    }, 5000); // Mensagem desaparece após 5 segundos
}

// Adiciona um listener para o evento 'DOMContentLoaded' para garantir que o HTML esteja carregado
document.addEventListener('DOMContentLoaded', () => {

    // Listener para o formulário de Entrada de Veículo
    document.getElementById('entryForm').addEventListener('submit', async (e) => {
        e.preventDefault(); // Previne o comportamento padrão de recarregar a página

        const modelInput = document.getElementById('entryModel');
        const plateInput = document.getElementById('entryPlate');
        const entryResult = document.getElementById('entryResult');

        const modelo = modelInput.value.trim();
        const placa = plateInput.value.trim();

        // Validação básica dos inputs
        if (!modelo || !placa) {
            displayResult(entryResult, 'Por favor, preencha o modelo e a placa.', false);
            return;
        }

        try {
            // Envia a requisição POST para registrar a entrada
            await sendRequest(ENDPOINTS.create, 'POST', { model: modelo, plate: placa });
            displayResult(entryResult, 'Entrada registrada com sucesso!', true);
            // Limpa os campos do formulário após o sucesso
            modelInput.value = '';
            plateInput.value = '';
        } catch (err) {
            // Exibe a mensagem de erro detalhada da requisição
            displayResult(entryResult, `Erro ao registrar entrada: ${err.message}`, false);
        }
    });

    // Listener para o formulário de Consulta de Tempo Estacionado
    document.getElementById('timeForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const plateInput = document.getElementById('timePlate');
        const timeResult = document.getElementById('timeResult');

        const placa = plateInput.value.trim();

        if (!placa) {
            displayResult(timeResult, 'Por favor, insira a placa para consultar o tempo.', false);
            return;
        }

        try {
            // Envia a requisição GET para consultar o tempo de permanência
            const data = await sendRequest(ENDPOINTS.stayTime + placa, 'GET');
            if (data && data.parkedTime !== undefined) {
                displayResult(timeResult, `Tempo estacionado: ${data.parkedTime.toFixed(2)} minutos`, true);
            } else {
                displayResult(timeResult, 'Não foi possível obter o tempo estacionado. Placa não encontrada ou erro na API.', false);
            }
        } catch (err) {
            displayResult(timeResult, `Erro ao consultar tempo: ${err.message}`, false);
        }
    });

    // Listener para o formulário de Saída de Veículo
    document.getElementById('exitForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const plateInput = document.getElementById('exitPlate');
        const exitResult = document.getElementById('exitResult');

        const placa = plateInput.value.trim();

        if (!placa) {
            displayResult(exitResult, 'Por favor, insira a placa para registrar a saída.', false);
            return;
        }

        try {
            // Envia a requisição PATCH para registrar a saída
            // A API de saída pode retornar dados como custo total, então é bom capturar
            const data = await sendRequest(ENDPOINTS.exit + placa, 'PATCH');
            if (data && data.totalCost !== undefined) { // Assumindo que a API retorna totalCost
                displayResult(exitResult, `Saída registrada com sucesso! Custo Total: R$${data.totalCost.toFixed(2)}`, true);
            } else {
                 displayResult(exitResult, 'Saída registrada com sucesso!', true);
            }
            plateInput.value = ''; // Limpa o campo após o sucesso
        } catch (err) {
            displayResult(exitResult, `Erro ao registrar saída: ${err.message}`, false);
        }
    });

    // Listener para o formulário de Verificação de Veículo
    document.getElementById('checkForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const plateInput = document.getElementById('checkPlate');
        const checkResult = document.getElementById('checkResult');

        const placa = plateInput.value.trim();

        if (!placa) {
            displayResult(checkResult, 'Por favor, insira a placa para verificar.', false);
            return;
        }

        try {
            // Envia a requisição GET para verificar o status do veículo
            const data = await sendRequest(ENDPOINTS.verify + placa, 'GET');
            // A API retorna um objeto com 'entryTime' se o veículo estiver no estacionamento
            const status = data && data.entryTime ? 'SIM' : 'NÃO';
            displayResult(checkResult, `Veículo está no estacionamento? ${status}`, true);
        } catch (err) {
            displayResult(checkResult, `Erro ao verificar: ${err.message}`, false);
        }
    });

    // Listener para o formulário de Atualização de Dados do Veículo
    document.getElementById('updateForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const plateInput = document.getElementById('updatePlate');
        const modelInput = document.getElementById('updateModel');
        const updateResult = document.getElementById('updateResult');

        const placa = plateInput.value.trim();
        const modelo = modelInput.value.trim();

        if (!placa || !modelo) {
            displayResult(updateResult, 'Por favor, preencha a placa e o novo modelo.', false);
            return;
        }

        try {
            // Envia a requisição PUT para atualizar os dados
            await sendRequest(ENDPOINTS.update + placa, 'PUT', { plate: placa, model: modelo });
            displayResult(updateResult, 'Dados atualizados com sucesso!', true);
            modelInput.value = ''; // Limpa o campo do modelo
        } catch (err) {
            displayResult(updateResult, `Erro ao atualizar: ${err.message}`, false);
        }
    });

    // Listener para o formulário de Cancelamento/Remoção de Registro
    document.getElementById('cancelForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const plateInput = document.getElementById('cancelPlate');
        const cancelResult = document.getElementById('cancelResult');

        const placa = plateInput.value.trim();

        if (!placa) {
            displayResult(cancelResult, 'Por favor, insira a placa para remover o registro.', false);
            return;
        }

        try {
            // Envia a requisição DELETE para remover o registro
            await sendRequest(ENDPOINTS.cancel + placa, 'DELETE');
            displayResult(cancelResult, 'Registro removido com sucesso!', true);
            plateInput.value = ''; // Limpa o campo após o sucesso
        } catch (err) {
            displayResult(cancelResult, `Erro ao remover: ${err.message}`, false);
        }
    });
});