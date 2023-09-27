import Role from '../../models/auth/role.js';
import User from '../../models/auth/user.js';
import controller from '../controllers/global.js';

const error = new Error();

export default controller(User, ['GET', 'PATCH'], async (request, reply) => {
    const id = request.params[User.idParam];
    const { roles } = await User.findById(id).populate('roles').exec();

    const newRoles = await Promise.all(request.body.roles.filter(r => roles.findIndex(role => role.id === r) === -1).map(id => Role.findById(id).exec()));
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
});
