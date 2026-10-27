import fs from 'node:fs/promises';
import {FileBlob,PresentationFile} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('candidate.pptx'));
function set(n,name,text,pos,size){const s=p.slides.items[n-1].shapes.items.find(x=>x.name===name||x.name.startsWith(name.slice(0,40)));if(!s)throw Error(n+' '+name);s.text=text;if(pos)s.position={left:pos[0],top:pos[1],width:pos[2],height:pos[3]};if(size)s.text.style={fontSize:size};return s;}
function title(n,names,text,pos,size=32){set(n,names[0],text,pos,size);for(const name of names.slice(1))set(n,name,'');}
set(1,'LIFTING. MOVING.','Lifting and heavy transport',[34,290,290,48],23);
set(1,'Equipment and operations','Equipment for lifting, handling\nand site access',[34,365,290,72],20);
set(1,'WORK IN FOCUS.','Company portfolio',[33,520,260,30],21);set(1,'COMPANY PROFILE','');
title(2,['WORK BEGINS','WITH A CLEAR','DIRECTION.'],'About Waseem\nConstruction',[32,110,235,100],30);
set(2,'The work behind the movement.','Equipment and operations',[315,324,495,40],28);
set(2,'A focused introduction to Waseem','Our equipment and operations, with examples from industrial yards, construction sites and port areas.',[33,374,224,150],19);
set(2,'Waseem Construction Company brings lifting, material handlin','This portfolio brings together examples of lifting, material handling, equipment transport and access work.',[315,376,495,90],20);
set(2,'Use this portfolio as a starting point for discussing a spec','Contact us to discuss equipment availability, site requirements, pricing and the scope of your job.',[315,472,495,75],20);
title(3,['EQUIPMENT THAT','KEEPS WORK MOVING.'],'Equipment and areas of work',[32,108,600,54],30);
set(3,'Lifting and positioning','Cargo lifting',[42,450,167,42],18);
set(3,'Handling with purpose','Yard handling',[240,450,167,42],18);
set(3,'Movement at scale','Cargo transport',[438,450,167,42],18);
set(3,'Reach the working area','Site access',[636,450,167,42],18);
set(3,'Proposed service categories below are based on the supplied ','Equipment shown in this portfolio. Availability and suitability are confirmed for each job.',[33,181,776,35],15);
title(4,['BIG LOADS.','CLEAR FOCUS.'],'Crane operations',[394,74,416,82],34);
set(4,'A closer look at lifting and load positioning.','Lifting and positioning heavy loads',[394,162,416,36],20);
set(4,'Mobile cranes pictured alongside cylindrical loads and tran','Mobile cranes handling heavy loads alongside transport trailers.',[394,211,416,60],18);
title(5,['MATERIALS IN MOTION.'],'Forklifts and material handling',[32,94,778,50],32);
set(5,'Forklifts and handling equipment pictured in industrial yard','Handling materials and large reels in industrial yards',[33,148,776,32],20);
title(6,['READY FOR THE NEXT MOVE.'],'Equipment transport',[32,119,778,46],34);
set(6,'Loading, transport and truck-mounted lifting equipment.','Forklifts, low-bed trailers and truck-mounted lifting equipment',[33,167,776,30],18);
set(6,'The transport task begins with the equipment, its dimensions','We discuss equipment dimensions and access at both the loading and delivery locations before planning transport.',[300,474,510,68],18);
title(7,['LIFTING AT','THE WATERFRONT.'],'Port lifting\noperations',[46,100,236,61],23);
set(7,'Mobile cranes and cargo handling in port environments.','Crane positioning and cargo handling\nat the waterfront',[323,108,477,60],20);
for(const n of [8,9]){title(n,['PORT','ENVIRONMENTS'],'Port equipment',[31,125,203,90],28);set(n,'Gantry structures and elevated','Gantry structures and lifting equipment working in port areas.',[33,340,201,150],20);}
set(8,'STRUCTURES AT','Gantry structures',[33,244,201,60],21);set(8,'SCALE.','');set(9,'ACCESS IN CONTEXT.','Equipment access',[33,244,201,60],21);
title(10,['MOVEMENT AT SCALE.'],'Heavy cargo transport',[32,94,778,49],34);
set(10,'Covered loads and oversized cargo on multi-axle transport eq','Covered and oversized loads on multi-axle trailers',[33,145,776,32],20);
title(11,['REACH THE','WORKING','AREA.'],'Access\nequipment',[32,122,240,110],32);
set(11,'Scissor lifts and boom lifts support access','Scissor lifts and boom lifts for work at height, indoors and outdoors.',[33,278,241,154],20);
title(12,['DIFFERENT TASKS.','PRACTICAL EQUIPMENT.'],'Site machinery',[32,99,778,62],35);
title(13,['HANDLING WITH PURPOSE.'],'Crane and container handling',[32,116,778,50],32);
set(13,'Mobile crane activity and container-handling equipment.','Mobile cranes and reach stackers',[33,169,776,30],20);
title(14,['A CLEAR BRIEF.','A BETTER START.'],'Planning your equipment enquiry',[32,101,778,73],32);
set(14,'Four points to discuss when preparing an equipment enquiry.','Tell us about the job so we can discuss the equipment you need',[33,190,776,54],20);
title(15,["LET'S PLAN",'THE NEXT MOVE.'],'Contact our team',[395,96,415,75],34);
set(15,'Send your requirements to our team.','Email us with your job requirements',[397,190,413,60],22);
// Restore consistent brand text explicitly on every content slide.
for(let n=3;n<=14;n++){if(n===4)continue;set(n,'WASEEM','WASEEM',[32,26,220,25],16);set(n,'CONSTRUCTION COMPANY','CONSTRUCTION COMPANY',[33,51,250,18],10);}
await (await PresentationFile.exportPptx(p)).save('natural-candidate.pptx');
for(let i=0;i<15;i++)await fs.writeFile(`natural-${i+1}.png`,new Uint8Array(await (await p.slides.items[i].export({format:'png',scale:1.5})).arrayBuffer()));
console.log('Rendered natural revision');




