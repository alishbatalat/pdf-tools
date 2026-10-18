const steps = [
  { number: "01", title: "Choose your tool", body: "Start with what you need to do: organize pages, convert a file, or work with its content." },
  { number: "02", title: "Add your document", body: "Select your file and adjust the options. Each tool explains which formats it supports." },
  { number: "03", title: "Save the result", body: "Download your finished file and carry on with your work. No software to install." },
];
export default function TrustStrip() {
  return <section id="about" className="how-section"><div className="how-inner"><div className="how-title"><p className="eyebrow">HOW IT WORKS</p><h2>From file<br />to finished.</h2></div><div className="how-steps">{steps.map(step => <div key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></div>)}</div></div></section>;
}

