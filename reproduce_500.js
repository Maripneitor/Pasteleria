
const loginUrl = "http://localhost:3000/api/auth/login";
const endpoints = [
    { method: 'GET', url: "http://localhost:3000/api/folios" },
    { method: 'GET', url: "http://localhost:3000/api/folios/stats/dashboard" },
    { method: 'GET', url: "http://localhost:3000/api/users" }
];

async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "admin@lafiesta.com", password: "Admin123!" })
        });

        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("Login success.");

        for (const ep of endpoints) {
            console.log(`Testing ${ep.method} ${ep.url}...`);
            const res = await fetch(ep.url, {
                method: ep.method,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const status = res.status;
            let body;
            try {
                body = await res.json();
            } catch (e) {
                body = await res.text();
            }

            console.log(`Response Status: ${status}`);
            console.log(`Response Body:`, body);
        }

    } catch (error) {
        console.error("Script error:", error);
    }
}

run();
