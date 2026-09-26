import { ShieldAlert } from "lucide-react";
import { useLang } from "../i18n";

export function DisclaimerBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  return (
    <div
      role="note"
      aria-label="Legal disclaimer"
      className={`flex gap-3 rounded-md border border-kp-earth-100 bg-kp-earth-50 text-kp-ink ${
        compact ? "p-3 text-xs" : "p-4 text-sm"
      }`}
    >
      <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-kp-earth-600" aria-hidden="true" />
      <p>{t("disclaimer")}</p>
    </div>
  );
}
