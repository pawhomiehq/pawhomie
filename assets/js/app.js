/* global click routing + effects + init */
document.addEventListener('click', function(e){
  var btn=e.target.closest('.btn'); if(btn){ ripple(e, btn); }
  var nv=e.target.closest('[data-nav]');
  if(nv){ e.preventDefault(); window.SCROLL_TO=nv.getAttribute('data-nav');
          if((location.hash||'#/welcome').indexOf('welcome')>-1 || location.hash===''){ if(window.Pages.welcome) Router.go('welcome'); }
          else { location.hash='#/welcome'; } return; }
  var au=e.target.closest('[data-auth]');
  if(au){ e.preventDefault(); if(window.AUTH){ window.AUTH.mode=au.getAttribute('data-auth'); } location.hash='#/signup'; return; }
  var go=e.target.closest('[data-go]'); if(go){ e.preventDefault();
    var dest=go.getAttribute('data-go');
    if(dest==='__logout'){
      (async function(){ try{ await db.signOut(); }catch(_){} Role.reset(); UI.toast('Logged out'); location.hash='#/welcome'; })();
      return;
    }
    location.hash='#/'+dest;
  }
});
function ripple(e, b){
  var r=document.createElement('span'); r.className='rip';
  var rect=b.getBoundingClientRect(); var size=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=size+'px'; r.style.left=(e.clientX-rect.left-size/2)+'px'; r.style.top=(e.clientY-rect.top-size/2)+'px';
  b.appendChild(r); setTimeout(function(){ r.remove(); },600);
}
/* confetti paw burst (used on confirmation) */
window.App._confetti = function(){
  var glyphs=['\uD83D\uDC3E','\uD83D\uDC3E','\uD83D\uDC9A','\u2b50','\uD83D\uDC36'];
  var cx=window.innerWidth/2, cy=window.innerHeight*0.36;
  for(var i=0;i<26;i++){ (function(i){
    var el=document.createElement('div'); el.className='confetti'; el.textContent=glyphs[i%glyphs.length];
    el.style.left=cx+'px'; el.style.top=cy+'px'; document.body.appendChild(el);
    var dx=(Math.random()-.5)*360, dy=-(160+Math.random()*260), rot=(Math.random()*720-360);
    el.animate([{transform:'translate(0,0) rotate(0) scale(1)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate('+rot+'deg) scale(.6)',opacity:0}],
      {duration:1100+Math.random()*600,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
    setTimeout(function(){ el.remove(); },1800);
  })(i); }
};
/* walking puppy mascot */
(function(){
  var p=document.getElementById('puppy');
  // 3D puppy built from separate parts so each one moves: 4 legs walk, the ear
  // flops, the tail wags. Layered back-to-front.
  p.innerHTML =
    '<div class="dogwrap"><div class="dog3d">'+
      '<img class="tail"            src="assets/img/dog/tail.png"     alt="" draggable="false">'+
      '<img class="leg legBackFar"  src="assets/img/dog/legback.png"  alt="" draggable="false">'+
      '<img class="leg legForeFar"  src="assets/img/dog/legfront.png" alt="" draggable="false">'+
      '<img class="leg legBackNear" src="assets/img/dog/legback.png"  alt="" draggable="false">'+
      '<img class="leg legForeNear" src="assets/img/dog/legfront.png" alt="" draggable="false">'+
      '<img class="body"            src="assets/img/dog/body.png"     alt="" draggable="false">'+
      '<img class="earR"            src="assets/img/dog/ear.png"      alt="" draggable="false">'+
      '<img class="earL"            src="assets/img/dog/ear.png"      alt="" draggable="false">'+
    '</div></div>';

  // The walk is driven by the Web Animations API so a tap can speed it up from
  // wherever it currently is (changing a CSS animation's duration would make it
  // jump). If WAAPI isn't available, fall back to the old CSS class animation.
  var anim = null, boostT = null, canWAAPI = (typeof p.animate === 'function');
  function endX(){ return (window.innerWidth || 1000) + 160; }

  function walk(){
    if (!canWAAPI){ p.classList.remove('walk-css'); void p.offsetWidth; p.classList.add('walk'); p.classList.add('walk-css'); return; }
    if (anim){ try { anim.cancel(); } catch(e){} }
    p.classList.add('walk');
    anim = p.animate(
      [ { transform:'translateX(-160px)' }, { transform:'translateX('+endX()+'px)' } ],
      { duration: 11000, easing:'linear', fill:'forwards' }
    );
    anim.onfinish = function(){ p.classList.remove('walk'); };
  }

  // Tap/click the puppy → it hops and dashes faster for a moment.
  function boost(){
    // jump (vertical hop on the body) — restart so repeated taps re-trigger
    p.classList.remove('jump'); void p.offsetWidth; p.classList.add('jump');
    // faster legs/tail for a moment
    p.classList.add('dash');
    // speed the forward run from its current position (no teleport)
    if (canWAAPI && anim && anim.playState === 'running'){ anim.playbackRate = 3.2; }
    if (boostT) clearTimeout(boostT);
    boostT = setTimeout(function(){
      p.classList.remove('dash');
      if (canWAAPI && anim){ try { anim.playbackRate = 1; } catch(e){} }
    }, 1500);
    setTimeout(function(){ p.classList.remove('jump'); }, 650);
  }
  p.addEventListener('pointerdown', boost);

  setTimeout(walk, 3000); setInterval(walk, 26000);
})();
/* go */
Router.init();
