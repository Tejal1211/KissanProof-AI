import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wheat, CloudRain, Coins, Landmark, FileText, Mic, Upload } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useLang } from "../i18n";
import type { Claim, ClaimType, StoredDocument } from "../types";

const CLAIM_TYPES: { value: ClaimType; label: string; icon: typeof Wheat }[] = [
  { value: "crop_insurance", label: "Crop Insurance", icon: Wheat },
  { value: "disaster_compensation", label: "Disaster Compensation", icon: CloudRain },
  { value: "agricultural_subsidy", label: "Agricultural Subsidy", icon: Coins },
  { value: "government_scheme", label: "Government Scheme", icon: Landmark },
  { value: "other", label: "Other", icon: FileText },
];

export function NewClaim() {
  const [step, setStep] = useState(1);
  const [claimType, setClaimType] = useState<ClaimType | null>(null);
  const [crop, setCrop] = useState("");
  const [location, setLocation] = useState("");
  const [farmArea, setFarmArea] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<StoredDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const { lang } = useLang();
  const navigate = useNavigate();

  function toggleVoiceInput() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input isn't supported in this browser. Please type your description instead.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setEventDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  }

  async function handleUploadAndCreate() {
    if (!claimType) return;
    setError(null);
    setUploading(true);
    try {
      let documentIds: string[] = [];
      if (files.length > 0) {
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        const uploadResult = await api.post<{ documents: StoredDocument[] }>("/documents/upload", form);
        documentIds = uploadResult.documents.map((d) => d.id);
        setUploadedDocs(uploadResult.documents);
        await api.post("/documents/process", { documentIds });
      }

      const { claim } = await api.post<{ claim: Claim }>("/claims", {
        claimType,
        crop,
        location,
        farmArea,
        eventDescription,
        eventDate,
        documentIds,
      });

      setAnalyzing(true);
      await api.post(`/claims/${claim.id}/analyze`, { language: lang });
      navigate(`/claim/${claim.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't complete the analysis. Please try again.");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ol className="mb-8 flex gap-2 text-xs font-medium text-kp-ink/60" aria-label="Progress">
        {["Claim type", "Your situation", "Upload documents"].map((label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? "step" : undefined}
            className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-kp-green-700 text-white" : "bg-kp-green-50"}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section>
          <h1 className="text-2xl font-bold text-kp-green-900">What are you trying to claim?</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CLAIM_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setClaimType(value)}
                aria-pressed={claimType === value}
                className={`card flex items-center gap-3 text-left focus-ring ${
                  claimType === value ? "border-kp-green-700 ring-1 ring-kp-green-700" : ""
                }`}
              >
                <Icon className="h-5 w-5 text-kp-green-700" aria-hidden="true" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
          <button disabled={!claimType} className="btn-primary mt-8" onClick={() => setStep(2)}>
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="text-2xl font-bold text-kp-green-900">Tell us about your situation</h1>
          <div className="mt-6 space-y-4">
            <Field label="Crop" value={crop} onChange={setCrop} />
            <Field label="Location / State" value={location} onChange={setLocation} />
            <Field label="Approximate farm area" value={farmArea} onChange={setFarmArea} placeholder="e.g. 2.5 hectares" />
            <Field label="Date of event" value={eventDate} onChange={setEventDate} placeholder="e.g. 14/07/2026" />
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="eventDesc" className="block text-sm font-medium text-kp-ink">
                  Event / problem description
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  aria-pressed={listening}
                  className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-kp-green-700 hover:bg-kp-green-50"
                >
                  <Mic className="h-3.5 w-3.5" aria-hidden="true" /> {listening ? "Listening…" : "Ask by Voice"}
                </button>
              </div>
              <textarea
                id="eventDesc"
                rows={4}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-kp-earth-100 px-3 py-2"
                placeholder="Describe what happened, in your own words. You can edit the text after using voice input."
              />
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn-primary" onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 className="text-2xl font-bold text-kp-green-900">Upload your documents</h1>
          <p className="mt-1 text-sm text-kp-ink/70">
            PDF, JPG, PNG, or TXT. Examples: insurance policy, land record, application form, government notice,
            crop damage evidence.
          </p>

          <label
            htmlFor="fileInput"
            className="focus-ring mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-kp-earth-100 px-6 py-10 text-center hover:border-kp-green-700"
          >
            <Upload className="h-6 w-6 text-kp-green-700" aria-hidden="true" />
            <span className="text-sm font-medium text-kp-green-900">Click to choose files</span>
            <span className="text-xs text-kp-ink/60">Up to 8 files, 10 MB each</span>
            <input
              id="fileInput"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.txt"
              className="sr-only"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
          </label>

          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-kp-ink/80">
              {files.map((f) => (
                <li key={f.name}>{f.name}</li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <button className="btn-secondary" onClick={() => setStep(2)} disabled={uploading || analyzing}>
              Back
            </button>
            <button className="btn-primary" onClick={handleUploadAndCreate} disabled={uploading || analyzing}>
              {analyzing ? "Analyzing your documents…" : uploading ? "Uploading…" : "Analyze My Claim"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-kp-ink">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring mt-1 w-full rounded-md border border-kp-earth-100 px-3 py-2"
      />
    </div>
  );
}
