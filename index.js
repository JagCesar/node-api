var koa = require('koa'),
	route = require('koa-route'),
	app = module.exports = koa(),
	koaPg = require('koa-pg'),
	bouncer = require('koa-bouncer'),
	jwt = require('koa-jwt');

app.use(koaPg(process.env.DATABASE_URL))
app.use(bouncer.middleware());

app.use(route.get('/', index));
app.use(route.get('/db', db));
app.use(route.get('/asd', asd));
app.use(route.get('/register', register));

function *index() {
	this.body = 'Hello world';
}

function *db() {
	var result = yield this.pg.db.client.query_('SELECT table_schema,table_name FROM information_schema.tables;')
    console.log('result:', result)

    this.body = 'db'
}

function *asd() {
	this.validateQuery('asd')
		.required('asd required')
    .isString()
    .trim();

    this.body = 'valid';
}

function *register() {
	var token = jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET);
	this.body = token
}

app.use(jwt({secret: process.env.JWT_SECRET}));

app.use(route.get('/protected', protected));

function *protected() {
	this.body = this.state.user;
}

app.listen(process.env.PORT);
