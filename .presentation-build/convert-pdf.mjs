import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=Presentation.create({slideSize:{width:842,height:595}});
for(let i=1;i<=15;i++){const s=p.slides.add();const b=await fs.readFile(`pdf-pages/page-${String(i).padStart(2,'0')}.png`);s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:'image/png',alt:`Original PDF page ${i}`,fit:'contain',position:{left:0,top:0,width:842,height:595}});}
await (await PresentationFile.exportPptx(p)).save('pdf-converted-candidate.pptx');
for(let i=0;i<15;i++)await fs.writeFile(`pdf-pages/slide-${i+1}.png`,new Uint8Array(await (await p.slides.items[i].export({format:'png',scale:1})).arrayBuffer()));
console.log('Converted 15 pages');
