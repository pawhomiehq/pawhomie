/* Reviews about me — the sitter can read and reply to each. */

Pages.sitterReviews = {
  render(){
    return `${UI.appbar('My reviews','Reply to build trust','sitterDashboard')}
      <div class="page narrow" id="srView"><div class="muted" style="text-align:center;padding:24px">Loading…</div></div>`;
  },
  async mount(){
    var host = document.getElementById('srView');
    var reviews = await db.getMyReviews();
    if (!reviews.length){
      host.innerHTML = '<div class="card" style="padding:24px;text-align:center"><div class="muted" style="font-size:13.5px">No reviews yet. After your first completed stays, they\u2019ll appear here and you can reply.</div></div>';
      return;
    }
    host.innerHTML = reviews.map(function(r){
      return `<div class="card anim srcard" data-id="${r.id}" style="padding:16px;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${UI.avatar(r.initial,{size:36,fs:14,gold:r.gold})}
          <div><div style="font-weight:800;font-size:14px">${r.author}</div>
            <div style="color:var(--gold-dk);font-size:12px">${'\u2605'.repeat(r.rating)}</div></div>
        </div>
        ${r.body?`<p style="font-size:13.5px;line-height:1.5;color:#40504D;font-weight:600">\u201C${r.body}\u201D</p>`:''}
        <div class="reply-area" style="margin-top:10px">
          ${r.reply
            ? `<div class="card" style="background:var(--tint);padding:10px 12px"><b style="font-size:12px;color:var(--teal-dk)">Your reply</b><p style="font-size:13px;margin-top:4px;line-height:1.45">${r.reply}</p></div>`
            : `<button class="btn ghost sm" style="width:auto;padding:7px 14px" data-reply>Reply</button>`}
        </div>
      </div>`;
    }).join('');

    host.querySelectorAll('.srcard').forEach(function(card){
      var id = card.getAttribute('data-id');
      var btn = card.querySelector('[data-reply]');
      if (!btn) return;
      btn.addEventListener('click', function(){
        var area = card.querySelector('.reply-area');
        area.innerHTML = '<textarea class="field" id="rt-'+id+'" rows="2" placeholder="Thanks so much! It was a pleasure caring for\u2026"></textarea>'+
          '<div style="display:flex;gap:8px;margin-top:8px"><button class="btn ghost sm" data-cancel style="flex:1">Cancel</button><button class="btn sm" data-send style="flex:1">Post reply</button></div>';
        area.querySelector('[data-cancel]').addEventListener('click', function(){ Pages.sitterReviews.mount(); });
        area.querySelector('[data-send]').addEventListener('click', async function(){
          var text = (document.getElementById('rt-'+id).value||'').trim();
          if (!text){ UI.toast('Write a reply first'); return; }
          this.disabled = true; this.textContent = 'Posting…';
          try { await db.replyToReview(id, text); UI.toast('Reply posted'); Pages.sitterReviews.mount(); }
          catch(e){ this.disabled=false; this.textContent='Post reply'; UI.toast(e.message||'Could not post'); }
        });
      });
    });
  }
};
