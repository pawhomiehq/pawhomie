/* Verification — the Paw Homie application:
     Step 1: details + document uploads (ID, selfie, home, yard)
     Step 2: the 10-question care quiz (80% to pass)
   Both must be done before the application goes to the admin (status 'pending').
*/

var VS = { view:'status', i:0, answers:[], files:{}, previews:{} };

var DOCS = [
  { key:'id',     label:'Government ID',   hint:'Driver\u2019s licence, passport or health card', required:true,
    guide:{ title:'Before you upload your ID',
      do:['Lay it flat on a plain surface','Bright, even lighting','All four corners visible','Text sharp and readable'],
      dont:['Blurry or out of focus','Glare or shadows across it','Cut-off edges or corners','Cropped so details are hidden'] } },
  { key:'selfie', label:'A photo of you',  hint:'Clear photo of your face', required:true,
    guide:{ title:'Before you upload your photo',
      do:['Face clearly visible, looking at the camera','Good, even lighting','Plain background','Just you in the frame'],
      dont:['Sunglasses, hats or masks','Dark, backlit or shaky','Heavy filters','Group photos'] } },
  { key:'home',   label:'Your home',       hint:'Where the pet will stay', required:true },
  { key:'yard',   label:'Backyard / walk area', hint:'Optional', required:false }
];

Pages.verification = {
  render(){
    return `${UI.appbar('Application','Get verified to accept bookings','sitterDashboard')}
      <div class="page narrow" id="vView"><div class="muted" style="text-align:center;padding:24px">Loading…</div></div>`;
  },
  async mount(){
    VS = { view:'status', i:0, answers:[], files:{}, previews:{} };
    await drawV();
  }
};

async function drawV(){
  var host = document.getElementById('vView');
  if (!host) return;
  if (VS.view === 'application') return drawApplication(host);
  if (VS.view === 'quiz')        return drawQuestion(host);
  if (VS.view === 'result')      return drawResult(host);

  // ---- status / checklist ----
  var app = await db.getApplication();
  VS.app = app || {};
  var status = app ? app.status : 'draft';
  var docs = (app && app.documents) || {};
  var detailsDone = !!(app && app.phone && app.home_type && docs.id && docs.selfie && docs.home);
  var quizDone = !!(app && app.quiz_passed);
  var score = app ? app.quiz_score : null;

  if (status === 'approved'){
    host.innerHTML = vbadge('#1E9E6A', UI.icon('check',30), 'You\u2019re approved \uD83C\uDF89',
      'Owners can find and book you.' + (score!=null?' Your care-quiz score of '+score+'% shows on your profile.':''),
      '<button class="btn" data-go="services">Manage my listing</button>');
    wireGo(host); return;
  }
  if (status === 'pending'){
    host.innerHTML = vbadge('#C98F27', UI.icon('clock',30), 'Application under review',
      'Thanks! We\u2019re reviewing your details, documents and quiz score' + (score!=null?' ('+score+'%)':'') + '. We\u2019ll be in touch soon.',
      '<button class="btn ghost" data-go="sitterDashboard">Back to dashboard</button>');
    wireGo(host); return;
  }

  // draft (or rejected) → checklist
  var rejected = status === 'rejected';
  host.innerHTML = `
    ${rejected ? vbadge('#C64B3B', UI.icon('bell',28), 'Not approved last time', 'You can update your details and retake the quiz, then resubmit.', '') : ''}
    <div class="card anim" style="padding:20px;text-align:center;margin-bottom:16px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--tint);color:var(--teal);display:grid;place-items:center;margin:0 auto 10px">${UI.icon('shield',28)}</div>
      <div style="font-weight:900;font-size:18px;margin-bottom:4px">Two steps to get verified</div>
      <p class="muted" style="font-size:13.5px;line-height:1.5">Owners trust Paw Homies who are verified. Finish both steps and our team reviews your application.</p>
    </div>

    <div class="step-row card anim d1 ${detailsDone?'done':''}" id="stepDetails">
      <div class="step-ic">${detailsDone?UI.icon('check',20):'1'}</div>
      <div style="flex:1"><b>Your details &amp; documents</b><div class="muted" style="font-size:12.5px">${detailsDone?'Completed':'Address, home type, ID and photos'}</div></div>
      <span class="step-go">${detailsDone?'Edit':'Start'} \u203a</span>
    </div>

    <div class="step-row card anim d1 ${quizDone?'done':''}" id="stepQuiz" style="margin-top:10px">
      <div class="step-ic">${quizDone?UI.icon('check',20):'2'}</div>
      <div style="flex:1"><b>Care quiz</b><div class="muted" style="font-size:12.5px">${quizDone?('Passed'+(score!=null?' \u00b7 '+score+'%':'')):(window.QUIZ.questions.length+' questions \u00b7 '+Math.round(window.QUIZ.passMark*100)+'% to pass')}</div></div>
      <span class="step-go">${quizDone?'Retake':'Start'} \u203a</span>
    </div>

    <div id="vErr" class="authError" style="display:none;margin-top:14px"></div>
    <div style="height:16px"></div>
    <button class="btn" id="submitApp" ${detailsDone&&quizDone?'':'disabled'}>Submit application</button>
    ${!(detailsDone&&quizDone)?'<p class="muted" style="font-size:12px;text-align:center;margin-top:10px">Finish both steps to submit.</p>':''}`;

  document.getElementById('stepDetails').addEventListener('click', function(){ VS.view='application'; drawV(); });
  document.getElementById('stepQuiz').addEventListener('click', function(){ VS.view='quiz'; VS.i=0; VS.answers=[]; drawV(); });

  document.getElementById('submitApp').addEventListener('click', async function(){
    var btn = this; btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      // details + quiz already saved; flip the application to 'pending'
      await db.submitForReview();
      UI.toast('Application submitted \uD83C\uDF89');
      VS.view='status'; drawV();
    } catch(e){
      btn.disabled = false; btn.textContent = 'Submit application';
      var err=document.getElementById('vErr'); err.textContent=e.message||'Could not submit.'; err.style.display='block';
    }
  });
}

/* ---------- Step 1: details + uploads ---------- */
function drawApplication(host){
  var a = VS.app || {};
  var docs = a.documents || {};

  host.innerHTML = `
    <div class="card anim" style="padding:16px">
      <div class="label">Phone number</div>
      <input class="field" id="aPhone" type="tel" value="${a.phone||''}" placeholder="(416) 555-0199">
      <div class="label" style="margin-top:14px">Address</div>
      <input class="field" id="aAddress" value="${a.address||''}" placeholder="Street, area">
      <div style="display:flex;gap:12px;margin-top:14px">
        <div style="flex:1"><div class="label">Home type</div>
          <select class="field" id="aHomeType">
            <option value="">Choose…</option>
            ${['House','Apartment','Condo','Townhouse'].map(function(t){return '<option'+(a.home_type===t?' selected':'')+'>'+t+'</option>';}).join('')}
          </select></div>
      </div>
      <div class="svc" style="margin-top:14px"><div><b>I have a backyard / outdoor space</b></div><div class="tog${a.has_yard?' on':''}" id="aYard"></div></div>
    </div>

    <div class="sec">Documents</div>
    <p class="muted anim d1" style="font-size:12.5px;margin-bottom:10px">These stay private \u2014 only our review team sees them.</p>
    <div id="docList">
      ${DOCS.map(function(d){
        var have = VS.previews[d.key] || docs[d.key];
        return `<div class="doc-row card anim d1" data-doc="${d.key}">
          <div class="doc-thumb" id="thumb-${d.key}">${VS.previews[d.key]?('<img src="'+VS.previews[d.key]+'">'):(docs[d.key]?UI.icon('check',20):UI.icon('image',20))}</div>
          <div style="flex:1;min-width:0">
            <b style="font-size:14px">${d.label}${d.required?'':' <span class="muted" style="font-weight:600">(optional)</span>'}</b>
            <div class="muted" style="font-size:12px">${have?'Selected \u2713':d.hint}</div>
          </div>
          <button class="btn ghost sm" style="width:auto;padding:8px 14px" data-upload="${d.key}">${have?'Change':'Upload'}</button>
          <input type="file" accept="image/*" data-file="${d.key}" style="display:none">
        </div>`;
      }).join('')}
    </div>

    <div id="appErr" class="authError" style="display:none;margin-top:14px"></div>
    <div style="height:16px"></div>
    <button class="btn" id="saveApp">Save &amp; continue</button>
    <button class="btn ghost" id="cancelApp" style="margin-top:10px">Back</button>`;

  document.getElementById('aYard').addEventListener('click', function(){ this.classList.toggle('on'); });
  document.getElementById('cancelApp').addEventListener('click', function(){ VS.view='status'; drawV(); });

  // Upload buttons — show photo guidance first for ID & selfie (error prevention)
  host.querySelectorAll('[data-upload]').forEach(function(btn){
    var key = btn.getAttribute('data-upload');
    var doc = DOCS.filter(function(d){ return d.key===key; })[0];
    var input = host.querySelector('[data-file="'+key+'"]');
    btn.addEventListener('click', function(){
      if (doc && doc.guide){ showPhotoGuide(doc.guide, function(){ input.click(); }); }
      else { input.click(); }
    });
  });

  // file pickers → local preview immediately
  host.querySelectorAll('[data-file]').forEach(function(inp){
    inp.addEventListener('change', function(){
      var f = inp.files && inp.files[0];
      if (!f) return;
      if (f.size > 8*1024*1024){ UI.toast('Please pick an image under 8 MB'); return; }
      var key = inp.getAttribute('data-file');
      VS.files[key] = f;
      var url = URL.createObjectURL(f);
      VS.previews[key] = url;
      var thumb = document.getElementById('thumb-'+key);
      if (thumb) thumb.innerHTML = '<img src="'+url+'">';
      var row = inp.closest('.doc-row');
      if (row){ var sub = row.querySelector('.muted'); if (sub) sub.textContent = 'Selected \u2713'; }
    });
  });

  document.getElementById('saveApp').addEventListener('click', async function(){
    var btn = this, err = document.getElementById('appErr');
    err.style.display = 'none';
    var phone = (document.getElementById('aPhone').value||'').trim();
    var homeType = document.getElementById('aHomeType').value;
    if (!phone){ err.textContent='Please add a phone number.'; err.style.display='block'; return; }
    if (!homeType){ err.textContent='Please choose your home type.'; err.style.display='block'; return; }

    // required docs: either newly picked, or already uploaded
    var existing = (VS.app && VS.app.documents) || {};
    var missing = DOCS.filter(function(d){ return d.required && !VS.files[d.key] && !existing[d.key]; });
    if (missing.length){ err.textContent='Please add: '+missing.map(function(d){return d.label;}).join(', ')+'.'; err.style.display='block'; return; }

    btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      var documents = Object.assign({}, existing);
      // upload each newly-picked file
      var keys = Object.keys(VS.files);
      for (var i=0;i<keys.length;i++){
        var res = await db.uploadDoc(keys[i], VS.files[keys[i]]);
        documents[keys[i]] = res.path;
      }
      await db.saveApplication({
        phone: phone,
        address: (document.getElementById('aAddress').value||'').trim(),
        home_type: homeType,
        has_yard: document.getElementById('aYard').classList.contains('on'),
        documents: documents
      });
      UI.toast('Details saved');
      VS.files = {};
      VS.view = 'status';
      await drawV();
    } catch(e){
      btn.disabled = false; btn.textContent = 'Save & continue';
      err.textContent = e.message || 'Could not save. Please try again.'; err.style.display = 'block';
    }
  });
}

/* ---------- Step 2: quiz (unchanged logic) ---------- */
function drawQuestion(host){
  var Q = window.QUIZ.questions, total = Q.length, i = VS.i, q = Q[i], chosen = VS.answers[i];
  host.innerHTML = `
    <div class="quiz-progress anim"><div class="quiz-bar"><span style="width:${Math.round(i/total*100)}%"></span></div>
      <div class="muted" style="font-size:12.5px;margin-top:6px">Question ${i+1} of ${total}</div></div>
    <div class="card anim d1" style="padding:20px;margin-top:12px">
      <div style="font-weight:800;font-size:16px;line-height:1.4;margin-bottom:16px">${q.q}</div>
      <div id="opts">${q.options.map(function(opt,idx){return '<button class="quiz-opt'+(chosen===idx?' sel':'')+'" data-opt="'+idx+'"><span class="quiz-letter">'+String.fromCharCode(65+idx)+'</span><span>'+opt+'</span></button>';}).join('')}</div>
    </div>
    <div style="height:16px"></div>
    <button class="btn" id="nextQ" ${chosen==null?'disabled':''}>${i+1===total?'Finish':'Next'}</button>
    ${i>0?'<button class="btn ghost" id="prevQ" style="margin-top:10px">Back</button>':'<button class="btn ghost" id="exitQ" style="margin-top:10px">Cancel</button>'}`;
  host.querySelectorAll('[data-opt]').forEach(function(b){
    b.addEventListener('click', function(){ VS.answers[i]=+b.getAttribute('data-opt');
      host.querySelectorAll('[data-opt]').forEach(function(x){x.classList.remove('sel');}); b.classList.add('sel');
      var nb=document.getElementById('nextQ'); if(nb) nb.disabled=false; });
  });
  document.getElementById('nextQ').addEventListener('click', function(){
    if (VS.answers[i]==null) return;
    if (i+1===total){ VS.view='result'; } else { VS.i++; } drawV();
  });
  var prev=document.getElementById('prevQ'); if(prev) prev.addEventListener('click',function(){VS.i--;drawV();});
  var exit=document.getElementById('exitQ'); if(exit) exit.addEventListener('click',function(){VS.view='status';drawV();});
}

async function drawResult(host){
  var Q = window.QUIZ.questions, correct = 0;
  Q.forEach(function(q,idx){ if (VS.answers[idx]===q.answer) correct++; });
  var percent = Math.round(correct/Q.length*100);
  var passed = (correct/Q.length) >= window.QUIZ.passMark;
  host.innerHTML = `<div class="card anim" style="padding:24px;text-align:center">
    <div class="quiz-score-ring ${passed?'pass':'fail'}">${percent}%</div>
    <div style="font-weight:900;font-size:19px;margin:14px 0 4px">${passed?'You passed! \uD83D\uDC3E':'Not quite there'}</div>
    <p class="muted" style="font-size:14px;line-height:1.5;margin-bottom:16px">You got ${correct} of ${Q.length} right. ${passed?'One step closer \u2014 finish your application to submit.':'You need '+Math.round(window.QUIZ.passMark*100)+'% to pass. Review the care tips and try again.'}</p>
    <div id="qErr" class="authError" style="display:none;margin-bottom:12px"></div>
    <button class="btn" id="finishQuiz">${passed?'Save result':'Try again'}</button></div>`;
  document.getElementById('finishQuiz').addEventListener('click', async function(){
    if (!passed){ VS.view='quiz'; VS.i=0; VS.answers=[]; drawV(); return; }
    var btn=this; btn.disabled=true; btn.textContent='Saving…';
    try { await db.submitQuiz(percent, true); /* record pass, status flips only at final submit */
      // note: passing 'false' keeps status until the app is submitted from the checklist
      await db.saveApplication({}); // no-op merge
      VS.view='status'; await drawV();
    } catch(e){ btn.disabled=false; btn.textContent='Save result'; var er=document.getElementById('qErr'); er.textContent=e.message||'Could not save.'; er.style.display='block'; }
  });
}

function vbadge(color, icon, title, body, action){
  return `<div class="card anim" style="padding:22px;text-align:center;margin-bottom:16px">
    <div style="width:60px;height:60px;border-radius:50%;background:${color}22;color:${color};display:grid;place-items:center;margin:0 auto 12px">${icon}</div>
    <div style="font-weight:900;font-size:18px;margin-bottom:6px">${title}</div>
    <p class="muted" style="font-size:14px;line-height:1.55;margin-bottom:${action?'16px':'0'}">${body}</p>${action}</div>`;
}
function wireGo(host){ host.querySelectorAll('[data-go]').forEach(function(b){ b.addEventListener('click',function(){ Router.go(b.getAttribute('data-go')); }); }); }

/* Guidance modal shown before uploading ID / selfie (Nielsen: error prevention). */
function showPhotoGuide(guide, onContinue){
  var wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML =
    '<div class="modal-card">' +
      '<div style="font-weight:900;font-size:17px;margin-bottom:4px">'+guide.title+'</div>' +
      '<p class="muted" style="font-size:12.5px;margin-bottom:14px">A clear photo gets you approved faster. Blurry or unclear photos are likely to be rejected.</p>' +
      '<div class="guide-cols">' +
        '<div><div class="guide-h ok">\u2713 Do</div><ul class="guide-list">'+
          guide.do.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>' +
        '<div><div class="guide-h bad">\u2717 Avoid</div><ul class="guide-list bad">'+
          guide.dont.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>' +
      '</div>' +
      '<p class="muted" style="font-size:11.5px;margin:14px 0 0">If any of these problems are in your photo, there\u2019s a high chance it\u2019ll be rejected \u2014 please upload a clean, clear copy.</p>' +
      '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button class="btn ghost sm" data-cancel style="flex:1">Cancel</button>' +
        '<button class="btn sm" data-continue style="flex:1">Got it, choose photo</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap);
  function close(){ wrap.remove(); }
  wrap.addEventListener('click', function(e){ if (e.target === wrap) close(); });
  wrap.querySelector('[data-cancel]').addEventListener('click', close);
  wrap.querySelector('[data-continue]').addEventListener('click', function(){ close(); onContinue(); });
}
