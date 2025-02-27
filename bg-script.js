/***********************************************/
/* Definição de compatibilidade para o Chrome  */
/***********************************************/
var browser = browser || chrome;

var audio = new Audio();
audio.src = browser.runtime.getURL("assets/notify.opus");

function onExecuted(result) {
  console.log(`Success`);
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function soundNotification() {
	audio.play();
}


function handleMessage(message, sender, response) {
	
	switch (message.action) {
		
		case "popup":
			var createData = {type: "popup", 
							  url: message.url, 
							  width: message.options.width, 
							  height: message.options.height,
							  left: (screen.width - message.options.width) / 2,
							  top: (screen.height - message.options.height) / 2};

			var creating = chrome.windows.create(createData);
			
			break;
			
			
		case "open": {
			if (message.url) {
				if (Array.isArray(message.url)) {
					
					browser.tabs.query({active: true, currentWindow: true}).then(tab => {
						let i = message.url.length;
						while (i--) browser.tabs.create({url: message.url[i], index: tab[0].index+1});
					});
				} else browser.tabs.create({url: message.url}).then(tab => {
					if (message.postData) {
						let code = "var i;";
						for (let param in message.postData) {
							if (message.postData.hasOwnProperty(param)) {
								code += `i = document.getElementById('${param}') || document.getElementsByName('${param}')[0];if (i) i.value = "${message.postData[param] ? message.postData[param] : ''}";`; + "\n";
								
							}
						}
						code += "var f = document.querySelector('form'); if (f) f.submit();";
						browser.tabs.executeScript(tab.id, {code: code, runAt: "document_idle"});
					} else {

						if (message.script) browser.tabs.executeScript(tab.id, {code: message.script, runAt: message.runAt ? message.runAt : "document_idle"});
						if (message.css) browser.tabs.insertCSS(tab.id, {code: message.css, runAt: message.runAt ? message.runAt : "document_idle"});

					}
				});
				
				response({result: "ABRIU"}); 
			};
			
			break;
		}
		
		
		case "duplicate": {
			browser.tabs.query({active: true, currentWindow: true}).then(tabs => browser.tabs.duplicate(tabs[0].id)).then(function(tab) {
				if (message.url && message.predata) {
					browser.tabs.executeScript(tab.id, {
						code: `
							waitDocumentReady('#ifrVisualizacao').then(doc => {
								sessionStorage.predata = '${JSON.stringify(message.predata)}';
								if (ifr = window.top.document.getElementById("ifrVisualizacao")) {
									if (${message.predata.autoconfirm}) ifr.style.visibility = "hidden";
									ifr.focus();
									ifr.src = '${message.url}';
								}
							});
							
						`
					});
					
				}
			});
			
				
			
			break;
		}		
		
			
		case "notify": {
			if (!message.type) message.type = "basic";
			let not_id = "ni-" + Math.floor(Math.random() * 10001);  
			browser.notifications.create(not_id, {type: message.type, title: message.title, iconUrl: browser.runtime.getURL("assets/logo-48.png"), message: message.content});
			
			if (!message.timeout) message.timeout = 2500;
			
			setTimeout(function() {
				browser.notifications.clear(not_id);
			}, message.timeout);
			
			break;
		}
		
		
		case "notify-success": {
			message.type = "basic";
			if (!message.title) message.title = "Sucesso";
			let not_id = "ni-" + Math.floor(Math.random() * 10001);  
			soundNotification();
			browser.notifications.create(not_id, {type: message.type, title: message.title, iconUrl: browser.runtime.getURL("assets/logo-48.png"), message: message.content});
			
			if (!message.timeout) message.timeout = 3000;
			
			setTimeout(function() {
				browser.notifications.clear(not_id);
			}, message.timeout);
			
			break;
		}
		
		
		case "notify-fail": {
			message.type = "basic";
			if (!message.title) message.title = "Falha";
			let not_id = "ni-" + Math.floor(Math.random() * 10001);  
			soundNotification();
			browser.notifications.create(not_id, {type: message.type, title: message.title, iconUrl: browser.runtime.getURL("assets/logo-48-error.png"), message: message.content});

			if (!message.timeout) message.timeout = 5000;

			setTimeout(function() {
				browser.notifications.clear(not_id);
			}, message.timeout);
			
			break;
		}
		
			
		case "runScript": {
				let query_options = message.allTabs ? {currentWindow: true} : {};
				browser.tabs.query(query_options).then(tabs => {
					tabs.forEach(tab => {
						browser.tabs.executeScript(tab.id, {allFrames: message.allFrames ? true : false, 
															code: message.script,
															runAt: message.runAt ? message.runAt : "document_idle"});
					});
				});
			}
			
			break;

			
		case "navigate": 
			if (message.url) browser.tabs.update(sender.tab.id, {url: message.url}).then(tab => {
				if (message.script) browser.tabs.executeScript(tab.id, {code: message.script});
			});
			
			break;
		
				
	}
	
}

browser.runtime.onMessage.addListener(handleMessage);
