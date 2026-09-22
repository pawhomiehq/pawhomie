/* Edit profile — full profile for owners & sitters: photo, name, phone, area, bio. */

Pages.editProfile = {
  render(){
    return `${UI.appbar('Edit profile','','settings')}
      <div class="page narrow" id="epView"><div class="muted" style="text-align:center;padding:24px">Loading…</div></div>`;
  },
  async mount(){
    var host = document.getElementById('epView');
    var p = await db.getProfile();
    if (!p){ host.innerHTML = '<div class="card" style="padding:20px;text-align:center"><div class="muted">Please sign in.</div></div>'; return; }

    var name = p.full_name || '';
    var city = p.city ? String(p.city).split(',')[0].trim() : '';
    var photo = p.photo_url || '';
    var phone = p.phone || '';
    var bio = p.bio || '';
    var isSitter = !!(window.Role && Role.isSitter());
    var CITIES = ['Toronto','North York','Scarborough','Etobicoke','East York','York','Mississauga','Brampton','Markham','Vaughan','Richmond Hill','Oakville','Pickering','Ajax','Burlington','Milton','Aurora','Newmarket','Whitby','Oshawa'];

    host.innerHTML = `
      <div class="card anim" style="padding:20px;text-align:center">
        <div class="ep-avatar" id="epAvatar">
          ${photo ? '<img src="'+photo+'" alt="">' : UI.avatar((name.charAt(0)||'?').toUpperCase(),{size:88,fs:34,gold:!!p.avatar_gold})}
        </div>
        <button class="btn ghost sm" id="epPhotoBtn" style="width:auto;padding:8px 16px;margin-top:12px">${photo?'Change photo':'Upload photo'}</button>
        <input type="file" accept="image/*" id="epPhoto" style="display:none">
      </div>

      <div class="sec">Your details</div>
      <div class="card anim d1" style="padding:16px">
        <div class="label">Full name</div>
        <input class="field" id="epName" value="${name.replace(/"/g,'&quot;')}" placeholder="Your name">
        <div class="label" style="margin-top:14px">Phone number</div>
        <input class="field" id="epPhone" type="tel" value="${phone.replace(/"/g,'&quot;')}" placeholder="(416) 555-0199">
        <div class="label" style="margin-top:14px">Your area</div>
        <select class="field" id="epCity">
          <option value="">Choose…</option>
          ${CITIES.map(function(a){ return '<option'+(city===a?' selected':'')+'>'+a+'</option>'; }).join('')}
        </select>
        <div class="label" style="margin-top:14px">${isSitter ? 'About you (owners will read this)' : 'About you (optional)'}</div>
        <textarea class="field" id="epBio" rows="3" placeholder="${isSitter ? 'Tell owners about your experience with pets…' : 'A little about you and your pets…'}">${bio.replace(/</g,'&lt;')}</textarea>
      </div>

      <div id="epErr" class="authError" style="display:none;margin-top:14px"></div>
      <div style="height:16px"></div>
      <button class="btn" id="epSave">Save changes</button>`;

    // photo upload
    var input = document.getElementById('epPhoto');
    document.getElementById('epPhotoBtn').addEventListener('click', function(){ input.click(); });
    input.addEventListener('change', async function(){
      var f = input.files && input.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)){ UI.toast('Please choose an image'); return; }
      if (f.size > 6*1024*1024){ UI.toast('Image must be under 6 MB'); return; }
      var av = document.getElementById('epAvatar');
      av.innerHTML = '<div class="skel" style="width:88px;height:88px;border-radius:50%;margin:0 auto"></div>';
      try {
        var up = await db.uploadAvatar(f);
        await db.updateProfile({ photo_url: up.url });
        av.innerHTML = '<img src="'+up.url+'" alt="">';
        if (window.Role && Role.profile) Role.profile.photo_url = up.url;
        UI.toast('Photo updated \uD83D\uDCF8');
      } catch(e){
        av.innerHTML = UI.avatar('?',{size:88,fs:34,gold:false});
        UI.toast(e.message || 'Upload failed');
      }
    });

    // save
    document.getElementById('epSave').addEventListener('click', async function(){
      var btn = this, err = document.getElementById('epErr');
      err.style.display = 'none';
      var newName = (document.getElementById('epName').value||'').trim();
      var newCity = document.getElementById('epCity').value;
      var newPhone = (document.getElementById('epPhone').value||'').trim();
      var newBio = (document.getElementById('epBio').value||'').trim();
      if (!newName){ err.textContent = 'Please enter your name.'; err.style.display='block'; return; }
      if (!newCity){ err.textContent = 'Please choose your area.'; err.style.display='block'; return; }
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await db.updateProfile({ full_name: newName, city: newCity, phone: newPhone, bio: newBio });
        if (window.Role && Role.profile){ Role.profile.full_name = newName; Role.profile.city = newCity; }
        App.searchArea = newCity;
        UI.toast('Profile saved');
        Router.go('settings');
      } catch(e){
        btn.disabled = false; btn.textContent = 'Save changes';
        err.textContent = e.message || 'Could not save.'; err.style.display='block';
      }
    });
  }
};
