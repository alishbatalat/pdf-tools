export default function ProgressBar({ label }: { label: string }) {
  return (
    <div className="progress-wrap" role="status" aria-live="polite">
      <div className="progress-bar" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
