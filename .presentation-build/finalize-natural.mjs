import fs from 'node:fs/promises';
import {constants} from 'node:fs';
const nativeLink=fs.link;fs.link=async(a,b)=>{try{return await nativeLink(a,b)}catch(e){if(e.code!=='EPERM')throw e;return fs.copyFile(a,b,constants.COPYFILE_EXCL)}};
import path from 'node:path';
import {finalizePresentation} from 'file:///C:/Users/User/.codex/plugins/cache/openai-primary-runtime/presentations/26.1020.11127/skills/presentations/container_tools/artifact_tool_utils.mjs';
const w='C:/Users/User/Downloads/pdf tools';const skill='C:/Users/User/.codex/plugins/cache/openai-primary-runtime/presentations/26.1020.11127/skills/presentations';
const r=await finalizePresentation({workspaceDir:w,candidatePath:path.join(w,'.presentation-build/natural-candidate.pptx'),finalPath:path.join(w,'output/Waseem-Construction-Client-Portfolio.pptx'),pythonExecutable:'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','8020050,5667375','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:15,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],verifyArtifactToolImport:true,receiptPath:path.join(w,'.presentation-build/natural-validation.json')});console.log(JSON.stringify(r));


