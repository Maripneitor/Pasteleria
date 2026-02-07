const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Metadata info about our API
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Pastelería Backend API',
            version: '1.0.0',
            description: 'API documentation for the Pastelería SaaS application. Includes Multi-tenant, RBAC, and PDF generation features.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
            // {
            //   url: 'https://api.production.com',
            //   description: 'Production Server',
            // },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    // Paths to files containing OpenAPI definitions
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../components/*.js'), // If any components are documented here
        // path.join(__dirname, '../controllers/*.js'), // Optional: if controllers have docs
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUi };
