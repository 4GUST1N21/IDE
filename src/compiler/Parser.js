import { TokenType } from './Lexer';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.COMMENT);
    this.pos = 0;
    this.errors = [];
  }

  parse() {
    const program = { type: 'Program', body: [] };
    while (!this.isAtEnd()) {
      try {
        if (this.match(TokenType.KEYWORD, 'cl')) {
          program.body.push(this.parseClassDeclaration());
        } else {
          // If it's not a class, we parse it as a top-level statement (e.g. execution block)
          program.body.push(this.parseStatement());
        }
      } catch (e) {
        this.errors.push(e.message);
        this.synchronize();
      }
    }
    return { ast: program, errors: this.errors };
  }

  parseClassDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre de la clase').lexeme;
    let superClass = null;
    if (this.match(TokenType.KEYWORD, 'her')) {
      superClass = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre de la clase padre').lexeme;
    }
    this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del cuerpo de la clase');
    
    const body = [];
    while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
      if (this.match(TokenType.KEYWORD, 'func')) {
        body.push(this.parseMethodDeclaration());
      } else {
        body.push(this.parseAttributeDeclaration());
      }
    }
    this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del cuerpo de la clase');

    return { type: 'ClassDeclaration', name, superClass, body };
  }

  parseAttributeDeclaration() {
    const dataType = this.advance().lexeme; // ent, tex, dec, bol...
    const name = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del atributo').lexeme;
    let value = null;
    if (this.match(TokenType.OPERATOR, '=')) {
      value = this.parseExpression();
    }
    this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues de la declaracion del atributo');
    return { type: 'AttributeDeclaration', dataType, name, value };
  }

  parseMethodDeclaration() {
    const returnType = this.advance().lexeme; // vac, tex, ent...
    const name = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del metodo').lexeme;
    this.consume(TokenType.SYMBOL, '(', 'Se esperaba "(" despues del nombre del metodo');
    
    const params = [];
    if (!this.check(TokenType.SYMBOL, ')')) {
      do {
        const paramType = this.advance().lexeme;
        const paramName = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre del parametro').lexeme;
        params.push({ type: paramType, name: paramName });
      } while (this.match(TokenType.SYMBOL, ','));
    }
    this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")" despues de los parametros');
    this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del cuerpo del metodo');
    
    const body = [];
    while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del cuerpo del metodo');
    
    return { type: 'MethodDeclaration', returnType, name, params, body };
  }

  parseStatement() {
    if (this.match(TokenType.KEYWORD, 'si')) return this.parseIfStatement();
    if (this.match(TokenType.KEYWORD, 'mientras')) return this.parseWhileStatement();
    if (this.match(TokenType.KEYWORD, 'para')) return this.parseForStatement();
    if (this.match(TokenType.KEYWORD, 'imp')) return this.parsePrintStatement();
    if (this.match(TokenType.KEYWORD, 'ret')) {
      const expr = this.parseExpression();
      this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues del valor de retorno');
      return { type: 'ReturnStatement', argument: expr };
    }
    // Revisar si empieza con un tipo de dato nativo (ent, dec, tex, bol)
    if (this.match(TokenType.KEYWORD, 'ent') || this.match(TokenType.KEYWORD, 'dec') || 
        this.match(TokenType.KEYWORD, 'tex') || this.match(TokenType.KEYWORD, 'bol')) {
      const typeName = this.previous().lexeme;
      const varName = this.consume(TokenType.IDENTIFIER, 'Se esperaba el nombre de la variable').lexeme;
      let init = null;
      if (this.match(TokenType.OPERATOR, '=')) {
        init = this.parseExpression();
      }
      this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues de declaracion');
      return { type: 'VariableDeclaration', dataType: typeName, name: varName, init };
    }

    // Variable declaration/instantiation or expression statement
    const expr = this.parseExpression();
    if (this.match(TokenType.SYMBOL, ';')) {
      return { type: 'ExpressionStatement', expression: expr };
    } else if (this.match(TokenType.IDENTIFIER)) {
      // e.g., Vehiculo miAuto = nv Vehiculo();
      // expr parsed it as an Identifier
      if (expr.type === 'Identifier') {
        const typeName = expr.name;
        const varName = this.previous().lexeme;
        let init = null;
        if (this.match(TokenType.OPERATOR, '=')) {
          init = this.parseExpression();
        }
        this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues de declaracion');
        return { type: 'VariableDeclaration', dataType: typeName, name: varName, init };
      }
    }
    this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues de la expresion');
    return { type: 'ExpressionStatement', expression: expr };
  }

  parseIfStatement() {
    this.consume(TokenType.SYMBOL, '(', 'Se esperaba "(" despues de "si"');
    const condition = this.parseExpression();
    this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")" despues de la condicion');
    this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del bloque "si"');
    const consequent = [];
    while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
      consequent.push(this.parseStatement());
    }
    this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del bloque "si"');
    
    let alternate = null;
    if (this.match(TokenType.KEYWORD, 'sino')) {
      this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del bloque "sino"');
      alternate = [];
      while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
        alternate.push(this.parseStatement());
      }
      this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del bloque "sino"');
    }
    return { type: 'IfStatement', test: condition, consequent, alternate };
  }

  parseWhileStatement() {
    this.consume(TokenType.SYMBOL, '(', 'Se esperaba "(" despues de "mientras"');
    const condition = this.parseExpression();
    this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")" despues de la condicion');
    this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del bloque "mientras"');
    const body = [];
    while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del bloque "mientras"');
    return { type: 'WhileStatement', test: condition, body };
  }

  parseForStatement() {
    this.consume(TokenType.SYMBOL, '(', 'Se esperaba "(" despues de "para"');
    let init = null;
    if (!this.check(TokenType.SYMBOL, ';')) {
       init = this.parseStatement(); 
    } else {
       this.advance();
    }
    let test = null;
    if (!this.check(TokenType.SYMBOL, ';')) {
       test = this.parseExpression();
    }
    this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues de la condicion del para');
    let update = null;
    if (!this.check(TokenType.SYMBOL, ')')) {
       update = this.parseExpression();
    }
    this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")" despues del incremento del para');
    this.consume(TokenType.SYMBOL, '{', 'Se esperaba "{" antes del bloque "para"');
    const body = [];
    while (!this.check(TokenType.SYMBOL, '}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume(TokenType.SYMBOL, '}', 'Se esperaba "}" despues del bloque "para"');
    return { type: 'ForStatement', init, test, update, body };
  }

  parsePrintStatement() {
    const expr = this.parseExpression();
    this.consume(TokenType.SYMBOL, ';', 'Se esperaba ";" despues del valor a imprimir');
    return { type: 'PrintStatement', argument: expr };
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const expr = this.parseEquality();
    if (this.match(TokenType.OPERATOR, '=')) {
      const value = this.parseAssignment();
      if (expr.type === 'Identifier' || expr.type === 'MemberExpression') {
        return { type: 'AssignmentExpression', operator: '=', left: expr, right: value };
      }
      throw new Error("Objetivo de asignacion invalido");
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();
    while (this.match(TokenType.OPERATOR, '==') || this.match(TokenType.OPERATOR, '!=')) {
      const operator = this.previous().lexeme;
      const right = this.parseRelational();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  parseRelational() {
    let expr = this.parseAddition();
    while (this.match(TokenType.OPERATOR, '<') || this.match(TokenType.OPERATOR, '>') ||
           this.match(TokenType.OPERATOR, '<=') || this.match(TokenType.OPERATOR, '>=')) {
      const operator = this.previous().lexeme;
      const right = this.parseAddition();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  parseAddition() {
    let expr = this.parseMultiplication();
    while (this.match(TokenType.OPERATOR, '+') || this.match(TokenType.OPERATOR, '-')) {
      const operator = this.previous().lexeme;
      const right = this.parseMultiplication();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  parseMultiplication() {
    let expr = this.parseUnary();
    while (this.match(TokenType.OPERATOR, '*') || this.match(TokenType.OPERATOR, '/') || this.match(TokenType.OPERATOR, '%')) {
      const operator = this.previous().lexeme;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpression', operator, left: expr, right };
    }
    return expr;
  }

  parseUnary() {
    if (this.match(TokenType.KEYWORD, 'nv')) {
      const typeName = this.advance().lexeme;
      if (this.match(TokenType.SYMBOL, '[')) {
         const size = this.parseExpression();
         this.consume(TokenType.SYMBOL, ']', 'Se esperaba "]"');
         return { type: 'ArrayInstantiation', elementsType: typeName, size };
      }
      this.consume(TokenType.SYMBOL, '(', 'Se esperaba "("');
      this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")"');
      return { type: 'NewExpression', callee: typeName };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    if (this.match(TokenType.NUMBER)) return { type: 'Literal', value: parseFloat(this.previous().lexeme), raw: this.previous().lexeme };
    if (this.match(TokenType.STRING)) return { type: 'Literal', value: this.previous().lexeme, raw: `"${this.previous().lexeme}"` };
    if (this.match(TokenType.IDENTIFIER)) {
      let expr = { type: 'Identifier', name: this.previous().lexeme };
      while (true) {
        if (this.match(TokenType.SYMBOL, '.')) {
          const property = this.consume(TokenType.IDENTIFIER, 'Se esperaba nombre de propiedad/metodo').lexeme;
          expr = { type: 'MemberExpression', object: expr, property, computed: false };
        } else if (this.match(TokenType.SYMBOL, '[')) {
          const property = this.parseExpression();
          this.consume(TokenType.SYMBOL, ']', 'Se esperaba "]" despues del indice del arreglo');
          expr = { type: 'MemberExpression', object: expr, property, computed: true };
        } else if (this.match(TokenType.SYMBOL, '(')) {
          const args = [];
          if (!this.check(TokenType.SYMBOL, ')')) {
            do {
              args.push(this.parseExpression());
            } while (this.match(TokenType.SYMBOL, ','));
          }
          this.consume(TokenType.SYMBOL, ')', 'Se esperaba ")"');
          expr = { type: 'CallExpression', callee: expr, arguments: args };
        } else {
          break;
        }
      }
      return expr;
    }
    throw new Error(`Se esperaba una expresion en la linea ${this.peek().line}, columna ${this.peek().column}`);
  }

  match(type, lexeme = null) {
    if (this.check(type, lexeme)) {
      this.advance();
      return true;
    }
    return false;
  }

  check(type, lexeme = null) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (lexeme !== null && token.lexeme !== lexeme) return false;
    return true;
  }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.pos];
  }

  previous() {
    return this.tokens[this.pos - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    // Allow overloaded consume with 3 args: (type, lexeme, message)
    if (arguments.length === 3) {
      const lexeme = arguments[1];
      const msg = arguments[2];
      if (this.check(type, lexeme)) return this.advance();
      throw new Error(`${msg} en linea ${this.peek().line}, columna ${this.peek().column}`);
    }
    throw new Error(`${message} en linea ${this.peek().line}, columna ${this.peek().column}`);
  }

  synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SYMBOL && this.previous().lexeme === ';') return;
      if (this.peek().type === TokenType.KEYWORD) return;
      this.advance();
    }
  }
}
