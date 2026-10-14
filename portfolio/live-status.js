// A health response is a short-lived observation, not a persistent connection.
export function monitorLiveService(api, onChange, env = globalThis) {
  let state = {state:'checking', ready:false}, checked = 0, next = 0;
  let pending, controller, generation = 0, stopped = false;
  const now = () => env.Date.now();
  function current() {
    const age = checked ? now() - checked : Infinity;
    if (state.ready && (age < 0 || age > 15000 || state.gpu.age_seconds * 1000 + age > 35000)) return {state:'stale', ready:false};
    return {...state, ageSeconds:checked ? Math.max(0, Math.floor(age / 1000)) : null};
  }
  function publish() { if (!stopped) onChange(current()); }
  function invalidate(reason = 'checking') {
    generation++; controller?.abort(); pending = null;
    state = {state:reason, ready:false}; checked = 0; next = 0; publish();
  }
  function check() {
    if (stopped) return Promise.resolve(current());
    if (!env.navigator.onLine) { invalidate('browser-offline'); return Promise.resolve(current()); }
    if (env.document.hidden) { invalidate('stale'); return Promise.resolve(current()); }
    if (pending) return pending;
    if (state.state === 'limited' && now() < next) return Promise.resolve(current());
    const id = ++generation, started = now();
    controller = new AbortController();
    const requestController = controller;
    const signal = controller.signal, timer = env.setTimeout(() => requestController.abort(), 4000);
    pending = (async () => {
      let delay = 10000;
      try {
        const response = await env.fetch(api.replace(/\/+$/, '') + '/health', {cache:'no-store', redirect:'error', signal});
        if (!response.ok) {
          const error = new Error('Health unavailable'); error.status = response.status;
          error.retry = Number(response.headers.get('Retry-After')); throw error;
        }
        if (response.headers.get('X-API-Version') !== '1') throw Error('Unexpected health response');
        const body = await response.json();
        if (id !== generation) return current();
        // Active-time browser timeouts can pause during sleep or bfcache.
        if (now() - started > 4000 || now() < started) throw Error('Health response arrived too late');
        const gpuReady = body.gpu?.state === 'ready' && body.gpu.age_seconds !== null && body.gpu.age_seconds <= 35;
        const ready = body.ready === true && gpuReady && ['available','busy'].includes(body.state);
        state = {...body, state:ready ? body.state : (['paused','checking','gpu-unavailable'].includes(body.state) ? body.state : 'gpu-unavailable'), ready};
        checked = now();
        if (state.state === 'checking') delay = 2000;
      } catch (error) {
        if (id !== generation) return current();
        state = {ready:false, state:error.status === 429 ? 'limited' : [401,403].includes(error.status) ? 'access-blocked' : 'disconnected'};
        checked = 0;
        if (state.state === 'limited') delay = Math.max(10000, Math.min(3600000, (error.retry || 10) * 1000));
      } finally {
        env.clearTimeout(timer);
        if (id === generation) { pending = null; next = now() + delay; publish(); }
      }
      return current();
    })();
    return pending;
  }
  function resume() { invalidate(); if (!env.document.hidden) check(); }
  function visibility() { if (env.document.hidden) invalidate('stale'); else resume(); }
  function offline() { invalidate('browser-offline'); }
  const timer = env.setInterval(() => {
    if (env.document.hidden) return;
    const snapshot = current();
    if (snapshot.state === 'stale' && state.ready) { invalidate('stale'); }
    publish(); if (!pending && now() >= next) check();
  }, 1000);
  env.document.addEventListener('visibilitychange', visibility);
  for (const event of ['focus','pageshow','online']) env.addEventListener(event, resume);
  env.addEventListener('offline', offline);
  publish(); check();
  return {current, check, invalidate, stop() {
    stopped = true; generation++; controller?.abort(); env.clearInterval(timer);
    env.document.removeEventListener('visibilitychange', visibility);
    for (const event of ['focus','pageshow','online']) env.removeEventListener(event, resume);
    env.removeEventListener('offline', offline);
  }};
}

export function liveStatusText(status) {
  const labels = {
    checking:'Checking live connection...', stale:'Live status expired; checking again...',
    available:'Live GPU ready', busy:`Live GPU busy (${status.queued || 0} waiting)`,
    paused:'Live GPU paused', 'gpu-unavailable':'GPU not ready',
    disconnected:'Live service disconnected', 'browser-offline':'Browser offline',
    limited:'Live request limit reached; retrying shortly', 'access-blocked':'Live access blocked',
  };
  const label = labels[status.state] || 'Live service unavailable';
  return status.ready ? `${label} · checked ${status.ageSeconds || 0}s ago` : `${label} · saved results available`;
}

export function renderLiveStatus(node, status) {
  node.textContent = liveStatusText(status);
  node.classList.toggle('ready', status.ready && status.state === 'available');
  node.dataset.liveState = status.state;
  node.title = status.gpu?.age_seconds != null ? `GPU check: ${status.gpu.age_seconds} seconds before this health response. Availability can change; each run checks again.` : '';
}
