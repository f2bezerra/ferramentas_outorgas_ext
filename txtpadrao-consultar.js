/***************************************************/
/* Editor de Texto Padrão do SEI (CONSULTA)        */
/*                                                 */
/* Por Fábio Fernandes Bezerra                     */
/***************************************************/

$(function() {


	if (!document.getElementById("ancAjudaCfor")) {
		var $last_col = $('#frmTextoPadraoInternoCadastro table tbody tr td:last-child');
		var a = $('<a id="ancAjudaCfor" title="Ajuda da extensão CFOR" tabindex="504"> <img class="infraImg"></a>');
		$last_col.append('<br>').append(a);
		$("#ancAjudaCfor img").attr("src", browser.runtime.getURL("assets/logo-48.png"));
		$("#ancAjudaCfor").on("click", function (e) {
			chrome.runtime.sendMessage({action: "popup", url: browser.runtime.getURL("doc/txtpadrao-ajuda.html"), options: {width: 1000, height: 600}});
		});  
	}

	//Eventos do documento
	waitDocumentReady("#cke_2_contents iframe").then(function(doc) {
		var linkElement = doc.createElement('link');
		linkElement.setAttribute('data-cke-temp', '1');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('href', browser.runtime.getURL("lib/general.css"));
		doc.getElementsByTagName('head')[0].appendChild(linkElement);			

		linkElement = doc.createElement('link');
		linkElement.setAttribute('data-cke-temp', '1');
		linkElement.setAttribute('rel', 'stylesheet');
		linkElement.setAttribute('href', browser.runtime.getURL("lib/sei.css"));
		doc.getElementsByTagName('head')[0].appendChild(linkElement);			
		
		var	tr_tooltip_options = {clip: "2 12", attr: "condition", html: '<span class="tooltip-condition">Condição | </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_filter(this)}};
		var	li_tooltip_options = {clip: "absolute -20 2 -8 12", attr: "condition", html: '<span class="tooltip-condition">Condição | </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_filter(this)}};
		var bm_tooltip_options = {clip: "-12 2 -2 12", attr: "bookmark", html: '<span class="tooltip-bookmark">Marcador | </span> <span class="tooltip-content">$0</span>', cursor: "default", onclick: function() {edit_bookmark(this)}};
		var table_tooltip_options = {attr: "dynamic-table-data", html: '<span class="tooltip-data-fill">Filtro | </span> <span class="tooltip-content">$0</span>'};
		
		var search_next = function(elem, filter, html) {
			let next = elem.nextElementSibling || (elem.parentElement && elem.parentElement.nextElementSibling) || elem.firstElementChild; 
			
			if (!next) {
				elem = elem.parentElement;
				while (elem && !elem.nextElementSibling) elem = elem.parentElement;
				next = elem && elem.nextElementSibling;
			}

			while (elem) {
				while (next) {
					if (typeof filter == "string") {
						if ($(next).is(filter)) return next;
						if (result = $(next).find(filter).get(0)) return result;
					} else if (filter.test(html?next.innerHTML:next.innerText)) return next; 	

					if (next.childElementCount && (result = search_next(next, filter, html))) return result;
					next = next.nextElementSibling
				}
				
				elem = elem.parentElement && elem.parentElement.nextElementSibling;
				next = elem;
			}
			
			return undefined;
		}; 
		
		//Funções de destaque de partes do texto padrão
		var highlight_code = function(e) {
			$(doc).find('code.highlighted').removeClass('highlighted');
			$(e.currentTarget).addClass('highlighted');
			if ((scode = $(e.currentTarget).text()) && scode.match(/{#if\b|{#else\b/i)) {
				let next = search_next(e.currentTarget, "code:contains('{#'):not(:contains('{#?'))");
				if (!e.currentTarget.nextSibling) {
					while (next && (next.nextSibling || next.previousSibling)) {
						next = search_next(next, "code:contains('{#'):not(:contains('{#?'))");
					}
				}
				if (next) $(next).addClass('highlighted');
				
			}
		};
		
		var unhighlight_code = function(e) {$(doc).find('code.highlighted').removeClass('highlighted')};
		
		var show_condition = function(e) {
			if (e.offsetX < 14) {
				if (!this.hasAttribute('condition')) this.setAttribute('condition', $(this).closest('[condition]').attr('condition'));
				$(this).addClass('condition_hover');
			} else $(this).removeClass('condition_hover');
		};			

		
		$(doc).find('code').mouseenter(highlight_code).mouseleave(unhighlight_code);
		
		$(doc).find('tr[condition]').tooltip(tr_tooltip_options);
		$(doc).find('li[condition]').tooltip(li_tooltip_options);
		$(doc).find('td[bookmark]').tooltip(bm_tooltip_options);
		$(doc).find('table[dynamic-table]').tooltip(table_tooltip_options);
		
	}).catch(error => {errorMessage(error)});
      
});






 
