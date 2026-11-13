(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);

  const hero = $('top'), head = $('head'), title = $('title'), hint = $('hint');
  const copy = $('heroCopy'), birds = $('birds'), topbar = $('topbar');
  const layers = [...document.querySelectorAll('.layer[data-speed]')];
  const quoteBg = document.querySelector('[data-qspeed]');
  const dots = [...document.querySelectorAll('#progress li')];
  const targets = dots.map(d => $(d.dataset.target));

  // Portrait only shows once head.png exists next to index.html
  const probe = new Image();
  probe.onload = () => head.classList.remove('none');
  probe.src = 'head.png';

  let ticking = false;
  const clamp01 = v => Math.min(Math.max(v, 0), 1);

  function update() {
    const vh = window.innerHeight;
    const y = window.scrollY;

    // p: 0 at the top of the page -> 1 at the end of the hero
    const max = Math.max(hero.offsetHeight - vh, 1);
    const p = clamp01(y / max);

    topbar.classList.toggle('scrolled', p > 0.6);

    if (!reduceMotion) {
      // Portrait: rises, shrinks, gone by 50% of the hero scroll
      head.style.opacity   = 1 - Math.min(p / 0.5, 1);
      head.style.translate = `0 ${-p * 60}vh`;
      head.style.scale     = 1 - p * 0.5;

      // Name: drifts down slowly and is gone after a few scrolls (70%)
      title.style.translate = `0 ${p * 25}vh`;
      title.style.opacity   = 1 - Math.min(p / 0.7, 1);

      // Scenery layers move at different speeds = parallax
      layers.forEach(l => {
        l.style.translate = `0 ${-p * parseFloat(l.dataset.speed) * 25}vh`;
      });

      // Birds fly off to the upper right
      birds.style.translate = `${p * 40}vw ${-p * 16}vh`;

      copy.style.opacity = 1 - Math.min(p * 3, 1);
      hint.style.opacity = 1 - Math.min(p * 6, 1);

      // Quote band parallax
      if (quoteBg) {
        const r = quoteBg.parentElement.getBoundingClientRect();
        if (r.bottom > -200 && r.top < vh + 200) {
          const off = -(r.top + r.height / 2 - vh / 2);
          quoteBg.style.transform = `translate3d(0, ${off * parseFloat(quoteBg.dataset.qspeed)}px, 0)`;
        }
      }
    }

    // Side progress: highlight the section covering the viewport middle
    let current = 0;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= vh * 0.5) current = i; });
    dots.forEach((d, i) => d.classList.toggle('on', i === current));
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Menu overlay ---------- */
  const menu = $('menu'), menuBtn = $('menuBtn');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', () => setMenu(true));
  $('menuClose').addEventListener('click', () => setMenu(false));
  menu.addEventListener('click', e => { if (e.target === menu || e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeLb(); } });

  /* ---------- Tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = { professional: $('panel-professional'), travel: $('panel-travel') };
  function openTab(name, updateHash = true) {
    tabs.forEach(t => {
      const on = t.dataset.tab === name;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
    });
    Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== name; });
    panels[name].querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
    if (updateHash) history.replaceState(null, '', `#${name}`);
  }
  tabs.forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab)));
  document.querySelectorAll('[data-open-tab]').forEach(link =>
    link.addEventListener('click', () => openTab(link.dataset.openTab, false))
  );
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
  shots.forEach(s => {
    const img = s.querySelector('img');
    img.addEventListener('error', () => { img.style.display = 'none'; s.style.minHeight = '220px'; });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('lightbox');
  const lbImg = lb.querySelector('img');
  shots.forEach(s => s.addEventListener('click', () => {
    const img = s.querySelector('img');
    if (img.style.display === 'none') return;
    lbImg.src = img.src; lbImg.alt = img.alt; lb.hidden = false;
  }));
  function closeLb() { lb.hidden = true; lbImg.src = ''; }
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });

  $('year').textContent = new Date().getFullYear();
})();