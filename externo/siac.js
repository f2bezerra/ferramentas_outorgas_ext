//Tratamentos pós-carregamento
$(document).ready(function() {
	//se não tiver pré-dado definido para o SIAC encerra o script
	if (!sessionStorage.predata_siac) return;
	
	var predata_siac = JSON.parse(sessionStorage.predata_siac);

    //Se o pré-dado foi definido a mais de 20s encerra o script
	if ((predata_siac.timestamp - Date.now()) > 20000) {
		delete sessionStorage.predata_siac;
		return;	
	}
	
	var marca = document.querySelector('input[name=txtMarca]');
	if (marca) {
		delete sessionStorage.predata_siac;
		marca.value = predata_siac.indicativo;
		var form = document.querySelector('form[name=frmAeronave]');
		if (form) form.submit();
	}
	
});

 
