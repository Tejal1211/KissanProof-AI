export function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-kp-ink/80">
      <h1 className="text-2xl font-bold text-kp-green-900">Privacy</h1>
      <p className="mt-4">
        KisanProof AI stores the documents and claim details you provide so that your report and chat history are
        available when you return. Your claims and documents are only visible to you, except that a demo "official
        review" role can see anonymized aggregate patterns and individual claim analyses in this hackathon build —
        clearly labeled as demonstration functionality, not a real government system.
      </p>
      <p className="mt-4">
        Documents are sent to a third-party GenAI provider such as Anthropic or Google Gemini for text analysis. We do
        not sell your data or use it to train models beyond what the provider's own policies describe. You can delete
        your documents at any time from the Documents page.
      </p>
      <p className="mt-4">
        This is a hackathon prototype. Please avoid uploading highly sensitive personal documents beyond what's
        needed to demonstrate the product.
      </p>
    </div>
  );
}
