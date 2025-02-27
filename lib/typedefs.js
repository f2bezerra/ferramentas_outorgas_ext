// JS Doc - Definição de tipos
// Autor: Fábio Fernandes Bezerra (@f2bezerra)

/**
 * Opções para consulta de informações do SEI
 * @typedef OptionsQueryNodeSei
 * @property {Array} [tree] Árvore de nós.
 * @property {Document} [doc] Documento com a ávore objeto da consulta.
 */


/**
 * Objeto com informações de nó de processo Sei
 * @typedef NodeSei
 * @property {String} name Nome simplificado.
 * @property {String} fullName Nome completo.
 * @property {String} type Tipo de documento/processo, onde:
 * 							    PC = Processo;
 * 							    OF = Ofício;
 * 								IF = Informe;
 * 								AT = Ato;
 * 								DP = Despacho;
 * 								CL = Checklist;
 * 								LC = Licença;
 * 								?  = Tipo não mapeado.
 * @property {String} tipology Tipologia do documento
 * @property {Boolean} extern Indica se o documento é externo ou gerado pelo SEI.
 * @property {String} num Número serial.
 * @property {String} sei Número SEI.
 * @property {String} id Número de controle interno do SEI.
 * @property {String} date Data do documento.
 * @property {String} year Ano do documento.
 * @property {String} [doc] Conteúdo do documento.
 * @property {Array} [bm] Array de indicadores presentes no documento.
 */


/**
 * Objeto com informações de nó de processo Sei
 * @typedef Reference
 * @property {String} nome Nome simplificado.
 * @property {String} nome_completo Nome completo.
 * @property {String} tipo' Tipo de documento/processo, onde:
 * 							    PC = Processo;
 * 							    OF = Ofício;
 * 								IF = Informe;
 * 								AT = Ato;
 * 								DP = Despacho;
 * 								CL = Checklist;
 * 								LC = Licença;
 * 								?  = Tipo não mapeado.
 * @property {String} tipologia Tipologia do documento
 * @property {Boolean} externo Indica se o documento é externo ou gerado pelo SEI.
 * @property {String} num Número serial.
 * @property {String} sei Número SEI.
 * @property {String} id Número de controle interno do SEI.
 * @property {String} data Data do documento.
 * @property {String} ano Ano do documento.
 * @property {Array} [bm] Array de indicadores presentes no documento.
 */

