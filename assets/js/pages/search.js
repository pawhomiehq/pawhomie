Pages.search = {
  render(){ return `
  ${UI.appbar('Paw Homies near you','Choose your area','welcome')}
  <div class="page">
    <div class="area-bar anim">
      <div class="ic">${UI.icon('pin',18)}</div>
      <select class="field area-select" id="areaPick">
        <option value="">All areas</option>
        <option>Toronto</option><option>North York</option><option>Scarborough</option>
        <option>Etobicoke</option><option>East York</option><option>York</option>
        <option>Mississauga</option><option>Brampton</option><option>Markham</option>
        <option>Vaughan</option><option>Richmond Hill</option><option>Oakville</option>
        <option>Pickering</option><option>Ajax</option><option>Burlington</option>
      </select>
      <select class="field area-select" id="sortPick" style="max-width:140px">
        <option value="rating">Top rated</option>
        <option value="price_low">Price: low to high</option>
        <option value="price_high">Price: high to low</option>
        <option value="reviews">Most reviewed</option>
      </select>
    </div>
    <div class="chips anim" id="svcChips">
      ${window.SERVICES.map(function(s){ return '<button class="chip'+(s.id===App.searchService?' on':'')+'" data-svc="'+s.id+'">'+s.label+'</button>'; }).join('')}
    </div>
    <div class="muted anim" id="resultCount" style="font-size:13px;margin:2px 2px 12px"></div>
    ${(window.Role && Role.isGuest()) ? `
      <div class="card guest-note anim" style="padding:14px 16px;margin-bottom:14px">
        <div style="flex:1">
          <b style="font-size:14.5px">Browsing as a guest</b>
          <div class="muted" style="font-size:12.5px;margin-top:2px">Create a free account to book, message and save favourites.</div>
        </div>
        <button class="btn sm" data-auth="signup">Sign up</button>
      </div>` : ''}
    <div class="grid cards" id="sitterList"></div>
  </div>`; },
  async mount(){
    var list=document.getElementById('sitterList');
    var count=document.getElementById('resultCount');
    var areaPick=document.getElementById('areaPick');
    var favIds=await db.getFavoriteIds();

    // default the area to the signed-in user's own city
    var preArea = App.searchArea || ((window.Role && Role.profile && Role.profile.city) ? String(Role.profile.city).split(',')[0].trim() : '');
    if (preArea && areaPick){
      for (var i=0;i<areaPick.options.length;i++){ if(areaPick.options[i].value===preArea){ areaPick.value=preArea; break; } }
    }

    async function renderList(service){
      var area = areaPick ? areaPick.value : '';
      list.innerHTML = UI.skeleton(4);
      var sitters=await db.getSitters(service, area);
      var sortBy = document.getElementById('sortPick') ? document.getElementById('sortPick').value : 'rating';
      sitters.sort(function(a,b){
        if (sortBy==='price_low')  return a.rate - b.rate;
        if (sortBy==='price_high') return b.rate - a.rate;
        if (sortBy==='reviews')    return (b.reviews||0) - (a.reviews||0);
        return parseFloat(b.rating) - parseFloat(a.rating); // top rated
      });
      var where = area ? (' in ' + area) : ' near you';
      count.textContent = sitters.length + ' Paw Homie' + (sitters.length===1?'':'s') + ' offering ' + window.serviceLabel(service).toLowerCase() + where;
      if(!sitters.length){
        list.innerHTML = `<div class="card" style="padding:24px;text-align:center">
          <div style="font-size:26px;margin-bottom:6px">\uD83D\uDC3E</div>
          <div style="font-weight:800;margin-bottom:4px">No Paw Homies ${area?('in '+area):'for this'} yet</div>
          <div class="muted" style="font-size:13px">Try another area or service above.</div></div>`;
        return;
      }
      list.innerHTML = sitters.map(function(s,i){ return `
        <div class="card scard anim" data-sitter="${s.id}" style="animation-delay:${i*0.05}s">
          ${UI.avatar(s.initial,{size:60,fs:22,gold:s.gold})}
          <div class="info">
            <div class="row-sb"><div class="name">${s.name}</div><div class="rate">$${s.rate} <small>/night</small></div></div>
            <div class="meta"><span class="verified">\u2713 Verified</span> \u00b7 \u2605 ${s.rating} (${s.reviews})${s.city?' \u00b7 '+s.city:''}</div>
            <div class="tags">${s.tags.map(function(t){return UI.tag(t);}).join('')}</div>
          </div>
          <div class="heart ${favIds.indexOf(s.id)>-1?'on':''}" data-heart data-fav="${s.id}"><svg viewBox="0 0 24 24"><path d="M12 21C5 15.5 3 12 3 8.5 3 5.5 5.5 4 8 5.2 9 5.7 12 8 12 8s3-2.3 4-2.8C18.5 4 21 5.5 21 8.5 21 12 19 15.5 12 21z"/></svg></div>
        </div>`; }).join('');

      list.querySelectorAll('[data-sitter]').forEach(function(el){
        el.addEventListener('click', async function(e){ if(e.target.closest('[data-heart]')) return;
          var st = await db.getSitter(el.getAttribute('data-sitter')); if(!st){ UI.toast('Could not load that sitter'); return; } App.currentSitter = st; Router.go('profile'); });
      });
      list.querySelectorAll('[data-heart]').forEach(function(h){
        h.addEventListener('click', async function(e){
          e.stopPropagation();
          if (window.Role && Role.isGuest()){
            UI.toast('Sign up to save favourites');
            window.RETURN_TO = 'favorites';
            if (window.AUTH) window.AUTH.mode = 'signup';
            location.hash = '#/signup';
            return;
          }
          var makeFav = !h.classList.contains('on');
          h.classList.toggle('on', makeFav);
          h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
          try { await db.toggleFavorite(h.getAttribute('data-fav'), makeFav); }
          catch(err){ h.classList.toggle('on', !makeFav);
            UI.toast(/sign in/i.test(err.message)?'Log in to save favorites':'Could not save'); }
        });
      });
    }

    // service chips switch the filter
    document.querySelectorAll('#svcChips .chip').forEach(function(c){
      c.addEventListener('click', function(){
        document.querySelectorAll('#svcChips .chip').forEach(function(x){ x.classList.remove('on'); });
        c.classList.add('on');
        App.searchService = c.getAttribute('data-svc');
        renderList(App.searchService);
      });
    });

    if (areaPick) areaPick.addEventListener('change', function(){
      App.searchArea = areaPick.value;
      // remember it on the profile so it sticks across refreshes
      if (areaPick.value && window.Role && Role.profile){
        Role.profile.city = areaPick.value;
        if (db.saveArea) db.saveArea(areaPick.value).catch(function(){});
      }
      renderList(App.searchService || 'house_sitting');
    });
    var sortPick = document.getElementById('sortPick');
    if (sortPick) sortPick.addEventListener('change', function(){ renderList(App.searchService || 'house_sitting'); });

    renderList(App.searchService || 'house_sitting');
  }
};
