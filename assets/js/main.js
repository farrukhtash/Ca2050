function toggleNav(){
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('navToggle');
  const open = nav.classList.toggle('open');
  if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if(!open) closeAllDropdowns();
}

function closeAllDropdowns(){
  document.querySelectorAll('.nav-item.open').forEach(item=>{
    item.classList.remove('open');
    const t = item.querySelector('.nav-dropdown-toggle');
    if(t) t.setAttribute('aria-expanded','false');
  });
}

// Dropdown toggles (works for desktop click + mobile tap)
document.querySelectorAll('.nav-dropdown-toggle').forEach(btn=>{
  const item = btn.closest('.nav-item');
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const willOpen = !item.classList.contains('open');
    closeAllDropdowns();
    if(willOpen){ item.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  });
});

// Close dropdowns on outside click
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.nav-item.has-dropdown')) closeAllDropdowns();
});

// Escape closes dropdowns (and returns focus to the toggle)
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const openItem = document.querySelector('.nav-item.open');
    if(openItem){
      const t = openItem.querySelector('.nav-dropdown-toggle');
      closeAllDropdowns();
      if(t) t.focus();
    }
  }
});

// Close the mobile menu when a real navigation link is clicked
document.getElementById('siteNav').querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', ()=>{
    document.getElementById('siteNav').classList.remove('open');
    const btn = document.getElementById('navToggle');
    if(btn) btn.setAttribute('aria-expanded','false');
    closeAllDropdowns();
  });
});

// Language switcher: build correct hrefs from the canonical path.
// (data-canon is a data attribute, so it is never locale-rewritten by polyglot.)
(function(){
  const sw = document.querySelector('.langswitch');
  if(!sw) return;
  const def = sw.dataset.default;
  const canon = sw.dataset.canon || '/';
  sw.querySelectorAll('a[data-lang]').forEach(a=>{
    const l = a.dataset.lang;
    a.setAttribute('href', l === def ? canon : '/' + l + canon);
  });
})();

// Scroll-reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));

// Transparent header over the fullscreen hero -> solid on scroll
if(document.body.classList.contains('has-hero-full')){
  const header = document.querySelector('.site-header');
  if(header){
    const onScroll = ()=>{ header.classList.toggle('scrolled', window.scrollY > 80); };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  }
}

// Region leaders: flag row + prev/next arrows + keyboard + swipe (manual only, circular)
document.querySelectorAll('[data-leaders]').forEach(root=>{
  const flags = Array.from(root.querySelectorAll('.leader-flag'));
  const panels = Array.from(root.querySelectorAll('.leader-panel'));
  if(!flags.length || !panels.length) return;
  let cur = 0;
  const show = (i, focusFlag)=>{
    cur = (i + panels.length) % panels.length;
    flags.forEach((f,idx)=>{
      const on = idx === cur;
      f.classList.toggle('is-active', on);
      f.setAttribute('aria-selected', on ? 'true' : 'false');
      f.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p,idx)=>{
      const on = idx === cur;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
    if(focusFlag) flags[cur].focus();
  };
  flags.forEach((f,idx)=>{
    f.addEventListener('click', ()=>show(idx));
    f.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowRight'){ e.preventDefault(); show(cur + 1, true); }
      else if(e.key === 'ArrowLeft'){ e.preventDefault(); show(cur - 1, true); }
      else if(e.key === 'Home'){ e.preventDefault(); show(0, true); }
      else if(e.key === 'End'){ e.preventDefault(); show(panels.length - 1, true); }
    });
  });
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  if(prev) prev.addEventListener('click', ()=>show(cur - 1));
  if(next) next.addEventListener('click', ()=>show(cur + 1));
  // Swipe (mobile)
  const stage = root.querySelector('.leader-panels');
  if(stage){
    let x0 = null;
    stage.addEventListener('touchstart', (e)=>{ x0 = e.touches[0].clientX; }, {passive:true});
    stage.addEventListener('touchend', (e)=>{
      if(x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if(Math.abs(dx) > 40) show(dx < 0 ? cur + 1 : cur - 1);
      x0 = null;
    }, {passive:true});
  }
  show(0);
});

// Shared lightbox (self-contained, no external library). Triggers are any
// [data-chart] (direction pages) or [data-photo] (seminar media carousel) —
// same mechanism, same DOM/CSS, so behavior stays identical everywhere.
(function(){
  const lightbox = document.querySelector('[data-lightbox]');
  const triggers = Array.from(document.querySelectorAll('[data-chart], [data-photo]'));
  if(!lightbox || !triggers.length) return;

  const imgEl = lightbox.querySelector('[data-lightbox-img]');
  const capEl = lightbox.querySelector('[data-lightbox-caption]');
  const noteEl = lightbox.querySelector('[data-lightbox-note]');
  const closeBtn = lightbox.querySelector('[data-lightbox-close]');
  const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
  const nextBtn = lightbox.querySelector('[data-lightbox-next]');
  let current = 0;
  let lastFocused = null;

  const render = (i)=>{
    current = (i + triggers.length) % triggers.length;
    const t = triggers[current];
    if(imgEl){ imgEl.src = t.dataset.img || ''; imgEl.alt = t.dataset.caption || ''; }
    if(capEl) capEl.textContent = t.dataset.caption || '';
    if(noteEl) noteEl.textContent = t.dataset.note || '';
  };
  const open = (i)=>{
    lastFocused = document.activeElement;
    render(i);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    if(closeBtn) closeBtn.focus();
  };
  const close = ()=>{
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  triggers.forEach((t, i)=>{ t.addEventListener('click', ()=>open(i)); });
  if(closeBtn) closeBtn.addEventListener('click', close);
  if(prevBtn) prevBtn.addEventListener('click', ()=>render(current - 1));
  if(nextBtn) nextBtn.addEventListener('click', ()=>render(current + 1));

  // Click on the backdrop (outside the image/caption/controls) closes it
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });

  document.addEventListener('keydown', (e)=>{
    if(lightbox.hidden) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowRight') render(current + 1);
    else if(e.key === 'ArrowLeft') render(current - 1);
  });
})();

// Media carousel (seminar page): native scroll-snap track; prev/next
// buttons scroll by one item's width. Touch swipe works natively via
// overflow-x, no custom gesture handling needed.
document.querySelectorAll('[data-carousel]').forEach(root=>{
  const viewport = root.querySelector('.carousel-viewport');
  const track = root.querySelector('.carousel-track');
  if(!viewport || !track) return;
  const scrollByItem = (dir)=>{
    const item = track.querySelector('.carousel-item');
    if(!item) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const width = item.getBoundingClientRect().width + gap;
    viewport.scrollBy({ left: dir * width, behavior: 'smooth' });
  };
  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');
  if(prev) prev.addEventListener('click', ()=>scrollByItem(-1));
  if(next) next.addEventListener('click', ()=>scrollByItem(1));
});

// Participant quote cards (seminar page): hover/focus already expand the
// card via CSS on devices with real hover; on touch devices (no hover),
// tap toggles the expanded state instead.
document.querySelectorAll('[data-quote-card]').forEach(item=>{
  item.addEventListener('click', ()=>{
    if(window.matchMedia('(hover: hover)').matches) return;
    const willExpand = !item.classList.contains('is-expanded');
    document.querySelectorAll('[data-quote-card].is-expanded').forEach(el=>{
      if(el !== item) el.classList.remove('is-expanded');
    });
    item.classList.toggle('is-expanded', willExpand);
  });
});
document.addEventListener('click', (e)=>{
  if(!e.target.closest('[data-quote-card]')){
    document.querySelectorAll('[data-quote-card].is-expanded').forEach(el=>el.classList.remove('is-expanded'));
  }
});

// Hero background carousel (cross-fade)
(function(){
  const slides = document.querySelectorAll('.home-hero .hero-slide');
  if(slides.length < 2) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return; // keep the first slide static
  let i = 0;
  setInterval(()=>{
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 6000);
})();
