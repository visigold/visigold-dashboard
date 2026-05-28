import { useClientContext } from "@/contexts/ClientContext";
import QuizManagementPanel from "@/components/QuizManagementPanel";
import { trpc } from "@/lib/trpc";

export default function QuizPage() {
  const { selectedClientId } = useClientContext();
  const { data: clientData } = trpc.clients.get.useQuery(
    { id: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  if (!selectedClientId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Sélectionnez un client pour gérer son quiz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
      <div className="max-w-2xl">
        <QuizManagementPanel
          clientId={selectedClientId}
          clientName={clientData?.name ?? "Client"}
        />
      </div>
    </div>
  );
}
