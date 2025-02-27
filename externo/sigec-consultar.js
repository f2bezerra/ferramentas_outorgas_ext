//Desabilitar auto-print 
var ib = setInterval(function() {
	if (!document.body) return;
	clearInterval(ib);

	var script = document.createElement('script');
	script.textContent = `var safe_print = window.print; window.print = function() {window.print = safe_print};`;
	document.body.insertBefore(script, document.body.childNodes[0]);
}, 10);

//Tratamentos pós-carregamento
$(document).ready(function() {
	$('[name="divPopUp"]').hide();	
	$('[id="popFlatImpressãodeBoletos"]').closest('tr').remove();
	$('#Imprimir').hide();	
	
	var style = document.createElement('style');
	document.head.appendChild(style);

	style.sheet.insertRule('table#tblMenuPopUp {width: max-content!important;}', 0);
	style.sheet.insertRule('@media print {.drop-content {display: none;}}', 0); 
	
	var script = document.createElement('script');
	script.textContent = `var safe_print = window.print; window.print = function() {window.print = safe_print};`;
	document.body.insertBefore(script, document.body.childNodes[0]);
	
	
	var script = document.createElement('script');
	script.textContent = `
	var orig_consultarExtratoLancamentos = consultarExtratoLancamentos;
	var orig_consultarExtratoLancamentos_debitos = consultarExtratoLancamentos_debitos;
	
	consultarExtratoLancamentos = function (fistel) {orig_consultarExtratoLancamentos(fistel + '&hdnImprimir=true')};	
	consultarExtratoLancamentos_debitos = function (fistel) {orig_consultarExtratoLancamentos_debitos(fistel + '&hdnImprimir=true')};	
	`;
	document.body.insertBefore(script, document.body.childNodes[0]);
});

 
