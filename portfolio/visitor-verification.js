// Tokens stay in memory, are used once, and are verified by the inference API.
export function visitorVerification(api) {
  let widget, token = '', issued = 0, initializing, waiting;
  const fail = message => {
    token = '';
    if (waiting) { clearTimeout(waiting.timer); waiting.reject(new Error(message)); waiting = null; }
  };
  async function initialize() {
    if (widget !== undefined) return true;
    if (initializing) return initializing;
    initializing = (async () => {
      const response = await fetch(api.replace(/\/+$/, '') + '/api/v1/info', {cache:'no-store', signal:AbortSignal.timeout(5000)});
      if (!response.ok) throw new Error('Live verification unavailable');
      const {turnstile_site_key: sitekey} = await response.json();
      if (!sitekey) return false;
      if (!window.turnstile) await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => reject(new Error('Visitor verification could not load')), 15000);
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.onload = () => { clearTimeout(timer); resolve(); };
        script.onerror = () => { clearTimeout(timer); reject(new Error('Visitor verification could not load')); };
        document.head.append(script);
      });
      const holder = document.createElement('div');
      holder.id = 'visitor-verification';
      holder.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:20000;max-width:calc(100vw - 24px)';
      document.body.append(holder);
      widget = window.turnstile.render(holder, {
        sitekey, action:'segment', theme:'dark', appearance:'interaction-only',
        callback(value) {
          token = value; issued = Date.now();
          if (waiting) { clearTimeout(waiting.timer); waiting.resolve(); waiting = null; }
        },
        'expired-callback': () => { token = ''; },
        'error-callback': () => { fail('Visitor verification failed; please try again'); return true; },
      });
      return true;
    })().finally(() => { initializing = null; });
    return initializing;
  }
  // Start the check during the tour, before the visitor requests GPU work.
  initialize().catch(() => {});
  return async function takeToken() {
    if (!await initialize()) return '';
    if (!token || Date.now() - issued > 240000) {
      token = '';
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => fail('Complete the visitor verification, then try again'), 60000);
        waiting = {resolve, reject, timer};
        window.turnstile.reset(widget);
      });
    }
    const result = token;
    token = '';
    window.turnstile.reset(widget);
    return result;
  };
}
