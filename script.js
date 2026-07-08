// ═══════════════════════════════════════
// SHARED SCRIPT — loaded on every page
// ═══════════════════════════════════════

// ── CART (persisted via localStorage) ──
let cart=[];
try{ const saved = localStorage.getItem('reliance_cart'); if(saved) cart = JSON.parse(saved); }catch(e){ cart=[]; }
function saveCart(){ try{ localStorage.setItem('reliance_cart', JSON.stringify(cart)); }catch(e){} }

const DISCOUNT = 0.10; // 10% discount
const VAT = 0.16;      // 16% VAT

function discountedPrice(p){ return Math.round(p.price * (1 - DISCOUNT)); }
function vatAmount(p){ return Math.round(discountedPrice(p) * VAT); }
function finalPrice(p){ return discountedPrice(p) + vatAmount(p); }

// ── CART ──
function addToCart(id){
  const p=products.find(x=>x.id===id);
  const ex=cart.find(x=>x.id===id);
  if(ex)ex.qty++;
  else cart.push({...p,qty:1});
  saveCart();
  updateCartUI();
  // flash badge
  const badge=document.getElementById('cart-badge');
  badge.style.display='flex';
  badge.style.transform='scale(1.4)';
  setTimeout(()=>badge.style.transform='scale(1)',200);
}

function removeFromCart(id){cart=cart.filter(x=>x.id!==id);saveCart();updateCartUI();}
function changeQty(id,delta){
  const item=cart.find(x=>x.id===id);
  if(item){item.qty+=delta;if(item.qty<=0)removeFromCart(id);}
  saveCart();
  updateCartUI();
}

function updateCartUI(){
  const subtotal=cart.reduce((s,x)=>s+(discountedPrice(x)*x.qty),0);
  const vat=Math.round(subtotal*VAT);
  const total=subtotal+vat;
  const count=cart.reduce((s,x)=>s+x.qty,0);
  const badge=document.getElementById('cart-badge');
  badge.textContent=count;
  badge.style.display=count>0?'flex':'none';
  document.getElementById('cart-subtotal').textContent='KES '+subtotal.toLocaleString();
  document.getElementById('cart-vat').textContent='KES '+vat.toLocaleString();
  document.getElementById('cart-total').textContent='KES '+total.toLocaleString();
  const list=document.getElementById('cart-items-list');
  if(cart.length===0){list.innerHTML='<div class="cart-empty">Your cart is empty.<br>Browse our shop to add items.</div>';return;}
  list.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div class="cart-item-icon">${item.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">KES ${discountedPrice(item).toLocaleString()} × ${item.qty} <span style="color:var(--muted);font-size:11px;text-decoration:line-through;margin-left:4px">KES ${item.price.toLocaleString()}</span></div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
        </div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})">✕</button>
    </div>`).join('');
}

function toggleCart(){
  document.getElementById('cart-sidebar').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

function orderViaWhatsApp(){
  if(cart.length===0)return;
  const subtotal=cart.reduce((s,x)=>s+(discountedPrice(x)*x.qty),0);
  const vat=Math.round(subtotal*VAT);
  const total=subtotal+vat;
  let lines=cart.map(item=>`• ${item.qty}x ${item.name} — KES ${(discountedPrice(item)*item.qty).toLocaleString()}`).join('%0A');
  const msg=`Hello Reliance Fire Safety! 👋%0A%0AI'd like to place the following order:%0A%0A${lines}%0A%0ASubtotal (after 10% discount): KES ${subtotal.toLocaleString()}%0AVAT (16%): KES ${vat.toLocaleString()}%0A*Total: KES ${total.toLocaleString()}*%0A%0APlease confirm availability and send payment details. Thank you!`;
  window.open(`https://wa.me/254777723785?text=${msg}`,'_blank');
}


// ── ESCAPE KEY CLOSES ANY MODAL ──
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    ['svc-modal-overlay','ind-modal-overlay','port-modal'].forEach(id=>{
      document.getElementById(id)?.classList.remove('open');
    });
    document.body.style.overflow='';
  }
});

// ── SCROLL ANIMATIONS ──
function animateCount(el){
  const final = el.textContent.trim();
  const num = parseInt(final.replace(/[^0-9]/g,''));
  if(!isNaN(num) && num > 0){
    const suffix = final.replace(/[0-9]/g,'');
    let start = 0;
    const steps = 50;
    const interval = 1200 / steps;
    el.textContent = '0' + suffix;
    const timer = setInterval(()=>{
      start += Math.ceil(num / steps);
      if(start >= num){ start = num; clearInterval(timer); }
      el.textContent = start.toLocaleString() + suffix;
    }, interval);
  }
}

function initScrollAnimations(){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, {threshold: 0.12, rootMargin:'0px 0px -30px 0px'});

  // Service cards — staggered cascade (0,80,160,240,320,400ms) triggered once as a group
  const svcGrid = document.querySelector('.services-grid');
  if(svcGrid){
    const svcCards = svcGrid.querySelectorAll('.svc-card');
    let svcHasRun = false;
    const svcObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting && !svcHasRun){
          svcHasRun = true;
          svcCards.forEach((card, i) => {
            setTimeout(() => card.classList.add('visible'), i * 80);
          });
          svcObserver.disconnect();
        }
      });
    }, {threshold: 0.1, rootMargin:'0px 0px -30px 0px'});
    svcObserver.observe(svcGrid);
  }

  // Reasons slide in from left
  document.querySelectorAll('.reason').forEach(el => observer.observe(el));

  // Stat blocks flip in
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      // count up numbers inside
      entry.target.querySelectorAll('.stat-block-num').forEach(el => animateCount(el));
      statObserver.unobserve(entry.target);
    });
  }, {threshold: 0.2});
  document.querySelectorAll('.stat-block').forEach(el => statObserver.observe(el));

  // Hero stats count up
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-num').forEach(el => animateCount(el));
      heroObserver.unobserve(entry.target);
    });
  }, {threshold: 0.3});
  const statsRow = document.querySelector('.stats-row');
  if(statsRow) heroObserver.observe(statsRow);
}



// ── SERVICE MODALS ──
const svcData = {
  detection:{
    tag:'Fire Detection',
    title:'FIRE DETECTION SYSTEMS',
    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    desc:'Our fire detection systems use the latest optical, thermal and multi-sensor technology to detect fire at the earliest possible stage. We design, supply, install and commission detection systems for all building types across Kenya and East Africa — from small offices to large industrial complexes.',
    features:[
      {h:'Optical Smoke Detectors',p:'Highly sensitive photoelectric detectors for early smoke detection.'},
      {h:'Heat Detectors',p:'Fixed temperature and rate-of-rise heat detectors for kitchens and plant rooms.'},
      {h:'Multi-Sensor Detectors',p:'Combined smoke and heat detection for reduced false alarms.'},
      {h:'Beam Detectors',p:'Long-range detection for warehouses, atriums and open spaces.'},
      {h:'Flame Detectors',p:'UV/IR flame detection for high-risk industrial environments.'},
      {h:'Gas Detectors',p:'LPG and CO gas leak detection for kitchens and generator rooms.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=75',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=75',
    ]
  },
  sprinkler:{
    tag:'Suppression',
    title:'SPRINKLER SYSTEMS',
    img:'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85',
    desc:'Sprinkler systems are the most effective automatic fire suppression method available. We design and install wet pipe, dry pipe and pre-action systems tailored to your building type, occupancy and risk level. All installations are fully compliant with BS EN 12845 and NFPA 13 standards.',
    features:[
      {h:'Wet Pipe Systems',p:'Always charged with water — fastest response for most commercial buildings.'},
      {h:'Dry Pipe Systems',p:'For unheated spaces where pipes could freeze.'},
      {h:'Pre-Action Systems',p:'Two-step activation — ideal for data centres and archives.'},
      {h:'Deluge Systems',p:'Open head systems for high-hazard industrial areas.'},
      {h:'Sprinkler Heads',p:'Upright, pendent and concealed heads to suit all aesthetics.'},
      {h:'Hydraulic Design',p:'Full hydraulic calculations and documentation provided.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=75',
    ]
  },
  suppression:{
    tag:'Fire Suppression',
    title:'FIRE SUPPRESSION SYSTEMS',
    img:'https://images.unsplash.com/photo-1599248839487-3b58a9ef8f78?w=900&q=85',
    desc:'For environments where water-based systems could cause damage, we supply and install gaseous, foam and clean agent suppression systems. These are ideal for server rooms, generator rooms, commercial kitchens and any area containing sensitive equipment or high-value assets.',
    features:[
      {h:'FM-200 Clean Agent',p:'Zero residue — safe for electronics, server rooms and occupied spaces.'},
      {h:'CO2 Suppression',p:'Total flooding systems for electrical and industrial hazards.'},
      {h:'Foam Systems',p:'AFFF foam for fuel storage, aircraft hangars and petrochemical plants.'},
      {h:'Kitchen Suppression',p:'Wet chemical systems for commercial kitchen hoods and deep fryers.'},
      {h:'Inert Gas Systems',p:'IG-541 and IG-55 for environmentally sensitive installations.'},
      {h:'Automatic Activation',p:'Integrated with detection panels for instant automatic discharge.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1599248839487-3b58a9ef8f78?w=400&q=75',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=75',
    ]
  },
  alarm:{
    tag:'Fire Alarms',
    title:'FIRE ALARM SYSTEMS',
    img:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&q=85',
    desc:'A reliable fire alarm system is the backbone of any building fire safety strategy. We install both conventional and fully addressable fire alarm panels, complete with detectors, manual call points, sounders, beacons and remote monitoring capability. All systems are commissioned, tested and certified.',
    features:[
      {h:'Conventional Panels',p:'Cost-effective zone-based systems for smaller buildings.'},
      {h:'Addressable Panels',p:'Each device has a unique address — precise fault and fire location.'},
      {h:'Networked Systems',p:'Multiple panels linked across large campuses or multi-site estates.'},
      {h:'Voice Evacuation',p:'Integrated PA/VA systems for clear emergency announcements.'},
      {h:'Remote Monitoring',p:'24-hour monitoring with automatic dispatch capability.'},
      {h:'BS EN 54 Certified',p:'All equipment meets European fire alarm standards.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=75',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=75',
    ]
  },
  maintenance:{
    tag:'Maintenance',
    title:'MAINTENANCE & SERVICE',
    img:'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&q=85',
    desc:'Fire safety systems must be regularly tested and maintained to ensure they perform when needed. We offer annual, bi-annual and quarterly maintenance contracts covering all types of fire protection equipment. Our engineers carry out full system checks, testing and documentation to keep your building compliant.',
    features:[
      {h:'Scheduled Servicing',p:'Planned visits for routine testing, cleaning and documentation.'},
      {h:'Extinguisher Service',p:'Annual inspection, refilling and certification of all extinguishers.'},
      {h:'Panel Testing',p:'Full walk-test of all detectors, call points and sounders.'},
      {h:'Sprinkler Inspection',p:'Pressure tests, valve checks and head inspection.'},
      {h:'Compliance Certificates',p:'Full service reports provided for insurance and regulatory purposes.'},
      {h:'Fast Response',p:'Priority callout for maintenance contract clients.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=75',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=75',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75',
    ]
  },
  risk:{
    tag:'Risk Assessment',
    title:'FIRE RISK ASSESSMENT',
    img:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=85',
    desc:'A professional fire risk assessment is a legal requirement for all non-domestic premises in Kenya. Our certified assessors carry out thorough inspections of your property, identify fire hazards, evaluate existing controls and produce a detailed written report with actionable recommendations.',
    features:[
      {h:'Full Site Survey',p:'Thorough inspection of all areas including roof voids and plant rooms.'},
      {h:'Hazard Identification',p:'Systematic identification of ignition sources and fire loads.'},
      {h:'Risk Evaluation',p:'Assessment of risk to occupants including vulnerable persons.'},
      {h:'Written Report',p:'Detailed report with photographs and prioritised action plan.'},
      {h:'Regulatory Compliance',p:'Ensures compliance with Kenya fire safety regulations.'},
      {h:'Insurance Support',p:'Reports accepted by all major insurers for premium assessment.'},
    ],
    photos:[
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=75',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=75',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=75',
    ]
  },
};

function openSvcModal(key){
  const d = svcData[key];
  if(!d) return;
  document.getElementById('svc-modal-tag').textContent = d.tag;
  document.getElementById('svc-modal-title').textContent = d.title;
  document.getElementById('svc-modal-desc').textContent = d.desc;
  document.getElementById('svc-modal-img').src = d.img;
  document.getElementById('svc-modal-features').innerHTML = d.features.map(f=>
    `<div class="svc-feature"><h4>${f.h}</h4><p>${f.p}</p></div>`).join('');
  document.getElementById('svc-modal-photos').innerHTML = d.photos.map(p=>
    `<img src="${p}" alt="" loading="lazy">`).join('');
  document.getElementById('svc-modal-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeSvcModal(e){
  if(e.target===document.getElementById('svc-modal-overlay')){
    document.getElementById('svc-modal-overlay').classList.remove('open');
    document.body.style.overflow='';
  }
}

// ── INDUSTRY MODALS ──
const indData = {
  commercial:{
    tag:'Industry',title:'COMMERCIAL BUILDINGS',
    desc:'Office parks, business centres and corporate headquarters we have protected across Kenya.',
    companies:[
      {name:'Tulip House',loc:'Nairobi CBD'},
      {name:'Arbor House',loc:'Westlands'},
      {name:'Longonot Place',loc:'Nairobi'},
      {name:'Norfolk Towers',loc:'Nairobi'},
      {name:'Royal Offices',loc:'Nairobi'},
    ]
  },
  hotel:{
    tag:'Industry',title:'HOTELS & HOSPITALITY',
    desc:'Leading hotels and hospitality venues we have equipped with full fire protection systems.',
    companies:[
      {name:'Holiday Inn Two Rivers',loc:'Nairobi'},
      {name:'Nairobi Safari Park Hotel',loc:'Nairobi'},
      {name:'Kutana Lounge',loc:'Nairobi'},
      {name:'Parkside',loc:'Nairobi'},
      {name:'The Chocolate Bar',loc:'Nairobi'},
    ]
  },
  education:{
    tag:'Industry',title:'SCHOOLS & UNIVERSITIES',
    desc:'Educational institutions across Kenya where we have installed fire safety systems.',
    companies:[
      {name:'German International School',loc:'Nairobi'},
      {name:'Peponi International School',loc:'Nairobi'},
      {name:'Light International School',loc:'Nairobi'},
      {name:'Africa Nazarene University',loc:'Nairobi'},
      {name:'Rusinga School',loc:'Nairobi'},
    ]
  },
  finance:{
    tag:'Industry',title:'BANKS & FINANCE',
    desc:'Financial institutions and insurance companies we have protected across East Africa.',
    companies:[
      {name:'Mid East Bank',loc:'Nairobi'},
      {name:'Sanlam Kenya',loc:'Nairobi'},
      {name:'ITF',loc:'Nairobi'},
      {name:'Fin Trade',loc:'Nairobi'},
      {name:'Antarc Africa',loc:'Nairobi'},
    ]
  },
  retail:{
    tag:'Industry',title:'RETAIL & FOOD & BEVERAGE',
    desc:'Shopping centres, supermarkets and F&B outlets we have protected.',
    companies:[
      {name:'Java House',loc:'Multiple Branches'},
      {name:'Glovo Kenya',loc:'Nairobi'},
      {name:'Thika Bazaar',loc:'Thika'},
      {name:'Prosels Limited',loc:'Nairobi'},
      {name:'The Chocolate Bar',loc:'Nairobi'},
    ]
  },
  healthcare:{
    tag:'Industry',title:'HOSPITALS & HEALTHCARE',
    desc:'Healthcare facilities requiring specialised fire protection solutions.',
    companies:[
      {name:'Eldohosp',loc:'Eldoret'},
      {name:'Africa Bio Systems',loc:'Nairobi'},
    ]
  },
  residential:{
    tag:'Industry',title:'RESIDENTIAL & APARTMENTS',
    desc:'Apartment complexes and residential estates we have protected.',
    companies:[
      {name:'Royal Residency',loc:'Nairobi'},
      {name:'Krishna Residency',loc:'Nairobi'},
      {name:'Samar Gardens',loc:'Nairobi'},
      {name:'The Residences — Gen. Mathenge',loc:'Nairobi'},
      {name:'Longonot Place',loc:'Nairobi'},
    ]
  },
  industrial:{
    tag:'Industry',title:'INDUSTRIAL & MANUFACTURING',
    desc:'Industrial facilities and warehouses requiring robust fire protection.',
    companies:[
      {name:'Broadways Go Downs',loc:'Nairobi'},
      {name:'Mitchell Cotts',loc:'Nairobi'},
      {name:'Ultravetis',loc:'Nairobi'},
      {name:'Antarc Africa',loc:'Nairobi'},
    ]
  },
  warehouse:{
    tag:'Industry',title:'WAREHOUSES & LOGISTICS',
    desc:'Storage facilities and logistics hubs across Kenya.',
    companies:[
      {name:'Broadways Go Downs',loc:'Nairobi'},
      {name:'Mitchell Cotts',loc:'Nairobi'},
      {name:'Prosels Limited',loc:'Nairobi'},
    ]
  },
  technology:{
    tag:'Industry',title:'TECHNOLOGY & DATA CENTERS',
    desc:'IT companies and server room environments requiring clean agent suppression.',
    companies:[
      {name:'Serianu Ltd',loc:'Nairobi'},
      {name:'Westcom',loc:'Nairobi'},
      {name:'Africa Bio Systems',loc:'Nairobi'},
      {name:'Home Boyz',loc:'Nairobi'},
      {name:'ITF',loc:'Nairobi'},
    ]
  },
};

function openIndModal(key){
  const d = indData[key];
  if(!d) return;
  document.getElementById('ind-modal-tag').textContent = d.tag;
  document.getElementById('ind-modal-title').textContent = d.title;
  document.getElementById('ind-modal-desc').textContent = d.desc;
  document.getElementById('ind-company-grid').innerHTML = d.companies.map((c,i)=>{
    return `<div class="client-box"><span class="cb-idx">C·${String(i+1).padStart(2,'0')}</span><p>${c.name}</p><span>${c.loc}</span></div>`;
  }).join('');
  document.getElementById('ind-modal-overlay').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeIndModal(e){
  if(e.target===document.getElementById('ind-modal-overlay')){
    document.getElementById('ind-modal-overlay').classList.remove('open');
    document.body.style.overflow='';
  }
}


// ── CONTACT DROPDOWN ──
function toggleContactDrop(){
  const drop = document.getElementById('contact-drop');
  drop.style.display = drop.style.display === 'none' ? 'block' : 'none';
}
function toggleServicesDrop(){
  const drop = document.getElementById('services-drop');
  drop.style.display = drop.style.display === 'block' ? 'none' : 'block';
}
function closeServicesDrop(){
  document.getElementById('services-drop').style.display = 'none';
}
document.addEventListener('click', function(e){
  const wrap = document.getElementById('contact-dropdown-wrap');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('contact-drop').style.display = 'none';
  }
  const svcWrap = document.getElementById('services-drop-wrap');
  if(svcWrap && !svcWrap.contains(e.target)){
    document.getElementById('services-drop').style.display = 'none';
  }
});

// ── GLOBAL INIT (runs on every page) ──
document.addEventListener('DOMContentLoaded', function(){
  updateCartUI();
});

// ── CROSS-PAGE QUOTE NAVIGATION ──
// Book Assessment buttons live in shared modals used on Shop/Portfolio too,
// where the Quote wizard (page-quote) doesn't exist — redirect to Home instead.
function goToQuote(){
  if(document.getElementById('page-quote')){
    showPage('quote');
  } else {
    window.location.href = 'index.html?openQuote=1';
  }
}

// ══════════════════════════════════════════════════════
// COOKIE CONSENT — with real blocking of non-essential scripts
// ══════════════════════════════════════════════════════
//
// HOW TO GATE A SCRIPT (e.g. Google Analytics, Tawk.to, Meta Pixel):
// Instead of:   <script src="https://example.com/tracker.js"></script>
// Use:          <script type="text/plain" data-cookie-category="analytics" data-src="https://example.com/tracker.js"></script>
// Or for inline code:
//               <script type="text/plain" data-cookie-category="analytics">
//                 gtag('config', 'G-XXXXXXX');
//               </script>
// data-cookie-category must be one of: "analytics", "marketing"
// (type="text/plain" means the browser will NOT execute it until we activate it below)

const COOKIE_CONSENT_KEY = 'reliance_cookie_consent';

function getCookieConsent(){
  try{
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function setCookieConsent(prefs){
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
    necessary:true,
    analytics:!!prefs.analytics,
    marketing:!!prefs.marketing,
    timestamp:new Date().toISOString()
  }));
  activateGatedScripts(prefs);
  hideCookieBanner();
  closeCookieModal();
}

function activateGatedScripts(prefs){
  document.querySelectorAll('script[type="text/plain"][data-cookie-category]').forEach(oldScript=>{
    const cat = oldScript.getAttribute('data-cookie-category');
    if((cat==='analytics' && prefs.analytics) || (cat==='marketing' && prefs.marketing)){
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr=>{
        if(attr.name!=='type') newScript.setAttribute(attr.name, attr.value);
      });
      const src = oldScript.getAttribute('data-src');
      if(src){ newScript.src = src; }
      else { newScript.textContent = oldScript.textContent; }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    }
  });
}

function showCookieBanner(){
  const b = document.getElementById('cookie-banner');
  if(b){ b.classList.add('show'); }
}
function hideCookieBanner(){
  const b = document.getElementById('cookie-banner');
  if(b){ b.classList.remove('show'); }
}

function acceptAllCookies(){
  setCookieConsent({analytics:true, marketing:true});
}
function rejectNonEssentialCookies(){
  setCookieConsent({analytics:false, marketing:false});
}
function openCookieModal(){
  const existing = getCookieConsent();
  document.getElementById('cookie-toggle-analytics').checked = existing ? existing.analytics : false;
  document.getElementById('cookie-toggle-marketing').checked = existing ? existing.marketing : false;
  document.getElementById('cookie-modal-overlay').classList.add('open');
}
function closeCookieModal(){
  document.getElementById('cookie-modal-overlay').classList.remove('open');
}
function saveCookiePreferences(){
  setCookieConsent({
    analytics: document.getElementById('cookie-toggle-analytics').checked,
    marketing: document.getElementById('cookie-toggle-marketing').checked
  });
}

// On load: if consent already given, activate scripts silently. Otherwise show banner.
document.addEventListener('DOMContentLoaded', function(){
  const existing = getCookieConsent();
  if(existing){
    activateGatedScripts(existing);
  } else {
    setTimeout(showCookieBanner, 600);
  }
});

// ── CONTACT FORM (shared across index.html and contact.html) ──
function sendContactRequest(){
  const name = document.getElementById('cf-name').value.trim();
  const company = document.getElementById('cf-company').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const phone = document.getElementById('cf-phone').value.trim();
  const service = document.getElementById('cf-service').value;
  const message = document.getElementById('cf-message').value.trim();

  if(!name || !email || !phone){
    alert('Please fill in your name, email and phone number.');
    return;
  }

  const waMsg = encodeURIComponent(
    '📩 *NEW CONTACT FORM REQUEST*\n\n' +
    '*Name:* ' + name + '\n' +
    (company ? '*Company:* ' + company + '\n' : '') +
    '*Email:* ' + email + '\n' +
    '*Phone:* ' + phone + '\n' +
    (service ? '*Service:* ' + service + '\n' : '') +
    (message ? '*Message:* ' + message : '')
  );
  window.open('https://wa.me/254777723785?text=' + waMsg, '_blank');

  const subject = encodeURIComponent('New Enquiry from ' + name + ' — Reliance Fire Safety Website');
  const body = encodeURIComponent(
    'Name: ' + name + '\n' +
    'Company: ' + (company || 'N/A') + '\n' +
    'Email: ' + email + '\n' +
    'Phone: ' + phone + '\n' +
    'Service Required: ' + (service || 'N/A') + '\n\n' +
    'Message:\n' + (message || 'N/A')
  );
  setTimeout(()=>{
    window.location.href = 'mailto:info@reliancefireea.com?subject=' + subject + '&body=' + body;
  }, 800);

  document.getElementById('cf-sent').style.display = 'block';
  ['cf-name','cf-company','cf-email','cf-phone','cf-message'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cf-service').selectedIndex = 0;
}

// ── STATS COUNT-UP ANIMATION ──
// Triggers once when the stats bar scrolls into view, animates each number
// from 0 to its target using an eased curve rather than a linear tick.
function animateStatCounters(){
  const counters = document.querySelectorAll('.hs-count');
  if(!counters.length) return;

  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

  const runCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1500;
    const start = performance.now();

    function tick(now){
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(eased * target);
      el.textContent = current;
      if(progress < 1){
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  };

  const statsBar = document.querySelector('.hero-stats-bar');
  if(!statsBar) return;

  const statBlocks = document.querySelectorAll('.hero-stat');

  let hasRun = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting && !hasRun){
        hasRun = true;
        statBlocks.forEach((block, i) => {
          setTimeout(() => block.classList.add('in-view'), i * 120);
        });
        counters.forEach((el, i) => {
          setTimeout(() => runCounter(el), i * 120); // slight stagger per stat
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });

  observer.observe(statsBar);
}

document.addEventListener('DOMContentLoaded', function(){
  try{
    animateStatCounters();
  }catch(e){
    // safety net: if animation fails for any reason, just reveal stats plainly
    document.querySelectorAll('.hero-stat').forEach(b=>b.classList.add('in-view'));
    document.querySelectorAll('.hs-count').forEach(el=>{el.textContent=el.getAttribute('data-target');});
  }
});


/* ═══ MOBILE NAVIGATION — injected on all pages ═══ */
(function initMobileNav(){
  const nav = document.querySelector('nav');
  if(!nav || document.getElementById('mobile-menu')) return;

  const here = (location.pathname.split('/').pop() || 'index.html');
  const cur = (h) => h === here ? ' aria-current="page"' : '';

  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label','Open menu');
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-controls','mobile-menu');
  burger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(burger);

  const menu = document.createElement('div');
  menu.id = 'mobile-menu';
  menu.innerHTML = `
    <a class="mm-link" href="index.html"${cur('index.html')}>Home</a>
    <div class="mm-plate">Services · SYS 01–06</div>
    <a class="mm-sub" href="fire-detection.html"${cur('fire-detection.html')}><span class="nd-code">SYS·01</span>Fire Detection Systems</a>
    <a class="mm-sub" href="sprinkler-systems.html"${cur('sprinkler-systems.html')}><span class="nd-code">SYS·02</span>Sprinkler Systems</a>
    <a class="mm-sub" href="fire-suppression.html"${cur('fire-suppression.html')}><span class="nd-code">SYS·03</span>Fire Suppression</a>
    <a class="mm-sub" href="fire-alarm.html"${cur('fire-alarm.html')}><span class="nd-code">SYS·04</span>Fire Alarm Systems</a>
    <a class="mm-sub" href="maintenance.html"${cur('maintenance.html')}><span class="nd-code">SYS·05</span>Maintenance & Service</a>
    <a class="mm-sub" href="fire-risk-assessment.html"${cur('fire-risk-assessment.html')}><span class="nd-code">SYS·06</span>Fire Risk Assessment</a>
    <div class="mm-plate">Explore</div>
    <a class="mm-link" href="shop.html"${cur('shop.html')}>Shop</a>
    <a class="mm-link" href="portfolio.html"${cur('portfolio.html')}>Portfolio</a>
    <a class="mm-link" href="contact.html"${cur('contact.html')}>Contact</a>
    <a class="mm-link" href="faq.html"${cur('faq.html')}>FAQs</a>
    <div class="mm-actions">
      <a class="mm-call" href="tel:+254791100310"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 16.985 15H19a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2.015a2 2 0 0 1-.732 1.583l-.465.355a1 1 0 0 0-.302 1.213 14.35 14.35 0 0 0 6.331 6.402Z"/></svg> Call Us</a>
      <a class="mm-wa" href="https://wa.me/254777723785?text=Hi%20Reliance%20Fire%20Safety!%20%F0%9F%91%8B%20I%20found%20you%20on%20your%20website%20and%20I%27d%20like%20to%20get%20in%20touch.%20Please%20assist%20me." target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 2C6.578 2 2.157 6.336 2.157 11.892c0 2.096.547 4.142 1.588 5.945L2.057 22.5l4.756-1.238a9.9 9.9 0 0 0 5.237 1.42h.005c5.471 0 9.892-4.336 9.895-9.893A9.825 9.825 0 0 0 19.038 5.4 9.847 9.847 0 0 0 12.05 2"/></svg> WhatsApp</a>
      <button class="mm-cart" type="button" onclick="closeMobileMenu();toggleCart()"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> View Cart</button>
    </div>`;
  document.body.appendChild(menu);

  window.closeMobileMenu = function(){
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    burger.setAttribute('aria-label','Open menu');
    document.body.classList.remove('mm-locked');
  };

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('mm-locked', open);
  });

  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', window.closeMobileMenu));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && menu.classList.contains('open')){ window.closeMobileMenu(); burger.focus(); } });
})();


/* Defensive page-visibility sync: only the active page may render, regardless of stylesheet state */
document.addEventListener('DOMContentLoaded', function(){
  var pages = document.querySelectorAll('.page');
  if(pages.length > 1){
    pages.forEach(function(p){ p.style.display = p.classList.contains('active') ? 'block' : 'none'; });
  }
});
