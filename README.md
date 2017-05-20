# Quill-ShareDB-Cursors
An attempt at multi cursors sync in a collaborative editing scenario using [Quill](https://quilljs.com/), a [ShareDB](https://github.com/share/sharedb) backend, and the [reedsy/quill-cursors](https://github.com/reedsy/quill-cursors) Quill module. For more info on each component, check their pages/repositories.

Built by [pedrosanta](https://github.com/pedrosanta) at [Reedsy](https://reedsy.com).

A working demo is available at: https://quill-sharedb-cursors.herokuapp.com

## How to run

Before trying to run this example, make sure you have **[Node](https://nodejs.org/)** v6 LTS (recommended) or earlier installed.

```sh
node -v
```

Opted to have **[MongoDB](https://www.mongodb.com)** storage for this particular example, so make sure you it's installed and running. Alternatively, if you have [Docker](https://www.docker.com) installed you can spin an instance quickly by running the command:

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

For more info on how the various communities are coordinating and working towards this, keep reading below.

### Quill and cursor module

Regarding Quill and multi cursors it is important to start on the older **v0.20** version of Quill, which already provided a multi cursors module - [check it out here](https://github.com/quilljs/quill/blob/0.20.1/src/modules/multi-cursor.coffee) - and which formed the basis of follow up work for this topic. It's important to note that this module only supported/had API for carets, but not selections.

During the extensive changes from v0.20 to v1 this module has been since removed, but there is an active ongoing effort to re-implement this feature for Quill v1. To follow this effort and discussion check the issue:

* **[quilljs/quill#918 – Multiple Cursors Module](https://github.com/quilljs/quill/issues/918)**

This feature has since [been added to Backlog by jhchen](https://github.com/quilljs/quill/issues/918#event-1035830952) to be implemented soon.

During the discussion [benbro](https://github.com/benbro) updated the old v0.20 multi cursors module to work with v1, that can be checked out here:

* https://github.com/benbro/quill/tree/multi-cursor

Additionally, and based off the work it has been done over at [Reedsy](https://reedsy.com) related to multi cursor sync (*both for carets and selections*) built on top of the v0.20 of Quill, the multi cursors module was published and made available as a way to contribute to the community and help this effort move forward:

* **GitHub: https://github.com/reedsy/quill-cursors**
* **NPM: https://www.npmjs.com/package/quill-cursors**

After this functionality is included in the new v1 multi cursors module, this module is to be deprecated.

To check where the efforts for multi cursor sync on middleware/backend stand at the moment, continue to read on below.

### ShareDB

To complete.

### Other backends (Yjs)

To complete.

## About this project

To complete.

## Known Issues

To complete.

## TODO

* Update server code to ES6

## License

This code is available under the [MIT license](LICENSE-MIT.txt).