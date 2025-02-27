//Ajustar documento antes do salvamento
var script_beforesave = document.createElement('script');
script_beforesave.textContent = `var hsbs = setInterval(function() {
	for (inst in CKEDITOR.instances) if (CKEDITOR.instances[inst].status != "ready") return;
	clearInterval(hsbs);
	
	for (inst in CKEDITOR.instances) {
		var editor = CKEDITOR.instances[inst];
		editor.on("save", (evt) => {
			var html = evt.editor.document.$.body.innerHTML;
			html = html.replace(/<span\\b[^>]*?style=["']background-color:[^>]+>([\\w\\W]*?)<\\/span>/gi, '$1');
			evt.editor.document.$.body.innerHTML = html;
		});
	}
}, 400);`;
(document.body||document.documentElement).appendChild(script_beforesave);

//Localizar editor com o documento automatizável
var metadata, editor, alt_editor, html, tipo_doc;
$("#frmEditor [name^='txaEditor_']").each((i, ed) => {
	if (editor) return false;
	html = $(ed).val();
	if (html.match(/<p[^>]*>\s*(?:%INIT\([\w\W]*?\)%|#CFOR-MD-BEGIN;[\w\W]*?#CFOR-MD-END;)[\w\W]*?<\/p>/i)) editor = ed;

	if (!editor && html.match(/@tratamento_destinatario@|o\s*gerente\s*regional\s*da\s*anatel(?:<\/[^>]*?>)?\s*,/i)) alt_editor = ed;
	if (i == 1 && html.match(/\bAto\s+n[^\s]+\s+\d+/i)) tipo_doc = "ato";
});

//Seleção alternativa do editor
if (!editor) {
	if (alt_editor) editor = alt_editor;
	else if (tipo_doc == "ato")	editor = $("#frmEditor [name^='txaEditor_']").get(2);
}

//Executar automação do documento
if (editor) {
	//carregar documento
	html = $(editor).val();

	//escapar caracteres
	html = html.replace(/&#(\d+);/g, (m0, code) => {
		return String.fromCharCode(parseInt(code));
	});	

	//executar substituições dos campos e funções LEGADAS - (serão descontinuadas em vesões futuras)
	html = html.replace(/%ref\(\s*([^;@)]+(?:@([^;)]+))?)(?:\s*;\s*([^)]*)\s*)?\)%/ig, (m0, name, format, _default) => "$ref." + name + (format ? "@" + format : "") + (_default ? "??" + _default : ""));
	html = html.replace(/\$ref.sei@link/ig, "$ref.link");
	/**@todo: executar substituições configuradas */


	//--- INICIALIZAÇÃO DOS METADADOS

	var metadata, m, info_servico, usu_sei_ok;

	let regex = /<p[^>]*>%INIT\(([^,]*?),(.*?),\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*,\s*([\d\.\-]+|@[\w_]+@|)\s*,\s*([\d\.\-\/]+|@[\w_]+@|)\s*\)%(?:%FIELDS\(([\w\W]*?)\)%)?(?:%REFS\(([\w\W]*?)\)%)?(?:%INPUTS\(([\w\W]*)\)%)?<\/p>/i;

	let $area = $('<textarea />');
	let cpfj_validator = /(?:\d{3}\.?\d{3}\.?\d{3}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4})\-\d\d/;
	let sei_field_regex = /\@[\w_]*?\@/ig;


	//VERSÃO 1 - Metadado (será descontinuada futuramente)
	html = html.replace(regex, (m0, m1, m2, m3, m4, m5, m6, m7, m8, m9) => {
		metadata = { 
			proc: $area.html(m1 ?? "").text().trim(), 
			spec: $area.html(m2 ?? "").text().trim(), 
			inter: (m3 ?? '') + (m4 ?? ''), 
			dest: (m5 ?? '') + (m6 ?? ''), 
			fields: $area.html(m7 ?? "").text(), 
			ref: $area.html(m8 ?? "").text(), 
			settings: {inputs: $area.html(m9 ?? "").text()}
		};

		return "";
	});

	//VERSÃO 2 - Metadado
	html = html.replace(/#CFOR-MD-BEGIN;[\w\W]*#CFOR-MD-END;/i, m0 => {
		metadata = parseMetadata($area.html(m0 ?? "").text().trim().replace(/\@[^@\s]+?\@/g, ""), 'CFOR-MD-');
		return "";
	});


	//Sanitizar metadados
	for (let k in metadata) {
		if (typeof metadata[k] == 'string') metadata[k] = metadata[k].replace(sei_field_regex, '');
	}
	if (metadata.inter && !metadata.inter.match(cpfj_validator)) metadata.inter = '';
	if (metadata.dest && !metadata.dest.match(cpfj_validator)) metadata.dest = '';


	switch (metadata.proc.toLowerCase()) {
		case "outorga: rádio do cidadão":  info_servico = consultarServicoTelecom(400); break;
		case "outorga: radioamador": info_servico = consultarServicoTelecom(302); break;
		case "outorga: slp": info_servico = consultarServicoTelecom(19); break;
		case "outorga: limitado móvel aeronáutico": info_servico = consultarServicoTelecom(507); break;
		case "outorga: limitado móvel marítimo": info_servico = consultarServicoTelecom(604); break;
		default:
			if (metadata.spec) {
				switch (true) {
					case /\bLTP\b|\b251\b|Transmiss.o\s+de\s+Programas?/i.test(metadata.spec): info_servico = consultarServicoTelecom(251); break;
					case /\bRE\b|\b252\b|Reportagem\s+Externa/i.test(metadata.spec): info_servico = consultarServicoTelecom(252); break;
					case /\bOI\b|\b253\b|Ordens\s+Internas?/i.test(metadata.spec): info_servico = consultarServicoTelecom(253); break;
					case /\bTC\b|\b254\b|Telecomando/i.test(metadata.spec): info_servico = consultarServicoTelecom(254); break;
					case /\bTM\b|\b255\b|Telemedi..o/i.test(metadata.spec): info_servico = consultarServicoTelecom(255); break;
					default:
						if (m = metadata.spec.match(/\b(?:0?19|302|400|507|604)\b/)) info_servico = consultarServicoTelecom(m[0]);
				}
			}
	}

	if (!info_servico) info_servico = consultarServicoTelecom();
	if (metadata.fields) metadata.fields = fieldsFromString(metadata.fields);
	if (metadata.ref) metadata.ref = referenceFromData(metadata.ref);
	if (!metadata.settings) metadata.settings = {};
	if (metadata.settings.inputs) metadata.settings.inputs = metadata.settings.inputs.replace(/(?<=[{,:]\s*)[a-z_]\w*(?=\s*:)/ig, '"$&"');
	if (!metadata.inter && (c = findFieldValue(metadata.fields, "cpf", "num") || findFieldValue(metadata.fields, "cnpj", "num")) && validateCpfj(c)) metadata.inter = c;	
	
	
	
	//--- INICIALIZAÇÃO DE VARIÁVEIS GERAIS
	//funções básicas para referência
	var create_ref_link = ref => ref.link = `<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false"><a id="lnkSei${ref.id}" class="ancoraSei" style="text-indent:0px;">${ref.sei}</a></span>`;
	var ref_to_text = ref => ref ? (ref.name || ref.nome) + " (" + ref.sei + ")" : "";
	
	var uservars = {hoje: (new Date()).toDateBR()};
	if (metadata.fields) metadata.fields.forEach(f => uservars[identityNormalize(f.name)] = f.value);
	if (metadata.ref) {
		create_ref_link(metadata.ref);
		uservars.ref = metadata.ref;
	}
	
	
	//--- FUNÇÕES GERAIS
	
	//retornar texto destacado
	var hl_text = (text, color) => color?`<span style="background-color:${color};">${text}</span>`:text;

	//determinar se código numérico é de pessoa física ou jurídica
	var is_pfj = c => {
		if (!c) return false;
		c = c.replace(/\D/g, "");
		return c.length == 11 ? "f" : c.length == 14 ? "j" : undefined;
	}
	
	//substituir as variáveis definidas pelo usuário
	var replace_uservars = (html, empty = true) => {
		if (!html) return html;
		return html.replace(/\$([a-z_]+(?:\.[a-z_]+|\[\w+?\]|\w+)*)(?:@([\w.-]+\b))?(?:\?\?("[^"]+?"|&quot;.+?&quot;|[^<\s]+?(?=[<\s]|$)))?(\s*=(?!=))?/ig, (m0, name, format, _default, attrib) => {
			if (attrib) return m0;
			let value = name.indexOf('.') != -1 || name.indexOf('[') != -1 ? uservars.getValue(name) : uservars[name];
			if (!value) return _default ? replace_uservars(_default) : (empty ? "" : "$" + name);
			return formatValue(value, format);
		});
	}
	
	// interpretar HTML
	var parse_html = (html, options = {hlColor: "red", emptyVar: true}) => {
		
		//%desc_servico%, %ind_servico%, %cod_servico% e %sigla_servico%
		html = html.replace(/%(desc|ind|cod|sigla)_servico(?:@([^%]+))?%/ig, (m0, prefix, format) => {
			var value;
			switch (prefix.toLowerCase()) {
				case "desc": value = info_servico.desc ?? hl_text("*** Serviço Desconhecido ***", options.hlColor); break;
				case "ind": value = info_servico.servico ?? hl_text("*** Desconhecido ***", options.hlColor); break;
				case "cod": value = info_servico.cod ?? '000'; break;
				case "sigla": value = info_servico.sigla ?? ''; break;
			}
			
			return formatValue(value, format);
		});
		
		//%desc_cpfj_int%, %cpfj_int%, %desc_cpfj_dest%, %cpfj_dest%
		html = html.replace(/%(desc_)?cpfj_(int|dest)(?:@?(\*))?%/ig, (m0, prefix, sufix, format = "") => {
			let value;
			
			if (sufix.toLowerCase() == "int") {
				if (!metadata.inter) return hl_text("*** CPF/CNPJ do Interessado Desconhecido ***", options.hlColor);
				value = metadata.inter;
			} else {
				if (!metadata.dest) return hl_text("*** CPF/CNPJ do Destinatário é Desconhecido ***", options.hlColor);
				value = metadata.dest;
			}
			
			value = format.includes("num")?value.replace(/\D/g,""):value;
			
			if (is_pfj(metadata.inter) == "f") {
				if (format.includes("*")) value = "***" + value.slice(3,-2) + "**"
				if (prefix) value = "CPF nº " + value;
			} else {
				if (prefix) value = "CNPJ nº " + value;
			}
			if (format.includes("low")) value = value.toLowerCase();
			
			return value;
		});
		
		//%is_int_pf%, %is_int_pj%, %is_dest_pf% e %is_dest_pj%
		html = html.replace(/%is_(dest|int)_p(f|j)%/ig, (m0, m1, m2) => {
			if (m1.toLowerCase() == "dest") {
				if (m2.toLowerCase() == "f") return is_pfj(metadata.dest) == "f" ? "1" : "0";
				else return is_pfj(metadata.dest) == "j" ? "1" : "0";
			} else {
				if (m2.toLowerCase() == "f") return is_pfj(metadata.inter) == "f" ? "1" : "0";
				else return is_pfj(metadata.inter) == "j" ? "1" : "0";
			}
		});
		
		//%is_sarc%
		html = html.replace(/%is_sarc%/ig, (m0) => {
			var n = parseInt(info_servico.cod ?? 0);
			return n > 250 && n < 256 ? "1" : "0";
		});
		
		//%usu_sei_ok%
		html = html.replace(/%usu_sei_ok%/ig, (m0) => {
			if (usu_sei_ok == undefined) usu_sei_ok = getCurrentUsuarioExterno(metadata.fields) ? "1" : "0";
			return usu_sei_ok;
		});
		
		//%ep_has(expr)%
		html = html.replace(/%ep_has\(\s*([^)]+)\s*\)%/ig, (m0, expr) => {
			expr = expr.replace(/\*/g, ".*").replace(/\?/g, ".").replace(/\"/g, "\b").replace(/&nbsp;/g, " ").replace(/<(\w+)[^>]*>(.+)<\/\1>/gi, "$2");
			
			return (new RegExp(expr, "i")).test(metadata.spec) ? "1" : "0";
		});
		
		//%field(name, format, default)%
		html = html.replace(/%field\(\s*([^;)@]+)(?:\s*@([^;)]+))?\s*(?:;\s*([^)]+)\s*)?\)%/ig, (m0, name, format, _default) => {
			_default = _default && _default.replace(/<\/?\w+[^>]*?>/g,"");
			return (f = findFieldValue(metadata.fields, name, 0.9, format)) ? f : _default ? replace_uservars(_default) : "";
		});
		
		return html;
	};
	
	//--- aplicar testes #if
	var apply_conditions = (html, defer_vars) => {
		
		let regex_undef = defer_vars ? /%\w+\(.+|\$\w[\w_]*\b/i : /%\w+\(.+/i;
		let block_regex =  /(<p[^>]*?><code[^>]*?>{#if\s*([^}]*?)}<\/code><\/p>([\w\W]*?)?)(<p[^>]*?><code[^>]*?>{#if\s*[^}]*?}<\/code><\/p>[\w\W]*?)?(?:<p[^>]*?><code[^>]*?>{#else}<\/code><\/p>([\w\W]*?))?<p[^>]*?><code[^>]*?>{#endif}<\/code><\/p>/ig;
		let inline_regex = /(<code[^>]*?>{#if\s*([^}]*?)}<\/code>(?!<\/p>)([\w\W]*?)?)(<code[^>]*?>{#if\s*[^}]*?}<\/code>[\w\W]*?)?(?:<code[^>]*?>{#else}<\/code>([\w\W]*?))?<code[^>]*?>{#endif}<\/code>/ig;
		
		while (((m = block_regex.exec(html)) && (regex = block_regex)) || ((m = inline_regex.exec(html)) && (regex = inline_regex))) {
			let result = solve(m[2], regex_undef, uservars);
			if (result == undefined) {
				regex.lastIndex = m.index + m[0].length;
				regex.safeLastIndex = regex.lastIndex;
			} else {
				if (result) { //then
					html = html.substr(0, m.index) + m[3] + html.slice(m.index + m[0].length);
				} else {
					if (m[4] != undefined) html = html.substr(0, m.index) + html.slice(m.index + m[1].length); //elseif
					else if (m[5] != undefined) html = html.substr(0, m.index) + m[5] + html.slice(m.index + m[0].length);  //else
					else html = html.substr(0, m.index) + html.slice(m.index + m[0].length); //false
				}

				html = html.replace(/<\/([uo]l)>[\s\\nt]*?(<\1[^>]*?>)/gi, "");
				regex.lastIndex = regex.safeLastIndex ? regex.safeLastIndex : 0;

			}
		}
		
		let row_regex = /(<(tr|li)\b[^>]*?condition=\\?['"](.*?)\\?['"][^>]*?>)[\w\W]*?<\/\2>/ig;
		while (m = row_regex.exec(html)) {
			let result = solve(m[3], regex_undef, uservars);
			if (result == undefined) {
				row_regex.lastIndex = m.index + m[0].length;
				row_regex.safeLastIndex = row_regex.lastIndex;
			} else {
				if (result) html = html.substr(0, m.index) + m[1].replace(/\b(?:condition|title)=\\?['"].*?\\?['"]\s*/gi,"") + html.slice(m.index + m[1].length);
				else html = html.substr(0, m.index) + html.slice(m.index + m[0].length);
				row_regex.lastIndex = row_regex.safeLastIndex ? row_regex.safeLastIndex : 0;
			}
		}
		
		return html;
	};
	
	
	//--- INÍCIO DA INTERPRETAÇÃO DO TEXTO PADRÃO

	//limpar marcas da edição de texto
	html = html.replace(/(?:class="cfor-node"|spellcheck="[^"]+"|title="[^"]+")\s*/g, "");

	//substituir campos e funções CFOR
	html = parse_html(html);
	
	//incluir forma de tratamento de destinatário quando não definido
	html = html.replace(/@tratamento_destinatario@/gi, (m0) => {
		if (is_pfj(metadata.dest) == "f") return hl_text("Ao(À) Senhor(a)");
		return hl_text("Ao(À) Senhor(a) Representante Legal de");
	});
	
	//apagar complemento de endereço quando não definido
	html = html.replace(/\s*(?:<(\w+)\b[^>]*?>)?\s*[,-]?(?:\s|&nbsp;)*@complemento_endereco_destinatario@\s*(?:.*?<\/\1>)?/gi, (m0) => {
		return "";
	});
	
	//corrigir automaticamente denominação do cargo de gerência
	html = html.replace(/O GERENTE REGIONAL DA ANATEL\s*(?=(?:<\/[^>]+>)?\s*,)/g, (m0) => {
		return hl_text("O GERENTE REGIONAL DA ANATEL NO ESTADO DO RIO GRANDE DO SUL", "yellow");
	});
	
	//inserir Portaria 889 (Delegação) nos atos quando não existir
	if (tipo_doc == "ato" && !html.match(/\bPortaria\s*?n\.?(?:\s|&\w+;)*?889\b/i)) {
		let portaria = hl_text(`CONSIDERANDO o disposto na <a data-cke-saved-href="http://www.anatel.gov.br/legislacao/portarias-de-delegacao/645-portaria-889" href="http://www.anatel.gov.br/legislacao/portarias-de-delegacao/645-portaria-889" target="_blank">
		Portaria n.º&nbsp;889, de 07 de novembro de 2013</a>, que delega competências às Gerências Regionais para aprovação, expedição, adaptação, prorrogação e extinção, exceto por caducidade, de autorização para exploração de serviços de telecomunicações, e de uso de radiofrequências decorrentes, em regime privado de interesse restrito;`, "yellow");
		
		html = html.replace(/[\w\W]*?(<p[^>]*?>)(?=(?:\s*?<\w[^>]*?>)?\s*?CONSIDERANDO)/i, `$&${portaria}</p>$1`);
	}
	
	//aplicar condições com exceção das funções e variáveis diferidas
	html = apply_conditions(html, true);

	//montar lista de variáveis a serem fornecidas pelo usuário
	var vars = undefined;
	
	if (metadata.settings.inputs) {
		try {
			metadata.settings.inputs = parse_html(metadata.settings.inputs, {hlColor: null, emptyVar: false});
			metadata.settings.inputs = replace_uservars(metadata.settings.inputs, false);
			metadata.settings.inputs = JSON.parse(metadata.settings.inputs);
			
			if (Array.isArray(metadata.settings.inputs)) {
				vars = {};
				for(let input of metadata.settings.inputs) {
					vars[input.name] = {id: input.name, type: input.type, label: input.label, value: input.value, items: input.options, visibility: input.condition};

					switch (input.type) {
						case 'choice': vars[input.name].type = 'select'; break;

						case 'calendar': vars[input.name].type = 'date'; break;

						case 'ref':
							vars[input.name].type = 'static';
							vars[input.name].dropdown = {
								button: true,

								source: async function() {
									let list = await queryNodeSei(input.options ? {type: input.options} : undefined);
									if (!list) return [];
									if (!Array.isArray(list)) list = [list];
									return list.map(item => {
										item.text = ref_to_text(item);
										return item;
									});
								},

								onselect:  e => {
									let result = referenceFromData(e.data);
									create_ref_link(result);
									return result;
								},

								cache: true,
								max: 7
							};
							vars[input.name].value = "";
							break;
					}


				}
			}
			
		} catch(ex) {
			vars = undefined;
		}
	}
	
	//%var()%
	html = html.replace(/%var\(([^;)%]+);(text|check|calendar|choice(?:&\w+;|[^;])*?);((?:&\w+;|[^;])+)(?:;(.*?))?\)%/gi, (m0, name, type, label, _default) => {
		if (!vars) vars = {};
		let var_id = identityNormalize(name.replace(/@.+/, ""));
		
		let default_value = undefined;
		
		_default = _default && replace_uservars(_default.replace(/<\/?\w+[^>]*?>/g,""));

		if (_default) {
			if (type == "check") {
				default_value = solve(_default, null, uservars);
				_default = "";
			} else if (_default.length <= 3 || _default != _default[0].repeat(_default.length)) default_value = _default;
		}
		
		let list = undefined;
		if (mlist = type.match(/^\s*\bchoice\b\s*:?(?:\s*(.*))?\s*$/i)) {
			if (mlist[1]) {
				type = "select";
				list = mlist[1];
			} else type = "text";
		} else if (type.match(/^\s*\bcalendar\b\s*$/i)) type = "date";
		
		if (!vars[var_id]) vars[var_id] = {id: var_id, type: type, label: label, value: default_value, items: list};
		return `%var(${name}${_default?";"+_default:""})%`;
	});

	
	// permitir a seleção de documento de referência nos casos quando não configurado e utilizada função $ref
	let prompt_ref = metadata.settings.reft && 
					(!metadata.ref || 
					 !metadata.ref.nome ||
   					 NodeSei.translateType(metadata.ref.nome) != metadata.settings.reft ||
   					 metadata.settings.refv);	
	
 	(async function(html) {	
		
		//executar operações diferidas primeiro
 		if (!html || !html.match(/%(?:var|extrato)\(.*\)%|\$[a-z_]\w*\b/i)) return html;
		
	 	if (vars || prompt_ref) {
			let ffs = [];
			let ref_data = null;

			for (let f in vars) if (vars.hasOwnProperty(f)) ffs.push(vars[f]);


			if (prompt_ref) {
				ffs.push({	id: "refDoc", 
							type: "static", 
							label: NodeSei.translateType(metadata.settings.reft) + ' de Referência', 
							value: ref_to_text(metadata.ref),
						  	dropdown: {
								button: true,
						  		source: async function() {
									let list = await queryNodeSei(metadata.settings.reft ? {type: metadata.settings.reft} : undefined);
									if (!list) return [];

									if (!Array.isArray(list)) list = [list];
									return list.map(item => {
										item.text = ref_to_text(item);
										return item;
									});
								},
								onselect: e => {
									ref_data = e.data;
								},
								cache: true,
								max: 7
							}});
			}				 

			
			let data = await openFormDlg(ffs, "campos do documento", {alwaysResolve: true, backgroundOpacity: 0, backgroundColor: "#aaa", nullable: false}).catch(err => {return null});
			if (!data) return html;

			for (let v of Object.keys(data)) {
				
				html = html.replace(new RegExp(`%var\\(${v}(?:\\@([^;)]+))?(?:;([^)]+))?\\)%`, "ig"), (m0, format, _default) => data[v] ? formatValue(data[v], format) : (typeof data[v] == "boolean" ? data[v] : (_default ? _default : "")));
				uservars[v]= data[v];
			}

			if (ref_data && ref_data.sei !== metadata.ref.sei) {
				metadata.ref = referenceFromData(ref_data);
				create_ref_link(metadata.ref);
				uservars.ref = metadata.ref;
			}
			
			html = replace_uservars(html);
		} 
		
		html = html.replace(/%var\([^;]*?(?:;(.*))?\)%/ig, (m0, m1) => (m1?m1:""));

		//aplicar condições com exceção das funções e variáveis diferidas
		html = apply_conditions(html, true);
		
		//executar funções extrato
		let extratos = null;
		html = html.replace(/%extrato\(\s*([^;\)]+)\s*(?:;\s*(\w)\s*(?:;(.*))?)?\)%/ig, (m0, fistel, status, filtro) => {
			fistel = replace_uservars(fistel).replace(/[^\d,]/g, "");
			filtro = replace_uservars(filtro);

			if (!fistel.match(/^\d{11}(?:,\d{11})*$/)) return "";
			
			let id = "extrato_" + Math.floor((Math.random() * 100000));
			let extr = {id: id, fistel: fistel, status: status, filtro: !filtro ? null : filtro.replace(/\bAND\b/g, "&&").replace(/\bOR\b/g, "||").replace(/\bNOT\b/g, "!")};
			if (status) {
				status = status.toUpperCase();
				
				if (status == "P") status = "$pendente";
				else status = `$status == ${status}`;
				
				if (extr.filtro) extr.filtro = status + " && (" + extr.filtro + ")";
				else extr.filtro = status;
			}
			
			if (!extratos) extratos = [];
			extratos.push(extr);
			return "$" + id;
		});
		
		if (extratos) {
			for (let extr of extratos) {
				let lanctos = [];
				for (let f of extr.fistel.split(",")) {
					try {
						waitMessage(`Consultando extrato do fistel ${f}...`, {backgroundOpacity: 0, backgroundColor: "#aaa"});
						let extrato = await consultarExtrato(f, extr.filtro);
						if (extrato && extrato.lancamentos && extrato.lancamentos.length) lanctos.push(...extrato.lancamentos.map(l => {
							l.fistel = f;
							return l;
						}));
					} catch (err) {
						errorMessage(err);
					}
				}
				uservars[extr.id] = lanctos;
			}
		}
		
		return html; 

	})(html).then(html => {
		
		//aplicar condições com funções e variáveis diferidas
		html = apply_conditions(html, false);

		//executar blocos de comandos
		html = html.replace(/(?:<p[^>]*?><code[^>]*?>{#begin\s*([^}]*?)}<\/code><\/p>([\w\W]*?)?)<p[^>]*?><code[^>]*?>{#end}<\/code><\/p>/ig, (m0, commands, content) => {
			if (commands) {
				commands = commands.toLowerCase().trim().replace(/\s{2,}/g, " ").split(" ");
				for(let command of commands) {
					switch (command) {
						//limpar campos @@ vazios
						case 'clear': content = content.replace(/(?:[,\-–\/\\]\s*|&ndash;\s*)?(?:CEP:\s*)?\s*@\w+@\s*(?:<br\b[^>]*>)?(?:\s*<\/p>\s*<p\b[^>]*?>)?/ig, ""); break;
					}
				}
			}

			return content;
		});		
		
		//executar operações ternárias
		html = html.replace(/<code[^>]*?>\s*{#\?([^?]*)\?([^:}]*)(?::([^}]*))}\s*<\/code>/gi, (m0, expr, is_true, is_false) => {
			return solve(expr, null, uservars) ? is_true : is_false ? is_false : "";
		});
		
		//interpretar sequenciadores
		seq = {};
		html = html.replace(/%seq_([^%]+)%/ig, (m0, name) => {
			if (seq[name] == undefined) seq[name] = 1;
			else seq[name]++;

			return seq[name].toString();
		});
		
		//links para boletos
		html = html.replace(/%link_boleto\((.*?)(?:\s*;(.*?))?(?:\s*;(.*?))?\)%/ig, (m0, text, fistel, cpfj) => {
			if (!fistel && !(fistel = findFieldValue(metadata.fields, "fistel", "num"))) fistel = "";
			else fistel = validateFistel(fistel) ? fistel : "";
			
			if (!cpfj && !(cpfj = metadata.inter)) return cpfj = "";
			else cpfj = validateCpfj(cpfj) ? cpfj.replace(/\D/g,"") : "";
			
			let url;
			
			if (fistel && cpfj) url = `https://sistemas.anatel.gov.br/Boleto/Internet/Consulta.asp?indTipoBoleto=d&indTipoConsulta=c&Ano=&Mes=&Ordenacao=datavencimento&PaginaOrigem=&acao=c&MC=&cmd=&plataforma=E&Sistema=&NumCNPJCPF=${cpfj}&NumFistel=${fistel}`;
			else url = `https://sistemas.anatel.gov.br/Boleto/Internet/Tela.asp?NumCNPJCPF=${cpfj}&NumFistel=${fistel}`;
			
			return `<a data-cke-saved-href="${url}" href="${url}" target="_blank">${text}</a>`;
			
		});
		
		let parser = new DOMParser();
		let doc = parser.parseFromString(html, "text/html");
		let $tables = $(doc).find("table[dynamic-table]");

		//atualizar tabelas dinâmicas
		if ($tables.length) {
			waitMessage("Atualizando tabelas dinâmicas...", {backgroundOpacity: 0, backgroundColor: "#aaa"});
			
			let write_row_message = (t, m, c="red") => {
				$(t).find("tbody tr").remove();
				let n_cols = $(t).find("thead tr:last th").length;
				$(t).find("tbody").append(`<tr><td colspan="${n_cols}"><p class="Tabela_Texto_Centralizado" style="${c?"color:" + c + ";":""}">${m}</p></td></tr>`)
			};
			
			$tables.each((index, table) => {
				
				let table_type = $(table).attr("dynamic-table").toLowerCase();
				let table_id = $(table).attr("dynamic-table-id");
				let table_data = $(table).attr("dynamic-table-data");

				$(table).removeAttr("dynamic-table dynamic-table-id dynamic-table-data");

				try {
					table_data = solve(table_data.replace(/^\s*var:/, "$"), null, uservars);
				} catch (err) {
					table_data = undefined;
				}
				
				if (!table_data) {
					write_row_message(table, "Nenhum dado para preenchimento da tabela");
					return;
				}
				
				if (!Array.isArray(table_data)) {
					write_row_message(table, "Dados incompatíveis com a tabela");
					return;
				}
				
				if (!table_data.length) {
					write_row_message(table, "Tabela vazia");
					return;
				}
				
				let row_template_html = $(table).find("tbody tr:first").get(0);
				if (!row_template_html) {
					write_row_message(table, "Linha de preenchimento inexistente");
					return;
				}
				
				$(table).find("tbody tr").remove();
				
				row_template_html = row_template_html.outerHTML;
				let formater = {};
				switch (table_type) {
					case "lancto": formater = {seq: (r,v) => v.toString().padStart(3,'0'),
											   valor: (r,v) => v.toMoney(),
											   situacao: (r,v) => r.pendente ? `<span style="color: ${r.status == "V" ? "blue" : "red"};">${v}</span>` : v};
								   break;
				}
				
				for (let row of table_data) {
					let tr = row_template_html.replace(/{([\w_]+)}/ig, (m0, col) => {
						let fmt = formater[col];
						if (fmt) return fmt(row, row[col]);
						return row[col];
					});
					$(table).find("tbody").append(tr);
					
				}
			});
		}
		
		waitMessage();
		
		//colocar ponto final no último item da lista
		$(doc).find('ul li:last').each((i, li) => $(li).html($(li).html().replace(/([\w\W]*);(<[^>]*?>|\n|\s)*$/, "$1.$2")));
		
		//substituir variáveis restantes
		html = replace_uservars(doc.body.innerHTML);
		
		$(editor).val(html);
		
		return waitDocumentReady(`#cke_${editor.name} iframe`).then(doc => {
			$(doc.body).html(html);
			return doc;
		});
		
	}).then(doc => {
		
		
		//arrastar e soltar link de documento SEI
		$(doc.body).on("dragover", e => {
			e.preventDefault();
			let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
			if (link_id) return false;
		}).on("drop", e => {
			let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
			
			if (link_id) {
				let sei_number = e.originalEvent.dataTransfer.getData("sei/number");
		
				e.preventDefault();
				let sel = doc.getSelection();
				let range = sel.getRangeAt(sel.rangeCount-1);
				let $node = $(`<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false">SEI nº <a id="lnkSei${link_id}" class="ancoraSei" style="text-indent:0px;">${sei_number}</a></span>`);
				range.deleteContents();
				range.insertNode($node[0]);
				range.collapse();
				return false;
			}
		});
		
		//redimensionar documento
		$(`#cke_${editor.name} iframe`).parent().css("height", $(doc).height())		
		
		//habilitar botão de salvamento
		let script = document.createElement('script');
		script.id = "habSalvarScript";
		script.textContent = `var hs = setInterval(function() {
			for (inst in CKEDITOR.instances) if (CKEDITOR.instances[inst].status != "ready") return;
			clearInterval(hs);
			habilitaSalvar({name:'drop'});
			document.getElementById("habSalvarScript").remove();
		}, 400);`;
		(document.body||document.documentElement).appendChild(script); 
		
	});
	
} else {
	
		waitDocumentReady(`iframe`, 'body[contenteditable=true]').then(doc => {
			
			//arrastar e soltar link de documento SEI
			$(doc.body).on("dragover", e => {
				e.preventDefault();
				let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
				if (link_id) return false;
			}).on("drop", e => {
				let link_id = e.originalEvent.dataTransfer.getData("sei/link-id");
				
				if (link_id) {
					let sei_number = e.originalEvent.dataTransfer.getData("sei/number");
			
					e.preventDefault();
					let sel = doc.getSelection();
					let range = sel.getRangeAt(sel.rangeCount-1);
					let $node = $(`<span data-cke-linksei="1" style="text-indent:0px;" contenteditable="false">SEI nº <a id="lnkSei${link_id}" class="ancoraSei" style="text-indent:0px;">${sei_number}</a></span>`);
					range.deleteContents();
					range.insertNode($node[0]);
					range.collapse();
					return false;
				}
			});
			
		});	
	
}