var koa = require('koa'),
	route = require('koa-route'),
	app = module.exports = koa(),
	koaPg = require('koa-pg'),
	bouncer = require('koa-bouncer'),
	jwt = require('koa-jwt'),
	uuid = require('uuid');

app.use(koaPg(process.env.DATABASE_URL))
app.use(bouncer.middleware());

app.use(route.get('/', index));
app.use(route.get('/asd', asd));
app.use(route.get('/register', register));

function *index() {
	this.body = 'Hello world';
}

function *asd() {
	this.validateQuery('asd')
		.required('asd required')
    .isString()
    .trim();

    this.body = 'valid';
}

function *register() {
	var uuidString = uuid.v4();
	var query = 'INSERT INTO users (uuid) VALUES (\'' + uuidString + '\');';
	var result = yield this.pg.db.client.query_(query);
	var token = jwt.sign({ uuid: uuidString }, process.env.JWT_SECRET);
	this.body = token;
}

app.use(jwt({secret: process.env.JWT_SECRET}));

app.use(route.get('/protected', protected));

function *protected() {
	this.body = this.state.user;
}

app.listen(process.env.PORT);
