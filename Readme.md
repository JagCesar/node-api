# Learning [Node.js](https://nodejs.org), [koa](http://koajs.com), [JWT](http://jwt.io), [Postgres](http://www.postgresql.org) and [Heroku](https://www.heroku.com)

I needed to create an API for a side project so I decided to learn how it could be done. My JS skills are terrible, and this is the first time I play around with Postgres and Heroku. So if you find any errors, please post a Pull Request :)

# Prerequisites

To get this up and running you have to set up a Heroku web dyno and a Heroku Postgres database. [They have a great tutorial for this if you're unsure how to do this](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction).

Your Postgres database needs a table named `users`. Connect to your database and run this query to set it up:

```
CREATE TABLE users (
    id            SERIAL,
    uuid			UUID NOT NULL
);
```

# Environment vars

Some variables aren't available in the code, such as `process.env.DATABASE_URL`, `process.env.PORT` and `process.env.JWT_SECRET`. I made this on purpose since these would give you access to my Heroku environment. To set these values you create a file named `.env` in your cloned repository folder and add this content:

```
DATABASE_URL='postgres://john:appleseed@example.com:5432/databaseName?ssl=true'
HTTP_TIMEOUT=10000
PORT=4000
JWT_SECRET='shared-secret'
```

Remember to change the `JWT_SECRET` to a random string to verify that the JWTs you receive are signed by you.

Next thing you have to do is install [node-foreman](https://github.com/strongloop/node-foreman). Do it by writing `npm install -g foreman` in your terminal.

# Get it running 🏃

Make sure you're in the cloned repository folder, and then write `npm install` to install dependencies needed. Once this is done you write `npm start` to get it up and running.
