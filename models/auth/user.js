import mongoose from 'mongoose';

const name = 'user';
const Permissions = {
    Read: `read:${name}`,
    Create: `create:${name}`,
    Update: `update:${name}`,
    Delete: `delete:${name}`
};

const userSchema = new mongoose.Schema(
    {
        roles: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'Roles'
            }
        ]
    },
    {
        statics: {
            permissions: [Permissions.Read, Permissions.Update],

            editableProperties: ['roles'],

            propertiesPermissions: Object.entries({
                _id: [],
                roles: [mongoose.models.Roles.Permissions.Read]
            }),

            idParam: 'user_id',

            fastifySchema: {
                body: {
                    type: 'object',
                    required: ['roles'],
                    properties: {
                        roles: { type: 'array' }
                    }
                }
            },

            /** @type {mongoose.PopulateOptions} */
            _populate: {
                path: 'roles',
                populate: mongoose.models.Roles._populate
            },

            Permissions
        }
    }
);

export default mongoose.model('Users', userSchema);
