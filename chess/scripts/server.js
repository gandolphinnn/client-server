//todo actually working settings, fix logic about attempts and timeout, files
//* server preparation (for info http://tools.ietf.org/html/rfc6455#page-6)
	const cmd = require( 'child_process' );
	let command = `ipconfig | find /i "IPv4"`;
	let ipString = cmd.execSync( command ).toString( );
	const server = {ip: null, port: null, loc: null};
	server.ip = /IPv4\./i.test( ipString )? ipString.match( /\.\s\.\s\.\s:\s([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/ )[1] : 'error';
	server.port = 1330;
	server.loc = server.ip +':'+ server.port;
	let webSocketServer = require('websocket').server;
	let http = require('http');
	let httpserver = http.createServer(() => {});
	httpserver.listen(server.port, () => {console.log('Server ready on '+ server.loc)});
	process.title = 'chatGL server '+ server.loc;
	let wsServer = new webSocketServer({httpServer: httpserver});

//* functions
	function sendStatus() {
		let statusArr = new Array();
		clientsArr.forEach(client => {
			statusArr.push({user: client.username, status: client.status});
		});
		clientsArr.forEach(client => {
			client.sendJSON({type: 'status', arr: statusArr});
		});
	}

//* class
	//! temp until i understand how tf can i import this
	class Client {
		constructor(conn) {
			this.conn = conn;
			this.username = null;
			this.password = null;
			this.index = null;
			this.arrive = null;
			this.status = 1;
			this.logAttempt = 0;
		}
		isLogged() {
			return (this.username != null && this.password != null)
		}
		sendJSON(json) {
			this.conn.send(JSON.stringify(json));
		}
		initialize() {
			this.sendJSON({type: 'login', result: 'confirm'});
			if (serverSettings.fullChat) {
				this.sendJSON({type: 'history', arr: history});
			}
			else {
				this.sendJSON({type: 'history', arr: history.slice(this.arrive)});
			}
			sendStatus();
			this.sendJSON({type: 'settings', settings: serverSettings});
		}
	}

//* variables
	let serverSettings = {
		chatName: 'Chat GL',
		anonimous: false,
		fullChat: true,
		confirmMsg: false,
		autoLeave: false, //? false || time value in seconds
		logTimeout: 5000
	}
	let history = new Array();
	history.push({user: 'Admin', content: 'First message', time: 946681200000});
	let clientsArr = new Array();

//* new connection (for info http://en.wikipedia.org/wiki/Same_origin_policy)
	wsServer.on('request', function(request) {
		//* connection setup
			let client = new Client(request.accept(null, request.origin));
			console.log('New connection accepted from ' + client.conn.remoteAddress);

		//* msg from client
			client.conn.on('message', function(message) {
				if (message.type === 'utf8') { // accept only text
					let msg = JSON.parse(message.utf8Data);
					//* logged user
						if (client.isLogged()) {
							let msgtype = msg.type;
							delete msg.type;
							switch (msgtype) {
								case 'message':
									history.push(msg);
									console.log(msg);
									clientsArr.forEach(forw => {
										if (!(!serverSettings.confirmMsg && forw.username == msg.user)) {
											forw.sendJSON({type: 'message', user: msg.user, content: msg.content, time:msg.time});
										}
									});
									break;
								case 'status':
									client.status = msg.status;
									sendStatus();
									break;
								default:break;
							}
						}
					//* login/signin
						else if (client.logAttempt == 5) {
							if (!client.logTimeout) {
								client.sendJSON({type: 'login', result: 'timeout'})
								client.logTimeout = true;
								setTimeout(() => {
									client.logAttempt = 0;
									client.logTimeout = false;
								}, serverSettings.logTimeout);
							}
						}
						else if (msg.type == 'login') {
							client.logAttempt++;
							let index = clientsArr.findIndex(({username}) => username === msg.username);
							let clientData = clientsArr[index];
							// username not found
							if (index == -1) {
								client.sendJSON({type: 'login', result: 'username'});
							}
							// wrong password
							else if (clientData.password != msg.password) {
								client.sendJSON({type: 'login', result: 'password'});
							}
							// connection already open
							else if (clientData.conn.state == 'open') {
								client.sendJSON({type: 'login', result: 'open'});
							}
							// login confirmed
							else {
								clientsArr[index].conn = client.conn;
								client = clientsArr[index];
								client.initialize();
								console.log('User '+ client.username +' reconnected from '+ client.conn.remoteAddress);
							}
						}
						else if (msg.type == 'signin') {
							client.logAttempt++;
							//check if username exists
							let clientData = clientsArr.find(({username}) => username === msg.username);
							if (clientData != undefined) {
								client.sendJSON({type: 'login', result: 'username'});
							}
							else {
								client.username = msg.username;
								client.password = msg.password;
								client.arrive = history.length;
								client.index = clientsArr.push(client) - 1;
								client.initialize();
								console.log('User '+ client.username +' joined the chat from '+ client.conn.remoteAddress);
							}
						}
				}
			});

		//* user offline
			client.conn.on('close', function() {
				console.log('User '+ client.username +' disconnected');
				client.status = 0;
				sendStatus();
			});
	});