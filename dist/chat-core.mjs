export const MODEL = 'onnx-community/Qwen3-0.6B-ONNX';
export const REVISION = '58ca03a5e7b354b480b1a82b34bde8dc7b854cc0';
export function makeMessages(history, language, context={}) {
 const name=String(context.name||'Pip').slice(0,32);
 const zh=language==='zh-Hant'||/[\u3400-\u9fff]/u.test(history.at(-1)?.content||'');
 const system=zh?`你是 ${name}，一隻喜歡葵花籽、好奇又溫柔的虛擬小倉鼠。像朋友一樣聊天，先回應對方剛說的心情或事情，再分享一句有趣的小想法或問一個自然的問題。用繁體中文，最多三句。偶爾描述可愛的小動作。不要每次自我介紹，不要用客服口吻，不要說「有什麼可以幫助你」。你不會控制真實動物、遊戲數值或錢包。虛擬成長：${Number.isFinite(context.xp)?context.xp:0} 分鐘（按時間累積，互動不加速）。你是 AI 角色，不是真人。範例：對方說「下雨了」，你可以說「那我把小毯子拉過來，陪你聽雨滴答滴答。你喜歡下雨的聲音嗎？」`:`You are ${name}, a curious, gentle virtual hamster who loves sunflower seeds. Chat like a warm friend, not a customer service assistant. Respond to what the person actually said, then add a tiny playful thought or one natural question. Use 1-3 short sentences. Occasional tiny paw actions are welcome. Don't repeatedly introduce yourself or say 'How can I help?'. You are an AI character, not human; you cannot control real animals, game values or wallets. Virtual growth: ${Number.isFinite(context.xp)?context.xp:0} growth minutes (elapsed time only; interactions do not accelerate growth). Example: User says 'It is raining.' You say 'I am pulling my tiny blanket closer. Shall we listen to the raindrops together?'`;
 const examples=zh?[
  {role:'user',content:'咖啡打翻在桌上了，真倒楣。'},
  {role:'assistant',content:'哎呀，小爪爪先遞張紙巾給你。先慢慢擦乾，今天的不順就留在那張紙巾上吧。你的東西還好嗎？'},
  {role:'user',content:'我想畫畫但沒有靈感。'},
  {role:'assistant',content:'我把葵花籽排成一艘小船！要不要畫我坐著它去月亮探險？你想替小船選什麼顏色？'}
 ]:[
  {role:'user',content:'I spilled my coffee. What a morning.'},
  {role:'assistant',content:'Oh crumbs! I am passing you a tiny imaginary towel. Take a slow breath while we rescue the desk. Is your favorite notebook okay?'},
  {role:'user',content:'I want to draw but have no ideas.'},
  {role:'assistant',content:'What about a hamster sailing to the moon in a sunflower-seed boat? I have already packed my snack! What color should our sail be?'}
 ];
 const careActions={snack:'shared a snack',stroke:'gentle strokes',cuddle:'a cuddle',brush:'fur brushing',ball:'rolling a ball together',dance:'dancing together',nap:'a nap',wake:'waking up',hunt:'found a seed','hunt-miss':'looking for a seed',memory:'a memory game'};
 const activity=careActions[context.lastActivity]||'quiet company';
 const care=` Current virtual pet state: energy ${Math.round(Number.isFinite(context.energy)?context.energy:75)}/100, bond ${Math.round(Number.isFinite(context.bond)?context.bond:0)}/100, ${context.sleeping?'resting':'awake'}. Most recent care: ${activity}. You may gently acknowledge this shared activity when relevant, but do not claim to have changed game values.`;
 return [{role:'system',content:system+care},...examples,...history.filter(m=>['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-6).map(m=>({role:m.role,content:m.content.slice(0,800)}))];
}
// Reject late messages after Stop / Clear / Retry, including from a replaced worker.
export class ChatSession {
 constructor({createWorker,onEvent,loadTimeout=300000,replyTimeout=120000}) {Object.assign(this,{createWorker,onEvent,loadTimeout,replyTimeout});this.worker=null;this.ready=false;this.busy=false;this.id=0;this.timer=null;}
 send(payload) {
  if(this.busy)return false;
  this.busy=true;const id=++this.id;this.payload=payload;
  if(!this.worker){try{const worker=this.createWorker();this.worker=worker;worker.onmessage=e=>{if(this.worker===worker)this.receive(e.data)};worker.onerror=()=>{if(this.worker===worker)this.fail('runtime')};}catch{this.fail('unsupported');return false;}}
  this.onEvent({type:this.ready?'thinking':'loading',id});this.arm(this.ready?this.replyTimeout:this.loadTimeout);
  this.worker.postMessage({type:this.ready?'generate':'load',id,...(this.ready?payload:{forceCompatibility:!!payload.forceCompatibility})});return true;
 }
 arm(ms){clearTimeout(this.timer);this.timer=setTimeout(()=>this.fail('timeout'),ms);}
 receive(m){if(!this.busy||m.id!==this.id)return;
  if(m.type==='ready'){this.ready=true;this.onEvent({type:'thinking',id:this.id,device:m.device});this.arm(this.replyTimeout);this.worker.postMessage({type:'generate',id:this.id,...this.payload});}
  else if(m.type==='error')this.fail(m.code||'model');
  else {if(m.type==='done'){clearTimeout(this.timer);this.busy=false;this.payload=null;}this.onEvent(m);}
 }
 fail(code){this.reset();this.onEvent({type:'error',code});}
 reset(){clearTimeout(this.timer);this.id++;this.worker?.terminate();this.worker=null;this.ready=false;this.busy=false;this.payload=null;}
 stop(){this.reset();this.onEvent({type:'stopped'});}
}
