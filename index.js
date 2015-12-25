var koa = require('koa'),
	route = require('koa-route'),
	app = module.exports = koa(),
	pg = require('pg');

app.use(route.get('/db', db));

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

app.listen((process.env.PORT || 4000));
