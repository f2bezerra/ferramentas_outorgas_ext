async function consultarProcessoPGD(processo) {
	
	var anchor = $(window.top.document).find('a[href*="acao=md_utl_meus_processos_dsmp_listar"]').get(0);
	if (!anchor) return Promise.reject("URL da lista de processos não encontrada");
	
	var html = await postSEI(absoluteUrl($(anchor).attr('href')),{formId: "frmTpControleLista", data: {txtProcessoUtlMs: "", selFilaUtlMs: "", selTipoProcessoUtlMs: "", selStatusUtlMs: "", selAtividadeUtlMs: ""}});
	
	if (!html) return Promise.reject("Carregamento da tabela de processos falhou");

	var table = $(html).find('#tbCtrlProcesso').get(0);
	if (!table) return Promise.reject("Tabela de processos não carregada");
	
	const regex = /controlador\.php.*?(?=['"])/i;
	
	table = $(table).find('td.tdNomeProcesso').map((index, item) => {
		let $tr = $(item).closest('tr');
		let $anchor = $(item).find('a');
		let row = {processo: $(item).text().trim(), tipo: $anchor.attr('title')};
		
		if (m = regex.exec($anchor.attr('onclick'))) row.href = m.toString();
		
		row.atividade = $tr.find('.tdNomeAtividade').text();
		row.fila = $tr.find('.tdFilaProcesso').text();
		row.ue = Number($tr.find('.tdUniEsforco').text());
		row.status = $tr.find('.tdStatusProcesso').text();
		row.registroStatus = $tr.find('.tdDtRegistroStatus').text();
		row.prazo = $tr.find('.tdPrazo').text();
		
		return row;
	}).get();
	
	if (!table || !table.length) return null;
	
	if (processo) {
		if (processo === "current" || processo === "active" || processo === true) processo = getCurrentProcesso();
		if (processo) processo = processo.replace(/\D/g, "").substr(0, 15);
		if (processo.length != 15) return Promise.reject("Número de Processo inválido");
		return table.find(item => item.processo.replace(/\D/g, "").substr(0, 15) == processo);
	}
	
	return table;
}


