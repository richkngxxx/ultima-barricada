'use strict';
// Semi-realistic character renderer. Static parts (torso, head) are cached per variant on offscreen canvases.
const VARS={},OLC='rgba(22,14,10,.85)';
const SKINS=['#9ca48c','#a3a08a','#8f9a86','#a8a894','#94a090','#9a9682','#a0a890'];
const SHIRTS=['#5a6470','#6a4a3a','#4a5a3a','#7a6a50','#3a3a42','#8a8270','#6a2a24','#3e4a5a','#a09a88','#7a7a6a'];
const PANTS=['#3a3a34','#2e3440','#4a4030','#3a2e26','#505048','#2a2a2a','#3c4a5a'];
const HAIRC=['#2a221a','#3a2e22','#55483a','#1a1a1a','#6a6050','#4a3020'];
function hx2(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]}
function tn(c,k){const [r,g,b]=hx2(c);const f=v=>Math.round(clamp(k>0?v+(255-v)*k:v*(1+k),0,255));return'rgb('+f(r)+','+f(g)+','+f(b)+')'}
function tint(c,dr,dg,db){const [r,g,b]=hx2(c);const h=v=>('0'+clamp(Math.round(v),0,255).toString(16)).slice(-2);return'#'+h(r+dr)+h(g+dg)+h(b+db)}
function zsc(z){return z.s*z.v.k*z.v.hm}
function clearVariants(){for(const k in VARS)delete VARS[k]}
function variant(t,i){const key=t+i;if(VARS[key])return VARS[key];const R=seeded(1013+i*7919+t.charCodeAt(0)*131+t.length*17);const pick=a=>a[(R()*a.length)|0];
 const boss=t==='boss',fat=t==='fat';
 const v={t,key,k:boss?1.75:1,hm:boss?1:.92+R()*.16,sw:fat?5.1:boss?6.4:t==='runner'?3.3:3.7,ww:fat?5.4:boss?4.7:t==='runner'?2.5:2.9,hw:fat?3.7:boss?3.3:2.45,
  belly:fat,lw:fat?1.35:boss?1.5:t==='runner'?.9:1,aw:boss?1.9:fat?1.3:1,
  skin:boss?'#8a8c74':tint(pick(SKINS),(R()-.5)*16,(R()-.5)*16,(R()-.5)*12),shirt:pick(SHIRTS),pants:pick(PANTS),hair:pick(HAIRC),hs:(R()*5)|0,
  sleeve:boss?-1:(R()*3)|0,ribs:R()<.45||boss,torn:R()<.45,shoes:R()<.8,arm:R()<.35?1:0,hunch:boss?1.4:t==='walker'?.6+R()*.9:t==='runner'?.5:.3,
  tilt:(R()-.5)*.3,jaw:boss?1:.35+R()*.6,seed:(R()*1e6)|0};
 const res=S*1.55*v.k*v.hm*1.1;
 v.tx=-(v.sw+(fat?3:2.4)+(boss?2:0));v.ty=-26.6;v.tw=-2*v.tx;v.th=13.6;
 v.torso=mk(v.tw,v.th,res,X=>{X.translate(-v.tx,-v.ty);drawTorsoS(X,v,seeded(v.seed))});
 v.hx=-3.8;v.hy=-30;v.hw2=7.6;v.hh=8.4;
 v.head=mk(v.hw2,v.hh,res,X=>{X.translate(-v.hx,-v.hy);drawHeadS(X,v,seeded(v.seed+5))});
 return VARS[key]=v}
function mk(w,h,res,fn){const c=document.createElement('canvas');c.width=Math.ceil(w*res);c.height=Math.ceil(h*res);const X=c.getContext('2d');X.scale(res,res);X.lineJoin='round';X.lineCap='round';fn(X);return c}
function E(X,x,y,rx,ry,r){X.beginPath();X.ellipse(x,y,rx,ry,r||0,0,Math.PI*2)}
function jag(X,cx,cy,r,R,n){X.beginPath();for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rr=r*(.6+R()*.6);X.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.8)}X.closePath()}
function drawTorsoS(X,v,R){const sw=v.sw,ww=v.ww,hw=v.hw,T=-22.6,Wy=-17.4,Hy=-14.6,boss=v.t==='boss';
 const base=v.sleeve<0?v.skin:v.shirt;
 if(boss){E(X,0,T+.2,3.6,2.2);X.fillStyle=tn(v.skin,-.2);X.fill();X.lineWidth=.2;X.strokeStyle=OLC;X.stroke();
  for(const [x,y,a] of [[-2.6,T-.6,-.6],[-1,T-1.3,-.2],[1.2,T-1.2,.25],[2.8,T-.4,.6]]){X.save();X.translate(x,y);X.rotate(a);X.beginPath();X.moveTo(-.35,0);X.lineTo(0,-1.8);X.lineTo(.35,0);X.closePath();X.fillStyle='#d4cbb0';X.fill();X.strokeStyle=OLC;X.lineWidth=.15;X.stroke();X.restore()}}
 // neck with tendons
 X.beginPath();X.moveTo(-1,-24.6);X.lineTo(1,-24.6);X.lineTo(1.35*(boss?1.6:1),T+.3);X.lineTo(-1.35*(boss?1.6:1),T+.3);X.closePath();
 let g=X.createLinearGradient(-1.3,0,1.3,0);g.addColorStop(0,tn(v.skin,-.35));g.addColorStop(.5,tn(v.skin,-.1));g.addColorStop(1,tn(v.skin,-.4));X.fillStyle=g;X.fill();
 X.strokeStyle=tn(v.skin,-.45);X.lineWidth=.12;X.beginPath();X.moveTo(-.6,-24.4);X.lineTo(-.2,T+.2);X.moveTo(.6,-24.4);X.lineTo(.2,T+.2);X.stroke();
 // pants waist
 X.beginPath();X.moveTo(-hw-.2,Hy-.8);X.lineTo(hw+.2,Hy-.8);X.lineTo(hw+.1,Hy+.6);X.lineTo(-hw-.1,Hy+.6);X.closePath();X.fillStyle=tn(v.pants,-.1);X.fill();X.strokeStyle=OLC;X.lineWidth=.18;X.stroke();
 X.fillStyle='#2a2018';X.fillRect(-hw,Hy-.75,hw*2,.35);
 const P=()=>{X.beginPath();X.moveTo(-1.4,T-.2);X.quadraticCurveTo(-sw*.75,T-.35,-sw,T+.75);X.quadraticCurveTo(-sw-.3,T+2.1,-sw+.4,T+3.8);
  if(v.belly)X.bezierCurveTo(-ww-1.2,Wy-.5,-ww-.6,Hy+.4,-hw-.2,Hy+.3);else X.quadraticCurveTo(-ww-.1,Wy+.6,-hw,Hy);
  const n=9;for(let i=1;i<n;i++)X.lineTo(-hw+2*hw*i/n,Hy+(v.sleeve<0?0:((i*7+v.seed)%4)*.18+.1));
  X.lineTo(hw,Hy);if(v.belly)X.bezierCurveTo(ww+.6,Hy+.4,ww+1.2,Wy-.5,sw-.4,T+3.8);else X.quadraticCurveTo(ww+.1,Wy+.6,sw-.4,T+3.8);
  X.quadraticCurveTo(sw+.3,T+2.1,sw,T+.75);X.quadraticCurveTo(sw*.75,T-.35,1.4,T-.2);X.quadraticCurveTo(0,T+.5,-1.4,T-.2);X.closePath()};
 P();g=X.createLinearGradient(0,T-.5,0,Hy+.5);g.addColorStop(0,tn(base,.18));g.addColorStop(.35,base);g.addColorStop(1,tn(base,-.32));X.fillStyle=g;X.fill();
 X.save();P();X.clip();
 g=X.createLinearGradient(-sw-.5,0,sw+.5,0);g.addColorStop(0,'rgba(0,0,0,.42)');g.addColorStop(.28,'rgba(0,0,0,0)');g.addColorStop(.62,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.38)');X.fillStyle=g;X.fillRect(-sw-1,T-1,sw*2+2,12);
 X.fillStyle='rgba(255,245,220,.10)';E(X,-sw*.35,T+1.3,sw*.45,1.1,-.2);X.fill();
 if(boss){X.strokeStyle=tn(v.skin,-.42);X.lineWidth=.22;X.beginPath();X.moveTo(-sw*.75,T+2.6);X.quadraticCurveTo(-sw*.3,T+4,0,T+2.8);X.quadraticCurveTo(sw*.3,T+4,sw*.75,T+2.6);X.moveTo(0,T+1);X.lineTo(0,Hy-1);
  for(let i=0;i<3;i++){X.moveTo(-1.5,T+4.6+i*1.4);X.quadraticCurveTo(0,T+5+i*1.4,1.5,T+4.6+i*1.4)}X.stroke();
  for(let i=0;i<5;i++){E(X,(R()-.5)*sw*1.6,T+1+R()*6,.4+R()*.7,.3+R()*.5);X.fillStyle=tn(v.skin,.12);X.fill();X.strokeStyle=tn(v.skin,-.4);X.lineWidth=.1;X.stroke()}
  jag(X,sw*.35,T+5.2,1.6,R,10);X.fillStyle='#8a3a30';X.fill();X.strokeStyle='#d8a090';X.lineWidth=.08;for(let i=0;i<5;i++){X.beginPath();X.moveTo(sw*.35-1+i*.4,T+4.2);X.lineTo(sw*.35-.8+i*.4,T+6.1);X.stroke()}
  X.strokeStyle='rgba(70,40,80,.55)';X.lineWidth=.1;for(let i=0;i<6;i++){let x=(R()-.5)*sw*1.6,y=T+R()*7;X.beginPath();X.moveTo(x,y);for(let k=0;k<4;k++){x+=(R()-.5)*1.2;y+=R()*.9;X.lineTo(x,y)}X.stroke()}}
 else{
  // folds
  X.strokeStyle=tn(base,-.38);X.lineWidth=.16;X.globalAlpha=.8;X.beginPath();
  X.moveTo(-sw+.6,T+3.4);X.quadraticCurveTo(-sw*.3,T+5,-hw*.4,Hy-1.2);X.moveTo(sw-.6,T+3.6);X.quadraticCurveTo(sw*.25,T+5.4,hw*.5,Hy-.8);
  X.moveTo(-1.2,Wy+.2);X.quadraticCurveTo(0,Wy+.8,1.4,Wy);X.moveTo(-hw*.6,Hy-1.5);X.lineTo(-hw*.5,Hy-.2);X.moveTo(hw*.2,Hy-1.8);X.lineTo(hw*.35,Hy-.2);X.stroke();X.globalAlpha=1;
  X.strokeStyle=tn(base,.25);X.lineWidth=.1;X.beginPath();X.moveTo(-sw*.4,T+2.2);X.quadraticCurveTo(-sw*.1,T+3.4,0,T+5);X.stroke();
  // collar / neckline
  if(v.hs%2){X.beginPath();X.moveTo(-1.3,T-.1);X.lineTo(0,T+1.9);X.lineTo(1.3,T-.1);X.closePath();X.fillStyle=tn(v.skin,-.15);X.fill();X.strokeStyle=OLC;X.lineWidth=.14;X.stroke()}
  else{E(X,0,T+.1,1.5,.75);X.fillStyle=tn(v.skin,-.2);X.fill();X.strokeStyle=tn(base,-.45);X.lineWidth=.25;X.stroke()}
  // buttons/pocket
  if(v.seed%3===0){X.fillStyle=tn(base,-.4);for(let i=0;i<4;i++)E(X,.15,T+2.2+i*1.6,.12,.12),X.fill();X.strokeStyle=tn(base,-.4);X.lineWidth=.1;X.beginPath();X.moveTo(.1,T+1.5);X.lineTo(.2,Hy);X.stroke()}
  // tears with skin & ribs
  const nt=1+((R()*3)|0);for(let i=0;i<nt;i++){const cx=(R()-.5)*sw*1.3,cy=T+2+R()*6,r=.7+R()*1.1;jag(X,cx,cy,r,R,9);X.fillStyle=tn(v.skin,-.12);X.fill();
   if(v.ribs&&i===0){X.strokeStyle=tn(v.skin,-.5);X.lineWidth=.14;for(let k=-1;k<=1;k++){X.beginPath();X.arc(cx,cy+k*.5-1.4,1.5,1.1,2.0);X.stroke()}X.fillStyle='rgba(110,10,10,.55)';E(X,cx+.2,cy+.2,r*.4,r*.3);X.fill()}
   X.strokeStyle='rgba(70,8,8,.8)';X.lineWidth=.14;jag(X,cx,cy,r,seeded(i+v.seed),9);X.stroke()}}
 // stains
 for(let i=0;i<4;i++){const cx=(R()-.5)*sw*1.6,cy=T+1+R()*7.5,r=.5+R()*1.4;const gg=X.createRadialGradient(cx,cy,0,cx,cy,r);const blood=R()<.6;
  gg.addColorStop(0,blood?'rgba(100,8,8,.75)':'rgba(55,40,20,.45)');gg.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=gg;E(X,cx,cy,r,r*.8);X.fill();
  if(blood&&R()<.5){X.strokeStyle='rgba(100,8,8,.6)';X.lineWidth=.18;X.beginPath();X.moveTo(cx,cy);X.lineTo(cx+(R()-.5)*.3,cy+1+R()*2);X.stroke()}}
 X.restore();
 if(v.belly){E(X,0,Hy-.5,ww*.72,1.3);g=X.createLinearGradient(0,Hy-1.8,0,Hy+.8);g.addColorStop(0,tn(v.skin,-.25));g.addColorStop(.4,tn(v.skin,-.12));g.addColorStop(1,tn(v.skin,-.35));X.fillStyle=g;X.fill();X.strokeStyle=OLC;X.lineWidth=.16;X.stroke();E(X,0,Hy-.4,.18,.12);X.fillStyle='#3a2a20';X.fill();
  X.strokeStyle='rgba(70,40,80,.4)';X.lineWidth=.08;X.beginPath();X.moveTo(-2,Hy-.9);X.quadraticCurveTo(-1,Hy-.2,-1.6,Hy+.2);X.stroke()}
 P();X.strokeStyle=OLC;X.lineWidth=.22;X.stroke();
 // shoulder AO for arms
 X.fillStyle='rgba(0,0,0,.18)';E(X,-sw+.4,T+2.6,.7,1.4);X.fill();E(X,sw-.4,T+2.6,.7,1.4);X.fill()}
function drawHeadS(X,v,R){const cy=-26.6,sk=v.skin,boss=v.t==='boss',j=v.jaw*.7;
 E(X,-2.02,cy+.35,.34,.62);X.fillStyle=tn(sk,-.25);X.fill();X.strokeStyle=OLC;X.lineWidth=.12;X.stroke();E(X,2.02,cy+.35,.34,.62);X.fill();X.stroke();
 const P=()=>{X.beginPath();X.moveTo(-1.95,cy+.4);X.bezierCurveTo(-2.25,cy-3,2.25,cy-3,1.95,cy+.4);X.quadraticCurveTo(1.9,cy+1.3,1.35,cy+1.6);
  X.lineTo(1.0,cy+2.3+j);X.quadraticCurveTo(0,cy+2.8+j,-1.0,cy+2.3+j);X.lineTo(-1.35,cy+1.6);X.quadraticCurveTo(-1.9,cy+1.3,-1.95,cy+.4);X.closePath()};
 P();let g=X.createRadialGradient(-.5,cy-1.3,.2,0,cy,3.2);g.addColorStop(0,tn(sk,.2));g.addColorStop(.55,sk);g.addColorStop(1,tn(sk,-.4));X.fillStyle=g;X.fill();
 X.save();P();X.clip();
 for(const s of[-1,1]){g=X.createRadialGradient(s*1.3,cy+1.05,0,s*1.3,cy+1.05,1);g.addColorStop(0,'rgba(30,20,10,.4)');g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(s*1.3-1,cy,2,2.2)}
 for(let i=0;i<3;i++){const x=(R()-.5)*3,y=cy-1.5+R()*3,r=.3+R()*.6;g=X.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,R()<.5?'rgba(80,90,40,.5)':'rgba(90,50,30,.5)');g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(x-r,y-r,r*2,r*2)}
 X.strokeStyle='rgba(70,40,90,.5)';X.lineWidth=.07;for(let i=0;i<3+(boss?4:0);i++){let x=(R()<.5?-1:1)*(1.2+R()*.6),y=cy-1.6+R()*1.2;X.beginPath();X.moveTo(x,y);for(let k=0;k<3;k++){x+=(R()-.5)*.6;y+=.3+R()*.3;X.lineTo(x,y)}X.stroke()}
 X.restore();
 // sockets & eyes
 for(const s of[-1,1]){g=X.createRadialGradient(s*.78,cy+.05,0,s*.78,cy+.05,.75);g.addColorStop(0,'rgba(12,6,4,.98)');g.addColorStop(.6,'rgba(30,15,10,.75)');g.addColorStop(1,'rgba(40,25,15,0)');X.fillStyle=g;E(X,s*.78,cy+.05,.75,.6);X.fill();
  E(X,s*.72+.06,cy+.08,.14,.13);X.fillStyle=boss?'#ff4020':'#d8d4a8';X.fill()}
 X.strokeStyle=tn(sk,-.5);X.lineWidth=.16;X.beginPath();X.moveTo(-1.4,cy-.55);X.quadraticCurveTo(-.8,cy-.8,-.25,cy-.5);X.moveTo(1.4,cy-.55);X.quadraticCurveTo(.8,cy-.8,.25,cy-.5);X.stroke();
 X.beginPath();X.moveTo(0,cy+.2);X.lineTo(-.28,cy+1);X.lineTo(.28,cy+1);X.closePath();X.fillStyle=tn(sk,-.4);X.fill();E(X,-.13,cy+1,.08,.06);X.fillStyle='#120806';X.fill();E(X,.13,cy+1,.08,.06);X.fill();
 // open mouth
 X.beginPath();X.moveTo(-.9,cy+1.4);X.quadraticCurveTo(0,cy+1.25,.9,cy+1.4);X.lineTo(.72,cy+1.75+j);X.quadraticCurveTo(0,cy+1.95+j,-.72,cy+1.75+j);X.closePath();X.fillStyle='#1a0505';X.fill();X.strokeStyle='#4a1010';X.lineWidth=.12;X.stroke();
 X.fillStyle='#cfc59c';for(let i=0;i<6;i++){if(R()<.2)continue;X.fillRect(-.72+i*.25,cy+1.38,.18,.26+R()*.1)}for(let i=0;i<5;i++){if(R()<.3)continue;X.fillRect(-.55+i*.25,cy+1.62+j,.17,.2)}
 // hair
 X.fillStyle=v.hair;X.strokeStyle=v.hair;X.lineWidth=.12;
 if(v.hs===1||v.hs===2||boss){X.beginPath();X.moveTo(-2,cy-.2);X.bezierCurveTo(-2.3,cy-3.1,2.3,cy-3.1,2,cy-.2);for(let i=0;i<9;i++)X.lineTo(2-4*i/8,cy-1.5+((i*3)%2)*.5);X.closePath();X.globalAlpha=boss?.0:.95;X.fill();X.globalAlpha=1;
  if(v.hs===2)for(let i=0;i<7;i++){X.beginPath();X.moveTo(-1.9+i*.1*(i<4?1:-1)+(i>=4?3.8:0),cy-.5);X.quadraticCurveTo(-2.3+(i>=4?4.6:0),cy+1.5,-2+(i>=4?4:0)+(R()-.5)*.4,cy+2.6+R());X.stroke()}}
 else if(v.hs===3){X.beginPath();X.moveTo(-2.05,cy-.6);X.bezierCurveTo(-2.2,cy-3.2,2.2,cy-3.2,2.05,cy-.6);X.closePath();X.fillStyle=tn(v.shirt,-.1);X.fill();X.strokeStyle=OLC;X.lineWidth=.14;X.stroke();
  X.beginPath();X.ellipse(0,cy-.6,2.3,.45,0,0,Math.PI);X.fillStyle=tn(v.shirt,-.35);X.fill();X.stroke()}
 else{for(let i=0;i<10;i++){const a=-Math.PI*.15-R()*Math.PI*.7,x=Math.cos(a)*1.9,y=cy-.6+Math.sin(a)*2.1;X.beginPath();X.moveTo(x,y);X.lineTo(x+(R()-.5)*.5,y-.4-R()*.4);X.stroke()}}
 // head wound
 const wx=(R()-.5)*2.4,wy=cy-1.6+R()*1.2;jag(X,wx,wy,.45,R,7);X.fillStyle='#6a0808';X.fill();X.strokeStyle='rgba(90,8,8,.7)';X.lineWidth=.12;X.beginPath();X.moveTo(wx,wy);X.lineTo(wx+.1,wy+1.2);X.stroke();
 P();X.strokeStyle=OLC;X.lineWidth=.2;X.stroke()}
// ---------- live limbs ----------
function seg(x1,y1,x2,y2,w1,w2,col){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,a=Math.atan2(ny,nx);
 ctx.beginPath();ctx.moveTo(x1+nx*w1,y1+ny*w1);ctx.lineTo(x2+nx*w2,y2+ny*w2);ctx.arc(x2,y2,w2,a,a-Math.PI,true);ctx.lineTo(x1-nx*w1,y1-ny*w1);ctx.arc(x1,y1,w1,a+Math.PI,a,true);ctx.closePath();
 ctx.fillStyle=col;ctx.fill();ctx.lineWidth=.2;ctx.strokeStyle=OLC;ctx.stroke();
 const s=nx>0?-1:1;ctx.lineCap='round';ctx.lineWidth=(w1+w2)*.42;ctx.strokeStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.moveTo(x1+s*nx*w1*.5,y1+s*ny*w1*.5);ctx.lineTo(x2+s*nx*w2*.5,y2+s*ny*w2*.5);ctx.stroke();
 ctx.lineWidth=(w1+w2)*.16;ctx.strokeStyle='rgba(255,245,215,.13)';ctx.beginPath();ctx.moveTo(x1-s*nx*w1*.45,y1-s*ny*w1*.45);ctx.lineTo(x2-s*nx*w2*.45,y2-s*ny*w2*.45);ctx.stroke()}
function hand(x,y,ang,sk,sc){sc=sc||1;ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(sc,sc);
 ctx.lineCap='round';for(let i=0;i<4;i++){const fx=-.36+i*.24;ctx.lineWidth=.3;ctx.strokeStyle=OLC;ctx.beginPath();ctx.moveTo(fx,.2);ctx.quadraticCurveTo(fx*1.2,.75,fx*1.1+.05,1.05-Math.abs(i-1.5)*.12);ctx.stroke();ctx.lineWidth=.2;ctx.strokeStyle=tn(sk,-.08);ctx.stroke()}
 ell(0,0,.5,.42);ctx.fillStyle=sk;ctx.fill();ctx.lineWidth=.16;ctx.strokeStyle=OLC;ctx.stroke();ctx.lineWidth=.22;ctx.strokeStyle=tn(sk,-.1);ctx.beginPath();ctx.moveTo(.4,-.1);ctx.lineTo(.7,.45);ctx.stroke();ctx.restore()}
function foot(x,y,v){ell(x,y-.2,.75,.42);ctx.fillStyle=v.shoes?'#221a14':tn(v.skin,-.15);ctx.fill();ctx.lineWidth=.16;ctx.strokeStyle=OLC;ctx.stroke()}
function wound(w){const g=ctx.createRadialGradient(w.x,w.y,0,w.x,w.y,w.r);g.addColorStop(0,'#2a0202');g.addColorStop(.5,'#7a0a0a');g.addColorStop(1,'rgba(110,10,10,0)');ctx.fillStyle=g;ell(w.x,w.y,w.r,w.r*.85);ctx.fill();
 ctx.strokeStyle='rgba(110,8,8,.85)';ctx.lineWidth=.16;ctx.beginPath();ctx.moveTo(w.x,w.y);ctx.lineTo(w.x+w.d,w.y+w.r*2.2);ctx.stroke()}
// figure in local units: feet at y=0, ~30 units tall
function figure(v,ph,o){if(v.t==='crawler')return crawlerFig(v,ph,o);const run=v.t==='runner',a=Math.sin(ph),c=Math.cos(ph);
 const bob=Math.abs(c)*(run?.7:.35),sway=a*(v.t==='fat'||v.t==='boss'?.055:.035),hipY=-14.6+bob*.5,hx=a*.25,lw=v.lw;
 for(const sd of[-1,1]){const pa=sd<0?a:-a,lift=Math.max(0,pa)*(run?1.4:1);const hX=hx+sd*v.hw*.5,kX=hX+sd*.2+pa*.15,kY=-7.8-lift*1.3,fX=hX+sd*.3,fY=-lift*1.9+pa*.6+(o.dead?0:0);
  seg(hX,hipY,kX,kY,1.5*lw,1.0*lw,v.pants);ell(kX,kY,.5*lw,.4*lw);ctx.fillStyle='rgba(255,240,210,.12)';ctx.fill();
  seg(kX,kY,fX,fY-.6,1.0*lw,.55*lw,(v.torn&&sd>0)?tn(v.skin,-.18):tn(v.pants,-.08));if(v.torn&&sd>0){ctx.strokeStyle=tn(v.pants,-.2);ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(kX-.8,kY+.3);ctx.lineTo(kX-.2,kY+.8);ctx.lineTo(kX+.3,kY+.2);ctx.lineTo(kX+.8,kY+.7);ctx.stroke()}foot(fX,fY,v)}
 ctx.save();ctx.translate(hx,hipY);ctx.rotate(sway);ctx.translate(0,14.6+v.hunch*.35);
 ctx.drawImage(v.torso,v.tx,v.ty,v.tw,v.th);
 if(o.wounds)for(const w of o.wounds)if(w.y>-23.5)wound(w);
 if(!o.headless){ctx.save();const hb=Math.cos(ph*2)*.22;ctx.translate(0,-24.2+v.hunch*.6+hb);ctx.rotate(v.tilt+Math.sin(ph)*.05);ctx.translate(0,24.2);ctx.drawImage(v.head,v.hx,v.hy,v.hw2,v.hh);
  if(o.wounds)for(const w of o.wounds)if(w.y<=-23.5)wound({x:w.x,y:w.y-v.hunch*.6,r:w.r*.7,d:w.d});ctx.restore()}
 else{ell(0,-24.4,1.3,.55);ctx.fillStyle='#5a0606';ctx.fill();ctx.strokeStyle=OLC;ctx.lineWidth=.15;ctx.stroke();ell(0,-24.5,.35,.3);ctx.fillStyle='#d8d0b0';ctx.fill()}
 const sw=v.sw,aw=v.aw,t=time;
 for(const sd of[-1,1]){let eX,eY,hX,hY;const sX=sd*(sw-.35),sY=-22.1;
  if(o.attack){const k=Math.sin(t*9+sd*1.3);eX=sd*(sw+.9);eY=-21.3-Math.max(0,k)*1.2;hX=sd*(sw-.2);hY=-19.2+k*2.4}
  else if(o.dead){eX=sd*(sw+1.8);eY=-19.8;hX=sd*(sw+2.6);hY=-17}
  else if(run){eX=sd*(sw+.55);eY=-18.6+sd*a*.9;hX=sd*(sw-.7);hY=-16.8+sd*a*1.8}
  else if(v.arm&&sd>0){eX=sd*(sw+.35);eY=-18.2+a*.2;hX=sd*(sw+.45);hY=-14.3+a*.3}
  else{eX=sd*(sw+.7);eY=-19.6+sd*a*.5;hX=sd*(sw-1.3);hY=-17.6+sd*a*.8}
  const up=v.sleeve>=1?v.shirt:v.skin,fo=v.sleeve===2?v.shirt:v.skin;
  seg(sX,sY,eX,eY,.78*aw,.6*aw,v.sleeve<0?v.skin:up);seg(eX,eY,hX,hY,.6*aw,.42*aw,v.sleeve<0?v.skin:fo);
  if(v.sleeve===2){ell(hX+(eX-hX)*.12,hY+(eY-hY)*.12,.5*aw,.3*aw);ctx.fillStyle=tn(v.shirt,-.3);ctx.fill()}
  hand(hX,hY,Math.atan2(hY-eY,hX-eX)-Math.PI/2,v.skin,aw*.95)}
 ctx.restore()}
function crawlerFig(v,ph,o){const a=Math.sin(ph);
 ctx.save();ctx.translate(0,-5.4+Math.abs(a)*.25);ctx.scale(1,-.7);ctx.translate(0,23);
 ctx.strokeStyle='#7a2020';ctx.lineWidth=.45;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-.8,-14.6);ctx.bezierCurveTo(-1.5,-12,.5,-12.5,0,-11.2);ctx.moveTo(.6,-14.6);ctx.quadraticCurveTo(1.6,-12.8,1.1,-11.8);ctx.stroke();
 ctx.strokeStyle='#a04040';ctx.lineWidth=.25;ctx.stroke();
 ctx.drawImage(v.torso,v.tx,v.ty,v.tw,v.th);if(o.wounds)for(const w of o.wounds)wound({x:w.x,y:-23-(w.y+5.4)/.7,r:w.r,d:0});ctx.restore();
 const sw=v.sw;for(const sd of[-1,1]){const pa=sd*a;const sX=sd*(sw-.5),sY=-5.6,eX=sd*(sw+1.5),eY=-4.4-pa*.9,hX=sd*(sw+.7),hY=-1-pa*1.3;
  seg(sX,sY,eX,eY,.75,.58,v.sleeve>=1?v.shirt:v.skin);seg(eX,eY,hX,hY,.58,.42,v.sleeve===2?v.shirt:v.skin);hand(hX,hY,Math.atan2(hY-eY,hX-eX)-Math.PI/2,v.skin)}
 if(!o.headless){ctx.save();ctx.translate(0,-4.2+Math.cos(ph*2)*.15);ctx.rotate(v.tilt*.5);ctx.translate(0,22.8);ctx.drawImage(v.head,v.hx,v.hy,v.hw2,v.hh);ctx.restore()}}
// ---------- hit test ----------
function zHit(z,ax,ay){const sc=zsc(z),lx=(ax-z.x)/sc,ly=(ay-z.y)/sc,v=z.v;
 if(z.t==='crawler'){const hd=Math.hypot(lx,ly+4.2-.6)<2.3;if(hd)return{head:1,lx,ly};if(Math.abs(lx)<v.sw+1&&ly>-13&&ly<.5)return{head:0,lx,ly};return null}
 const hy=-26.2+v.hunch*.95;if(Math.hypot(lx*1.1,ly-hy)<2.6)return{head:1,lx,ly};
 if(Math.abs(lx)<v.sw+.9&&ly>-23.8&&ly<.5)return{head:0,lx,ly};return null}
// ---------- draw helpers used by game ----------
function drawZombie(z){const sc=zsc(z);ctx.save();ctx.translate(z.x,z.y);ctx.fillStyle='rgba(0,0,0,.33)';ell(0,0,z.w*.5*sc*.8,z.w*.13*sc*.8);ctx.fill();ctx.scale(sc*z.flip,sc);
 figure(z.v,z.ph*(z.t==='runner'?1.6:1),{wounds:z.wounds,attack:z.y>=BAR_Y-1});ctx.restore()}
function drawCorpse(c){const f=Math.min(1,c.age/.45),e=1-(1-f)*(1-f),al=c.age<5?1:Math.max(0,1-(c.age-5)/2);ctx.save();ctx.globalAlpha=al;ctx.translate(c.x,c.y);ctx.scale(c.s*c.flip,c.s);
 if(c.v.t==='crawler'){ctx.scale(1,1-.3*e);figure(c.v,0,{wounds:c.wounds,headless:c.headless})}
 else if(c.pose==='crumple'){ctx.rotate(e*1.45*c.side);ctx.scale(1,1-.15*e);figure(c.v,.8,{wounds:c.wounds,dead:e>.6})}
 else{ctx.translate(0,-e*3);ctx.scale(1+.08*e,1-.62*e);figure(c.v,0,{wounds:c.wounds,headless:c.headless,dead:e>.3})}
 ctx.restore();ctx.globalAlpha=1}
function drawGibHead(g){ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.r);ctx.scale(g.s,g.s);ctx.translate(0,26.4);ctx.drawImage(g.v.head,g.v.hx,g.v.hy,g.v.hw2,g.v.hh);ctx.restore()}
// shooters: semi-realistic, seen from behind
const SHO={main:{jacket:'#6a2a1c',hair:'#2a1a10',skin:'#c89a74',band:'#8a1a10'},s:[{jacket:'#4d5a3a',hair:'#3a2a1a',skin:'#b88a64'},{jacket:'#3c4a5a',hair:'#1a1a1a',skin:'#a07050'},{jacket:'#6a5a3a',hair:'#6a5030',skin:'#d0a888'},{jacket:'#5a3a3a',hair:'#2a2018',skin:'#8a6040'},{jacket:'#3a3a3a',hair:'#4a3a2a',skin:'#c09070'},{jacket:'#55553a',hair:'#1a1410',skin:'#b08060'}]};
function drawShooter(x,col,gun,aimX,aimY,main,rec,idx){const st=main?SHO.main:SHO.s[(idx||0)%6],k=2.0,oy=BAR_Y+49;rec=rec||0;
 const px=x,py=oy-24*k,ang=clamp(Math.atan2(aimY-py,aimX-px)+Math.PI/2,-1.1,1.1);
 ctx.save();ctx.translate(x,oy+rec*.4);ctx.scale(k,k);const jk=st.jacket,sk=st.skin;
 const gl=main&&N?({pistola:5,revolver:5.5,escopeta:10,subfusil:7,rifle:11,asalto:10,ametralladora:11}[curW().id]||8):8,pistol=gl<6;
 // torso from behind
 ctx.beginPath();ctx.moveTo(-1.4,-22.9);ctx.quadraticCurveTo(-3.3,-23,-4,-21.8);ctx.quadraticCurveTo(-4.4,-19,-3.6,-14);ctx.lineTo(3.6,-14);ctx.quadraticCurveTo(4.4,-19,4,-21.8);ctx.quadraticCurveTo(3.3,-23,1.4,-22.9);ctx.closePath();
 let g=ctx.createLinearGradient(0,-23,0,-14);g.addColorStop(0,tn(jk,.15));g.addColorStop(.4,jk);g.addColorStop(1,tn(jk,-.35));ctx.fillStyle=g;ctx.fill();ctx.lineWidth=.2;ctx.strokeStyle=OLC;ctx.stroke();
 g=ctx.createLinearGradient(-4.3,0,4.3,0);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.3,'rgba(0,0,0,0)');g.addColorStop(.7,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=g;ctx.fill();
 ctx.strokeStyle=tn(jk,-.4);ctx.lineWidth=.16;ctx.beginPath();ctx.moveTo(0,-22.5);ctx.lineTo(0,-14.5);ctx.moveTo(-3,-20.5);ctx.quadraticCurveTo(-1.5,-19.5,-.6,-17);ctx.moveTo(3,-20.5);ctx.quadraticCurveTo(1.5,-19.5,.6,-17);ctx.moveTo(-3.4,-16);ctx.quadraticCurveTo(0,-15.2,3.4,-16);ctx.stroke();
 if(!main&&idx%2){ctx.strokeStyle='#2a2018';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(-2,-22.6);ctx.lineTo(-2.3,-15);ctx.moveTo(2,-22.6);ctx.lineTo(2.3,-15);ctx.stroke()}
 // collar, neck, head from behind
 rr(-1.6,-23.6,3.2,1.1,.4);fs(tn(jk,-.2),.16);
 rr(-.85,-24.6,1.7,1.4,.3);fs(tn(sk,-.15),.15);
 ell(-1.95,-26.1,.3,.55);fs(tn(sk,-.1),.12);ell(1.95,-26.1,.3,.55);fs(tn(sk,-.1),.12);
 ell(0,-26.4,1.95,2.3);g=ctx.createRadialGradient(-.5,-27.6,.2,0,-26.4,2.6);g.addColorStop(0,tn(st.hair,.25));g.addColorStop(1,tn(st.hair,-.3));ctx.fillStyle=g;ctx.fill();ctx.lineWidth=.18;ctx.strokeStyle=OLC;ctx.stroke();
 ctx.strokeStyle=tn(st.hair,.2);ctx.lineWidth=.1;ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(-1.2+i*.6,-28.2);ctx.quadraticCurveTo(-1.3+i*.6,-26.5,-1+i*.5,-24.8)}ctx.stroke();
 if(st.band){rr(-2,-27.4,4,.8,.3);fs(st.band,.14);ctx.beginPath();ctx.moveTo(.8,-26.8);ctx.lineTo(1.5,-25.2);ctx.lineTo(.4,-25.6);ctx.closePath();fs(st.band,.12)}
 // gun + forearms/hands (in front of body, so drawn first)
 ctx.save();ctx.translate(1.9,-23.2);ctx.rotate(ang);ctx.translate(0,rec*1.3);
 rr(-.45,-gl-2.5,.9,gl+1,.3);fs('#2a2a2c',.18);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(-.25,-gl-2.3,.15,gl);
 if(!pistol){rr(-.7,-4.2,1.4,3,.4);fs(gun||'#5a3a22',.18);rr(-.6,-gl*.62-2,1.2,2,.3);fs(tn(gun||'#5a3a22',-.2),.15)}else{rr(-.55,-3.6,1.1,2,.3);fs('#333',.15)}
 if(rec>.4){ctx.fillStyle='rgba(255,220,120,.9)';ell(0,-gl-3.3,.9,1.6);ctx.fill();ctx.fillStyle='rgba(255,255,220,.9)';ell(0,-gl-3,.4,.8);ctx.fill()}
 const gh=[0,-2.2],fh=[0,pistol?-2.9:-gl*.55-2];ctx.restore();
 const rot=(p)=>{const c=Math.cos(ang),s=Math.sin(ang);const yy=p[1]+rec*1.3;return[1.9+p[0]*c-yy*s,-23.2+p[0]*s+yy*c]};
 const G1=rot(gh),G2=rot(fh);
 for(const [sd,h] of [[1,G1],[-1,G2]]){const sX=sd*3.2,sY=-21.8,eX=sd*3.9+(h[0]-sd*3.2)*.35,eY=-21.6+(h[1]+21)*.3;
  seg(eX,eY,h[0],h[1]+.4,.62,.45,tn(jk,-.12));ell(h[0],h[1]+.4,.5,.42);ctx.fillStyle=sk;ctx.fill();ctx.lineWidth=.15;ctx.strokeStyle=OLC;ctx.stroke();
  ctx.strokeStyle=tn(sk,-.15);ctx.lineWidth=.22;ctx.beginPath();for(let i=0;i<3;i++){ctx.moveTo(h[0]-.3+i*.3,h[1]+.1);ctx.lineTo(h[0]-.35+i*.3,h[1]+.7)}ctx.stroke();
  seg(sX,sY,eX,eY,.85,.65,jk)}
 ctx.restore()}
