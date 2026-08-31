/* Sign up / Log in — wired to real Supabase auth via db.* */

var AUTH = { mode: 'signup', role: 'owner' };

Pages.signup = {
  render() {
    var isSignup = AUTH.mode === 'signup';
    return `
  ${UI.appbar(isSignup ? 'Join PawHomie' : 'Welcome back',
              isSignup ? "One account — pick how you'll start" : 'Log in to your account',
              'welcome')}
  <div class="page narrow">

    <div class="seg anim" id="authSeg" style="margin-bottom:16px">
      <span class="${isSignup ? 'on' : ''}" data-mode="signup">Sign up</span>
      <span class="${!isSignup ? 'on' : ''}" data-mode="login">Log in</span>
    </div>

    ${isSignup ? `
    <div class="card anim" style="padding:16px;margin-bottom:14px">
      <div class="label">Full name</div>
      <input class="field" id="authName" placeholder="e.g. Jordan Lee" autocomplete="name">
      <div class="label" style="margin-top:14px">Your area</div>
      <select class="field" id="authCity">
        <option value="">Select your area…</option>
        <option>Toronto</option><option>North York</option><option>Scarborough</option>
        <option>Etobicoke</option><option>East York</option><option>York</option>
        <option>Mississauga</option><option>Brampton</option><option>Markham</option>
        <option>Vaughan</option><option>Richmond Hill</option><option>Oakville</option>
        <option>Pickering</option><option>Ajax</option><option>Burlington</option>
      </select>
      <div class="muted" style="font-size:11.5px;margin-top:7px">We use this to show Paw Homies near you.</div>
    </div>` : ''}

    <div class="card anim d1" style="padding:16px;margin-bottom:14px">
      <div class="label">Email</div>
      <input class="field" id="authEmail" type="email" placeholder="you@email.com" autocomplete="email">
      <div class="label" style="margin-top:14px">Password</div>
      <input class="field" id="authPass" type="password" placeholder="At least 6 characters"
             autocomplete="${isSignup ? 'new-password' : 'current-password'}">
      ${!isSignup ? '<div style="text-align:right;margin-top:8px"><a id="forgotLink" style="font-size:12.5px;font-weight:700;color:var(--teal);cursor:pointer">Forgot password?</a></div>' : ''}
    </div>

    ${isSignup ? `
    <div class="label anim d2">I'm joining as</div>
    <div class="grid cards anim d2" style="margin-bottom:16px" id="rolePick">
      <div class="card role ${AUTH.role === 'owner' ? 'on' : ''}" data-role="owner"
           style="padding:16px;display:flex;gap:12px;align-items:center;cursor:pointer">
        ${UI.icon('user',26)}
        <div><div style="font-weight:800">I need pet care</div>
             <div class="muted" style="font-size:12.5px">Find &amp; book a Paw Homie</div></div>
      </div>
      <div class="card role ${AUTH.role === 'sitter' ? 'on' : ''}" data-role="sitter"
           style="padding:16px;display:flex;gap:12px;align-items:center;cursor:pointer">
        <span style="font-size:24px">🐾</span>
        <div><div style="font-weight:800">I want to be a Paw Homie</div>
             <div class="muted" style="font-size:12.5px">Offer care, set your rates</div></div>
      </div>
    </div>` : ''}

    <div id="authError" class="authError" style="display:none"></div>

    <button class="btn anim d3" id="authBtn">${isSignup ? 'Create account' : 'Log in'}</button>
    <div class="or-divider anim d3"><span>or</span></div>
    <button class="btn ghost google-btn anim d3" id="googleBtn">
      <svg width="17" height="17" viewBox="0 0 18 18" style="vertical-align:-3px;margin-right:8px"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>
      Continue with Google
    </button>

    <p class="muted anim d3" style="text-align:center;margin-top:14px;font-size:13px">
      ${isSignup ? 'Already have an account?' : 'New here?'}
      <b style="color:var(--teal-dk);cursor:pointer" data-mode="${isSignup ? 'login' : 'signup'}">
        ${isSignup ? 'Log in' : 'Create one'}
      </b>
    </p>
  </div>`;
  },

  mount() {
    // switch between Sign up / Log in
    document.querySelectorAll('[data-mode]').forEach(function (el) {
      el.addEventListener('click', function () {
        AUTH.mode = el.dataset.mode;
        Router.go('signup');
      });
    });

    // role picker
    var pick = document.getElementById('rolePick');
    if (pick) {
      pick.querySelectorAll('[data-role]').forEach(function (el) {
        el.addEventListener('click', function () {
          AUTH.role = el.dataset.role;
          pick.querySelectorAll('[data-role]').forEach(function (x) { x.classList.remove('on'); });
          el.classList.add('on');
        });
      });
    }

    var btn = document.getElementById('authBtn');
    if (btn) btn.addEventListener('click', submit);

    var gbtn = document.getElementById('googleBtn');
    if (gbtn) gbtn.addEventListener('click', async function(){
      gbtn.disabled = true;
      try { await db.signInWithGoogle(); }  // redirects to Google
      catch(e){ gbtn.disabled = false; UI.toast(e.message || 'Google sign-in unavailable — enable it in Supabase'); }
    });

    var forgot = document.getElementById('forgotLink');
    if (forgot) forgot.addEventListener('click', async function(){
      var email = (document.getElementById('authEmail').value || '').trim();
      if (!email || email.indexOf('@') < 1){ UI.toast('Enter your email above first'); return; }
      forgot.textContent = 'Sending…';
      try {
        await db.sendPasswordReset(email);
        UI.toast('Check your email for a reset link');
        forgot.textContent = 'Reset link sent \u2713';
      } catch(e){
        forgot.textContent = 'Forgot password?';
        UI.toast(e.message || 'Could not send reset email');
      }
    });

    // Enter key submits
    ['authEmail', 'authPass', 'authName'].forEach(function (id) {
      var f = document.getElementById(id);
      if (f) f.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });
  }
};

function showErr(msg) {
  var box = document.getElementById('authError');
  if (!box) return;
  box.textContent = msg;
  box.style.display = 'block';
}
function clearErr() {
  var box = document.getElementById('authError');
  if (box) box.style.display = 'none';
}

async function submit() {
  clearErr();
  var isSignup = AUTH.mode === 'signup';
  var btn   = document.getElementById('authBtn');
  var email = (document.getElementById('authEmail').value || '').trim();
  var pass  = document.getElementById('authPass').value || '';
  var name  = isSignup ? (document.getElementById('authName').value || '').trim() : '';
  var city  = isSignup ? (document.getElementById('authCity').value || '').trim() : '';

  // validation
  if (isSignup && !name)            return showErr('Please enter your name.');
  if (isSignup && !city)            return showErr('Please choose your area.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showErr('Please enter a valid email address.');
  if (pass.length < 6)              return showErr('Password must be at least 6 characters.');

  btn.disabled = true;
  btn.textContent = isSignup ? 'Creating account…' : 'Logging in…';

  try {
    if (isSignup) {
      var res = await db.signUp(email, pass, name, city);

      if (res.needsConfirm) {
        showConfirmScreen(email);
        return;
      }

      await db.setRole(AUTH.role);
      Role.reset();
      UI.toast('Welcome to PawHomie! 🐾');
      await Role.load(true);
      Router.go(afterAuth(AUTH.role === 'sitter' ? 'sitterDashboard' : 'search'));

    } else {
      await db.signIn(email, pass);
      Role.reset();
      var profile = await Role.load(true);
      UI.toast('Welcome back!');
      Router.go(afterAuth(profile && profile.is_sitter && !profile.is_owner ? 'sitterDashboard' : 'dashboard'));
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = isSignup ? 'Create account' : 'Log in';
    showErr(friendly(e.message));
  }
}

/* Supabase errors are terse — make them human. */
function friendly(msg) {
  msg = msg || 'Something went wrong.';
  if (/already registered|already exists/i.test(msg)) return 'That email already has an account. Try logging in.';
  if (/invalid login credentials/i.test(msg))         return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg))               return 'Please confirm your email first — check your inbox.';
  if (/rate limit|too many/i.test(msg))               return 'Too many attempts. Wait a minute and try again.';
  if (/password/i.test(msg) && /short|least/i.test(msg)) return 'Password must be at least 6 characters.';
  return msg;
}

/* If the visitor was trying to reach a page before signing up, take them
   back to it — as long as their new role is actually allowed there. */
function afterAuth(fallback){
  var want = window.RETURN_TO;
  window.RETURN_TO = null;
  if (want && window.ACCESS && Role.can(window.ACCESS[want] || 'user')) return want;
  return fallback;
}

/* A clear "check your email" screen shown right after signup, so it never
   feels like nothing happened. */
function showConfirmScreen(email){
  var view = document.getElementById('view');
  if (!view) return;
  view.innerHTML =
    '<div class="page narrow" style="text-align:center;padding-top:40px">' +
      '<div style="font-size:52px;margin-bottom:8px">📬</div>' +
      '<h1 style="font-size:22px;font-weight:900;color:var(--teal-dk);margin-bottom:8px">Confirm your email</h1>' +
      '<p class="muted" style="font-size:14px;line-height:1.55;max-width:320px;margin:0 auto 6px">' +
        'We sent a confirmation link to<br><b style="color:var(--ink)">' + email + '</b></p>' +
      '<p class="muted" style="font-size:13.5px;line-height:1.55;max-width:320px;margin:0 auto 22px">' +
        'Open it and click the link, then come back and log in. Your account isn\'t active until you confirm.</p>' +
      '<button class="btn" id="cs-login" style="max-width:280px;margin:0 auto">I\'ve confirmed — log in</button>' +
      '<button class="btn ghost" id="cs-resend" style="max-width:280px;margin:10px auto 0">Resend the email</button>' +
      '<p class="muted" style="font-size:12px;margin-top:18px">Wrong address? <a id="cs-back" style="color:var(--teal);cursor:pointer;font-weight:700">Go back</a></p>' +
    '</div>';
  document.getElementById('cs-login').addEventListener('click', function(){
    if (window.AUTH) window.AUTH.mode = 'login';
    Router.go('signup');
  });
  document.getElementById('cs-back').addEventListener('click', function(){
    if (window.AUTH) window.AUTH.mode = 'signup';
    Router.go('signup');
  });
  document.getElementById('cs-resend').addEventListener('click', async function(){
    this.disabled = true; this.textContent = 'Sending…';
    try { await db.resendConfirmation(email); UI.toast('Sent! Check your inbox'); this.textContent = 'Email resent ✓'; }
    catch(e){ this.disabled = false; this.textContent = 'Resend the email'; UI.toast(e.message || 'Could not resend'); }
  });
}
