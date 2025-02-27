"strict mode"
//Habilitar intellisense
function enableIntellisense(target, options) {
	if (!target || !options || !options.list) return false;
	
	if (target.intellisense) return;
	
	let default_options = {tokens: ".",						// caracteres que iniciam/exibem o intellisense
						   includePreviousChars: undefined, // caracteres considerados para determinar termo prévio	
						   delimiters: undefined,			// delimitadores do valor escolhido	
						   onlyTokens: true,				// apenas os caracteres de início
						   caseInsensitive: true,			// procura case insensitive
						   allow: true,						//
						   list: undefined, 				// array de {text,desc,value,class}, string ou function({token, previous})
						   listSeparator: ",",				// separador para listas em string
						   classItem: undefined,			// classe padrão para itens da lista
						   sortList: true,					// ordenar lista	
						   width: undefined,				// largura da lista de intellisense
						   onSelect: undefined};  			// function({token, value, range})
						   
	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];
	
	var keydown_callback, input_callback;
	
	//--- criação do objeto 
	target.intellisense = {options: options, 
						   doc: $(target).is(":input")?window.top.document:(target instanceof Document)?target:target.ownerDocument,
						   targetIsInput: $(target).is(":input")};
						   

	//--- abrir intellisense
	target.intellisense.open = function(list, start) {

		if (target.intellisense.picker || !options.allow) return;
		
		if (typeof options.allow == "function") {
			if (!options.allow.call(target, get_current_node())) return;
		}
		
		if (list && typeof list == "string") {
			list = list.split(options.listSeparator).map((value) => {
				let m_item;
				if (m_item = value.match(/^\s*(\w[^=]*)\s*=\s*(.+)/)) return {value: m_item[1], text: m_item[2]};
				return {text: value};
			});
		}

		if (!list) throw "Lista vazia";
		
		var token;
		
		if (start && options.tokens && options.tokens.includes(start)) {
			token = start;
			start = undefined;
		}
		
		//pré-verificação de existência
		if (start) {
			let regex = new RegExp("^" + start, options.caseInsensitive?"i":"");
			if (!list.find((it) => {return regex.test(it.text)})) return
		}
		
		let cn, startOffset, font_height;
		
		if (cn = get_current_node()) {
			startOffset = target.intellisense.targetIsInput ? cn.start : undefined;
			target.intellisense.container = cn.target.nodeType==3?cn.target.parentElement:cn.target;
		} else {
			let sel = target.intellisense.doc.getSelection();
			let node = sel.focusNode;
			target.intellisense.container = node.nodeType==3?node.parentElement:node;
		}
		
		if (start && start.length > 1) {
			startOffset -= start.length;
			if (startOffset <= 0) startOffset = 0;
			start = start[0];
		}			

		let fs, styles = window.getComputedStyle(target.intellisense.container);

		if (fs = styles.getPropertyValue('font-size')) font_height = (Number(fs.replace(/[^\d]/g, '')) * 1.15);
		else font_height = 12;
						
		let picker = $(`<div class="intellisense-popup-list pullDown" style="z-index: 50001; position: absolute; opacity: 1; overflow-y: auto; display: none;" role="presentation">
							<div class="intellisense-popup-panel">
								<div style="margin: 0px; padding: 0px; -moz-user-select: none;">
									<div class="intellisense-popup-block" tabindex="-1" role="listbox"></div>
								</div>
							</div>
						</div>`).get(0);
						
		target.intellisense.picker = picker;
		
		window.top.document.body.append(picker);
		
		let $ul;
		for (let elem of list) {
			if (!$ul) {
				$ul = $('<ul role="presentation"></ul>');
				$(picker).find('.intellisense-popup-block').append($ul);
			}
			
			if (elem.group) {
				for (let item of elem.items) {
					let key = (options.caseInsensitive?item.text.toLowerCase():item.text).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
					let $li = $(`<li role="presentation" key="${key}" value="${item.value?item.value:item.text}">
									<a hidefocus="true" title="${item.desc}" href="javascript:void(0);" role="option">
										<p>${item.text}</p>
									</a>
								</li>`);
					if (item.class) $li.addClass(item.class); 
					else if (elem.classItem) $li.addClass(elem.classItem);
					else if (options.classItem) $li.addClass(options.classItem);
					$ul.append($li);
				}
			} else {
				let key = (options.caseInsensitive?elem.text.toLowerCase():elem.text).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
				let $li = $(`<li role="presentation" key="${key}" value="${elem.value?elem.value:elem.text}">
								<a hidefocus="true" title="${elem.desc ?? ''}" href="javascript:void(0);" role="option">
									<p>${elem.text}</p>
								</a>
							</li>`);
						
				if (elem.class) $li.addClass(elem.class);
				else if (options.classItem) $li.addClass(options.classItem);
				$ul.append($li);
			}
		}
		
		if (options.sortList) {
			let $lis = $ul.children('li');
			$lis.detach().sort(function(a, b) {
				a = $(a).text();
				b = $(b).text();
				return (a.toString() > b.toString()) ? (a.toString() > b.toString()) ? 1 : 0 : -1;
			});
			$ul.append($lis);
		}
		
		$(picker).find('a').on('mousedown', (e) => {
			e.stopImmediatePropagation();
			e.preventDefault();
			e.stopPropagation();
			let current_value = $(e.currentTarget).closest('li').get(0);
			target.intellisense.close();
			
			if (current_value) select_item(current_value, e);
		});		
		
		//calcular posição do picker
		var calc_position = function() {
			let pos;
			if (target.intellisense.targetIsInput) {
				pos = getCaretCoordinates(target, target.selectionStart);
			} else {
				let sel = target.intellisense.doc.getSelection();
				let r = sel.getRangeAt(0);
				let rect = r.getBoundingClientRect();

				if (rect.left == rect.top == rect.width == rect.height) {
					r = target.intellisense.doc.createRange();
					let node = sel.focusNode, i = sel.focusOffset;
					while (node && node.nodeType == 1 && node.childNodes.length) {
						node = node.childNodes[i];
						i = 0;	
					}
					r.selectNode(node);
					rect = r.getBoundingClientRect();
				}
				let off = $(window.frames[0].frameElement).offset();
				pos = {top: off.top + rect.top, left: off.left + rect.left + 1};
			}

			pos.top += font_height;

			return pos;
		};
		
		//selecionar item
		var select_item = function(item, e) {
			let i, delim = undefined;
			if (options.delimiters && options.tokens && token && (i = options.tokens.indexOf(token)) >= 0 && i < options.delimiters.length) {
				if (Array.isArray(options.delimiters)) delim = options.delimiters[i];
				else delim = options.delimiters;
			}
			
			if (target.intellisense.targetIsInput) {
				let result = options.onSelect?options.onSelect.call(target, {value: $(item).attr('value'), desc: $(item).find('a').attr('title'), token: token, range: {start: (startOffset?startOffset:0), end: target.selectionEnd}, event: e, dom: item}):$(item).attr('value');
				
				if (result && delim) {
					result = delim[0] + result;
					if (delim.length > 1) result += delim[1];
				}
				
				if (result && typeof result == "string") {
					let v = $(target).val();
					v = v.substring(0, startOffset) + result + v.slice(target.selectionEnd);
					$(target).val(v);
				}

			} else {
				let sel = target.intellisense.doc.getSelection();
				let endOffset = sel.focusOffset;
				let _node = sel.focusNode;
				let range = null;

				if (startOffset !== undefined) {
					sel.removeAllRanges();
					
					range = target.intellisense.doc.createRange();
					range.setStart(_node, startOffset + (options.tokens && !options.onSelect && !start && !delim?1:0));
					range.setEnd(_node, endOffset);
					sel.addRange(range);
					range.deleteContents();
				}
				
				let result = options.onSelect?options.onSelect.call(target, {value: $(item).attr('value'), desc: $(item).find('a').attr('title'), token: token, range: range, event: e, dom: item}):$(item).attr('value');

				if (result && delim) {
					result = delim[0] + result;
					if (delim.length > 1) result += delim[1];
				}
				
				if (result && typeof result == "string") {
					range.insertNode(target.intellisense.doc.createTextNode(result));
					range.collapse();
				}
			}			
		};

		//tratar evento keydown
		keydown_callback = function(e) {
			switch (e.key) {
				case "ArrowRight":
				case "ArrowLeft":
				case "Space":
				case "Escape": {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					target.intellisense.close();
					break;
				}
				
				case "ArrowDown":
					e.preventDefault();
					e.stopPropagation();
					let $next = $(target.intellisense.picker).find("li.intellisense-li-selected").next(":visible");
					if ($next.length) {
						$(target.intellisense.picker).find("li.intellisense-li-selected").removeClass("intellisense-li-selected");
						$next.addClass("intellisense-li-selected");
						if (!$next.isInViewport()) $next.get(0).scrollIntoView(false);
					}
					break;
					
				case "ArrowUp":
					e.preventDefault();
					e.stopPropagation();
					let $prev = $(target.intellisense.picker).find("li.intellisense-li-selected").prev(":visible");
					if ($prev.length) {
						$(target.intellisense.picker).find("li.intellisense-li-selected").removeClass("intellisense-li-selected");
						$prev.addClass("intellisense-li-selected");
						if (!$prev.isInViewport()) $prev.get(0).scrollIntoView();
					}
					break;
					
				case "Tab":
				case "Enter":
				
					if (!$(target.intellisense.picker).is(":visible")) {
						target.intellisense.close();
						return;
					}
					
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					let current_value = $(target.intellisense.picker).find("li.intellisense-li-selected").get(0);
					target.intellisense.close();
					if (current_value) select_item(current_value, e);
					
					break;
				default:
					if (options.tokens && e.key.length == 1 && options.tokens.includes(e.key)) {
						let cn = get_current_node();
						if (cn && cn.text) {
							if (options.tokens.includes(cn.text[0])) cn.text = cn.text.slice(1);
							if (cn = target.intellisense.picker.querySelector(`li[value=${cn.text}]`)) select_item(cn, e);
							target.intellisense.close();
							return;
						} else target.intellisense.close();
						
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();
					}
			}
		};
		
		//tratar evento input
		input_callback = function(e) {
			let search_value; 
			if (target.intellisense.targetIsInput) {
				if (startOffset >= target.selectionStart) {
					target.intellisense.close();
					return;
				}
				
				search_value = $(target).val().substring(startOffset, target.selectionStart).replace(/\n/g,"");
				
			} else {
				let sel = target.intellisense.doc.getSelection();
				search_value = $(sel.focusNode).text();

				if (startOffset === undefined) {
					startOffset = sel.focusOffset - 1;
					return;
				}
					
				if (startOffset == sel.focusOffset) {
					target.intellisense.close();
					return;
				}
				
				let position = calc_position();
				$(target.intellisense.picker).css("top", position.top).css("left", position.left);
				

				search_value = search_value.substring(startOffset, sel.focusOffset);
			}
			
			if (search_value && !start && token) {
				search_value = search_value.slice(1);
				if (!search_value) return;
			}
			
			if (options.caseInsensitive && search_value) search_value = search_value.toLowerCase();
			let search_item = $(target.intellisense.picker).find(`li[key^='${search_value}']`).get(0);
			if (search_item) {
				$(target.intellisense.picker).find("li.intellisense-li-selected").removeClass("intellisense-li-selected");
				$(search_item).addClass("intellisense-li-selected");
				if (!$(search_item).isInViewport()) search_item.scrollIntoView();
				$(target.intellisense.picker).css("display", "block");
			} else 	$(target.intellisense.picker).css("display", "none");
		};

		let position = calc_position();
		$(picker).css("left", position.left).css("top", position.top).find("li:first").addClass("intellisense-li-selected");
		
		target.intellisense.doc.addEventListener("keydown", keydown_callback, true);
		target.intellisense.doc.addEventListener("input", input_callback, true);
		$(target.intellisense.doc).on("mousedown.intellisense_events blur.intellisense_events", target.intellisense.close);
			
		if (options.filterList) target.intellisense.filter(options.startChar);
		if (options.width) $(picker).css("width", options.width);		
		$(picker).css("display", "block");		
	};


	//--- fechar intellisense
	target.intellisense.close = function() {
		try {
			$(target.intellisense.picker).css("display", "none");
			target.intellisense.doc.removeEventListener("keydown", keydown_callback, true);
			target.intellisense.doc.removeEventListener("input", input_callback, true);
			$(target.intellisense.doc).off(".intellisense_events");
			$(target.intellisense.picker).remove();
		} finally {
			delete target.intellisense.picker;
		}
	};
	
	var get_current_node = function() {
		let node, startOffset = 0;
		if (target.intellisense.targetIsInput) {
			let result = {target: target, start: target.selectionStart};
			let text = $(target).val();

			startOffset = target.selectionStart - 1;
			if (!target.intellisense.regexPrevious) {
				let re = "\\w";
				if (target.intellisense.options.includePreviousChars) re += target.intellisense.options.includePreviousChars;
				target.intellisense.regexPrevious = new RegExp("[" + re + "]", "");
			}
			let regex = target.intellisense.regexPrevious;
			while (startOffset >= 0 && regex.test(text[startOffset])) startOffset--;
			startOffset++;
			result.text = (target.selectionStart > startOffset)?text.substr(startOffset, target.selectionStart):"";

			return result;
		} else {
			let sel = target.intellisense.doc.getSelection();
			
			if (sel.type == "Range") {
				let range = sel.getRangeAt(0);
				node = range.startContainer;
				startOffset = range.startOffset;
				
				if (node.nodeType == 1 && node.childNodes.length) {
					node = node.childNodes[0];
					startOffset = 0;
				}
			} else {
				node = sel.focusNode;
				startOffset = sel.focusOffset;

				while (node.nodeType == 1 && node.childNodes.length) {
					if (startOffset) startOffset--;
					node = node.childNodes[startOffset];
					startOffset = node && node.nodeType == 3 ? (node.textContent.length || node.wholeText.length) : node.childNodes.length;
				}
			}
			
			if (node && node.nodeType == 3) {
				let n = node;
				let text = node.textContent.slice(0, startOffset);
				while (n = n.previousSibling) text = $(n).text() + text;
				
				let result = {target: node, start: startOffset};
				
				if (!target.intellisense.regexPrevious) {
					let re = "\\w-";
					if (target.intellisense.options.includePreviousChars) re += target.intellisense.options.includePreviousChars;
					target.intellisense.regexPrevious = new RegExp("[" + re + "]+$", "i");
				}
				let regex = target.intellisense.regexPrevious;
				
				if (m = text.match(regex)) {
					result.text = m[0];
					result.start = result.text.length;
				}
				
				return result;
			}
		}
			
		return null;
	};
	
	if (!options.disableCtrlSpace) {
		$(target).on('keydown', function(e) {
			if (e.key == " " && e.ctrlKey) {
				if (target.intellisense.picker) return;
				
				let list = options.list;
				
				if (typeof list == "function") {
					let node, args = {target: target};
					if (node = get_current_node()) args.previous = node.text;

					if (options.tokens) {
						let result, results = [];
						for(let token of options.tokens.split("")) {
							args.token = token;
							if ((result = list.call(target, args))) {
								if (typeof result == "string") {
									result = result.split(options.listSeparator).map((value) => {
										let m_item;
										if (m_item = value.match(/^\s*(\w[^=]*)\s*=\s*(.+)/)) return {value: m_item[1], text: m_item[2]};
										return {text: value};
									});
								} 
								if (result.length) results.push(...result);
							}
						}
						list = results;
						list.sort((a, b) => a.text.localeCompare(b.text, 'pt-br', { sensitivity: 'base' }));

					} else if (!(list = list.call(target, args))) return;
				}

				target.intellisense.open(list, "");
			}
		});
	}
	
	$(target).on('keypress', function(e) {

		if (options.tokens && options.tokens.includes(e.key)) {
			if (target.intellisense.picker) target.intellisense.close();

			let list = options.list;
			
			if (typeof list == "function") {
				let node, args = {token: e.key, target: target};
				if (node = get_current_node()) args.previous = node.text;
				if (!(list = list.call(target, args))) return;
			}
 			
			target.intellisense.open(list, e.key);
			return;
		}
		
		if (!options.onlyTokens) {
			if (target.intellisense.picker) return;
			let node, search = e.key;
			if ((node = get_current_node()) && node.text) search = node.text + search;
			
			target.intellisense.open(typeof options.list == "function"?options.list.call(target, {target: target}):options.list, search);
		}
		
		
	});
}