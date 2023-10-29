import mongoose from 'mongoose';

const name = 'role';
const Permissions = {
    Read: `read:${name}`,
    Create: `create:${name}`,
    Update: `update:${name}`,
    Delete: `delete:${name}`
};

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.SchemaTypes.String,
            required: true
        },
        resource: {
            type: mongoose.SchemaTypes.ObjectId,
            required: false
        },
        permissions: [
            {
                type: mongoose.SchemaTypes.String,
                required: true
            }
        ]
    },
    {
        statics: {
            permissions: [Permissions.Read, Permissions.Create, Permissions.Update, Permissions.Delete],

            editableProperties: ['name', 'resource', 'permissions'],

            propertiesPermissions: Object.entries({
                _id: [],
                name: [],
                resource: [],
                permissions: []
            }),

            idParam: 'role_id',

            fastifySchema: {
                body: {
                    type: 'object',
                    required: ['name', 'permissions'],
                    properties: {
                        name: { type: 'string' },
                        resource: { type: 'string' },
                        permissions: { type: 'array' }
                    }
                }
            },

            Permissions
        }
    }
);

export default mongoose.model('Roles', roleSchema);
