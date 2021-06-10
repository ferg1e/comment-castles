# Peaches 'n' Stink

Peaches 'n' Stink is an experimental Internet forum. Users write posts and nested comments. You can try out the official instance at [peachesnstink.com](https://www.peachesnstink.com)!

Moderation systems are very important when it comes to Internet message boards. On most boards, all users use the same moderation blacklist that is maintained by the owners of the forum. With this project we are trying out something close to the opposite of that, each user uses their own moderation whitelist. Users can use other users' whitelists (but only certain users' lists are made available for use).

Other features:

* [Instruction Manual](https://www.peachesnstink.com/manual)
* Inbox that shows all comments made on your posts and comments
* Everything works with front-end JavaScript turned off
* Option to use AJAX commenting or non-JavaScript commenting
* Setting to set the width of the site
* Can use settings when logged out
* Works properly on practically all browsers and devices
* No up or down voting
* No follower counts
* REST API (but currently read-only with no auth)
* Groups
* Can post source code snippets in posts and comments

## Install

Create a PostgreSQL 11 database and execute all the code in `doc-commit/structure.sql`. This will create all the database tables, triggers, etc. PostgreSQL 11+ is probably fine.

Install Redis. This is only for the session store. Redis versions 2 and 6 worked for us, so version 2+.

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

There must exist a user with a `user_id` of `1` and a `username` of `stink`. These two values are currently hardcoded into the application and serve as the default user whitelist. So after an instance of this application is launched, you should immediately sign up as the user `stink`. Also set `is_eyes` to `true` for `stink` in the `tuser` database table.

On the [API page](https://www.peachesnstink.com/api), a post ID and comment ID are used in URLs on the page. If you want these links to work, you must create a post and comment and then set their IDs to match the ones used on the page.
