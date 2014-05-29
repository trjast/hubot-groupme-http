var Adapter, GroupMeBot, HTTPS, Robot, TextMessage, _ref,
	__bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
	__hasProp = {}.hasOwnProperty,
	__extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
	__slice = [].slice;

_ref = require('hubot'), Adapter = _ref.Adapter, Robot = _ref.Robot, TextMessage = _ref.TextMessage;

HTTPS = require('https');

var userRoomIdentifier;
var botAccessToken;

GroupMeBot = (function(_super) {
	__extends(GroupMeBot, _super);

	var user;

	function GroupMeBot() {
		this.fetch_messages = __bind(this.fetch_messages, this);
		return GroupMeBot.__super__.constructor.apply(this, arguments);
	}

	GroupMeBot.prototype.send = function() {
		var strings;
		user = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		return strings.forEach((function(_this) {
			return function(str) {
				var index, substrings, text, _i, _len, _results;
				if (str.length > 450) {
					substrings = str.match(/.{1,430}/g);
					_results = [];
					for (index = _i = 0, _len = substrings.length; _i < _len; index = ++_i) {
						text = substrings[index];
						_results.push(_this.send_message(user.room_id, "(" + index + "/" + substrings.length + ") " + text));
					}
					return _results;
				} else {
					return _this.send_message(user.room_id, str);
				}
			};
		})(this));
	};

	GroupMeBot.prototype.reply = function() {
		var strings, user;
		user = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		return strings.forEach((function(_this) {
			return function(str) {
				return _this.send(user, "" + user.name + ": " + str);
			};
		})(this));
	};

	GroupMeBot.prototype.topic = function() {
		var envelope, strings;
		envelope = arguments[0], strings = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
		return strings.forEach((function(_this) {
			return function(str) {
				if (str.length > 440) {
					str = str.substring(0, 440);
				}
				str = "/topic " + str;
				return _this.send_message(user.room_id, str);
			};
		})(this));
	};

	GroupMeBot.prototype.run = function() {
		var room, _i, _len, _ref1;
		this.room_ids = process.env.HUBOT_GROUPME_ROOM_IDS.split(',');
		this.token = process.env.HUBOT_GROUPME_TOKEN;
		this.newest_timestamp = {};
		_ref1 = this.room_ids;
		for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
			room = _ref1[_i];
			this.newest_timestamp[room] = 0;
		}
		this.timer = setInterval((function(_this) {
			return function() {
				return _this.room_ids.forEach(function(room) {
					return _this.fetch_messages(room, function(messages) {
						var msg, userInfo, _j, _len1, _results;
						messages = messages.sort(function(a, b) {
							if (a.created_at < b.created_at) {
								-1;
							}
							if (a.created_at > b.created_at) {
								1;
							}
							return 0;
						});
						_results = [];
						for (_j = 0, _len1 = messages.length; _j < _len1; _j++) {
							msg = messages[_j];
							if (msg.created_at <= _this.newest_timestamp[room]) {
								continue;
							}
							_this.newest_timestamp[room] = msg.created_at;
							if (msg.text && (msg.created_at * 1000) > new Date().getTime() - 6 * 1000 && msg.name !== _this.robot.name) {
								console.log("[JERRY] Received in room " + room + "] " + msg.name + ": " + msg.text);
								userRoomIdentifier = room;
								userInfo = {
									name: msg.name,
									room_id: room
								};
								_results.push(_this.receive(new TextMessage(userInfo, msg.text)));
							} else {
								_results.push(void 0);
							}
						}
						return _results;
					});
				});
			};
		})(this), 2000);
		return this.emit('connected');
	};

	GroupMeBot.prototype.close = function() {
		return clearInterval(this.timer);
	};

	GroupMeBot.prototype.send_message = function(room_id, messageText) {
		var request = require('request');
		var botEndpoint = 'https://api.groupme.com/v3/bots?token=' + this.token;

		var botExists = false;
		request(botEndpoint,
			function (error, response, body) {
				var responseBody = JSON.parse(body).response;
				for (index = 0; index < responseBody.length; index++) {
					if(responseBody[index].group_id == userRoomIdentifier)
					{
						botExists = true;
						botAccessToken = responseBody[index].bot_id;
					}
				}
				createBot();
			}
		);

		function createBot()
		{
			if(botExists) {
				console.log("[JERRY] Bot Exists " + botAccessToken);
				sendMessage();
			}
			else {
				console.log("[JERRY] Bot Does Not Exist");
				request.post(botEndpoint, { json: { "bot" : { "name" : "Jerry" , "group_id" : userRoomIdentifier, "avatar_url": "http://www.sociallytied.in/images/jerry-square.png" } } },
					function (error, response, body) {
						console.log("[JERRY] Creating Bot...");
						botAccessToken = body.response.bot.bot_id;
						console.log("[JERRY] Bot Created " + botAccessToken);
						sendMessage();
					}
				);
			}
		}

		function sendMessage()
		{
			console.log("[JERRY] Sending...");
			var botPostEndpoint = 'https://api.groupme.com/v3/bots/post';
			request.post(botPostEndpoint, { json: { "text" : messageText, "bot_id" : botAccessToken } },
				function (error, response, body) {
					if (!error && (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 202)) {
						console.log("[JERRY] Success " + response.statusCode);
					}
					else {
						console.log("[JERRY] Error " + response.statusCode + " " + error);
					}
				}
			);
		}
	};

	GroupMeBot.prototype.fetch_messages = function(room_id, cb) {
		var options, request;
		options = {
			agent: false,
			host: 'v2.groupme.com',
			port: 443,
			method: 'GET',
			path: "/groups/" + room_id + "/messages",
			headers: {
				'Accept': 'application/json, text/javascript',
				'Accept-Charset': 'ISO-8859-1,utf-8',
				'Accept-Language': 'en-US',
				'Content-Type': 'application/json',
				'Origin': 'https://web.groupme.com',
				'Referer': "https://web.groupme.com/groups/" + room_id,
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.45 Safari/537.22',
				'X-Access-Token': this.token
			}
		};
		request = HTTPS.request(options, (function(_this) {
			return function(response) {
				var data;
				data = '';
				response.on('data', function(chunk) {
					return data += chunk;
				});
				return response.on('end', function() {
					var json;
					if (data) {
						json = JSON.parse(data);
						return cb(json.response.messages);
					}
				});
			};
		})(this));
		return request.end();
	};

	return GroupMeBot;

})(Adapter);

exports.use = function(robot) {
	return new GroupMeBot(robot);
};