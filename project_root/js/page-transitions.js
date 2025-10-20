// Gerenciador de transições de página
class PageTransitionManager {
    constructor() {
        this.bindEvents();
        this.setupPopState();
    }

    bindEvents() {
        document.addEventListener('click', (e) => this.handleClick(e));
    }

    setupPopState() {
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname, false);
        });
    }

    async handleClick(e) {
        const link = e.target.closest('a');
        if (!this.shouldHandleLink(link)) return;
        
        e.preventDefault();
        const targetUrl = link.getAttribute('href');
        this.loadPage(targetUrl, true);
    }

    shouldHandleLink(link) {
        if (!link) return false;
        const href = link.getAttribute('href');
        return href && 
               !href.startsWith('http') && 
               !href.startsWith('#') && 
               !link.hasAttribute('target');
    }

    async loadPage(url, addToHistory = true) {
        const main = document.querySelector('main');
        if (!main) return;

        // Animação de saída
        main.classList.add('page-exit');
        await this.wait(300);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            
            // Extrair conteúdo da nova página
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newMain = doc.querySelector('main');
            
            if (newMain) {
                // Atualizar conteúdo e disparar animação de entrada
                main.innerHTML = newMain.innerHTML;
                main.classList.remove('page-exit');
                main.classList.add('page-enter');
                
                // Atualizar histórico se necessário
                if (addToHistory) {
                    history.pushState({ path: url }, '', url);
                }
                
                // Limpar classe após animação
                setTimeout(() => main.classList.remove('page-enter'), 600);
            }
        } catch (error) {
            console.error('Erro ao carregar página:', error);
            // Fallback: navegação normal em caso de erro
            window.location.href = url;
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new PageTransitionManager();
});