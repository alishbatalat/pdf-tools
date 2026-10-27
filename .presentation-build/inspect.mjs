import fs from 'node:fs/promises';
import {FileBlob,PresentationFile} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('C:/Users/User/Downloads/Waseem Construction Company - Editable Portfolio (1).pptx'));
await fs.writeFile('source-inspect.txt',(await p.inspect({kind:'slide,textbox,image,shape,layout',maxChars:100000})).ndjson);
for(let i=0;i<p.slides.items.length;i++){const s=p.slides.items[i];await fs.writeFile(`before-${i+1}.png`,new Uint8Array(await (await s.export({format:'png',scale:1})).arrayBuffer()));await fs.writeFile(`layout-${i+1}.json`,await (await s.export({format:'layout'})).text());}
console.log('slides',p.slides.items.length);

