const request = require('request');
const cheerio = require('cheerio');
const MorfixUrl = 'http://www.morfix.co.il/';

module.exports = function queryMorfix(str, cb) {
	request(MorfixUrl + str, function (err, data) {
		if (err) {
			return cb(err);
		}

		const body = data.body;
		const $ = cheerio.load(body, {decodeEntities: false});

		const result = [];

		const boxes = $('.translate_box_en.box').each((i, el) => {
			const word = $(el).find('.word').text();
			const pos = $(el).find('.diber').text();
			const translation = $(el).find('.translation.translation_he.heTrans').html();
			result.push({word, pos, translation});
		});

		return cb(null, result);
	});
};
