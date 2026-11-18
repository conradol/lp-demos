(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const weeklyHours = [null, [480, 1200], [480, 1200], [480, 1200], [480, 1200], [480, 1200], null];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: { offset: -80 }, lerp: 0.09 });
    window.addEventListener('pagehide', () => lenis.destroy(), { once: true });
  };

  const assignDelays = (items) => {
    items.forEach((item) => {
      const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
      item.style.setProperty('--delay', `${Math.min(siblings.indexOf(item), 4) * 100}ms`);
    });
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    assignDelays(items);
    const watch = (targets, rootMargin) => {
      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin });
      targets.forEach((target) => observer.observe(target));
    };
    const isFrame = (item) => item.classList.contains('arch-frame');
    watch(items.filter((item) => !isFrame(item)), '0px 0px 18% 0px');
    watch(items.filter(isFrame), '0px 0px 45% 0px');
  };

  const setUpScrollState = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = [document.querySelector('.booking'), document.getElementById('avaliacoes')];
    if (!nav || !float || !hero || quiet.includes(null)) return;
    let queued = false;
    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const overQuiet = quiet.some((section) => {
        const box = section.getBoundingClientRect();
        return box.top < viewport * 0.85 && box.bottom > viewport * 0.4;
      });
      nav.classList.toggle('is-scrolled', window.scrollY > 12);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.35 && !overQuiet);
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

  const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const localNow = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday')),
      minutes: Number(read('hour')) * 60 + Number(read('minute')),
    };
  };

  const nextOpening = (day, minutes) => {
    const today = weeklyHours[day];
    if (today && minutes < today[0]) return `hoje às ${clock(today[0])}`;
    for (let offset = 1; offset <= 7; offset += 1) {
      const next = (day + offset) % 7;
      if (weeklyHours[next]) return `${offset === 1 ? 'amanhã' : dayNames[next]} às ${clock(weeklyHours[next][0])}`;
    }
    return '';
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const { day, minutes } = localNow();
    const hours = weeklyHours[day];
    const open = Boolean(hours) && minutes >= hours[0] && minutes < hours[1];
    label.textContent = open ? `Aberta agora, até as ${clock(hours[1])}` : `Fechada agora, abre ${nextOpening(day, minutes)}`;
    status.classList.toggle('is-closed', !open);
    status.hidden = false;
  };

  setUpSmoothScroll();
  setUpReveals();
  setUpScrollState();
  setUpStatus();
})();
