/* Owner ID verification — upload a government ID so sitters can trust you. */

var OV = { file:null, preview:null };

var OWNER_ID_GUIDE = {
  title: 'Before you upload your ID',
  do: ['Lay it flat on a plain surface', 'Bright, even lighting', 'All four corners visible', 'Text sharp and readable'],
  dont: ['Blurry or out of focus', 'Glare or shadows across it', 'Cut-off edges or corners', 'Cropped so details are hidden']
};

Pages.ownerVerification = {
  render(){
    return `${UI.appbar('Verify your ID','Helps sitters trust you','dashboard')}
      <div class="page narrow" id="ovView"><div class="muted" style="text-align:center;padding:24px">Loading…</div></div>`;
  },
  async mount(){
    OV = { file:null, preview:null };
    await drawOV();
  }
};

async function drawOV(){
  var host = document.getElementById('ovView');
  if (!host) return;
  var v = await db.getOwnerVerification();
  var status = v ? v.id_status : 'unverified';

  if (status === 'verified'){
    host.innerHTML = ovBadge('#1E9E6A', UI.icon('check',30), 'You\u2019re verified \uD83C\uDF89',
      'Sitters can see you\u2019re a verified pet owner. Thanks for helping keep PawHomie safe.',
      '<button class="btn" data-go="dashboard">Back to home</button>');
    wireOVGo(host); return;
  }
  if (status === 'pending'){
    host.innerHTML = ovBadge('#C98F27', UI.icon('clock',30), 'ID under review',
      'Thanks! We\u2019re checking your ID. This usually takes a little while \u2014 you can keep using PawHomie in the meantime.',
      '<button class="btn ghost" data-go="dashboard">Back to home</button>');
    wireOVGo(host); return;
  }

  var rejected = status === 'rejected';
  host.innerHTML = `
    ${rejected ? ovBadge('#C64B3B', UI.icon('bell',26), 'ID wasn\u2019t accepted', 'The photo wasn\u2019t clear enough. Please upload a clean, well-lit copy.', '') : ''}
    <div class="card anim" style="padding:18px">
      <div style="font-weight:900;font-size:17px;margin-bottom:4px">Government ID</div>
      <p class="muted" style="font-size:13px;line-height:1.5;margin-bottom:14px">A driver\u2019s licence, passport or health card. This stays private \u2014 only our review team sees it, never sitters.</p>
      <div class="doc-row" style="border:1px dashed var(--line);border-radius:14px">
        <div class="doc-thumb" id="ovThumb">${OV.preview?('<img src="'+OV.preview+'">'):UI.icon('image',20)}</div>
        <div style="flex:1;min-width:0"><b style="font-size:14px">Photo of your ID</b>
          <div class="muted" style="font-size:12px" id="ovSub">${OV.file?'Selected \u2713':'Tap upload to choose'}</div></div>
        <button class="btn ghost sm" style="width:auto;padding:8px 14px" id="ovUpload">${OV.file?'Change':'Upload'}</button>
        <input type="file" accept="image/*" id="ovFile" style="display:none">
      </div>
    </div>
    <div id="ovErr" class="authError" style="display:none;margin-top:14px"></div>
    <div style="height:16px"></div>
    <button class="btn" id="ovSubmit">Submit for verification</button>`;

  var input = document.getElementById('ovFile');
  document.getElementById('ovUpload').addEventListener('click', function(){
    // reuse the shared photo-guidance modal from verification.js
    if (typeof showPhotoGuide === 'function') showPhotoGuide(OWNER_ID_GUIDE, function(){ input.click(); });
    else input.click();
  });
  input.addEventListener('change', function(){
    var f = input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)){ UI.toast('Please choose an image'); return; }
    if (f.size > 8*1024*1024){ UI.toast('Please pick an image under 8 MB'); return; }
    OV.file = f; OV.preview = URL.createObjectURL(f);
    var thumb = document.getElementById('ovThumb'); if (thumb) thumb.innerHTML = '<img src="'+OV.preview+'">';
    var sub = document.getElementById('ovSub'); if (sub) sub.textContent = 'Selected \u2713';
  });

  document.getElementById('ovSubmit').addEventListener('click', async function(){
    var btn = this, err = document.getElementById('ovErr');
    err.style.display = 'none';
    if (!OV.file){ err.textContent = 'Please upload a photo of your ID first.'; err.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      var up = await db.uploadOwnerDoc('id', OV.file);
      await db.submitOwnerId(up.path);
      UI.toast('ID submitted for review \uD83C\uDF89');
      await drawOV();
    } catch(e){
      btn.disabled = false; btn.textContent = 'Submit for verification';
      err.textContent = e.message || 'Could not submit. Try again.'; err.style.display = 'block';
    }
  });
}

function ovBadge(color, icon, title, body, action){
  return `<div class="card anim" style="padding:22px;text-align:center;margin-bottom:16px">
    <div style="width:60px;height:60px;border-radius:50%;background:${color}22;color:${color};display:grid;place-items:center;margin:0 auto 12px">${icon}</div>
    <div style="font-weight:900;font-size:18px;margin-bottom:6px">${title}</div>
    <p class="muted" style="font-size:14px;line-height:1.55;margin-bottom:${action?'16px':'0'}">${body}</p>${action}</div>`;
}
function wireOVGo(host){ host.querySelectorAll('[data-go]').forEach(function(b){ b.addEventListener('click',function(){ Router.go(b.getAttribute('data-go')); }); }); }
