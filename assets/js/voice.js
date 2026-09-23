const VOICE_BCP47 = {en:'en-IN', hi:'hi-IN'};
let lastSpokenText='';
function speak(text){
  try{
    if(!('speechSynthesis' in window)) return;
    const voiceLang = VOICE_BCP47[DB.lang] ? DB.lang : 'en';
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE_BCP47[voiceLang];
    lastSpokenText = text;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}
function stopSpeak(){ try{ speechSynthesis.cancel(); }catch(e){} }
function replaySpeak(){ if(lastSpokenText) speak(lastSpokenText); }
/* Small reusable speaker control: play / stop / replay beside an instruction */
function voiceBtns(text){
  const safe = text.replace(/'/g,"\\'");
  return `<span class="spk-btn" title="Play" onclick="speak('${safe}')">🔊</span>
    <span class="spk-btn" title="Stop" onclick="stopSpeak()">⏹️</span>
    <span class="spk-btn" title="Replay" onclick="replaySpeak()">🔁</span>`;
}
