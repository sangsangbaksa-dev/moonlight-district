import * as THREE from 'three';
import { adjacent, SIZE, type Game } from './territory';

const ownerColors = [0x637963, 0x5f9c83, 0x9472a9, 0xc08366];
const terrainColors = { plain:0xa6b899, forest:0x789c7c, hill:0xb5ae8e, ruins:0xc7b888 };

/** 작은 건물들을 실제 3D 지오메트리로 그리는 등각 도시 지도. */
export function createCityMap(container: HTMLElement, select: (i: number) => void) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' }); }
  catch { return null; }
  container.classList.add('is-3d');
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label','3D 도시 지도. 각 상권을 클릭해 선택하세요.');
  canvas.setAttribute('role','img');
  canvas.tabIndex = 0;
  container.append(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6,6,6,-6,.1,100);
  camera.position.set(10,14,16); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xe9f5df,0x536b5c,2.1));
  const sun = new THREE.DirectionalLight(0xffe7be,2.2); sun.position.set(-5,13,8); scene.add(sun);
  const city = new THREE.Group(); scene.add(city);
  const matCache = new Map<number,THREE.MeshStandardMaterial>();
  const geometryCache = new Map<string,THREE.BufferGeometry>();
  const mat = (color: number) => { let m=matCache.get(color); if(!m){m=new THREE.MeshStandardMaterial({color,roughness:.86,flatShading:true});matCache.set(color,m);} return m; };
  const boxGeo = (x:number,y:number,z:number) => { const k=`b${x},${y},${z}`; let g=geometryCache.get(k);if(!g){g=new THREE.BoxGeometry(x,y,z);geometryCache.set(k,g);}return g; };
  const box = (group:THREE.Group,color:number,x:number,y:number,z:number,w:number,h:number,d:number) => {const mesh=new THREE.Mesh(boxGeo(w,h,d),mat(color));mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const cone = (group:THREE.Group,color:number,x:number,y:number,z:number,r:number,h:number,sides=4) => {const k=`c${r},${h},${sides}`;let geo=geometryCache.get(k);if(!geo){geo=new THREE.ConeGeometry(r,h,sides);geometryCache.set(k,geo);}const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);if(sides===4)m.rotation.y=Math.PI/4;group.add(m);return m;};
  function tree(group:THREE.Group,x:number,z:number,scale=1) { box(group,0x665644,x,.22*scale,z,.07*scale,.3*scale,.07*scale);cone(group,0x3f7255,x,.49*scale,z,.19*scale,.48*scale,6); }
  function windows(group:THREE.Group,w:number,_h:number,d:number,rows:number) {
    for(let r=0;r<rows;r++)for(const x of [-w*.26,w*.06]) box(group,0xe9d8a5,x,.36+r*.23,d/2+.007,w*.18,.11,.016);
  }
  function building(group:THREE.Group,kind:string,accent:number,product:number) {
    if(kind==='mine') {
      box(group,0xe0d5b6,0,.36,0,.57,.62,.54);box(group,accent,0,.70,0,.66,.10,.63);box(group,0x304a3e,0,.22,.278,.12,.35,.02);
      box(group,0x91c7bb,-.17,.40,.28,.17,.16,.02);box(group,0x91c7bb,.17,.40,.28,.17,.16,.02);
      box(group,0xf1d59b,0,.56,.33,.62,.06,.16);for(const x of [-.23,-.08,.07,.22])box(group,accent,x,.568,.34,.075,.065,.17);
      const colors=[0xd7a269,0x97c28d,0xe6cc78,0xbd99b7,0xb48e71,0xd899a3,0xe7c571,0x9fc3c2,0xc8aa86,0x9b9ed3,0xd4a7b8,0xe7b878,0x82b9c7,0xbb9ec9];
      box(group,colors[product] ?? colors[0],0,.84,0,.16,.18,.16);
    } else if(kind==='housing') {
      box(group,0xd9c8a7,0,.34,0,.55,.58,.52);cone(group,0x8b6656,0,.75,0,.47,.32,4);box(group,0x3b5849,0,.2,.27,.12,.3,.02);windows(group,.55,.58,.52,1);
    } else if(kind==='school') {
      box(group,0xe0d4b9,0,.36,0,.68,.62,.55);box(group,0xa27268,0,.71,0,.75,.1,.63);windows(group,.65,.6,.55,2);box(group,0xf4e7c8,0,.82,0,.12,.14,.1);
    } else if(kind==='factory') {
      box(group,0xacb0a1,0,.30,0,.69,.50,.58);box(group,0x60766a,0,.58,0,.74,.08,.64);box(group,0x6a7165,-.18,.79,-.12,.12,.54,.12);box(group,0x6a7165,.12,.70,-.12,.12,.36,.12);windows(group,.65,.5,.58,1);
    } else if(kind==='hospital') {
      box(group,0xf0e9d7,0,.46,0,.59,.82,.53);box(group,0x98b7a4,0,.90,0,.66,.08,.6);windows(group,.56,.8,.53,2);box(group,0xd27768,0,.96,.03,.25,.08,.08);box(group,0xd27768,0,.96,.03,.08,.08,.25);
    } else if(kind==='park') {
      box(group,0x82a66c,0,.12,0,.70,.15,.65);box(group,0xe8cc82,0,.18,.18,.18,.20,.18);tree(group,-.26,-.2,.75);tree(group,.26,-.2,.75);
      const key='torus';let geo=geometryCache.get(key);if(!geo){geo=new THREE.TorusGeometry(.23,.025,6,16);geometryCache.set(key,geo);}const wheel=new THREE.Mesh(geo,mat(0xd6a47b));wheel.position.set(.07,.54,0);group.add(wheel);
      box(group,0xb8aa85,.07,.33,0,.04,.34,.04);box(group,0xe2bf79,.07,.54,0,.36,.03,.03);box(group,0xe2bf79,.07,.54,0,.03,.36,.03);
    } else if(kind==='army') {
      box(group,0x87917d,0,.31,0,.68,.52,.58);box(group,0x596e5e,0,.60,0,.74,.08,.63);box(group,0xe7d6a1,.20,.86,-.1,.025,.55,.025);box(group,0xc99e70,.29,1.02,-.1,.18,.12,.025);windows(group,.63,.5,.58,1);
    } else if(kind==='barracks') {
      box(group,0xd8c39d,0,.35,0,.50,.58,.50);cone(group,0x799e8d,0,.72,0,.42,.28);box(group,0xe8dcba,0,.86,0,.13,.16,.13);windows(group,.48,.55,.50,1);
    } else if(kind==='tower') {
      box(group,0xb9c3ad,0,.44,0,.48,.78,.48);cone(group,0x6d8879,0,.93,0,.40,.26);windows(group,.46,.7,.48,2);
    }
  }
  function capital(group:THREE.Group,side:number) {
    box(group,0xe6d9b9,0,.46,0,.62,.78,.58);box(group,ownerColors[side],0,.88,0,.7,.12,.67);box(group,0xd7c8a6,0,1.05,0,.38,.24,.36);box(group,0xe6d498,0,1.19,0,.18,.08,.17);
    windows(group,.6,.76,.58,2);box(group,0x415c4e,0,.22,.3,.12,.35,.025);
  }
  function soldier(group:THREE.Group,x:number,z:number,side:number) {
    box(group,ownerColors[side],x,.35,z,.14,.25,.12);
    box(group,0xe1c09c,x,.56,z,.13,.13,.12);
    box(group,0x536354,x,.64,z,.16,.06,.14);
    box(group,0xe6d7af,x+.12,.38,z,.035,.30,.035);
  }
  function redraw(game:Game,selected:number) {
    city.clear();
    for(let i=0;i<game.tiles.length;i++) {
      const t=game.tiles[i], group=new THREE.Group(); group.userData.tile=i;
      group.position.set((i%SIZE-(SIZE-1)/2)*1.02,0,(Math.floor(i/SIZE)-(SIZE-1)/2)*1.02);
      box(group,ownerColors[t.owner],0,.03,0,.98,.20,.98);
      box(group,terrainColors[t.terrain],0,.15,0,.86,.10,.86);
      if(t.owner) box(group,ownerColors[t.owner],0,.21,-.39,.76,.035,.055);
      if(i===selected || (t.owner!==1 && adjacent(game,i,1))) {
        const c=i===selected?0xffdf8e:0xd3c894, thick=i===selected?.045:.018;
        box(group,c,0,.215,.44,.91,.025,thick);box(group,c,0,.215,-.44,.91,.025,thick);box(group,c,.44,.215,0,thick,.025,.91);box(group,c,-.44,.215,0,thick,.025,.91);
      }
      const contents=new THREE.Group(); contents.position.y=.2; group.add(contents);
      if(t.capital) capital(contents,t.owner);
      else if(t.structure) building(contents,t.structure,ownerColors[t.owner],t.product);
      else if(t.terrain==='forest') {tree(contents,-.19,-.08,.9);tree(contents,.18,.19,.65);}
      else if(t.terrain==='hill') {cone(contents,0x8b927e,0,.16,0,.28,.32,5);cone(contents,0x9fa394,.17,.10,.14,.15,.2,5);}
      else if(t.terrain==='ruins') {box(contents,0xe4c788,0,.04,0,.48,.08,.48);box(contents,0xf2dcaa,0,.21,0,.14,.35,.14);}
      else {box(contents,0xa1b58f,-.18,.015,.1,.12,.03,.08);box(contents,0xb3c49f,.2,.015,-.15,.10,.03,.08);}
      if (game.battleFx?.tile === i) {
        soldier(contents,-.18,.1,game.battleFx.attacker);
        soldier(contents,.18,-.05,game.battleFx.defender);
        box(contents,0xffe1a0,0,.62,0,.09,.09,.09);
      }
      city.add(group);
    }
    renderer.render(scene,camera);
  }
  let current:Game | null=null, currentSelected=0, zoomFactor=1;
  function resize() {
    const width=container.clientWidth, height=container.clientHeight; if(!width||!height)return;
    renderer.setSize(width,height,false);
    const aspect=width/height, view=Math.max(4.4, 5.5 / aspect) * (SIZE / 7) * zoomFactor;
    camera.left=-view*aspect; camera.right=view*aspect; camera.top=view; camera.bottom=-view; camera.updateProjectionMatrix();
    if(current) redraw(current,currentSelected);
  }
  const observer=new ResizeObserver(resize);observer.observe(container);
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  canvas.addEventListener('pointerdown',event=>{
    const rect=canvas.getBoundingClientRect();pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    ray.setFromCamera(pointer,camera); const hit=ray.intersectObjects(city.children,true)[0];
    if(!hit)return; let node:THREE.Object3D | null=hit.object;
    while(node && node.parent!==city)node=node.parent;
    if(node && typeof node.userData.tile==='number')select(node.userData.tile);
  });
  canvas.addEventListener('keydown', event => {
    const x=currentSelected%SIZE, y=Math.floor(currentSelected/SIZE);
    const next = event.key==='ArrowLeft' && x>0 ? currentSelected-1 : event.key==='ArrowRight' && x<SIZE-1 ? currentSelected+1 : event.key==='ArrowUp' && y>0 ? currentSelected-SIZE : event.key==='ArrowDown' && y<SIZE-1 ? currentSelected+SIZE : currentSelected;
    if (next !== currentSelected) { event.preventDefault(); select(next); }
  });
  resize();
  return { draw(game:Game, selected:number) {current=game;currentSelected=selected;redraw(game,selected);}, zoom(factor:number) {zoomFactor=Math.max(.65,Math.min(1.3,zoomFactor*factor));resize();}, dispose() {observer.disconnect();renderer.dispose();for(const g of geometryCache.values())g.dispose();for(const m of matCache.values())m.dispose();canvas.remove();} };
}

/** 건물 내부. 지붕을 걷어낸 3D 공간과 고용된 직원들을 표시한다. */
export function createInterior(container: HTMLElement, kind: string, staff: number) {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true }); }
  catch { container.textContent = '이 환경에서는 3D 내부 화면을 표시할 수 없습니다.'; return { dispose() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-3.5,3.5,3,-3,.1,50); camera.position.set(6,7,9);camera.lookAt(0,.5,0);
  scene.add(new THREE.HemisphereLight(0xfff3dd,0x697e70,2.2));
  const light=new THREE.DirectionalLight(0xffe2b1,2);light.position.set(-3,8,5);scene.add(light);
  const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true});
  const box=(color:number,x:number,y:number,z:number,w:number,h:number,d:number)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x,y,z);scene.add(m);return m;};
  const sphere=(color:number,x:number,y:number,z:number,r:number)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),material(color));m.position.set(x,y,z);scene.add(m);};
  box(0xb5a483,0,-.09,0,4.1,.18,3.7);
  box(0xd9d3bd,0,1.02,-1.82,4.1,2.05,.12);box(0xc9c8b2,-2.02,1.02,0,.12,2.05,3.7);
  box(0x738d7f,-1.30,1.20,-1.75,.75,.65,.03);box(0xbce0d0,-1.3,1.2,-1.72,.57,.49,.035);box(0x738d7f,-1.3,1.2,-1.69,.03,.52,.03);
  box(0x819a87,.40,1.24,-1.75,.95,.42,.03);
  if(kind==='mine') {
    box(0x8d654c,0,.46,-.25,2.5,.8,.52);box(0xc8a378,0,.9,-.25,2.6,.09,.6);
    box(0x8b674f,1.2,.65,-1.55,.95,1.2,.32);
    for(const x of [.90,1.2,1.5])for(const y of [.35,.7,1.05]) box([0xe4bf7c,0x97bba4,0xc88e78][Math.round((x+.1)*10+y*10)%3],x,y,-1.32,.16,.18,.14);
    box(0xe4c58c,.2,1,-.20,.35,.1,.3);box(0x728e76,-.65,1,-.20,.22,.18,.2);
  } else if(kind==='housing') {
    box(0x9a775d,.2,.35,-.65,2.1,.55,1.1);box(0xe7dbbf,.2,.66,-.65,2.0,.12,1.0);box(0x93ad9d,-.45,.75,-.65,.5,.12,.75);box(0x7f9b88,.9,.34,.85,1.2,.55,.5);
  } else if(kind==='school') {
    box(0x405d4b,.45,1.18,-1.74,1.5,.7,.04);
    for(const x of [-.8,.5])for(const z of [-.3,.7]) {box(0xb18c69,x,.53,z,.7,.1,.48);for(const dx of [-.26,.26])box(0x806550,x+dx,.25,z,.06,.5,.06);}
  } else if(kind==='hospital') {
    for(const z of [-.65,.65]){box(0xaac7bd,.35,.38,z,1.8,.42,.65);box(0xf2ead5,.35,.62,z,1.8,.1,.65);box(0xb6d8ce,-.2,.70,z,.35,.1,.55);}
    box(0xcb796b,1.35,1.2,-1.7,.36,.1,.05);box(0xcb796b,1.35,1.2,-1.7,.1,.36,.05);
  } else if(kind==='factory') {
    box(0x6d8779,.1,.35,0,2.5,.55,.8);box(0x405d55,.1,.65,0,2.6,.10,.7);
    for(const x of [-.8,0,.8]) box(0xd2b482,x,.79,0,.35,.24,.35);
    box(0x8a9a87,1.3,.7,-1.1,.75,1.3,.55);box(0xe3b66e,1.3,1.4,-1.1,.2,.12,.2);
  } else if(kind==='park') {
    box(0x8b6c53,.3,.40,-.5,2,.7,.55);box(0xd9bb8d,.3,.79,-.5,2.1,.10,.65);box(0xd99d83,.3,1.4,-1.65,1.3,.55,.06);sphere(0x86aa81,-1.35,.48,.9,.32);
  } else if(kind==='army') {
    box(0x6e806c,0,.42,0,2.2,.75,1.1);box(0xc0b58b,0,.83,0,2.1,.08,1);box(0x95ad91,0,.88,0,1.4,.03,.7);box(0xc58e71,.4,.92,.1,.15,.09,.15);
  } else {
    box(0x9a795c,.1,.43,-.35,2.1,.75,.8);box(0xd2b18a,.1,.84,-.35,2.2,.08,.9);box(0x6b8373,.6,.97,-.35,.4,.25,.08);sphere(0x82a77a,-1.35,.45,.9,.3);
  }
  function person(x:number,z:number,color:number) { box(color,x,.34,z,.28,.50,.20);sphere(0xe1b89a,x,.76,z,.16);box(0x4e5143,x,.90,z,.29,.08,.23);box(0x514f44,x-.08,.06,z,.09,.15,.12);box(0x514f44,x+.08,.06,z,.09,.15,.12); }
  person(-.6,-1.03,0x668b77);
  for(let i=0;i<staff;i++)person(-1.2+i*1.05,.65,[0xb68471,0x6f8f9a,0xa4976c][i]);
  function resize() { const w=container.clientWidth,h=container.clientHeight; if(!w||!h)return; renderer.setSize(w,h,false); const a=w/h; const v=2.8;camera.left=-v*a;camera.right=v*a;camera.top=v;camera.bottom=-v;camera.updateProjectionMatrix();renderer.render(scene,camera); }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  return { dispose() { observer.disconnect();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();}});renderer.dispose();renderer.domElement.remove(); } };
}
