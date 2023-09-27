import User from '../../models/auth/user.js';
import recordsRoutes from './records.js';
import rolesRoutes from './roles.js';
import usersRoutes from './users.js';

/** @type {import('fastify').FastifyPluginAsync} */
export default async function router(fastify, options) {
    await fastify.register(options.authRoutes, { prefix: '/auth' });
    await fastify.register(recordsRoutes, { prefix: '/records' });
    await fastify.register(rolesRoutes, { prefix: '/roles' });
    await fastify.register(usersRoutes, { prefix: '/users' });

    if (options.router) {
        await fastify.register(options.router);
    }
}
