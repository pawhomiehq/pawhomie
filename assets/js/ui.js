/* Shared UI helpers (icons + small components) */
const ICONS = {
  home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  image:'M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6M8.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  paw:'M12 14c-2 0-3.6 1.7-3.6 3.2S10 20 12 20s3.6-1.3 3.6-2.8S14 14 12 14zM6 9.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM18 9.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM9 6a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 9 6zM15 6a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 15 6z',
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4-4',
  msg:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  user:'M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  cal:'M3 4h18v18H3zM3 9h18M8 2v4M16 2v4',
  pin:'M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0zM12 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  video:'M23 7l-7 5 7 5V7zM1 5h15v14H1z',
  bell:'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  wallet:'M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1zM16 12h4',
  shield:'M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z',
  check:'M20 6L9 17l-5-5',
  list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  clock:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v5l3 2',
  mic:'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 10a7 7 0 0 0 14 0M12 19v3',
  lock:'M4 10h16v11H4zM8 10V7a4 4 0 0 1 8 0v3'
};
function icon(name, sz){ sz=sz||20; return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="'+ICONS[name]+'"/></svg>'; }
/* Solid paw shape (the stroke icons render too thin at small sizes). */
window.pawGlyph = function(color, sz){
  sz = sz || 20;
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="'+(color||'currentColor')+'" aria-hidden="true">'+
    '<ellipse cx="12" cy="16" rx="4.2" ry="3.4"/>'+
    '<circle cx="6.2" cy="11" r="1.9"/><circle cx="17.8" cy="11" r="1.9"/>'+
    '<circle cx="9" cy="7.6" r="1.9"/><circle cx="15" cy="7.6" r="1.9"/></svg>';
};

/* Image slot.
   Uses a real photo if one exists at assets/img/photos/<slot>.jpg,
   otherwise falls back to our own illustration. So dropping a photo
   into that folder is all it takes — no code change. */
function photo(slot, style){
  var art = 'assets/img/art/' + slot + '.svg';
  return '<img class="ph" alt="" loading="lazy" style="' + (style || '') + '"' +
         ' src="assets/img/photos/' + slot + '.jpg"' +
         " onerror=\"this.onerror=null;this.src='" + art + "'\">";
}

function avatar(initial, opts){ opts=opts||{}; var sz=opts.size||44; var fs=opts.fs||Math.round(sz*.36);
  var b=opts.border?('border:'+Math.max(2,Math.round(sz/16))+'px solid var(--cream);'):'';
  return '<div class="av'+(opts.gold?' gold':'')+'" style="width:'+sz+'px;height:'+sz+'px;font-size:'+fs+'px;'+b+'">'+initial+'</div>'; }
function tag(t, cls){ return '<span class="tag'+(cls?' '+cls:'')+'">'+t+'</span>'; }
function backBtn(to){ return '<div class="back" data-go="'+to+'">\u2039</div>'; }
function appbar(title, sub, back){
  return '<div class="appbar">'+(back?backBtn(back):'')+'<div><h1>'+title+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div></div>'; }

/* mobile tab bar + desktop top nav (built once, updated per route) */
const TABS = [['dashboard','Home','home'],['search','Search','search'],['messages','Messages','msg'],['settings','Account','user']];
function renderNav(active){
  var R = window.Role || { isGuest:function(){return false;}, isOwner:function(){return true;},
                           isSitter:function(){return false;}, isAdmin:function(){return false;} };

  /* ---- bottom tabs: different for each side ---- */
  var tabs;
  if (R.isGuest()){
    tabs = [];                                     // visitors get the top bar only
  } else if (R.isAdmin()){
    tabs = [];                                     // admin is a single locked-down panel
  } else if (R.isSitter() && !R.isOwner()){
    tabs = [['sitterDashboard','Home','home'],['requests','Requests','list'],
            ['messages','Messages','msg'],['settings','Account','user']];
  } else {
    tabs = [['dashboard','Home','home'],['bookings','Bookings','list'],
            ['search','Search','search'],['settings','Account','user']];
  }
  var tb = document.getElementById('tabbar');
  tb.innerHTML = tabs.map(function(t){
    return '<a data-go="'+t[0]+'" class="'+(t[0]===active?'on':'')+'">'+icon(t[2],22)+'<span>'+t[1]+'</span></a>';
  }).join('');

  /* ---- top nav ---- */
  var links = '';
  if (R.isGuest()){
    links = '<a data-go="search">Find sitters</a>'+
            '<a data-nav="services">Services</a>'+
            '<a data-auth="signup">Become a Paw Homie</a>'+
            '<a data-nav="faq">FAQ</a>'+
            '<a data-auth="login" class="nav-cta">Log in / Sign up</a>';
  } else if (R.isAdmin()){
    // admin sees the panel only — no consumer app, no messages
    links += '<a data-go="admin" class="nav-admin '+(active==='admin'?'on':'')+'">Admin panel</a>'+
             '<a data-go="__logout" class="nav-logout">Log out</a>';
  } else if (R.isSitter() && !R.isOwner()){
    // pure Paw Homie
    links += '<a data-go="sitterDashboard" class="'+(active==='sitterDashboard'?'on':'')+'">Home</a>'+
             '<a data-go="requests" class="'+(active==='requests'?'on':'')+'">Requests</a>'+
             '<a data-go="availability" class="'+(active==='availability'?'on':'')+'">Availability</a>'+
             '<a data-go="messages" class="'+(active==='messages'?'on':'')+'">Messages</a>'+
             '<a data-go="settings" class="'+(active==='settings'?'on':'')+'">Account</a>';
  } else {
    // owner (or someone who is both)
    links += '<a data-go="dashboard" class="'+(active==='dashboard'?'on':'')+'">Home</a>'+
             '<a data-go="search" class="'+(active==='search'?'on':'')+'">Search</a>'+
             '<a data-go="bookings" class="'+(active==='bookings'?'on':'')+'">My bookings</a>'+
             '<a data-go="favorites" class="'+(active==='favorites'?'on':'')+'">Favorites</a>';
    if (R.isSitter()){
      links += '<a data-go="sitterDashboard" class="'+(active==='sitterDashboard'?'on':'')+'">Paw Homie</a>';
    }
    links += '<a data-go="messages" class="'+(active==='messages'?'on':'')+'">Messages</a>'+
             '<a data-go="settings" class="'+(active==='settings'?'on':'')+'">Account</a>';
  }

  var tn = document.getElementById('topnav');
  var brand = R.isAdmin()
    ? '<div class="brand brand-static"><img src="assets/img/logo-header.png" alt="PawHomie" class="brand-logo"></div>'
    : '<div class="brand" data-go="welcome"><img src="assets/img/logo-header.png" alt="PawHomie" class="brand-logo"></div>';
  tn.innerHTML = brand + links;

  // Awareness badges (red dots) on Messages / Requests / Account — async, non-blocking.
  if (window.db && !R.isGuest() && !R.isAdmin() && db.getAwareness){
    db.getAwareness().then(function(a){
      applyNavBadges(a);
    }).catch(function(){});
  }
}

/* Put red dots on the nav + tab bar for anything needing action. */
function applyNavBadges(a){
  function dot(dest, on){
    // top nav
    document.querySelectorAll('#topnav [data-go="'+dest+'"]').forEach(function(el){
      var b = el.querySelector('.nav-dot'); 
      if (on){ if(!b){ b=document.createElement('span'); b.className='nav-dot'; el.appendChild(b);} }
      else if (b){ b.remove(); }
    });
    // bottom tab bar
    document.querySelectorAll('#tabbar [data-go="'+dest+'"]').forEach(function(el){
      var b = el.querySelector('.tab-dot');
      if (on){ if(!b){ b=document.createElement('span'); b.className='tab-dot'; el.appendChild(b);} }
      else if (b){ b.remove(); }
    });
  }
  dot('messages', a.unreadMessages > 0);
  dot('requests', a.sitterRequests > 0);
  dot('sitterDashboard', a.sitterRequests > 0 || a.verifyAction);
  dot('settings', a.verifyAction || a.ownerVerifyAction);
  dot('verification', a.verifyAction);
  dot('ownerVerification', a.ownerVerifyAction);
}
const NO_TAB = ['favorites','welcome','signup','profile','booking','payment','confirmation','chat','petProfile','bookingDetail','review','services','availability','verification','payouts','requests','notifications'];
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(window._tt); window._tt=setTimeout(function(){t.classList.remove('show');},2200); }
window.UI = {
  skeleton:function(n){ n=n||3; var o=''; for(var i=0;i<n;i++) o+='<div class="card skel skel-card"></div>'; return o; }, icon, photo, avatar, tag, appbar, backBtn, renderNav, NO_TAB, toast };
