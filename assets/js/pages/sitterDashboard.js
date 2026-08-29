/* Paw Homie dashboard — real stats + live booking requests. */

Pages.sitterDashboard = {
  render(){
    return `<div class="page" id="sdView">
      <div class="row-sb anim" style="padding-top:6px">
        <div><div class="hello">Paw Homie</div>
          <div style="font-size:24px;font-weight:900;color:var(--teal-dk)" id="sdHello">Hi there</div></div>
        <span id="sdStatus"></span>
      </div>

      <div id="sdBanner"></div>

      <div class="grid cards three anim" style="margin-top:14px">
        <div class="card stat"><div class="n" id="sdEarn">—</div><div class="l">Earned</div></div>
        <div class="card stat"><div class="n" id="sdUp">—</div><div class="l">Upcoming</div></div>
        <div class="card stat"><div class="n" id="sdRating">—</div><div class="l">Rating</div></div>
      </div>

      <div class="sec anim">Requests <span id="sdReqCount" class="muted" style="font-weight:700"></span></div>
      <div id="sdRequests"></div>

      <div class="sec anim">Manage</div>
      <div class="grid cards anim">
        <div class="card qa" data-go="services"><div class="qa-ic" style="background:var(--tint);color:var(--teal)">${UI.icon('wallet',20)}</div><div style="font-weight:800;font-size:13px">Services &amp; rates</div></div>
        <div class="card qa" data-go="availability"><div class="qa-ic" style="background:var(--tint2);color:var(--gold-dk)">${UI.icon('cal',20)}</div><div style="font-weight:800;font-size:13px">Availability</div></div>
        <div class="card qa" data-go="requests"><div class="qa-ic" style="background:var(--tint);color:var(--teal)">${UI.icon('list',20)}</div><div style="font-weight:800;font-size:13px">All requests</div></div>
        <div class="card qa" data-go="verification"><div class="qa-ic" style="background:var(--tint2);color:var(--gold-dk)">${UI.icon('shield',20)}</div><div style="font-weight:800;font-size:13px">Verification</div></div>
        <div class="card qa" data-go="sitterReviews"><div class="qa-ic" style="background:var(--tint);color:var(--teal)">${UI.icon("check",20)}</div><div style="font-weight:800;font-size:13px">My reviews</div></div>
        <div class="card qa" data-go="payouts"><div class="qa-ic" style="background:var(--tint);color:var(--teal)">${UI.icon('wallet',20)}</div><div style="font-weight:800;font-size:13px">Payouts</div></div>
        <div class="card qa" data-go="dashboard"><div class="qa-ic" style="background:var(--tint2);color:var(--gold-dk)">${UI.icon('user',20)}</div><div style="font-weight:800;font-size:13px">Owner view</div></div>
      </div>
    </div>`;
  },

  async mount(){
    var p = await Role.load();
    var hello = document.getElementById('sdHello');
    if (hello && p) hello.textContent = 'Hi, ' + ((p.full_name||'there').split(' ')[0]);

    // published / not published badge
    var prof = await db.getSitterProfile();
    var app = await db.getApplication();
    var status = app ? app.status : 'draft';
    var isLive = !!(prof && prof.published) && status === 'approved';

    var badge = document.getElementById('sdStatus');
    if (badge){
      badge.innerHTML = isLive ? UI.tag('Live','ok')
        : (status==='pending' ? UI.tag('In review','gold')
        : UI.tag('Not live',''));
    }

    // The big "what do I need to do" banner — visibility of system status
    var banner = document.getElementById('sdBanner');
    if (banner){
      if (status === 'approved' && !(prof && prof.published)){
        banner.innerHTML = sdBannerHTML('gold', UI.icon('check',20),
          'You\u2019re approved \u2014 publish to go live',
          'Owners can\u2019t see you yet. Turn on your listing to start getting bookings.',
          'services', 'Publish my listing');
      } else if (status === 'pending'){
        banner.innerHTML = sdBannerHTML('gold', UI.icon('clock',20),
          'Application under review',
          'Our team is checking your details and documents. We\u2019ll let you know soon \u2014 no action needed.',
          null, null);
      } else if (status === 'rejected'){
        banner.innerHTML = sdBannerHTML('red', UI.icon('bell',20),
          'Application needs another look',
          'Your application wasn\u2019t approved. Update your details and retake the quiz to reapply.',
          'verification', 'Review my application');
      } else if (status === 'draft'){
        banner.innerHTML = sdBannerHTML('red', UI.icon('shield',20),
          'Get verified before you can be booked',
          'Pet owners can\u2019t find you until you finish verification: your details, documents and a short care quiz.',
          'verification', 'Start verification');
      }
      var b = banner.querySelector('[data-go]');
      if (b) b.addEventListener('click', function(){ Router.go(b.getAttribute('data-go')); });
    }

    // Attention dot on the Verification tile if there's something to do
    if (status === 'draft' || status === 'rejected'){
      var vtile = document.querySelector('.qa[data-go="verification"]');
      if (vtile){ vtile.classList.add('needs-action'); }
    }


    var stats = await db.getSitterStats();
    setText('sdEarn', '$' + (stats.earnings||0));
    setText('sdUp', String(stats.upcoming||0));
    setText('sdRating', (stats.rating||'5.0') + '\u2605');

    await renderRequests();
  }
};

async function renderRequests(){
  var host = document.getElementById('sdRequests');
  var countEl = document.getElementById('sdReqCount');
  if (!host) return;
  var reqs = await db.getRequests();
  if (countEl) countEl.textContent = reqs.length ? '(' + reqs.length + ')' : '';

  if (!reqs.length){
    host.innerHTML = `<div class="card" style="padding:18px;text-align:center">
      <div class="muted" style="font-size:13.5px">No new requests right now. They'll show up here the moment a pet owner books you.</div></div>`;
    return;
  }

  host.innerHTML = reqs.map(function(r){
    return `<div class="card anim reqcard" data-id="${r.id}" style="padding:14px;margin-bottom:10px;display:flex;gap:13px;align-items:center;flex-wrap:wrap">
      ${UI.avatar(r.initial,{size:46,fs:17,gold:r.gold})}
      <div style="flex:1;min-width:150px">
        <div style="font-weight:800">${r.name}${r.pet?' \u00b7 '+r.pet:''}</div>
        <div class="muted" style="font-size:12.5px">${window.serviceLabel(r.kind)} \u00b7 ${r.dates} \u00b7 ${r.price}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn ghost sm" data-decline>Decline</button>
        <button class="btn sm" data-accept>Accept</button>
      </div>
    </div>`;
  }).join('');

  host.querySelectorAll('.reqcard').forEach(function(card){
    wireRespond(card, card.getAttribute('data-id'));
  });
}

function wireRespond(card, id){
  function respond(accept){
    var btns = card.querySelectorAll('button');
    btns.forEach(function(b){ b.disabled = true; });
    db.respondToRequest(id, accept).then(function(){
      UI.toast(accept ? 'Accepted \uD83C\uDF89 the owner has been notified' : 'Request declined');
      card.style.transition = 'opacity .25s, transform .25s';
      card.style.opacity = '0'; card.style.transform = 'scale(.97)';
      setTimeout(function(){
        card.remove();
        // refresh the count + empty state + stats
        if (Pages.sitterDashboard && document.getElementById('sdRequests')) renderRequests();
      }, 260);
    }).catch(function(e){
      btns.forEach(function(b){ b.disabled = false; });
      UI.toast(e.message || 'Could not update. Try again.');
    });
  }
  var a = card.querySelector('[data-accept]');
  var d = card.querySelector('[data-decline]');
  if (a) a.addEventListener('click', function(){ respond(true); });
  if (d) d.addEventListener('click', function(){ respond(false); });
}

function setText(id, v){ var el = document.getElementById(id); if (el) el.textContent = v; }

function sdBannerHTML(tone, icon, title, body, goPage, goLabel){
  var bg  = tone==='red' ? '#FDECEC' : 'var(--tint2)';
  var col = tone==='red' ? '#C64B3B' : 'var(--gold-dk)';
  var bord= tone==='red' ? '#F3C9C4' : '#F0DCA8';
  return '<div class="sd-banner anim" style="background:'+bg+';border:1.5px solid '+bord+'">'+
    '<div class="sd-banner-ic" style="color:'+col+'">'+icon+'</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-weight:800;font-size:14.5px">'+title+'</div>'+
      '<div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.45">'+body+'</div>'+
      (goPage ? '<button class="btn sm" data-go="'+goPage+'" style="width:auto;margin-top:10px">'+goLabel+'</button>' : '')+
    '</div>'+
  '</div>';
}
