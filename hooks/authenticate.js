import mongoose from 'mongoose';
import { parsePermissions } from '../helpers/auth.js';

/** @type {import('fastify').onRequestAsyncHookHandler} */
export default async (request, reply) => {
    if (!request.headers.authorization) {
        return;
    }

    try {
        const token = request.headers.authorization.split(' ')[1];
        request.userData.auth.jwt = token;

        const decoded = await request.jwtVerify();
        request.userData.auth.user = await mongoose.models.Users.findById(decoded.id).populate({ path: 'roles' }).exec();

        await parsePermissions(request, '');
    } catch (err) {}
};
