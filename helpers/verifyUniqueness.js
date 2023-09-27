const error = new Error();

/**
 *
 * @param {import('mongoose').Model} Model
 * @param {string} id
 * @param {string[][]} properties
 * @returns {import('fastify').RouteHandler}
 */
export default (Model, id, ...properties) =>
    async (request, reply) => {
        if (properties.length === 0) {
            return next();
        }

        for (let i = 0; i < properties.length; i++) {
            if (!properties[i] || properties[i].length === 0) {
                continue;
            }

            const doc = await Model.findOne(Object.fromEntries(properties[i].map(p => [p, request.body[p]]))).exec();

            if (doc && doc.id !== id) {
                error.statusCode = 409;
                throw error;
            }
        }
    };
