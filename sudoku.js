//*****************************************************************
//S: Utilidades

Logger = this.Logger || console; //A: Asi funciona en GDOCS, browser, node, etc.

function logm(tipo, nivel, mensaje, datos) { //U: Loggea y (a futuro) me permite sacar la informacion qe no me interesa
    Logger.log(tipo + ":" + mensaje + ":" + JSON.stringify(datos));
}

function arrayDe(largo, qe) { //U: Crea un array con un solo valor muchas veces
    var r = new Array(largo);
    for (var i = 0; i < largo; i++){
        r[i] = qe;
    }
    return(r);
}

function posicionesDisponibles(unArray) { //U: Un array con las posiciones qe tengan true
    var r = [];
    for (var i = 0; i < unArray.length; i++){
        if (unArray[i] == true){
            r.push(i);
        }
    }
    return(r);
}

function comparadorArray(cartel, r_esperado, r){ //U: Compara dos arrays y me dice donde fallan
    var fallo = false;
	var donde = [];
    for (var i = 0; i < r_esperado.length; i++){
        if (r[i] != r_esperado[i]) {
            logm("ERR", 1, "fallo", {i:i, r:r[i], r_esperado:r_esperado[i]});
            fallo = true;
			donde.push(i);
        }
    }
    logm("DBG", 1, cartel, {fallo:fallo, r:r});
	return(donde);
}

//****************************************************************
//S: Variables globales

var tableroUsado = [];

//*****************************************************************
//S: Para la interfaz del GDocs

function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Mi menu')
        .addItem('Saludar', 'saludar')
        .addToUi();
}

function saludar() {
    Browser.msgBox("Alo");
}

//*****************************************************************
//S: Para la interfaz del browser
var uiText;
var uiBtn1;
var uiBtn2;
var uiBtn3;

function iniciarEnBrowser(){
    uiText = document.getElementById("tablero")
  
    uiBtn1 = document.getElementById("crearNuevo")
    uiBtn1.onclick = function(){
        var tableroInicial = tableroDeTxt(uiText.value);
        uiText.value = completarTablero(tableroInicial, true);
    }
	
	uiBtn2 = document.getElementById("completar")
	uiBtn2.onclick = function(){
        var tableroInicial = tableroDeTxt(uiText.value);
        uiText.value = completarTablero(tableroInicial, false);
	}

	uiBtn3 = document.getElementById("corregir")
	uiBtn3.onclick = function() {
		if (tableroUsado.length != 0){
			var tableroACorregir = tableroDeTxt(uiText.value);
			uiText.value = corregirTablero(tableroACorregir);
		} else{
			alert("Probá generar un tablero primero")
		}
	}
}

//*****************************************************************
//S: Recorrer el tablero

function recorrerFila(x, y, procesarPosicion) {
    for (var i = 0; i < 9; i++) {
        procesarPosicion(i + y * 9);   
    }
}

function recorrerColumna(x, y, procesarPosicion) {
    for ( var i = 0; i < 9; i++) {
        procesarPosicion(i * 9 + x);
    }
}

function recorrerSector(x, y, procesarPosicion) {
    var x_esqina = Math.floor(x/3) * 3;
    var y_esqina = Math.floor(y/3) * 3;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            procesarPosicion(y_esqina * 9 + x_esqina + i * 9 + j);
        }
    }
}

function t_recorrerSector() {
    var r = new Array();
    recorrerSector(3, 3, function(pos){r.push(pos)});
    logm("DBG", 1, "pos", r);
}

function t_recorrerSector_debeRedondear() {
    var r = new Array();
    recorrerSector(4, 4, function(pos){r.push(pos)});

    var r_esperado = [30,31,32,39,40,41,48,49,50];
    comparadorArray("t_recorrerSector_debeRedondear", r_esperado, r);
}

//*****************************************************************
//S: Disponibilidad en el tablero

function disponiblesRecorrido(datos, x, y, funcionesRecorrer) { //U: Devuelve un array de 9 elementos con verdadero si el elemento esta disponible
    var r = arrayDe(9, true);
  
    for (var i = 0; i < funcionesRecorrer.length; i++){ var funcionRecorrer = funcionesRecorrer[i];
                                                       funcionRecorrer(x, y, function(pos){
                                                           var num = datos[pos];
                                                           if (num != null) {
                                                               r[num - 1] = false; //A: En el array los valores van del 0 al 8, si encontre un 1 qiero false en la posicion cero
                                                           } //A: Anote qe ese numero no esta disponible
                                                       });
                                                      }
    return(r);
}

function disponiblesFila(datos, x, y){ //U: Prueba la disponobilidad solo en la fila
    return(disponiblesRecorrido(datos, x, y, [recorrerFila]));
}

function disponiblesColumna(datos, x, y){ //U: Prueba la disponibilidad solo en la columna
    return(disponiblesRecorrido(datos, x, y, [recorrerColumna]));
}

function disponiblesSector(datos, x, y){ //U: Prueba la disponibilidad solo en el sector
    return(disponiblesRecorrido(datos, x, y, [recorrerSector]));
}

function disponiblesXY(datos, x, y){ //Prueba la disponibilidad tanto de la fila como de la columna como del sector
    return(disponiblesRecorrido(datos, x, y, [recorrerFila, recorrerColumna, recorrerSector]));
}

function t_disponiblesFila(){
    var datos = [1, 2, 3, null, 5, 6, 7, 9, null];
    var disp = disponiblesFila(datos, 0, 0);
    logm("DBG", 1, "disponiblesFila", disp);
}

function t_disponibles(){
    var datos = [
        null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, 

        1, 2, 3, 4, 5, 6, null, null, null,
        null, null, null, 7, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, 
    
        null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, null
    ]; 
    var disp = disponiblesXY(datos, 4, 4);
    var numerosDisponibles = posicionesDisponibles(disp); //A: Desde cero
    logm("DBG", 1, "disponiblesXY", {disp:disp, numerosDisponibles:numerosDisponibles});
}

//******************************************************************
//S: Mueve de txt a array o viceversa

function tableroATxt(tablero){
    var s = '';
    for (var y = 0; y < 9; y++) { //A: Voy fila por fila
        s += y + ":  ";
        for (var x = 0; x < 9; x++) { //A: Para cada fila paso por todas las columnas
            s+= "  " + (tablero[y * 9 + x] || "_");
        }
        s += "\n";
    }
    Logger.log("\nTABLERO\n" + s)
    return(s)
}

function tableroDeTxt(txt){
    var r = new Array(9 * 9);
    var lineas = txt.split("\n");
    for (var i = 0; i < 9; i++) {
        var limpio = (lineas[i] || "").replace(/.*?:\s*/, "");
        var elementos = limpio.split(/\s+/);
        for (var j = 0; j < 9 ; j++) {
            var x = parseInt(elementos[j] || "_");
            r[i * 9 + j] = isNaN(x) ? null : x;
        }
    }
    return(r);
}

//*********************************************
//S: Crea, resuelve y corrige tableros

function completarTablero(tableroInicial, nuevo) {
    var listo = false;
    var qedanIntentos = 1000;

    probar: while (!listo && qedanIntentos){ qedanIntentos--;
											if (nuevo == true) { //A: Si le usuarie qiere crear un tablero nuevo lo hago de cero (...)
												var tablero = new Array(9 * 9);
											} else { //(...)Si qiere completar un tablero, uso el qe ya existe
                                            var tablero = tableroInicial.concat([]);
											}
    
                                            for (var y = 0; y < 9; y++) { //A: Voy fila por fila
                                                for (var x = 0; x < 9; x++) { //A: Para cada fila paso por todas las columnas
                                                    var disp = disponiblesXY(tablero, x, y);
                                                    var numerosDisponibles = posicionesDisponibles(disp);
        
                                                    if (tablero[y * 9 + x] == null && numerosDisponibles.length == 0) {
                                                        logm("ERR", 1, "disponibles no hay para", {x:x, y:y});
                                                        continue probar;
                                                    } else {
                                                        if (tablero[y * 9 + x] == null){ //A: La posicion estaba vacia, la lleno
                                                            var rand = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)] //A: Selecciono un numero al azar de entre los qe podia poner
                                                            tablero[y * 9 + x] = rand + 1;
                                                        }
                                                    }
                                                }
                                            }
											tableroUsado = tablero; //A: Para comparar en la correccion
											if(nuevo == true) {
												for (var y = 0; y < 9; y++){
													for (var x = 0; x < 9; x++){
														var disp = disponiblesXY(tablero, x, y);
														var numerosDisponibles = posicionesDisponibles(disp); //A: Me fijo cuantos numeros disponibles hay

														if (numerosDisponibles.length < 0){ //ESTE < 0 ESTA TEMPORALMENTE PARA PODER DEJAR LA PAGINA Y QE SIGA ANDANDO //A: Si todavia no escondi tres valores (para esta posicion)
															var rand = Math.floor(Math.random()); //A: "Tiro una moneda" para ver si lo escondo o no (las chances de qe qe no esconda ninguno es de 1/(2^81))
															if (rand == 0){
																tablero[y * 9 + x] = "_";
															}
														}
													}
												}
											}
											listo = true;
                                           }
	if (!qedanIntentos){
		alert("Me qedé sin intentos, no puedo resolver este sudoku")
	}
    return(tableroATxt(tablero));
}

function generarTableros(){
    var vistos = {};
    var cuantos = 10;
  
    for (var i = 0; i < cuantos; i++){
        var t = completarTablero();
        vistos[t] = (vistos[t] || 0) + 1;
    }
    Logger.log(vistos);
}

function corregirTablero(tableroACorregir) {
	var tablero = tableroACorregir.concat([])
	var errores = comparadorArray("Checkeo de corrección", tableroUsado, tablero);
	for (var i = 0; i < errores.length; i++) {
		if (tablero[i] != null){ //A: No qiero qe corrija espacios qe sigen vacios
			tablero[errores[i]] = "/"
		}
	}
	alert("Ahí corregí, todos los qe estaban mal los reemplacé con un '/'")
	return(tableroATxt(tablero));
} 