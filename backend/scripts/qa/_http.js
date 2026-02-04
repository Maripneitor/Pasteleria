// server/scripts/qa/_http.js
const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const log = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
};

function getAgent(urlObj) {
    return urlObj.protocol === 'https:' ? https : http;
}

function request({ method, url, token, body, headers = {} }) {
    return new Promise((resolve, reject) => {
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        const urlObj = new URL(fullUrl);

        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: requestHeaders,
            timeout: 5000 // 5s timeout
        };

        const req = getAgent(urlObj).request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const result = {
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                };

                // Try parsing JSON
                try {
                    result.data = JSON.parse(data);
                } catch (e) {
                    // Keep as string if not JSON
                }

                resolve(result);
            });
        });

        req.on('error', (e) => {
            reject(e); // This should be an Error object
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timed out to ${fullUrl}`));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

function requestJson(options) {
    return request(options);
}

function requestBuffer({ method, url, token }) {
    return new Promise((resolve, reject) => {
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        const urlObj = new URL(fullUrl);

        const requestHeaders = {};
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: requestHeaders,
            timeout: 5000
        };

        const req = getAgent(urlObj).request(options, (res) => {
            const chunks = [];

            res.on('data', (chunk) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const result = {
                    status: res.statusCode,
                    headers: res.headers,
                    data: buffer
                };
                resolve(result);
            });
        });

        req.on('error', (e) => reject(e));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timed out to ${fullUrl}`));
        });

        req.end();
    });
}

module.exports = {
    requestJson,
    requestBuffer,
    BASE_URL,
    log
};
