# Security & Multi-Tenancy Standards

## 1. Strict Tenant Isolation
Every database query (READ or WRITE) must be scoped to the authenticated user's `tenantId`.

### ✅ The "Golden Rule" (Controllers)
Always use the `buildTenantWhere` helper to generate the filter.

```javascript
const { buildTenantWhere } = require('../utils/tenantScope');

exports.listItems = async (req, res) => {
    // 1. Generate Filter
    const tenantFilter = buildTenantWhere(req);
    
    // 2. Apply Filter
    const items = await Model.findAll({
        where: {
            isActive: true,
            ...tenantFilter // <--- MANDATORY
        }
    });
    
    res.json(items);
};
```

### ❌ Anti-Patterns (Forbidden)
- **Global finds**: `Model.findAll()` without `where`.
- **Manual Checks**: `if (req.user.tenantId === row.tenantId)` (prone to errors, do it in the query).
- **Ignoring Scope**: Relying only on `req.params.id` without `tenantFilter`.

## 2. Creation
Always inject `tenantId` from `req.user`.

```javascript
const tenantId = req.user?.tenantId || 1; // Fallback only for legacy/dev
await Model.create({ ...req.body, tenantId });
```
**NEVER** trust `req.body.tenantId`.

## 3. Raw SQL
If you must use `sequelize.query`, you MUST include `tenantId` in replacements.

```javascript
await sequelize.query(
    'SELECT * FROM orders WHERE status = ? AND tenantId = ?',
    { replacements: ['active', req.user.tenantId] }
);
```
