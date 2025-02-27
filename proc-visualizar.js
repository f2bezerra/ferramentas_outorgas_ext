/***************************************************/
/* Visualização da árvore do processo              */
/* Adiciona detalhes do processo na árvore         */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

//Observador de alterações na árvore
var observer;
 
//Atualização da árvore
if ((html = $('head').html()) && (m = html.match(/controlador\.php\?acao=procedimento_(alterar|consultar)&[^\"]+/))) {
	var url = absoluteUrl(m[0]);
	var is_editable = (m[1].toLowerCase() == "alterar");
	
	$.get(url, function(data) {
		
		let $html = $(data);
		let m_tipo; 
		var processo = {};
		if (!processo.numero) processo.numero = $(".infraArvore > a > span[id^='span']").text().replace(/\D/g, '').substr(0,15);
		let tipo_processo = $html.find("#selTipoProcedimento option[selected='selected']").text();
		processo.descricao = $html.find('#txtDescricao').val() || "(Não informado)";
		processo.descricao = processo.descricao.replace(/(?:\s*-\s*)?(?:\s*se?r?[viçco]*:)?\s*\b\d{1,3}\s*$/i, "");

		processo.servico = parseServicoByTipo(tipo_processo);
		if (!processo.servico) processo.servico = parseServicoByText($html.find("#txtDescricao").val());
		if (!processo.servico) processo.servico = {num: "000", desc: "desconhecido"};
		
		processo.tipo = null;
		if (tipo_processo.match(/cassação/i)) processo.tipo = "CS";
		else if (tipo_processo.match(/\bplano\b.*básico\b.*:/i)) processo.tipo = "PB";
		else if (tipo_processo.match(/\bradiodifusão\b.*?:/i)) processo.tipo = "RD";
		else if (tipo_processo.match(/\s*pessoal\s*:/i)) processo.tipo = "PS";
		else if (tipo_processo.match(/\s*autorização\b.*?radiofreq.*/i)) processo.tipo = "RF";
		else if (tipo_processo.match(/\s*interesse\b.*?coletivo\s*/i)) processo.tipo = "SIR";
		else if (processo.servico) processo.tipo = processo.servico.tipo;
		
		
		//let url_alterar_contato = (m = data.match(/controlador\.php\?acao=contato_alterar[^'"]*?/i)) ? m[0] : null;
		
		var $first = $html.find("#selInteressadosProcedimento option:first");
		processo.interessados = $html.find("#selInteressadosProcedimento option").map(function () { 
			if (!processo.representante && (m = $(this).text().match(/\((\d{3}.?\d{3}.?\d{3}.?\d{2}|[^@]+@[^@]+\.[^)]+)\)\s*$/))) processo.representante = m[1];
			
			return $(this).text().replace(/\(\d[\d.\/-]+\)\s*$/, function(m0){ 
				return "(<span class='actionable'>" + m0.replace(/\D/g,"") + "</span>)";
			}); 
		}).get();
		
		$('#panelDetails').remove();
		
		var divDt =	$("<div id='panelDetails' class='proc-panel div-editable'/>")
					.insertAfter("#frmArvore")
					.append(`<p class="nowrap"><label>Processo: </label><span class='actionable'>${processo.numero}</span></p>`)
					.append(`<p class="nowrap"><label>Tipo: </label><span>${getDescTipoProcesso(processo.tipo)}</span></p>`)
					.append(`<p class="nowrap"><label>Descrição: </label><span>${processo.descricao}</span></p>`);
					
		if (processo.tipo !== "Pessoal") divDt.append(`<p class="nowrap"><label>Serviço: </label>${Number(processo.servico.num)?'<span>' + processo.servico.num + " - " + processo.servico.desc + '</span>':'<span style="color:#f00;">000 - Desconhecido</span>'}</p>`);
		

					
		var obs = $html.find("#txaObservacoes").val();
		var fields = fieldsFromString(obs);
		if (fields) fields.forEach((field) => {divDt.append(`<p class='proc-field' field-name="${identityNormalize(field.name)}"><label>${field.name}: </label><span class='actionable'>${field.value}</span></p>`)});
					
		if (processo.interessados.length > 1) divDt.append(`<p><label>Interessados: </label></p><ul><li>${processo.interessados.join("</li><li>")}</li></ul>`);
		else divDt.append(`<p><label>Interessado: </label>${processo.interessados.toString()}</p>`);
		
		if (Number(processo.servico.num)) divDt.append(`<input type="hidden" id="hdnServico" value="${processo.servico.num}" text="${processo.servico.desc}">`);
		divDt.append(`<input type="hidden" id="hdnTipoProcesso" value="${processo.tipo}" text="${getDescTipoProcesso(processo.tipo)}">`);
		if ($first.length && (m = $first.text().match(/^\s*(.*?)\(([^)]*?)\)\s*$/i))) divDt.append(`<input type="hidden" id="hdnInteressadoPrincipal" value="${m[2]}" text="${m[1]}">`);
		
		applyActionPanel('.actionable');
		
		updateArvore();

		if (!is_editable) return;
		
		//updateArvore();

		var atualizarCamposDinamicos = async (fields, servico, cpfj) => {
			if (f = findField(fields, "usuario_sei", 0.65))  {
				f.name = "Usuário SEI";
				
				if (f.value == "?") {
					waitMessage("Identificando usuário externo...");
					f.value = "(Não Identificado)";
					
					
					let url_recibo = await getUrlDocumento("Recibo Eletrônico de Protocolo", true).catch(() => null);
					if (url_recibo) { //Consultar recibo;
						let recibo = await getAjaxContent(absoluteUrl(url_recibo));
						if (recibo) {
							recibo = $("<div />").html(recibo).html();
							if (recibo && (mu = recibo.match(/<td\b[^>]*?>\s*Usu[áa]rio\s+Externo[\w\W]*?<td\b[^>]*?>([^<]*?)<\/td>/i))) f.value = mu[1].trim();
						}
					} else { //Consultar contato externo
						
						let contato = await consultarUsuarioExterno(processo.representante).catch(() => null);
						if (contato) f.value = (contato.status == "ok") ? contato.nome : "(Pendente)";
					}
				} 
			} 

			if (f = findField(fields, "fistel", 0.65))  {
				f.name = "Fistel";
				servico = servico || Number($('#hdnServico').val());
				cpfj = cpfj || findFieldValue(fields, "cpf", 0.8) || findFieldValue(fields, "cnpj", 0.8) || $('#hdnInteressadoPrincipal').val();
							
				if (f.value == "?" && servico && cpfj) {
					waitMessage("Consultando número de fistel...");
					let entry = await consultarFistel(cpfj, {servico: servico});
					if (Array.isArray(entry)) entry = entry.find(e => e.situacao == "Ativa");
					f.value = entry ? entry.fistel : "(Não Identificado)";
				} 
			} 
		};

		
		var save_fields = function (fields) {
			
			atualizarCamposDinamicos(fields).finally(() => {
				waitMessage("Atualizando campos...");
				return updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
					$(doc).find("#txaObservacoes").val(fieldsToString(fields, true));
				}).then(() => {
					refresh_all_panels(fields);
					updateArvore();
					notify("success", "Campos atualizados");
				}).catch(e => notify("fail", "Edição de campos falhou\n" + e.message));
				
			});
			
		};
		
		
		var refresh_all_panels = (fields, servico, descricao) => {
			let proc = getCurrentProcesso();
			let append_fields_only = (servico === true && fields);
			
			if (append_fields_only) {
				if (!Array.isArray(fields)) fields = [fields];
				servico = undefined;
				descricao = undefined;
			}
			
			var script = `
				if ((panel = $('#panelDetails').get(0)) && getCurrentProcesso() == "${proc}") {
					
					let last_p = $(panel).find('p:contains("Interessado:"):last').get(0) || $(panel).find('p:contains("Interessados:"):last').get(0) || $(panel).find('p:last').get(0);
					let p;
			`;
			
			if (!append_fields_only) script += "$(panel).find('.proc-field').remove();\n";
			
			if (servico != undefined) {
				script += `
				if (serv = $(panel).find('p:contains("Serviço:") span').get(0)) $(serv).text("${servico}" + " - " + getDescServico(${servico}));
				if (span = $('#header').find('span[id^=span]').get(0)) $(span).attr("title", getDescTipologia(${servico}));
				
				$('#hdnServico').val(${servico}).attr("text", getDescServico(${servico}));

				` + "\n";
			} 
			
			if (descricao != undefined) {
				script += `
				if (desc = $(panel).find('p:contains("Descrição:") span').get(0)) $(desc).text("${descricao}"); 
				`;
			}
			
			if (fields) {
				fields.forEach(f => {
					script += `
					p = $('<p class="proc-field" field-name="${identityNormalize(f.name)}"><label>${f.name}: </label><span class="actionable">${f.value}</span></p>');
					$(last_p).before(p);
					`;
					
					if (append_fields_only) script += `applyActionPanel($(p).find('.actionable'));`;
					
				});
				
				if (!append_fields_only) script += `
				applyActionPanel('.proc-field span');
				$(panel).get(0).removeCommand("icon-refresh");
				`;
			}
			
			script += "}";
			
			browser.runtime.sendMessage({action: "runScript", allTabs: true, allFrames: true, script: script});
		};
		
		
		var save_details = (fields, servico, descricao) => {

			atualizarCamposDinamicos(fields, servico).finally(() => {
				
				waitMessage("Salvando detalhes do processo ...");

				return updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
					servico = servico && Number(servico);
					let curr_servico = Number($('#hdnServico').val() || 0);
					let curr_tipo = $('#hdnTipoProcesso').val();
					let new_desc = descricao;
					//--- selecionar tipologia de acordo com o novo serviço
					if (servico != curr_servico) {
						
						if (curr_tipo == "LC" || curr_tipo == "OT") {
							let tipo_regex = getTipoRegexByServico(servico);
							if (opt = $(doc).find("#selTipoProcedimento option").get().find(item => tipo_regex.test($(item).text()))) {
								$(doc).find('#selTipoProcedimento').val($(opt).val());
								$(doc).find('#hdnIdTipoProcedimento').val($(opt).val());
								$(doc).find('#hdnNomeTipoProcedimento').val($(opt).text());
								if (Number(servico) >= 251 && Number(servico) <= 255) new_desc += " - Serviço: " + servico;
							}
						} else {
							if (servico) new_desc += " - Serviço: " + servico;
						}
						
						$('#hdnServico').val(servico).attr("text", getDescServico(servico));
					}
					$(doc).find("#txtDescricao").val(new_desc);
					$(doc).find("#txaObservacoes").val(fieldsToString(fields, true));
				}).then(() => {
					if (desc = $(divDt).find('p:contains("Descrição:") span').get(0)) $(desc).text(descricao); 
					if (serv = $(divDt).find('p:contains("Serviço:") span').get(0)) $(serv).text(servico + " - " + getDescServico(servico)); 
					if (span = $('#header').find('span[id^=span]').get(0)) $(span).attr("title", getDescTipologia(servico));
					
					refresh_all_panels(fields, servico, descricao);

					updateArvore();
					notify("success", "Processo atualizado");
				}).catch(e => notify("fail", "Edição de campos falhou\n" + e.message));
				
			});
			
		};		
		
		const CFOR_FIELDS = "Fistel,Entidade,CPF,CNPJ,Fistel Principal,Usuário SEI,Indicativo,Embarcação,COER,Proprietário Anterior,Outorga";
		
		$(divDt).dropable((data, event) => {
			let default_name = "";
			data = data.replace(/^\s*|\s*$/g, "");
			if ((nr = data.replace(/[./-]/g, "")) && nr.match(/^\d+$/)) {
				if (nr.length == 11) {
					data = nr;
					if (nr.match(/^(?:030|504|801)/)) default_name = "Fistel";
					else default_name = "CPF";
				} if (nr.length == 14) {
					data = nr;
					default_name = "CNPJ";
				} if (nr.length >= 4 && nr.length <= 8) {
					default_name = "Entidade";
				}
				
			} else if (data.match(/^\s*P[A-Z][A-Z0-9]{3,6}\s*$/)) {
				data = data.trim();
				default_name = "Indicativo";
			}
			
			let temp_field = event.ctrlKey;
			
			openFormDlg([{id: "name", type: "text", label: "Nome", value: default_name, items: CFOR_FIELDS.split(","), required: true},
						 {id: "value", type: "text", label: "Valor", value: data, required: false}], "Incluir campo" + (temp_field?" temporário":"") + " [Salvar]", v => {
							if ($(`.proc-field[field-name="${identityNormalize(v.data.name)}"]`).length) {
								v.target = "name";
								v.message = "Nome de campo existente";
								return false;
							}
						 }).then(data => {
							
							if (temp_field) {
								let $f = $(`<p class="proc-field" field-name="${identityNormalize(data.name)}"><span class="temp-field" title="Campo temporário">&nbsp;</span><label>${data.name}: </label><span class='actionable'>${data.value}</span></p>`);
								$(divDt).find('p:last').before($f);
								applyActionPanel($f.find('.actionable'));
								
								$f.find('.temp-field').click(e => {
									$(e.currentTarget).closest('.proc-field').remove();
									if (!$(divDt).find('.temp-field').length) $(divDt).get(0).removeCommand("icon-refresh");
								});
								
								$(divDt).get(0).addCommand("icon-refresh", "Clique para salvar campos temporários", e => {
									let fields = [];
									$(divDt).find('.proc-field').each(function(){fields.push(parseField($(this).text()))});
									save_fields(fields);
								});
								
								return;
							}
							
							waitMessage(`Incluindo campo **${data.name}**...`);
							updateFormSEI(url, "frmProcedimentoCadastro", "btnSalvar", function(doc) {
								let values = $(doc).find("#txaObservacoes").val();
								if (values) values += "\n";
								values += `${data.name}:${data.value};`;
								$(doc).find("#txaObservacoes").val(values);
							}).then(() => {
								refresh_all_panels(data, true);
 								notify("success", "Campo atualizado");
							}).catch(e => notify("fail", "Inclusão de campo falhou\n" + e.message));
						 });
		});
		
		$(divDt).editable({	hint: "Clique aqui para editar detalhes do processo",
							callback: function() {
								let div = this, fields = [];
								$(div).find('.proc-field').each(function(){fields.push(parseField($(this).text()))});
								
								let intellisense_options = 	{onlyTokens: false,
								
															 classItem: "cfor-li-intellisense",
								
															 list:	CFOR_FIELDS, 
																	
															 allow: function(e) {
																		if (!e.start) return true;
																		if (last_line = e.target.value.substr(0, e.start).match(/.*$/)) {
																			return !last_line[0].includes(":");
																		} 
																		return true;
																	},
															 
															 onSelect:	function(e) {
																			return `${e.value}: `;
																		}
															};											
								
								
								let curr_serv = $('#hdnServico').val();
								let curr_desc = (desc = $(divDt).find('p:contains("Descrição:") span').get(0)) && $(desc).text().replace(/\(N[aã]o informado\)/i, "");
								
								openFormDlg([{id: "servico", type: "select", label: "Serviço", items: "001,002,019,251,252,253,254,255,302,400,507,604", value: curr_serv},
											 {id: "descricao", type: "text", label: "Descrição", value: curr_desc, items: "Pedido Inicial,Nova Autorização de RF,Renúncia,Exclusão,Alteração,Autocadastramento,Mudança de Proprietário,Inclusão de Estação"},
											 {id: "fields", type: "textarea", rows: 7, cols: 50, label: "Campos do processo", value: fieldsToString(fields), intellisense: intellisense_options, autofocus: true}], 
											 "Detalhes do processo [Salvar]").then(data => save_details(fieldsFromString(data.fields), data.servico, data.descricao));
							}
		});
		
	}).fail(function(jqXHR, textStatus, errorThrown) {
		console.log("Status: ", textStatus, "Error: ", errorThrown);
	});

	
	$(window).ready(function() {
		waitDocumentReady(document).then(arvore => {
			$(arvore).find('[src*=restrito]').filter('[title*="Pendente"]').attr("src", browser.runtime.getURL(`assets/acesso_restrito_pendente.svg`));

			$(arvore).find('[src*=restrito]').closest('a').on("click", function(e) {
				e.preventDefault();
				var id = this.id.replace(/\D/g,"");
				var $anchor_doc = $(arvore).find("#anchor" + id);
				var is_pdf = /[^a-z]pdf\b/i.test($(`#anchorImg${id} img`).attr("src"));
				var desc = $anchor_doc.text().replace(/\s*\(\d+\)\s*$/,"");
				if (desc && (mdesc = desc.match(/\s*[^\s]+\s*(.*)\s*$/i))) desc = mdesc[1];
				else desc = "";
	
				let num_serv = Number($('#hdnServico').val()), desc_items = undefined;
				if (!num_serv) {
					num_serv = parseServicoByTipo($(".infraArvore > a > span[id^='span']").attr('title'));
					if (num_serv) num_serv = num_serv.num;
				}
				
				if (num_serv) desc_items = ["do " + getDescServico(num_serv)];
					
				var current_anchor = this;
				var doc_id = current_anchor.id.match(/\d+$/);
				if (url_alterar_recebido = (new RegExp(`controlador\\.php\\?acao=documento_alterar(?:_recebido)?&[^"]+id_documento=${doc_id}[^"]+`, "i")).exec(html)) {
					let fields = [{id: "acesso", type: "radio", label: "Informe nível de acesso", items: ["Público", "Restrito (Pessoal)"], vertical: true, value: 1}];
					
					if (is_pdf) fields.push({id: "desc", type: "text", label: "Descrição do documento", width: 300, autofocus: true, items: desc_items, value: desc});
					
					// fields.push({id: "fund_restrito", type: "check", label: "Opções", text: "Registrar fundamento LGPD", value: localStorage.fund_restrito != undefined?localStorage.fund_restrito:true});
	
					openFormDlg(fields, "Alteração [Confirmar]").then(data => {
							// localStorage.fund_restrito = data.fund_restrito;	
							alterarDocumento(url_alterar_recebido, current_anchor, data.desc, data.acesso).then(()=>{
								notify("success", "Documento atualizado com sucesso");
							}).catch(() => notify("fail", "Documento NÃO foi atualizado"));
					});
				}
			});
			
			//Alterar texto de arrasto
			$(arvore).find('a[id^="anchorImg"]').on('dragstart', setDragText);
		});
	});
}

//Atualização das anotações da árvore
if ((html = $('head').html()) && (url_anota = html.match(/controlador\.php\?acao=anotacao_registrar&[^\"]+/))) {
	url_anota = absoluteUrl(url_anota);
	
	$.get(url_anota, function(data) {
		let $html = $(data);
		let $panel = $('#panelNotes');
		
		if (!$panel.length) {
			$panel = $('<div id="panelNotes" class="proc-panel proc-panel-notes"><p><label>Anotações:</label><br><span /></p></div>');
			$("#frmArvore").parent().append($panel);
		}
		
		if (content = parseNoteTags($html.find('#txaDescricao').val())) $panel.css('display', 'block').find('span').html(content.replace(/\n/g, "<br>"));
		else $panel.css('display', 'none');
		
		if ($html.find('#chkSinPrioridade').is(':checked')) $panel.addClass("proc-panel-notes-hp");
		
	});
}


//Setar texto de arrasto
function setDragText(e) {
	let id = e.target.id.replace(/\D/g,"");
	let anchor_text = $(`#anchor${id}`).text();
	let sei_text = (m = anchor_text.match(/^\s*(\d{5}\.\d{6}\/\d{4}\-\d{2})|(\d{3,8})\)?\s*$/)) ? m[1] ? "Processo nº " + m[1] : "SEI nº " + m[2] : null;
	let sei_number = sei_text.replace(/[^\d\/\.-]/g,"");

	if (!sei_text) {
		e.preventDefault();
		return;
	};
	
	if (e.originalEvent.ctrlKey) sei_text = sei_number;
	
	e.originalEvent.dataTransfer.clearData();
	e.originalEvent.dataTransfer.setData("text", sei_text);
	e.originalEvent.dataTransfer.setData("sei/link-id", id);
	e.originalEvent.dataTransfer.setData("sei/number", sei_number);
}

//Atualizar árvore
function updateArvore() {
	
	$('body').ready(function() {
		
		if (observer) {
			observer.disconnect();
			observer = null;
		}
		
			
		//--- atualizar pastas fechadas
		var pastas_fechadas = $('#frmArvore [id^=divPASTA]').filter(function() {return $(this).find('a[target=ifrVisualizacao]').length == 0}).get();
		
		if (pastas_fechadas.length) {
			//--- cria uma nova instância de observador
			observer = new MutationObserver(function(mutations) {
				
				mutations.forEach(function(mut) {
					if (mut.addedNodes.length && (node = mut.addedNodes[0])) {
						if ($(node).is('a[id^="anchorImg"]')) $(node).on('dragstart', setDragText);
					}
				});
				
			});
			
			//--- configuração do observador
			var config = {childList: true };
			 
			//--- passar o nó alvo, bem como as opções de observação
			pastas_fechadas.forEach(pasta => {
				observer.observe(pasta, config);
			});
		}
			
	});
}