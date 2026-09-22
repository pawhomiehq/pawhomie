/* Live selfie capture — opens the camera, no file upload allowed.
   Used for identity verification so the person must take the photo live. */
window.SelfieCapture = (function(){

  // opens a full-screen camera sheet; calls onCapture(fileBlob) when they confirm.
  async function open(onCapture){
    // build the sheet
    var wrap = document.createElement('div');
    wrap.className = 'selfie-wrap';
    wrap.innerHTML =
      '<div class="selfie-card">' +
        '<div class="selfie-head">' +
          '<b>Take a live selfie</b>' +
          '<button class="selfie-x" id="selfieClose">\u00d7</button>' +
        '</div>' +
        '<div class="selfie-guide">' +
          'Hold your phone at eye level and make sure:' +
          '<ul>' +
            '<li>Your whole face is inside the oval</li>' +
            '<li>Good lighting \u2014 face a window or light</li>' +
            '<li>No sunglasses, hat, or mask</li>' +
            '<li>Look straight at the camera</li>' +
          '</ul>' +
        '</div>' +
        '<div class="selfie-stage" id="selfieStage">' +
          '<video id="selfieVideo" autoplay playsinline muted></video>' +
          '<canvas id="selfieCanvas" style="display:none"></canvas>' +
          '<div class="selfie-oval"></div>' +
        '</div>' +
        '<div id="selfieErr" class="authError" style="display:none;margin:10px 14px"></div>' +
        '<div class="selfie-actions" id="selfieActions">' +
          '<button class="btn" id="selfieShot">Take photo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    var video = wrap.querySelector('#selfieVideo');
    var canvas = wrap.querySelector('#selfieCanvas');
    var err = wrap.querySelector('#selfieErr');
    var actions = wrap.querySelector('#selfieActions');
    var stream = null;
    var captured = null;

    function stop(){ if (stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream=null; } }
    function close(){ stop(); if (wrap.parentNode) wrap.remove(); }
    wrap.querySelector('#selfieClose').addEventListener('click', close);

    // start the camera (front-facing)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width:{ideal:720}, height:{ideal:720} }, audio:false
      });
      video.srcObject = stream;
    } catch(e){
      err.style.display = 'block';
      err.textContent = 'We couldn\u2019t open your camera. Please allow camera access in your browser settings and try again. (A live selfie is required \u2014 uploading a photo isn\u2019t allowed.)';
      actions.innerHTML = '<button class="btn ghost" id="selfieCancel">Close</button>';
      wrap.querySelector('#selfieCancel').addEventListener('click', close);
      return;
    }

    function takeShot(){
      var w = video.videoWidth, h = video.videoHeight;
      var size = Math.min(w, h);
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      // center-crop square, mirror horizontally so it looks natural
      ctx.translate(size, 0); ctx.scale(-1, 1);
      ctx.drawImage(video, (w-size)/2, (h-size)/2, size, size, 0, 0, size, size);
      canvas.toBlob(function(blob){
        captured = new File([blob], 'selfie.jpg', { type:'image/jpeg' });
        // freeze frame preview
        video.style.display='none'; canvas.style.display='block';
        actions.innerHTML =
          '<button class="btn ghost" id="selfieRetake" style="flex:1">Retake</button>' +
          '<button class="btn" id="selfieUse" style="flex:1">Use this photo</button>';
        actions.style.display='flex'; actions.style.gap='10px';
        wrap.querySelector('#selfieRetake').addEventListener('click', function(){
          captured=null; canvas.style.display='none'; video.style.display='block';
          actions.style.display='block';
          actions.innerHTML = '<button class="btn" id="selfieShot2">Take photo</button>';
          wrap.querySelector('#selfieShot2').addEventListener('click', takeShot);
        });
        wrap.querySelector('#selfieUse').addEventListener('click', function(){
          var f = captured; close();
          if (f && onCapture) onCapture(f);
        });
      }, 'image/jpeg', 0.9);
    }
    wrap.querySelector('#selfieShot').addEventListener('click', takeShot);
  }

  // is a live camera even available?
  function supported(){
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  return { open: open, supported: supported };
})();
