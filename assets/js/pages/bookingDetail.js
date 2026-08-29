/* Booking detail — the real booking, with a status timeline + actions. */

var STATUS_LABEL = { pending:'Awaiting acceptance', accepted:'Confirmed',
  declined:'Declined', cancelled:'Cancelled', completed:'Completed' };

Pages.bookingDetail = {
  render(){
    return `${UI.appbar('Booking','','dashboard')}
      <div class="page narrow" id="bdView">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('bdView');
    var id = App.currentBookingId;

    if (!id && !window.sb){
      // mock mode with no real booking chosen — show a friendly sample
      return renderBooking(host, sampleBooking());
    }
    if (!id){
      host.innerHTML = emptyState();
      wireEmpty(host);
      return;
    }

    var b = await db.getBooking(id);
    if (!b){ host.innerHTML = emptyState(); wireEmpty(host); return; }
    renderBooking(host, b);
  }
};

function sampleBooking(){
  var s = App.currentSitter;
  var q = Booking.quote(s.rate);
  return { id:'sample', sitterProfileId:s.id, sitterName:s.name, initial:s.initial, gold:s.gold,
    petName:'Milo', startDate:Booking.state.startDate, endDate:Booking.state.endDate,
    subtotal:q.subtotal, fee:q.fee, tax:q.tax, total:q.total, status:'pending',
    note:'Milo loves morning walks.', hasReview:false };
}

function emptyState(){
  return `<div class="card" style="padding:24px;text-align:center">
    <div style="font-weight:800;margin-bottom:4px">Booking not found</div>
    <div class="muted" style="font-size:13px;margin-bottom:14px">It may have been removed.</div>
    <button class="btn sm" data-go="dashboard">Back to dashboard</button></div>`;
}
function wireEmpty(host){
  var b = host.querySelector('[data-go]');
  if (b) b.addEventListener('click', function(){ Router.go('dashboard'); });
}

function renderBooking(host, b){
  var first = (b.sitterName || 'your Paw Homie').split(' ')[0];
  var nights = Math.max(1, Math.round((new Date(b.endDate) - new Date(b.startDate)) / 86400000));
  var money = Booking.money;

  // timeline reflects the real status
  var order = ['pending','accepted','completed'];
  var idx = order.indexOf(b.status);
  function stepClass(i){
    if (b.status === 'cancelled' || b.status === 'declined') return i === 0 ? 'done' : '';
    if (i < idx) return 'done';
    if (i === idx) return 'wait';
    return '';
  }
  function dot(i, done){ return done ? UI.icon('check',15) : (i === idx ? '\u2026' : ''); }

  var cancelled = (b.status === 'cancelled' || b.status === 'declined');

  var timeline = cancelled
    ? `<div class="vstep done"><span class="vdot">${UI.icon('check',15)}</span><div><b>Request sent</b></div></div>
       <div class="vstep" style="border-top:1px solid var(--line)"><span class="vdot">\u2715</span>
         <div><b>${b.status === 'declined' ? 'Declined by ' + first : 'Cancelled'}</b></div></div>`
    : `<div class="vstep ${stepClass(0)}"><span class="vdot">${dot(0, idx>0)}</span>
         <div><b>Request sent</b><div class="muted" style="font-size:12px">The moment you booked</div></div></div>
       <div class="vstep ${stepClass(1)}" style="border-top:1px solid var(--line)"><span class="vdot">${dot(1, idx>1)}</span>
         <div><b>${idx>=1 ? 'Accepted by ' + first : 'Awaiting acceptance'}</b><div class="muted" style="font-size:12px">${idx>=1 ? '' : 'Usually within an hour'}</div></div></div>
       <div class="vstep ${stepClass(2)}" style="border-top:1px solid var(--line)"><span class="vdot">${dot(2, b.status==='completed')}</span>
         <div><b>${b.status==='completed' ? 'Stay complete' : 'Care begins'}</b><div class="muted" style="font-size:12px">${fmtRange(b.startDate,b.endDate)}</div></div></div>`;

  // actions depend on status
  var actions = '';
  if (b.status === 'pending' || b.status === 'accepted'){
    actions = `<button class="btn" id="msgBtn">Message ${first}</button>
               <button class="btn ghost" id="rescheduleBtn" style="margin-top:12px">Change dates</button>
               <button class="btn ghost" id="cancelBtn" style="margin-top:12px;color:var(--danger)">Cancel booking</button>`;
  } else if (b.status === 'completed'){
    actions = b.hasReview
      ? `<div class="card" style="padding:14px;text-align:center;margin-bottom:12px">
           <div class="muted" style="font-size:13px">You rated this stay ${'\u2605'.repeat(b.reviewRating||5)}</div></div>
         <button class="btn" id="msgBtn">Message ${first}</button>`
      : `<button class="btn" id="reviewBtn">Leave a review</button>
         <button class="btn ghost" id="msgBtn" style="margin-top:12px">Message ${first}</button>`;
  } else {
    actions = `<button class="btn ghost" id="msgBtn">Message ${first}</button>`;
  }

  var tone = (b.status==='pending') ? 'gold' : '';

  host.innerHTML = `
    <div class="card anim" style="padding:16px;display:flex;gap:13px;align-items:center">
      ${UI.avatar(b.initial,{size:52,fs:19,gold:b.gold})}
      <div style="flex:1">
        <div style="font-weight:800;font-size:15.5px">${b.sitterName}</div>
        <div class="muted" style="font-size:12.5px">${b.petName} \u00b7 ${fmtRange(b.startDate,b.endDate)} \u00b7 ${nights} night${nights>1?'s':''}</div>
      </div>
      ${UI.tag(STATUS_LABEL[b.status]||b.status, tone)}
    </div>

    ${b.note ? `<div class="card anim d1" style="padding:14px 16px;margin-top:12px">
      <div class="label" style="margin:0 0 6px">Your note</div>
      <div style="font-size:14px;font-weight:600;color:#40504D;line-height:1.5">${b.note}</div></div>` : ''}

    <div class="sec">Timeline</div>
    <div class="card anim d1" style="padding:6px 16px">${timeline}</div>

    <div class="sec">Payment ${b.status==='completed' ? '' : '(held until complete)'}</div>
    <div class="card anim d2" style="padding:6px 16px">
      <div class="prow"><span class="m">${money(b.subtotal/nights)} \u00d7 ${nights} night${nights>1?'s':''}</span><span>${money(b.subtotal)}</span></div>
      <div class="prow"><span class="m">Service fee</span><span>${money(b.fee)}</span></div>
      ${b.tax ? `<div class="prow"><span class="m">${CONFIG.TAX_LABEL||'Tax'}</span><span>${money(b.tax)}</span></div>` : ''}
      <div class="prow total"><span>Total</span><span>${money(b.total)}</span></div>
    </div>

    <div id="bdErr" class="authError" style="display:none;margin-top:14px"></div>
    <div style="height:16px"></div>
    ${actions}`;

  // wire actions
  function openMsg(){
    if (window.sb && b.sitterProfileId){
      db.getOrCreateConversation(b.sitterProfileId).then(function(c){
        App.currentConversation = c; Router.go('chat');
      }).catch(function(){ Router.go('messages'); });
    } else { Router.go('messages'); }
  }
  var msgBtn = document.getElementById('msgBtn');
  if (msgBtn) msgBtn.addEventListener('click', openMsg);

  var reviewBtn = document.getElementById('reviewBtn');
  if (reviewBtn) reviewBtn.addEventListener('click', function(){
    App.reviewFor = { bookingId:b.id, sitterId:b.sitterProfileId, sitterName:b.sitterName, initial:b.initial, gold:b.gold };
    Router.go('review');
  });

  var reBtn = document.getElementById('rescheduleBtn');
  if (reBtn) reBtn.addEventListener('click', function(){
    showRescheduleModal(b, first);
  });

  var cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', async function(){
    if (!confirm('Cancel this booking with ' + first + '?')) return;
    cancelBtn.disabled = true; cancelBtn.textContent = 'Cancelling…';
    try {
      await db.cancelBooking(b.id);
      UI.toast('Booking cancelled');
      Router.go('dashboard');
    } catch(e){
      cancelBtn.disabled = false; cancelBtn.textContent = 'Cancel booking';
      var err = document.getElementById('bdErr');
      err.textContent = e.message || 'Could not cancel. Please try again.'; err.style.display = 'block';
    }
  });
}

function showRescheduleModal(b, first){
  var wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  var startVal = b.startDate, endVal = b.endDate;
  wrap.innerHTML =
    '<div class="modal-card">' +
      '<div style="font-weight:900;font-size:17px;margin-bottom:4px">Change dates</div>' +
      '<p class="muted" style="font-size:12.5px;margin-bottom:14px">New dates will be sent to '+first+' to accept again.</p>' +
      '<div class="label">Drop-off</div>' +
      '<input class="field" type="date" id="reStart" value="'+startVal+'">' +
      '<div class="label" style="margin-top:10px">Pick-up</div>' +
      '<input class="field" type="date" id="reEnd" value="'+endVal+'">' +
      '<div id="reErr" class="authError" style="display:none;margin-top:10px"></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn ghost sm" data-cancel style="flex:1">Back</button>' +
        '<button class="btn sm" data-save style="flex:1">Save dates</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);
  function close(){ wrap.remove(); }
  wrap.addEventListener('click', function(e){ if (e.target === wrap) close(); });
  wrap.querySelector('[data-cancel]').addEventListener('click', close);
  wrap.querySelector('[data-save]').addEventListener('click', async function(){
    var s = document.getElementById('reStart').value;
    var e = document.getElementById('reEnd').value;
    var err = document.getElementById('reErr');
    if (!s || !e || e <= s){ err.textContent = 'Pick-up must be after drop-off.'; err.style.display='block'; return; }
    this.disabled = true; this.textContent = 'Saving…';
    try {
      await db.rescheduleBooking(b.id, s, e, b.rate || (b.subtotal / Math.max(1, b.nights || 1)));
      UI.toast('Dates updated — waiting for ' + first + ' to accept');
      close();
      Router.go('bookingDetail');
    } catch(err2){
      this.disabled = false; this.textContent = 'Save dates';
      err.textContent = err2.message || 'Could not update dates.'; err.style.display='block';
    }
  });
}
