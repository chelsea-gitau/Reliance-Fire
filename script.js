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

  // Service cards
  document.querySelectorAll('.svc-card').forEach(el => observer.observe(el));

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
