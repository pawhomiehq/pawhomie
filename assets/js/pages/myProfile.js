/* My Profile — one place for your own account: who you are, your roles,
   your verification status, an Edit button, and quick links to everything
   about your profile. Reachable from the avatar in the top bar, anywhere. */

Pages.myProfile = {
  render(){
    return `${UI.appbar('My profile','', (window.Role && Role.isSitter() && !Role.isOwner()) ? 'sitterDashboard' : 'dashboard')}
      <div class="page narrow" id="mpView">
        <div class="muted" style="text-align:center;padding:28px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('mpView');
    var p = await db.getProfile();
    if (!p){ host.innerHTML = '<div class="card" style="padding:22px;text-align:center"><div class="muted">Please sign in.</div></div>'; return; }

    var isOwner  = !!p.is_owner;
    var isSitter = !!p.is_sitter;
    var name  = p.full_name || 'Your account';
    var city  = p.city ? String(p.city).split(',')[0].trim() : '';
    var email = (window.App && App.user && App.user.email) ? App.user.email : '';

    // verification / role statuses (best-effort)
    var ownerStatus = null, sitterStatus = null, founding = false;
    try { if (isOwner && db.getOwnerVerification){ var ov = await db.getOwnerVerification(); ownerStatus = ov ? (ov.id_status||'unverified') : 'unverified'; } } catch(e){}
    try { if (isSitter && db.getApplication){ var ap = await db.getApplication(); sitterStatus = ap ? (ap.status||'draft') : 'draft'; } } catch(e){}
    try { if (isSitter){ var sid = await db.mySitterId(); if (sid && db.isFounding) founding = await db.isFounding(sid); } } catch(e){}

    function chip(txt, tone){
      var col = tone==='ok' ? '#1E9E6A' : (tone==='gold' ? '#C98F27' : (tone==='red' ? '#C64B3B' : 'var(--muted)'));
      var bg  = tone==='ok' ? '#E7F6EE' : (tone==='gold' ? 'var(--tint2)' : (tone==='red' ? '#FDECEC' : 'var(--tint)'));
      return '<span class="mp-chip" style="color:'+col+';background:'+bg+'">'+txt+'</span>';
    }
    var ownerChip = isOwner
      ? (ownerStatus==='verified' ? chip('ID verified','ok')
        : ownerStatus==='pending' ? chip('ID in review','gold')
        : ownerStatus==='rejected' ? chip('ID needs another look','red')
        : chip('ID not verified',''))
      : '';
    var sitterChip = isSitter
      ? (sitterStatus==='approved' ? chip('Paw Homie approved','ok')
        : sitterStatus==='pending' ? chip('Application in review','gold')
        : sitterStatus==='rejected' ? chip('Application needs a look','red')
        : chip('Application not finished','gold'))
      : '';

    var avatarHtml = p.photo_url
      ? '<div class="mp-avatar"><img src="'+p.photo_url+'" alt=""></div>'
      : UI.avatar((name.charAt(0)||'?').toUpperCase(), { size:92, fs:36, gold:!!p.avatar_gold });

    function link(txt, to, icon){
      return '<div class="card conv" data-go="'+to+'" style="margin-bottom:10px;padding:14px 16px">'+
        '<span class="mp-lic">'+UI.icon(icon,18)+'</span>'+
        '<span style="flex:1;font-weight:700">'+txt+'</span><span style="color:var(--muted)">›</span></div>';
    }

    host.innerHTML =
      '<div class="card anim mp-head" style="padding:22px 18px;text-align:center">'+
        avatarHtml +
        '<div style="font-weight:900;font-size:21px;margin-top:12px">'+esc(name)+'</div>'+
        (city||email ? '<div class="muted" style="font-size:13px;margin-top:2px">'+esc([city,email].filter(Boolean).join(' · '))+'</div>' : '')+
        '<div class="mp-roles">'+
          (isOwner ? '<span class="mp-role">Pet owner</span>' : '')+
          (isSitter ? '<span class="mp-role sitter">🐾 Paw Homie</span>' : '')+
          (founding ? '<span class="mp-role gold">⭐ Founding</span>' : '')+
        '</div>'+
        '<div class="mp-chips">'+ownerChip+sitterChip+'</div>'+
        '<button class="btn" data-go="editProfile" style="margin-top:16px">Edit profile</button>'+
      '</div>'+

      (p.bio ? '<div class="sec">About</div><div class="card anim" style="padding:14px 16px"><div style="font-size:14px;line-height:1.55;color:#40504D;font-weight:600">'+esc(p.bio)+'</div></div>' : '')+

      '<div class="sec">Pet owner</div>'+
      (isOwner ? (
        link('My pets','petProfile','paw')+
        link('My bookings','bookings','list')+
        link('Favorites','favorites','heart')+
        link(ownerStatus==='verified' ? 'ID verification · verified' : 'Verify my ID','ownerVerification','shield')
      ) : '') +

      '<div class="sec">Paw Homie</div>'+
      (isSitter ? (
        link('Services & rates','services','wallet')+
        link('Availability','availability','cal')+
        link('Verification & documents','verification','shield')+
        link('Payouts','payouts','wallet')+
        link('My reviews','sitterReviews','check')
      ) : '<div class="card anim" id="mpBecome" style="padding:16px;display:flex;gap:12px;align-items:center;cursor:pointer">'+
            '<div class="qa-ic" style="margin:0;background:var(--tint2);color:var(--gold-dk)">'+UI.icon('paw',20)+'</div>'+
            '<div style="flex:1"><b>Become a Paw Homie</b><div class="muted" style="font-size:12.5px">Get paid to look after pets — set your own rates.</div></div>'+
            '<span style="color:var(--muted);font-size:20px">›</span></div>')+

      '<div style="height:10px"></div>'+
      '<button class="btn ghost" id="mpLogout" style="color:var(--danger)">Log out</button>';

    var become = document.getElementById('mpBecome');
    if (become) become.addEventListener('click', async function(){
      become.style.opacity = '.5';
      try { await db.becomeSitter(); await Role.load(true);
        UI.toast('Welcome aboard 🐾 Let’s get you set up'); Router.go('verification'); }
      catch(e){ become.style.opacity='1'; UI.toast(e.message || 'Could not start. Try again.'); }
    });

    var lo = document.getElementById('mpLogout');
    if (lo) lo.addEventListener('click', async function(){
      lo.disabled = true; lo.textContent = 'Logging out…';
      try { await db.signOut(); } catch(e){}
      Role.reset(); UI.toast('Logged out'); Router.go('welcome');
    });
  }
};
