import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: mongoose.SchemaTypes.String,
            required: true,
            unique: true
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
            permissions: ['read:role', 'create:role', 'update:role', 'delete:role'],

            editableProperties: ['name', 'resource', 'permissions'],

            uniqueProperties: ['name'],

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
            }
        }
    }
);

export default mongoose.model('Roles', roleSchema);
