# Comment Castles

Comment Castles is an internet forum that uses whitelist moderation. Users write posts, nested comments and user profiles. There is an instance running at [commentcastles.org](https://www.commentcastles.org)!

Other Features:

* OAuth 2 JSON API
* public and private groups
* inbox for direct comments you receive
* [help page](https://www.commentcastles.org/help)

## Install

Install one of the [tagged releases](https://github.com/ferg1e/comment-castles/releases), preferably the most recent.

Create a PostgreSQL 11 database and execute all the code in `sql/structure.sql`. This will create all the database tables, triggers, etc. PostgreSQL 11+ is probably fine.

Install Redis. This is only for the session store. Redis versions 2 and 6 worked for us, so most versions are probably fine.

Make sure you have Node.js installed. Use Node.js v16.14.0 or greater.

Run `npm install` to download all the Node.js dependencies that are listed in `package.json`.

Set the following environment variables:

* `PGHOST`: PostgreSQL host (usually `localhost`)
* `PGUSER`: PostgreSQL username
* `PGDATABASE`: PostgreSQL database name
* `PGPASSWORD`: PostgreSQL password
* `PGPORT`: PostgreSQL port
* `HTTP_PORT`: Port this app will use
* `REDIS_PORT`: Redis port
* `IS_PROD`: This is a redundant production flag (there's already the built-in `NODE_ENV`) that must be set. If `NODE_ENV` is `"production"` then set this flag to `1`, otherwise use `0`.
* `SESSION_NAME`: `express-session` `name`
* `SESSION_SECRET`: `express-session` `secret`
* `NODE_ENV`: built-in node environment flag

On Windows you can use a `.env` and `npm start` to set the environment variables. Here's a sample `.env`:

```
PGHOST=localhost
PGUSER=postgres
PGDATABASE=mydb
PGPASSWORD=123abc
PGPORT=5432
HTTP_PORT=80
REDIS_PORT=6379
IS_PROD=1
SESSION_NAME=mysesh
SESSION_SECRET=wOgw3oQpmbYbie7V
NODE_ENV=production
```

On Linux we used an `ecosystem.config.js` and `pm2 start ecosystem.config.js` to set the environment variables. Here is a sample `ecosystem.config.js`:

```
module.exports = {
    apps : [{
        name: "myappid",
        script: "./app.js",
        env: {
            PGHOST: "localhost",
            PGUSER: "postgres",
            PGDATABASE: "mydb",
            PGPASSWORD: "123abc",
            PGPORT: 5432,
            HTTP_PORT: 80,
            REDIS_PORT: 6379,
            IS_PROD: 1,
            SESSION_NAME: "mysesh",
            SESSION_SECRET: "wOgw3oQpmbYbie7V",
            NODE_ENV: "production",
        }
    }]
}
```

There must exist a user with a `user_id` of `1` and a `username` of `admin`. These two values serve as the default user whitelist and you can change them in `src/config/index.js` via `adminUsername` and `adminUserId`. So, after an instance of this application is launched, you should immediately sign up as the user `admin` (or whatever you are using for `adminUsername`). Also be sure to set `adminUserPublicId` in `src/config/index.js` (this value should be set to the `public_id` value of the admin that's in the `tuser` database table).

On the [API page](https://www.commentcastles.org/api), a post ID and comment ID are used in URLs on the page. If you want these links to work, you must create a post and comment and then set their IDs to match the ones used on the page.

## Update
When you deploy new commits to your instance of this app that is already running, make sure to also execute any new commands that are in `sql/migrations.sql`.

If you deployed your instance before commit [46d52bff7765b250317ee297d570800447cb4afa](https://github.com/ferg1e/comment-castles/commit/46d52bff7765b250317ee297d570800447cb4afa), then you need to run `scripts/gen-user-public-ids.js` in order to generate public IDs for users that are already in the database.

If you deployed your instance before commit [c88bb90499aa616cd4f1d2b777d21e9a90d470c4](https://github.com/ferg1e/comment-castles/commit/c88bb90499aa616cd4f1d2b777d21e9a90d470c4), then you need to run `scripts/populate-domain-names.js`.

If you deployed your instance before commit [90b98831eeb5785391b371cf46712f1a0b4a0e47](https://github.com/ferg1e/comment-castles/commit/90b98831eeb5785391b371cf46712f1a0b4a0e47), then you need to run `scripts/set-last-comment-times.js`.
