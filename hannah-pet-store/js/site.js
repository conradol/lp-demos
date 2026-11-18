(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const schedule = [null, null, [570, 1200], [570, 1200], [570, 1200], [570, 1200], [540, 1200]];
  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

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
    const group = item.closest('.shelf, .reviews');
    if (!group) return 0;
    const units = [...group.children];
    const unit = units.find((child) => child.contains(item));
    return units.indexOf(unit);
  };

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    items.forEach((item) => {
      const inner = item.classList.contains('item-text') ? 60 : 0;
      item.style.setProperty('--delay', `${Math.min(siblingOrder(item), 3) * 70 + inner}ms`);
    });
    const groups = [...document.querySelectorAll('[data-reveal-group]')];
    const reveal = (target) => {
      const members = target.hasAttribute('data-reveal-group') ? target.querySelectorAll('.reveal') : [target];
      members.forEach((member) => member.classList.add('is-in'));
    };
    const observer = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 35% 0px' });
    groups.forEach((group) => observer.observe(group));
    items.filter((item) => !groups.some((group) => group.contains(item))).forEach((item) => observer.observe(item));
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    if (!nav || !float || !hero) return;
    const quiet = [...document.querySelectorAll('#visite, #avaliacoes, #rodape, .band')];
    const wide = window.matchMedia('(min-width: 900px)');
    const layers = still ? [] : [...document.querySelectorAll('[data-parallax]')];
    let queued = false;

    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const overQuiet = quiet.some((section) => {
        const box = section.getBoundingClientRect();
        return box.top < viewport * 0.85 && box.bottom > viewport * 0.4;
      });
      nav.classList.toggle('is-solid', window.scrollY > 24);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.3 && !overQuiet);
      layers.forEach((layer) => {
        const box = layer.parentElement.getBoundingClientRect();
        if (!wide.matches) { layer.style.transform = ''; return; }
        if (box.bottom < 0 || box.top > viewport) return;
        const progress = (box.top + box.height / 2 - viewport / 2) / (viewport / 2 + box.height / 2);
        layer.style.transform = `translate3d(0, ${(progress * -5).toFixed(2)}%, 0)`;
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

  const readClock = () => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    return { today, now: Number(read('hour')) * 60 + Number(read('minute')) };
  };

  const clockLabel = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;

  const nextOpening = (today, now) => {
    const hours = schedule[today];
    if (hours && now < hours[0]) return `hoje às ${clockLabel(hours[0])}`;
    for (let offset = 1; offset <= 7; offset += 1) {
      const day = (today + offset) % 7;
      if (schedule[day]) return `${offset === 1 ? 'amanhã' : dayNames[day]} às ${clockLabel(schedule[day][0])}`;
    }
    return '';
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const { today, now } = readClock();
    const hours = schedule[today];
    const open = Boolean(hours) && now >= hours[0] && now < hours[1];
    label.textContent = open ? `Aberta agora, até as ${clockLabel(hours[1])}` : `Fechada agora, abre ${nextOpening(today, now)}`;
    status.classList.toggle('is-closed', !open);
    status.hidden = false;
    document.querySelectorAll('#hours [data-days]').forEach((row) => {
      row.classList.toggle('is-today', row.dataset.days.split(',').map(Number).includes(today));
    });
  };

  setUpSmoothScroll();
  setUpNav();
  setUpReveals();
  setUpScrollEffects();
  setUpStatus();
})();
