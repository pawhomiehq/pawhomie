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
      ${isOwner ? rowLink('My pets','petProfile') : ''}
      ${isOwner ? rowLink('Verify my ID','ownerVerification') : ''}
      ${!isAdmin ? rowLink('Notifications','notifications') : ''}
      ${(isSitter && isOwner) ? rowLink('Switch to Paw Homie','sitterDashboard') : ''}
      ${(isSitter && !isOwner) ? rowLink('My Paw Homie dashboard','sitterDashboard') : ''}
      ${(!isSitter && !isAdmin) ? rowLink('Become a Paw Homie','signup') : ''}
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
      card.innerHTML = UI.avatar((name.charAt(0)||'?').toUpperCase(),{size:56,fs:20,gold:!!p.avatar_gold}) +
        '<div><div style="font-weight:800;font-size:17px">'+name+'</div>'+
        '<div class="muted" style="font-size:13px">'+ (p.city ? p.city + (email?' \u00b7 ':'') : '') + email +'</div></div>';
    }
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
