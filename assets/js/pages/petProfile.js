/* My pets — real. List, add, edit and remove pets. */

var PETV = { mode:'list', editing:null };   // mode: 'list' | 'form'

Pages.petProfile = {
  render(){
    return `${UI.appbar('My pets','The pets your Paw Homie will care for','dashboard')}
      <div class="page narrow" id="petView">
        <div class="muted" style="text-align:center;padding:24px">Loading…</div>
      </div>`;
  },

  async mount(){
    await draw();
  }
};

async function draw(){
  var host = document.getElementById('petView');
  if (!host) return;

  if (PETV.mode === 'form') return drawForm(host);

  var pets = await db.getPets();

  if (!pets.length){
    host.innerHTML = `
      <div class="card" style="padding:26px;text-align:center">
        ${UI.photo('pet','height:150px;border-radius:16px;margin-bottom:14px')}
        <div style="font-weight:800;margin-bottom:4px">No pets added yet</div>
        <div class="muted" style="font-size:13.5px;margin-bottom:14px">Add your pet so Paw Homies know exactly who they're caring for.</div>
        <button class="btn sm" id="addPet">Add a pet</button>
      </div>`;
  } else {
    host.innerHTML = pets.map(function(p){
      var sub = [p.species, p.breed, (p.age_years != null ? p.age_years + ' yrs' : null)].filter(Boolean).join(' \u00b7 ');
      var flags = [];
      if (p.friendly_with_pets) flags.push('Friendly with other pets');
      if (p.needs_medication)  flags.push('Needs medication');
      if (p.microchipped)      flags.push('Microchipped');
      return `<div class="card anim" style="padding:14px;margin-bottom:12px">
        <div style="display:flex;gap:12px;align-items:center">
          ${UI.avatar(p.name.charAt(0).toUpperCase(),{size:48,fs:18})}
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:16px">${p.name}</div>
            <div class="muted" style="font-size:12.5px">${sub}</div>
          </div>
          <button class="btn ghost sm" data-edit="${p.id}">Edit</button>
        </div>
        ${p.notes ? `<p class="muted" style="font-size:13px;margin-top:10px;line-height:1.5">${p.notes}</p>` : ''}
        ${flags.length ? `<div class="tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${flags.map(function(t){return UI.tag(t);}).join('')}</div>` : ''}
      </div>`;
    }).join('') + `<button class="btn ghost" id="addPet" style="margin-top:4px">+ Add another pet</button>`;
  }

  var add = document.getElementById('addPet');
  if (add) add.addEventListener('click', function(){ PETV.mode='form'; PETV.editing=null; draw(); });

  host.querySelectorAll('[data-edit]').forEach(function(b){
    b.addEventListener('click', async function(){
      var all = await db.getPets();
      PETV.editing = all.find(function(x){ return String(x.id) === b.getAttribute('data-edit'); }) || null;
      PETV.mode = 'form';
      draw();
    });
  });
}

function drawForm(host){
  var p = PETV.editing || { name:'', species:'Dog', breed:'', age_years:'', notes:'',
                            friendly_with_pets:true, needs_medication:false, microchipped:false };
  var isEdit = !!PETV.editing;

  host.innerHTML = `
    <div class="card anim" style="padding:16px">
      <div class="label">Name</div>
      <input class="field" id="pName" value="${p.name || ''}" placeholder="Milo">
      <div style="display:flex;gap:12px;margin-top:14px">
        <div style="flex:1"><div class="label">Type</div>
          <select class="field" id="pSpecies">
            <option${p.species==='Dog'?' selected':''}>Dog</option>
            <option${p.species==='Cat'?' selected':''}>Cat</option>
          </select></div>
        <div style="flex:1"><div class="label">Breed</div>
          <input class="field" id="pBreed" value="${p.breed || ''}" placeholder="Beagle"></div>
      </div>
      <div class="label" style="margin-top:14px">Age (years)</div>
      <input class="field" id="pAge" type="number" min="0" max="30" value="${p.age_years != null ? p.age_years : ''}" placeholder="4">
      <div class="label" style="margin-top:14px">Notes for Paw Homies</div>
      <textarea class="field" id="pNotes" rows="3" placeholder="Loves morning walks. A little shy at first, then very cuddly.">${p.notes || ''}</textarea>
    </div>

    <div class="sec">Care details</div>
    <div class="card anim d1" style="padding:6px 16px">
      <div class="svc"><div><b>Friendly with other pets</b></div><div class="tog${p.friendly_with_pets?' on':''}" data-flag="friendly_with_pets"></div></div>
      <div class="svc" style="border-top:1px solid var(--line)"><div><b>Needs medication</b></div><div class="tog${p.needs_medication?' on':''}" data-flag="needs_medication"></div></div>
      <div class="svc" style="border-top:1px solid var(--line)"><div><b>Microchipped</b></div><div class="tog${p.microchipped?' on':''}" data-flag="microchipped"></div></div>
    </div>

    ${isEdit ? `
    <div class="sec">Vaccination record</div>
    <p class="muted anim d1" style="font-size:12.5px;margin-bottom:10px">Upload proof of vaccination so sitters know ${p.name||'your pet'} is protected. Sitters see that it\u2019s on file \u2014 not the document itself.</p>
    <div class="card anim d1 doc-row" style="border:1px dashed var(--line);border-radius:14px">
      <div class="doc-thumb" id="vaxThumb">${p.vaccination_status==='on_file'?UI.icon('check',20):UI.icon('image',20)}</div>
      <div style="flex:1;min-width:0"><b style="font-size:14px">Vaccination proof</b>
        <div class="muted" style="font-size:12px" id="vaxSub">${p.vaccination_status==='on_file'?'On file \u2713':'Not uploaded yet'}</div></div>
      <button class="btn ghost sm" style="width:auto;padding:8px 14px" id="vaxUpload">${p.vaccination_status==='on_file'?'Change':'Upload'}</button>
      <input type="file" accept="image/*,application/pdf" id="vaxFile" style="display:none">
    </div>` : ''}

    <div id="petErr" class="authError" style="display:none;margin-top:14px"></div>

    <div style="height:16px"></div>
    <button class="btn" id="savePet">${isEdit ? 'Save changes' : 'Add pet'}</button>
    <button class="btn ghost" id="cancelPet" style="margin-top:10px">Cancel</button>
    ${isEdit ? '<button class="btn ghost" id="delPet" style="margin-top:10px;color:var(--danger)">Remove this pet</button>' : ''}`;

  // vaccination upload (edit mode only)
  var vaxInput = document.getElementById('vaxFile');
  if (vaxInput){
    document.getElementById('vaxUpload').addEventListener('click', function(){ vaxInput.click(); });
    vaxInput.addEventListener('change', async function(){
      var f = vaxInput.files && vaxInput.files[0];
      if (!f) return;
      if (f.size > 8*1024*1024){ UI.toast('Please pick a file under 8 MB'); return; }
      var sub = document.getElementById('vaxSub'); if (sub) sub.textContent = 'Uploading…';
      try {
        var up = await db.uploadOwnerDoc('pet-' + p.id + '-vax', f);
        await db.savePetVaccination(p.id, up.path, null);
        if (sub) sub.textContent = 'On file \u2713';
        var thumb = document.getElementById('vaxThumb'); if (thumb) thumb.innerHTML = UI.icon('check',20);
        UI.toast('Vaccination record saved \uD83D\uDC3E');
      } catch(e){ if (sub) sub.textContent = 'Upload failed'; UI.toast(e.message || 'Upload failed'); }
    });
  }

  host.querySelectorAll('[data-flag]').forEach(function(t){
    t.addEventListener('click', function(){ t.classList.toggle('on'); });
  });

  document.getElementById('cancelPet').addEventListener('click', function(){
    PETV.mode='list'; PETV.editing=null; draw();
  });

  var del = document.getElementById('delPet');
  if (del) del.addEventListener('click', async function(){
    if (!confirm('Remove ' + (p.name || 'this pet') + '? This cannot be undone.')) return;
    del.disabled = true;
    try { await db.deletePet(p.id); UI.toast('Pet removed'); PETV.mode='list'; PETV.editing=null; draw(); }
    catch(e){ del.disabled = false; showPetErr(e.message || 'Could not remove pet'); }
  });

  document.getElementById('savePet').addEventListener('click', async function(){
    var btn = this;
    var name = (document.getElementById('pName').value || '').trim();
    if (!name) return showPetErr('Please give your pet a name.');
    var ageRaw = document.getElementById('pAge').value;
    var age = ageRaw === '' ? null : Number(ageRaw);
    if (age !== null && (isNaN(age) || age < 0 || age > 30)) return showPetErr('Please enter an age between 0 and 30.');

    var data = {
      name: name,
      species: document.getElementById('pSpecies').value,
      breed: (document.getElementById('pBreed').value || '').trim() || null,
      age_years: age,
      notes: (document.getElementById('pNotes').value || '').trim() || null
    };
    host.querySelectorAll('[data-flag]').forEach(function(t){
      data[t.getAttribute('data-flag')] = t.classList.contains('on');
    });

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      if (PETV.editing) await db.updatePet(PETV.editing.id, data);
      else await db.addPet(data);
      UI.toast(PETV.editing ? 'Pet updated' : name + ' added \uD83D\uDC3E');
      PETV.mode='list'; PETV.editing=null;
      await draw();
    } catch(e){
      btn.disabled = false; btn.textContent = PETV.editing ? 'Save changes' : 'Add pet';
      showPetErr(/sign in/i.test(e.message) ? 'Please log in first.' : (e.message || 'Could not save.'));
    }
  });
}

function showPetErr(msg){
  var b = document.getElementById('petErr');
  if (!b) return;
  b.textContent = msg; b.style.display = 'block';
}
