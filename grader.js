#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var sys = require('util');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT="";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrlExists = function(infile) {
    return infile;
};


var cheerioHtmlFile = function(htmlfile, checksfile) {
    return checkHtmlFile( cheerio.load(fs.readFileSync(htmlfile)), checksfile);
};

var cheerioHtmlUrl = function(htmlfile, checksfile) {
    console.log(htmlfile);
    var $;
    var out;
    rest.get(htmlfile).on('complete', function(resp) {
	if(resp instanceof Error){ 
	    sys.puts('Error: ' + resp.message);
	} else {
	    $ = cheerio.load(resp);
	    out =  checkHtmlFile($, checksfile)
	}
    });
console.log ("return out");
return out;
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function($, checksfile) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    writeOutput(out);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var writeOutput = function(checkJson){
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    fs.writeFileSync('output.json', outJson);
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'url to index.html', clone(assertUrlExists), URL_DEFAULT)
	.parse(process.argv);
    var checkJson;
    if (program.url.length >0){
	cheerioHtmlUrl(program.url, program.checks);
    }
    else{
	checkHtmlFile(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
