var Router = require('koa-router'),
  koaPg = require('koa-pg');

var privateRouter = new Router();

privateRouter
  .get('/', function *next() {
    var result = yield this.pg.db.client.query_('SELECT guid, name FROM places;');
    this.body = result.rows;
  })
  .get('/checkIn', function *(next) {
    this.validateQuery('locationGuid')
      .required('Location guid required')
      .isUuid('v4', 'Location id must be a valid UUID v4');

    var uuid = this.state.user['uuid'];

    var query = 'INSERT INTO check_ins ("places.id", "users.id", "created_at") VALUES ((SELECT id FROM places WHERE guid=\'$1\'), (SELECT id FROM users WHERE uuid=\'$2\'), now());';
    var params = [this.vals.locationGuid, uuid];
    var result = yield this.pg.db.client.query_(query, params);
    this.body = '';
  })
  .get('/nearby', function *next() {
    this.validateQuery('lat')
      .required('Latitude required')
      .toFloat()
      .isFiniteNumber('Latitude has to be a float');

    this.validateQuery('lon')
      .required('Longitude required')
      .toFloat()
      .isFiniteNumber('Longitude has to be a float');

    var query = 'SELECT name, guid FROM places WHERE ST_Distance_Sphere(coordinate, ST_GeomFromText($1, 4326)) < 500;';
    var params = [esc('POINT(%s %s)', this.vals.lat, this.vals.lon)];
    var result = yield this.pg.db.client.query_(query, params);
    this.body = result.rows;
  })

module.exports = privateRouter;
