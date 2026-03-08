module.exports = {
    apps: [
        {
            name: "pasteleria-api",
            script: "server.js",
            instances: "max", // Escala a todos los núcleos de CPU (Cluster Mode)
            exec_mode: "cluster",
            watch: false,
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "development"
            },
            env_production: {
                NODE_ENV: "production"
            }
        },
        {
            name: "whatsapp-worker",
            script: "whatsapp-gateway.js",
            instances: 1, // Solo 1 instancia para WhatsApp (Fork Mode) para no bloquear sesión/archivos
            exec_mode: "fork",
            watch: false,
            max_memory_restart: "400M",
            env: {
                NODE_ENV: "development",
                WHATSAPP_MICROSERVICE_MODE: "true"
            },
            env_production: {
                NODE_ENV: "production",
                WHATSAPP_MICROSERVICE_MODE: "true"
            }
        }
    ]
};
