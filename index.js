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
  console.log(this.req);
  this.body = {'message': 'Hello world'};
}

function *initDB() {
  yield this.pg.db.client.query_('CREATE EXTENSION postgis;');
  yield this.pg.db.client.query_('CREATE TABLE "users" ("id" SERIAL, "uuid" UUID NOT NULL, PRIMARY KEY ("id"));');
  yield this.pg.db.client.query_('CREATE TABLE "check_ins" ("id" serial, "users.id" serial, PRIMARY KEY ("id"), FOREIGN KEY ("users.id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE);');
  yield this.pg.db.client.query_('SELECT AddGeometryColumn(\'check_ins\', \'location\', 4326, \'POINT\', 2);');
  this.body = '1'
}

function *register() {
  var uuidString = uuid.v4();
  var query = 'INSERT INTO users (uuid) VALUES (\'' + uuidString + '\');';
  var result = yield this.pg.db.client.query_(query);
  var token = jwt.sign({ uuid: uuidString }, process.env.JWT_SECRET);
  this.body = {'jwt': token};
}

app.use(jwt({secret: process.env.JWT_SECRET}));

app.use(route.get('/protected', protected));
app.use(route.get('/checkIn', checkIn));

function *protected() {
  this.body = this.state.user;
}

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

function *distance() {
  var query = 'SELECT location FROM check_ins WHERE ST_Distance_Sphere(location,ST_GeomFromText(\'POINT(59.3354419 18.0577941)\', 4326)) < 500;';
}

app.listen(process.env.PORT);
