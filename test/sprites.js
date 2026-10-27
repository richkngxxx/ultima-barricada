'use strict';
// TEST build: photo-real sprites for hero + walker only.
const SPR={};['z_front','z_step','z_tq','z_lunge','z_dead','h_aim','h_back'].forEach(k=>{const i=new Image();i.src='sprites/'+k+'.webp';SPR[k]=i});
const ZH=34,HERO={x:90,h:84,mx:99,my:201};
const FR={z_front:{cx:.455,neck:.119},z_step:{cx:.412,neck:.109},z_tq:{cx:.399,neck:.104}};
function ok(i){return i&&i.complete&&i.naturalWidth}
function zsc(z){return z.s}
// walkers only, no survivors, 3-night loop
const _startNight=startNight;window.startNight=function(){if(G){G.surv=0;if(G.night>3)G.night=1}_startNight();N.toSpawn=N.toSpawn.filter(t=>t!=='boss').map(()=>'walker');N.surv=[]};
const _resolveDay=resolveDay;window.resolveDay=function(){_resolveDay();G.surv=0;if(dayReport)dayReport=dayReport.filter(s=>!/supervivien/i.test(s))};
const _endNight=endNight;window.endNight=function(){const n=G.night;_endNight();if(state==='results'&&n>=3){G.night=1;save()}};
TASKS.splice(2,1);
function frameFor(z){const cyc=[['z_step',1],['z_front',1],['z_step',-1],['z_tq',-1]];const p=(z.ph/Math.PI)%4,i=Math.floor(p),f=p-i;return[cyc[i%4],cyc[(i+1)%4],f]}
function drawSpr(img,h,flip,alpha,clipNeck,neck){if(!ok(img))return;const w=h*img.naturalWidth/img.naturalHeight;ctx.save();ctx.globalAlpha*=alpha;ctx.scale(flip,1);
 if(clipNeck){const sy=img.naturalHeight*neck;ctx.drawImage(img,0,sy,img.naturalWidth,img.naturalHeight-sy,-w/2,-h+h*neck,w,h-h*neck)}else ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();return w}
function drawWounds(list,h,flip){for(const w of list||[]){const x=w.x*flip*h,y=w.y*h,r=Math.max(.7,w.r*h*.05);const g=ctx.createRadialGradient(x,y,0,x,y,r*1.6);g.addColorStop(0,'rgba(30,0,0,.95)');g.addColorStop(.45,'rgba(110,8,8,.85)');g.addColorStop(1,'rgba(110,8,8,0)');ctx.fillStyle=g;ell(x,y,r*1.6,r*1.4);ctx.fill();
 ctx.strokeStyle='rgba(100,6,6,.8)';ctx.lineWidth=r*.45;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w.d*h*.02,y+r*3.2);ctx.stroke()}}
function stump(h,cx){ell(cx,-h*(1-.125),h*.045,h*.018);ctx.fillStyle='#4a0404';ctx.fill();ell(cx,-h*(1-.123),h*.014,h*.009);ctx.fillStyle='#d8ceb0';ctx.fill()}
function drawZombie(z){const h=ZH*z.s,att=z.y>=BAR_Y-1;ctx.save();ctx.translate(z.x,z.y);
 ctx.fillStyle='rgba(0,0,0,.35)';ell(0,0,h*.2,h*.045);ctx.fill();
 if(att){const k=Math.sin(time*7+z.ph);ctx.translate(k*h*.015,0);ctx.rotate(k*.04);
  const img=k>0?SPR.z_lunge:SPR.z_step;if(img===SPR.z_lunge){const w=h*1.05*img.naturalWidth/(img.naturalHeight/.78);ctx.save();ctx.scale(z.flip,1);if(ok(img))ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight*.78,-w/2,-h*1.02,w,h*1.02*.85);ctx.restore()}else drawSpr(img,h,-z.flip,1);
  drawWounds(z.wounds,h,z.flip);ctx.restore();return}
 const [a,b,f]=frameFor(z),bob=Math.abs(Math.sin(z.ph))*h*.018,sway=Math.sin(z.ph)*.03;
 ctx.translate(0,-bob);ctx.rotate(sway);ctx.scale(1+.02*Math.cos(z.ph*2),1-.02*Math.cos(z.ph*2));
 const fa=f<.86?1:1-(f-.86)/.14;drawSpr(SPR[a[0]],h,a[1]*z.flip,1);if(fa<1)drawSpr(SPR[b[0]],h,b[1]*z.flip,1-fa);
 drawWounds(z.wounds,h,z.flip);ctx.restore()}
function zHit(z,ax,ay){const h=ZH*z.s,lx=(ax-z.x)/h,ly=(ay-z.y)/h;
 if(Math.hypot((lx-(-.02*z.flip))*1.25,ly+.935)<.075)return{head:1,lx,ly};
 if(Math.abs(lx)<.17+(ly<-.45&&ly>-.62?.08:0)&&ly>-.87&&ly<.02)return{head:0,lx,ly};return null}
function drawCorpse(c){const h=ZH*c.s,f=Math.min(1,c.age/.5),e=1-(1-f)*(1-f),al=c.age<5?1:Math.max(0,1-(c.age-5)/2);ctx.save();ctx.globalAlpha=al;ctx.translate(c.x,c.y);
 if(c.headless){ctx.save();ctx.translate(0,-e*h*.05);ctx.scale(1+.05*e,1-.6*e);drawSpr(SPR.z_front,h,c.flip,1,true,.125);stump(h,(.455-.5)*h*.45*c.flip);drawWounds(c.wounds,h,c.flip);ctx.restore()}
 else{if(f<1){ctx.save();ctx.rotate(e*.5*c.side);ctx.scale(1,1-.45*e);drawSpr(SPR.z_front,h,c.flip,1-e);ctx.restore()}
  if(ok(SPR.z_dead)){const dh=h*.55;ctx.globalAlpha=al*e;drawSpr(SPR.z_dead,dh,c.flip*c.side,1)}}
 ctx.restore();ctx.globalAlpha=1}
function drawGibHead(g){const img=SPR.z_front;if(!ok(img))return;const h=ZH*g.s,w=h*img.naturalWidth/img.naturalHeight,sh=img.naturalHeight*.125;ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.r);
 ctx.drawImage(img,img.naturalWidth*.25,0,img.naturalWidth*.42,sh,-w*.21,-h*.0625,w*.42,h*.125);ell(0,h*.06,h*.03,h*.012);ctx.fillStyle='#5a0505';ctx.fill();ctx.restore()}
function drawShooter(x,col,gun,aimX,aimY,main,rec){if(!main)return;rec=rec||0;const img=ok(SPR.h_aim)?SPR.h_aim:SPR.h_back;if(!ok(img))return;
 const h=HERO.h,w=h*img.naturalWidth/img.naturalHeight,y0=BAR_Y+58,ang=clamp((aimX-x)/260,-.14,.14);
 ctx.save();ctx.translate(x,y0+rec*1.4);ctx.rotate(ang-rec*.03);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();
 const c=Math.cos(ang),s=Math.sin(ang),gx=(.84-.5)*w,gy=-h*(1-.135);HERO.mx=x+gx*c-gy*s;HERO.my=y0+gx*s+gy*c+rec*1.4;
 if(rec>.5){ctx.fillStyle='rgba(255,210,110,.9)';ell(HERO.mx,HERO.my-2,1.6,3);ctx.fill();ctx.fillStyle='rgba(255,255,220,.95)';ell(HERO.mx,HERO.my-1.5,.8,1.4);ctx.fill()}}
const _startDay=startDay;window.startDay=function(){_startDay();dayAlloc={armas:4,municion:5,supervivientes:0,reparar:3}};
