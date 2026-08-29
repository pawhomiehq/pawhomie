/* Video intro call — request a real call. The owner proposes a time; it's
   sent to the sitter as a real message + notification. No fake in-app call. */
window.Video = (function(){
  function sheetEl(){ return document.getElementById('sheet'); }

  function nextDays(n){
    var out=[], d=new Date();
    for(var i=1;i<=n;i++){ var x=new Date(d); x.setDate(d.getDate()+i);
      out.push({ iso:x.toISOString().slice(0,10),
                 label:x.toLocaleDateString('en-CA',{weekday:'short',day:'numeric'}) }); }
    return out;
  }

  function openSheet(){
    var s=App.currentSitter; if(!s){ return; }
    var first=(s.name||'the sitter').split(' ')[0];
    var days=nextDays(5);
    var times=['9:00 AM','12:00 PM','3:00 PM','5:30 PM','7:00 PM'];
    sheetEl().innerHTML = `
      <div class="grab"></div>
      <h2 style="font-size:19px;font-weight:900;color:var(--teal-dk)">Request a video call \uD83D\uDCF9</h2>
      <p class="muted" style="font-size:13px;margin-top:4px">Propose a time for a free 15-min intro call with ${first}. They'll confirm and you'll both get a link by message.</p>
      <div class="label" style="margin-top:18px">Pick a day</div>
      <div class="slotrow" id="vDays">${days.map(function(d,i){return '<span class="slot'+(i===0?' on':'')+'" data-day="'+d.iso+'">'+d.label+'</span>';}).join('')}</div>
      <div class="label" style="margin-top:14px">Pick a time</div>
      <div class="slotrow" id="vTimes">${times.map(function(t,i){return '<span class="slot'+(i===0?' on':'')+'" data-time="'+t+'">'+t+'</span>';}).join('')}</div>
      <div style="height:20px"></div>
      <div id="vErr" class="authError" style="display:none;margin-bottom:10px"></div>
      <button class="btn gold" id="sendCallReq">Send call request</button>`;
    sheetEl().querySelectorAll('.slotrow').forEach(function(row){
      row.addEventListener('click',function(e){ var sl=e.target.closest('.slot'); if(!sl)return;
        row.querySelectorAll('.slot').forEach(function(x){x.classList.remove('on');}); sl.classList.add('on'); });
    });
    document.getElementById('sendCallReq').addEventListener('click', sendRequest);
    document.getElementById('sheetBg').classList.add('active'); sheetEl().classList.add('active');
  }

  function closeSheet(){ document.getElementById('sheetBg').classList.remove('active'); sheetEl().classList.remove('active'); }

  async function sendRequest(){
    var s=App.currentSitter;
    var day=(document.querySelector('#vDays .slot.on')||{}).getAttribute && document.querySelector('#vDays .slot.on').getAttribute('data-day');
    var time=(document.querySelector('#vTimes .slot.on')||{}).getAttribute && document.querySelector('#vTimes .slot.on').getAttribute('data-time');
    var btn=document.getElementById('sendCallReq'), err=document.getElementById('vErr');
    if(!day||!time){ err.textContent='Please pick a day and time.'; err.style.display='block'; return; }
    if(window.Role && Role.isGuest()){ closeSheet(); UI.toast('Please sign in to request a call'); Router.go('signup'); return; }
    btn.disabled=true; btn.textContent='Sending…';
    var pretty=new Date(day).toLocaleDateString('en-CA',{weekday:'long',month:'short',day:'numeric'});
    var msg='\uD83D\uDCF9 Video call request: '+pretty+' at '+time+'. Are you free for a quick 15-min intro?';
    try{
      var conv=await db.getOrCreateConversation(s.id);
      await db.sendMessage(msg, conv.id);
      closeSheet();
      UI.toast('Call request sent to '+ (s.name||'the sitter').split(' ')[0]);
      App.currentConversation=conv; Router.go('chat');
    }catch(e){
      btn.disabled=false; btn.textContent='Send call request';
      err.textContent=(e && e.message) || 'Could not send. Please try again.'; err.style.display='block';
    }
  }

  var bg=document.getElementById('sheetBg');
  if(bg) bg.addEventListener('click', closeSheet);
  return { openSheet:openSheet, closeSheet:closeSheet };
})();
