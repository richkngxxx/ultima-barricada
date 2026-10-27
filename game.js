'use strict';
// Última Barricada — original game. Logical resolution 180x320 (9:16).
const W=180,H=320,BAR_Y=250,FIELD_TOP=28;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
let S=1,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,3);const vw=innerWidth,vh=innerHeight;
 const cssW=Math.min(vw,vh*9/16),cssH=cssW*16/9;cv.style.width=cssW+'px';cv.style.height=cssH+'px';
 cv.width=Math.round(cssW*DPR);cv.height=Math.round(cssH*DPR);S=cv.width/W;}
addEventListener('resize',resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- AUDIO ----------
let AC=null;function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function noise(dur,vol,freq){const a=ac();if(!a)return;const n=a.sampleRate*dur,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=a.createBufferSource();s.buffer=b;
 const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;const g=a.createGain();g.gain.value=vol;s.connect(f).connect(g).connect(a.destination);s.start()}
function tone(f0,f1,dur,vol,type){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'square';
 o.frequency.setValueAtTime(f0,a.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),a.currentTime+dur);
 g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+dur)}
const SFX={shot:w=>{noise(w.snd[0],w.snd[1],w.snd[2]);tone(180,40,.08,.15)},click:()=>tone(900,600,.03,.08),
 reload:()=>{tone(300,200,.05,.1);setTimeout(()=>tone(500,400,.05,.1),120)},empty:()=>tone(1200,1100,.03,.06),
 hit:()=>tone(220,90,.06,.08,'sawtooth'),head:()=>{tone(700,200,.08,.1);noise(.05,.2,3000)},
 bar:()=>noise(.08,.25,500),groan:()=>tone(rnd(90,130),rnd(50,70),.5,.05,'sawtooth'),
 win:()=>{[0,1,2].forEach(i=>setTimeout(()=>tone(400+i*150,400+i*150,.15,.1),i*140))},
 lose:()=>tone(300,40,1.2,.15,'sawtooth'),find:()=>{tone(600,900,.1,.1);setTimeout(()=>tone(900,1300,.12,.1),100)}};
// ---------- DATA ----------
const WEAPONS=[
 {id:'pistola',name:'Pistola',dmg:10,mag:12,delay:.28,rel:1.1,auto:false,pel:1,spr:2,pierce:0,box:0,col:'#888',snd:[.08,.5,2500]},
 {id:'revolver',name:'Revólver',dmg:26,mag:6,delay:.45,rel:1.6,auto:false,pel:1,spr:1,pierce:1,box:18,col:'#aa8',snd:[.14,.7,1800]},
 {id:'escopeta',name:'Escopeta',dmg:9,mag:6,delay:.7,rel:2.0,auto:false,pel:7,spr:10,pierce:0,box:12,col:'#a64',snd:[.22,.9,1200]},
 {id:'subfusil',name:'Subfusil',dmg:8,mag:30,delay:.08,rel:1.6,auto:true,pel:1,spr:4,pierce:0,box:60,col:'#666',snd:[.06,.4,3000]},
 {id:'rifle',name:'Rifle',dmg:55,mag:5,delay:.9,rel:2.2,auto:false,pel:1,spr:0,pierce:3,box:10,col:'#753',snd:[.2,.9,2000]},
 {id:'asalto',name:'Fusil asalto',dmg:15,mag:30,delay:.11,rel:1.9,auto:true,pel:1,spr:3,pierce:1,box:60,col:'#463',snd:[.09,.6,2200]},
 {id:'ametralladora',name:'Ametralladora',dmg:14,mag:100,delay:.06,rel:3.2,auto:true,pel:1,spr:5,pierce:1,box:120,col:'#333',snd:[.07,.6,1800]}];
const ZT={
 walker:{hp:30,spd:7,w:10,h:18,dmg:4,col:'#5a7',sc:10},
 runner:{hp:22,spd:18,w:9,h:17,dmg:3,col:'#8a5',sc:15},
 fat:{hp:120,spd:4.5,w:16,h:20,dmg:10,col:'#6a6',sc:30},
 crawler:{hp:25,spd:9,w:12,h:7,dmg:5,col:'#596',sc:15},
 boss:{hp:900,spd:3.5,w:26,h:34,dmg:25,col:'#7a3',sc:300}};
const MAX_NIGHT=20,DAY_HOURS=12,SAVE_KEY='ultimaBarricada.v1';
// ---------- SAVE ----------
function newSave(){return{night:1,owned:['pistola'],ammo:{pistola:Infinity},mag:{},surv:0,bar:100,barMax:100,score:0,best:0}}
let G=load();
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.night){s.ammo.pistola=Infinity;return s}}catch(e){}return null}
function save(){const c=JSON.parse(JSON.stringify(G));c.ammo.pistola=0;localStorage.setItem(SAVE_KEY,JSON.stringify(c))}
// ---------- STATE ----------
let state='title',N=null,dayAlloc=null,dayReport=null,results=null,t0=performance.now(),time=0,shake=0;
const pointer={down:false,x:0,y:0};let buttons=[];
function btn(x,y,w,h,label,fn,opt={}){buttons.push({x,y,w,h,fn});
 ctx.fillStyle=opt.bg||'#3a2a1a';ctx.fillRect(x,y,w,h);ctx.fillStyle=opt.hi||'#6b4a2a';ctx.fillRect(x,y,w,1);ctx.fillRect(x,y,1,h);
 ctx.fillStyle='#120a05';ctx.fillRect(x,y+h-1,w,1);ctx.fillRect(x+w-1,y,1,h);
 txt(label,x+w/2,y+h/2+(opt.sz||7)*.36,opt.sz||7,opt.fg||'#f4d9a0','center')}
function txt(s,x,y,sz,col,al){ctx.font='bold '+sz+'px "Courier New",monospace';ctx.textAlign=al||'left';ctx.fillStyle='#000';ctx.fillText(s,x+.6,y+.6);ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y)}
function weapon(id){return WEAPONS.find(w=>w.id===id)}
// ---------- NIGHT ----------
function startNight(){const n=G.night;N={kills:0,heads:0,shots:0,hits:0,zs:[],parts:[],tracers:[],toSpawn:[],spawnT:1.5,wi:G.owned.length-1,
 cool:0,reloading:0,pops:[],splats:[],surv:[],start:JSON.parse(JSON.stringify(G)),msg:'NOCHE '+n,msgT:2.5,score:0};
 N.start.ammo.pistola=0;
 const cnt=8+n*4;for(let i=0;i<cnt;i++){let t='walker',r=Math.random();
  if(n>=3&&r<.15+n*.012)t='runner';else if(n>=4&&r<.3+n*.01)t='crawler';else if(n>=6&&r<.38+n*.01)t='fat';N.toSpawn.push(t)}
 if(n%5===0)N.toSpawn.splice(Math.floor(cnt*.6),0,'boss');
 for(let i=0;i<G.surv;i++)N.surv.push({x:20+((i*37)%140),cd:rnd(0,1)});
 G.owned.forEach(id=>{if(G.mag[id]==null)G.mag[id]=weapon(id).mag});state='night';SFX.groan()}
function spawn(t){const z=ZT[t],n=G.night,hpm=1+(n-1)*.09;N.zs.push({t,x:rnd(14,W-14),y:FIELD_TOP+12+rnd(0,6),hp:z.hp*hpm,max:z.hp*hpm,spd:z.spd*(1+n*.02)*rnd(.85,1.15),
 w:z.w,h:z.h,atk:0,ph:rnd(0,6),flash:0,dead:0})}
function curW(){return weapon(G.owned[N.wi])}
function reload(){const w=curW();if(N.reloading>0||G.mag[w.id]>=w.mag||G.ammo[w.id]<=0)return;N.reloading=w.rel;SFX.reload()}
function finishReload(){const w=curW(),need=w.mag-G.mag[w.id],take=Math.min(need,G.ammo[w.id]);G.mag[w.id]+=take;if(isFinite(G.ammo[w.id]))G.ammo[w.id]-=take}
function fire(tx,ty){const w=curW();if(N.cool>0||N.reloading>0)return;
 if(G.mag[w.id]<=0){if(G.ammo[w.id]>0)reload();else{SFX.empty();N.cool=.3}return}
 G.mag[w.id]--;N.cool=w.delay;N.shots++;SFX.shot(w);shake=Math.min(4,shake+w.dmg/20+.5);
 let anyHit=false;for(let p=0;p<w.pel;p++){const ax=tx+rnd(-w.spr,w.spr),ay=ty+rnd(-w.spr,w.spr)*.6;
  N.tracers.push({x:ax,y:ay,t:.06});let pierce=w.pierce;
  const cands=N.zs.filter(z=>!z.dead&&ax>z.x-z.w/2-1&&ax<z.x+z.w/2+1&&ay>z.y-z.h-1&&ay<z.y+1).sort((a,b)=>b.y-a.y);
  for(const z of cands){const head=z.t==='crawler'?(ax<z.x-z.w/2+5):(ay<z.y-z.h+(z.t==='boss'?10:6));
   damage(z,w.dmg*(head?2.5:1)*(pierce<w.pierce?.7:1),head,ax,ay);anyHit=true;if(pierce--<=0)break}}
 if(anyHit)N.hits++;if(G.mag[w.id]<=0&&G.ammo[w.id]>0)setTimeout(()=>{if(state==='night')reload()},150)}
function damage(z,d,head,x,y){z.hp-=d;z.flash=.08;N.pops.push({x,y:y-4,v:Math.round(d),head,t:.8});if(head)shake=Math.max(shake,3);if(N.splats.length<160)N.splats.push({x:x+rnd(-3,3),y:z.y-rnd(0,3),r:head?ri(2,4):ri(1,2)});if(head){N.heads++;SFX.head()}else SFX.hit();
 for(let i=0;i<(head?8:4);i++)N.parts.push({x,y,vx:rnd(-30,30),vy:rnd(-40,10),t:rnd(.3,.7),c:Math.random()<.7?'#8b0000':'#3c5'});
 if(z.hp<=0){z.dead=1;shake=Math.max(shake,z.t==='boss'?8:2.5);for(let i=0;i<(z.t==='boss'?12:4);i++)N.splats.push({x:z.x+rnd(-z.w,z.w),y:z.y+rnd(-4,3),r:ri(2,5)});N.kills++;N.score+=ZT[z.t].sc*(head?2:1);for(let i=0;i<10;i++)N.parts.push({x:z.x+rnd(-4,4),y:z.y-rnd(0,z.h),vx:rnd(-20,20),vy:rnd(-30,0),t:rnd(.4,.9),c:'#5a1010'})}}
function updNight(dt){if(N.msgT>0)N.msgT-=dt;
 N.spawnT-=dt;if(N.spawnT<=0&&N.toSpawn.length){spawn(N.toSpawn.shift());N.spawnT=Math.max(.35,2.4-G.night*.09)*rnd(.5,1.3);if(Math.random()<.2)SFX.groan()}
 if(N.cool>0)N.cool-=dt;if(N.reloading>0){N.reloading-=dt;if(N.reloading<=0)finishReload()}
 if(pointer.down&&pointer.y<BAR_Y+4){const w=curW();if(w.auto||pointer.fresh){fire(pointer.x,pointer.y);pointer.fresh=false}}
 for(const z of N.zs){if(z.dead)continue;z.ph+=dt*(z.spd/3);z.flash-=dt;
  if(z.y<BAR_Y-1){z.y+=z.spd*dt;z.x+=Math.sin(z.ph*.7)*dt*2;z.x=clamp(z.x,8,W-8)}else{z.atk-=dt;if(z.atk<=0){z.atk=z.t==='boss'?1.6:1.2;G.bar-=ZT[z.t].dmg;shake=Math.max(shake,ZT[z.t].dmg/4);SFX.bar();
   for(let i=0;i<3;i++)N.parts.push({x:z.x,y:BAR_Y+2,vx:rnd(-25,25),vy:rnd(-30,-5),t:.4,c:'#7a5230'})}}}
 for(const s of N.surv){s.cd-=dt;if(s.cd<=0){s.cd=rnd(.9,1.4);const tg=N.zs.filter(z=>!z.dead).sort((a,b)=>b.y-a.y)[0];
  if(tg){N.tracers.push({x:tg.x,y:tg.y-tg.h/2,t:.05,fx:s.x,fy:BAR_Y+10});noise(.05,.2,2500);if(Math.random()<.75)damage(tg,8+G.night*.4,Math.random()<.1,tg.x,tg.y-tg.h/2)}}}
 N.zs=N.zs.filter(z=>!z.dead);
 for(const p of N.parts){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt}N.parts=N.parts.filter(p=>p.t>0);
 for(const t of N.tracers)t.t-=dt;for(const q of N.pops){q.t-=dt;q.y-=18*dt}N.pops=N.pops.filter(q=>q.t>0);N.tracers=N.tracers.filter(t=>t.t>0);
 if(G.bar<=0){G.bar=0;SFX.lose();state='gameover';return}
 if(!N.toSpawn.length&&!N.zs.length){endNight()}}
function endNight(){SFX.win();G.score+=N.score;results={night:G.night,kills:N.kills,heads:N.heads,acc:N.shots?Math.round(N.hits/N.shots*100):0,score:N.score,bar:Math.round(G.bar)};
 G.best=Math.max(G.best||0,G.score);
 if(G.night>=MAX_NIGHT){state='win';localStorage.removeItem(SAVE_KEY);return}G.night++;save();state='results'}
// ---------- DAY ----------
const TASKS=[['armas','Buscar armas'],['municion','Buscar munición'],['supervivientes','Buscar supervivientes'],['reparar','Reparar barricada']];
function startDay(){dayAlloc={armas:3,municion:4,supervivientes:2,reparar:3};dayReport=null;state='day'}
function used(){return Object.values(dayAlloc).reduce((a,b)=>a+b,0)}
function resolveDay(){const r=[];const a=dayAlloc;
 let found=false;for(let h=0;h<a.armas;h++){const next=WEAPONS.find(w=>!G.owned.includes(w.id));if(next&&Math.random()<.09+G.night*.004){G.owned.push(next.id);G.ammo[next.id]=(G.ammo[next.id]||0)+next.box;G.mag[next.id]=next.mag;r.push('¡Encontraste: '+next.name+'!');found=true}}
 if(!found&&a.armas)r.push('No encontraste armas nuevas.');
 if(a.municion){const ow=G.owned.filter(id=>id!=='pistola');if(ow.length){const tot={};for(let h=0;h<a.municion;h++){const id=ow[ri(0,ow.length-1)],w=weapon(id),q=Math.round(w.box*rnd(.4,.9));G.ammo[id]+=q;tot[id]=(tot[id]||0)+q}
  for(const id in tot)r.push('+'+tot[id]+' balas de '+weapon(id).name)}else r.push('Munición inútil: solo tienes la pistola.')}
 let ns=0;for(let h=0;h<a.supervivientes;h++)if(G.surv<6&&Math.random()<.11)ns++;G.surv+=ns;if(a.supervivientes)r.push(ns?'+'+ns+' superviviente(s) se unen':'No encontraste supervivientes.');
 if(a.reparar){const before=G.bar;G.barMax=100+G.night*5;G.bar=Math.min(G.barMax,G.bar+a.reparar*G.barMax*.09);r.push('Barricada +'+Math.round(G.bar-before)+' PV')}
 if(r.some(s=>s[0]==='¡'||s[0]==='+'))SFX.find();dayReport=r;save()}
// ---------- INPUT ----------
function toLogical(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
cv.addEventListener('pointerdown',e=>{e.preventDefault();ac();const p=toLogical(e);pointer.down=true;pointer.x=p.x;pointer.y=p.y;pointer.fresh=true;
 for(const b of buttons)if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){pointer.fresh=false;pointer.down=false;SFX.click();b.fn();return}});
cv.addEventListener('pointermove',e=>{const p=toLogical(e);pointer.x=p.x;pointer.y=p.y});
['pointerup','pointercancel','pointerleave'].forEach(ev=>cv.addEventListener(ev,()=>pointer.down=false));
addEventListener('keydown',e=>{if(state!=='night')return;if(e.key==='r')reload();const k=+e.key;if(k>=1&&k<=G.owned.length){N.wi=k-1;N.reloading=0}});
// ---------- DRAW ----------
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
const stars=[...Array(40)].map(()=>[ri(0,W),ri(0,60)]);
function drawGround(night){px(0,0,W,H,night?'#1a1d2b':'#6d8fb0');if(night){for(const s of stars)px(s[0],s[1],1,1,'#556');px(140,10,10,10,'#dde');px(143,10,7,7,'#1a1d2b')}
 px(0,FIELD_TOP+10,W,BAR_Y-FIELD_TOP,night?'#2b2a22':'#7d7550');
 for(let i=0;i<60;i++){const x=(i*53)%W,y=FIELD_TOP+12+(i*97)%(BAR_Y-FIELD_TOP-10);px(x,y,2,1,night?'#24231c':'#6e6644')}
 // road
 px(60,FIELD_TOP+10,60,BAR_Y-FIELD_TOP,night?'#262520':'#6a6450');for(let y=FIELD_TOP+14;y<BAR_Y;y+=16)px(89,y,2,7,night?'#555040':'#c8c090');
 // ruined buildings skyline
 const bc=night?'#11131c':'#4a5a70';[[0,12,22],[20,18,16],[38,8,14],[120,14,20],[140,20,12],[160,10,20]].forEach(b=>px(b[0],FIELD_TOP+10-b[1],b[2],b[1],bc))}
function drawZombie(z){const T=ZT[z.t],x=Math.round(z.x),y=Math.round(z.y),f=z.flash>0,skin=f?'#fff':T.col,cloth=f?'#fff':(z.t==='fat'?'#544':z.t==='boss'?'#422':'#445'),step=Math.sin(z.ph*4)>0?1:0;
 if(z.t==='crawler'){px(x-6,y-6,12,5,cloth);px(x-6,y-7,5,5,skin);px(x-5,y-5,1,1,'#f00');px(x+4,y-2,3,2,cloth);px(x-8,y-2+step,3,2,skin);return}
 const w=z.w,h=z.h,hh=z.t==='boss'?10:6;
 px(x-w/2+1,y-4,3,4-step,'#222');px(x+w/2-4,y-4,3,3+step,'#222');// legs
 px(x-w/2,y-h+hh,w,h-hh-4,cloth);px(x-w/2,y-h+hh+2,w,1,f?'#fff':'#5a1010');// body + blood
 const ap=z.y>=BAR_Y-1?Math.sin(time*10)*2:0;px(x-w/2-2,y-h+hh+1+ap,2,6,skin);px(x+w/2,y-h+hh+1-ap,2,6,skin);// arms
 px(x-hh/2-1,y-h,hh+2,hh,skin);px(x-2,y-h+2,1,1,'#f22');px(x+1,y-h+2,1,1,'#f22');px(x-1,y-h+hh-2,3,1,'#300');
 if(z.t==='boss'){px(x-6,y-h-2,12,2,'#3a3');px(x-w/2-3,y-h+hh,3,10,skin);px(x+w/2,y-h+hh,3,10,skin)}
 if(z.hp<z.max&&z.t!=='walker'||z.t==='boss'){px(x-w/2,y-h-4,w,2,'#300');px(x-w/2,y-h-4,w*clamp(z.hp/z.max,0,1),2,'#e33')}}
function drawBarricade(){const hp=G.bar/G.barMax;for(let x=0;x<W;x+=12){const dmg=hp<((x*7)%10)/10;px(x,BAR_Y+(dmg?3:0),11,dmg?7:10,dmg?'#4a321c':'#7a5230');px(x,BAR_Y+(dmg?3:0),11,1,'#a07040');px(x+5,BAR_Y+2,1,6,'#3a2412')}
 px(0,BAR_Y+10,W,2,'#555');}
function drawShooter(x,col,gun){const y=BAR_Y+12;px(x-3,y,6,8,col);px(x-2,y-4,4,4,'#d9a77a');px(x-1,y-6,3,2,'#432');px(x-1,y-8,2,4,gun||'#333')}
function drawNight(){const sx=shake?rnd(-shake,shake):0,sy=shake?rnd(-shake,shake):0;ctx.save();ctx.translate(sx,sy);drawGround(true);
 for(const b of N.splats){px(b.x-b.r,b.y-b.r/2,b.r*2,b.r,'#4a0808');px(b.x-b.r/2,b.y-b.r/2,b.r,1,'#6a0c0c')}
 const zs=N.zs.slice().sort((a,b)=>a.y-b.y);zs.forEach(drawZombie);drawBarricade();
 N.surv.forEach(s=>drawShooter(s.x,'#456','#222'));drawShooter(90,'#843',curW().col);
 for(const t of N.tracers){ctx.strokeStyle='rgba(255,230,120,.8)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(t.fx||90,t.fy||BAR_Y+4);ctx.lineTo(t.x,t.y);ctx.stroke();px(t.x-1,t.y-1,2,2,'#ffd')}
 for(const p of N.parts)px(p.x,p.y,2,2,p.c);for(const q of N.pops){ctx.globalAlpha=Math.min(1,q.t*2);txt(q.head?q.v+'!':String(q.v),q.x,q.y,q.head?10:7,q.head?'#ff4':'#fff','center');ctx.globalAlpha=1}ctx.restore();
 if(pointer.down&&pointer.y<BAR_Y){ctx.strokeStyle='#f33';ctx.lineWidth=.7;ctx.strokeRect(pointer.x-4,pointer.y-4,8,8);px(pointer.x-.5,pointer.y-.5,1,1,'#f33')}
 // HUD top
 px(0,0,W,FIELD_TOP-6,'rgba(0,0,0,.6)');txt('NOCHE '+G.night+'/'+MAX_NIGHT,4,9,7,'#f4d9a0');txt('PTS '+(G.score+N.score),W-4,9,7,'#f4d9a0','right');
 const left=N.toSpawn.length+N.zs.length;txt('Zombis: '+left,4,18,6,'#c99');
 px(80,13,96,5,'#300');px(80,13,96*clamp(G.bar/G.barMax,0,1),5,G.bar/G.barMax>.3?'#6c3':'#e33');txt('Barricada',128,18,4.5,'#fff','center');
 // HUD bottom
 px(0,282,W,38,'#1a120b');const w=curW();
 txt(w.name,4,292,7,'#fff');const am=isFinite(G.ammo[w.id])?G.ammo[w.id]:'∞';
 txt(N.reloading>0?'RECARGANDO...':(G.mag[w.id]+' / '+am),4,302,7,N.reloading>0?'#fc6':G.mag[w.id]?'#fd8':'#f55');
 for(let i=0;i<w.mag&&i<30;i++)px(4+i*2.4,305,1.6,4,i<G.mag[w.id]?'#da4':'#433');
 btn(118,285,58,17,'RECARGAR',reload,{sz:7});
 G.owned.forEach((id,i)=>{const bw=Math.min(24,108/G.owned.length);btn(4+i*(bw+1),311-1,bw,9,(i+1)+'',()=>{N.wi=i;N.reloading=0},{sz:6,bg:i===N.wi?'#8a5a20':'#2a1e12'})});
 btn(118,304,58,14,'ARMA ▶',()=>{N.wi=(N.wi+1)%G.owned.length;N.reloading=0},{sz:6});
 if(N.msgT>0){const a=Math.min(1,N.msgT);ctx.globalAlpha=a;txt('NOCHE '+G.night,W/2,120,18,'#e33','center');if(G.night%5===0)txt('¡Se acerca algo enorme!',W/2,136,7,'#fc6','center');ctx.globalAlpha=1}}
function panel(y,h){px(10,y,W-20,h,'rgba(20,12,6,.92)');px(10,y,W-20,1,'#a07040');px(10,y+h-1,W-20,1,'#a07040')}
function drawTitle(){drawGround(true);const fake=[[40,120,'walker'],[130,150,'runner'],[80,190,'fat'],[150,90,'walker'],[30,210,'crawler']];
 fake.forEach(f=>drawZombie({t:f[2],x:f[0],y:f[1]+Math.sin(time+f[0])*2,w:ZT[f[2]].w,h:ZT[f[2]].h,ph:time*2+f[0],flash:0,hp:1,max:1}));G0bar();
 txt('ÚLTIMA',W/2,52,20,'#e33','center');txt('BARRICADA',W/2,72,18,'#f4d9a0','center');txt('Sobrevive '+MAX_NIGHT+' noches',W/2,84,7,'#ccc','center');
 if(G){btn(40,226,100,20,'CONTINUAR (Noche '+G.night+')',()=>startDay(),{sz:6});btn(40,250,100,16,'NUEVA PARTIDA',()=>{G=newSave();save();startNight()},{sz:7})}
 else btn(40,234,100,22,'JUGAR',()=>{G=newSave();save();startNight()},{sz:10});
 txt('Toca un zombi para disparar · Cabeza = x2.5',W/2,300,5,'#aaa','center');txt('Juego original · Hecho en código',W/2,310,5,'#777','center')}
function G0bar(){for(let x=0;x<W;x+=12){px(x,BAR_Y,11,10,'#7a5230');px(x,BAR_Y,11,1,'#a07040')}drawShooter(90,'#843','#888');drawShooter(50,'#456');drawShooter(130,'#456')}
function drawResults(){drawGround(false);G0bar();panel(50,190);txt('¡SOBREVIVISTE!',W/2,72,11,'#6c3','center');txt('Noche '+results.night,W/2,86,7,'#f4d9a0','center');
 const rows=[['Zombis abatidos',results.kills],['Disparos a la cabeza',results.heads],['Precisión',results.acc+'%'],['Barricada',results.bar+' PV'],['Puntos noche',results.score],['Puntos total',G.score]];
 rows.forEach((r,i)=>{txt(r[0],20,108+i*14,7,'#ddd');txt(String(r[1]),W-20,108+i*14,7,'#fd8','right')});
 btn(40,205,100,22,'AMANECE ▶',startDay,{sz:9})}
function drawDay(){drawGround(false);G0bar();panel(20,250);txt('DÍA '+G.night,W/2,36,11,'#fd8','center');
 if(dayReport){txt('Resultado del día',W/2,52,7,'#ccc','center');dayReport.forEach((s,i)=>txt(s,18,70+i*13,6,s[0]==='¡'?'#6f6':s[0]==='+'?'#9df':'#ccc'));
  txt('Esta noche: '+(G.night%5===0?'¡JEFE!':'zombis'),W/2,200,7,G.night%5===0?'#f55':'#ddd','center');btn(40,228,100,24,'COMENZAR NOCHE',startNight,{sz:8,bg:'#5a1a10'});return}
 const free=DAY_HOURS-used();txt('Horas libres: '+free+' / '+DAY_HOURS,W/2,50,7,free?'#fd8':'#9c9','center');
 TASKS.forEach(([k,l],i)=>{const y=62+i*30;txt(l,18,y+7,7,'#eee');btn(18,y+11,20,14,'−',()=>{if(dayAlloc[k]>0)dayAlloc[k]--},{sz:10});
  txt(dayAlloc[k]+' h',60,y+22,8,'#fd8','center');btn(82,y+11,20,14,'+',()=>{if(used()<DAY_HOURS)dayAlloc[k]++},{sz:10});
  for(let h=0;h<dayAlloc[k];h++)px(108+h*5,y+14,4,8,'#da4')});
 txt('Barricada '+Math.round(G.bar)+'/'+G.barMax+'  Supervivientes '+G.surv,W/2,188,5.5,'#ccc','center');
 txt('Armas: '+G.owned.map(id=>{const w=weapon(id);return w.name+(isFinite(G.ammo[id])?'('+(G.ammo[id]+(G.mag[id]||0))+')':'')}).join(', ').slice(0,60),W/2,198,4.5,'#aaa','center');
 btn(40,232,100,22,'SALIR A BUSCAR',resolveDay,{sz:8})}
function drawEnd(win){drawGround(true);G0bar();panel(80,150);txt(win?'¡HAS SOBREVIVIDO!':'LA BARRICADA CAYÓ',W/2,104,win?10:10,win?'#6c3':'#e33','center');
 txt(win?'Llegó el rescate tras '+MAX_NIGHT+' noches':'Noche '+G.night,W/2,120,7,'#ddd','center');txt('Puntos: '+(G.score+(win?0:N.score)),W/2,136,8,'#fd8','center');
 if(!win)btn(40,160,100,20,'REINTENTAR NOCHE',()=>{G=N.start;G.ammo.pistola=Infinity;save();startNight()},{sz:7});
 btn(40,190,100,20,'MENÚ',()=>{G=load();state='title'},{sz:8})}
function frame(now){const dt=Math.min(.05,(now-t0)/1000);t0=now;time+=dt;shake=Math.max(0,shake-dt*20);
 if(state==='night')updNight(dt);
 buttons=[];ctx.setTransform(S,0,0,S,0,0);ctx.imageSmoothingEnabled=false;
 ({title:drawTitle,night:drawNight,results:drawResults,day:drawDay,gameover:()=>drawEnd(false),win:()=>drawEnd(true)})[state]();
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);
window.__game={get state(){return state},get G(){return G},get N(){return N},startDay,startNight,endNight,fire};
