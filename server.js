import fastify from 'fastify';
const server = fastify();

// Fastify modules
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import userData from './hooks/userData.js';
import authenticate from './hooks/authenticate.js';
import routes from './api/routes/index.js';

/**
 *
 * @param {import('@fastify/cors').FastifyCorsOptions|import('@fastify/cors').FastifyCorsOptionsDelegate}
 * @param {import('./index.js').APIConfig} config
 * @returns {Promise<import('fastify').FastifyInstance>}
 */
export default async (config = {}) => {
    // Fastify modules
    await server.register(rateLimit, config.pluginOptions?.rateLimit);
    await server.register(helmet, config.pluginOptions?.helmet);
    await server.register(cors, config.pluginOptions?.cors);
    await server.register(jwt, config.pluginOptions?.jwt);

    // User Data
    server.decorateRequest('userData');
    server.addHook('onRequest', userData);

    // Authentication
    server.addHook('onRequest', authenticate);

    // Routes
    await server.register(routes, {
        authRoutes: config.authRoutes,
        router: config.router
    });

    return server;
};
