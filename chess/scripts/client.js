let url = new URLSearchParams(window.location.search);
let serverIp;
if (url.has('ip') && (serverIp = url.get('ip')) != '') {
	//* input output
		

	//* connection setup
		window.WebSocket = window.WebSocket || window.MozWebSocket;
		if (!window.WebSocket) {
			chatbody.innerHTML = '<p>Your browser doesn\'t support WebSockets.</p>';
		}

	//* my data
		let me = new Client(new WebSocket('ws://'+ serverIp +':1330'));
		let lasTime = null;
		let lastUser = null;
		let serverSettings = undefined;
		const statusList = {
			class: ['off', 'on', 'typing'],
			out: ['OFFLINE', 'ONLINE', 'TYPING...']
		};

	//* functions
		function addMessage(msg) {
			let doScroll = false;
			if (chatbody.scrollTop + chatbody.offsetHeight == chatbody.scrollHeight) {
				doScroll = true;
			}
			if (lasTime == null || dateCMP(lasTime, msg.time)) {
				chatbody.innerHTML += '<div class="date">' + toDMY(msg.time) + '</div>';
				lastUser = null;
			}
			lasTime = msg.time;
			chatbody.innerHTML += '<div class="msg '+ (msg.user == me.username? 'mine':'other') + (lastUser == msg.user? ' continue">': '">') +
			(msg.user != me.username && lastUser != msg.user? '<div class="sendername hov" onclick="highlightUser('+ msg.user +')">'+ msg.user +'</div>' : '') +
			'<div class="content">'+ msg.content +'</div><div class="time" title="'+ fullDateTime(msg.time) +'">'+ toHM(msg.time) +'</div></div>';
			lastUser = msg.user;
			if (doScroll) {
				scrlTo('bottom');
			}
		}
		function scrlTo(location) {
			if (location == 'bottom') {
				chatbody.scrollTop = chatbody.scrollHeight;
			}
			else if (location == 'top') {
				chatbody.scrollTop = 0;
			}
		}
		function leaveChat() {
			me.sendJSON({type: 'status', status: -1});
		}
		intext.addEventListener('keydown', (e) => {
			if (e.code == 'Enter') {
				sendMsg();
			}
		});
		function sendMsg() {
			let msgContent = intext.value;
			if (msgContent == '') {
				return false;
			}
			intext.value = '';
			msg = {type: 'message', user: me.username, content: msgContent, time: Date.now()};
			me.sendJSON(msg);
			if (!serverSettings.confirmMsg) {
				addMessage(msg);
			}
		}
		
	// let colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
	// colors.sort(function(a,b) { return Math.random() > 0.5; } );

	//* connection start
		me.conn.onopen = function () {
			//? autologin for now
				me.sendJSON({type: 'signin', username: 'luca', password: '1234'});
				me.username = 'luca';

			intext.disabled = false;
			setInterval(() => {
				if (me.conn.readyState !== 1) {
					if (!intext.disabled) {
						intext.setAttribute('disabled', 'disabled');
					}
					intext.value = 'Connection error: server lost, refresh the page.';
				}
				if (me.status == 1 && document.activeElement === intext && intext.value.length > 0) {
					me.sendJSON({type: 'status', status: 2});
					me.status = 2;
				}
				else if (me.status == 2 && !(document.activeElement === intext && intext.value.length > 0)) {
					me.sendJSON({type: 'status', status: 1});
					me.status = 1;
				}
			}, 500);
		};

	//* msg from server
		me.conn.onmessage = function (input) {
			let msg = JSON.parse(input.data);
			console.log(msg);
			switch (msg.type) {
				case 'login':
					if (msg.result == 'username') {
						//? autologin for now
							me.sendJSON({type: 'signin', username: 'luca2', password: '1234'});
							me.username = 'luca2';
					}
					break;
				case 'history':
					msg.arr.forEach(message => {
						addMessage(message);
					});
					break;
				case 'message':
					addMessage(msg);
					break;
				case 'status':
					statusbody.innerHTML = '';
					let onlineMembers = 0;
					msg.arr.forEach(element => {
						if(element.user != me.username) {
							statusbody.innerHTML += '<p>'+ element.user +': <a class="u_'+ statusList.class[element.status] +'">'+ statusList.out[element.status] +'</a></p>'
						}
						if (element.status > 0) {
							onlineMembers++;
						}
					});
					let info = 'Total members: '+ msg.arr.length +', online: '+ onlineMembers;
					document.getElementById('members_info').setAttribute('title', info);
					break;
				case 'settings':
					serverSettings = msg.settings;
					document.getElementById('chat_info').innerText = serverSettings.chatName;
					delete serverSettings.chatName;
					let chatInfo = '';
					for (const key in serverSettings) {
						chatInfo += key +': '+ serverSettings[key] + ', ';
					}
					document.getElementById('chat_info').setAttribute('title', chatInfo.slice(0, chatInfo.length-2));
					break;
				default: console.log('Something is wrong with this messagge'); break;
			}
		};

		me.conn.onerror = function () {
			chatbody.innerHTML = '<p>Connection error: server not found, refresh the page.</p>';
		};
}
else {
	chatbody.innerHTML = '<p>No server address, redirecting to index...</p>';
	setTimeout(() => {
		window.location.replace('../index.html');
	}, 3000);
}