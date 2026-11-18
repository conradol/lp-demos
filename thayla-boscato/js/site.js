(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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

  const setUpReveals = () => {
    const items = [...document.querySelectorAll('.reveal')];
    if (still || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }
    items.forEach((item) => {
      const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
      item.style.setProperty('--delay', `${Math.min(siblings.indexOf(item), 4) * 100}ms`);
    });
    const watch = (targets, rootMargin) => {
      const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin });
      targets.forEach((target) => observer.observe(target));
    };
    watch(items.filter((item) => !item.classList.contains('frame')), '0px 0px 12% 0px');
    watch(items.filter((item) => item.classList.contains('frame')), '0px 0px 30% 0px');
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const quiet = document.getElementById('agendar');
    if (!nav || !float || !hero || !quiet) return;
    let queued = false;
    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const pastBooking = quiet.getBoundingClientRect().top < viewport * 0.85;
      nav.classList.toggle('is-solid', window.scrollY > 24);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.3 && !pastBooking);
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

  const buildVoiceTabs = (items, tabs, onPick) => items.map((item, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `voice-tab-${index + 1}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', item.id);
    tab.textContent = item.querySelector('.voice-tag').textContent;
    item.setAttribute('role', 'tabpanel');
    item.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => onPick(index, false));
    tabs.appendChild(tab);
    return tab;
  });

  const setUpVoices = () => {
    const voices = document.getElementById('voices');
    const tabs = document.getElementById('voice-tabs');
    if (!voices || !tabs) return;
    const items = [...voices.querySelectorAll('.voice')];
    let current = 0;
    let timer = null;
    const stop = () => { clearInterval(timer); timer = null; };
    const show = (index, focus) => {
      current = (index + items.length) % items.length;
      items.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === current));
      buttons.forEach((button, buttonIndex) => {
        button.setAttribute('aria-selected', String(buttonIndex === current));
        button.tabIndex = buttonIndex === current ? 0 : -1;
      });
      if (focus) buttons[current].focus();
    };
    const buttons = buildVoiceTabs(items, tabs, (index) => { stop(); show(index, false); });
    tabs.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      stop();
      show(current + step, true);
    });
    voices.classList.add('is-tabbed');
    tabs.hidden = false;
    show(0, false);
    if (!still) timer = setInterval(() => show(current + 1, false), 7000);
    voices.addEventListener('focusin', stop);
  };

  const setUpStatus = () => {
    const status = document.getElementById('status');
    const label = document.getElementById('status-text');
    if (!status || !label) return;
    const days = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const weekday = [480, 1080];
    const schedule = [null, weekday, weekday, weekday, weekday, weekday, null];
    const clock = (minutes) => `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const read = (type) => parts.find((part) => part.type === type).value;
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
    const now = Number(read('hour')) * 60 + Number(read('minute'));
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
