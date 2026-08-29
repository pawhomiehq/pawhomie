/* Availability — a real calendar. Tap a day to open/block it. Saved live. */

Pages.availability = {
  render(){
    return `${UI.appbar('Availability','Tap a day to open or block it','sitterDashboard')}
      <div class="page narrow" id="avView">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('avView');
    var base = new Date(); base.setDate(1);
    var state = { month: base.getMonth(), year: base.getFullYear(), map: {} };

    async function load(){
      var first = new Date(state.year, state.month, 1);
      var last  = new Date(state.year, state.month + 1, 0);
      state.map = await db.getMyAvailability(isoDate(first), isoDate(last));
      draw();
    }

    function draw(){
      var monthName = new Date(state.year, state.month, 1)
        .toLocaleDateString('en-CA', { month:'long', year:'numeric' });
      var firstDow = new Date(state.year, state.month, 1).getDay();
      var days = new Date(state.year, state.month + 1, 0).getDate();
      var todayIso = isoDate(new Date());

      var cells = '';
      for (var i=0;i<firstDow;i++) cells += '<div class="cal-cell empty"></div>';
      for (var d=1; d<=days; d++){
        var iso = state.year + '-' + pad(state.month+1) + '-' + pad(d);
        var status = state.map[iso];                 // open | blocked | booked | undefined
        var past = iso < todayIso;
        var cls = 'cal-cell';
        if (past) cls += ' past';
        else if (status === 'booked') cls += ' booked';
        else if (status === 'blocked') cls += ' blocked';
        else cls += ' open';                         // default = open
        cells += '<div class="'+cls+'" data-day="'+iso+'" '+(past||status==='booked'?'':'data-tap')+'>'+d+'</div>';
      }

      host.innerHTML = `
        <div class="cal-head anim">
          <button class="cal-nav" id="prevM">\u2039</button>
          <div class="cal-month">${monthName}</div>
          <button class="cal-nav" id="nextM">\u203a</button>
        </div>
        <div class="cal-dow">${['S','M','T','W','T','F','S'].map(function(x){return '<span>'+x+'</span>';}).join('')}</div>
        <div class="cal-grid card anim d1" style="padding:10px">${cells}</div>
        <div class="cal-legend anim d2">
          <span><i class="dot open"></i> Open</span>
          <span><i class="dot blocked"></i> Blocked</span>
          <span><i class="dot booked"></i> Booked</span>
        </div>
        <p class="muted anim d2" style="font-size:12.5px;text-align:center;margin-top:10px">Owners can only request dates you've left open. Booked days are locked.</p>`;

      document.getElementById('prevM').addEventListener('click', function(){
        state.month--; if (state.month<0){ state.month=11; state.year--; } load();
      });
      document.getElementById('nextM').addEventListener('click', function(){
        state.month++; if (state.month>11){ state.month=0; state.year++; } load();
      });

      host.querySelectorAll('[data-tap]').forEach(function(cell){
        cell.addEventListener('click', async function(){
          var iso = cell.getAttribute('data-day');
          var isOpen = cell.classList.contains('open');
          var next = isOpen ? 'blocked' : 'open';
          // optimistic flip
          cell.classList.toggle('open', next==='open');
          cell.classList.toggle('blocked', next==='blocked');
          try { await db.setAvailability(iso, next); state.map[iso] = next; }
          catch(e){
            cell.classList.toggle('open', isOpen);
            cell.classList.toggle('blocked', !isOpen);
            UI.toast('Could not update that day');
          }
        });
      });
    }

    await load();
  }
};

function pad(n){ return n < 10 ? '0'+n : ''+n; }
