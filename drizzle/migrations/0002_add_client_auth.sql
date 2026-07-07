-- Migration: Ajouter les champs d'authentification client
-- Date: 2026-07-07

ALTER TABLE `clients` ADD COLUMN `clientUsername` VARCHAR(100) UNIQUE;
ALTER TABLE `clients` ADD COLUMN `clientPassword` VARCHAR(255);
ALTER TABLE `clients` ADD COLUMN `clientAccessEnabled` BOOLEAN DEFAULT FALSE NOT NULL;

-- Index pour la recherche rapide par username
CREATE INDEX `idx_clientUsername` ON `clients` (`clientUsername`);
