/* TapPlay777 – lógica del juego */
const el = (id) => document.getElementById(id);

const scoreEl  = el('score');
const levelEl  = el('level');
const energyFill = el('energyFill');
const tapBtn   = el('tapBtn');
const msgEl    = el('message');
const shareBtn = el('shareBtn');
const resetBtn = el('resetBtn');
const boostBtn = el('boostBtn');
const burst    = el('burst');

const S = {
  score: 0,
  level: 1,
  energy: 100,
  boostUntil: 0,
  lastTap: 0,
  combo: 0,
};

const STORAGE_KEY = 'tapplay777:v1';

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
function load(){
  try{
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    Object.assign(S, d);
  }catch{}
}
function fmt(n){ return n.toLocaleString('es-PE'); }

function render(){
  scoreEl.textContent = fmt(S.score);
  levelEl.textContent = fmt(S.level);
  energyFill.style.width = Math.max(0, Math.min(100, S.energy)) + '%';
}

function levelThreshold(l){ return Math.floor(100 * Math.pow(1.35, l - 1)); }

function message(text, color='var(--text)'){
  msgEl.textContent = text;
  msgEl.style.color = color;
}

function vibrate(ms=30){ if(navigator.vibrate) navigator.vibrate(ms); }

function rand(min,max){ return Math.random()*(max-min)+min; }

function spawnBurst(x,y, baseColor){
  for(let i=0;i<18;i++){
    const d = document.createElement('div');
    d.className = 'p';
    d.style.background = baseColor;
    d.style.left = x+'px';
    d.style.top  = y+'px';
    burst.appendChild(d);
    const ang = rand(0, Math.PI*2);
    const v   = rand(150, 420);
    const dx  = Math.cos(ang)*v, dy = Math.sin(ang)*v;
    const t0 = performance.now();
    const life = rand(500,900);

    (function anim(t){
      const k = Math.min(1,(t-t0)/life);
      d.style.transform = `translate(${dx*k}px, ${dy*k - 400*k*k}px) scale(${1-k*.5})`;
      d.style.opacity = String(1-k);
      if(k<1) requestAnimationFrame(anim); else d.remove();
    })(t0);
  }
}

const praise = [
  '¡🔥 Combo épico!',
  '¡⚡ Ritmo perfecto!',
  '¡💎 Crítico!',
  '¡🚀 Eso suma!','¡⭐ Buen timing!','¡🏆 Récord en camino!',
];

function tickLevel(){
  let needed = levelThreshold(S.level);
  if(S.score >= needed){
    S.level++;
    message(`¡Subiste a nivel ${S.level}!`, 'var(--good)');
  }
}

function gain(base){
  // boost
  if(Date.now() < S.boostUntil) base *= 2;

  // combo por taps rápidos
  const now = performance.now();
  if(now - S.lastTap < 450){ S.combo++; base += S.combo; }
  else S.combo = 0;
  S.lastTap = now;

  S.score += base;
  tickLevel();
  render();
}

function spendEnergy(){
  S.energy = Math.max(0, S.energy - 1.8);
  render();
  if(S.energy <= 0){
    message('Sin energía. Espera o usa Boost.', 'var(--warn)');
    return false;
  }
  return true;
}

tapBtn.addEventListener('click', (ev)=>{
  if(!spendEnergy()) return;
  const rect = tapBtn.getBoundingClientRect();
  const x = rect.left + rect.width/2;
  const y = rect.top  + rect.height/2 + window.scrollY;

  const base = 1 + Math.floor(S.level/3);
  gain(base);

  const c = (S.combo >= 8) ? '#34d399' : (S.combo>=3 ? '#22d3ee' : '#a78bfa');
  spawnBurst(x,y,c);
  vibrate(15);

  // frase aleatoria
  if(Math.random() < .22){
    message(praise[(Math.random()*praise.length)|0], c);
  }
  save();
});

shareBtn.addEventListener('click', async ()=>{
  const text = `Mi racha en TapPlay777: ${fmt(S.score)} puntos, nivel ${fmt(S.level)} 💥 ¿me superas?`;
  const url = location.href;
  try{
    if(navigator.share){
      await navigator.share({ title:'TapPlay777', text, url });
    }else{
      await navigator.clipboard.writeText(text+' '+url);
      message('Enlace copiado, ¡compártelo!', 'var(--good)');
    }
  }catch(e){
    console.log(e);
    message('No se pudo compartir 😅', 'var(--bad)');
  }
});

resetBtn.addEventListener('click', ()=>{
  if(confirm('¿Reiniciar tu progreso?')){
    Object.assign(S, { score:0, level:1, energy:100, combo:0, lastTap:0, boostUntil:0 });
    save(); render(); message('Progreso reiniciado.');
  }
});

boostBtn.addEventListener('click', ()=>{
  if(S.energy < 10){ message('Necesitas un poco de energía para activar Boost.', 'var(--warn)'); return; }
  S.energy = Math.max(0, S.energy - 10);
  S.boostUntil = Date.now()+10_000;
  render();
  message('⚡ Boost x2 por 10s. ¡Aprovecha!', '#22d3ee');
});

/* Recuperación de energía */
setInterval(()=>{
  S.energy = Math.min(100, S.energy + 0.8);
  render();
}, 1000);

/* Guardado periódico */
setInterval(save, 3000);
/* ==== CTA / Modal / Tracking ==== */

// Elementos
const ctaBar = document.getElementById('ctaBar');
const offerModal = document.getElementById('offerModal');
const closeModalBtn = document.getElementById('closeModal');
const ctaBuy = document.getElementById('ctaBuy');
const streakNum = document.getElementById('streakNum');
const countdownEl = document.getElementById('countdown');

let streak = 0;
let timer = 59; // seg para el -20%
let timerRef = null;

// Simula la racha leyendo tu marcador si lo tienes
function updateStreakUI(val){
  streak = val ?? streak + 1;
  if (streakNum) streakNum.textContent = String(streak);
  if (streak >= 10) { // umbral para mostrar CTA automáticamente
    ctaBar?.setAttribute('aria-hidden','false');
  }
}
updateStreakUI(0);

// Temporizador simple mm:ss
function startCountdown(){
  clearInterval(timerRef);
  timer = 59;
  timerRef = setInterval(()=>{
    const m = String(Math.floor(timer/60)).padStart(2,'0');
    const s = String(timer%60).padStart(2,'0');
    if (countdownEl) countdownEl.textContent = `${m}:${s}`;
    if (timer-- <= 0) {
      clearInterval(timerRef);
      // Oculta el descuento si deseas: ctaBar?.setAttribute('aria-hidden','true');
    }
  }, 1000);
}
startCountdown();

// Abre modal si el usuario hace hover o click en la CTA
ctaBuy?.addEventListener('mouseenter', ()=> track('cta_hover'));
ctaBuy?.addEventListener('click', (e)=>{
  track('cta_click');
  // si prefieres abrir modal en vez de ir directo, descomenta:
  // e.preventDefault();
  // openModal();
});

// Modal helpers
function openModal(){ offerModal?.setAttribute('aria-hidden','false'); track('modal_open'); }
function closeModal(){ offerModal?.setAttribute('aria-hidden','true'); track('modal_close'); }
closeModalBtn?.addEventListener('click', closeModal);
offerModal?.addEventListener('click', (e)=>{ if(e.target === offerModal) closeModal(); });

// Pequeño “buscapié” si el usuario baja
let seenBar = false;
window.addEventListener('scroll', ()=>{
  if (seenBar) return;
  if (window.scrollY > 100) {
    seenBar = true;
    ctaBar?.setAttribute('aria-hidden','false');
    track('cta_autoshow_scroll');
  }
});

// Tracking (GA4 o consola)
function track(eventName, data={}){
  if (window.gtag) {
    gtag('event', eventName, data);
  } else {
    console.log('[track]', eventName, data);
  }
}


/* Cargar estado */
load(); render(); message('¡Listo para romper tu récord!');
