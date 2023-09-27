const error = new Error();

/**
 * Parse permission for the route.
 * @param {import('fastify').FastifyRequest} request - Fastify request.
 * @param {string} idParam - Name of the ID parameter.
 * @returns {Promise<>}
 */
export async function parsePermissions(request, idParam) {
    const id = idParam ? request.params[idParam] : idParam;
    if (typeof id !== 'string' || !request.userData.auth.user) {
        return;
    }

    const roles =
        request.userData.auth.user?.roles
            ?.filter(r => '' + (r.resource || '') === id)
            .map(r => ({
                id: r.id,
                permissions: r.permissions
            })) || [];

    if (roles.length) {
        request.userData.auth.roles.push(...roles);
    }
}

/**
 * Authorize the request if user has needed permissions.
 * @param {import('fastify').FastifyRequest} request - Fastify request.
 * @param {string|string[]} permissions - Permission(s) needed to proceed with the request.
 * @returns {Promise<>}
 */
export async function authorize(request, permissions) {
    if (!request.userData.auth.user && permissions?.length) {
        error.statusCode = 401;
        throw error;
    }

    if (!request.userData.auth.allowed(permissions)) {
        error.statusCode = 403;
        throw error;
    }
}
