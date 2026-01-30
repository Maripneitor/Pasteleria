function parseMaybeJson(v) {
    if (typeof v !== 'string') return v;
    const s = v.trim();
    if (!s) return v;
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
        try { return JSON.parse(s); } catch { return v; }
    }
    return v;
}

function normalizeBody(body = {}) {
    const out = {};
    for (const [k, v] of Object.entries(body || {})) out[k] = parseMaybeJson(v);
    return out;
}

module.exports = { parseMaybeJson, normalizeBody };
