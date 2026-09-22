/* Real video call — powered by Daily.co. Both people join the same private
   room for their conversation. No recording. */

Pages.videoCall = {
  render(){
    var name = (App.currentConversation && App.currentConversation.name) || 'your Paw Homie';
    return `${UI.appbar('Video call','with '+name,'chat')}
    <div class="page" id="vcPage">
      <div id="vcStatus" class="card" style="padding:20px;text-align:center;margin-top:8px">
        <div class="muted" style="font-size:14px">Connecting your call\u2026</div>
      </div>
      <div id="vcFrame" class="vc-frame"></div>
    </div>`;
  },
  async mount(){
    var conv = App.currentConversation;
    var status = document.getElementById('vcStatus');
    var frameBox = document.getElementById('vcFrame');

    if (!conv || !conv.id){
      status.innerHTML = '<div class="muted">Open a conversation first, then start a call from there.</div>';
      return;
    }
    if (!window.DailyIframe){
      status.innerHTML = '<div class="muted">Video calling couldn\u2019t load. Please refresh and try again.</div>';
      return;
    }

    var callFrame = null;
    try {
      var room = await db.getVideoRoom(conv.id);
      if (!room || !room.url) throw new Error('No room');

      status.style.display = 'none';
      callFrame = window.DailyIframe.createFrame(frameBox, {
        showLeaveButton: true,
        iframeStyle: { width:'100%', height:'100%', border:'0', borderRadius:'18px' }
      });

      callFrame.on('left-meeting', function(){
        try { callFrame.destroy(); } catch(e){}
        UI.toast('Call ended');
        Router.go('chat');
      });
      callFrame.on('error', function(){
        status.style.display = 'block';
        status.innerHTML = '<div class="muted">The call ran into a problem. Please try again.</div>';
      });

      await callFrame.join({ url: room.url, token: room.token });
    } catch(e){
      status.style.display = 'block';
      status.innerHTML = '<div class="authError" style="display:block">'+
        (e.message || 'Could not start the call.') +
        '</div><button class="btn ghost sm" id="vcBack" style="width:auto;padding:8px 16px;margin-top:12px">Back to chat</button>';
      var back = document.getElementById('vcBack');
      if (back) back.addEventListener('click', function(){ Router.go('chat'); });
      if (callFrame){ try { callFrame.destroy(); } catch(_){} }
    }

    // clean up if they navigate away
    window.__vcCleanup = function(){ if (callFrame){ try{ callFrame.destroy(); }catch(e){} } window.__vcCleanup=null; };
  }
};
