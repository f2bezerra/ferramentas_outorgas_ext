/***************************************************/
/* Lista de atribuição SEI                         */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

function criarColunaDataEntrada(tb) {
	$(tb + " tbody tr:first-child").append('<th name="DataEntrada" class="tituloProcessos">Entrada&nbsp;&nbsp;</th>');
	
	img = document.createElement("img");
	img.src = browser.runtime.getURL("assets/sorted.png");
	img.title = "Ordenado por data de entrada";
	$(tb + " tbody tr:first-child th[name='DataEntrada']").append(img);
	
	$(tb + " tbody tr:gt(0)").each((index, item) => {
		var m = /controlador\.php\?acao=anotacao_registrar.+infraTooltipMostrar\('[\r\n\s\w\W]*D?D[IE]:(\d{2}\/\d{2}\/\d{4});/i.exec($(item).html());
		if (m) $(item).append('<td align="center">' + m[1] + '</td>');
		else $(item).append('<td align="center"></td>');
	});
	var rows = $(tb + " tbody tr:gt(0)").get();
	var index = $(tb + " tbody tr:first-child th[name='DataEntrada']").index();

	var toDate = function (s) {
		if (m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)) return new Date(`${m[2]}/${m[1]}/${m[3]}`);
		return 0
	};
	
	rows.sort((a,b) => {
		var A = toDate($(a).children().eq(index).text());
		var B = toDate($(b).children().eq(index).text());
		return A - B;
	});
	
	$.each(rows, (i, r) => {
		$(tb + " tbody").append(r);
	});
}
	
criarColunaDataEntrada("#tblProcessosDetalhado");
