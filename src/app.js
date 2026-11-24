(function(){
"use strict";
const $=id=>document.getElementById(id);
const FRAMED = window.self!==window.top;

/* ---------- formats, stocks, filters ---------- */
// k = contrast of the film curve, black/white = colour of the deepest shadow and brightest highlight,
// grain = strength, hal = red glow around highlights, dust = 1 dark specks (reversal), -1 light specks (negative)
const FILM_STOCKS={
  "50D": {wb:[1.02,1.00,0.97],sat:1.15,k:5.0,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,.97,.9],hd:.35,black:[.036,.030,.030],white:[.945,.935,.895],grain:.32,hal:3.0,bloom:.10,bw:0,dust:1},
  "100D":{wb:[1.05,1.00,0.93],sat:1.25,k:5.8,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,.97,.9],hd:.35,black:[.030,.024,.026],white:[.950,.925,.870],grain:.37,hal:3.2,bloom:.08,bw:0,dust:1},
  // 200T and 500T: curve fitted point by point to a reference 500T clip of the same scene
  "200T":{wb:[0.78,1.00,1.58],sat:1.10,k:3.56,gain:1.093,off:.15,gam:[.63,.71,.87],sh:.3,kc:[1,1,1],hd:.5,black:[.012,.010,.036],white:[.955,.932,.830],grain:.48,hal:4.6,bloom:.12,bw:0,dust:1},
  "500T":{wb:[0.75,1.00,1.70],sat:1.10,k:3.56,gain:1.093,off:.16,gam:[.61,.70,.87],sh:.3,kc:[1,1,1],hd:.5,black:[.012,.010,.041],white:[.955,.930,.820],grain:.56,hal:5.5,bloom:.15,bw:0,dust:1},
  "B&W": {wb:[1.00,1.00,1.00],sat:0.00,k:5.6,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1],hd:0,black:[.028,.028,.028],white:[.940,.940,.940],grain:.53,hal:3.0,bloom:.10,bw:1,dust:1}
};
const TAPES={
  "SP":  {soft:1.0,noise:.050,wear:0.00,sat:.92},
  "EP":  {soft:1.5,noise:.085,wear:0.22,sat:.84},
  "WORN":{soft:1.7,noise:.120,wear:1.00,sat:.76}
};
const FORMATS={
  s8: {name:"SUPER 8", aspect:4/3,fps:[18,24],stocks:Object.keys(FILM_STOCKS),pShort:520,gs:1.1,grainMul:1.0, weave:1.0, vig:.58,vexp:.55,ca:.0035,corner:.034,strip:.15,edge:.036,soft:.36,halo:1.1,dsz:1.0,dmg:1.0},
  s16:{name:"SUPER 16",aspect:5/3,fps:[24,25],stocks:Object.keys(FILM_STOCKS),pShort:880,gs:.9,grainMul:.6,weave:.32,vig:.24,vexp:1.25,ca:.0014,corner:.012,strip:.13,edge:.030,soft:.55,halo:1.0,dsz:.65,dmg:.6},
  vhs:{name:"VHS",     aspect:4/3,fps:[25,30],stocks:Object.keys(TAPES),      pShort:480}
};
const FILTERS=[
  ["85B Warm",[1.22,1.00,0.72]],["85 Warm",[1.18,1.00,0.76]],["81EF Warm",[1.11,1.00,0.86]],["81A Warm",[1.05,1.00,0.93]],
  ["None",[1,1,1]],
  ["82A Cool",[0.95,1.00,1.06]],["82B Cool",[0.91,1.00,1.11]],["80B Cool",[0.80,1.00,1.22]],["80A Cool",[0.74,1.00,1.30]]
];

/* ---------- state ---------- */
const S={format:"s8",stockBy:{s8:"200T",s16:"200T",vhs:"SP"},fpsBy:{s8:18,s16:24,vhs:25},ev:0,lock:false,
  facing:"environment",overscan:false,side:0,filter:4,zoomSpeed:1,zoom:1,burn:false};
Object.defineProperty(S,"stock",{get(){return S.stockBy[S.format];}});
Object.defineProperty(S,"fps",{get(){return S.fpsBy[S.format];}});
let mode="test";            // "test" | "live" | "clip" | "still" (still is for testing only)
let recording=false,stillEl=null;
try{
  const saved=JSON.parse(localStorage.getItem("reel8v2")||"{}");
  if(FORMATS[saved.format]) S.format=saved.format;
  for(const f in FORMATS){
    if(saved.stockBy&&FORMATS[f].stocks.includes(saved.stockBy[f])) S.stockBy[f]=saved.stockBy[f];
    if(saved.fpsBy&&FORMATS[f].fps.includes(saved.fpsBy[f])) S.fpsBy[f]=saved.fpsBy[f];
  }
  if(saved.facing==="user") S.facing="user";
  S.overscan=!!saved.overscan;
  if([0,1,2,3].includes(saved.side)) S.side=saved.side;
  if(saved.filter>=0&&saved.filter<FILTERS.length) S.filter=saved.filter|0;
  if(saved.zoomSpeed) S.zoomSpeed=Math.min(2,Math.max(.4,+saved.zoomSpeed||1));
  if(saved.burnOn===true) S.burn=true;
}catch(e){}
function remember(){
  try{localStorage.setItem("reel8v2",JSON.stringify({format:S.format,stockBy:S.stockBy,fpsBy:S.fpsBy,facing:S.facing,
    overscan:S.overscan,side:S.side,filter:S.filter,zoomSpeed:S.zoomSpeed,burnOn:S.burn}));}catch(e){}
}

/* ---------- toast ---------- */
let toastT=0;
function toast(msg,ms){
  const t=$("toast");t.textContent=msg;t.classList.remove("off");
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add("off"),ms||2600);
}

/* ---------- test scene (shown until a camera or clip is ready) ---------- */
const testCv=document.createElement("canvas");testCv.width=540;testCv.height=720;
const tctx=testCv.getContext("2d");
function drawTest(t){
  const w=540,h=720,c=tctx;
  let g=c.createLinearGradient(0,0,0,h*.62);
  g.addColorStop(0,"#3f6fb0");g.addColorStop(.6,"#f0b27a");g.addColorStop(1,"#ffe2a8");
  c.fillStyle=g;c.fillRect(0,0,w,h);
  c.fillStyle="#fff6d8";c.beginPath();c.arc(380,300+Math.sin(t*.2)*6,46,0,7);c.fill();
  c.fillStyle="rgba(255,255,255,.75)";
  for(let i=0;i<4;i++){const x=((i*190+t*14)%(w+200))-100,y=90+i*38;c.beginPath();c.ellipse(x,y,70,16,0,0,7);c.ellipse(x+40,y-10,44,16,0,0,7);c.fill();}
  const layers=[["#7d8fa6",.62,10,.006,36],["#4f6b62",.70,22,.010,30],["#2f4a3a",.80,44,.016,24]];
  for(const [col,base,spd,f,amp] of layers){
    c.fillStyle=col;c.beginPath();c.moveTo(0,h);
    for(let x=0;x<=w;x+=6){const u=x+t*spd;c.lineTo(x,h*base-Math.sin(u*f)*amp-Math.sin(u*f*2.7+1)*amp*.4);}
    c.lineTo(w,h);c.fill();
  }
  c.fillStyle="#1d2f24";c.fillRect(0,h*.9,w,h*.1);
  c.fillStyle="#c9372c";
  const bx=((t*70)%(w+120))-60;c.fillRect(bx,h*.865,54,22);c.fillRect(bx+10,h*.848,30,18);
  c.fillStyle="#111";c.beginPath();c.arc(bx+12,h*.9,8,0,7);c.arc(bx+42,h*.9,8,0,7);c.fill();
}

/* ---------- WebGL ---------- */
const cv=$("view");
const gl=cv.getContext("webgl",{antialias:false,alpha:false,premultipliedAlpha:false});
const VS="attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}";
const COMMON=`precision highp float;
varying vec2 vUv;
float h1(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
float rr(vec2 p,vec2 c,vec2 hf,float r){vec2 d=abs(p-c)-hf+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}
`;
// 1. crop, zoom and mirror the source into a small "picture" (its low size is the film's softness)
const FS_PREP=COMMON+`uniform sampler2D uTex;uniform float uSrcA,uPicA,uZoom,uMirror;
void main(){
  vec2 q=(vUv-.5)/uZoom;
  if(uSrcA>uPicA)q.x*=uPicA/uSrcA;else q.y*=uSrcA/uPicA;
  q+=.5;if(uMirror>.5)q.x=1.-q.x;
  gl_FragColor=vec4(texture2D(uTex,q).rgb,1.);
}`;
// 2. blur of the bright parts only (glow around highlights)
const FS_BLUR=COMMON+`uniform sampler2D uTex;uniform vec2 uDir;uniform float uThr;
vec3 s(vec2 uv){
  vec3 c=texture2D(uTex,uv).rgb;
  if(uThr>0.){c=c*c;c=max(c-uThr,0.)/(1.-uThr);c=sqrt(c);}
  return c;
}
void main(){
  vec3 c=s(vUv)*.227;
  c+=(s(vUv+uDir)+s(vUv-uDir))*.194;
  c+=(s(vUv+uDir*2.)+s(vUv-uDir*2.))*.122;
  c+=(s(vUv+uDir*3.)+s(vUv-uDir*3.))*.054;
  c+=(s(vUv+uDir*4.)+s(vUv-uDir*4.))*.016;
  gl_FragColor=vec4(c,1.);
}`;
// 3a. film
const FS_FILM=COMMON+`uniform sampler2D uP,uGlow,uNoise,uDustTex;
uniform vec4 uDp[4],uDq[4],uSc[6],uSd[6];
uniform vec2 uOut,uWeave,uOff1,uOff2;
uniform vec3 uWb,uBlack,uWhite,uGam,uKc;
uniform float uSeed,uEv,uSat,uK,uGrain,uGs,uHal,uBloom,uBw,uFlicker,uOver,uSide,uFmt,uVig,uCa,uCorner,uT,uE,uBurn,uDsz,uGain,uOff,uSh,uHd,uVexp;
float sig(float x,float k){
  float a=1./(1.+exp(k*.5)),b=1./(1.+exp(-k*.5));
  return (1./(1.+exp(-k*(x-.5)))-a)/(b-a);
}
void main(){
  float W=uOut.x,H=uOut.y,m=min(W,H);
  vec2 P=vec2(vUv.x*W,(1.-vUv.y)*H);
  vec2 L=P;vec2 D=uOut;
  if(uSide>.5&&uSide<1.5){L=vec2(W-P.x,P.y);}
  else if(uSide>1.5&&uSide<2.5){L=vec2(P.y,P.x);D=vec2(H,W);}
  else if(uSide>2.5){L=vec2(H-P.y,P.x);D=vec2(H,W);}
  L+=uWeave*m;
  vec2 pl;float inside=1.;float d=-1000.;float fy=L.y;
  float gap=.014*m;
  vec2 rmin=vec2(0.),rsz=D;float per=D.y;
  if(uOver>.5){
    rmin=vec2(uT,uE);rsz=vec2(D.x-uT-uE*.7,D.y-2.*uE);
    per=rsz.y+gap;
    float yy=L.y-rmin.y;
    fy=yy-floor(yy/per)*per;
    pl=vec2((L.x-rmin.x)/rsz.x,fy/rsz.y);
    d=rr(vec2(L.x-rmin.x,fy),rsz*.5,rsz*.5,uCorner*m);
    inside=1.-smoothstep(-2.5,2.5,d);
  }else{
    pl=(L/D-.5)*.97+.5;
  }
  vec2 p=pl;
  if(uSide>.5&&uSide<1.5){p=vec2(1.-pl.x,pl.y);}
  else if(uSide>1.5&&uSide<2.5){p=vec2(pl.y,pl.x);}
  else if(uSide>2.5){p=vec2(pl.y,1.-pl.x);}
  vec2 uv=vec2(p.x,1.-p.y);
  vec2 cu=uv-.5;
  float r2=dot(cu,cu)*2.;
  vec3 c;
  c.r=texture2D(uP,uv+cu*uCa*r2).r;
  c.g=texture2D(uP,uv).g;
  c.b=texture2D(uP,uv-cu*uCa*r2).b;
  c=pow(c,vec3(2.2));
  vec3 gw=texture2D(uGlow,uv).rgb;gw*=gw;
  float gl1=dot(gw,vec3(.3,.5,.2));
  float hm=exp(-dot(c,vec3(.3,.5,.2))*10.);
  c+=mix(vec3(1.,.17,.045),vec3(.5),uBw)*gl1*uHal*hm+gw*uBloom;
  float vg=clamp(1.-uVig*pow(min(r2,1.),uVexp),0.,1.);
  c*=exp2(uEv)*uFlicker*vg;
  c*=uWb;
  if(uBurn>.002){
    float sh=smoothstep(1.-uBurn*1.5,1.25-uBurn*.5,(1.-pl.x)+.16*sin(pl.y*6.+uSeed));
    c+=vec3(3.2,1.,.2)*sh*uBurn*1.6+c*uBurn*1.4;
  }
  float l=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l),c,uSat);
  c*=1.-.14*clamp(length(c-l)/(l+.05),0.,1.)*(1.-uBw);
  vec3 g=pow(clamp(c,0.,8.),vec3(1./2.2));
  vec2 gq=P/(256.*uGs);
  g*=uGain;
  vec3 xo=g-uOff;
  g=.5*(xo+sqrt(xo*xo+.0025))/(1.-uOff);
  g=pow(max(g,vec3(.00001)),uGam);
  g=g/pow(1.+pow(g*uSh,vec3(4.)),vec3(.25));
  g=min(g,vec3(1.2));
  g=vec3(sig(g.r,uK*uKc.r),sig(g.g,uK*uKc.g),sig(g.b,uK*uKc.b));
  float le=dot(g,vec3(.299,.587,.114));
  g=mix(g,vec3(le),smoothstep(.72,1.05,le)*uHd);
  g=uBlack+g*(uWhite-uBlack);
  if(uBw>.5)g=vec3(dot(g,vec3(.299,.587,.114)))*vec3(1.,.99,.955);
  vec3 n1=texture2D(uNoise,gq+uOff1).rgb-.5;
  vec3 n2=texture2D(uNoise,gq.yx*1.31+uOff2).rgb-.5;
  vec3 gn=mix(vec3(n1.g),n1,.7*(1.-uBw))*.8+vec3(n2.g)*.6;
  g+=gn*vec3(1.15,.95,.9)*uGrain*1.117*(1.-exp(-max(le,0.)/.2));
  // film damage, laid over the grain: a few light hairs and specks, and hair-thin dark scratches along the film's direction of travel
  vec2 lp=pl*rsz;
  float u1=m/1080.;
  float la=0.;
  for(int i=0;i<4;i++){
    vec4 a=uDp[i];vec4 b=uDq[i];
    vec2 q=lp-a.xy*rsz;
    float hs=a.w*.0445*m*uDsz;
    float cs=cos(a.z),sn=sin(a.z);
    vec2 r=vec2(q.x*cs+q.y*sn,-q.x*sn+q.y*cs)/hs;
    float ins=step(abs(r.x),.98)*step(abs(r.y),.98);
    vec2 cell=vec2(mod(b.x,8.),floor(b.x/8.));
    la=max(la,texture2D(uDustTex,(cell+clamp(r,-.98,.98)*.5+.5)/vec2(8.,4.)).r*b.y*ins);
  }
  float da=0.;
  float pitch=uOver>.5?1.:.97;
  for(int i=0;i<6;i++){
    vec4 a=uSc[i];vec4 b=uSd[i];
    float line=step(abs(lp.x-a.x*rsz.x),.5*pitch*b.z);      // exactly one pixel column wide, crisp, like a real scratch on a scan
    float yy=lp.y-a.y*rsz.y;
    float len=a.z*m;
    float seg=smoothstep(0.,2.*u1,yy)*(1.-smoothstep(len-2.*u1,len,yy));
    float cy=floor(yy/(2.4*u1));
    float dots=max(step(.8,h1(vec2(cy,b.y))),step(.84,h1(vec2(floor(cy/5.),b.y+3.))));
    da=max(da,line*seg*a.w*mix(1.,dots,b.x));
  }
  g*=mix(vec3(1.),mix(vec3(.45,.42,.30),vec3(.4),uBw),da);
  g=mix(g,mix(vec3(.97,.94,.88),vec3(.95),uBw),la);
  vec3 outc=g;
  if(uOver>.5){
    vec3 nb=texture2D(uNoise,gq*1.7+uOff2).rgb-.5;
    vec3 base=vec3(.020,.017,.015)+nb.g*.014;
    base+=vec3(1.,.42,.14)*(.05+gl1*.9)*exp(-max(d,0.)/(.016*m));
    float dh;
    if(uFmt<.5){
      dh=rr(vec2(L.x,fy),vec2(uT*.5,rsz.y*.5),vec2(.045,.058)*m,.016*m);
    }else{
      float fy2=fy>rsz.y*.5?fy:fy+per;
      dh=rr(vec2(L.x,fy2),vec2(uT*.52,rsz.y+gap*.5),vec2(.047,.032)*m,.011*m);
    }
    base+=vec3(1.,.5,.2)*.5*exp(-max(dh,0.)/(.014*m));
    base=mix(base,vec3(1.,.97,.9)*uFlicker,1.-smoothstep(-2.,2.,dh));
    outc=mix(base,g,inside);
  }
  gl_FragColor=vec4(clamp(outc,0.,1.),1.);
}`;
// 3b. video tape
const FS_VHS=COMMON+`uniform sampler2D uP,uNoise;
uniform vec2 uOut,uOff1,uOff2;
uniform vec3 uWb;
uniform float uSeed,uTime,uEv,uSoft,uNz,uWear,uSat,uTrackY,uLines;
vec3 yiq(vec3 c){return vec3(dot(c,vec3(.299,.587,.114)),dot(c,vec3(.596,-.274,-.322)),dot(c,vec3(.211,-.523,.312)));}
vec3 rgb(vec3 c){return vec3(c.x+.956*c.y+.621*c.z,c.x-.272*c.y-.647*c.z,c.x-1.106*c.y+1.703*c.z);}
vec3 smp(vec2 q){
  vec3 c=texture2D(uP,clamp(q,0.,1.)).rgb;
  c=pow(c,vec3(2.2))*exp2(uEv)*uWb;
  return yiq(pow(clamp(c,0.,4.),vec3(1./2.2)));
}
void main(){
  float y=1.-vUv.y;
  float line=floor(y*uLines);
  float jit=(h1(vec2(line,uSeed))-.5)*.0011*(1.+3.*uWear);
  float hs=smoothstep(.972,.982,y);
  jit+=hs*(.018+.035*h1(vec2(floor(line*.5),uSeed)));
  float band=exp(-pow((y-uTrackY)/.028,2.))*uWear;
  jit+=band*(h1(vec2(line,uSeed*3.))-.35)*.06;
  jit+=sin(y*8.+uTime*1.9)*.0007*(1.+2.*uWear);
  vec2 q=vec2(vUv.x+jit,vUv.y);
  float dx=uSoft/330.;
  vec3 c0=smp(q);
  float Y=c0.x*.36+(smp(q+vec2(dx,0.)).x+smp(q-vec2(dx,0.)).x)*.22+(smp(q+vec2(dx*2.,0.)).x+smp(q-vec2(dx*2.,0.)).x)*.10;
  float Yw=(smp(q+vec2(dx*4.,0.)).x+smp(q-vec2(dx*4.,0.)).x)*.5;
  Y+=(Y-Yw)*.38;
  vec2 IQ=vec2(0.);
  float cd=uSoft/85.;
  for(int i=0;i<6;i++){
    float o=(float(i)-2.1)*cd*.5;
    IQ+=smp(vec2(q.x-o,q.y-1./uLines*mod(float(i),2.))).yz;
  }
  IQ/=6.;
  vec2 nq=vec2(vUv.x*uOut.x/(256.*5.),y*uLines/256.);
  vec3 n1=texture2D(uNoise,nq+uOff1).rgb-.5;
  vec3 n2=texture2D(uNoise,vec2(nq.x*.22,nq.y*.6)+uOff2).rgb-.5;
  Y+=n1.g*uNz*1.5;
  IQ+=n2.rb*uNz*1.6;
  float dl=h1(vec2(line,floor(uSeed*37.)));
  float dstart=h1(vec2(line*1.3,uSeed));
  float drop=step(1.-.0012*(1.+9.*uWear),dl)*step(dstart,vUv.x)*step(vUv.x,dstart+.05+.2*h1(vec2(uSeed,line)));
  Y=mix(Y,.92,drop*.85);IQ*=1.-drop;
  float sn=h1(vec2(vUv.x*240.+uSeed*90.,line));
  Y=mix(Y,sn*.9,band*.65);IQ*=1.-band*.8;
  Y=mix(Y,Y*.55+sn*.4,hs*.8);IQ*=1.-hs*.6;
  IQ*=uSat;
  IQ=vec2(IQ.x*.985-IQ.y*.17,IQ.y*.985+IQ.x*.17);
  vec3 c=rgb(vec3(Y,IQ));
  c=(c-.5)*.92+.5;
  c=c*.9+.055;
  c=min(c,vec3(.965));
  c*=vec3(1.,.985,.97);
  c*=.94+.06*cos(y*uLines*6.2832);
  float ex=min(vUv.x,1.-vUv.x);
  c*=smoothstep(.0,.008,ex-.006+jit);
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

let glOK=false,PR={},srcTex=null,noiseTex=null,dustTex=null,T={};
function makeProg(fsSrc){
  const mk=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));return null;}return s;};
  const vs=mk(gl.VERTEX_SHADER,VS),fs=mk(gl.FRAGMENT_SHADER,fsSrc);
  if(!vs||!fs) return null;
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.bindAttribLocation(p,0,"a");gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(p));return null;}
  return {p,loc:{}};
}
function use(pr,vals){
  gl.useProgram(pr.p);
  for(const n in vals){
    let l=pr.loc[n];if(l===undefined) l=pr.loc[n]=gl.getUniformLocation(pr.p,n);
    if(l===null) continue;
    const v=vals[n];
    if(typeof v==="number") gl.uniform1f(l,v);
    else if(v.tex!==undefined) gl.uniform1i(l,v.tex);
    else if(v instanceof Float32Array) gl.uniform4fv(l,v);
    else if(v.length===2) gl.uniform2f(l,v[0],v[1]);
    else gl.uniform3f(l,v[0],v[1],v[2]);
  }
}
function makeTex(repeat){
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
  const w=repeat?gl.REPEAT:gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,w);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,w);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return t;
}
function target(name,w,h){
  let t=T[name];
  if(t&&t.w===w&&t.h===h) return t;
  if(!t){t=T[name]={tex:makeTex(false),fb:gl.createFramebuffer()};}
  t.w=w;t.h=h;
  gl.bindTexture(gl.TEXTURE_2D,t.tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t.tex,0);
  return t;
}
function draw(t){
  gl.bindFramebuffer(gl.FRAMEBUFFER,t?t.fb:null);
  gl.viewport(0,0,t?t.w:cv.width,t?t.h:cv.height);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
function bind(unit,tex){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);}
function makeNoise(){
  // soft-edged random clumps, so grain looks like grain and not like square pixels
  const n=256,raw=new Float32Array(n*n*3),out=new Uint8Array(n*n*4);
  for(let i=0;i<raw.length;i++){let s=0;for(let k=0;k<4;k++)s+=Math.random();raw[i]=(s-2)/1.155;}
  for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(let c=0;c<3;c++){
    let s=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const w=(i===0&&j===0)?.4:(i===0||j===0)?.11:.04;
      s+=raw[(((y+j+n)%n)*n+((x+i+n)%n))*3+c]*w;
    }
    out[(y*n+x)*4+c]=Math.max(0,Math.min(255,128+s*2.05*52));
  }
  for(let i=3;i<out.length;i+=4) out[i]=255;
  const t=makeTex(true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,n,n,0,gl.RGBA,gl.UNSIGNED_BYTE,out);
  return t;
}
let dustCanvas=null;
function makeDust(){
  // one sheet of 32 small white marks (hairs, specks, lint), drawn once; the film shader stamps a few of them on each frame
  const C=128,c=document.createElement("canvas");c.width=C*8;c.height=C*4;
  const x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="#fff";x.fillStyle="#fff";x.lineCap="round";x.lineJoin="round";
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function fibre(ox,oy,len,w,alpha,curl,sx,sy){
    // a thin curling hair: walk forward while the turn rate drifts
    let px=sx,py=sy,th=rnd(0,6.283),k=rnd(-curl,curl);const pts=[[px,py]];
    for(let d=0;d<len;d+=2){
      th+=k*2+rnd(-.12,.12);k=Math.max(-curl*1.6,Math.min(curl*1.6,k+rnd(-curl,curl)*.4));
      const nx=px+Math.cos(th)*2,ny=py+Math.sin(th)*2;
      if(nx<ox+10||nx>ox+C-10||ny<oy+10||ny>oy+C-10){th+=2.2;continue;}
      px=nx;py=ny;pts.push([px,py]);
    }
    if(pts.length<3) return;
    const path=(a,b)=>{
      x.beginPath();x.moveTo(pts[a][0],pts[a][1]);
      for(let i=a+1;i<b;i++){const p=pts[i],q=pts[Math.min(i+1,b-1)];x.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}
      x.stroke();
    };
    x.globalAlpha=alpha*.55;x.lineWidth=w*.7;path(0,pts.length);               // faint along the whole length
    const a=Math.floor(pts.length*rnd(.05,.3)),b=Math.ceil(pts.length*rnd(.65,.97));
    if(b-a>2){x.globalAlpha=alpha;x.lineWidth=w;path(a,b);}                     // stronger and thicker in the middle
  }
  function speck(cx,cy,r,alpha){
    const tilt=rnd(0,3.14),sq=rnd(.45,1);          // uneven and a little stretched, never a neat round bead
    x.globalAlpha=alpha;x.beginPath();
    for(let i=0;i<6;i++){
      const a=i/6*6.283,rr=r*rnd(.5,1.3),ux=Math.cos(a)*rr,uy=Math.sin(a)*rr*sq;
      const X=cx+ux*Math.cos(tilt)-uy*Math.sin(tilt),Y=cy+ux*Math.sin(tilt)+uy*Math.cos(tilt);
      if(i) x.lineTo(X,Y); else x.moveTo(X,Y);
    }
    x.closePath();x.fill();
  }
  for(let i=0;i<32;i++){
    const ox=(i%8)*C,oy=Math.floor(i/8)*C,cx=ox+C/2,cy=oy+C/2;
    if(i<14){               // single hairs, from short arcs to long curls
      const big=i<5;
      fibre(ox,oy,big?rnd(45,85):rnd(16,40),rnd(1.0,1.9),rnd(.5,1),big?rnd(.06,.15):rnd(.05,.14),cx+rnd(-22,22),cy+rnd(-22,22));
    }else if(i<26){         // specks: one to three tiny uneven grains, some with a short tail
      const n=1+Math.floor(rnd(0,2.6));
      for(let j=0;j<n;j++){
        const sx=cx+(n>1?rnd(-9,9):0),sy=cy+(n>1?rnd(-9,9):0);
        speck(sx,sy,rnd(.8,i<20?1.5:2.1),rnd(.6,.95));
        if(Math.random()<.3){x.lineWidth=rnd(.9,1.4);x.globalAlpha=rnd(.5,.9);x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+rnd(-8,8),sy+rnd(-8,8));x.stroke();}
      }
    }else{                  // lint: two or three short hairs tangled together
      const n=2+Math.floor(rnd(0,1.99));
      for(let j=0;j<n;j++) fibre(ox,oy,rnd(12,30),rnd(.9,1.6),rnd(.5,1),rnd(.1,.25),cx+rnd(-8,8),cy+rnd(-8,8));
    }
  }
  x.globalAlpha=1;dustCanvas=c;
  const t=makeTex(false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  return t;
}
// which marks land on this frame, and where (new every film frame)
const DUSTP=new Float32Array(16),DUSTQ=new Float32Array(16),SCRP=new Float32Array(24),SCRQ=new Float32Array(24);
function rollDamage(amount){
  const rr=Math.random;
  for(let i=0;i<4;i++){                       // light hairs and specks: between one and two per frame on Super 8
    const on=rr()<[.7,.5,.3,.2][i]*amount,t=rr();
    const cell=t<.5?Math.floor(rr()*14):t<.86?14+Math.floor(rr()*12):26+Math.floor(rr()*6);
    DUSTP[i*4]=.03+rr()*.94;DUSTP[i*4+1]=.03+rr()*.94;DUSTP[i*4+2]=rr()*6.283;DUSTP[i*4+3]=.75+rr()*.6;
    DUSTQ[i*4]=cell;DUSTQ[i*4+1]=on?.5+rr()*.5:0;
  }
  for(let i=0;i<5;i++){                       // thin scratches: about three per frame, mostly short ticks, some longer, some broken into dots
    const on=rr()<[.85,.7,.6,.45,.3][i]*amount,t=rr();
    const len=t<.6?.0065+rr()*.0125:t<.88?.02+rr()*.03:.05+rr()*.04;
    const str=t<.6?.5+rr()*.4:t<.88?.45+rr()*.35:.35+rr()*.3;      // the longer the line, the fainter it is
    SCRP[i*4]=.02+rr()*.96;SCRP[i*4+1]=rr()*.97;SCRP[i*4+2]=len;SCRP[i*4+3]=on?str:0;
    SCRQ[i*4]=(t>=.6&&rr()<.25)?1:0;SCRQ[i*4+1]=rr()*50;SCRQ[i*4+2]=1;
  }
  const on=rr()<.05*amount;                   // rare: a long dotted trail down part of the frame
  SCRP[20]=.03+rr()*.94;SCRP[21]=rr()*.6;SCRP[22]=.12+rr()*.28;SCRP[23]=on?.7+rr()*.25:0;
  SCRQ[20]=1;SCRQ[21]=rr()*50;SCRQ[22]=rr()<.5?1:2;
}
function initGL(){
  if(!gl) return false;
  PR.prep=makeProg(FS_PREP);PR.blur=makeProg(FS_BLUR);PR.film=makeProg(FS_FILM);PR.vhs=makeProg(FS_VHS);
  if(!PR.prep||!PR.blur||!PR.film||!PR.vhs) return false;
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  srcTex=makeTex(false);noiseTex=makeNoise();dustTex=makeDust();
  return true;
}

/* ---------- frame loop ---------- */
const video=$("srcVideo");
let srcAspect=.75;
function sizeCanvas(aspect){
  if(recording) return;
  const a=FORMATS[S.format].aspect,long=Math.round(1080*a/2)*2;
  const w=aspect>=1?long:1080,h=aspect>=1?1080:long;
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
}
function pictureGeom(F){
  // must match the rectangle maths in the film shader
  const W=cv.width,H=cv.height,m=Math.min(W,H);
  if(S.format==="vhs"||!S.overscan) return {a:W/H,t:0,e:0};
  const t=F.strip*m,e=F.edge*m;
  const D=S.side<2?[W,H]:[H,W];
  const rw=D[0]-t-e*.7,rh=D[1]-2*e;
  return {a:S.side<2?rw/rh:rh/rw,t,e};
}
const dyn={burn:0,glitch:0,trackY:1.2,breath:0};
let lastFrame=0,lastTick=0,zoomDir=0,frames=0,snapCb=null;
const R=Math.random;
function tick(now){
  requestAnimationFrame(tick);
  const dt=Math.min(.1,(now-lastTick)/1000);lastTick=now;
  if(zoomDir){
    S.zoom=Math.min(4,Math.max(1,S.zoom*Math.exp(zoomDir*S.zoomSpeed*.9*dt)));
    $("zoomRead").textContent=S.zoom.toFixed(1)+"×";
  }
  const iv=1000/S.fps;
  if(now-lastFrame<iv-1) return;
  lastFrame=(now-lastFrame>iv*2)?now:lastFrame+iv;   // keeps the true frame rate on a 60 Hz screen
  if(!glOK) return;
  let src=null;
  if(mode==="test"){drawTest(now/1000);src=testCv;srcAspect=.75;}
  else if(mode==="still"&&stillEl){src=stillEl;srcAspect=stillEl.naturalWidth/stillEl.naturalHeight;}
  else if(video.readyState>=2&&video.videoWidth){src=video;srcAspect=video.videoWidth/video.videoHeight;}
  if(!src) return;
  sizeCanvas(srcAspect);
  bind(0,srcTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);}catch(e){return;}
  const F=FORMATS[S.format],f=FILTERS[S.filter][1],isVhs=S.format==="vhs";
  const geo=pictureGeom(F);
  const pw=geo.a>=1?Math.round(F.pShort*geo.a):F.pShort,ph=geo.a>=1?F.pShort:Math.round(F.pShort/geo.a);
  // pass 1: picture
  const Pt=target("P",pw,ph);
  bind(0,srcTex);
  use(PR.prep,{uTex:{tex:0},uSrcA:srcAspect,uPicA:geo.a,uZoom:S.zoom,uMirror:mode==="live"&&S.facing==="user"?1:0});
  draw(Pt);
  const off1=[R(),R()],off2=[R(),R()],seed=R()*10;
  if(isVhs){
    const tp=TAPES[S.stock];
    dyn.glitch*=.86;
    const wear=Math.min(1,tp.wear+dyn.glitch);
    dyn.trackY-=.006+.004*R();if(dyn.trackY<-.15) dyn.trackY=1.1+R()*1.5*(1.2-wear);
    bind(0,Pt.tex);bind(1,noiseTex);
    use(PR.vhs,{uP:{tex:0},uNoise:{tex:1},uOut:[cv.width,cv.height],uOff1:off1,uOff2:off2,uWb:f,
      uSeed:seed,uTime:now/1000,uEv:S.ev,uSoft:tp.soft,uNz:tp.noise,uWear:wear,uSat:tp.sat,uTrackY:dyn.trackY,
      uLines:Math.round(480*cv.height/Math.min(cv.width,cv.height)*.75)});
    draw(null);
  }else{
    const st=FILM_STOCKS[S.stock];
    // pass 2: soften the picture (real small-gauge film is far softer than a phone)
    const T1=target("T1",pw,ph),PB=target("PB",pw,ph),so=F.soft*pw/600;
    bind(0,Pt.tex);use(PR.blur,{uTex:{tex:0},uDir:[so/pw,0],uThr:0});draw(T1);
    bind(0,T1.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,so/ph],uThr:0});draw(PB);
    // pass 3: glow from the bright parts only (red fringe on bright edges)
    const gw=Math.max(16,pw>>1),gh=Math.max(16,ph>>1),A=target("GA",gw,gh),B=target("GB",gw,gh),hs=F.halo*gw/300;
    bind(0,Pt.tex);use(PR.blur,{uTex:{tex:0},uDir:[hs/gw,0],uThr:.38});draw(A);
    bind(0,A.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,hs/gh],uThr:0});draw(B);
    // film movement and damage that carries from frame to frame
    dyn.burn*=.66;if(dyn.burn<.004) dyn.burn=0;
    dyn.breath+=(R()-.5)*.006;dyn.breath*=.94;
    rollDamage(F.dmg);
    const wv=F.weave;
    bind(0,PB.tex);bind(1,B.tex);bind(2,noiseTex);bind(3,dustTex);
    use(PR.film,{uP:{tex:0},uGlow:{tex:1},uNoise:{tex:2},uDustTex:{tex:3},uDp:DUSTP,uDq:DUSTQ,uSc:SCRP,uSd:SCRQ,uDsz:F.dsz,uOut:[cv.width,cv.height],
      uWeave:[((R()-.5)*.0012+Math.sin(now/1100)*.0006)*wv,((R()-.5)*.0014+Math.sin(now/700)*.0008)*wv],
      uOff1:off1,uOff2:off2,uWb:[st.wb[0]*f[0],st.wb[1]*f[1],st.wb[2]*f[2]],uBlack:st.black,uWhite:st.white,
      uSeed:seed,uEv:S.ev,uSat:st.sat,uK:st.k,uGain:st.gain,uOff:st.off,uGam:st.gam,uSh:st.sh,uKc:st.kc,uHd:st.hd,uVexp:F.vexp,uGrain:st.grain*F.grainMul,uGs:F.gs*Math.min(cv.width,cv.height)/1080,
      uHal:st.hal,uBloom:st.bloom,uBw:st.bw,uFlicker:1+((R()-.5)*.03+dyn.breath)*(S.format==="s16"?.45:1),
      uOver:S.overscan?1:0,uSide:S.overscan?S.side:0,uFmt:S.format==="s16"?1:0,uVig:F.vig,uCa:F.ca,uCorner:F.corner,
      uT:geo.t,uE:geo.e,uBurn:dyn.burn});
    draw(null);
  }
  frames++;
  if(recording&&recTrack) recTrack.requestFrame();
  if(snapCb){const f=snapCb;snapCb=null;f(cv.toDataURL("image/png"));}
}

/* ---------- sources ---------- */
let liveStream=null,clipUrl=null;
function stopLive(){if(liveStream){liveStream.getTracks().forEach(t=>t.stop());liveStream=null;}}
async function startLive(quiet){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){if(!quiet)toast("This browser can't open the camera here.");return false;}
  const want={video:{facingMode:S.facing,width:{ideal:1920},height:{ideal:1080}},audio:true};
  let s=null;
  try{s=await navigator.mediaDevices.getUserMedia(want);}
  catch(e){
    try{s=await navigator.mediaDevices.getUserMedia({video:want.video});}
    catch(e2){if(!quiet)toast("The camera did not open. Check that this page is allowed to use it.",3600);return false;}
  }
  stopLive();liveStream=s;
  if(clipUrl){URL.revokeObjectURL(clipUrl);clipUrl=null;}
  video.removeAttribute("src");video.srcObject=s;video.muted=true;video.loop=false;
  try{await video.play();}catch(e){}
  mode="live";S.lock=false;paint();
  $("srcCard").hidden=true;$("srcChip").hidden=true;
  return true;
}
function loadClip(file){
  if(!file) return;
  if(recording) stopRec();
  stopLive();
  if(clipUrl) URL.revokeObjectURL(clipUrl);
  clipUrl=URL.createObjectURL(file);
  video.srcObject=null;video.src=clipUrl;video.muted=true;video.loop=true;
  video.play().then(()=>{
    mode="clip";S.zoom=1;
    $("srcCard").hidden=true;$("srcChip").hidden=false;
    toast("Clip loaded. Press the red button to record it with this look.",3600);
  }).catch(()=>toast("This clip could not be opened. Try another one.",3600));
}
video.addEventListener("error",()=>{if(video.src) toast("This clip could not be opened. Try another one.",3600);});
video.addEventListener("ended",()=>{if(recording&&mode==="clip") stopRec();});
$("shootInput").addEventListener("change",e=>{loadClip(e.target.files[0]);e.target.value="";});
$("pickInput").addEventListener("change",e=>{loadClip(e.target.files[0]);e.target.value="";});
function showCard(canClose){
  $("cardText").textContent=FRAMED
    ?"This page cannot open the live camera. Shoot a clip with your phone camera, or choose one, and it comes back here with the film look."
    :"The live camera is not on. Allow the camera, or shoot or choose a clip to give it the film look.";
  $("liveBtn").hidden=FRAMED;
  $("cardClose").hidden=!canClose;
  $("srcCard").hidden=false;
}
$("srcChip").onclick=()=>showCard(true);
$("cardClose").onclick=()=>{$("srcCard").hidden=true;};
$("liveBtn").onclick=()=>startLive(false);

/* ---------- recording ---------- */
let rec=null,chunks=[],recStart=0,recTimer=0,actx=null,adest=null,recTrack=null;
const clips=[];
function pickMime(){
  const c=["video/mp4;codecs=avc1.640028,mp4a.40.2","video/mp4;codecs=avc1.4D4028,mp4a.40.2","video/mp4;codecs=avc1.42E028,mp4a.40.2",
    "video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  for(const m of c){try{if(MediaRecorder.isTypeSupported(m))return m;}catch(e){}}
  return "";
}
function clipAudioTrack(){
  try{
    if(!actx){
      const AC=window.AudioContext||window.webkitAudioContext;actx=new AC();
      adest=actx.createMediaStreamDestination();
      actx.createMediaElementSource(video).connect(adest);
    }
    actx.resume();
    return adest.stream.getAudioTracks()[0]||null;
  }catch(e){return null;}
}
function clipAtStart(){
  // after jumping back to the start, the old picture stays on screen for a moment; wait until the new one is showing
  return new Promise(res=>{
    let done=false;const fin=()=>{if(!done){done=true;res();}};
    setTimeout(fin,1500);
    if(video.requestVideoFrameCallback){
      const cb=(n,meta)=>{if(done) return;if(!video.seeking&&meta.mediaTime<.5) fin(); else video.requestVideoFrameCallback(cb);};
      video.requestVideoFrameCallback(cb);
    }else{
      const iv=setInterval(()=>{if(done){clearInterval(iv);return;}if(!video.seeking&&video.currentTime<.5){clearInterval(iv);setTimeout(fin,70);}},12);
    }
  });
}
let starting=false;
async function startRec(){
  if(recording||starting) return;
  if(typeof MediaRecorder==="undefined"||!cv.captureStream){toast("This browser cannot record video.",3600);return;}
  starting=true;
  try{await beginRec();}finally{starting=false;}
}
async function beginRec(){
  const tracks=[];
  let audio=null;
  if(mode==="live"&&liveStream) audio=liveStream.getAudioTracks()[0]||null;
  if(mode==="clip"){
    audio=clipAudioTrack();
    video.pause();video.loop=false;video.muted=false;
    try{video.currentTime=0;await video.play();}catch(e){video.muted=true;try{await video.play();}catch(e2){}}
    await clipAtStart();
  }
  let vs=cv.captureStream(0);recTrack=vs.getVideoTracks()[0];
  if(!recTrack||!recTrack.requestFrame){vs=cv.captureStream(S.fps);recTrack=null;}   // one captured frame per film frame where the browser allows it
  tracks.push(vs.getVideoTracks()[0]);
  if(audio) tracks.push(audio);
  const mime=pickMime();
  try{rec=new MediaRecorder(new MediaStream(tracks),mime?{mimeType:mime,videoBitsPerSecond:24e6}:{videoBitsPerSecond:24e6});}
  catch(e){
    try{rec=new MediaRecorder(new MediaStream([tracks[0]]));}
    catch(e2){toast("This browser cannot record video.",3600);return;}
  }
  chunks=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size) chunks.push(e.data);};
  rec.onstop=finishRec;
  rec.start(1000);
  recording=true;recStart=performance.now();
  if(S.format==="vhs") dyn.glitch=1.2; else if(S.burn) dyn.burn=1;
  $("recLamp").hidden=false;$("recTime").textContent="00:00";
  recTimer=setInterval(()=>{
    const s=Math.floor((performance.now()-recStart)/1000);
    $("recTime").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  },250);
  paint();
}
function stopRec(){
  if(!recording) return;
  recording=false;recTrack=null;clearInterval(recTimer);
  $("recLamp").hidden=true;
  try{rec.stop();}catch(e){}
  if(mode==="clip"){video.muted=true;video.loop=true;video.play().catch(()=>{});}
  paint();
}
function finishRec(){
  const type=(rec&&rec.mimeType)||"video/webm";
  const blob=new Blob(chunks,{type});chunks=[];
  if(!blob.size){toast("Nothing was recorded. Try again.");return;}
  const d=new Date(),z=n=>String(n).padStart(2,"0");
  clips.unshift({
    blob,url:URL.createObjectURL(blob),ext:type.indexOf("mp4")>=0?"mp4":"webm",
    secs:Math.max(1,Math.round((performance.now()-recStart)/1000)),
    name:"reel8-"+d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+"-"+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds()),
    label:FORMATS[S.format].name+" "+S.stock,fps:S.fps,aspect:cv.width/cv.height
  });
  renderClips();
  toast("Clip ready. Open Clips (bottom left) to watch or save it.",3200);
}
$("trigger").onclick=()=>{recording?stopRec():startRec();};

/* ---------- saving ---------- */
let dlPromise=null;
function getDownloads(){
  if(!(window.claude&&window.claude.use)) return Promise.resolve(undefined);
  if(!dlPromise) dlPromise=window.claude.use("downloads").catch(()=>null);
  return dlPromise;
}
const IS_IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function saveOutsideClaude(c,btn,filename){
  // On an iPhone or iPad the share sheet is the way into Photos ("Save Video"); elsewhere a normal download
  const link=()=>{const a=document.createElement("a");a.href=c.url;a.download=filename;document.body.appendChild(a);a.click();a.remove();btn.textContent="Saved";};
  if(IS_IOS&&navigator.canShare){
    let file=null;
    try{file=new File([c.blob],filename,{type:c.ext==="mp4"?"video/mp4":"video/webm"});}catch(e){}
    if(file&&navigator.canShare({files:[file]})){
      navigator.share({files:[file]}).then(()=>{btn.textContent="Done";}).catch(e=>{if(!e||e.name!=="AbortError") link();});
      return;
    }
  }
  link();
}
async function saveClip(c,btn){
  const filename=c.name+"."+c.ext;
  if(!(window.claude&&window.claude.use)){saveOutsideClaude(c,btn,filename);return;}   // must run straight from the tap
  btn.disabled=true;
  try{
    const dl=await getDownloads();
    if(dl){
      try{await dl.save({filename,data:c.blob});btn.textContent="Saved";}
      catch(e){
        const code=e&&e.code;
        if(code==="declined") toast("Not saved.");
        else if(code==="too_large") toast("This clip is too big to save here. Record a shorter one.",3600);
        else if(code==="rate_limited") toast("Wait a moment, then press Save again.");
        else toast("Saving did not work in this view.",3600);
      }
    }else toast("Saving is not available in this view.",3600);
  }finally{btn.disabled=false;}
}
function renderClips(){
  const box=$("clips");box.textContent="";
  for(const c of clips){
    const el=document.createElement("div");el.className="clip";
    const v=document.createElement("video");v.src=c.url;v.controls=true;v.playsInline=true;v.preload="metadata";
    v.style.aspectRatio=String(c.aspect);
    const meta=document.createElement("div");meta.className="meta";meta.textContent=c.label+" · "+c.fps+" fps · "+c.secs+" s";
    const row=document.createElement("div");row.className="row";
    const sv=document.createElement("button");sv.className="primary";sv.textContent="Save";sv.onclick=()=>saveClip(c,sv);
    const del=document.createElement("button");del.className="second";del.textContent="Delete";
    del.onclick=()=>{const i=clips.indexOf(c);if(i>=0){clips.splice(i,1);URL.revokeObjectURL(c.url);renderClips();}};
    row.append(sv,del);el.append(v,meta,row);box.append(el);
  }
  $("galleryNote").textContent=clips.length
    ?"Clips stay here only while this page is open. Save the ones you want to keep."
    :"No clips yet. Press the red button to record one.";
  $("clipCount").hidden=!clips.length;$("clipCount").textContent=clips.length;
}

/* ---------- controls ---------- */
const LOCK_OPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
const LOCK_SHUT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
function buildStocks(){
  const row=$("stockRow");row.textContent="";
  for(const name of FORMATS[S.format].stocks){
    const b=document.createElement("button");b.textContent=name;
    b.onclick=()=>{S.stockBy[S.format]=name;remember();paint();closeDrawer();};
    row.append(b);
  }
}
function paint(){
  const F=FORMATS[S.format],isVhs=S.format==="vhs";
  $("formatEng").textContent=F.name;
  $("stockBtn").textContent=S.stock;
  $("evVal").textContent=(S.ev>0?"+":S.ev<0?"−":"")+Math.abs(S.ev).toFixed(1);
  $("fpsBtn").firstChild.nodeValue=String(S.fps);
  $("fpsBtn").disabled=recording;
  $("lockBtn").innerHTML=S.lock?LOCK_SHUT:LOCK_OPEN;
  $("lockBtn").setAttribute("aria-pressed",S.lock);
  $("lockBtn").setAttribute("aria-label",S.lock?"Unlock exposure":"Lock exposure");
  $("trigger").setAttribute("aria-pressed",recording);
  $("trigger").setAttribute("aria-label",recording?"Stop recording":"Start recording");
  for(const b of $("formatRow").children){b.setAttribute("aria-pressed",b.dataset.v===S.format);b.disabled=recording;}
  for(const b of $("stockRow").children) b.setAttribute("aria-pressed",b.textContent===S.stock);
  for(const b of $("facingSeg").children) b.setAttribute("aria-pressed",b.dataset.v===S.facing);
  for(const b of $("sideSeg").children) b.setAttribute("aria-pressed",+b.dataset.v===S.side);
  $("sideSeg").classList.toggle("dim",!S.overscan||isVhs);
  $("overSwitch").setAttribute("aria-checked",S.overscan&&!isVhs);
  $("overSwitch").disabled=isVhs;$("burnSwitch").disabled=isVhs;
  $("burnSwitch").setAttribute("aria-checked",S.burn&&!isVhs);
  $("filmOnlyNote").hidden=!isVhs;
  $("filterRange").value=S.filter;$("filterOut").textContent=FILTERS[S.filter][0];
  $("speedRange").value=S.zoomSpeed;$("speedOut").textContent=S.zoomSpeed.toFixed(1)+"×";
}
function closeDrawer(){$("stockDrawer").hidden=true;$("stockBtn").setAttribute("aria-expanded","false");}
$("stockBtn").onclick=()=>{const d=$("stockDrawer");d.hidden=!d.hidden;$("stockBtn").setAttribute("aria-expanded",String(!d.hidden));};
$("formatRow").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(!v||!FORMATS[v]||recording||v===S.format) return;
  S.format=v;remember();buildStocks();paint();
};
$("evDown").onclick=()=>{S.ev=Math.max(-3,Math.round((S.ev-.5)*2)/2);paint();};
$("evUp").onclick=()=>{S.ev=Math.min(3,Math.round((S.ev+.5)*2)/2);paint();};
$("fpsBtn").onclick=()=>{
  if(recording) return;
  const o=FORMATS[S.format].fps;S.fpsBy[S.format]=o[(o.indexOf(S.fps)+1)%o.length];remember();paint();
};
$("lockBtn").onclick=async()=>{
  const tr=mode==="live"&&liveStream&&liveStream.getVideoTracks()[0];
  if(!tr){toast("Exposure lock works with the live camera only.");return;}
  const caps=tr.getCapabilities?tr.getCapabilities():{};
  if(!caps.exposureMode||caps.exposureMode.indexOf("manual")<0){toast("This phone's browser cannot lock exposure.");return;}
  const next=!S.lock;
  try{await tr.applyConstraints({advanced:[{exposureMode:next?"manual":"continuous"}]});S.lock=next;paint();}
  catch(e){toast("This phone's browser cannot lock exposure.");}
};
function hold(btn,dir){
  const on=e=>{e.preventDefault();zoomDir=dir;$("zoomRead").classList.remove("off");try{btn.setPointerCapture(e.pointerId);}catch(x){}};
  const off=()=>{if(zoomDir===dir){zoomDir=0;setTimeout(()=>{if(!zoomDir)$("zoomRead").classList.add("off");},900);}};
  btn.addEventListener("pointerdown",on);
  for(const ev of ["pointerup","pointercancel","lostpointercapture"]) btn.addEventListener(ev,off);
  btn.addEventListener("keydown",e=>{if((e.key===" "||e.key==="Enter")&&!e.repeat){zoomDir=dir;$("zoomRead").classList.remove("off");}});
  btn.addEventListener("keyup",off);btn.addEventListener("blur",off);
  btn.addEventListener("contextmenu",e=>e.preventDefault());
}
hold($("zoomW"),-1);hold($("zoomT"),1);

$("settingsBtn").onclick=()=>{closeDrawer();$("settings").hidden=false;$("settingsClose").focus();};
$("settingsClose").onclick=()=>{$("settings").hidden=true;$("settingsBtn").focus();};
$("galleryBtn").onclick=()=>{closeDrawer();$("gallery").hidden=false;$("galleryClose").focus();};
$("galleryClose").onclick=()=>{for(const v of $("clips").querySelectorAll("video")) v.pause();$("gallery").hidden=true;$("galleryBtn").focus();};
$("facingSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(!v||v===S.facing) return;
  S.facing=v;remember();paint();
  $("shootInput").setAttribute("capture",v);
  if(mode==="live"&&!recording) startLive(false);
};
$("overSwitch").onclick=()=>{if(recording){toast("Stop recording to change this.");return;}S.overscan=!S.overscan;remember();paint();};
$("burnSwitch").onclick=()=>{S.burn=!S.burn;remember();paint();};
$("sideSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(v===undefined||S.format==="vhs") return;
  if(recording){toast("Stop recording to change this.");return;}
  S.side=+v;if(!S.overscan) S.overscan=true;remember();paint();
};
$("filterRange").oninput=e=>{S.filter=+e.target.value;remember();paint();};
$("speedRange").oninput=e=>{S.zoomSpeed=+e.target.value;remember();paint();};
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape") return;
  if(!$("settings").hidden) $("settingsClose").click();
  else if(!$("gallery").hidden) $("galleryClose").click();
  else closeDrawer();
});

/* ---------- start ---------- */
$("shootInput").setAttribute("capture",S.facing);
buildStocks();paint();renderClips();
glOK=initGL();
if(!glOK) toast("This browser cannot draw the film look (WebGL is off).",6000);
requestAnimationFrame(tick);
if(FRAMED) showCard(false);
else startLive(true).then(ok=>{if(!ok&&mode==="test") showCard(false);});
window.__reel8={S,dyn,FILM_STOCKS,FORMATS,FILTERS,dustSheet(){return dustCanvas?dustCanvas.toDataURL("image/png"):null;},get mode(){return mode;},get frames(){return frames;},clips,loadClip,paint,buildStocks,
  still(el){stillEl=el;mode="still";$("srcCard").hidden=true;},snap(){return new Promise(r=>{snapCb=r;});}};
})();
