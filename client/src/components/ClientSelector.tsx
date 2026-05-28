import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useClientContext } from "@/contexts/ClientContext";
import { ChevronDown } from "lucide-react";

export default function ClientSelector() {
  const { selectedClientId, setSelectedClientId } = useClientContext();
  const { data: clients } = trpc.clients.list.useQuery();

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId, setSelectedClientId]);

  const selectedClient = clients?.find((c) => c.id === selectedClientId);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">Client :</span>
      <div className="relative">
        <select
          value={selectedClientId ?? ""}
          onChange={(e) => setSelectedClientId(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-800 cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
        >
          {!clients || clients.length === 0 ? (
            <option value="">Aucun client</option>
          ) : (
            clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {selectedClient && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          {selectedClient.status === "active" ? "Actif" : "Inactif"}
        </span>
      )}
    </div>
  );
}
