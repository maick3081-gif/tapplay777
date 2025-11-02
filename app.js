/* ========= CONFIGURACIÓN DE OFERTAS (EDITA AQUÍ TUS LINKS) =========
   - Reemplaza cada "url" con tu hotlink de afiliado (Checkout o Página de producto)
   - "slug" es el código que usarás en la URL con ?of=slug (p.ej. ?of=guia-bebe)
   - "copy" es el texto que verán en la barra y modal
   - "pct" es el porcentaje que mostramos (solo visual)
*/
const OFFERS = [
  {
    slug: "guia-bebe",
    name: "Guía de Estimulación Temprana",
    url: "https://go.hotmart.com/W102734941W", // <-- Pega tu hotlink aquí
    copy: "Guía de Estimulación Temprana: acceso inmediato",
    pct: "-20%"
  },
  {
    slug: "peso-saludable",
    name: "Bajar de peso saludablemente",
    url: "https://go.hotmart.com/W102734941W?dp=1", // <-- ejemplo segunda oferta
    copy: "Plan Saludable: transforma tu energía y figura",
    pct: "-25%"
  },
  {
    slug: "pmp-pro",
    name: "Curso PMP®",
    url: "https://go.hotmart.com/C101412736R?ap=5808", // <-- tu hotlink PMP®
    copy: "Prep PMP®: sube de nivel profesional",
    pct: "-15%"
  }
];

// Oferta por defecto si no se pasa ?of=...
const DEFAULT_OFFER = OFFERS[0];

/* ========= UTILIDADES ========= */
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const findOffer = (slug) => OFFERS.find(o => o.slug === slug);
const currentOffer = findOffer(params.get("of")) || DEFAULT_OFFER;

// Atajos a elementos UI
const buyTop   = qs("#buyTop");
const buyModal = qs("#buyModal");
const ctaBar   = qs("#ctaBar");
const ctaCopy  = qs("#ctaCopy");
const offerPct = qs("#offerPct");
const offerTxt = qs("#offerText");
const modal    = qs("#offerModal");
const closeBtn = qs("#closeModal");

// === Enlaza CTA al hotlink correcto ===
function bindOffer(offer) {
  if (!offer) return;
  [buyTop, buyModal].forEach(a => {
    if (a) {
      a.setAttribute("href", offer.url);
      a.setAttribute("rel", "nofollow noreferrer");
      a.setAttribute("target", "_blank");
    }
  });
  if (ctaCopy)  ctaCopy.textContent  = offer.copy || "Oferta disponible";
  if (offerPct) offerPct.textContent = offer.pct  || "-20%";
  if (offerTxt) offerTxt.textContent = `Tu racha te desbloquea: ${offer.copy}. ¡Tiempo limitado!`;
}
bindOffer(currentOffer);

// === Juego (muy simple; usa lo que ya tenías) ===
let score = 0, level = 1, energy = 100, boost = false;
const scoreEl  = qs("#score");
const levelEl  = qs("#level");
const energyEl = qs("#energyFill");
const msgEl    = qs("#message");
const tapBtn   = qs("#tapBtn");

function updateUI() {
  if (scoreEl)  scoreEl.textContent  = score;
  if (levelEl)  levelEl.textContent  = level;
  if (energyEl) energyEl.style.width = `${Math.max(0, energy)}%`;
}

function addPoints() {
  if (energy <= 0) return;
  const inc = boost ? 2 : 1;
  score += inc;
  energy -= 1;
  if (score % 20 === 0) {
    level++;
    // muestra modal de vez en cuando
    if (modal) openModal();
  }
  updateUI();
}

function openModal() {
  modal?.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModalFn() {
  modal?.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

tapBtn?.addEventListener("click", addPoints);
qs("#resetBtn")?.addEventListener("click", () => { score=0; level=1; energy=100; updateUI(); });
qs("#boostBtn")?.addEventListener("click", () => { boost = true; setTimeout(()=>boost=false, 10_000); });
qs("#shareBtn")?.addEventListener("click", async () => {
  const shareData = {
    title: "Mi racha TapPlay777",
    text: `Voy en ${score} puntos y nivel ${level} ¡Rétame!`,
    url: location.href
  };
  try { await navigator.share?.(shareData); }
  catch { navigator.clipboard.writeText(location.href); }
});
closeBtn?.addEventListener("click", closeModalFn);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModalFn(); });

// Inicial
updateUI();

// (Opcional) UTM tracking rudimentario para saber desde dónde vienen
(function track() {
  const s = params.toString();
  if (!s) return;
  sessionStorage.setItem("tapplay_utm", s);
})();
