const fileInput=document.getElementById('fileInput');
const dropzone=document.getElementById('dropzone');
const fileInfo=document.getElementById('fileInfo');
const generateBtn=document.getElementById('generateBtn');
const statusEl=document.getElementById('status');
const previewFrame=document.getElementById('previewFrame');
const emptyState=document.querySelector('.empty-state');
const codePane=document.getElementById('codePane');
const codeText=document.getElementById('codeText');
const previewPane=document.getElementById('previewPane');
const copyBtn=document.getElementById('copyBtn');
const downloadBtn=document.getElementById('downloadBtn');
let selectedFile=null, generated={html:'',css:'',js:''}, activeTab='preview';

function setStatus(message,error=false){statusEl.textContent=message;statusEl.classList.toggle('error',error)}
function selectFile(file){
  if(!file)return;
  const isImage=file.type.startsWith('image/');
  const isVideo=file.type.startsWith('video/');
  if(!isImage&&!isVideo){setStatus('Please choose an image or video file.',true);return}
  const limit=isVideo?30:10;
  if(file.size>limit*1024*1024){setStatus(`File is too large. Maximum size: ${limit} MB.`,true);return}
  selectedFile=file;fileInfo.classList.remove('hidden');
  fileInfo.textContent=`Selected: ${file.name} · ${(file.size/1024/1024).toFixed(2)} MB`;
  generateBtn.disabled=false;setStatus('');
}
fileInput.addEventListener('change',e=>selectFile(e.target.files[0]));
['dragenter','dragover'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.add('drag')}));
['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault();dropzone.classList.remove('drag')}));
dropzone.addEventListener('drop',e=>selectFile(e.dataTransfer.files[0]));

function dataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
async function videoFrames(file){
  const url=URL.createObjectURL(file),video=document.createElement('video');
  video.src=url;video.muted=true;video.playsInline=true;
  await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject});
  const duration=video.duration;
  const times=[0.08,0.3,0.55,0.8].map(p=>Math.min(Math.max(duration*p,0),Math.max(0,duration-0.05)));
  const frames=[];
  for(const t of [...new Set(times)]){
    video.currentTime=t;
    await new Promise(resolve=>{video.onseeked=resolve});
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,1280/video.videoWidth);
    canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
    canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
    frames.push(canvas.toDataURL('image/jpeg',0.82));
  }
  URL.revokeObjectURL(url);return frames;
}
function showTab(tab){
  activeTab=tab;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(tab==='preview'){previewPane.classList.remove('hidden');codePane.classList.add('hidden');copyBtn.textContent='Copy current code';return}
  previewPane.classList.add('hidden');codePane.classList.remove('hidden');codeText.textContent=generated[tab]||'No code generated.';
  copyBtn.textContent='Copy '+tab.toUpperCase();
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));

generateBtn.addEventListener('click',async()=>{
  if(!selectedFile)return;
  generateBtn.disabled=true;generateBtn.textContent='Analyzing reference…';setStatus('Preparing image frames and asking the AI to build your page…');
  try{
    const images=selectedFile.type.startsWith('video/')?await videoFrames(selectedFile):[await dataUrl(selectedFile)];
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({images,instructions:document.getElementById('instructions').value})});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||`Server error (${res.status})`);
    generated={html:data.html||'',css:data.css||'',js:data.js||''};
    const full=`<!doctype html>\n${generated.html}\n<style>\n${generated.css}\n</style>\n<script>\n${generated.js}\n</script>`;
    previewFrame.srcdoc=full;previewFrame.style.display='block';emptyState.style.display='none';
    copyBtn.disabled=false;downloadBtn.disabled=false;setStatus('Website generated successfully. Check the preview and code tabs.');
    showTab('preview');
  }catch(err){setStatus(err.message||'Something went wrong.',true)}
  finally{generateBtn.disabled=false;generateBtn.innerHTML='<span>Generate website code</span><span>→</span>'}
});
copyBtn.addEventListener('click',async()=>{
  const text=activeTab==='preview'?`HTML:\n${generated.html}\n\nCSS:\n${generated.css}\n\nJavaScript:\n${generated.js}`:generated[activeTab];
  await navigator.clipboard.writeText(text);setStatus('Copied to clipboard.');
});
downloadBtn.addEventListener('click',()=>{
  const files=[['index.html',generated.html],['style.css',generated.css],['script.js',generated.js]];
  files.forEach(([name,content])=>{const blob=new Blob([content],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)});
  setStatus('Downloaded HTML, CSS, and JavaScript files.');
});
