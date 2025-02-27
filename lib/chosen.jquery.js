function chosen_item_hover(event) {
	$(event.target).addClass('highlighted').siblings('li').removeClass('highlighted');
}

function chosen_item_leave(event) {
	$(event.target).removeClass('highlighted');
}

function chosen_item_click(event) {
	event.preventDefault();
	if (event.target.type == 'filter') chosen_item_add(event.target);
	else chosen_item_execute(event.target);
	event.target.editor.clearResults();
	event.target.editor.focus();
}

function chosen_item_dblclick(event) {
	let li = $(event.target).closest('li')[0];
	if (li.editablevalue != undefined) {
		chosen_item_delete(li);
		li.editor.value = li.editablevalue;
		li.editor.focus();
		li.editor.select();
	}
}

function chosen_item_close() {
	let li = $(this).closest('li')[0];
	chosen_item_delete(li);
	li.editor.focus();
}

function chosen_item_add(li) {
	li.editor.value = '';
	let nli = document.createElement("li");
	nli.editor = li.editor;
	$(nli).addClass("search-choice").attr("filter", li.filter).html('<span>' + li.caption + '</span><a class="search-choice-close"></a>');
	if (li.group != undefined) $(nli).attr("filter-group", li.group);
	$(nli).children('a.search-choice-close').on("click.chosen", chosen_item_close);
	if (li.editablevalue != undefined) {
		nli.editablevalue = li.editablevalue;
		$(nli).on("dblclick.chosen", chosen_item_dblclick);
	}
	$(li.editor).parent().before(nli);
	li.editor.hasPrefilter = true;
	$(li.editor).trigger('chosen:filter');
	if ($(li.editor).attr("placeholder")) li.editor.last_placeholder = $(li.editor).attr("placeholder");
	$(li.editor).attr("placeholder", "");
}

function chosen_item_execute(li) {
	li.editor.clear();
	li.editor.clearResults();
	setTimeout(()=>{li.execute.apply(li, li.args)}, 10);
}					


function chosen_item_delete(li) {
	$(li).remove();
	li.editor.hasPrefilter = $(li.editor.container).find('li.search-choice').length > 0;
	$(li.editor).trigger('chosen:filter');
	if (!li.editor.hasPrefilter && li.editor.last_placeholder) $(li.editor).attr("placeholder", li.editor.last_placeholder);

}

function chosen_create_item(editor, item) {
	var li = document.createElement("li");
	li.editor = editor;
	li.type = item.execute?'action':'filter';
	li.execute = item.execute;	
	
	li.onmouseover = chosen_item_hover;
	li.onmouseleave = chosen_item_leave;
	li.onmousedown = chosen_item_click;
	$(li).addClass("active-result");
	if (li.type == 'action') $(li).addClass("chosen-action");
	return li;
}


$.fn.chosen = function (opt) {
	//Ajustando opções
	if (opt == undefined || opt.list == undefined) return;
	if (!opt.logic) opt.logic = ['AND', 'OR'];
	if (opt.allow === undefined) opt.allow = 0;
	if (typeof opt.allow == 'string') {
		switch (opt.allow) {
			case 'default': opt.allow = 0; break;
			case 'both': opt.allow = 1; break;
			case 'preonly': opt.allow = 2; break;
			case 'customonly': opt.allow = 3; break;
			default: opt.allow = 0;
		}
	}
	if (opt.allow > 3 || opt.allow < 0) opt.allow = 0;
	if (opt.filterlabel == undefined) opt.filterlabel = ''; else opt.filterlabel += ' ';

	for (var i = 0; i < this.length; i++) {
		var elem = this[i];
		elem.options = opt;
		elem.hasPrefilter = false;

		//Pré-criando items da lista de opções
		opt.list.forEach((item, index) => { item.li = chosen_create_item(elem, item); });
		
		var width = elem.style.width;
		if (!width) width = $(elem).css("width");
		if (width == undefined) width = $(elem).outerWidth() + 'px';
		
		$(elem).wrap("<div class='chosen-container' style='width: " + width + "'><ul class='chosen-choices'><li class='search-field'></li></ul></div>");
		$(elem).attr("autocomplete", "off").attr("autocorrect", "off").attr("autocapitalize", "off").attr("spellcheck", "false").attr("value", "");
		elem.container = $(elem).addClass("chosen-search-input").closest(".chosen-container")[0];
		
		elem.results = $(elem.container).append("<div class='chosen-drop'><ul class='chosen-results'></ul></div>").find(".chosen-results")[0];
		elem.popup = $(elem.results).parents(".chosen-drop")[0];
		elem.lastfilter = '';
		$(elem).css("width", "100%");
	
		//Limpar resultados
		elem.clearResults = function() {
			$(this.popup).css("clip", '');
			$(this.results).empty();
		};
		
		//Exibir resultados
		elem.showResults = function(expr) {
			let value;
			let m;
			let cap;
			let i;
			
			if (this.options.allow == 3) return false;

			this.clearResults();

			opt.list.forEach((item, index) => {
				value = expr;
				if (value && item.converter) {
					switch (item.converter) {
						case 'digits': value = value.replace(/(\d)[\D]/ig, '$1');
					}
				} 
				
				if (!expr || ((m = item.keywords.exec(value)) && (!item.validate || item.validate(value)) && (!item.execute || !this.hasPrefilter) )) {
					
					if (item.multichoices) {
						item.multichoices.forEach((choice, choice_index) => {
							let li = chosen_create_item(this, item);
							if (item.translate) cap = item.caption.replace(/\*/g, item.translate[choice_index]);
							else cap = item.caption.replace(/\*/g, choice);
							
							$(li).html(this.options.filterlabel + cap);
							li.caption = cap;
							li.group = item.group;
							if (item.editable) li.editablevalue = value;
							li.filter = item.filter.replace(/\*/g, item.parse?item.parse[choice_index]:choice);
							$(this.results).append(li);
						});
					
					} else if (m){
						if (item.translate) {
							cap = item.caption;
							for (i=1; i < m.length; i++) cap = cap.replace('$' + i, m[i]?item.translate[i-1]:'');
						} else cap = value.replace(item.keywords, item.caption);

						if (item.li.type == 'filter') {
							$(item.li).html(this.options.filterlabel + cap);
							item.li.caption = cap;
							item.li.filter = item.filter;
							item.li.group = item.group;
							if (item.editable) item.li.editablevalue = value;
							for (i=1; i < m.length; i++) item.li.filter = item.li.filter.replace(new RegExp('\\$' + i, "g"), m[i]?(item.parse?item.parse[i-1]:m[i]):'');
						} else {
							$(item.li).html(cap);
							item.li.args = m.slice(1);
						}
						
						$(this.results).append(item.li);
					} 
				}
			});

			if (this.results.children.length) {
				$(this.results.children[0]).addClass('highlighted').siblings('li').removeClass('highlighted');
				$(this.popup).css("clip", 'auto');
				return true;
			} 
			
			return false;
		}
		
		elem.clear = function() {
			elem.value = '';
			$(elem).trigger('chosen:filter');
		};
		
		//Evento de montagem da expressão de filtro
		$(elem).on("chosen:filter", function() {
			var f = [];
			$(elem.container).find(".search-choice").each(function(){
				let g = $(this).attr('filter-group');
				g = (g != undefined)?g:0;
				
				if (f[g]) f[g] +=  ' ' + elem.options.logic[1] + ' '; else f[g] = '';
				f[g] += $(this).attr('filter');
			});
			
			f = f.filter((s) => {return s});
			
			if (f.length > 1) f = f.map((value) => {return '(' + value + ')'});
			f = f.join(' ' + elem.options.logic[0] + ' ');
			
			if (elem.options.onfilter) elem.options.onfilter(f, elem.value);
		});

		$(elem).on("focus.chosen", function(event){ $(event.target.container).addClass("chosen-container-active"); });
		$(elem).on("blur.chosen", function(event){
			event.preventDefault();
			event.target.clearResults();
			$(event.target.container).removeClass("chosen-container-active");
			if (!event.target.options.autofilter) event.target.value = event.target.lastfilter;
		});
		
		$(elem).on("keydown.chosen", function(event){
			
			let current;
			
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					event.target.clearResults();
					if (event.target.options.autofilter) event.target.value = '';
					else event.target.value = event.target.lastfilter;
					return;
					
				case 'ArrowDown':
					event.preventDefault();
					current = $(event.target.results).children('.highlighted')[0];
					if (!current) return;
					$(current).next().addClass('highlighted').siblings('li').removeClass('highlighted');
					return;
					
				case 'ArrowUp':
					event.preventDefault();
					current = $(event.target.results).children('.highlighted')[0];
					if (!current) return;
					$(current).prev().addClass('highlighted').siblings('li').removeClass('highlighted');
					return;
				
				case 'Enter':
					event.preventDefault();
					current = $(event.target.results).children('.highlighted')[0];
					if (current) {if (current.type == 'filter') chosen_item_add(current); else return chosen_item_execute(current);}
					else if (event.target.options.allow == 2) {event.target.setSelectionRange(0, event.target.value.length); return;}
					else if (event.target.hasPrefilter && event.target.options.allow == 0) event.target.value = '';
					else if (!event.target.options.autofilter) $(event.target).trigger('chosen:filter');
					else {
						let run_filter = false;
						if (typeof elem.options.autofilter == 'function') run_filter = elem.options.autofilter(event.target.value);
						else if (typeof elem.options.autofilter != 'boolean') run_filter = elem.options.autofilter.test(event.target.value);
						if (!run_filter) $(event.target).trigger('chosen:filter');
					}
					event.target.lastfilter = event.target.value;
					event.target.clearResults();
					return;
					
				case 'Backspace':
					if (!elem.selectionStart && !elem.selectionEnd) {
						event.preventDefault();
						let last = $(elem).parent().prev('.search-choice')[0];
						if (last) chosen_item_delete(last);
					}
					return;
			}
			
			if (event.target.options.allow != 3 && event.target.options.mc_shortcut && event.key == event.target.options.mc_shortcut && !event.target.value ) {
				event.target.showResults();
			}  
		});
		
		$(elem).on("input.chosen", function(event){
			let run_filter = (!event.target.hasPrefilter || event.target.options.allow == 1) && event.target.options.allow != 2;
			if (event.target.options.autofilter) clearTimeout(event.target.timeout);
			if (event.target.value && event.target.showResults(event.target.value)) run_filter = false;
			if (elem.options.autofilter && run_filter && event.target.value) {
				if (typeof elem.options.autofilter == 'function') run_filter = elem.options.autofilter(event.target.value);
				else if (typeof elem.options.autofilter != 'boolean') run_filter = elem.options.autofilter.test(event.target.value);
			} 
			if (elem.options.autofilter && run_filter) event.target.timeout = setTimeout(function() {$(event.target).trigger('chosen:filter');}, 400);
		});

	}

}