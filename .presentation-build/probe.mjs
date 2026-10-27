import {FileBlob,PresentationFile} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p=await PresentationFile.importPptx(await FileBlob.load('candidate.pptx'));
for(let i of [7,8,13]) console.log(i,p.slides.items[i].shapes.items.slice(0,6).map(s=>({id:s.id,name:s.name,text:s.text.toString()})));
