import RagUploader from "@/components/rag/RagUploader";
import RagQuery from "@/components/rag/RagQuery";

export default function RagPage() {
  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
         <h1 className="text-2xl font-bold tracking-tight text-foreground">RAG Management</h1>
         <p className="text-muted-foreground mt-1">Manage your documents and test retrieving context.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <RagUploader />
         <RagQuery />
      </div>
    </div>
  );
}