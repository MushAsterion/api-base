import mongoose from 'mongoose';
import Role from './role.js';

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
            permissions: ['read:user', 'update:user'],

            editableProperties: ['roles'],

            propertiesPermissions: Object.entries({
                _id: [],
                roles: ['read:role']
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
                populate: Role._populate
            }
        }
    }
);

export default mongoose.model('Users', userSchema);
