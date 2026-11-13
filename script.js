(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Parallax ---------- */
  const parallaxEls = document.querySelectorAll('[data-speed]');
  const hero = document.querySelector('.hero');
  const nav = document.getElementById('nav');
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);

    if (!reduceMotion) {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.speed);
        const rect = el.parentElement.getBoundingClientRect();
        // Skip elements whose parent is far off-screen
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
        // Hero: offset from page top. Divider: offset from section centre.
        const offset = el.closest('.hero') ? y : -(rect.top + rect.height / 2 - window.innerHeight / 2);
        el.style.transform = `translate3d(0, ${offset * speed}px, 0)`;
      });

      // Fade hero text while scrolling away
      const text = hero.querySelector('.hero-text');
      text.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.7));
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = {
    professional: document.getElementById('panel-professional'),
    travel: document.getElementById('panel-travel'),
  };

  function openTab(name, updateHash = true) {
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
    Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== name; });
    // Newly shown items may not have triggered the observer yet
    panels[name].querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
    if (updateHash) history.replaceState(null, '', `#${name}`);
  }

  tabs.forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab)));
  document.querySelectorAll('[data-open-tab]').forEach(link =>
    link.addEventListener('click', () => openTab(link.dataset.openTab))
  );

  // Deep link: yoursite.com/#travel
  const hash = location.hash.replace('#', '');
  if (panels[hash]) openTab(hash, false);

  /* ---------- Gallery filter ---------- */
  const chips = document.querySelectorAll('.chip');
  const shots = document.querySelectorAll('.shot');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.toggle('active', c === chip));
    const f = chip.dataset.filter;
    shots.forEach(s => s.classList.toggle('hide', f !== 'all' && s.dataset.cat !== f));
  }));

  // If an image is missing, keep the gradient placeholder instead of a broken icon
  shots.forEach(s => {
    const img = s.querySelector('img');
    img.addEventListener('error', () => { img.style.display = 'none'; s.style.minHeight = '220px'; });
  });

  /* ---------- Lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  shots.forEach(s => s.addEventListener('click', () => {
    const img = s.querySelector('img');
    if (img.style.display === 'none') return;
    lbImg.src = img.src; lbImg.alt = img.alt; lb.hidden = false;
  }));
  const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();