(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const setUpSmoothScroll = () => {
    if (still || !finePointer || typeof window.Lenis !== 'function') return;
    const lenis = new window.Lenis({ autoRaf: true, anchors: { offset: -76 }, lerp: 0.09 });
    window.addEventListener('pagehide', () => lenis.destroy(), { once: true });
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry, order) => {
        entry.target.style.setProperty('--delay', `${Math.min(order, 3) * 90}ms`);
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 25% 0px' });
    items.forEach((item) => observer.observe(item));
  };

  const isOver = (section, viewport) => {
    if (!section) return false;
    const box = section.getBoundingClientRect();
    return box.top < viewport * 0.85 && box.bottom > viewport * 0.5;
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = [document.querySelector('.band'), document.getElementById('agendamento'), document.querySelector('.owner')];
    const layers = still ? [] : [...document.querySelectorAll('[data-parallax]')];
    let queued = false;

    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
      const pastHero = hero.getBoundingClientRect().bottom < viewport * 0.35;
      nav.classList.toggle('is-past', hero.getBoundingClientRect().bottom < 0);
      float.classList.toggle('is-visible', pastHero && !quiet.some((section) => isOver(section, viewport)));
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

  const schedule = [null, [480, 1170], [480, 1170], [480, 1170], [480, 1170], [480, 1170], null];
  const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const readNow = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    return { today, minutes: Number(read('hour')) * 60 + Number(read('minute')) };
  };

  const describeStatus = ({ today, minutes }) => {
    const hours = schedule[today];
    if (hours && minutes >= hours[0] && minutes < hours[1]) return { open: true, text: `Aberto agora, até as ${clock(hours[1])}` };
    if (hours && minutes < hours[0]) return { open: false, text: `Fechado agora, abre hoje às ${clock(hours[0])}` };
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = (today + offset) % 7;
      if (schedule[day]) return { open: false, text: `Fechado agora, abre ${offset === 1 ? 'amanhã' : days[day]} às ${clock(schedule[day][0])}` };
    }
    return { open: false, text: '' };
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const { open, text } = describeStatus(readNow());
    label.textContent = text;
    status.classList.toggle('is-closed', !open);
    status.hidden = false;
  };

  setUpSmoothScroll();
  setUpReveals();
  setUpScrollEffects();
  setUpStatus();
})();
