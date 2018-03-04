const PromiseThrottle = require('promise-throttle');
const fs = require('fs');
const Q = require('q');
const queryMorfix = require('./index');
const _ = require('lodash');

const requestsPerSecond = 1;
const outputFile = 'dic.txt';
const noResultsFile = 'noresults.txt';
const inputFile = 'words.txt';

module.exports = function scrapeMorfix() {
	console.log('loading words...');
	Promise.all([loadWords(), loadExistingWords(), loadNoResultsWords()]).then(([txt, existingWords = [], noResultsWords = []]) => {
		const words = txt.split('\n');
		const remainingWords = _.difference(words, existingWords, noResultsWords);

		console.log('a total of', words.length, 'words were loaded.');
		console.log(existingWords.length, 'were already fetched and found');
		console.log(noResultsWords.length, 'were fetched with no results');
		console.log('fetching the remaining', remainingWords.length, 'words');

		const writeStream = fs.createWriteStream(outputFile, {flags: 'a'});
		const noResultsWriteStream = fs.createWriteStream(noResultsFile, {flags: 'a'});
		const promiseThrottle = new PromiseThrottle({requestsPerSecond});

		_.shuffle(remainingWords).forEach(word => {
			promiseThrottle.add(() => {
				console.log('querying word', word);
				return Q.nfcall(queryMorfix, word)
				.then(result => {
					writeResult(writeStream, noResultsWriteStream, result, word);
				}).catch(err => {
					console.error('morfix error', err);
				});
			});
		});
	}).catch(err => {
		console.error('error', err);
	});
}()

function loadWords() {
	return Q.nfcall(fs.readFile, inputFile, 'utf-8');
}

function loadNoResultsWords() {
	return Q.nfcall(fs.readFile, noResultsFile, 'utf-8')
	.then(txt => {
		const lines = txt.split('\n');
		return lines;
	}).catch(() => {});
}

function loadExistingWords() {
	return Q.nfcall(fs.readFile, outputFile, 'utf-8')
	.then(txt => {
		const lines = txt.split('\n');
		return lines.map(line => {
			const pipeIdx = line.indexOf('|');
			return line.substr(0, pipeIdx - 1);
		});
	}).catch(() => {});
}

function writeResult(writeStream, noResultsWriteStream, result, searchString) {
	if (result) {
		if (!result.length) {
			noResultsWriteStream.write(searchString + '\r\n');
			return console.log('no results for', searchString);
		}

		result.forEach(r => {
			console.log('writing', r.word);
			const formatted = `${searchString} | ${r.word} | ${r.pos} | ${r.translation}\r\n`;
			writeStream.write(formatted);
		});
	}
}
