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

// Language switcher: build correct hrefs from the canonical path
// (data-canon is a data attribute, so it is never locale-rewritten by
// polyglot), and preserve scroll position across the switch. Page length
// differs per locale (translations run shorter/longer), so raw pixels
// aren't reusable — instead we remember which top-level <section> under
// <main class="site-main"> was at the header line when the reader clicked,
// plus how far into it they'd scrolled, and re-find "that same section" by
// index on the new page (every page layout renders the same sections in
// the same order regardless of locale, only the text differs). The
// corresponding html.scroll-restoring / inline script in the <head> keeps
// the page hidden until restoreScrollAnchor() below runs, so there's no
// flash-at-top before the jump.
const SCROLL_ANCHOR_KEY = 'caScrollAnchor';
const headerOffset = ()=>{
  const h = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  return h + 12;
};

(function(){
  const sw = document.querySelector('.langswitch');
  if(!sw) return;
  const def = sw.dataset.default;
  const canon = sw.dataset.canon || '/';

  const saveScrollAnchor = ()=>{
    try{
      const sections = Array.from(document.querySelectorAll('main.site-main > section'));
      const offsetLine = headerOffset();
      let index = -1, offset = 0;
      for(let i = 0; i < sections.length; i++){
        const top = sections[i].getBoundingClientRect().top;
        if(top <= offsetLine){ index = i; offset = offsetLine - top; }
        else break;
      }
      if(index >= 0) sessionStorage.setItem(SCROLL_ANCHOR_KEY, JSON.stringify({ index, offset, t: Date.now() }));
      else sessionStorage.removeItem(SCROLL_ANCHOR_KEY);
    }catch(e){}
  };

  sw.querySelectorAll('a[data-lang]').forEach(a=>{
    const l = a.dataset.lang;
    a.setAttribute('href', l === def ? canon : '/' + l + canon);
    a.addEventListener('click', saveScrollAnchor);
  });
})();

// Runs the restore side of the mechanism above: consumes the saved anchor
// (one-shot — cleared as soon as it's read) and reveals the page, whether
// or not a usable anchor was found. Every early-return path still calls
// reveal(), so a missing/stale/corrupt anchor just falls back to staying
// at the top, same as the pre-existing behavior.
(function(){
  const reveal = ()=>{ document.documentElement.classList.remove('scroll-restoring'); };
  let raw = null;
  try{
    raw = sessionStorage.getItem(SCROLL_ANCHOR_KEY);
    sessionStorage.removeItem(SCROLL_ANCHOR_KEY);
  }catch(e){}
  if(!raw) return reveal();

  let anchor;
  try{ anchor = JSON.parse(raw); }catch(e){ return reveal(); }
  if(!anchor || typeof anchor.index !== 'number' || Date.now() - anchor.t > 15000) return reveal();

  const sections = Array.from(document.querySelectorAll('main.site-main > section'));
  if(!sections.length) return reveal();
  const target = sections[Math.min(anchor.index, sections.length - 1)];
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + (anchor.offset || 0);
  window.scrollTo(0, Math.max(0, top));
  reveal();
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
//
// data-carousel-loop (opt-in, used by the press/integration-news
// carousels) makes it infinite in both directions. The item set is
// cloned into `repeats` full copies before and after the real (middle)
// set — see REPEATS below for why more than one copy is sometimes
// needed. A click always animates to an exact item position (offsetLeft),
// tracked via a plain integer `pos` rather than by reading scrollLeft back
// after the animation — reading scrollLeft to decide "did we settle past
// the edge yet" is inherently racy (native smooth-scroll + scroll-snap can
// still be settling when a scroll/'scroll'-debounce fires). Instead, if
// the last click left `pos` pointing at a clone, the NEXT click first
// re-homes scrollLeft instantly to the pixel-identical spot in the real
// set (imperceptible, since clones are exact copies) before animating the
// new step — correction is synchronous and never races an in-flight
// animation.
document.querySelectorAll('[data-carousel]').forEach(root=>{
  const viewport = root.querySelector('.carousel-viewport');
  const track = root.querySelector('.carousel-track');
  if(!viewport || !track) return;

  const loop = root.hasAttribute('data-carousel-loop');
  const realCount = track.children.length;
  const prev = root.querySelector('[data-carousel-prev]');
  const next = root.querySelector('[data-carousel-next]');

  if(loop && realCount > 0){
    // REPEATS: aligning a target item flush against the viewport's left
    // edge only works if enough real content follows it to fill the rest
    // of the visible row (up to 3 items wide, the widest breakpoint this
    // component uses). With realCount below that (e.g. only 1-2 news
    // cards), a single clone set doesn't leave enough trailing items —
    // the browser clamps the scroll short of the target and the carousel
    // reads as "stuck". Cloning enough full sets to cover the widest row
    // (ceil(3 / realCount) of them) guarantees that buffer regardless of
    // how few real items there are, while realCount >= 3 keeps the
    // original single clone set (no extra DOM for normal-sized lists).
    const maxVisible = 3;
    const repeats = Math.max(1, Math.ceil(maxVisible / realCount));
    const makeClone = (el)=>{
      const clone = el.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(node=>{ node.tabIndex = -1; });
      return clone;
    };
    const originals = Array.from(track.children);
    for(let r=0;r<repeats;r++) track.prepend(...originals.map(makeClone));
    for(let r=0;r<repeats;r++) track.append(...originals.map(makeClone));

    // index into the real set (0..realCount-1); transiently -1 or realCount
    // right after a wrap step, until the following click re-homes it
    let pos = 0;
    const realOffset = realCount * repeats;
    const targetLeft = (i)=> track.children[realOffset + i].offsetLeft - track.offsetLeft;
    const jumpTo = (left)=>{
      const behavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = 'auto';
      viewport.scrollLeft = left;
      viewport.style.scrollBehavior = behavior;
    };
    requestAnimationFrame(()=>{ jumpTo(targetLeft(0)); });

    const step = (dir)=>{
      if(pos < 0 || pos >= realCount){
        const wrapped = ((pos % realCount) + realCount) % realCount;
        jumpTo(targetLeft(wrapped));
        pos = wrapped;
      }
      pos += dir;
      viewport.scrollTo({ left: targetLeft(pos), behavior: 'smooth' });
    };
    if(prev) prev.addEventListener('click', ()=>step(-1));
    if(next) next.addEventListener('click', ()=>step(1));
    return;
  }

  const scrollByItem = (dir)=>{
    const item = track.querySelector('.carousel-item');
    if(!item) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const width = item.getBoundingClientRect().width + gap;
    viewport.scrollBy({ left: dir * width, behavior: 'smooth' });
  };
  if(prev) prev.addEventListener('click', ()=>scrollByItem(-1));
  if(next) next.addEventListener('click', ()=>scrollByItem(1));
});

// Participant quote cards (seminar page): click/tap expands the card to
// fill the whole section (same behavior on desktop and mobile — hover no
// longer expands). Closes via: repeat click on the card, the close button,
// a click outside, or Escape.
(function(){
  const cards = Array.from(document.querySelectorAll('[data-quote-card]'));
  if(!cards.length) return;

  const setExpanded = (item, expanded)=>{
    item.classList.toggle('is-expanded', expanded);
    item.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };
  const closeAll = (except)=>{
    cards.forEach(el=>{ if(el !== except) setExpanded(el, false); });
  };
  const toggle = (item)=>{
    const willExpand = !item.classList.contains('is-expanded');
    closeAll(item);
    setExpanded(item, willExpand);
  };

  cards.forEach(item=>{
    item.addEventListener('click', (e)=>{
      if(e.target.closest('[data-quote-close]')) return;
      toggle(item);
    });
    item.addEventListener('keydown', (e)=>{
      if(e.target.closest('[data-quote-close]')) return;
      if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
        e.preventDefault();
        toggle(item);
      }
    });
    const closeBtn = item.querySelector('[data-quote-close]');
    if(closeBtn) closeBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      setExpanded(item, false);
    });
  });

  document.addEventListener('click', (e)=>{
    if(!e.target.closest('[data-quote-card]')) closeAll();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeAll();
  });
})();

// Direction pages: key-stats values ("80% / 50%", "Azerbaijan", a long
// pipeline name...) must fit inside a fixed 2-line box without ever being
// clipped or ellipsized. CSS alone can't guarantee this for arbitrary
// translated text, so: fix the box height to 2 lines of the *base* size
// (so all cards in a row stay aligned), then shrink font-size step by step
// until the value's measured box fits, down to a floor of 40% of base.
(function(){
  const boxes = Array.from(document.querySelectorAll('.stat-value-box'));
  if(!boxes.length) return;

  const MIN_SCALE = 0.4;
  const STEP = 0.04;

  const fit = (box)=>{
    const value = box.querySelector('.stat-value');
    if(!value) return;
    value.style.fontSize = '';
    const baseSize = parseFloat(getComputedStyle(value).fontSize);
    const lineHeight = parseFloat(getComputedStyle(value).lineHeight) || baseSize * 1.15;
    box.style.height = Math.round(lineHeight * 2) + 'px';

    let scale = 1;
    while(
      scale > MIN_SCALE &&
      (value.scrollHeight > box.clientHeight + 1 || value.scrollWidth > box.clientWidth + 1)
    ){
      scale -= STEP;
      value.style.fontSize = (baseSize * scale) + 'px';
    }
  };

  const fitAll = ()=> boxes.forEach(fit);
  fitAll();

  // Re-measure once the real webfonts have swapped in: font metrics differ
  // from the fallback font used for the first paint, so a value that just
  // barely fit against the fallback can still need shrinking afterwards.
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitAll, 150);
  });
})();

// Direction pages: the whole scenario card body (title + description +
// outcome) collapses together to a ~6-line-tall window with a toggle
// button (shown only when the combined content actually overflows that
// height). Because title/description/outcome all live inside the same
// fixed-height wrapper, the button ends up at the same vertical offset in
// every card of a row regardless of how long each title happens to be —
// before, the title sat outside the collapsible box as its own
// variable-height element, which is what made the button "float". Height
// is measured in px from the live line-height rather than fixed in CSS,
// so it works the same across uz/en/ru regardless of text length, and the
// toggle button is hidden entirely for scenarios short enough to already
// fit.
(function(){
  const cards = Array.from(document.querySelectorAll('.scenario-card'));
  if(!cards.length) return;

  const LINES = 6;

  // [data-scenario-desc] is the wrapper around the title, description and
  // outcome together — collapsing/expanding hides and reveals all three at
  // once. The 6-line budget is still measured off the description paragraph's own
  // line-height (the wrapper itself has no font styling of its own).
  const measure = (card)=>{
    const wrap = card.querySelector('[data-scenario-desc]');
    const descText = wrap ? wrap.querySelector('.scenario-desc') : null;
    const btn = card.querySelector('[data-scenario-toggle]');
    if(!wrap || !descText || !btn) return;

    const wasExpanded = card.classList.contains('is-expanded');
    wrap.style.maxHeight = 'none';
    const lineHeight = parseFloat(getComputedStyle(descText).lineHeight) || 20;
    const collapsedHeight = Math.round(lineHeight * LINES);
    const fullHeight = wrap.scrollHeight;

    if(fullHeight <= collapsedHeight + 1){
      btn.hidden = true;
      card.classList.remove('is-expanded');
      wrap.style.maxHeight = 'none';
      return;
    }

    btn.hidden = false;
    wrap.dataset.collapsedHeight = collapsedHeight;
    wrap.dataset.fullHeight = fullHeight;
    wrap.style.maxHeight = (wasExpanded ? fullHeight : collapsedHeight) + 'px';
  };

  const setExpanded = (card, expanded)=>{
    const wrap = card.querySelector('[data-scenario-desc]');
    const btn = card.querySelector('[data-scenario-toggle]');
    if(!wrap || !btn) return;
    card.classList.toggle('is-expanded', expanded);
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    btn.setAttribute('aria-label', expanded ? btn.dataset.labelLess : btn.dataset.labelMore);
    const target = expanded ? wrap.dataset.fullHeight : wrap.dataset.collapsedHeight;
    if(target) wrap.style.maxHeight = target + 'px';
  };

  cards.forEach(measure);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>cards.forEach(measure));
  cards.forEach(card=>{
    const btn = card.querySelector('[data-scenario-toggle]');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      setExpanded(card, !card.classList.contains('is-expanded'));
    });
  });

  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>cards.forEach(measure), 150);
  });
})();

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
