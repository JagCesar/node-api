var koa = require('koa'),
  route = require('koa-route'),
  app = module.exports = koa(),
  koaPg = require('koa-pg'),
  bouncer = require('koa-bouncer'),
  jwt = require('koa-jwt'),
  uuid = require('uuid'),
  json = require('koa-json'),
  crypto = require('crypto'),
  base64url = require('base64url');

app.use(koaPg(process.env.DATABASE_URL));
app.use(bouncer.middleware());
app.use(json({ pretty: false, param: 'pretty' }));

app.use(route.get('/', index));
app.use(route.get('/db', initDB));
app.use(route.get('/register', register));
app.use(route.get('/refreshToken', refreshToken));

function createPrivateToken() {
  return base64url(crypto.randomBytes(60));
}

function *index() {
  this.body = {'message': 'Hello world'};
}

function *initDB() {
  yield this.pg.db.client.query_('CREATE EXTENSION postgis;');
  yield this.pg.db.client.query_('CREATE TABLE "users" ("id" SERIAL, "uuid" UUID NOT NULL, "private_token" TEXT NOT NULL, PRIMARY KEY ("id"), UNIQUE ("uuid"), UNIQUE ("private_token"));');
  yield this.pg.db.client.query_('CREATE TABLE "places" ("id" serial, "name" text, "guid" UUID NOT NULL, PRIMARY KEY ("id"), UNIQUE ("guid"));');
  yield this.pg.db.client.query_('SELECT AddGeometryColumn(\'places\', \'coordinate\', 4326, \'POINT\', 2);');
  yield this.pg.db.client.query_('CREATE TABLE "check_ins" ("id" serial, "users.id" serial, "places.id" serial, "created_at" TIMESTAMPTZ NOT NULL, PRIMARY KEY ("id"), FOREIGN KEY ("users.id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY ("places.id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE);');

  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate", "guid") VALUES (\'Apple HQ\', ST_GeomFromText(\'POINT(37.3317115 -122.0323722)\', 4326), \'' + uuid.v4() + '\');');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate", "guid") VALUES (\'Facebook HQ\', ST_GeomFromText(\'POINT(37.4833149 -122.1517118)\', 4326), \'' + uuid.v4() + '\');');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate", "guid") VALUES (\'Google HQ\', ST_GeomFromText(\'POINT(37.4219999 -122.0862462)\', 4326), \'' + uuid.v4() + '\');');
  yield this.pg.db.client.query_('INSERT INTO places ("name", "coordinate", "guid") VALUES (\'Twitter HQ\', ST_GeomFromText(\'POINT(37.776692 -122.4189706)\', 4326), \'' + uuid.v4() + '\');');

  yield this.pg.db.client.query_('INSERT INTO users ("uuid", "private_token") VALUES (\'' + uuid.v4() + '\', \'' + createPrivateToken() + '\');');
  yield this.pg.db.client.query_('INSERT INTO check_ins ("users.id", "places.id", "created_at") VALUES (\'1\', \'1\', now());');

  this.body = '1';
}

function *register() {
  var uuidString = uuid.v4();
  var privateToken = createPrivateToken();
  var query = 'INSERT INTO users (uuid,private_token) VALUES (\'' + uuidString + '\', \'' + privateToken + '\');';
  var result = yield this.pg.db.client.query_(query);
  var token = jwt.sign({ uuid: uuidString }, process.env.JWT_SECRET, { expiresInMinutes: 1440, notBefore: 0, audience: "Audience", subject: "Subject", issuer: "https://www.example.com" });
  this.body = {'jwt': token, 'private_token': privateToken};
}

function *refreshToken() {
  this.validateQuery('privateToken')
    .required('Private token required')
    .isString()

  var query = 'SELECT uuid FROM users WHERE private_token = \'' + this.vals.privateToken + '\';';
  var result = yield this.pg.db.client.query_(query);

  if (result.rowCount > 0) {
    var token = jwt.sign({ uuid: result.rows[0].uuid }, process.env.JWT_SECRET, { expiresInMinutes: 1440, notBefore: 0, audience: "Audience", subject: "Subject", issuer: "https://www.example.com" });
    this.body = {'jwt': token};
  }
}

app.use(jwt({secret: process.env.JWT_SECRET}));

app.use(route.get('/checkIn', checkIn));
app.use(route.get('/locations', locations));
app.use(route.get('/locationsCloseToMe', locationsCloseToMe));

function *checkIn() {
  this.validateQuery('locationGuid')
    .required('Location guid required')
    .isUuid('v4', 'Location id must be a valid UUID v4');

  var uuid = this.state.user['uuid'];

  var query = 'INSERT INTO check_ins ("places.id", "users.id", "created_at") VALUES ((SELECT id FROM places WHERE guid=\'' + this.vals.locationGuid + '\'), (SELECT id FROM users WHERE uuid=\'' + uuid + '\'), now());';
  var result = yield this.pg.db.client.query_(query);
  this.body = '';
}

function *locations() {
  var result = yield this.pg.db.client.query_('SELECT guid, name FROM places;');
  this.body = result.rows;
}

function *locationsCloseToMe() {
  this.validateQuery('lat')
    .required('Latitude required')
    .toFloat()
    .isFiniteNumber('Latitude has to be a float');

  this.validateQuery('lon')
    .required('Longitude required')
    .toFloat()
    .isFiniteNumber('Longitude has to be a float');

  var query = 'SELECT name, guid FROM places WHERE ST_Distance_Sphere(coordinate, ST_GeomFromText(\'POINT(' + this.vals.lat + ' ' + this.vals.lon + ')\', 4326)) < 500;';
  var result = yield this.pg.db.client.query_(query);
  this.body = result.rows;
}

app.listen(process.env.PORT);
