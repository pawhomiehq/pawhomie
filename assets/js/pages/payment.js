/* Payment — saves the real booking row.
   NOTE: card fields are still UI-only. No money moves until Stripe is
   wired in (needs Stripe Connect + a server-side piece). */

Pages.payment = {
  render() {
    var s = App.currentSitter;
    var q = Booking.quote(s.rate);
    var plural = q.nights > 1 ? 's' : '';

    return `
  ${UI.appbar('Payment','Secure checkout · Stripe','booking')}
  <div class="page narrow">
    <div class="prog anim"><span class="d done"></span><span class="d on"></span><span class="d"></span></div>

    <div class="card anim" style="padding:14px 16px;margin-top:8px">
      <div class="row-sb" style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px">
          ${UI.avatar(s.initial,{size:38,fs:14,gold:s.gold})}
          <div><div style="font-weight:800;font-size:14px">${s.name}</div>
               <div class="muted" style="font-size:12px">${fmtRange(Booking.state.startDate, Booking.state.endDate)} · ${q.nights} night${plural}</div></div>
        </div>
      </div>
      <div class="prow"><span class="m">${Booking.money(s.rate)} × ${q.nights} night${plural}</span><span>${Booking.money(q.subtotal)}</span></div>
      <div class="prow"><span class="m">Service fee</span><span>${Booking.money(q.fee)}</span></div>
      <div class="prow"><span class="m">${q.taxLabel}</span><span>${Booking.money(q.tax)}</span></div>
      <div class="prow total"><span>Total due</span><span>${Booking.money(q.total)}</span></div>
    </div>

    <div class="label anim d1" style="margin-top:20px">Card number</div>
    <input class="field anim d1" value="4242 4242 4242 4242" inputmode="numeric">
    <div style="display:flex;gap:12px;margin-top:14px" class="anim d2">
      <div style="flex:1"><div class="label">Expiry</div><input class="field" value="08 / 28"></div>
      <div style="flex:1"><div class="label">CVC</div><input class="field" value="123"></div>
    </div>

    <div class="card anim d2" style="padding:13px 15px;margin-top:18px;display:flex;gap:11px;align-items:flex-start;background:var(--tint)">
      <span style="color:var(--teal);flex:none;margin-top:1px">${UI.icon('lock',20)}</span>
      <div style="font-size:12.5px;color:var(--teal-dk);font-weight:700;line-height:1.45">
        Your payment is held safely and only released once the booking is complete.
      </div>
    </div>

    <div id="payError" class="authError" style="display:none;margin-top:14px"></div>

    <div class="actionbar"><button class="btn" id="payBtn">Pay ${Booking.money(q.total)} &amp; confirm</button></div>
  </div>`;
  },

  mount() {
    var btn = document.getElementById('payBtn');
    var err = document.getElementById('payError');
    var s   = App.currentSitter;
    var busy = false;   // guard: never create two bookings on a double-tap

    btn.addEventListener('click', async function () {
      if (busy) return;
      busy = true;
      err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Confirming…';

      var q = Booking.quote(s.rate);
      var B = Booking.state;

      try {
        var res = await db.createBooking({
          sitterId:   B.sitterId || s.id,
          petId:      B.petId,
          startDate:  B.startDate,
          endDate:    B.endDate,
          subtotal:   q.subtotal,
          serviceFee: q.fee,
          tax:        q.tax,
          total:      q.total,
          note:       B.note
        });
        App.lastBooking = { quote:q, dates:{ start:B.startDate, end:B.endDate }, id: res.booking ? res.booking.id : null };
        Router.go('confirmation');
      } catch (e) {
        busy = false;
        btn.disabled = false;
        btn.textContent = 'Pay ' + Booking.money(q.total) + ' & confirm';
        err.textContent = /sign in/i.test(e.message)
          ? 'Please log in before booking.'
          : (e.message || 'Could not save your booking. Please try again.');
        err.style.display = 'block';
        console.error('createBooking failed:', e);
      }
    });
  }
};
