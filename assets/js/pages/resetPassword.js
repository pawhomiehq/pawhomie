/* Set a new password — where the recovery email link lands. */

Pages.resetPassword = {
  render(){
    return `${UI.appbar('New password','Choose a new password','welcome')}
    <div class="page narrow">
      <div class="card anim" style="padding:20px">
        <p class="muted" style="font-size:13.5px;margin-bottom:14px">Enter a new password for your account.</p>
        <div class="label">New password</div>
        <input class="field" id="rpNew" type="password" placeholder="At least 6 characters" autocomplete="new-password">
        <div class="label" style="margin-top:12px">Confirm new password</div>
        <input class="field" id="rpConfirm" type="password" placeholder="Re-enter it" autocomplete="new-password">
        <div id="rpErr" class="authError" style="display:none;margin-top:12px"></div>
        <div style="height:16px"></div>
        <button class="btn" id="rpSave">Update password</button>
      </div>
    </div>`;
  },
  async mount(){
    var err = document.getElementById('rpErr');
    // If they arrived here without a recovery session, tell them to use the email link.
    if (window.LIVE && window.LIVE()){
      try {
        var s = await sb.auth.getSession();
        if (!s || !s.data || !s.data.session){
          err.textContent = 'This page opens from the reset link in your email. Please use that link, or request a new one from the login screen.';
          err.style.display = 'block';
        }
      } catch(e){}
    }

    document.getElementById('rpSave').addEventListener('click', async function(){
      var btn = this;
      err.style.display = 'none';
      var pw = document.getElementById('rpNew').value || '';
      var pw2 = document.getElementById('rpConfirm').value || '';
      if (pw.length < 6){ err.textContent = 'Password must be at least 6 characters.'; err.style.display='block'; return; }
      if (pw !== pw2){ err.textContent = 'The two passwords don\u2019t match.'; err.style.display='block'; return; }
      btn.disabled = true; btn.textContent = 'Updating…';
      try {
        await db.updatePassword(pw);
        UI.toast('Password updated \u2014 you\u2019re all set');
        // send them to their home (they're now logged in via the recovery session)
        Role.reset();
        await Role.load(true);
        location.hash = '#/' + Role.home();
      } catch(e){
        btn.disabled = false; btn.textContent = 'Update password';
        err.textContent = e.message || 'Could not update password. Try the email link again.';
        err.style.display = 'block';
      }
    });
  }
};
