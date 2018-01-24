# Quill-ShareDB-Cursors
An attempt at multi cursors sync in a collaborative editing scenario using [Quill](https://quilljs.com/), a [ShareDB](https://github.com/share/sharedb) backend, and the [reedsy/quill-cursors](https://github.com/reedsy/quill-cursors) Quill module. For more info on each component, check their pages/repositories.

Built by [pedrosanta](https://github.com/pedrosanta) at [Reedsy](https://reedsy.com).

A working demo is available at: https://quill-sharedb-cursors.herokuapp.com

**Contents:**

* [How to run](#how-to-run)
* [Ongoing Quill cursor efforts and discussion](#ongoing-quill-cursor-efforts-and-discussion)
* [About this project](#about-this-project)
* [Known Issues](#known-issues)
* [TODO](#todo)
* [License](#license)

## How to run

Before trying to run this example, make sure you have a fairly recent (6 LTS or earlier, 8 LTS recommended) version of **[Node](https://nodejs.org/)**.

```sh
node -v
```

Opted to have **[MongoDB](https://www.mongodb.com)** storage for this particular example, so make sure it's installed and running. Alternatively, if you have [Docker](https://www.docker.com) installed you can spin an instance quickly by running the command:

``` Shell
docker run -p 27017:27017 mongo
```

[Clone the repository](https://help.github.com/articles/cloning-a-repository) and install dependencies. It will also run the necessary [webpack](https://webpack.js.org) build task automatically for you.

```sh
npm install
```

Run the project:

```shell
DEBUG=quill-sharedb-cursors:* npm start
```

#### Development watch task

For convenience while developing, a build task with watch is included:

```shell
npm run watch
```

## Ongoing Quill cursor efforts and discussion

For a proper multi cursor feature the following is usually considered:

* The final experience with Quill editor should display and sync both **caret** and any eventual **selections** each user/client has at the moment, and it also should display the user name to properly identify the cursor/user/client;
* Quill is a library for a rich-text editor _focused solely on the **front-end** side_, so concerns related to keeping **multi-user document and cursor in sync** should be implemented with the help of additional middleware and backend technology/code (being [ShareDB](https://github.com/share/sharedb) the most obvious one, but there are others like [Meteor](https://www.meteor.com), or even your own, etc.);
* Given that, and in what it concerns Quill, the best approach is through a **cursors module** (optional, extends Quill functionality) providing an API to set/update/remove cursors while also being responsible to automatically update cursors position when contents are changed/updated;

For more info on how the various efforts/communities are coordinating and working towards this, keep reading below.

### Quill and cursor module

Regarding Quill and multi cursors it is important to start on the older **v0.20** version of Quill, which already provided a multi cursors module - [check it out here](https://github.com/quilljs/quill/blob/0.20.1/src/modules/multi-cursor.coffee) - and which formed the basis of follow up work for this topic. It's important to note that this module only supported/had API for carets, but not selections.

During the extensive changes from v0.20 to v1 this module has been since removed, but there is an active ongoing effort to re-implement this feature for Quill v1. To follow this effort and discussion check the issue:

* **[quilljs/quill#918 – Multiple Cursors Module](https://github.com/quilljs/quill/issues/918)**

This feature has since [been added to Backlog by jhchen](https://github.com/quilljs/quill/issues/918#event-1035830952) to be implemented soon.

During the discussion [benbro](https://github.com/benbro) updated the old v0.20 multi cursors module to work with v1, that can be checked out here:

* https://github.com/benbro/quill/tree/multi-cursor

Additionally, and based on the work it has been done over at [Reedsy](https://reedsy.com) related to multi cursor sync (*both for carets and selections*) built on top of the v0.20 of Quill, the multi cursors module was published and made available as a way to contribute to the community and help this effort move forward:

* **GitHub: https://github.com/reedsy/quill-cursors**
* **NPM: https://www.npmjs.com/package/quill-cursors**

After this functionality is included in the new v1 multi cursors module, this module is to be deprecated.

To check where the efforts for multi cursor sync on middleware/backend stand at the moment, continue to read on below.

### ShareDB

In what regards to ShareDB, the issue where the current discussion and effort is being handled is the following:

* **[share/sharedb#128 - Add cursor synchronization to an editor](https://github.com/share/sharedb/issues/128)**

[nateps](https://github.com/nateps), the main contributor to the project, [puts this high on the priority list and expands a bit on **ephemeral data** concept](https://github.com/share/sharedb/issues/128#issuecomment-252152894), that would benefit a cursor sync feature.

Additionally, there seems to be a lot of history on the discussion of this feature both on [ShareJS/ShareDB mailing list](https://groups.google.com/forum/#!searchin/sharejs/cursor%7Csort:relevance), as well as [ShareJS GitHub issue tracker](https://github.com/josephg/ShareJS/issues?utf8=✓&q=cursor).

### Other backends (Meteor, Yjs)

There are some cases of Quill working with other backends, namely [Meteor](https://www.meteor.com) and [Yjs](http://y-js.org).

On Meteor thought, haven't found any information of an effort regarding multi cursors discussion or implementation.

As for Yjs, [Joeao](https://github.com/Joeao) seems to be leading an effort to have multi cursors working ([y-js/yjs#65](https://github.com/y-js/yjs/issues/65), [y-js/y-richtext#112](https://github.com/y-js/y-richtext/issues/112)).

## About this project

Overview and notes on some decisions taken to build the example project.

### Transport Layer (WebSockets, reconnecting)

Although ShareDB [relatively bare documentation](https://github.com/share/sharedb#listening-to-websocket-connections) [on transport layer](https://github.com/share/sharedb#client-api) is shown to use WebSockets, looking into its [source code](https://github.com/share/sharedb/blob/master/lib/client/connection.js), one can see that any WebSocket API-compatible transport layer will work.

In the past ShareJS and LiveDB (earlier ShareDB) recommended **[node-browserchannel](https://github.com/josephg/node-browserchannel)** - which was pretty good, as it reconnected seamlessly, but it resorted to *long-polling*. But as a note on its README says, WebSocket support is now reasonably universal, and strongly suggests using raw websockets for new projects.

But by using bare WebSockets, we don't have any connection interruption/reconnection mechanism in place out-of-the-box.

So for this project, **[reconnecting-websocket](https://github.com/joewalnes/reconnecting-websocket)** was used, along [some ping/keep-alive code](https://github.com/pedrosanta/quill-sharedb-cursors/blob/master/helpers/wss-sharedb.js#L29) to help manage the connection 'health'/availability - and keep about the same functionality of browserchannel on this aspect.

<u>Keep in mind</u> that ShareDB Connection does not handle WebSocket/transport reconnections, but it will resubscribe any document and sync pending/offline updates upon socket reconnection. For more on that check **[share/sharedb#121](https://github.com/share/sharedb/issues/121)** and **[share/sharedb#138](https://github.com/share/sharedb/pull/138)**.

#### Socket.io

Socket.io isn't WebSocket API-compatible, so won't work without some sort of wrapper implementing it, it seems. Also there is a  warning on ShareJS documentation regarding Socket.io that it sometimes [doesn't guarantee in-order message delivery](https://github.com/josephg/ShareJS/blob/master/README.md#client-server-communication). Checking [josephg/ShareJS#375](https://github.com/josephg/ShareJS/issues/375) gives some more insight into it, which points to some feasibility as long as **only** 'websocket' transport is used and probably configured **without transport upgrade** on Socket.io/Engine.io.

Eitherway, ShareDB Socket.io support is a poor/unknown at best and without thorough testing. If you manage to get a good working example with ShareDB and Socket.io, please share away!

### Storage, MongoDB

For this example, simple `ShareDB.MemoryDB` (or even [`ShareDBMingoMemory`](https://github.com/share/sharedb-mingo-memory)) adapter would suffice, but because I wanted this to keep close to a scenario I'm working at the moment, opted to test this in tandem with MongoDB and [`ShareDBMongo`](https://github.com/share/sharedb-mongo) adapter.

### Explicitly register rich-text OT type

Another aspect to keep in mind is that `rich-text` doesn't come registered by default as an available OT type on ShareDB, so we need to:

1. Include **[ottypes/rich-text](https://github.com/ottypes/rich-text)** as dependency (as well as make it available/bundled for client);
2. **Register** `rich-text` type both **[on Server](https://github.com/pedrosanta/quill-sharedb-cursors/blob/master/helpers/sharedb-server.js#L3)** and **[on Client](https://github.com/pedrosanta/quill-sharedb-cursors/blob/master/public/javascripts/main.js#L7)**;

### Quill-ShareDB client listeners

The basics about having ShareDB and Quill working together rely on listening to two events:

* For *local changes/updates that must be transmitted to server*, [listen on Quill `text-change` event and, for user changes, submit the operation to ShareDB document](https://github.com/share/sharedb/blob/master/examples/rich-text/client.js#L25);
* For *changes/updates sent by the server to be applied locally*, [listen on ShareDB document `op` event and, for non local update sources, call Quill `updateContents(…)`](https://github.com/share/sharedb/blob/master/examples/rich-text/client.js#L29);

### Cursor server and client middleware

There are several ways one could implement cursor sync behaviour, but in this case this implementation has the following components:

* **[`helpers/wss-cursors.js`](https://github.com/pedrosanta/quill-sharedb-cursors/blob/master/helpers/wss-cursors.js)** - A server part that:
  * Maintains a list of active connections;
  * Listens for update messages (through WebSockets);
  * And broadcasts an update as well as the list of active connections to all connected clients upon receiving an update from a client;
* **[`public/javascripts/cursors.js`](https://github.com/pedrosanta/quill-sharedb-cursors/blob/master/public/javascripts/cursors.js)** - A client part that:
  * Inits and holds client own cursor information;
  * Maintains a list of the active cursors/clients, based off the updates received from the server;
  * Sends an update of own cursor information, fired when a Quill `selection-change` event fires;
  * Fires a 'cursors updated' event (when a cursors update message is received from server) so Quill instances can update their cursors using the cursors module API;

The data each cursor is sending and syncing is:

* **`id`**, the cursor/client id autogenerated by the server;
* **`name`**, the name to display on the cursor;
* **`color`**, CSS color of the cursor;
* **`range`**, the current range from the client, obtained from `quill.getSelection()`;

## Known Issues

For the most of the time the editor and cursor sync seem to behave as it should be expected. But on a few cases the cursor position gets misplaced - I have a strong suspicion the cause are racing conditions, as these issues are hard to replicate, occur sometimes, and usually involve two or more people typing at the same time.

The main issues currently identified in this example, are:

* [**Selection/cursor-change and edits racing condition #1**](https://github.com/pedrosanta/quill-sharedb-cursors/issues/1): When editing/inserting text immediatly after caret position moves with the arrow keys, can lead to cursor being misplaced (leading it to be stuck on the wrong position);
* [**Cursor misplacement on concurrent editing with 'Enter'/new lines #2**](https://github.com/pedrosanta/quill-sharedb-cursors/issues/2): Sometimes, when two users are editing, and one of them adds a few new lines, its cursor gets shifted by a few positions (usually, 1-3 positions forward);

## TODO

* Update server code to ES6

## License

This code is available under the [MIT license](LICENSE-MIT.txt).
