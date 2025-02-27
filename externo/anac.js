//Tratamentos pós-carregamento
$(document).ready(function() {
	//se não tiver pré-dado definido para o SIAC encerra o script
	if (!sessionStorage.predata_siac) return;
	
	var predata_siac = JSON.parse(sessionStorage.predata_siac);

    //Se o pré-dado foi definido a mais de 20s encerra o script
	if ((predata_siac.timestamp - Date.now()) > 20000) {
		//delete sessionStorage.predata_siac;
		return;	
	}
	
	window.location.replace("https://sistemas.anac.gov.br/SACI/SIAC/Aeronave/Estacao/Consulta.asp");
});

 
