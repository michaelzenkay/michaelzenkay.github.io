import {monitorLiveService, renderLiveStatus} from './live-status.js?v=20261013';
const runtimeUrl = new URL('runtime.json', import.meta.url);
(async () => {
  try {
    const response = await fetch(runtimeUrl, {cache:'no-store', signal:AbortSignal.timeout(5000)});
    if (!response.ok) throw Error('Runtime unavailable');
    const runtime = await response.json();
    for (const node of document.querySelectorAll('[data-service]')) {
      const key = node.dataset.service, service = runtime[key];
      if (key === 'tumor' && service?.ready && service.mode === 'live' && service.api) {
        monitorLiveService(service.api, status => renderLiveStatus(node, status));
      } else {
        node.textContent = service?.ready ? 'Saved outputs ready' : 'Demo offline · case study available';
        node.classList.toggle('ready', Boolean(service?.ready));
      }
    }
  } catch {
    for (const node of document.querySelectorAll('[data-service]')) {
      node.textContent = 'Demo offline · case study available';
      node.classList.remove('ready');
    }
  }
})();
