import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Pencil, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId: number;
  clientName: string;
  leadCollectionEnabled?: boolean;
  privacyPolicyUrl?: string | null;
  consentText?: string | null;
}

export default function QuizManagementPanel({ clientId, clientName, leadCollectionEnabled, privacyPolicyUrl, consentText }: Props) {
  const { data: quiz, refetch } = trpc.quiz.getActive.useQuery({ clientId });
  const updateMutation = trpc.quiz.updateQuestion.useMutation({
    onSuccess: () => {
      toast.success("Quiz mis à jour avec succès");
      refetch();
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const firstQuestion = quiz?.questions?.[0];
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    if (firstQuestion) {
      setQuestionText(firstQuestion.questionText);
      setOptions(firstQuestion.options.map((o: { id: number; label: string }) => ({ id: o.id, label: o.label })));
    }
  }, [firstQuestion]);

  const handleUpdate = () => {
    if (!firstQuestion) return;
    updateMutation.mutate({
      questionId: firstQuestion.id,
      questionText,
      options,
    });
  };

  const optionLetters = ["A", "B", "C", "D", "E"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        Quiz Management ({clientName})
      </h3>

      <div className="flex gap-4">
        {/* Smartphone mockup */}
        <div className="flex-shrink-0">
          <div className="w-28 h-52 bg-gray-900 rounded-2xl p-1 shadow-lg relative">
            <div className="w-full h-full bg-white rounded-xl overflow-hidden flex flex-col">
              {/* Phone header */}
              <div className="bg-blue-600 px-2 py-1.5">
                <div className="w-8 h-1 bg-white/40 rounded mx-auto mb-1" />
                <div className="w-12 h-8 bg-gray-200 rounded mx-auto overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-blue-200 to-blue-400" />
                </div>
              </div>
              {/* Question */}
              <div className="flex-1 p-1.5">
                <p className="text-[6px] font-semibold text-gray-800 leading-tight mb-1.5">
                  {questionText || "Quel est le service que vous appréciez le plus dans notre garage ?"}
                </p>
                <div className="space-y-1">
                  {(options.length > 0 ? options : [{ id: 0, label: "Accueil" }, { id: 1, label: "Rapidité" }, { id: 2, label: "Prix" }]).slice(0, 3).map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`text-[5px] px-1.5 py-0.5 rounded text-white font-medium ${
                        i === 0 ? "bg-blue-500" : i === 1 ? "bg-blue-400" : "bg-blue-300"
                      }`}
                    >
                      {optionLetters[i]}. {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Phone notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-gray-700 rounded-full" />
          </div>
          <div className="flex justify-center mt-1">
            <Smartphone className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-600 mb-1">Edit Current Question</p>
          <p className="text-[10px] text-gray-400 mb-1">Current:</p>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            rows={3}
            placeholder="Texte de la question..."
          />

          <p className="text-[10px] text-gray-400 mt-2 mb-1">Choice:</p>
          <div className="space-y-1.5">
            {options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 w-5 flex-shrink-0">
                  {optionLetters[i]}.
                </span>
                <input
                  value={opt.label}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setOptions(updated);
                  }}
                  className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Pencil className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>

          <button
            onClick={handleUpdate}
            disabled={updateMutation.isPending || !firstQuestion}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Update Quiz
          </button>

          {!quiz && (
            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Aucun quiz actif pour ce client.
            </p>
          )}

          {/* Section consentement LPD */}
          {leadCollectionEnabled && (
            <div className="mt-3 border-t border-orange-100 pt-3">
              <p className="text-[9px] font-semibold text-[#f26522] mb-1.5 flex items-center gap-1">
                🛡️ Collecte de leads activée
              </p>
              <div className="bg-orange-50 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <div className="w-3 h-3 border border-orange-400 rounded flex-shrink-0 mt-0.5 bg-white" />
                  <p className="text-[9px] text-gray-600 leading-tight">
                    {consentText || "J'accepte que mes réponses soient utilisées pour améliorer nos services."}
                    {privacyPolicyUrl && (
                      <> <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Politique de confidentialité</a></>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-[8px] text-orange-500 mt-1">✓ Conforme LPD suisse</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
