import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "mr";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    myClaims: "My Claims",
    documents: "Documents",
    help: "Help",
    profile: "Profile",
    startNewClaim: "+ Start New Claim",
    activeClaims: "Active Claims",
    potentialIssues: "Potential Issues",
    readyToSubmit: "Ready to Submit",
    disclaimer:
      "This tool provides general information and document assistance based on the information and documents provided by the user. It does not constitute legal advice, determine eligibility, approve or reject claims, or replace a qualified lawyer, insurer, government authority, or agricultural professional. Users should verify important requirements and decisions with the relevant authority.",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    myClaims: "मेरे दावे",
    documents: "दस्तावेज़",
    help: "सहायता",
    profile: "प्रोफ़ाइल",
    startNewClaim: "+ नया दावा शुरू करें",
    activeClaims: "सक्रिय दावे",
    potentialIssues: "संभावित समस्याएँ",
    readyToSubmit: "जमा करने के लिए तैयार",
    disclaimer:
      "यह टूल उपयोगकर्ता द्वारा दी गई जानकारी और दस्तावेज़ों के आधार पर सामान्य जानकारी और दस्तावेज़ सहायता प्रदान करता है। यह कानूनी सलाह नहीं है, पात्रता तय नहीं करता, दावे स्वीकृत/अस्वीकृत नहीं करता, और किसी वकील, बीमाकर्ता, सरकारी प्राधिकरण या कृषि विशेषज्ञ का स्थान नहीं लेता। महत्वपूर्ण आवश्यकताओं की पुष्टि संबंधित प्राधिकरण से करें।",
  },
  mr: {
    dashboard: "डॅशबोर्ड",
    myClaims: "माझे दावे",
    documents: "कागदपत्रे",
    help: "मदत",
    profile: "प्रोफाइल",
    startNewClaim: "+ नवीन दावा सुरू करा",
    activeClaims: "सक्रिय दावे",
    potentialIssues: "संभाव्य समस्या",
    readyToSubmit: "सादर करण्यास तयार",
    disclaimer:
      "हे साधन वापरकर्त्याने दिलेल्या माहिती आणि कागदपत्रांच्या आधारे सामान्य माहिती आणि दस्तऐवज सहाय्य पुरवते. हे कायदेशीर सल्ला नाही, पात्रता ठरवत नाही, दावे मंजूर/नामंजूर करत नाही, आणि वकील, विमा कंपनी, सरकारी प्राधिकरण किंवा कृषी तज्ञाची जागा घेत नाही. महत्त्वाच्या बाबी संबंधित प्राधिकरणाकडून पडताळून घ्या.",
  },
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>((localStorage.getItem("kp_lang") as Lang) || "en");

  function update(l: Lang) {
    setLang(l);
    localStorage.setItem("kp_lang", l);
  }

  function t(key: string) {
    return dict[lang][key] ?? dict.en[key] ?? key;
  }

  return <LangContext.Provider value={{ lang, setLang: update, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}

export const LANG_LABELS: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };
