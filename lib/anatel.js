/***** SIS *****/

function getReturnAlert(html) {
	if (!html) return "";
	if (m = html.match(/<script[^>]*?>\s*alert\((\\?['"])(.*?)\1/i)) return m[2];
	return "";
}

function getReturnReload(html) {
	if (!html) return "";
	if (m = html.match(/<script[^>]*?>\s*location.href\s*=\s*(\\?['"])(.*?)\1/i)) return m[2];
	return "";
}

function scriptFillData(html, data) {
	if (!data) data = {};
	const input_regex = /^.*(?:\.|\(['"])(\w+)(?:\.|['"]\)\.)value\s*=(?!=)\s*(\\"|"|')?([^'"]*)\2?\s*;?\s*$/gim;	
	const script_regex = /<script[^>]*?>\s*(?:\/\/.*\s*)?.*(?:\(\s*['"](?:[^'"]+)['"]\s*\)|\.\w+)\.\w+\s*=(?!=)\s*(?:\\"|"|')?[^;]*\s*;?[\w\W]*?<\/script>/ig;
	
	while (script = script_regex.exec(html)) {
		if (script.index === script_regex.lastIndex) script_regex.lastIndex++;
		while (m = input_regex.exec(script[0])) {
			if (m.index === input_regex.lastIndex) input_regex.lastIndex++;
			data[m[1].replace(/[.()'"]/g,"")] = m[3];
		}	
	}
}

function fillCEP(row, data, n = 1, prefix) {
	let keys = Object.keys(data);
	let name;
	
	for (f of row.attributes) {
		name = f.name.replace(/(.*?)(\d+)/ig, `$1${n}`);
		
		if(name.toLowerCase() == "retorno" && f.value == '0') return;
		
		if (name.toLowerCase() == `codmunicipio${n}`) data[`CEP_CodMunicipio${n}`] = f.value;
		else if (name.toLowerCase() == `codcep${n}`) data[`CEP_CodCEP${n}`] = f.value;
		
		if (keys.includes(name)) data[name] = f.value;
		if (keys.includes("btn" + name)) data["btn" + name] = f.value;
		if (keys.includes("CEP_" + name)) data["CEP_" + name] = f.value;
		if (prefix != undefined) data[`${prefix}${name}`] = f.value;
	}		
}



/**** SIGEC ****/


//Lanças créditos de TFF e CFRP Retroativos
function lancarCreditosRetroativos(processo, servico, fistel, anoInicial) {
	if (!servico) return Promise.reject("Serviço inválido");
	
 	if (!processo || !(processo = processo.replace(/\D/g,"").substr(0,15))) processo = "";
	if (!validateFistel(fistel)) fistel = "";
	if (!anoInicial || !(anoInicial = Number(anoInicial)) || isNaN(anoInicial)) anoInicial = (new Date()).getFullYear();
	
	let campos = [[{id: "processo", type: "text", label: "Processo", value: processo, required: true}, {id: "fistel", type: "text", label: "Fistel", value: fistel, required: true}],
				  {id: "ano", type: "number", label: "A partir de", value: anoInicial, min: 1997, max: (new Date()).getFullYear(), required: true}];
				  
	let tipo_estacoes = {A: "Fixa", B: "Base", C: "Móvel"};
	
	let grp_estacoes = {group: "estacoes", text: "Quantitativo de Estações", fields: [[]]};
	
	for (tipo of Object.keys(tipo_estacoes))
		grp_estacoes.fields[0].push({id: `${tipo}`, type: "number", label: `Estação ${tipo_estacoes[tipo]}`, value: 0, width: 75});
	
	campos.push(grp_estacoes);
	
	const TITLE = "Lançamento Retroativo de TFF/CFRP";
	
	return openFormDlg(campos, TITLE, "Lançar", v => {
		//validar campo processo
		if (!v.data.processo.match(/^\s*\d{5}\.?\d{6}\/?\d{4}\s*$/i)) {
			v.target = "processo";
			v.message = "Processo inválido.";
			return false;
		}

		//validar campo fistel
		if (!validateFistel(v.data.fistel)) {
			v.target = "fistel";
			v.message = "Fistel inválido.";
			return false;
		}
		
		//validar quantitativo de estações
		let total = 0;
		for (tipo of Object.keys(tipo_estacoes)) total += v.data.estacoes[tipo];
		if (!total) {
			v.target = "estacoes";
			v.message = "Total de estações não pode ser zero.";
			return false;
		}
	}).then(data => {
		let total = 0; for (tipo of Object.keys(tipo_estacoes)) total += data.estacoes[tipo];

		return confirmMessage(`@@Lançar créditos retroativos de TFF e CFRP a partir de **${data.ano}** no FISTEL **${data.fistel}**\nreferente ao processo nº **${data.processo}** para **${total}** estaç${total>1?"ões":"ão"}.@@
							   ---\nConfirmar operação?`, TITLE).then(() => {
				
			//--- iniciar processo de lançamento
			let receitas = [{cod: 1329, desc: "TFF"}, {cod: 4200, desc: "CFRP"}];
			let observacao = "Prorrogação de autorização vencida. Crédito não lançado automaticamente pelo sistema.";
			let mensagem = `Nº Processo: ${data.processo}`;
			
			lancarCreditos(data.processo, data.fistel, receitas, data.ano, data.estacoes, observacao, mensagem);
		});
	});
}


async function lancarCreditos(processo, fistel, receitas, ano_inicial, estacoes, observacao, mensagem) {
	const TITLE = "Lançamento Retroativo";
	
	let ano_final = (new Date()).getFullYear();
	let logger = openProcessDlg(TITLE);
	let result = true;
	
	for (key of Object.keys(estacoes)) {
		estacoes[`Tipo${key}`] = estacoes[key];
		delete estacoes[key];
	}
	
	for (let ano = ano_inicial; ano <= ano_final; ano++) {
		if (!result) break;
		
		for (rec of receitas) {
			logger.start(`Lançando ${rec.desc}/${ano}`);
			result = await postFormData("http://sistemasnet/sigec/Lancamento/Incluir/tela.asp", 
										{fetchMethod: "post",
										 fetchParams: {NumFistel: fistel, AnoReferencia: ano, CodReceita: rec.cod, acao: "i", cmd: "obtertelainclusao"},
										 url: "http://sistemasnet/sigec/Lancamento/Incluir/critica.asp?IndInclusao=sim",
										 charset: "iso-8859-1",
										 data: {NumDocumento: processo, NumProcesso: processo, TipoReferencia: "processo", TxtMensagemBoleto: mensagem, TxtObservacao: observacao, ...estacoes}
										}).then(data => {
											if (error = getReturnAlert(data)) return Promise.reject(error);
											if (mseq = data.match(/sequencial(?:<[^>]*?>)?\s*gerado\s*:\s(?:<[^>]*?>)?(\d+)/i)) logger.success(`Lançado ${rec.desc}/${ano} (**seq: ${mseq[1]}**)`); 
											else logger.success(`Lançado ${rec.desc}/${ano}`); 
											return true;
										}).catch(error => {
											
											if (error && error.status == 401) {
												errorMessage(`@@Não foi possível acessar o sistema interativo da Anatel. Siga as seguintes instruções:\n
												1. Abrir uma nova aba no navegador e acessar o endereço [](http://sistemasnet)
												2. Fazer login
												3. Fechar aba@@`);
												return false;
											}

											if (error.html) {
												if (alert_msg = getReturnAlert(error.html)) error = alert_msg;
												else error = error.message ? error.message : "Falhou";
											}

											logger.fail(error && error.statusText?error.statusText:error);
											return true;
											
										});
			if (!result) break;
		}
	}
	
	if (result) logger.finish();
	else logger.close();
}

/***** BDTA *****/

//--- Função manipuladora de erro
function raiseErrorPromise(error) {
	if (error.status == 401) return Promise.reject(`@@Não foi possível acessar o sistema interativo da Anatel. Siga as seguintes instruções:\n
		1. Abrir uma nova aba no navegador e acessar o endereço [](http://sistemasnet)
		2. Fazer login
		3. Fechar aba@@`);
		
	if (error.html && (alert_msg = getReturnAlert(error.html))) return Promise.reject(alert_msg);
	
	if (error.message) return Promise.reject(error.message);
	if (error.statusText) return Promise.reject(error.statusText == "error"?"Falha de conexão.\nSe estiver fora da rede da Agência, verificar sua conexão VPN.":error.statusText);
	
	return Promise.reject(error);
}


//--- Consultar Entidade
async function consultarEntidade(cpfj) {
	
	return postFormData("http://sistemasnet/stel/Consultas/Entidade/Cadastro/tela.asp", {acao: "c", varNumCnpjCpf: cpfj, varindTipoComparacao: "e"}).then(html => {
		if (m = html.match(/idtEntidade=(\d+)/i)) return getAjaxContent(`http://sistemasnet/stel/Consultas/Entidade/Cadastro/telaEntidade.asp?IdtEntidade=${m[1]}`, {returnError: true}).then(html => {
			let $html = $(html);
			let result = {};
			if (value = $html.find('td:contains("Nome:")').first().next().text()) result.nome = value.trim();
			if (value = $html.find('td:contains("Identidade:")').first().next().text()) result.rg = value.trim();
			if (value = $html.find('td:contains("Expedidor:")').first().next().text()) result.expedidor = value.trim().toUpperCase();
			if (value = $html.find('td:contains("Data de Nascimento:")').first().next().text()) result.nascimento = value.trim();
			if (value = $html.find('td:contains("Eletrônico:")').first().next().text()) result.email = value.trim();
			if (value = $html.find('td:contains("Cep:")').first().next().text()) result.cep = value.trim();
			if (value = $html.find('td:contains("Logradouro:")').first().next().text()) result.logradouro = value.trim();
			if (value = $html.find('td:contains("Número:")').first().next().text()) result.num = value.trim();
			if (value = $html.find('td:contains("Complemento:")').first().next().text()) result.complemento = value.trim();
			if (value = $html.find('td:contains("Bairro:")').first().next().text()) result.bairro = value.trim();
			if (value = $html.find('td:contains("UF:")').first().next().text()) result.uf = value.trim();
			if (value = $html.find('td:contains("Município:")').first().next().text()) result.municipio = value.trim();
			
			return result;
		}).catch(raiseErrorPromise);
		
		return Promise.reject("Entidade não encontrada");
	}).catch(raiseErrorPromise);
}


//--- Consultar Entidade
async function consultarExtrato(fistel, filter) {
	
	if (!fistel) return raiseErrorPromise("Fistel nulo");
	fistel = fistel.replace(/\D/g,"");
	
	if (!fistel || fistel.length != 11 || !validateCpfj(fistel)) return raiseErrorPromise("Fistel inválido");
	
	
	return getAjaxContent(`http://sistemasnet/sigec/ConsultasGerais/ExtratoLancamentos/tela.asp?NumFistel=${fistel}&tipolancamento=todos&acao=c&hdnImprimir=true`, {returnError: true}).then(html => {
		let $html = $(html);
		let result = {fistel: fistel};
		if (value = $html.find('td:contains("Nome da Entidade:")').first().next().text()) result.nome = value.trim();
		if (value = $html.find('td:contains("CNPJ/CPF:")').first().next().text()) result.cpfj = value.trim();
		if (value = $html.find('td:contains("Serviço:")').first().next().text()) result.servico = value.replace(/\D/g, "");
		if (value = $html.find('td:contains("Situação:")').first().next().text()) result.situacao = value.trim();
		
		let $rows = $html.find('tr[id^=TRplus]');
		if ($rows.length) {
			result.lancamentos = [];
			$rows.each((index, row) => {
				let lancto = {rec: $(row).attr('id').replace(/\D/g,"")};
				let cols = $(row).children('td');
				lancto.seq = Number($(cols[8]).text().trim());
				lancto.receita = $(cols[0]).text().trim();
				lancto.ref = Number($(cols[1]).text().trim());
				lancto.ano = Number($(cols[2]).text().trim());
				lancto.vencto = $(cols[3]).text().trim();
				lancto.valor = Number($(cols[4]).text().replace(/[^\d,]/g,"").replace(",", "."));
				lancto.pagto = $(cols[5]).text().trim();
				lancto.pago = Number($(cols[6]).text().replace(/[^\d,]/g,"").replace(",", "."));
				lancto.util = Number($(cols[7]).text().replace(/[^\d,]/g,"").replace(",", "."));
				
				do {
					if (lancto.situacao = $(cols[9]).text().trim()) {
						if (lancto.situacao.includes("Vencer")) lancto.status = "V";
						else if (lancto.situacao.includes("Maior")) lancto.status = "M";
							else lancto.status = lancto.situacao[0].toUpperCase();
					} else {
						row = $(row).next('tr:not([id^=TRplus])').get(0);
						if (!row) break;
						cols = $(row).children('td');
						lancto.pagto = $(cols[5]).text().trim();
						lancto.pago += Number($(cols[6]).text().replace(/[^\d,]/g,"").replace(",", "."));
						lancto.util += Number($(cols[7]).text().replace(/[^\d,]/g,"").replace(",", "."));
					}
				} while (!lancto.situacao);

				lancto.pendente = lancto.status == "D" || lancto.status == "P" || lancto.status == "V";
				
				result.lancamentos.push(lancto);	
				
			});
			
			if (filter) result.lancamentos = result.lancamentos.filter(lancto => {
				let expr = filter.replace(/\$rec\b/g, lancto.rec)
				                 .replace(/\$seq(?:uencial)\b/g, lancto.seq)
				                 .replace(/\$desc(?:ricao)?\b/g, lancto.desc)
				                 .replace(/\$ref(?:erencia)?\b/g, lancto.ref)
				                 .replace(/\$ano\b/g, lancto.ano)
				                 .replace(/\$venc(?:imen)?to\b/g, lancto.vencto)
				                 .replace(/\$valor\b/g, lancto.valor)
				                 .replace(/\$pag(?:amen)?to\b/g, lancto.pagto)
				                 .replace(/\$pago\b/g, lancto.pago)
				                 .replace(/\$util(?:izado)?\b/g, lancto.util)
				                 .replace(/\$status\b/g, lancto.status)
				                 .replace(/\$pendente\b/g, lancto.pendente);
								 
				return solve(expr);				 
			});
		}
		return result;
	}).catch(raiseErrorPromise);
	
}

//--- Consultar Fistel
async function consultarFistel(cpfj, filter = null) {
	
	if (!cpfj) return raiseErrorPromise("Parâmetros errado");
	cpfj = cpfj.replace(/\D/g,"");
	
	if (!cpfj || !validateCpfj(cpfj)) return raiseErrorPromise("CPF/CNPJ inválido");
	
	return getAjaxContent(`http://sistemasnet/sigec/ConsultasGerais/SituacaoCadastral/tela.asp?acao=c&NumCNPJCPF=${cpfj}`, {returnError: true}).then(html => {
		let $html = $(html);
		let result = [];
		
		let $rows = $html.find('tr[id^=TRplus]');
		if ($rows.length) {
			$rows.each((index, row) => {
				let cols = $(row).children('td');
				let entry = {nome: $(cols[0]).text().trim(),
							 fistel: $(cols[1]).find('button').first().text().trim(),
							 uf: $(cols[3]).find('label').first().text().trim(),
							 servico: $(cols[4]).text().trim(),
							 devedor: $(cols[6]).text().trim(),
							 situacao: $(cols[11]).text().trim(),
							 validade: $(cols[12]).text().trim()};
				result.push(entry);
			});
			
			if (filter) {
				let fn_filter = filter;
				
				if (typeof filter === 'object') {
					fn_filter = function(e) {
						for (let key of Object.keys(filter)) {
							if (filter[key] != e[key]) return false;
						}
						return true;
					}; 
				}

				result = result.filter(fn_filter);
			}
			
		}

		if (result.length == 1) return result[0];
		return result.length ? result : null;
	}).catch(raiseErrorPromise);
	
}


// Consultar endereço de consulta do serviço
async function consultarUrlServico(servico, cpfj_indicativo) {
	let url;
	
	if (!servico) return Promise.reject("Serviço não identificado");
	servico = Number(servico);
	
	switch (servico) {
		case 302: url = "http://sistemasnet/scra/Consulta/Tela.asp"; break;
		case 400: url = "http://sistemasnet/scpx/Consulta/Tela.asp"; break;
		case 507: url = "http://sistemasnet/stel/scma/Consulta/Tela.asp"; break;
		case 604: url = "http://sistemasnet/stel/scmm/Consulta/Tela.asp"; break;
		default: return Promise.reject(`Consulta de serviço(${servico}) indisponível`);
	}
	
	var cpfj = cpfj_indicativo && cpfj_indicativo.match(/\s*\d[\d.-]+\s*/) ? cpfj_indicativo.replace(/\D/g, "") : null;
	var indicativo = cpfj_indicativo && cpfj_indicativo.match(/\s*[a-z][\w-]\s*/i) ? cpfj_indicativo.replace(/\W/g, "") : null;
	
	if (cpfj && !validateCpfj(cpfj)) return Promise.reject("CPF/CNPJ inválido");
	if (indicativo && (indicativo.length < 4 || indicativo.length > 8)) return Promise.reject(`Indicativo '${indicativo}' inválido`);
	
	let result = await postFormData(url, {onlyFetch: true, fetchMethod: "post", fetchParams: {acao: "v", btnpVencidas: "n", btnpVincendas: "n", btnpHabSemEstacao: "n", btnpInativasRF: "n", pNumCNPJCPF: cpfj, pIndicativo: indicativo, pindTipoComparacao: "e"}}).then(html => {
		if (m = html.match(/\bTela.asp\?.*\bpidtHabilitacao=(\d+)[^'"]*/i)) return m[1];
		
		let regex = /\s*Ativ[ao]\s*/i;
		let $a = $(html).find('a[href*=pidtHabilitacao]').filter((i,a) => regex.test($(a).closest('tr').find('td:eq(3)').text()));
		if ($a.length) {
			if ($a.length > 1) return Promise.reject("Mais de uma Autorização encontrada");
			if (m = $a.attr("href").match(/pidtHabilitacao=(\d+)/i)) return m[1];
		}
		
		if (servico == 604) {
			if (m = html.match(/location\.href\s*?=\s*['"]Tela\.asp.*?pNumFistel=(\d{11})/i)) return m[1];
			let $a = $(html).find('a[href*=pNumFistel]').filter((i,a) => regex.test($(a).closest('tr').find('td:eq(3)').text()));
			if ($a.length) {
				if ($a.length > 1) return Promise.reject("Mais de uma Autorização encontrada");
				if (m = $a.attr("href").match(/pNumFistel=(\d{11})/i)) return m[1];
			}
		}
		
		return null;
		
	}).catch(raiseErrorPromise);
	
	if (!result) return Promise.reject("Não autorizado");
	if (result instanceof Promise) return result;
	
	switch (servico) {
		case 302: return `http://sistemasnet/scra/Consulta/VersaoImpressao.asp?pidtHabilitacao=${result}&xOp=N`;
		case 400: return `http://sistemasnet/scpx/Consulta/VersaoImpressao.asp?pidtHabilitacao=${result}&xOp=N`;
		case 507: return `http://sistemasnet/stel/scma/Consulta/VersaoImpressao.asp?pidtHabilitacao=${result}&xOp=N`;
		case 604: return `http://sistemasnet/stel/scmm/Consulta/VersaoImpressao.asp?pNumFistel=${result}&xOp=N`;
	}
	
	return null;
}


// Consultar histórico do serviço
async function consultarHistoricoServico(servico, id) {
	let url, method = "get";
	
	if (!servico) return Promise.reject("Serviço não identificado");
	servico = Number(servico);
	
	var cpfj = id && id.match(/\s*\d[\d.-]+\s*/) ? id.replace(/\D/g, "") : null;
	var indicativo = id && id.match(/\s*[a-z][\w-]\s*/i) ? id.replace(/\W/g, "") : null;
	
	if (cpfj && !validateCpfj(cpfj)) return Promise.reject("CPF/CNPJ inválido");
	if (indicativo && (indicativo.length < 4 || indicativo.length > 8)) return Promise.reject(`Indicativo '${indicativo}' inválido`);
	
	switch (servico) {
		case 19: return {url: "http://sistemasnet/stel/chamada/Historico.asp?SISQSmodulo=10253", postData: {acao: "p", pNumCnpjCpf: cpfj, pIndicativo: indicativo, pindTipoComparacao: "e"}};
		case 604: return {url: "http://sistemasnet/stel/SCMM/Chamada/Historico.asp?SISQSmodulo=20876", postData: {acao: "p", pNumCnpjCpf: cpfj, pIndicativo: indicativo, pindTipoComparacao: "e"}};
		case 507: return {url: "http://sistemasnet/stel/SCMA/Chamada/Historico.asp?SISQSmodulo=20835", postData: {acao: "p", pNumCnpjCpf: cpfj, pIndicativo: indicativo, pindTipoComparacao: "e"}};
		case 302: return {url: "http://sistemasnet/scra/Chamada/Historico.asp", postData: {acao: "p", pNumCnpjCpf: cpfj, pIndicativo: indicativo, pindTipoComparacao: "e"}};
		default: return Promise.reject(`Consulta de histórico de serviço(${servico}) indisponível`);
	}
	
}



/***** SCPX *****/

//Incluir serviço no SCPX e licenciar estação
//Retorna {fistel,indicativo}
async function autorizarPX(cpf, processo) {
	const TITLE = "Autorização PX";
	
	let campos = [{group: "estacoes", text: "Tipo de Estações", fields: [{id: "movel", type: "check", label: "Estação Móvel", value: true}, {id: "fixa", type: "check", label: "Estação Fixa no Domicílio"}]}];
	
	return openFormDlg(campos, TITLE, "Autorizar PX", v => {
		if (!v.data.estacoes.movel && !v.data.estacoes.fixa) {
			v.target = "estacoes";
			v.message = "Nenhuma estação foi marcada";
			return false;
		}
	}).then(async data => {
		
		let log = openProcessDlg(TITLE);
		
		//--- manipulador de erro padrão
		let handle_error = error => {
			if (error.status == 401) {
				errorMessage(`@@Não foi possível acessar o sistema interativo da Anatel. Siga as seguintes instruções:\n
				1. Abrir uma nova aba no navegador e acessar o endereço [](http://sistemasnet)
				2. Fazer login
				3. Fechar aba@@`);
				return log.fail("Falha de autenticação");
			}

			if (error.html) {
				if (alert_msg = getReturnAlert(error.html)) error = alert_msg;
				else error = error.message ? error.message : "";
			}
			
			return log.fail(error && error.statusText?error.statusText:error);
		};
		
		//--- saída da função de autorização
		let exit = msg => {
			if (msg) log.fail(msg);
			log.finish();
			throw `${TITLE} falhou`;
		}; 
		
		
		//--- carregar id do interessado
		log.start("Carregando ID do interessado");
		
		let url_servico = await Promise.resolve($.post("http://sistemasnet/scpx/Servico/Tela.asp?Op=I", `acao=v&btnOp=I&pNumCnpjCpf=${cpf}`)).then(html => getReturnReload(html), handle_error);
		if (!url_servico) exit();

		let id_entidade = (m =  url_servico.match(/pidtEntidade=([^&$]+)/i)) ? m[1] : null;
		
		if (!id_entidade) return log.fail("Código da entidade não encontrado");
		log.success(`ID do interessado carregado (id: ${id_entidade})`);
		
		//--- carregar cadastro do interessado
		
		log.start("Carregando cadastro do interessado");
		let cadastro = await getAjaxContent(`http://sistemasnet/stel/Consultas/Entidade/Cadastro/telaEntidade.asp?IdtEntidade=${id_entidade}`, {returnError: true}).then(html => {
			let $html = $(html);
			let result = {};
			if (value = $html.find('td:contains("Nome:")').first().next().text()) result.nome = value.trim();
			if (value = $html.find('td:contains("Identidade:")').first().next().text()) result.rg = value.trim();
			if (value = $html.find('td:contains("Expedidor:")').first().next().text()) result.expedidor = value.trim().toUpperCase();
			if (value = $html.find('td:contains("Data de Nascimento:")').first().next().text()) result.nascimento = value.trim();
			if (value = $html.find('td:contains("Eletrônico:")').first().next().text()) result.email = value.trim();
			if (value = $html.find('td:contains("Cep:")').first().next().text()) result.cep = value.trim();
			if (value = $html.find('td:contains("Logradouro:")').first().next().text()) result.logradouro = value.trim();
			if (value = $html.find('td:contains("Número:")').first().next().text()) result.num = value.trim();
			if (value = $html.find('td:contains("Complemento:")').first().next().text()) result.complemento = value.trim();
			if (value = $html.find('td:contains("Bairro:")').first().next().text()) result.bairro = value.trim();
			if (value = $html.find('td:contains("UF:")').first().next().text()) result.uf = value.trim();
			if (value = $html.find('td:contains("Município:")').first().next().text()) result.municipio = value.trim();
			
			return result;
		}).catch(handle_error);
		if (!cadastro) exit();
		log.success(`Cadastro carregado com sucesso`);

		let pst = data.estacoes.movel&&data.estacoes.fixa?{s: "s", ao: "ões", e: " e "}:{s: "", ao: "ão", e: ""};
		
		log.start("Aguardando confimação");
		
		let result = await confirmMessage(`@@Autorização do serviço para **${cadastro.nome.toUpperCase()}** e licenciamento de ${data.estacoes.movel?"uma estação móvel":""}${pst.e}${data.estacoes.fixa?"uma estação fixa":""}\n` +
		                                  `com os seguintes dados cadastrais:\n\n` +
										  `**CPF:** ${cpfjReadable(cpf)}\n**Identidade:** ${cadastro.rg}/${cadastro.expedidor}\n**Data de Nascimento:** ${cadastro.nascimento}\n` +
										  `**E-Mail:** ${cadastro.email?cadastro.email:""}\n**Endereço:** ${cadastro.logradouro}${cadastro.num?", " + cadastro.num:""}${cadastro.complemento?", "+cadastro.complemento:""}${cadastro.bairro?", "+cadastro.bairro:""}\n` +
										  `**Município:** ${cadastro.municipio}/${cadastro.uf}\n**CEP:** ${cadastro.cep}@@\n` +
										  `-----\n` +
										  `##Continuar processo de autorização?##`, TITLE);
		
		if (!result) exit("Não confirmado");
		log.del();

		
		//-- incluir serviço
		log.start("Incluindo autorização do serviço");
		url_servico = absoluteUrl("http://sistemasnet/SCPX/Servico", url_servico);
		let servico_ja_cadastrado;
		
		result = await postFormData(url_servico, async e => {
			if (error = getReturnAlert(e.html)) {
				servico_ja_cadastrado = error.match(/\bj.\s*est.\s*cadastrad./i) != null;
				return Promise.reject(error);
			}
			
			scriptFillData(e.html, e.data);
			
			let row = await getAjaxContent(`http://sistemasnet/SCPX/Chamada/CEPXMLBancoXML.asp?CEPTpC=R&CEPseq=1&CEPidt=${id_entidade}&CEPtpend=1&CEPNumCep=&recEnd=False`, {charset: "utf-8"});
			if (!row || !(row = row.getElementsByTagName('z:row')[0] || row.getElementsByTagName('row')[0])) return Promise.reject("Endereço da entidade não encontrado");
			fillCEP(row, e.data);
			
			e.data.NumProcesso = processo;
			e.data.btnAcao = "Salvar";
		}).then(html => {
			if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail();
		}).catch(handle_error);
		
		if (result) log.success("Autorização do serviço incluída");
		else if (!servico_ja_cadastrado) exit();
		
		
		let fistel, indicativo;
		
		//--- carregar id de habilitação e fistel
		log.start("Carregando Autorização...");
		let id_habilitacao = await postFormData("http://sistemasnet/SCPX/Estacao/Tela.asp?OP=I", {acao: "v", pNumCnpjCpf: cpf}).then(html => {
			if (m = html.match(/\bTela.asp\?Op=I.*\bpidtHabilitacao=(\d+)[^'"]*/i)) return m[1];
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail("Falhou");
			
		}).catch(handle_error);
		
		if (!id_habilitacao) exit("Autorização não encontrada");
		
		if (servico_ja_cadastrado) {
			if (html = await getAjaxContent(`http://sistemasnet/SCPX/Consulta/Tela.asp?pidtHabilitacao=${id_habilitacao}&acao=p`)) {
				let num = $(html).find('#divdados tr:contains("Estações Ativas") td:last').text();
				if (!num) exit("Número de estações ativas não localizado");
				
				// if (Number(num)) exit("Serviço já possui estações ativas");
				
			} else exit("Consulta ao serviço previamente cadastrado falhou");
		} 
		
		log.success(`Autorização carregada com sucesso (id: ${id_habilitacao})`);
		
		
		//--- incluir estacões
		for (tipo of ["móvel", "fixa"]) {
			let prop = identityNormalize(tipo);
			if (!data.estacoes[prop]) continue;
			log.start(`Incluindo estação ${tipo}`);
			
			indicativo = await getAjaxContent(`http://sistemasnet/SCPX/Estacao/BancoXML.asp?idtHabilitacao=${id_habilitacao}&SiglaUF=${cadastro.uf}&p=1`);
			if (!indicativo) exit("Indicativo não encontrado");
		
			let sequencial = indicativo.split("-");
			indicativo = sequencial[0];
			sequencial = sequencial[1];
			
			log.text = `Incluindo estação ${tipo}: **${indicativo}-${sequencial}**`;
			result = await postFormData(`http://sistemasnet/SCPX/Estacao/Tela.asp?OP=I&acao=p&iNumCnpjCPF=${cpf}&iNumFistel=${fistel}&pidtHabilitacao=${id_habilitacao}&CodTipoEstacao=${tipo=="fixa"?1:6}`, async e => {
				if (error = getReturnAlert(e.html)) return Promise.reject(error);
				
				scriptFillData(e.html, e.data);
				
				let row = await getAjaxContent(`http://sistemasnet/SCPX/Chamada/CEPXMLBancoXML.asp?CEPTpC=R&CEPseq=1&CEPidt=${id_entidade}&CEPtpend=1&CEPNumCep=&recEnd=False`, {charset: "utf-8"});
				if (!row || !(row = row.getElementsByTagName('z:row')[0] || row.getElementsByTagName('row')[0])) return Promise.reject("Endereço da entidade não encontrado");
				fillCEP(row, e.data);
				if (tipo=="fixa") fillCEP(row, e.data, 4, "");
				
				e.data.acao = "s";
				e.data.cmbUF = e.data.btnSiglaUFSede;
				e.data.NomeIndicativo = indicativo;
				e.data.NumSequenciaIndicativo = sequencial;
				e.data.NomeIndicativoAut = indicativo;
				e.data.NumSequenciaIndicativoAut = sequencial;
				e.data.cmbTipoEstacao = tipo=="fixa"?"1-S":"6-N";
				e.data.btnIndTipoEstacaoFixa = tipo=="fixa"?"S":"N";
				e.data.CodTipoEstacao = tipo=="fixa"?1:6;
				e.data.btnCodTipoEstacao = e.data.CodTipoEstacao;
			 }).then(html => {
				if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
				
				if (error = getReturnAlert(html)) return Promise.reject(error);
				return log.fail();
			}).catch(handle_error);
			
			if (!result) exit(data.indicativos.length?"":"Nenhum indicativo válido");
			log.success(`Estação ${tipo} incluída com sucesso (${indicativo}-${sequencial})`);
		};
		
		
		//--- movimentar estações
		log.start(`Transferindo movimendo da${pst.s} estaç${pst.ao}`);
		result = await postFormData(`http://sistemasnet/SCPX/MovimentoTransferir/Tela.asp?acao=p&pidtHabilitacao=${id_habilitacao}&Mov=B`, e => {
			if (error = getReturnAlert(e.html)) return Promise.reject(error);
			scriptFillData(e.html, e.data);
			e.data.acao = "s";
			e.data.CodTipoMovimento = "E#7";
			e.data.idtEstacao = $(e.html).find('[name=idtEstacao]').map((i,e) => $(e).val()).get().join(",");
		}).then(html => {
			if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail();
		}).catch(handle_error);
		
		if (!result) exit();
		log.success(`Estaç${pst.ao} transferida${pst.s} com sucesso`);

		
		//-- gerar PPDESS
		log.start("Gerando PPDESS");
		result = await Promise.resolve($.get(`http://sistemasnet/SCPX/EstacaoLicenciar/Tela.asp?acao=G&pidtHabilitacao=${id_habilitacao}`)).then(html => error = getReturnAlert(html) ? Promise.reject(error) : true).catch(handle_error);

		if (!result) exit();
		log.success(`PPDESS gerado com sucesso`);

		
		//-- licenciar estações
		log.start(`Licenciando estaç${pst.ao}`);
		result = await postFormData(`http://sistemasnet/SCPX/EstacaoLicenciar/Tela.asp?acao=p&pidtHabilitacao=${id_habilitacao}`, e => {
			scriptFillData(e.html, e.data);
			e.data.acao = "s";
			fistel = e.data.NumFistel;
		}).then(html => (error = getReturnAlert(html)) ? Promise.reject(error) : true).catch(handle_error);

		if (!result) exit();
		log.success(`Estaç${pst.ao} licenciada${pst.s} com sucesso`);

		
		log.finish();
		
		return {fistel: fistel, indicativo: indicativo};
	});
}


async function consultarPX(cpf) {
	
	if (!cpf || cpf.replace(/\D/g, "").length != 11) return Promise.reject("CPF inválido");
	
	let id_habilitacao = await postFormData("http://sistemasnet/scpx/Consulta/Tela.asp", {acao: "v", btnpVencidas: "n", btnpVincendas: "n", btnpHabSemEstacao: "n", btnpInativasRF: "n", pNumCnpjCpf: cpf, pindTipoComparacao: "e"}).then(html => {
		if (m = html.match(/\bTela.asp\?.*\bpidtHabilitacao=(\d+)[^'"]*/i)) return m[1];
		return null;
	}).catch(raiseErrorPromise);
	
	if (!id_habilitacao) return Promise.reject("Não autorizado");
	if (id_habilitacao instanceof Promise) return id_habilitacao;
	
	let url = `http://sistemasnet/SCPX/Consulta/VersaoImpressao.asp?pidtHabilitacao=${id_habilitacao}&xOp=N`;
	
	let result = {url: url};
	
	return getAjaxContent(result.url).then(html => {
		// let $html = $(html);
		// if (value = $html.find('td:contains("Nome:")').first().next().text()) result.nome = value.trim();
		// if (value = $html.find('td:contains("Identidade:")').first().next().text()) result.rg = value.trim();
		// if (value = $html.find('td:contains("Expedidor:")').first().next().text()) result.expedidor = value.trim().toUpperCase();
		// if (value = $html.find('td:contains("Data de Nascimento:")').first().next().text()) result.nascimento = value.trim();
		// if (value = $html.find('td:contains("Eletrônico:")').first().next().text()) result.email = value.trim();
		// if (value = $html.find('td:contains("Cep:")').first().next().text()) result.cep = value.trim();
		// if (value = $html.find('td:contains("Logradouro:")').first().next().text()) result.logradouro = value.trim();
		// if (value = $html.find('td:contains("Número:")').first().next().text()) result.num = value.trim();
		// if (value = $html.find('td:contains("Complemento:")').first().next().text()) result.complemento = value.trim();
		// if (value = $html.find('td:contains("Bairro:")').first().next().text()) result.bairro = value.trim();
		// if (value = $html.find('td:contains("UF:")').first().next().text()) result.uf = value.trim();
		// if (value = $html.find('td:contains("Município:")').first().next().text()) result.municipio = value.trim();
		
		return result;
	}).catch(raiseErrorPromise);
}

/***** SCRA *****/

async function consultarIndicativoDisponivel(indicativo, classe) {
	if (!indicativo || !indicativo.match(/pu3[a-z]{2,3}\b/i) || !classe || !classe.match(/[abc]/i)) return false;
	
	indicativo = indicativo.trim().toUpperCase();
	classe = classe.trim().toUpperCase();
	
	return postFormData("http://sistemasnet/SCRA/Consulta/IndicativoUF/Tela.asp", {acao: "c", Indicativo: indicativo, SiglaUF: "RS", idtTipoIndicativo: "N", CodCategoria: classe}).then(data => {
		if (error = getReturnAlert(data)) {
			if (error.match(/indicativo\s+n[aã]o\s*dispon[íi]vel/i)) return false;
			return Promise.reject(error);
		}
		
		if ((new RegExp(`(?:<b>)?${indicativo}(?:<\\/b>)?\\s+est.\\s+dispon.vel`, "i")).test(data)) return true;
		
		return Promise.reject("Falha na consulta do indicativo");
	}).catch(raiseErrorPromise);
} 


async function consultarRA(cpf, onlyURL) {
	
	if (!cpf || cpf.replace(/\D/g, "").length != 11) return Promise.reject("CPF inválido");
	
	let id_habilitacao = await postFormData("http://sistemasnet/scra/Consulta/Tela.asp", {acao: "v", btnpVencidas: "n", btnpVincendas: "n", btnpHabSemEstacao: "n", btnpInativasRF: "n", pNumCnpjCpf: cpf, pindTipoComparacao: "e"}).then(html => {
		if (m = html.match(/\bTela.asp\?.*\bpidtHabilitacao=(\d+)[^'"]*/i)) return m[1];
		return null;
	}).catch(raiseErrorPromise);
	
	if (!id_habilitacao) return Promise.reject("Não autorizado");
	if (id_habilitacao instanceof Promise) return id_habilitacao;
	
	let url = `http://sistemasnet/SCRA/Consulta/VersaoImpressao.asp?pidtHabilitacao=${id_habilitacao}&xOp=N`;
	
	if (onlyURL) return url;
	
	let result = {url: url};
	
	return getAjaxContent(result.url).then(html => {
		// let $html = $(html);
		// if (value = $html.find('td:contains("Nome:")').first().next().text()) result.nome = value.trim();
		// if (value = $html.find('td:contains("Identidade:")').first().next().text()) result.rg = value.trim();
		// if (value = $html.find('td:contains("Expedidor:")').first().next().text()) result.expedidor = value.trim().toUpperCase();
		// if (value = $html.find('td:contains("Data de Nascimento:")').first().next().text()) result.nascimento = value.trim();
		// if (value = $html.find('td:contains("Eletrônico:")').first().next().text()) result.email = value.trim();
		// if (value = $html.find('td:contains("Cep:")').first().next().text()) result.cep = value.trim();
		// if (value = $html.find('td:contains("Logradouro:")').first().next().text()) result.logradouro = value.trim();
		// if (value = $html.find('td:contains("Número:")').first().next().text()) result.num = value.trim();
		// if (value = $html.find('td:contains("Complemento:")').first().next().text()) result.complemento = value.trim();
		// if (value = $html.find('td:contains("Bairro:")').first().next().text()) result.bairro = value.trim();
		// if (value = $html.find('td:contains("UF:")').first().next().text()) result.uf = value.trim();
		// if (value = $html.find('td:contains("Município:")').first().next().text()) result.municipio = value.trim();
		
		return result;
	}).catch(raiseErrorPromise);
}


//Incluir serviço no SCRA e licenciar incluir estações
//Retorna {fistel,indicativo}
async function autorizarRA(cpf, processo) {
	const TITLE = "Autorização RA (Somente Classe C)";
	
	let campos = [{id: "indicativos", type: "text", label: "Sugestões de Indicativo", upper: true, width: 300, value: "", title: "Separar mais de uma opção por espaço"}, 
				  {group: "estacoes", text: "Tipo de Estações", fields: [{id: "movel", type: "check", label: "Estação Móvel", value: true}, {id: "fixa", type: "check", label: "Estação Fixa no Domicílio"}]}];
	
	return openFormDlg(campos, TITLE, "Autorizar", v => {
		if (v.data.indicativos && !v.data.indicativos.replace(/[\s,;-]/g, ",").split(",").every(ind => {return !ind || !ind.trim() || ind.match(/pu3[a-z]{2,3}\b/i)})) {
			v.target = "indicativos";
			v.message = "Sugestão de indicativos inválida";
			return false;
		}
	}).then(async data => {
		
		let log = openProcessDlg(TITLE);
		
		//--- manipulador de erro padrão
		let handle_error = error => {
			if (error.status == 401) {
				errorMessage(`@@Não foi possível acessar o sistema interativo da Anatel. Siga as seguintes instruções:\n
				1. Abrir uma nova aba no navegador e acessar o endereço [](http://sistemasnet)
				2. Fazer login
				3. Fechar aba@@`);
				return log.fail("Falha de autenticação");
			}

			if (error.html) {
				if (alert_msg = getReturnAlert(error.html)) error = alert_msg;
				else error = error.message ? error.message : "";
			}
			
			return log.fail(error && error.statusText?error.statusText:error);
		};
		
		//--- saída da função de autorização
		let exit = msg => {
			if (msg) log.fail(msg);
			log.finish();
			throw "Autorização para o RA falhou";
		}; 
		
		
		//--- carregar id do interessado
		log.start("Carregando ID do interessado");
		
		let url_servico = await Promise.resolve($.post("http://sistemasnet/scra/Servico/Tela.asp?Op=I", `acao=v&btnOp=I&pNumCnpjCpf=${cpf}`)).then(html => getReturnReload(html), handle_error);
		if (!url_servico) exit();

		let id_entidade = (m =  url_servico.match(/pidtEntidade=([^&$]+)/i)) ? m[1] : null;
		
		if (!id_entidade) return log.fail("Código da entidade não encontrado");
		log.success(`ID do interessado carregado (id: ${id_entidade})`);
		
		//--- carregar cadastro do interessado
		
		log.start("Carregando cadastro do interessado");
		let cadastro = await getAjaxContent(`http://sistemasnet/stel/Consultas/Entidade/Cadastro/telaEntidade.asp?IdtEntidade=${id_entidade}`, {returnError: true}).then(html => {
			let $html = $(html);
			let result = {};
			if (value = $html.find('td:contains("Nome:")').first().next().text()) result.nome = value.trim();
			if (value = $html.find('td:contains("Identidade:")').first().next().text()) result.rg = value.trim();
			if (value = $html.find('td:contains("Expedidor:")').first().next().text()) result.expedidor = value.trim().toUpperCase();
			if (value = $html.find('td:contains("Data de Nascimento:")').first().next().text()) result.nascimento = value.trim();
			if (value = $html.find('td:contains("Eletrônico:")').first().next().text()) result.email = value.trim();
			if (value = $html.find('td:contains("Cep:")').first().next().text()) result.cep = value.trim();
			if (value = $html.find('td:contains("Logradouro:")').first().next().text()) result.logradouro = value.trim();
			if (value = $html.find('td:contains("Número:")').first().next().text()) result.num = value.trim();
			if (value = $html.find('td:contains("Complemento:")').first().next().text()) result.complemento = value.trim();
			if (value = $html.find('td:contains("Bairro:")').first().next().text()) result.bairro = value.trim();
			if (value = $html.find('td:contains("UF:")').first().next().text()) result.uf = value.trim();
			if (value = $html.find('td:contains("Município:")').first().next().text()) result.municipio = value.trim();
			
			return result;
		}).catch(handle_error);
		if (!cadastro) exit();
		log.success(`Cadastro carregado com sucesso`);

		let pst = data.estacoes.movel&&data.estacoes.fixa?{s: "s", ao: "ões", e: " e "}:{s: "", ao: "ão", e: ""};
		
		log.start("Aguardando confimação");
		
		let result = await confirmMessage(`@@Autorização do serviço para **${cadastro.nome.toUpperCase()}** e licenciamento de ${data.estacoes.movel?"uma estação móvel":""}${pst.e}${data.estacoes.fixa?"uma estação fixa":""}\n` +
		                                  `com os seguintes dados cadastrais:\n\n` +
										  `**CPF:** ${cpfjReadable(cpf)}\n**Identidade:** ${cadastro.rg}/${cadastro.expedidor}\n**Data de Nascimento:** ${cadastro.nascimento}\n` +
										  `**E-Mail:** ${cadastro.email?cadastro.email:""}\n**Endereço:** ${cadastro.logradouro}${cadastro.num?", " + cadastro.num:""}${cadastro.complemento?", "+cadastro.complemento:""}${cadastro.bairro?", "+cadastro.bairro:""}\n` +
										  `**Município:** ${cadastro.municipio}/${cadastro.uf}\n**CEP:** ${cadastro.cep}@@\n` +
										  `-----\n` +
										  `##Continuar processo de autorização?##`, TITLE);
		
		if (!result) exit("Não confirmado");
		log.del();

		
		//-- incluir serviço
		log.start("Incluindo autorização do serviço");
		url_servico = absoluteUrl("http://sistemasnet/scra/Servico", url_servico);
		let servico_ja_cadastrado;
		
		result = await postFormData(url_servico, async e => {
			if (error = getReturnAlert(e.html)) {
				servico_ja_cadastrado = error.match(/\bj.\s*est.\s*cadastrad./i) != null;
				return Promise.reject(error);
			}
			
			scriptFillData(e.html, e.data);
			
			let row = await getAjaxContent(`http://sistemasnet/SCRA/Chamada/CEPXMLBancoXML.asp?CEPTpC=R&CEPseq=1&CEPidt=${id_entidade}&CEPtpend=1&CEPNumCep=&recEnd=False`, {charset: "utf-8"});
			if (!row || !(row = row.getElementsByTagName('z:row')[0] || row.getElementsByTagName('row')[0])) return Promise.reject("Endereço da entidade não encontrado");
			fillCEP(row, e.data);
			
			e.data.NumProcesso = processo;
			e.data.btnAcao = "Salvar";
		}).then(html => {
			if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail();
		}).catch(handle_error);
		
		if (result) log.success("Autorização do serviço inclúída");
		else if (!servico_ja_cadastrado) exit();
		
		
		let fistel, indicativo, sequencial = 0;
		
		//--- carregar id de habilitação e fistel
		log.start("Carregando Autorização...");
		let id_habilitacao = await postFormData("http://sistemasnet/scra/Estacao/Tela.asp?OP=I", {acao: "v", pNumCnpjCpf: cpf}).then(html => {
			if (m = html.match(/\bTela.asp\?Op=I.*\bpidtHabilitacao=(\d+)[^'"]*/i)) {
				if (mf = m[0].match(/NumFistel=(\d{11})/)) fistel = mf[1];
				return m[1];
			}
		
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail("Falhou");
			
		}).catch(handle_error);
		
		if (!fistel || !id_habilitacao) exit("Fistel ou Autorização não encontrado");
		
		if (servico_ja_cadastrado) {
			if (html = await getAjaxContent(`http://sistemasnet/scra/Consulta/Tela.asp?pidtHabilitacao=${id_habilitacao}&acao=p`)) {
				let num = $(html).find('#divdados tr:contains("Estações Ativas") td:last').text();
				if (!num) exit("Número de estações ativas não localizado");
				
				//if (Number(num)) exit("Serviço já possui estações ativas");
				
			} else exit("Consulta ao serviço previamente cadastrado falhou");
		} 
		
		log.success(`Autorização carregada com sucesso (id: ${id_habilitacao})`);
	
		//--- consultar indicativos disponíveis
		
		if (data.estacoes.movel || data.estacoes.fixa) {
			log.start(`Consultando disponibilidade de indicativos`);
			if (data.indicativos) data.indicativos = data.indicativos.replace(/[\s,;-]+/g, ",").split(",");
			else data.indicativos = [];
			
			data.indicativos = data.indicativos.map(item => item.toUpperCase());
			
			let simpleArrange = (text, n) => {
				var input = text.toUpperCase().replace(/\s+(?:d[ao]s?\s+)?/gi," ").split(" ").map(p => p[0]);
				while (n > input.length) input.push(String.fromCharCode(65 + Math.floor(Math.random() * 30) % 24));
				
				if (n > input.length) return [];
				for (var j, l, k, p, f, result, q = k = 1, i = (l = input.length) + 1, j = l - n; --i; i <= j ? q *= i : k *= i);
				
				for (x = [new Array(n), new Array(n), new Array(n), new Array(n)], j = q = k * q / q, k = l + 1, i = -1; ++i < n; x[2][i] = i, x[1][i] = x[0][i] = j /= --k);
				
				for (result = new Array(q), p = -1; ++p < q;)
					for (result[p] = new Array(n), i = -1; ++i < n; !--x[1][i] && (x[1][i] = x[0][i], x[2][i] = (x[2][i] + 1) % l), result[p][i] = input[x[3][i]])
						for (x[3][i] = x[2][i], f = 0; !f; f = !f)
							for (j = i; j;)
								if(x[3][--j] == x[2][i]){
									x[3][i] = x[2][i] = (x[2][i] + ++f) % l;
									break;
								}
				return result;
			};
			
			data.indicativos.push(...simpleArrange(cadastro.nome, 3).map(ind => {return "PU3" + ind.join("").toUpperCase()}));
			
			while (!indicativo && data.indicativos.length) {
				log.text = `Consultando disponibilidade do indicativo ${data.indicativos[0]}`;
				if (await consultarIndicativoDisponivel(data.indicativos[0], "C")) {
					indicativo = data.indicativos[0];
					break;
				}
				data.indicativos.shift();
			}
			
			if (!indicativo) exit("Nenhum indicativo válido");
			log.success(`Indicativos **${indicativo}** disponível`);
		}
		
		
		//--- incluir estacões
		for (tipo of ["móvel", "fixa"]) {
			let prop = identityNormalize(tipo);
			if (!data.estacoes[prop]) continue;
			log.start(`Incluindo estação ${tipo} com indicativo **${indicativo}**`);
			
			
			result = await postFormData(`http://sistemasnet/SCRA/Estacao/Tela.asp?OP=I&acao=p&iNumCnpjCPF=${cpf}&iNumFistel=${fistel}&pidtHabilitacao=${id_habilitacao}&CodTipoEstacao=${tipo=="fixa"?1:6}`, async e => {
				if (error = getReturnAlert(e.html)) return Promise.reject(error);
				
				scriptFillData(e.html, e.data);
				
				let row = await getAjaxContent(`http://sistemasnet/SCRA/Chamada/CEPXMLBancoXML.asp?CEPTpC=R&CEPseq=1&CEPidt=${id_entidade}&CEPtpend=1&CEPNumCep=&recEnd=False`, {charset: "utf-8"});
				if (!row || !(row = row.getElementsByTagName('z:row')[0] || row.getElementsByTagName('row')[0])) return Promise.reject("Endereço da entidade não encontrado");
				fillCEP(row, e.data);
				if (tipo=="fixa") fillCEP(row, e.data, 4);
				
				e.data.acao = "s";
				e.data.CodTipoEstacao = tipo=="fixa"?1:6;
				e.data.btnCodTipoEstacao = e.data.CodTipoEstacao;
				e.data.NomeIndicativo = data.indicativos[0];
				e.data.NumSequenciaIndicativo = "+" + sequencial.toString().padStart(3, '0');
				e.data.NumCNPJCPF = cpf;
				e.data.NumFistel = fistel;
				e.data.pNumCnpjCpf = cpf;
				e.data.pNumFistel = fistel;
				e.data.DescCategoria = `Classe ${e.data.CodCategoria}`;
				e.data.NomeEntidade = cadastro.nome;
				
			 }).then(html => {
				if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
				
				if (error = getReturnAlert(html)) return Promise.reject(error);
				return log.fail();
			}).catch(handle_error);
			
			if (!result) exit();
			log.success(`Estação ${tipo} incluída com sucesso (${indicativo})`);
			sequencial++;
		};
		
		
		//--- movimentar estações
		log.start(`Transferindo movimendo da${pst.s} estaç${pst.ao}`);
		result = await postFormData(`http://sistemasnet/scra/MovimentoTransferir/Tela.asp?acao=p&pidtHabilitacao=${id_habilitacao}&Mov=B`, e => {
			if (error = getReturnAlert(e.html)) return Promise.reject(error);
			scriptFillData(e.html, e.data);
			e.data.acao = "s";
			e.data.CodTipoMovimento = "E#7";
			e.data.idtEstacao = $(e.html).find('[name=idtEstacao]').map((i,e) => $(e).val()).get().join(",");
		}).then(html => {
			if (html.match(/realizad.?\s+com\s+sucesso/i)) return true;
			if (error = getReturnAlert(html)) return Promise.reject(error);
			return log.fail();
		}).catch(handle_error);
		
		if (!result) exit();
		log.success(`Estaç${pst.ao} transferida${pst.s} com sucesso`);

		
		//-- gerar PPDESS
		log.start("Gerando PPDESS");
		result = await Promise.resolve($.get(`http://sistemasnet/scra/EstacaoLicenciar/Tela.asp?acao=G&pidtHabilitacao=${id_habilitacao}`)).then(html => error = getReturnAlert(html) ? Promise.reject(error) : true).catch(handle_error);

		if (!result) exit();
		log.success(`PPDESS gerado com sucesso`);

		
		//-- Licenciar estação
		log.start(`Licenciando estaç${pst.ao}`);
		result = await postFormData(`http://sistemasnet/scra/EstacaoLicenciar/Tela.asp?acao=p&pidtHabilitacao=${id_habilitacao}`, e => {
			scriptFillData(e.html, e.data);
			e.data.acao = "s";
			e.data.NumCNPJCPF = cpf;
			e.data.NumFistel = fistel;
			e.data.NomeEntidade = cadastro.nome;
		}).then(html => (error = getReturnAlert(html)) ? Promise.reject(error) : true).catch(handle_error);

		if (!result) exit();
		log.success(`Estação móvel licenciada com sucesso`);

		
		log.finish();
		
		return {fistel: fistel, indicativo: indicativo};
	});
}

//--- Consulta informações de Serviço de Telecomunicações
function consultarServicoTelecom(cod) {
	cod = ("000" + (cod ?? '')).slice(-3);
	switch (parseInt(cod)) {
		case 19: return {cod: cod, desc: "Serviço Limitado Privado", servico: "Limitado Privado", sigla: "SLP"};
		case 251: return {cod: cod, desc: "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Ligação para Transmissão de Programas", servico: "SARC(251)", sigla: "SARC"};
		case 252: return {cod: cod, desc: "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Reportagem Externa", servico: "SARC(252)", sigla: "SARC"};
		case 253: return {cod: cod, desc: "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Comunicação de Ordens Internas", servico: "SARC(253)", sigla: "SARC"};
		case 254: return {cod: cod, desc: "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Telecomando", servico: "SARC(254)", sigla: "SARC"};
		case 255: return {cod: cod, desc: "Serviço Auxiliar de Radiodifusão e Correlatos, submodalidade Telemedição", servico: "SARC(255)", sigla: "SARC"};
		case 302: return {cod: cod, desc: "Serviço de Radioamador", servico: "Radioamador", sigla: "RA"};
		case 400: return {cod: cod, desc: "Serviço Rádio do Cidadão", servico: "Rádio do Cidadão", sigla: "PX"};
		case 507: return {cod: cod, desc: "Serviço Limitado Móvel Aeronáutico", servico: "Limitado Móvel Aeronáutico", sigla: "SLMA"};
		case 604: return {cod: cod, desc: "Serviço Limitado Móvel Marítimo", servico: "Limitado Móvel Marítimo", sigla: "SLMM"};
	}

	return {};
}