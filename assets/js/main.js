function setLang(lang){
  document.documentElement.classList.toggle('lang-en', lang==='en');
  document.getElementById('btn-uz').classList.toggle('active', lang==='uz');
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
}

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

// Scroll-reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));
