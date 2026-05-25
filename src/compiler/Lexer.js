export const TokenType = {
  KEYWORD: 'PALABRA_RESERVADA',
  IDENTIFIER: 'IDENTIFICADOR',
  NUMBER: 'NUMERO',
  STRING: 'CADENA',
  OPERATOR: 'OPERADOR',
  SYMBOL: 'SIMBOLO',
  COMMENT: 'COMENTARIO',
  EOF: 'FIN_DE_ARCHIVO',
  ERROR: 'ERROR_LEXICO'
};

const KEYWORDS = new Set([
  'principal', 'cl', 'func', 'nv', 'ret', 'imp', 'vac', 
  'y', 'o', 'no', 'bol', 'v', 'f', 'ent', 'dec', 'tex', 
  'si', 'sino', 'mientras', 'segun', 'caso', 'defecto', 
  'para', 'hacer', 'romper', 'continuar', 
  'intentar', 'capturar', 'lanzar', 'finalmente', 'her'
]);

const SYMBOLS = new Set(['{', '}', '(', ')', ';', ',', '.']);
const OPERATORS = new Set(['+', '-', '*', '/', '%', '=', '==', '<', '>', '<=', '>=', '!=', '++', '--']);

export class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
  }

  tokenize() {
    while (this.pos < this.source.length) {
      let char = this.source[this.pos];

      // Whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }
      if (char === '\n') {
        this.advance();
        this.line++;
        this.column = 1;
        continue;
      }

      // Line Comment //
      if (char === '/' && this.peek() === '/') {
        let comment = '';
        while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
          comment += this.source[this.pos];
          this.advance();
        }
        this.addToken(TokenType.COMMENT, comment);
        continue;
      }

      // Block Comment « » (Alt+174 / Alt+175)
      if (char === '«') {
        let comment = char;
        this.advance();
        while (this.pos < this.source.length && this.source[this.pos] !== '»') {
          if (this.source[this.pos] === '\n') {
            this.line++;
            this.column = 1;
          }
          comment += this.source[this.pos];
          this.advance();
        }
        if (this.pos < this.source.length) {
          comment += this.source[this.pos]; // Add '»'
          this.advance();
        }
        this.addToken(TokenType.COMMENT, comment);
        continue;
      }

      // Numbers (Integer and Decimal)
      if (/[0-9]/.test(char)) {
        let numStr = '';
        let hasDot = false;
        while (this.pos < this.source.length && (/[0-9]/.test(this.source[this.pos]) || this.source[this.pos] === '.')) {
          if (this.source[this.pos] === '.') {
            if (hasDot) break; // Second dot, stop here (could be an error or method call on number)
            hasDot = true;
          }
          numStr += this.source[this.pos];
          this.advance();
        }
        this.addToken(TokenType.NUMBER, numStr);
        continue;
      }

      // Strings
      if (char === '"') {
        let str = '';
        this.advance(); // Skip "
        while (this.pos < this.source.length && this.source[this.pos] !== '"') {
          if (this.source[this.pos] === '\n') {
            this.line++;
            this.column = 1;
          }
          str += this.source[this.pos];
          this.advance();
        }
        if (this.pos < this.source.length) {
          this.advance(); // Skip closing "
          this.addToken(TokenType.STRING, str);
        } else {
          this.addError('Cadena sin cerrar');
        }
        continue;
      }

      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (this.pos < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.pos])) {
          idStr += this.source[this.pos];
          this.advance();
        }
        if (KEYWORDS.has(idStr)) {
          this.addToken(TokenType.KEYWORD, idStr);
        } else {
          this.addToken(TokenType.IDENTIFIER, idStr);
        }
        continue;
      }

      // Operators and Symbols
      let twoCharOp = char + (this.peek() || '');
      if (OPERATORS.has(twoCharOp)) {
        this.addToken(TokenType.OPERATOR, twoCharOp);
        this.advance();
        this.advance();
        continue;
      }

      if (OPERATORS.has(char)) {
        this.addToken(TokenType.OPERATOR, char);
        this.advance();
        continue;
      }

      if (SYMBOLS.has(char)) {
        this.addToken(TokenType.SYMBOL, char);
        this.advance();
        continue;
      }

      // Unknown character
      this.addError(`Caracter no reconocido: ${char}`);
      this.addToken(TokenType.ERROR, char);
      this.advance();
    }

    this.addToken(TokenType.EOF, 'EOF');
    return this.tokens;
  }

  advance() {
    this.pos++;
    this.column++;
  }

  peek() {
    if (this.pos + 1 >= this.source.length) return null;
    return this.source[this.pos + 1];
  }

  addToken(type, lexeme) {
    this.tokens.push({ type, lexeme, line: this.line, column: this.column - lexeme.length });
  }

  addError(message) {
    this.errors.push({ message, line: this.line, column: this.column });
  }
}
