'use strict';
// TEST build: video-derived frame animation for hero + walker only.
let ANIM=null;const AIMG={};
fetch('anim/anim.json').then(r=>r.json()).then(m=>{ANIM=m;for(const k in m){const i=new Image();i.src='anim/'+k+'.webp';AIMG[k]=i}});
const ZH=36,HERO={x:90,h:90,mx:99,my:200,fireT:9,nightT:0,last:null};
function zsc(z){return z.s}
function ready(k){const i=AIMG[k];return ANIM&&i&&i.complete&&i.naturalWidth}
// draw frame i of clip k with feet (cell bottom) at (x,yb), height h
function drawFrame(k,i,x,yb,h,flip,clipHead){const m=ANIM[k],img=AIMG[k];i=clamp(i|0,0,m.n-1);const w=h*m.cw/m.ch,sx=(i%m.cols)*m.cw,sy=Math.floor(i/m.cols)*m.ch;
 ctx.save();ctx.translate(x,yb);ctx.scale(flip,1);
 if(clipHead){const f=m.f[i];ctx.beginPath();ctx.rect(-w,-h*1.1,w*2,h*1.2);ctx.arc((f[4]-m.cx)*w,-h+f[5]*h+h*.01,h*.06,0,Math.PI*2,true);ctx.clip('evenodd')}
 ctx.drawImage(img,sx,sy,m.cw,m.ch,-m.cx*w,-h,w,h);ctx.restore()}
function fpt(k,i,h,flip){const m=ANIM[k],f=m.f[clamp(i|0,0,m.n-1)],w=h*m.cw/m.ch;return{x0:(f[0]-m.cx)*w*flip,x1:(f[2]-m.cx)*w*flip,top:-h+f[1]*h,hx:(f[4]-m.cx)*w*flip,hy:-h+f[5]*h,bot:-h+f[3]*h}}
// walkers only, no survivors, 3-night loop
const _startNight=startNight;window.startNight=function(){if(G){G.surv=0;if(G.night>3)G.night=1}_startNight();N.toSpawn=N.toSpawn.filter(t=>t!=='boss').map(()=>'walker');N.surv=[];HERO.nightT=0};
const _resolveDay=resolveDay;window.resolveDay=function(){_resolveDay();G.surv=0;if(dayReport)dayReport=dayReport.filter(s=>!/supervivien/i.test(s))};
const _endNight=endNight;window.endNight=function(){const n=G.night;_endNight();if(state==='results'&&n>=3){G.night=1;save()}};
const _startDay=startDay;window.startDay=function(){_startDay();dayAlloc={armas:4,municion:5,supervivientes:0,reparar:3}};
TASKS.splice(2,1);
const _fire=fire;window.fire=function(tx,ty){const b=N.shots;_fire(tx,ty);if(N.shots>b){HERO.fireT=0;HERO.fireW=curW().id}};
const _upd=updNight;window.updNight=function(dt){_upd(dt);if(!paused){HERO.fireT+=dt;HERO.nightT+=dt;for(const z of N.zs){if(z.af==null){z.af=Math.random()*48;z.ar=rnd(.92,1.08)}
 const att=z.y>=BAR_Y-1;if(att!==z.att){z.att=att;z.af=Math.random()*10}
 z.af+=dt*(att?12*z.ar:12*z.spd/12.2*z.ar)}}};
function zState(z){if(z.af==null){z.af=Math.random()*48;z.ar=1}return z.y>=BAR_Y-1?['z_attack',Math.floor(z.af)%ANIM.z_attack.n]:['z_walk',Math.floor(z.af)%ANIM.z_walk.n]}
function drawWounds(list,h,flip){for(const w of list||[]){const x=w.x*flip*h,y=w.y*h,r=Math.max(.6,w.r*h*.045);const g=ctx.createRadialGradient(x,y,0,x,y,r*1.6);g.addColorStop(0,'rgba(30,0,0,.95)');g.addColorStop(.45,'rgba(110,8,8,.85)');g.addColorStop(1,'rgba(110,8,8,0)');ctx.fillStyle=g;ell(x,y,r*1.6,r*1.4);ctx.fill();
 ctx.strokeStyle='rgba(100,6,6,.8)';ctx.lineWidth=r*.45;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w.d*h*.02,y+r*3.2);ctx.stroke()}}
function drawZombie(z){if(!ready('z_walk')||!ready('z_attack'))return;const h=ZH*z.s,[k,i]=zState(z);
 ctx.fillStyle='rgba(0,0,0,.35)';ell(z.x,z.y,h*.17,h*.035);ctx.fill();
 drawFrame(k,i,z.x,z.y+h*.05,h,z.flip);
 if(z.wounds&&z.wounds.length){ctx.save();ctx.translate(z.x,z.y);drawWounds(z.wounds,h,z.flip);ctx.restore()}}
function zHit(z,ax,ay){if(!ANIM)return null;const h=ZH*z.s,[k,i]=zState(z),p=fpt(k,i,h,z.flip),yb=z.y+h*.05,lx=(ax-z.x)/h,ly=(ay-z.y)/h;
 const hx=z.x+p.hx,hy=yb+p.hy+h*.01;if(Math.hypot(ax-hx,(ay-hy)*.85)<h*.065)return{head:1,lx,ly};
 const xa=Math.min(p.x0,p.x1),xb=Math.max(p.x0,p.x1),cx=(xa+xb)/2,hw=(xb-xa)*.3;
 if(ax>z.x+cx-hw&&ax<z.x+cx+hw&&ay>yb+p.top+h*.1&&ay<yb+p.bot)return{head:0,lx,ly};return null}
function drawCorpse(c){const k=c.pose==='crumple'&&!c.headless?'z_dcrumple':'z_dback';if(!ready(k))return;const h=ZH*c.s,m=ANIM[k],i=Math.min(m.n-1,c.age*m.fps);
 const al=c.age<5?1:Math.max(0,1-(c.age-5)/2);ctx.globalAlpha=al;drawFrame(k,i,c.x,c.y+h*.05,h,c.flip,c.headless);
 if(c.headless){const p=fpt(k,i,h,c.flip);ctx.fillStyle='#4a0404';ell(c.x+p.hx,c.y+h*.05+p.hy+h*.06,h*.035,h*.015);ctx.fill();ctx.fillStyle='#d8ceb0';ell(c.x+p.hx,c.y+h*.05+p.hy+h*.06,h*.01,h*.006);ctx.fill()}
 ctx.globalAlpha=1}
function drawGibHead(g){if(!ready('z_walk'))return;const m=ANIM.z_walk,img=AIMG.z_walk,i=0,f=m.f[i],h=ZH*g.s,w=h*m.cw/m.ch,r=.065;
 ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.r);ctx.beginPath();ctx.arc(0,0,h*r,0,Math.PI*2);ctx.clip();
 ctx.drawImage(img,(f[4]-r*m.ch/m.cw)*m.cw,(f[5]-r)*m.ch,2*r*m.ch,2*r*m.ch,-h*r,-h*r,2*h*r,2*h*r);ctx.restore();ctx.fillStyle='#5a0505';ell(g.x,g.y+h*.05,h*.03,h*.012);ctx.fill()}
function heroClip(aimX){const w=N?curW():null,sg=w&&(w.id==='escopeta');
 if(N&&N.reloading>0&&w){const m=ANIM.h_reload;return['h_reload',(1-N.reloading/w.rel)*(m.n-1),0]}
 if(N&&HERO.fireT<1.2){if(HERO.fireW==='escopeta'){const fm=ANIM.h_sgfire,pm=ANIM.h_sgpump,t1=fm.n/fm.fps;if(HERO.fireT<t1)return['h_sgfire',HERO.fireT*fm.fps,1];const t=HERO.fireT-t1;if(t<pm.n/pm.fps)return['h_sgpump',t*pm.fps,0]}
  else{const fm=ANIM.h_pfire;if(HERO.fireT<fm.n/fm.fps)return['h_pfire',HERO.fireT*fm.fps,1]}}
 if(N&&HERO.nightT<ANIM.h_raise.n/ANIM.h_raise.fps)return['h_raise',HERO.nightT*ANIM.h_raise.fps,0];
 const a=clamp((aimX-HERO.x)/70,-1,1);if(Math.abs(a)>.25){const m=ANIM.h_sweep;return['h_sweep',Math.round((a+1)/2*(m.n-1)),2,a]}
 const m=ANIM.h_idle,t=time*m.fps%(2*m.n-2);return['h_idle',t<m.n?t:2*m.n-2-t,0]}
function drawShooter(x,col,gun,aimX,aimY,main){if(!main||!ANIM)return;for(const k of['h_idle','h_raise','h_pfire','h_sgfire','h_sgpump','h_reload','h_sweep'])if(!ready(k))return;
 const [k,i,kind,a]=heroClip(aimX),h=HERO.h,yb=BAR_Y+62;drawFrame(k,i,x,yb,h,1);
 const p=fpt(k,i,h,1);HERO.mx=x+(kind===2&&a<0?p.x0:p.x1);HERO.my=yb-h*.86}
