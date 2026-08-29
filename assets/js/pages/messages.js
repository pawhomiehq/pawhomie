/* Messages — list of conversations. Tapping one opens that thread. */

Pages.messages = {
  render(){
    return `${UI.appbar('Messages','','dashboard')}<div class="page narrow" id="convList">
      <div class="muted" style="text-align:center;font-size:13px;padding:24px">Loading…</div>
    </div>`;
  },

  async mount(){
    var host = document.getElementById('convList');
    var cs = await db.getConversations();

    if (!cs.length) {
      host.innerHTML = `<div class="card" style="padding:24px;text-align:center">
        <div style="font-size:30px;margin-bottom:6px">💬</div>
        <div style="font-weight:800;margin-bottom:4px">No messages yet</div>
        <div class="muted" style="font-size:13px;margin-bottom:12px">Find a Paw Homie and say hello.</div>
        <button class="btn sm" data-go="search">Find care</button>
      </div>`;
      return;
    }

    host.innerHTML = cs.map(function(c){
      return `<div class="card conv anim" data-conv="${c.id}" style="margin-bottom:12px;cursor:pointer">
        ${UI.avatar(c.initial,{size:46,fs:16,gold:c.gold})}
        <div style="flex:1;min-width:0">
          <div class="row-sb"><b>${c.name}</b><span class="muted" style="font-size:11px">${c.time}</span></div>
          <div class="muted ell" style="font-size:13px;margin-top:2px">${c.last}</div>
        </div>
      </div>`;
    }).join('');

    host.querySelectorAll('[data-conv]').forEach(function(el){
      el.addEventListener('click', function(){
        var c = cs.find(function(x){ return String(x.id) === el.dataset.conv; });
        App.currentConversation = c || null;   // chat.js reads this
        Router.go('chat');
      });
    });
  }
};
