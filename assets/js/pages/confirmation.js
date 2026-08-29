/* Confirmation — reflects the booking that was actually saved. */

Pages.confirmation = {
  render() {
    var s     = App.currentSitter;
    var first = s.name.split(' ')[0];
    var last  = App.lastBooking;
    var q     = last ? last.quote : Booking.quote(s.rate);
    var dates = last ? fmtRange(last.dates.start, last.dates.end)
                     : fmtRange(Booking.state.startDate, Booking.state.endDate);
    var petName = (App.lastPetName || 'your pet');

    return `
  <div class="page narrow">
    <div class="prog" style="padding-top:40px"><span class="d done"></span><span class="d done"></span><span class="d on"></span></div>
    <div class="confwrap">
      <div class="check">${UI.icon('check',46)}</div>
      <h1>You're all set! 🎉</h1>
      <p class="lead">Your request for ${petName} (${dates}) is on its way. You'll hear the moment ${first} accepts.</p>

      <div class="card" style="width:100%;max-width:420px;padding:14px 16px;margin-top:24px;text-align:left;display:flex;gap:12px;align-items:center">
        ${UI.avatar(s.initial,{size:44,fs:16,gold:s.gold})}
        <div style="flex:1">
          <div style="font-weight:800">${s.name}</div>
          <div class="muted" style="font-size:12.5px">House sitting · ${Booking.money(q.total)} · held until complete</div>
        </div>
      </div>

      <div style="width:100%;max-width:420px;margin-top:20px">
        <button class="btn" data-go="messages">Message ${first}</button>
        <button class="btn ghost" data-go="dashboard" style="margin-top:12px">Go to my bookings</button>
      </div>
    </div>
  </div>`;
  },

  async mount() {
    if (window.App && window.App._confetti) window.App._confetti();
    // fill in the pet's real name if we can
    if (!App.lastPetName && Booking.state.petId) {
      var pets = await db.getPets();
      var p = pets.find(function(x){ return x.id === Booking.state.petId; });
      if (p) {
        App.lastPetName = p.name;
        var lead = document.querySelector('.confwrap .lead');
        if (lead) lead.textContent = lead.textContent.replace('your pet', p.name);
      }
    }
  }
};
