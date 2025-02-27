$btnAjustar = $('<button tabindex="451" type="button" accesskey="A" class="infraButton" style="left: 0;position: absolute;margin-left: 20px;"><span class="infraTeclaAtalho">A</span>justar campos</button>');

$('#divInfraBarraComandosSuperior').prepend($btnAjustar);

$btnAjustar.click(function(e) {
	$('#txtNome').val(capitalizeString($('#txtNome').val()));
	$('#txtEndereco').val(adjustEndereco($('#txtEndereco').val()));
	$('#txtComplemento').val(capitalizeString($('#txtComplemento').val()));
	$('#txtBairro').val(capitalizeString($('#txtBairro').val()));
});

function capitalizeString(text) {
	if (!text) return text;
	
	text = text.replace(/([,;!.?:'"])/g, " $1 ").replace(/\s{2,}/g, " ");
	const regex = /^(?:[aào]s?|[eé]|an?t[eé]|ap[oó]s|com|contra|d\ws?|em|n\ws?|num|entre|pa?ra|p\wr|pel\ws?|perante|sem|sob|sobre|tr[áa]s|n?[aà]qu\wl[aeo]s?)$/;
	var arr = text.split(" ").map(item => {
		item = item.toLowerCase();
		return regex.test(item)?item:item[0].toUpperCase() + (item.length >1 ? item.slice(1) : "");
	});
	
	return arr.join(" ").replace(/ ([,;!\.\?:'"])/g,"$1");
}

function adjustEndereco(endereco) {
	endereco = endereco.toLowerCase();
	
 	endereco = endereco.replace(/_/g," ");
	endereco = endereco.replace(/\bn(?:[\xf8º°\u00f8]|r|[uú]mero|[úu]m)\.?/gi,", ");
	endereco = endereco.replace(/\bs\/?n\b/gi,", s/n");
	endereco = endereco.replace(/\bap(?:to?)?\.?\b/gi," apto ");
	endereco = endereco.replace(/\bc(?:on)?j\.?\b/gi," conjunto ");
	endereco = endereco.replace(/\bbl\.?\b/gi," bloco ");
	endereco = endereco.replace(/\bqd\.?\b/gi," quadra ");
	endereco = endereco.replace(/\bdr\.?\b/gi," doutor ");
	endereco = endereco.replace(/\bsl\.?\b/gi," sala ");
	endereco = endereco.replace(/\bed\.?\b/gi," edifício ");
	endereco = endereco.replace(/\beng\.?\b/gi," engenheiro ");
	endereco = endereco.replace(/\bc(?:nso|on)\.?\b/gi," conselheiro ");
	endereco = endereco.replace(/\bmal\.?\b/gi," marechal ");
	endereco = endereco.replace(/\b(?:cxp?|caixa\s+p)\.?\b/gi," caixa postal ");
	endereco = endereco.replace(/\bsta\.?\b/gi," santa ");
	endereco = endereco.replace(/\bsto\.?\b/gi," santo ");
	endereco = endereco.replace(/\bs\.?\b/gi," são ");
	endereco = endereco.replace(/\bmun\.?\b/gi," município ");
	endereco = endereco.replace(/\bcel\.?\b/gi," coronel ");
	endereco = endereco.replace(/\bgal\.\b/gi," general ");

	endereco = endereco.replace(/km([\d.,]+)/gi,"km $1");

	endereco = endereco.replace(/^r[.;:]?\s+(.*)/gi,"rua $1");
	endereco = endereco.replace(/^av[^\s]*?[.;:]?\s+(.*)/gi,"avenida $1");
	endereco = endereco.replace(/^al[^\s]*?[.;:]?\s+(.*)/gi,"alameda $1");
	endereco = endereco.replace(/^tr[^\s]*?[.;:]?\s+(.*)/gi,"travessa $1");
	endereco = endereco.replace(/^es[^\s]*?[.;:]?\s+(.*)/gi,"estrada $1");
	endereco = endereco.replace(/^ro?d[^\s]*?[.;:]?\s+(.*)/gi,"rodovia $1");

	endereco = endereco.replace(/([a-egmpr-t][acegijl-pr-t])(\d{1,3})/gi, "rodovia $1-$2");
	
	endereco = endereco.replace(/\s{2,}/g, " ");
	endereco = endereco.replace(/([,;!.?:])\s*\1/g, "$1");
	
	endereco = capitalizeString(endereco);
	endereco = endereco.replace(/([,;!.?:])(?=[^\s])/g, "$1 "); 
	
	return endereco;
}

