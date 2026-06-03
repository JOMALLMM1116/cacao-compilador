# Compilador del Lenguaje Cacao

Analizador **lexico** y **sintactico LL(1)** del lenguaje de programacion **Cacao**, desarrollado en HTML, CSS y JavaScript puro. Proyecto de la materia de **Compiladores**.

El simulador toma codigo escrito en Cacao y realiza el analisis completo: genera los tokens, construye la tabla de simbolos, cuenta las lineas, detecta errores lexicos y sintacticos (indicando el numero de linea), y construye el arbol sintactico. Ademas muestra el analisis de la gramatica: factorizacion, eliminacion de recursividad, conjuntos de Primeros y Siguientes, la tabla LL(1) y la simulacion de pila paso a paso.

---

## El lenguaje Cacao

Cacao es un lenguaje de programacion de alto nivel de proposito academico. Sus caracteristicas principales:

| Elemento            | Sintaxis Cacao                                  |
|---------------------|-------------------------------------------------|
| Programa            | `inicio ... fin`                                |
| Bloques             | `abrir ... cerrar`                              |
| Tipos de dato       | `numero` `decimal` `texto` `logico`             |
| Identificadores     | `#nombre` (prefijo numeral)                     |
| Asignacion          | `=`                                             |
| Condicional         | `cuando ( cond ) hacer abrir ... cerrar`        |
| Ciclo               | `repetir ( cond ) hacer abrir ... cerrar`       |
| Mostrar en pantalla | `mostrar <expr> .`                              |
| Pedir datos         | `pedir "mensaje" , #id .`                        |
| Conectores logicos  | `y` `o` `no`                                     |
| Booleanos           | `verdadero` `falso`                             |
| Operadores          | `+ - * / %`                                      |
| Comparadores        | `== != <= >= < >`                                |
| Delimitadores       | `.` (fin de sentencia) y `,`                     |

### Ejemplo de codigo Cacao

```
inicio
  numero #edad = 18.
  decimal #nota = 85.5.
  cuando ( #edad >= 18 y #nota > 60 ) hacer abrir
    mostrar "aprobado".
  cerrar
fin
```

---

## Analisis lexico: las 10 categorias

Cada token se clasifica en una de 10 categorias, con su expresion regular:

| #  | Categoria               | Expresion regular                                    |
|----|-------------------------|------------------------------------------------------|
| 1  | Palabras reservadas     | `inicio fin abrir cerrar numero decimal texto logico cuando hacer repetir mostrar pedir verdadero falso` |
| 2  | Operadores aritmeticos  | `+ - * / %`                                          |
| 3  | Identificadores         | `#[a-zA-Z_][a-zA-Z0-9_]*`                            |
| 4  | Constantes              | `[0-9]+(.[0-9]+)?`                                   |
| 5  | Simbolos de agrupacion  | `( )`                                                |
| 6  | Delimitadores           | `. ,`                                                |
| 7  | Simbolos de comparacion | `== != <= >= < >`                                    |
| 8  | Simbolos conectores     | `y o no`                                             |
| 9  | Literales               | `"..."`                                              |
| 10 | Asignacion              | `=`                                                  |

---

## Gramatica del lenguaje (BNF)

Notacion: los no terminales van entre `< >`, los terminales especiales entre comillas, `::=` significa "se define como" y `e` representa la cadena vacia (epsilon).

```bnf
<programa> ::= inicio <lista_de_sentencias> fin

<lista_de_sentencias> ::= <sentencia> <lista_de_sentencias>
                        | e

<sentencia> ::= <declaracion>
              | <asignacion>
              | <condicion>
              | <ciclo>
              | <mostrar>
              | <pedir>

<declaracion> ::= <tipo_dato> id <parte_declaracion>

<parte_declaracion> ::= "=" <expresion> "."
                      | "."

<tipo_dato> ::= numero | decimal | texto | logico

<asignacion> ::= id "=" <expresion> "."

<condicion> ::= cuando "(" <condicion_logica> ")" hacer abrir <lista_de_sentencias> cerrar

<ciclo> ::= repetir "(" <condicion_logica> ")" hacer abrir <lista_de_sentencias> cerrar

<mostrar> ::= mostrar <expresion> "."

<pedir> ::= pedir literal "," id "."

<condicion_logica> ::= <condicion_simple> <continuacion_condicion_logica>

<continuacion_condicion_logica> ::= y <condicion_simple> <continuacion_condicion_logica>
                                  | o <condicion_simple> <continuacion_condicion_logica>
                                  | e

<condicion_simple> ::= no <condicion_simple>
                     | <expresion> <operador_relacional> <expresion>

<operador_relacional> ::= "==" | "!=" | "<=" | ">=" | "<" | ">"

<expresion> ::= <termino> <continuacion_expresion>

<continuacion_expresion> ::= "+" <termino> <continuacion_expresion>
                           | "-" <termino> <continuacion_expresion>
                           | e

<termino> ::= <factor> <continuacion_termino>

<continuacion_termino> ::= "*" <factor> <continuacion_termino>
                         | "/" <factor> <continuacion_termino>
                         | "%" <factor> <continuacion_termino>
                         | e

<factor> ::= id
           | constante
           | literal
           | verdadero
           | falso
           | "(" <expresion> ")"
```

> Nota: `id`, `constante` y `literal` son terminales que entrega el analizador lexico; por eso no se derivan dentro de la gramatica sintactica.

La gramatica esta disenada directamente con **recursividad por la derecha** (la forma apta para LL(1)) y **factorizada por la izquierda**, por lo que no presenta conflictos en la tabla LL(1).

---

## Funciones del simulador

**Analisis lexico**
- Editor de codigo con numeracion de lineas (resalta en rojo las lineas con error).
- Boton para iniciar el analisis.
- Listado de tokens generados (lexema, categoria, codigo y token).
- Tabla de simbolos (identificadores).
- Conteo de lineas, tokens e identificadores.
- Control de errores lexicos con tipo y numero de linea.

**Analisis sintactico LL(1)**
- Factorizacion por la izquierda de la gramatica.
- Eliminacion de recursividad por la izquierda.
- Conjuntos de Primeros P() y Siguientes S().
- Tabla LL(1) (matriz no terminales x terminales).
- Simulacion de pila paso a paso del codigo ingresado.
- Arbol sintactico interactivo (zoom, mover nodos, copiar y descargar).
- Control de errores sintacticos con numero de linea.

**Interfaz**
- Modo claro y oscuro.
- Paleta de colores calida (tema "Cacao").

---

## Estructura del proyecto

```
cacao-compilador/
├── index.html      Estructura de la pagina
├── estilos.css     Estilos y modo claro/oscuro
├── script.js       Motor del analizador lexico y sintactico LL(1)
└── README.md       Este archivo
```

---

## Como usar

1. Abre el simulador (en GitHub Pages o el `index.html` local).
2. Escribe o pega codigo Cacao en el editor (o usa el boton "Cargar ejemplo").
3. Pulsa **Analizar**.
4. Revisa los tokens, la tabla de simbolos, los errores y el arbol.
5. Despliega las secciones de la gramatica (Primeros, Siguientes, tabla LL(1), pila) haciendo clic en cada una.

---

## Tecnologias

- HTML5
- CSS3 (variables CSS para el tema claro/oscuro)
- JavaScript (sin frameworks ni librerias externas)
- SVG para el arbol sintactico interactivo

---

## Autor
Jose Manuel Maquin Leal