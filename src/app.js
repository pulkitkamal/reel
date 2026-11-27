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
// Looks of our own: not copies of any film that was sold, each with one strong character. (Working names.)
Object.assign(FILM_STOCKS,{
  "CINDRA":{wb:[1.00,1.00,1.00],sat:0.42,k:7.4,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1],hd:.6,black:[.012,.013,.016],white:[.955,.955,.945],grain:.60,hal:2.4,bloom:.08,bw:0,dust:1},
  "SOLANE":{wb:[1.12,1.00,0.78],sat:0.92,k:4.1,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,.98,.92],hd:.4,black:[.085,.060,.034],white:[.955,.900,.770],grain:.50,hal:5.2,bloom:.17,bw:0,dust:1},
  "LAGRA": {wb:[0.96,1.05,0.94],sat:1.38,k:6.3,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1.14,1.0,.80],hd:.3,black:[.010,.042,.066],white:[.975,.950,.700],grain:.46,hal:3.4,bloom:.10,bw:0,dust:1},
  "ROSEL": {wb:[1.07,0.96,1.03],sat:0.80,k:3.5,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1],hd:.45,black:[.090,.062,.080],white:[.965,.900,.925],grain:.55,hal:4.4,bloom:.15,bw:0,dust:1},
  "NOCTAR":{wb:[0.80,0.98,1.28],sat:1.02,k:5.3,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1.05],hd:.4,black:[.010,.020,.052],white:[.860,.925,.975],grain:.60,hal:6.6,bloom:.20,bw:0,dust:1},
  "UMBRIN":{wb:[1.00,1.00,1.00],sat:0.00,k:5.2,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1],hd:0,black:[.040,.040,.040],white:[.950,.950,.950],grain:.55,hal:3.0,bloom:.11,bw:1,tone:[1,.86,.64],dust:1},
  "RUBRA": {wb:[1.03,1.00,0.98],sat:1.62,k:6.5,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1.05,1,1.05],hd:.25,black:[.020,.020,.026],white:[.955,.935,.905],grain:.40,hal:3.2,bloom:.09,bw:0,dust:1},
  "NOIRA": {wb:[1.00,1.00,1.00],sat:0.00,k:7.8,gain:1.09,off:0,gam:[1,1,1],sh:1.2,kc:[1,1,1],hd:0,black:[.008,.008,.008],white:[.975,.975,.975],grain:1.05,hal:2.2,bloom:.10,bw:1,tone:[1,1,1],dust:1}
});
// What each film is called on screen. Inside, the twelve keep their old keys (saved settings and the colour tables go by them).
const NAMES={"50D":"clario50","100D":"silvia200","200T":"islands","250D":"velo","500T":"laurel","K64":"crème","VELVIA":"verda","400H":"mina","P400":"tessa","GOLD":"sona","EKTAR":"latte","B&W":"grafit"};
function nameOf(k){return NAMES[k]||String(k).toLowerCase();}
const TONE0=[1,.99,.955];                             // black and white film is a hair warm; a toned film sets its own
const TAPES={
  "SP":  {soft:1.0,noise:.050,wear:0.00,sat:.92},
  "EP":  {soft:1.5,noise:.085,wear:0.22,sat:.84},
  "WORN":{soft:1.7,noise:.120,wear:1.00,sat:.76}
};
// Two films that exist only as spektrafilm colour tables (see luts.js). Their own-colour values are stand-ins for the moment before a table has loaded.
FILM_STOCKS["250D"]=Object.assign({},FILM_STOCKS["50D"],{grain:.52,hal:4.8,bloom:.13,sf:true});
FILM_STOCKS["K64"]=Object.assign({},FILM_STOCKS["100D"],{grain:.40,hal:2.6,bloom:.07,sf:true});
// Photo films, also table-only. Grain goes with the film's speed; the slide film (Velvia) glows less round lights, as slides do.
for(const [name,like,grain,hal,bloom] of [["VELVIA","100D",.38,2.6,.07],["400H","50D",.58,4.6,.13],["P400","50D",.58,4.6,.13],["GOLD","50D",.50,4.8,.13],["EKTAR","50D",.40,4.2,.11]])
  FILM_STOCKS[name]=Object.assign({},FILM_STOCKS[like],{grain,hal,bloom,sf:true});
// The Super 8 look, as chosen from three strengths shown side by side (the strongest): a soft picture (the small size and blur below),
// twice the glow round lights, three and a half times the bloom, and blacks lifted off the floor to a milky dark grey.
const LOOK={hal:2,bloom:3.5,lift:.05};
// Picture shapes. The long side follows the way the phone is held: 4:3 is upright 3:4 on an upright phone.
const SHAPES={"1:1":1,"4:3":4/3,"16:9":16/9};
const FORMATS={
  s8: {name:"SUPER 8", aspect:4/3,fps:[9,12,18,24],stocks:["50D","100D","200T","250D","500T","K64","VELVIA","400H","P400","GOLD","EKTAR","B&W","CINDRA","SOLANE","LAGRA","ROSEL","NOCTAR","UMBRIN","RUBRA","NOIRA"],pShort:380,gs:1.15,grainMul:1.0, weave:1.0, vig:.58,vexp:.55,ca:.0035,corner:.034,strip:.15,edge:.036,soft:.75,halo:2.1,dsz:1.0,dmg:1.0},
  s16:{name:"SUPER 16",aspect:5/3,fps:[24,25],stocks:Object.keys(FILM_STOCKS),pShort:880,gs:.9,grainMul:.6,weave:.32,vig:.24,vexp:1.25,ca:.0014,corner:.012,strip:.13,edge:.030,soft:.55,halo:1.0,dsz:.65,dmg:.6},
  vhs:{name:"VHS",     aspect:4/3,fps:[25,30],stocks:Object.keys(TAPES),      pShort:480}
};
const FILTERS=[
  ["85B Warm",[1.22,1.00,0.72]],["85 Warm",[1.18,1.00,0.76]],["81EF Warm",[1.11,1.00,0.86]],["81A Warm",[1.05,1.00,0.93]],
  ["None",[1,1,1]],
  ["82A Cool",[0.95,1.00,1.06]],["82B Cool",[0.91,1.00,1.11]],["80B Cool",[0.80,1.00,1.22]],["80A Cool",[0.74,1.00,1.30]]
];

// Formats on offer. Super 16 and VHS are built but switched off for now, while Super 8 is being perfected.
const ACTIVE=["s8"];

/* ---------- state ---------- */
// What each film is for, in plain words (shown on its label), and the three stripes on that label.
const FILM_INFO={
  "50D":["Bright sun. Clean and fine",["#e5642b","#dfa53a","#f3d98b"]],"100D":["Bright sun. Rich colour",["#cf3a2e","#e5642b","#dfa53a"]],
  "200T":["Indoor light. Warm, classic",["#e5642b","#dfa53a","#2f5d7c"]],"250D":["Any daylight. Soft all-rounder",["#dfa53a","#7a9a5b","#2f5d7c"]],
  "500T":["Night. Grainy and moody",["#2f5d7c","#1d3348","#cf3a2e"]],"K64":["Old home movies. Deep reds",["#cf3a2e","#dfa53a","#1d1b18"]],
  "VELVIA":["Very vivid. Landscapes",["#2f7d4f","#cf3a2e","#5b3a8a"]],"400H":["Pastel. Soft greens",["#8fc0a9","#f1c6c0","#dfe6c8"]],
  "P400":["Kind to skin. Gentle",["#e8b9a0","#dfa53a","#8a6a55"]],"GOLD":["Warm holiday snaps",["#dfa53a","#e5642b","#7a4a1e"]],
  "EKTAR":["Punchy and sharp",["#cf3a2e","#2f5d7c","#dfa53a"]],"B&W":["Black and white",["#1d1b18","#8a867e","#d6d1c4"]],
  "CINDRA":["Silver and hard. Drained colour",["#3a3d40","#8a8d90","#d9dadb"]],"SOLANE":["Seventies sun. Faded and golden",["#e0a040","#c9773a","#7a5a30"]],
  "LAGRA":["Cross-processed. Teal and yellow",["#1f8f8a","#e6d04a","#16454f"]],"ROSEL":["Pink haze. Soft and expired",["#e8b0c0","#d9c0b0","#8a6a78"]],
  "NOCTAR":["Blue night. Glowing lights",["#16305f","#3f6fb0","#e8c070"]],"UMBRIN":["Brown and white. Old album",["#3a2a1a","#9a7a55","#e8d8b8"]],
  "RUBRA":["Loud colour. Deep reds and blues",["#c8202a","#1f4fa8","#e8b830"]],
  "NOIRA":["Hard black and white. Heavy grain",["#0c0c0c","#6a6a6a","#f0f0f0"]]};
function filmStripes(el,name){const f=FILM_INFO[name];if(!f) return;f[1].forEach((c,i)=>el.style.setProperty("--s"+(i+1),c));}
const S={grain:2,colour:0,move:true,format:"s8",stockBy:{s8:"200T",s16:"200T",vhs:"SP"},fpsBy:{s8:18,s16:24,vhs:25},ev:0,lock:false,
  facing:"environment",overscan:false,side:0,filter:4,zoomSpeed:1,zoom:1,burn:true,lens:false,sound:true,light:false,filmSound:true,whirr:false,shape:"4:3",histo:false,grid:false,shoot:"video",lensLook:0,grainAmt:1,halAmt:1,bloomAmt:1,vigAmt:1,breathAmt:1,weaveAmt:1,dmgAmt:1,diffAmt:0,star:0,starAmt:1};
Object.defineProperty(S,"stock",{get(){return S.stockBy[S.format];}});
Object.defineProperty(S,"fps",{get(){return S.fpsBy[S.format];}});
let mode="test";            // "test" | "live" | "clip" | "still" (still is for testing only)
let recording=false,stillEl=null;
try{
  const saved=JSON.parse(localStorage.getItem("reel8v2")||"{}");
  if(FORMATS[saved.format]&&ACTIVE.includes(saved.format)) S.format=saved.format;
  for(const f in FORMATS){
    if(saved.stockBy&&FORMATS[f].stocks.includes(saved.stockBy[f])) S.stockBy[f]=saved.stockBy[f];
    if(saved.fpsBy&&FORMATS[f].fps.includes(saved.fpsBy[f])) S.fpsBy[f]=saved.fpsBy[f];
  }
  if(saved.facing==="user") S.facing="user";
  // Overscan, the grain and colour comparisons, the lens flare and the movement switch have left the screen: the camera always starts
  // with no film edge, the rebuilt grain, its own colour, no lens flare, and film movement on, whatever an older visit had stored.
  if([0,1,2,3].includes(saved.side)) S.side=saved.side;
  if(saved.filter>=0&&saved.filter<FILTERS.length) S.filter=saved.filter|0;
  if(saved.zoomSpeed) S.zoomSpeed=Math.min(2,Math.max(.4,+saved.zoomSpeed||1));
  if(saved.filmFlare===false) S.burn=false;
  S.lens=saved.lensFlare2===true;                      // the redone flare has its own key: an old "on" from the first flare does not carry over
  if(saved.sound===false) S.sound=false;
  if(SHAPES[saved.shape]) S.shape=saved.shape;
  if(saved.histo===true) S.histo=true;
  if(saved.grid===true) S.grid=true;
  if(saved.shoot==="photo") S.shoot="photo";
  if(saved.lensLook===1||saved.lensLook===2) S.lensLook=saved.lensLook;
  if(saved.grainAmt>=0&&saved.grainAmt<=1) S.grainAmt=saved.grainAmt;
  if(saved.halAmt>=0&&saved.halAmt<=1) S.halAmt=saved.halAmt;
  for(const k of ["bloomAmt","vigAmt","breathAmt","weaveAmt","dmgAmt","starAmt"]) if(saved[k]>=0&&saved[k]<=2) S[k]=saved[k];
  if(saved.diffAmt>=0&&saved.diffAmt<=1) S.diffAmt=saved.diffAmt;
  if(saved.star===4||saved.star===6) S.star=saved.star;
  S.histo=true;                                        // the light graph has its own panel now and is always drawn
  if(saved.filmSound===false) S.filmSound=false;
  if(saved.whirr===true) S.whirr=true;
}catch(e){}
function remember(){
  try{localStorage.setItem("reel8v2",JSON.stringify({format:S.format,stockBy:S.stockBy,fpsBy:S.fpsBy,facing:S.facing,
    overscan:S.overscan,side:S.side,filter:S.filter,zoomSpeed:S.zoomSpeed,filmFlare:S.burn,lensFlare2:S.lens,movement:S.move,colour:S.colour?"spektrafilm":"reel8",grainTry:S.grain,sound:S.sound,filmSound:S.filmSound,whirr:S.whirr,shape:S.shape,histo:S.histo,grid:S.grid,shoot:S.shoot,lensLook:S.lensLook,grainAmt:S.grainAmt,halAmt:S.halAmt,bloomAmt:S.bloomAmt,vigAmt:S.vigAmt,breathAmt:S.breathAmt,weaveAmt:S.weaveAmt,dmgAmt:S.dmgAmt,diffAmt:S.diffAmt,star:S.star,starAmt:S.starAmt}));}catch(e){}
}

/* ---------- toast ---------- */
let toastT=0;
function toast(msg,ms){
  const t=$("toast");t.textContent=msg;t.classList.remove("off");$("filmTag").classList.add("off");
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
const FS_PREP=COMMON+`uniform sampler2D uTex;uniform float uSrcA,uPicA,uZoom,uMirror,uClean,uCk;uniform vec2 uPx;
// When the picture is enlarged (zoom), the camera's own noise is enlarged with it and starts to look like coarse grain.
// This evens out small differences between neighbouring points (flat walls, skies) and leaves edges and real detail alone.
vec3 clean(vec2 q,vec3 c0){
  vec3 acc=c0;float ws=1.;
  for(int j=-2;j<=2;j++)for(int i=-2;i<=2;i++){
    if(i==0&&j==0) continue;
    vec3 c=texture2D(uTex,q+vec2(float(i),float(j))*uPx).rgb,d=c-c0;
    float w=exp(-dot(d,d)*uCk-float(i*i+j*j)*.11);
    acc+=c*w;ws+=w;
  }
  return mix(c0,acc/ws,uClean);
}
void main(){
  vec2 q=(vUv-.5)/uZoom;
  if(uSrcA>uPicA)q.x*=uPicA/uSrcA;else q.y*=uSrcA/uPicA;
  q+=.5;if(uMirror>.5)q.x=1.-q.x;
  vec3 c=texture2D(uTex,q).rgb;
  if(uClean>.001) c=clean(q,c);
  gl_FragColor=vec4(c,1.);
}`;
const CLEAN={from:1.1,span:.7,px0:1.45,pxk:.45,k:140};   // starts just above 1x, full by 1.8x; reaches further the more the picture is enlarged
// 1b. two camera pictures mixed into one film frame, added up as light (so a moving lamp leaves a bright trail, as it does on film)
const FS_MIX=COMMON+`uniform sampler2D uA,uB;uniform float uShare;
void main(){vec3 a=texture2D(uA,vUv).rgb,b=texture2D(uB,vUv).rgb;gl_FragColor=vec4(sqrt(mix(a*a,b*b,uShare)),1.);}`;
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
// 2b. lens flare, step 1: keep only what is burnt out to white (lamps, the sun, glints), shrunk 4 times
const FS_HOT=COMMON+`uniform sampler2D uTex;uniform vec2 uPx;
vec4 hot(vec2 q){
  vec3 c=texture2D(uTex,q).rgb;
  float mx=max(c.r,max(c.g,c.b)),lum=dot(c,vec3(.299,.587,.114));
  float h=smoothstep(.955,.995,mx)*smoothstep(.60,.85,lum);
  return vec4(c*h,h);
}
void main(){
  gl_FragColor=(hot(vUv+uPx*vec2(-1.,-1.))+hot(vUv+uPx*vec2(1.,-1.))+hot(vUv+uPx*vec2(-1.,1.))+hot(vUv+uPx*vec2(1.,1.)))*.25;
}`;
// 2d. lens look. Two old kinds of glass, drawn on the small picture before the film gets it (so the grain stays on top, as on real film).
// uLm 1 "swirl": the middle stays sharp; outwards everything smears in a circle round the centre, the edges bulge a little,
//   colours part slightly at the rim and the corners go dark.
// uLm 2 "anamorphic": a squeezed cinema lens. Lines bow (more across than up and down), the left and right sides smear upwards,
//   and every small bright light throws a long thin line sideways. The line keeps nearly no colour of its own.
const FS_HOT2=COMMON+`uniform sampler2D uTex;uniform vec2 uPx;
vec4 hot(vec2 q){
  vec3 c=texture2D(uTex,q).rgb;
  float mx=max(c.r,max(c.g,c.b)),lum=dot(c,vec3(.299,.587,.114));
  float h=smoothstep(.80,.97,mx)*smoothstep(.50,.82,lum);
  return vec4(c*h,h);
}
void main(){
  gl_FragColor=(hot(vUv+uPx*vec2(-1.,-1.))+hot(vUv+uPx*vec2(1.,-1.))+hot(vUv+uPx*vec2(-1.,1.))+hot(vUv+uPx*vec2(1.,1.)))*.25;
}`;
const FS_FX=COMMON+`uniform sampler2D uTex,uDiff,uRays,uHot;uniform float uDf,uSt;
void main(){
  vec3 c=texture2D(uTex,vUv).rgb;
  if(uDf>0.){                                        // a mist filter: light spreads softly out of the bright parts, and the darks lift a little
    vec3 b=texture2D(uDiff,vUv).rgb;
    c=mix(c,1.-(1.-c)*(1.-b*.8),uDf);
    c=mix(c,b,uDf*.22);
  }
  if(uSt>0.){                                        // a star filter: thin rays out of each small bright light
    vec3 r=texture2D(uRays,vUv).rgb;
    float big=0.;                                    // a burnt-out sky is not a lamp and gets no rays
    for(int j=0;j<5;j++)for(int k=0;k<5;k++) big+=texture2D(uHot,vec2(.1+.2*float(k),.1+.2*float(j))).a;
    r*=1.-smoothstep(.10,.30,big/25.);
    r=mix(vec3(dot(r,vec3(.3333))),r,.45);
    c+=r*uSt;
  }
  gl_FragColor=vec4(c,1.);
}`;
const FX={len:[.005,.016,.052],gain:3.2,ang:{4:[.35,1.9208],6:[.2618,1.309,2.3562]}};   // ray lengths (three blurs, each longer), strength, and the angles of the rays
const FS_LENS=COMMON+`uniform sampler2D uTex,uS1,uS2,uS3;uniform float uLm,uAmt,uAsp,uStreak;
vec2 A,B;                                            // A: picture shape; B: turns the centred, round coordinates back into picture coordinates
vec3 ca(vec2 d,vec2 f){                              // red a hair smaller, blue a hair bigger
  return vec3(texture2D(uTex,d*(1.-f)*B+.5).r,texture2D(uTex,d*B+.5).g,texture2D(uTex,d*(1.+f)*B+.5).b);
}
void main(){
  A=vec2(uAsp,1.);float Rn=length(A)*.5;B=Rn/A;
  vec2 d=(vUv-.5)*A/Rn;float r=length(d),r2=r*r;      // r is 1 in the corners
  vec3 col=vec3(0.);float ws=0.;
  if(uLm<1.5){
    float m=pow(clamp((r-.34)/.66,0.,1.),1.5);
    vec2 p=d*(1.+.054*uAmt*(r2-1.));
    float f=.0105*uAmt*r2;
    for(int i=0;i<13;i++){
      float t=float(i)/6.-1.,a=t*.062*uAmt*m,c=cos(a),sn=sin(a);
      float rs=1.+(mod(float(i),2.)*2.-1.)*.010*uAmt*m*(1.-abs(t)*.3);
      float w=1.-.5*abs(t);
      col+=w*ca(vec2(p.x*c-p.y*sn,p.x*sn+p.y*c)*rs,vec2(f));ws+=w;
    }
    col/=ws;
    col*=pow(max(1.-.42*min(uAmt,1.6)*pow(min(r,1.),2.6),.02),.4545);
  }else{
    float ax=abs(vUv.x-.5)*2.,mx=pow(clamp((ax-.45)/.55,0.,1.),1.5);
    vec2 p=vec2(d.x*(1.+.0765*uAmt*(r2-1.)),d.y*(1.+.027*uAmt*(r2-1.)));
    vec2 f=vec2(.009*uAmt*ax*ax,0.);
    float sg=.0146*uAmt*mx/Rn;
    for(int i=0;i<9;i++){
      float t=float(i)/4.-1.,w=exp(-2.*t*t);
      col+=w*ca(p+vec2(0.,t*sg*2.),f);ws+=w;
    }
    col/=ws;
    vec3 st=texture2D(uS1,vUv).rgb*.34+texture2D(uS2,vUv).rgb*.33+texture2D(uS3,vUv).rgb*.33;
    float big=0.;                                    // how much of the whole picture is burnt out: lamps are small, a white sky is not, and a white sky gets no streaks
    for(int j=0;j<5;j++)for(int k=0;k<5;k++) big+=dot(texture2D(uS3,vec2(.1+.2*float(k),.1+.2*float(j))).rgb,vec3(.3333));
    st*=1.-smoothstep(.06,.22,big/25.);
    st=mix(vec3(dot(st,vec3(.3333))),st,.25);
    col+=st*uStreak;
    col*=pow(max(1.-.30*uAmt*pow(min(r,1.),2.4),.02),.4545);
  }
  gl_FragColor=vec4(col,1.);
}`;
const LENSLOOK={names:["Clean","Swirl","Anamorphic"],swirl:1.3,ana:1,streak:3.4,bloom:1.5};
// how bright the scene is as a whole (8 x 8 samples)
const FS_LUM=COMMON+`uniform sampler2D uTex;
void main(){
  float s=0.;
  for(int j=0;j<4;j++)for(int i=0;i<4;i++){
    vec2 o=(vec2(float(i),float(j))+.5)/4.-.5;
    s+=dot(texture2D(uTex,vUv+o/8.).rgb,vec3(.299,.587,.114));
  }
  gl_FragColor=vec4(vec3(s/16.),1.);
}`;
// 2c. lens flare, step 2: the light a real lens adds on its own when a lamp or the sun is in the shot.
// For each light: a wide soft glow, a few faint uneven rays, and "ghost" spots strung along the line through the middle of the picture.
// The spots are diamond-shaped because many Super 8 cameras have a two-blade iris. Their places, sizes and colours are fixed, as in one real lens.
const FS_FLARE=COMMON+`uniform vec4 uS[3],uC[3];uniform vec2 uAsp;uniform float uA,uSeedF;
float lp(vec2 q,float e){q=abs(q)+1e-5;return pow(pow(q.x,e)+pow(q.y,e),1./e);}
vec3 ghost(vec2 p,vec2 s,float k,float rad,vec3 col,float amp,float soft,float rim){
  vec2 q=(p+s*k)/rad;
  float m=lp(q,1.5);
  vec3 e=1.-smoothstep(vec3(1.035,1.,.965)-soft,vec3(1.035,1.,.965)+soft,vec3(m));   // each colour a hair different in size: a faint coloured rim
  float mm=min(m,1.);
  float side=1.+.22*dot(q,normalize(s+1e-4));                                         // a little brighter on one side, as real ones are
  return mix(col,vec3(1.),.35)*e*mix(1.-.25*mm*mm,.45+.55*mm*mm,rim)*side*amp;
}
void main(){
  vec2 p=(vUv-.5)*uAsp;
  vec3 f=vec3(0.);
  for(int i=0;i<3;i++){
    vec4 S=uS[i];
    if(S.z<.003) continue;
    vec3 col=uC[i].rgb;
    vec2 s=(S.xy-.5)*uAsp;
    vec2 d=p-s;float r=length(d);float P=S.z;
    float wide=P*min(uA,1.);                                                          // the wide haze needs a strong light in a bright scene; in the dark it would fog the whole picture
    float glow=.55*sqrt(P)*exp(-r/.035)+wide*(.26*exp(-r/.10)+.085/(1.+pow(r/.20,2.)));
    // no drawn rays: a real lens gives a soft veil round the light, and rays only when a star filter is fitted (that is its own control)
    f+=col*vec3(1.,.90,.74)*glow*.8*P*uA;
    f+=col*vec3(1.,.86,.66)*.026*P*wide*uA;
    float G=pow(P,1.3)*smoothstep(.08,.35,P)*S.w*uA*smoothstep(.04,.2,length(s));   // glints are too weak to throw ghost spots
    if(G>.002){
      f+=G*col*( ghost(p,s, .55,.046,vec3(1.,.72,.42),.15,.48,.0)       // two faint, soft spots across the middle from the light; no row of coloured discs
               + ghost(p,s,1.22,.105,vec3(.72,.78,.86),.055,.42,.6) );
    }
  }
  f=min(f,vec3(4.));
  gl_FragColor=vec4(sqrt(f/4.)+(h1(gl_FragCoord.xy+uSeedF)-.5)/255.,1.);
}`;
// 3a. film
const FS_FILM=COMMON+`uniform sampler2D uP,uGlow,uNoise,uDustTex,uFlare;
uniform vec4 uDp[4],uDq[4],uSc[6],uSd[6],uLk,uLk2;
uniform vec3 uLkWb;
uniform vec2 uOut,uWeave,uOff1,uOff2;
uniform vec3 uWb,uBlack,uWhite,uGam,uKc,uTone;uniform sampler2D uLut,uGrainTex;uniform float uLutOn,uLift,uGm,uGk,uGrho,uGskew;uniform vec4 uGrot;uniform vec2 uJit;
uniform float uSeed,uEv,uSat,uK,uGrain,uGs,uHal,uBloom,uBw,uFlicker,uOver,uSide,uFmt,uVig,uCa,uCorner,uT,uE,uFl,uFlash,uDsz,uGain,uOff,uSh,uHd,uVexp;
// second colour choice: look the colour up in a table (33 steps a side, laid out as 33 tiles in a row, one for each step of blue)
vec3 lut3(vec3 c){
  c=clamp(c,0.,1.);float n=33.,b=c.b*(n-1.),b0=floor(b),b1=min(b0+1.,n-1.);
  vec2 q=vec2((c.r*(n-1.)+.5)/n,(c.g*(n-1.)+.5)/n);
  return mix(texture2D(uLut,vec2((b0+q.x)/n,q.y)).rgb,texture2D(uLut,vec2((b1+q.x)/n,q.y)).rgb,b-b0);
}
float sig(float x,float k){
  float a=1./(1.+exp(k*.5)),b=1./(1.+exp(-k*.5));
  return (1./(1.+exp(-k*(x-.5)))-a)/(b-a);
}
// film flare: stray light that reached the film itself, in the cartridge or at the gate. It comes in from the film's edges.
// A little light fogs the red layer first, more reaches green, a lot reaches blue: red, then orange, then yellow, then white.
vec3 leak(vec2 q){
  float sd=uLk.w;
  float n1=texture2D(uNoise,vec2(q.y*.0105+sd,sd*.37)).r;
  float n2=texture2D(uNoise,vec2(q.x*.008+sd*.61,q.y*.015+sd*.13)).g;
  float n3=texture2D(uNoise,vec2(q.x*.035+sd*.29,q.y*.003+sd*.83)).b;
  float xn=max(q.x,-.25),xf=max(1.-q.x,-.25);
  float bump=1.+1.4*exp(-pow((q.y-uLk.y)/.28,2.));
  float E=uLk.x*exp(-xn/max(uLk.z*(.35+1.3*n1)*bump,.02));
  E+=uLk2.y*exp(-xf/max(uLk.z*(.35+1.3*(1.-n1))*bump,.02));
  float xh=uLk.x>=uLk2.y?xn:xf;
  E+=uLk2.z*exp(-pow(xh/.16,2.)-pow((q.y-uLk2.w)/.11,2.));
  E*=.55+.9*n2+.35*(n3-.5);
  E+=uLk2.x*(.8+.4*n2);
  return 2.6*(1.-exp(-max(E,0.)*vec3(3.0,1.1,.5)));
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
  // New grain (uGm = 2). Real grain is what the picture is made of, so it is looked up first: it nudges where the picture is read
  // (edges come out a hair ragged and alive, as on film) and is added later, layer by layer.
  // No two places in a frame share a pattern: the reading point drifts slowly across the frame, and every frame is turned and moved at random.
  vec3 f1=vec3(0.),f2=vec3(0.),f3=vec3(0.);float mtl=0.;vec2 jit=vec2(0.);
  if(uGm>1.5){
    vec2 gp=P/(1024.*uGs);
    vec2 wq=(texture2D(uGrainTex,gp/53.+uOff2).rg-.5)*(18./1024.);
    vec2 q0=vec2(dot(uGrot.xy,gp),dot(uGrot.zw,gp))+uOff1+wq;
    f1=texture2D(uGrainTex,q0).rgb-.5;                           // fine grain, a pattern of its own for each colour layer
    f2=texture2D(uGrainTex,q0.yx*.59+uOff2.yx).rgb-.5;           // clumps, about 1.7 times larger
    f3=texture2D(uGrainTex,q0*1.19+vec2(.613,.237)).rgb-.5;      // a little finer
    mtl=texture2D(uGrainTex,gp/7.3+uOff2*1.7).g-.5;              // slow unevenness
    jit=vec2(f1.r,f1.b)*uJit;
  }
  vec3 c;
  c.r=texture2D(uP,uv+jit+cu*uCa*r2).r;
  c.g=texture2D(uP,uv+jit).g;
  c.b=texture2D(uP,uv+jit-cu*uCa*r2).b;
  c=pow(c,vec3(2.2));
  vec3 gw=texture2D(uGlow,uv).rgb;gw*=gw;
  float gl1=dot(gw,vec3(.3,.5,.2));
  float hm=exp(-dot(c,vec3(.3,.5,.2))*10.);
  c+=mix(vec3(1.,.17,.045),vec3(.5),uBw)*gl1*uHal*hm+gw*uBloom;
  if(uFl>.5){vec3 fl=texture2D(uFlare,uv).rgb;c+=fl*fl*4.;}      // lens flare is light in the lens: it goes through the film like the rest of the picture
  float vg=clamp(1.-uVig*pow(min(r2,1.),uVexp),0.,1.);
  c*=exp2(uEv)*uFlicker*vg*uFlash;
  c*=uWb;
  vec3 lk=vec3(0.);
  if(uLk.x+uLk2.x+uLk2.y>.001){lk=leak(pl);c+=lk*uLkWb;}
  vec3 cl=c;
  float l=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l),c,uSat);
  c*=1.-.14*clamp(length(c-l)/(l+.05),0.,1.)*(1.-uBw);
  vec3 g=pow(clamp(c,0.,8.),vec3(1./2.2));
  vec2 gq=P/(512.*uGs);
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
  if(uLutOn>.5){g=lut3(pow(clamp(cl,0.,1.),vec3(1./2.2)));le=dot(g,vec3(.299,.587,.114));}
  g=uLift+g*(1.-uLift);le=uLift+le*(1.-uLift);          // lifted blacks: film shown on a screen never reaches true black   // the table takes the picture as the camera gave it and returns the film's colour
  if(uBw>.5)g=vec3(dot(g,vec3(.299,.587,.114)))*uTone;
  // Grain, measured against a reference clip: one clumpy pattern shared by all three colours, a slow unevenness about seven grains wide,
  // and only soft colour clouds on top (film's three colour layers each have their own grain, but from a normal distance it reads as a gentle tint, not as coloured dots)
  if(uGm>1.5){
    // Strength follows the brightness of each colour layer: most in the middle tones, fading towards black and towards white
    // (measured on the reference clip, and what a physical grain model gives). Dark tones get sparse light specks, bright tones sparse dark ones.
    const float iS=5.32;                                           // the grain texture's spread, turned into units of one
    float Ls=(.80*f1.g+.52*f2.g+.30*f3.g+.30*mtl)*iS;              // the part all three layers share
    vec3 Ic=vec3(.80*f1.r+.60*f2.r,.80*f3.r+.60*f3.b,.74*f1.b+.67*f2.b)*iS;   // each layer's own grain; blue a little coarser
    vec3 nn=mix(sqrt(uGrho)*vec3(Ls)+sqrt(1.-uGrho)*Ic,vec3(Ls),uBw);
    vec3 v=clamp(mix(g,vec3(le),uBw),0.,1.);
    vec3 A=2.296*pow(v,vec3(.62))*pow(1.-v,vec3(.58));
    vec3 a=clamp(uGskew*(1.-2.*v)/sqrt(v*(1.-v)+.02)/5.5,-.3,.3);
    nn=(nn+a*(nn*nn-1.))/sqrt(1.+2.*a*a);
    g+=nn*A*uGrain*uGk;
  }else{
    vec3 n1=texture2D(uNoise,gq+uOff1).rgb-.5;
    vec3 n2=texture2D(uNoise,gq.yx/7.+uOff2).rgb-.5;
    vec3 n3=texture2D(uNoise,gq/2.05+uOff2.yx+.37).rgb-.5;
    vec3 gn=vec3(n1.g+n2.g*.235)*vec3(1.,1.,.92)+n3*vec3(.46,.36,.38)*(1.-uBw);
    g+=gn*uGrain*uGk*(1.-exp(-max(le,0.)/.2));
  }
  // film damage, laid over the grain: a few light hairs and specks, and hair-thin dark scratches along the film's direction of travel
  vec2 lp=pl*rsz;
  float u1=m/1080.;
  vec3 lc=vec3(0.);
  for(int i=0;i<4;i++){
    vec4 a=uDp[i];vec4 b=uDq[i];
    vec2 q=lp-a.xy*rsz;
    float hs=a.w*.0445*m*uDsz;
    float cs=cos(a.z),sn=sin(a.z);
    vec2 r=vec2(q.x*cs+q.y*sn,-q.x*sn+q.y*cs)/hs;
    float ins=step(abs(r.x),.98)*step(abs(r.y),.98);
    vec2 cell=vec2(mod(b.x,8.),floor(b.x/8.));
    lc=max(lc,texture2D(uDustTex,(cell+clamp(r,-.98,.98)*.5+.5)/vec2(8.,4.)).rgb*b.y*ins);
  }
  float la=max(lc.r,max(lc.g,lc.b));
  float da=0.;
  for(int i=0;i<6;i++){
    vec4 a=uSc[i];vec4 b=uSd[i];
    float yy=lp.y-a.y*rsz.y,len=a.z*m,dx=lp.x-a.x*rsz.x;
    if(a.w>0.&&abs(dx)<4.*u1&&yy>-3.*u1&&yy<len+3.*u1){
      // a real scratch is never a ruled line: it wanders a little, swells and thins, and fades in and out along its length
      vec3 w1=texture2D(uNoise,vec2(b.y*.37,yy/(u1*22.*512.)+b.y)).rgb;        // slow changes along the scratch
      vec3 w2=texture2D(uNoise,vec2(b.y*.61+.2,yy/(u1*1.8*512.)+b.y*1.7)).rgb; // quick changes: the beads of a dotted scratch
      float cx=dx-(w1.r-.5)*1.6*u1-(w2.b-.5)*1.5*u1*b.x;                       // wander, well under a pixel either way; beads sit a little off line
      float bead=max(smoothstep(.53,.61,w2.g),smoothstep(.66,.72,w1.r));       // where a bead sits; now and then a solid stretch
      float wd=u1*b.z*mix(.26+.28*w1.g,.42+.7*smoothstep(.50,.72,w2.r),b.x);    // half width: a hairline, or beads of uneven size
      float line=1.-smoothstep(wd-.45*u1,wd+.45*u1,abs(cx));
      float seg=smoothstep(-1.5*u1,2.*u1,yy)*(1.-smoothstep(len-3.*u1,len+1.5*u1,yy));
      float dens=mix(.55+.9*w1.b,bead*(.8+.6*w1.b),b.x);                  // solid scratch: uneven darkness; dotted: only the beads
      da=max(da,line*seg*a.w*clamp(dens,0.,1.2));
    }
  }
  g*=mix(vec3(1.),mix(vec3(.45,.42,.30),vec3(.4),uBw),min(da,1.));
  g=g*(1.-la)+mix(lc*vec3(.97,.95,.90),vec3(la*.95),uBw);
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
    base+=mix(lk,vec3(dot(lk,vec3(.3,.5,.2))),uBw)*.42;
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
  vec2 nq=vec2(vUv.x*uOut.x/(512.*5.),y*uLines/512.);
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

let glOK=false,PR={},srcTex=null,noiseTex=null,grainTex=null,dustTex=null,T={};
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
  const n=512,raw=new Float32Array(n*n*3),out=new Uint8Array(n*n*4);
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
function makeGrainTex(){
  // 1024 x 1024, three independent soft random patterns (one in each colour), spread of 48 steps around the middle
  const n=1024,m=n*n,out=new Uint8Array(m*4),a=new Float32Array(m),b=new Float32Array(m);
  for(let c=0;c<3;c++){
    for(let i=0;i<m;i++) a[i]=(Math.random()+Math.random()+Math.random()+Math.random()-2)*1.732;
    for(let y=0;y<n;y++){const r=y*n;for(let x=0;x<n;x++) b[r+x]=.25*a[r+((x+n-1)&1023)]+.5*a[r+x]+.25*a[r+((x+1)&1023)];}
    for(let y=0;y<n;y++){const r=y*n,u=((y+n-1)&1023)*n,d=((y+1)&1023)*n;for(let x=0;x<n;x++){
      const v=(.25*b[u+x]+.5*b[r+x]+.25*b[d+x])*2.667;             // 2.667 brings the spread back to one after the softening
      out[(r+x)*4+c]=Math.max(0,Math.min(255,Math.round(127.5+v*48)));}}
  }
  for(let i=3;i<out.length;i+=4) out[i]=255;
  const t=makeTex(true);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,n,n,0,gl.RGBA,gl.UNSIGNED_BYTE,out);
  return t;
}
let dustCanvas=null;
function makeDust(){
  // One sheet of 32 small light marks (hairs, specks, lint), drawn once; the film shader stamps a few of them on each frame.
  // Drawn large and shrunk by the graphics chip, so even hair-thin lines stay smooth. The colour of each mark is stored with it.
  const C=256,c=document.createElement("canvas");c.width=C*8;c.height=C*4;
  const x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);
  x.globalCompositeOperation="lighten";             // where strokes overlap, the stronger one wins instead of adding up
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function wave(){                                  // a smooth random curve from 0 to 1 along a mark
    const p=[];for(let i=0;i<4;i++) p.push([rnd(.6,1)*(i?1/(i+1):1),rnd(.7,4.5)*(i+1),rnd(0,6.283)]);
    let tot=0;for(const q of p) tot+=q[0];
    return t=>{let v=0;for(const q of p) v+=q[0]*Math.sin(t*q[1]+q[2]);return .5+.5*v/tot;};
  }
  const TINTS=[[1,.97,.9],[1,.97,.9],[.9,.88,1],[.88,1,.9],[1,.95,.82],[.94,.94,1]];   // mostly warm white; some lean lilac, green or straw
  function dab(px,py,r,a,tA,tB,mixT){
    const R=tA[0]+(tB[0]-tA[0])*mixT,G=tA[1]+(tB[1]-tA[1])*mixT,B=tA[2]+(tB[2]-tA[2])*mixT,v=255*Math.max(0,Math.min(1,a));
    x.fillStyle="rgb("+Math.round(v*R)+","+Math.round(v*G)+","+Math.round(v*B)+")";
    x.beginPath();x.arc(px,py,Math.max(.35,r),0,6.2832);x.fill();
  }
  function fibre(ox,oy,len,wmax,amax,turn,sx,sy){
    // A hair: it bends smoothly, often more at one end, sometimes reversing into an S; it is thickest somewhere along its middle,
    // thins to nothing at the ends, and is brighter in some stretches than others. "turn" is how far it bends in all (radians).
    const wK=wave(),wW=wave(),wA=wave(),wT=wave(),tA=TINTS[Math.floor(rnd(0,TINTS.length))],tB=TINTS[Math.floor(rnd(0,TINTS.length))];
    const flip=Math.random()<.35?rnd(.3,.7):-1,peak=rnd(.3,.7),gap=Math.random()<.3?rnd(.15,.85):-1,hook=Math.random()<.25?rnd(.75,.93):2;
    const pts=[];let px=0,py=0,th=rnd(0,6.283),x0=0,x1=0,y0=0,y1=0;
    const n=Math.ceil(len/.7);
    for(let i=0;i<n;i++){
      const t=i/n;
      let k=turn/len*(.25+1.5*wK(t*6.283));
      if(flip>0) k*=Math.tanh((t-flip)*9);                 // bends one way, then the other
      if(t>hook) k*=3.2;                                   // a tighter curl at one end, like a little hook
      th+=k*.7;px+=Math.cos(th)*.7;py+=Math.sin(th)*.7;pts.push(px,py);
      if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;
    }
    // keep it inside its own cell: shrink if it is too big, and centre it on the spot asked for
    const room=C-52,sc=Math.min(1,room/Math.max(x1-x0,y1-y0,1));
    let cxm=sx-(x0+x1)/2*sc,cym=sy-(y0+y1)/2*sc;
    cxm+=Math.max(0,ox+26-(cxm+x0*sc))-Math.max(0,(cxm+x1*sc)-(ox+C-26));
    cym+=Math.max(0,oy+26-(cym+y0*sc))-Math.max(0,(cym+y1*sc)-(oy+C-26));
    for(let i=0;i<n;i++){
      const t=i/n;
      const taper=Math.pow(Math.max(0,1-Math.pow(Math.abs(t-peak)/Math.max(peak,1-peak),1.6)),.7);     // 1 at the thickest point, 0 at both ends
      let al=amax*(.45+.55*wA(t*6.283))*Math.min(1,taper*3+.15);
      if(gap>0) al*=.25+.75*Math.min(1,Math.abs(t-gap)*9);                                                   // a stretch where it nearly vanishes
      dab(cxm+pts[i*2]*sc,cym+pts[i*2+1]*sc,wmax*.5*(.3+.7*taper)*(.6+.4*wW(t*6.283)),al,tA,tB,wT(t*6.283));
    }
  }
  function speck(cx,cy,r,alpha,t){
    const tilt=rnd(0,3.14),sq=rnd(.4,1);            // uneven and a little stretched, never a neat round bead
    const v=255*alpha;x.fillStyle="rgb("+Math.round(v*t[0])+","+Math.round(v*t[1])+","+Math.round(v*t[2])+")";
    x.beginPath();
    for(let i=0;i<7;i++){
      const a=i/7*6.283,rr=r*rnd(.45,1.3),ux=Math.cos(a)*rr,uy=Math.sin(a)*rr*sq;
      const X=cx+ux*Math.cos(tilt)-uy*Math.sin(tilt),Y=cy+ux*Math.sin(tilt)+uy*Math.cos(tilt);
      if(i) x.lineTo(X,Y); else x.moveTo(X,Y);
    }
    x.closePath();x.fill();
  }
  for(let i=0;i<32;i++){
    const ox=(i%8)*C,oy=Math.floor(i/8)*C,cx=ox+C/2,cy=oy+C/2;
    if(i<14){               // single hairs: a few long curls, mostly short arcs and commas; many are faint
      const big=i<4,faint=i>=9;
      fibre(ox,oy,big?rnd(75,135):rnd(24,72),big?rnd(3.6,5.6):rnd(2.2,4.2),faint?rnd(.35,.6):rnd(.7,1),big?rnd(2.2,6.5):rnd(.5,3.6),cx+rnd(-30,30),cy+rnd(-30,30));
    }else if(i<26){         // specks: one to three tiny uneven flecks, some with a hair-thin tail
      const n=1+Math.floor(rnd(0,2.6)),t=TINTS[Math.floor(rnd(0,TINTS.length))];
      for(let j=0;j<n;j++){
        const sx=cx+(n>1?rnd(-20,20):0),sy=cy+(n>1?rnd(-20,20):0);
        speck(sx,sy,rnd(1.6,i<20?3.2:4.6),rnd(.55,.95),t);
        if(Math.random()<.3) fibre(ox,oy,rnd(10,22),rnd(1.6,2.4),rnd(.4,.8),rnd(.2,1.2),sx+rnd(-5,5),sy+rnd(-5,5));
      }
    }else{                  // lint: two or three short fine hairs tangled together
      const n=2+Math.floor(rnd(0,1.99));
      for(let j=0;j<n;j++) fibre(ox,oy,rnd(20,50),rnd(2.0,3.4),rnd(.45,.9),rnd(1.2,5),cx+rnd(-12,12),cy+rnd(-12,12));
    }
  }
  x.globalCompositeOperation="source-over";dustCanvas=c;
  const t=makeTex(false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
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
    const dotted=t>=.6&&rr()<.25;
    SCRP[i*4]=.02+rr()*.96;SCRP[i*4+1]=rr()*.97;SCRP[i*4+2]=len;SCRP[i*4+3]=on?(dotted?.75+rr()*.25:str):0;
    SCRQ[i*4]=dotted?1:0;SCRQ[i*4+1]=rr()*50;SCRQ[i*4+2]=1;
  }
  const on=rr()<.05*amount;                   // rare: a long dotted trail down part of the frame
  SCRP[20]=.03+rr()*.94;SCRP[21]=rr()*.6;SCRP[22]=.12+rr()*.28;SCRP[23]=on?.7+rr()*.25:0;
  SCRQ[20]=1;SCRQ[21]=rr()*50;SCRQ[22]=rr()<.5?1:2;
}
/* ---------- lens flare: find the lights in the picture ---------- */
const LF={ok:true,tr:[],buf:null,lab:null,stack:null,mem:null,lum:new Uint8Array(256),day:.6,cost:0,skip:0,every:1,
  k(v){return 1-Math.pow(1-v,this.every);},        // one smoothing step, made bigger when the finder only runs on every third frame
  S:new Float32Array(12),C:new Float32Array(12)};
function findLights(w,h,pShort,zoom){
  // reads a tiny copy of the picture in which only burnt-out areas are left, and groups them into separate lights
  const n=w*h;
  if(!LF.buf||LF.buf.length!==n*4){LF.buf=new Uint8Array(n*4);LF.lab=new Uint8Array(n);LF.stack=new Int32Array(n);LF.mem=new Int32Array(n);}
  const a=LF.buf,lab=LF.lab,st=LF.stack,mem=LF.mem;
  gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,a);
  lab.fill(0);
  const out=[],TH=3,cell=4/pShort;                  // one cell is 4 picture pixels; sizes below are shares of the picture's short side
  const ss=(t,e0,e1)=>{const u=Math.min(1,Math.max(0,(t-e0)/(e1-e0)));return u*u*(3-2*u);};
  for(let i=0;i<n;i++){
    const v=a[i*4+3];
    if(v<TH||lab[i]) continue;
    let sp=0,nc=0;st[sp++]=i;lab[i]=1;
    let M=0,sx=0,sy=0,sxx=0,syy=0,cr=0,cg=0,cb=0;
    while(sp){
      const j=st[--sp],x=j%w,y=(j/w)|0,m=a[j*4+3]/255;
      mem[nc++]=j;
      M+=m;sx+=m*x;sy+=m*y;sxx+=m*x*x;syy+=m*y*y;cr+=a[j*4];cg+=a[j*4+1];cb+=a[j*4+2];
      if(x>0&&!lab[j-1]&&a[(j-1)*4+3]>=TH){lab[j-1]=1;st[sp++]=j-1;}
      if(x<w-1&&!lab[j+1]&&a[(j+1)*4+3]>=TH){lab[j+1]=1;st[sp++]=j+1;}
      if(y>0&&!lab[j-w]&&a[(j-w)*4+3]>=TH){lab[j-w]=1;st[sp++]=j-w;}
      if(y<h-1&&!lab[j+w]&&a[(j+w)*4+3]>=TH){lab[j+w]=1;st[sp++]=j+w;}
    }
    if(M<.6) continue;
    const mx=sx/M,my=sy/M,vx=Math.max(sxx/M-mx*mx,0)+.09,vy=Math.max(syy/M-my*my,0)+.09;
    let r2=0,edge=false,x0=w,x1=-1,y0=h,y1=-1,inb=0;
    for(let k=0;k<nc;k++){
      const j=mem[k];if(a[j*4+3]<64) continue;      // the faint fringe does not count for the outline
      const x=j%w,y=(j/w)|0,dx=x-mx,dy=y-my;
      if(dx*dx+dy*dy>r2) r2=dx*dx+dy*dy;
      if(x===0||y===0||x===w-1||y===h-1) edge=true;
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;inb+=a[j*4+3]/255;
    }
    const boxFill=x1>=x0?inb/((x1-x0+1)*(y1-y0+1)):0;   // a full box means straight sides: a window or a screen, not the sun
    const d=2*Math.sqrt(M/Math.PI)*cell/zoom;       // how wide the light is, as if it were a round disc
    const el=Math.sqrt(Math.max(vx,vy)/Math.min(vx,vy));
    const circ=M/(Math.PI*Math.pow(Math.sqrt(r2)+.35,2));
    // A burnt-out spot counts as a light when it is round: a lamp, a bulb, the sun with its glare. Tiny ones are too small to judge, so they count too.
    // Straight-sided, long or ragged shapes are windows, screens, sky or strip lights: they haze the picture but make no glow point and no spots.
    // One that is cut off by the edge of the picture gets half strength, because its true shape cannot be seen.
    const notBox=(1-ss(el,1.4,1.9))*(1-ss(boxFill,.87,.95));
    const round=edge?.7*notBox:ss(circ,.5,.68)*notBox;
    const small=ss(circ,.3,.45)*(1-ss(el,1.9,2.6));             // small lights often have spikes, so they need not be as neat, but ragged bits of white are out
    const tiny=d<.012?1:(1-ss(d,.02,.035))*small;
    const pl=Math.max(tiny,round)*(1-ss(d,.32,.46));
    const P=Math.min(1.15,Math.pow(d/.065,1.1))*pl;
    const gs=edge?notBox:pl*(1-ss(el,1.8,3));
    const cm=Math.max(cr,cg,cb,1);
    out.push({x:(mx+.5)/w,y:(my+.5)/h,P,gs,r:cr/cm,g:cg/cm,b:cb/cm,d,circ,el,edge,boxFill});
  }
  LF.found=out;
  return out;
}
function trackLights(found){
  // follows up to three lights from frame to frame, so their flare fades in and out instead of popping
  const tr=LF.tr;
  for(const t of tr) t.hit=null;
  found.sort((p,q)=>q.P-p.P);
  for(const f of found){
    let best=null,bd=.14;
    for(const t of tr){if(t.hit) continue;const d=Math.hypot(t.x-f.x,t.y-f.y);if(d<bd){bd=d;best=t;}}
    if(best){best.hit=f;continue;}
    if(f.P<.03) continue;
    if(tr.length<3) tr.push({x:f.x,y:f.y,P:0,gs:f.gs,r:f.r,g:f.g,b:f.b,hit:f});
    else{
      let wk=tr[0];for(const t of tr) if(t.P<wk.P) wk=t;
      if(!wk.hit&&f.P>wk.P*2){wk.x=f.x;wk.y=f.y;wk.P=0;wk.gs=f.gs;wk.r=f.r;wk.g=f.g;wk.b=f.b;wk.hit=f;}
    }
  }
  for(let i=tr.length-1;i>=0;i--){
    const t=tr[i],f=t.hit;
    if(f){
      const kp=LF.k(.7),kc=LF.k(.4);
      t.x+=(f.x-t.x)*kp;t.y+=(f.y-t.y)*kp;
      t.P+=(f.P-t.P)*LF.k(f.P>t.P?.55:.35);t.gs+=(f.gs-t.gs)*kc;
      t.r+=(f.r-t.r)*kc;t.g+=(f.g-t.g)*kc;t.b+=(f.b-t.b)*kc;
    }else{t.P*=Math.pow(.55,LF.every);if(t.P<.01) tr.splice(i,1);}
  }
}
function lensFlarePass(Pt,pw,ph,pShort){
  // returns true when there is flare light to add this frame (it is then in the "FL" picture)
  const t0=performance.now();
  if(LF.skip>0) LF.skip--;
  else{
    const w1=Math.ceil(pw/4),h1=Math.ceil(ph/4);
    const H1=target("H1",w1,h1),LM=target("LM",8,8);     // made before anything is bound: making one re-binds the active texture
    bind(0,Pt.tex);use(PR.hot,{uTex:{tex:0},uPx:[1/pw,1/ph]});draw(H1);
    // is this a bright scene (day, lit room) or a dark one (night)? the darker three quarters of the picture decide
    bind(0,Pt.tex);use(PR.lum,{uTex:{tex:0}});draw(LM);
    gl.readPixels(0,0,8,8,gl.RGBA,gl.UNSIGNED_BYTE,LF.lum);
    const lv=[];for(let i=0;i<64;i++) lv.push(Math.pow(LF.lum[i*4]/255,2.2));
    lv.sort((p,q)=>p-q);let ls=0;for(let i=0;i<48;i++) ls+=lv[i];
    // Flare is a share of the light in the lens, so it is scaled to the scene: strong in daylight, slight at night (where the dark would show every trace)
    LF.day+=(Math.min(1.15,Math.max(.08,Math.pow(ls/48/.2,1.6)))-LF.day)*LF.k(.3);
    gl.bindFramebuffer(gl.FRAMEBUFFER,H1.fb);
    trackLights(findLights(w1,h1,pShort,S.zoom));
    LF.cost+=(performance.now()-t0-LF.cost)*.1;
    LF.every=LF.cost>7?3:1;LF.skip=LF.every-1;      // slow phone: look for lights on every third frame only
  }
  let any=false;
  for(let i=0;i<3;i++){
    const t=LF.tr[i];
    LF.S[i*4]=t?t.x:0;LF.S[i*4+1]=t?t.y:0;LF.S[i*4+2]=t?t.P:0;LF.S[i*4+3]=t?t.gs:0;
    LF.C[i*4]=t?t.r:1;LF.C[i*4+1]=t?t.g:1;LF.C[i*4+2]=t?t.b:1;LF.C[i*4+3]=1;
    if(t&&t.P>.003) any=true;
  }
  if(!any) return false;
  const fw=Math.max(16,pw>>1),fh=Math.max(16,ph>>1),FL=target("FL",fw,fh),mn=Math.min(pw,ph);
  use(PR.flare,{uS:LF.S,uC:LF.C,uAsp:[pw/mn,ph/mn],uA:LF.day,uSeedF:Math.random()*50});draw(FL);
  return true;
}

/* ---------- film flare: a burst of stray light on the film, strongest on the first frames and gone within about a second ---------- */
const FLR={n:1e9,len:0,amp:0,y:.5,reach:.3,white:0,far:false,flip:false,flash:1,LK:new Float32Array(4),LK2:new Float32Array(4),mul:1};
function startFilmFlare(k){
  FLR.n=0;FLR.len=Math.round(6+(6+12*Math.random())*k);
  FLR.amp=(.6+.8*Math.random())*k;
  FLR.white=k>.6&&Math.random()<.6?1+Math.floor(Math.random()*3):0;   // some rolls open with a few frames fogged right over
  FLR.y=Math.random();FLR.reach=.12+(.08+.38*Math.random())*k;
  FLR.far=Math.random()<.3;FLR.flip=Math.random()<.3;
  FLR.flash=1+(1.5+2.5*Math.random())*Math.min(1,.4+k);              // the first frame of a shot gets too much light while the motor runs up
}
function rollFilmFlare(){
  const r=Math.random,LK=FLR.LK,LK2=FLR.LK2;
  LK[0]=LK[1]=LK[2]=LK[3]=0;LK2[0]=LK2[1]=LK2[2]=LK2[3]=0;FLR.mul=1;
  if(FLR.n>=FLR.len) return;
  const t=FLR.n/FLR.len,env=Math.pow(1-t,1.5);
  const a=FLR.amp*env*(.3+.7*r())*(r()<.12?.15:1)*2.6;                // every frame gets a different dose; now and then one is nearly clean
  const near=FLR.flip?(FLR.far?a*.5*r():0):a,far=FLR.flip?a:(FLR.far?a*.5*r():0);
  LK[0]=near;LK[1]=FLR.y+(r()-.5)*.6;LK[2]=FLR.reach*(.45+.8*env)*(.7+.6*r());LK[3]=r()*200;
  LK2[0]=FLR.n<FLR.white?(3.2-FLR.n)*(.6+.4*r()):a*.05*r();LK2[1]=far;LK2[2]=r()<.5?a*.9*r():0;LK2[3]=r();
  FLR.mul=FLR.n===0?FLR.flash:FLR.n===1?1+(FLR.flash-1)*.3:FLR.n===2?1+(FLR.flash-1)*.08:1;
  FLR.n++;
}
function initGL(){
  if(!gl) return false;
  PR.prep=makeProg(FS_PREP);PR.mix=makeProg(FS_MIX);PR.blur=makeProg(FS_BLUR);PR.film=makeProg(FS_FILM);
  if(!PR.prep||!PR.blur||!PR.film) return false;          // the tape look is only built when it is first used
  PR.hot=makeProg(FS_HOT);PR.flare=makeProg(FS_FLARE);PR.lum=makeProg(FS_LUM);
  if(!PR.hot||!PR.flare||!PR.lum) LF.ok=false;             // no lens flare on this phone; everything else still works
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  srcTex=makeTex(false);noiseTex=makeNoise();grainTex=makeGrainTex();dustTex=makeDust();
  return true;
}

/* ---------- frame loop ---------- */
const video=$("srcVideo");
let srcAspect=.75;
const finder=$("finder"),picBox=$("pic");
let cvCss="";
function sizeCanvas(aspect){
  // Draw the picture at exactly the size it has on this screen, pixel for pixel, whenever that is a sensible video size.
  // A picture drawn at one size and then stretched a little to fit comes out soft, and grain is the first thing to suffer.
  // Otherwise (small windows, very large screens) draw it 1080 high as before and let the browser scale it.
  // The size on screen is kept to whole points and the canvas to whole points times the screen's pixel ratio: browsers only map 1:1 then.
  const dpr=window.devicePixelRatio||1,bw=finder.clientWidth,bh0=finder.clientHeight;
  if(bw<2||bh0<2) return;
  const a=S.format==="s8"?SHAPES[S.shape]:FORMATS[S.format].aspect,A=aspect>=1?a:1/a;
  const top=0,roomy=true,bh=bh0;                    // the top line and the shape choice float over the viewfinder; the picture gets all of it
  if(!recording){                                   // the size never changes in the middle of a shot
    let w=2*Math.floor(Math.min(bw,bh*A)/2),h=2*Math.round(w/A/2);
    while(h>bh&&w>4){w-=2;h=2*Math.round(w/A/2);}
    let W=Math.round(w*dpr),H=Math.round(h*dpr);
    W-=W%2;H-=H%2;
    const short=Math.min(W,H);
    if(short<840||short>1600){const long=Math.round(1080*a/2)*2;W=aspect>=1?long:1080;H=aspect>=1?1080:long;}
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  }
  const sc=Math.min(bw*dpr/cv.width,bh*dpr/cv.height),exact=sc>=1&&sc<1.02;
  const cw=exact?cv.width/dpr:cv.width*sc/dpr,ch=exact?cv.height/dpr:cv.height*sc/dpr;
  const side=window.matchMedia&&matchMedia("(orientation:landscape) and (max-height:540px)").matches;   // upright, the picture rests on the panels; sideways it sits in the middle
  const x=exact?Math.floor((bw-cw)/2):(bw-cw)/2,y=top+(side?(exact?Math.floor((bh-ch)/2):(bh-ch)/2):Math.floor(bh-ch));
  const css=cw+","+ch+","+x+","+y+","+roomy;
  if(css!==cvCss){
    cvCss=css;
    for(const el of [cv,picBox]){el.style.width=cw+"px";el.style.height=ch+"px";el.style.left=x+"px";el.style.top=y+"px";}
    const under=bh0-(y+ch);picBox.style.setProperty("--zb",(under<58?68-under:10)+"px");
    $("cam").classList.toggle("noline",under<92);                                        // the line of readings needs clear space under the picture     // where the shape keys lie over the picture, the zoom slider sits above them
  }
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
const dyn={glitch:0,trackY:1.2,breath:0};
let lastFrame=0,lastTick=0,zoomDir=0,frames=0,snapCb=null,frozen=false,freezeNext=false,dmgHook=null;   // frozen, dmgHook: testing only
const R=Math.random;
// One film frame is built in two steps. "Exposing" puts a camera picture into the small picture buffer; a second or third picture can be
// blended in, which is what smears movement the way a film shutter does. "Developing" then turns that buffer into the finished frame.
let FG=null;
const GRAIN=[{gs:1.15,k:.725},{gs:1.12,k:.80},{gs:.93,k:.0685,rho:.72,skew:.35,jit:.5}];   // tried side by side in Settings; [2] is the new one
const ROT=[[1,0,0,1],[0,1,-1,0],[-1,0,0,-1],[0,-1,1,0],[-1,0,0,1],[1,0,0,-1],[0,1,1,0],[0,-1,-1,0]].map(r=>new Float32Array(r));   // the grain is turned or flipped a different way each frame
// Second colour choice (Settings): colour tables made with spektrafilm by Andrea Volpato, CC BY-SA 4.0 (see luts.js). Black and white has no table.
const LUT={tex:{},asked:false};
function loadLuts(){
  if(LUT.asked||!glOK||typeof SF_LUT==="undefined") return;LUT.asked=true;
  for(const k in SF_LUT){
    const im=new Image();
    im.onload=()=>{
      const t=gl.createTexture();
      gl.activeTexture(gl.TEXTURE0+5);gl.bindTexture(gl.TEXTURE_2D,t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
      let ok=true;try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);}catch(e){ok=false;}
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.BROWSER_DEFAULT_WEBGL);
      if(!ok){LUT.failed=true;return;}
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      LUT.tex[k]=t;
    };
    im.onerror=()=>{LUT.failed=true;};
    im.src=SF_LUT[k];
  }
}
function lutFor(stock){            // the table for this film, or null: our own colour is used (choice is off, no table for this film, or not loaded yet)
  if(typeof SF_LUT==="undefined"||!SF_LUT[stock]||!(S.colour===1||FILM_STOCKS[stock].sf)) return null;
  if(!LUT.asked) loadLuts();
  return LUT.tex[stock]||null;
}
function beginFrame(aspect){
  sizeCanvas(aspect);
  const F=FORMATS[S.format],geo=pictureGeom(F);
  const pw=geo.a>=1?Math.round(F.pShort*geo.a):F.pShort,ph=geo.a>=1?F.pShort:Math.round(F.pShort/geo.a);
  target("P2",pw,ph);target("PB",pw,ph);
  FG={F,geo,pw,ph,Pt:target("P",pw,ph)};
}
function expose(src,share){
  // share = how much of the film frame this camera picture makes up: 1 = all of it, .5 = half, mixed with what is already there
  const mixIn=share<1&&PR.mix,to=mixIn?target("PB",FG.pw,FG.ph):FG.Pt,out=mixIn?target(FG.Pt===T.P?"P2":"P",FG.pw,FG.ph):null;
  bind(0,srcTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);}catch(e){return false;}
  const cz=cropZoom(),sw=src.videoWidth||src.naturalWidth||src.width||1920,sh=src.videoHeight||src.naturalHeight||src.height||1080;
  use(PR.prep,{uTex:{tex:0},uSrcA:srcAspect,uPicA:FG.geo.a,uZoom:cz,uMirror:mode==="live"&&S.facing==="user"?1:0,
    uClean:Math.min(1,Math.max(0,(cz-CLEAN.from)/CLEAN.span)),uCk:CLEAN.k,uPx:[(CLEAN.px0+CLEAN.pxk*(cz-1))/sw,(CLEAN.px0+CLEAN.pxk*(cz-1))/sh]});
  draw(to);
  if(mixIn){
    bind(0,FG.Pt.tex);bind(1,to.tex);
    use(PR.mix,{uA:{tex:0},uB:{tex:1},uShare:share});draw(out);
    FG.Pt=out;
  }
  return true;
}
function develop(now){
  const F=FG.F,geo=FG.geo,pw=FG.pw,ph=FG.ph,Pt=FG.Pt,f=FILTERS[S.filter][1],isVhs=S.format==="vhs";
  const off1=[R(),R()],off2=[R(),R()],seed=R()*10;
  if(isVhs){
    if(!PR.vhs) PR.vhs=makeProg(FS_VHS);
    if(!PR.vhs) return;
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
    const st=FILM_STOCKS[S.stock],lt=lutFor(S.stock);
    // pass 2: soften the picture (real small-gauge film is far softer than a phone)
    let Ps=Pt;                                         // the picture the film gets: straight from the camera, or through one of the old lenses
    if(S.lensLook){
      if(!PR.lens){PR.lens=makeProg(FS_LENS);PR.hot2=makeProg(FS_HOT2);}
      if(PR.lens&&PR.hot2){
        const PL=target("PL",pw,ph);                  // made before any texture is put on units 1 to 3: making one leaves it on the unit in use
        if(S.lensLook===2){
          const sw=Math.max(16,pw>>2),sh=Math.max(16,ph>>1),H=target("SH",sw,sh),S1=target("S1",sw,sh),S2=target("S2",sw,sh),S3=target("S3",sw,sh);
          bind(0,Pt.tex);use(PR.hot2,{uTex:{tex:0},uPx:[1/pw,1/ph]});draw(H);
          bind(0,H.tex);use(PR.blur,{uTex:{tex:0},uDir:[.025/1.75,0],uThr:0});draw(S1);
          bind(0,S1.tex);use(PR.blur,{uTex:{tex:0},uDir:[.07/1.75,0],uThr:0});draw(S2);
          bind(0,S2.tex);use(PR.blur,{uTex:{tex:0},uDir:[.19/1.75,0],uThr:0});draw(S3);
          bind(1,S1.tex);bind(2,S2.tex);bind(3,S3.tex);
        }else{bind(1,noiseTex);bind(2,noiseTex);bind(3,noiseTex);}
        bind(0,Pt.tex);use(PR.lens,{uTex:{tex:0},uS1:{tex:1},uS2:{tex:2},uS3:{tex:3},uLm:S.lensLook,uAmt:S.lensLook===1?LENSLOOK.swirl:LENSLOOK.ana,uAsp:pw/ph,uStreak:S.lensLook===2?LENSLOOK.streak:0});draw(PL);
        Ps=PL;
      }
    }
    const starOn=S.star&&S.starAmt>0;
    if(S.diffAmt>0||starOn){
      if(!PR.fx){PR.fx=makeProg(FS_FX);if(!PR.hot2) PR.hot2=makeProg(FS_HOT2);}
      if(PR.fx&&PR.hot2){
        const PX=target("PX",pw,ph),dw=Math.max(16,pw>>2),dh=Math.max(16,ph>>2),DA=target("DA",dw,dh),DB=target("DB",dw,dh),
          sw=Math.max(16,pw>>1),sh=Math.max(16,ph>>1),HS=target("HS",sw,sh),R1=target("R1",sw,sh),R2=target("R2",sw,sh),R3=target("R3",sw,sh),RA=target("RA",sw,sh);
        if(S.diffAmt>0){                               // a wide, soft copy of the picture
          bind(0,Ps.tex);use(PR.blur,{uTex:{tex:0},uDir:[.0055,0],uThr:0});draw(DA);
          bind(0,DA.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,.0055*pw/ph],uThr:0});draw(DB);
          bind(0,DB.tex);use(PR.blur,{uTex:{tex:0},uDir:[.016,0],uThr:0});draw(DA);
          bind(0,DA.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,.016*pw/ph],uThr:0});draw(DB);
        }
        if(starOn){
          bind(0,Ps.tex);use(PR.hot2,{uTex:{tex:0},uPx:[1/pw,1/ph]});draw(HS);
          gl.bindFramebuffer(gl.FRAMEBUFFER,RA.fb);gl.viewport(0,0,sw,sh);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
          for(const a of FX.ang[S.star]){
            const dx=Math.cos(a),dy=Math.sin(a)*pw/ph,L=FX.len;
            bind(0,HS.tex);use(PR.blur,{uTex:{tex:0},uDir:[dx*L[0],dy*L[0]],uThr:0});draw(R1);
            bind(0,R1.tex);use(PR.blur,{uTex:{tex:0},uDir:[dx*L[1],dy*L[1]],uThr:0});draw(R2);
            bind(0,R2.tex);use(PR.blur,{uTex:{tex:0},uDir:[dx*L[2],dy*L[2]],uThr:0});draw(R3);
            gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
            use(PR.blur,{uTex:{tex:0},uDir:[0,0],uThr:0});
            bind(0,R1.tex);draw(RA);bind(0,R2.tex);draw(RA);bind(0,R3.tex);draw(RA);
            gl.disable(gl.BLEND);
          }
        }
        bind(1,S.diffAmt>0?DB.tex:noiseTex);bind(2,starOn?RA.tex:noiseTex);bind(3,starOn?HS.tex:noiseTex);
        bind(0,Ps.tex);use(PR.fx,{uTex:{tex:0},uDiff:{tex:1},uRays:{tex:2},uHot:{tex:3},uDf:S.diffAmt,uSt:starOn?S.starAmt*FX.gain/3:0});draw(PX);
        Ps=PX;
      }
    }
    const T1=target("T1",pw,ph),PB=target("PB",pw,ph),so=F.soft*pw/600;
    bind(0,Ps.tex);use(PR.blur,{uTex:{tex:0},uDir:[so/pw,0],uThr:0});draw(T1);
    bind(0,T1.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,so/ph],uThr:0});draw(PB);
    // pass 3: glow from the bright parts only (red fringe on bright edges)
    const gw=Math.max(16,pw>>1),gh=Math.max(16,ph>>1),A=target("GA",gw,gh),B=target("GB",gw,gh),hs=F.halo*gw/300;
    bind(0,Ps.tex);use(PR.blur,{uTex:{tex:0},uDir:[hs/gw,0],uThr:.38});draw(A);
    bind(0,A.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,hs/gh],uThr:0});draw(B);
    // pass 4: lens flare from the lamps and the sun in the picture
    const hasFl=S.lens&&LF.ok&&lensFlarePass(Ps,pw,ph,F.pShort);
    // film movement, flare and damage that carry from frame to frame
    dyn.breath+=(R()-.5)*.006;dyn.breath*=.94;
    rollDamage(F.dmg*S.dmgAmt);rollFilmFlare();
    if(dmgHook) dmgHook(SCRP,SCRQ,DUSTP,DUSTQ);
    const wv=F.weave*S.weaveAmt;
    bind(0,PB.tex);bind(1,B.tex);bind(2,noiseTex);bind(3,dustTex);bind(4,hasFl?T.FL.tex:noiseTex);bind(5,lt||noiseTex);bind(6,grainTex);const GM=GRAIN[S.grain]||GRAIN[2],gpx=Math.min(cv.width,cv.height)/1080;
    const U={uP:{tex:0},uGlow:{tex:1},uNoise:{tex:2},uDustTex:{tex:3},uFlare:{tex:4},uFl:hasFl?1:0,uLk:FLR.LK,uLk2:FLR.LK2,uLkWb:lt?f:st.wb,uFlash:FLR.mul,uLut:{tex:5},uLutOn:lt?1:0,uGrainTex:{tex:6},uGm:S.grain,uGk:GM.k,uGrho:GM.rho||1,uGskew:GM.skew||0,uGrot:ROT[(R()*8)|0],uJit:[(GM.jit||0)*st.grain*F.grainMul*10.64*gpx/cv.width,(GM.jit||0)*st.grain*F.grainMul*10.64*gpx/cv.height],
      uDp:DUSTP,uDq:DUSTQ,uSc:SCRP,uSd:SCRQ,uDsz:F.dsz,uOut:[cv.width,cv.height],
      uWeave:[((R()-.5)*.0012+Math.sin(now/1100)*.0006)*wv,((R()-.5)*.0014+Math.sin(now/700)*.0008)*wv],
      uOff1:off1,uOff2:off2,uWb:lt?f:[st.wb[0]*f[0],st.wb[1]*f[1],st.wb[2]*f[2]],uBlack:st.black,uWhite:st.white,
      uSeed:seed,uEv:S.ev,uSat:st.sat,uK:st.k,uGain:st.gain,uOff:st.off,uGam:st.gam,uSh:st.sh,uKc:st.kc,uHd:st.hd,uTone:st.tone||TONE0,uVexp:F.vexp,uGrain:st.grain*F.grainMul*S.grainAmt,uGs:GM.gs*gpx,
      uHal:st.hal*LOOK.hal*S.halAmt,uBloom:st.bloom*LOOK.bloom*S.bloomAmt*(S.lensLook===1?LENSLOOK.bloom:1),uLift:st.bw?LOOK.lift*.6:LOOK.lift,uBw:st.bw,uFlicker:1+((R()-.5)*.03+dyn.breath)*(S.format==="s16"?.45:1)*S.breathAmt,
      uOver:S.overscan?1:0,uSide:S.overscan?S.side:0,uFmt:S.format==="s16"?1:0,uVig:Math.min(.98,F.vig*S.vigAmt),uCa:F.ca,uCorner:F.corner,
      uT:geo.t,uE:geo.e};
    // The small previews are drawn first. Reading them back makes the page wait for the graphics chip, and at this point it has only small jobs queued.
    if(liveThumbs(U,PB,pw,ph,f)){bind(0,PB.tex);bind(5,lt||noiseTex);bind(6,grainTex);}
    use(PR.film,U);draw(null);
  }
  frames++;MV.lastRender=now;
  if(frames===3) $("cam").classList.add("ready");   // the first pictures are in: let the viewfinder fade up
  if(MV.log) MV.log.push([now,MV.locked?MV.parts:1,MV.locked?1:0]);
  if(recording&&recTrack) recTrack.requestFrame();
  if(snapCb){const f=snapCb;snapCb=null;if(freezeNext){frozen=true;freezeNext=false;}f(cv.toDataURL("image/png"));}
}
/* ---------- live film previews and the histogram ---------- */
// About five times a second the picture is drawn once more, small and without grain or marks, through each film in the strip.
// The results are read back and painted into the strip. The one for the film in the camera also feeds the histogram.
// While recording only that one is drawn: the film cannot be changed then, and the phone has better things to do.
const NO_PREVIEWS=/[?&]previews=0(&|$)/.test(location.search);   // test only: no live previews and no histogram, to see what they cost a phone
const TH={gap:170,cost:0,last:0,tw:0,th:0,px:null,img:null,zero4:new Float32Array(4),zeroD:new Float32Array(16),zeroS:new Float32Array(24),bins:new Uint32Array(64),drawn:0};
function stockLook(name,f){                          // the settings that belong to one film
  const st=FILM_STOCKS[name],lt=lutFor(name);
  return {lt,u:{uLutOn:lt?1:0,uWb:lt?f:[st.wb[0]*f[0],st.wb[1]*f[1],st.wb[2]*f[2]],uLkWb:lt?f:st.wb,uBlack:st.black,uWhite:st.white,
    uSat:st.sat,uK:st.k,uGain:st.gain,uOff:st.off,uGam:st.gam,uSh:st.sh,uKc:st.kc,uHd:st.hd,uTone:st.tone||TONE0,uHal:st.hal*LOOK.hal*S.halAmt,uBloom:st.bloom*LOOK.bloom*S.bloomAmt,uLift:st.bw?LOOK.lift*.6:LOOK.lift,uBw:st.bw}};
}
function sizeStrip(){
  const a=SHAPES[S.shape],port=srcAspect<1,room=Math.max(60,(($("mainBoard").offsetHeight||$("filmSheet").offsetHeight||168)-34)-28);   // what the films board leaves for a picture
  const h=port?Math.min(room,Math.round(84*a)):Math.min(room,84),w=port?Math.round(h/a):Math.round(h*a);
  let changed=false;
  for(const b of $("strip").children){const c=b.firstElementChild;if(c.style.width!==w+"px"||c.style.height!==h+"px"){c.style.width=w+"px";c.style.height=h+"px";changed=true;}}
  if(changed) showFilmInStrip(false);                // new sizes: the old place in the strip no longer fits
}
function drawHistogram(d,burnt){
  const B=TH.rgb||(TH.rgb=[new Float32Array(64),new Float32Array(64),new Float32Array(64)]);for(const b of B) b.fill(0);
  for(let i=0;i<d.length;i+=8){B[0][d[i]>>2]++;B[1][d[i+1]>>2]++;B[2][d[i+2]>>2]++;}      // every second point, in 64 steps for each colour
  let mx=1;for(const b of B) for(let k=3;k<61;k++) if(b[k]>mx) mx=b[k];                      // the two ends are left out of the scaling: one tall end must not flatten the rest
  const c=$("histo"),x=c._x||(c._x=c.getContext("2d")),W=c.width,H=c.height,top=H*.14;
  x.clearRect(0,0,W,H);
  const col=["rgba(205,62,38,.72)","rgba(38,196,58,.62)","rgba(36,140,214,.66)"];
  for(const ch of [0,2,1]){
    const b=B[ch];x.beginPath();x.moveTo(0,H);
    for(let k=0;k<64;k++){const v=(b[Math.max(0,k-1)]+2*b[k]+b[Math.min(63,k+1)])/4,y=H-Math.min(1,Math.sqrt(v/mx))*(H-top);x.lineTo((k+.5)/64*W,y);}
    x.lineTo(W,H);x.closePath();x.fillStyle=col[ch];x.fill();
  }
  c.dataset.burnt=burnt?"1":"0";
}
function liveThumbs(U,PB,pw,ph,f){
  const strip=$("strip"),list=FORMATS[S.format].stocks;
  const open=!$("filmSheet").hidden;               // all films are drawn only while the Films sheet is open; one, for the histogram, only if that is switched on
  if(NO_PREVIEWS||(!open&&!S.histo&&!recording)||strip.children.length!==list.length||frozen) return false;
  const t=performance.now();if(t-TH.last<(open?TH.gap:Math.max(TH.gap,300))) return false;   // sheet closed: only the film in use is drawn, a little less often, for the light graph and the face of the roll key
  TH.last=t;
  const sa=SHAPES[S.shape],port=srcAspect<1,tw=port?104:Math.floor(90*sa),th=port?Math.floor(104*sa):90;
  if(tw!==TH.tw||th!==TH.th){
    TH.tw=tw;TH.th=th;TH.px=new Uint8Array(tw*th*4*(list.length+1));TH.img=new ImageData(tw,th);
    for(const b of strip.children){const c=b.firstElementChild;c.width=tw;c.height=th;}
    sizeStrip();
  }
  const TA=target("TA",tw,ph),TS=target("TS",tw,th),AT=target("TH",tw*(list.length+1),th);
  bind(6,grainTex);                                  // making a new target leaves it attached where the grain texture was: put the grain back
  bind(0,PB.tex);use(PR.blur,{uTex:{tex:0},uDir:[1.25/pw,0],uThr:0});draw(TA);     // a small, smoothed copy of the picture to draw the previews from
  bind(0,TA.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,1.25/ph],uThr:0});draw(TS);
  // side by side in one small sheet: the films (all of them, or only the one in use while recording), then the picture as the camera gave it
  const one=recording||!open,i0=one?list.indexOf(S.stock):0,n=one?1:list.length;
  gl.bindFramebuffer(gl.FRAMEBUFFER,AT.fb);
  for(let k=0;k<n;k++){
    const L=stockLook(list[i0+k],f);
    bind(0,TS.tex);bind(5,L.lt||noiseTex);
    use(PR.film,Object.assign({},U,L.u,{uGrain:0,uJit:[0,0],uWeave:[0,0],uOver:0,uSide:0,uFl:0,uLk:TH.zero4,uLk2:TH.zero4,uFlash:1,uFlicker:1,
      uDp:TH.zeroD,uDq:TH.zeroD,uSc:TH.zeroS,uSd:TH.zeroS}));
    gl.viewport((i0+k)*tw,0,tw,th);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  bind(0,TS.tex);use(PR.blur,{uTex:{tex:0},uDir:[0,0],uThr:0});
  gl.viewport((i0+n)*tw,0,tw,th);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  const wide=(n+1)*tw,px=TH.px;
  gl.readPixels(i0*tw,0,wide,th,gl.RGBA,gl.UNSIGNED_BYTE,px);
  // Burnt out: more than a fiftieth of the picture is at the top of what the camera can record, or is pushed there by the exposure setting.
  // (Brightness of all three colours together: a clear blue sky has its blue at the top and is not burnt out.)
  const top=Math.min(250,250*Math.pow(2,-S.ev/2.2))*256;let hot=0;
  for(let y=0;y<th;y+=2){const o=(y*wide+n*tw)*4;for(let x=0;x<tw;x+=2){const q=o+x*4;if(px[q]*77+px[q+1]*150+px[q+2]*29>=top) hot++;}}
  const burnt=hot>(tw>>1)*(th>>1)*.02;
  const d=TH.img.data,row=tw*4;
  for(let k=0;k<n;k++){
    for(let y=0;y<th;y++){const src=((th-1-y)*wide+k*tw)*4;d.set(px.subarray(src,src+row),y*row);}   // turned over: the graphics chip counts rows from the bottom
    const c=strip.children[i0+k].firstElementChild;(c._x||(c._x=c.getContext("2d"))).putImageData(TH.img,0,0);
    if(list[i0+k]===S.stock&&S.histo) drawHistogram(d,burnt);
  }
  TH.drawn++;
  // If drawing and reading the previews takes this phone long, they are refreshed less often, so the picture itself stays smooth.
  TH.cost=TH.cost*.8+(performance.now()-t)*.2;TH.gap=TH.cost>9?420:TH.cost>4.5?260:170;
  return true;
}
function posterNow(){                                // a small picture of what the camera sees now, taken from the strip: used as the face of the Clips button
  try{const b=[...$("strip").children].find(b=>b.dataset.v===S.stock);return b&&TH.drawn?b.firstElementChild.toDataURL("image/jpeg",.85):"";}catch(e){return "";}
}
function tick(now){requestAnimationFrame(tick);if(!MV.manual) step(now);}
/* ---------- the two sliders on the picture ---------- */
// zoomGoal is where the zoom slider was put; the zoom glides there instead of jumping (a real zoom ring has weight).
let zoomGoal=null,fadeSeen="";
const RUL=[["starAmt","star strength",2,1],["diffAmt","diffusion",1,0],["bloomAmt","bloom",2,1],["halAmt","halation",1,1],["grainAmt","grain",1,1],["vigAmt","dark corners",2,1],["breathAmt","flicker",2,1],["weaveAmt","wobble",2,1],["dmgAmt","dust",2,1],["filter","colour filter",8,4]];
function syncRulers(){
  for(const [k,nm,max] of RUL){
    const el=$("r_"+k);if(!el) continue;const v=S[k],val=el.querySelector(".val");
    el.querySelector(".fk").style.top=((1-v/max)*100)+"%";
    if(k==="filter"){val.textContent=FILTERS[v][0];val.classList.add("w");el.setAttribute("aria-valuetext",FILTERS[v][0]);el.classList.toggle("zero",v===4);}
    else{val.textContent=String(Math.round(v*100));el.setAttribute("aria-valuenow",Math.round(v*100));el.classList.toggle("zero",v===0);}
  }
  paintLooks();
}
function buildRulers(){
  const box=$("rulers");
  for(const [k,nm,max,def] of RUL){
    const el=document.createElement("div");el.className="pn lp fader v";el.id="r_"+k;el.tabIndex=0;el.setAttribute("role","slider");
    el.setAttribute("aria-label",nm+". Slide up for more, down for less. Tap twice to put it back");
    if(k!=="filter"){el.setAttribute("aria-valuemin",0);el.setAttribute("aria-valuemax",max*100);}
    el.innerHTML='<b class="num val"></b><i class="ft"></i><b class="fk"></b><span class="nm">'+nm+'</span>';
    box.appendChild(el);
    const set=v=>{if(v===S[k]) return;S[k]=v;if(k==="filter"){$("filterRange").value=v;$("filterOut").textContent=FILTERS[v][0];}remember();syncRulers();};
    fader(el,true,()=>S[k]/max,f=>set(k==="filter"?Math.round(f*max):Math.round(f*max*20)/20),()=>set(def));
    el.addEventListener("keydown",e=>{const d=e.key==="ArrowUp"||e.key==="ArrowRight"?1:e.key==="ArrowDown"||e.key==="ArrowLeft"?-1:0;if(!d) return;e.preventDefault();e.stopPropagation();
      set(k==="filter"?Math.max(0,Math.min(max,S[k]+d)):Math.max(0,Math.min(max,Math.round((S[k]+d*.05)*20)/20)));});
  }
  syncRulers();
}
/* ---------- saved looks: film, lens look, star filter and every ruler, kept under a number ---------- */
let LOOKS=[];
const LOOKKEYS=["lensLook","star"].concat(RUL.map(r=>r[0]));
function lookOk(l){
  if(!l||!FORMATS.s8.stocks.includes(l.stock)||![0,1,2].includes(l.lensLook)||![0,4,6].includes(l.star)) return false;
  for(const [k,nm,max] of RUL) if(!(typeof l[k]==="number"&&l[k]>=0&&l[k]<=max)||(k==="filter"&&l[k]!==Math.round(l[k]))) return false;
  return true;
}
try{LOOKS=JSON.parse(localStorage.getItem("reel8looks")||"[]").filter(lookOk).slice(0,6);}catch(e){LOOKS=[];}
function keepLooks(){try{localStorage.setItem("reel8looks",JSON.stringify(LOOKS));}catch(e){}}
function lookNow(){const o={stock:S.stock};for(const k of LOOKKEYS) o[k]=S[k];return o;}
function sameLook(l){if(l.stock!==S.stock) return false;for(const k of LOOKKEYS) if(l[k]!==S[k]) return false;return true;}
function useLook(i){
  const l=LOOKS[i];if(!l) return;
  if(recording&&l.stock!==S.stock){toast("Stop recording to change film.");return;}
  if(S.format!=="s8") return;
  const film=l.stock!==S.stock;S.stockBy.s8=l.stock;for(const k of LOOKKEYS) S[k]=l[k];
  $("filterRange").value=S.filter;remember();paint();if(film) dip();toast("Look "+(i+1)+".",1200);
}
function paintLooks(){
  const box=$("looks");if(!box) return;
  if(box.children.length!==LOOKS.length+1){
    box.textContent="";
    const sv=document.createElement("button");sv.className="pn lp sw";sv.id="lookSave";sv.setAttribute("aria-label","Save this look: the film, the lens look, the star filter and every ruler as they are now");
    sv.innerHTML='<b>+</b><span class="nm">save this look</span>';
    sv.onclick=()=>{
      if(LOOKS.some(sameLook)){toast("This look is already saved.");return;}
      if(LOOKS.length>=6){toast("Six looks are saved. Remove one to save another.");return;}
      LOOKS.push(lookNow());keepLooks();paintLooks();toast("Saved as look "+LOOKS.length+".");
    };
    box.appendChild(sv);
    LOOKS.forEach((l,i)=>{
      const d=document.createElement("div");d.className="pn lp lk";d.dataset.i=i;
      d.innerHTML='<button class="go" aria-label="Use look '+(i+1)+'"><b>'+(i+1)+'</b><span class="nm"></span></button><button class="del" aria-label="Remove look '+(i+1)+'">&times;</button>';
      d.querySelector(".go").onclick=()=>useLook(i);
      d.querySelector(".del").onclick=()=>{LOOKS.splice(i,1);keepLooks();paintLooks();toast("Look removed.",1200);};
      box.appendChild(d);
    });
  }
  LOOKS.forEach((l,i)=>{
    const d=box.children[i+1];d.setAttribute("aria-pressed",sameLook(l));
    d.querySelector(".nm").textContent=nameOf(l.stock)+(l.lensLook?" · "+LENSLOOK.names[l.lensLook].toLowerCase():"")+(l.star?" · star":"");
  });
}
function syncFaders(){
  const k=S.ev+"|"+S.zoom.toFixed(3)+"|"+(CZ.ok?1:0)+mode;if(k===fadeSeen) return;fadeSeen=k;
  $("zoomHow").textContent=mode!=="live"?"":CZ.ok?"phone zoom":S.zoom>1.02?"enlarged":"";
  $("briKnob").style.top=((3-S.ev)/6*100)+"%";$("briSl").setAttribute("aria-valuenow",S.ev);
  $("zoomGrip").style.left=((S.zoom-1)/3*100)+"%";const zk=$("zoomKnob");zk.textContent=(Math.abs(S.zoom-Math.round(S.zoom))<.05?Math.round(S.zoom):S.zoom.toFixed(1))+"x";$("zoomSl").setAttribute("aria-valuenow",+S.zoom.toFixed(1));
}
function showEvFigure(){$("evRead").textContent=(S.ev<0?"−":"+")+Math.abs(S.ev).toFixed(1);}
function fader(el,vert,get,put,home){
  const track=el.querySelector(".ft"),knob=el.querySelector(".fk");
  knob.parentNode.removeChild(knob);track.appendChild(knob);          // the mark rides on the scale, so its place is a share of the scale's length
  let held=null,last=0;
  el.addEventListener("pointerdown",e=>{
    if(e.button>0||(e.target.closest&&e.target.closest("#evRead"))) return;e.preventDefault();
    const now=performance.now();if(now-last<400){last=0;home();syncFaders();return;}last=now;
    held={x:e.clientX,y:e.clientY,f:get()};el.classList.add("held");try{el.setPointerCapture(e.pointerId);}catch(x){}});
  el.addEventListener("pointermove",e=>{
    if(!held) return;const r=track.getBoundingClientRect();
    put(Math.max(0,Math.min(1,held.f+(vert?(held.y-e.clientY)/r.height:(e.clientX-held.x)/r.width))));syncFaders();});
  const up=()=>{if(!held) return;held=null;el.classList.remove("held");paint();};
  el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);
}
fader($("briSl"),true,()=>(S.ev+3)/6,f=>{let v=Math.round((f*6-3)*10)/10;if(Math.abs(v)<.15) v=0;if(v!==S.ev){S.ev=v;showEvFigure();}},()=>{S.ev=0;paint();});      // a small notch at normal
fader($("zoomSl"),false,()=>((zoomGoal==null?S.zoom:zoomGoal)-1)/3,f=>{let z=1+f*3;const n=Math.round(z);if(Math.abs(z-n)<.07) z=n;zoomGoal=z;$("zoomRead").classList.remove("off");clearTimeout(fader.t);fader.t=setTimeout(()=>{if(!zoomDir)$("zoomRead").classList.add("off");},1100);},
  ()=>{zoomGoal=1;});
$("briSl").addEventListener("keydown",e=>{const d=e.key==="ArrowUp"||e.key==="ArrowRight"?.1:e.key==="ArrowDown"||e.key==="ArrowLeft"?-.1:0;if(d){e.preventDefault();S.ev=Math.max(-3,Math.min(3,Math.round((S.ev+d)*10)/10))||0;paint();}});
$("zoomSl").addEventListener("keydown",e=>{const d=e.key==="ArrowUp"||e.key==="ArrowRight"?.1:e.key==="ArrowDown"||e.key==="ArrowLeft"?-.1:0;if(d){e.preventDefault();zoomGoal=Math.max(1,Math.min(4,(zoomGoal==null?S.zoom:zoomGoal)+d));}});
function step(now){
  const dt=Math.min(.1,(now-lastTick)/1000);lastTick=now;
  if(zoomGoal!=null){
    if(zoomDir||Math.abs(zoomGoal-S.zoom)<.004){if(!zoomDir) S.zoom=zoomGoal;zoomGoal=null;}
    else S.zoom+=(zoomGoal-S.zoom)*(1-Math.exp(-dt*9));
    $("zoomRead").textContent=S.zoom.toFixed(1)+"×";
  }
  syncFaders();
  if(zoomDir){
    S.zoom=Math.min(4,Math.max(1,S.zoom*Math.exp(zoomDir*S.zoomSpeed*.9*dt)));
    $("zoomRead").textContent=S.zoom.toFixed(1)+"×";
  }
  pushCamZoom();
  const iv=1000/S.fps;
  if(MV.locked){                                     // the camera's own pictures are driving the film; this loop only stands guard
    if(mode==="live"&&now-MV.lastRender<iv*3.2) return;
    mvUnlock(now);                                   // the camera stopped delivering in step: go back to the plain way at once
  }
  if(now-lastFrame<iv-1) return;
  lastFrame=(now-lastFrame>iv*2)?now:lastFrame+iv;   // keeps the true frame rate on a 60 Hz screen
  if(!glOK||frozen) return;
  let src=null;
  if(mode==="test"){drawTest(now/1000);src=testCv;srcAspect=.75;}
  else if(mode==="still"&&stillEl){src=stillEl;srcAspect=stillEl.naturalWidth/stillEl.naturalHeight;}
  else if(video.readyState>=2&&video.videoWidth){src=video;srcAspect=video.videoWidth/video.videoHeight;}
  if(!src) return;
  beginFrame(srcAspect);
  if(!expose(src,1)) return;
  develop(now);snapIfWanted();
}

/* ---------- movement: film frames in step with the camera, and a slight smear ---------- */
// A real Super 8 camera exposes 18 frames a second, evenly, and each frame stays open for roughly a thirtieth to a fortieth of a second,
// so things that move smear a little. A phone camera runs at its own speed and freezes each picture sharply.
// So the camera is asked to run about three times as fast as the film. The camera's pictures are then counted off into groups, one group
// for each film frame (three each at 54 a second; 4, 3, 3 at 60). The first pictures of a group are mixed together: that is the time the
// shutter is open. The rest are skipped: the shutter is closed. Because film frames follow the camera's own count, the rhythm is even.
// If the camera's speed does not fit (30 a second into 18 frames), or the browser cannot report the camera's pictures, everything works
// as it did before: the film simply takes the newest camera picture 18 times a second.
const NOMINAL=[15,18,20,24,25,30,36,48,50,54,60,72,90,96,100,108,120];
const MV={ok:!!video.requestVideoFrameCallback,locked:false,A:0,B:0,rate:0,nom:0,base:0,count:0,curF:-1,parts:0,wsum:0,done:true,
  lastRender:0,good:0,bad:0,samples:[],manual:false,log:null,t0:0};
function camRateFor(fps){return {9:54,12:60,18:54,24:48}[fps]||(fps*3<=60?fps*3:fps*2);}   // a whole number of camera pictures for each film frame
function nominalRate(r){let best=0;for(const n of NOMINAL) if(Math.abs(r-n)<Math.abs(r-best)) best=n;return best&&Math.abs(r-best)<=best*.035?best:0;}
function rateFits(nom,fps){return nom>0&&(nom===fps||nom>=fps*1.9);}
function groupStart(F,A,B){return Math.ceil(F*A/B);}                         // first camera picture of film frame F
function shutterWeight(k,g){const m=Math.max(1,Math.round(g*.55));return k<m?1:(g===2&&k===1?.6:0);}   // picture k of a group of g: 0 = shutter closed
function mvUnlock(now){MV.locked=false;MV.good=0;MV.bad=0;MV.curF=-1;MV.done=true;lastFrame=now||performance.now();paintStatus();}
function mvReset(now){MV.t0=performance.now();MV.count=0;MV.samples.length=0;MV.rate=0;MV.nom=0;MV.good=0;MV.bad=0;if(MV.locked) mvUnlock(now);else paintStatus();}
function askCamRate(){
  const tr=liveStream&&liveStream.getVideoTracks()[0];if(!tr||!tr.applyConstraints) return;
  tr.applyConstraints({width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:S.move?camRateFor(S.fps):30}}).catch(()=>{});
}
function onVideoFrame(now,meta){video.requestVideoFrameCallback(onVideoFrame);if(!MV.manual) camFrame(now,meta);}
function camFrame(now,meta){
  if(mode!=="live"||!glOK||!S.move){if(MV.locked) mvUnlock(now);return;}
  // 1. how fast is the camera really running? (counted over the last second and a half)
  MV.count++;
  const pf=meta&&typeof meta.presentedFrames==="number"?meta.presentedFrames:MV.count,sm=MV.samples;
  sm.push(now,pf);
  while(sm.length>4&&now-sm[0]>1500) sm.splice(0,2);
  let dt=0,dn=0;for(let j=2;j<sm.length;j+=2){const d=sm[j]-sm[j-2];if(d>0&&d<100){dt+=d;dn+=sm[j+1]-sm[j-1];}}
  if(sm.length>=24&&dt>600) MV.rate=dn/(dt/1000);
  const nom=nominalRate(MV.rate);
  // 2. does that speed fit the film speed? It must hold steady for a moment before the film follows it.
  if(!MV.locked){
    MV.good=rateFits(nom,S.fps)&&nom===MV.nom?MV.good+1:0;MV.nom=nom;
    if(MV.good<12||frozen){if(MV.good===0&&(MV.count&31)===0) paintStatus();return;}
    MV.locked=true;MV.A=nom;MV.B=S.fps;MV.base=pf;MV.curF=-1;MV.done=true;MV.bad=0;MV.lastRender=now;paintStatus();
  }else{
    MV.bad=nom===MV.A?0:MV.bad+1;
    if(MV.bad>=30||S.fps!==MV.B){mvUnlock(now);return;}
  }
  if(frozen) return;
  // 3. which film frame does this camera picture belong to, and which place has it in its group?
  const i=pf-MV.base,Fn=Math.floor(i*MV.B/MV.A),s0=groupStart(Fn,MV.A,MV.B),g=groupStart(Fn+1,MV.A,MV.B)-s0,k=i-s0;
  if(Fn!==MV.curF){MV.curF=Fn;MV.parts=0;MV.wsum=0;MV.done=false;}
  if(MV.done) return;
  let last=0;for(let j=g-1;j>0;j--) if(shutterWeight(j,g)>0){last=j;break;}   // the last picture the shutter is open for
  const w=shutterWeight(k,g),wk=w>0?w:(MV.parts===0?1:0);                    // if the open ones were all missed, use this one rather than none
  if(wk>0&&video.readyState>=2&&video.videoWidth){
    srcAspect=video.videoWidth/video.videoHeight;
    if(MV.parts===0) beginFrame(srcAspect);
    if(expose(video,wk/(MV.wsum+wk))){MV.parts++;MV.wsum+=wk;}
  }
  if(k>=last&&MV.parts>0){MV.done=true;develop(now);snapIfWanted();}
}
if(MV.ok) video.requestVideoFrameCallback(onVideoFrame);

/* ---------- zoom ---------- */
// Zoom uses the phone's own zoom wherever the browser offers it: the camera then looks closer with its real lenses and its whole sensor,
// so the picture stays sharp. Whatever the phone cannot do (no zoom offered, or past its limit) is done by enlarging the middle of the
// picture, as before. The phone's zoom is counted from where the camera stood when it opened ("home"), which on some phones is not 1.
// Adding ?camzoom=0 to the address turns the phone's zoom off, for comparing.
const CAMZOOM=!/[?&]camzoom=0(&|$)/.test(location.search);
const CZ={ok:false,min:1,max:1,home:1,sent:1,busy:false};
function initCamZoom(){
  CZ.ok=false;CZ.home=1;CZ.sent=1;CZ.busy=false;
  if(CAMZOOM) try{
    const tr=liveStream&&liveStream.getVideoTracks()[0],c=tr&&tr.getCapabilities?tr.getCapabilities():null;
    if(c&&c.zoom&&c.zoom.max>0){
      const st=tr.getSettings?tr.getSettings():{},min=c.zoom.min>0?c.zoom.min:1;
      const home=st.zoom>0?st.zoom:min;
      if(c.zoom.max/home>=1.5){CZ.ok=true;CZ.min=min;CZ.max=c.zoom.max;CZ.home=home;CZ.sent=home;}
    }
  }catch(e){}
  paintStatus();
}
function cropZoom(){                                   // how much the picture itself still has to be enlarged
  if(mode!=="live") return S.zoom;
  return Math.max(1,S.zoom/(CZ.sent/CZ.home));          // if the phone's zoom failed part-way it stays where it was, and this makes up the rest
}
function pushCamZoom(){
  if(!CZ.ok||mode!=="live"||CZ.busy) return;
  const want=Math.min(CZ.max,Math.max(CZ.home,CZ.home*S.zoom));
  if(Math.abs(want-CZ.sent)<.012*CZ.home) return;
  const tr=liveStream&&liveStream.getVideoTracks()[0];if(!tr) return;
  CZ.busy=true;
  tr.applyConstraints({advanced:[{zoom:want}]}).then(()=>{CZ.sent=want;CZ.busy=false;},()=>{CZ.ok=false;CZ.busy=false;paintStatus();});
}
function paintStatus(){
  const el=$("camStatus");if(!el) return;
  let a;
  if(!S.move) a="Film movement is switched off.";
  else if(mode!=="live") a="Film movement works with the live camera only.";
  else if(MV.locked){
    const g=Math.round(MV.A/MV.B),m=Math.max(1,Math.round(g*.55));
    a="Film movement: in step with the camera ("+MV.A+" pictures a second). "+(MV.A===MV.B?"One camera picture for each film frame.":"Each film frame is a mix of "+(g===2?2:m)+" camera pictures.");
  }
  else if(!MV.ok||(MV.count===0&&performance.now()-MV.t0>4000)) a="Film movement: not in step. This browser does not report the camera's pictures, so it works the plain way.";
  else if(MV.rate>0) a="Film movement: not in step. The camera gives about "+Math.round(MV.rate)+" pictures a second, which does not fit "+S.fps+" film frames, so it works the plain way.";
  else a="Film movement: measuring the camera.";
  if(mode==="live") a+=CZ.ok?" Zoom: the phone's own zoom, so it stays sharp.":" Zoom: enlarging the picture"+(CAMZOOM?" (this browser does not offer the phone's own zoom).":" (the phone's own zoom is switched off).");
  if(el.textContent!==a) el.textContent=a;
}

/* ---------- sources ---------- */
let liveStream=null,clipUrl=null;
function stopLive(){if(liveStream){liveStream.getTracks().forEach(t=>t.stop());liveStream=null;}CZ.ok=false;S.light=false;if(MV.locked) mvUnlock();}
// The phone's screen must not dim or lock while you are framing a shot. Asked again whenever the page comes back to the front.
let wakeLock=null;
async function keepAwake(){
  try{
    if(!navigator.wakeLock||wakeLock||document.visibilityState!=="visible") return;
    wakeLock=await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release",()=>{wakeLock=null;});
  }catch(e){wakeLock=null;}
}
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"){keepAwake();reviveCamera();return;}
  if(S.light){                                       // leaving the page: the lamp must not stay on unseen, and the key must not go on saying "on" when the phone has put it out
    const tr=liveStream&&liveStream.getVideoTracks()[0];
    try{if(tr) tr.applyConstraints({advanced:[{torch:false}]}).catch(()=>{});}catch(e){}
    S.light=false;paint();
  }
});
document.addEventListener("pointerdown",keepAwake,{passive:true});
// Phones take the camera away from a page that is put in the background. Coming back, or whenever the camera stops by itself, it is started again.
function reviveCamera(){
  if(mode!=="live"||recording||LENS.busy) return;
  const tr=liveStream&&liveStream.getVideoTracks()[0];
  if(tr&&tr.readyState!=="ended") return;
  LENS.busy=true;
  startLive(true,LENS.i>=0&&LENS.list[LENS.i]?LENS.list[LENS.i].id:undefined).then(ok=>ok||startLive(true)).then(ok=>{if(!ok) showCard(false);},()=>{}).then(()=>{LENS.busy=false;});
}
// Rear lenses the browser lists one by one (wide, ultra wide, tele). Cameras that combine lenses change lens by themselves,
// so they are not offered by name: when the phone's usual rear camera is one of those, it is offered as "auto".
const LENS={list:[],i:-1,def:"",busy:false};
function lensFacing(d){
  try{const c=d.getCapabilities&&d.getCapabilities();if(c&&c.facingMode&&c.facingMode.length) return c.facingMode[0];}catch(e){}
  return /front|user|facetime|selfie/i.test(d.label)?"user":/back|rear|environment/i.test(d.label)?"environment":"";
}
async function refreshLenses(){
  const list=[];let at=-1;
  try{
    if(S.facing==="environment"&&mode==="live"&&navigator.mediaDevices.enumerateDevices){
      const tr=liveStream&&liveStream.getVideoTracks()[0],cur=tr&&tr.getSettings?tr.getSettings().deviceId||"":"";
      const back=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput"&&d.deviceId&&lensFacing(d)==="environment"&&!/dual|triple/i.test(d.label));
      if(back.length>1){
        const plain=back.filter(d=>!/ultra|tele/i.test(d.label));let n=0;
        for(const d of back) list.push({id:d.deviceId,name:/ultra/i.test(d.label)?"0.5×":/tele/i.test(d.label)?"tele":plain.length===1?"1×":String(++n)});
        if(LENS.def&&!list.some(l=>l.id===LENS.def)) list.unshift({id:"",name:"auto"});
        at=list.findIndex(l=>l.id===cur);
        if(at<0) at=list[0].id===""?0:-1;
      }
    }
  }catch(e){}
  LENS.list=list;LENS.i=at;paint();
}
async function useLens(k){
  const L=LENS.list[k];
  if(!L||recording||LENS.busy) return;
  LENS.busy=true;
  try{
    stopLive();                                      // many phones cannot have two rear cameras open at the same moment
    let ok=await startLive(true,L.id);
    if(!ok&&L.id){ok=await startLive(true);if(ok) toast("That lens did not open, so the camera is back on the usual one.",3600);}
    if(!ok){toast("The camera did not open. Check that this page is allowed to use it.",3600);showCard(false);}
  }finally{LENS.busy=false;}
}
async function startLive(quiet,lensId){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){if(!quiet)toast("This browser can't open the camera here.");return false;}
  // 1:1 and 4:3 pictures ask for the camera's whole sensor (it is 4:3), so nothing is thrown away at the sides; 16:9 asks for the wide video picture.
  const full=S.shape!=="16:9"||S.format!=="s8";
  const want={video:{facingMode:S.facing,width:{ideal:1920},height:{ideal:full&&S.format==="s8"?1440:1080}},audio:true};
  LENS.full=full&&S.format==="s8";
  if(lensId){delete want.video.facingMode;want.video.deviceId={exact:lensId};}
  if(S.move) want.video.frameRate={ideal:camRateFor(S.fps)};   // about three camera pictures for each film frame
  let s=null;
  try{s=await navigator.mediaDevices.getUserMedia(want);}
  catch(e){
    try{s=await navigator.mediaDevices.getUserMedia({video:want.video});}
    catch(e2){if(!quiet)toast("The camera did not open. Check that this page is allowed to use it.",3600);return false;}
  }
  stopLive();liveStream=s;
  {const vt=s.getVideoTracks()[0];if(vt) vt.addEventListener("ended",()=>{if(liveStream===s&&document.visibilityState==="visible") setTimeout(reviveCamera,400);});}
  if(!lensId){const vt=s.getVideoTracks()[0];LENS.def=vt&&vt.getSettings?vt.getSettings().deviceId||"":"";}   // the camera the phone picks by itself
  if(clipUrl){URL.revokeObjectURL(clipUrl);clipUrl=null;}
  video.removeAttribute("src");video.srcObject=s;video.muted=true;video.loop=false;
  try{await video.play();}catch(e){}
  mode="live";S.lock=false;S.light=false;paint();
  card(false);$("srcChip").hidden=true;
  mvReset();initCamZoom();keepAwake();refreshLenses();
  return true;
}
function loadClip(file){
  if(!file) return;
  if(recording) stopRec();
  stopLive();LENS.list=[];LENS.i=-1;
  if(clipUrl) URL.revokeObjectURL(clipUrl);
  clipUrl=URL.createObjectURL(file);
  video.srcObject=null;video.src=clipUrl;video.muted=true;video.loop=true;
  video.play().then(()=>{
    mode="clip";S.zoom=1;paint();paintStatus();
    card(false);$("srcChip").hidden=false;
    toast("Clip loaded. Press the red button to record it with this look.",3600);
  }).catch(()=>toast("This clip could not be opened. Try another one.",3600));
}
video.addEventListener("error",()=>{if(video.src) toast("This clip could not be opened. Try another one.",3600);});
video.addEventListener("ended",()=>{if(recording&&mode==="clip") stopRec();});
$("shootInput").addEventListener("change",e=>{loadClip(e.target.files[0]);e.target.value="";});
$("pickInput").addEventListener("change",e=>{loadClip(e.target.files[0]);e.target.value="";});
function card(on){$("srcCard").hidden=!on;$("cam").classList.toggle("carded",on);}   // while the card is up, the exposure scale under it is put away
function showCard(canClose){
  $("cardText").textContent=FRAMED
    ?"This page cannot open the live camera. Shoot a clip with your phone camera, or choose one, and it comes back here with the film look."
    :"The live camera is not on. Allow the camera, or shoot or choose a clip to give it the film look.";
  $("liveBtn").hidden=FRAMED;
  $("cardClose").hidden=!canClose;
  card(true);
}
$("srcChip").onclick=()=>showCard(true);
$("cardClose").onclick=()=>card(false);
$("liveBtn").onclick=()=>startLive(false);

/* ---------- recording ---------- */
let rec=null,chunks=[],recStart=0,recTimer=0,recTrack=null,recPoster="";
const clips=[];
// Grain is the hardest thing there is to squeeze into a video file. HEVC (the format iPhones and the reference app use) keeps far more of it
// than H.264 at the same size, so it is tried first on iPhone and iPad. If a clip made that way ever fails to open, the page goes back to H.264.
let hevcBad=false;
try{hevcBad=sessionStorage.getItem("reel8nohevc")==="1";}catch(e){}
function pickMime(){
  const c=["video/mp4;codecs=avc1.640028,mp4a.40.2","video/mp4;codecs=avc1.4D4028,mp4a.40.2","video/mp4;codecs=avc1.42E028,mp4a.40.2",
    "video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  if(IS_IOS&&!hevcBad) c.unshift("video/mp4;codecs=hvc1.1.6.L123.B0,mp4a.40.2");
  for(const m of c){try{if(MediaRecorder.isTypeSupported(m))return m;}catch(e){}}
  return "";
}
/* ---------- film-style sound ----------
   Sound on Super 8 was a thin magnetic stripe on the edge of the film: little bass, no top (about 90 to 6000 cycles), a slow sway and a
   fast tremble in pitch from the film's uneven travel, a touch of overload, and a steady hiss. That is what this makes of the microphone.
   The camera's own whirr (motor hum and the claw's tick at each frame) can be laid over it; it is made here, not a recording.
   Everything to be recorded goes into SND.inp; SND.film and SND.plain choose the way through; nothing is ever sent to the loudspeaker. */
const SND={ctx:null,dest:null,inp:null,film:null,plain:null,whirr:null,tick:null,hum:null,liveNode:null,liveOf:null,clipNode:null};
function sndGraph(){
  if(SND.ctx) return SND.ctx;
  const AC=window.AudioContext||window.webkitAudioContext,c=new AC(),R=c.sampleRate;
  const G=v=>{const g=c.createGain();g.gain.value=v;return g;};
  const F=(type,f,q)=>{const b=c.createBiquadFilter();b.type=type;b.frequency.value=f;if(q) b.Q.value=q;return b;};
  const noise=secs=>{const b=c.createBuffer(1,Math.floor(R*secs),R),d=b.getChannelData(0);for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const n=c.createBufferSource();n.buffer=b;n.loop=true;n.start();return n;};
  const osc=(type,f)=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;o.start();return o;};
  SND.ctx=c;SND.dest=c.createMediaStreamDestination();SND.inp=G(1);SND.film=G(0);SND.plain=G(1);
  SND.inp.connect(SND.plain);SND.plain.connect(SND.dest);
  // the stripe: narrow band, pitch that sways (0.6 times a second) and trembles (6.3 times a second), gentle overload
  const hp=F("highpass",90,.7),lp1=F("lowpass",6000,.7),lp2=F("lowpass",7000,.7),dl=c.createDelay(.1),sh=c.createWaveShaper();
  dl.delayTime.value=.02;
  const sway=osc("sine",.6),swayG=G(.0005),tremble=osc("sine",6.3),trembleG=G(.00005);
  sway.connect(swayG);swayG.connect(dl.delayTime);tremble.connect(trembleG);trembleG.connect(dl.delayTime);
  const curve=new Float32Array(1025);for(let i=0;i<1025;i++){const x=i/512-1;curve[i]=Math.tanh(1.6*x)/Math.tanh(1.6);}
  sh.curve=curve;
  SND.inp.connect(hp);hp.connect(lp1);lp1.connect(lp2);lp2.connect(dl);dl.connect(sh);sh.connect(SND.film);SND.film.connect(SND.dest);
  const hiss=noise(2),hissF=F("bandpass",3200,.5),hissG=G(.006);hiss.connect(hissF);hissF.connect(hissG);hissG.connect(SND.film);
  // the camera: a motor hum, and a short tick as the claw pulls each frame down
  SND.whirr=G(0);SND.whirr.connect(SND.dest);
  const wn=noise(1.3),wF=F("bandpass",1700,1.2),gate=G(0);SND.tick=osc("sawtooth",18);
  const tickShape=c.createWaveShaper(),tc=new Float32Array(257);for(let i=0;i<257;i++){const x=i/128-1;tc[i]=x>.72?(x-.72)/.28:0;}   // open for the last seventh of each turn
  tickShape.curve=tc;SND.tick.connect(tickShape);tickShape.connect(gate.gain);
  wn.connect(wF);wF.connect(gate);const tickG=G(.08);gate.connect(tickG);tickG.connect(SND.whirr);
  SND.hum=osc("triangle",72);const humF=F("lowpass",420,.7),humG=G(.02);SND.hum.connect(humF);humF.connect(humG);humG.connect(SND.whirr);
  const rumble=G(.01),rF=F("bandpass",520,.8);wn.connect(rF);rF.connect(rumble);rumble.connect(SND.whirr);
  sndSet();
  return c;
}
function sndSet(){                                   // put the choices in Settings, and the film speed, into the sound
  const c=SND.ctx;if(!c) return;
  const t=c.currentTime,film=S.filmSound&&S.format!=="vhs";
  SND.film.gain.setTargetAtTime(film?.6:0,t,.02);SND.plain.gain.setTargetAtTime(film?0:1,t,.02);
  SND.whirr.gain.setTargetAtTime(S.whirr&&S.format!=="vhs"?1:0,t,.02);
  SND.tick.frequency.setTargetAtTime(S.fps,t,.02);SND.hum.frequency.setTargetAtTime(S.fps*4,t,.02);
}
function soundTrack(){                               // the sound for a shot: the microphone, or the clip's own sound, through the graph above
  try{
    const c=sndGraph();
    if(mode==="clip"){
      if(!SND.clipNode){SND.clipNode=c.createMediaElementSource(video);SND.clipNode.connect(SND.inp);}
    }else{
      const mic=liveStream&&liveStream.getAudioTracks()[0];
      if(!mic) return null;
      if(SND.liveOf!==liveStream){
        if(SND.liveNode){try{SND.liveNode.disconnect();}catch(e){}}
        SND.liveNode=c.createMediaStreamSource(new MediaStream([mic]));SND.liveNode.connect(SND.inp);SND.liveOf=liveStream;
      }
    }
    sndSet();c.resume();
    return SND.dest.stream.getAudioTracks()[0]||null;
  }catch(e){return mode==="live"&&liveStream?liveStream.getAudioTracks()[0]||null:null;}   // no sound graph in this browser: the microphone as it is
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
  const plain=!(S.filmSound||S.whirr)||S.format==="vhs";
  if(mode==="live"&&liveStream&&S.sound) audio=plain?liveStream.getAudioTracks()[0]||null:soundTrack();   // untouched sound goes straight from the microphone, as it always has
  if(mode==="clip"){
    audio=soundTrack();
    video.pause();video.loop=false;video.muted=false;
    try{video.currentTime=0;await video.play();}catch(e){video.muted=true;try{await video.play();}catch(e2){}}
    await clipAtStart();
  }
  let vs=cv.captureStream(0);recTrack=vs.getVideoTracks()[0];
  if(!recTrack||!recTrack.requestFrame){vs=cv.captureStream(S.fps);recTrack=null;}   // one captured frame per film frame where the browser allows it
  tracks.push(vs.getVideoTracks()[0]);
  if(audio&&S.sound) tracks.push(audio);
  const mime=pickMime();
  const BITS=40e6;                                   // about 5 MB for every second of film: what it takes for grain to survive
  try{rec=new MediaRecorder(new MediaStream(tracks),mime?{mimeType:mime,videoBitsPerSecond:BITS}:{videoBitsPerSecond:BITS});}
  catch(e){
    try{
      if(/hvc1/.test(mime)){hevcBad=true;rec=new MediaRecorder(new MediaStream(tracks),{mimeType:pickMime(),videoBitsPerSecond:BITS});}
      else rec=new MediaRecorder(new MediaStream([tracks[0]]));
    }
    catch(e2){
      try{rec=new MediaRecorder(new MediaStream([tracks[0]]));}
      catch(e3){toast("This browser cannot record video.",3600);return;}
    }
  }
  rec.onerror=()=>{if(/hvc1/.test(rec.mimeType||mime)) noHevc();};
  chunks=[];
  rec.ondataavailable=e=>{if(e.data&&e.data.size) chunks.push(e.data);};
  rec.onstop=finishRec;
  rec.start(1000);
  recording=true;recStart=performance.now();
  if(S.format==="vhs") dyn.glitch=1.2;
  else if(S.burn){const u=Math.random();startFilmFlare(u<.2?1:u<.65?.55:.22);}   // like real rolls: sometimes strong, mostly modest, sometimes barely there
  $("recLamp").hidden=false;$("recTime").textContent="00:00:00";
  recTimer=setInterval(()=>{
    const s=Math.floor((performance.now()-recStart)/1000);
    $("recTime").textContent=String(Math.floor(s/3600)).padStart(2,"0")+":"+String(Math.floor(s/60)%60).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  },250);
  paint();
}
function stopRec(){
  if(!recording) return;
  recording=false;recTrack=null;clearInterval(recTimer);recPoster=posterNow();
  $("recLamp").hidden=true;
  try{rec.stop();}catch(e){}
  if(mode==="clip"){video.muted=true;video.loop=true;video.play().catch(()=>{});}
  paint();
}
function noHevc(){
  if(hevcBad) return;
  hevcBad=true;try{sessionStorage.setItem("reel8nohevc","1");}catch(e){}
}
function finishRec(){
  const type=(rec&&rec.mimeType)||"video/webm";
  const blob=new Blob(chunks,{type});chunks=[];
  if(!blob.size){
    if(/hvc1/.test(type)){noHevc();toast("That shot did not record. Press record again: the page has switched to the older video format.",4200);return;}
    toast("Nothing was recorded. Try again.");return;
  }
  const d=new Date(),z=n=>String(n).padStart(2,"0");
  clips.unshift({
    blob,url:URL.createObjectURL(blob),ext:type.indexOf("mp4")>=0?"mp4":"webm",hevc:/hvc1|hev1/.test(type),
    secs:Math.max(1,Math.round((performance.now()-recStart)/1000)),
    name:"reel8-"+d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+"-"+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds()),
    label:FORMATS[S.format].name+" "+nameOf(S.stock),fps:S.fps,aspect:cv.width/cv.height,poster:recPoster
  });
  renderClips();
  toast("Clip ready. Open Clips to watch or save it.",3200);
}
/* ---------- photos ---------- */
// A photo is the frame on screen, film look and all, kept as a JPEG at the size the picture is drawn.
let snapWanted=false,snapBusy=false;
function snapIfWanted(){if(snapWanted){snapWanted=false;takePhoto();}}   // called straight after every drawn frame (both ways a frame gets drawn), while the canvas still holds it
function takePhoto(){
  const film=FORMATS[S.format].name+" "+nameOf(S.stock),aspect=cv.width/cv.height,size=cv.width+" × "+cv.height;
  const keep=blob=>{
    snapBusy=false;
    if(!blob||!blob.size){toast("That photo did not come out. Try again.");return;}
    const d=new Date(),z=n=>String(n).padStart(2,"0"),url=URL.createObjectURL(blob);
    clips.unshift({photo:true,blob,url,ext:"jpg",secs:0,
      name:"reel8-"+d.getFullYear()+z(d.getMonth()+1)+z(d.getDate())+"-"+z(d.getHours())+z(d.getMinutes())+z(d.getSeconds())+"-"+z(Math.floor(d.getMilliseconds()/10)),
      label:film,size,aspect,poster:url});
    renderClips();
    toast("Photo taken.",1200);
  };
  try{cv.toBlob(keep,"image/jpeg",.95);}catch(e){keep(null);}
}
function snap(){
  if(snapBusy||snapWanted) return;
  snapBusy=true;snapWanted=true;
  const c=$("cam");c.classList.add("snap");setTimeout(()=>c.classList.remove("snap"),110);     // the picture blinks, like a shutter
  setTimeout(()=>{if(snapWanted){snapWanted=false;snapBusy=false;toast("That photo did not come out. Try again.");}},4000);
}
$("modeSeg").onclick=e=>{
  const bt=e.target.closest&&e.target.closest("button"),v=bt&&bt.dataset.v;if(!v||v===S.shoot) return;
  if(recording){toast("Stop recording to switch to photo.");return;}
  S.shoot=v;remember();paint();
};
$("trigger").onclick=()=>{if(recording) stopRec();else if(S.shoot==="photo") snap();else startRec();};

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
    try{file=new File([c.blob],filename,{type:c.ext==="jpg"?"image/jpeg":c.ext==="mp4"?"video/mp4":"video/webm"});}catch(e){}
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
    let v;
    if(c.photo){v=document.createElement("img");v.src=c.url;v.alt="Photo on "+c.label;}
    else{v=document.createElement("video");v.src=c.url;v.controls=true;v.playsInline=true;v.preload="metadata";}
    if(c.hevc&&!c.checked){                          // a clip in the newer format that will not open: fall back for the next shots and say so
      c.checked=true;
      v.addEventListener("error",()=>{noHevc();toast("This clip did not record properly. The next ones will use the older video format.",4200);},{once:true});
    }
    v.style.aspectRatio=String(c.aspect);if(c.poster&&!c.photo) v.poster=c.poster;
    const meta=document.createElement("div");meta.className="meta";meta.textContent=c.photo?c.label+" · photo · "+c.size:c.label+" · "+c.fps+" fps · "+c.secs+" s";
    const row=document.createElement("div");row.className="row";
    const sv=document.createElement("button");sv.className="primary";sv.textContent="Save";sv.onclick=()=>saveClip(c,sv);
    const del=document.createElement("button");del.className="second";del.textContent="Delete";
    del.onclick=()=>{const i=clips.indexOf(c);if(i>=0){clips.splice(i,1);URL.revokeObjectURL(c.url);renderClips();}};
    row.append(sv,del);el.append(v,meta,row);box.append(el);
  }
  $("galleryNote").textContent=clips.length
    ?"Clips and photos stay here only while this page is open. Save the ones you want to keep."
    :"Nothing here yet. Press Record to film a clip, or switch to Photo.";
  $("clipCount").textContent=clips.length;
  const gb=$("galleryBtn"),face=clips.length?clips[0].poster:"";
  gb.classList.toggle("has",!!face);$("rollThumb").style.backgroundImage=face?"url("+face+")":"";
  gb.setAttribute("aria-label",clips.length?"Open clips and photos ("+clips.length+")":"Open clips and photos");
}

/* ---------- controls ---------- */
const LOCK_OPEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
const LOCK_SHUT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
function buildStocks(){
  const row=$("strip");row.textContent="";
  for(const name of FORMATS[S.format].stocks){
    const b=document.createElement("button");b.className="film";b.dataset.v=name;b.setAttribute("aria-label",nameOf(name)+" film");
    const c=document.createElement("canvas");c.width=TH.tw||104;c.height=TH.th||138;
    const t=document.createElement("span");t.className="code";t.textContent=nameOf(name);
    const d=document.createElement("span");d.className="ds";d.textContent=FILM_INFO[name]?FILM_INFO[name][0]:"";filmStripes(b,name);
    b.append(c,t,d);
    b.onclick=()=>{if(recording){toast("Stop recording to change film.");return;}S.stockBy[S.format]=name;remember();paint();filmSheet(false);dip();};
    row.append(b);
  }
  TH.tw=0;sizeStrip();stripShown="";
}
let stripShown="";
function showFilmInStrip(smooth){                    // bring the film in use into view in the strip
  const row=$("strip"),b=[...row.children].find(b=>b.dataset.v===S.stock);if(!b) return;
  const how=smooth&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)?"smooth":"auto";
  // A film that can be seen with the strip at its start leaves the strip at its start; one further along is brought to the middle.
  const to=(at,size,room)=>at+size<=room?0:at-(room-size)/2;
  try{
    if(row.scrollHeight>row.clientHeight+1) row.scrollTo({top:to(b.offsetTop-row.offsetTop,b.offsetHeight,row.clientHeight),left:0,behavior:how});
    else row.scrollTo({left:to(b.offsetLeft-row.offsetLeft,b.offsetWidth,row.clientWidth),top:0,behavior:how});
  }catch(e){}
}
function paint(){
  const isVhs=S.format==="vhs",live=mode==="live";
  {const no=FORMATS[S.format].stocks.indexOf(S.stock)+1;$("filmNo").textContent=no;$("picNo").textContent=no;$("picNameT").textContent=nameOf(S.stock);}
  $("stockBtn").textContent=nameOf(S.stock);$("stockBtn").setAttribute("aria-label","Film in the camera: "+nameOf(S.stock)+". Press to change it");
  $("filmSub").textContent=FILM_INFO[S.stock]?FILM_INFO[S.stock][0].replace(". ",", "):"";
  $("trigLabel").textContent=recording?"Stop":S.shoot==="photo"?"Photo":"Record";
  for(const b of $("lookSeg").querySelectorAll("button")) b.setAttribute("aria-pressed",+b.dataset.v===S.lensLook);
  $("filmNote").textContent=nameOf(S.stock)+(FILM_INFO[S.stock]?" — "+FILM_INFO[S.stock][0]:"");
  const ev=(S.ev>0?"+":S.ev<0?"−":"")+Math.abs(S.ev).toFixed(1),at=((S.ev+3)/6*100)+"%";
  $("evVal").textContent=ev;$("evVal").style.left=at;$("evNeedle").style.left=at;
  $("evTicks").setAttribute("aria-valuenow",S.ev.toFixed(1));$("evTicks").setAttribute("aria-valuetext",ev+" stops");
  $("fpsBtn").firstElementChild.textContent=String(S.fps);$("fpsRead").textContent=String(S.fps);
  $("fpsBtn").setAttribute("aria-label","Film speed: "+S.fps+" frames a second");
  for(const id of ["fpsBtn","lensKey","soundKey"]){$(id).classList.toggle("wait",recording);$(id).setAttribute("aria-disabled",recording);}   // not while the film is running
  $("lockBtn").innerHTML=S.lock?LOCK_SHUT:LOCK_OPEN;
  $("lockBtn").setAttribute("aria-pressed",S.lock);
  $("lockBtn").setAttribute("aria-label",S.lock?"Unlock exposure":"Lock exposure");
  if($("cam").classList.contains("rolling")!==recording){const tg=$("trigger");tg.classList.remove("pulse");void tg.offsetWidth;tg.classList.add("pulse");}   // a pulse as the film starts or stops
  $("cam").classList.toggle("rolling",recording);
  for(const b of $("shapeSeg").children) b.setAttribute("aria-pressed",b.dataset.v===S.shape);
  $("shapeSeg").hidden=isVhs;
  $("histSwitch").setAttribute("aria-checked",S.histo);
  $("torchBtn").setAttribute("aria-pressed",S.light);$("torchBtn").setAttribute("aria-label",S.light?"Switch the light off":"Switch the light on");
  for(const b of $("starSeg").querySelectorAll("button")) b.setAttribute("aria-pressed",+b.dataset.v===S.star);
  syncRulers();
  {const L=FORMATS[S.format].stocks,k=Math.min(2,Math.floor(L.indexOf(S.stock)*3/L.length)),pg=$("filmPg").children;for(let i=0;i<3;i++) pg[i].classList.toggle("on",i===k);}
  $("pic").classList.toggle("grid",S.grid);$("gridSwitch").setAttribute("aria-checked",S.grid);
  showEvFigure();     // (not "rec": that name is the lamp's own style)
  $("trigger").setAttribute("aria-pressed",recording);
  $("trigger").setAttribute("aria-label",recording?"Stop recording":S.shoot==="photo"?"Take a photo":"Start recording");
  $("cam").classList.toggle("photo",S.shoot==="photo");
  for(const b of $("modeSeg").children) b.setAttribute("aria-pressed",b.dataset.v===S.shoot);
  for(const b of $("strip").children) b.setAttribute("aria-pressed",b.dataset.v===S.stock);
  if(stripShown!==S.stock){const first=!stripShown;stripShown=S.stock;showFilmInStrip(!first);}
  $("strip").classList.toggle("locked",recording);
  $("lightKey").firstElementChild.textContent=S.light?"on":"off";$("lightKey").setAttribute("aria-pressed",S.light);$("lightKey").classList.toggle("set",S.light);
  $("lightKey").setAttribute("aria-label",S.light?"Switch the light off":"Switch the light on");
  $("lensKey").firstElementChild.textContent=LENS.i>=0?LENS.list[LENS.i].name:"1×";
  $("lensKey").disabled=!live||LENS.list.length<2;
  $("lensKey").setAttribute("aria-label",LENS.list.length>1?"Lens: "+(LENS.i>=0?LENS.list[LENS.i].name:"1×")+". Press for the next one":"Lens (this camera offers one)");
  $("soundKey").firstElementChild.textContent=S.sound?"on":"off";$("soundKey").setAttribute("aria-pressed",S.sound);$("soundKey").classList.toggle("set",!S.sound);
  $("soundKey").setAttribute("aria-label",S.sound?"Record without sound":"Record with sound");
  for(const b of $("facingSeg").children) b.setAttribute("aria-pressed",b.dataset.v===S.facing);
  for(const b of $("colourSeg").children) b.setAttribute("aria-pressed",+b.dataset.v===S.colour);
  for(const b of $("grainSeg").children) b.setAttribute("aria-pressed",+b.dataset.v===S.grain);
  for(const b of $("sideSeg").children) b.setAttribute("aria-pressed",+b.dataset.v===S.side);
  $("sideSeg").classList.toggle("dim",!S.overscan||isVhs);
  $("overSwitch").setAttribute("aria-checked",S.overscan&&!isVhs);
  $("overSwitch").disabled=isVhs;$("burnSwitch").disabled=isVhs;$("lensSwitch").disabled=isVhs;
  $("burnSwitch").setAttribute("aria-checked",S.burn&&!isVhs);
  $("lensSwitch").setAttribute("aria-checked",S.lens&&!isVhs);
  $("moveSwitch").setAttribute("aria-checked",S.move);
  $("fsndSwitch").setAttribute("aria-checked",S.filmSound&&!isVhs);$("whirrSwitch").setAttribute("aria-checked",S.whirr&&!isVhs);
  $("fsndSwitch").disabled=isVhs;$("whirrSwitch").disabled=isVhs;
  $("filmOnlyNote").hidden=!isVhs;
  $("filterRange").value=S.filter;$("filterOut").textContent=FILTERS[S.filter][0];
  $("speedRange").value=S.zoomSpeed;$("speedOut").textContent=S.zoomSpeed.toFixed(1)+"×";
}
function showBoard(which){                           // what the board under the picture shows: the camera's own panels, the films, or the lab
  $("mainBoard").hidden=which!=="main";$("filmSheet").hidden=which!=="films";$("labBoard").hidden=which!=="lab";
  $("cam").classList.toggle("labon",which==="lab");$("cam").classList.toggle("filmson",which==="films");$("settingsBtn").setAttribute("aria-pressed",which==="lab");
  $("settingsBtn").setAttribute("aria-label",which==="lab"?"Close the lab":"Lab: lens look, star filter, diffusion, bloom, grain and more");
}
function filmSheet(on){
  if(on&&recording){toast("Stop recording to change film.");return;}
  if(!on&&$("filmSheet").hidden) return;
  showBoard(on?"films":"main");
  if(on){TH.last=0;sizeStrip();showFilmInStrip(false);$("filmClose").focus();}else $("stockBtn").focus();
}
function labBoard(on){showBoard(on?"lab":"main");if(on){syncRulers();paintStatus();lutStatus();}}
$("starSeg").onclick=e=>{const b=e.target.closest&&e.target.closest("button");if(!b||+b.dataset.v===S.star) return;S.star=+b.dataset.v;remember();paint();};
$("aboutBtn").onclick=()=>{paintStatus();lutStatus();$("settings").hidden=false;$("settingsClose").focus();};
$("lookSeg").onclick=e=>{const b=e.target.closest&&e.target.closest("button");if(!b||+b.dataset.v===S.lensLook) return;S.lensLook=+b.dataset.v;remember();paint();};
$("torchBtn").onclick=()=>$("lightKey").click();
$("fpsTap").onclick=()=>$("fpsBtn").click();
{ // a sideways push on the film card steps to the next or the last film; a tap opens the list
  const fc=$("filmLabel");let at=null;
  fc.addEventListener("pointerdown",e=>{at={x:e.clientX,y:e.clientY,done:false};});
  fc.addEventListener("pointermove",e=>{if(!at||at.done) return;const dx=e.clientX-at.x;if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(e.clientY-at.y)*1.5){at.done=true;if(recording){toast("Stop recording to change film.");return;}stepStock(dx<0?1:-1);}});
  fc.addEventListener("click",e=>{if(at&&at.done){e.stopImmediatePropagation();e.preventDefault();}at=null;},true);
}
$("stockBtn").onclick=()=>filmSheet(true);
$("picName").onclick=()=>filmSheet($("filmSheet").hidden);
$("filmLabel").onclick=e=>{if(e.target.id!=="stockBtn") filmSheet(true);};   // the whole label is the button
$("filmClose").onclick=()=>filmSheet(false);
$("shapeSeg").onclick=e=>{
  const bt=e.target.closest&&e.target.closest("button"),v=bt&&bt.dataset.v;if(!v||v===S.shape) return;
  if(recording){toast("Stop recording to change the shape.");return;}
  const was=cv.getBoundingClientRect();
  S.shape=v;TH.tw=0;remember();paint();sizeStrip();sizeCanvas(srcAspect);
  const now=cv.getBoundingClientRect();
  if(was.width>1&&now.width>1&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)){
    const t="translate("+((was.left+was.width/2)-(now.left+now.width/2))+"px,"+((was.top+was.height/2)-(now.top+now.height/2))+"px) scale("+was.width/now.width+","+was.height/now.height+")";
    cv.style.transition="none";cv.style.transform=t;picBox.style.transition="none";picBox.style.opacity="0";   // the corner marks step aside while the frame moves
    void cv.offsetWidth;                              // start from the old shape...
    cv.style.transition="transform .26s cubic-bezier(.2,.8,.2,1),opacity .16s";cv.style.transform="";      // ...and glide to the new one
    setTimeout(()=>{cv.style.transition="";picBox.style.transition="opacity .18s";picBox.style.opacity="";setTimeout(()=>{picBox.style.transition="";},220);},280);
    dip();
  }
  if(mode==="live"&&liveStream&&(v!=="16:9")!==LENS.full&&!LENS.busy){        // the other kind of camera picture is needed: open the camera again
    LENS.busy=true;const id=LENS.i>=0&&LENS.list[LENS.i]?LENS.list[LENS.i].id:undefined;
    startLive(true,id).then(ok=>ok||startLive(true)).then(()=>{},()=>{}).then(()=>{LENS.busy=false;});
  }
};
$("histSwitch").onclick=()=>{S.histo=!S.histo;TH.last=0;remember();paint();};
$("gridSwitch").onclick=()=>{S.grid=!S.grid;remember();paint();};
$("evRead").onclick=()=>{S.ev=0;paint();};
// Exposure scale. Slide a finger along it and the needle moves by the same distance, wherever the finger started,
// so a stray touch never makes the exposure jump. Two quick taps put it back to zero.
{
  const t=$("evTicks");let d=null,lastTap=-1e9;
  for(let k=0;k<=12;k++){
    const i=document.createElement("i"),M=k%2===0,v=k/2-3;i.style.left=(k/12*100)+"%";if(M) i.className="M";t.append(i);
    if(M){const n=document.createElement("span");n.className="num";n.style.left=(k/12*100)+"%";n.textContent=(v>0?"+":v<0?"−":"")+Math.abs(v);t.append(n);}
  }
  const put=v=>{v=Math.max(-3,Math.min(3,Math.round(v*10)/10))||0;if(v!==S.ev){S.ev=v;paint();}};
  t.addEventListener("pointerdown",e=>{
    if(e.button>0) return;
    d={x:e.clientX,ev:S.ev,w:t.getBoundingClientRect().width||1,moved:false};t.classList.add("live");
    try{t.setPointerCapture(e.pointerId);}catch(x){}
  });
  t.addEventListener("pointermove",e=>{
    if(!d) return;
    const dx=e.clientX-d.x;
    if(!d.moved&&Math.abs(dx)<4) return;
    d.moved=true;put(d.ev+dx/d.w*6);
  });
  const end=e=>{
    if(!d) return;
    const tap=!d.moved&&e.type==="pointerup";d=null;t.classList.remove("live");
    if(tap){const now=e.timeStamp;if(now-lastTap<380){put(0);lastTap=-1e9;}else lastTap=now;}   // the finger's own timing, so a busy phone cannot spoil it
  };
  for(const ev of ["pointerup","pointercancel","lostpointercapture"]) t.addEventListener(ev,end);
  t.addEventListener("keydown",e=>{
    const st={ArrowRight:.1,ArrowUp:.1,ArrowLeft:-.1,ArrowDown:-.1,PageUp:1,PageDown:-1}[e.key];
    if(e.key==="Home"){put(0);e.preventDefault();e.stopPropagation();return;}
    if(!st) return;
    put(S.ev+st);e.preventDefault();e.stopPropagation();
  });
}
$("fpsBtn").onclick=()=>{
  if(recording){toast("Stop recording to change speed.");return;}
  const o=FORMATS[S.format].fps;S.fpsBy[S.format]=o[(o.indexOf(S.fps)+1)%o.length];remember();paint();
  mvReset();if(mode==="live"&&!recording) askCamRate();
};
$("lightKey").onclick=async()=>{
  const tr=mode==="live"&&liveStream&&liveStream.getVideoTracks()[0];
  if(!tr){toast("The light works with the live camera only.");return;}
  const caps=tr.getCapabilities?tr.getCapabilities():{};
  // no light: either this browser cannot reach it at all, or the lens in use has none beside it (on many phones only the main lens has)
  if(!caps.torch){toast(S.facing==="user"?"There is no light next to the front camera.":"This camera cannot switch the light on from here.",3200);return;}
  const next=!S.light;
  try{await tr.applyConstraints({advanced:[{torch:next}]});S.light=next;paint();}
  catch(e){toast("This camera cannot switch the light on from here.",3200);}
};
$("lensKey").onclick=()=>{
  if(recording){toast("Stop recording to change lens.");return;}
  if(LENS.list.length>1) useLens((LENS.i+1)%LENS.list.length);
};
$("soundKey").onclick=()=>{
  if(recording){toast("Stop recording to change sound.");return;}
  S.sound=!S.sound;remember();paint();
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

/* ---------- swipe on the viewfinder to change film ---------- */
let tagT=0;
function showFilmTag(dir){
  {const pn=$("picName");pn.classList.add("flash");void pn.offsetWidth;setTimeout(()=>pn.classList.remove("flash"),60);}   // the name on the picture lights up for a moment
  const tag=$("filmTag"),list=FORMATS[S.format].stocks,dots=$("filmTagDots");
  $("filmTagName").textContent=nameOf(S.stock);
  if(dots.children.length!==list.length){dots.textContent="";for(let k=0;k<list.length;k++) dots.append(document.createElement("i"));}
  for(let k=0;k<list.length;k++) dots.children[k].classList.toggle("on",list[k]===S.stock);
  $("toast").classList.add("off");
  tag.classList.remove("off","inL","inR");
  void tag.offsetWidth;                                   // restart the slide-in
  tag.classList.add(dir>0?"inR":"inL");                   // the name comes in from the side the finger started on
  clearTimeout(tagT);tagT=setTimeout(()=>tag.classList.add("off"),1100);
}
function dip(){const c=$("cam");c.classList.add("swap");setTimeout(()=>c.classList.remove("swap"),120);}   // a soft blink of the picture as something changes
function stepStock(dir){
  if(recording){toast("Stop recording to change film.");return;}
  const list=FORMATS[S.format].stocks,n=list.length;
  S.stockBy[S.format]=list[(list.indexOf(S.stock)+dir+n)%n];
  remember();paint();showFilmTag(dir);dip();
}
// On the picture: a sideways flick changes film; sliding up or down sets exposure (up is brighter); two fingers pinch to zoom.
{
  const fd=$("finder");let sw=null,two=null;const pts=new Map();
  const gap=()=>{const [a,b]=[...pts.values()];return Math.hypot(a.x-b.x,a.y-b.y)||1;};
  fd.addEventListener("pointerdown",e=>{
    if(e.button>0||(e.target.closest&&e.target.closest(".card,.chip,.bar,.shape,.fader,.picname,.torch,#evRead"))) return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    try{fd.setPointerCapture(e.pointerId);}catch(x){}
    if(pts.size===2){sw=null;zoomGoal=null;two={d:gap(),z:S.zoom};$("zoomRead").classList.remove("off");return;}   // a second finger: this is a pinch, not a swipe
    if(pts.size>2||!e.isPrimary){sw=null;return;}
    sw={id:e.pointerId,x:e.clientX,y:e.clientY,t:e.timeStamp,ev:S.ev,mode:"",h:Math.max(120,cv.getBoundingClientRect().height)};
  });
  fd.addEventListener("pointermove",e=>{
    const p=pts.get(e.pointerId);if(!p) return;
    p.x=e.clientX;p.y=e.clientY;
    if(two&&pts.size===2){S.zoom=Math.min(4,Math.max(1,two.z*gap()/two.d));$("zoomRead").textContent=S.zoom.toFixed(1)+"×";return;}
    if(!sw||e.pointerId!==sw.id) return;
    const dx=e.clientX-sw.x,dy=e.clientY-sw.y;
    if(!sw.mode&&Math.abs(dy)>14&&Math.abs(dy)>Math.abs(dx)*1.5) sw.mode="ev";      // clearly up or down: exposure
    if(sw.mode==="ev"){
      const v=Math.max(-3,Math.min(3,Math.round((sw.ev-(dy-Math.sign(dy)*14)/sw.h*4)*10)/10))||0;   // the whole height of the picture is four stops
      if(v!==S.ev){S.ev=v;showEvFigure();}   // only the figure is redrawn while the finger moves
    }
  });
  const end=e=>{
    if(!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if(two){if(pts.size<2){two=null;sw=null;setTimeout(()=>{if(!zoomDir&&!two)$("zoomRead").classList.add("off");},900);}return;}
    if(!sw||e.pointerId!==sw.id) return;
    const dx=e.clientX-sw.x,dy=e.clientY-sw.y,dt=e.timeStamp-sw.t,mode=sw.mode;sw=null;
    if(mode==="ev") paint();                          // the finger is off: bring everything else up to date   // the finger's own timing, so a busy phone cannot spoil a swipe
    if(e.type!=="pointerup"||mode==="ev") return;
    if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy)*1.5||dt>1000) return;     // a clear sideways flick only
    stepStock(dx<0?1:-1);                                                   // finger moves left: next film
  };
  fd.addEventListener("pointerup",end);fd.addEventListener("pointercancel",end);
}

function lutStatus(){
  const n=Object.keys(LUT.tex).length,all=typeof SF_LUT==="undefined"?0:Object.keys(SF_LUT).length;
  $("lutStatus").textContent="Film colours: "+(LUT.failed?"some could not be loaded on this phone ("+n+" of "+all+").":n===all?"all "+all+" loaded.":n?n+" of "+all+" loaded.":"they load when a film needs them.");
}
$("settingsBtn").onclick=()=>labBoard($("labBoard").hidden);
$("settingsClose").onclick=()=>{$("settings").hidden=true;$("aboutBtn").focus();};
$("galleryBtn").onclick=()=>{$("gallery").hidden=false;$("galleryClose").focus();};
$("galleryClose").onclick=()=>{for(const v of $("clips").querySelectorAll("video")) v.pause();$("gallery").hidden=true;$("galleryBtn").focus();};
// One press on the main screen turns to the other camera. The picture dims for the moment the phone needs.
$("flipBtn").onclick=()=>{
  if(recording){toast("Stop recording to turn the camera.");return;}
  if(mode!=="live"){toast("Turning works with the live camera only.");return;}
  $("cam").classList.add("turning");setTimeout(()=>$("cam").classList.remove("turning"),700);
  $("facingSeg").querySelector('[data-v="'+(S.facing==="user"?"environment":"user")+'"]').click();
};
document.addEventListener("touchstart",()=>{},{passive:true});   // lets buttons show they are pressed the instant a finger lands (iPhone needs this)
$("facingSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(!v||v===S.facing) return;
  S.facing=v;LENS.list=[];LENS.i=-1;remember();paint();
  $("shootInput").setAttribute("capture",v);
  if(mode==="live"&&!recording) startLive(false);
};
$("overSwitch").onclick=()=>{if(recording){toast("Stop recording to change this.");return;}S.overscan=!S.overscan;remember();paint();};
$("burnSwitch").onclick=()=>{S.burn=!S.burn;remember();paint();if(S.burn&&!recording) startFilmFlare(.8);};   // switching it on shows one, so you can see what it is
$("lensSwitch").onclick=()=>{S.lens=!S.lens;LF.tr.length=0;remember();paint();};
$("fsndSwitch").onclick=()=>{if(recording){toast("Stop recording to change this.");return;}S.filmSound=!S.filmSound;remember();paint();sndSet();};
$("whirrSwitch").onclick=()=>{if(recording){toast("Stop recording to change this.");return;}S.whirr=!S.whirr;remember();paint();sndSet();};
$("moveSwitch").onclick=()=>{S.move=!S.move;remember();paint();mvReset();if(mode==="live"&&!recording) askCamRate();};
$("colourSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(v===undefined) return;
  if(recording){toast("Stop recording to change this.");return;}
  S.colour=+v;remember();paint();if(S.colour) loadLuts();
};
$("grainSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(v===undefined) return;
  S.grain=+v;remember();paint();
};
$("sideSeg").onclick=e=>{
  const v=e.target.dataset&&e.target.dataset.v;if(v===undefined||S.format==="vhs") return;
  if(recording){toast("Stop recording to change this.");return;}
  S.side=+v;if(!S.overscan) S.overscan=true;remember();paint();
};
$("filterRange").oninput=e=>{S.filter=+e.target.value;remember();paint();};
$("speedRange").oninput=e=>{S.zoomSpeed=+e.target.value;remember();paint();};
document.addEventListener("keydown",e=>{
  if((e.key==="ArrowLeft"||e.key==="ArrowRight")&&$("settings").hidden&&$("gallery").hidden
     &&!(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))){stepStock(e.key==="ArrowRight"?1:-1);return;}
  if(e.key!=="Escape") return;
  if(!$("settings").hidden) $("settingsClose").click();
  else if(!$("gallery").hidden) $("galleryClose").click();
  else if(!$("filmSheet").hidden) filmSheet(false);
  else if(!$("labBoard").hidden) labBoard(false);
});

/* ---------- start ---------- */
$("shootInput").setAttribute("capture",S.facing);
buildRulers();buildStocks();paint();renderClips();
glOK=initGL();
if(!glOK) toast("This browser cannot draw the film look (WebGL is off).",6000);
sizeCanvas(srcAspect);
window.addEventListener("resize",()=>{sizeStrip();sizeCanvas(srcAspect);showFilmInStrip(false);});
requestAnimationFrame(tick);
// On its own address the page keeps a copy of itself, so it opens without a connection, and it can be put on the Home Screen as an app.
const STANDALONE=!!(navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches));
if(!FRAMED&&"serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost")){
  try{navigator.serviceWorker.register("sw.js").catch(()=>{});}catch(e){}
}
$("homeNote").hidden=!(IS_IOS&&!STANDALONE&&!FRAMED);
if(FRAMED) showCard(false);
else startLive(true).then(ok=>{if(!ok&&mode==="test") showCard(false);});
window.__reel8={FX,RUL,NAMES,nameOf,get LOOKS(){return LOOKS;},useLook,labBoard,showBoard,syncRulers,LOOK,STANDALONE,reviveCamera,S,dyn,FILM_STOCKS,FORMATS,FILTERS,ACTIVE,stepStock,LF,FLR,MV,CZ,startFilmFlare,step,camFrame,mvReset,CLEAN,LUT,loadLuts,GRAIN,TH,LENS,SHAPES,filmSheet,refreshLenses,useLens,SND,sndGraph,sndSet,get recKinds(){return rec&&rec.stream?rec.stream.getTracks().map(t=>t.kind).sort().join():"";},nominalRate,rateFits,groupStart,shutterWeight,
  get locked(){return MV.locked;},get status(){return $("camStatus").textContent;},
  blendTest(els,shares){srcAspect=els[0].naturalWidth/els[0].naturalHeight;beginFrame(srcAspect);let ws=0;els.forEach((e,i)=>{expose(e,shares[i]/(ws+shares[i]));ws+=shares[i];});develop(performance.now());},dustSheet(){return dustCanvas?dustCanvas.toDataURL("image/png"):null;},get mode(){return mode;},get frames(){return frames;},clips,loadClip,paint,buildStocks,
  still(el){stillEl=el;mode="still";card(false);},snap(){return new Promise(r=>{snapCb=r;});},
  snapAndHold(){freezeNext=true;return new Promise(r=>{snapCb=r;});},release(){frozen=false;},set dmgHook(f){dmgHook=f;}};
})();
