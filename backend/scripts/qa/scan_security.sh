#!/bin/bash

echo "🛡️  Starting Static Security Scan..."
ERRORS=0

# 1. Check for findAll without where (simple heuristic)
# We look for "findAll({" or "findAll()" which might indicate missing clauses. 
# This is noisy, so we focus on explicit missing tenant logic if possible.
# Better: Look for controllers that import models but DON'T import tenantScope

echo "🔍 Checking for Controllers missing tenantScope..."
CONTROLLERS=$(grep -l "require('../models')" backend/controllers/*.js)

for f in $CONTROLLERS; do
    if ! grep -q "tenantScope" "$f" && ! grep -q "buildTenantWhere" "$f"; then
        echo "⚠️  Suspicious Controller: $f (Uses models but no tenantScope/buildTenantWhere)"
        # ERRORS=$((ERRORS+1)) 
        # Warning only for now as some might be public or internal
    fi
done

# 2. Check for manual tenantId usage (Anti-pattern)
echo "🔍 Checking for manual 'req.user.tenantId' usage (Should use buildTenantWhere)..."
grep -r "req.user.tenantId" backend/controllers | grep -v "buildTenantWhere" | while read -r line ; do
    echo "⚠️  Manual Usage: $line"
done

# 3. Check for specific high-risk patterns
echo "🔍 HIGH RISK: 'findAll({})' (Global Scan)..."
grep -r "findAll({})" backend/controllers
if [ $? -eq 0 ]; then
    echo "❌ Found global findAll({})!"
    ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✅ Static Scan Completed. No critical issues found."
    exit 0
else
    echo "💥 Found $ERRORS critical issues."
    exit 1
fi
