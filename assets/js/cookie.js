/* Cookie consent — privacy-first. Shows once; remembers the choice.
   PawHomie only uses essential storage (login/session), so this is a clear
   notice with accept / essential-only, no hidden tracking. */
(function(){
  var KEY = 'pawhomie-cookie-consent';

  function getConsent(){
    try { return localStorage.getItem(KEY); } catch(e){ return null; }
  }
  function setConsent(v){
    try { localStorage.setItem(KEY, v); } catch(e){}
  }

  function show(){
    if (getConsent()) return;                 // already chose
    if (document.getElementById('cookieBar')) return;

    var bar = document.createElement('div');
    bar.id = 'cookieBar';
    bar.innerHTML =
      '<div class="cookie-in">' +
        '<div class="cookie-txt">We use essential cookies to keep you signed in and to run PawHomie. ' +
          'We don\u2019t use tracking or advertising cookies. ' +
          '<a data-go="privacy" class="cookie-link">Privacy Policy</a></div>' +
        '<div class="cookie-btns">' +
          '<button class="btn ghost sm" id="cookieEssential" style="width:auto;padding:9px 16px">Essential only</button>' +
          '<button class="btn sm" id="cookieAccept" style="width:auto;padding:9px 18px">Got it</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add('show'); });

    function close(choice){
      setConsent(choice);
      bar.classList.remove('show');
      setTimeout(function(){ if(bar.parentNode) bar.remove(); }, 300);
    }
    document.getElementById('cookieAccept').addEventListener('click', function(){ close('all'); });
    document.getElementById('cookieEssential').addEventListener('click', function(){ close('essential'); });
    // tapping the Privacy link routes via the global data-go handler; keep the bar up
  }

  // show after the app has loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(show, 800);
  } else {
    window.addEventListener('DOMContentLoaded', function(){ setTimeout(show, 800); });
  }

  window.CookieConsent = { show: show, reset: function(){ try{ localStorage.removeItem(KEY); }catch(e){} } };
})();
