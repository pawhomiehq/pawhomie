/* Payment — real Stripe checkout.
   Creates the booking, holds the funds via Stripe (authorize now, capture
   after the stay), using a secure card field. Secret key lives server-side. */

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

    <div class="label anim d1" style="margin-top:20px">Card details</div>
    <div id="cardElement" class="field anim d1" style="padding:14px 12px"></div>
    <div id="cardErrors" class="authError" style="display:none;margin-top:8px"></div>

    <div class="card anim d2" style="padding:13px 15px;margin-top:18px;display:flex;gap:11px;align-items:flex-start;background:var(--tint)">
      <span style="color:var(--teal);flex:none;margin-top:1px">${UI.icon('lock',20)}</span>
      <div style="font-size:12.5px;color:var(--teal-dk);font-weight:700;line-height:1.45">
        Your card is held (not charged) now. The payment is only captured once the stay is complete — and released back if the sitter declines.
      </div>
    </div>

    <div id="payError" class="authError" style="display:none;margin-top:14px"></div>

    <div class="actionbar"><button class="btn" id="payBtn">Hold ${Booking.money(q.total)} &amp; request</button></div>
  </div>`;
  },

  async mount() {
    var s   = App.currentSitter;
    var q   = Booking.quote(s.rate);
    var B   = Booking.state;
    var btn = document.getElementById('payBtn');
    var err = document.getElementById('payError');
    var cardErrors = document.getElementById('cardErrors');
    var busy = false;
    var stripe = null, card = null, clientSecret = null, intentId = null, bookingId = null;

    var stripeReady = !!(window.Stripe && CONFIG.STRIPE_PUBLISHABLE_KEY &&
                         CONFIG.STRIPE_PUBLISHABLE_KEY.indexOf('pk_') === 0 && window.LIVE && window.LIVE());

    if (stripeReady) {
      try {
        var made = await db.createBooking({
          sitterId:s.id, petId:B.petId, startDate:B.startDate, endDate:B.endDate,
          subtotal:q.subtotal, serviceFee:q.fee, tax:q.tax, total:q.total, note:B.note
        });
        bookingId = made.booking ? made.booking.id : null;
      } catch(e){
        err.textContent = /sign in/i.test(e.message) ? 'Please log in before booking.' : (e.message||'Could not start booking.');
        err.style.display = 'block'; btn.disabled = true; return;
      }

      try {
        var hold = await db.createPaymentHold(q.total, bookingId, 'PawHomie stay with ' + s.name, s.id);
        clientSecret = hold.clientSecret; intentId = hold.id;
      } catch(e){
        err.textContent = e.message || 'Could not set up payment. Please try again.';
        err.style.display = 'block'; btn.disabled = true; return;
      }

      stripe = Stripe(CONFIG.STRIPE_PUBLISHABLE_KEY);
      var elements = stripe.elements();
      card = elements.create('card', {
        style: { base: { fontSize:'16px', fontFamily:'Nunito, sans-serif', color:'#22302E',
                         '::placeholder':{ color:'#9AA6A3' } } }
      });
      card.mount('#cardElement');
      card.on('change', function(ev){
        if (ev.error){ cardErrors.textContent = ev.error.message; cardErrors.style.display='block'; }
        else { cardErrors.style.display='none'; }
      });
    }

    btn.addEventListener('click', async function () {
      if (busy) return; busy = true;
      err.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Processing…';

      try {
        if (stripeReady) {
          var result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: card } });
          if (result.error) throw new Error(result.error.message);
          await db.attachPaymentToBooking(bookingId, intentId);
          App.lastBooking = { quote:q, dates:{ start:B.startDate, end:B.endDate }, id: bookingId };
          Router.go('confirmation');
        } else {
          var res = await db.createBooking({
            sitterId:s.id, petId:B.petId, startDate:B.startDate, endDate:B.endDate,
            subtotal:q.subtotal, serviceFee:q.fee, tax:q.tax, total:q.total, note:B.note
          });
          App.lastBooking = { quote:q, dates:{ start:B.startDate, end:B.endDate }, id: res.booking ? res.booking.id : null };
          Router.go('confirmation');
        }
      } catch (e) {
        busy = false; btn.disabled = false;
        btn.textContent = 'Hold ' + Booking.money(q.total) + ' & request';
        err.textContent = e.message || 'Payment failed. Please check your card and try again.';
        err.style.display = 'block';
        console.error('payment failed:', e);
      }
    });
  }
};
