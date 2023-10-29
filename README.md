# api-base

This module is a very basic module for an API using Fastify and Mongoose.

It already includes 3 Mongoose models with permissions, routes and editable properties:

User

-   Methods: `GET`, `PATCH`
-   Permissions: `read:user`, `update:user`
-   Editable properties: `roles`

Role

-   Methods: `GET`, `POST`, `PATCH`, `DELETE`
-   Permissions: `read:role`, `create:role`, `update:role`, `delete:role`
-   Editable properties: `name`, `resource`, `permissions`

Record

-   Methods: `GET`
-   Permissions: `read:record`
-   Editable properties: _None_

Record are the source of trust for actions history and there is volontarily no support for deletion. May you not use a controller function for your other models but a raw function it will still generate records.

# Installation

Node.JS 16.0.0 or newer is required.

```
npm install MushAsterion/api-base
```

# Initialization

```JavaScript
import api from 'api-base';

const app = api({
    db: DB_URI,
    pluginOptions: {
        jwt: { secret: JWT_SECRET }
    },
    authRoutes: async (fastify, options) => undefined,
    router: async (fastify, options) => undefined
});

app.listen({ port: PORT })
    .catch(console.error)
    .then(address => console.log(`Server listening at ${address}`));
```

# Creating routes

Routes should be handled by a general Fastify plugin. An example plugin would look like:

```JavaScript
import exampleRoute from './example.js';

export default async function router(fastify, options) {
    await fastify.register(exampleRoute, { prefix: '/example' });
    // ...
}
```

When it comes to route you can either create them yourself or use the provided controller generator. You can also add optional middlewares for `POST`/`PATCH` validation as well as `DELETE` processing.

```JavaScript
import ExampleModel from '../models/ExampleModel.js';
import { controller } from 'api-base';

export default controller(ExampleModel, ['GET', 'POST', 'PATCH', 'DELETE']);
```

May you want to make your own controller, you also have controller fuctions `getCollectionController`, `postToCollectionController`, `getDocumentController`, `updateDocumentController`, `deleteDocumentController`. You also have raw functions `getCollection`, `postToCollection`, `getDocument`, `updateDocument`, `deleteDocument` available directly or within `system`.

To parse permissions from the route when you enter a resource you can call `parsePermissions`, this must be use on every path where a resource has permissions. To make sure use have permission on you route you can use `authorize`. This function must be called after `parsePermission`.

```JavaScript
export default async function route(fastify, options) {
    fastify.get(`/:example_id`, async (request, reply) => {
        await parsePermissions(request, 'example_id');
        await authorize(request, 'read:example');
        // ...
    });
}
```

# Writing models

The module is using Mongoose to communicate with MongoDB database. You can use this module with any basic model, however if you want to use them with the controllers you will have to add statics to your Mongoose schema:

```JavaScript
const exampleModelSchema = new mongoose.Schema(
    { /* Your normal mongoose schema */ },
    {
        statics: {
            // Unique properties for the model enforced on built-in controllers.
            uniqueProperties: [],

            // Permissions for this Model
            permissions: [],

            // Properties that can be edited from POST/PATCH requests. Can be a string or an object of form {name: string, permissions: string|string[]|(request: FastifyRequest) => boolean}
            editableProperties: [],

            // Permissions required to get a property when performing GET request. If a property is not here, it will not be retourned from GET requests and if the array is empty it means that no permissions are required.
            propertiesPermissions: Object.entries({
                _id: []
            }),

            // ID parameter name in the query, the following is for /:example_id
            idParam: 'example_id',

            // Schema validation for when performing POST/PATCH operations.
            fastifySchema: {
                body: {
                    type: 'object',
                    required: [ /* ... */ ],
                    properties: {
                        // ...
                    }
                }
            },

            // Population options. Documents will always get populated based on this.
            _populate: {}
        }
    }
);
```

New models must be created from the `mongoose` instance.

```JavaScript
import { mongoose } from 'api-base';
mongoose.model('Example', exampleModelSchema)
```

# Extending base models

Base models can be extended by editing as follows

```JavaScript
import { mongoose } from 'api-base';

const User = mongoose.models.Users;

const userSchema = User.schema;
userSchema.obj.username = {
    type: mongoose.SchemaTypes.String,
    default: ''
};

const propertiesPermissions = Object.entries({
    ...Object.fromEntries(userSchema.statics.propertiesPermissions),
    username: []
});

userSchema.statics.propertiesPermissions = propertiesPermissions;
User.propertiesPermissions = propertiesPermissions;
```

You can also provide a full schema directly in the configuration. Just make sure to start from the existing ones.
