var koa = require('koa'),
  route = require('koa-route'),
  app = module.exports = koa(),
  koaPg = require('koa-pg'),
  bouncer = require('koa-bouncer'),
  jwt = require('koa-jwt'),
  uuid = require('uuid'),
  json = require('koa-json');

app.use(koaPg(process.env.DATABASE_URL));
app.use(bouncer.middleware());
app.use(json({ pretty: false, param: 'pretty' }));

app.use(route.get('/', index));
app.use(route.get('/db', initDB));
app.use(route.get('/register', register));

function *index() {
  this.body = {'message': 'Hello world'};
}

function *initDB() {
  yield this.pg.db.client.query_('CREATE EXTENSION postgis;');
  yield this.pg.db.client.query_('CREATE TABLE "users" ("id" SERIAL, "uuid" UUID NOT NULL, PRIMARY KEY ("id"));');
  yield this.pg.db.client.query_('CREATE TABLE "places" ("id" serial, "name" text, PRIMARY KEY ("id"));');
  yield this.pg.db.client.query_('SELECT AddGeometryColumn(\'places\', \'coordinate\', 4326, \'POINT\', 2);');
  yield this.pg.db.client.query_('CREATE TABLE "check_ins" ("id" serial, "users.id" serial, "places.id" serial, PRIMARY KEY ("id"), FOREIGN KEY ("users.id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY ("places.id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE);');

  // Let's populate the places table
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate") VALUES (\'Apple HQ\', ST_GeomFromText(\'POINT(37.3317115 -122.0323722)\', 4326));');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate") VALUES (\'Facebook HQ\', ST_GeomFromText(\'POINT(37.4833149 -122.1517118)\', 4326));');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate") VALUES (\'Google HQ\', ST_GeomFromText(\'POINT(37.4219999 -122.0862462)\', 4326));');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate") VALUES (\'Twitter HQ\', ST_GeomFromText(\'POINT(37.776692 -122.4189706)\', 4326));');

  this.body = '1';
}

function *register() {
  var uuidString = uuid.v4();
  var query = 'INSERT INTO users (uuid) VALUES (\'' + uuidString + '\');';
  var result = yield this.pg.db.client.query_(query);
  var token = jwt.sign({ uuid: uuidString }, process.env.JWT_SECRET);
  this.body = {'jwt': token};
}

app.use(jwt({secret: process.env.JWT_SECRET}));

app.use(route.get('/checkIn', checkIn));
app.use(route.get('/locations', locations));

function *checkIn() {
  this.validateQuery('lat')
    .required('Latitude required');

  this.validateQuery('lon')
    .required('Longitude required');

  var uuid = this.state.user['uuid'];
  var query = 'INSERT INTO check_ins ("location", "users.id") VALUES (ST_GeomFromText(\'POINT(' + this.vals.lat + ' ' + this.vals.lon + ')\', 4326), (SELECT id FROM users WHERE uuid=\'' + uuid + '\'));';
  var result = yield this.pg.db.client.query_(query);
  this.body = '';
}

function *locations() {
  result = yield this.pg.db.client.query_('SELECT id, name FROM places;');
  this.body = result.rows;
}

function *distance() {
  var query = 'SELECT location FROM check_ins WHERE ST_Distance_Sphere(location,ST_GeomFromText(\'POINT(59.3354419 18.0577941)\', 4326)) < 500;';
}

app.listen(process.env.PORT);
