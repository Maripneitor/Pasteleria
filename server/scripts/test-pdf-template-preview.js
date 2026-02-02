// server/scripts/test-pdf-template-preview.js
const proxyquire = require('proxyquire').noCallThru();

// MOCK CONSTANTS
const MOCK_TEMPLATE = {
    id: 1,
    name: 'Test Template',
    configJson: { logoUrl: 'http://test.com/logo.png' }
};

// MOCK DEPENDENCIES
const mockModels = {
    '../models/PdfTemplate': {
        findByPk: async (id) => {
            if (id == 1) return MOCK_TEMPLATE;
            return null;
        }
    },
    '../models/Folio': {
        findByPk: async (id) => ({
            toJSON: () => ({ folio_numero: 'TEST-001', total: 100 })
        })
    }
};

const mockPdfService = {
    renderFolioPdf: async (options) => {
        console.log('[MockPDF] Rendering with options:', options);
        if (options.templateConfig && options.templateConfig.logoUrl === 'http://test.com/logo.png') {
            return Buffer.from("%PDF-1.4 Mock PDF Content");
        }
        throw new Error("Template config not passed correctly");
    }
};

// LOAD CONTROLLER
const controller = proxyquire('../controllers/pdfTemplateController', {
    ...mockModels,
    '../services/pdfService': mockPdfService
});

// TEST HARNESS
const mockRes = () => {
    const res = {};
    res.setHeader = (k, v) => { res[k] = v; };
    res.send = (data) => { res.data = data; };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

async function runTest() {
    console.log("--- TEST PREVIEW ENDPOINT ---");
    const req = {
        params: { id: 1 },
        query: { folioId: 999 }
    };
    const res = mockRes();

    await controller.previewTemplate(req, res);

    // Verify
    if (res.statusCode && res.statusCode !== 200) {
        console.error("FAILED: Status code", res.statusCode, res.data);
        process.exit(1);
    }

    if (res['Content-Type'] === 'application/pdf' && res.data && res.data.toString().includes('%PDF-1.4')) {
        console.log("✅ Preview success: PDF Buffer returned with template config used.");
    } else {
        console.error("FAILED: Response format incorrect", res);
        process.exit(1);
    }
}

runTest().catch(console.error);
