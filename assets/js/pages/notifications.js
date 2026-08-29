/* Notifications — real, loaded from the database. */

Pages.notifications = {
  render(){
    return `${UI.appbar('Notifications','','dashboard')}
      <div class="page narrow" id="notifList">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    var host = document.getElementById('notifList');
    var items = await db.getNotifications();

    if (!items.length){
      host.innerHTML = `<div class="card" style="padding:26px;text-align:center">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--tint);color:var(--teal);display:grid;place-items:center;margin:0 auto 10px">${UI.icon('bell',24)}</div>
        <div style="font-weight:800;margin-bottom:4px">You're all caught up</div>
        <div class="muted" style="font-size:13.5px">Booking updates and messages will show up here.</div>
      </div>`;
      return;
    }

    function iconFor(title){
      var t = (title || '').toLowerCase();
      if (t.indexOf('message') > -1) return { ic:'msg',   tint:'var(--tint2)' };
      if (t.indexOf('video')   > -1) return { ic:'video', tint:'var(--tint2)' };
      if (t.indexOf('accept')  > -1 || t.indexOf('confirm') > -1 || t.indexOf('booking') > -1) return { ic:'check', tint:'var(--tint)' };
      return { ic:'bell', tint:'var(--tint)' };
    }

    host.innerHTML = items.map(function(n){
      var meta = iconFor(n.title);
      return `<div class="card anim notif${n.read ? '' : ' unread'}" style="padding:14px;display:flex;gap:12px;align-items:flex-start;margin-bottom:10px">
        <div class="qa-ic" style="width:40px;height:40px;margin:0;background:${meta.tint};color:var(--teal);flex:none">${UI.icon(meta.ic,18)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${n.title}</div>
          ${n.body ? `<div class="muted" style="font-size:12.5px;margin-top:2px;line-height:1.45">${n.body}</div>` : ''}
          <div class="muted" style="font-size:11.5px;margin-top:4px">${timeAgoLabel(n.created_at)}</div>
        </div>
        ${n.read ? '' : '<span class="notif-dot"></span>'}
      </div>`;
    }).join('');

    // mark everything read (after a beat, so the unread dots are visible first)
    setTimeout(function(){ db.markNotificationsRead(); }, 1200);
  }
};

function timeAgoLabel(iso){
  if (!iso) return '';
  var mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + ' min ago';
  if (mins < 1440) return Math.floor(mins/60) + 'h ago';
  var d = Math.floor(mins/1440);
  return d === 1 ? 'Yesterday' : d + ' days ago';
}
