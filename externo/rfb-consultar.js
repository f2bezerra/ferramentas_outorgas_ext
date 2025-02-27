//Tratamentos pós-carregamento
$(document).ready(function() {
	waitDocumentReady(document).then(() => {
		var pagina = $("#conteudo").html();
		$("head").append("<link href='css/ComprovanteCPF01.css' rel='stylesheet' type='text/css' />");
		$("head").append("<link href='css/ComprovanteCPF_Impressao01.css' rel='stylesheet' type='text/css' />");
		
		var $pagina = $(pagina);
		$pagina.find('canvas + img').last().remove();
		// let $img = $pagina.find('canvas + img');
		// if ($img.length > 1) $img.last().remove();

		$("body").html($pagina);
	});
});

 
