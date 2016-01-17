var koa = require('koa'),
  Router = require('koa-router'),
  app = module.exports = koa(),
  koaPg = require('koa-pg'),
  bouncer = require('koa-bouncer'),
  jwt = require('koa-jwt'),
  uuid = require('uuid'),
  json = require('koa-json'),
  crypto = require('crypto'),
  base64url = require('base64url');

var jwtController = require('./controllers/jwt-controller');
var locationController = require('./controllers/location-controller');
var setupController = require('./controllers/setup-controller');

app.use(koaPg(process.env.DATABASE_URL));
app.use(bouncer.middleware());
app.use(json({ pretty: false, param: 'pretty' }));

var publicRouter = new Router();
var privateRouter = new Router();

publicRouter
  .get('/', index)
  .use('/jwt', jwtController.publicRoutes())
  .use('/init', setupController.routes());

privateRouter
  .use(jwt({secret: process.env.JWT_SECRET}))
  .use('/jwt', jwtController.privateRoutes())
  .use('/locations', locationController.routes());

app.use(publicRouter.routes());
app.use(privateRouter.routes());

function *index() {
  this.body = {'message': 'Hello world'};
}

app.listen(process.env.PORT);
