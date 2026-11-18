// Dependency-free WebGL illustrations. Procedural surfaces are schematic, not maps.
export function createUniverse(canvas) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
 if(!gl)throw new Error('WebGL unavailable');
 const vertex='attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
 const fragment=`precision highp float;
 uniform vec2 resolution;
 uniform float time,stage,yaw,pitch,zoom;
 const float PI=3.14159265;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.11,.27,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*noise(p);p=p*2.03+vec3(3.1,1.7,5.9);a*=.5;}return f;}
 mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}
 mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}
 vec3 sky(vec3 rd){vec3 p=rd*260.;vec3 cell=floor(p);float h=hash(cell);float star=pow(max(0.,1.-length(fract(p)-.5)*2.),8.)*step(.986,h);float cloud=fbm(rd*4.+vec3(3,1,0));return vec3(.012,.024,.041)+vec3(.025,.06,.09)*pow(cloud,3.)+star*vec3(.7,.83,1.);}
 float hitSphere(vec3 ro,vec3 rd,vec3 center,float radius){vec3 oc=ro-center;float b=dot(oc,rd),c=dot(oc,oc)-radius*radius,h=b*b-c;if(h<0.)return -1.;return -b-sqrt(h);}
 vec3 sphere(vec3 ro,vec3 rd,vec3 center,float radius,float kind,vec3 bg){
  float t=hitSphere(ro,rd,center,radius);vec3 closest=ro+rd*max(0.,dot(center-ro,rd));float edge=length(closest-center)/radius;
  vec3 glow=kind<.5?vec3(.13,.43,.8):kind<1.5?vec3(1.,.24,.025):kind<2.5?vec3(1.,.55,.12):vec3(.3,.35,.42);
  bg+=glow*exp(-max(0.,edge-1.)*18.)*.19*step(1.,edge);
  if(t<0.)return bg;
  vec3 n=normalize(ro+t*rd-center);vec3 p=rotY(time*.025)*n;vec3 light=normalize(vec3(-3.,2.,4.));float diff=max(dot(n,light),0.);float rim=pow(1.-max(dot(n,-rd),0.),3.);vec3 color;
  if(kind<.5){
   float land=fbm(p*3.5+vec3(2.,.1,4.));float fine=fbm(p*20.);float continent=smoothstep(.49,.53,land);float desert=smoothstep(.65,.95,1.-abs(p.y))*smoothstep(.52,.67,land);
   vec3 ground=mix(vec3(.10,.29,.20),vec3(.52,.46,.27),desert);ground*=.7+fine*.6;
   color=mix(vec3(.018,.15,.33),ground,continent);float polar=smoothstep(.88,.97,abs(p.y)+fine*.07);color=mix(color,vec3(.85,.91,.91),polar);
   float clouds=smoothstep(.59,.73,fbm(rotY(.18+time*.009)*p*7.));color=mix(color,vec3(.88,.94,.98),clouds*.85);
   color*=.045+diff*1.15;color+=vec3(.16,.43,.7)*rim*(.18+diff*.65);float spec=pow(max(dot(reflect(-light,n),-rd),0.),40.);color+=vec3(.55,.75,.9)*spec*(1.-continent)*.3;
  }else if(kind<1.5){float lava=fbm(p*5.+time*.012);float fissure=1.-smoothstep(.015,.075,abs(lava-.5));color=vec3(.13,.045,.024)*(.15+diff)+fissure*vec3(1.,.25,.015)*(0.6+noise(p*30.));color+=rim*vec3(.9,.18,.01)*.5;
  }else if(kind<2.5){float fire=fbm(p*12.+time*.025);color=mix(vec3(.95,.27,.025),vec3(1.,.91,.52),fire);color*=.8+.3*max(dot(n,-rd),0.);
  }else{float rock=fbm(p*16.);color=vec3(.48,.47,.44)*(.45+rock)*(.08+diff);}
  return color;
 }
 vec3 disk(vec3 ro,vec3 rd,vec3 bg,float galaxy){
  vec3 col=vec3(0.);for(int i=0;i<26;i++){float t=1.7+float(i)*.13;vec3 p=ro+rd*t;float r=length(p.xz);float a=atan(p.z,p.x);float thick=exp(-abs(p.y)*18.);float arms=pow(.5+.5*cos(a*3.-r*4.+time*.035),4.);float density=thick*exp(-r*.7)*(1.-smoothstep(2.2,2.6,r));density*=galaxy>.5?.2+arms*.8: .35+.65*noise(p*35.);float core=exp(-r*5.);vec3 tone=mix(vec3(.13,.35,.64),vec3(.9,.69,.40),core);if(galaxy<.5)tone=mix(vec3(.62,.25,.09),vec3(1.,.72,.37),core);col+=tone*density*.48;}
  if(abs(rd.y)>.03){float t=-ro.y/rd.y;if(t>0.){vec3 p=ro+rd*t;float r=length(p.xz);float a=atan(p.z,p.x);float arm=pow(.5+.5*cos(a*3.-r*4.+time*.035),5.);float fade=exp(-r*.65)*(1.-smoothstep(1.7,2.4,r));float dust=fbm(p*16.);float stars=pow(noise(p*100.),18.)*14.;vec3 tone=galaxy>.5?vec3(.26,.48,.82):vec3(.82,.40,.13);col+=tone*arm*fade*(.24+dust*.7+stars);col+=vec3(1.,.78,.48)*exp(-r*7.)*.9;}}return bg+col;}
 void main(){
  vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;mat3 camera=rotY(yaw)*rotX(pitch);vec3 ro=camera*vec3(0,0,3.65/zoom);vec3 rd=camera*normalize(vec3(uv,-1.55));vec3 col=sky(rd);float r=length(uv);float s=stage;
  if(s<.5){float fog=fbm(rd*4.+vec3(time*.018,0,0));col=vec3(.018,.027,.049)+vec3(.11,.21,.26)*pow(fog,3.);float rings=pow(.5+.5*sin(r*55.+fog*5.),14.)*exp(-r*4.);col+=vec3(.12,.24,.24)*rings*.35;
  }else if(s<1.5){vec2 p=rd.xy/max(abs(rd.z),.2)*(12./(1.+min(time,15.)*.2))/zoom;float grid=min(abs(sin(p.x*PI)),abs(sin(p.y*PI)));col=vec3(.025,.05,.08)+vec3(.22,.65,.67)*exp(-grid*22.)*.35;col+=vec3(.19,.32,.39)*exp(-r*4.);
  }else if(s<2.5){float hot=fbm(rd*5.+vec3(time*.035,0,0));float rip=fbm(rd*17.+vec3(0,time*.06,0));col=mix(vec3(.17,.025,.045),vec3(.95,.39,.10),hot);col+=vec3(.9,.6,.21)*pow(rip,3.);
  }else if(s<3.5){float cmb=fbm(rd*24.);col=mix(vec3(.04,.20,.38),vec3(.91,.53,.22),smoothstep(.3,.7,cmb));col*=.8;
  }else if(s<4.5){col+=vec3(.055,.11,.21)*fbm(rd*7.);for(int i=0;i<11;i++){float f=float(i);vec3 pos=vec3(sin(f*8.4)*1.5,cos(f*3.7)*1.,sin(f*2.1)*.5);float d=length(cross(pos-ro,rd));float g=exp(-d*65.)+exp(-d*12.)*.15;col+=vec3(.55,.72,1.)*g;}
  }else if(s<5.5){col=disk(ro,rd,col,1.);
  }else if(s<6.5){col=disk(ro,rd,col,0.);col=sphere(ro,rd,vec3(0),.30,2.,col);for(int i=0;i<4;i++){float f=float(i);float a=f*2.4+time*.035/(f+1.);vec3 pos=vec3(cos(a),0,sin(a))*(.8+f*.4);col=sphere(ro,rd,pos,.035+f*.018,3.,col);}
  }else if(s<7.5){col=sphere(ro,rd,vec3(0),.86,1.,col);
  }else if(s<8.5){col=sphere(ro,rd,vec3(-.24,0,0),.65,1.,col);col=sphere(ro,rd,vec3(.93,.38,.1),.18,3.,col);
  }else{col=sphere(ro,rd,vec3(0),.91,0.,col);}
  col*=1.-.25*pow(clamp(r,0.,1.),2.);col=pow(max(col,vec3(0)),vec3(.87));gl_FragColor=vec4(col,1.);
 }`;
 function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const uniforms=Object.fromEntries(['resolution','time','stage','yaw','pitch','zoom'].map(k=>[k,gl.getUniformLocation(program,k)]));
 const state={stage:9,yaw:0,pitch:.12,zoom:1,time:0};let running=false,visible=true,frame=0,last=0,lost=false;
 function draw(){if(lost)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform2f(uniforms.resolution,w,h);for(const k of ['time','stage','yaw','pitch','zoom'])gl.uniform1f(uniforms[k],state[k]);gl.drawArrays(gl.TRIANGLES,0,6);}
 function tick(now){frame=0;if(!running||!visible||document.hidden||lost){last=0;return;}if(now-last>33){state.time+=Math.min((now-(last||now))/1000,.1);if(state.stage!==1)state.yaw+=.002;draw();last=now;}frame=requestAnimationFrame(tick);}
 function schedule(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(running&&visible&&!document.hidden&&!lost)frame=requestAnimationFrame(tick);}
 new ResizeObserver(draw).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();}).observe(canvas);document.addEventListener('visibilitychange',schedule);
 let drag=null;canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;state.yaw+=(e.clientX-drag.x)*.008;state.pitch=Math.max(-1.2,Math.min(1.2,state.pitch+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};draw();});for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
 const api={setStage(i){state.stage=i;state.time=0;state.yaw=0;state.pitch=i===5||i===6?.6:.12;state.zoom=1;draw();},rotate(value){running=value;schedule();},zoom(delta){state.zoom=Math.max(.65,Math.min(1.55,state.zoom+delta));draw();},reset(){api.setStage(state.stage);},draw};
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key.startsWith('Arrow')){state.yaw+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;state.pitch=Math.max(-1.2,Math.min(1.2,state.pitch+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0)));draw();}else api.zoom(e.key==='-'?-.1:.1);});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;schedule();canvas.dispatchEvent(new CustomEvent('scene-unavailable'));});canvas.addEventListener('webglcontextrestored',()=>location.reload());draw();return api;
}
