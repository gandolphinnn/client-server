window.onload = function() {
	let ip = document.getElementById('ip');
	let page = document.getElementById('page');
	let redPage = null;
	const ipRegex = new RegExp('^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$')
	function confPage() {
		if (page.value != 'null') {
			redPage = page.value;
			confIp();
		}
	}
	function confIp() {
		if (ipRegex.exec(ip.value)) {
			window.location.replace(redPage +'?ip='+ ip.value);
		}
		else{
			ip.value = '';
		}
	}
	ip.onkeyup = (e) => {
		if (e.code == 'Enter') {
			confPage();
		}
	}
	document.querySelector('.left').onclick = () => {
		ip.focus();
		confPage();
	}
	document.querySelector('.right').onclick = () => {
		ip.value = '127.0.0.1';
		confPage();
	}
}