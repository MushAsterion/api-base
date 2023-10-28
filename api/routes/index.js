import recordsRoutes from './records.js';
import rolesRoutes from './roles.js';
import usersRoutes from './users.js';

/** @type {import('fastify').FastifyPluginAsync} */
export default async function router(fastify, options) {
    await fastify.register(options.authRoutes, { prefix: '/auth' });

    if (!options.disabledRoutes?.records) {
        await fastify.register(recordsRoutes, { prefix: '/records' });
    }

    if (!options.disabledRoutes?.roles) {
        await fastify.register(rolesRoutes, { prefix: '/roles' });
    }

    if (!options.disabledRoutes?.users) {
        await fastify.register(usersRoutes, { prefix: '/users' });
    }

    if (options.router) {
        await fastify.register(options.router);
    }
}
