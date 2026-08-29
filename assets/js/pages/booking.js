/* Request a booking — real dates, real pets, live price. */

Pages.booking = {
  render() {
    var s = App.currentSitter;
    var B = Booking.state;
    B.sitterId = s.id;
    var q = Booking.quote(s.rate);
    var first = s.name.split(' ')[0];

    return `
  ${UI.appbar('Request a booking','with '+s.name,'profile')}
  <div class="page narrow">
    <div class="prog anim"><span class="d on"></span><span class="d"></span><span class="d"></span></div>

    <div class="label anim">Who needs care?</div>
    <div id="petPick" class="anim">
      <div class="card" style="padding:14px;text-align:center" class="muted">Loading your pets…</div>
    </div>

    <div class="label anim d1" style="margin-top:18px">Dates</div>
    <div class="card anim d1" style="padding:14px 16px">
      <div style="display:flex;gap:12px">
        <div style="flex:1">
          <div class="muted" style="font-size:11.5px;font-weight:800;margin-bottom:6px">CHECK IN</div>
          <input class="field" type="date" id="startDate" value="${B.startDate}" min="${new Date().toISOString().slice(0,10)}">
        </div>
        <div style="flex:1">
          <div class="muted" style="font-size:11.5px;font-weight:800;margin-bottom:6px">CHECK OUT</div>
          <input class="field" type="date" id="endDate" value="${B.endDate}" min="${B.startDate}">
        </div>
      </div>
      <div class="muted" style="font-size:12.5px;font-weight:700;margin-top:10px" id="nightsLabel">${q.nights} night${q.nights>1?'s':''}</div>
    </div>
    <div id="dateError" class="authError" style="display:none;margin-top:10px"></div>

    <div class="label anim d2" style="margin-top:18px">Note for ${first} <span style="font-weight:600;text-transform:none">(optional)</span></div>
    <textarea class="field anim d2" id="bookNote" rows="3"
      placeholder="Milo loves morning walks and is a little shy at first…">${B.note || ''}</textarea>

    <div class="sec">Price</div>
    <div class="card" style="padding:6px 16px">
      <div class="prow"><span class="m" id="lineLabel">${Booking.money(s.rate)} × ${q.nights} night${q.nights>1?'s':''}</span><span id="lineSub">${Booking.money(q.subtotal)}</span></div>
      <div class="prow"><span class="m">Service fee</span><span id="lineFee">${Booking.money(q.fee)}</span></div>
      <div class="prow"><span class="m">${q.taxLabel}</span><span id="lineTax">${Booking.money(q.tax)}</span></div>
      <div class="prow total"><span>Total</span><span id="lineTotal">${Booking.money(q.total)}</span></div>
    </div>
    <p class="muted" style="text-align:center;font-size:12.5px;margin-top:12px">You won't be charged until ${first} accepts.</p>

    <div id="bkVerifyNote"></div>

    <div class="actionbar"><button class="btn" id="toPayment">Continue to payment</button></div>
  </div>`;
  },

  async mount() {
    var s = App.currentSitter;
    var B = Booking.state;

    // verification notice (soft gate — 48h grace)
    var note = document.getElementById('bkVerifyNote');
    if (note){
      try {
        var v = await db.getOwnerVerification();
        var st = v ? v.id_status : 'unverified';
        if (st === 'unverified' || st === 'rejected'){
          note.innerHTML = '<div class="card" style="padding:13px 15px;margin-top:12px;background:var(--tint2);border:1.5px solid #F0DCA8;display:flex;gap:11px;align-items:flex-start">'+
            '<div style="color:var(--gold-dk);flex:none">'+UI.icon('shield',18)+'</div>'+
            '<div style="flex:1"><b style="font-size:13.5px">Verify your ID within 48 hours</b>'+
            '<div class="muted" style="font-size:12px;margin-top:2px;line-height:1.45">You can request this booking now, but please add a government ID within 48 hours so your sitter knows who\u2019s trusting them with their care.</div>'+
            '<button class="btn sm" data-ov style="width:auto;margin-top:9px">Verify my ID</button></div></div>';
          var go = note.querySelector('[data-ov]');
          if (go) go.addEventListener('click', function(){ Router.go('ownerVerification'); });
        }
      } catch(e){ /* non-blocking */ }
    }

    /* ---- pets ---- */
    var pets = await db.getPets();
    var box = document.getElementById('petPick');
    if (!pets.length) {
      box.innerHTML = `<div class="card" style="padding:16px;text-align:center">
        <div class="muted" style="font-size:13px;margin-bottom:10px">You haven't added a pet yet.</div>
        <button class="btn sm" id="addPetBtn">Add your pet</button></div>`;
      var ap = document.getElementById('addPetBtn');
      if (ap) ap.addEventListener('click', function(){ Router.go('petProfile'); });
    } else {
      if (!B.petId || !pets.some(function(p){ return p.id === B.petId; })) B.petId = pets[0].id;
      box.innerHTML = pets.map(function(p){
        var sub = [p.species, p.breed].filter(Boolean).join(' · ');
        return `<div class="card petOpt ${p.id===B.petId?'on':''}" data-pet="${p.id}"
             style="padding:12px;display:flex;align-items:center;gap:11px;cursor:pointer;margin-bottom:8px">
          ${UI.avatar(p.name.charAt(0).toUpperCase(),{size:42,fs:16})}
          <div><div style="font-weight:800">${p.name}</div><div class="muted" style="font-size:12px">${sub}</div></div>
        </div>`;
      }).join('');
      box.querySelectorAll('[data-pet]').forEach(function(el){
        el.addEventListener('click', function(){
          B.petId = el.dataset.pet;
          box.querySelectorAll('[data-pet]').forEach(function(x){ x.classList.remove('on'); });
          el.classList.add('on');
        });
      });
    }

    /* ---- dates ---- */
    var start = document.getElementById('startDate');
    var end   = document.getElementById('endDate');
    var err   = document.getElementById('dateError');

    function refresh(){
      B.startDate = start.value;
      B.endDate   = end.value;
      end.min     = start.value;

      if (new Date(end.value) <= new Date(start.value)) {
        err.textContent = 'Check-out must be after check-in.';
        err.style.display = 'block';
        document.getElementById('toPayment').disabled = true;
        return;
      }
      err.style.display = 'none';
      document.getElementById('toPayment').disabled = false;

      var q = Booking.quote(s.rate);
      var plural = q.nights > 1 ? 's' : '';
      document.getElementById('nightsLabel').textContent = q.nights + ' night' + plural;
      document.getElementById('lineLabel').textContent   = Booking.money(s.rate) + ' × ' + q.nights + ' night' + plural;
      document.getElementById('lineSub').textContent     = Booking.money(q.subtotal);
      document.getElementById('lineFee').textContent     = Booking.money(q.fee);
      document.getElementById('lineTax').textContent     = Booking.money(q.tax);
      document.getElementById('lineTotal').textContent   = Booking.money(q.total);
    }

    start.addEventListener('change', refresh);
    end.addEventListener('change', refresh);
    refresh();

    /* ---- note + continue ---- */
    var note = document.getElementById('bookNote');
    note.addEventListener('input', function(){ B.note = note.value; });

    document.getElementById('toPayment').addEventListener('click', function(){
      if (!B.petId) return UI.toast('Please add a pet first');
      Router.go('payment');
    });
  }
};
