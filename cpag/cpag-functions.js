/***************************************************/
/* Controle de pagamento de processos SEI          */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

async function generateHash(...parts) {
	var user = getCurrentUser();
	if (!user) return notify("fail", "Não foi possível identificar o usuário corrente");

	if (localStorage.cfor_uid != user.login || !localStorage.cfor_uhc) {
		let login = await openFormDlg([{id:"user", type: "text", label: "Usuário", width: 200, value: user.login, required: true},
									   {id: "pwd", type: "password", label: "Senha", required: true}], "Login");
									   
		if (!login) return null;
		localStorage.cfor_uid = login.user.trim().toLowerCase();
		chrsz = 16; login.pwd = hex_md4(login.pwd.trim());
		chrsz = 8; localStorage.cfor_uhc = hex_md5(login.pwd);
	}
	
	var hash = localStorage.cfor_uid;
	parts.forEach(p => hash += (p && p.length ? p : ""));
	hash += localStorage.cfor_uhc;
	
	return hex_md5(hash);
}

async function addCpag(processo, servico, fistel) {
	if (!processo || ((processo = processo.replace(/\D/g,"").substr(0, 15)) && processo.length != 15)) return Promise.reject("Processo inválido");
	if (!servico || isNaN(servico) || !servico.toString().match(/019|25[1-5]|302|400|507|604/)) return Promise.reject("Serviço inválido");
	if (!fistel || !fistel.match(/^\d{11}(?:,\d{11})*$/)) return Promise.reject("Fistel inválido");
	
	let hash = await generateHash(processo, servico, fistel);
	if (!hash) return Promise.reject("Falha na geração do hash");
	
	var data = {uid: localStorage.cfor_uid, processo: processo, servico: servico, fistel: fistel, hash: hash};

	waitMessage(`\`\`Incluindo controle para\`\`\n@@Processo: **${processo}**\nServiço: **${servico}**\nFistel: **${fistel}**@@`);
	return Promise.resolve($.ajax({type: "POST", url: "http://cfor.freevar.com/cpag/cpag.php?acao=incluir", data: data, dataType: "json"})).then(result => {
		waitMessage();
		if (result.hash === false) {
			localStorage.cfor_uid = undefined;
			localStorage.cfor_uhc = undefined;
		}
		
		if (result.error) return Promise.reject(result.error);
		return result;
	}).catch(err => {
		waitMessage();
		return Promise.reject(err);
	});
}