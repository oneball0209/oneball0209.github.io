let reviews = [];

async function loadReviews(){
  try{
    // compute a robust URL for data/reviews.json relative to this script file
    let scriptEl = document.currentScript;
    if(!scriptEl){
      // fallback: find a script tag that looks like our main.js
      const scripts = document.getElementsByTagName('script');
      for(const s of scripts){ if(s.src && s.src.includes('js/main.js')){ scriptEl = s; break; } }
    }
    let dataUrl;
    if(scriptEl && scriptEl.src){
      // main.js is typically at /js/main.js; compute ../data/reviews.json from script URL
      dataUrl = new URL('../data/reviews.json', scriptEl.src).href;
    }else{
      // last-resort: build from current location (site-root relative)
      const pathBase = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
      dataUrl = new URL('data/reviews.json', pathBase).href;
    }
    const res = await fetch(dataUrl);
    if(!res.ok) throw new Error('Network response was not ok');
    reviews = await res.json();
    // once reviews loaded, render filters and cards
    renderFilters();
    renderCards();
  }catch(err){
    console.error('Failed to load reviews.json', err);
    const container = document.getElementById('reviews');
    if(container) container.innerText = '載入評論資料失敗，請稍後再試。';
  }
}

function unique(values){
  return [...new Set(values)];
}

function el(tag, props={}, children=[]){
  const e = document.createElement(tag);
  for(const k in props){ if(k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), props[k]); else e.setAttribute(k, props[k]); }
  (Array.isArray(children) ? children : [children]).forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); });
  return e;
}

function renderFilters(){
  const regions = unique(reviews.map(r=>r.region));
  const cats = unique(reviews.map(r=>r.category));

  const regionSelect = document.getElementById('regionFilter');
  regions.forEach(r=>{
    const o = document.createElement('option'); o.value = r; o.textContent = r; regionSelect.appendChild(o);
  });

  const catSelect = document.getElementById('categoryFilter');
  cats.forEach(c=>{ const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o); });
}

function matchesFilter(item, region, category, q){
  if(region && region!=='all' && item.region !== region) return false;
  if(category && category!=='all' && item.category !== category) return false;
  if(q){
    const s = (item.title + ' ' + item.excerpt + ' ' + item.region + ' ' + item.category).toLowerCase();
    if(!s.includes(q.toLowerCase())) return false;
  }
  return true;
}

function renderCards(){
  const container = document.getElementById('reviews');
  container.innerHTML = '';
  const region = document.getElementById('regionFilter').value;
  const category = document.getElementById('categoryFilter').value;
  const q = document.getElementById('searchInput').value.trim();

  const filtered = reviews.filter(r=>matchesFilter(r, region, category, q));

  if(filtered.length===0){
    container.appendChild(el('p',{},['找不到符合的評論。']));
    return;
  }

  filtered.forEach(r=>{
    const card = el('article',{class:'card'});
    const h = el('h3',{},[el('a',{href:r.url},[r.title])]);
    const meta = el('div',{class:'meta'},[`${r.region} · ${r.category} `, el('span',{class:'rating'},[`${r.rating}★`])]);
    const ex = el('p',{class:'excerpt'},[r.excerpt]);
    const read = el('p',{},[el('a',{href:r.url},['閱讀完整評論 →'])]);
    card.appendChild(h); card.appendChild(meta); card.appendChild(ex); card.appendChild(read);
    container.appendChild(card);
  });
}

function wire(){
  // attach event listeners; actual rendering happens after loadReviews()
  const regionEl = document.getElementById('regionFilter');
  const catEl = document.getElementById('categoryFilter');
  const searchEl = document.getElementById('searchInput');
  if(regionEl) regionEl.addEventListener('change', renderCards);
  if(catEl) catEl.addEventListener('change', renderCards);
  if(searchEl) searchEl.addEventListener('input', debounce(renderCards, 200));
}

function debounce(fn, wait){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }

document.addEventListener('DOMContentLoaded', ()=>{ wire(); loadReviews(); });
