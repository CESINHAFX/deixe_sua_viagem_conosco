async function loadFragment(url, containerId, callback) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro HTTP: ' + response.status);
    const html = await response.text();
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = html;
    markActiveLink(container);
    runFragmentScripts(container);
    if (typeof callback === 'function') callback(container);
  } catch (err) {
    console.error('Erro ao carregar fragmento:', err);
  }
}

function runFragmentScripts(container) {
  const scripts = container.getElementsByTagName('script');
  Array.from(scripts).forEach(script => {
    const newScript = document.createElement('script');
    Array.from(script.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.textContent = script.textContent;
    script.parentNode.replaceChild(newScript, script);
  });
}

function markActiveLink(container) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  el.querySelectorAll('a[href]').forEach(a => {
    const hrefFile = (a.getAttribute('href') || '').split('/').pop();
    a.classList.toggle('active', hrefFile === current);
  });
}
