/* ============================================================
   SIMULADOR DE COMPILADOR - LENGUAJE CACAO
   Analizador Lexico y Sintactico LL(1)
   HTML + CSS + JavaScript puro (para GitHub Pages)
   ============================================================ */

/* ------------------------------------------------------------
   1. DEFINICION DEL LENGUAJE CACAO
   ------------------------------------------------------------ */

// Palabras reservadas (categoria 1)
const PALABRAS_RESERVADAS = [
  "inicio", "fin", "abrir", "cerrar",
  "numero", "decimal", "texto", "logico",
  "cuando", "hacer", "repetir", "mostrar", "pedir",
  "verdadero", "falso"
];

// Conectores logicos (categoria 8)
const CONECTORES = ["y", "o", "no"];

// Codigos de categoria (segun la taxonomia de Cacao)
const CATEGORIAS = {
  1:  "Palabras reservadas",
  2:  "Operadores aritmeticos",
  3:  "Identificadores",
  4:  "Constantes",
  5:  "Simbolos de agrupacion",
  6:  "Delimitadores",
  7:  "Simbolos de comparacion",
  8:  "Simbolos conectores",
  9:  "Literales",
  10: "Asignacion"
};

/* ------------------------------------------------------------
   2. ANALIZADOR LEXICO
   Convierte el codigo fuente en una lista de tokens.
   Detecta errores lexicos con numero de linea.
   ------------------------------------------------------------ */

function analizarLexico(codigo) {
  const tokens = [];
  const errores = [];
  const tablaSimbolos = []; // identificadores unicos
  const simbolosVistos = {};

  const lineas = codigo.split("\n");
  const totalLineas = lineas.length;

  // Contadores de codigo por categoria (para el token cat+codigo)
  const contadorCat = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0};

  for (let nl = 0; nl < lineas.length; nl++) {
    const linea = lineas[nl];
    const numLinea = nl + 1;
    let i = 0;

    while (i < linea.length) {
      const c = linea[i];

      // Espacios y tabs: se ignoran
      if (c === " " || c === "\t" || c === "\r") { i++; continue; }

      // ---- IDENTIFICADOR: #[a-zA-Z_][a-zA-Z0-9_]* ----
      if (c === "#") {
        let j = i + 1;
        if (j < linea.length && /[a-zA-Z_]/.test(linea[j])) {
          j++;
          while (j < linea.length && /[a-zA-Z0-9_]/.test(linea[j])) j++;
          const lexema = linea.slice(i, j);
          contadorCat[3]++;
          const token = "003" + String(contadorCat[3]).padStart(3, "0");
          tokens.push({ lexema, categoria: 3, codigo: contadorCat[3], token, linea: numLinea });
          // tabla de simbolos: identificadores unicos
          if (!simbolosVistos[lexema]) {
            simbolosVistos[lexema] = true;
            tablaSimbolos.push({ nombre: lexema, categoria: "Identificador", linea: numLinea });
          }
          i = j;
          continue;
        } else {
          errores.push({ tipo: "Lexico", mensaje: "Identificador mal formado: '#' debe ir seguido de letra o '_'", lexema: "#", linea: numLinea });
          i++;
          continue;
        }
      }

      // ---- CONSTANTE: [0-9]+(\.[0-9]+)? ----
      if (/[0-9]/.test(c)) {
        let j = i + 1;
        while (j < linea.length && /[0-9]/.test(linea[j])) j++;
        // parte decimal (solo si hay digito tras el punto: maximal munch)
        if (j < linea.length && linea[j] === "." && j + 1 < linea.length && /[0-9]/.test(linea[j + 1])) {
          j++; // consume el punto
          while (j < linea.length && /[0-9]/.test(linea[j])) j++;
        }
        const lexema = linea.slice(i, j);
        contadorCat[4]++;
        const token = "004" + String(contadorCat[4]).padStart(3, "0");
        tokens.push({ lexema, categoria: 4, codigo: contadorCat[4], token, linea: numLinea });
        i = j;
        continue;
      }

      // ---- LITERAL: "[^"\n]*" ----
      if (c === '"') {
        let j = i + 1;
        while (j < linea.length && linea[j] !== '"') j++;
        if (j < linea.length && linea[j] === '"') {
          const lexema = linea.slice(i, j + 1);
          contadorCat[9]++;
          const token = "009" + String(contadorCat[9]).padStart(3, "0");
          tokens.push({ lexema, categoria: 9, codigo: contadorCat[9], token, linea: numLinea });
          i = j + 1;
          continue;
        } else {
          errores.push({ tipo: "Lexico", mensaje: "Literal sin cerrar (falta comilla de cierre)", lexema: linea.slice(i), linea: numLinea });
          i = linea.length;
          continue;
        }
      }

      // ---- PALABRA (reservada o conector): [a-zA-Z]+ ----
      if (/[a-zA-Z]/.test(c)) {
        let j = i + 1;
        while (j < linea.length && /[a-zA-Z]/.test(linea[j])) j++;
        const lexema = linea.slice(i, j);
        if (PALABRAS_RESERVADAS.includes(lexema)) {
          contadorCat[1]++;
          const token = "001" + String(contadorCat[1]).padStart(3, "0");
          tokens.push({ lexema, categoria: 1, codigo: contadorCat[1], token, linea: numLinea });
        } else if (CONECTORES.includes(lexema)) {
          contadorCat[8]++;
          const token = "008" + String(contadorCat[8]).padStart(3, "0");
          tokens.push({ lexema, categoria: 8, codigo: contadorCat[8], token, linea: numLinea });
        } else {
          errores.push({ tipo: "Lexico", mensaje: "Palabra no reconocida (los identificadores deben iniciar con '#')", lexema, linea: numLinea });
        }
        i = j;
        continue;
      }

      // ---- OPERADORES DE COMPARACION (2 chars primero) y ASIGNACION ----
      // == != <= >=  /  =  <  >  !
      const dos = linea.slice(i, i + 2);
      if (["==", "!=", "<=", ">="].includes(dos)) {
        contadorCat[7]++;
        const token = "007" + String(contadorCat[7]).padStart(3, "0");
        tokens.push({ lexema: dos, categoria: 7, codigo: contadorCat[7], token, linea: numLinea });
        i += 2;
        continue;
      }
      if (c === "<" || c === ">") {
        contadorCat[7]++;
        const token = "007" + String(contadorCat[7]).padStart(3, "0");
        tokens.push({ lexema: c, categoria: 7, codigo: contadorCat[7], token, linea: numLinea });
        i++;
        continue;
      }
      if (c === "=") {
        contadorCat[10]++;
        const token = "010" + String(contadorCat[10]).padStart(3, "0");
        tokens.push({ lexema: "=", categoria: 10, codigo: contadorCat[10], token, linea: numLinea });
        i++;
        continue;
      }
      if (c === "!") {
        errores.push({ tipo: "Lexico", mensaje: "Simbolo '!' invalido (solo se permite '!=')", lexema: "!", linea: numLinea });
        i++;
        continue;
      }

      // ---- OPERADORES ARITMETICOS: + - * / % ----
      if (["+", "-", "*", "/", "%"].includes(c)) {
        contadorCat[2]++;
        const token = "002" + String(contadorCat[2]).padStart(3, "0");
        tokens.push({ lexema: c, categoria: 2, codigo: contadorCat[2], token, linea: numLinea });
        i++;
        continue;
      }

      // ---- AGRUPACION: ( ) ----
      if (c === "(" || c === ")") {
        contadorCat[5]++;
        const token = "005" + String(contadorCat[5]).padStart(3, "0");
        tokens.push({ lexema: c, categoria: 5, codigo: contadorCat[5], token, linea: numLinea });
        i++;
        continue;
      }

      // ---- DELIMITADORES: . , ----
      if (c === "." || c === ",") {
        contadorCat[6]++;
        const token = "006" + String(contadorCat[6]).padStart(3, "0");
        tokens.push({ lexema: c, categoria: 6, codigo: contadorCat[6], token, linea: numLinea });
        i++;
        continue;
      }

      // ---- CUALQUIER OTRO CARACTER: error lexico ----
      errores.push({ tipo: "Lexico", mensaje: "Caracter no reconocido en el lenguaje Cacao", lexema: c, linea: numLinea });
      i++;
    }
  }

  return { tokens, errores, tablaSimbolos, totalLineas };
}

/* ------------------------------------------------------------
   3. ANALIZADOR SINTACTICO LL(1)
   Usa la tabla LL(1) de Cacao. Construye el arbol y detecta
   errores sintacticos.
   ------------------------------------------------------------ */

// Convierte un token lexico al simbolo terminal que usa la gramatica
function terminalDe(tok) {
  switch (tok.categoria) {
    case 1: return tok.lexema;        // reservadas: su propio lexema
    case 8: return tok.lexema;        // conectores y/o/no
    case 3: return "id";
    case 4: return "constante";
    case 9: return "literal";
    case 2: return tok.lexema;        // + - * / %
    case 5: return tok.lexema;        // ( )
    case 6: return tok.lexema;        // . ,
    case 7: return tok.lexema;        // == != <= >= < >
    case 10: return "=";
    default: return tok.lexema;
  }
}

// Producciones (lado derecho). El lado izquierdo es la clave.
// Cada produccion es un arreglo de simbolos. "eps" = epsilon.
// Los no terminales van en MAYUSCULAS-cortas; el resto son terminales.
const NO_TERMINALES = new Set([
  "P","LS","S","D","Dp","TP","A","C","CI","M","PD",
  "CL","CLp","CS","OPR","E","Ep","T","Tp","F"
]);

// Tabla LL(1): TABLA[noTerminal][terminal] = produccion (arreglo)
const TABLA = {
  P: { "inicio": ["inicio","LS","fin"] },
  LS: {
    "numero":["S","LS"], "decimal":["S","LS"], "texto":["S","LS"], "logico":["S","LS"],
    "id":["S","LS"], "cuando":["S","LS"], "repetir":["S","LS"], "mostrar":["S","LS"], "pedir":["S","LS"],
    "fin":["eps"], "cerrar":["eps"]
  },
  S: {
    "numero":["D"], "decimal":["D"], "texto":["D"], "logico":["D"],
    "id":["A"], "cuando":["C"], "repetir":["CI"], "mostrar":["M"], "pedir":["PD"]
  },
  D: {
    "numero":["TP","id","Dp"], "decimal":["TP","id","Dp"],
    "texto":["TP","id","Dp"], "logico":["TP","id","Dp"]
  },
  Dp: { "=":["=","E","."], ".":["."] },
  TP: { "numero":["numero"], "decimal":["decimal"], "texto":["texto"], "logico":["logico"] },
  A: { "id":["id","=","E","."] },
  C: { "cuando":["cuando","(","CL",")","hacer","abrir","LS","cerrar"] },
  CI: { "repetir":["repetir","(","CL",")","hacer","abrir","LS","cerrar"] },
  M: { "mostrar":["mostrar","E","."] },
  PD: { "pedir":["pedir","literal",",","id","."] },
  CL: {
    "no":["CS","CLp"], "id":["CS","CLp"], "constante":["CS","CLp"], "literal":["CS","CLp"],
    "verdadero":["CS","CLp"], "falso":["CS","CLp"], "(":["CS","CLp"]
  },
  CLp: { "y":["y","CS","CLp"], "o":["o","CS","CLp"], ")":["eps"] },
  CS: {
    "no":["no","CS"],
    "id":["E","OPR","E"], "constante":["E","OPR","E"], "literal":["E","OPR","E"],
    "verdadero":["E","OPR","E"], "falso":["E","OPR","E"], "(":["E","OPR","E"]
  },
  OPR: { "==":["=="], "!=":["!="], "<=":["<="], ">=":[">="], "<":["<"], ">":[">"] },
  E: {
    "id":["T","Ep"], "constante":["T","Ep"], "literal":["T","Ep"],
    "verdadero":["T","Ep"], "falso":["T","Ep"], "(":["T","Ep"]
  },
  Ep: {
    "+":["+","T","Ep"], "-":["-","T","Ep"],
    ".":["eps"], "==":["eps"], "!=":["eps"], "<=":["eps"], ">=":["eps"], "<":["eps"], ">":["eps"],
    "y":["eps"], "o":["eps"], ")":["eps"]
  },
  T: {
    "id":["F","Tp"], "constante":["F","Tp"], "literal":["F","Tp"],
    "verdadero":["F","Tp"], "falso":["F","Tp"], "(":["F","Tp"]
  },
  Tp: {
    "*":["*","F","Tp"], "/":["/","F","Tp"], "%":["%","F","Tp"],
    "+":["eps"], "-":["eps"], ".":["eps"], "==":["eps"], "!=":["eps"], "<=":["eps"],
    ">=":["eps"], "<":["eps"], ">":["eps"], "y":["eps"], "o":["eps"], ")":["eps"]
  },
  F: {
    "id":["id"], "constante":["constante"], "literal":["literal"],
    "verdadero":["verdadero"], "falso":["falso"], "(":["(","E",")"]
  }
};

// Nombre descriptivo de cada no terminal (para el arbol)
const NOMBRE_NT = {
  P:"PROGRAMA", LS:"LISTA_SENT", S:"SENTENCIA", D:"DECLARACION", Dp:"PARTE_DECL",
  TP:"TIPO", A:"ASIGNACION", C:"CONDICION", CI:"CICLO", M:"MOSTRAR", PD:"PEDIR",
  CL:"COND_LOGICA", CLp:"CONT_COND_LOG", CS:"COND_SIMPLE", OPR:"OP_REL",
  E:"EXPRESION", Ep:"CONT_EXPR", T:"TERMINO", Tp:"CONT_TERM", F:"FACTOR"
};

function analizarSintactico(tokens) {
  const errores = [];

  // Construir la lista de terminales de entrada + $
  const entrada = tokens.map(t => ({ term: terminalDe(t), lexema: t.lexema, linea: t.linea }));
  entrada.push({ term: "$", lexema: "$", linea: tokens.length ? tokens[tokens.length-1].linea : 1 });

  // Nodo raiz del arbol
  const raiz = { simbolo: "P", nombre: NOMBRE_NT["P"], hijos: [], esNT: true };

  // Pila de analisis: guardamos pares { sim, nodo }
  // El nodo es donde colgar los hijos cuando se expande.
  const pila = [];
  pila.push({ sim: "$", nodo: null });
  pila.push({ sim: "P", nodo: raiz });

  let ip = 0; // indice de entrada
  let pasos = 0;
  const MAX_PASOS = 100000;
  let aceptada = true;

  while (pila.length > 0 && pasos < MAX_PASOS) {
    pasos++;
    const tope = pila[pila.length - 1];
    const actual = entrada[ip];

    // Fin: tope $ y entrada $
    if (tope.sim === "$") {
      if (actual.term === "$") {
        // aceptada
      } else {
        errores.push({ tipo:"Sintactico", mensaje:"Se esperaba el fin del programa pero hay tokens de mas", lexema: actual.lexema, linea: actual.linea });
        aceptada = false;
      }
      break;
    }

    if (!NO_TERMINALES.has(tope.sim)) {
      // tope es TERMINAL: debe coincidir (match)
      if (tope.sim === actual.term) {
        // colgar la hoja con el lexema real si el nodo lo pide
        if (tope.nodoHoja) {
          tope.nodoHoja.lexemaReal = actual.lexema;
        }
        pila.pop();
        ip++;
      } else {
        errores.push({
          tipo:"Sintactico",
          mensaje:`Se esperaba '${tope.sim}' pero se encontro '${actual.term}'`,
          lexema: actual.lexema, linea: actual.linea
        });
        aceptada = false;
        break;
      }
      continue;
    }

    // tope es NO TERMINAL: consultar tabla
    const fila = TABLA[tope.sim];
    const prod = fila ? fila[actual.term] : undefined;

    if (!prod) {
      errores.push({
        tipo:"Sintactico",
        mensaje:`No se esperaba '${actual.term}' al analizar ${NOMBRE_NT[tope.sim]}`,
        lexema: actual.lexema, linea: actual.linea
      });
      aceptada = false;
      break;
    }

    // Expandir: quitar el NT de la pila y apilar la produccion en orden inverso
    pila.pop();
    const nodoPadre = tope.nodo;

    if (prod.length === 1 && prod[0] === "eps") {
      // epsilon: agregar hoja ε al arbol
      if (nodoPadre) nodoPadre.hijos.push({ simbolo:"eps", nombre:"ε", hijos:[], esNT:false });
      continue;
    }

    // Crear los nodos hijos en orden normal y colgarlos del padre
    const nodosHijos = prod.map(sim => {
      if (NO_TERMINALES.has(sim)) {
        return { simbolo: sim, nombre: NOMBRE_NT[sim], hijos: [], esNT: true };
      } else {
        return { simbolo: sim, nombre: sim, hijos: [], esNT: false, lexemaReal: null };
      }
    });
    if (nodoPadre) nodoPadre.hijos.push(...nodosHijos);

    // Apilar en orden inverso, asociando cada simbolo con su nodo
    for (let k = prod.length - 1; k >= 0; k--) {
      const sim = prod[k];
      const nodo = nodosHijos[k];
      if (NO_TERMINALES.has(sim)) {
        pila.push({ sim, nodo });
      } else {
        pila.push({ sim, nodo: null, nodoHoja: nodo });
      }
    }
  }

  return { errores, arbol: raiz, aceptada };
}

/* ------------------------------------------------------------
   3b. SIMULACION DE PILA LL(1) (tabla paso a paso, dinamica)
   Devuelve los pasos del analisis sintactico con pila.
   ------------------------------------------------------------ */

function simularPila(tokens) {
  const entrada = tokens.map(t => ({ term: terminalDe(t), lexema: t.lexema }));
  entrada.push({ term: "$", lexema: "$" });

  // pila como arreglo de simbolos (cima al final del array, se muestra invertida)
  let pila = ["$", "P"];
  let ip = 0;
  const pasos = [];
  let n = 0;
  const MAX = 100000;
  let estado = "en proceso";

  function pilaStr() {
    // mostrar con la cima a la IZQUIERDA
    return pila.slice().reverse().join(" ");
  }
  function entradaStr() {
    return entrada.slice(ip).map(e => e.term).join(" ");
  }

  while (pila.length > 0 && n < MAX) {
    n++;
    const tope = pila[pila.length - 1];
    const actual = entrada[ip];

    if (tope === "$") {
      if (actual.term === "$") {
        pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: "ACEPTADA" });
        estado = "aceptada";
      } else {
        pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: "ERROR: tokens de mas" });
        estado = "error";
      }
      break;
    }

    if (!NO_TERMINALES.has(tope)) {
      // terminal: match
      if (tope === actual.term) {
        pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: "match " + tope });
        pila.pop();
        ip++;
      } else {
        pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: `ERROR: se esperaba '${tope}'` });
        estado = "error";
        break;
      }
      continue;
    }

    // no terminal: consultar tabla
    const fila = TABLA[tope];
    const prod = fila ? fila[actual.term] : undefined;
    if (!prod) {
      pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: `ERROR: no se esperaba '${actual.term}'` });
      estado = "error";
      break;
    }

    let accionTxt;
    if (prod.length === 1 && prod[0] === "eps") {
      accionTxt = tope + " -> ε";
      pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: accionTxt });
      pila.pop();
    } else {
      accionTxt = tope + " -> " + prod.join(" ");
      pasos.push({ n, pila: pilaStr(), entrada: entradaStr(), accion: accionTxt });
      pila.pop();
      for (let k = prod.length - 1; k >= 0; k--) pila.push(prod[k]);
    }
  }

  return { pasos, estado };
}

/* ------------------------------------------------------------
   3c. CONTENIDO FIJO DE LA GRAMATICA (factorizacion, recursividad,
   primeros, siguientes) - son propiedades de la gramatica Cacao.
   ------------------------------------------------------------ */

const TEXTO_FACTORIZACION =
`FACTORIZACION POR LA IZQUIERDA EN LA GRAMATICA CACAO

Se revisa cada no terminal de la gramatica para detectar
producciones que comparten un prefijo comun.

Resultado: la gramatica Cacao tiene UN caso con prefijo comun,
la declaracion ( D ), que compartia  TP id :

  ANTES:  D -> TP id = E .
             | TP id .

  DESPUES (factorizada):
    D  -> TP id D'
    D' -> = E .
        | .

El resto de no terminales NO comparten prefijos comunes, por lo
que no necesitan factorizacion.`;

const TEXTO_RECURSIVIDAD =
`ELIMINACION DE RECURSIVIDAD IZQUIERDA EN LA GRAMATICA CACAO

Se revisa cada no terminal para detectar producciones de la forma
A -> A alfa (recursividad por la izquierda), que son incompatibles
con el analisis LL(1).

Resultado: la gramatica Cacao NO tiene recursividad por la
izquierda. Se diseno directamente con recursividad por la DERECHA
(la forma apta para LL(1)), usando reglas de continuacion:

  LS  -> S LS | ε
  E   -> T E'
  E'  -> + T E' | - T E' | ε
  T   -> F T'
  T'  -> * F T' | / F T' | % F T' | ε
  CL  -> CS CL'
  CL' -> y CS CL' | o CS CL' | ε

En todas, el no terminal que se repite aparece al FINAL (a la
derecha). Como no existe ninguna produccion de la forma A -> A alfa,
no hay recursividad izquierda que eliminar.`;

const TEXTO_PRIMEROS =
`P(P)   = { inicio }
P(LS)  = { numero, decimal, texto, logico, id, cuando, repetir, mostrar, pedir, ε }
P(S)   = { numero, decimal, texto, logico, id, cuando, repetir, mostrar, pedir }
P(D)   = { numero, decimal, texto, logico }
P(D')  = { =, . }
P(TP)  = { numero, decimal, texto, logico }
P(A)   = { id }
P(C)   = { cuando }
P(CI)  = { repetir }
P(M)   = { mostrar }
P(PD)  = { pedir }
P(CL)  = { no, id, constante, literal, verdadero, falso, ( }
P(CL') = { y, o, ε }
P(CS)  = { no, id, constante, literal, verdadero, falso, ( }
P(OPR) = { ==, !=, <=, >=, <, > }
P(E)   = { id, constante, literal, verdadero, falso, ( }
P(E')  = { +, -, ε }
P(T)   = { id, constante, literal, verdadero, falso, ( }
P(T')  = { *, /, %, ε }
P(F)   = { id, constante, literal, verdadero, falso, ( }`;

const TEXTO_SIGUIENTES =
`S(P)   = { $ }
S(LS)  = { fin, cerrar }
S(S)   = { numero, decimal, texto, logico, id, cuando, repetir, mostrar, pedir, fin, cerrar }
S(D)   = S(S)
S(A)   = S(S)
S(C)   = S(S)
S(CI)  = S(S)
S(M)   = S(S)
S(PD)  = S(S)
S(TP)  = { id }
S(D')  = S(D)
S(CL)  = { ) }
S(CL') = { ) }
S(CS)  = { y, o, ) }
S(OPR) = { id, constante, literal, verdadero, falso, ( }
S(E)   = { ., ==, !=, <=, >=, <, >, y, o, ) }
S(E')  = S(E)
S(T)   = { +, -, ., ==, !=, <=, >=, <, >, y, o, ) }
S(T')  = S(T)
S(F)   = { *, /, %, +, -, ., ==, !=, <=, >=, <, >, y, o, ) }`;

/* ------------------------------------------------------------
   3d. MATRIZ DE LA TABLA LL(1) (fija, de la gramatica Cacao)
   Se genera desde la constante TABLA para garantizar coherencia.
   ------------------------------------------------------------ */

// orden de filas (no terminales) y columnas (terminales) para mostrar
const ORDEN_NT = ["P","LS","S","D","Dp","TP","A","C","CI","M","PD","CL","CLp","CS","OPR","E","Ep","T","Tp","F"];
const ORDEN_TERM = [
  "inicio","fin","abrir","cerrar","numero","decimal","texto","logico",
  "id","constante","literal","verdadero","falso",
  "cuando","repetir","hacer","mostrar","pedir",
  "=","(",")",".",",","+","-","*","/","%","==","!=","<=",">=","<",">","y","o","no","$"
];

function prodATexto(nt, prod) {
  if (prod.length === 1 && prod[0] === "eps") return nt + "->ε";
  return nt + "->" + prod.join(" ");
}

function construirMatrizLL1(contenedor) {
  // determinar que terminales aparecen realmente en la tabla (para no mostrar columnas vacias)
  const usados = new Set();
  ORDEN_NT.forEach(nt => {
    const fila = TABLA[nt] || {};
    Object.keys(fila).forEach(term => usados.add(term));
  });
  const columnas = ORDEN_TERM.filter(t => usados.has(t));

  let html = '<table class="matriz-ll1"><thead><tr><th class="esq">NT \\ term</th>';
  columnas.forEach(c => { html += `<th>${escapar(c)}</th>`; });
  html += "</tr></thead><tbody>";

  ORDEN_NT.forEach(nt => {
    html += `<tr><th class="fila-nt">${nt}</th>`;
    const fila = TABLA[nt] || {};
    columnas.forEach(term => {
      const prod = fila[term];
      if (prod) {
        html += `<td class="celda-prod">${escapar(prodATexto(nt, prod))}</td>`;
      } else {
        html += `<td class="celda-vacia"></td>`;
      }
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  contenedor.innerHTML = html;
}

/* ------------------------------------------------------------
   4. RENDER DEL ARBOL (texto indentado, estilo provisional)
   El render visual con circulos se hace en dibujarArbol() abajo.
   ------------------------------------------------------------ */

function arbolATexto(nodo, prefijo = "", esUltimo = true) {
  let etiqueta = nodo.esNT ? nodo.nombre : (nodo.lexemaReal ? `${nodo.simbolo} (${nodo.lexemaReal})` : nodo.nombre);
  let salida = prefijo + (esUltimo ? "└── " : "├── ") + etiqueta + "\n";
  const nuevoPrefijo = prefijo + (esUltimo ? "    " : "│   ");
  for (let i = 0; i < nodo.hijos.length; i++) {
    salida += arbolATexto(nodo.hijos[i], nuevoPrefijo, i === nodo.hijos.length - 1);
  }
  return salida;
}

/* ------------------------------------------------------------
   5. DIBUJO DEL ARBOL CON SVG (circulos planos naranjas + lineas)
   ------------------------------------------------------------ */

function calcularLayout(nodo) {
  // Asigna posiciones x,y. Devuelve ancho del subarbol.
  let leafX = 0;
  const NIVEL_ALTO = 70;
  const HOJA_ANCHO = 46;

  function asignar(n, prof) {
    n.y = 40 + prof * NIVEL_ALTO;
    if (n.hijos.length === 0) {
      n.x = leafX * HOJA_ANCHO + 30;
      leafX++;
    } else {
      n.hijos.forEach(h => asignar(h, prof + 1));
      const primero = n.hijos[0].x;
      const ultimo = n.hijos[n.hijos.length - 1].x;
      n.x = (primero + ultimo) / 2;
    }
  }
  asignar(nodo, 0);
}

function etiquetaNodo(n) {
  if (n.esNT) return n.nombre;
  if (n.simbolo === "eps") return "ε";
  return n.lexemaReal ? n.lexemaReal : n.simbolo;
}

// estado del arbol interactivo (para zoom/paneo)
let _arbolEstado = { escala: 1, panX: 0, panY: 0 };

function dibujarArbol(raiz, contenedor) {
  contenedor.innerHTML = "";
  calcularLayout(raiz);

  // calcular dimensiones del contenido
  let maxX = 0, maxY = 0;
  (function rec(n){ maxX=Math.max(maxX,n.x); maxY=Math.max(maxY,n.y); n.hijos.forEach(rec); })(raiz);
  const W = maxX + 80;
  const H = maxY + 80;

  const svgns = "http://www.w3.org/2000/svg";

  // --- barra de herramientas ---
  const barra = document.createElement("div");
  barra.className = "arbol-barra";
  barra.innerHTML = `
    <button class="btn-arbol" id="zoom-mas" title="Acercar">+</button>
    <button class="btn-arbol" id="zoom-menos" title="Alejar">−</button>
    <button class="btn-arbol" id="zoom-reset" title="Restablecer vista">⟳</button>
    <button class="btn-arbol" id="arbol-copiar" title="Copiar arbol (texto)">⧉ Copiar</button>
    <button class="btn-arbol" id="arbol-descargar" title="Descargar imagen SVG">⤓ SVG</button>
    <span class="arbol-ayuda">Rueda = zoom &middot; arrastrar fondo = mover &middot; arrastrar nodo = reposicionar</span>
  `;
  contenedor.appendChild(barra);

  // --- lienzo SVG ---
  const svg = document.createElementNS(svgns, "svg");
  svg.setAttribute("class", "arbol-svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "460");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  // marcador de flecha
  const defs = document.createElementNS(svgns, "defs");
  defs.innerHTML = `<marker id="flecha-arbol" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"/></marker>`;
  svg.appendChild(defs);

  // grupo transformable (para zoom y paneo)
  const grupo = document.createElementNS(svgns, "g");
  grupo.setAttribute("class", "arbol-grupo");
  svg.appendChild(grupo);

  // registrar nodos para poder mover y redibujar lineas
  const registroLineas = []; // { linea, padre, hijo }
  const registroNodos = [];  // { nodo, g, circ, txt, sub }

  // calcula el punto en el borde del circulo (para que la flecha no quede tapada)
  function puntoBorde(x1, y1, x2, y2, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const d = Math.hypot(dx, dy) || 1;
    return { x: x2 - (dx / d) * r, y: y2 - (dy / d) * r };
  }

  // 1) lineas con flecha (van detras)
  (function lineas(n){
    n.hijos.forEach(h => {
      const ln = document.createElementNS(svgns, "line");
      const rHijo = h.hijos.length === 0 ? 16 : 18;
      const p = puntoBorde(n.x, n.y, h.x, h.y, rHijo + 3);
      ln.setAttribute("x1", n.x); ln.setAttribute("y1", n.y);
      ln.setAttribute("x2", p.x); ln.setAttribute("y2", p.y);
      ln.setAttribute("class", "arbol-linea");
      ln.setAttribute("marker-end", "url(#flecha-arbol)");
      grupo.appendChild(ln);
      registroLineas.push({ linea: ln, padre: n, hijo: h });
      lineas(h);
    });
  })(raiz);

  // 2) nodos (circulos + texto), arrastrables
  (function nodos(n){
    const esHoja = n.hijos.length === 0;
    const r = esHoja ? 16 : 18;
    const g = document.createElementNS(svgns, "g");
    g.setAttribute("class", "arbol-nodo-g");
    g.style.cursor = "grab";

    const circ = document.createElementNS(svgns, "circle");
    circ.setAttribute("cx", n.x); circ.setAttribute("cy", n.y);
    circ.setAttribute("r", r);
    circ.setAttribute("class", n.esNT ? "arbol-nodo-nt" : (n.simbolo === "eps" ? "arbol-nodo-eps" : "arbol-nodo-term"));
    g.appendChild(circ);

    const full = etiquetaNodo(n);
    const corta = n.esNT ? n.simbolo : (full.length > 4 ? full.slice(0,4) : full);
    const txt = document.createElementNS(svgns, "text");
    txt.setAttribute("x", n.x); txt.setAttribute("y", n.y);
    txt.setAttribute("class", "arbol-texto-nodo");
    txt.textContent = corta;
    g.appendChild(txt);

    const sub = document.createElementNS(svgns, "text");
    sub.setAttribute("x", n.x); sub.setAttribute("y", n.y + (esHoja ? 30 : 34));
    sub.setAttribute("class", "arbol-texto-sub");
    sub.textContent = full;
    g.appendChild(sub);

    grupo.appendChild(g);
    registroNodos.push({ nodo: n, g, circ, txt, sub, r, esHoja });
    n.hijos.forEach(nodos);
  })(raiz);

  contenedor.appendChild(svg);

  // ---- redibujar posiciones (tras mover un nodo) ----
  function actualizarNodo(reg) {
    const n = reg.nodo;
    reg.circ.setAttribute("cx", n.x); reg.circ.setAttribute("cy", n.y);
    reg.txt.setAttribute("x", n.x); reg.txt.setAttribute("y", n.y);
    reg.sub.setAttribute("x", n.x); reg.sub.setAttribute("y", n.y + (reg.esHoja ? 30 : 34));
    // lineas conectadas a este nodo
    registroLineas.forEach(L => {
      if (L.padre === n) { L.linea.setAttribute("x1", n.x); L.linea.setAttribute("y1", n.y); }
      if (L.hijo === n) {
        const rHijo = n.hijos.length === 0 ? 16 : 18;
        const p = puntoBorde(L.padre.x, L.padre.y, n.x, n.y, rHijo + 3);
        L.linea.setAttribute("x2", p.x); L.linea.setAttribute("y2", p.y);
      }
    });
  }

  // ---- conversion de coordenadas pantalla -> svg ----
  function aCoordSVG(evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const ctm = grupo.getScreenCTM().inverse();
    return pt.matrixTransform(ctm);
  }

  // ---- aplicar transform (zoom + paneo) ----
  function aplicarTransform() {
    const e = _arbolEstado;
    grupo.setAttribute("transform", `translate(${e.panX},${e.panY}) scale(${e.escala})`);
  }
  _arbolEstado = { escala: 1, panX: 0, panY: 0 };
  aplicarTransform();

  // ---- ZOOM con rueda ----
  svg.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    const factor = evt.deltaY < 0 ? 1.12 : 0.89;
    const nueva = Math.min(4, Math.max(0.2, _arbolEstado.escala * factor));
    _arbolEstado.escala = nueva;
    aplicarTransform();
  }, { passive: false });

  // ---- ARRASTRE: nodo individual o paneo del fondo ----
  let arrastrando = null;   // reg del nodo, o "pan"
  let inicio = { x: 0, y: 0 };
  let panInicio = { x: 0, y: 0 };

  svg.addEventListener("mousedown", (evt) => {
    const reg = registroNodos.find(R => R.g.contains(evt.target));
    if (reg) {
      arrastrando = reg;
      reg.g.style.cursor = "grabbing";
    } else {
      arrastrando = "pan";
      svg.style.cursor = "grabbing";
      panInicio = { x: _arbolEstado.panX, y: _arbolEstado.panY };
      inicio = { x: evt.clientX, y: evt.clientY };
    }
  });

  window.addEventListener("mousemove", (evt) => {
    if (!arrastrando) return;
    if (arrastrando === "pan") {
      _arbolEstado.panX = panInicio.x + (evt.clientX - inicio.x);
      _arbolEstado.panY = panInicio.y + (evt.clientY - inicio.y);
      aplicarTransform();
    } else {
      const p = aCoordSVG(evt);
      arrastrando.nodo.x = p.x;
      arrastrando.nodo.y = p.y;
      actualizarNodo(arrastrando);
    }
  });

  window.addEventListener("mouseup", () => {
    if (arrastrando && arrastrando !== "pan") arrastrando.g.style.cursor = "grab";
    svg.style.cursor = "default";
    arrastrando = null;
  });

  // ---- botones de zoom ----
  barra.querySelector("#zoom-mas").addEventListener("click", () => {
    _arbolEstado.escala = Math.min(4, _arbolEstado.escala * 1.2); aplicarTransform();
  });
  barra.querySelector("#zoom-menos").addEventListener("click", () => {
    _arbolEstado.escala = Math.max(0.2, _arbolEstado.escala * 0.83); aplicarTransform();
  });
  barra.querySelector("#zoom-reset").addEventListener("click", () => {
    _arbolEstado = { escala: 1, panX: 0, panY: 0 }; aplicarTransform();
  });

  // ---- copiar arbol como texto ----
  barra.querySelector("#arbol-copiar").addEventListener("click", () => {
    const texto = arbolATexto(raiz);
    navigator.clipboard.writeText(texto).then(() => {
      const b = barra.querySelector("#arbol-copiar");
      const orig = b.textContent;
      b.textContent = "✓ Copiado";
      setTimeout(() => { b.textContent = orig; }, 1500);
    }).catch(() => alert("No se pudo copiar. Usa la vista texto para copiar manualmente."));
  });

  // ---- descargar como SVG ----
  barra.querySelector("#arbol-descargar").addEventListener("click", () => {
    const clon = svg.cloneNode(true);
    clon.setAttribute("xmlns", svgns);
    clon.setAttribute("viewBox", `0 0 ${W} ${H}`);
    clon.setAttribute("width", W); clon.setAttribute("height", H);
    const grp = clon.querySelector(".arbol-grupo");
    if (grp) grp.removeAttribute("transform");
    const cont = new XMLSerializer().serializeToString(clon);
    const blob = new Blob([cont], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "arbol_cacao.svg";
    a.click();
    URL.revokeObjectURL(url);
  });
}

/* ------------------------------------------------------------
   6. CONTROLADOR DE LA INTERFAZ
   ------------------------------------------------------------ */

function ejecutarAnalisis() {
  const codigo = document.getElementById("entrada-codigo").value;

  // --- LEXICO ---
  const lex = analizarLexico(codigo);

  // tokens
  const tbodyTokens = document.querySelector("#tabla-tokens tbody");
  tbodyTokens.innerHTML = "";
  lex.tokens.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td><td>${escapar(t.lexema)}</td><td>${t.categoria}</td>
                    <td>${CATEGORIAS[t.categoria]}</td><td>${String(t.codigo).padStart(3,"0")}</td>
                    <td class="mono">${t.token}</td><td>${t.linea}</td>`;
    tbodyTokens.appendChild(tr);
  });

  // tabla de simbolos
  const tbodySim = document.querySelector("#tabla-simbolos tbody");
  tbodySim.innerHTML = "";
  lex.tablaSimbolos.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td><td class="mono">${escapar(s.nombre)}</td><td>${s.categoria}</td><td>${s.linea}</td>`;
    tbodySim.appendChild(tr);
  });

  // conteo
  document.getElementById("conteo-lineas").textContent = lex.totalLineas;
  document.getElementById("conteo-tokens").textContent = lex.tokens.length;
  document.getElementById("conteo-simbolos").textContent = lex.tablaSimbolos.length;

  // --- SINTACTICO ---
  let sint = { errores: [], arbol: null, aceptada: false };
  if (lex.errores.length === 0) {
    sint = analizarSintactico(lex.tokens);
  }

  // errores (lexicos + sintacticos)
  const tbodyErr = document.querySelector("#tabla-errores tbody");
  tbodyErr.innerHTML = "";
  const todosErrores = [...lex.errores, ...sint.errores];
  if (todosErrores.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="ok-msg">Sin errores. Analisis completado correctamente.</td>`;
    tbodyErr.appendChild(tr);
  } else {
    todosErrores.forEach((e, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${idx+1}</td><td>${e.tipo}</td><td>${escapar(e.mensaje)} (cerca de '${escapar(e.lexema)}')</td><td>${e.linea}</td>`;
      tbodyErr.appendChild(tr);
    });
  }

  // estado general
  const estado = document.getElementById("estado-general");
  if (lex.errores.length > 0) {
    estado.textContent = "Errores lexicos encontrados";
    estado.className = "estado estado-error";
  } else if (!sint.aceptada) {
    estado.textContent = "Errores sintacticos encontrados";
    estado.className = "estado estado-error";
  } else {
    estado.textContent = "Codigo VALIDO (lexico y sintactico correctos)";
    estado.className = "estado estado-ok";
  }

  // ---- SECCIONES DE GRAMATICA (fijas) ----
  document.getElementById("cont-factorizacion").textContent = TEXTO_FACTORIZACION;
  document.getElementById("cont-recursividad").textContent = TEXTO_RECURSIVIDAD;
  document.getElementById("cont-primeros").textContent = TEXTO_PRIMEROS;
  document.getElementById("cont-siguientes").textContent = TEXTO_SIGUIENTES;
  construirMatrizLL1(document.getElementById("cont-tabla-ll1"));

  // ---- TABLA DE PILA (dinamica, depende del codigo) ----
  const tbodyPila = document.querySelector("#tabla-pila tbody");
  tbodyPila.innerHTML = "";
  if (lex.errores.length === 0) {
    const sim = simularPila(lex.tokens);
    sim.pasos.forEach(p => {
      const tr = document.createElement("tr");
      const esError = p.accion.startsWith("ERROR");
      const esAcept = p.accion === "ACEPTADA";
      tr.innerHTML = `<td>${p.n}</td><td class="mono">${escapar(p.pila)}</td>
                      <td class="mono">${escapar(p.entrada)}</td>
                      <td class="${esError ? 'celda-error' : (esAcept ? 'celda-ok' : '')}">${escapar(p.accion)}</td>`;
      tbodyPila.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="vacio">Corrige los errores lexicos antes de simular la pila.</td>`;
    tbodyPila.appendChild(tr);
  }

  // arbol
  const contArbol = document.getElementById("contenedor-arbol");
  const contArbolTexto = document.getElementById("arbol-texto");
  if (sint.arbol && sint.aceptada) {
    dibujarArbol(sint.arbol, contArbol);
    contArbolTexto.textContent = arbolATexto(sint.arbol);
  } else {
    contArbol.innerHTML = `<p class="vacio">No se pudo construir el arbol (hay errores que corregir primero).</p>`;
    contArbolTexto.textContent = "";
  }

  // resaltar en el gutter las lineas con error
  const lineasError = todosErrores.map(e => e.linea);
  actualizarGutter(lineasError);
}

function escapar(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ------------------------------------------------------------
   6b. NUMERACION DE LINEAS DEL EDITOR (gutter)
   ------------------------------------------------------------ */
function actualizarGutter(lineasError = []) {
  const editor = document.getElementById("entrada-codigo");
  const gutter = document.getElementById("gutter");
  if (!editor || !gutter) return;
  const total = editor.value.split("\n").length;
  let html = "";
  for (let i = 1; i <= total; i++) {
    const clase = lineasError.includes(i) ? ' class="err-line"' : "";
    html += `<span${clase}>${i}</span>`;
  }
  gutter.innerHTML = html;
  gutter.scrollTop = editor.scrollTop;
}

// Cargar codigo de ejemplo
function cargarEjemplo() {
  document.getElementById("entrada-codigo").value =
`inicio
  numero #edad = 18.
  decimal #nota = 85.5.
  cuando ( #edad >= 18 y #nota > 60 ) hacer abrir
    mostrar "aprobado".
  cerrar
fin`;
  actualizarGutter();
}

// Limpiar
function limpiar() {
  document.getElementById("entrada-codigo").value = "";
  document.querySelector("#tabla-tokens tbody").innerHTML = "";
  document.querySelector("#tabla-simbolos tbody").innerHTML = "";
  document.querySelector("#tabla-errores tbody").innerHTML = "";
  document.querySelector("#tabla-pila tbody").innerHTML = "";
  document.getElementById("contenedor-arbol").innerHTML = "";
  document.getElementById("arbol-texto").textContent = "";
  document.getElementById("conteo-lineas").textContent = "0";
  document.getElementById("conteo-tokens").textContent = "0";
  document.getElementById("conteo-simbolos").textContent = "0";
  const estado = document.getElementById("estado-general");
  estado.textContent = "Esperando analisis...";
  estado.className = "estado";
  actualizarGutter();
}

// Toggle de tema claro/oscuro
function toggleTema() {
  document.body.classList.toggle("oscuro");
  const btn = document.getElementById("btn-tema");
  btn.textContent = document.body.classList.contains("oscuro") ? "☀ Modo claro" : "🌙 Modo oscuro";
}

// Pestañas del arbol (visual / texto)
function mostrarArbol(tipo) {
  document.getElementById("contenedor-arbol").style.display = (tipo === "visual") ? "block" : "none";
  document.getElementById("arbol-texto").style.display = (tipo === "texto") ? "block" : "none";
  document.getElementById("tab-visual").classList.toggle("activa", tipo === "visual");
  document.getElementById("tab-texto").classList.toggle("activa", tipo === "texto");
}

// Acordeon: desplegar/contraer secciones
function toggleAcordeon(cabecera) {
  const cuerpo = cabecera.nextElementSibling;
  const abierto = cuerpo.classList.toggle("abierto");
  cabecera.classList.toggle("activo", abierto);
  const flecha = cabecera.querySelector(".flecha");
  if (flecha) flecha.textContent = abierto ? "▼" : "▶";
}

// Inicializar eventos al cargar
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-analizar").addEventListener("click", ejecutarAnalisis);
  document.getElementById("btn-ejemplo").addEventListener("click", cargarEjemplo);
  document.getElementById("btn-limpiar").addEventListener("click", limpiar);
  document.getElementById("btn-tema").addEventListener("click", toggleTema);
  document.getElementById("tab-visual").addEventListener("click", () => mostrarArbol("visual"));
  document.getElementById("tab-texto").addEventListener("click", () => mostrarArbol("texto"));
  // acordeones
  document.querySelectorAll(".acordeon-cabecera").forEach(cab => {
    cab.addEventListener("click", () => toggleAcordeon(cab));
  });
  // numeracion de lineas del editor
  const editor = document.getElementById("entrada-codigo");
  const gutter = document.getElementById("gutter");
  if (editor && gutter) {
    editor.addEventListener("input", () => actualizarGutter());
    editor.addEventListener("scroll", () => { gutter.scrollTop = editor.scrollTop; });
  }
  cargarEjemplo(); // cargar ejemplo al inicio
  actualizarGutter();
});