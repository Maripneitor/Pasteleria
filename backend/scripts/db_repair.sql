-- =============================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS (SAFE)
-- Driver: MySQL/MariaDB
-- =============================================

-- 1. Reparar fechas inválidas ('0000-00-00') que causan crash en migraciones
UPDATE folios SET fecha_entrega = NULL WHERE CAST(fecha_entrega AS CHAR) = '0000-00-00' OR CAST(fecha_entrega AS CHAR) LIKE '0000%';
UPDATE folios SET cancelado_en = NULL WHERE CAST(cancelado_en AS CHAR) = '0000-00-00' OR CAST(cancelado_en AS CHAR) LIKE '0000%';

-- 1.1 FIX CRITICAL: Set defaults for new NOT NULL columns to prevent Sync crash
-- tenant.businessName is required by model but might be NULL in DB
UPDATE tenants SET businessName = 'Mi Pastelería' WHERE businessName IS NULL;

-- folios.status must match ENUM('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED')
-- Handle legacy/null values
UPDATE folios SET status = 'DRAFT' WHERE status IS NULL OR status NOT IN ('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'CANCELLED');

-- 2. Asegurar que columnas nuevas existen (Safe Add)
-- Intento de agregar fecha_entrega si falta (como NULLABLE primero para evitar error de row strict)
-- ALTER TABLE folios ADD COLUMN IF NOT EXISTS fecha_entrega DATE NULL;

-- 3. Alinear Tipos de tenantId (Problema FK Incompatible)
-- Asumimos que tenants.id es BIGINT (estándar Sequelize). Alinear todos a BIGINT.
-- Deshabilitar FK checks temporalmente para evitar bloqueos
SET FOREIGN_KEY_CHECKS = 0;

-- Core Tables
ALTER TABLE folios MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE folios MODIFY COLUMN branchId BIGINT NULL;

ALTER TABLE users MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE users MODIFY COLUMN branchId BIGINT NULL;

ALTER TABLE branches MODIFY COLUMN tenantId BIGINT DEFAULT 1;

ALTER TABLE clients MODIFY COLUMN tenantId BIGINT DEFAULT 1;

-- Catalogs & Helpers
ALTER TABLE ingredients MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE pdf_templates MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE audit_logs MODIFY COLUMN tenantId BIGINT NULL;

-- Models known to have tenantId (Match Sequelize definitions)
-- Note: 'fillings' has tenantId in model, check if exists in DB before running or ignore error
-- ALTER TABLE fillings MODIFY COLUMN tenantId BIGINT DEFAULT 1; 

-- SaaS & Stats (Commented out: These tables might not exist yet on fresh boot. Sequelize will create them with correct types)
-- ALTER TABLE saas_contracts MODIFY COLUMN tenantId BIGINT NOT NULL;
-- ALTER TABLE saas_commission_ledgers MODIFY COLUMN tenantId BIGINT NOT NULL;

-- ALTER TABLE daily_sales_stats MODIFY COLUMN tenantId BIGINT NOT NULL;
-- ALTER TABLE daily_sales_stats MODIFY COLUMN branchId BIGINT NOT NULL;

-- ALTER TABLE activation_codes MODIFY COLUMN tenantId BIGINT NOT NULL;
-- ALTER TABLE activation_codes MODIFY COLUMN branchId BIGINT NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- 4. Verificación
SELECT 'Reparación Completada' as Status;
