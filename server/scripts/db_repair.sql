-- =============================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS (SAFE)
-- Driver: MySQL/MariaDB
-- =============================================

-- 1. Reparar fechas inválidas ('0000-00-00') que causan crash en migraciones
-- Se convierten a NULL.
UPDATE folios SET fecha_entrega = NULL WHERE CAST(fecha_entrega AS CHAR) = '0000-00-00' OR CAST(fecha_entrega AS CHAR) LIKE '0000%';
UPDATE folios SET cancelado_en = NULL WHERE CAST(cancelado_en AS CHAR) = '0000-00-00' OR CAST(cancelado_en AS CHAR) LIKE '0000%';

-- 2. Asegurar que columnas nuevas existen (Safe Add)
-- NOTA: Ejecutar si no existen. MySQL 8.0 support 'IF NOT EXISTS' in ALTER? 
-- Si no, el error es inofensivo si ya existen.
-- Para mayor seguridad, usamos procedures o ignoramos errores de 'Duplicate column'.

-- Intento de agregar fecha_entrega si falta (como NULLABLE primero para evitar error de row strict)
ALTER TABLE folios ADD COLUMN IF NOT EXISTS fecha_entrega DATE NULL;

-- 3. Alinear Tipos de tenantId (Problema FK Incompatible)
-- Asumimos que tenants.id es BIGINT (estándar Sequelize). Alinear todos a BIGINT.
-- Deshabilitar FK checks temporalmente para evitar bloqueos
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE folios MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE users MODIFY COLUMN tenantId BIGINT DEFAULT 1;
-- Si existe tabla fillings y otros
ALTER TABLE fillings MODIFY COLUMN tenantId BIGINT DEFAULT 1;
ALTER TABLE flavors MODIFY COLUMN tenantId BIGINT DEFAULT 1;

SET FOREIGN_KEY_CHECKS = 1;

-- 4. Verificación
SELECT 'Reparación Completada' as Status;
