package src;
import java_cup.runtime.Symbol;

%%

%class AnalizadorLexico
%public
%unicode
%cup
%line
%column

%{
    private Symbol symbol(int type) {
        return new Symbol(type, yyline, yycolumn);
    }
    private Symbol symbol(int type, Object value) {
        return new Symbol(type, yyline, yycolumn, value);
    }
%}

// Macros
Letra = [a-zA-Z_]
Digito = [0-9]
Numero = {Digito}+ ("." {Digito}+)?
Identificador = {Letra} ({Letra} | {Digito})*
Cadena = \"[^\"]*\"
Comentario = "//" [^\r\n]*
Espacio = [ \t\r\n]+

%%

<YYINITIAL> {
    // Palabras Reservadas
    "cl"            { return new Symbol(sym.CL, yyline, yycolumn, yytext()); }
    "func"          { return new Symbol(sym.FUNC, yyline, yycolumn, yytext()); }
    "nv"            { return new Symbol(sym.NV, yyline, yycolumn, yytext()); }
    "ret"           { return new Symbol(sym.RET, yyline, yycolumn, yytext()); }
    "imp"           { return new Symbol(sym.IMP, yyline, yycolumn, yytext()); }
    "vac"           { return new Symbol(sym.VAC, yyline, yycolumn, yytext()); }
    "y"             { return new Symbol(sym.Y, yyline, yycolumn, yytext()); }
    "o"             { return new Symbol(sym.O, yyline, yycolumn, yytext()); }
    "no"            { return new Symbol(sym.NO, yyline, yycolumn, yytext()); }
    "bol"           { return new Symbol(sym.BOL, yyline, yycolumn, yytext()); }
    "v"             { return new Symbol(sym.V, yyline, yycolumn, yytext()); }
    "f"             { return new Symbol(sym.F, yyline, yycolumn, yytext()); }
    "ent"           { return new Symbol(sym.ENT, yyline, yycolumn, yytext()); }
    "dec"           { return new Symbol(sym.DEC, yyline, yycolumn, yytext()); }
    "tex"           { return new Symbol(sym.TEX, yyline, yycolumn, yytext()); }
    
    // Control de flujo
    "si"            { return new Symbol(sym.SI, yyline, yycolumn, yytext()); }
    "sino"          { return new Symbol(sym.SINO, yyline, yycolumn, yytext()); }
    "mientras"      { return new Symbol(sym.MIENTRAS, yyline, yycolumn, yytext()); }
    "para"          { return new Symbol(sym.PARA, yyline, yycolumn, yytext()); }
    "romper"        { return new Symbol(sym.ROMPER, yyline, yycolumn, yytext()); }
    "continuar"     { return new Symbol(sym.CONTINUAR, yyline, yycolumn, yytext()); }

    // Simbolos Especiales
    "{"             { return new Symbol(sym.LLAVE_A, yyline, yycolumn, yytext()); }
    "}"             { return new Symbol(sym.LLAVE_C, yyline, yycolumn, yytext()); }
    "("             { return new Symbol(sym.PAR_A, yyline, yycolumn, yytext()); }
    ")"             { return new Symbol(sym.PAR_C, yyline, yycolumn, yytext()); }
    "["             { return new Symbol(sym.CORCH_A, yyline, yycolumn, yytext()); }
    "]"             { return new Symbol(sym.CORCH_C, yyline, yycolumn, yytext()); }
    ";"             { return new Symbol(sym.PUNTO_Y_COMA, yyline, yycolumn, yytext()); }
    ","             { return new Symbol(sym.COMA, yyline, yycolumn, yytext()); }
    "."             { return new Symbol(sym.PUNTO, yyline, yycolumn, yytext()); }

    // Operadores
    "+"             { return new Symbol(sym.SUMA, yyline, yycolumn, yytext()); }
    "-"             { return new Symbol(sym.RESTA, yyline, yycolumn, yytext()); }
    "*"             { return new Symbol(sym.MULT, yyline, yycolumn, yytext()); }
    "/"             { return new Symbol(sym.DIV, yyline, yycolumn, yytext()); }
    "%"             { return new Symbol(sym.MOD, yyline, yycolumn, yytext()); }
    "="             { return new Symbol(sym.ASIG, yyline, yycolumn, yytext()); }
    "=="            { return new Symbol(sym.IGUAL, yyline, yycolumn, yytext()); }
    "!="            { return new Symbol(sym.DISTINTO, yyline, yycolumn, yytext()); }
    "<"             { return new Symbol(sym.MENOR, yyline, yycolumn, yytext()); }
    ">"             { return new Symbol(sym.MAYOR, yyline, yycolumn, yytext()); }
    "<="            { return new Symbol(sym.MENOR_IGUAL, yyline, yycolumn, yytext()); }
    ">="            { return new Symbol(sym.MAYOR_IGUAL, yyline, yycolumn, yytext()); }

    {Numero}        { return new Symbol(sym.NUMERO, yyline, yycolumn, yytext()); }
    {Identificador} { return new Symbol(sym.IDENTIFICADOR, yyline, yycolumn, yytext()); }
    {Cadena}        { return new Symbol(sym.CADENA, yyline, yycolumn, yytext()); }
    {Comentario}    { /* Ignorar */ }
    {Espacio}       { /* Ignorar */ }
}
[^]                 { throw new Error("Caracter no reconocido: " + yytext()); }
