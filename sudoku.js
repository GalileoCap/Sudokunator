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
  for (var i = 0; i < r_esperado.length; i++){
    if (r[i] != r_esperado[i]) {
      logm("ERR", 1, "fallo", {i:i, r:r[i], r_esperado:r_esperado[i]});
      fallo = true;
    }
  }
  logm("DBG", 1, cartel, {fallo:fallo, r:r});
}

//*****************************************************************
//S: Para la interfaz del GDocs

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Mi menu')
    .addItem('Saludar', 'saludar')
    .addToUi();
};

function saludar() {
  Browser.msgBox("Alo");
};

//*****************************************************************
//S: Para la interfaz del browser
var uiText;
var uiBtn;

function iniciarEnBrowser(){
  uiText = document.getElementById("tablero")
  
  uiBtn = document.getElementById("procesar")
  uiBtn.onclick = function(){generarTableros()}
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
 };

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
//S: Crear el tablero

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

function crearTablero() {
  var listo = false;

  probar: while (!listo){
    var tablero = new Array(9 * 9); //A: Defini tablero
    
    for (var y = 0; y < 9; y++) { //A: Voy fila por fila
      for (var x = 0; x < 9; x++) { //A: Para cada fila paso por todas las columnas
        var disp = disponiblesXY(tablero, x, y);
        var numerosDisponibles = posicionesDisponibles(disp);
        
        if (numerosDisponibles.length < 1) {
          logm("ERR", 1, "disponibles no hay para", {x:x, y:y});
          continue probar;
        } else {
          var rand = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)] //A: Selecciono un numero al azar de entre los qe podia poner
          tablero[y * 9 + x] = rand + 1;
        }
      }
    }
    listo = true;
  }
  return(tableroATxt(tablero));
}

function generarTableros(){
  var vistos = {};
  
  for (var i = 0; i < 10; i++){
    var t = crearTablero();
    vistos[t] = (vistos[t] || 0) + 1;
  }
  Logger.log(vistos);
}
