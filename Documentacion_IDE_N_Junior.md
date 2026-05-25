# Manual de Usuario: Mini IDE Ñ-Junior

## Introducción
El **Mini IDE Ñ-Junior** es un entorno de desarrollo web interactivo creado para facilitar la programación, compilación y ejecución de código escrito en el lenguaje de programación diseñado para la asignatura de Teoría de la Computación. Su propósito principal es evidenciar de manera gráfica las fases fundamentales de un compilador.

---

## Partes del IDE

El entorno cuenta con una interfaz moderna dividida en cuatro paneles principales que reflejan el ciclo de vida del código:

### 1. Editor de Código (Izquierda)
Es el área de texto donde el programador escribe el código fuente en lenguaje Ñ-Junior. 
- Cuenta con **numeración de líneas** sincronizada para ayudar a localizar errores rápidamente.
- Admite toda la sintaxis del lenguaje, incluyendo creación de clases (`cl`), herencia (`her`), funciones (`func`), y tipos de variables (`ent`, `dec`, `tex`, `bol`).

### 2. Analizador Léxico - Tabla de Tokens (Arriba a la Derecha)
Este panel representa la primera fase del compilador. Muestra en tiempo real cómo el autómata del lenguaje fragmenta el texto del editor en piezas más pequeñas llamadas "Tokens".
- Muestra el **Tipo** de token (Palabra Reservada, Identificador, Número, Operador, etc.).
- Muestra el **Lexema** exacto que fue capturado.
- Ignora de forma inteligente los comentarios de línea (`//`) y de bloque (`«` `»`).

### 3. Analizador Sintáctico - AST (Medio a la Derecha)
Este panel evidencia la segunda fase del compilador. Toma los tokens y aplica la gramática del lenguaje para construir un **Árbol de Sintaxis Abstracta (AST)** en formato JSON.
- Representa la estructura jerárquica del código.
- Permite ver cómo una instrucción como `imp 50 * 2` se divide en un nodo de impresión que contiene un nodo de expresión matemática binaria.

### 4. Consola de Salida (Abajo a la Derecha)
Actúa como un intérprete que evalúa el árbol AST generado.
- Muestra los resultados de las funciones de impresión (`imp`).
- En caso de haber un error en el código (por ejemplo, faltó un punto y coma, o hay un símbolo no reconocido), el proceso se detiene y la consola imprime un texto en rojo indicando el tipo de error (Léxico o Sintáctico) junto a la **línea y columna** exactas del fallo.

---

## Flujo de Trabajo (Cómo compilar)

1. **Escribir el código:** El usuario redacta su programa en el panel izquierdo.
2. **Ejecución:** Al presionar el botón azul `▶ Compilar y Ejecutar` en la barra superior, el motor procesará internamente el código.
3. **Visualización:** El usuario podrá observar instantáneamente la tabla de tokens generada, el árbol sintáctico estructurado y, de no haber errores, el output final en la consola.
