import { AlertTriangle, LoaderCircle, PackageOpen } from "lucide-react";
export function LoadingView({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="status-view">
      <LoaderCircle className="spin" size={24} />
      <p>{label}</p>
    </div>
  );
}
export function EmptyView({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="status-view">
      <PackageOpen size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function ErrorView({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="status-view error">
      <AlertTriangle size={26} />
      <strong>Data belum dapat dimuat</strong>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Coba lagi
        </button>
      )}
    </div>
  );
}
