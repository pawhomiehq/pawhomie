/* Favorites — the Paw Homies you've hearted. */

Pages.favorites = {
  render(){
    return `${UI.appbar('Favorites','Paw Homies you saved','dashboard')}
      <div class="page" id="favList">
        <div class="muted" style="text-align:center;font-size:14px;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('favList');
    var favs = await db.getFavorites();

    if(!favs.length){
      host.innerHTML = `<div class="card" style="padding:26px;text-align:center;max-width:420px;margin:0 auto">
        <div style="width:56px;height:56px;border-radius:50%;background:#FDECEC;display:grid;place-items:center;margin:0 auto 10px">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#E5484D"><path d="M12 21C5 15.5 3 12 3 8.5 3 5.5 5.5 4 8 5.2 9 5.7 12 8 12 8s3-2.3 4-2.8C18.5 4 21 5.5 21 8.5 21 12 19 15.5 12 21z"/></svg>
        </div>
        <div style="font-weight:800;margin-bottom:4px">No favorites yet</div>
        <div class="muted" style="font-size:13.5px;margin-bottom:14px">Tap the heart on a Paw Homie to save them here for later.</div>
        <button class="btn sm" data-go="search">Find Paw Homies</button>
      </div>`;
      return;
    }

    host.className = 'page grid cards';
    host.innerHTML = favs.map(function(s,i){ return `
      <div class="card scard anim" data-sitter="${s.id}" style="animation-delay:${i*0.05}s">
        ${UI.avatar(s.initial,{size:60,fs:22,gold:s.gold})}
        <div class="info">
          <div class="row-sb"><div class="name">${s.name}</div><div class="rate">$${s.rate} <small>/night</small></div></div>
          <div class="meta"><span class="verified">\u2713 Verified</span> \u00b7 \u2605 ${s.rating} (${s.reviews}) \u00b7 ${s.dist}</div>
          <div class="tags">${s.tags.map(function(t){return UI.tag(t);}).join('')}</div>
        </div>
        <div class="heart on" data-fav="${s.id}"><svg viewBox="0 0 24 24"><path d="M12 21C5 15.5 3 12 3 8.5 3 5.5 5.5 4 8 5.2 9 5.7 12 8 12 8s3-2.3 4-2.8C18.5 4 21 5.5 21 8.5 21 12 19 15.5 12 21z"/></svg></div>
      </div>`; }).join('');

    // open profile
    host.querySelectorAll('[data-sitter]').forEach(function(el){
      el.addEventListener('click', async function(e){
        if(e.target.closest('[data-fav]')) return;
        var st = await db.getSitter(el.getAttribute('data-sitter')); if(!st){ UI.toast('Could not load that sitter'); return; } App.currentSitter = st;
        Router.go('profile');
      });
    });
    // un-favorite removes the card
    host.querySelectorAll('[data-fav]').forEach(function(h){
      h.addEventListener('click', async function(e){
        e.stopPropagation();
        var id = h.getAttribute('data-fav');
        var card = h.closest('.scard');
        card.style.transition='opacity .25s, transform .25s'; card.style.opacity='0'; card.style.transform='scale(.96)';
        try {
          await db.toggleFavorite(id, false);
          setTimeout(function(){ card.remove(); if(!host.querySelector('.scard')) Pages.favorites.mount(); }, 250);
        } catch(err){ card.style.opacity='1'; card.style.transform='none'; UI.toast('Could not update'); }
      });
    });
  }
};
