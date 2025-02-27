/***************************************************/
/* Alteração dos campos de edição do processo SEI  */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

var txtDesc = document.getElementById("txtDescricao");
var selDesc = null;

if (txtDesc) {
	selDesc = document.createElement("SELECT");
	fillDescSelection($("#selTipoProcedimento option:selected").text());
	selDesc.style.position = "absolute";
	selDesc.style.top = "40%";
	selDesc.style.width = "90%";
	$(selDesc).insertBefore(txtDesc);
	
	txtDesc.style.border = "none";
	txtDesc.style.left = "2px";
	txtDesc.style.top = "calc(40% + 2px)";
	txtDesc.style.width = "calc(90% - 25px)";
	
	$("#selTipoProcedimento").on("change", function (event) {
		fillDescSelection($("#selTipoProcedimento option:selected").text());
	});
	
	$(selDesc).on("change", function (event) {
		txtDesc.value = selDesc.value;
		selDesc.blur();
		txtDesc.focus();
		txtDesc.select();
	});
}

function fillDescSelection(tipo) {
	if (!selDesc) return;
	selDesc.options = [];
	selDesc.options[selDesc.options.length] = new Option('');
	
	var serv = "";
	switch (true) {
		case /Outorga: SLP/i.test(tipo): 
			serv = "019";
			selDesc.options[selDesc.options.length] = new Option('Pedido Inicial');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação com Alteração');
			selDesc.options[selDesc.options.length] = new Option('Alteração');
			selDesc.options[selDesc.options.length] = new Option('Autocadastramento');
			selDesc.options[selDesc.options.length] = new Option('Cancelamento');
			selDesc.options[selDesc.options.length] = new Option('Exclusão');
			selDesc.options[selDesc.options.length] = new Option('Segunda via');
			selDesc.options[selDesc.options.length] = new Option('Transferência de Outorga');
			break;
			
		case /Outorga: Radioamador/i.test(tipo): 
			serv = "302";
			selDesc.options[selDesc.options.length] = new Option('Pedido Inicial');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação com Alteração');
			selDesc.options[selDesc.options.length] = new Option('Alteração');
			selDesc.options[selDesc.options.length] = new Option('Autocadastramento');
			selDesc.options[selDesc.options.length] = new Option('Cancelamento');
			selDesc.options[selDesc.options.length] = new Option('Exclusão');
			selDesc.options[selDesc.options.length] = new Option('Segunda via');
			selDesc.options[selDesc.options.length] = new Option('Emissão de COER');
			selDesc.options[selDesc.options.length] = new Option('Mudança de Classe');
			break;
			
		case /Outorga: R.dio do Cidad.o/i.test(tipo): 
			serv = "400";
			selDesc.options[selDesc.options.length] = new Option('Pedido Inicial');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação com Alteração');
			selDesc.options[selDesc.options.length] = new Option('Alteração');
			selDesc.options[selDesc.options.length] = new Option('Autocadastramento');
			selDesc.options[selDesc.options.length] = new Option('Cancelamento');
			selDesc.options[selDesc.options.length] = new Option('Exclusão');
			selDesc.options[selDesc.options.length] = new Option('Segunda via');
			break;
			
		case /Outorga: Limitado M.vel Aeron.utico/i.test(tipo): serv = "507";
		case /Outorga: Limitado M.vel Mar.timo/i.test(tipo): serv = "604";
			selDesc.options[selDesc.options.length] = new Option('Pedido Inicial');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação com Alteração');
			selDesc.options[selDesc.options.length] = new Option('Prorrogação');
			selDesc.options[selDesc.options.length] = new Option('Alteração');
			selDesc.options[selDesc.options.length] = new Option('Autocadastramento');
			selDesc.options[selDesc.options.length] = new Option('Cancelamento');
			selDesc.options[selDesc.options.length] = new Option('Exclusão');
			selDesc.options[selDesc.options.length] = new Option('Segunda via');
			selDesc.options[selDesc.options.length] = new Option('Transferência de Outorga');
			selDesc.options[selDesc.options.length] = new Option('Mudança de Proprietário');
			break;
			
		case /Outorga: Servi.o.*\bSARC\b/i.test(tipo): 
			var add_opts = function (t) { for (i = 251; i < 256; i++) selDesc.options[selDesc.options.length] = new Option(t + ' - ' + i); }
			add_opts('Pedido Inicial');
			add_opts('Prorrogação');
			add_opts('Prorrogação com Alteração');
			add_opts('Alteração');
			add_opts('Autocadastramento');
			add_opts('Cancelamento');
			add_opts('Exclusão');
			add_opts('Segunda via');
			break;
			
		case /Outorga: Cassa..o de Autoriza..o/i.test(tipo):
			var arr_servs = ["019 (SLP)", "302 (RA)", "400 (PX)", "507 (SLMA)", "604 (SLMM)", "251 (SARC)", "252 (SARC)", "253 (SARC)", "254 (SARC)", "255 (SARC)"];
			var add_opts = function (t, s) { s = s || arr_servs; for (i = 0; i < s.length; i++) selDesc.options[selDesc.options.length] = new Option(t + ' - ' + s[i]); }
			add_opts('Motivo: Perda das Condições');
			add_opts('Motivo: Transferência única estação', ["507 (SLMA)", "604 (SLMM)"]);
			add_opts('Motivo: Vencimento');
			add_opts('Motivo: Falecimento');
			add_opts('Motivo: Baixa do CNPJ');
			break;
	}
}