import { authorize } from '../../helpers/auth.js';
import Role from '../../models/auth/role.js';
import User from '../../models/auth/user.js';
import controller from '../controllers/global.js';
import mongoose from 'mongoose';
import { updateDocument } from '../controllers/system.js';

const error = new Error();

/** @type {import('fastify').FastifyPluginAsync} */
export default async function (fastify, options) {
    fastify.get('/permissions', async (request, reply) => {
        await authorize(request, 'update:role');
        return reply.send({
            statusCode: 200,
            data: ['admin', Object.values(mongoose.models).map(M => M.permissions)].flat(Infinity).filter(p => p && request.userData.auth.hasPermission(p))
        });
    });

    return fastify.register(
        controller(Role, ['GET', 'POST', 'PATCH', 'DELETE'], {
            bodyCheck: async (request, reply) => {
                const id = request.params[Role.idParam];
                let permissions;

                if (id) {
                    const currentRole = await Role.findById(id).exec();
                    permissions = [...currentRole.permissions.filter(p => !request.body.permissions.includes(p)), ...request.body.permissions.filter(p => !currentRole.permissions.includes(p))];
                } else {
                    permissions = request.body.permissions;
                }

                if (!request.userData.auth.hasPermission(permissions, id)) {
                    error.statusCode = 403;
                    throw error;
                }
            },
            deleteProcess: async (request, reply) => {
                const id = request.params[Role.idParam];
                const role = await Role.findById(id).exec();

                if (!request.userData.auth.hasPermission(role.permissions, id)) {
                    error.statusCode = 403;
                    throw error;
                }

                const users = await User.find().exec();
                const usersWithRole = users.filter(u => u.roles.map(r => r.toString()).indexOf(id) !== -1);

                return Promise.all(
                    usersWithRole.map(u =>
                        updateDocument(request.userData.auth.user?._id, User, u.id, {
                            roles: u.roles.map(r => r.toString()).filter(r => r !== id)
                        })
                    )
                );
            }
        }),
        options
    );
}
