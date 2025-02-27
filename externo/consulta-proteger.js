$(document).ready(function() {
	var html = document.body.innerHTML;
	var changed = false;
	

	html = html.replace(/ANATEL(\D)(\d{11})(?:\s*\(([^)]*?)\))?/gi, (m0, sep, cpf, user) => {
		changed = true;
		if (user) return `ANATEL${sep}${user}`;
		return `ANATEL${sep}***${cpf.substr(3,6)}**`;
	});
	
	if (changed) document.body.innerHTML = html;
});

 
