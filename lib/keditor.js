//Criar barra de ferramentas
function create_toolbar(parent_toolbar) {
	var toolbar = document.createElement("span");
	$(toolbar).addClass("cke_toolbar").attr("role", "toolbar").html(`
		<span class="cke_toolbar_start"></span>
		<span class="cke_toolgroup" role="presentation"></span>
		<span class="cke_toolbar_end"></span>	
	`);
	parent_toolbar.appendChild(toolbar);
	return toolbar;
}


//Adicionar botão na barra de ferramentas
function add_btn(toolbar, id, title, icon, options, callback) {
	
	if (typeof options == "function") {
		callback = options;
		options = undefined;
	}
	
	if (!options) options = {};

	var item = $(`<a id="${id}" class="cfor_button cke_button cke_button_off" title="${title}" tabindex="-1" hidefocus="true" role="button" aria-labelledby="${id}_label" aria-haspopup="false" onblur="this.style.cssText = this.style.cssText;" onkeydown="return false;" onfocus="return false;">
				      <span class="cke_button_icon" style="background-size:auto;">&nbsp;<//span>
					  <span id="${id}_label" class="cke_button_label cke_button__table_label" aria-hidden="false">${title}<//span>
				  <//a>`)[0];
				  
	$(toolbar).find(".cke_toolgroup").append(item);
	$(item).find(".cke_button_icon").css("background-image", "url(" + browser.runtime.getURL(`assets/${icon}`) + ")");

	if (options.enabled === false) $(item).addClass("cke_button_disabled");
	
	item.fn = callback;
	
	if (options.list) {
		item.list = options.list;
		$(item).append('<span class="cke_button_arrow"></span>');
		
		$(item).on("click", function(event) {
			if ($(event.currentTarget).hasClass("cke_button_disabled")) return;

			if ($(event.currentTarget).hasClass("cke_button_off")) {
				var id_list =  `${event.currentTarget.id}_list`;
				var div_list = document.getElementById(id_list);
				
				//Criar lista suspensa de campos CFOR caso não exista
				if (!div_list) {
					div_list = 	$(`	<div id="${id_list}" class="cke cke_reset_all cke_2 cke_panel cke_combopanel cke_ltr" style="z-index: 10001; position: absolute; opacity: 1; overflow-y: auto; display: none;" role="presentation">
										<div class="cke_panel_container cke_browser_gecko">
											<div class="cke_ltr" style="margin: 0px; padding: 0px; -moz-user-select: none;">
												<div tabindex="-1" class="cke_panel_block" style="" role="listbox" aria-label="Campos e Funções" title="Campos e Funções de automação do CFOR">
												</div>
											</div>
										</div>
									</div>`);
									
					$('body').append(div_list);
					
					for (let obj of event.currentTarget.list) {
						if (obj.group) $(`#${id_list} .cke_panel_block`).append(`<h1 class="cke_panel_grouptitle" role="presentation">${obj.group}</h1>`);
						let $ul = $(`#${id_list} .cke_panel_block`).append('<ul role="presentation" class="cke_panel_list"></ul>');
						
						for (let it of obj.items) {
							let data = it.data?it.data:it.text
							$ul.append(`<li class="cke_panel_listItem" role="presentation">
											<a _cke_focus="1" hidefocus="true" title="${it.desc}" href="javascript:void(0);" role="option" data="%${data}%">
												<p>${it.text}</p>
											</a>
										</li>`);
						}
						
					}
					
					$(`#${id_list} a`).on('mousedown', (evt) => {
						evt.stopImmediatePropagation();
						evt.preventDefault();
						evt.stopPropagation();
						event.currentTarget.hideList();
						if (event.currentTarget.fn) event.currentTarget.fn($(evt.currentTarget).attr("data"));
					});
					
					event.currentTarget.list = div_list[0];
					
					event.currentTarget.showList = function() {
						if ($(this).hasClass("cke_button_on")) return;
						
						var position = $(this).position();
						$(this.list).css("left", position.left + "px").css("top", (position.top + $(event.currentTarget).outerHeight()) + "px").css("display", "block");
						
						$(document).on('keydown.list_events', null, this, function(evt) {
							if (evt.keyCode == 27 || evt.which == 27) {
								evt.preventDefault();
								evt.stopPropagation();
								evt.data.hideList();
							}
						});					
						
						$(this).removeClass("cke_button_off").addClass("cke_button_on");
						$(this).addClass("cfor_button_list_on");
					};
					
					event.currentTarget.hideList = function() {
						if ($(this).hasClass("cke_button_off")) return;
						$(this.list).css("display", "none");
						$(this).removeClass("cke_button_on").addClass("cke_button_off");
						$(this).removeClass("cfor_button_list_on");
						$(document).off('.list_events');
					};
				}
				
				event.currentTarget.showList();
				
			} else event.currentTarget.hideList();
		});
		
	} else { 
		if (options.toggleable) {
			
			item.checked = function(value) {
				if (value == undefined)	return $(item).hasClass("cke_button_on");
				if (value) $(item).removeClass("cke_button_off").addClass("cke_button_on"); 
				else $(item).removeClass("cke_button_on").addClass("cke_button_off");
			};
			
			if (options.checked) item.checked(true);
		}
		
		$(item).on("click", (e) => {
			if (e.currentTarget.fn && e.currentTarget.fn(e) && options.toggleable) e.currentTarget.checked(!e.currentTarget.checked());
		});
	}
	
	return item; 
}


//Adicionar separador na barra de ferramentas
function add_separator(toolbar) {
	$(toolbar).find(".cke_toolgroup").append('<span class="cke_toolbar_separator" role="separator"></span>');
}


//Desabilitar botão da barra de ferramentas
function dis_btn(btn) {
	$(btn).addClass("cke_button_disabled");
	if (btn.hideList != undefined) btn.hideList();
}


//Habilitar botão da barra d eferramentas
function en_btn(btn) {
	$(btn).removeClass("cke_button_disabled");
	btn.style.display='none';
	btn.offsetHeight; 
	btn.style.display='block';
}


//Mostrar lista sobreposta
function show_popup_list(owner, id, list, position, options, callback) {

	if (typeof position == "function") {
		callback = position;
		position = null;
		options = null;
	}
	
	if (typeof options == "function") {
		callback = options;
		options = null;
	}
	
	if (!options) options = {};
	
	if (!position && owner) {
		position = getCaretCoordinates(owner, owner.selectionEnd);
		let styles = window.getComputedStyle(owner);
		let fs = styles.getPropertyValue('font-size');
		if (fs) position.top += (Number(fs.replace(/[^\d]/g, '')) * 1.15);
	}
	
	let div_list = document.getElementById(id);
	
	if (!div_list) {
		div_list = 	$(`<div id="${id}" class="cke cke_reset_all cke_2 cke_panel cke_combopanel cke_ltr" style="z-index: 20001; position: absolute; opacity: 1; overflow-y: auto; display: none;" role="presentation"><div class="cke_panel_container cke_browser_gecko"><div class="cke_ltr" style="margin: 0px; padding: 0px; -moz-user-select: none;"><div tabindex="-1" class="cke_panel_block" style="" role="listbox"></div></div></div></div>`);
		$('body').append(div_list);
		
		var $ul;
		for (let obj of list) {
			if (options.useGroup && obj.group) {
				$ul = $('<ul role="presentation" class="cke_panel_list"></ul>');
				$(`#${id} .cke_panel_block`).append(`<h1 class="cke_panel_grouptitle" role="presentation">${obj.group}</h1>`).append($ul);;
			} 
			
			if (!$ul) {
				$ul = $('<ul role="presentation" class="cke_panel_list"></ul>');
				$(`#${id} .cke_panel_block`).append($ul);
			}
			
			let className = options.useClass && obj.className?obj.className:"";
			
			for (let it of obj.items) {
				let data = it.data?it.data:it.text
				$ul.append(`<li class="cke_panel_listItem ${className}" role="presentation">
								<a _cke_focus="1" hidefocus="true" title="${it.desc}" href="javascript:void(0);" role="option" data="%${data}%">
									<p>${it.text}</p>
								</a>
							</li>`);
			}
		}

		
		$(`#${id} a`).on('mousedown', (evt) => {
			evt.stopImmediatePropagation();
			evt.preventDefault();
			evt.stopPropagation();
			hideList();
			if (callback) callback($(evt.currentTarget).attr("data"));
			if (!options.persistent) div_list[0].remove();
		});
	}
	var tos, search = "";
	
	var keydown_callback = function (evt) {
		evt.preventDefault();
		evt.stopPropagation();
		
		switch (evt.key) {
			case "Escape":
				hideList();
				if (!options.persistent) div_list[0].remove();
				break;
				
			case "ArrowDown":
				let next = $(`#${id} li.intellisense-li-selected`).next();
				if (next.length) {
					$(`#${id} li.intellisense-li-selected`).removeClass("intellisense-li-selected");
					$(next).addClass("intellisense-li-selected");
					if (!$(next).isInViewport()) next[0].scrollIntoView(false);
				}
				break;

			case "ArrowUp":
				let prev = $(`#${id} li.intellisense-li-selected`).prev();
				if (prev.length) {
					$(`#${id} li.intellisense-li-selected`).removeClass("intellisense-li-selected");
					$(prev).addClass("intellisense-li-selected");
					if (!$(prev).isInViewport()) prev[0].scrollIntoView();
				}
				break;
				
			case "Enter":
				hideList();
				let a = $(`#${id} li.intellisense-li-selected a`).get(0);
				if (callback) callback($(a).attr("data"));
				if (!options.persistent) div_list[0].remove();
				break;
				
			default:
				if (evt.key && evt.key.match(/^[\w\d_]$/i)) {
					search += evt.key.toLowerCase();
					clearTimeout(tos);
					tos = setTimeout(function(){search = ""}, 500) ;
					
					let $li = $(`#${id} li`).filter(function() {
						return $(this).find("p").text().toLowerCase().indexOf(search) == 0;
					});
					
					if ($li.length) {
						$(`#${id} li.intellisense-li-selected`).removeClass("intellisense-li-selected");
						$li.first().addClass("intellisense-li-selected");
						if (!$li.first().isInViewport()) $li[0].scrollIntoView();
					}
				}
		}
	};
	
	var hideList = function() {
		$(div_list).css("display", "none");
		$(document).off('.popup_events');
		$(owner).off('.popup_events');
		$(owner).off("keydown", keydown_callback);
		owner.removeEventListener("keydown", keydown_callback, true);
	};

	
	$(`#${id} li.intellisense-li-selected`).removeClass("intellisense-li-selected");
	$(div_list).css("left", position.left + "px").css("top", position.top + "px").css("display", "block");
	$(`#${id} li.cke_panel_listItem:first`).addClass("intellisense-li-selected").get(0).scrollIntoView();
	
	
	owner.addEventListener("keydown", keydown_callback, true);

	$(owner).on("blur.popup_events", (e) => {
		hideList();
		if (!options.persistent) div_list[0].remove();
	});
	
	$(owner).on("mousedown.popup_events", (e) => {
		hideList();
		if (!options.persistent) div_list[0].remove();
	});
}



//Abrir dialogo 
function open_dialog(id, title, width, height, button, fields, callback) {
	var dlg;
	if (dlg = document.getElementById(id)) return;
	
	if (!$("link[href*='moonocolor/dialog.css']").length) $('<link href="/sei/editor/ck/skins/moonocolor/dialog.css?t=G2FW" rel="stylesheet">').appendTo("head");	
	
	var left = (screen.width - width) / 2, top = (screen.height - height) / 2;
	dlg = $(`<div id="${id}" class="cke_reset_all cke_2 cke_editor_txaConteudo_dialog" role="dialog" style="display: none;"><table class="cke_dialog cke_browser_gecko cke_ltr cke_single_page" style="position: fixed; top: ${top}px; left: ${left}px; z-index: 10010;" role="presentation"><tbody><tr><td role="presentation"><div class="cke_dialog_body" role="presentation"><div class="cke_dialog_title" role="presentation" style="-moz-user-select: none;">${title}</div><a class="cke_dialog_close_button" href="javascript:void(0)" title="Fechar" role="button" cfor-action="cancel" style="-moz-user-select: none;"><span class="cke_label">X</span></a><div class="cke_dialog_tabs" role="tablist"><a class="cke_dialog_tab cke_dialog_tab_selected" cke_first="" title="Geral" tabindex="-1" hidefocus="true" role="tab" style="-moz-user-select: none;">Geral</a></div><table class="cke_dialog_contents" role="presentation"><tbody><tr><td class="cke_dialog_contents_body" role="presentation" style="width: ${width}px; height: ${height}px;"><div role="tabpanel" class="cke_dialog_ui_vbox cke_dialog_page_contents" style="width: 100%" name="tab-source" aria-hidden="false"><table role="presentation" style="width:100%;" cellspacing="0" border="0" align="left"><tbody></tbody></table></div></td></tr><tr><td class="cke_dialog_footer" role="presentation"><table role="presentation" class="cke_dialog_ui_hbox cke_dialog_footer_buttons"><tbody><tr class="cke_dialog_ui_hbox"><td class="cke_dialog_ui_hbox_first" role="presentation"><a style="-moz-user-select: none;" href="javascript:void(0)" title="OK" hidefocus="true" class="cke_dialog_ui_button cke_dialog_ui_button_ok" role="button" cfor-action="ok"><span class="cke_dialog_ui_button">OK</span></a></td><td class="cke_dialog_ui_hbox_last" role="presentation"><a style="-moz-user-select: none;" href="javascript:void(0)" title="Cancelar" hidefocus="true" class="cke_dialog_ui_button cke_dialog_ui_button_cancel" role="button" cfor-action="cancel"><span class="cke_dialog_ui_button">Cancelar</span></a></td></tr></tbody></table></td></tr></tbody></table></div></td></tr></tbody></table></div>`);
	
	if (button) {
		let $table = dlg.find('table.cke_dialog_footer_buttons');
		$table.css("display", "block!important");
		let $tr = $table.find('tr');
		$tr.prepend('<td style="width: 100%;"></td>');
		$tr.prepend(`<td class="cke_dialog_ui_hbox_last" role="presentation"><a style="-moz-user-select: none;" href="javascript:void(0)" title="${button}" hidefocus="true" class="cke_dialog_ui_button cke_dialog_ui_button_cancel" role="button" cfor-action="${button.toLowerCase()}"><span class="cke_dialog_ui_button">${button}</span></a></td>`);
	}
	
	$('body').append(`<div tabindex="-1" style="display: none; position: fixed; z-index: 10000; top: 0px; left: 0px; background-color: white; opacity: 0.5; width: ${screen.width}px; height: ${screen.height}px;" class="cke_dialog_background_cover"></div>`);
	$('body').append(dlg);
	
	let start_pos;
	$(dlg).find('.cke_dialog_title').mousedown((e) => {
		start_pos = {x: e.screenX, y: e.screenY};
		
		$(document).mousemove((e) => {
			let cke_dlg = $(dlg).find('.cke_dialog').get(0);
			let actual_pos = {x: cke_dlg.offsetLeft, y: cke_dlg.offsetTop};
			$(cke_dlg).css("left", actual_pos.x + e.screenX - start_pos.x);
			$(cke_dlg).css("top", actual_pos.y + e.screenY - start_pos.y);
			start_pos = {x: e.screenX, y: e.screenY};
		}).mouseup((e) => {
			$(document).off("mousemove mouseup");
		});
		
	});	
	
	
	let $dlg_body = $(dlg).find('.cke_dialog_page_contents tbody');
	
	let $tr, $td, first_elem, has_field_visibility = false;

	for (let f of fields) {

		if (f.type == 'separator') {
			$dlg_body.append(`<tr><td class="cke_dialog_ui_separator"><label>${f.label}</label></td></tr>`);
			continue;
		}
		
		if (!f.inline || !$td) {
			if (!f.no_br || !$tr) {
				$tr = $("<tr />");
				$dlg_body.append($tr);
			}	
			
			$td = $('<td class="cke_dialog_ui_vbox_child"></td>');
			$tr.append($td);
		} 

		let $div_f = $('<div class="cke_dialog_ui_field"></div>'); 
		$td.append($div_f);
		
		if (f.label) {
			$div_f.append(`<label id="${f.id}_label" class="cke_dialog_ui_labeled_label cke_dialog_ui_label cke_required" for="${f.id}">${f.label}</label>`);
			if (f.label_position == 'top') $div_f.append('<br>');
		}

		switch (f.type) {
			case "textarea": 
				f.elem = $(`<textarea id="${f.id}" rows="${f.rows}" cols="${f.cols}" class="cke_dialog_ui_input_textarea" aria-required="true" style="white-space: normal!important;" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>`).get(0);
				break;
				
			case "edtable":
				f.elem = $(`<table id="${f.id}" class="cke_dialog_ui_edtable" aria-required="true"></table>`).get(0);
				$(f.elem).edtable(f.options);
				
				break;
				
			case "text":
				f.elem = $(`<input type="text" id="${f.id}" class="cke_dialog_ui_input_text" aria-required="true" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />`).get(0);
				if (f.items) {
					let $datalist = $(`<datalist id="${f.id}_list"></datalist>`);
					f.items.split(",").forEach(item => {$datalist.append(`<option>${item}</option>`)});
					$div_f.append($datalist);
					
					$(f.elem).attr("list", `${f.id}_list`);
				}
				
				break;
				
			case "select":	
				f.elem = $(`<select id="${f.id}" class="cke_dialog_ui_input_select" aria-required="true"></select>`).get(0);
				if (f.items) {
					if (typeof f.items == "string") f.items = f.items.split(",");
					f.items.forEach((item, index) => {
						let m_opt;
						if (m_opt = item.match(/\s*([^=]*?)\s*=(.+)/i)) $(f.elem).append(`<option value="${m_opt[1] == '_'?'':m_opt[1]}">${m_opt[2]}</option>`);
						else if (f.indexedValues) $(f.elem).append(`<option value="${index}">${item}</option>`);
						else $(f.elem).append(`<option>${item}</option>`);
					});
					
					if (f.value == undefined) f.elem.selectedIndex = 0;
				}
				break;

			case "check":
				$div_f.append('&nbsp;');
				f.elem = $(`<input type="checkbox">`).get(0);
				f.elem.checked = (f.value==="true"|f.value===true);
				break;
				
			case "interval":	
				f.elem = $(`<div style="display:flex;width:100%;align-items: baseline;">
								<input type="text" id="${f.id}_ini" class="cke_dialog_ui_input_text" aria-required="true" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
								<span>&nbsp;até&nbsp;</span>
								<input type="text" id="${f.id}_fin" class="cke_dialog_ui_input_text" aria-required="true" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
							</div>`).get(0);
				break;
				
		}
		
		if (f.width) $(f.elem).css("width", f.width);
		
		$elem = f.type == "interval" ? $(f.elem).find("input") : $(f.elem);
		
		if (f.shortcut) {
			$elem.on('keydown', (e) => {
				if (e.key == f.shortcut.key) {
					e.preventDefault();
					e.stopPropagation();
					f.shortcut.callback(f.elem);
					return;
				}
			});
		}
		
		$elem.each((index, elem) => {
			if (f.intellisense) enableIntellisense(elem, f.intellisense);
			
			if (!first_elem) first_elem = elem;
			if (f.value != undefined) {
				switch (f.type) {
					case "interval": $(elem).val(Array.isArray(f.value) && index < f.value.length?f.value[index]:""); break;
					case "edtable": f.elem.EdTable.load(f.value); break;

					default: $(elem).val(f.value);
				}
			} 
		});
		

		$div_f.append(f.elem);

		if (f.visibility != undefined) {
			f.visibility = f.visibility.trim();
			if (f.visibility) has_field_visibility = true;
		}

	}
	
	$(dlg).find('a.cke_dialog_close_button,a.cke_dialog_ui_button_cancel,.cke_dialog_ui_button_ok').on('click', (event) => {
		var output = {}, fds = {};
		
		for (var f of fields) {
			if (	f.type == 'separator') continue;

			let fObj = Object.create(Object.prototype, {
				elem: {writable: false, configurable: false, enumerable: false, value: f.elem}
			});


			switch (f.type) {
				case "interval": 
					output[f.id] = [$(f.elem).find("input").first().val(), $(f.elem).find("input").last().val()];
					Object.defineProperty(fObj, "value", {
						get: function() {return [$(this.elem).find("input").first().val(), $(this.elem).find("input").last().val()]},
						set: function(v1, v2=null) { 
							if (!Array.isArray(v1)) v1 = [v1, v2];
							$(this.elem).find("input").first().val(v1[0]);
							$(this.elem).find("input").last().val(v1[1]);
						}
					});
					
					break
					
				case "edtable":
					output[f.id] = f.elem.EdTable.get();
					Object.defineProperty(fObj, "value", {
						get: function() {return this.elem.EdTable.get()},
						set: function(v) {this.elem.EdTable.load(v)}
					});
					
					break;

				case "check":
					output[f.id] = f.elem.checked;
					Object.defineProperty(fObj, "value", {
						get: function() {return this.elem.checked},
						set: function(v) {this.elem.checked = v}
					});
					
					break;
	
					
				default: 
					output[f.id] = $(f.elem).val();
					Object.defineProperty(fObj, "value", {
						get: function() {return $(this.elem).val()},
						set: function(v) {$(this.elem).val(v)}
					});
				
			}
			fds[f.id] = fObj;
		}
		fds.clear = function() {
			for(let prop in this) {
				fds[prop].value = null;
			}
		};
		
		
		if (callback && !callback({dlg: dlg, fields: fds, action: $(event.currentTarget).attr("cfor-action"), data: output})) return;
		$(event.currentTarget).closest('.cke_editor_txaConteudo_dialog').get(0).remove();
		$('.cke_dialog_background_cover').remove();
	});

	if (has_field_visibility) {
		let fields_map = fields.reduce((m, f) => (m[f.id] = f, m), {});

		let get_field_value = f => {
		
			if (!f || f.nodata || f.type == "button") return undefined;
			
			let r, value = null;
			
			if (f.type == "radio") value = (r = f.items.find(e => e.checked)) && (r.hasAttribute("value") ?  $(r).attr('value') : f.items.indexOf(r));
			else value = f.type=="check" ? f.elem.checked : f.type=="date" ? $(f.elem).val().replace(/(\d{4})-(\d{1,2})-(\d{1,2})/i, "$3/$2/$1") : $(f.elem).val();
			
			if (f.type == "text" && f.upper && value) value = value.toUpperCase();
			
			if (f.type == "number") value = Number(value);
			
			return value;
		};		
		
		let field_visible = f => {
			if (!f.visibility) return true; 
			
			let expr = f.visibility.replace(/\$([a-z_]\w*)\b/gi, (m0, fname) => {
				if (fname == f.id) return "true";
				
				let vf = fields_map[fname];
				if (vf.visibility) {
					if (new RegExp(`\\$${f.id}\\b`).exec(vf.visibility)) return "true";
					if (!field_visible(vf)) return "false";
				}
				
				let v = get_field_value(vf);
				return v == undefined ? 'NULL' : v;
			});
			
			return solve(expr);
		};
		
		let f_visibilities = fields.filter(f => f.visibility);
		let change_event_handler = e => {
			for (let f of f_visibilities) $(f.elem).closest('tr').css('display', field_visible(f) ? '' : 'none' );
		};
		
		$(dlg).find('input,select').on('change', change_event_handler);		
		change_event_handler();
	}	
	
	$('.cke_dialog_background_cover').css("display", "block");
	$(dlg).css("visibility", "hidden");
	$(dlg).css("display", "block");

	let $cke_dlg = $(dlg).find('.cke_dialog');

	$cke_dlg.css('left', (screen.width - $cke_dlg.outerWidth(true)) / 2);
	$cke_dlg.css('top', (screen.height - $cke_dlg.outerHeight(true)) / 2);
	$(dlg).css("visibility", "visible");

	if (first_elem) $(first_elem).focus();
}
