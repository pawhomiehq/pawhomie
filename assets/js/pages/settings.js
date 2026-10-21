Pages.settings = { render(){
  function rowLink(txt,to){ return '<div class="card conv" data-go="'+to+'" style="margin-bottom:10px;padding:15px 16px"><span style="flex:1;font-weight:700">'+txt+'</span><span style="color:var(--muted)">\u203a</span></div>'; }
  var isAdmin  = !!(window.Role && Role.isAdmin());
  var isSitter = !isAdmin && !!(window.Role && Role.isSitter());
  var isOwner  = !isAdmin && (!(window.Role) || Role.isOwner());
  var backTo   = isAdmin ? 'admin' : 'dashboard';
  return `${UI.appbar('Account','',backTo)}
  <div class="page narrow">
    <div class="card anim" id="acctCard" style="padding:18px;display:flex;gap:14px;align-items:center;margin-bottom:16px">
      ${UI.avatar('\u2026',{size:56,fs:20,gold:true})}<div><div style="font-weight:800;font-size:17px">Loading…</div><div class="muted" style="font-size:13px"></div></div>
    </div>
    <div class="anim d1">
      ${isAdmin ? rowLink('Admin panel','admin') : ''}
      ${!isAdmin ? rowLink('Edit profile & photo','editProfile') : ''}
      ${isOwner ? rowLink('My pets','petProfile') : ''}
      ${isOwner ? rowLink('Verify my ID','ownerVerification') : ''}
      ${!isAdmin ? rowLink('Notifications','notifications') : ''}
      ${isSitter ? rowLink('Switch to Paw Homie','sitterDashboard') : ''}
      ${(!isSitter && !isAdmin) ? '<div class="card conv" id="becomeSitterRow" style="margin-bottom:10px;padding:15px 16px;cursor:pointer"><span style="flex:1;font-weight:700">Become a Paw Homie</span><span style="color:var(--muted)">›</span></div>' : ''}
      ${isSitter ? rowLink('Verification & documents','verification') : ''}
      ${isSitter ? rowLink('Payouts','payouts') : ''}
    </div>
    <div style="height:8px"></div>
    <button class="btn ghost" id="logoutBtn" style="color:var(--danger)">Log out</button>
  </div>`; },
  async mount(){
    // fill the header from the real profile
    var p = await Role.load();
    var card = document.getElementById('acctCard');
    if (card && p){
      var email = (window.App && App.user && App.user.email) ? App.user.email : '';
      var name = p.full_name || 'Your account';
      var avatarHtml = p.photo_url
        ? '<div class="ep-avatar" style="width:56px;height:56px;margin:0"><img src="'+p.photo_url+'" alt=""></div>'
        : UI.avatar((name.charAt(0)||'?').toUpperCase(),{size:56,fs:20,gold:!!p.avatar_gold});
      card.innerHTML = avatarHtml +
        '<div><div style="font-weight:800;font-size:17px">'+esc(name)+'</div>'+
        '<div class="muted" style="font-size:13px">'+ esc((p.city ? p.city + (email?' \u00b7 ':'') : '') + email) +'</div></div>';
    }

    // "Become a Paw Homie" \u2014 adds the sitter role to this account, then starts
    // the Paw Homie application (which still needs its own approval).
    var bs = document.getElementById('becomeSitterRow');
    if (bs) bs.addEventListener('click', async function(){
      bs.style.opacity = '.5';
      try {
        await db.becomeSitter();
        await Role.load(true);
        UI.toast('Welcome aboard \ud83d\udc3e Let\u2019s get you set up');
        Router.go('verification');
      } catch(e){ bs.style.opacity='1'; UI.toast(e.message || 'Could not start. Try again.'); }
    });

    var b = document.getElementById('logoutBtn');
    if(!b) return;
    b.addEventListener('click', async function(){
      b.disabled = true; b.textContent = 'Logging out…';
      try { await db.signOut(); } catch(e){ console.error(e); }
      Role.reset();
      UI.toast('Logged out');
      Router.go('welcome');
    });
  }
};
