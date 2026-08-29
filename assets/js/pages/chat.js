/* Chat — real messages, live via Supabase Realtime. */

Pages.chat = {
  render() {
    var c = App.currentConversation || { name:'Messages', initial:'?', gold:false };
    return `
  ${UI.appbar(c.name, '', 'messages')}
  <div class="page narrow" style="padding-bottom:110px">
    <div style="text-align:right;margin-bottom:4px"><a id="reportConvo" style="font-size:12px;font-weight:700;color:var(--muted);cursor:pointer">Report conversation</a></div>
    <div class="thread" id="thread">
      <div class="muted" style="text-align:center;font-size:13px;padding:20px">Loading…</div>
    </div>
  </div>
  <div class="msgbar">
    <input id="msgIn" placeholder="Message…" autocomplete="off">
    <button class="send" id="msgSend">${UI.icon('msg',20)}</button>
  </div>`;
  },

  async mount() {
    var thread = document.getElementById('thread');
    var input  = document.getElementById('msgIn');
    var btn    = document.getElementById('msgSend');
    var conv   = App.currentConversation;
    if (conv && conv.id && db.markConversationRead){ db.markConversationRead(conv.id).catch(function(){}); }

    var rep = document.getElementById('reportConvo');    if (rep) rep.addEventListener('click', async function(){
      if (!conv || !conv.id) return;
      var reason = prompt('What\u2019s wrong with this conversation? (optional)');
      if (reason === null) return;
      try { await db.fileReport('conversation', conv.id, reason); UI.toast('Reported \u2014 our team will review it'); }
      catch(e){ UI.toast(e.message || 'Could not report'); }
    });

    /* ---- mock mode: keep the old scripted demo ---- */
    if (!window.sb) {
      thread.innerHTML =
        `<div class="bub them">Hi! I'd love to look after Milo 🐾 Does he get along with other dogs?</div>
         <div class="bub me">Hi Sara! Yes, he's super friendly.</div>
         <div class="bub them">Perfect — my backyard's fully fenced, lots of room to play.</div>`;
      wire(function(text){
        add('me', text);
        var t = document.createElement('div');
        t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>';
        thread.appendChild(t); scroll();
        setTimeout(function(){
          t.remove();
          add('them', "Sounds perfect! I'll get everything ready for Milo. 🐾");
        }, 1400);
      });
      return;
    }

    /* ---- live mode ---- */
    if (!conv || !conv.id) {
      thread.innerHTML = `<div class="muted" style="text-align:center;font-size:13px;padding:24px">
        Open a conversation from Messages.</div>`;
      return;
    }

    var me = await db.currentUser();
    if (!me) {
      thread.innerHTML = `<div class="muted" style="text-align:center;font-size:13px;padding:24px">
        Please log in to see your messages.</div>`;
      return;
    }

    var seen = {};   // ids we've already drawn, so realtime can't double-post

    function draw(m) {
      if (seen[m.id]) return;
      seen[m.id] = true;
      add(m.sender_id === me.id ? 'me' : 'them', m.body);
    }

    var msgs = await db.getMessages(conv.id);
    thread.innerHTML = '';
    if (!msgs.length) {
      thread.innerHTML = `<div class="muted" style="text-align:center;font-size:13px;padding:24px">
        Say hello 🐾</div>`;
    } else {
      msgs.forEach(draw);
    }
    scroll();

    // live updates
    var channel = db.subscribeMessages(conv.id, function(m){ draw(m); scroll(); });

    // stop listening when we leave this page
    if (App._chatChannel) db.unsubscribe(App._chatChannel);
    App._chatChannel = channel;
    window.addEventListener('hashchange', function cleanup(){
      db.unsubscribe(channel);
      App._chatChannel = null;
      window.removeEventListener('hashchange', cleanup);
    });

    wire(async function(text){
      var placeholder = add('me', text, true);   // show instantly
      try {
        await db.sendMessage(text, conv.id);
        // the realtime INSERT will deliver the real row; drop the placeholder
        placeholder.remove();
      } catch (e) {
        placeholder.classList.add('failed');
        placeholder.title = 'Not sent — tap to retry';
        placeholder.addEventListener('click', function(){
          placeholder.remove();
          input.value = text;
          input.focus();
        });
        UI.toast(/sign in/i.test(e.message) ? 'Please log in to send messages' : 'Message not sent');
        console.error('sendMessage:', e);
      }
    });

    /* ---- helpers ---- */
    function add(side, text, pending) {
      var empty = thread.querySelector('.muted');
      if (empty) empty.remove();
      var b = document.createElement('div');
      b.className = 'bub ' + side + (pending ? ' pending' : '');
      b.textContent = text;
      thread.appendChild(b);
      scroll();
      return b;
    }
    function scroll(){ window.scrollTo(0, document.body.scrollHeight); }
    function wire(onSend) {
      function go(){
        var v = (input.value || '').trim();
        if (!v) return;
        input.value = '';
        onSend(v);
      }
      btn.addEventListener('click', go);
      input.addEventListener('keydown', function(e){ if (e.key === 'Enter') go(); });
    }
  }
};
