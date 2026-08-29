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
  p.innerHTML = '<svg viewBox="0 0 120 90" width="104" height="78"><g class="bounce">'+
    '<path class="tail" d="M14 40 C 2 36 4 24 12 26 C 8 32 14 34 20 38 Z" fill="#D99A2E"/>'+
    '<ellipse cx="60" cy="60" rx="40" ry="24" fill="#EBB042"/>'+
    '<rect x="34" y="66" width="9" height="18" rx="4" fill="#D99A2E"/><rect x="78" y="66" width="9" height="18" rx="4" fill="#D99A2E"/>'+
    '<rect x="50" y="68" width="9" height="16" rx="4" fill="#EBB042"/><rect x="64" y="68" width="9" height="16" rx="4" fill="#EBB042"/>'+
    '<circle cx="94" cy="44" r="20" fill="#EBB042"/><path class="ear" d="M84 30 C 78 20 88 18 92 26 Z" fill="#D99A2E"/>'+
    '<circle cx="100" cy="42" r="3.2" fill="#22302E"/><circle cx="108" cy="48" r="3.6" fill="#22302E"/>'+
    '<path d="M104 54 q4 3 8 0" stroke="#22302E" stroke-width="2" fill="none" stroke-linecap="round"/>'+
    '<rect x="74" y="56" width="18" height="6" rx="3" fill="#21706F"/></g></svg>';
  function walk(){ p.classList.remove('walk'); void p.offsetWidth; p.classList.add('walk'); }
  setTimeout(walk, 3000); setInterval(walk, 26000);
})();
/* go */
Router.init();
