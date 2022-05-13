class Client {
	constructor(conn) {
		this.conn = conn;
		this.username = null;
		this.password = null;
		this.index = null;
		this.arrive = null;
		this.status = 1;
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
		//this.sendJSON({type: 'status', arr: statusArr});
		this.sendJSON({type: 'settings', settings: serverSettings});
	}
}
function toDMY(timestamp) {
	let date = new Date(timestamp);
	return date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear();
}
function toHM(timestamp) {
	let time = new Date(timestamp);
	let H = time.getHours();
	let M = time.getMinutes();
	return (H < 10?'0':'') + H + ':' + (M < 10?'0':'') + M;
}
function dateCMP(time1, time2) {
	let s1 = toDMY(time1);
	let s2 = toDMY(time2);
	let d1 = s1.split('/');
	let d2 = s2.split('/');
	return d1[2] == d2[2]? (d1[1] == d2[1]? (d1[0] == d2[0]? false : true) : true) : true;
}
function fullDateTime(timestamp) {
	const days = ['Sunday ', 'Monday ', 'Tuesday ', 'Wednesday ', 'Thursday ', 'Friday ', 'Saturday '];
	return days[new Date(timestamp).getDay()] + toDMY(timestamp) +' at '+ toHM(timestamp);
}