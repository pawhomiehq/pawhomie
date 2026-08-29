window.Pages = window.Pages || {};

/* ---------------------------------------------------------------
   FAQ copy — draft. Bilal should review/approve the wording.
   --------------------------------------------------------------- */
var FAQ = [
  { q:'What is PawHomie?',
    a:'PawHomie connects pet owners in the Greater Toronto Area with verified local pet sitters we call Paw Homies. You book care for your pet, message your Paw Homie, and get photo updates while you\u2019re away.' },
  { q:'How does booking work?',
    a:'Search Paw Homies near you, open a profile to read reviews and see their home, then send a booking request with your dates. You\u2019re only charged once they accept.' },
  { q:'How much does it cost?',
    a:'Each Paw Homie sets their own nightly rate \u2014 most are between $35 and $50 a night in the GTA. PawHomie adds a small service fee, and HST is shown as its own line before you pay. No surprises at checkout.' },
  { q:'How do you check Paw Homies?',
    a:'Every Paw Homie completes a pet-care knowledge quiz, uploads ID and photos of the space your pet will stay in, and is reviewed and approved by our team before their profile goes live.' },
  { q:'Can I meet the Paw Homie before booking?',
    a:'Yes. Book a free 15-minute video call from any profile to introduce yourself and your pet before you commit to anything.' },
  { q:'What if something goes wrong during a stay?',
    a:'Message your Paw Homie any time from the app. For anything urgent, they contact you immediately and seek veterinary care if it\u2019s needed \u2014 that\u2019s part of what they agree to.' },
  { q:'What kinds of pets can I book care for?',
    a:'Dogs and cats today. Each Paw Homie lists what they take, including whether they\u2019re comfortable with multiple pets, puppies or seniors.' },
  { q:'How do I become a Paw Homie?',
    a:'Create an account, tell us about your home, pass the 10-question care quiz, and upload your photos and ID. Once approved, set your own rates and the exact dates you\u2019re available.' }
];

var STEPS = [
  { n:'01', ic:'search', t:'Search', d:'Browse verified Paw Homies near you. Filter by the care you need \u2014 house sitting, walks, drop-ins, boarding or daycare.' },
  { n:'02', ic:'video', t:'Meet', d:'Read real reviews, see the home and walk area, then say hello over a free 15-minute video call.' },
  { n:'03', ic:'cal', t:'Book', d:'Send your dates. Your payment is held safely and only released once the stay is complete.' }
];

Pages.welcome = {
  render(){ return `
  <!-- ============ HERO ============ -->
  <section class="hero">
   <div class="inner">
    <div>
      <div class="paw-field" id="pawfield"></div>
      <span class="kick anim d1">\uD83D\uDC3E Trusted pet care across the GTA</span>
      <h1 class="anim d1">Pet care that feels like <em>family</em>.</h1>
      <p class="anim d2">Book a verified Paw Homie near you to look after your pet at home \u2014 with daily photos, real reviews and payments held until the stay is done.</p>

      <div class="searchcard card anim d2">
        <div class="cell has-menu" id="whereCell">
          <div class="ic">${UI.icon('pin',18)}</div>
          <div class="kv"><div class="k">Where</div><div class="v" id="whereVal">${App.searchArea || 'All areas'}</div></div>
          <span class="cell-go">\u25be</span>
          <div class="dropdown" id="whereMenu">
            ${['All areas','Toronto','North York','Scarborough','Etobicoke','East York','Mississauga','Brampton','Markham','Vaughan','Richmond Hill','Oakville'].map(function(a){
              return '<button type="button" class="dd-item" data-area="'+(a==='All areas'?'':a)+'"><span class="dd-txt"><b>'+a+'</b></span><span class="dd-tick">'+UI.icon('check',15)+'</span></button>';
            }).join('')}
          </div>
        </div>
        <div class="cell has-menu" id="whenCell">
          <div class="ic">${UI.icon('cal',18)}</div>
          <div class="kv"><div class="k">When</div><div class="v" id="whenVal">${fmtRange(Booking.state.startDate, Booking.state.endDate)}</div></div>
          <span class="cell-go">\u25be</span>
          <div class="dropdown" id="whenMenu" style="padding:14px;min-width:240px">
            <div class="label">Drop-off</div>
            <input class="field" type="date" id="whenStart" value="${Booking.state.startDate}" min="${isoDate(new Date())}">
            <div class="label" style="margin-top:10px">Pick-up</div>
            <input class="field" type="date" id="whenEnd" value="${Booking.state.endDate}" min="${Booking.state.startDate}">
            <button class="btn sm" id="whenDone" style="margin-top:12px">Done</button>
          </div>
        </div>
        <div class="cell has-menu" id="howCell">
          <div class="ic">${UI.icon('list',18)}</div>
          <div class="kv"><div class="k">How</div><div class="v" id="howVal">${window.serviceLabel(App.searchService)}</div></div>
          <span class="cell-go" id="howCaret">\u25be</span>
          <div class="dropdown" id="howMenu">
            ${window.SERVICES.map(function(s){ return `
              <button type="button" class="dd-item" data-pick="${s.id}">
                <span class="dd-ic">${UI.icon(s.icon,17)}</span>
                <span class="dd-txt"><b>${s.label}</b><small>${s.blurb}</small></span>
                <span class="dd-tick">${UI.icon('check',15)}</span>
              </button>`; }).join('')}
          </div>
        </div>
      </div>

      <div class="hero-cta anim d3">
        ${(function(){
          if (window.Role && Role.isAdmin())
            return '<button class="btn" data-go="admin">Go to admin panel</button>';
          if (window.Role && Role.isSitter() && !Role.isOwner())
            return '<button class="btn" data-go="sitterDashboard">Go to my dashboard</button>';
          if (window.Role && !Role.isGuest())
            return '<button class="btn" data-go="search">Find a Paw Homie</button>'+
                   '<button class="btn ghost" data-go="'+Role.home()+'">Go to my dashboard</button>';
          return '<button class="btn" data-go="search">Find a Paw Homie</button>'+
                 '<button class="btn ghost" data-auth="signup">Create an account</button>';
        })()}
      </div>
    </div>

    <div class="hero-art anim d2">
      ${UI.photo('hero','height:360px;border-radius:26px')}
      <div class="trust card" style="margin-top:14px">
        <div class="t"><div class="n">Verified</div><div class="l">ID &amp; care quiz</div></div>
        <div class="t"><div class="n">4.9\u2605</div><div class="l">avg rating</div></div>
        <div class="t"><div class="n">Covered</div><div class="l">vet guarantee</div></div>
      </div>
    </div>
   </div>
  </section>

  <!-- ============ SERVICES ============ -->
  <section class="band" id="services">
    <div class="band-in">
      <div class="eyebrow reveal">What we do</div>
      <h2 class="reveal">Five ways we can help</h2>
      <p class="lede reveal">Pick the kind of care you need and we\u2019ll show you the Paw Homies who offer it \u2014 from overnight stays to a quick lunchtime visit.</p>
      <div class="svc-strip reveal" id="svcStrip">
        ${window.SERVICES.map(function(s){ return `
          <div class="svc-card" data-svc="${s.id}">
            <div class="svc-ic">${UI.icon(s.icon,20)}</div>
            <div class="svc-name">${s.label}</div>
            <div class="svc-blurb">${s.blurb}</div>
            <span class="svc-go">Explore ${s.label.toLowerCase()} \u2192</span>
          </div>`; }).join('')}
      </div>
    </div>
  </section>

  <!-- ============ HOW IT WORKS (the paw trail) ============ -->
  <section class="band alt" id="how">
    <div class="band-in">
      <div class="eyebrow reveal">How it works</div>
      <h2 class="reveal">Three steps, then relax</h2>
      <div class="trail reveal">
        ${STEPS.map(function(s){ return `
          <div class="step">
            <div class="step-dot">${UI.icon(s.ic,20)}</div>
            <div class="step-n">${s.n}</div>
            <div class="step-t">${s.t}</div>
            <div class="step-d">${s.d}</div>
          </div>`; }).join('')}
      </div>
      <div class="center reveal"><button class="btn wauto" data-go="search">Start searching</button></div>
    </div>
  </section>

  <!-- ============ PEACE OF MIND ============ -->
  <section class="band" id="trust">
    <div class="band-in split">
      <div class="reveal">
        <div class="eyebrow">Book with peace of mind</div>
        <h2>Every Paw Homie is checked before you ever meet them</h2>
        <ul class="ticks">
          <li>${UI.icon('check',16)}<span><b>Care quiz &amp; ID check.</b> Paw Homies pass a 10-question pet-care quiz and upload ID and photos of their home before approval.</span></li>
          <li>${UI.icon('check',16)}<span><b>Payment held safely.</b> Money is only released to your Paw Homie once the stay is complete.</span></li>
          <li>${UI.icon('check',16)}<span><b>Real reviews only.</b> Reviews come from completed bookings \u2014 nobody can buy their way to five stars.</span></li>
          <li>${UI.icon('check',16)}<span><b>Message any time.</b> Chat lives in the app, so updates and photos stay in one place.</span></li>
        </ul>
        <button class="btn wauto" data-go="signup">Create an account</button>
      </div>
      <div class="reveal">
        <div class="quote-stack">
          <div class="quote card">
            <div class="qic">${UI.icon('shield',22)}</div>
            <p><b>Every Paw Homie is verified.</b> ID checks, a safety quiz, and manual approval before anyone can take a booking.</p>
          </div>
          <div class="quote card">
            <div class="qic">${UI.icon('video',22)}</div>
            <p><b>Meet before you book.</b> Request a free 15-minute intro call with any Paw Homie, right from their profile.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ BECOME A PAW HOMIE ============ -->
  <section class="band sitter-band">
    <div class="band-in split tight">
      <div class="reveal">
        <div class="eyebrow gold">Become a Paw Homie</div>
        <h2>Get paid to hang out with pets</h2>
        <p class="lede">Set your own rates, pick the exact dates you\u2019re free, and choose which pets you take. You keep 85\u201390% of every booking.</p>
        <button class="btn gold wauto" data-go="signup">Apply to be a Paw Homie</button>
      </div>
      <div class="reveal">
        <div class="earn card">
          <div class="earn-k">A typical week</div>
          <div class="earn-rows">
            <div><span>3 nights house sitting</span><b>$126</b></div>
            <div><span>2 dog walks</span><b>$40</b></div>
            <div><span>1 drop-in visit</span><b>$20</b></div>
          </div>
          <div class="earn-total"><span>You could earn</span><b>$186</b></div>
          <div class="earn-note">Example only \u2014 you set your own rates.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ FAQ ============ -->
  <section class="band alt" id="faq">
    <div class="band-in narrow-band">
      <div class="eyebrow reveal">Questions</div>
      <h2 class="reveal">Good things to know</h2>
      <div class="faq reveal" id="faqList">
        ${FAQ.map(function(f,i){ return `
          <div class="faq-item${i===0?' open':''}">
            <button class="faq-q" type="button">${f.q}<span class="faq-x">${i===0?'\u2212':'+'}</span></button>
            <div class="faq-a"><p>${f.a}</p></div>
          </div>`; }).join('')}
      </div>
    </div>
  </section>

  <!-- ============ FINAL CTA + FOOTER ============ -->
  <section class="band final">
    <div class="band-in center">
      <h2 class="reveal">Your pet\u2019s next home away from home is a few taps away.</h2>
      <div class="final-cta reveal">
        <button class="btn wauto" data-go="search">Find a Paw Homie</button>
        <button class="btn ghost wauto" data-go="signup">Create an account</button>
      </div>
    </div>
    <footer class="foot">
      <div class="band-in foot-in">
        <img src="assets/img/logo-header.png" alt="PawHomie" class="foot-logo">
        <div class="news">
          <div class="news-t">Get pet-care tips &amp; launch news</div>
          <div class="news-row">
            <input id="newsEmail" type="email" placeholder="you@email.com" autocomplete="email">
            <button class="btn sm" id="newsBtn">Sign up</button>
          </div>
          <div class="news-msg" id="newsMsg"></div>
        </div>
        <div class="foot-links">
          <a data-go="search">Find care</a>
          <a data-auth="signup">Become a Paw Homie</a>
          <a data-nav="faq">FAQ</a>
          <a href="mailto:support@pawhomie.com">support@pawhomie.com</a>
        </div>
        <div class="foot-note">\u00a9 2026 PawHomie \u00b7 Serving the Greater Toronto Area</div>
      </div>
    </footer>
  </section>`; },

  mount(){
    /* ---- When (date range) picker ---- */
    var whenCell = document.getElementById('whenCell');
    if (whenCell){
      whenCell.addEventListener('click', function(e){
        if (e.target.closest('#whenMenu')) return;   // clicks inside stay open
        whenCell.classList.toggle('open');
      });
      var startI = document.getElementById('whenStart');
      var endI = document.getElementById('whenEnd');
      if (startI) startI.addEventListener('change', function(){
        Booking.state.startDate = startI.value;
        if (endI.value < startI.value){ endI.value = startI.value; }
        endI.min = startI.value;
      });
      if (endI) endI.addEventListener('change', function(){ Booking.state.endDate = endI.value; });
      var done = document.getElementById('whenDone');
      if (done) done.addEventListener('click', function(e){
        e.stopPropagation();
        Booking.state.startDate = startI.value;
        Booking.state.endDate = endI.value;
        var wv = document.getElementById('whenVal');
        if (wv) wv.textContent = fmtRange(startI.value, endI.value);
        whenCell.classList.remove('open');
      });
    }

    /* ---- Where (area) picker ---- */
    var whereCell = document.getElementById('whereCell');
    var whereMenu = document.getElementById('whereMenu');
    if (whereCell){
      whereCell.addEventListener('click', function(e){
        if (e.target.closest('[data-area]')) return;
        whereCell.classList.toggle('open');
      });
      whereMenu.querySelectorAll('[data-area]').forEach(function(b){
        b.addEventListener('click', function(e){
          e.stopPropagation();
          var area = b.getAttribute('data-area');
          App.searchArea = area;
          var wv = document.getElementById('whereVal');
          if (wv) wv.textContent = area || 'All areas';
          whereCell.classList.remove('open');
        });
      });
    }

    /* ---- services ("How") ---- */
    function pickService(id){
      App.searchService = id;
      var v = document.getElementById('howVal');
      if (v) v.textContent = window.serviceLabel(id);
      var menu = document.getElementById('howMenu');
      if (menu) menu.querySelectorAll('[data-pick]').forEach(function(b){
        b.classList.toggle('on', b.getAttribute('data-pick') === id);
      });
      var strip = document.getElementById('svcStrip');
      if (strip) strip.querySelectorAll('[data-svc]').forEach(function(el){
        el.classList.toggle('on', el.getAttribute('data-svc') === id);
      });
    }
    pickService(App.searchService || 'house_sitting');

    /* dropdown open / close */
    var cell = document.getElementById('howCell');
    var menu = document.getElementById('howMenu');
    function closeMenu(){
      if (!cell) return;
      cell.classList.remove('open');
      document.removeEventListener('click', onOutside);
      document.removeEventListener('keydown', onEsc);
    }
    function onOutside(e){ if (cell && !cell.contains(e.target)) closeMenu(); }
    function onEsc(e){ if (e.key === 'Escape') closeMenu(); }

    if (cell) cell.addEventListener('click', function(e){
      if (e.target.closest('[data-pick]')) return;      // handled below
      var opening = !cell.classList.contains('open');
      cell.classList.toggle('open', opening);
      if (opening){
        document.addEventListener('click', onOutside);
        document.addEventListener('keydown', onEsc);
      } else { closeMenu(); }
    });

    if (menu) menu.querySelectorAll('[data-pick]').forEach(function(b){
      b.addEventListener('click', function(e){
        e.stopPropagation();
        pickService(b.getAttribute('data-pick'));
        closeMenu();
      });
    });

    /* the service cards below use the same picker, then go to search */
    var strip = document.getElementById('svcStrip');
    if (strip) strip.querySelectorAll('[data-svc]').forEach(function(el){
      el.addEventListener('click', function(){ pickService(el.getAttribute('data-svc')); Router.go('search'); });
    });

    /* ---- FAQ accordion ---- */
    var list = document.getElementById('faqList');
    if (list) list.querySelectorAll('.faq-item').forEach(function(item){
      item.querySelector('.faq-q').addEventListener('click', function(){
        var open = item.classList.contains('open');
        list.querySelectorAll('.faq-item').forEach(function(x){
          x.classList.remove('open');
          x.querySelector('.faq-x').textContent = '+';
        });
        if (!open){ item.classList.add('open'); item.querySelector('.faq-x').textContent = '\u2212'; }
      });
    });

    /* ---- footer FAQ link scrolls instead of changing the hash route ---- */
    document.querySelectorAll('[data-scroll]').forEach(function(a){
      a.addEventListener('click', function(){
        var t = document.getElementById(a.getAttribute('data-scroll'));
        if (t) t.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    });

    /* ---- scroll reveal (skipped when the user prefers reduced motion) ---- */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = document.querySelectorAll('.reveal');
    if (reduce || !window.IntersectionObserver){
      items.forEach(function(el){ el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin:'0px 0px -8% 0px', threshold:0.05 });
      items.forEach(function(el){ io.observe(el); });
    }

    /* ---- newsletter signup (public) ---- */
    var newsBtn = document.getElementById('newsBtn');
    if (newsBtn) newsBtn.addEventListener('click', async function(){
      var input = document.getElementById('newsEmail');
      var msg = document.getElementById('newsMsg');
      var email = (input.value || '').trim();
      if (!email || email.indexOf('@') < 1){ msg.className='news-msg err'; msg.textContent='Please enter a valid email.'; return; }
      newsBtn.disabled = true; newsBtn.textContent = '…';
      try {
        await db.subscribe(email);
        msg.className='news-msg ok'; msg.textContent='You\u2019re on the list \uD83D\uDC3E';
        input.value = '';
      } catch(e){
        msg.className='news-msg err';
        msg.textContent = /duplicate|unique/i.test(e.message||'') ? 'You\u2019re already subscribed.' : 'Something went wrong \u2014 try again.';
      } finally {
        newsBtn.disabled = false; newsBtn.textContent = 'Sign up';
      }
    });

    /* ---- scroll to a section if we arrived via a nav link ---- */
    if (window.SCROLL_TO){
      var target = window.SCROLL_TO; window.SCROLL_TO = null;
      setTimeout(function(){
        var elx = document.getElementById(target);
        if (elx) elx.scrollIntoView({ behavior:'smooth', block:'start' });
      }, 60);
    }

    /* ---- floating paws in the hero ---- */
    var f = document.getElementById('pawfield');
    if (!f) return;
    var TEAL = '#21706F', GOLD = '#EBB042';
    for (var i = 0; i < 7; i++){
      var p = document.createElement('div'); p.className = 'pawf';
      var sz = Math.round(16 + Math.random() * 16);
      p.innerHTML = window.pawGlyph(i % 3 === 0 ? GOLD : TEAL, sz);
      p.style.left = (8 + Math.random() * 84) + '%';
      p.style.bottom = '0';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.animationDuration = (6 + Math.random() * 4) + 's';
      f.appendChild(p);
    }
  }
};
