/* Services & rates — real. Toggle services, set prices, publish your profile. */

Pages.services = {
  render(){
    return `${UI.appbar('Services & rates','Turn services on & set your price','sitterDashboard')}
      <div class="page narrow" id="svcView">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('svcView');
    var prof = await db.getSitterProfile();
    var mine = await db.getMyServices();          // [{kind, price, enabled}]
    var byKind = {};
    mine.forEach(function(s){ byKind[s.kind] = s; });

    // build a row per platform service
    var rows = window.SERVICES.map(function(s){
      var cur = byKind[s.id] || { price:'', enabled:false };
      return `<div class="svc${cur.enabled?'':' off'}" data-kind="${s.id}" ${s.id===window.SERVICES[0].id?'':'style="border-top:1px solid var(--line)"'}>
        <div><b>${s.label}</b><div class="muted" style="font-size:12px">${s.blurb}</div></div>
        <div style="display:flex;gap:12px;align-items:center">
          <div class="price-wrap">$<input class="price-input" data-price type="number" min="0" max="500" value="${cur.price!==''&&cur.price!=null?cur.price:''}" placeholder="0"></div>
          <div class="tog${cur.enabled?' on':''}" data-toggle></div>
        </div>
      </div>`;
    }).join('');

    var F = (CONFIG.FEES)||{};
    var myRate = F.SITTER_RATE||0.15;
    try { var sid0 = await db.mySitterId(); if (sid0 && db.isFounding && await db.isFounding(sid0)) myRate = F.FOUNDING_SITTER_RATE||0.12; } catch(e){}
    var keepPct = Math.round((1 - myRate) * 100);
    host.innerHTML = `
      <div class="card anim" style="padding:14px 16px;margin-bottom:12px;background:var(--tint);display:flex;gap:11px;align-items:center">
        <span style="color:var(--teal);flex:none">${UI.icon('wallet',20)}</span>
        <div style="font-size:13px;font-weight:700;color:var(--teal-dk)">You keep <b>${keepPct}%</b> of every booking. The price you set below is what you earn from — our fee is taken from it, never added for you.</div>
      </div>
      <p class="muted anim" style="font-size:13px;margin-bottom:10px">Turn on the services you offer and set your own price for each. Different services can have different rates.</p>
      <div class="card anim" style="padding:6px 16px">${rows}</div>

      <div class="sec">About you</div>
      <textarea class="field anim d1" id="aboutText" rows="3" placeholder="Tell owners why their pet will love staying with you\u2026">${prof && prof.about ? prof.about : ''}</textarea>

      <div class="sec">Photos of your home &amp; space</div>
      <p class="muted anim d1" style="font-size:13px;margin-bottom:10px">Owners see these on your profile \u2014 show where their pet will stay, your yard, walking area, etc. Add up to 6.</p>
      <div id="homePhotos" class="home-grid anim d2"></div>
      <input type="file" accept="image/*" id="homePhotoInput" style="display:none">
      <div id="homePhotoErr" class="authError" style="display:none;margin-top:8px"></div>

      <div class="card anim d2" style="padding:14px 16px;margin-top:16px;display:flex;align-items:center;gap:12px">
        <div style="flex:1"><b>Publish my profile</b><div class="muted" style="font-size:12px">When on, owners can find and book you.</div></div>
        <div class="tog${prof && prof.published?' on':''}" id="pubTog"></div>
      </div>

      <div id="svcErr" class="authError" style="display:none;margin-top:14px"></div>
      <div style="height:16px"></div>
      <button class="btn" id="saveSvc">Save changes</button>`;

    // toggles
    host.querySelectorAll('[data-toggle]').forEach(function(t){
      t.addEventListener('click', function(){
        t.classList.toggle('on');
        var row = t.closest('.svc');
        if (row) row.classList.toggle('off', !t.classList.contains('on'));
      });
    });
    var pub = document.getElementById('pubTog');
    if (pub) pub.addEventListener('click', function(){ pub.classList.toggle('on'); });

    /* ---- home photos gallery (real uploads) ---- */
    var homePhotos = (prof && prof.home_photos) ? prof.home_photos.slice() : [];
    var grid = document.getElementById('homePhotos');
    var fileIn = document.getElementById('homePhotoInput');
    var hpErr = document.getElementById('homePhotoErr');

    function drawGrid(){
      var tiles = homePhotos.map(function(url, i){
        return '<div class="home-tile"><img src="'+url+'" alt=""><button type="button" class="home-del" data-i="'+i+'">\u00d7</button></div>';
      }).join('');
      var addBtn = homePhotos.length < 6
        ? '<button type="button" class="home-add" id="homeAdd">'+UI.icon('image',22)+'<span>Add photo</span></button>'
        : '';
      grid.innerHTML = tiles + addBtn;
      var add = document.getElementById('homeAdd');
      if (add) add.addEventListener('click', function(){ fileIn.click(); });
      grid.querySelectorAll('.home-del').forEach(function(b){
        b.addEventListener('click', async function(){
          var idx = Number(b.getAttribute('data-i'));
          homePhotos.splice(idx,1);
          drawGrid();
          try { await db.saveHomePhotos(homePhotos); } catch(e){ hpErr.textContent=e.message||'Could not update'; hpErr.style.display='block'; }
        });
      });
    }
    drawGrid();

    if (fileIn) fileIn.addEventListener('change', async function(){
      var f = fileIn.files && fileIn.files[0];
      if (!f){ return; }
      if (!/^image\//.test(f.type)){ hpErr.textContent='Please choose an image.'; hpErr.style.display='block'; return; }
      if (f.size > 8*1024*1024){ hpErr.textContent='Image must be under 8 MB.'; hpErr.style.display='block'; return; }
      hpErr.style.display='none';
      // optimistic placeholder
      homePhotos.push((window.URL&&URL.createObjectURL)?URL.createObjectURL(f):'');
      drawGrid();
      try {
        var up = await db.uploadHomePhoto(f);
        homePhotos[homePhotos.length-1] = up.url;   // replace blob with real url
        await db.saveHomePhotos(homePhotos);
        drawGrid();
      } catch(e){
        homePhotos.pop(); drawGrid();
        hpErr.textContent = e.message || 'Upload failed.'; hpErr.style.display='block';
      }
      fileIn.value = '';
    });

    // save
    document.getElementById('saveSvc').addEventListener('click', async function(){
      var btn = this, err = document.getElementById('svcErr');
      err.style.display = 'none';

      // gather each service
      var services = [];
      var bad = false;
      host.querySelectorAll('.svc').forEach(function(row){
        var kind = row.getAttribute('data-kind');
        var enabled = row.querySelector('[data-toggle]').classList.contains('on');
        var priceRaw = row.querySelector('[data-price]').value;
        var price = priceRaw === '' ? 0 : Number(priceRaw);
        if (enabled && (isNaN(price) || price <= 0)) bad = true;
        services.push({ kind:kind, price:price, enabled:enabled });
      });
      if (bad){ err.textContent = 'Every service you turn on needs a price above $0.'; err.style.display='block'; return; }

      var enabledServices = services.filter(function(s){ return s.enabled; });
      var published = document.getElementById('pubTog').classList.contains('on');
      if (published && !enabledServices.length){
        err.textContent = 'Turn on at least one service before publishing.'; err.style.display='block'; return;
      }
      // "from" rate shown on cards = the lowest enabled service price
      var fromRate = enabledServices.length ? Math.min.apply(null, enabledServices.map(function(s){ return s.price; })) : 0;

      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await db.saveSitterProfile({
          rate_per_night: fromRate,
          about: (document.getElementById('aboutText').value || '').trim(),
          published: published
        });
        for (var i=0;i<services.length;i++){
          await db.saveService(services[i].kind, services[i].price, services[i].enabled);
        }
        UI.toast(published ? 'Saved & published \uD83D\uDC3E' : 'Saved');
        Router.go('sitterDashboard');
      } catch(e){
        btn.disabled = false; btn.textContent = 'Save changes';
        err.textContent = e.message || 'Could not save. Please try again.'; err.style.display='block';
      }
    });
  }
};
