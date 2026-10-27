import fs from 'node:fs/promises';
import {FileBlob,PresentationFile} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/User/Downloads/Waseem Construction Company - Editable Portfolio (1).pptx'));
const layouts=await Promise.all(p.slides.items.map((_,i)=>fs.readFile(`layout-${i+1}.json`,'utf8').then(JSON.parse)));
const refs=layouts.map((l,i)=>new Map(l.elements.filter(e=>e.kind==='textbox'||e.kind==='shape').map(e=>[e.id,p.slides.items[i].shapes.items.find(q=>q.name===e.name&&Math.abs(q.position.left-e.position.left)<1&&Math.abs(q.position.top-e.position.top)<1)])));
function edit(n,el,text,size,pos){const s=refs[n-1].get(el.id);s.text=text;s.text.style={fontFamily:'Arial',fontSize:size,color:el.style.color,bold:el.style.bold??false,alignment:'left',verticalAlignment:'top',autoFit:'none',wrap:true};s.position=pos??el.position;return s;}
function block(n,match,text,x,y,w,h,size=18){const els=layouts[n-1].elements.filter(e=>e.kind==='textbox'&&match(e)); if(!els.length)throw Error('no group '+n);edit(n,els[0],text,size,{left:x,top:y,width:w,height:h});for(const e of els.slice(1))refs[n-1].get(e.id).text='';}
// Retain every photograph and its original framing. Enlarge captions within existing bands.
for(let n=1;n<=15;n++)for(const e of layouts[n-1].elements.filter(e=>e.kind==='textbox')){
 const {left:x,top:y}=e.position;let size=e.style.fontSize;let w=e.position.width,h=e.position.height;
 if(y>550){size=10;w=e.text.match(/^\d+$/)?23:Math.min(430,810-x);h=17;}
 else if(y<65 && size<14){size=e.text==='WASEEM'?16:e.text==='CONSTRUCTION COMPANY'?9:11;w=Math.min(420,810-x);h=18;}
 else if(size<10 && y>420){size=13;w=Math.min(360,810-x);h=22;}
 else if(size<14){size=16;w=Math.min(Math.max(w*1.4,100),810-x);h=24;}
 if(size!==e.style.fontSize) edit(n,e,e.text,size,{left:x,top:y,width:w,height:h});
}
block(1,e=>/LIFTING\. MOVING\.|BUILDING POSSIBILITIES/.test(e.text),'LIFTING. MOVING.\nBUILDING POSSIBILITIES.',34,290,290,55,18);
block(1,e=>/Equipment and operations|for the work ahead/.test(e.text),'Equipment and operations\nfor the work ahead.',34,365,290,60,20);
block(1,e=>e.text==='LIFTING / HANDLING / TRANSPORT','LIFTING / HANDLING / TRANSPORT',592,540,218,28,11);
block(2,e=>e.position.left<280&&e.position.top>370&&e.position.top<445,'An introduction to Waseem Construction Company and the equipment featured in this portfolio.',33,374,224,145,18);
block(2,e=>e.position.left>300&&e.position.top>370&&e.position.top<430,'Our portfolio covers lifting, material handling, heavy transport and site equipment, from industrial yards to waterfront cargo areas.',315,374,495,96,18);
block(2,e=>e.position.left>300&&e.position.top>450&&e.position.top<520,'Equipment availability, technical requirements, commercial terms and scope are confirmed for each enquiry.',315,472,495,75,18);
// Four service cards: larger readable labels and descriptions, photos unchanged.
const groups=[['CRANE OPERATIONS','Lifting and positioning','Mobile cranes handling cargo and larger loads.'],['MATERIAL HANDLING','Handling with purpose','Forklifts and yard equipment moving materials.'],['HEAVY TRANSPORT','Movement at scale','Low-bed and multi-axle transport for equipment and cargo.'],['SITE & ACCESS','Reach the working area','Elevated access and machinery for site activities.']];
for(let j=0;j<4;j++){let x=42+j*198;block(3,e=>e.text===groups[j][0],groups[j][0],x,414,167,36,15);block(3,e=>e.text===groups[j][1],groups[j][1],x,453,167,40,17);block(3,e=>e.position.left>=x-1&&e.position.left<x+170&&e.position.top>455&&e.position.top<485,groups[j][2],x,493,167,51,14);}
block(3,e=>e.text.startsWith('Proposed service'),'Proposed service categories based on supplied photographs. Company confirmation required.',33,181,776,31,14);
// Extend the existing cards down to accommodate readable copy.
for(const e of layouts[2].elements.filter(e=>e.kind==='shape'&&e.position.top===220&&e.position.height>250)){refs[2].get(e.id).position={...e.position,height:326};}
block(4,e=>e.text.startsWith('Mobile cranes pictured')||e.text.startsWith('views show'),'Mobile cranes handle cylindrical loads beside transport trailers. Supporting views show equipment positioning and the working area.',394,208,416,62,17);
// Reflow longer subtitles into the available white space, without reducing photos.
block(5,e=>e.text.startsWith('Forklifts and handling'),'Forklifts and handling equipment in industrial yards',33,146,776,30,19);
block(6,e=>e.text.startsWith('Loading, transport'),'Loading, transport and truck-mounted lifting equipment',33,166,776,28,18);
block(6,e=>e.position.left===300&&e.position.top>460&&e.position.top<510,'Transport planning starts with equipment dimensions and conditions at the loading and receiving areas.',300,474,510,68,18);
block(7,e=>e.text.startsWith('Mobile cranes and cargo'),'Mobile cranes and cargo handling\nin port environments',323,108,477,60,19);
for(const n of [8,9])block(n,e=>e.position.left===33&&e.position.top>330&&e.position.top<390,'Gantry structures and elevated equipment in waterfront working environments.',33,340,201,150,19);
block(10,e=>e.text.startsWith('Covered loads and oversized'),'Covered loads and oversized cargo on multi-axle trailers',33,142,776,36,19);
block(11,e=>e.position.left===33&&e.position.top>270&&e.position.top<350,'Scissor lifts and boom lifts provide access to elevated working areas, indoors and outdoors.',33,278,241,154,19);
block(13,e=>e.text.startsWith('Mobile crane activity'),'Mobile crane activity and container-handling equipment',33,166,776,31,19);
block(14,e=>e.text.startsWith('Four points'),'Four points to discuss when preparing an equipment enquiry',33,190,776,30,19);
const questions=['What needs to be lifted, moved or accessed?','What are the dimensions, weight and handling requirements?','What access, space and ground conditions affect the work?','When is the equipment needed, and for how long?'];
for(let j=0;j<4;j++){const x=47+j*198;block(14,e=>e.position.left===x&&e.position.top>375&&e.position.top<430,questions[j],x,382,158,110,18);}
for(const e of layouts[13].elements.filter(e=>e.kind==='shape'&&e.position.top===249)){refs[13].get(e.id).position={...e.position,height:270};}
block(15,e=>e.text==='Send your requirements to our team.','Send your requirements to our team',397,190,413,45,21);
for(const e of layouts[14].elements.filter(e=>e.text?.includes('@'))){edit(15,e,e.text,24,{...e.position,width:413,height:37});}
// Keep caption text inside each photo's band, with a larger consistent type size.
for(let n=4;n<=13;n++)for(const e of layouts[n-1].elements.filter(e=>e.kind==='textbox'&&e.style.fontSize<9&&e.position.top>425&&e.position.top<540)){
 let right=810;const x=e.position.left;const peers=layouts[n-1].elements.filter(q=>q.kind==='textbox'&&Math.abs(q.position.top-e.position.top)<4&&q.position.left>x+5);if(peers.length)right=Math.min(...peers.map(q=>q.position.left))-20;
 edit(n,e,e.text,12.5,{...e.position,width:right-x,height:23});
}
block(3,e=>e.text==='02 / AREAS OF WORK','02 / AREAS OF WORK',33,72,380,18,11);
block(3,e=>e.text==='FOCUS AREAS','FOCUS AREAS',703,128,110,20,11);
block(3,e=>e.text==='SERVICE CONCEPT / FOR REVIEW','SERVICE CONCEPT / FOR REVIEW',569,561,196,18,9);
for(let j=0;j<4;j++){let x=42+j*198;block(3,e=>e.text===groups[j][1],groups[j][1],x,450,167,44,16);block(3,e=>e.position.left>=x-1&&e.position.left<x+170&&e.position.top>455&&e.position.top<485,groups[j][2],x,495,167,48,13.5);}
for(const [text,x,y] of [['COVERED CARGO',119,345],['MULTI-AXLE TRAILER',482,345],['OVERSIZED MOVEMENT',119,521],['HEAVY TRANSPORT CONFIGURATION',429,521]])block(10,e=>e.text===text,text,x,y,Math.min(350,810-x),22,12.5);
await (await PresentationFile.exportPptx(p)).save('candidate.pptx');
for(let i=0;i<p.slides.items.length;i++)await fs.writeFile(`after-${i+1}.png`,new Uint8Array(await (await p.slides.items[i].export({format:'png',scale:1.5})).arrayBuffer()));
await fs.writeFile('after-inspect.txt',(await p.inspect({kind:'textbox',maxChars:150000})).ndjson);
console.log('Edited and rendered 15 slides');


