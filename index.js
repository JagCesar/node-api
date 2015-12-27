var koa = require('koa'),
	route = require('koa-route'),
	app = module.exports = koa(),
	koaPg = require('koa-pg'),
	bouncer = require('koa-bouncer'),
	jwt = require('koa-jwt'),
	uuid = require('uuid'),
	json = require('koa-json');

app.use(koaPg(process.env.DATABASE_URL))
app.use(bouncer.middleware());
app.use(json({ pretty: false, param: 'pretty' }));

app.use(route.get('/', index));
app.use(route.get('/validate', validate));
app.use(route.get('/register', register));

function *index() {
	this.body = {'message': 'Hello world'};
}

function *validate() {
	this.validateQuery('argument')
		.required('argument required')
    .isString()
    .trim();

    this.body = {'message': 'Valid query'};
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

function *protected() {
	this.body = this.state.user;
}

app.listen(process.env.PORT);
