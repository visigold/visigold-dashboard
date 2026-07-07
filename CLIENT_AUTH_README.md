# Système d'Authentification Client VISIGOLD

## Vue d'ensemble

Ce document décrit le système d'authentification client permettant à chaque client VISIGOLD d'accéder à son propre tableau de bord de performance de manière sécurisée.

## Architecture

### Backend

#### Authentification (`server/auth/clientAuth.ts`)

- **`hashPassword(password)`** : Hache un mot de passe avec bcrypt (10 rounds)
- **`verifyPassword(password, hash)`** : Vérifie qu'un mot de passe correspond à son hash
- **`authenticateClient(username, password)`** : Authentifie un client et retourne son ID
- **`setClientCredentials(clientId, username, password)`** : Crée ou met à jour les identifiants d'un client
- **`disableClientAccess(clientId)`** : Désactive l'accès client

#### Sessions (`server/auth/clientSession.ts`)

- **`generateClientToken(clientId, username)`** : Génère un JWT valide 7 jours
- **`verifyClientToken(token)`** : Vérifie et décode un JWT
- **`extractTokenFromHeader(req)`** : Extrait le token du header Authorization
- **`clientAuthMiddleware(req, res, next)`** : Middleware optionnel pour vérifier l'authentification
- **`requireClientAuth(req, res, next)`** : Middleware pour exiger l'authentification

#### Routers TRPC (`server/routers.ts`)

**Client Auth Router:**
- `clientAuth.login` : Mutation pour se connecter (retourne un JWT)

**Clients Router:**
- `clients.setCredentials` : Mutation pour configurer les identifiants d'un client (admin)
- `clients.disableAccess` : Mutation pour désactiver l'accès d'un client (admin)

### Frontend

#### Pages

**ClientLoginPage** (`client/src/pages/ClientLoginPage.tsx`)
- Formulaire de connexion sécurisé
- Stockage du token JWT dans localStorage
- Redirection vers le dashboard après authentification

**ClientDashboardPage** (`client/src/pages/ClientDashboardPage.tsx`)
- Tableau de bord filtré pour afficher uniquement les données du client connecté
- Visualisations des scans par emplacement (QR codes)
- Évolution des performances sur plusieurs mois
- Données anonymes conformes à la LPD

**AdminClientAccessPage** (`client/src/pages/AdminClientAccessPage.tsx`)
- Interface pour gérer les accès clients
- Configuration des identifiants
- Activation/désactivation des accès

## Flux d'Authentification

### 1. Configuration Initiale (Admin)

```
Admin → AdminClientAccessPage
  ↓
Sélectionne un client
  ↓
Entre username + password
  ↓
Appelle clients.setCredentials
  ↓
Backend hache le password avec bcrypt
  ↓
Stocke username + hash dans la base de données
  ↓
Définit clientAccessEnabled = true
```

### 2. Connexion Client

```
Client → ClientLoginPage
  ↓
Entre username + password
  ↓
Appelle clientAuth.login
  ↓
Backend vérifie les credentials
  ↓
Génère un JWT valide 7 jours
  ↓
Retourne le token
  ↓
Frontend stocke le token dans localStorage
  ↓
Redirection vers ClientDashboardPage
```

### 3. Accès au Dashboard

```
Client → ClientDashboardPage
  ↓
Récupère clientId et token du localStorage
  ↓
Appelle dashboard.stats avec clientId
  ↓
Backend retourne uniquement les données du client
  ↓
Affichage du tableau de bord filtré
```

## Sécurité

### Mots de Passe

- **Hachage** : Bcrypt avec 10 rounds de salting
- **Stockage** : Seul le hash est stocké, jamais le mot de passe en clair
- **Validation** : Minimum 8 caractères requis

### Tokens JWT

- **Signature** : HS256 avec une clé secrète
- **Expiration** : 7 jours
- **Stockage** : localStorage (attention aux XSS)
- **Transmission** : Header Authorization: Bearer {token}

### Filtrage des Données

- Chaque client ne peut voir que ses propres données
- Le clientId est extrait du JWT et utilisé pour filtrer les requêtes
- Aucune donnée personnelle n'est collectée (conformité LPD)

## Variables d'Environnement

```env
JWT_SECRET=your-secret-key-change-in-production
```

⚠️ **Important** : Changer la clé secrète en production !

## Base de Données

### Schéma `clients`

```sql
ALTER TABLE `clients` ADD COLUMN `clientUsername` VARCHAR(100) UNIQUE;
ALTER TABLE `clients` ADD COLUMN `clientPassword` VARCHAR(255);
ALTER TABLE `clients` ADD COLUMN `clientAccessEnabled` BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX `idx_clientUsername` ON `clients` (`clientUsername`);
```

## Intégration Frontend

### Routes Recommandées

```typescript
// client/src/App.tsx
import { ClientLoginPage } from "./pages/ClientLoginPage";
import { ClientDashboardPage } from "./pages/ClientDashboardPage";
import { AdminClientAccessPage } from "./pages/AdminClientAccessPage";

// Routes
<Route path="/client-login" element={<ClientLoginPage />} />
<Route path="/client-dashboard" element={<ClientDashboardPage />} />
<Route path="/admin/client-access" element={<AdminClientAccessPage />} />
```

### Utilisation du Token

```typescript
// Récupérer le token
const token = localStorage.getItem("clientToken");

// Passer le token dans les requêtes TRPC
const headers = {
  Authorization: `Bearer ${token}`,
};

// Le backend extrait le token et valide l'authentification
```

## Déploiement

### Checklist

- [ ] Changer `JWT_SECRET` en production
- [ ] Configurer HTTPS (obligatoire pour localStorage)
- [ ] Mettre à jour les migrations Drizzle
- [ ] Tester le flux de connexion complet
- [ ] Documenter les identifiants admin
- [ ] Configurer les logs d'authentification

## Exemples d'Utilisation

### Configuration d'un Client

```typescript
// Admin configure l'accès pour un client
await trpc.clients.setCredentials.mutate({
  clientId: 123,
  username: "restaurant-paris",
  password: "SecurePassword123!",
});
```

### Connexion d'un Client

```typescript
// Client se connecte
const result = await trpc.clientAuth.login.mutate({
  username: "restaurant-paris",
  password: "SecurePassword123!",
});

// Stockage du token
localStorage.setItem("clientToken", result.token);
localStorage.setItem("clientId", result.clientId);
```

### Accès au Dashboard

```typescript
// Le dashboard récupère les données du client
const { data: stats } = trpc.dashboard.stats.useQuery({
  clientId: parseInt(localStorage.getItem("clientId")!),
  month: "2026-07",
});
```

## Conformité LPD

- ✅ Aucune donnée personnelle collectée
- ✅ Données anonymes par défaut
- ✅ Authentification sécurisée
- ✅ Accès limité aux propres données du client
- ✅ Mots de passe hachés
- ✅ Tokens JWT avec expiration

## Support et Maintenance

Pour toute question ou problème :

1. Vérifier les logs du serveur
2. Consulter le fichier `.env` pour les variables d'environnement
3. Tester la connexion à la base de données
4. Vérifier la validité du JWT_SECRET

---

**Version** : 1.0  
**Date** : 2026-07-07  
**Auteur** : VISIGOLD Development Team
