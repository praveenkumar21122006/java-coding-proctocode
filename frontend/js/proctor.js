// Proctoring Engine - Face + Motion + Tab/Fullscreen monitoring
// Uses: native FaceDetector if available, else fallback motion detection
// No external model required for demo; can integrate face-api.js by loading CDN

window.Proctor = (function(){
  let cfg=null, stream=null, interval=null, motionInterval=null;
  let prevFrame=null, tabSwitches=0, noFaceCount=0, multiFaceCount=0;
  let faceDetector=null, lastMotion=0, violations=0;

  function log(event, details){
    violations++;
    if(cfg && cfg.onViolation) cfg.onViolation(event, details);
    // update UI counters
    const elTab=document.getElementById('mTab'); if(elTab) elTab.textContent=tabSwitches;
  }

  async function init(options){
    cfg=options;
    const video=cfg.videoEl;
    const overlay=cfg.overlayEl;
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'}, audio:false});
      video.srcObject=stream;
      await video.play();
      document.getElementById('proctorStatus').innerHTML='<span class="status-dot status-ok"></span>Live';
      document.getElementById('faceLabel').textContent='Camera active';
      document.getElementById('mFullscreen').textContent = document.fullscreenElement?'Yes':'No';
    }catch(e){
      document.getElementById('proctorStatus').innerHTML='<span class="status-dot status-danger"></span>No Camera';
      document.getElementById('faceLabel').textContent='No webcam - violation';
      log('NO_WEBCAM', e.message);
      return;
    }

    // Try native FaceDetector
    if('FaceDetector' in window){
      try{ faceDetector=new FaceDetector({fastMode:true, maxDetectedFaces:3}); }catch(e){ faceDetector=null; }
    }

    // Optional: try to load face-api.js if available via CDN (non-blocking)
    // If not loaded, we stay with motion+FaceDetector fallback

    // Start detection loops
    interval=setInterval(detect, 1500);
    motionInterval=setInterval(detectMotion, 700);

    // Tab switch / visibility
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){
        tabSwitches++;
        document.getElementById('mTab').textContent=tabSwitches;
        log('TAB_SWITCH', 'Tab hidden / switched window');
      }
    });
    window.addEventListener('blur', ()=>{ log('TAB_SWITCH','Window blur'); });
    // Fullscreen monitoring
    document.addEventListener('fullscreenchange', ()=>{
      const fs=document.fullscreenElement?'Yes':'No';
      document.getElementById('mFullscreen').textContent=fs;
      if(!document.fullscreenElement){
        log('FULLSCREEN_EXIT','Exited fullscreen');
      }
    });
    // Request fullscreen on first click (exam page)
    setTimeout(()=> {
      if(!document.fullscreenElement){
        document.documentElement.requestFullscreen?.().catch(()=>{});
      }
    }, 800);

    // Draw overlay loop
    requestAnimationFrame(drawOverlay);
  }

  async function detect(){
    const video=cfg.videoEl;
    if(!video || video.readyState<2) return;
    let faces=0;
    let faceBoxes=[];

    if(faceDetector){
      try{
        const detected=await faceDetector.detect(video);
        faces=detected.length;
        faceBoxes=detected.map(d=>d.boundingBox);
      }catch(e){ faces=-1; }
    } else {
      // Fallback heuristic: estimate face presence via brightness/center check + motion context
      // We cannot do real face detection without model, so we simulate:
      // - If video has non-black frames, assume 1 face present (optimistic)
      // - Randomly inject violations for demo when tab is switched heavily
      // For real deployment, load face-api.js:
      //   await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
      //   faces = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      faces = estimateFacesFallback(video);
    }

    const facesEl=document.getElementById('mFaces');
    const label=document.getElementById('faceLabel');
    const statusEl=document.getElementById('proctorStatus');

    if(faces===-1){ facesEl.textContent='?'; return; }
    facesEl.textContent=faces;

    if(faces===0){
      noFaceCount++; multiFaceCount=0;
      label.textContent='No face detected!';
      label.style.color='#ef4444';
      statusEl.innerHTML='<span class="status-dot status-danger"></span>No Face';
      if(noFaceCount>=2) log('NO_FACE','No face for '+(noFaceCount*1.5)+'s');
    } else if(faces>1){
      multiFaceCount++; noFaceCount=0;
      label.textContent=faces+' faces - violation!';
      statusEl.innerHTML='<span class="status-dot status-danger"></span>Multiple Faces';
      if(multiFaceCount>=1) log('MULTIPLE_FACES', faces+' faces detected');
    } else {
      noFaceCount=0; multiFaceCount=0;
      label.textContent='Face centered ✓';
      label.style.color='#fff';
      statusEl.innerHTML='<span class="status-dot status-ok"></span>OK';
      // Check centering if we have boxes
      if(faceBoxes.length){
        const b=faceBoxes[0];
        const cx=b.x + b.width/2, cy=b.y + b.height/2;
        const vw=video.videoWidth, vh=video.videoHeight;
        const dx=Math.abs(cx - vw/2)/vw, dy=Math.abs(cy - vh/2)/vh;
        if(dx>0.25 || dy>0.25){
          log('FACE_NOT_CENTERED', `off-center dx=${dx.toFixed(2)}`);
        }
      }
    }
    drawBoxes(faceBoxes);
  }

  function estimateFacesFallback(video){
    // Very lightweight heuristic: check if center region has variation (not empty)
    // For demo we return 1 most of time, occasionally 0 if video is dark
    try{
      const c=document.createElement('canvas');
      c.width=64; c.height=48;
      const ctx=c.getContext('2d');
      ctx.drawImage(video,0,0,64,48);
      const data=ctx.getImageData(0,0,64,48).data;
      let bright=0;
      for(let i=0;i<data.length;i+=4){
        const b=(data[i]+data[i+1]+data[i+2])/3;
        if(b>30) bright++;
      }
      const ratio=bright/(64*48);
      if(ratio<0.15) return 0; // too dark -> no face
      // For demo, 5% chance to simulate multiple faces
      if(Math.random()<0.02) return 2;
      return 1;
    }catch{ return 1; }
  }

  function detectMotion(){
    const video=cfg.videoEl;
    const canvas=document.getElementById('motionCanvas');
    if(!video || !canvas || video.readyState<2) return;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
    if(prevFrame){
      let diff=0;
      for(let i=0;i<frame.data.length;i+=4){
        const d=Math.abs(frame.data[i]-prevFrame.data[i]) + Math.abs(frame.data[i+1]-prevFrame.data[i+1]) + Math.abs(frame.data[i+2]-prevFrame.data[i+2]);
        if(d>60) diff++;
      }
      const motionPct=(diff/(canvas.width*canvas.height))*100;
      lastMotion=motionPct;
      document.getElementById('mMotion').textContent=motionPct.toFixed(1)+'%';
      if(motionPct>25){
        log('MOTION_DETECTED', `Excessive motion ${motionPct.toFixed(1)}%`);
      }
    }
    prevFrame=frame;
  }

  function drawBoxes(boxes){
    const overlay=cfg.overlayEl;
    if(!overlay) return;
    const video=cfg.videoEl;
    overlay.width=video.clientWidth;
    overlay.height=video.clientHeight;
    const ctx=overlay.getContext('2d');
    ctx.clearRect(0,0,overlay.width,overlay.height);
    if(!boxes.length) return;
    const sx=overlay.width/video.videoWidth, sy=overlay.height/video.videoHeight;
    ctx.strokeStyle='#10b981'; ctx.lineWidth=2;
    boxes.forEach(b=>{
      ctx.strokeRect(b.x*sx, b.y*sy, b.width*sx, b.height*sy);
    });
  }

  function drawOverlay(){
    // keep canvas sized
    if(cfg && cfg.overlayEl && cfg.videoEl){
      // already handled in detect
    }
    if(interval) requestAnimationFrame(drawOverlay);
  }

  function capture(){
    const video=cfg.videoEl;
    const c=document.createElement('canvas');
    c.width=video.videoWidth; c.height=video.videoHeight;
    c.getContext('2d').drawImage(video,0,0);
    const dataUrl=c.toDataURL('image/jpeg',0.6);
    log('SNAPSHOT','Manual capture '+dataUrl.slice(0,30)+'...');
    // In production POST to /api/proctor/snapshot
    console.log('Snapshot captured', dataUrl.length);
    alert('Snapshot captured (demo) - would upload to server in production');
  }

  function stop(){
    if(interval) clearInterval(interval);
    if(motionInterval) clearInterval(motionInterval);
    interval=null; motionInterval=null;
    if(stream) stream.getTracks().forEach(t=>t.stop());
  }

  return {init, capture, stop};
})();
