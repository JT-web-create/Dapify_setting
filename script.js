const codeInput = document.getElementById("codeInput");
const codeOutput = document.getElementById("codeOutput");

// Zones avec mots-clés, couleur et forme
let zones = {
  // Instructions simples
  instructions: { keywords: ["afficher","lire","retourner","stop","pause","continuer","sortir","debut","fin"], color:"#2aa6ff", shape:"rectangle" },
  boucles: { keywords:["tantque","pour","repeter","jusqua","faire"], color:"#2bd58a", shape:"rectangle" },
  comparaisons: { keywords:["==","!=",">","<",">=","<=","et","ou","non"], color:"#9b7bff", shape:"rectangle" },
  // Instructions composées
  conditions: { keywords:["si","sinon","sinon_si","selon","cas","finsi","fincondition","alors"], color:"#7fb3ff", shape:"losange" },
  // Fonctions / procédures (nouvelles zones)
  fonctions: { keywords:["fonction","retour","appel","parametre"], color:"#16a085", shape:"rectangle" },
  procedures: { keywords:["procedure","debut_proc","fin_proc","executer"], color:"#e67e22", shape:"rectangle" }
};

// Helpers
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isWordLike(s) {
  return /[A-Za-z0-9_À-ÿ]/.test(s);
}

// Vérifie les conflits de mot-clé (insensible à la casse)
function isKeywordUsed(word) {
  if(!word) return false;
  const w = word.trim().toLowerCase();
  return Object.values(zones).some(z => z.keywords.some(k => k.toLowerCase() === w));
}

// Affichage des mots-clés
function renderKeywords() {
  Object.keys(zones).forEach(zone => {
    const container = document.getElementById(`keywords-${zone}`);
    container.innerHTML = zones[zone].keywords.map(k =>
      `<span class="kw">${k} <button type="button" class="remove" aria-label="Supprimer ${k}" data-zone="${zone}" data-key="${k}">×</button></span>`).join("");
  });
  highlightCode();
}

// Ajouter mot-clé
function addKeyword(zone, inputId) {
  const input = document.getElementById(inputId);
  const word = input.value.trim();
  if(!word) return;
  if(isKeywordUsed(word)) {
    alert(`Le mot-clé "${word}" est déjà utilisé !`);
    return;
  }
  zones[zone].keywords.push(word);
  renderKeywords();
  input.value = "";
}

// Supprimer mot-clé
document.body.addEventListener("click", e => {
  if(e.target.classList && e.target.classList.contains("remove")) {
    const zone = e.target.dataset.zone;
    const key = e.target.dataset.key;
    zones[zone].keywords = zones[zone].keywords.filter(k => k !== key);
    renderKeywords();
  }
});

// Modifier couleur & forme -> notification pour organigramme
Object.keys(zones).forEach(zone => {
  const colorEl = document.getElementById(`color-${zone}`);
  const shapeEl = document.getElementById(`shape-${zone}`);
  colorEl.addEventListener("input",(e)=>{
    zones[zone].color = e.target.value;
    // notify organigramme for each keyword in zone
    zones[zone].keywords.forEach(k => onSettingsChange(k, zones[zone].shape, zones[zone].color));
    highlightCode();
  });
  shapeEl.addEventListener("change",(e)=>{
    zones[zone].shape = e.target.value;
    zones[zone].keywords.forEach(k => onSettingsChange(k, zones[zone].shape, zones[zone].color));
  });
});

// Bouton "+" pour afficher la section d'ajout
document.querySelectorAll(".btn-add-toggle").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const zone = btn.dataset.zone;
    const section = document.getElementById(`add-${zone}-section`);
    const open = !(section.style.display === "block");
    section.style.display = open ? "block" : "none";
    btn.classList.toggle('open', open);
    btn.textContent = open ? '−' : '+';
  });
});

// Bouton Ajouter pour chaque zone (sécurisé si absent)
// bind add buttons dynamically for any zone present in DOM
Object.keys(zones).forEach(z => {
  const btn = document.getElementById(`add-${z}-btn`);
  if(btn) btn.addEventListener("click", ()=>addKeyword(z, `input-${z}`));
  // palette handling
  const palette = document.getElementById(`palette-${z}`);
  const colorEl = document.getElementById(`color-${z}`);
  if(palette && colorEl){
    palette.addEventListener('change', (e)=>{
      if(e.target.value === 'vivid'){
        // pick a vivid preset mapping simple -> vivid color
        const vividMap = {
          instructions:'#35b7ff', boucles:'#1ad67a', comparaisons:'#b77bff', conditions:'#5fbfff', fonctions:'#0fb29a', procedures:'#ff9a3b'
        };
        if(vividMap[z]) colorEl.value = vividMap[z];
      } else {
        // revert to current zone color (no-op) — keep as is
      }
      colorEl.dispatchEvent(new Event('input'));
    });
  }
});

// Coloration robuste : préserve la casse originale et gère mots et symboles
function highlightCode() {
  // escape HTML
  let text = codeInput.value.replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // Build keyword list with colors
  const list = [];
  Object.keys(zones).forEach(zone => {
    zones[zone].keywords.forEach(word => {
      list.push({word, color: zones[zone].color, zone});
    });
  });

  // Sort by length desc to avoid partial matches
  list.sort((a,b)=> b.word.length - a.word.length);

  const tokenMap = new Map();
  let tokenId = 0;

  list.forEach(item => {
    if(!item.word) return;
    const esc = escapeRegex(item.word);
    const pattern = isWordLike(item.word) ? `\\b${esc}\\b` : esc;
    const re = new RegExp(pattern, 'gi');
    text = text.replace(re, match => {
      const token = `___DAPI_KW_${tokenId++}___`;
      // use zone color; keep original casing
      tokenMap.set(token, `<span style="color:${item.color}; font-weight:700">${match}</span>`);
      return token;
    });
  });

  // replace tokens back
  tokenMap.forEach((val, key) => {
    text = text.split(key).join(val);
  });

  codeOutput.innerHTML = text;
}

// Communication Organigramme (placeholder: log -> integrate with backend/iframe if needed)
function onSettingsChange(keyword, shape, color) {
  console.log(`Organigramme reçoit : ${keyword} → ${shape} (${color})`);
}

codeInput.addEventListener("input", highlightCode);

// Initial render
renderKeywords();
