var koa = require('koa'),
	route = require('koa-route'),
	app = module.exports = koa(),
	pg = require('pg'),
	bouncer = require('koa-bouncer'),
	jwt = require('koa-jwt');

app.use(bouncer.middleware());

app.use(route.get('/', index));
app.use(route.get('/db', db));
app.use(route.get('/asd', asd));
app.use(route.get('/register', register));

function *index() {
	this.body = 'Hello world';
}

function *db() {
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if (err) throw err;
		console.log('Connected to postgres! Getting schemas...');

		client
		.query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    })
  });

  this.body = 'db';
}

function *asd() {
	this.validateQuery('asd')
		.required('asd required')
    .isString()
    .trim();

    this.body = 'valid';
}

function *register() {
	var token = jwt.sign({ foo: 'bar' }, 'shared-secret');
	this.body = token
}

app.use(jwt({ secret: 'shared-secret' }));

app.use(route.get('/protected', protected));

function *protected() {
	this.body = 'protected';
}

app.listen((process.env.PORT || 4000));
