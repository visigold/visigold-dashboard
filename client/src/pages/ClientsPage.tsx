import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Building2, MapPin, Tag, CheckCircle, XCircle, QrCode, Download, X, Edit2, Save } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

const QR_SOURCES = ["comptoir", "vitrine", "salle-attente", "caisse", "entrée", "table"];

function QRModal({ client, onClose, isQuiz }: { client: { id: number; name: string; slug: string }; onClose: () => void; isQuiz?: boolean }) {
  const [selectedSource, setSelectedSource] = useState("comptoir");
  const [customSource, setCustomSource] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  const baseUrl = window.location.origin;
  const source = customSource || selectedSource;
  // Pour le quiz, l'URL pointe vers /quiz/slug/ ; pour la réputation, vers /scan/slug?source=...
  const qrUrl = isQuiz
    ? `${baseUrl}/${client.slug}/`
    : `${baseUrl}/scan/${client.slug}?source=${source}`;

  const generateQR = async () => {
    if (!canvasRef.current) return;
    await QRCode.toCanvas(canvasRef.current, qrUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#1a3a6b", light: "#ffffff" },
    });
    setGenerated(true);
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-${client.slug}-${source}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast.success(`QR code téléchargé — ${client.name} / ${source}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
          {isQuiz ? '🎯 QR Code Quiz Viral' : '⭐ QR Code Réputation'}
        </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs font-semibold text-blue-700">{client.name}</p>
          <p className="text-xs text-blue-500 break-all mt-0.5">{qrUrl}</p>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">Emplacement du QR code</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QR_SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => { setSelectedSource(s); setCustomSource(""); setGenerated(false); }}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  selectedSource === s && !customSource
                    ? "bg-[#1a3a6b] text-white border-[#1a3a6b]"
                    : "border-gray-200 text-gray-600 hover:border-[#1a3a6b]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={customSource}
            onChange={(e) => { setCustomSource(e.target.value); setGenerated(false); }}
            placeholder="Ou saisir un emplacement personnalisé..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
          />
        </div>

        <div className="flex justify-center mb-4">
          <canvas ref={canvasRef} className="rounded-lg border border-gray-100" />
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateQR}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Générer
          </button>
          {generated && (
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 bg-[#f26522] hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EditClientModal({ client, onClose, onSaved }: {
  client: { id: number; name: string; slug: string; industry?: string | null; city?: string | null; googlePlaceId?: string | null; privacyPolicyUrl?: string | null; leadCollectionEnabled?: boolean; consentText?: string | null };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name,
    industry: client.industry ?? "",
    city: client.city ?? "",
    googlePlaceId: client.googlePlaceId ?? "",
    privacyPolicyUrl: client.privacyPolicyUrl ?? "",
    leadCollectionEnabled: client.leadCollectionEnabled ?? false,
    consentText: client.consentText ?? "J'accepte que mes réponses soient utilisées pour améliorer nos services.",
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Client mis à jour"); onSaved(); onClose(); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Modifier le client</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nom</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Secteur</label>
            <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              placeholder="Garage automobile" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Ville</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              placeholder="Clarens" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Google Place ID
              <span className="text-gray-400 font-normal ml-1">(pour la redirection vers Google Reviews)</span>
            </label>
            <input value={form.googlePlaceId} onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
              placeholder="ChIJxxxxxxxxxxxxxxxxx" />
            <p className="text-xs text-gray-400 mt-1">
              Trouvez-le sur <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Place ID Finder</a>
            </p>
          </div>

          {/* Section LPD */}
          <div className="border-t border-gray-100 pt-3 mt-1">
            <p className="text-xs font-semibold text-[#1a3a6b] mb-2 flex items-center gap-1">
              🛡️ Conformité LPD — Collecte de leads
            </p>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div
                onClick={() => setForm({ ...form, leadCollectionEnabled: !form.leadCollectionEnabled })}
                className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                  form.leadCollectionEnabled ? "bg-[#f26522]" : "bg-gray-200"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.leadCollectionEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Activer la collecte de leads</p>
                <p className="text-xs text-gray-400">Affiche une case de consentement dans le quiz</p>
              </div>
            </label>
            {form.leadCollectionEnabled && (
              <>
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    URL Politique de confidentialité
                  </label>
                  <input value={form.privacyPolicyUrl} onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })}
                    className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26522]"
                    placeholder="https://visigold.ch/confidentialite" />
                  <p className="text-xs text-gray-400 mt-0.5">Lien vers votre politique de confidentialité (obligatoire LPD)</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Texte de consentement
                  </label>
                  <textarea value={form.consentText} onChange={(e) => setForm({ ...form, consentText: e.target.value })}
                    className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f26522] resize-none"
                    rows={2}
                    placeholder="J'accepte que mes réponses soient utilisées pour améliorer nos services." />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => updateMutation.mutate({ id: client.id, ...form })}
            disabled={updateMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { data: clients, refetch } = trpc.clients.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [qrClient, setQrClient] = useState<{ id: number; name: string; slug: string } | null>(null);
  const [qrQuizClient, setQrQuizClient] = useState<{ id: number; name: string; slug: string } | null>(null);
  type ClientType = NonNullable<typeof clients>[number];
  const [editClient, setEditClient] = useState<ClientType | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", industry: "", city: "", googlePlaceId: "" });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      toast.success("Client créé avec succès");
      setShowForm(false);
      setForm({ name: "", slug: "", industry: "", city: "", googlePlaceId: "" });
      refetch();
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Statut mis à jour"); refetch(); },
  });

  const handleCreate = () => {
    if (!form.name || !form.slug) return toast.error("Nom et slug requis");
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {qrClient && <QRModal client={qrClient} onClose={() => setQrClient(null)} />}
      {qrQuizClient && (
        <QRModal
          client={{ ...qrQuizClient, slug: `quiz/${qrQuizClient.slug}` }}
          onClose={() => setQrQuizClient(null)}
          isQuiz={true}
        />
      )}
      {editClient && (
        <EditClientModal
          client={editClient as { id: number; name: string; slug: string; industry?: string | null; city?: string | null; googlePlaceId?: string | null }}
          onClose={() => setEditClient(null)}
          onSaved={refetch}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Créer un nouveau client</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nom *</label>
              <input value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
                placeholder="Garage Schmitt" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Slug * (identifiant unique)</label>
              <input value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
                placeholder="garage-schmitt" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Secteur</label>
              <input value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
                placeholder="Garage automobile" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ville</label>
              <input value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
                placeholder="Clarens" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Google Place ID</label>
              <input value={form.googlePlaceId}
                onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
                placeholder="ChIJxxxxxxxxxxxxxxxxx" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} disabled={createMutation.isPending}
              className="bg-[#1a3a6b] hover:bg-[#0f2347] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              Créer
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Secteur / Ville</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Google Place ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Statut</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!clients || clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  Aucun client. Créez votre premier client ci-dessus.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#1a3a6b]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-400">{client.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {client.industry && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Tag className="w-3 h-3 text-gray-400" />{client.industry}
                        </div>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="w-3 h-3 text-gray-400" />{client.city}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {client.googlePlaceId ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ Configuré
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                        Non configuré
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      client.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {client.status === "active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {client.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQrClient({ id: client.id, name: client.name, slug: client.slug })}
                        className="flex items-center gap-1 text-xs text-[#1a3a6b] hover:text-[#f26522] font-medium transition-colors"
                        title="QR Code Réputation"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="text-[#1a3a6b]">Réputation</span>
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => setQrQuizClient({ id: client.id, name: client.name, slug: client.slug })}
                        className="flex items-center gap-1 text-xs text-[#f26522] hover:text-orange-600 font-medium transition-colors"
                        title="QR Code Quiz Viral"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Quiz Viral</span>
                      </button>
                      </div>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => setEditClient(client as typeof editClient)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1a3a6b] font-medium transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => updateMutation.mutate({ id: client.id, status: client.status === "active" ? "inactive" : "active" })}
                        className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                      >
                        {client.status === "active" ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
