/***************************************************/
/* Controle dos processos SEI                      */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

$('#lnkInfraMenuSistema').attr('href', 'javascript:void();');

function updateTable(tb) {
	//console.time(tb);
	let create_col = ($(tb + ' th[name="headerUMI"]').length == 0);
	
	if (create_col) { 
		let fth = document.querySelector(tb + ' th');
		let $header = $(`<th name="headerUMI" class="${fth ? fth.className : 'tituloControle'}" title="Última Movimentação do Interessado">UMI</th>`);
		// $header.find('img').attr('src', browser.runtime.getURL("assets/sorted.png"));
		$(tb + " tbody tr:first-child").append($header);
	}
	
	
	let regex = /(DDE|UMI|STATUS):((\d{2})\/(\d{2})\/(\d{4})|[^;]+);|(PAGOU?|PPDESS\s+Venc(?:ido|eu))|(\w{3}:.*?;)/ig;
	
	let $rows = $(tb + " tbody tr:gt(0)").each((index, row) => {
		let $col_umi;
		
		if (create_col) {
			$col_umi = $('<td align="center"></td>');
			$(row).append($col_umi);
		} else {
			$col_umi = $(row).find('td:last-child');
		}

		let $anchor = $(row).find('a[href*="acao=anotacao_registrar"]');
		let note = $anchor.attr("onmouseover");
		row.umi = 0;
		row.status = "";
		
		regex.lastIndex = 0;
		while (note && (m = regex.exec(note))) {
			if (m.index === regex.lastIndex) regex.lastIndex++;
			if (m[1]) {
				switch (m[1].toLowerCase()) {
					case "dde":
					case "umi": 
						row.umi = m[2].toDate();
						$col_umi.text(m[2]);
						break;
					case "status":
						row.status = m[2].toLowerCase();
				}
				row.has_tags = true;
			} else if (m[6]) {
				row.status = m[6].toLowerCase();
			} else row.has_tags = true;
		}
		
		if (row.umi || row.has_tags) {
			//note = note.replace(/UMI:(.*?);/i, '<span class="umi-tag">$1</span>');
			note = parseNoteTags(note);
			
			$anchor.attr("onmouseover", note);
		} 

		if (row.status.substr(0,4) == "pago") {
			row.status = 1;
			$anchor.find('img').attr("src", browser.runtime.getURL("assets/money.png"));
		} else if (row.status.replace(/\s{2,}/g, " ").substr(0,11) == "ppdess venc") {
			row.status = 2;
			$anchor.find('img').attr("src", browser.runtime.getURL("assets/money_error.png"));
		}
		
	}).detach().sort((a, b) => {return a.umi - b.umi});
	
	$(tb + " tbody").append($rows);
	
	//console.timeEnd(tb);
}

function updateFiltros() {
	let div_situacao = document.getElementById("divSituacao");
	
	if (!div_situacao) {
		let div_filtros = document.getElementById("divFiltro");
		if (!div_filtros) return;

		let div_styles = window.getComputedStyle(div_filtros.querySelector('div'));
		let position = div_styles.getPropertyValue('position');
		
		div_situacao = $(`	<div id="divSituacao" class="divLink" style="left: 85%;top: 20%;${position?'position:' + position + ';':''}">
								<label>Situação: </label>
								<select id="selSituacao">
									<option value="0">Todas</option>
									<option value="1">Triado</option>
									<option value="2">Não Triado</option>
									<option value="3">Quitado</option>
									<option value="4">Não Quitado</option>
								</select>
							</div>`).get(0);
							
		div_filtros.appendChild(div_situacao);


		
	} else $(div_situacao).off("change");
	
	let filter = function (f, force) {
		f = Number(f);
		
		if (!force) {
			let current_value = sessionStorage.filter_situacao != undefined ? Number(sessionStorage.filter_situacao) : 0;
			if (f == current_value) return;
		}
		
		$("#tblProcessosRecebidos>tbody>tr:gt(0), #tblProcessosGerados>tbody>tr:gt(0), #tblProcessosDetalhado>tbody>tr:gt(0)").filter((index, row) => {
			$(row).toggle(!f || (f == 1 && row.umi != 0) || (f == 2 && row.umi == 0) || (f == 3 && row.status === 1) || (f == 4 && row.status === 2));
		});
		
		if (f) {
			$("#tblProcessosRecebidos .infraCaption").attr("data-before", $("#tblProcessosRecebidos>tbody>tr:gt(0):visible").length + " de ");
			$("#tblProcessosGerados .infraCaption").attr("data-before", $("#tblProcessosGerados>tbody>tr:gt(0):visible").length + " de ");
			$("#tblProcessosDetalhado .infraCaption").attr("data-before", $("#tblProcessosDetalhado>tbody>tr:gt(0):visible").length + " de ");
		} else {
			$("#tblProcessosRecebidos .infraCaption").removeAttr("data-before");
			$("#tblProcessosGerados .infraCaption").removeAttr("data-before");
			$("#tblProcessosDetalhado .infraCaption").removeAttr("data-before");
		}
		
		sessionStorage.filter_situacao = f;
	};
	
	let current_value = sessionStorage.filter_situacao != undefined ? Number(sessionStorage.filter_situacao) : 0;
	$("#selSituacao").val(current_value);
	filter(current_value, true);
	
	$(div_situacao).on("change", e => {filter($("#selSituacao").val())});
}


//Comando UMI
addCommand("btnUMI", "date-in.png", "Determinar data da última manifestação do interessado", null /* [{id: "limpar", text: "Limpar UMI", icon: "menu-trash-icon"}] */, e => {
	var arr = $("#tblProcessosRecebidos :checked, #tblProcessosGerados :checked, #tblProcessosDetalhado :checked").get();//.has('a.processoVisualizado').get();
	if (!arr.length) {
		errorMessage("Nenhum processo selecionado", "Determinação UMI");
		return;
	}
	
	var counter = 0, total = arr.length * 5;
	
	var update = function (inc) {
		if (inc) counter+=inc;
		waitMessage(`Análise de andamentos ${((counter/total)*100).toFixed(0)}% concluída...\n%%${((counter/total)*100).toFixed(0)}%%`);
	};  
	
	update();
	
	var promises = arr.map(item => { 
		//var $a = $(item).closest('tr').find('a.processoVisualizado').first();
		var $a = $(item).closest('tr').find('a[href*="acao=procedimento_trabalhar"]').first();
		
		return Promise.resolve($.get(absoluteUrl($a.attr('href')))).then((data) => {
									update(1);
									var url_arvore = /controlador\.php\?acao=procedimento_visualizar[^'"]+/i.exec(data);
									
									return Promise.resolve($.get(absoluteUrl(url_arvore))).then((data) => {
										update(1);
										var url_consulta = /controlador\.php\?acao=procedimento_consultar[^'"]+/i.exec(data);
										var url_visualizar = /controlador\.php\?acao=procedimento_visualizar[^'"]+/i.exec(data);	
										
										return Promise.resolve($.get(absoluteUrl(url_consulta))).then((data) => {
											update(1);
											var parser = new DOMParser();
											var doc = parser.parseFromString(data, 'text/html');
											var table = doc.getElementById('tblHistorico');
											
											if (!table) throw "Tabela de registro de andamentos não encontrada";
											
											var trs = $(table).find('tbody tr:has(td)').toArray();
											if (!trs.length) throw "Sem registros de andamento";
											
											var tr = trs.find((item) => {return /Processo Remetido|Reabertura do processo|Processo p.blico gerado/i.test($(item).find("td:nth-child(4)").text())});
											if (!tr) throw "Nenhum registro na tabela de andamento compatível";
											
											var entrada = /(\d{2}\/\d{2}\/\d{4})/.exec($(tr).find("td:nth-child(1)").text())[1];

											return Promise.resolve($.get(absoluteUrl(url_visualizar))).then((data) => {
												update(1);
												var url_anotar = /controlador\.php\?acao=anotacao_registrar[^'"]+/i.exec(data);	
												
												return new Promise((resolve, reject) => {
													var f = document.createElement("IFRAME");
													var submited = undefined;
													
													f.style.position = 'fixed';
													f.style.top = 0;
													f.style.left = 0;
													f.style.width = '1px';
													f.style.height = '1px';															
													f.style.opacity = 0;
													
													f.onload = function (event) {
														if (submited === true) {
															document.body.removeChild(f);
															update(1);
															resolve("OK");
														}
														
														doc = this.contentDocument || this.contentWindow.document;
														var desc = $(doc).find('#txaDescricao').val();
														
														desc = desc.replace(/\n?(?:D?D[IE]|UMI):\d{2}\/\d{2}\/\d{4};/, '');
														
														if (desc.length < 230) desc += "\nUMI:" + entrada + ";";
														$(doc).find('#txaDescricao').val(desc).html(desc);
														
														var frm = doc.getElementById('frmAnotacaoCadastro');
														frm.acceptCharset = "ISO-8859-1"; 
														
														frm.addEventListener("submit", (event) => {
															submited = true;
														});
														
														frm.addEventListener("error", (event) => {
															document.body.removeChild(f);
															update(1);
															reject(Error("Falha de submissão"));
														});
														
														$(doc).find("button").trigger("click");
													};
													
													f.onerror = function (event) {
														document.body.removeChild(f);
														update(1);
														reject(Error("Falha de carga"));
													};
													
													f.src = absoluteUrl(url_anotar);
													document.body.appendChild(f);
												});
											}).catch(()=>{update(2)});
										}).catch(()=>{update(3)});
									}).catch(()=>{update(4)});			
		}).catch(()=>{update(5)});
	});
	
	Promise.all(promises).then(function() {
		window.location.reload();
		chrome.runtime.sendMessage({action: "notify-success", title: 'Verificação', content: 'Atualização concluída com sucesso'});
	}).catch(() => {
		window.location.reload();
		chrome.runtime.sendMessage({action: "notify-fail", title: 'Verificação', content: 'Atualização concluída com algumas falhas'});
	});
});


updateTable("#tblProcessosRecebidos");
updateTable("#tblProcessosGerados");
updateTable("#tblProcessosDetalhado");
updateFiltros();

