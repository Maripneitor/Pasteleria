# Backend API Documentation

Welcome to the Pastelería SaaS Backend. This API provides multi-tenant support, RBAC, and PDF generation for cake management.

## 🚀 Quick Start (Production/Dev Clean Slate)

1.  **Docker Database**
    ```bash
    docker compose down -v
    docker compose up -d db
    ```
2.  **Dependencies**
    ```bash
    cd backend
    npm install
    ```
3.  **Start Dev Server**
    ```bash
    # Only for initial bootstrap to sync DB schema
    DB_SYNC_MODE=alter npm run dev
    ```

## 📚 API Documentation

Interactive Swagger UI is available at:
- **UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **JSON:** [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json)

## 🛠 Management Commands

### Seeding Admins
Populate initial admin users:
```bash
npm run seed:admins
```

## ✅ Smoke Tests (Quality Assurance)

Run these scripts to verify system health.

### 1. PDF Generation (Local Filesystem)
Verifies `puppeteer` can generate PDFs without API.
```bash
node backend/qa/pdf_smoke_local.js
```

### 2. PDF API (Endpoint)
Verifies auth + PDF streaming.
```bash
# Replace with valid ID
FOLIO_ID=1 node backend/qa/test_api_pdf.js
```

### 3. RBAC & Security
Verifies Role-Based Access Control (Admin vs Employee).
```bash
node backend/qa/rbac_smoke_http.js
```

### 4. Branch Management
Verifies CRUD and Tenant Isolation for Branches.
```bash
node backend/qa/branches_smoke_http.js
```

### 5. Email Queue System
Verifies persistent email queue and worker (using Mock transport).
```bash
EMAIL_WORKER_ENABLED=true node backend/qa/email_queue_smoke.js
```

### 6. Tenant Configuration
Verifies custom branding settings (Logo, Colors).
```bash
node backend/qa/tenant_config_smoke_http.js
```

## 🔧 Environment Variables (Key)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_HOST`, `DB_PORT` | Database Connection | 127.0.0.1, 3307 |
| `DB_SYNC_MODE` | Sequelize Sync Strategy | `none` (use `alter` for dev) |
| `JWT_SECRET` | Auth Token Secret | - |
| `SMTP_HOST` | Email Server | - (Falls back to Mock) |
| `EMAIL_WORKER_ENABLED` | Enable Background Email Worker | `false` |
| `EMAIL_WORKER_INTERVAL_MS`| Worker Poll Frequency | `30000` (30s) |

