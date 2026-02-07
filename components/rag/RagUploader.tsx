"use client";

import { useState, ChangeEvent } from "react";

export default function RagUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Helper to format file sizes professionally
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rag/ingest/pdf`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Server error during ingestion");
      }

      await res.json(); 
      alert("Success: Document indexed successfully");
      setSelectedFile(null);
      (e.target as HTMLFormElement).reset(); 
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("Upload Failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form 
      onSubmit={handleUpload} 
      className="bg-white p-10 rounded-2xl border-2 border-zinc-300 shadow-sm flex flex-col h-full"
    >
      <div className="mb-8 border-b-2 border-zinc-100 pb-6">
        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Ingest Knowledge</h2>
        <p className="text-lg text-zinc-500 mt-2">Upload PDF documents to the RAG vector store.</p>
      </div>

      <div className="space-y-8 flex-1">
        <div className="relative">
          <label className="block text-base font-bold text-zinc-800 mb-3">
            Source PDF File
          </label>
          <input 
            type="file" 
            name="file" 
            required 
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full border-2 border-zinc-200 rounded-xl p-4 text-base bg-zinc-50 hover:border-zinc-400 transition-colors file:mr-4 file:py-2 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-zinc-900 file:text-white hover:file:bg-black cursor-pointer"
          />
        </div>

        {/* File Information Display */}
        {selectedFile && (
          <div className="bg-zinc-50 border-2 border-zinc-200 rounded-xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-base font-bold text-zinc-900 truncate uppercase tracking-tight">
                {selectedFile.name}
              </p>
              <p className="text-sm font-medium text-zinc-500 mt-1">
                Size: <span className="text-zinc-700">{formatFileSize(selectedFile.size)}</span>
              </p>
            </div>
          </div>
        )}

        {!selectedFile && (
          <div className="bg-zinc-50 p-6 rounded-xl border-2 border-zinc-200 border-dashed flex flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-400 font-medium">No file selected. Please choose a PDF to begin.</p>
          </div>
        )}
      </div>

      <button 
        className="mt-10 w-full bg-zinc-900 text-white border-2 border-zinc-900 px-8 py-5 rounded-xl font-bold text-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        disabled={isUploading || !selectedFile}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Ingesting {selectedFile?.name.slice(0, 10)}...
          </span>
        ) : (
          "Upload & Ingest"
        )}
      </button>
    </form>
  );
}