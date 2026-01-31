/* server/scripts/db_repair_tenantId.sql */
USE pasteleria_db;

-- 1. Eliminar índice UNIQUE que causa error 500
-- (El nombre 'uq_folios_tenant_folioNumber' fue confirmado en diagnóstico previo)
DROP INDEX uq_folios_tenant_folioNumber ON folios;

-- 2. Eliminar índice simple 'tenantId' si existiera como único
-- (Ignorar error si no existe)
DROP INDEX tenantId ON folios;

-- 3. Crear índice normal para optimizar búsquedas
CREATE INDEX idx_folios_tenantId ON folios (tenantId);
