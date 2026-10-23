/** Reads a file with byte-based progress; no artificial delays or upload claims. */
export function readFileWithProgress(file: File, onProgress: (percent: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    onProgress(0);
    reader.onprogress = event => {
      if (event.lengthComputable && event.total) onProgress(Math.min(99, Math.floor(event.loaded / event.total * 100)));
    };
    reader.onload = () => { onProgress(100); resolve(reader.result as ArrayBuffer); };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}. Please select it again.`));
    reader.onabort = () => reject(new Error("File reading was cancelled."));
    reader.readAsArrayBuffer(file);
  });
}

/** Sequential chunks bound memory usage and report progress across all selected bytes. */
export async function readFilesWithProgress(files: File[], onProgress: (percent: number) => void): Promise<void> {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  let loaded = 0;
  onProgress(0);
  if (!totalBytes) { onProgress(100); return; }
  const chunkSize = 1024 * 1024;
  for (const file of files) {
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = event => {
          if (event.lengthComputable) onProgress(Math.min(99, Math.floor((loaded + event.loaded) / totalBytes * 100)));
        };
        reader.onload = () => resolve();
        reader.onerror = () => reject(new Error(`Unable to read ${file.name}. Please select it again.`));
        reader.onabort = () => reject(new Error("File reading was cancelled."));
        reader.readAsArrayBuffer(chunk);
      });
      loaded += chunk.size;
      onProgress(Math.min(99, Math.floor(loaded / totalBytes * 100)));
    }
  }
  onProgress(100);
}
