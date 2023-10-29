import verifyUniqueness from '../../helpers/verifyUniqueness.js';
import { authorize, parsePermissions } from '../../helpers/auth.js';
import system from './system.js';

/**
 * Generate a route handler for GET requests over a collection.
 * @param {import('mongoose').Model} Model - Model to get the data from.
 * @param {import('mongoose').FilterQuery<Model>|(request: import('fastify').FastifyRequest) => import('mongoose').FilterQuery<Model>} query - Query to filter the collection.
 * @param {(string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[]} docProperties - Properties to generate the document with.
 * @returns {import('fastify').RouteHandler}
 */
export const getCollection = (Model, query, docProperties) => async (request, reply) => {
    const documents = await system.getCollection(request.userData.auth.user?._id, Model, typeof query === 'function' ? query(request) : query);

    return reply.send({
        statusCode: 200,
        data: documents.map(d => request.userData.auth.toJSON(d, typeof docProperties === 'function' ? docProperties(request) : docProperties))
    });
};

/**
 * Generate a route handler for POST requests over a collection.
 * @param {import('mongoose').Model} Model - Model to post to.
 * @param {(string|{ name: string, permissions: string|string[]|(request: import('fastify').FastifyRequest) => boolean })[]} properties - Properties to get from the request body to generate the new document.
 * @param {(string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[]} docProperties - Properties to generate the document with.
 * @returns {import('fastify').RouteHandler}
 */
export const postToCollection = (Model, properties, docProperties) => async (request, reply) => {
    await verifyUniqueness(Model, request.params[Model.idParam], Model.uniqueProperties)(request, reply);

    const document = await system.postToCollection(request.userData.auth.user?._id, Model, Object.fromEntries(properties.filter(p => (p?.permissions ? (typeof p.permissions === 'function' ? p.permissions(request) : request.userData.auth.allowed(p.permissions)) : p)).map(p => [p?.name || p, request.body[p?.name || p]])));

    return reply.send({
        statusCode: 201,
        data: [request.userData.auth.toJSON(document, typeof docProperties === 'function' ? docProperties(request) : docProperties)]
    });
};

/**
 * Generate a route handler for GET requests over a document.
 * @param {import('mongoose').Model} Model - Model to get the document from.
 * @param {(string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[]} docProperties - Properties to generate the document with.
 * @returns {import('fastify').RouteHandler}
 */
export const getDocument = (Model, docProperties) => async (request, reply) => {
    const document = await system.getDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam]);

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document, typeof docProperties === 'function' ? docProperties(request) : docProperties)]
    });
};

/**
 * Generate a route handler for PATCH requests over a document.
 * @param {import('mongoose').Model} Model - Model to update the document in.
 * @param {(string|{ name: string, permissions: string|string[]|(request: import('fastify').FastifyRequest) => boolean })[]} properties - Properties to update from the request body.
 * @param {(string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[]} docProperties - Properties to generate the document with.
 * @returns {import('fastify').RouteHandler}
 */
export const updateDocument = (Model, properties, docProperties) => async (request, reply) => {
    await verifyUniqueness(Model, request.params[Model.idParam], Model.uniqueProperties)(request, reply);

    const document = await system.updateDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam], Object.fromEntries(properties.filter(p => (p?.permissions ? (typeof p.permissions === 'function' ? p.permissions(request) : request.userData.auth.allowed(p.permissions)) : p)).map(p => [p?.name || p, request.body[p?.name || p]])));

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document, typeof docProperties === 'function' ? docProperties(request) : docProperties)]
    });
};

/**
 * Generate a route handler for DELETE requests over a document.
 * @param {import('mongoose').Model} Model - Model to delete the document from.
 * @param {(string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[]} docProperties - Properties to generate the document with.
 * @returns {import('fastify').RouteHandler}
 */
export const deleteDocument = (Model, docProperties) => async (request, reply) => {
    const document = await system.deleteDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam]);

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document, typeof docProperties === 'function' ? docProperties(request) : docProperties)]
    });
};

/**
 * Generate controller plugin.
 * @param {import('mongoose').Model} Model - Model this controller will be for.
 * @param {("GET"|"POST"|"PATCH"|"DELETE")[]} methods - Available methods.
 * @param {{ getQuery?: Object.<string, string|number|boolean>|(request: import('fastify').FastifyRequest) => Object.<string, string|number|boolean>, bodyCheck?: import('fastify').RouteHandler, deleteProcess?: import('fastify').RouteHandler, docProperties: (string|string[])[]|(request: import('fastify').FastifyRequest) => (string|string[])[] }} [options] - Additional options for the processing.
 * @returns {import('fastify').FastifyPluginAsync}
 */
export default (Model, methods = ['GET', 'POST', 'PATCH', 'DELETE'], options = {}) =>
    async (fastify, opts) => {
        const readPermission = methods.indexOf('GET') === -1 ? undefined : Model.permissions.find(p => p.startsWith('read:'));
        const createPermission = methods.indexOf('POST') === -1 ? undefined : Model.permissions.find(p => p.startsWith('create:'));
        const updatePermission = methods.indexOf('PATCH') === -1 ? undefined : Model.permissions.find(p => p.startsWith('update:'));
        const deletePermission = methods.indexOf('DELETE') === -1 ? undefined : Model.permissions.find(p => p.startsWith('delete:'));

        const getQuery = (opts || options).getQuery;
        const bodyCheck = (opts || options).bodyCheck;
        const deleteProcess = (opts || options).deleteProcess;
        const docProperties = (opts || options).docProperties;

        if (readPermission) {
            fastify.get('/', async (request, reply) => {
                await authorize(request, readPermission);
                return getCollection(Model, getQuery, docProperties)(request, reply);
            });
        }

        if (createPermission) {
            fastify.post('/', { schema: Model.fastifySchema }, async (request, reply) => {
                await authorize(request, createPermission);

                if (typeof bodyCheck === 'function') {
                    await bodyCheck(request, reply);
                }

                return postToCollection(Model, Model.editableProperties, docProperties)(request, reply);
            });
        }

        if (Model.idParam) {
            if (readPermission) {
                fastify.get(`/:${Model.idParam}`, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, readPermission);
                    return getDocument(Model, docProperties)(request, reply);
                });
            }

            if (updatePermission) {
                fastify.patch(`/:${Model.idParam}`, { schema: Model.fastifySchema }, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, updatePermission);

                    if (typeof bodyCheck === 'function') {
                        await bodyCheck(request, reply);
                    }

                    return updateDocument(Model, Model.editableProperties, docProperties)(request, reply);
                });
            }

            if (deletePermission) {
                fastify.delete(`/:${Model.idParam}`, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, deletePermission);

                    if (typeof deleteProcess === 'function') {
                        await deleteProcess(request, reply);
                    }

                    return deleteDocument(Model, docProperties)(request, reply);
                });
            }
        }
    };
