/* ============================================================
   INIT SQL (MySQL 8) — Multi-dueños + Roles + Catálogos editables
   - Admin global (acceso total)
   - Dueños por tenant (cada dueño solo su negocio)
   - Empleados sujetos a dueño (managerUserId)
   - Catálogos editables: sabores de pan y rellenos (por tenant)
   - Auditoría + sesiones + pagos múltiples + soft delete
   ============================================================ */

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- DROP (para inicialización limpia)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS folio_payments;
DROP TABLE IF EXISTS folio_edit_histories;
DROP TABLE IF EXISTS folios;
DROP TABLE IF EXISTS fillings;
DROP TABLE IF EXISTS cake_flavors;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS tenant_users;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;

-- ------------------------------------------------------------
-- TENANTS (negocios)
-- ------------------------------------------------------------
CREATE TABLE tenants (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  legalName VARCHAR(255) NULL,
  taxId VARCHAR(50) NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenants_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- USERS (rol global)
-- globalRole:
--   ADMIN  => acceso total a todo
--   USER   => acceso via tenant_users
-- ------------------------------------------------------------
CREATE TABLE users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt recomendado
  globalRole ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  lastLoginAt DATETIME NULL,
  passwordChangedAt DATETIME NULL,
  mustChangePassword TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_active (isActive, deletedAt),
  KEY idx_users_role (globalRole)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- TENANT_USERS (rol por negocio)
-- tenantRole:
--   OWNER     => dueño del tenant (ve todo del tenant y gestiona empleados)
--   EMPLOYEE  => empleado (acceso limitado por app) sujeto a managerUserId
-- ------------------------------------------------------------
CREATE TABLE tenant_users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  userId BIGINT NOT NULL,
  tenantRole ENUM('OWNER','EMPLOYEE') NOT NULL,
  managerUserId BIGINT NULL, -- si EMPLOYEE, aquí va el OWNER responsable
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenant_user (tenantId, userId),
  KEY idx_tenant_users_role (tenantId, tenantRole),
  KEY idx_tenant_users_manager (tenantId, managerUserId),
  CONSTRAINT fk_tenant_users_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tenant_users_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tenant_users_manager FOREIGN KEY (managerUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- CLIENTS (aislados por tenant) + soft delete
-- Nota: phone ya NO es globalmente único, es único por tenant.
-- ------------------------------------------------------------
CREATE TABLE clients (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_clients_tenant_phone (tenantId, phone),
  KEY idx_clients_tenant (tenantId),
  KEY idx_clients_active (tenantId, deletedAt),
  CONSTRAINT fk_clients_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- CATÁLOGOS EDITABLES (por tenant)
-- Sabores de pan y rellenos editables por la pastelería
-- ------------------------------------------------------------
CREATE TABLE cake_flavors (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_flavors_tenant_name (tenantId, name),
  KEY idx_flavors_tenant_active (tenantId, isActive),
  CONSTRAINT fk_flavors_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE fillings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fillings_tenant_name (tenantId, name),
  KEY idx_fillings_tenant_active (tenantId, isActive),
  CONSTRAINT fk_fillings_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- FOLIOS (ordenes) aislados por tenant
-- cakeFlavorId / fillingId apuntan a catálogos editables
-- Mantengo legacyCakeFlavor/legacyFilling (opcionales) por si ocupas texto libre o migración
-- ------------------------------------------------------------
CREATE TABLE folios (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,

  folioNumber VARCHAR(255) NOT NULL,
  folioType ENUM('Sencillo','Especial') NOT NULL,

  deliveryDate DATE NOT NULL,
  deliveryTime TIME NOT NULL,
  persons INT NOT NULL,

  cakeFlavorId BIGINT NOT NULL,
  fillingId BIGINT NULL,

  -- opcional: si un día quieres permitir excepciones sin alterar catálogo
  legacyCakeFlavor TEXT NULL,
  legacyFilling TEXT NULL,

  designDescription TEXT NOT NULL,
  dedication VARCHAR(255) NULL,
  deliveryLocation VARCHAR(255) NOT NULL,

  total DECIMAL(12,2) NOT NULL,

  status ENUM('Nuevo','En Producción','Listo para Entrega','Entregado','Cancelado') NOT NULL DEFAULT 'Nuevo',

  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,

  responsibleUserId BIGINT NULL,
  clientId BIGINT NULL,

  createdByUserId BIGINT NULL,
  updatedByUserId BIGINT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_folios_tenant_folioNumber (tenantId, folioNumber),
  KEY idx_folios_tenant_status_date (tenantId, status, deliveryDate),
  KEY idx_folios_tenant_client (tenantId, clientId),
  KEY idx_folios_tenant_responsible (tenantId, responsibleUserId),

  CONSTRAINT fk_folios_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_folios_client FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_folios_responsible FOREIGN KEY (responsibleUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_folios_createdBy FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_folios_updatedBy FOREIGN KEY (updatedByUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT fk_folios_flavor FOREIGN KEY (cakeFlavorId) REFERENCES cake_flavors(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_folios_filling FOREIGN KEY (fillingId) REFERENCES fillings(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT chk_folios_persons_pos CHECK (persons > 0),
  CONSTRAINT chk_folios_total_nonneg CHECK (total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- PAGOS (multi-abonos) por folio
-- ------------------------------------------------------------
CREATE TABLE folio_payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  folioId BIGINT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method ENUM('EFECTIVO','TRANSFERENCIA','TARJETA','OTRO') NOT NULL,
  reference VARCHAR(100) NULL,
  paidAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdByUserId BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_payments_tenant_folio (tenantId, folioId, paidAt),
  CONSTRAINT fk_payments_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_folio FOREIGN KEY (folioId) REFERENCES folios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payments_createdBy FOREIGN KEY (createdByUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- HISTORIAL DE EDICIONES (auditoría específica de folios)
-- changedFields: JSON con lo que cambió (por app)
-- ------------------------------------------------------------
CREATE TABLE folio_edit_histories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  eventType ENUM('CREATE','UPDATE','STATUS_CHANGE','PAYMENT','DELETE') NOT NULL DEFAULT 'UPDATE',
  folioId BIGINT NULL,
  editorUserId BIGINT NULL,
  changedFields JSON NULL,
  ipAddress VARCHAR(45) NULL,
  PRIMARY KEY (id),
  KEY idx_hist_tenant_folio (tenantId, folioId),
  KEY idx_hist_editor (editorUserId, createdAt),
  CONSTRAINT fk_hist_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hist_folio FOREIGN KEY (folioId) REFERENCES folios(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_hist_editor FOREIGN KEY (editorUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- AUDIT LOGS (bitácora global)
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenantId BIGINT NULL,
  actorUserId BIGINT NULL,
  action VARCHAR(60) NOT NULL,
  entity VARCHAR(60) NULL,
  entityId BIGINT NULL,
  metadata JSON NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_tenant_date (tenantId, createdAt),
  KEY idx_audit_actor_date (actorUserId, createdAt),
  CONSTRAINT fk_audit_tenant FOREIGN KEY (tenantId) REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actorUserId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- USER SESSIONS (tokens / refresh) — opcional pero recomendado
-- ------------------------------------------------------------
CREATE TABLE user_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  userId BIGINT NOT NULL,
  refreshTokenHash VARCHAR(255) NOT NULL,
  userAgent VARCHAR(255) NULL,
  ipAddress VARCHAR(45) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME NOT NULL,
  revokedAt DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_sessions_user (userId, expiresAt),
  CONSTRAINT fk_sessions_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- DATOS INICIALES (tenants + usuarios + asignaciones)
-- Passwords (bcrypt):
--   Admin123! => $2b$10$qzh7VhkN/MRTF51HunRHjemSEAv3wmHTtUvxGKGMHT3f4L1B2hGgS
--   Owner123! => $2b$10$vQCRveZFZn3AClNt3k5xQOcHEwj/e6o7velqh.Jj2btyO96gc5s/e
--   Emp123!   => $2b$10$VoXWuDLURciFog1WT9qqd.P2h6Z26c64cZ2Do4VHsp5ND9uLkVrd6
-- ------------------------------------------------------------

INSERT INTO tenants (id, name, legalName, taxId, isActive, createdAt, updatedAt) VALUES
  (1, 'Pasteleria Centro', 'Pasteleria Centro SA de CV', 'RFC-CENTRO-001', 1, NOW(), NOW()),
  (2, 'Pasteleria Norte',  'Pasteleria Norte SA de CV',  'RFC-NORTE-002',  1, NOW(), NOW());

INSERT INTO users (id, username, email, password, globalRole, isActive, mustChangePassword, createdAt, updatedAt, deletedAt) VALUES
  (1, 'Admin',   'admin@lafiesta.com',  '$2b$10$qzh7VhkN/MRTF51HunRHjemSEAv3wmHTtUvxGKGMHT3f4L1B2hGgS', 'ADMIN', 1, 0, NOW(), NOW(), NULL),

  (2, 'Duenio Centro', 'owner.centro@lafiesta.com', '$2b$10$vQCRveZFZn3AClNt3k5xQOcHEwj/e6o7velqh.Jj2btyO96gc5s/e', 'USER', 1, 0, NOW(), NOW(), NULL),
  (3, 'Empleado Centro','emp.centro@lafiesta.com',   '$2b$10$VoXWuDLURciFog1WT9qqd.P2h6Z26c64cZ2Do4VHsp5ND9uLkVrd6', 'USER', 1, 0, NOW(), NOW(), NULL),

  (4, 'Duenio Norte',  'owner.norte@lafiesta.com',   '$2b$10$vQCRveZFZn3AClNt3k5xQOcHEwj/e6o7velqh.Jj2btyO96gc5s/e', 'USER', 1, 0, NOW(), NOW(), NULL),
  (5, 'Empleado Norte','emp.norte@lafiesta.com',     '$2b$10$VoXWuDLURciFog1WT9qqd.P2h6Z26c64cZ2Do4VHsp5ND9uLkVrd6', 'USER', 1, 0, NOW(), NOW(), NULL);

-- Admin también puede estar asignado como OWNER si quieres acceso directo a tenant por app (opcional)
INSERT INTO tenant_users (tenantId, userId, tenantRole, managerUserId, isActive, createdAt, updatedAt) VALUES
  (1, 1, 'OWNER', NULL, 1, NOW(), NOW()),
  (2, 1, 'OWNER', NULL, 1, NOW(), NOW()),

  (1, 2, 'OWNER', NULL, 1, NOW(), NOW()),
  (1, 3, 'EMPLOYEE', 2, 1, NOW(), NOW()),

  (2, 4, 'OWNER', NULL, 1, NOW(), NOW()),
  (2, 5, 'EMPLOYEE', 4, 1, NOW(), NOW());

-- ------------------------------------------------------------
-- Catálogos iniciales (editables) por tenant
-- ------------------------------------------------------------
INSERT INTO cake_flavors (tenantId, name, isActive, createdAt, updatedAt) VALUES
  (1, 'Vainilla', 1, NOW(), NOW()),
  (1, 'Chocolate', 1, NOW(), NOW()),
  (1, 'Red Velvet', 1, NOW(), NOW()),
  (2, 'Vainilla', 1, NOW(), NOW()),
  (2, 'Chocolate', 1, NOW(), NOW()),
  (2, 'Zanahoria', 1, NOW(), NOW());

INSERT INTO fillings (tenantId, name, isActive, createdAt, updatedAt) VALUES
  (1, 'Queso crema con zarzamora', 1, NOW(), NOW()),
  (1, 'Nutella', 1, NOW(), NOW()),
  (1, 'Fresa natural', 1, NOW(), NOW()),
  (2, 'Queso crema', 1, NOW(), NOW()),
  (2, 'Cajeta', 1, NOW(), NOW()),
  (2, 'Chocolate', 1, NOW(), NOW());

-- ------------------------------------------------------------
-- Clientes de ejemplo (por tenant)
-- ------------------------------------------------------------
INSERT INTO clients (tenantId, name, phone, createdAt, updatedAt, deletedAt) VALUES
  (1, 'Cliente Centro 1', '9610000001', NOW(), NOW(), NULL),
  (2, 'Cliente Norte 1',  '9610000001', NOW(), NOW(), NULL); -- mismo teléfono permitido en otro tenant

-- ------------------------------------------------------------
-- Folios de ejemplo (con sabor/relleno por catálogo)
-- Para seleccionar IDs sin saberlos: usamos subqueries por nombre y tenant.
-- ------------------------------------------------------------
INSERT INTO folios (
  tenantId, folioNumber, folioType, deliveryDate, deliveryTime, persons,
  cakeFlavorId, fillingId, legacyCakeFlavor, legacyFilling,
  designDescription, dedication, deliveryLocation, total, status,
  responsibleUserId, clientId, createdByUserId, updatedByUserId, createdAt, updatedAt, deletedAt
)
VALUES
(
  1, 'CENTRO-0001', 'Sencillo', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '15:00:00', 30,
  (SELECT id FROM cake_flavors WHERE tenantId=1 AND name='Chocolate' LIMIT 1),
  (SELECT id FROM fillings WHERE tenantId=1 AND name='Queso crema con zarzamora' LIMIT 1),
  NULL, NULL,
  'Decorado liso color blanco, con fresas frescas y frambuesas en la parte superior.',
  '¡Feliz Aniversario!',
  'Calle Falsa 123, Colonia Centro',
  950.00,
  'Nuevo',
  3,
  (SELECT id FROM clients WHERE tenantId=1 AND phone='9610000001' LIMIT 1),
  2, 2,
  NOW(), NOW(), NULL
),
(
  2, 'NORTE-0001', 'Especial', DATE_ADD(CURDATE(), INTERVAL 10 DAY), '12:30:00', 50,
  (SELECT id FROM cake_flavors WHERE tenantId=2 AND name='Zanahoria' LIMIT 1),
  (SELECT id FROM fillings WHERE tenantId=2 AND name='Cajeta' LIMIT 1),
  NULL, NULL,
  'Pastel alto, cobertura cremosa, detalles florales en betún.',
  '¡Felicidades!',
  'Av. Principal 456, Colonia Norte',
  1500.00,
  'Nuevo',
  5,
  (SELECT id FROM clients WHERE tenantId=2 AND phone='9610000001' LIMIT 1),
  4, 4,
  NOW(), NOW(), NULL
);

-- Pagos ejemplo
INSERT INTO folio_payments (tenantId, folioId, amount, method, reference, paidAt, createdByUserId) VALUES
  (1, (SELECT id FROM folios WHERE tenantId=1 AND folioNumber='CENTRO-0001' LIMIT 1), 500.00, 'EFECTIVO', NULL, NOW(), 3),
  (2, (SELECT id FROM folios WHERE tenantId=2 AND folioNumber='NORTE-0001' LIMIT 1), 300.00, 'TRANSFERENCIA', 'TX-123', NOW(), 5);

-- Historial ejemplo
INSERT INTO folio_edit_histories (tenantId, createdAt, eventType, folioId, editorUserId, changedFields, ipAddress) VALUES
  (1, NOW(), 'CREATE', (SELECT id FROM folios WHERE tenantId=1 AND folioNumber='CENTRO-0001' LIMIT 1), 2, JSON_OBJECT('created', true), '127.0.0.1'),
  (2, NOW(), 'CREATE', (SELECT id FROM folios WHERE tenantId=2 AND folioNumber='NORTE-0001' LIMIT 1), 4, JSON_OBJECT('created', true), '127.0.0.1');

-- Bitácora ejemplo
INSERT INTO audit_logs (tenantId, actorUserId, action, entity, entityId, metadata, createdAt) VALUES
  (NULL, 1, 'BOOTSTRAP_INIT', 'system', NULL, JSON_OBJECT('note','Init complete'), NOW());

SET FOREIGN_KEY_CHECKS = 1;

/* ============================================================
   LISTO.
   En Docker, normalmente lo pones como:
     ./docker/db/001_init.sql  -> /docker-entrypoint-initdb.d/001_init.sql
   ============================================================ */
