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
  if (!email || email.indexOf('@') < 1) return showErr('Please enter a valid email address.');
  if (pass.length < 6)              return showErr('Password must be at least 6 characters.');

  btn.disabled = true;
  btn.textContent = isSignup ? 'Creating account…' : 'Logging in…';

  try {
    if (isSignup) {
      var res = await db.signUp(email, pass, name, city);

      if (res.needsConfirm) {
        btn.disabled = false;
        btn.textContent = 'Create account';
        return showErr('Almost there — check your inbox and click the confirmation link, then log in.');
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
