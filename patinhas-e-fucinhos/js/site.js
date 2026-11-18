(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const OPENING_HOURS = [null, [570, 1080], [570, 1080], [570, 1080], [570, 1080], [570, 1080], null];

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: true, lerp: 0.09 });
    window.addEventListener('pagehide', () => lenis.destroy(), { once: true });
  };

  const setUpNav = () => {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!nav || !toggle || !links) return;
    const close = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (event) => event.target.closest('a') && close());
    document.addEventListener('keydown', (event) => event.key === 'Escape' && close());
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    const groups = new Map();
    items.forEach((item) => {
      const anchor = item.closest('[data-reveal-anchor]') || item;
      groups.set(anchor, [...(groups.get(anchor) || []), item]);
    });
    const observer = new IntersectionObserver((entries) => {
      const arriving = entries.filter((entry) => entry.isIntersecting).flatMap((entry) => {
        observer.unobserve(entry.target);
        return groups.get(entry.target);
      });
      arriving.forEach((item, order) => {
        item.style.setProperty('--delay', `${Math.min(order, 4) * 100}ms`);
        item.classList.add('is-in');
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 12% 0px' });
    groups.forEach((_, anchor) => observer.observe(anchor));
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = ['agendar', 'avaliacoes', 'recado'].map((id) => document.getElementById(id));
    const layers = still ? [] : [...document.querySelectorAll('[data-parallax]')];
    let queued = false;

    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const overQuiet = quiet.some((section) => {
        const box = section.getBoundingClientRect();
        return box.top < viewport * 0.85 && box.bottom > viewport * 0.5;
      });
      nav.classList.toggle('is-solid', window.scrollY > 24);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.4 && !overQuiet);
      layers.forEach((layer) => {
        const box = layer.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > viewport) return;
        const progress = (box.top + box.height / 2 - viewport / 2) / (viewport / 2 + box.height / 2);
        layer.style.transform = `translate3d(0, ${(progress * -7).toFixed(2)}%, 0)`;
      });
    };
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  };

  const setUpVoices = () => {
    const voices = document.getElementById('voices');
    const dots = document.getElementById('voice-dots');
    if (!voices || !dots) return;
    const items = [...voices.querySelectorAll('.voice')];
    let current = 0;
    let timer = null;

    const show = (index) => {
      current = (index + items.length) % items.length;
      items.forEach((item, itemIndex) => {
        item.classList.toggle('is-active', itemIndex === current);
        item.setAttribute('aria-hidden', String(itemIndex !== current));
      });
      [...dots.children].forEach((dot, dotIndex) => dot.setAttribute('aria-current', String(dotIndex === current)));
    };
    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => { if (!still && !timer) timer = setInterval(() => show(current + 1), 6500); };

    items.forEach((item, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Avaliação ${index + 1} de ${items.length}`);
      dot.addEventListener('click', () => { stop(); show(index); });
      dots.appendChild(dot);
    });
    voices.classList.add('is-rotating');
    dots.hidden = false;
    show(0);
    voices.addEventListener('pointerenter', stop);
    voices.addEventListener('pointerleave', start);
    voices.addEventListener('focusin', stop);
    start();
  };

  const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const describeStatus = (today, now) => {
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const hours = OPENING_HOURS[today];
    if (hours && now >= hours[0] && now < hours[1]) return { open: true, text: `Aberto agora, até as ${clock(hours[1])}` };
    if (hours && now < hours[0]) return { open: false, text: `Fechado agora, abre hoje às ${clock(hours[0])}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = (today + offset) % 7;
      const next = OPENING_HOURS[day];
      if (next) return { open: false, text: `Fechado agora, abre ${offset === 1 ? 'amanhã' : days[day]} às ${clock(next[0])}` };
    }
    return { open: false, text: 'Fechado agora' };
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    const { open, text } = describeStatus(today, Number(read('hour')) * 60 + Number(read('minute')));
    label.textContent = text;
    status.classList.toggle('is-closed', !open);
    status.hidden = false;
  };

  setUpSmoothScroll();
  setUpNav();
  setUpReveals();
  setUpScrollEffects();
  setUpVoices();
  setUpStatus();
})();
