var Router = require('koa-router'),
  uuid = require('uuid'),
  crypto = require('crypto'),
  base64url = require('base64url'),
  koaPg = require('koa-pg');

var publicRouter = new Router();

publicRouter
  .get('/', function *(next) {
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
  })

function createPrivateToken() {
  return base64url(crypto.randomBytes(60));
}

module.exports = publicRouter;
