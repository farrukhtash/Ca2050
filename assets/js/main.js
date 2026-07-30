function setLang(lang){
  document.documentElement.classList.toggle('lang-en', lang==='en');
  document.getElementById('btn-uz').classList.toggle('active', lang==='uz');
  document.getElementById('btn-en').classList.toggle('active', lang==='en');
}
function toggleNav(){
  document.getElementById('siteNav').classList.toggle('open');
}
document.getElementById('siteNav').querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', ()=>document.getElementById('siteNav').classList.remove('open'));
});
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.15});
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));
