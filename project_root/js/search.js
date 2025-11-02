/**
 * @fileoverview Implementa a funcionalidade de busca com correspondência fuzzy para destinos de viagem.
 * Utiliza Fuse.js para pesquisa aproximada e cálculo de relevância ponderada baseada em características dos destinos.
 * @author CESINHAFX
 * @version 1.0.0
 */

import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

/**
 * Configurações para o mecanismo de busca Fuse.js
 * @constant {Object} searchOptions
 * @property {boolean} includeScore - Indica se deve incluir pontuação de relevância nos resultados
 * @property {Array<string>} keys - Campos nos quais realizar a busca
 * @property {number} threshold - Limite de precisão da busca (0 = exato, 1 = qualquer match)
 * @property {number} distance - Distância máxima de Levenshtein para considerar uma correspondência
 */
// Configurações da biblioteca Fuse.js para busca fuzzy
// Opções para o Fuse.js (biblioteca de busca fuzzy)
// Por que: definimos aqui como a busca vai ponderar e onde procurar os termos.
// Dependência: Fuse.js (import acima) e o arquivo `database.json` para os dados.
const searchOptions = {
  includeScore: true,
  keys: ['description', 'name', 'categories'],
  threshold: 0.4
};

// --- CHANGED: coordinate with non-module fragments loader ---
// Ensure a global flag is available for coordination with non-module fragments loader
window.headerInitialized = window.headerInitialized ?? false;

// Expose a setup function so the non-module fragments loader can call it after injecting header
window.setupHeaderButtons = function setupHeaderButtons() {
  try {
    if (window.headerInitialized) {
      console.log('[DEBUG] Header already initialized, ignoring setupHeaderButtons');
      return;
    }
    window.headerInitialized = true;

    const searchInput = document.querySelector('#Research') || document.querySelector('.nav-right input[type="text"]');
    if (!searchInput) {
      console.warn('setupHeaderButtons: campo de busca (#Research) não encontrado.');
      return;
    }

    // Ensure results container exists and is consistent
    let resultsContainer = document.getElementById('results') || document.querySelector('.search-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.id = 'results';
      resultsContainer.className = 'search-results';
      const main = document.querySelector('main');
      if (main) main.appendChild(resultsContainer);
      else if (searchInput.parentNode) searchInput.parentNode.appendChild(resultsContainer);
    }

    // Debounced input handler
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const term = e.target.value.trim();
        if (term.length >= 3) {
          if (typeof searchDestinations === 'function') searchDestinations(term);
        } else {
          resultsContainer.innerHTML = '';
        }
      }, 300);
    });

    console.log('[DEBUG] setupHeaderButtons completed');
  } catch (err) {
    console.error('setupHeaderButtons error:', err);
  }
};

// Replace DOMContentLoaded initialization to call the exposed setup function
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof window.setupHeaderButtons === 'function') {
      window.setupHeaderButtons();
    }
  } catch (e) {
    console.error('Erro ao executar setupHeaderButtons no DOMContentLoaded:', e);
  }
});


/**
 * Carrega o header e inicializa os eventos de busca
 * @returns {Promise<HTMLInputElement>} Promise que resolve quando o header for carregado e inicializado
 */
async function carregarHeaderEInicializar() {
  try {
    // Carrega o conteúdo do header
    const response = await fetch('fragments/header.html');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Converte a resposta em texto
    const html = await response.text();
    
    // Insere o HTML do header
    const headerElement = document.querySelector('header');
    if (!headerElement) {
      throw new Error('Elemento header não encontrado');
    }
    headerElement.innerHTML = html;

    // Inicializa a busca
    const searchInput = document.querySelector('#Research');
    if (!searchInput) {
      throw new Error('Input de busca não encontrado');
    }

    // Configura o evento de input
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      console.log('Termo de busca:', searchTerm);
      // Aqui você pode chamar a função de busca
    });
    return searchInput;
  } catch (error) {
    console.error('Erro ao carregar header ou inicializar busca:', error);
    return null;
  }
}

// --- Funções auxiliares e lógica de busca ---

function getAllItems(database) {
  const items = [];
  ['countries', 'temples', 'beaches'].forEach(category => {
    if (database[category]) {
      items.push(...database[category]);
    }
  });
  return items;
}

function normalizeText(text) {
  return (text || '').toLowerCase()
    .normalize('NFD')
    .replace(/[[\u0300-\u036f]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateScore(item, fuseScore) {
  try {
    const baseScore = 1 - (fuseScore || 1);
    const weights = { culture: 0.3, nature: 0.25, adventure: 0.2, relaxation: 0.15, gastronomy: 0.1 };
    let weighted = baseScore;
    if (Array.isArray(item.categories)) {
      item.categories.forEach(cat => {
        if (weights[cat]) weighted += weights[cat];
      });
    }
    return weighted;
  } catch (err) {
    console.error('Erro ao calcular score:', err);
    return 0;
  }
}

// searchDestinations definido no escopo do módulo para ser usado pelo setupHeaderButtons
async function searchDestinations(searchTerm) {
  // Encontre o container de resultados existente
  const resultsContainer = document.getElementById('results') || document.querySelector('.search-results');
  if (!resultsContainer) return;
  // Estado de loading
  resultsContainer.innerHTML = `\
    <div class="loading-state">\
      <div class="loading-spinner"></div>\
      <p>Buscando os melhores destinos...</p>\
    </div>`;

  try {
    const response = await fetch('./database.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    const fuse = new Fuse(getAllItems(data), searchOptions);
    const results = fuse.search(normalizeText(searchTerm));

    const recommendations = results.map(r => ({
      ...r.item,
      score: calculateScore(r.item, r.score)
    })).sort((a, b) => (b.score || 0) - (a.score || 0));

    // Render
    resultsContainer.innerHTML = '';
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      resultsContainer.innerHTML = '<p class="empty">Nenhum destino encontrado</p>';
      return;
    }

    const topTwo = recommendations.slice(0, 2);
    const citiesSection = document.createElement('div');
    citiesSection.className = 'cities-recommendation';
    citiesSection.innerHTML = topTwo.map(city => `\
      <div class="recommendation-card">\
        <img src="${city.imageUrl || 'images/placeholder.png'}" alt="${city.name}" onerror="this.src='images/placeholder.png'">\
        <div class="recommendation-card-content">\
          <h3>${city.name}</h3>\
          <p class="score">Match: ${Math.round((city.score || 0) * 100)}%</p>\
          <p>${city.description || 'Sem descrição disponível'}</p>\
        </div>\
      </div>`).join('');

    resultsContainer.appendChild(citiesSection);
  } catch (err) {
    console.error('Erro na busca:', err);
    const resultsContainer = document.getElementById('results') || document.querySelector('.search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `\
        <div class="error-state">\
          <p>Erro ao buscar destinos. Tente novamente.</p>\
        </div>`;
    }
  }
}