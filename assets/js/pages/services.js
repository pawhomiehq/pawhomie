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

    host.innerHTML = `
      <div class="card anim" style="padding:6px 16px">${rows}</div>

      <div class="sec">Your nightly rate</div>
      <div class="card anim d1" style="padding:16px">
        <div class="label">Base rate per night (house sitting)</div>
        <div class="price-wrap big">$<input class="price-input" id="baseRate" type="number" min="0" max="500" value="${prof && prof.rate_per_night!=null ? prof.rate_per_night : 40}"></div>
      </div>

      <div class="sec">About you</div>
      <textarea class="field anim d1" id="aboutText" rows="3" placeholder="Tell owners why their pet will love staying with you\u2026">${prof && prof.about ? prof.about : ''}</textarea>

      <div class="sec">Home &amp; walk photos</div>
      <p class="muted anim d1" style="font-size:13px;margin-bottom:10px">Owners see these on your profile.</p>
      <div style="display:flex;gap:10px" class="anim d2">${UI.photo('home','flex:1;height:96px;border-radius:14px')}${UI.photo('walk','flex:1;height:96px;border-radius:14px')}</div>

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

    // save
    document.getElementById('saveSvc').addEventListener('click', async function(){
      var btn = this, err = document.getElementById('svcErr');
      err.style.display = 'none';

      var baseRate = Number(document.getElementById('baseRate').value);
      if (isNaN(baseRate) || baseRate <= 0){ err.textContent = 'Please set a nightly rate above $0.'; err.style.display='block'; return; }

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

      var published = document.getElementById('pubTog').classList.contains('on');
      if (published && !services.some(function(s){ return s.enabled; })){
        err.textContent = 'Turn on at least one service before publishing.'; err.style.display='block'; return;
      }

      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await db.saveSitterProfile({
          rate_per_night: baseRate,
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
