/***************************************************/
/* Manipulador do visualizador de processos        */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

(function(){
	var ifr_arvore = $(window.opener.top.document).find("#ifrArvore").get(0);
	var doc_arvore = ifr_arvore.contentDocument || ifr_arvore.contentWindow.document;

	var nr_processo = $(doc_arvore).find(".infraArvore > a > span[id^='span']").first().text();
	var cod_servico = $(doc_arvore).find("#hdnServico").val();
	var desc_servico = $(doc_arvore).find("#hdnServico").attr("text");

	var fields = [];
	$(doc_arvore).find('.proc-field').each(function(){fields.push(parseField($(this).text()))});
	
	var cpfj_int, interessado, is_pf, is_pj, usu_sei_ok;
	
	if (input = $(doc_arvore).find("#hdnInteressadoPrincipal").get(0)) {
		interessado = $(input).attr("text");
		cpfj_int = $(input).val();
		if (cpfj_int.includes("@") && !(cpfj_int = findFieldValue(fields, "cpf", "num"))) cpfj_int = findFieldValue(fields, "cnpj", "num");
		if (cpfj_int) {
			let cpfj_len = cpfj_int.replace(/\D/g,"").length;
			is_pf = cpfj_len == 11;
			is_pj = cpfj_len == 14;
		}
	}


	$("#txtAssunto").val("Anatel - Processo nº " + nr_processo);

	$("#selTextoPadrao").on("change", function(e){
		let old_text = $("#txaMensagem").val();
		let t_update = setInterval(() => {
			text = $("#txaMensagem").val();
			if (text == old_text) return;
			clearInterval(t_update);
			
			//Limpar marcas 
			text = text.replace(/%INIT\(([^,]*?),(.*?),\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*,\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*\)%(?:%FIELDS\(([\w\W]*?)\)%)?(?:%REFS\(([\w\W]*?)\)%)?/ig, "");
			
			text = text.replace(/%(desc|cod)_servico(?:@([^%]+))?%/ig, (m0, m1, m2) => {
				let ret;
				switch (m1.toLowerCase()) {
					case "desc": ret = desc_servico == undefined?'Serviço Desconhecido':desc_servico; break;
					case "cod": ret = cod_servico == undefined?'000':cod_servico; break;
				}
				
				if (m2) {
					switch (m2.toLowerCase()) {
						case "up":
							ret = ret.toUpperCase();
							break;
						case "low":
							ret = ret.toLowerCase();
							break;
						default:
							ret = extractString(ret, m2);				
					}
				}
				
				return ret;
			});
			
			text = text.replace(/%is_sarc%/ig, (m0) => {
				let n = cod_servico == undefined?0:parseInt(cod_servico);
				return n>250&&n<256?"1":"0";
			});
			
			text = text.replace(/%field\(\s*([^;)@]+)(?:\s*@([^;)]+))?\s*(?:;\s*([^)]+)\s*)?\)%/ig, (m0,m1,m2,m3) => {
				return (f = findFieldValue(fields, m1, 0.9, m2)) ? f : m3 ? m3 : "";
			});
			
			text = text.replace(/%usu_sei_ok%/ig, (m0) => {
				if (usu_sei_ok == undefined) usu_sei_ok = getCurrentUsuarioExterno(fields)?"1":"0";
				return usu_sei_ok;
			});
			
			text = text.replace(/%is_int_p(f|j)%/ig, (m0,m1) => {
				if (m1.toLowerCase() == "f") return is_pf?'1':'0';
				else return is_pj?'1':'0';
			});			
			
			text = text.replace(/@nome_interessado@/ig, (m0,m1) => {
				return interessado ? interessado : "";
			});			
			
			text = text.replace(/@nome_interessado_maiusculas@/ig, (m0,m1) => {
				return interessado ? interessado.toUpperCase() : "";
			});			
			
			text = text.replace(/%(desc_)?cpfj_int(?:@?(\*))?%/ig, (m0, m1, m2) => {
				if (!cpfj_int) return "*** CPF/CNPJ do Interessado Desconhecido ***";
				
				m2 = m2?m2.toLowerCase():"";
				var ret = m2.includes("num")?cpfj_int.replace(/\D/g,""):cpfj_int;
				
				if (is_pf) {
					if (m2.includes("*")) ret = "***" + ret.slice(3,-2) + "**"
					if (m1) ret = "CPF nº " + ret;
				} else if (is_pj) {
					if (m1) ret = "CNPJ nº " + ret;
				}
				if (m2.includes("low")) ret = ret.toLowerCase();
				
				return ret;
			});
			
			while (m = text.match(/({#if\s*([^}]*?)}([\w\W]*?)?)({#if\s*[^}]*?}[\w\W]*?)?(?:{#else}([\w\W]*?))?{#endif}/i)) {
				if (solve(m[2])) { //then
					text = text.substr(0, m.index) + m[3] + text.slice(m.index + m[0].length);
				} else {
					if (m[4] != undefined) text = text.substr(0, m.index) + text.slice(m.index + m[1].length); //elseif
					else if (m[5] != undefined) text = text.substr(0, m.index) + m[5] + text.slice(m.index + m[0].length);  //else
					else text = text.substr(0, m.index) + text.slice(m.index + m[0].length); //false
				}
			}

			$("#txaMensagem").val(text);
		}, 250);
	});


}());