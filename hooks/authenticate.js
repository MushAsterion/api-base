import User from '../models/auth/user.js';
import { parsePermissions } from '../helpers/auth.js';

/** @type {import('fastify').onRequestAsyncHookHandler} */
export default async (request, reply) => {
    if (!request.headers.authorization) {
        return;
    }

    try {
        const token = request.headers.authorization.split(' ')[1];
        const decoded = await request.jwtVerify(token);

        request.userData.auth.jwt = token;
        request.userData.auth.user = await User.findById(decoded.id).populate({ path: 'roles' }).exec();

        await parsePermissions(request, '');
    } catch (err) {}
};
