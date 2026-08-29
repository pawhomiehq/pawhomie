/* Admin panel — Bilal only. Overview + management across the platform. */

var ADMIN = { section:'overview', appTab:'pending' };

Pages.admin = {
  render(){
    var S = [
      ['overview','Overview'], ['applications','Applications'],
      ['sitters','Paw Homies'], ['owners','Owners'], ['bookings','Bookings'], ['reviews','Reviews'], ['reports','Reports']
    ];
    return `<div class="page">
      <div class="row-sb anim" style="padding-top:6px">
        <div><div class="hello">Admin panel</div>
          <div style="font-size:24px;font-weight:900;color:var(--teal-dk)">PawHomie HQ</div></div>
        <button class="btn ghost sm" data-go="__logout" style="width:auto;padding:8px 14px;color:var(--danger)">Log out</button>
      </div>
      <div class="admin-nav anim" id="adminNav">
        ${S.map(function(s){ return '<button class="anav'+(s[0]===ADMIN.section?' on':'')+'" data-sec="'+s[0]+'">'+s[1]+'<span class="anav-badge" id="badge-'+s[0]+'"></span></button>'; }).join('')}
      </div>
      <div id="adminBody"><div class="muted" style="text-align:center;padding:24px">Loading…</div></div>
    </div>`;
  },

  async mount(){
    document.querySelectorAll('#adminNav .anav').forEach(function(b){
      b.addEventListener('click', function(){
        ADMIN.section = b.getAttribute('data-sec');
        document.querySelectorAll('#adminNav .anav').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        drawSection();
      });
    });
    await drawSection();
    // attention badges — pending applications + pending owner IDs
    try {
      var apps = await db.getApplicants('pending');
      setBadge('applications', apps.length);
      var owners = await db.getOwnerApplicants('pending');
      setBadge('owners', owners.length);
    } catch(e){ /* non-blocking */ }
  }
};

function setBadge(sec, n){
  var el = document.getElementById('badge-' + sec);
  if (!el) return;
  if (n > 0){ el.textContent = n; el.classList.add('show'); }
  else { el.textContent = ''; el.classList.remove('show'); }
}

async function drawSection(){
  var body = document.getElementById('adminBody');
  if (!body) return;
  body.innerHTML = '<div class="muted" style="text-align:center;padding:24px">Loading…</div>';
  if (ADMIN.section === 'overview')     return drawOverview(body);
  if (ADMIN.section === 'applications') return drawApplications(body);
  if (ADMIN.section === 'sitters')      return drawSitters(body);
  if (ADMIN.section === 'bookings')     return drawBookingsAdmin(body);
  if (ADMIN.section === 'owners')       return drawOwnersAdmin(body);
  if (ADMIN.section === 'reviews')      return drawReviewsAdmin(body);
  if (ADMIN.section === 'reports')      return drawReportsAdmin(body);
}

/* ---------- Overview ---------- */
async function drawOverview(body){
  var s = await db.getAdminStats();
  function stat(n, label, tint){ return `<div class="card astat"><div class="an" style="color:${tint||'var(--teal-dk)'}">${n}</div><div class="al">${label}</div></div>`; }
  body.innerHTML = `
    <div class="grid-2 anim">
      ${stat('$'+s.revenue, 'Commission earned', 'var(--teal)')}
      ${stat(s.activeBookings, 'Active bookings', 'var(--gold-dk)')}
      ${stat(s.owners, 'Pet owners')}
      ${stat(s.sitters, 'Paw Homies')}
      ${stat(s.completed, 'Completed stays')}
      ${stat(s.newsletter, 'Waitlist emails')}
    </div>
    ${s.pending ? `<div class="card anim d1 attn" data-sec-jump="applications" style="padding:16px;margin-top:14px;display:flex;align-items:center;gap:12px;cursor:pointer">
      <div class="qa-ic" style="width:42px;height:42px;margin:0;background:var(--tint2);color:var(--gold-dk)">${UI.icon('clock',20)}</div>
      <div style="flex:1"><b>${s.pending} application${s.pending>1?'s':''} waiting</b><div class="muted" style="font-size:12.5px">Review Paw Homie applications</div></div>
      <span style="color:var(--muted);font-size:20px">\u203a</span>
    </div>` : ''}
    <p class="muted anim d1" style="font-size:12px;text-align:center;margin-top:16px">Commission is the ${Math.round((CONFIG.SERVICE_FEE_RATE||0.1)*100)}% service fee on completed stays.</p>`;

  var jump = body.querySelector('[data-sec-jump]');
  if (jump) jump.addEventListener('click', function(){
    ADMIN.section = 'applications';
    document.querySelectorAll('#adminNav .anav').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-sec')==='applications'); });
    drawSection();
  });
}

/* ---------- Applications (the review queue) ---------- */
async function drawApplications(body){
  body.innerHTML = `<div class="admin-tabs" id="appTabs">
      <button class="atab${ADMIN.appTab==='pending'?' on':''}" data-tab="pending">Pending</button>
      <button class="atab${ADMIN.appTab==='approved'?' on':''}" data-tab="approved">Approved</button>
      <button class="atab${ADMIN.appTab==='rejected'?' on':''}" data-tab="rejected">Rejected</button>
    </div><div id="appList"><div class="muted" style="text-align:center;padding:20px">Loading…</div></div>`;

  body.querySelectorAll('#appTabs .atab').forEach(function(t){
    t.addEventListener('click', function(){
      ADMIN.appTab = t.getAttribute('data-tab');
      body.querySelectorAll('#appTabs .atab').forEach(function(x){ x.classList.remove('on'); });
      t.classList.add('on');
      fillApps();
    });
  });
  await fillApps();
}

async function fillApps(){
  var list = document.getElementById('appList');
  if (!list) return;
  var apps = await db.getApplicants(ADMIN.appTab);
  if (!apps.length){
    list.innerHTML = '<div class="card" style="padding:22px;text-align:center"><div class="muted" style="font-size:13.5px">Nothing here.</div></div>';
    return;
  }
  list.innerHTML = apps.map(function(a){
    var col = a.score>=80 ? '#1E9E6A' : (a.score>=50 ? '#C98F27' : '#C64B3B');
    return `<div class="card anim appcard" data-id="${a.id}" style="padding:16px;margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:center">
        ${UI.avatar(a.initial,{size:46,fs:17,gold:a.gold})}
        <div style="flex:1;min-width:0"><div style="font-weight:800">${a.name}</div>
          <div class="muted" style="font-size:12.5px">${a.city||'\u2014'} \u00b7 $${a.rate}/night</div></div>
        <div class="quiz-chip" style="background:${col}1a;color:${col}">${a.score!=null?a.score+'%':'\u2014'}</div>
      </div>
      ${a.about?`<p class="muted" style="font-size:13px;margin:12px 0 0;line-height:1.5">\u201c${a.about}\u201d</p>`:''}
      ${(a.phone||a.address||a.home_type)?`<div class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.6">
        ${a.home_type?'\uD83C\uDFE0 '+a.home_type+(a.has_yard?' \u00b7 has yard':''):''}
        ${a.phone?'<br>\uD83D\uDCDE '+a.phone:''}
        ${a.address?'<br>\uD83D\uDCCD '+a.address:''}
      </div>`:''}
      ${(a.documents && Object.keys(a.documents).length)?`
        <div class="doc-strip" data-docs="${a.id}" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          ${Object.keys(a.documents).map(function(k){ return '<div class="doc-mini" data-docpath="'+a.documents[k]+'"><span>'+k+'</span></div>'; }).join('')}
        </div>` : '<div class="muted" style="font-size:12px;margin-top:10px">No documents uploaded</div>'}
      ${a.status==='pending'?`<div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn ghost sm" style="flex:1;color:var(--danger)" data-reject>Reject</button>
        <button class="btn sm" style="flex:1" data-approve>Approve</button></div>`:
        `<div style="margin-top:12px">${UI.tag(a.status==='approved'?'Approved':'Rejected', a.status==='approved'?'ok':'')}</div>`}
    </div>`;
  }).join('');
  list.querySelectorAll('.appcard').forEach(function(card){
    var id = card.getAttribute('data-id');
    // load doc thumbnails (signed URLs)
    card.querySelectorAll('[data-docpath]').forEach(function(mini){
      var path = mini.getAttribute('data-docpath');
      db.getDocUrl(path).then(function(url){
        if (url){ mini.style.backgroundImage = 'url('+url+')'; mini.classList.add('loaded');
          mini.addEventListener('click', function(){ window.open(url, '_blank'); }); }
      }).catch(function(){});
    });
    function review(ap){
      card.querySelectorAll('button').forEach(function(b){ b.disabled=true; });
      db.reviewApplicant(id, ap).then(function(){
        UI.toast(ap?'Approved \u2713':'Rejected');
        card.style.transition='opacity .25s'; card.style.opacity='0';
        setTimeout(function(){ card.remove(); if(!document.querySelector('#appList .appcard')) fillApps(); }, 250);
      }).catch(function(e){ card.querySelectorAll('button').forEach(function(b){b.disabled=false;}); UI.toast(e.message||'Failed'); });
    }
    var a=card.querySelector('[data-approve]'), r=card.querySelector('[data-reject]');
    if(a) a.addEventListener('click',function(){ review(true); });
    if(r) r.addEventListener('click',function(){ review(false); });
  });
}

/* ---------- Paw Homies (manage all sitters) ---------- */
async function drawSitters(body){
  var sitters = await db.getAllSitters();
  if (!sitters.length){ body.innerHTML='<div class="card" style="padding:22px;text-align:center"><div class="muted">No Paw Homies yet.</div></div>'; return; }
  body.innerHTML = sitters.map(function(s){
    var live = s.status==='approved' && s.published;
    return `<div class="card anim" data-id="${s.id}" style="padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:center">
      ${UI.avatar(s.initial,{size:44,fs:16,gold:s.gold})}
      <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14.5px">${s.name}</div>
        <div class="muted" style="font-size:12px">${s.city||'\u2014'} \u00b7 $${s.rate}/night \u00b7 quiz ${s.score!=null?s.score+'%':'\u2014'}</div></div>
      ${UI.tag(live?'Live':(s.status==='approved'?'Unpublished':s.status), live?'ok':(s.status==='rejected'?'':'gold'))}
      <button class="btn ghost sm" style="width:auto;padding:8px 12px" data-suspend>${live?'Suspend':'Approve'}</button>
    </div>`;
  }).join('');
  body.querySelectorAll('[data-suspend]').forEach(function(btn){
    var card = btn.closest('[data-id]'); var id = card.getAttribute('data-id');
    btn.addEventListener('click', function(){
      var suspend = btn.textContent === 'Suspend';
      btn.disabled = true;
      db.setSitterStatus(id, suspend?'rejected':'approved', suspend?false:true).then(function(){
        UI.toast(suspend?'Paw Homie suspended':'Paw Homie approved');
        drawSitters(body);
      }).catch(function(e){ btn.disabled=false; UI.toast(e.message||'Failed'); });
    });
  });
}

/* ---------- Bookings oversight ---------- */
async function drawBookingsAdmin(body){
  var bk = await db.getAllBookings();
  if (!bk.length){ body.innerHTML='<div class="card" style="padding:22px;text-align:center"><div class="muted">No bookings yet.</div></div>'; return; }
  var LABEL = { pending:'Pending', accepted:'Confirmed', declined:'Declined', cancelled:'Cancelled', completed:'Completed' };
  body.innerHTML = bk.map(function(b){
    return `<div class="card anim" style="padding:13px 14px;margin-bottom:9px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="min-width:0"><div style="font-weight:800;font-size:14px">${b.owner} \u2192 ${b.sitter}</div>
          <div class="muted" style="font-size:12px">${b.dates} \u00b7 ${Booking.money(b.total)}</div></div>
        ${UI.tag(LABEL[b.status]||b.status, b.status==='completed'||b.status==='accepted'?'ok':(b.status==='pending'?'gold':''))}
      </div>
    </div>`;
  }).join('');
}

/* ---------- Owners (ID verification review) ---------- */
async function drawOwnersAdmin(body){
  var owners = await db.getOwnerApplicants('all');
  var pending = owners.filter(function(o){ return o.status==='pending'; });
  var others  = owners.filter(function(o){ return o.status!=='pending'; });

  if (!owners.length){
    body.innerHTML = '<div class="card" style="padding:22px;text-align:center"><div class="muted" style="font-size:13.5px">No ID submissions yet. Owners appear here after they upload a government ID.</div></div>';
    return;
  }

  function card(o){
    var col = o.status==='verified' ? '#1E9E6A' : (o.status==='rejected' ? '#C64B3B' : '#C98F27');
    return `<div class="card anim ownercard" data-id="${o.id}" style="padding:16px;margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:center">
        ${UI.avatar(o.initial,{size:46,fs:17,gold:o.gold})}
        <div style="flex:1;min-width:0"><div style="font-weight:800">${o.name}</div>
          <div class="muted" style="font-size:12.5px">${o.city||'\u2014'}</div></div>
        <div class="quiz-chip" style="background:${col}1a;color:${col};text-transform:capitalize">${o.status}</div>
      </div>
      ${o.document?`<div class="doc-strip" style="margin-top:12px"><div class="doc-mini" data-ownerdoc="${o.document}"><span>ID</span></div></div>`:'<div class="muted" style="font-size:12px;margin-top:10px">No document</div>'}
      ${o.status==='pending'?`<div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn ghost sm" style="flex:1;color:var(--danger)" data-reject>Reject</button>
        <button class="btn sm" style="flex:1" data-approve>Verify</button></div>`:''}
    </div>`;
  }

  body.innerHTML =
    (pending.length ? '<div class="sec" style="margin-top:4px">Waiting for review ('+pending.length+')</div>' + pending.map(card).join('') : '') +
    (others.length ? '<div class="sec">Reviewed</div>' + others.map(card).join('') : '');

  // load ID thumbnails (signed URLs from owner-docs)
  body.querySelectorAll('[data-ownerdoc]').forEach(function(mini){
    var path = mini.getAttribute('data-ownerdoc');
    db.getOwnerDocUrl(path).then(function(url){
      if (url){ mini.style.backgroundImage = 'url('+url+')'; mini.classList.add('loaded');
        mini.addEventListener('click', function(){ window.open(url, '_blank'); }); }
    }).catch(function(){});
  });

  body.querySelectorAll('.ownercard').forEach(function(cardEl){
    var id = cardEl.getAttribute('data-id');
    function review(ap){
      cardEl.querySelectorAll('button').forEach(function(b){ b.disabled=true; });
      db.reviewOwnerId(id, ap).then(function(){
        UI.toast(ap?'Owner verified \u2713':'ID rejected');
        cardEl.style.transition='opacity .25s'; cardEl.style.opacity='0';
        setTimeout(function(){ drawOwnersAdmin(body); }, 250);
      }).catch(function(e){ cardEl.querySelectorAll('button').forEach(function(b){b.disabled=false;}); UI.toast(e.message||'Failed'); });
    }
    var a=cardEl.querySelector('[data-approve]'), r=cardEl.querySelector('[data-reject]');
    if(a) a.addEventListener('click',function(){ review(true); });
    if(r) r.addEventListener('click',function(){ review(false); });
  });
}

/* ---------- Reviews moderation ---------- */
async function drawReviewsAdmin(body){
  var rv = await db.getAllReviews();
  if (!rv.length){ body.innerHTML='<div class="card" style="padding:22px;text-align:center"><div class="muted">No reviews yet.</div></div>'; return; }
  body.innerHTML = rv.map(function(r){
    return `<div class="card anim revcard" data-id="${r.id}" style="padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:800;font-size:13.5px">${r.author} \u2192 ${r.sitter}</div>
        <div style="color:var(--gold-dk);font-size:13px">${'\u2605'.repeat(r.rating)}</div>
      </div>
      ${r.body?`<p style="font-size:13.5px;margin:8px 0 0;line-height:1.5">${r.body}</p>`:''}
      <button class="btn ghost sm" style="width:auto;padding:7px 12px;margin-top:10px;color:var(--danger)" data-remove>Remove review</button>
    </div>`;
  }).join('');
  body.querySelectorAll('[data-remove]').forEach(function(btn){
    var card = btn.closest('.revcard'); var id = card.getAttribute('data-id');
    btn.addEventListener('click', function(){
      if (!confirm('Remove this review permanently?')) return;
      btn.disabled = true;
      db.removeReview(id).then(function(){
        UI.toast('Review removed');
        card.style.transition='opacity .25s'; card.style.opacity='0';
        setTimeout(function(){ card.remove(); if(!body.querySelector('.revcard')) drawReviewsAdmin(body); }, 250);
      }).catch(function(e){ btn.disabled=false; UI.toast(e.message||'Failed'); });
    });
  });
}

/* ---------- Reports (trust & safety) ---------- */
async function drawReportsAdmin(body){
  var reports = await db.getReports();
  if (!reports.length){
    body.innerHTML = '<div class="card" style="padding:22px;text-align:center"><div class="muted" style="font-size:13.5px">No open reports. When someone reports a review or conversation, it shows here.</div></div>';
    return;
  }
  body.innerHTML = reports.map(function(r){
    return `<div class="card anim repcard" data-id="${r.id}" style="padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="min-width:0">
          <div style="font-weight:800;font-size:14px;text-transform:capitalize">${r.kind} reported</div>
          <div class="muted" style="font-size:12px">by ${r.reporter}</div>
        </div>
        ${UI.tag('Open','gold')}
      </div>
      ${r.reason?`<p class="muted" style="font-size:13px;margin:10px 0 0;line-height:1.5">\u201c${r.reason}\u201d</p>`:''}
      <button class="btn ghost sm" style="width:auto;padding:7px 14px;margin-top:12px" data-resolve>Mark reviewed</button>
    </div>`;
  }).join('');
  body.querySelectorAll('.repcard').forEach(function(card){
    var id = card.getAttribute('data-id');
    card.querySelector('[data-resolve]').addEventListener('click', function(){
      this.disabled = true;
      db.resolveReport(id).then(function(){
        UI.toast('Marked reviewed');
        card.style.transition='opacity .25s'; card.style.opacity='0';
        setTimeout(function(){ card.remove(); if(!body.querySelector('.repcard')) drawReportsAdmin(body); }, 250);
      }).catch(function(e){ UI.toast(e.message||'Failed'); });
    });
  });
}
