export function toolSteps(title: string, note: string) {
  return [
    "Select your file — drag it in, or click to browse.",
    note,
    "Review the result, then download it.",
  ];
}

export function toolFaq(title: string, formats: string, browser: boolean) {
  const lower = title.toLowerCase();
  return [
    {
      q: `Is ${title} free to use?`,
      a: `Yes. ${title} is completely free, with no sign-up required and no watermark added to your file.`,
    },
    {
      q: `Is it safe to use ${lower} online?`,
      a: browser
        ? "Yes — this tool runs entirely in your browser. Your file is processed on your own device and is never uploaded anywhere."
        : "Yes. Your file is processed in memory on our server for this one request and is never written to disk or kept afterward.",
    },
    {
      q: "What file types does it accept?",
      a: `${formats}.`,
    },
    {
      q: "Do I need to install anything?",
      a: `No. ${title} works in any modern web browser — no software, extension, or account needed.`,
    },
  ];
}
