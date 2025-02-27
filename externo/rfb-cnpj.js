//Tratamentos pós-carregamento
$(document).ready(function() {
	var script = document.createElement('script');
	script.textContent = `
		function imprimirComprovante() {
			var w = window.open('', '_blank', 'toolbar=0,location=0,menubar=0,scrollbars=1,resizable=1');
		
			var pagina = $("#principal").html();
		
			w.document.write("<link href='./css/print.css' rel='stylesheet' type='text/css' />");	
			
			w.document.write(pagina);
			w.document.close();	
			
			w.print();
		}
		
		function imprimirQSA() {
			var href = location.href.replace('Cnpjreva_Comprovante.asp','Cnpjreva_qsa.asp');
			var w = window.open(href, '_blank', 'toolbar=0,location=0,menubar=0,scrollbars=1,resizable=1');
			w.onload = function (e) {
				$(e.target).find('body').html($(e.target).find('#principal').html()).css('padding-top', 0);
				e.currentTarget.print();
			};
			
		}
	`;
	
	(document.body||document.documentElement).appendChild(script);	

	var  $new_print = $('#print').clone().attr('onclick', 'javascript:imprimirComprovante();');
	$('#print').after($new_print).remove();
	
	var $new_qsa = $('[name=qsa]').clone().attr('onclick', 'javascript:imprimirQSA();');
	$('[name=qsa]').after($new_qsa).remove();
	
	
});

 
