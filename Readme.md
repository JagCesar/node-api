# Learning [Node.js](https://nodejs.org), [koa](http://koajs.com), [JWT](http://jwt.io), [Postgres](http://www.postgresql.org) and [Heroku](https://www.heroku.com)

I needed to create an API for a side project so I decided to learn how it could be done. My JS skills are terrible, and this is the first time I play around with Postgres and Heroku. So if you find any errors, please post a Pull Request :)

# Features

- JSON responses
- Validation of arguments
- User registration, returns a unique JWT if successful
- Protected endpoints that require the user to send a valid JWT to gain access

# Prerequisites

To get this up and running you have to set up a Heroku web dyno and a Heroku Postgres database. [They have a great tutorial for this if you're unsure how to do this](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction).

Your Postgres database needs tables. Connect to your database and run these queries to set it up:

```
CREATE TABLE users (
    id            SERIAL,
    uuid			UUID NOT NULL
);
```

```
CREATE TABLE "added_items" (
    "id" serial,
    PRIMARY KEY ("id")
);
```

# Location, location, location

To store locations in our database we use Postgis. Postgis is available on Heroku, but to activate it you have to enter this query:

```
CREATE EXTENSION postgis;
```

To add spatial data to the table `added_items` you have to write the following query:

```
SELECT AddGeometryColumn('added_items', 'location', 4326, 'POINT', 2);
```

When saving a coordinate in the database we want to store lon, lat and SRID. SRID is a unique identifier that defines which coordinate system the coordinates are defined in. If we define the correct SRID, we can compare coordinates with different definitions. Coordinates sent to us from iOS are using SRID `4326`. Google maps use the same SRID. [I found this information here](http://gis.stackexchange.com/questions/48949/epsg-3857-or-4326-for-googlemaps-openstreetmap-and-leaflet).

## Postgis

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

# Endpoints

- `/` Writes out hello world. Nothing fancy
- `/validated` Validates that you're sending the GET argument `argument`. To get a 200 back, call `/validated?argument`
- `/register` Creates a new user entry in the database with a unique uuid. Then signs a new JWT that contains this uuid and returns it.
- `/protected` Requires you to send a valid JWT token that was signed by this API. It has to be provided as a HTTP Header (`Authorization`). If it is valid we return the content of the JWT
