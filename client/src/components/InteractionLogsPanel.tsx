import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  clientId: number;
}

const eventTypeLabels: Record<string, string> = {
  scan: "Scan via",
  quiz_completed: "Quiz Completed",
  quiz_started: "Quiz Started",
  review_click: "Clicked",
  review_generated: "Review Generated",
};

export default function InteractionLogsPanel({ clientId }: Props) {
  const { data: logs, isLoading } = trpc.logs.list.useQuery({ clientId, limit: 10 });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        Recent Interaction Logs (Anonymized)
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Aucun log d'interaction pour ce client.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {logs.map((log) => {
            const time = format(new Date(log.createdAt), "HH:mm", { locale: fr });
            const label = eventTypeLabels[log.eventType] ?? log.eventType;
            return (
              <div
                key={log.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="text-gray-700">
                  <span className="font-medium text-gray-500">{time}</span>
                  {" — "}
                  {label} {log.message}
                </span>
                {log.metadata && (
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {(() => {
                      try {
                        const meta = JSON.parse(log.metadata);
                        return meta.label ?? "";
                      } catch {
                        return "";
                      }
                    })()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
