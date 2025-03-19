"strict mode"
/***********************************************/
/* Definição de compatibilidade para o Chrome  */
/***********************************************/
try {
	var browser = browser || chrome;
} catch (ex) {
}


/***********************************************/
/* Extensão dos tipos nativos do javascript    */
/***********************************************/

if (!String.prototype.toDate) {
	String.prototype.toDate = function () {
		if (this == null) throw new TypeError('"this" is null or not defined');
		var m = /^\s*(\d{4})\-(\d{2})\-(\d{2})\s*$/.exec(this);
		if (m) return new Date(`${m[2]}/${m[3]}/${m[1]}`);
		else if (m = /^\s*(\d{2})[.-\/](\d{2})[.-\/](\d{4})\s*$/.exec(this)) return new Date(`${m[2]}/${m[1]}/${m[3]}`);

		return null;
	}
}

if (!String.prototype.toDateBR) {
	String.prototype.toDateBR = function () {
		if (this == null) throw new TypeError('"this" is null or not defined');
		var m = /^\s*(\d{4})\-(\d{2})\-(\d{2})\s*$/.exec(this);
		if (m) return `${m[3]}/${m[2]}/${m[1]}`;
		else if (m = /^\s*(\d{2})[.-\/](\d{2})[.-\/](\d{4})\s*$/.exec(this)) return this;
		return "";
	}
}

if (!String.prototype.toDateDB) {
	String.prototype.toDateDB = function () {
		var m = /^\s*(\d{2})[.-\/](\d{2})[.-\/](\d{4})\s*$/.exec(this);
		if (m) return `${m[3]}-${m[2]}-${m[1]}`;
		return "NULL";
	}
}

if (!Date.prototype.diffDays) {
	Date.prototype.diffDays = function (d) {
		if (d == undefined) d = new Date();
		else if (typeof d == "string") d = d.toDate();
		else if (typeof d == "object" && d instanceof Date) d = new Date(d);

		var this_d = new Date(this);
		this_d.setHours(0, 0, 0, 0);
		d.setHours(0, 0, 0, 0);


		return Math.trunc((this_d - d) / 86400000);
	}
}

if (!Date.prototype.toDateBR) {
	Date.prototype.toDateBR = function () {
		return this.toLocaleDateString("pt-BR");
	}
}

if (!Date.prototype.addDate) {
	Date.prototype.addDate = function (d, m, y) {
		if (d && typeof d == "string") {
			const regex = /([+-])?\s*(?:(\d+|\*)\s*(d(?:ays?\b|ias?\b)?|m(?:onths?\b|mes(?:es)?\b)?|y(?:ears?\b)?|a(?:nos?\b)?)?)/g;
			var s, inc;

			while ((s = regex.exec(d)) !== null) {
				if (s.index === regex.lastIndex) regex.lastIndex++;
				inc = !s[1] || s[1] == "+";

				if (s[3]) {
					switch (s[3][0].toLowerCase()) {
						case "d":
							if (s[2] == "*") this.setFullYear(this.getFullYear(), this.getMonth() + (inc ? 1 : 0), (inc ? 0 : 1));
							else this.setDate(this.getDate() + ((inc ? 1 : -1) * Number(s[2])));
							break;

						case "m":
							if (s[2] == "*") this.setFullYear(this.getFullYear(), (inc ? 11 : 0), this.getDate());
							else this.setMonth(this.getMonth() + ((inc ? 1 : -1) * Number(s[2])));
							break;

						case "y":
						case "a":
							if (s[2] == "*") this.setFullYear(this.getFullYear(), (inc ? 11 : 0), (inc ? 31 : 1));
							else this.setFullYear(this.getFullYear() + ((inc ? 1 : -1) * Number(s[2])));
							break;
					}
				} else {
					if (s[2] == "*") this.setFullYear(this.getFullYear(), (inc ? 11 : 0), (inc ? 31 : 1));
					else this.setDate(this.getDate() + ((inc ? 1 : -1) * Number(s[2])));
				}
			}
		} else {
			if (d) this.setDate(this.getDate() + d);
			if (m) this.setMonth(this.getMonth() + m);
			if (y) this.setFullYear(this.getFullYear() + y);
		}

		return this;
	}
}

if (!Date.prototype.toDateDB) {
	Date.prototype.toDateDB = function () {
		var m = /^(\d{2})[.-\/](\d{2})[.-\/](\d{4})$/.exec(this.toLocaleDateString("pt-BR"));
		if (m) return `${m[3]}-${m[2]}-${m[1]}`;
		return "NULL";
	}
}

if (!Number.prototype.toMoney) {
	Number.prototype.toMoney = function () {
		return (new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })).format(this);
	}
}

if (!Object.prototype.getValue) {
	Object.defineProperty(Object.prototype, 'getValue', {
		value: function (key) {
			if (!key) return this;

			if (!typeof key == 'number') return this[key];

			let k;
			let value = this;
			let k_regex = /(?<=\.?)[a-z_]+\w*|(?<=\[)\w+(?=\])/ig;

			while (value && (k = k_regex.exec(key))) {
				if (typeof value != 'object') return null;

				if (k.index === k_regex.lastIndex) k_regex.lastIndex++;
				value = value[k[0]];
			}

			return value;
		},
		enumerable: false
	});
}


/** 
 * Extensão do JQuery
 * @external "jQuery.fn" 
 */

/**
 * Função que verifica se elementos estão dentro do Viewport
 * @method external:"jQuery.fn".isInViewport
 * @returns {Boolean}
 */
$.fn.isInViewport = function () {
	var elementTop = this[0].offsetTop;
	var elementBottom = elementTop + $(this).outerHeight();

	var parent = this[0].parentElement;
	while (parent && parent.scrollHeight <= parent.clientHeight) parent = parent.parentElement;

	if (!parent) parent = window;

	var viewportTop = $(parent).scrollTop();
	var viewportBottom = viewportTop + $(parent).height();
	var ret = elementTop >= viewportTop && elementBottom <= viewportBottom;

	return ret;
};


/*** Função que define elementos como acionáveis, ou seja, exibe uma barra flutuante com ações ***

		options: actions | {actions, callback}
			actions: Lista de ações :: <string,...> | [{action, title, icon, condition},...]
						action: nome da ação :: <string>
						title: descritivo da ação :: <string>
						icon: ícone da ação :: <string>
						condition: condição para exibição da ação :: function(target, event) | <regexp>
						
					 valores pré-definidos: 'copy' para copiar valor para o clipboard	
					 
			callback: função de chamada para execução da ação :: function(target, event)
			
		return <elements>
*/
$.fn.actionable = function (options) {
	var to_open, to_close;

	if (!options) options = {};
	if (Array.isArray(options)) options = { actions: options };
	if (!options.actions) return;

	var copy_fn;

	if (!Array.isArray(options.actions)) options.actions = [options.actions];
	for (let i = 0; i < options.actions.length; i++)
		if (typeof options.actions[i] == "string") options.actions[i] = { action: options.actions[i], icon: "icon-" + options.actions[i] };

	$(this).on('mouseenter.actionable', (e) => {
		to_open = setTimeout(function () {
			var bar = document.getElementById("barActions");
			if (!bar) {
				bar = $('<div id="barActions" class="expandUp" style="position: absolute; z-index: 999999;"></div>').get(0);
				$(bar).mouseenter(() => { clearTimeout(to_close) });
				$(bar).mouseleave(() => { $(bar).remove() });

				$('body').append(bar);
			} else $(bar).hide();

			$(bar).html("");  //Limpar barra caso exista

			let pos;

			options.actions.forEach(a => {
				if (a.action == "copy" && !a.title) a.title = "Clique aqui para copiar para a área de transferência";

				if (a.condition) {
					if (typeof a.condition == "function" && !a.condition.call(e.currentTarget, e)) return;
					if (a.condition instanceof RegExp && !a.condition.test($(e.currentTarget).text())) return;
				}

				let btn = $(`<div class="icon ${a.icon}" action="${a.action}" title="${a.title}">&nbsp;</div>`).get(0);
				$(bar).append(btn);

				if (a.action == "copy") {
					btn.copyContent = $(e.currentTarget).text();

					$(btn).click(function (e) {
						let content = e.currentTarget.copyContent;
						$(bar).remove();
						setClipboard(content, { position: pos, className: options.copyMsgClassName });
					});
				} else {
					$(btn).click(function (eb) {
						$(bar).remove();
						if (a.callback) a.callback.call(e.currentTarget, eb);
						else if (options.callback) options.callback.call(e.currentTarget, eb);
					});

				}
			});

			pos = getAbsolutePosition(e.currentTarget);
			pos.x += $(e.currentTarget).outerWidth() + 6;
			pos.y += ($(e.currentTarget).outerHeight(true) - $(bar).outerHeight() - 2) / 2;

			$(bar).css("left", pos.x).css("top", pos.y);
			$(bar).show();
		}, 400);
	});

	$(this).on('mouseleave.actionable', (e) => {
		clearTimeout(to_open);
		to_close = setTimeout(function () { $('#barActions').fadeOut(400, $('#barActions').remove()) }, 500);
	});

	return this;
};



/*** Função que define elementos como NÃO acionáveis ***
	return <elements>
*/
$.fn.unactionable = function () {
	$('#barActions').remove();
	$(this).off('.actionable');
	return this;
}



/*** Função que define elementos como editáveis, ou seja, exibe um icone para edição além de permitir a inclusão ***
	 e exclusão de novos comando através dos métodos incorporados addCommand(icon, title, callback) e removeCommand(icon)

		options: {icon, hint, callback} | callback
			icon: classe com as definições do icone. Padrão 'icon-edit' :: <string>
			hint: texto exibido quando o ponteiro do mouse está sobre o botão de edição :: <string>
			callback: função de chamada para execução da edição :: function(event)
			
		return <elements>
*/
$.fn.editable = function (options) {
	if (!options) return;

	if (typeof options == "function") options = { callback: options };

	var add_cmd = function (icon, title, callback) {
		let ebc = $(this).find(".editable-bar").get(0);
		if (!ebc) {
			ebc = $('<div class="editable-bar"></div>').get(0);
			$(this).prepend(ebc);
		}

		if ($(ebc).find("." + icon).get(0)) return;

		let cmd = $(`<div class='icon editable-icon ${icon}' title='${title}'>&nbsp;</div>`).get(0);
		$(ebc).append(cmd);
		$(cmd).click(e => { callback.call(this) });
	};

	var rm_cmd = function (icon) {
		let ebc = $(this).find(".editable-bar").get(0);
		if (!ebc) return;
		$(ebc).find("." + icon).remove();
	};


	$(this).each((index, elem) => {
		elem.addCommand = add_cmd;
		elem.removeCommand = rm_cmd;
		add_cmd.call(elem, options.icon ? options.icon : "icon-edit", options.hint ? options.hint : "Clique aqui para editar", options.callback);
	});

	$(this).mouseenter((e) => {
		$(e.currentTarget).find(".editable-bar").addClass("editable-bar-show");
	}).mouseleave((e) => {
		$(e.currentTarget).find(".editable-bar").removeClass("editable-bar-show");
	});
};



/*** Função que capacita os elementos para aceitar conteúdo largado (Drop) ***

		options: {className, datatype, callback} | callback
			className: classe para customização do painel que receberão o conteúdo largado :: <string>
			datatype: tipo de conversão do conteúdo largado :: ('text' | 'html' | null)
			callback: função de chamada para tratamento do conteúdo largado :: function(target, data, event)
			
		return <elements>
*/
$.fn.dropable = function (options) {
	if (!options) return;
	if (typeof options == "function") options = { callback: options };

	if ($(this).css("position") == "static") $(this).css("position", "relative");

	var fn_enter = function (e) {
		var $this = $(this);
		$this.off("dragenter");

		e.preventDefault();
		var $div = $('<div class="panel-dropable" style="top: 0px;left: 0px;width: 100%;height: 100%;position: absolute;"></div>');
		if (options.className) $div.addClass(options.className);

		$(this).append($div);

		$div.on("dragleave", (e) => {
			$div.remove();
			$this.on("dragenter", fn_enter);
		});

		$div.on("dragover", (e) => { e.preventDefault() });

		$div.on("drop", (e) => {
			$div.remove();
			$this.on("dragenter", fn_enter);

			e.preventDefault();
			if (options.callback) {
				let data;
				if (!options.datatype || options.datatype == "text") data = e.originalEvent.dataTransfer.getData("text");
				else if (options.datatype == "html") data = e.originalEvent.dataTransfer.getData("text/html");
				else data = e.originalEvent.dataTransfer;

				options.callback.call($this.get(0), data, e.originalEvent);
			}
		});

	};

	$(this).on("dragenter", fn_enter);
};



/*** Função que define uma nova visualização para as dicas ***

		options: {title, clip, html, cursor}
			attr: nome do atributo do elemento que contém a dica. Padrão 'title' :: <string>
			clip: posição do elemento onde ao passar com o mouse a janela da dica será exibida :: {left, top, right, bottom} | <string>
			html: conteúdo da dica. Usar '$0' para preencher com o conteúdo do atributo :: <string>
			cursor: cursor quando mouse está sobre o elemento :: <string> (mesmos valores de 'cursor css')
			
		return <elements>
*/
$.fn.tooltip = function (options) {
	if ($(this).prop("tooltiped") != undefined) return;

	if (!options) options = {};
	if (!options.attr) options.attr = "title";
	if (typeof options.clip == "string") {
		let arr = options.clip.split(" ");
		let pos = undefined;
		if (isNaN(arr[0])) pos = arr.shift();
		if (isNaN(arr.slice(-1))) pos = arr.pop();

		switch (arr.length) {
			case 1: options.clip = { left: Number(arr[0]), top: Number(arr[0]), right: undefined, bottom: undefined, position: pos }; break;
			case 2: options.clip = { left: Number(arr[0]), top: Number(arr[0]), right: Number(arr[1]), bottom: Number(arr[1]), position: pos }; break;
			case 3: options.clip = { left: Number(arr[0]), top: Number(arr[1]), right: Number(arr[2]), bottom: Number(arr[2]), position: pos }; break;
			case 4: options.clip = { left: Number(arr[0]), top: Number(arr[1]), right: Number(arr[2]), bottom: Number(arr[3]), position: pos }; break;
			default: options.clip = undefined;
		}
	}

	var old_cursor;

	let show_tooltip = function (e) {
		if ($(e.currentTarget.ownerDocument.documentElement).find('.tooltip').length) return;

		$tp = $(`<div class="tooltip fade top" role="tooltip">
					<div class="tooltip-arrow"></div>
					<div class="tooltip-inner"></div>
				 </div>`);


		let content = $(e.currentTarget).attr(options.attr);
		if (options.html) content = options.html.replace("$0", content);

		$tp.find('.tooltip-inner').html(content);

		$(e.currentTarget.ownerDocument.documentElement).append($tp);

		let p = $(e.currentTarget).offset(); //let p = $(e.currentTarget).position();
		let size = $tp.dimension('outerSize');


		if (e.currentTarget.toolclip) {
			p.top += e.currentTarget.toolclip.top - size.height;
			p.left += ((e.currentTarget.toolclip.right - e.currentTarget.toolclip.left - size.width) / 2);
			p.left += e.currentTarget.toolclip.left;

			if (p.left < 0) {
				let pa = Math.abs(p.left / 2) + (Math.abs(e.currentTarget.toolclip.right - e.currentTarget.toolclip.left) / 2);
				$tp.find('.tooltip-arrow').css("left", pa);
				p.left = 0;
			}

			if (options.cursor) {
				old_cursor = e.currentTarget.style.cursor;
				e.currentTarget.style.cursor = options.cursor;
			}

		} else {
			p.top -= size.height;
			p.left += (($(this).outerWidth() - size.width) / 2);
		}

		$tp.css("left", p.left).css("top", p.top);
		$tp.addClass('in');
		e.currentTarget.tooltiped = true;
	};

	let hide_tooltip = function (e) {
		//return;
		if (!e.currentTarget.tooltiped) return;
		if ($tp = $(e.currentTarget.ownerDocument.documentElement).find('.tooltip').get(0)) {
			$tp.remove();
			if (options.cursor) e.currentTarget.style.cursor = old_cursor;
			e.currentTarget.tooltiped = false;
			if (e.type == "click" && options.onclick) options.onclick.call(e.currentTarget, e);
		}
	};

	if (options.clip) {
		$(this).on("mousemove.tooltip", function (e) {
			if (!e.currentTarget.toolclip) {
				let clip = { left: options.clip.left, top: options.clip.top, right: options.clip.right, bottom: options.clip.bottom };

				if (clip.left == undefined && clip.right != undefined) clip.left = 0;
				if (clip.left < 0 && options.clip.position != "absolute") clip.left += $(e.currentTarget).outerWidth();

				if (clip.top == undefined && clip.bottom != undefined) clip.top = 0;
				if (clip.top < 0 && options.clip.position != "absolute") clip.top += $(e.currentTarget).outerHeight();

				if (clip.right == undefined) clip.right = 0;
				if (clip.right <= 0 && options.clip.position != "absolute") clip.right += $(e.currentTarget).outerWidth();

				if (clip.bottom == undefined) clip.bottom = 0;
				if (clip.bottom <= 0 && options.clip.position != "absolute") clip.bottom += $(e.currentTarget).outerHeight();

				e.currentTarget.toolclip = clip;
			}

			//let pX = e.clientX - $(e.currentTarget).position().left;
			let pX = e.clientX - $(e.currentTarget).offset().left;
			let pY = e.offsetY;

			if (pX >= e.currentTarget.toolclip.left && pX <= e.currentTarget.toolclip.right && pY >= e.currentTarget.toolclip.top && pY <= e.currentTarget.toolclip.bottom) {
				show_tooltip(e);
			} else hide_tooltip(e);
		}).on("mouseleave.tooltip click.tooltip", hide_tooltip);
	} else {
		$(this).on("mouseenter.tooltip", show_tooltip).on("mouseleave.tooltip click.tooltip", hide_tooltip);
	}

	$(this).prop("tooltiped", false);

};



/*** Função que remove a definição de nova visualização para as dicas ***
*/
$.fn.untooltip = function () {
	//prop("toolclip", undefined).prop("tooltiped", undefined);
	$(this).off(".tooltip").each(function () {
		delete this.tooltiped;
		delete this.toolclip;
	});
};



/*** Função que calcula dimensões de elementos ocultos ***

		method: método do elemento para determinar a dimensão :: ('size' | 'outerSize' | 'outro compatível com JQuery')
		options: {absolute, clone, includeMargin, display}
			absolute: utilizará posicionamento absoluto. Padrão false :: <boolean>
			clone: fará um clone dos elementos para realização do cálculo. Padrão false :: <boolean>
			includeMargin: incluir margens no cálculo das dimensões. Padrão false :: <boolean>
			display: modo de exibição dos elementos. Padrão 'block' :: <string> compatível com CSS
			
		return {width, height}
*/
$.fn.dimension = function (method, options) {
	if (!this[method] && method != "size" && method != "outerSize") throw '$.actual => The jQuery method "' + method + '" you called does not exist';

	var defaults = { absolute: false, clone: false, includeMargin: false, display: 'block' };
	var configs = $.extend(defaults, options);

	var $target = this.eq(0);
	var fix, restore;

	if (configs.clone) {
		fix = function () {
			var style = 'position: absolute !important; top: -1000 !important; ';

			$target = $target.clone().attr('style', style).appendTo('body');
		};

		restore = function () { $target.remove() };
	} else {
		var node = [];
		var style = '';
		var $hidden;

		fix = function () {
			$hidden = $target.parents().addBack().filter(':hidden');
			style += 'visibility: hidden !important; display: ' + configs.display + ' !important; ';

			if (configs.absolute) style += 'position: absolute !important; ';

			$hidden.each(function () {
				var $this = $(this);
				var thisStyle = $this.attr('style');

				tmp.push(thisStyle);
				$this.attr('style', thisStyle ? thisStyle + ';' + style : style);
			});
		};

		restore = function () {
			$hidden.each(function (i) {
				var $this = $(this);
				var _tmp = tmp[i];

				if (_tmp === undefined) $this.removeAttr('style');
				else $this.attr('style', _tmp);
			});
		};
	}

	fix();

	var actual;
	switch (method) {
		case "size": actual = { width: $target["width"](), height: $target["height"]() }; break;
		case "outerSize": actual = { width: $target["outerWidth"](configs.includeMargin), height: $target["outerHeight"](configs.includeMargin) }; break;
		default: actual = /(outer)/.test(method) ? $target[method](configs.includeMargin) : $target[method]();
	}

	restore();

	return actual;
};



/***********************************************/
/* Funções gerais                              */
/***********************************************/



/*** Escrever na Área de Transferência ***

		text: conteúdo a ser escrito na Área de Transferência :: <string>
		options: opções de exibição da conclusão da escrita :: {position, className}
			position: posição de exibição do popup de confirmação da escrita :: <element> | {x, y}>
				element: objeto DOM que servirá de referência para exibição do popup
				{x, y}: coordenadas para exibição do popup
			className: nome da classe para customização do popup. Padrão 'copied-text-panel' :: <string>
		
		return Promise
*/
function setClipboard(text, options) {

	return navigator.clipboard.writeText(text).then(() => {
		if (!options) return text;

		var position = options.position ? options.position : options;
		if (typeof position == "string") position = $(position).get(0);
		if (!position) return text;
		if (typeof position == "string" && position.nodeType === 1) position = getAbsolutePosition(position);

		var cls = options.className ? options.className : "copied-text-panel";

		$("#CopiedTextPanel").remove();

		var $div = $(`<div id="CopiedTextPanel" class="${cls}" style="margin-top: 10px;position: absolute;z-index:100000;"></div>`);
		$div.hide();
		$('body').append($div);
		$div.html(text + ' copiado.');
		var dw = $div.outerWidth();
		if ((position.x + dw) > $('body').outerWidth()) {
			position.x -= dw;
			if (position.x < 0) position.x = 0;
			position.y += 16;
		}

		$div.css('left', position.x).css('top', position.y);


		$div.click(function () { $(this).remove() });
		$div.fadeIn().delay(1000).fadeOut("fast", function () { $(this).remove() });
	});

}



/*** Codifica parâmetros de requisição HTML ***

		data: endereço da requisição :: <string> | <object>
		charset: conjunto de caracteres
		
		return <string>
*/
function encodeXHRParams(data, charset) {
	if (!data) return undefined;
	if (typeof data == "string") {
		if (charset == "iso-8859-1") return escape(data).replace(/%20/g, "+");
		else return decodeURIComponent(data).replace(/%20/g, "+");
	}

	let params = "";

	for (let prop in data) {
		if (data.hasOwnProperty(prop)) {
			if (data[prop] === false) continue;
			params += (params ? "&" : "") + prop + "=";
			if (data[prop]) {
				if (typeof data[prop] == "string") data[prop] = data[prop].trim();

				if (charset == "iso-8859-1") params += escape(data[prop]).replace(/%20/g, "+");
				else params += decodeURIComponent(data[prop]).replace(/%20/g, "+");
			}
		}
	}

	return params;
}

/*** Abrir janela  ***

		url: endereço da página a ser aberta :: <string>
		method: método da requisição :: ('GET' | 'POST')
		data: dados da requisição quando utilizado o método 'POST' :: <string> | <object>
		options: opções da requisição :: {contentType, timeout}
			contentType: tipo do conteúdo. Padrão 'application/x-www-form-urlencoded;' :: <string>
			timeout: tempo limite para retorno da requisição. Padrão 0 :: <number>
		
		return {status, ok, response} | null
*/
function openWindow(url, method = "get", params = null, options = null) {
	if (!options) options = {};
	let default_win_options = {
		location: 0,
		status: 1,
		resizable: 1,
		scrollbars: 1,
		width: 700,
		height: 600
	};

	let default_options = { dataFormId: undefined };

	for (let prop in default_win_options) if (default_win_options.hasOwnProperty(prop) && options[prop] == undefined) options[prop] = default_win_options[prop];
	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] !== undefined && options[prop] == undefined) options[prop] = default_options[prop];



	return new Promise((resolve, reject) => {
		if (!options) options = "";
		var width, height;

		url = absoluteUrl(url);;
		var win_name = "win_" + Math.floor(Math.random() * 10000);
		var win_options = "";
		for (let prop in default_win_options) if (default_win_options.hasOwnProperty(prop) && options[prop] != undefined) win_options += (win_options ? "," : "") + prop + "=" + options[prop];
		var win = method.toLowerCase() == "get" ? window.open(url, win_name, win_options) : window.open("", win_name, win_options);

		try {
			setTimeout(function () {
				win.moveTo(((screen.availWidth / 2) - (options.width / 2)), ((screen.availHeight / 2) - (options.height / 2)));
				win.focus();
			}, 200);

		} catch (e) {
			// abrindo endereco de outro servidor ocorre erro de acesso
		}

		var monitor = window.setInterval(function () {
			if (win.closed) {
				clearInterval(monitor);
				resolve();
			}
		}, 100);

		if (method.toLowerCase() == "post") {
			let frm = document.createElement("form");

			if (params) {
				for (let pname in params) {
					if (params.hasOwnProperty(pname) && params[pname] !== undefined) {
						let hdn = document.createElement("input");
						hdn.type = "hidden";
						hdn.name = "pname";
						hdn.value = params[pname];
						frm.appendChild(hdn);
					}
				}
			}

			frm.onload = () => { alert('carregou') };
			frm.target = name;
			frm.action = url;
			frm.submit();
		}


	});
}


/*** Fazer requisição SÍNCRONA ***

		url: endereço da requisição :: <string>
		method: método da requisição :: ('GET' | 'POST')
		data: dados da requisição quando utilizado o método 'POST' :: <string> | <object>
		options: opções da requisição :: {contentType, timeout}
			contentType: tipo do conteúdo. Padrão 'application/x-www-form-urlencoded;' :: <string>
			timeout: tempo limite para retorno da requisição. Padrão 0 :: <number>
		
		return {status, ok, response} | null
*/
function syncAjaxRequest(url, method, data, options) {
	var ajax_req;

	try {
		ajax_req = new XMLHttpRequest();
	} catch (failed) {
		return null;
	}

	if (!options) options = {};

	let default_options = {
		contentType: "application/x-www-form-urlencoded;",
		timeout: 0,
		domParse: false
	};

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] !== undefined && options[prop] == undefined) options[prop] = default_options[prop];

	if (data) {
		data = encodeURIComponent(data);
		data = data.replace(/%26/g, '&');
		data = data.replace(/%3D/g, '=');
		data = data.replace(/%20/g, ' ');
	}

	try {
		if (!method) method = "GET";
		ajax_req.open(method.toUpperCase(), absoluteUrl(url), false);
		if (options.contentType) ajax_req.setRequestHeader('Content-Type', options.contentType);

		if (options.timeout) setTimeout(() => { ajax_req.abort() }, options.timeout);

		ajax_req.send(data);

		let result = { status: ajax_req.status, ok: ajax_req.status == 200 };

		if (result.ok) {
			if (options.domParse) {
				let parser = new DOMParser();
				result.response = parser.parseFromString(ajax_req.responseText.trim(), "text/html");
			} else {
				result.response = ajax_req.responseText;
				if (result.response.substring(1, 5) == '?xml') result.response = ajax_req.responseXML;
			}
		}

		return result;
	} catch (error) {
		return null;
	}

}



/*** Retornar Promise com dados XML ou HTML ***

		url: endereço da requisição :: <string>
		options: opções da requisição :: {charset, returnError, ...}
			charset: conjunto de caracteres. Padrão 'iso-8859-1' :: ('iso-8859-1' | 'utf-8')
			returnError: retornar informações do erro :: <boolean>
			...: outras opções compatíveis com Ajax Settings do JQuery
		
		return Promise
*/
async function getAjaxContent(url, options) {
	if (!options) options = {};

	let default_options = {
		method: "GET",
		params: undefined,
		charset: "iso-8859-1"
	};	// iso-8859-1 | utf-8

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	let ajax_setting = { url: absoluteUrl(url.replace(/&amp;/g, "&")), method: options.method.toUpperCase(), crossDomain: true, data: encodeXHRParams(options.params) };

	if (options.charset == "iso-8859-1") {
		ajax_setting.contentType = `application/x-www-form-urlencoded;charset=${options.charset}`;
		ajax_setting.beforeSend = jqXHR => jqXHR.overrideMimeType(`text/html;charset=${options.charset}`);
	}

	return Promise.resolve($.ajax(ajax_setting)).catch(error => { return options.returnError ? error : null });
}



/*** Retornar Promise de postagem de dados ***

		form_url: formulário ou endereço da requisição :: <form> | <id> | <url>
		options: opções da postagem :: {data, formId, url, fetchMethod, fetchParams, charset}
			data: dados a serem postados ou função para preenchimento dos dados a serem postados :: <string> | <object> | function(html, postdata) 
				html: html retornado pelo GET realizado através do form_url :: <string>
				postdata: objeto com os dados a ser preenchido pela função :: <object>
			formId: identificador do formulário retornado pelo GET realizado através do form_url :: <string>
			url: URL de postagem diferente do que está informado no formulário :: <string>
			fetchMethod: método padrão utilizado na busca quando informado uma URL em form_url. Padrão 'GET' :: ('GET' | 'POST')
			fetchParams: parâmetros utilizados na busca quando informado uma URL em form_url e utilizado o método 'POST' :: <string> | <object> 
			charset: conjunto de caracteres. Padrão 'iso-8859-1' :: ('iso-8859-1' | 'utf-8')
		
		return Promise
*/
function postFormData(form_url, options) {
	if (!form_url) return Promise.reject("Formulário ou URL não informados");

	var form = form_url;

	if (!options) return Promise.reject("Argumentos inválidos");
	if (typeof options == "function" || (typeof options == "object" && !options.data && !options.fetchParams)) options = { data: options };

	if (!options.data && !options.fetchParams) return Promise.reject("Dados nulos");

	let default_options = {
		data: undefined,			// {dados} | function(data) para postar
		formId: undefined,		// identificador do formulário'
		url: undefined,			// url diferente da definida no formulário
		onlyFetch: false,		// apenas buscar
		fetchMethod: "get",		// método padrão para busca quando informado uma url
		fetchParams: undefined,	// parâmetros para busca
		charset: "iso-8859-1"
	};	// iso-8859-1 | utf-8

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	let is_url = (typeof form == "string" && Boolean(form.match(/^https?:\/\/.*\.(?:php|asp)[^'"]*/i)));

	let data_to_params = function (d) {
		if (!d || typeof d == "string") return d;
		let params = "";

		for (let prop in d) {
			if (d.hasOwnProperty(prop)) {
				if (d[prop] === false) continue;
				params += (params ? "&" : "") + prop + "=";
				if (d[prop]) {
					if (typeof d[prop] == "string") d[prop] = d[prop].trim();

					if (options.charset == "iso-8859-1") params += escape(d[prop]).replace(/%20/g, "+");
					else params += decodeURIComponent(d[prop]).replace(/%20/g, "+");
				}
			}
		}

		return params;
	};

	let root;

	return new Promise((resolve, reject) => {
		if (is_url) {
			let ajax_setting = { url: absoluteUrl(form.replace(/&amp;/g, "&")), method: "GET" };
			root = ajax_setting.url.match(/(?:https?:\/\/)?[^\/]+(?:\/[^\/]+)*(?=\/)/i)[0];

			if (options.fetchMethod == "post") {
				ajax_setting.method = "POST";
				ajax_setting.data = data_to_params(options.fetchParams);
			}

			if (options.charset == "iso-8859-1") {
				ajax_setting.contentType = `application/x-www-form-urlencoded;charset=${options.charset}`;
				ajax_setting.beforeSend = jqXHR => jqXHR.overrideMimeType(`text/html;charset=${options.charset}`);
			}

			Promise.resolve($.ajax(ajax_setting)).then(resolve, reject);

		} else resolve(form);
	}).then(html => {

		if (options.onlyFetch) return Promise.resolve(html);

		if (is_url) form = options.formId ? $(html).find('#' + options.formId).get(0) || $(html).filter('#' + options.formId).get(0) : $(html).find('form').get(0) || $(html).filter('form').get(0);
		else form = $(form).get(0);

		if (!form) return Promise.reject({ html: html, message: "Formulário não encontrado" });

		form = $(form);

		let mount_params = async function () {
			if (typeof options.data == "string") return Promise.resolve(options.data);

			let postdata = {};
			form.find('[type=hidden],textarea,select,input:checked,[type=submit]').each((index, input) => {
				postdata[input.name] = $(input).val();
			});

			if (typeof options.data == "function") {
				let result = options.data.constructor.name === "AsyncFunction" ? await options.data({ html: html, data: postdata }) : options.data({ html: html, data: postdata });
				if (result === false) return Promise.reject("Cancelado");
				if (result instanceof Promise) return result.then(r => { return r === false ? Promise.reject("Cancelado") : Promise.resolve(data_to_params(postdata)) });
			} else {
				for (let prop in options.data) if (options.data.hasOwnProperty(prop)) postdata[prop] = options.data[prop];
			}

			return data_to_params(postdata);
		};

		return mount_params().then(params => {
			let url = options.url ? options.url : form.attr("action");
			let ajax_setting = { url: absoluteUrl(root, url), method: "POST", data: params };
			if (options.charset) {
				ajax_setting.contentType = `application/x-www-form-urlencoded; charset=${options.charset.toUpperCase()}`;
				ajax_setting.beforeSend = jqXHR => jqXHR.overrideMimeType(`text/html;charset=${options.charset}`);
			}

			return Promise.resolve($.ajax(ajax_setting));
		});

	});
}



/*** Aguardar carregamento de documento ***

		doc: documento para aguardar carregamento :: <id> | <document> | <iframe> | <window>
		options: opções para aguardar :: {interval, timeout, filter} | filter 
			interval: intervalo de verificação do estado do documento. Padrão 250 ms :: <number>
			timeout: tempo limite para aguardar a carga do documento. Padrão 15000 ms :: <number> 
			filter: filtro para documento :: <function> | <string>. 
		
		return Promise
*/
function waitDocumentReady(doc, options) {
	if (!doc) return Promise.reject("Documento nulo");

	let default_options = {
		interval: 250,			//--- intervalo (ms) de teste do status do documento
		timeout: 15000
	};			//--- timeout (ms) de aguardo da carga

	if (!options) options = {};
	if (typeof options == "string" || typeof options == "function") options = { filter: options };
	if (typeof options == "number") options = { timeout: options };

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	var getDocumentNode = (d) => {
		if (d.nodeType === Node.DOCUMENT_NODE) return d;
		if (d instanceof Window) return d.document;

		d = $(d).get().find(tmp => {
			if (tmp.nodeType === Node.ELEMENT_NODE && tmp.tagName == "IFRAME") tmp = tmp.contentDocument || tmp.contentWindow.document;
			if (tmp.nodeType !== Node.DOCUMENT_NODE || tmp.readyState !== "complete") return false;
			if (!options.filter) return true;
			if (typeof options.filter == "function") return options.filter(tmp);
			return tmp.querySelector(options.filter) != null;
		});

		if (!d) return null;
		if (d.nodeType === Node.DOCUMENT_NODE) return d;
		if (d instanceof Window) return d.document;
		if (d.nodeType === Node.ELEMENT_NODE && d.tagName == "IFRAME") return d.contentDocument || d.contentWindow.document;
		return d;
	};

	return new Promise(function (resolve, reject) {
		var counter = 0, ready_interval = setInterval(function () {
			counter++;
			let d = getDocumentNode(doc);

			if (!d || d.readyState != "complete") {
				if (options.timeout && (counter * options.interval >= options.timeout)) {
					clearInterval(ready_interval);
					reject("Timeout");
				}
				return;
			}

			clearInterval(ready_interval);
			resolve(d);
		}, options.interval);
	});
}


/**
 * Aguardar sincronamente a carga completa do documento
 * @param {Document} doc Documento a ser aguardada a carga completa. Default: document
 * @param {number} timeout Tempo máximo em segundos para a aconclusão da carga completa do documento. Default: 5 s
 * @returns TRUE se completou a carga ou FALSE se houve estouro de timeout
 */
function syncWaitDocumentReady(doc = document, timeout = 5) {
	const sleep = milliseconds => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds)
	let start = new Date().getTime();
	if (timeout) timeout *= 1000;

	while (doc.readyState != "complete" && doc.readyState != "interactive") {
		if (timeout && (new Date().getTime() - start) > timeout) return false;
		sleep(250);
	}
	return true;
}


/*** Calcular coeficiente Z ***

		test: texto para calcular o coeficiente :: <string>
		ref: texto referência para cálculo do coeficiente :: <string>
		
		return <number>
*/
function calcZ(test, ref) {
	var rlen = ref.length, tlen = test.length;

	if (tlen < rlen) {
		let swap = tlen;
		tlen = rlen;
		rlen = swap;
	}

	var z = 0, w = rlen, it, ir;

	for (it = 0, ir = 0; it < tlen; ir = ++it) {
		while (ir < rlen) {
			if (test[it] == ref[ir]) {
				z += w;
				w = rlen;
				break;
			} else {
				w--;
				if (!w) {
					w = rlen;
					break;
				}
				ir++;
			}
		}
	}

	return z / tlen / rlen;
}



/*** Calcular coeficiente DICE ***

		l: texto 1 para cálculo do coeficiente :: <string>
		r: texto 2 para cálculo do coeficiente :: <string>
		
		return <number>
*/
function diceCoefficient(l, r) {
	if (l.length < 2 || r.length < 2) return 0;

	let lBigrams = new Map();
	for (let i = 0; i < l.length - 1; i++) {
		const bigram = l.substr(i, 2);
		const count = lBigrams.has(bigram) ? lBigrams.get(bigram) + 1 : 1;
		lBigrams.set(bigram, count);
	};

	let intersectionSize = 0;
	for (let i = 0; i < r.length - 1; i++) {
		const bigram = r.substr(i, 2);
		const count = lBigrams.has(bigram) ? lBigrams.get(bigram) : 0;

		if (count > 0) {
			lBigrams.set(bigram, count - 1);
			intersectionSize++;
		}
	}

	return (2.0 * intersectionSize) / (l.length + r.length - 2);
}



/*** Retornar endereço absoluto ***

		root: raiz para determinação do endereço absoluto. Padrão <raiz_corrente> :: <string>
		path: caminho a partir do raiz da URL :: <string>
		
		return <string>
*/
function absoluteUrl(root, path) {
	if (!root && !path) return "";

	if (root && !path) {
		path = root;
		root = null;
	}

	if (!path || /^https?:\/\//i.test(path)) return path;
	if (root) return root.match(/https?:\/\/.+(?=\/(?:\w+\.\w{3,4}.*)?$)|https?:\/\/.+$/i) + "/" + path;
	return location.href.match(/(?:https?:\/\/)?(?:.*(?=\/)|[^/]+)/i) + "/" + path;
}



/*** Retirar acentuações ***

		str: texto para substituir os caracteres acentuados pelo seu correspondenete sem acento :: <string>
		fn: função a ser chamada opcionalmente aopos a conversão :: <string>
		
		return <string>
*/
function filterAccents(str, fn) {
	if (!str) return str;

	str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
	if (fn) str = fn.call(str);

	return str;
}



/*** Retornar codificador de string ***

		charset: identificador do codificador. Padrão 'utf-8' :: ('iso-8859-1' | 'utf-8')
		
		return {encode(input, options), decode(input)}
			input: texto a ser codificado/decodificado
			options: opções do codificador :: {spaceToPlus}
				spaceToPlus: substituir espaços em branco por '+'. Padrão false :: boolean
*/
function encoding(charset) {
	switch (charset) {
		case "iso-8859-1": return {
			encode: (input, options) => {
				input = escape(input).replace(/\+/g, '%2B');
				if (options && options.spaceToPlus) input = input.replace(/%20/g, '+');
				return input;
			},

			decode: (input) => {
				input = input.replace(/\+/g, ' ');
				return unescape(input);
			}
		};
	}

	return { encode: encodeURIComponent, decode: decodeURIComponent };
}


/*** Converter data por extenso para simplificada ***

		s: data por extenso a ser convertida
		
		return <string>
*/
function stringToDate(s) {
	if (!s) return undefined;

	if (m = s.match(/\b(\d{1,2})\s*de\s*([^\s]{3}).*de\s*(\d{4})/i)) {
		let months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
		m[2] = m[2].toLowerCase();
		return ("0" + m[1]).slice(-2) + "/" + ("0" + (months.findIndex((mes) => { return mes == m[2] }) + 1)).slice(-2) + "/" + m[3];
	}

	return undefined;
}



/*** Validar CPF ou CNPJ ***

		cpfj: CPF ou CNPJ a ser validado
		
		return <boolean>
*/
function validateCpfj(cpfj) {
	if (!cpfj) return false;
	cpfj = cpfj.replace(/\D/g, "");

	let sum, i;

	if (cpfj.length == 11) {
		for (i = 0, sum = 0; i < 9; i++) sum += parseInt(cpfj[i]) * (10 - i);
		sum = (sum * 10) % 11;
		sum = sum < 10 ? sum : 0;

		if (parseInt(cpfj[9]) != sum) return false;

		for (i = 0, sum = 0; i < 10; i++) sum += parseInt(cpfj[i]) * (11 - i);
		sum = (sum * 10) % 11;
		sum = sum < 10 ? sum : 0;

		if (parseInt(cpfj[10]) != sum) return false;

		return true;
	}

	if (cpfj.length == 14) {
		if (cpfj.match(/(\d)\1{13}/)) return false;

		for (i = 0, sum = 0; i < 12; i++) sum += parseInt(cpfj[11 - i]) * ((i % 8) + 2);
		sum %= 11;
		sum = sum > 1 ? 11 - sum : 0;

		if (parseInt(cpfj[12]) != sum) return false;

		for (i = 0, sum = 0; i < 13; i++) sum += parseInt(cpfj[12 - i]) * ((i % 8) + 2);
		sum %= 11;
		sum = sum > 1 ? 11 - sum : 0;

		if (parseInt(cpfj[13]) != sum) return false;

		return true;
	}

	return false;
}



/*** Formatar CPF ou CNPJ para o modo legível (separadores) ***

		cpfj: CPF ou CNPJ a ser formatado
		
		return <string>
*/
function cpfjReadable(cpfj) {
	if (!validateCpfj(cpfj)) return "";

	cpfj = cpfj.replace(/\D/g, "");
	if (cpfj.length == 11) return cpfj.substr(0, 3) + "." + cpfj.substr(3, 3) + "." + cpfj.substr(6, 3) + "-" + cpfj.substr(9, 2);
	return cpfj.substr(0, 2) + "." + cpfj.substr(2, 3) + "." + cpfj.substr(5, 3) + "/" + cpfj.substr(8, 4) + "-" + cpfj.substr(12, 2);
}



/*************************/
/* Funções de interface  */
/*************************/



/*** Exibir popup do resultado da validação de elemento ***

		elem: elemento validado :: <element>
		message: mensagem da validação. Padrão elem.validationMessage :: <string>
*/
function tooltipValidation(elem, message) {
	if (!elem) return;
	if (!message) message = elem.validationMessage;
	if (!message) return;

	if (tooltip = $(top.window.document).find('.tooltip').get(0)) tooltip.remove();

	var $tp = $(`<div class="tooltip fade top tooltip-validation" role="tooltip">
				<div class="tooltip-arrow"></div>
				<div class="tooltip-inner"></div>
			   </div>`);

	$tp.find('.tooltip-inner').html(message);

	$(top.window.document.body).append($tp);

	let p = $(elem).offset(); //let p = $(e.currentTarget).position();
	let size = $tp.dimension('outerSize');

	p.top -= size.height;
	p.left += (($(elem).outerWidth() - size.width) / 2);

	$tp.css("left", p.left).css("top", p.top);
	$tp.addClass('in');
	$tp.delay(2500).fadeOut("fast", function () { $tp.remove() });

};



/*** Exibir ou ocultar mensagem de processamento ***

		msg: mensagem a ser exibida. se for null, oculta mensagem de processamento
*/
function waitMessage(msg, options) {
	var doc = window.top.document;
	var container = doc.getElementById("wait-container");

	if (msg) {
		msg = msg.replace(/\\n/g, "\n");
		msg = parseMarkdown(msg).replace(/(?:\@\@([\w\W]*?)(?:\@\@|$))/ig, '<p>$1</p>');

		if (!container) {
			if (!options) options = {};
			let default_options = { loader: true };

			for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] !== undefined && options[prop] == undefined) options[prop] = default_options[prop];


			container = doc.createElement("div");
			container.id = "wait-container";
			container.className = "modal-container";

			var bkgrd = doc.createElement("div");
			bkgrd.className = options.mode === "compact" ? "modal-dlg-background" : "modal-dark-background";

			var content = doc.createElement("div");
			content.className = "wait-message-content";



			if (options.mode === "compact") {
				$(content).html(`<div class="wait-message-dlg"><div id='wait-message'>${msg}</div><div class="loader"><div class='loader-ellipsis'>Loadind...</div></div></div>`);
				if (options.tag) {
					options.tag = options.tag.replace(/\\n/g, "\n");
					options.tag = parseMarkdown(options.tag);
					$(content).find('.wait-message-dlg').prepend(`<div class="wait-message-tag"><div class="wait-message-tag-content">${options.tag}</div></div>`);
				}
			} else $(content).html(`<div id='wait-message'>${msg}</div><div class='loader loader-track'>Loading...</div></div>`);

			if (!options.loader) $(content).find('.loader').css('display', 'none');

			container.appendChild(content);

			$(bkgrd).css("zIndex", 100000);
			$(container).css("zIndex", 100001);

			if (options.backgroundOpacity != undefined) $(bkgrd).css("opacity", (1 - options.backgroundOpacity));
			if (options.backgroundColor != undefined) $(bkgrd).css("background-color", options.backgroundColor);

			doc.body.appendChild(bkgrd);
			doc.body.appendChild(container);
			$(doc.body).addClass('stop-scrolling');
		} else {
			var p_msg = doc.getElementById("wait-message");
			if (p_msg) $(p_msg).html(msg);
		}

	} else {
		if (container) {
			$(container).prev().remove();
			$(container).remove();
			$(doc.body).removeClass('stop-scrolling');
		}
	}
}



/*** Abrir de janela de diálogo ***

		dlg: identificador ou elemento que servirá de base para a janela de diálogo :: <id> | <element>
		options: opções da janela :: {title,
									  icon,
									  buttons,
									  confirmButton, 
									  defaultButton,
									  buttonsAlign,
									  listSeparator, 
									  textAlign,
									  freeDlg, 
									  backgroundOpacity, 
									  backgroundColor, 
									  width, 
									  minwidth, 
									  maxwidth, 
									  height, 
									  minheight, 
									  maxheight,
									  validate, 
									  validation, 
									  alwaysResolve,
									  autofocus}
			title: título da janela. Padrão do atributo 'caption' do dlg :: <string>
			icon: classe com definição do ícone da janela. Padrão <undefined> :: <string>
			buttons: lista de botões da janela :: <string, ...> | [{name, icon, className}, ...]
				<string, ...>: lista de nomes (name[:class]) de botões separados por 'listSeparator'
				name: nome do botão :: <string>
				icon: classe com o icone do botão :: <string>
				className: classe de customização do botão :: <string>
			confirmButton: nome do botão de confirmação. Por padrão é o primeiro :: <string>
			defaultButton: nome do botão padrão que receberá o foco inicial :: <string>
			buttonsAlign: alinhamento dos botões na barra. Padrão 'end' :: ('flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around')
			listSeparator: caracter separador de listas em string. Padrão ',' :: <string>
			textAlign: alinhamento de texto. Padrão undefined :: ('left' | 'right' | 'center' | 'justify')
			freeDlg: excluir elemento base da janela de diálogo após o fechamento. Padrão true :: <boolean>
			backgroundOpacity: opacidade do fundo da janela de diálogo. Padrão undefined :: <number> 
			backgroundColor: cor do fundo da janela de diálogo. Padrão undefined :: <string> 
			width: largura da janela de diálogo. Padrão 'auto' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall') 
			minwidth: largura mínima da janela de diálogo. Padrão 'xs' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall') 
			maxwidth: largura máxima da janela de diálogo. Padrão 'lg' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall')  
			height: altura da janela de diálogo. Padrão 'auto' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall')  
			minheight: altura mínima da janela de diálogo. Padrão 'xs' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall')  
			maxheight: altura máxima da janela de diálogo. Padrão 'lg' :: (<number> | 'auto' | 'lg' = 'large' | 'md' = 'medium' | 'sm' = 'small' | 'xs' = 'xsmall') 
			validate: validar campos. Padrão true :: <boolean> 
			validation: função validadora dos campos. Padrão undefined :: function(target, message)
				target: elemento que deu motivo para a função retornar falso :: <element>
				message: mensagem de erro :: <string>
				return <boolean>
			alwaysResolve: indica que a promise sempre será reolvida independentemente da ação executada. Padrão false :: <boolean>
			autofocus: indica o elemento a receber o foco para edição. Padrão undefined :: <string>
			newWindow: indica que o dialogo será aberto numa nova janela :: <boolean>
			
		return Promise(resolve(action), reject)
			action: ação executada pare resolver a janela
*/
function openDlg(dlg, options) {
	if (!options) options = {};

	//--- aplicação de opções padrões
	let default_options = {
		listSeparator: ",",			// separador para listas em string
		freeDlg: true,				// excluir dialog após fechamento
		validate: true,				// Validar campos
		confirmButton: undefined
	}; 	// identificação do botão de confirmação

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	var doc = window.top.document;

	if (typeof dlg == "string") dlg = doc.getElementById(dlg);
	if (!dlg) return;

	var container = doc.getElementById(dlg.id + "-container");
	if (container) return;

	$(dlg).addClass("modal-dlg");

	//--- criar container
	container = doc.createElement("div");
	container.id = dlg.id + "-container";
	container.className = "modal-container";
	container.style.zIndex = 30001;

	if (!$(doc).find(".modal-dlg").length) {
		$(doc).on('keydown.dlg', event => {
			if ($('#wait-container').length) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}

			if (event.keyCode == 27 || event.which == 27) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				if ($(dlg).find(".modal-dlg-close").attr("disabled")) return false;
				$(dlg).find(".modal-dlg-close").last().trigger("click");
				return false;
			}

			if ((event.keyCode == 13 || event.which == 13) && event.ctrlKey) {
				event.preventDefault();
				event.stopPropagation();
				if ($(dlg).find("button[default]").attr("disabled")) return false;
				$(dlg).find("button[default]").trigger("click");
				return;
			}
		});
	}

	//--- criar sobrefundo transparente
	var bkgrd = doc.createElement("div");
	bkgrd.className = "modal-dlg-background";

	if (options.backgroundOpacity != undefined) $(bkgrd).css("opacity", (1 - options.backgroundOpacity));
	if (options.backgroundColor != undefined) $(bkgrd).css("background-color", options.backgroundColor);

	container.appendChild(bkgrd);

	//--- configurar dialogo
	$(dlg).hide();

	//-- configurar dimensões explícitas do dialogo
	let parse_width = function (w) {
		if (typeof w == "string") {
			if (w == "large" || w == "lg") return "1024px";
			if (w == "medium" || w == "md") return "800px";
			if (w == "small" || w == "sm") return "320px";
			if (w == "xsmall" || w == "xs") return "200px";
		}
		return w;
	};

	let parse_height = function (h) {
		if (typeof h == "string") {
			if (h == "large" || h == "lg") return "768px";
			if (h == "medium" || h == "md") return "600px";
			if (h == "small" || h == "sm") return "240px";
			if (h == "xsmall" || h == "xs") return "120px";
		}
		return h;
	};

	if (!dlg.style.width) {
		if (options.width == undefined || options.width == "auto") {
			$(dlg).css("width", "max-content").css("min-width", parse_width("xs")).css("max-width", parse_width("lg"));
		} else {
			options.width = parse_width(options.width);
			$(dlg).css("width", options.width);
		}
	}

	if (options.minwidth != undefined) $(dlg).css("min-width", parse_width(options.minwidth));
	if (options.maxwidth != undefined) $(dlg).css("max-width", parse_width(options.maxwidth));


	if (!dlg.style.height && !options.height) {
		if (options.height == "auto") {
			$(dlg).css("height", "max-content").css("min-height", parse_height("xs")).css("max-height", parse_height("lg"));
		} else {
			options.height = parse_height(options.height);
			$(dlg).css("height", options.height);
		}
	}

	if (options.minheight != undefined) $(dlg).css("min-height", parse_height(options.minheight));
	if (options.maxheight != undefined) $(dlg).css("max-height", parse_height(options.maxheight));


	//--- disparador do dialog
	dlg.trigger = function (e) {
		let action = (typeof e == "string") ? identityNormalize(e) : $(e.currentTarget).attr("action");

		if (action == options.confirmButton && options.validate) {

			//--- validações dos campos
			for (let elem of $(dlg).find('input,textarea').get()) {
				if (!elem.checkValidity()) {
					$(elem).addClass("form-control-invalid").focus().select();
					$(elem).on("blur.form_control_invalid keypress.form_control_invalid keydown.form_control_invalid click.form_control_invalid", function (e) {
						$(top.window.document).find('.tooltip').remove();
						$(elem).removeClass("form-control-invalid");
						$(elem).off(".form_control_invalid");
					});
					tooltipValidation(elem);
					return;
				}
			}

			if (options.validation) {
				let event_validation = { target: null, message: "Valor do campo inválido" };
				if (options.validation.call(dlg, event_validation) === false) {
					if (event_validation.target && event_validation.message) {
						if ($(event_validation.target).is('.form-control')) $(event_validation.target).addClass("form-control-invalid").focus().select();
						$(event_validation.target).on("blur.form_control_invalid keypress.form_control_invalid keydown.form_control_invalid click.form_control_invalid", function (e) {
							$(top.window.document).find('.tooltip').remove();
							$(event_validation.target).removeClass("form-control-invalid").off(".form_control_invalid");
						});
						tooltipValidation(event_validation.target, event_validation.message);
					}
					return;
				}
			}
		}

		if (options.alwaysResolve) dlg.resolve(action);
		else if (options.buttons.length == 2) {
			if (action == options.confirmButton) dlg.resolve(action);
			else dlg.reject(action);
		} else if (action == "close") dlg.reject(action);
		else dlg.resolve(action);

		//remover anotações de tela 
		$(top.window.document).find('.tooltip').remove();
		$(dlg).find('.form-control-invalid').removeClass('form-control-invalid');

		//ocultar dialig e container
		$(container).hide();
		$(dlg).hide();

		//excluir métodos
		delete dlg.close;
		delete dlg.trigger;
		delete dlg.resolve;
		delete dlg.reject;

		//remover barras de título e botões 
		$(dlg).find('.modal-dlg-title, .modal-dlg-close, .card-dlg-buttons').remove();
		container.removeChild(dlg);
		doc.body.removeChild(container);
		if (!options.freeDlg) {
			doc.body.appendChild(dlg);
			$(dlg).removeClass("modal-dlg");
		}

		if (!$(doc).find(".modal-dlg").length) $(doc).off(".dlg");
	};

	//--- fechador do dialog
	dlg.close = function () {
		dlg.trigger("close");
	};

	//--- criando barra de título
	var titleBar = doc.createElement("div");
	titleBar.className = "modal-dlg-titlebar";

	if (options.icon) {
		var titleIcon = doc.createElement("div");
		titleIcon.className = "modal-dlg-icon " + options.icon;
		titleBar.appendChild(titleIcon);
	}

	let title = options.title || $(dlg).attr("caption");
	if (title) {
		var titleCaption = doc.createElement("div");
		titleCaption.className = "modal-dlg-title";
		$(titleCaption).html(title);
		titleBar.appendChild(titleCaption);
	}

	//--- criar botão de fechar
	var closeBtn = doc.createElement("button");
	closeBtn.className = "modal-dlg-close";
	$(closeBtn).html("&times;").click(dlg.close);
	titleBar.appendChild(closeBtn);


	$(dlg).wrapInner("<div class='modal-dlg-content'></div>");
	dlg.insertBefore(titleBar, dlg.childNodes[0]);

	if (options.textAlign) $(dlg).find(".modal-dlg-content").css("text-align", options.textAlign);


	let start_pos;
	$(titleBar).mousedown((e) => {
		start_pos = { x: e.screenX, y: e.screenY };

		$(doc).mousemove((e) => {
			let actual_pos = { x: dlg.offsetLeft, y: dlg.offsetTop };
			$(dlg).css("left", actual_pos.x + e.screenX - start_pos.x);
			$(dlg).css("top", actual_pos.y + e.screenY - start_pos.y);
			start_pos = { x: e.screenX, y: e.screenY };
		}).mouseup((e) => {
			$(doc).off("mousemove mouseup");
		});

	});

	// -- definir botões quando se especificam os botões padrões de Cancelamento e Confirmação
	if (!options.buttons && (options.cancelButton || options.confirmButton)) {
		options.buttons = [];
		if (options.cancelButton) options.buttons.push(`${options.cancelButton}:cancel`);
		if (options.confirmButton) options.buttons.push(`${options.confirmButton}:confirm`);
	}

	// -- normalizar nome do botão padrão
	if (options.defaultButton) options.defaultButton = identityNormalize(options.defaultButton);


	// -- criar barra de botões 
	if (options.buttons) {
		if (typeof options.buttons == 'string') options.buttons = options.buttons.split(options.listSeparator);

		if (options.confirmButton && options.buttons.length == 1) {
			options.confirmButton = options.buttons[0].replace(/:.*$/, "");
			options.buttons[0] = options.confirmButton + ":confirm";
		}

		if (options.cancelButton && !options.buttons.find(b => b.indexOf(options.cancelButton) == 0)) options.buttons.unshift(`${options.cancelButton}:cancel`);
		if (options.confirmButton && !options.buttons.find(b => b.indexOf(options.confirmButton) == 0)) options.buttons.push(`${options.confirmButton}:confirm`);

		var divButtons = doc.createElement("div");
		divButtons.className = "modal-dlg-buttons";

		options.buttons.forEach(b => {
			var btn = doc.createElement("button");

			if (typeof b == "string") {
				let cls = "";
				b = b.replace(/([^:]+):(.+)/, (m0, m1, m2) => {
					cls = " btn-" + m2;
					if (m2 == "confirm" && !options.confirmButton) options.confirmButton = m1;
					else if (m2 == "cancel" && !options.cancelButton) options.cancelButton = m1;
					return m1;
				});

				$(btn).text(b).attr("action", identityNormalize(b)).addClass("btn btn-md btn-default" + cls);
			} else $(btn).text(b.name).attr("action", identityNormalize(b.action)).addClass("btn btn-md " + b.className);

			if (options.defaultButton == identityNormalize($(btn).text())) $(btn).attr("default", true);

			divButtons.appendChild(btn);
		});


		$(divButtons).find("button").click(dlg.trigger);

		if (options.buttonsAlign) $(divButtons).css("justify-content", options.buttonsAlign);
		dlg.appendChild(divButtons);

		if (!options.defaultButton) {
			$(dlg).find('.modal-dlg-buttons button').on('focus.focus-button', e => {
				e.preventDefault();
				$(e.currentTarget).blur();
				$(dlg).find('.modal-dlg-buttons button').off('.focus-button');
			});
		}
	}

	// --- normalizar botões padrões de Cancelamento e Confirmação
	if (options.confirmButton) options.confirmButton = identityNormalize(options.confirmButton);
	if (options.cancelButton) options.cancelButton = identityNormalize(options.cancelButton);


	//--- inserir dialog no container
	if (dlg.parentNode) dlg.parentNode.removeChild(dlg);
	container.appendChild(dlg);

	//--- adicionar container no corpo
	doc.body.appendChild(container);

	//--- setar posição do dialogo
	$(dlg).css("top", ((container.offsetHeight - $(dlg).outerHeight(true)) / 2) + "px");
	$(dlg).css("left", ((container.offsetWidth - $(dlg).outerWidth(true)) / 2) + "px");
	dlg.style.visibility = "visible";
	$(dlg).fadeIn("fast");


	//--- selecionar primeiro campo marcado como autofocus ou editável
	let elem_focus;
	if (options.autofocus) $(options.autofocus).focus().select();
	else if (elem_focus = $(dlg).find('input,select,button:not(.modal-dlg-close),[contenteditable=true], textarea').first().focus().select().get(0))
		if (elem_focus instanceof HTMLButtonElement && options.buttons.length == 1) elem_focus.focus();

	//--- se função de tratamento de retorno não definido, retornar uma promise;
	return new Promise((resolve, reject) => {
		dlg.resolve = resolve;
		dlg.reject = reject;
	});
}



/*** Interpretar script markdown ***

		text: script com a sintaxe markdown :: <string>
			**conteúdo** 		 --> <strong>conteúdo</strong>
			__conteúdo__ 		 --> <em>conteúdo</em>
			~~conteúdo~~ 		 --> <del>conteúdo</del>
			``conteúdo`` 		 --> <code>conteúdo</code>
			<<conteúdo>> 		 --> <kdb>conteúdo</kbd>
			![alternativo]imagem --> <img src="imagem" alt="alternativo">
			[texto]url			 --> <a href="url" target="_blank">texto</a>
			%%value%%			 --> <progress value="x" max="100"> x% </progress>
			#título				 --> <h1>título</h1>
			##título			 --> <h2>título</h2>
			###título			 --> <h3>título</h3>
			---					 --> <hr>
		
		return <string>
*/
function parseMarkdown(text) {
	if (!text) return "";
	text = text.replace(/\*\*([^\s].*?[^\s]|[^\s])\*\*/g, "<strong>$1</strong>");
	text = text.replace(/__([^\s].*?[^\s]|[^\s])__/g, "<em>$1</em>");
	text = text.replace(/~~([^\s].*?[^\s]|[^\s])~~/g, "<del>$1</del>");
	text = text.replace(/``([^\s].*?[^\s]|[^\s])``/g, "<code>$1</code>");
	text = text.replace(/<<([^\s].*?[^\s]|[^\s])>>/g, "<kbd>$1</kbd>");
	text = text.replace(/%%([^\s].*?[^\s]|[^\s])%%/g, "<progress value='$1' max='100'>$1%</progress>");
	text = text.replace(/!\[(.*?)\]\(((?:([^:]+):\/\/)?(.*?))\)/gi, (m0, text, source, proto, value) => {
		if (!proto) return `<img src="${source}" alt="${text}" class="markdown-img">`;
		switch (proto.toLowerCase()) {
			case "extension": return `<img src="${browser.runtime.getURL(value)}" alt="${text}" class="markdown-img">`;
			case "class": return `<div class="markdown-div ${value}" title="${text}" />`;
			default: return `<img src="${source}" alt="${text}" class="markdown-img">`;
		}
	});
	text = text.replace(/[^!]\[(.*?)\]\((.*?)\)/g, (m0, m1, m2) => {
		return ` <a href="${m2}" target="_blank">${m1 ? m1 : m2}</a>`;
	});

	text = text.replace(/^\s*(#+)\s*([^#]*)\s*\1?\s*$/gm, (m0, m1, m2) => {
		return `<h${m1.length}>${m2}</h${m1.length}>`;
	});

	text = text.replace(/\n\s*-{3,}\s*(?:\n|$)/g, "<hr>");

	text = text.replace(/^(?:\s*\|.+\|\n)+/mg, (table) => {
		let result = "<table>";

		const regex_rows = /^\s*\|(.*)\|/gm;
		let m_row, rows = [], aligns, row;

		while (m_row = regex_rows.exec(table)) {
			if (m_row.index === regex_rows.lastIndex) regex_rows.lastIndex++;
			let cols = m_row[1].split("|");

			if (cols && cols.length) {
				if (!aligns && m_row[1].match(/^[:\-|]+$/)) aligns = cols;
				else rows.push(cols);
			}
		}

		if (aligns) {
			aligns = aligns.map((align) => {
				if (align.endsWith(":")) {
					if (align.startsWith(":")) return ' style="text-align:center;"';
					else return ' style="text-align:right;"';
				} else if (align.startsWith(":")) return ' style="text-align:left;"';
				else return '';
			});


			result += "<thead><tr>";
			row = rows.shift();
			row.forEach((col, index) => {
				result += "<th";
				if (index < aligns.length) result += aligns[index];
				result += ">" + col + "</th>";
			});
			result += "</tr></thead>";
		}

		if (rows.length) {
			result += "<tbody>";

			while (row = rows.shift()) {
				result += "<tr>";
				row.forEach((col, index) => {
					result += "<td";
					if (index < aligns.length) result += aligns[index];
					result += ">" + col + "</td>";
				});
				result += "</tr>";
			}

			result += "</tbody>";
		}

		result += "</table>";

		return result;

	});

	text = text.replace(/^-(.*)(?:\n|$|\\n)/gm, "<ul><li>$1</li></ul>");

	text = text.replace(/\n/g, "<br>").replace(/\t/g, "");

	return text;
}



/*** Converver string em opções de diálogos

		settings: string a ser convertida

		return Options::<object>
		
*/
function stringToDlgOptions(settings) {
	if (!settings || typeof settings !== "string") return {};

	var options = {};

	// --- tamanhos
	settings = settings.replace(/(?:\s|^)([wh]):(xsmall|xs|small|sm|medium|md|large|lg)(?=\s|$)/g, (m0, dimension, size) => {
		if (dimension == "w") options.width = size;
		else options.height = size;
		return "";
	});

	// --- switchs
	settings = settings.replace(/(?:\s|^)(alwaysResolve)(?=\s|$)/g, (m0, prop) => {
		options[prop] = true;
		return "";
	});

	//--- botões
	var last_btn;
	settings = settings.replace(/\[(\*)?(([^\[\]:]*)(?::(.*?))?)\]/g, (m0, btn_default, btn, btn_name, btn_class) => {
		if (!options.buttons) options.buttons = [];

		last_btn = btn_name;
		if (btn_default) options.defaultButton = btn_name;

		if (btn_class === "confirm") options.confirmButton = btn_name;
		else if (btn_class === "cancel") options.cancelButton = btn_name;

		options.buttons.push(btn);

		return "";
	});

	if (options.buttons && options.buttons.length == 1 && !options.defaultButton) options.defaultButton = options.buttons[0];

	//--- title
	settings = settings.trim();
	if (settings) options.title = settings;

	return options;
}



/*** Exibir mensagem popup ***

		msg: mensagem a ser exibida :: <string>
		title: título da janela. Padrão undefined :: <string>
		options: opções da janela popup :: <openDlg>
		
		return Promise
*/
function popupMessage(msg, title, options) {
	if (!msg) return;

	if (typeof title == "object") {
		options = title;
		title = undefined;
	} else if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};
	else if (typeof options == "string") options = stringToDlgOptions(options);

	var default_options = {
		title: title ? title : "Mensagem", 	// título do popup
		buttons: "OK", 					// rótulo do botão do popup
		buttonsAlign: "center", 			// alinhamento dos botões
		textAlign: "center"
	};			// alinhamento da mensagem de texto

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	var doc = window.top.document;
	var dlg = doc.createElement("div");

	$(dlg).css("text-align", "center");

	dlg.id = "popup-dlg";

	msg = msg.replace(/\\n/g, "\n");
	msg = parseMarkdown(msg).replace(/(?:\@\@([\w\W]*?)(?:\@\@|$))/ig, '<p class="modal-dlg-paragraph">$1</p>');
	$(dlg).html(msg);

	return openDlg(dlg, options);
}



/*** Exibir mensagem de erro ***

		msg: mensagem a ser exibida :: <string>
		title: título da janela. Padrão "Erro" :: <string>
		options: opções da janela popup :: <=openDlg>
		
		return Promise
*/
function errorMessage(msg, title, options) {
	if (!msg) return;

	if (typeof title == "object") {
		options = title;
		title = undefined;
	} else if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};
	else if (typeof options == "string") options = stringToDlgOptions(options);

	var default_options = {
		title: title ? title : "Erro", 		// título da mensagem de erro
		icon: "modal-dlg-icon-error",	// ícone do popup 
		buttons: "OK", 					// botões do popup
		buttonsAlign: "center", 			// alinhamento dos botões
		textAlign: "center"
	};			// alinhamento da mensagem de erro

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];
	return popupMessage(msg, title, options);
}



/*** Exibir mensagem de informação ***

		msg: mensagem a ser exibida :: <string>
		title: título da janela. Padrão "Informação" :: <string>
		options: opções da janela popup :: <=openDlg>
		
		return Promise
*/
function infoMessage(msg, title, options) {
	if (!msg) return;

	if (typeof title == "object") {
		options = title;
		title = undefined;
	} else if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};
	else if (typeof options == "string") options = stringToDlgOptions(options);

	var default_options = {
		title: title ? title : "Informação",	// título da mesnagem de informação
		icon: "modal-dlg-icon-info",		// ícone do popup
		buttons: "OK", 					// botões do popup
		buttonsAlign: "center", 			// alinhamento dos botões
		textAlign: "center"
	};			// alinhamento da mensagem

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];


	return popupMessage(msg, title, options);
}



/*** Exibir mensagem de confirmação ***

		msg: mensagem a ser exibida :: <string>
		title: título da janela de confirmação. Padrão "Confirmação" :: <string>
		options: opções da janela de confirmação :: <openDlg> | <string>
			<number>: informa a largura da janela de confirmação
			<string>: especifica várias opções numa única string :: 'widths returns buttons'
				widths: largura da janela de confrmação :: ('sm' = 'small' | 'md' = 'medium' | 'lg' = 'large')
				returns: indica se o resultado será booleano :: ('boolean' | 'bool')
				buttons: botões da janela de confirmação :: nome_do_botão[:(cancel|confirm)][,nome_do_botão[:(cancel|confirm)], ...]
		
		return Promise
*/
function confirmMessage(msg, title, options) {
	if (!msg) return;

	if (typeof title == "object") {
		options = title;
		title = undefined;
	} else if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};
	else if (typeof options == "string") options = stringToDlgOptions(options);

	var default_options = {
		title: title ? title : "Confirmação",	// título da mensagem de confirmação
		icon: "modal-dlg-icon-conf",			// ícone do popup
		confirmButton: "Sim",				// botão de confirmação
		cancelButton: "Não",					// botão de negação
		buttonsAlign: "center", 				// alinhamento dos botões
		maxwidth: "md",						// largura máxima do popup
		textAlign: "center"
	};				// alinhamento da mensagem

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];


	var doc = window.top.document;
	var dlg = doc.createElement("div");

	if (!options) options = {};

	$(dlg).css("text-align", "center");

	dlg.id = "confirm-dlg";

	msg = msg.replace(/\\n/g, "\n");
	msg = parseMarkdown(msg).replace(/(?:\@\@([\w\W]*?)(?:\@\@|$))/ig, '<p class="modal-dlg-paragraph">$1</p>');
	$(dlg).html(msg);

	if (options.alwaysResolve) return openDlg(dlg, options).then(a => options.buttons.length == 2 ? a == options.confirmButton : a);
	return openDlg(dlg, options);
}



/*** Exibir janela de processamento ***

		title: título da janela de processamento. Padrão "Processamento" :: <string>
		options: opções da janela de confirmação :: <openDlg> + {size}
			size: define ao mesmo tempo a largura e a altura :: ('sm' = 'small' | 'md' = 'medium' | 'lg' = 'large')
		
		return <dialog>
			.add(text, status): adicionar processo 
				text: texto a ser adicionado
				status: ('idle' | 'running' | 'success' | 'fail')
				return <process>
					.success(text)
					.fail(text)
			.del(id): deletar processo
				proc: identificador do processo :: <process> | <index> | <last>
			.clear(): excluir todos os processos
			.start(text): iniciar novo processo
			.finish(text): finalizar processamento
			.success(text): concluir último processo com sucesso
			.fail(text): concluir último processo com falha
			.text: retornar ou alterar texto do último processo
			.status: retornar ou alterar status do último processo
			
*/
function openProcessDlg(title, options) {

	if (typeof title == "object") {
		options = title;
		title = undefined;
	} else if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};
	else if (typeof options == "string") options = stringToDlgOptions(options);

	var default_options = {
		title: title ? title : "Processamento",	// título do popup de processamento
		icon: "modal-dlg-icon-proc",			// ícone do popup
		buttons: "OK",						// botão de popup
		buttonsAlign: "center", 				// alinhamento dos botões
		width: "md",							// largura do popup
		height: "md",						// altura do popup
		maxwidth: "md",						// largura máxima do popup
		textAlign: "center"
	};				// alinhamento da mensagem

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	var doc = window.top.document;
	var dlg = doc.createElement("div");

	$(dlg).css("text-align", "center");
	$(dlg).append('<ul class="process-list" />');

	openDlg(dlg, options);

	var format_text = text => parseMarkdown(text).replace(/\n|\\n/g, "").replace(/\s/g, "&nbsp;");
	var text_property = { get: function () { return $(this).text() }, set: function (value) { $(this).html(format_text(value)) } };
	var status_property = {
		get: function () { return $(this).attr("status") }, set: function (value) {
			value = value.toLowerCase();

			if (value == $(this).attr("status")) return;

			$(this).attr("status", value);

			if (value != "running" && value != "loading") $(this).addClass("process-item-stopped");
			else $(this).removeClass("process-item-stopped");
			$(this).hide().show(0);
		}
	};

	var fail = function (text) {
		this.status = "fail";

		if (text && typeof text != "string") text = "";
		$(this).attr('error-message', text);
	};

	var warning = function (text) {
		this.status = "warning";

		if (text && typeof text != "string") text = "";
		$(this).attr('warn-message', text);
	};

	var success = function (text) {
		this.status = "success";
		if (text && typeof text != "string") text = "";
		if (text) this.text = text;
	};

	//--- adicionar processo no acompanhador de processos
	dlg.add = function (text, status) {
		let li = $('<li class="process-item" />').html(format_text(text)).get(0);

		Object.defineProperty(li, "text", text_property);
		Object.defineProperty(li, "status", status_property);

		li.status = status;

		$(dlg).find('.process-list').append(li);
		li.fail = fail;
		li.success = success;
		li.warning = warning;

		li.scrollIntoView();
		return li;
	};

	dlg.del = function (i) {
		if (typeof i == "number") $(dlg).find('.process-item').get(i).remove();
		else if (i != undefined && $(i).is(".process-item")) $(i).remove();
		else $(dlg).find('.process-item').last().remove();
	};

	dlg.clear = function () {
		$(dlg).find('.process-list').html("");
		$(dlg).find('button[action=ok]').hide().attr("disabled", true);;
		$(dlg).find(".modal-dlg-close").attr("disabled", true);
	};

	dlg.start = function (text) {
		return dlg.add(text, "running");
	};

	dlg.finish = function (text) {
		$(dlg).find('button[action=ok]').attr("disabled", false).fadeIn();
		$(dlg).find(".modal-dlg-close").attr("disabled", false);

		if (text) {
			dlg.close();
			popupMessage(text, title);
		}
	};

	dlg.success = function (text) {
		var proc = $(dlg).find('.process-item').last().get(0);
		if (proc) proc.success(text);
		return true;
	};

	dlg.fail = function (text) {
		var proc = $(dlg).find('.process-item').last().get(0);
		if (proc) proc.fail(text);
		return false;
	};

	dlg.warning = function (text) {
		var proc = $(dlg).find('.process-item').last().get(0);
		if (proc) proc.warning(text);
		return true;
	};

	Object.defineProperty(dlg, "text", { get: () => $(dlg).find('.process-item').last().text(), set: value => $(dlg).find('.process-item').last().html(format_text(value)) });
	Object.defineProperty(dlg, "status", { get: () => $(dlg).find('.process-item').last().attr("status") });

	dlg.clear();

	return dlg;
}



/*** Exibir janela de formulário ***

		fields: lista de campos do formulário :: [<field> | <row-fields> | <group-fields> | <nested-fields> | <tab-fields>, ...]
			<field>: objeto especificador de campo :: {id, type, label, value, width, readonly, required, autofocus, shortcut, visibility, <atributos-específicos>}
				id: identificador do campo :: <string>
				type: tipo do campo :: (number|text|password|static|radio|check|textarea|date|select|hidden|button)
					number: tipo numérico. Atributos específicos:
						- max: valor numérico máximo :: <number>
						- min: valor numérico mínimo :: <number>
						- step: passo de incremento e decremento do valor numérico :: <number>
					text: tipo texto. Atributos específicos:
						- max: numero máximo de caracteres :: <number>
						- upper: transform valor para letras maiúsculas :: <boolean>
						- items: lista de sugestões para preenchimento do campo :: <string, ...> | [<string, ...>]
					password: tipo senha. Atributos específicos:
						- max: numero máximo de caracteres :: <number>
					static: tipo estático. Atributo específico:
						- value: texto com o conteúdo do campo estático :: <string>
						- text: texto que é exibido no campo estático :: <string>
					radio:  tipo radiobutton. Atributos específicos:
						- items: lista de itens do campo :: <string, ...> | [<string, ...>]
						- value: índice do radio selecionado :: <number>
						- vertical: informa se é uma lista vertical :: <boolean>
					check: tipo caixa de checagem. Atributo específico:
						- value: valor do campo :: <boolean>
					textarea: tipo caixa de texto. Atributos específicos:
						- cols: número de colunas :: <number>
						- rows: número de linhas :: <number>
						- intellisense: opções do intellisense :: <vide intellisense>
					date: tipo data. Atributos específicos:
						- min: data mínima :: <string> | <date>
						- max: data máxima :: <string> | <date>
					select: tipo caixa de seleção. Atributo específico:
						- items: lista de itens do campo :: <string, ...> | [<string, ...>]
					hidden: tipo oculto
					button: botão
						- onclick: função para tratar click do botão 
				label: rótulo externo de descrição do campo :: <string>
				title: texto de ajuda do campo :: <string>
				placeholder: rótulo interno de descrição do campo :: <string>
				value: valor do campo :: <de acordo com o tipo>
				width: largura do campo :: <number> | <string>
				readonly: indica se o campo é de apenas leitura :: <boolean>
				required: indica se o campo é obrigatório :: <boolean>
				group: identificado do grupo de campos :: <string>
				nest: cadeia de campos :: string
				nobr: indica que permite o próximo campo na mesma linha :: <boolean>
				validation: validação do campo :: <RegExp> | <string>
				message: mensagem caso a validação falhe
				autofocus: indica que o campo deve receber o foco inicial :: <boolean>
				visibility: expressão para determinar vibilidade do campo dinamicamente. Referenciar outros compos por $<id> :: <string>
				shortcut: configuração de tecla de atalho :: {key, callback}
					key: identificar da tecla de atalho :: <string>
					callback: função chamada quando a tecla de atalho é pressionada
				dropdown: configuração da lista de seleção do campo :: {source, max, populating, class, selected}
					button: botão de exibição do dropdown :: <boolean> | <html>
					source: Origem dos itens a serem exibidos no dropdown :: <function> | <array> | <string_with_separator> | {url, type, key}
						- url: endereço da informação remota
						- type: formato: json | xml
						- key: chave a ser exibida
					max: Número máximo de itens exibidos no dropdown
					class: Nome de classe CSS para customização de exibição
					onselect: Função chamada após seleção do item
				icons: array de icones clicáveis ou não :: [<icon>, ...]
			<icon>: icone :: {icon, title, onclick}
				icon: icone de exibição :: <string> | <html>
				title: texto de ajuda
				onclick: quando clicável, função de tratamento do click
			<row-fields>: array de campos que serão dispostos na mesma linha :: [<field>, ...]
			<group-fields>: grupo de campos :: {group, fields}
				group: identificador do grupo :: <string>
				fields: array de campos :: [<field>, ...]
			<tab-fields>: aba de campos :: {tab, fields}
				tab: identificador da aba :: <string>
				fields: array de campos :: [<field>, ...]
		title: título da janela de processamento. Padrão "Formulário" :: <string>
		options: opções da janela de formulário :: <openDlg>
		
		return Promise
*/
function openFormDlg(fields, title, options, validation) {
	if (!fields) return null;
	if (!Array.isArray(fields)) fields = [fields];

	//--- ajuste de argumentos da função
	if (typeof title == 'function') {
		validation = title;
		title = undefined;
		options = undefined;
	} else if (typeof title == "object") {
		validation = options;
		options = title;
		title = undefined;
	}

	if (typeof options == 'function') {
		validation = options;
		options = undefined;
	} else if (typeof options == 'string') options = stringToDlgOptions(options);

	if (typeof validation != "function") validation = undefined;

	if (typeof title == "string" && !options) {
		options = stringToDlgOptions(title);
		title = undefined;
	}

	if (!options) options = {};

	if (!options.confirmButton && options.buttons && options.buttons.length == 1) options.confirmButton = options.buttons[0];

	//--- aplicação de opções padrões
	var default_options = {
		title: title ? title : "Formulário",	// título da janela
		icon: "modal-dlg-icon-form",		// ícone padrão	
		cancelButton: "Cancelar", 		// rótulo do botão cancelar
		confirmButton: "OK", 			// rótulo do botão de confirmação
		nullable: true,					// Se retorna valor nulo quando cancelado
		listSeparator: ","
	};				// separador para listas em string



	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] != undefined && options[prop] == undefined) options[prop] = default_options[prop];

	//--- expandir lista de campos
	let i = 0, title_groups = {}, title_tabs = {};
	while (i < fields.length) {
		if (Array.isArray(fields[i])) {
			fields[i].forEach((item, index) => {
				if (item.id) {
					if (index) item.nobr = true;
					item.group = fields[i].group;
				}
			});
			fields.splice(i, 1, ...fields[i]);
		} else if (fields[i].group && Array.isArray(fields[i].fields)) {
			let group_id = identityNormalize(fields[i].group);
			if (!title_groups[group_id]) title_groups[group_id] = fields[i].text ? fields[i].text : fields[i].group;
			fields[i].fields.forEach(item => { item.group = group_id });
			fields.splice(i, 1, ...fields[i].fields);
		} else if (fields[i].tab && Array.isArray(fields[i].fields)) {
			let tab_id = identityNormalize(fields[i].tab);
			if (!title_tabs[tab_id]) title_tabs[tab_id] = fields[i].text ? fields[i].text : fields[i].tab;
			fields[i].fields.forEach(item => { item.tab = tab_id });
			fields.splice(i, 1, ...fields[i].fields);
		} else if (fields[i].nest && Array.isArray(fields[i].fields)) {
			if (fields[i].fields.length) {
				fields[i].fields[0].label = fields[i].label ?? fields[i].fields[0].label;
				fields[i].fields[0].dropdown = fields[i].dropdown;
			}
			fields[i].fields.forEach((item, index) => {
				item.nobr = item.nobr ?? (index > 0);
				item.nest = true;
			});
			fields.splice(i, 1, ...fields[i].fields);
		} else i++;
	}

	//--- usar mensagem de confirmação quando único campo for um checkbox
	if (fields.length == 1 && fields[0].type == "check") {
		options.buttons = null;
		options.confirmButton = null;
		options.cancelButton = null;
		return confirmMessage(fields[0].label + "?", options.title, options).then(result => { return { [fields[0].id]: result } });
	}

	//--- funções internas e classes internas
	var get_field_value = f => {

		if (!f || f.nodata || f.type == "button") return undefined;

		let r, value = null;

		if (f.type == "radio") value = (r = f.items.find(e => e.checked)) && (r.hasAttribute("value") ? $(r).attr('value') : f.items.indexOf(r));
		else value = f.type == "check" ? f.elem.checked : f.type == "date" ? $(f.elem).val().replace(/(\d{4})-(\d{1,2})-(\d{1,2})/i, "$3/$2/$1") : $(f.elem).val();

		if (f.type == "text" && f.upper && value) value = value.toUpperCase();

		if (f.type == "number") value = Number(value);

		return value;
	};

	var FieldInput = function (__field) {
		var field = __field;

		Object.defineProperty(this, "value", {
			get: function () { return get_field_value(field) },
			set: function (v) {
				if (!field || field.nodata || field.type == "button") return;

				switch (field.type) {
					case "radio":
						let r;
						if (Number.isInteger(v) && v < field.items.length) field.items[v].checked = true;
						else if (r = field.items.find(e => e.hasAttribute("value") && $(e).attr('value') == v)) r.checked = true;
						return;

					case "check":
						if (typeof v == 'string') v = v && (v !== 'false');
						field.elem.checked = v;
						return;

					case "date":
						if (typeof v == 'string') v = v.toDate();
						break;

					case "number":
						v = Number(v);
						break;

					default:
						if (field.upper) v = v.toUpperCase();
				}
				$(field.elem).val(v);
			}
		});

		if (field.type == "static") {
			Object.defineProperty(this, "text", {
				get: function () { return $(field.elem).html() },
				set: function (v) { $(field.elem).html(v) }
			});
		}

		Object.defineProperty(this, "element", {
			get: function () { return field.elem }
		});
	};

	var clickEventHandler = function (e) {
		let f = e.currentTarget.field;
		let callback = f.onclick || e.currentTarget.click_callback;
		if (!callback || typeof callback != 'function') return;

		e.dlg = dlg;
		e.inputs = fields.reduce((m, f) => {
			if (f.nodata || f.type == 'button') return m;
			m[f.id] = new FieldInput(f);
			return m;
		}, {});

		e.openDropdown = () => new Promise((resolve, reject) => {
			let owner = e.currentTarget.closest('.form-field');
			if (owner.dropdown) owner.dropdown.open(resolve);
			else reject();
		});

		callback(e);
	};


	//--- criação do formulário
	var doc = window.top.document;
	var dlg = doc.createElement("div");
	dlg.id = "div-form-dlg";
	$(dlg).addClass("modal-dlg-form");

	let row, $divf, first_elem, last_group = undefined, container = dlg, has_field_validation = false, has_field_visibility = false, last_nest = undefined;
	for (let f of fields) {
		if (typeof f == "string") {
			if (f.match(/\s*-+\s*/)) f = fields[fields.indexOf(f)] = { type: "hr" };
		}

		if (f.type == "hr") f.nodata = true;

		if (f.nodata) {
			switch (f.type) {
				case "hr": $(container).append("<hr>"); break;
			}
			continue;
		}

		if (f.type == "hidden") {
			f.elem = $('<input type="hidden">').get(0);
			$(f.elem).val(f.value ?? '');
			$(container).append(f.elem);
			continue;
		}

		if (!f.nobr || !row || last_group != f.group) {
			row = $('<div class="form-row"></div>').get(0);

			if (last_group != f.group) {
				if (f.group) {
					let grp = $(`<div class="form-group" group="${f.group}" text="${title_groups[f.group] ? title_groups[f.group] : f.group}"></div>`).get(0);
					if ($(container).is('.form-group')) container = container.parent;
					$(container).append(grp);
					container = grp;
				} else container = container.parent;

				last_group = f.group;
			}

			$(container).append(row);
		}

		if (!f.nest || f.nest != last_nest) {
			$divf = $('<div class="form-field" />');
			$(row).append($divf);

			if (f.type == "check" && f.label && !f.text) {
				f.text = f.label;
				f.label = null;
			}

			if (f.label && f.type != 'button') $divf.append(`<label for="${dlg.id}-${f.id}">${f.label}</label>`);
			last_nest = f.nest;
		}

		if ((f.nest || (f.dropdown && f.dropdown.button)) && !$divf.is('.form-control-nest')) $divf.append($divf = $('<div class="form-control-nest" />'));

		if (typeof f.items == "string") f.items = f.items.split(options.listSeparator);

		switch (f.type) {
			case "number":
				f.elem = $(`<input type="number" class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`).get(0);
				if (f.max != undefined) $(f.elem).attr("max", f.max);
				if (f.min != undefined) $(f.elem).attr("min", f.min);
				if (f.step != undefined) $(f.elem).attr("step", f.step);
				break;

			case "text":
				f.elem = $(`<input type="text" class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`).get(0);
				if (f.max != undefined) $(f.elem).attr("maxlength", f.max);
				if (f.upper) $(f.elem).css("text-transform", "uppercase");

				if (f.items) {
					let datalist = doc.createElement("datalist");
					datalist.id = `${f.id}-list`;

					for (let i = 0; i < f.items.length; i++) {
						let opt = doc.createElement("option");
						opt.value = f.items[i];
						datalist.appendChild(opt);
					}

					$(f.elem).attr("list", datalist.id);
					$divf.append(datalist);
				}
				break;

			case "password":
				f.elem = $(`<input type="password" class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`).get(0);
				if (f.max != undefined) $(f.elem).attr("maxlength", f.max);
				break;

			case "static":
				f.elem = $(`<span class="form-control static" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />`).get(0);
				if (f.text || f.value) $(f.elem).text(f.text ?? f.value);

				break;

			case "radio":
				if (typeof f.items == "string") f.items = f.items.split(options.listSeparator);
				for (let i = 0; i < f.items.length; i++) {
					let input = doc.createElement("input");
					$(input).attr("type", "radio").prop("name", f.id);
					if (f.width) $(input).css("width", f.width);
					let mri = f.items[i].match(/(\w+)\s*=\s*(.*)\s*/);
					if (mri) {
						$(input).prop("value", mri[1]);
						f.items[i] = mri[2];
						if (f.value != undefined) input.checked = (f.value == mri[1]);
					} else if (f.value != undefined) input.checked = (f.value == i);
					let $wrap_div = $('<div class="radio" />');
					if (f.vertical) $wrap_div.addClass("vertical");

					$wrap_div.append(input);
					$wrap_div.append(f.items[i]);
					$divf.append($wrap_div);
					f.items[i] = input;
				}
				break;

			case "check":
				f.elem = $(`<input type="checkbox">`).get(0);
				f.elem.checked = (f.value === "true" | f.value === true);
				break;

			case "textarea":
				f.elem = $(`<textarea class="form-control" rows="${f.rows}" cols="${f.cols}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>`).get(0);
				if (f.intellisense) enableIntellisense(f.elem, f.intellisense);
				break;

			case "date":
				f.elem = $(`<input type="date" class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`).get(0);
				f.value = f.value && (typeof f.value == "string" || f.value instanceof Date) ? f.value.toDateDB() : "";

				if (f.min != undefined) {
					if (typeof f.min == "string") f.min = (md = f.min.match(/^\s*(\d{1,2})\/(\d{2})\/(\d{4})\s*$/)) ? `${md[3]}-${md[2]}-${md[1]}` : null;
					if (f.min instanceof Date) f.min = `${f.min.getFullYear()}-${f.min.getMonth()}-${f.min.getDate()}`;
					if (f.min) $(f.elem).attr("min", f.min);
				}

				if (f.max != undefined) {
					if (typeof f.max == "string") f.max = (md = f.max.match(/^\s*(\d{1,2})\/(\d{2})\/(\d{4})\s*$/)) ? `${md[3]}-${md[2]}-${md[1]}` : null;
					if (f.max instanceof Date) f.max = `${f.max.getFullYear()}-${f.max.getMonth()}-${f.max.getDate()}`;
					if (f.max) $(f.elem).attr("max", f.max);
				}

				break;

			case "select":
				f.elem = $(`<select class="form-control" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`).get(0);
				if (f.items) {
					f.items.forEach(item => {
						item = item.split("=");
						if (item.length > 1) $(f.elem).append(`<option value="${item[0]}">${item[1]}</option>`);
						else $(f.elem).append(`<option>${item[0]}</option>`);
					});
				}

				break;

			case "button":
				f.elem = $(`<button class="form-control-btn">${f.caption ?? '...'}</button>`).get(0);
				f.elem.onclick = clickEventHandler;
				break;
		}

		if (f.elem) f.elem.field = f;

		if (f.autofocus && !options.autofocus && f.elem) options.autofocus = f.elem;

		if (f.type != "radio") {
			if (f.width) $(f.elem).css("width", f.width);
			if (f.readonly != undefined) f.elem.readOnly = f.readonly;
			if (f.required != undefined) f.elem.required = f.required;
			if (f.placeholder) $(f.elem).attr("placeholder", f.placeholder);
			if (f.title) $(f.elem).attr("title", f.title);

			if (f.shortcut) {
				$(f.elem).on('keydown', (e) => {
					if (e.key == f.shortcut.key) {
						e.preventDefault();
						e.stopPropagation();
						f.shortcut.callback(f.elem);
						return;
					}
				});
			}



			if (f.type == 'text' && f.icons) {
				let container = document.createElement('div');
				container.classList.add("form-control-iconed");
				$divf.append(container);

				container.appendChild(f.elem);
				container.appendChild(container = $('<div style="width:0;"></div>').get(0));
				container.appendChild(container = document.createElement('div'));
				container.classList.add("form-control-iconsbar");

				for (let item of f.icons) {
					let icon = document.createElement('span');
					icon.classList.add('form-control-icon');
					icon.field = f;
					icon.innerHTML = item.icon ?? '...';
					if (item.title) icon.setAttribute('title', item.title);
					if (item.onclick) {
						icon.click_callback = item.onclick;
						icon.onclick = clickEventHandler;
						icon.style.cursor = "pointer";
					}
					container.appendChild(icon);
				}

			} else $divf.append(f.elem);

			if (f.dropdown) {

				if (f.dropdown.button) {
					let button = document.createElement('button');
					button.classList.add("form-control-btn");
					button.innerHTML = typeof f.dropdown.button == "string" ? f.dropdown.button : '<svg viewBox="0 0 19 20" style="width:12px;height:12px;"><path fill="currentColor" d="m3.8 6.7 5.7 5.7 5.7-5.7 1.6 1.6-7.3 7.2-7.3-7.2 1.6-1.6z"></path></svg>';
					button.field = f;
					$divf.append(button);
					button.onclick = e => e.currentTarget.closest('.form-field').dropdown.open();
				}

				let dropdown_container = $divf.is('.form-control-nest') ? $divf.closest('.form-field').get(0) : $divf.get(0);
				let $dropdown = $(`<div class="form-control-dropdown slipeDown" />`);
				let $ul = $('<ul />');

				$dropdown.append($ul);

				$(dropdown_container).append($dropdown);

				dropdown_container.dropdown = new function (owner, target, settings) {
					this.owner = owner;
					target.owner = owner;
					this.target = target;
					this.settings = settings;
				}(dropdown_container, $dropdown.get(0), f.dropdown);

				dropdown_container.dropdown.open = async function (resolve) {
					this.settings.resolve = resolve;
					var source = this.settings.source;

					$ul = $(this.target).find('ul');
					if (!$ul.children().length || (typeof source == 'function' && !this.settings.cache) || (typeof source == 'object' && source.url && source.key && !this.settings.cache)) {
						let to_wait = setTimeout(function (owner) {
							$(owner).find('.form-control').after('<div style="width:0;display:flex;align-items:center;"><i class="form-control-loader">Loading...</i></div>');
						}, 250, this.owner);

						if (typeof source == 'function') {
							$ul.find('li').remove();

							if (source.constructor.name === "AsyncFunction" || source instanceof Promise) source = await source(this.owner);
							else source = source(this.owner);
						}

						if (typeof source == 'object' && !Array.isArray(source)) {
							$ul.find('li').remove();
							let response = await fetch(source.url).then(r => {
								if (!source.type || source.type == 'json') return r.json();
								if (source.type === 'xml') throw new Exception('Não implementado ainda');
								return null;
							});

							if (response) {
								if (!Array.isArray(response)) response = [response];

								source = response.map(obj => {
									return { text: obj[source.key], data: obj };
								});

							} else source = null;
						}

						clearTimeout(to_wait);
						$(this.owner).find('.form-control-loader').remove();

						if (!source) return;

						if (typeof source == 'string') source = source.split(options.listSeparator ?? ',');

						if (Array.isArray(source)) {
							for (let item of source) {
								if (typeof item == 'string') $ul.append(`<li>${item}</li>`);
								else {
									let li = document.createElement('li');
									$(li).html(item.text ?? item.toString());
									li.data = item.data ?? item;
									$ul.append(li);
								}
							}
						}

						$ul.find('li').on('mousedown', e => {
							var target = e.currentTarget.closest('.form-control-dropdown').owner;
							e.text = $(e.currentTarget).text();
							e.data = e.currentTarget.data ?? null;

							let call_select = target.dropdown.settings.resolve || target.dropdown.settings.onselect;
							let input, result;

							if (call_select) {
								e.inputs = fields.reduce((m, f) => {
									if (f.nodata || f.type == 'button') return m;
									m[f.id] = new FieldInput(f);
									return m;
								}, {});

								result = call_select(e);
							} else result = e.data;

							if (input = target.querySelector('.form-control')) {
								if ($(input).is('input[type=text]')) {
									$(input).val(e.text);
									$(input).prop("data", result);
								} else if ($(input).is('span')) {
									$(input).text(e.text);
									$(input).val(result);
								}
							}

							target.dropdown.close(e);
						});
					}

					$(this.target).css('display', 'block');

					let row = $(this.target).find('li').get(0) || this.target;
					let compStyles = window.getComputedStyle(row);
					let lh = Number(compStyles.getPropertyValue('line-height').replace(/[^\d.]/g, '')) +
						Number(compStyles.getPropertyValue('padding-top').replace(/[^\d.]/g, '')) +
						Number(compStyles.getPropertyValue('padding-bottom').replace(/[^\d.]/g, ''));

					$(this.target).css('max-height', lh * (this.settings.max ? this.settings.max : 5));
					$(this.target).css('width', $(this.owner).closest('.form-field').outerWidth());

					this.target.ownerDocument.addEventListener("keydown", this.owner.dropdown.close, true);
					this.target.ownerDocument.addEventListener("mousedown", this.owner.dropdown.close, true);
					this.target.ownerDocument.addEventListener("blur", this.owner.dropdown.close, true);

					$(this.target).addClass('dropdown-show');
					this.target.ownerDocument.body.focus(this.target);
				};

				dropdown_container.dropdown.close = async function (e) {
					let doc = e.currentTarget instanceof Document ? e.currentTarget : e.currentTarget.ownerDocument;
					let target = doc.querySelector('.form-control-dropdown.dropdown-show');
					if (!target) return;

					if (e.type === 'keydown') {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();
					}

					target.ownerDocument.removeEventListener("keydown", target.owner.dropdown.close, true);
					target.ownerDocument.removeEventListener("mousedown", target.owner.dropdown.close, true);
					target.ownerDocument.removeEventListener("blur", target.owner.dropdown.close, true);

					$(target).removeClass('dropdown-show');
					$(target).css('display', '');
				};

				$dropdown.on('wheel', e => {
					let up = ((e.originalEvent.wheelDelta && e.originalEvent.wheelDelta > 0) || e.originalEvent.deltaY < 0);
					if ((e.currentTarget.scrollTop <= 0 && up) || (!up && e.currentTarget.scrollTop >= (e.currentTarget.scrollHeight - e.currentTarget.clientHeight))) {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();
					}
				});
			}

			if (f.text) if (f.type == "check") $divf.append(`<span>${f.text}</span>`); else $divf.append(f.text);
			if (f.value != undefined) $(f.elem).val(f.value);
		}

		if (!has_field_validation && f.validation) {
			if (typeof f.validation == "string") f.validation = new RegExp(f.validation);
			if (f.validation instanceof RegExp) has_field_validation = true;
			else f.validation = null;
		}

		if (f.visibility != undefined) {
			f.visibility = f.visibility.trim();
			if (f.visibility) has_field_visibility = true;
		}
	}

	options.validation = validation;
	options.defaultButton = options.confirmButton;

	if (has_field_visibility) {
		var fields_map = fields.reduce((m, f) => (m[f.id] = f, m), {});

		var field_visible = f => {
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
			for (let f of f_visibilities) $(f.elem).closest('.form-field').css('display', field_visible(f) ? '' : 'none');
		};

		$(dlg).find('input,select').on('change', change_event_handler);
		change_event_handler();
	}


	let fields_to_object = empty => {
		if (empty && options.alwaysResolve && options.nullable) return null;

		var value, result = {};
		for (let f of fields) {
			if (f.nodata) continue;

			if (has_field_visibility && !field_visible(f)) value = null;
			else value = empty ? null : get_field_value(f);

			if (f.group) {
				if (!result[f.group]) result[f.group] = {};
				result[f.group][f.id] = value;
			} else result[f.id] = value;
		}

		return result;
	};


	if (options.validation || has_field_validation) {
		let form_validation = options.validation;
		options.validation = function (e) {
			if (has_field_validation) {
				for (let f of fields) {
					if (!f.validation || f.nodata || (f.type != "text" && f.type != "textarea")) continue;

					if (!f.validation.test(get_field_value(f))) {
						e.target = f.elem;
						e.message = f.message ? f.message : "Formato inválido";
						return false;
					}

				}
			}

			if (form_validation) {
				let event_formvalidation = { data: fields_to_object(), target: null, message: null };

				if (form_validation.call(dlg, event_formvalidation) === false) {
					if (typeof event_formvalidation.target == "string") {
						if (f = fields.find(item => { return item.id == event_formvalidation.target })) e.target = f.elem;
						else if (g = $(dlg).find(`.form-group[group="${event_formvalidation.target}"]`).get(0)) e.target = g;
					} else e.target = event_formvalidation.target;

					if (event_formvalidation.message) e.message = event_formvalidation.message;

					return false;
				}
			}

		};
	}

	return openDlg(dlg, options).then(a => fields_to_object(a != options.confirmButton));
}



/*** Exibir lista suspensa ***

		target: elemento que receberá a lista suspensa :: <element>
		options: opções de exibição da lista suspensa :: {list, listSeparator, classItem, sortList, onSelect} | [<item>, ...]
			list: array de items da lista suspensa :: [<item>, ...]
				<item>: objeto identificador de item da lista suspensa :: {text, desc, value, class}
					- text: texto exibido na lista :: <string>
					- desc: texto de descrição do item da lista :: <string>
					- value: valor do item da lista :: <object>
					- class: classe de customização do item da lista :: <string>
			listSeparator: caracter utilizado como separador para listas em string. Padrão ',' :: <string>
			classItem: classe padrão de customização do sitens da lista :: <string>
			sortList: ordenar lista. Padrão true :: <boolean>
			onSelect: função chamada quando se faz uma seleção no elemento alvo :: function({token, value, range})
*/
function openPopupList(target, options) {

	if (!target || !options) throw "Argumentos não definidos";

	if (typeof target == "string") target = document.getElementById(target);

	if (!target) throw "Alvo não definido";

	if (Array.isArray(options) || typeof options == "string") options = { list: options };

	if (!options.list) throw "Lista não informada";


	let default_options = {
		list: undefined, 		// array de {text,desc,value,class}, string ou function({token, previous})
		listSeparator: ",",		// separador para listas em string
		classItem: undefined,	// classe padrão para itens da lista
		sortList: true,			// ordenar lista	
		onSelect: undefined
	};  	// function({token, value, range})

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] && options[prop] == undefined) options[prop] = default_options[prop];

	var keydown_callback, input_callback;


	var doc = (target instanceof Document) ? target : target.ownerDocument;
	var targetIsInput = $(target).is(":input");

	//--- abrir popup
	if (target.popupList) return true;

	if (typeof options.list == "string") {
		options.list = options.list.split(options.listSeparator).map((value) => {
			return { text: value };
		});
	}


	if (!options.list) throw "Lista vazia";

	var container, position, line_height = 0;

	if (targetIsInput) {
		position = getCaretCoordinates(target, target.selectionStart);

		container = target;
		if ((styles = window.getComputedStyle(container)) && (fs = styles.getPropertyValue('font-size'))) line_height = (Number(fs.replace(/\D/g, '')) * 1.15);
		else line_height = 12;
	} else {
		let sel = doc.getSelection();
		let r = sel.getRangeAt(0);

		let rect = r.getBoundingClientRect();
		let off = window.length ? $(window.frames[0].frameElement).offset() : { left: 0, top: 0 };

		position = { top: off.top + rect.top, left: off.left + rect.left + 1 };
		container = sel.focusNode.nodeType == 3 ? sel.focusNode.parentElement : sel.focusNode;

		if ((styles = window.getComputedStyle(container)) && (fs = styles.getPropertyValue('font-size'))) line_height = (Number(fs.replace(/\D/g, '')) * 0.75);
		else line_height = 10;
	}

	position.top += line_height + window.scrollY;


	let popup = $(`<div class="popup-list slipDown" style="z-index: 50001; position: absolute; opacity: 1; overflow-y: auto; display: none;" role="presentation">
						<div class="popup-panel">
							<div style="margin: 0px; padding: 0px; -moz-user-select: none;">
								<div class="popup-block" tabindex="-1" role="listbox"></div>
							</div>
						</div>
				   </div>`).get(0);

	target.popupList = popup;
	doc.body.append(popup);

	let $ul;
	for (let elem of options.list) {
		if (!$ul) {
			$ul = $('<ul role="presentation"></ul>');
			$(popup).find('.popup-block').append($ul);
		}

		if (elem.group) {
			for (let item of elem.items) {
				let key = item.text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
				let $li = $(`<li role="presentation" key="${key}" value="${item.value ? item.value : item.text}">
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
			let key = elem.text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
			let $li = $(`<li role="presentation" key="${key}" value="${elem.value ? elem.value : elem.text}">
							<a hidefocus="true" href="javascript:void(0);" role="option">
								<p>${elem.text}</p>
							</a>
						</li>`);

			if (elem.class) $li.addClass(elem.class);
			else if (options.classItem) $li.addClass(options.classItem);
			$ul.append($li);
		}
	}

	if (options.sortList) {
		$lis = $ul.children('li');
		$lis.detach().sort(function (a, b) {
			a = $(a).text();
			b = $(b).text();
			return (a.toString() > b.toString()) ? (a.toString() > b.toString()) ? 1 : 0 : -1;
		});
		$ul.append($lis);
	}

	$(popup).find('a').on('mousedown', (e) => {
		e.stopImmediatePropagation();
		e.preventDefault();
		e.stopPropagation();
		let current_value = $(e.currentTarget).closest('li').attr("value");
		popup.close();

		if (current_value) select_item(current_value);
	});

	//--selecionar item
	var select_item = function (value) {
		if (targetIsInput) {
			let result = options.onSelect ? options.onSelect.call(target, { value: value, range: { start: target.selectionStart, end: target.selectionEnd } }) : value;

			if (result && typeof result == "string") {
				let v = $(target).val();
				v = v.substring(0, target.selectionStart) + result + v.slice(target.selectionEnd);
				$(target).val(v);
			}

		} else {

			let sel = doc.getSelection(), startOffset = 0, node;

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

				if (node.nodeType == 1 && node.childNodes.length) {
					if (startOffset == node.childNodes.length) startOffset--;
					node = node.childNodes[startOffset];
					startOffset = 0;
				}

			}

			// if (node && node.nodeType == 3) {
			// let n = node;
			// while ((n = n.previousSibling) && n && n.nodeType == 3) startOffset -= n.textContent.length;
			// }				

			let endOffset = sel.focusOffset;
			let fnode = sel.focusNode;

			sel.removeAllRanges();
			range = doc.createRange();
			range.setStart(fnode, startOffset);
			range.setEnd(fnode, endOffset);
			sel.addRange(range);
			range.deleteContents();

			let result = options.onSelect ? options.onSelect.call(target, { value: value, range: range }) : value;

			if (result && typeof result == "string") {
				range.insertNode(doc.createTextNode(result));
				range.collapse();
			}
		}
	};

	var search = "", tos = 0;

	//tratar evento keydown
	keydown_callback = function (e) {
		switch (e.key) {
			case "ArrowRight":
			case "ArrowLeft":
			case "Space":
			case "Escape": {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				popup.close();
				break;
			}

			case "ArrowDown":
				e.preventDefault();
				e.stopPropagation();
				let $next = $(popup).find("li.li-selected").next(":visible");
				if ($next.length) {
					$(popup).find("li.li-selected").removeClass("li-selected");
					$next.addClass("li-selected");
					if (!$next.isInViewport()) $next.get(0).scrollIntoView(false);
				}
				break;

			case "ArrowUp":
				e.preventDefault();
				e.stopPropagation();
				let $prev = $(popup).find("li.li-selected").prev(":visible");
				if ($prev.length) {
					$(popup).find("li.li-selected").removeClass("li-selected");
					$prev.addClass("li-selected");
					if (!$prev.isInViewport()) $prev.get(0).scrollIntoView();
				}
				break;

			case "Tab":
			case "Enter":

				if (!$(popup).is(":visible")) {
					popup.close();
					return;
				}

				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				let current_value = $(popup).find("li.li-selected").attr("value");
				popup.close();
				if (current_value) select_item(current_value);

				break;
			default:
				e.preventDefault();
				e.stopPropagation();

				if (e.key.length == 1) {
					search += e.key.toLowerCase();

					clearTimeout(tos);
					tos = setTimeout(function () { search = "" }, 500);

					if (search_item = $(popup).find(`li[key^='${search}']`).get(0)) {
						$(popup).find("li.li-selected").removeClass("li-selected");
						$(search_item).addClass("li-selected");
						if (!$(search_item).isInViewport()) search_item.scrollIntoView();
					}
				}

		}
	};

	//--- fechar popup
	popup.close = function () {
		$(popup).css("display", "none");
		for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).off('keydown', keydown_callback);
		doc.removeEventListener("keydown", keydown_callback, true);
		$(doc).off(".intellisense_events");
		$(popup).remove();
		delete target.popupList;
	};

	$(popup).css("left", position.left).css("top", position.top).find("li:first").addClass("li-selected");

	doc.addEventListener("keydown", keydown_callback, true);
	$(doc).on("mousedown.intellisense_events blur.intellisense_events", popup.close);
	for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).on('keydown', keydown_callback);

	$(popup).css("display", "block");
}



/*** Exibir menu popup ***
   	
	   controller: elemento controlador da exibição do menu :: <element>
	   items: array de items do menu :: [<item> | <string>, ...]
		   <item>: objeto especificador de item do menu :: {id, text, icon, tip, items}
			   id: indetificador do item :: <string>
			   text: texto do item :: <string>
			   icon: ícone do item :: <string> | extension://caminho_da_imagem
			   tip: dica sobre o item de menu :: <string>
			   items: array com o submenu correspondente ao item :: [<item> | <string>, ...]
		   <string>: modo simplificado de inserir um item informado apenas o texto. Uma barra horizontal é inserida se informado '-'
	   options: opções do menu :: {useTip, tipText, classControlerOn, dropButton, rtl} 
		   useTip: habilita a exibição de dicas :: <boolean>
		   tipText: Texto padrão para dicas dos itens que não definiram uma específica. Usar '$0' para substituir pelo texto do item correspondente :: <string>
		   classControlerOn: classe atribuída ao elemento controlador quando o menu é exibido :: <string>
		   dropButton: usar botão extra de controle de exibição do menu :: <boolean> | <string>
			   <boolean>: insere um botão com uma seta pra baixo após o elemento contralador
			   <string>: atribui uma classe ao botão extra para definir um símbolo diferente
		   rtl: exibir menu alinhado à direita
		   dropButtonTitle: dica para o botão extra de controle :: <string>
	   callback: função chamada quando um item do menu é clicado :: function({originalEvent, id, text})
   	
	   return <menu>
*/
function createPopupMenu(controler, items, options, callback) {
	if (controler && typeof controler == "string") controler = document.getElementById(controler);

	if (controler && Array.isArray(controler)) {
		callback = options;
		options = items;
		items = controler;
		controler = null;
	}

	if (typeof options == "function") {
		callback = options;
		options = {};
	} else if (!options) options = {};

	if (controler) {
		controler = $(controler).get(0);

		if (controler.popupmenu && !items) {
			$(controler.popupmenu).remove();
			delete controler.popupmenu;
			return null;
		}
	}

	var $menu = $('<div class="popup-menu"><ul class="popup-dropdown slipDown"></ul></div>');
	var menu = $menu.get(0);
	var $ul = $menu.find('ul');
	var to_close, to_open;

	for (let item of items) {
		if (typeof item == "string") {
			if (item == "-") item = "<hr>";
			$ul.append(`<li>${item}</li>`);
		} else {
			let $li = $(`<li><a href="javascript:void(0);">${item.text}</a></li>`);
			$li.find('a').get(0).data = item.data;

			if (item.id) $li.find('a').first().attr('item-id', item.id);

			if (item.icon) {
				let m_icon = item.icon.match(/(extension:\/\/)?(.+\.(?:png|jpe?g|gif|svg))\s*$/i);

				let $icon = m_icon ?
					$('<img class="popup-menu-icon">').attr('src', m_icon[1] ? browser.runtime.getURL(m_icon[2]) : item.icon) :
					$('<span class="popup-menu-icon" />').addClass(item.icon);
				$li.find('a').prepend($icon);
			}

			$ul.append($li);

			if (options.useTip && !item.items) {
				if (!item.tip) item.tip = (options.tipText) ? options.tipText.replace("$0", item.text) : item.text;
				$li.find('a').attr("title", item.tip);
			}

			//Criação de submenus
			if (item.items && Array.isArray(item.items)) {
				$li.find('a').addClass('popup-submenu').append(`<span class="popup-submenu-icon">&nbsp;</span>`).get(0).subMenuItems = item.items;
			}
		}
	}

	var keyDownHandler = function (e) {
		if (e.keyCode == 27) {
			e.preventDefault();
			e.stopPropagation();
			menu.close();
		}
	};

	var mouseDownHandler = function (e) {
		if (e && $(e.target).is('.popup-submenu')) return;
		menu.close();
	};

	menu.close = function () {
		clearTimeout(to_open);

		$menu.removeClass("popup-menu-on");
		if (controler && options.classControlerOn) $(controler).removeClass(options.classControlerOn);
		if (!menu.isSubMenu) {
			for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).off('keydown', keyDownHandler);
			$(document).off('keydown', keyDownHandler);
			$(document).off("mousedown focusout", mouseDownHandler);
		}

		$menu.find('.popup-submenu').each((index, elem) => {
			if (elem.submenu) elem.submenu.close();
		});
	};

	menu.open = function (p) {
		if (p != undefined) $menu.css("left", p.x).css("top", p.y);

		$menu.addClass("popup-menu-on");


		if (controler && options.classControlerOn) $(controler).addClass(options.classControlerOn);
		if (!menu.isSubMenu) {
			for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).on('keydown', keyDownHandler);
			$(document).on('keydown', keyDownHandler);
			$(document).on("mousedown focusout", mouseDownHandler);
		} else if ((p.x + $menu.dimension('outerSize').width) > $menu.parent().outerWidth()) $menu.css("left", $(menu.parentMenu).position().left - $menu.dimension('outerSize').width);
	};

	menu.toggle = function (e) {
		$menu.toggleClass("popup-menu-on");

		if ($menu.is('.popup-menu-on')) menu.open();
		else menu.close();
	}

	if (controler) {
		let reference = controler;

		if (controler.popupmenu) $(controler.popupmenu).remove();

		if ($(controler).closest('.btn-group-dropdown').length) {
			reference = $(controler).next('.btn-dropdown');
			reference.off("click");
		} else {
			$(controler).wrap('<div class="btn-group-dropdown"></div>');

			if (options.dropButton) {
				var $btn = $('<button class="btn-dropdown">&nbsp;</button>');
				if (typeof options.dropButton == "string") $btn.addClass(options.dropButton);
				else $btn.html('<span class="btn-caret"></span>');
				if (options.dropButtonTitle) $btn.attr('title', options.dropButtonTitle);
				$(controler).after($btn);
				reference = $btn;
			}
		}

		if (options.rtl) $menu.find('ul').css("left", "calc(-100% + " + ($(controler).width() + 2) + "px)");

		controler.popupmenu = menu;
		$(reference).after($menu).click(e => {
			e.preventDefault();
			e.stopPropagation();
			menu.toggle();
		});


	} else if (options.parent) $(options.parent).append(menu);
	else document.body.appendChild(menu);

	let open_submenu = (e, delay) => {
		if (!$(e.currentTarget).is('.popup-submenu')) return;

		if (e.currentTarget.subMenuItems) {
			e.currentTarget.submenu = createPopupMenu(e.currentTarget.subMenuItems, options, callback);
			e.currentTarget.submenu.parentMenu = menu;
			e.currentTarget.submenu.isSubMenu = true;
			delete e.currentTarget.subMenuItems;
			$(e.currentTarget.submenu).mouseenter(() => { clearTimeout(to_close) });
			$(e.currentTarget.submenu).mouseleave(() => { e.currentTarget.submenu.close() });
		}

		let p = getAbsolutePosition(e.currentTarget);
		p.x += $(e.currentTarget).outerWidth();

		if (delay) to_open = setTimeout(() => { e.currentTarget.submenu.open(p) }, delay);
		else {
			clearTimeout(to_open);
			e.currentTarget.submenu.open(p);
		}

	};

	$menu.find('a').on('mousedown', (e) => {
		e.preventDefault();

		let id = $(e.currentTarget).attr('item-id');

		if ($(e.currentTarget).is('.popup-submenu') && !id) {
			open_submenu(e);
		} else {
			menu.close();
			if (callback) callback.call(e.currentTarget, { originalEvent: e, id: id, text: $(e.currentTarget).text(), data: e.currentTarget.data });
		}

	});

	$menu.find('.popup-submenu').mouseenter(e => open_submenu(e, 500));

	$menu.find('.popup-submenu').mouseleave(e => {
		clearTimeout(to_open);
		to_close = setTimeout(() => { e.currentTarget.submenu.close() }, 200);
	});

	return menu;
}


/*** Exibir lista de multiseleção

		target: elemento que receberá a lista suspensa :: <element>
		options: opções de exibição da lista suspensa :: {list, listSeparator, classItem, sortList, onSelect} | [<item>, ...]
			list: array de items da lista suspensa :: [<item>, ...]
				<item>: objeto identificador de item da lista suspensa :: {text, desc, value, class}
					- text: texto exibido na lista :: <string>
					- desc: texto de descrição do item da lista :: <string>
					- value: valor do item da lista :: <object>
					- class: classe de customização do item da lista :: <string>
			listSeparator: caracter utilizado como separador para listas em string. Padrão ',' :: <string>
			classItem: classe padrão de customização do sitens da lista :: <string>
			sortList: ordenar lista. Padrão true :: <boolean>
			onSelect: função chamada quando se faz uma seleção no elemento alvo :: function({token, value, range})
*/
function createMultiSelector(options) {
	if (!options) throw "Argumentos não definidos";

	if (Array.isArray(options) || typeof options == "string") options = { list: options };

	if (!options.list) throw "Lista não informada";


	let default_options = {
		list: undefined, 		// array de string o Map (key,value)
		listSeparator: ",",		// separador para listas em string
		classItem: undefined,	// classe padrão para itens da lista
		sortList: true,			// ordenar lista	
		onSelect: undefined
	};  	// function({token, value, range})

	for (let prop in default_options) if (default_options.hasOwnProperty(prop) && default_options[prop] && options[prop] == undefined) options[prop] = default_options[prop];

	var keydown_callback;

	options.list = convertListOptions(options.list);
	if (!options.list) throw "Lista vazia";

	var popup = $(`<div class="popup-list slipDown" style="z-index: 50001; position: absolute; opacity: 1; overflow-y: auto; display: none;" role="presentation">
						<div class="popup-panel">
							<div style="margin: 0px; padding: 0px; -moz-user-select: none;">
								<div class="popup-block" tabindex="-1" role="listbox"></div>
							</div>
						</div>
				   </div>`).get(0);
	var external_resolve;

	let $ul;
	for (let item of options.list) {
		if (!$ul) {
			$ul = $('<ul role="presentation"></ul>');
			$(popup).find('.popup-block').append($ul);
		}

		let $li = $(`<li role="presentation">
						<input type="checkbox" value="${item.key ?? item.value}" role="option" />
						<label> ${item.value}</label>
					</li>`);

		if (options.classItem) $li.addClass(options.classItem);
		$ul.append($li);
	}

	if (options.sortList) {
		$lis = $ul.children('li');
		$lis.detach().sort(function (a, b) {
			a = $(a).text();
			b = $(b).text();
			return (a.toString() > b.toString()) ? (a.toString() > b.toString()) ? 1 : 0 : -1;
		});
		$ul.append($lis);
	}

	//tratar evento keydown
	keydown_callback = function (e) {
		switch (e.key) {
			case "ArrowRight":
			case "ArrowLeft": {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				popup.close();
				break;
			}

			case "ArrowDown":
				e.preventDefault();
				e.stopPropagation();
				let $next = $(popup).find("li.li-selected").next(":visible");
				if ($next.length) {
					$(popup).find("li.li-selected").removeClass("li-selected");
					$next.addClass("li-selected");
					if (!$next.isInViewport()) $next.get(0).scrollIntoView(false);
				}
				break;

			case "ArrowUp":
				e.preventDefault();
				e.stopPropagation();
				let $prev = $(popup).find("li.li-selected").prev(":visible");
				if ($prev.length) {
					$(popup).find("li.li-selected").removeClass("li-selected");
					$prev.addClass("li-selected");
					if (!$prev.isInViewport()) $prev.get(0).scrollIntoView();
				}
				break;

			case "Enter":
				if ($(popup).is(":visible")) {
					popup.close(true);
					return;
				}
				break;

			case "Space":
			case "Tab":
			case "Escape": popup.close(); break;

			default:
				e.preventDefault();
				e.stopPropagation();
		}
	};


	popup.open = function (position, values) {
		popup.state = 'opened';

		return new Promise(resolve => {
			var doc;
			if (typeof position == "string" && position.nodeType === 1) {
				doc = position.ownerDocument;

				let rect = position.getBoundingClientRect();
				let offset = window.length ? $(window.frames[0].frameElement).offset() : { left: 0, top: 0 };
				var container = position.parentElement;
				var line_height = (styles = window.getComputedStyle(container)) && (fs = styles.getPropertyValue('font-size')) ? line_height = (Number(fs.replace(/\D/g, '')) * 0.75) : 10;

				position = { top: offset.top + rect.top + window.scrollY, left: offset.left + rect.left + 1 };
			} else doc = document;

			doc.body.append(popup);
			if (values) {
				if (typeof values == "string") values = values.split(",").map(item => item.trim());
				$(popup).find('input[type=checkbox]').each((index, item) => {
					$(item).prop('checked', values.includes($(item).val()));
				});
			} else $(popup).find('input[type=checkbox]').prop('checked', false);

			$(popup).css("left", position.left).css("top", position.top).find("li:first").addClass("li-selected");
			doc.addEventListener("keydown", keydown_callback, true);
			for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).on('keydown', keydown_callback);
			$(popup).css("display", "block").focus();
			external_resolve = resolve;
		});
	};


	popup.close = function (e) {
		if (popup.state == 'closed') return;

		var doc = popup.ownerDocument;
		$(popup).css("display", "none");
		for (var i = 0; i < top.window.parent.frames.length; i++) $(top.window.parent.frames[i].document).off('keydown', keydown_callback);
		doc.removeEventListener("keydown", keydown_callback, true);

		if (e === true) {
			external_resolve($(popup).find('input[type=checkbox]:checked').get().map(item => $(item).val()));
		} else external_resolve(false);

		$(popup).remove();
		popup.state = 'closed';
	};

	return popup;
}


/**
 * Converte string em Array ou Map 
 * @param {(String|Map|Array)} list 
 * @returns Array(key,value)
 */
function convertListOptions(list) {
	if (typeof list == "string") list = list.split(",");
	if (Array.isArray(list)) return list.map(item => {
		if (item.indexOf("=") != -1 && (item = item.split("="))) return { key: item[0], value: item[1] };
		else return { value: item };
	});
}



/*** Retornar a posição absoluta de elemento ***
		
		elem: elemento que se pretender determinar a posição absoluta :: <element>
		
		return {x, y}
*/
function getAbsolutePosition(elem) {
	var p = { x: 0, y: 0 };

	while (elem) {
		p.x += elem.offsetLeft - elem.scrollLeft;
		p.y += elem.offsetTop - elem.scrollTop;
		elem = elem.offsetParent;
	}

	return p;
}



/*** Retornar as coordenadas do cursor de texto ***
		
		element: elemento que se pretender determinar a posição absoluta :: <element>
		position: posição no texto :: <number>
		
		return {left, top}
*/
function getCaretCoordinates(element, position) {
	var properties = ['boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'];
	var isFirefox = !(window.mozInnerScreenX == null);
	var mirrorDiv, computed, style;


	// mirrored div
	mirrorDiv = document.getElementById(element.nodeName + '--mirror-div');
	if (!mirrorDiv) {
		mirrorDiv = document.createElement('div');
		mirrorDiv.id = element.nodeName + '--mirror-div';
		window.top.document.body.appendChild(mirrorDiv);
	}

	style = mirrorDiv.style;
	computed = getComputedStyle(element);

	// default textarea styles
	style.whiteSpace = 'pre-wrap';
	if (element.nodeName !== 'INPUT') style.wordWrap = 'break-word';

	// position off-screen
	style.position = 'absolute';
	style.top = element.offsetTop + parseInt(computed.borderTopWidth) + 'px';
	style.left = "400px";
	style.visibility = 'hidden';  // not 'display: none' because we want rendering

	properties.forEach(function (prop) {
		style[prop] = computed[prop];
	});

	if (isFirefox) {
		style.width = parseInt(computed.width) - 2 + 'px';
		if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
	} else {
		style.overflow = 'hidden';
	}

	mirrorDiv.textContent = element.value.substring(0, position);
	if (element.nodeName === 'INPUT') mirrorDiv.textContent = mirrorDiv.textContent.replace(/\s/g, "\u00a0");

	var span = document.createElement('span');
	span.textContent = element.value.substring(position) || '.';
	mirrorDiv.appendChild(span);

	var coordinates = { top: span.offsetTop + parseInt(computed['borderTopWidth']), left: span.offsetLeft + parseInt(computed['borderLeftWidth']) };

	var result = clientToScreen(element, coordinates);

	window.top.document.body.removeChild(mirrorDiv);
	return result;
}


/*** Transformar as coordenadas client para screen ***
		
		elem: elemento que se pretender determinar a posição absoluta :: <element>
		point: ponto que se deseja converter :: {left, top}
		
		return {left, top}
*/
function clientToScreen(elem, point) {
	try {
		var box = elem.getBoundingClientRect();
		var doc = elem.ownerDocument;
		var docElem = doc.documentElement;
	} catch (e) {
		return point;
	}


	var body = doc.body,
		clientTop = docElem.clientTop || body.clientTop || 0,
		clientLeft = docElem.clientLeft || body.clientLeft || 0,
		scrollTop = window.scrollY || jQuery.support.boxModel && docElem.scrollTop || body.scrollTop,
		scrollLeft = window.scrollX || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft,
		top = point.top + box.top + scrollTop - clientTop,
		left = point.left + box.left + scrollLeft - clientLeft;

	return { top: top, left: left };
}



/******************************************/
/* Interpretadores e conversores de texto */
/******************************************/



/*** Normalizar nome de identificadores ***
		
		id: identificador a ser normalizado :: <string>
		
		return <string>
*/
function identityNormalize(id) {
	if (!id) return id;

	id = id.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/ /g, "_");
	if (id.match(/^[^\w_]/i)) id = "_" + id;

	return id;
}


/** Converter XML Document em Objeto Javascript
 * 
 * @param {*} xmlNode Documento XML ou string
 * @returns Object
 */
function JSOFromXml(xmlNode) {
	try {
		if (typeof (xmlNode) == 'string') {
			xmlNode = xmlNode.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
			let parser = new DOMParser();
			xmlNode = parser.parseFromString(xmlNode, 'application/xml');
		}

		var obj = {};

		if (xmlNode.children.length == 1 && !xmlNode.parentNode) xmlNode = xmlNode.firstChild;

		if (xmlNode.hasAttributes()) {
			for (let attr of xmlNode.attributes) obj[attr.name] = attr.value;
		}

		if (!xmlNode.children.length) {
			let value = xmlNode.textContent;
			if (value == 'true' || value == 'false') value = value == 'true';
			if (typeof (value) == 'string' && !isNaN(parseFloat(value))) value = Number(value);

			return value;
		}

		for (let node of xmlNode.children) {
			if (typeof (obj[node.nodeName]) == "undefined") obj[node.nodeName] = JSOFromXml(node);
			else {
				if (typeof (obj[node.nodeName].push) == "undefined") {
					var old = obj[node.nodeName];
					obj[node.nodeName] = [];
					obj[node.nodeName].push(old);
				}
				obj[node.nodeName].push(JSOFromXml(node));
			}
		}

		return obj;
	} catch (e) {
		console.log(e.message);
	}
}



/** Converter metadata-string para javascript object
 * 
 * @param {*} data 
 * @param {*} prefix 
 * @returns Javascript Object
 */
function parseMetadata(data, prefix = '') {

	let block = new RegExp(`#${prefix}BEGIN;[\\w\\W]*#${prefix}END;`, 'i');
	if (!block.test(data)) return null;

	let m, result = {};
	const regex = /(?<=^\s*|;\s*)#([^:;]+):([\w\W]*?)(?=;\s*#)/g;

	while (m = regex.exec(data)) {
		if (m.index === regex.lastIndex) regex.lastIndex++;

		let value = m[2];
		if (value == 'true' || value == 'false') value = value == 'true';
		if (typeof (value) == 'string' && !isNaN(value)) value = Number(value);

		if (m[1].indexOf('.') == -1) result[m[1]] = value;
		else {
			let k, keys = m[1].split('.');
			let node = result;
			while (k = keys.shift()) {
				if (!keys.length) node[k] = value;
				else if (node[k]) node = node[k];
				else node = node[k] = {};
			}
		}
	}

	return result;
}



/*** Resolvedor de expressão ***
		
		expr: expressão a ser resolvida
		undef: expressão regular para determinar valor indefinido
		unescape: retirar caracteres de marcação
		vars: objeto que armazena todas as variáveis atribuídas na expressão
		
		return <string>
*/
function solve(expr, undef, vars = null, unescape = true) {
	if (!expr || typeof (expr) != "string") return expr;
	if (!isNaN(expr)) return Number(expr);
	if (expr.match(/^\s*NULL\s*$/i)) return null;

	var s, q, s2, value;

	//escapar expressão
	if (unescape) {
		expr = expr.replace(/<(\w+)[^>]*?>(.*)<\/\1>/g, "$2").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
		expr = " " + $('<textarea />').html(expr).text() + " ";
		unescape = false;
	}

	if (typeof undef == "string") undef = new RegExp(undef, "i");
	if (vars === true) vars = {};

	//aplicar operadores lógicos de encadeamento && e ||
	while ((s = expr.match(/^\s*(!)?\s*\(((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*)\)|^(.*?)\s(\|\||&&)\s/i)) && !(undef && undef.test(s[3]))) {
		if (s[3] !== undefined) {
			let result = solve(s[3], undef, vars, unescape);
			if (result === undefined) return undefined;

			if (s[4] == "&&") {
				if (!result) return result;
				if (Array.isArray(result) && !result.length) return false;
				expr = " " + expr.slice(s[0].length);
			} else {
				if (result && (!Array.isArray(result) || result.length)) return result;
				expr = " " + expr.slice(s[0].length);
			}

		} else {
			let result = solve(s[2], undef, vars, unescape);
			if (result === undefined) return undefined;
			if (result && typeof result == 'object') return result;
			expr = (s[1] ? s[1] : "") + " " + result + " " + expr.slice(s[0].length);
		}
	}

	if (undef && undef.test(expr)) return undefined;

	expr = expr.replace(/\t+/g, " ").trim();

	//recuperar valor de variável
	if (vars && (s = expr.match(/^\s*\$(_*?[a-z][\w_]*)((?:\.[a-z_]+\w*|\[.*?\])+)*\s*$/i))) {
		value = vars[s[1]];

		if (s[2]) {
			let ref_regex = /\.([a-z_]+\w*)|\[(.*?)\]/ig;

			while (q = ref_regex.exec(s[2])) {
				if (q.index === ref_regex.lastIndex) ref_regex.lastIndex++;
				if (q[1]) {
					if (typeof value != 'object' || Array.isArray(value)) return null;
					if (!(value = value[q[1]])) return value;
				} else if (q[2]) {
					if (!Array.isArray(value)) return null;
					let index = solve(q[2], undef, vars, unescape);
					if (typeof index == 'number' && index < value.length) value = value[index];
					else return null;
				}
			}
		}

		if (value !== undefined) return value;

		if (undef && undef.test(expr)) return undefined;
		return "";
	}

	//atribuir valor para variável
	if (vars && (s = expr.match(/^\s*\$([a-z_]+\w*)((?:\.[a-z_]+\w*|\[.*?\])+)*\s*=\s*([^=].*?)\s*$/i))) {

		value = solve(s[3], undef, vars, unescape);

		if (s[2]) {
			let ref_regex = /\.([a-z_]+\w*)|\[(.*?)\]/ig;
			let keys = [s[1]];

			while (q = ref_regex.exec(s[2])) {
				if (q.index === ref_regex.lastIndex) ref_regex.lastIndex++;
				if (q[1]) keys.push(q[1]);
				else keys.push(Number(q[2]));
			}

			let key = keys.pop();
			let ref = vars;

			for (let k of keys) {
				if (typeof ref != 'object') break;
				if (typeof k == 'number') {
					if (!Array.isArray(ref) || k >= ref.length) return null;
				} else if (ref[k] === undefined) ref[k] = {};
				ref = ref[k];
			}

			if (typeof ref == 'object') ref[key] = value;
			else return null;
		} else vars[s[1]] = value;

		return value;
	}

	//criar array
	if (s = expr.match(/^\s*\[.*\]\s*$/i)) {
		let result = [], arr_regex = /(?<=^\s*\[.*)\s*(?:\"[^"]*?"|'[^']*?'|\[.*?\](?=,|}|])|\{.*?\}(?=,|}|])|[^,]+)(?=.*\]\s*$)/ig;
		while (s = arr_regex.exec(expr)) {
			if (s.index === arr_regex.lastIndex) arr_regex.lastIndex++;
			if (s[0]) result.push(solve(s[0], undef, vars, unescape));
		}
		return result;
	}

	//criar objeto
	if (s = expr.match(/^\s*\{.*\}\s*$/i)) {
		let result = {}, obj_regex = /(?<=^\s*{.*)(?:\s*(["'])?([a-z_]+\w*?)\1\s*:\s*)("[^"]*?"|'[^']*?'|\[.*?\](?=,|}|])|\{.*?\}(?=,|}|])|[^,]+)(?=.*}\s*$)/ig;
		while (s = obj_regex.exec(expr)) {
			if (s.index === obj_regex.lastIndex) obj_regex.lastIndex++;
			result[s[2]] = solve(s[3], undef, vars, unescape);
		}

		return result;
	}

	//aplicar operador IN
	if (s = expr.match(/^\s*(["'])?(.*?)\1\s+IN\s+\[\s*(.*)\s*\]\s*$/i)) return s[3].split(",").includes(s[2]);

	//aplicar operadores de comparação e aritméticos
	if (s = expr.match(/^\s*(.*?)\s+([!<>*^$=]=|[<>+\-*\/])\s+(.*)\s*$/)) {
		switch (s[2].toLowerCase()) {
			case "^=": return (new RegExp(`^${s[3]}`, "i")).test(s[2]);
			case "*=": return (new RegExp(`${s[3]}`, "i")).test(s[2]);
			case "$=": return (new RegExp(`${s[3]}$`, "i")).test(s[2]);
		}

		let op1 = solve(s[1], undef, vars, unescape);
		let op2 = solve(s[3], undef, vars, unescape);

		if (op1 === undefined || op2 === undefined) return undefined;

		if (Array.isArray(op1)) op1 = op1.length;
		else if (typeof op1 == "string") op1 = op1.trim();

		if (Array.isArray(op2)) op2 = op2.length;
		else if (typeof op2 == "string") op2 = op2.trim();

		let op1_date, op2_date;

		switch (s[2].toLowerCase()) {
			case "==": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() == op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) == 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 == op2_date.getFullYear();
				return op1 == op2;
			}

			case "!=": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() != op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) != 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 != op2_date.getFullYear();
				return op1 != op2;
			}

			case "<": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() < op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) < 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 < op2_date.getFullYear();
				return op1 < op2;
			}

			case "<=": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() <= op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) <= 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 <= op2_date.getFullYear();
				return op1 <= op2;
			}

			case ">": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() > op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) > 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 > op2_date.getFullYear();
				return op1 > op2;
			}

			case ">=": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.getFullYear() >= op2;
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date) >= 0;
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return op1 >= op2_date.getFullYear();
				return op1 >= op2;
			}

			case "+": {
				if (op2_date = op2.toString().toDate()) return op1.toString().concat(op2.toString());
				if (op1_date = op1.toString().toDate()) return op1_date.addDate(op2).toDateBR();
				return op1 + op2;
			}

			case "-": {
				if (op1_date = op1.toString().toDate()) {
					if (!isNaN(op2) && op2 >= 1970 && op2 <= 9999) return op1_date.diffDays(new Date(`01/01/${op2}`));
					if (op2_date = op2.toString().toDate()) return op1_date.diffDays(op2_date);
				} else if ((op2_date = op2.toString().toDate()) && !isNaN(op1) && op1 >= 1970 && op1 <= 9999) return (new Date(`01/01/${op1}`)).diffDays(op2_date);

				if (op1_date && op2_date) return op1_date.diffDays(op2_date);
				if (op1_date) return op1_date.addDate("-" + op2).toDateBR();
				return typeof op1 == "number" && typeof op2 == "number" ? op1 - op2 : op1 + "-" + op2;
			}

			case "*": {
				if (op2_date = op2.toString().toDate()) return null;
				if (op1_date = op1.toString().toDate()) return null;
				return typeof op1 == "number" && typeof op2 == "number" ? op1 * op2 : null;
			}

			case "/": {
				if (op2_date = op2.toString().toDate()) return null;
				if (op1_date = op1.toString().toDate()) return null;
				return typeof op1 == "number" && typeof op2 == "number" && op2 != 0 ? op1 / op2 : null;
			}
		}
	};

	if (s = expr.match(/^\s*(["'])(.*)\1\s*$/i)) return s[2];
	if (s = expr.match(/^(!)?\s*(\d)$/i)) return s[1] ? Boolean(!Number(s[2])) : Number(s[2]);
	if (s = expr.match(/^(!)?\s*(true|false)\s*$/i)) return s[1] ? s[2].toLowerCase() == 'false' : s[2].toLowerCase() == 'true';
	if (!isNaN(expr)) return Number(expr);

	return expr.match(/^\s*!\s*[^\s].*$/i) ? false : expr;
};



/**
 *  Interpretar e testar expressão 
 * @param {String} expression Expressão a ser testada
 * @param {(String|Regexp)} [undefineRegex] Expressão regular para defini
 * @param {(Boolean|Object)} [variables] Objeto qu e armazena variáveis para testes em sequência
 * @results {Boolean} Resultado a interpretação da expressão
 */
function testExpression(expression, undefineRegex, variables = null) {
	let result = solve(expression, undefineRegex, variables, true);

	if (result === undefined) return undefined;
	if (!result) return false;
	if (Array.isArray(result)) return result.length > 0;
	if (typeof result == 'number') return result != 0;
	if (typeof result == 'string') return result.trim().length != 0;
	return Boolean(result);
}