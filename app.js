var program = require('commander');
program
	.version('0.0.1')
	.option('-i, --id [id]', '(required) facebook profile id of the user to target')
	.option('-t, --token [token]', '(required) facebook access_token used to do the abuse from')
	.option('-p, --pages [count]', '(defaults to 1000) number of pages of likes to look through')
	.parse(process.argv);

if (program.id == undefined && program.token == undefined && program.pages == undefined) {
	program.help();
	return;
}

if (program.id == undefined || program.token == undefined) {
	console.error("ERR: It's required to specify both an id and a token. Type `fb-spam -h` for more information.\n");
	return;
}

var id = program.id;
var token = program.token;
var feeds = [
	"feed",
	"photos",
	"photos/uploaded",
	"videos",
	"videos/uploaded",
	"albums"
];
var ids = [];

for(var i = 0; i < feeds.length; i++) {
	var feed = feeds[i];
	var url = id + "/" + feed + "?fields=comments.fields(id),id";
	console.log("url: " + url);
}