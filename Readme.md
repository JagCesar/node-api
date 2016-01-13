# Learning [Node.js](https://nodejs.org), [koa](http://koajs.com), [JWT](http://jwt.io), [Postgres](http://www.postgresql.org), [Postgis](http://postgis.net) and [Heroku](https://www.heroku.com)

I needed to create an API for a side project so I decided to learn how it could be done. My JS skills are terrible, and this is the first time I play around with Postgres and Heroku. So if you find any errors, please post a Pull Request :)

# Features

- JSON responses
- Validation of arguments
- User registration, returns a unique JWT if successful
- Protected endpoints that require the user to send a valid JWT to gain access

# Prerequisites

To get this up and running you have to set up a Heroku web dyno and a Heroku Postgres database. [They have a great tutorial for this if you're unsure how to do this](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction).

# Location, location, location

To store locations in our database we use [Postgis](http://postgis.net), which is available on Heroku.

When saving a coordinate in the database we want to store lon, lat and SRID. SRID is a unique identifier that defines which coordinate system the coordinates are defined in. We store the SRID to be able to mix different different type of coordinates in the future. Coordinates sent to us from iOS are using SRID `4326`. Google maps uses the same SRID. [I found this information here](http://gis.stackexchange.com/questions/48949/epsg-3857-or-4326-for-googlemaps-openstreetmap-and-leaflet).

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

Make sure you're in the cloned repository folder, then do the following:
- Write `npm install` to install the dependencies needed
- Write `npm start` to get the service up and running locally
- Write `curl http://localhost:4000/db` to create the required tables in the database

# Endpoints

- `/` Writes out hello world. Nothing fancy
- `/db` Creates the tables needed and sets up PostGIS
- `/register` Creates a new user entry in the database with a unique uuid. Then signs a new JWT that contains this uuid and returns it.
- `/refreshToken` Creates a JWT and returns is. Requires a `private_token` to be sent as a GET query.
- `/locations` Lists all available locations. Requires a valid JWT.
- `/locationsCloseToMe` Lists all locations close to the coordinates sent. Send `lat`(latitude) and `lon`(longitude). Requires a valid JWT. The JWT has to be provided as a HTTP Header (`Authorization`).
- `/checkIn` Creates a new entry in the the `check_ins` table in the database connected to the current user. This endpoint requires `locationGuid` to be sent as a GET query, and a valid JWT. The JWT has to be provided as a HTTP Header (`Authorization`). You'll find a location guid by listing locations.