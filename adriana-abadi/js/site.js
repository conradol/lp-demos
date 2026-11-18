(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
    const kin = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    return Math.min(kin.indexOf(item), 4);
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    items.forEach((item) => item.style.setProperty('--delay', `${siblingOrder(item) * 100}ms`));
    const watch = (targets, rootMargin) => {
      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin });
      targets.forEach((target) => observer.observe(target));
    };
    watch(items.filter((item) => !item.classList.contains('frame')), '0px 0px 15% 0px');
    watch(items.filter((item) => item.classList.contains('frame')), '0px 0px 30% 0px');
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const reviews = document.getElementById('avaliacoes');
    const booking = document.getElementById('agendar');
    if (!nav || !float || !hero || !reviews || !booking) return;
    let queued = false;
    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const reviewBox = reviews.getBoundingClientRect();
      const overReviews = reviewBox.top < viewport * 0.8 && reviewBox.bottom > viewport * 0.6;
      const beforeBooking = booking.getBoundingClientRect().top > viewport * 0.8;
      const pastHero = hero.getBoundingClientRect().bottom < viewport * 0.4;
      nav.classList.toggle('is-solid', window.scrollY > 24);
      float.classList.toggle('is-visible', pastHero && beforeBooking && !overReviews);
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

  const readClock = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    return { today, now: Number(read('hour')) * 60 + Number(read('minute')) };
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const weekday = [480, 1080];
    const schedule = [null, weekday, weekday, weekday, weekday, weekday, null];
    const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;
    const { today, now } = readClock();
    const hours = schedule[today];
    const nextOpening = () => {
      if (hours && now < hours[0]) return `hoje às ${clock(hours[0])}`;
      for (let offset = 1; offset <= 7; offset += 1) {
        const day = (today + offset) % 7;
        if (schedule[day]) return `${offset === 1 ? 'amanhã' : days[day]} às ${clock(schedule[day][0])}`;
      }
      return '';
    };
    const open = Boolean(hours) && now >= hours[0] && now < hours[1];
    label.textContent = open ? `Aberto agora, até as ${clock(hours[1])}` : `Fechado agora, abre ${nextOpening()}`;
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
