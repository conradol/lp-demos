(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.09 });
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

  const staggerDelay = (item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    const cap = item.classList.contains('photo') ? 2 : 4;
    return `${Math.min(siblings.indexOf(item), cap) * 90}ms`;
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    items.forEach((item) => item.style.setProperty('--delay', staggerDelay(item)));
    const watch = (targets, rootMargin) => {
      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin });
      targets.forEach((target) => observer.observe(target));
    };
    const isPhoto = (item) => item.classList.contains('photo');
    watch(items.filter((item) => !isPhoto(item)), '0px 0px 12% 0px');
    watch(items.filter(isPhoto), '0px 0px 40% 0px');
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = [...document.querySelectorAll('#visite, .owner, .footer')];
    let queued = false;

    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const overQuiet = quiet.some((section) => {
        const box = section.getBoundingClientRect();
        return box.top < viewport * 0.85 && box.bottom > viewport * 0.4;
      });
      nav.classList.toggle('is-solid', window.scrollY > 8);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.3 && !overQuiet);
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
    const start = () => { if (!still && !timer) timer = setInterval(() => show(current + 1), 6000); };

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

  const schedule = [null, [510, 1080], [510, 1080], [510, 1080], [510, 1080], [510, 1080], [510, 1140]];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const nowInCanoas = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    return { day, minutes: Number(read('hour')) * 60 + Number(read('minute')) };
  };

  const describeStatus = ({ day, minutes }) => {
    const hours = schedule[day];
    if (hours && minutes >= hours[0] && minutes < hours[1]) return { open: true, text: `Aberto agora, até as ${clock(hours[1])}` };
    if (hours && minutes < hours[0]) return { open: false, text: `Fechado agora, abre hoje às ${clock(hours[0])}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const next = (day + offset) % 7;
      if (schedule[next]) return { open: false, text: `Fechado agora, abre ${offset === 1 ? 'amanhã' : dayNames[next]} às ${clock(schedule[next][0])}` };
    }
    return { open: false, text: 'Fechado agora' };
  };

  const setUpStatus = () => {
    const { open, text } = describeStatus(nowInCanoas());
    document.querySelectorAll('[data-status]').forEach((status) => {
      status.querySelector('[data-status-text]').textContent = text;
      status.classList.toggle('is-closed', !open);
      status.hidden = false;
    });
  };

  setUpSmoothScroll();
  setUpNav();
  setUpReveals();
  setUpScrollEffects();
  setUpVoices();
  setUpStatus();
})();
