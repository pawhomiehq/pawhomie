window.Router = {
  current(){ var h=(location.hash||'').replace('#/',''); return h || 'welcome'; },

  go(page){
    if(('#/'+page) === location.hash){ this.render(); }   // same route: force re-render
    else { location.hash = '#/'+page; }                   // else hashchange re-renders
  },

  async render(){
    var key  = this.current();
    var page = (window.Pages[key]) ? key : 'welcome';

    /* ---- access check (see roles.js) ---- */
    await Role.load();

    // Admins are confined to the admin surface. Any consumer page bounces to the panel.
    if (Role.isAdmin()){
      var ADMIN_OK = { admin:1, settings:1, welcome:1, privacy:1, terms:1, feeSchedule:1, safety:1, homieAgreement:1, guarantee:1 };
      if (!ADMIN_OK[page]){ this.go('admin'); return; }
    }

    var need = window.ACCESS[page] || 'user';
    if (!Role.can(need)){
      if (Role.isGuest()) window.RETURN_TO = page;   // come back here after signing up
      var to = Role.redirectFor(need);
      if (to.msg) UI.toast(to.msg);
      if (to.page !== page){ this.go(to.page); return; }
      page = 'welcome';
    }

    // Remember which side of the app we're on, so side-neutral pages
    // (settings, edit profile, my profile) know whether the owner or the
    // Paw Homie opened them. Owner/sitter pages set it; neutral pages keep it.
    var OWNER_PAGES  = { dashboard:1, bookings:1, favorites:1, petProfile:1, ownerVerification:1, booking:1, payment:1, confirmation:1, bookingDetail:1, review:1 };
    var SITTER_PAGES = { sitterDashboard:1, requests:1, availability:1, services:1, payouts:1, verification:1, sitterReviews:1 };
    if (SITTER_PAGES[page])      window.App.side = 'sitter';
    else if (OWNER_PAGES[page])  window.App.side = 'owner';
    else if (!window.App.side)   window.App.side = 'owner';   // sensible default

    // Let the page we're leaving tear itself down (e.g. destroy the live video
    // call frame so the camera & mic are released). Registered by pages that
    // hold onto hardware or timers.
    if (typeof window.__pageCleanup === 'function'){
      try { window.__pageCleanup(); } catch(e){}
      window.__pageCleanup = null;
    }

    var view = document.getElementById('view');
    view.innerHTML = window.Pages[page].render();
    window.scrollTo(0,0);
    if(window.Pages[page].mount){ try{ window.Pages[page].mount(); }catch(e){ console.error(e); } }
    UI.renderNav(page);
    document.getElementById('tabbar').classList.toggle('hidden', UI.NO_TAB.indexOf(page)>-1 || Role.isGuest());
  },

  init(){
    var self=this;
    window.addEventListener('hashchange',function(){ self.render(); });
    this.render();
  }
};
