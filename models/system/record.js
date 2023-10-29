import mongoose from 'mongoose';

const name = 'record';
const Permissions = {
    Read: `read:${name}`,
    Create: `create:${name}`,
    Update: `update:${name}`,
    Delete: `delete:${name}`
};

const recordSchema = new mongoose.Schema(
    {
        createdAt: {
            type: mongoose.SchemaTypes.Number,
            default: Date.now,
            required: false
        },
        creator: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Users',
            required: true
        },
        content: {
            type: mongoose.SchemaTypes.ObjectId,
            required: true
        },
        model: {
            type: mongoose.SchemaTypes.String,
            required: true
        },
        action: {
            type: mongoose.SchemaTypes.String,
            required: true,
            enum: ['POST', 'PATCH', 'DELETE']
        },
        value: {
            type: mongoose.SchemaTypes.String,
            required: true
        },
        reason: {
            type: mongoose.SchemaTypes.String,
            default: '',
            required: false
        }
    },
    {
        statics: {
            permissions: [Permissions.Read],

            propertiesPermissions: Object.entries({
                _id: [],
                createdAt: [],
                creator: [],
                content: [],
                model: [],
                action: [],
                value: [],
                reason: []
            }),

            idParam: 'record_id',

            /**
             *
             * @param {mongoose.ObjectId} creator
             * @param {mongoose.ObjectId} content
             * @param {string} model
             * @param {"POST"|"PATCH"|"DELETE"} action
             * @param {string} value
             * @param {string} [reason]
             * @returns {Promise<mongoose.Document|undefined>}
             */
            record: async function (creator, content, model, action, value, reason = '') {
                try {
                    const doc = await new this({
                        creator,
                        content,
                        model,
                        action,
                        value,
                        reason
                    }).save();

                    return doc;
                } catch (err) {}

                return undefined;
            },

            Permissions
        }
    }
);

export default mongoose.model('Records', recordSchema);
