import Record from '../../models/system/record.js';

const error = new Error();

/**
 * Get a collection.
 * @param {string} responsible_id - ID of the user making the request. Must be request.userData.auth.user?._id.
 * @param {import('mongoose').Model} Model - Model to get the data from.
 * @param {import('mongoose').FilterQuery<Model>} query - Query to filter the collection.
 * @returns {Promise<import('mongoose').Document[]>}
 */
export const getCollection = async (responsible_id, Model, query) => (Model._populate ? Model.find(query).populate(Model._populate) : Model.find(query)).exec();

/**
 * Post to a collection.
 * @param {string} responsible_id - ID of the user making the request. Must be request.userData.auth.user?._id.
 * @param {import('mongoose').Model} Model - Model to post to.
 * @param {import('mongoose').Document} obj - Document to post.
 * @returns {Promise<import('mongoose').Document>}
 */
export const postToCollection = async (responsible_id, Model, obj) => {
    const document = new Model(obj);
    const d = await document.save();

    Record.record(responsible_id, d._id, Model.modelName, 'POST', JSON.stringify(d), '');

    return Model._populate ? Model.populate(d, Model._populate) : d;
};

/**
 * Get a document.
 * @param {string} responsible_id - ID of the user making the request. Must be request.userData.auth.user?._id.
 * @param {import('mongoose').Model} Model - Model to get the document from.
 * @param {string} id - ID of the document to get.
 * @returns {Promise<import('mongoose').Document>}
 */
export const getDocument = async (responsible_id, Model, id) => {
    const document = await (Model._populate ? Model.findOne({ _id: id }).populate(Model._populate) : Model.findOne({ _id: id })).exec();

    if (!document) {
        error.statusCode = 404;
        throw error;
    }

    return document;
};

/**
 * Update a document.
 * @param {string} responsible_id - ID of the user making the request. Must be request.userData.auth.user?._id.
 * @param {import('mongoose').Model} Model - Model to update the document in.
 * @param {string} id - ID of the document to update.
 * @param {import('mongoose').Document} $set - Values to set.
 * @returns {Promise<import('mongoose').Document>}
 */
export const updateDocument = async (responsible_id, Model, id, $set) => {
    const document = await Model.findByIdAndUpdate(id, { $set }, { returnDocument: 'after' }).exec();

    if (!document) {
        error.statusCode = 404;
        throw error;
    }

    Record.record(responsible_id, document._id, Model.modelName, 'PATCH', JSON.stringify(document), '');

    return Model._populate ? Model.populate(document, Model._populate) : document;
};

/**
 * Delete a document.
 * @param {string} responsible_id - ID of the user making the request. Must be request.userData.auth.user?._id.
 * @param {import('mongoose').Model} Model - Model to delete the document from.
 * @param {string} id - ID of the document to delete.
 * @returns {Promise<import('mongoose').Document>}
 */
export const deleteDocument = async (responsible_id, Model, id) => {
    const document = await Model.findByIdAndDelete(id).exec();

    if (!document) {
        error.statusCode = 404;
        throw error;
    }

    Record.record(responsible_id, document._id, Model.modelName, 'DELETE', JSON.stringify(document), '');

    return Model._populate ? Model.populate(document, Model._populate) : document;
};

export default {
    getCollection,
    postToCollection,
    getDocument,
    updateDocument,
    deleteDocument
};
