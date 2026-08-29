/* All booking requests for this Paw Homie. */

Pages.requests = {
  render(){
    return `${UI.appbar('Booking requests','Reply fast to rank higher','sitterDashboard')}
      <div class="page narrow" id="reqList">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('reqList');
    var rs = await db.getRequests();

    if (!rs.length){
      host.innerHTML = `<div class="card" style="padding:26px;text-align:center">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--tint);color:var(--teal);display:grid;place-items:center;margin:0 auto 10px">${UI.icon('list',24)}</div>
        <div style="font-weight:800;margin-bottom:4px">No pending requests</div>
        <div class="muted" style="font-size:13.5px">When a pet owner books you, it'll appear here to accept or decline.</div>
      </div>`;
      return;
    }

    host.innerHTML = rs.map(function(r){
      return `<div class="card anim reqcard" data-id="${r.id}" style="padding:14px;margin-bottom:12px">
        <div style="display:flex;gap:13px;align-items:center">
          ${UI.avatar(r.initial,{size:48,fs:17,gold:r.gold})}
          <div style="flex:1">
            <div style="font-weight:800">${r.name}${r.pet?' \u00b7 '+r.pet:''}</div>
            <div class="muted" style="font-size:12.5px">${window.serviceLabel(r.kind)} \u00b7 ${r.dates} \u00b7 ${r.price}</div>
            <div style="display:flex;gap:6px;margin-top:8px">${UI.tag('New')}${UI.tag('Verified owner','ok')}</div>
          </div>
        </div>
        ${r.note ? `<p class="muted" style="font-size:13px;margin:10px 0 0;line-height:1.5">\u201c${r.note}\u201d</p>` : ''}
        <div style="display:flex;gap:10px;margin-top:12px">
          <button class="btn ghost sm" style="flex:1" data-decline>Decline</button>
          <button class="btn sm" style="flex:1" data-accept>Accept</button>
        </div>
      </div>`;
    }).join('');

    host.querySelectorAll('.reqcard').forEach(function(card){
      var id = card.getAttribute('data-id');
      function respond(accept){
        card.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
        db.respondToRequest(id, accept).then(function(){
          UI.toast(accept ? 'Accepted \uD83C\uDF89' : 'Declined');
          card.style.transition = 'opacity .25s, transform .25s';
          card.style.opacity = '0'; card.style.transform = 'scale(.97)';
          setTimeout(function(){ card.remove(); if(!host.querySelector('.reqcard')) Pages.requests.mount(); }, 260);
        }).catch(function(e){
          card.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
          UI.toast(e.message || 'Could not update.');
        });
      }
      var a = card.querySelector('[data-accept]');
      var d = card.querySelector('[data-decline]');
      if (a) a.addEventListener('click', function(){ respond(true); });
      if (d) d.addEventListener('click', function(){ respond(false); });
    });
  }
};
