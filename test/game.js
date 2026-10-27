'use strict';
// Última Barricada — original game. Logical resolution 180x320 (9:16).
const W=180,H=320,BAR_Y=212,FIELD_TOP=58;
const cv=document.getElementById("c");let ctx=cv.getContext("2d");
let S=1,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,3);const vw=innerWidth,vh=innerHeight;
 const cssW=Math.min(vw,vh*9/16),cssH=cssW*16/9;cv.style.width=cssW+'px';cv.style.height=cssH+'px';
 cv.width=Math.round(cssW*DPR);cv.height=Math.round(cssH*DPR);S=cv.width/W;if(window.__ready)buildCaches();}
addEventListener('resize',resize);resize();
const rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- AUDIO ----------
let AC=null,muted=localStorage.getItem('ub.mute')==='1',paused=false;function ac(){if(muted)return null;if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
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
 walker:{hp:30,spd:11,w:14,h:34,dmg:4,col:'#5a7',sc:10},
 runner:{hp:22,spd:18,w:9,h:30,dmg:3,col:'#8a5',sc:15},
 fat:{hp:120,spd:4.5,w:14,h:30,dmg:10,col:'#6a6',sc:30},
 crawler:{hp:25,spd:9,w:12,h:12,dmg:5,col:'#596',sc:15},
 boss:{hp:900,spd:3.5,w:10,h:30,dmg:25,col:'#7a3',sc:300}};
const MAX_NIGHT=20,DAY_HOURS=12,SAVE_KEY='ultimaBarricada.v1';
// ---------- SAVE ----------
function newSave(){return{night:1,owned:['pistola'],ammo:{pistola:Infinity},mag:{},surv:0,bar:100,barMax:100,score:0,best:0}}
let G=load();
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.night){s.ammo.pistola=Infinity;return s}}catch(e){}return null}
function save(){const c=JSON.parse(JSON.stringify(G));c.ammo.pistola=0;localStorage.setItem(SAVE_KEY,JSON.stringify(c))}
// ---------- STATE ----------
let state='title',N=null,dayAlloc=null,dayReport=null,results=null,t0=performance.now(),time=0,shake=0;
const pointer={down:false,x:0,y:0};let buttons=[];
function weapon(id){return WEAPONS.find(w=>w.id===id)}
// ---------- NIGHT ----------
function startNight(){paused=false;clearDecals();const n=G.night;N={kills:0,heads:0,shots:0,hits:0,zs:[],parts:[],tracers:[],toSpawn:[],spawnT:1.5,wi:G.owned.length-1,
 cool:0,reloading:0,pops:[],corpses:[],gibs:[],surv:[],start:JSON.parse(JSON.stringify(G)),msg:'NOCHE '+n,msgT:2.5,score:0};
 N.start.ammo.pistola=0;
 const cnt=8+n*4;for(let i=0;i<cnt;i++){let t='walker',r=Math.random();
  if(n>=3&&r<.15+n*.012)t='runner';else if(n>=4&&r<.3+n*.01)t='crawler';else if(n>=6&&r<.38+n*.01)t='fat';N.toSpawn.push(t)}
 if(n%5===0)N.toSpawn.splice(Math.floor(cnt*.6),0,'boss');
 for(let i=0;i<G.surv;i++)N.surv.push({x:[40,140,18,162,65,115][i],cd:rnd(0,1),col:['#4d5a3a','#3c4a5a','#6a5a3a','#5a3a3a','#3a3a3a','#55553a'][i],a:0});
 G.owned.forEach(id=>{if(G.mag[id]==null)G.mag[id]=weapon(id).mag});state='night';SFX.groan()}
function spawn(t){const z=ZT[t],n=G.night,hpm=1+(n-1)*.09;N.zs.push({t,x:rnd(14,W-14),y:FIELD_TOP+rnd(0,4),hp:z.hp*hpm,max:z.hp*hpm,spd:z.spd*(1+n*.02)*rnd(.9,1.1),
 w:z.w,h:z.h,s:.6,v:variant(t,ri(0,7)),wounds:[],atk:0,flip:Math.random()<.5?-1:1,ph:rnd(0,6),flash:0,dead:0})}
function curW(){return weapon(G.owned[N.wi])}
function reload(){const w=curW();if(N.reloading>0||G.mag[w.id]>=w.mag||G.ammo[w.id]<=0)return;N.reloading=w.rel;SFX.reload()}
function finishReload(){const w=curW(),need=w.mag-G.mag[w.id],take=Math.min(need,G.ammo[w.id]);G.mag[w.id]+=take;if(isFinite(G.ammo[w.id]))G.ammo[w.id]-=take}
function fire(tx,ty){const w=curW();if(N.cool>0||N.reloading>0)return;
 if(G.mag[w.id]<=0){if(G.ammo[w.id]>0)reload();else{SFX.empty();N.cool=.3}return}
 G.mag[w.id]--;N.cool=w.delay;N.shots++;SFX.shot(w);shake=Math.min(4,shake+w.dmg/20+.5);
 let anyHit=false;for(let p=0;p<w.pel;p++){const ax=tx+rnd(-w.spr,w.spr),ay=ty+rnd(-w.spr,w.spr)*.6;
  N.tracers.push({x:ax,y:ay,t:.06});let pierce=w.pierce;
  const cands=[];for(const z of N.zs){if(z.dead)continue;const h=zHit(z,ax,ay);if(h)cands.push([z,h])}cands.sort((a,b)=>b[0].y-a[0].y);
  for(const [z,h] of cands){const head=!!h.head;if(z.wounds.length<12)z.wounds.push({x:h.lx*z.flip,y:h.ly,r:head?.7:.45+Math.random()*.35,d:(Math.random()-.5)*.4});N.pow=w.dmg*w.pel;
   damage(z,w.dmg*(head?2.5:1)*(pierce<w.pierce?.7:1),head,ax,ay,true);anyHit=true;if(pierce--<=0)break}}
 if(anyHit)N.hits++;if(G.mag[w.id]<=0&&G.ammo[w.id]>0)setTimeout(()=>{if(state==='night')reload()},150)}
function damage(z,d,head,x,y,player){if(z.dead)return;z.hp-=d;z.flash=.08;N.pops.push({x,y:y-4,v:Math.round(d),head,t:.8});
 if(player&&head){N.heads++;shake=Math.max(shake,3)}SFX[head?'head':'hit']();
 spray(x,y,head?14:6,head?1.5:1);if(Math.random()<.6)splat(z.x+rnd(-4,4),z.y+rnd(-2,4),rnd(1.5,3)*z.s);
 if(z.hp<=0){z.dead=1;N.kills++;N.score+=ZT[z.t].sc*(head?2:1);const big=z.t==='boss';shake=Math.max(shake,big?9:2.5);
  if(head&&z.t!=='crawler'){z.headless=1;N.gibs.push({x:z.x,y:z.y-z.h*zsc(z)*.85,vx:rnd(-25,25),vy:rnd(-70,-45),r:0,vr:rnd(-12,12),t:1.4,head:1,s:zsc(z),v:z.v,type:z.t,gy:z.y+rnd(2,8)});spray(z.x,z.y-z.h*zsc(z)*.85,24,2.2)}
  for(let i=0;i<(big?14:4);i++)N.gibs.push({x:z.x+rnd(-4,4)*z.s,y:z.y-rnd(4,z.h)*z.s,vx:rnd(-35,35),vy:rnd(-60,-15),r:0,vr:rnd(-15,15),t:1.2,s:rnd(.6,1.4),gy:z.y+rnd(-3,8)});
  for(let i=0;i<(big?10:3);i++)splat(z.x+rnd(-z.w,z.w)*z.s*.6,z.y+rnd(-3,5),rnd(2.5,5)*z.s);
  N.corpses.push({v:z.v,t:z.t,x:z.x,y:z.y,s:zsc(z),flip:z.flip,headless:z.headless,wounds:z.wounds,pose:z.headless||big||(player&&N.pow>=24)?'back':'crumple',side:Math.random()<.5?-1:1,age:0})}}
function spray(x,y,n,k){for(let i=0;i<n;i++)N.parts.push({x,y,vx:rnd(-45,45)*k,vy:rnd(-60,15)*k,t:rnd(.35,.8),r:rnd(.5,1.4),c:Math.random()<.75?'#8a0a0a':'#5a0505',gy:y+rnd(4,14)})}
function updNight(dt){if(paused)return;if(N.msgT>0)N.msgT-=dt;
 N.spawnT-=dt;if(N.spawnT<=0&&N.toSpawn.length){spawn(N.toSpawn.shift());N.spawnT=Math.max(.35,2.4-G.night*.09)*rnd(.5,1.3);if(Math.random()<.2)SFX.groan()}
 if(N.cool>0)N.cool-=dt;if(N.reloading>0){N.reloading-=dt;if(N.reloading<=0)finishReload()}
 if(pointer.down&&pointer.y<BAR_Y+4&&!paused){const w=curW();if(w.auto||pointer.fresh){fire(pointer.x,pointer.y);pointer.fresh=false}}
 for(const z of N.zs){if(z.dead)continue;z.s=1.55*(.5+.5*clamp((z.y-FIELD_TOP)/(BAR_Y-FIELD_TOP),0,1));z.ph+=dt*(z.spd/3);z.flash-=dt;
  if(z.y<BAR_Y-1){z.y+=z.spd*dt*(z.s/1.2);z.x+=Math.sin(z.ph*.7)*dt*2;z.x=clamp(z.x,8,W-8)}else{z.atk-=dt;if(z.atk<=0){z.atk=z.t==='boss'?1.6:1.2;G.bar-=ZT[z.t].dmg;shake=Math.max(shake,ZT[z.t].dmg/4);SFX.bar();
   for(let i=0;i<4;i++)N.parts.push({x:z.x+rnd(-4,4),y:BAR_Y+2,vx:rnd(-30,30),vy:rnd(-40,-5),t:.5,r:rnd(.6,1.2),c:'#8a6236',gy:BAR_Y+rnd(6,14)})}}}
 for(const s of N.surv){s.rec=Math.max(0,(s.rec||0)-dt*6);s.cd-=dt;if(s.cd<=0){s.cd=rnd(.9,1.4);const tg=N.zs.filter(z=>!z.dead).sort((a,b)=>b.y-a.y)[0];
  if(tg){s.rec=1;N.tracers.push({x:tg.x,y:tg.y-tg.h*zsc(tg)/2,t:.05,fx:s.x,fy:BAR_Y+12});noise(.05,.2,2500);if(Math.random()<.75)damage(tg,8+G.night*.4,false,tg.x,tg.y-tg.h*zsc(tg)/2,false)}}}
 N.zs=N.zs.filter(z=>!z.dead);
 for(const p of N.parts){p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=160*dt;if(p.y>p.gy&&p.vy>0){p.t=0;if(p.c[1]!=='8'||p.c==='#8a0a0a')splat(p.x,p.y,p.r*.9)}}
 for(const g of N.gibs){g.t-=dt;if(g.y<g.gy||g.vy<0){g.x+=g.vx*dt;g.y+=g.vy*dt;g.vy+=170*dt;g.r+=g.vr*dt}else{g.vx=g.vy=g.vr=0}}N.gibs=N.gibs.filter(g=>g.t>0);for(const c of N.corpses)c.age+=dt;N.corpses=N.corpses.filter(c=>c.age<7);N.parts=N.parts.filter(p=>p.t>0);
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
// ---------- DRAW (vector cartoon) ----------
const OL='#1a120c',FH='"BlackOps","Impact",sans-serif',FP='"Elite","Courier New",monospace';
function txt(s,x,y,sz,col,al,font,ol){ctx.font=sz+'px '+(font||FH);ctx.textAlign=al||'left';ctx.lineJoin='round';
 if(ol!==0){ctx.lineWidth=ol||Math.max(1,sz*.22);ctx.strokeStyle=OL;ctx.strokeText(s,x,y)}ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y)}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function fs(fill,lw){ctx.fillStyle=fill;ctx.fill();if(lw!==0){ctx.lineWidth=lw||.9;ctx.strokeStyle=OL;ctx.lineJoin='round';ctx.stroke()}}
function poly(p){ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.closePath()}
function ell(x,y,rx,ry,r){ctx.beginPath();ctx.ellipse(x,y,rx,ry,r||0,0,Math.PI*2)}
function limb(x1,y1,x2,y2,w,col,x3,y3){ctx.lineCap='round';ctx.lineJoin='round';for(const [lw,c] of [[w+1.5,OL],[w,col]]){ctx.lineWidth=lw;ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);if(x3!=null)ctx.lineTo(x3,y3);ctx.stroke()}}
function btn(x,y,w,h,label,fn,opt={}){buttons.push({x,y,w,h,fn});const paper=opt.paper;
 rr(x,y,w,h,paper?1:2);fs(opt.bg||(paper?'#d9cba6':'#4a3520'),paper?.7:1);
 if(!paper){const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(255,220,160,.25)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');rr(x+.5,y+.5,w-1,h-1,2);ctx.fillStyle=g;ctx.fill()}
 if(label)txt(label,x+w/2+(opt.dx||0),y+h/2+(opt.sz||7)*.36,opt.sz||7,opt.fg||(paper?'#2a1a10':'#f2dcae'),'center',paper?FP:FH,paper?0:undefined)}
// ---- cached layers ----
let BG={},GRAIN=null,DEC=null,DECX=null;
function off(){const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const x=c.getContext('2d');x.setTransform(S,0,0,S,0,0);return[c,x]}
function seeded(seed){return()=>{seed=(seed*16807)%2147483647;return seed/2147483647}}
function buildBG(mode){const [c,x]=off();const R=seeded(7),c0=ctx;ctx=x;
 const night=mode==='night',dusk=mode==='day';
 let g=x.createLinearGradient(0,0,0,FIELD_TOP);g.addColorStop(0,night?'#0e1420':'#8f9aa0');g.addColorStop(1,night?'#3a3a3c':'#d8c294');x.fillStyle=g;x.fillRect(0,0,W,FIELD_TOP+2);
 if(night){for(let i=0;i<40;i++){x.fillStyle='rgba(220,220,200,'+(R()*.6+.2)+')';x.fillRect(R()*W,R()*40,.6,.6)}
  const mg=x.createRadialGradient(140,22,4,140,22,30);mg.addColorStop(0,'rgba(240,230,190,.45)');mg.addColorStop(1,'rgba(240,230,190,0)');x.fillStyle=mg;x.fillRect(100,0,80,60);
  ell(140,22,9,9);fs('#e8dfbf',.8);x.fillStyle='rgba(160,150,120,.5)';ell(137,20,2,2);x.fill();ell(143,25,1.5,1.5);x.fill();ell(142,18,1,1);x.fill()}
 else{const sg=x.createRadialGradient(40,40,2,40,40,40);sg.addColorStop(0,'rgba(255,200,120,.7)');sg.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=sg;x.fillRect(0,0,90,60)}
 // ruined skyline
 x.fillStyle=night?'#1b1d22':'#7a7466';[[0,14,16],[14,22,12],[26,10,18],[118,18,14],[132,26,10],[142,12,22],[164,20,16]].forEach(b=>{x.fillRect(b[0],FIELD_TOP-b[1],b[2],b[1]);x.fillStyle=night?'#151619':'#6a6458';x.fillRect(b[0]+2,FIELD_TOP-b[1]+3,1.5,2);x.fillStyle=night?'#1b1d22':'#7a7466'});
 // ground
 g=x.createLinearGradient(0,FIELD_TOP,0,H);g.addColorStop(0,night?'#3b3426':'#9a8458');g.addColorStop(1,night?'#1f1a12':'#6a5434');x.fillStyle=g;x.fillRect(0,FIELD_TOP,W,H-FIELD_TOP);
 // road
 poly([80,FIELD_TOP,100,FIELD_TOP,150,H,30,H]);fs(night?'#2c2924':'#7a7060',0);
 x.strokeStyle=night?'rgba(0,0,0,.4)':'rgba(40,30,20,.35)';x.lineWidth=.8;x.beginPath();x.moveTo(80,FIELD_TOP);x.lineTo(30,H);x.moveTo(100,FIELD_TOP);x.lineTo(150,H);x.stroke();
 for(let t=0;t<1;t+=.08){const t2=t+.035,y1=FIELD_TOP+(H-FIELD_TOP)*t*t,y2=FIELD_TOP+(H-FIELD_TOP)*t2*t2;poly([89.6-t*1.5,y1,90.4+t*1.5,y1,90.4+t2*1.5,y2,89.6-t2*1.5,y2]);x.fillStyle=night?'#7a7050':'#c9b880';x.fill()}
 // cracks
 x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=.5;for(let i=0;i<14;i++){let px=60+R()*60,py=FIELD_TOP+20+R()*(H-FIELD_TOP-20);x.beginPath();x.moveTo(px,py);for(let k=0;k<4;k++){px+=R()*8-4;py+=R()*6-3;x.lineTo(px,py)}x.stroke()}
 // debris & dead grass
 for(let i=0;i<50;i++){const px=R()*W,py=FIELD_TOP+4+R()*(BAR_Y-FIELD_TOP),sc=.4+.6*(py-FIELD_TOP)/(BAR_Y-FIELD_TOP);if(px>70&&px<110)continue;
  x.strokeStyle=night?'#4a4228':'#8a7a40';x.lineWidth=.5*sc;x.beginPath();for(let k=0;k<3;k++){x.moveTo(px+k*sc,py);x.lineTo(px+k*sc+(R()-.5)*2,py-2.5*sc)}x.stroke()}
 for(let i=0;i<16;i++){const px=R()*W,py=FIELD_TOP+8+R()*(BAR_Y-FIELD_TOP-14),sc=.5+.5*(py-FIELD_TOP)/(BAR_Y-FIELD_TOP),k=R();
  if(k<.4){ell(px,py,2.4*sc,1.4*sc);fs(night?'#4a4438':'#8a8070',.5)}
  else if(k<.6){ell(px,py,3*sc,1.4*sc);fs('#1a1a1a',.5);ell(px,py,1.2*sc,.6*sc);fs(night?'#3b3426':'#9a8458',0)}
  else if(k<.8){poly([px-3*sc,py,px+3*sc,py,px+3*sc,py-3.5*sc,px-3*sc,py-3.5*sc]);fs(night?'#4a3a22':'#8a6a3a',.5);x.strokeStyle=OL;x.lineWidth=.3;x.beginPath();x.moveTo(px-3*sc,py-1.7*sc);x.lineTo(px+3*sc,py-1.7*sc);x.stroke()}
  else{poly([px-2*sc,py,px+4*sc,py-1*sc,px+3*sc,py-2*sc]);fs(night?'#5a3a2a':'#9a5a3a',.5)}}
 // dead trees
 const tree=(tx,ty,sc,seed)=>{const r=seeded(seed);const br=(x0,y0,a,l,w,d)=>{const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;limb(x0,y0,x1,y1,w,night?'#2a2018':'#4a3a2a');if(d>0){br(x1,y1,a-.4-r()*.4,l*.7,w*.65,d-1);br(x1,y1,a+.3+r()*.4,l*.65,w*.6,d-1)}};
  br(tx,ty,-Math.PI/2+(r()-.5)*.2,10*sc,2.2*sc,3)};
 tree(14,FIELD_TOP+30,1.3,3);tree(166,FIELD_TOP+60,1.6,5);tree(40,FIELD_TOP+4,.7,9);tree(150,FIELD_TOP+8,.8,11);tree(8,FIELD_TOP+110,2,13);
 // abandoned car in field
 x.save();x.translate(150,FIELD_TOP+26);x.scale(.7,.7);rr(-12,-6,24,7,2);fs(night?'#4a2a1a':'#8a4a2a',.8);rr(-7,-10,13,5,2);fs(night?'#3a2a1a':'#6a3a22',.8);ell(-7,1,2.5,2.5);fs('#111',.6);ell(7,1,2.5,2.5);fs('#111',.6);x.restore();
 // grime overlay
 for(let i=0;i<220;i++){x.fillStyle=R()<.5?'rgba(0,0,0,'+R()*.12+')':'rgba(120,100,60,'+R()*.08+')';ell(R()*W,FIELD_TOP+R()*(H-FIELD_TOP),R()*6+1,R()*2+.5);x.fill()}
 // vignette
 const vg=x.createRadialGradient(W/2,H*.45,H*.25,W/2,H*.5,H*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,night?'rgba(0,0,10,.65)':'rgba(30,15,0,.4)');x.fillStyle=vg;x.fillRect(0,0,W,H);
 ctx=c0;return c}
function buildGrain(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),d=x.createImageData(128,128);
 for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()*22}x.putImageData(d,0,0);return c}
function buildCaches(){clearVariants();BG={night:buildBG('night'),day:buildBG('day')};GRAIN=ctx.createPattern(buildGrain(),'repeat');[DEC,DECX]=off()}
function clearDecals(){if(DECX){DECX.setTransform(1,0,0,1,0,0);DECX.clearRect(0,0,DEC.width,DEC.height);DECX.setTransform(S,0,0,S,0,0)}}
function splat(x,y,r){if(!DECX)return;const n=6+(r*2|0);DECX.fillStyle=Math.random()<.5?'rgba(110,8,8,.85)':'rgba(80,4,4,.85)';DECX.beginPath();
 for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr2=r*(.6+Math.random()*.6);DECX.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2*.5)}DECX.fill();
 for(let i=0;i<3;i++){DECX.beginPath();DECX.arc(x+rnd(-r*2,r*2),y+rnd(-r*.6,r*.6),r*rnd(.1,.25),0,7);DECX.fill()}}
// ---- barricade & shooters ----
const PLANKS=[[50,-8,90,-2,.15],[48,2,92,6,.35],[86,-6,132,-1,.55],[90,3,134,8,.75],[60,-12,78,8,.9],[104,-12,120,8,.45],[54,-4,130,-6,.25]];
function drawBarricade(){const hp=clamp(G.bar/G.barMax,0,1),y=BAR_Y;ctx.save();ctx.translate(0,y);
 // car wreck left
 ctx.save();ctx.translate(26,4);if(hp<.3)ctx.rotate(.04);
 ctx.beginPath();ctx.moveTo(-30,6);ctx.lineTo(-30,-4);ctx.quadraticCurveTo(-26,-8,-18,-8);ctx.lineTo(-12,-16);ctx.lineTo(10,-16);ctx.lineTo(18,-8);ctx.quadraticCurveTo(28,-7,30,-2);ctx.lineTo(30,6);ctx.closePath();fs('#7a3e22',1);
 const cg=ctx.createLinearGradient(0,-16,0,6);cg.addColorStop(0,'rgba(255,200,150,.2)');cg.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=cg;ctx.fill();
 poly([-10,-14,-1,-14,-1,-8,-15,-8]);fs('#1d2228',.7);poly([1,-14,9,-14,15,-8,1,-8]);fs('#1d2228',.7);
 ctx.strokeStyle='rgba(200,210,220,.5)';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(-8,-13);ctx.lineTo(-4,-9);ctx.moveTo(4,-13);ctx.lineTo(6,-10);ctx.lineTo(9,-12);ctx.stroke();
 ctx.fillStyle='#4a2010';for(const [rx,ry,r] of [[-22,0,2.5],[14,-2,2],[22,2,3],[-5,2,1.8]]){ell(rx,ry,r,r*.7);ctx.fill()}
 ell(-18,6,5,5);fs('#151515',1);ell(-18,6,2,2);fs('#555',.5);ell(18,6,5,5);fs('#151515',1);ell(18,6,2,2);fs('#555',.5);
 if(hp<.6){ctx.fillStyle='#111';poly([-28,-2,-24,0,-26,3]);ctx.fill();}ctx.restore();
 // planks
 for(const [x1,y1,x2,y2,thr] of PLANKS){const broken=hp<thr;if(broken&&hp<thr-.12)continue;ctx.save();
  const mx=(x1+x2)/2,my=(y1+y2)/2,ang=Math.atan2(y2-y1,x2-x1),len=Math.hypot(x2-x1,y2-y1)*(broken?.55:1);ctx.translate(broken?x1+(mx-x1)*.55:mx,my+(broken?3:0));ctx.rotate(ang+(broken?.35:0));
  rr(-len/2,-2.2,len,4.4,.6);fs('#8a6238',.9);ctx.strokeStyle='rgba(60,35,15,.6)';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(-len/2+2,-.6);ctx.lineTo(len/2-3,-.9);ctx.moveTo(-len/2+5,1);ctx.lineTo(len/2-6,.8);ctx.stroke();
  ctx.fillStyle='#bbb';ctx.fillRect(-len/2+1.2,-.5,.8,.8);ctx.fillRect(len/2-2,-.5,.8,.8);
  if(broken){poly([len/2,-2.2,len/2+2,-1,len/2+.5,0,len/2+2.5,1.2,len/2,2.2]);fs('#c8a070',.5)}ctx.restore()}
 // sandbags right
 const bags=[[140,4],[152,4],[164,4],[176,4],[146,-2],[158,-2],[170,-2],[152,-8],[164,-8],[176,-8]];
 bags.forEach(([bx,by],i)=>{if(hp<(i>6?.5:i>3?.25:0)&&i>3)return;rr(bx-6.5,by-3,13,6,3);fs(i%2?'#8a7a52':'#9a8a5e',.9);ctx.strokeStyle='rgba(40,30,10,.5)';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(bx-4,by);ctx.lineTo(bx+4,by);ctx.stroke()});
 // damage dirt / cracks
 if(hp<.5){ctx.fillStyle='rgba(90,10,10,.6)';ell(70,-4,3,1.4);ctx.fill();ell(120,2,2.5,1.2);ctx.fill()}
 ctx.restore()}
// ---- weapon icons ----
const GUNS={pistola:[[-6,-3,6,-3,6,0,-1,0,-1,1,-3,5,-6,5,-5,0,-6,0]],
 revolver:[[-7,-3,8,-3,8,-1,-1,-1,-1,0,-4,5,-7,5,-5,0]],
 escopeta:[[-13,-1,-6,-3,13,-3,13,-1,-2,-1,-2,1,-6,0,-13,3]],
 subfusil:[[-8,-3,9,-3,9,-1,2,-1,2,4,0,4,-1,-1,-3,-1,-4,4,-7,4,-6,-1,-8,-1]],
 rifle:[[-14,-1,-6,-2,14,-2,14,-1,0,-1,-2,1,-6,0,-14,3]],
 asalto:[[-12,-2,-5,-3,13,-3,13,-1,3,-1,4,5,1,5,0,-1,-3,-1,-4,4,-6,4,-6,-1,-12,2]],
 ametralladora:[[-13,-2,-4,-3,14,-3,14,-1,4,-1,4,3,-2,3,-3,-1,-6,-1,-8,4,-10,4,-10,-1,-13,1]]};
function gunIcon(id,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);for(const p of GUNS[id]){poly(p);fs('#2a2a2a',.9)}
 ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-3,-2.6,8,.6);if(id==='escopeta'||id==='rifle'){poly([-13,0,-6,-1.5,-3,-1,-6,.3]);fs('#7a4a22',.4)}ctx.restore()}
// ---- scene drawing ----
function overlay(){ctx.fillStyle=GRAIN;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate((Math.random()*128)|0,(Math.random()*128)|0);ctx.fillRect(-128,-128,cv.width+128,cv.height+128);ctx.restore()}
function bg(m){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(BG[m],0,0);ctx.restore()}
function aimPoint(){const tg=N&&N.zs.slice().sort((a,b)=>b.y-a.y)[0];return pointer.down&&pointer.y<BAR_Y?[pointer.x,pointer.y]:tg?[tg.x,tg.y-tg.h*zsc(tg)*.6]:[90,100]}
function hudPanel(x,y,w,h){rr(x,y,w,h,3);fs('rgba(20,14,8,.72)',.8)}
function iconBtn(x,y,kind,fn){btn(x,y,16,14,'',fn);ctx.fillStyle='#f2dcae';ctx.strokeStyle='#f2dcae';ctx.lineWidth=1.2;
 if(kind==='pause'){ctx.fillRect(x+5,y+3.5,2,7);ctx.fillRect(x+9,y+3.5,2,7)}else if(kind==='play'){poly([x+6,y+3.5,x+11.5,y+7,x+6,y+10.5]);ctx.fill()}
 else{poly([x+3.5,y+5.5,x+6,y+5.5,x+9,y+3,x+9,y+11,x+6,y+8.5,x+3.5,y+8.5]);ctx.fill();if(kind==='snd'){ctx.beginPath();ctx.arc(x+9,y+7,3,-.9,.9);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(x+10.5,y+5);ctx.lineTo(x+13.5,y+9);ctx.moveTo(x+13.5,y+5);ctx.lineTo(x+10.5,y+9);ctx.stroke()}}}
function toggleMute(){muted=!muted;localStorage.setItem('ub.mute',muted?'1':'0');if(muted&&AC)AC.suspend();else if(AC)AC.resume()}
function drawNight(){bg('night');ctx.save();if(shake)ctx.translate(rnd(-shake,shake)*.6,rnd(-shake,shake)*.6);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(DEC,0,0);ctx.restore();
 N.corpses.forEach(drawCorpse);
 N.zs.slice().sort((a,b)=>a.y-b.y).forEach(drawZombie);
 for(const g of N.gibs){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.r);if(g.head){ctx.restore();drawGibHead(g);continue}else{ell(0,0,1.2*g.s,.8*g.s);fs(Math.random()<.5?'#7a1010':'#a04040',.4)}ctx.restore()}
 drawBarricade();const [ax,ay]=aimPoint();
 N.surv.forEach((s,i)=>drawShooter(s.x,s.col,'#4a4a4a',ax,ay,false,s.rec||0,i));drawShooter(90,'#7a2e1e','#5a3a22',ax,ay,true,Math.max(0,N.cool/curW().delay*2-1),0);
 for(const t of N.tracers){ctx.strokeStyle='rgba(255,230,140,.9)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(t.fx||HERO.mx,t.fy||HERO.my);ctx.lineTo(t.x,t.y);ctx.stroke();ell(t.x,t.y,1.6,1.6);ctx.fillStyle='rgba(255,240,180,.8)';ctx.fill()}
 if(N.cool>curW().delay*.6){ell(HERO.mx,HERO.my,3,3);ctx.fillStyle='rgba(255,220,120,.9)';ctx.fill()}
 for(const p of N.parts){ctx.fillStyle=p.c;ell(p.x,p.y,p.r,p.r);ctx.fill()}
 ctx.restore();
 for(const q of N.pops){ctx.globalAlpha=Math.min(1,q.t*2);txt(q.head?q.v+'!':String(q.v),q.x,q.y,q.head?11:8,q.head?'#ffd23a':'#fff','center');ctx.globalAlpha=1}
 if(pointer.down&&pointer.y<BAR_Y){ctx.strokeStyle='#ff3a2a';ctx.lineWidth=.8;ell(pointer.x,pointer.y,4.5,4.5);ctx.stroke();ctx.beginPath();ctx.moveTo(pointer.x-7,pointer.y);ctx.lineTo(pointer.x-2,pointer.y);ctx.moveTo(pointer.x+2,pointer.y);ctx.lineTo(pointer.x+7,pointer.y);ctx.moveTo(pointer.x,pointer.y-7);ctx.lineTo(pointer.x,pointer.y-2);ctx.moveTo(pointer.x,pointer.y+2);ctx.lineTo(pointer.x,pointer.y+7);ctx.stroke()}
 overlay();
 // top HUD (inset from TikTok top bar)
 hudPanel(6,24,168,28);txt('NOCHE '+G.night+'/3 · PRUEBA',26,35,9,'#f2dcae');txt((G.score+N.score)+' pts',168,35,8,'#ffd23a','right');
 txt('Zombis: '+(N.toSpawn.length+N.zs.length),26,47,6.5,'#d8a090');
 rr(82,41,86,7,2);fs('#2a0a06',.6);rr(82,41,86*clamp(G.bar/G.barMax,0,1),7,2);fs(G.bar/G.barMax>.3?'#7aa83a':'#d83a2a',0);txt('BARRICADA '+Math.max(0,Math.round(G.bar)),125,47.2,5,'#fff','center',FH,1);
 iconBtn(8,26,paused?'play':'pause',()=>paused=!paused);iconBtn(8,40,muted?'mute':'snd',toggleMute);
 const boss=N.zs.find(z=>z.t==='boss');if(boss){txt('JEFE',90,62,8,'#ff5a3a','center');rr(40,64,100,5,2);fs('#2a0a06',.6);rr(40,64,100*clamp(boss.hp/boss.max,0,1),5,2);fs('#c82a1a',0)}
 // bottom weapon bar (inset above TikTok caption)
 const w=curW();hudPanel(6,238,140,34);gunIcon(w.id,24,250,1.05);
 txt(w.name.toUpperCase(),42,248,7,'#f2dcae');const am=isFinite(G.ammo[w.id])?G.ammo[w.id]:'∞';
 txt(N.reloading>0?'RECARGANDO':G.mag[w.id]+' / '+am,42,258,N.reloading>0?7:9,N.reloading>0?'#ffb84a':G.mag[w.id]?'#ffe08a':'#ff5a4a','left',isFinite(G.ammo[w.id])||N.reloading>0?FH:'Impact,Arial Black,sans-serif');
 btn(96,241,48,15,'RECARGAR',reload,{sz:6.5});
 const n=G.owned.length,bw=Math.min(20,(136-(n-1))/n);G.owned.forEach((id,i)=>{btn(8+i*(bw+1),261,bw,10,'',()=>{N.wi=i;N.reloading=0},{bg:i===N.wi?'#9a6a2a':'#2e2216'});gunIcon(id,8+i*(bw+1)+bw/2,266,.55)});
 if(N.msgT>0){ctx.globalAlpha=Math.min(1,N.msgT);txt('NOCHE '+G.night,W/2,130,22,'#c8281a','center');if(G.night%5===0)txt('¡Se acerca algo enorme!',W/2,146,8,'#ffd23a','center');ctx.globalAlpha=1}
 if(paused){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,H);txt('PAUSA',W/2,120,22,'#f2dcae','center');btn(45,140,90,20,'CONTINUAR',()=>paused=false,{sz:9});btn(45,166,90,18,'MENÚ',()=>{paused=false;G=load();state='title'},{sz:8})}}
const titleZ=[['walker',30,150],['walker',140,170],['walker',95,125],['walker',60,195],['walker',155,110]].map(([t,x,y],i)=>({t,x,y,v:null,wounds:[],w:ZT[t].w,h:ZT[t].h,s:.55+.45*(y-FIELD_TOP)/(BAR_Y-FIELD_TOP),ph:i*1.7,flash:0,flip:i%2?-1:1}));
function drawTitle(){bg('night');for(const z of titleZ){if(!z.v)z.v=variant(z.t,(z.ph*3|0)%8);z.ph+=.016*(z.t==='runner'?14:6);z.y+=.016*1.2;if(z.y>BAR_Y-2)z.y=FIELD_TOP+2;z.s=1.55*(.5+.5*(z.y-FIELD_TOP)/(BAR_Y-FIELD_TOP))}
 titleZ.slice().sort((a,b)=>a.y-b.y).forEach(drawZombie);const gb=G;if(!G)G={bar:100,barMax:100};drawBarricade();G=gb;
 drawShooter(90,'','#5a3a22',90,40,true,0,0);drawShooter(40,'','#444',60,60,false,0,0);drawShooter(140,'','#444',120,60,false,0,1);overlay();
 ctx.save();ctx.translate(W/2,66);ctx.rotate(-.04);txt('ÚLTIMA',0,0,26,'#c8281a','center',FH,3.5);txt('BARRICADA',0,24,22,'#e8d4a0','center',FH,3.5);
 ctx.fillStyle='#8a0e0e';for(const [dx,l] of [[-38,6],[-12,10],[22,5],[40,8]]){rr(dx,2,1.6,l,.8);ctx.fill()}ctx.restore();
 txt('VERSIÓN DE PRUEBA · 3 noches en bucle',W/2,104,8,'#f2dcae','center',FP,2);
 if(load()){btn(35,226,110,20,'CONTINUAR · NOCHE '+load().night,()=>{G=load();startDay()},{sz:7});btn(35,250,110,16,'NUEVA PARTIDA',()=>{G=newSave();save();startNight()},{sz:7})}
 else btn(35,232,110,24,'JUGAR',()=>{G=newSave();save();startNight()},{sz:12});
 iconBtn(156,26,muted?'mute':'snd',toggleMute);
 txt('Toca un zombi para disparar · cabeza ×2.5',W/2,276,5.5,'#d8c8a0','center',FP,1.5)}
function clipboard(){ctx.save();ctx.translate(0,0);rr(12,26,156,240,5);fs('#7a5232',1.2);const g=ctx.createLinearGradient(12,0,168,0);g.addColorStop(0,'rgba(255,220,170,.15)');g.addColorStop(1,'rgba(0,0,0,.25)');ctx.fillStyle=g;ctx.fill();
 ctx.save();ctx.translate(20,36);ctx.rotate(-.012);rr(0,0,140,222,1);fs('#e8dcbc',.8);ctx.strokeStyle='rgba(80,110,160,.35)';ctx.lineWidth=.35;for(let y=18;y<220;y+=9){ctx.beginPath();ctx.moveTo(4,y);ctx.lineTo(136,y);ctx.stroke()}
 ctx.strokeStyle='rgba(190,60,60,.45)';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(14,222);ctx.stroke();
 ctx.fillStyle='rgba(120,90,40,.15)';ell(110,180,14,9);ctx.fill();ell(30,60,6,4);ctx.fill();ctx.fillStyle='rgba(120,10,10,.35)';ell(125,30,3,2);ctx.fill();ell(128,34,1.4,1);ctx.fill();ctx.restore();
 rr(66,22,48,12,3);fs('#9a9a9a',1);rr(76,19,28,6,3);fs('#7a7a7a',.8);ctx.restore()}
function drawResults(){bg('day');drawBarricade();overlay();clipboard();
 txt('¡SOBREVIVISTE!',W/2,62,13,'#2a6a1a','center',FH,0);txt('Informe · Noche '+results.night,W/2,74,7,'#3a2a1a','center',FP,0);
 [['Zombis abatidos',results.kills],['Tiros a la cabeza',results.heads],['Precisión',results.acc+'%'],['Barricada',results.bar+' PV'],['Puntos noche',results.score],['Puntos total',G.score]]
  .forEach((r,i)=>{txt(r[0],38,96+i*18,7.5,'#2a1a10','left',FP,0);txt(String(r[1]),150,96+i*18,9,'#8a1a10','right',FH,0)});
 btn(45,214,90,22,'AMANECE ▶',startDay,{sz:9})}
function drawDay(){bg('day');drawBarricade();overlay();clipboard();txt('DÍA '+G.night,W/2,62,14,'#2a1a10','center',FH,0);
 if(dayReport){txt('Lo que encontramos:',30,80,7.5,'#3a2a1a','left',FP,0);dayReport.forEach((s,i)=>txt('• '+s,30,96+i*13,6.3,s[0]==='¡'?'#1a6a1a':s[0]==='+'?'#1a3a7a':'#4a3a2a','left',FP,0));
  txt(G.night%5===0?'Esta noche: ¡JEFE!':'Esta noche: la horda',W/2,200,9,G.night%5===0?'#a01a10':'#2a1a10','center',FH,0);btn(40,216,100,24,'COMENZAR NOCHE',startNight,{sz:8,bg:'#6a1a10'});return}
 const free=DAY_HOURS-used();txt('Horas libres: '+free+' / '+DAY_HOURS,W/2,76,8,free?'#8a1a10':'#1a5a1a','center',FP,0);
 TASKS.forEach(([k,l],i)=>{const y=84+i*28;txt(l,34,y+8,7.5,'#2a1a10','left',FP,0);btn(34,y+11,16,13,'−',()=>{if(dayAlloc[k]>0)dayAlloc[k]--},{sz:10,paper:1});
  txt(dayAlloc[k]+'h',63,y+21,9,'#2a1a10','center',FH,0);btn(76,y+11,16,13,'+',()=>{if(used()<DAY_HOURS)dayAlloc[k]++},{sz:10,paper:1});
  ctx.strokeStyle='#2a1a10';ctx.lineWidth=.6;for(let h=0;h<dayAlloc[k];h++){const hx=98+h*5+(h>=4?3:0)*Math.floor(h/4);ctx.beginPath();ctx.moveTo(hx,y+13);ctx.lineTo(hx+.6,y+22);ctx.stroke();if(h%4===3){ctx.beginPath();ctx.moveTo(hx-16,y+20);ctx.lineTo(hx+2,y+15);ctx.stroke()}}});
 txt('Barricada '+Math.round(G.bar)+'/'+G.barMax+' · Gente '+G.surv,W/2,200,6.5,'#3a2a1a','center',FP,0);
 G.owned.forEach((id,i)=>{const x=34+(i%4)*30,y=210+Math.floor(i/4)*12;gunIcon(id,x+8,y,.5);if(isFinite(G.ammo[id]))txt(String(G.ammo[id]+(G.mag[id]||0)),x+15,y+2,5,'#3a2a1a','left',FP,0)});
 btn(40,230,100,22,'SALIR A BUSCAR',resolveDay,{sz:8,bg:'#3a4a22'})}
function drawEnd(win){bg('night');if(N){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(DEC,0,0);ctx.restore();N.corpses.forEach(drawCorpse)}drawBarricade();overlay();
 ctx.fillStyle='rgba(40,0,0,.45)';ctx.fillRect(0,0,W,H);hudPanel(16,86,148,130);
 txt(win?'¡RESCATADO!':'LA BARRICADA',W/2,112,14,win?'#7aa83a':'#c8281a','center');if(!win)txt('CAYÓ',W/2,128,14,'#c8281a','center');
 txt(win?'Sobreviviste '+MAX_NIGHT+' noches':'Noche '+G.night,W/2,142,8,'#e8d4a0','center',FP);txt((G.score+(win?0:N.score))+' pts',W/2,156,10,'#ffd23a','center');
 if(!win)btn(40,166,100,20,'REINTENTAR NOCHE',()=>{G=N.start;G.ammo.pistola=Infinity;save();startNight()},{sz:7.5});
 btn(40,190,100,18,'MENÚ',()=>{G=load();state='title'},{sz:8})}
let fps=60;
function frame(now){const dt=Math.min(.05,(now-t0)/1000);t0=now;fps=fps*.95+(1/Math.max(dt,.001))*.05;time+=dt;shake=Math.max(0,shake-dt*22);
 if(state==='night')updNight(dt);
 buttons=[];ctx.setTransform(S,0,0,S,0,0);ctx.imageSmoothingEnabled=true;
 ({title:drawTitle,night:drawNight,results:drawResults,day:drawDay,gameover:()=>drawEnd(false),win:()=>drawEnd(true)})[state]();
 requestAnimationFrame(frame)}
window.__ready=1;buildCaches();
Promise.all([document.fonts.load('10px BlackOps'),document.fonts.load('10px Elite')]).catch(()=>{}).finally(()=>requestAnimationFrame(frame));
window.__game={get state(){return state},get G(){return G},get N(){return N},get fps(){return fps},startDay,startNight,endNight,fire,spawn};
