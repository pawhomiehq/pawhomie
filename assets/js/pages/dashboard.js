Pages.dashboard = { render(){ return `
  <div class="page">
    <div class="row-sb anim" style="padding-top:6px"><div><div class="hello">Welcome back</div><div style="font-size:24px;font-weight:900;color:var(--teal-dk)" id="dashName">Hi there</div></div><span id="dashAvatar">${UI.avatar('\u2026',{size:46,fs:17,gold:true})}</span></div>
    <div id="ownerBanner"></div>
    <div class="sec first anim row-sb"><span>Your bookings</span><a data-go="bookings" style="font-size:13px;font-weight:800;color:var(--teal);cursor:pointer">See all ›</a></div>
    <div id="nextBooking" class="anim">
      <div class="muted" style="text-align:center;padding:20px;font-size:13px">Loading…</div>
    </div>
    <div class="sec anim">Quick actions</div>
    <div class="grid cards three anim">
      <div class="card qa" data-go="search"><div class="qa-ic" style="background:var(--tint);color:var(--teal)">${UI.icon('search',20)}</div><div style="font-weight:800;font-size:13px">Find care</div></div>
      <div class="card qa" data-go="messages"><div class="qa-ic" style="background:var(--tint2);color:var(--gold-dk)">${UI.icon('msg',20)}</div><div style="font-weight:800;font-size:13px">Messages</div></div>
      <div class="card qa" data-go="favorites"><div class="qa-ic" style="background:#FDECEC;color:#E5484D"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21C5 15.5 3 12 3 8.5 3 5.5 5.5 4 8 5.2 9 5.7 12 8 12 8s3-2.3 4-2.8C18.5 4 21 5.5 21 8.5 21 12 19 15.5 12 21z"/></svg></div><div style="font-weight:800;font-size:13px">Favorites</div></div>
      <div class="card qa" data-go="petProfile"><div class="qa-ic" style="background:var(--tint);color:var(--muted)">\uD83D\uDC3E</div><div style="font-weight:800;font-size:13px">My pets</div></div>
    </div>
    <div class="sec anim">Your pets</div>
    <div id="dashPets"></div>
  </div>`; },
  async mount(){
    var p = await db.getProfile();
    if(p){
      var first = (p.full_name || '').split(' ')[0] || 'there';
      var n = document.getElementById('dashName');
      var a = document.getElementById('dashAvatar');
      if(n) n.textContent = 'Hi, ' + first;
      if(a) a.innerHTML = UI.avatar(p.initial || '?', {size:46, fs:17, gold: !!p.avatar_gold});
    }

    // ID verification prompt (visibility of system status)
    var vb = document.getElementById('ownerBanner');
    if (vb){
      var v = await db.getOwnerVerification();
      var st = v ? v.id_status : 'unverified';
      if (st === 'unverified'){
        vb.innerHTML = ownerBannerHTML('gold', UI.icon('shield',20),
          'Verify your ID',
          'Adding a government ID helps sitters trust you \u2014 and you\u2019ll need it before your first stay.',
          'Verify now');
      } else if (st === 'pending'){
        vb.innerHTML = ownerBannerHTML('gold', UI.icon('clock',20),
          'ID under review', 'Thanks! We\u2019re checking your ID \u2014 no action needed.', null);
      } else if (st === 'rejected'){
        vb.innerHTML = ownerBannerHTML('red', UI.icon('bell',20),
          'ID wasn\u2019t accepted', 'Please upload a clearer photo of your ID.', 'Try again');
      }
      var go = vb.querySelector('[data-ov]');
      if (go) go.addEventListener('click', function(){ Router.go('ownerVerification'); });
    }

    // bookings (works in demo mode too, via mock)
    var box = document.getElementById('nextBooking');
    if(!box) return;

    var bookings = await db.getMyBookings();
    if(!bookings.length){
      box.innerHTML = `<div class="card" style="padding:20px;text-align:center">
        <div style="font-size:30px;margin-bottom:6px">🐾</div>
        <div style="font-weight:800;margin-bottom:4px">No bookings yet</div>
        <div class="muted" style="font-size:13px;margin-bottom:12px">Find a Paw Homie near you and send your first request.</div>
        <button class="btn sm" data-go="search">Find care</button>
      </div>`;
      return;
    }

    var LABEL = { pending:'Awaiting acceptance', accepted:'Confirmed', declined:'Declined',
                  cancelled:'Cancelled', completed:'Completed' };
    var TONE  = { pending:'tag gold', accepted:'tag', declined:'tag', cancelled:'tag', completed:'tag' };

    box.innerHTML = bookings.slice(0,4).map(function(b){
      var isPending = b.status === 'pending';
      return `<div class="card big-book" data-booking="${b.id}" style="margin-bottom:10px;cursor:pointer">
        ${UI.avatar(b.initial,{size:52,fs:19,gold:b.gold})}
        <div style="flex:1">
          <div style="font-weight:800;font-size:15.5px">${b.sitterName} · House sitting</div>
          <div class="muted" style="font-size:12.5px;margin-top:2px">${b.petName} · ${b.dates} · ${Booking.money(b.total)}</div>
          <span class="${TONE[b.status]||'tag'}" style="margin-top:8px">${LABEL[b.status]||b.status}</span>
          ${isPending ? '<div class="muted" style="font-size:11.5px;margin-top:6px">\u23f3 Request sent — waiting for '+(b.sitterName.split(' ')[0])+' to accept</div>' : ''}
        </div>
      </div>`;
    }).join('');

    box.querySelectorAll('[data-booking]').forEach(function(el){
      el.addEventListener('click', function(){
        App.currentBookingId = el.getAttribute('data-booking');
        Router.go('bookingDetail');
      });
    });

    // real pets
    var petsBox = document.getElementById('dashPets');
    if (petsBox){
      var pets = await db.getPets();
      if (!pets.length){
        petsBox.innerHTML = '<div class="card row-sb" style="padding:14px 16px;cursor:pointer" data-go="petProfile">'+
          '<div class="muted" style="font-size:13.5px">No pets added yet</div>'+UI.tag('Add a pet','gold')+'</div>';
      } else {
        petsBox.innerHTML = pets.map(function(p){
          var meta = [p.species, p.breed, (p.age_years!=null?p.age_years+' yrs':'')].filter(Boolean).join(' \u00b7 ');
          return '<div class="card row-sb" style="padding:14px 16px;cursor:pointer;margin-bottom:8px" data-pet="'+p.id+'">'+
            '<div style="display:flex;gap:12px;align-items:center">'+UI.avatar((p.name||'?').charAt(0).toUpperCase(),{size:44,fs:16})+
            '<div><div style="font-weight:800">'+(p.name||'Pet')+'</div><div class="muted" style="font-size:12.5px">'+meta+'</div></div></div>'+UI.tag('Edit')+'</div>';
        }).join('');
        petsBox.querySelectorAll('[data-pet]').forEach(function(el){
          el.addEventListener('click', function(){ App.currentPetId = el.getAttribute('data-pet'); Router.go('petProfile'); });
        });
      }
    }
  }
};

function ownerBannerHTML(tone, icon, title, body, goLabel){
  var bg  = tone==='red' ? '#FDECEC' : 'var(--tint2)';
  var col = tone==='red' ? '#C64B3B' : 'var(--gold-dk)';
  var bord= tone==='red' ? '#F3C9C4' : '#F0DCA8';
  return '<div class="sd-banner anim" style="background:'+bg+';border:1.5px solid '+bord+'">'+
    '<div class="sd-banner-ic" style="color:'+col+'">'+icon+'</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div style="font-weight:800;font-size:14.5px">'+title+'</div>'+
      '<div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.45">'+body+'</div>'+
      (goLabel ? '<button class="btn sm" data-ov style="width:auto;margin-top:10px">'+goLabel+'</button>' : '')+
    '</div>'+
  '</div>';
}
