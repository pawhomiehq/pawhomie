/* My bookings — everything an owner has booked, grouped by status. */

Pages.bookings = {
  render(){
    return `${UI.appbar('My bookings','Your requests and stays','dashboard')}
      <div class="page narrow" id="bkView">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('bkView');
    var all = await db.getMyBookings();

    if (!all.length){
      host.innerHTML = `<div class="card" style="padding:26px;text-align:center">
        <div style="font-size:30px;margin-bottom:8px">\uD83D\uDC3E</div>
        <div style="font-weight:800;margin-bottom:4px">No bookings yet</div>
        <div class="muted" style="font-size:13.5px;margin-bottom:14px">Find a Paw Homie near you and send your first request.</div>
        <button class="btn sm" data-go="search">Find a Paw Homie</button>
      </div>`;
      return;
    }

    // group
    var groups = {
      pending:   { title:'Waiting for acceptance', items:[] },
      accepted:  { title:'Confirmed',              items:[] },
      completed: { title:'Completed',              items:[] },
      other:     { title:'Cancelled & declined',   items:[] }
    };
    all.forEach(function(b){
      if (b.status === 'pending')   groups.pending.items.push(b);
      else if (b.status === 'accepted') groups.accepted.items.push(b);
      else if (b.status === 'completed') groups.completed.items.push(b);
      else groups.other.items.push(b);
    });

    var LABEL = { pending:'Awaiting acceptance', accepted:'Confirmed', declined:'Declined',
                  cancelled:'Cancelled', completed:'Completed' };
    var TONE  = { pending:'gold', accepted:'ok', declined:'', cancelled:'', completed:'ok' };

    function card(b){
      var isPending = b.status === 'pending';
      return `<div class="card anim bkcard" data-booking="${b.id}" style="padding:14px;margin-bottom:10px;display:flex;gap:13px;align-items:center;cursor:pointer">
        ${UI.avatar(b.initial,{size:48,fs:18,gold:b.gold})}
        <div style="flex:1;min-width:0">
          <div style="font-weight:800;font-size:15px">${b.sitterName}</div>
          <div class="muted" style="font-size:12.5px;margin-top:2px">${b.petName?b.petName+' \u00b7 ':''}${b.dates} \u00b7 ${Booking.money(b.total)}</div>
          ${isPending ? '<div class="muted" style="font-size:11.5px;margin-top:5px">\u23f3 Waiting for '+b.sitterName.split(' ')[0]+' to accept</div>' : ''}
        </div>
        ${UI.tag(LABEL[b.status]||b.status, TONE[b.status]||'')}
      </div>`;
    }

    var html = '';
    ['pending','accepted','completed','other'].forEach(function(key){
      var g = groups[key];
      if (!g.items.length) return;
      html += '<div class="sec">'+g.title+' <span class="muted" style="font-weight:700">('+g.items.length+')</span></div>';
      html += g.items.map(card).join('');
    });
    host.innerHTML = html;

    host.querySelectorAll('[data-booking]').forEach(function(el){
      el.addEventListener('click', function(){
        App.currentBookingId = el.getAttribute('data-booking');
        Router.go('bookingDetail');
      });
    });
  }
};
