/**
 *
 * @param {string|string[]} permissionsToReview
 * @returns {boolean}
 */
function allowed(permissionsToReview) {
    if (!permissionsToReview || permissionsToReview.length === 0) {
        return true;
    }

    const permissions = this.roles.map(r => r.permissions).flat(Infinity);

    if (permissions.indexOf('admin') !== -1) {
        return true;
    }

    if (typeof permissionsToReview === 'string') {
        permissionsToReview = [permissionsToReview];
    }

    for (let i = 0; i < permissionsToReview.length; i++) {
        if (permissions.indexOf(permissionsToReview[i]) === -1) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {string[]} permissionsToReview
 * @param {string} notId
 * @returns {boolean}
 */
function hasPermission(permissionsToReview, notId) {
    if (!permissionsToReview || !(permissionsToReview instanceof Array) || permissionsToReview.length === 0) {
        return true;
    }

    const permissions = this.roles.map(r => r.permissions.filter(p => (r.id === notId ? permissionsToReview.indexOf(p) === -1 : true))).flat(Infinity);

    if (permissions.indexOf('admin') !== -1) {
        return true;
    }

    for (let i = 0; i < permissionsToReview.length; i++) {
        if (permissions.indexOf(permissionsToReview[i]) === -1) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {import('mongoose').Document} document Document to parse.
 * @returns {Object.<string, *>}
 */
function toJSON(document) {
    const json = { ...document.toJSON() };

    const Model = document.constructor;
    const properties = (Model.propertiesPermissions || []).filter(p => this.allowed(p[1]));

    const populate = Model._populate;
    const populated = [];
    if (populate) {
        if (typeof populate === 'string') {
            populated.push(populate);
        } else if (populate instanceof Array) {
            for (let i = 0; i < populate.length; i++) {
                if (typeof populate[i] === 'string') {
                    populated.push(populate[i]);
                } else if (populate[i].path) {
                    populated.push(populate[i].path);
                }
            }
        } else if (populate.path) {
            populated.push(populate.path);
        }
    }

    return Object.fromEntries(
        properties.map(p => {
            if (populated.includes(p[0])) {
                const v = document[p[0]];
                if (v instanceof Array) {
                    return [p[0], v.map(v => this.toJSON(v))];
                } else if (typeof v === 'object') {
                    return [p[0], this.toJSON(v)];
                }
            }

            return [p[0], json[p[0]]];
        })
    );
}

/** @type {import('fastify').onRequestAsyncHookHandler} */
export default async (request, reply) => {
    request.userData = {
        auth: {
            roles: [],
            allowed,
            toJSON,
            hasPermission
        }
    };
};
