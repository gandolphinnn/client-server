window.onload = function() {
	let ip = document.querySelector('input');
	ip.onkeyup = (e) => {
		if ((e.code != 'Enter' && e.code != 'Backspace' && e.code.substring(0, 5) != 'Digit')
		|| (e.code == 'Backspace' && ip.value.length % 4 == 3)) {
			ip.value = ip.value.substring(0, ip.value.length-1);
		}
		if (ip.value.length % 4 == 3 && ip.value.length < 15) {
			ip.value += '.';
		}
	}
	document.querySelector('.left').onclick = () => {
		if (ip.value.length == 15) {
			window.location = '?conn=' + ip.value;
		}
		else {
			ip.focus();
		}
	}
}