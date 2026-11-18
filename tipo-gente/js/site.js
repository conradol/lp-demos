(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.1 });
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
    return Math.min(Math.max(siblings.indexOf(item), 0), 4);
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
    watch(items.filter((item) => !item.classList.contains('frame')), '0px 0px 10% 0px');
    watch(items.filter((item) => item.classList.contains('frame')), '0px 0px 45% 0px');
  };

  const setUpFloat = () => {
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = [document.getElementById('visite'), document.querySelector('.owner'), document.querySelector('.footer')];
    if (!float || !hero) return;
    let queued = false;
    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const overQuiet = quiet.some((section) => {
        const box = section.getBoundingClientRect();
        return box.top < viewport * 0.85 && box.bottom > viewport * 0.3;
      });
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

  const readClock = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday')),
      minutes: Number(read('hour')) * 60 + Number(read('minute')),
    };
  };

  const describeStatus = (schedule, day, minutes) => {
    const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const clock = (value) => `${Math.floor(value / 60)}h${value % 60 ? String(value % 60).padStart(2, '0') : ''}`;
    const hours = schedule[day];
    if (hours && minutes >= hours[0] && minutes < hours[1]) return { open: true, text: `Aberta agora, até as ${clock(hours[1])}` };
    if (hours && minutes < hours[0]) return { open: false, text: `Fechada agora, abre hoje às ${clock(hours[0])}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const next = (day + offset) % 7;
      if (schedule[next]) return { open: false, text: `Fechada agora, abre ${offset === 1 ? 'amanhã' : names[next]} às ${clock(schedule[next][0])}` };
    }
    return { open: false, text: 'Fechada agora' };
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const weekday = [540, 1080];
    const schedule = [null, weekday, weekday, weekday, weekday, weekday, [540, 720]];
    const { day, minutes } = readClock();
    const result = describeStatus(schedule, day, minutes);
    label.textContent = result.text;
    status.classList.toggle('is-closed', !result.open);
    status.hidden = false;
  };

  setUpSmoothScroll();
  setUpNav();
  setUpReveals();
  setUpFloat();
  setUpStatus();
})();
