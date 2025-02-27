var cache = {};

$('.infraCheckboxInput').on("change", function(e) {
	let value = $(this).val();
	let input = $(this).closest('tr').find(`input[id=numeroSEI_${value}]`).get(0);
	if (!input) return;
	
	if (!e.target.checked) {
		input.value = "";
		return;
	}
	
	let doc_tipo = $(input).closest('td').prev().text().trim();
	
	queryNodeSei({last: doc_tipo}, cache).then(data => {
		input.value = data.sei;
	});
});

$('#lnkInfraCheck').on('click', (e) => {
	$('.infraCheckboxInput').trigger('change');
});

$('#selEncaminhamentoAnl').val(1); //selecionar 'Associar em Fila após finalização do Fluxo'
$('#hdnEncaminhamentoAnl').val(1);

$('#divFila').css("display", ""); //exibir caixa de seleção de fila
$('#selFila').val(2); //selecionar fila 'TÉCNICA'
$('#hdnFila').val(2);
