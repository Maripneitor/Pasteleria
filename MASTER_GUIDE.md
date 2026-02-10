# MASTER INTEGRATION GUIDE - Pastelería La Fiesta

This guide ensures a **Zero-Config** setup and validates **Security, Multi-tenancy, and Reporting** features.

---

## 1. Environment Setup (Clean Install)

**Pre-requisites:** Docker & Git installed.

```bash
# 1. Clean previous state
docker compose down -v

# 2. Build and Start
docker compose up -d --build --wait

# 3. Seed Master Data (HQ, Branches, Roles, Catalog)
docker compose exec backend npm run seed:full
```

**What this does:**
- Creates Tenant: "Pastelería La Fiesta HQ"
- Creates Branches: "Centro" and "Norte"
- Creates Users:
  - **SuperAdmin:** `admin@macair.com` / `admin123`
  - **Owner:** `owner@demo.com` / `admin123`
  - **Employee:** `cajero@demo.com` / `admin123`
- Populates Catalog: 5 Flavors, 5 Fillings, Base Prices.

---

## 2. Security & Error Handling Tests (Automated)

Run the following script to validate the "Iron Shield" (Security):

```bash
docker compose exec backend node scripts/qa/error_handling.js
```

**Expected Output:**
- ✅ **403 Forbidden:** Validates that Owner/Employee cannot access SuperAdmin routes.
- ✅ **400 Bad Request:** Validates validation rules (missing fields).
- ✅ **401 Unauthorized:** Validates that bad tokens are rejected immediately.

---

## 3. Reporting Simulation (Email & PDFs)

**Pre-requisite:** Ensure `.env` has valid SMTP credentials for `mariomoguel05@gmail.com`.

### A. PDF Generation
```bash
docker compose exec backend node scripts/qa/test_api_pdf.js
```
*Effect: Generates a PDF for the latest folio and logs success.*

### B. Cash Cut (Corte de Caja)
```bash
docker compose exec backend node scripts/qa/cash_smoke.js
```
*Effect: Triggers the "Cut Preview" logic for the active branch.*

---

## 4. Frontend Verification (Manual)

Navigate to `http://localhost:5173/pedidos/nuevo` and verify:

1. **Step A (Client):** Select "Invitado" (Guest).
2. **Step C (Complements):** Add 2 cakes and check Total update.
3. **Step F (Payment):** Toggle "Agregar Comisión" and check "Resta" update.

---

## 5. Technical Improvements (Applied)

- **Schema:** `Folio.js` `clientId` is nullable for Guest checkout.
- **Logging:** All requests are traced via `requestLogger.js`.
- **Isolation:** `tenantScope.js` enforces strict data separation in every query.
