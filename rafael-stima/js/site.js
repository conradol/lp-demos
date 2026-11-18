(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const OPENING_HOURS = [null, [420, 1200], [420, 1200], [420, 1200], [420, 1200], [420, 1200], null];
  const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: true, lerp: 0.085 });
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
      toggle.setAttribute('aria-label', 'Abrir menu');
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    links.addEventListener('click', (event) => event.target.closest('a') && close());
    document.addEventListener('keydown', (event) => event.key === 'Escape' && close());
  };

  const siblingOrder = (item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    return Math.min(siblings.indexOf(item), 5);
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    items.forEach((item) => item.style.setProperty('--delay', `${siblingOrder(item) * 90}ms`));
    const watch = (targets, rootMargin) => {
      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin });
      targets.forEach((target) => observer.observe(target));
    };
    const isMedia = (item) => item.matches('figure, .frame, .map');
    watch(items.filter((item) => !isMedia(item)), '0px 0px 12% 0px');
    watch(items.filter(isMedia), '0px 0px 30% 0px');
  };

  const parallaxShift = (layer, viewport) => {
    const box = layer.parentElement.getBoundingClientRect();
    if (box.bottom < 0 || box.top > viewport) return;
    const progress = (box.top + box.height / 2 - viewport / 2) / (viewport / 2 + box.height / 2);
    layer.style.transform = `translate3d(0, ${(progress * -7).toFixed(2)}%, 0)`;
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = ['faixa', 'avaliacoes', 'agendar', 'rodape'].map((id) => document.getElementById(id));
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
      layers.forEach((layer) => parallaxShift(layer, viewport));
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

  const buildDots = (dots, count, onPick) => {
    for (let index = 0; index < count; index += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Avaliação ${index + 1} de ${count}`);
      dot.addEventListener('click', () => onPick(index));
      dots.appendChild(dot);
    }
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
    const start = () => { if (!still && !timer) timer = setInterval(() => show(current + 1), 7000); };
    buildDots(dots, items.length, (index) => { stop(); show(index); });
    voices.classList.add('is-rotating');
    dots.hidden = false;
    show(0);
    voices.addEventListener('pointerenter', stop);
    voices.addEventListener('pointerleave', start);
    voices.addEventListener('focusin', stop);
    start();
  };

  const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const localNow = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    return { day, minutes: Number(read('hour')) * 60 + Number(read('minute')) };
  };

  const describeStatus = ({ day, minutes }) => {
    const hours = OPENING_HOURS[day];
    if (hours && minutes >= hours[0] && minutes < hours[1]) return { open: true, text: `Aberto agora, até as ${clock(hours[1])}` };
    if (hours && minutes < hours[0]) return { open: false, text: `Fechado agora, abre hoje às ${clock(hours[0])}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const next = (day + offset) % 7;
      if (OPENING_HOURS[next]) {
        const when = offset === 1 ? 'amanhã' : DAY_NAMES[next];
        return { open: false, text: `Fechado agora, abre ${when} às ${clock(OPENING_HOURS[next][0])}` };
      }
    }
    return { open: false, text: 'Fechado agora' };
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const { open, text } = describeStatus(localNow());
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
