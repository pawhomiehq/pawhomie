/* Leave a review — saved to the reviews table, tied to the booking. */

Pages.review = {
  render(){
    // review target comes from the booking; fall back to the current sitter
    var r = App.reviewFor || {
      sitterId: App.currentSitter.id, sitterName: App.currentSitter.name,
      initial: App.currentSitter.initial, gold: App.currentSitter.gold, bookingId: null
    };
    App.reviewFor = r;

    return `${UI.appbar('Leave a review','for '+r.sitterName,'bookingDetail')}
    <div class="page narrow">
      <div class="card anim" style="padding:22px;text-align:center">
        ${UI.avatar(r.initial,{size:60,fs:22,gold:r.gold})}
        <div style="font-weight:800;margin-top:10px">${r.sitterName}</div>
        <div id="starRow" style="font-size:34px;letter-spacing:6px;margin-top:12px;cursor:pointer;color:var(--gold)">
          <span data-star="1">\u2605</span><span data-star="2">\u2605</span><span data-star="3">\u2605</span><span data-star="4">\u2605</span><span data-star="5">\u2605</span>
        </div>
        <div class="muted" id="starLabel" style="font-size:12.5px;margin-top:6px">Tap to rate</div>
      </div>

      <div class="label anim d1" style="margin-top:18px">Tell others about your experience</div>
      <textarea class="field anim d1" id="reviewBody" rows="4" placeholder="Sara sent photos every day and Milo came home happy\u2026"></textarea>

      <div id="revErr" class="authError" style="display:none;margin-top:14px"></div>
      <div style="height:16px"></div>
      <button class="btn anim d2" id="submitReview">Post review</button>
    </div>`;
  },

  mount(){
    var rating = 0;
    var row = document.getElementById('starRow');
    var label = document.getElementById('starLabel');
    var WORDS = { 1:'Poor', 2:'Fair', 3:'Good', 4:'Great', 5:'Excellent' };

    function paint(n){
      row.querySelectorAll('[data-star]').forEach(function(x){
        x.style.opacity = (+x.getAttribute('data-star') <= n) ? '1' : '.25';
      });
      if (label) label.textContent = n ? WORDS[n] : 'Tap to rate';
    }
    paint(0);
    row.querySelectorAll('[data-star]').forEach(function(st){
      st.addEventListener('click', function(){ rating = +st.getAttribute('data-star'); paint(rating); });
    });

    document.getElementById('submitReview').addEventListener('click', async function(){
      var btn = this;
      var err = document.getElementById('revErr');
      err.style.display = 'none';
      if (!rating){ err.textContent = 'Please tap a star to rate your Paw Homie.'; err.style.display = 'block'; return; }

      var r = App.reviewFor || {};
      btn.disabled = true; btn.textContent = 'Posting…';
      try {
        await db.addReview({
          bookingId: r.bookingId || null,
          sitterId:  r.sitterId,
          rating:    rating,
          body:      (document.getElementById('reviewBody').value || '').trim()
        });
        UI.toast('Thanks! Review posted \u2b50');
        App.reviewFor = null;
        setTimeout(function(){ Router.go('dashboard'); }, 700);
      } catch(e){
        btn.disabled = false; btn.textContent = 'Post review';
        err.textContent = /sign in/i.test(e.message) ? 'Please log in first.' : (e.message || 'Could not post review.');
        err.style.display = 'block';
      }
    });
  }
};
