# Visigold Dashboard SaaS — TODO

## Phase 1 — Schéma base de données
- [x] Ajouter tables: clients, scan_events, review_events, quizzes, quiz_questions, quiz_options, quiz_sessions, interaction_logs, monthly_reports
- [x] Migrer le schéma en base

## Phase 2 — Routes API (tRPC)
- [x] Router clients (list, create, update)
- [x] Router dashboard (stats par client: scans, reviews, quiz completion)
- [x] Router quiz (get, update question + options)
- [x] Router logs (list anonymisés par client)
- [x] Router reports (generate PDF, list)

## Phase 3 — Layout principal
- [x] Sidebar navigation (Home, Clients, Performance, Quiz Management, Reports, Settings)
- [x] Header avec sélecteur client dynamique
- [x] Protection de route (accès Visigold uniquement)

## Phase 4 — Dashboard Home
- [x] Graphique linéaire Monthly Scan Traffic (Recharts)
- [x] Carte Google Reviews Generated (compteur + note moyenne)
- [x] Jauge circulaire Quiz Completion Rate
- [x] Section Quiz Management (mockup smartphone + éditeur)
- [x] Interaction Logs (tableau anonymisé)
- [x] Bouton Generate PDF + section Monthly Report

## Phase 5 — Pages secondaires
- [x] Page Clients (liste, ajout, modification)
- [x] Page Performance (graphiques détaillés)
- [x] Page Quiz Management (éditeur complet)
- [x] Page Reports (historique PDF)
- [x] Page Settings (paramètres)

## Phase 6 — Qualité
- [x] Seed de données démo (2 clients: Garage Schmitt, Boulangerie Dupont)
- [x] Tests vitest pour les routers principaux (10 tests passés)
- [x] Responsive design vérifié
- [x] Checkpoint final (version e68173d9)
