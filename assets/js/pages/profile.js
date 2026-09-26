Pages.profile = {
  render(){ var s=App.currentSitter; var first=s.name.split(' ')[0];
    var guest = !!(window.Role && Role.isGuest());
    var q = Booking.quote(s.rate);
    return `
  <div class="page" style="padding-top:0;padding-left:0;padding-right:0">
    <div style="position:relative">
      ${UI.photo('cover','height:220px;border-radius:0 0 28px 28px')}
      <div class="back" data-go="search" style="position:absolute;top:14px;left:16px">\u2039</div>
    </div>
    <div class="wrap" style="max-width:820px">
      <div style="display:flex;gap:14px;align-items:center;margin-top:-34px;position:relative">
        ${UI.avatar(s.initial,{size:70,fs:24,gold:s.gold,border:true})}
        <div style="flex:1;padding-top:30px">
          <div class="row-sb"><div style="font-size:20px;font-weight:900">${s.name}</div><div class="stars">\u2605 ${s.rating} <small class="muted">(${s.reviews})</small></div></div>
          <div class="verified" style="margin-top:2px">${UI.icon('check',14)} ID & background verified</div>
        </div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div>
          <div class="card rate-card"><div><div class="label" style="margin:0">From</div><div class="big-rate">$${s.rate} <span>/ night</span></div></div>${UI.tag(s.reply,'gold')}</div>
          <div class="vcta" id="videoCta"><div class="vic">${UI.icon('video',20)}</div>
            <div style="flex:1"><div style="font-weight:800;font-size:14px">Meet ${first} over video first</div><div class="muted" style="font-size:12px">Free 15-min intro call before you book</div></div>
            <span style="font-size:20px;color:var(--gold-dk)">\u203a</span></div>
          <div class="sec first">About</div>
          <p style="font-size:14px;line-height:1.55;color:#40504D;font-weight:600">${s.about}</p>
          <div class="sec">Home & walk area</div>
          <div style="display:flex;gap:10px">${UI.photo('home','flex:1;height:100px;border-radius:14px')}${UI.photo('walk','flex:1;height:100px;border-radius:14px')}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${s.tags.map(function(t){return UI.tag(t);}).join('')}${UI.tag('Non-smoking')}</div>
          <div class="sec">Services &amp; rates</div>
          <div id="profileServices"><div class="muted" style="font-size:13px;padding:6px">Loading services…</div></div>
          <div id="profileHomePhotos"></div>
          <div class="sec">Recent reviews</div>
          <div id="profileReviews"><div class="muted" style="font-size:13px;padding:10px">Loading reviews…</div></div>
        </div>
        <div>
          <div class="card" style="padding:16px;position:sticky;top:80px">
            <div class="big-rate" style="margin-bottom:8px">$${s.rate} <span>/ night</span></div>
            <div class="prow"><span class="m">${fmtRange(Booking.state.startDate, Booking.state.endDate)} \u00b7 ${q.nights} night${q.nights>1?'s':''}</span><span>${Booking.money(q.subtotal)}</span></div>
            <div class="prow"><span class="m">Service fee</span><span>${Booking.money(q.fee)}</span></div>
            <div class="prow"><span class="m">${q.taxLabel}</span><span>${Booking.money(q.tax)}</span></div>
            <div class="prow total"><span>Total</span><span>${Booking.money(q.total)}</span></div>
            ${guest
              ? `<button class="btn" data-auth="signup" style="margin-top:10px">Sign up to book</button>
                 <button class="btn ghost" data-auth="signup" style="margin-top:10px">Sign up to message</button>
                 <p class="muted" style="font-size:12px;text-align:center;margin-top:10px">Free to join \u00b7 you won\u2019t be charged until ${first} accepts</p>`
              : `<button class="btn" data-go="booking" style="margin-top:10px">Request booking</button>
                 <button class="btn ghost" id="msgSitter" style="margin-top:10px">Message ${first}</button>`}
          </div>
        </div>
      </div>
    </div>
    <div class="wrap actionbar" style="max-width:820px;display:flex;gap:12px;margin-top:16px">
      ${guest
        ? `<button class="btn" data-auth="signup">Sign up to book</button>`
        : `<button class="btn ghost" id="msgSitter2" style="width:auto;padding:15px 17px">${UI.icon("msg",18)}</button>
           <button class="btn" data-go="booking">Request booking</button>`}
    </div>
  </div>`; },
  mount(){
    var v=document.getElementById('videoCta');
    if(v) v.addEventListener('click', function(){ window.Video.openSheet(); });

    // Founding Paw Homie badge (trust signal for owners)
    if (App.currentSitter && db.isFounding){
      db.isFounding(App.currentSitter.id).then(function(f){
        if (!f) return;
        var host = document.querySelector('.verified');
        if (host){
          var b = document.createElement('div');
          b.innerHTML = '<span class="tag" style="background:var(--gold);color:#4A360A;margin-top:8px;display:inline-flex">⭐ Founding Paw Homie</span>';
          host.parentNode.insertBefore(b.firstChild, host.nextSibling);
        }
      }).catch(function(){});
    }

    // home photos strip
    var hpBox = document.getElementById('profileHomePhotos');
    if (hpBox && App.currentSitter && db.getHomePhotos){
      db.getHomePhotos(App.currentSitter.id).then(function(photos){
        if (!photos || !photos.length){ hpBox.innerHTML=''; return; }
        hpBox.innerHTML = '<div class="sec">Their home &amp; space</div>'+
          '<div class="pf-photos">'+ photos.map(function(u){
            return '<img src="'+u+'" alt="" onclick="window.open(\''+u+'\',\'_blank\')">';
          }).join('') +'</div>';
      }).catch(function(){ hpBox.innerHTML=''; });
    }

    // real per-service prices
    var svcBox = document.getElementById('profileServices');
    if (svcBox && App.currentSitter && db.getSitterServices){
      db.getSitterServices(App.currentSitter.id).then(function(services){
        var labelFor = {};
        (window.SERVICES||[]).forEach(function(x){ labelFor[x.id] = x.label; });
        if (!services.length){
          svcBox.innerHTML = '<div class="card" style="padding:14px"><div class="muted" style="font-size:13px">This sitter hasn\u2019t listed individual services yet.</div></div>';
          return;
        }
        svcBox.innerHTML = '<div class="card" style="padding:6px 16px">' + services.map(function(sv, i){
          return '<div class="row-sb" style="padding:12px 0'+(i? ';border-top:1px solid var(--line)':'')+'">'+
            '<span style="font-weight:700">'+(labelFor[sv.kind]||sv.kind)+'</span>'+
            '<span style="font-weight:800;color:var(--teal-dk)">$'+sv.price+' <small class="muted">/night</small></span></div>';
        }).join('') + '</div>';
      }).catch(function(){ svcBox.innerHTML=''; });
    }

    // real reviews
    var rbox = document.getElementById('profileReviews');
    if (rbox && App.currentSitter && db.getSitterReviews){
      db.getSitterReviews(App.currentSitter.id).then(function(reviews){
        if (!reviews.length){
          rbox.innerHTML = '<div class="card" style="padding:16px;text-align:center"><div class="muted" style="font-size:13px">No reviews yet \u2014 be the first after your stay.</div></div>';
          return;
        }
        rbox.innerHTML = reviews.map(function(r){
          return '<div class="card" style="padding:14px;margin-bottom:10px">'+
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+UI.avatar(r.initial,{size:34,fs:13,gold:r.gold})+
            '<div><div style="font-weight:800;font-size:14px">'+r.author+'</div>'+
            '<div style="color:var(--gold-dk);font-size:12px">'+'\u2605'.repeat(r.rating)+'</div></div></div>'+
            (r.body?'<p style="font-size:13.5px;line-height:1.5;color:#40504D;font-weight:600">\u201C'+r.body+'\u201D</p>':'')+
            (r.reply?'<div class="card" style="background:var(--tint);padding:10px 12px;margin-top:10px"><b style="font-size:12px;color:var(--teal-dk)">Response from the sitter</b><p style="font-size:13px;margin-top:4px;line-height:1.45">'+r.reply+'</p></div>':'')+
            (window.Role && !Role.isGuest() ? '<div style="text-align:right;margin-top:8px"><a class="report-review" data-rid="'+r.id+'" style="font-size:11.5px;color:var(--muted);cursor:pointer">Report</a></div>' : '')+
            '</div>';
        }).join('');
        rbox.querySelectorAll('.report-review').forEach(function(a){
          a.addEventListener('click', async function(){
            var reason = prompt('Why are you reporting this review? (optional)');
            if (reason === null) return;
            try { await db.fileReport('review', a.getAttribute('data-rid'), reason); UI.toast('Reported — thanks, our team will look into it'); a.textContent='Reported'; a.style.pointerEvents='none'; }
            catch(e){ UI.toast(e.message || 'Could not report'); }
          });
        });
      }).catch(function(){ rbox.innerHTML=''; });
    }

    async function openChat(btn){
      var original = btn.innerHTML;
      btn.disabled = true;
      try{
        var conv = await db.getOrCreateConversation(App.currentSitter.id);
        App.currentConversation = conv;
        Router.go('chat');
      }catch(e){
        btn.disabled = false;
        btn.innerHTML = original;
        UI.toast(/sign in/i.test(e.message) ? 'Please log in to send messages' : 'Could not open chat');
        console.error('open chat:', e);
      }
    }
    ['msgSitter','msgSitter2'].forEach(function(id){
      var b=document.getElementById(id);
      if(b) b.addEventListener('click', function(){ openChat(b); });
    });
  }
};
