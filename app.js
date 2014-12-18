var program = require('commander');
var graph = require('fbgraph');
var wait = require('wait.for');

program
	.version('0.0.1')
	.option('-i, --id [id]', '(required) facebook profile id of the user to target')
	.option('-t, --token [token]', '(required) facebook access_token used to do the abuse from')
	.option('-p, --pages [count]', '(defaults to 10) number of pages of likes to look through')
	.option('-u, --username [y/n]', '(defaults to n) if you put a username in the -i field, set this to \'y\'')
	.parse(process.argv);

if (program.id == undefined && program.token == undefined && program.pages == undefined) {
	program.help();
	process.exit(1);
}

if (program.id == undefined || program.token == undefined) {
	logError("It's required to specify both an id and a token. Type `fb-spam -h` for more information.");
}

var user_id = program.id;
var access_token = program.token;
var pages = program.pages;
if (pages == undefined) pages = 10;

graph.setAccessToken(access_token);

wait.launchFiber(function () {
	var feeds = [
		"feed",
		"photos",
		"photos/uploaded",
		"videos",
		"videos/uploaded",
		"albums"
	];
	var ids = [ ];

	// Gets Ids
	for (var i = 0; i < feeds.length; i++) {
		var feed = feeds[i];
		var url = user_id + "/" + feed + "?fields=comments.fields(id),id";
		try {
			for(var y = 0; y < pages; y++) {
				if (url == undefined) break;
				var result = wait.for(graph.get, url);

				console.log(JSON.stringify(result))

				if (result == undefined) break;
				if (result.data == undefined) break;

				for(var z = 0; z < result.data.length; z++) {
					var post = result.data[z];
					ids.push(post.id);
					console.log("[" + feed + "] added post id: " + post.id);

					if (post.comments != undefined && post.comments.data != undefined) {
						for(var x = 0; x < post.comments.data.length; x++) {
							var comment = post.comments.data[x];
							ids.push(comment.id);
							console.log("[" + feed + "] added comment id: " + comment.id);
						}
					}
				}

				if (result.paging != undefined && result.paging.next != undefined) {
					url = result.paging.next;
				} else {
					url = undefined;
					break;
				}
			}
		}
		catch (err) {
			switch(err.code) {
				case 190:
					logError("Specified OAuth Access Token has expired.", true);
					break;
				default:
					logError(err, false);
					break;
			}
		}
	}

	// give user time to cancel
	console.log("found " + ids.length + " items to like");
	for(var i = 5; i > 0; i--) {
		console.log("proceding with liking in " + i + "...");
		wait.for(sleep, 1000);
	}

	// start liking...
	for(var i = 0; i < ids.length; i++) {
		try {
			var result = wait.for(graph.post, "/" + ids[i] + "/likes");
			console.log("[" + i + "] Liked content - " + ids[i])
		}
		catch (err) {
			switch(err.code) {
				case 100: // weird id error
					console.log("[" + i + "] Weird Id error, carry on.")
					break;
				case 190:
					logError("[" + i + "] Specified OAuth Access Token has expired.", true);
					break;
				case 368:
					logError("[" + i + "] Banned from liking, fcking #rekt.", true);
					break;

				default:
					logError(err, false);
					break;
				}
		}
	}
});

// sleep wrapper for `wait.for`
function sleep(time, callback) {
	setTimeout(function() {
		callback(null, "");
	}, time);
}

function logError(error, str) {
	if (str === true) {
		console.error("ERR: " + error + "\n");
	}
	else {
		console.error(error);
	}
	process.exit(1);
}