const morfixQuery = require('./index');
const {assert} = require('chai');

describe('morfix query', () => {
	it('query "hello"', done => {
		morfixQuery('hello', (err, result) => {
			if (err)
				return done(err);

			assert.lengthOf(result, 1);
			assert.equal(result[0].pos, 'interjection');
			assert.equal(result[0].word, 'hello');
			assert.ok(result[0].translation);

			done();
		});
	});
});
