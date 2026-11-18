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

  const siblingOrder = (item) => {
    const siblings = [...item.parentElement.children].filter((child) => child.classList.contains('reveal'));
    return Math.min(siblings.indexOf(item), 4);
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
    const isFrame = (item) => item.classList.contains('frame');
    watch(items.filter((item) => !isFrame(item)), '0px 0px 12% 0px');
    watch(items.filter(isFrame), '0px 0px 40% 0px');
  };

  const parallax = (layers, viewport) => {
    const wide = window.innerWidth >= 900;
    layers.forEach((layer) => {
      if (!wide) { layer.style.transform = ''; return; }
      const box = layer.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > viewport) return;
      const progress = (box.top + box.height / 2 - viewport / 2) / (viewport / 2 + box.height / 2);
      layer.style.transform = `translate3d(0, ${(progress * -6).toFixed(2)}%, 0)`;
    });
  };

  const setUpScrollEffects = () => {
    const nav = document.getElementById('nav');
    const float = document.getElementById('float');
    const hero = document.getElementById('inicio');
    const reviews = document.getElementById('avaliacoes');
    const booking = document.getElementById('agendar');
    const layers = still ? [] : [...document.querySelectorAll('[data-parallax]')];
    let queued = false;

    const update = () => {
      queued = false;
      const viewport = window.innerHeight;
      const reviewsBox = reviews.getBoundingClientRect();
      const overReviews = reviewsBox.top < viewport * 0.8 && reviewsBox.bottom > viewport * 0.6;
      const overQuiet = overReviews || booking.getBoundingClientRect().top < viewport * 0.8;
      nav.classList.toggle('is-solid', window.scrollY > 24);
      float.classList.toggle('is-visible', hero.getBoundingClientRect().bottom < viewport * 0.4 && !overQuiet);
      parallax(layers, viewport);
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

  setUpSmoothScroll();
  setUpNav();
  setUpReveals();
  setUpScrollEffects();
  setUpVoices();
})();
