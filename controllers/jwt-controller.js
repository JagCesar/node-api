var Router = require('koa-router'),
  uuid = require('uuid'),
  crypto = require('crypto'),
  base64url = require('base64url'),
  koaPg = require('koa-pg'),
  jwt = require('koa-jwt');

var publicRouter = new Router();
var privateRouter = new Router();

publicRouter
  .get('/register', function *(next) {
    var uuidString = uuid.v4();
    var privateToken = createPrivateToken();
    var query = 'INSERT INTO users (uuid,private_token) VALUES (\'' + uuidString + '\', \'' + privateToken + '\');';
    var result = yield this.pg.db.client.query_(query);
    var token = jwt.sign({ uuid: uuidString }, process.env.JWT_SECRET, { expiresInMinutes: 1440, notBefore: 0, audience: "Audience", subject: "Subject", issuer: "https://www.example.com" });
    this.body = {'jwt': token, 'private_token': privateToken};
  })

privateRouter
  .get('/refresh', function *(next) {
    this.validateQuery('privateToken')
      .required('Private token required')
      .isString()

    var query = 'SELECT uuid FROM users WHERE private_token = \'' + this.vals.privateToken + '\';';
    var result = yield this.pg.db.client.query_(query);

    if (result.rowCount > 0) {
      var token = jwt.sign({ uuid: result.rows[0].uuid }, process.env.JWT_SECRET, { expiresInMinutes: 1440, notBefore: 0, audience: "Audience", subject: "Subject", issuer: "https://www.example.com" });
      this.body = {'jwt': token};
    }
  })

module.exports = {
  publicRoutes: function() {
    return publicRouter.routes();
  },
  privateRoutes: function() {
    return privateRouter.routes();
  }
};

function createPrivateToken() {
  return base64url(crypto.randomBytes(60));
}
