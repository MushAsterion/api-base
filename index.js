import server from './server.js';
import mongoose from 'mongoose';

/**
 * @typedef {{
 *  db: string|{ uri: string, options?: import('mongoose').ConnectOptions },
 *  pluginOptions?: {
 *      rateLimit?: import('fastify').FastifyRegisterOptions<import('@fastify/rate-limit').RateLimitPluginOptions>,
 *      helmet?: import('fastify').FastifyRegisterOptions<import('@fastify/helmet').FastifyHelmetOptions>,
 *      cors?: import('fastify').FastifyRegisterOptions<import('@fastify/cors').FastifyCorsOptions>|import('fastify').FastifyRegisterOptions<import('@fastify/cors').FastifyCorsOptionsDelegate>
 *      jwt?: import('fastify').FastifyRegisterOptions<import('@fastify/jwt').FastifyJWTOptions>
 *  },
 *  authRoutes: import('fastify').FastifyPluginAsync,
 *  router?: import('fastify').FastifyPluginAsync,
 *  disabledRoutes?: { records?: boolean, roles?: boolean, users?: boolean },
 *  modelSchemas?: { records?: mongoose.Schema, roles?: mongoose.Schema, users?: mongoose.Schema }
 * }} APIConfig Configuration for the API.
 */

// Models

import Role from './models/auth/role.js';
import User from './models/auth/user.js';
import Record from './models/system/record.js';

export { mongoose, Role, User, Record };

/**
 *
 * @param {APIConfig} config - Configuration for the API.
 */
export default config => {
    return {
        mongoose,

        /**
         * Initialize the server and listen to requests.
         * @param {import('fastify').FastifyListenOptions} opts - Listen options for the Fastify server.
         * @returns {Promise<string>} - The address the server is listening to.
         */
        listen: async opts => {
            if (config?.modelSchemas?.records) {
                mongoose.model('Records', config.modelSchemas.records, 'records', { overwriteModels: true });
            }
            if (config?.modelSchemas?.roles) {
                mongoose.model('Roles', config.modelSchemas.roles, 'roles', { overwriteModels: true });
            }
            if (config?.modelSchemas?.users) {
                mongoose.model('Users', config.modelSchemas.users, 'users', { overwriteModels: true });
            }

            await mongoose.connect(typeof config.db === 'string' ? config.db : config.db.uri, typeof config.db === 'string' ? undefined : config.db.options);
            const s = await server(config);
            return s.listen(opts);
        }
    };
};

// Helpers

import { parsePermissions, authorize } from './helpers/auth.js';
import request, { GET, POST, PATCH, DELETE } from './helpers/request.js';

export { parsePermissions, authorize, request, GET, POST, PATCH, DELETE };

// Controllers

import system, { getCollection, postToCollection, getDocument, updateDocument, deleteDocument } from './api/controllers/system.js';
import controller, { getCollection as getCollectionController, postToCollection as postToCollectionController, getDocument as getDocumentController, updateDocument as updateDocumentController, deleteDocument as deleteDocumentController } from './api/controllers/global.js';
import recordsController from './api/routes/records.js';
import rolesController from './api/routes/roles.js';
import usersController from './api/routes/users.js';

export { system, getCollection, postToCollection, getDocument, updateDocument, deleteDocument, controller, getCollectionController, postToCollectionController, getDocumentController, updateDocumentController, deleteDocumentController, recordsController, rolesController, usersController };
