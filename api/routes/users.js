import controller from '../controllers/global.js';
import mongoose from 'mongoose';

const error = new Error();

export default controller(mongoose.models.Users, ['GET', 'PATCH'], {
    bodyCheck: async (request, reply) => {
        const id = request.params[mongoose.models.Users.idParam];
        const { roles } = await mongoose.models.Users.findById(id).populate('roles').exec();

        const newRoles = await Promise.all(request.body.roles.filter(r => roles.findIndex(role => role.id === r) === -1).map(id => mongoose.models.Roles.findById(id).exec()));
        const oldRoles = roles.filter(r => request.body.roles.indexOf(r.id) === -1);

        const changedPermissions = [newRoles.map(r => r.permissions), oldRoles.map(r => r.permissions)].flat(Infinity);

        let selfPermissions = [];
        if (id === request.userData.auth.user.id) {
            selfPermissions = roles
                .filter(r => request.body.roles.indexOf(r.id) !== -1)
                .map(r => r.permissions)
                .flat(Infinity);
        } else {
            selfPermissions = request.userData.auth.user.roles.map(r => r.permissions).flat(Infinity);
        }

        if (selfPermissions.indexOf('admin') !== -1) {
            return;
        }

        for (let i = 0; i < changedPermissions.length; i++) {
            if (selfPermissions.indexOf(changedPermissions[i]) === -1) {
                error.statusCode = 403;
                throw error;
            }
        }
    }
});
