import { trpc } from "@/lib/trpc";
import { Shield, User, Database, Globe } from "lucide-react";

export default function SettingsPage() {
  const { data: user } = trpc.auth.me.useQuery();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Compte Visigold</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Nom</p>
              <p className="text-sm font-medium text-gray-900">{user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rôle</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
              </span>
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Plateforme</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Produit</p>
              <p className="text-sm font-medium text-gray-900">Visigold Dashboard SaaS</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Hébergement</p>
              <p className="text-sm font-medium text-gray-900">Infomaniak / Netlify</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Version</p>
              <p className="text-sm font-medium text-gray-900">1.0.0 — MVP</p>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Base de données</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Moteur</p>
              <p className="text-sm font-medium text-gray-900">MySQL (Drizzle ORM)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tables</p>
              <p className="text-sm font-medium text-gray-900">10 tables — multi-clients isolées</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Isolation</p>
              <p className="text-sm font-medium text-gray-900">client_id sur toutes les tables métier</p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Sécurité</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Accès</p>
              <p className="text-sm font-medium text-gray-900">Réservé à l'équipe Visigold</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Authentification</p>
              <p className="text-sm font-medium text-gray-900">OAuth 2.0 (Manus)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Logs</p>
              <p className="text-sm font-medium text-gray-900">Anonymisés — aucune donnée personnelle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
