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
      var ADMIN_OK = { admin:1, settings:1, welcome:1 };
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
