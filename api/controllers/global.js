import verifyUniqueness from '../../helpers/verifyUniqueness.js';
import { authorize, parsePermissions } from '../../helpers/auth.js';
import system from './system.js';

/**
 * Generate a route handler for GET requests over a collection.
 * @param {import('mongoose').Model} Model - Model to get the data from.
 * @param {import('mongoose').FilterQuery<Model>} query - Query to filter the collection.
 * @returns {import('fastify').RouteHandler}
 */
export const getCollection = (Model, query) => async (request, reply) => {
    const documents = await system.getCollection(request.userData.auth.user?._id, Model, query);

    return reply.send({
        statusCode: 200,
        data: documents.map(d => request.userData.auth.toJSON(d))
    });
};

/**
 * Generate a route handler for POST requests over a collection.
 * @param {import('mongoose').Model} Model - Model to post to.
 * @param {string[]} properties - Properties to get from the request body to generate the new document.
 * @returns {import('fastify').RouteHandler}
 */
export const postToCollection = (Model, properties) => async (request, reply) => {
    await verifyUniqueness(Model, request.params[Model.idParam], Model.uniqueProperties)(request, reply);

    const document = await system.postToCollection(request.userData.auth.user?._id, Model, Object.fromEntries(properties.map(p => [p, request.body[p]])));

    return reply.send({
        statusCode: 201,
        data: [request.userData.auth.toJSON(document)]
    });
};

/**
 * Generate a route handler for GET requests over a document.
 * @param {import('mongoose').Model} Model - Model to get the document from.
 * @returns {import('fastify').RouteHandler}
 */
export const getDocument = Model => async (request, reply) => {
    const document = await system.getDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam]);

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document)]
    });
};

/**
 * Generate a route handler for PATCH requests over a document.
 * @param {import('mongoose').Model} Model - Model to update the document in.
 * @param {string[]} properties - Properties to update from the request body.
 * @returns {import('fastify').RouteHandler}
 */
export const updateDocument = (Model, properties) => async (request, reply) => {
    await verifyUniqueness(Model, request.params[Model.idParam], Model.uniqueProperties)(request, reply);

    const document = await system.updateDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam], Object.fromEntries(properties.map(p => [p, request.body[p]])));

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document)]
    });
};

/**
 * Generate a route handler for DELETE requests over a document.
 * @param {import('mongoose').Model} Model - Model to delete the document from.
 * @returns {import('fastify').RouteHandler}
 */
export const deleteDocument = Model => async (request, reply) => {
    const document = await system.deleteDocument(request.userData.auth.user?._id, Model, request.params[Model.idParam]);

    return reply.send({
        statusCode: 200,
        data: [request.userData.auth.toJSON(document)]
    });
};

/**
 * Generate controller plugin.
 * @param {import('mongoose').Model} Model - Model this controller will be for.
 * @param {("GET"|"POST"|"PATCH"|"DELETE")[]} methods - Available methods.
 * @param {{ getQuery?: Object.<string, string|number|boolean>, bodyCheck?: import('fastify').RouteHandler, deleteProcess?: import('fastify').RouteHandler }} [options] - Additional options for the processing.
 * @returns {import('fastify').FastifyPluginAsync}
 */
export default (Model, methods = ['GET', 'POST', 'PATCH', 'DELETE'], options = {}) =>
    async (fastify, options) => {
        const readPermission = methods.indexOf('GET') === -1 ? undefined : Model.permissions.find(p => p.startsWith('read:'));
        const createPermission = methods.indexOf('POST') === -1 ? undefined : Model.permissions.find(p => p.startsWith('create:'));
        const updatePermission = methods.indexOf('PATCH') === -1 ? undefined : Model.permissions.find(p => p.startsWith('update:'));
        const deletePermission = methods.indexOf('DELETE') === -1 ? undefined : Model.permissions.find(p => p.startsWith('delete:'));

        if (readPermission) {
            fastify.get('/', async (request, reply) => {
                await authorize(request, readPermission);
                return getCollection(Model, options.getQuery)(request, reply);
            });
        }

        if (createPermission) {
            fastify.post('/', { schema: Model.fastifySchema }, async (request, reply) => {
                await authorize(request, createPermission);

                if (typeof options.bodyCheck === 'function') {
                    await options.bodyCheck(request, reply);
                }

                return postToCollection(Model, Model.editableProperties)(request, reply);
            });
        }

        if (Model.idParam) {
            if (readPermission) {
                fastify.get(`/:${Model.idParam}`, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, readPermission);
                    return getDocument(Model)(request, reply);
                });
            }

            if (updatePermission) {
                fastify.patch(`/:${Model.idParam}`, { schema: Model.fastifySchema }, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, updatePermission);

                    if (typeof options.bodyCheck === 'function') {
                        await options.bodyCheck(request, reply);
                    }

                    return updateDocument(Model, Model.editableProperties)(request, reply);
                });
            }

            if (deletePermission) {
                fastify.delete(`/:${Model.idParam}`, async (request, reply) => {
                    await parsePermissions(request, Model.idParam);
                    await authorize(request, deletePermission);

                    if (typeof options.deleteProcess === 'function') {
                        await options.deleteProcess(request, reply);
                    }

                    return deleteDocument(Model)(request, reply);
                });
            }
        }
    };
