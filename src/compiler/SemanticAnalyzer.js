export class SemanticAnalyzer {
  constructor() {
    this.symbolTable = {}; 
    this.errors = [];
  }

  analyze(ast) {
    this.errors = [];
    this.symbolTable = {};
    this.visit(ast);
    return this.errors;
  }

  visit(node) {
    if (!node) return null;
    switch (node.type) {
      case 'Program':
        node.body.forEach(stmt => this.visit(stmt));
        break;
      case 'ClassDeclaration':
        node.body.forEach(stmt => this.visit(stmt));
        break;
      case 'AttributeDeclaration':
        this.symbolTable[node.name] = node.dataType;
        if (node.value) {
          const valueType = this.visit(node.value);
          this.checkTypeCompatibility(node.dataType, valueType, node.name);
        }
        break;
      case 'MethodDeclaration':
        node.params.forEach(param => {
          this.symbolTable[param.name] = param.type;
        });
        node.body.forEach(stmt => this.visit(stmt));
        break;
      case 'VariableDeclaration':
        this.symbolTable[node.name] = node.dataType;
        if (node.init) {
          const initType = this.visit(node.init);
          if (['ent', 'dec', 'tex', 'bol'].includes(node.dataType)) {
            this.checkTypeCompatibility(node.dataType, initType, node.name);
          }
        }
        break;
      case 'ExpressionStatement':
        this.visit(node.expression);
        break;
      case 'PrintStatement':
        this.visit(node.argument);
        break;
      case 'IfStatement':
        const ifTest = this.visit(node.test);
        this.checkTypeCompatibility('bol', ifTest, 'Condicion de si');
        node.consequent.forEach(stmt => this.visit(stmt));
        if (node.alternate) node.alternate.forEach(stmt => this.visit(stmt));
        break;
      case 'WhileStatement':
        const whileTest = this.visit(node.test);
        this.checkTypeCompatibility('bol', whileTest, 'Condicion de mientras');
        node.body.forEach(stmt => this.visit(stmt));
        break;
      case 'ForStatement':
        if (node.init) this.visit(node.init);
        if (node.test) {
           const forTest = this.visit(node.test);
           this.checkTypeCompatibility('bol', forTest, 'Condicion de para');
        }
        if (node.update) this.visit(node.update);
        node.body.forEach(stmt => this.visit(stmt));
        break;
      case 'ReturnStatement':
        return this.visit(node.argument);
      case 'AssignmentExpression':
        if (node.left.type === 'Identifier') {
          const varName = node.left.name;
          const rightType = this.visit(node.right);
          if (this.symbolTable[varName]) {
            this.checkTypeCompatibility(this.symbolTable[varName], rightType, varName);
          }
        } else if (node.left.type === 'MemberExpression') {
           const rightType = this.visit(node.right);
           if (node.left.computed) {
             const indexType = this.visit(node.left.property);
             this.checkTypeCompatibility('ent', indexType, 'Indice de arreglo');
           }
        }
        break;
      case 'BinaryExpression':
        const leftType = this.visit(node.left);
        const rightType = this.visit(node.right);
        
        if (['>', '<', '>=', '<=', '==', '!='].includes(node.operator)) {
            return 'bol';
        }
        
        // Si hay un texto de por medio, el resultado es concatenación (texto)
        if (node.operator === '+' && (leftType === 'tex' || rightType === 'tex')) {
           return 'tex';
        }
        // Operaciones aritméticas resultan en decimal si alguno es decimal, o entero
        if (leftType === 'dec' || rightType === 'dec') return 'dec';
        return 'ent'; 
        
      case 'Literal':
        if (typeof node.value === 'string') return 'tex';
        if (typeof node.value === 'boolean') return 'bol';
        if (typeof node.value === 'number') {
           // Verificamos si tiene punto en el raw lexeme para diferenciar 10 de 10.0
           if (node.raw && node.raw.includes('.')) return 'dec';
           return Number.isInteger(node.value) ? 'ent' : 'dec';
        }
        return 'unknown';
      case 'Identifier':
        return this.symbolTable[node.name] || 'unknown';
      case 'MemberExpression':
        if (node.computed) {
           const indexType = this.visit(node.property);
           this.checkTypeCompatibility('ent', indexType, 'Indice de arreglo');
        }
        return 'ent'; // Simplificación: asumimos que el arreglo contiene enteros para burbuja
      case 'NewExpression':
        return node.callee; 
      case 'ArrayInstantiation':
        return node.elementsType;
      case 'CallExpression':
        return 'unknown'; // Retorno simplificado para métodos
    }
    return 'unknown';
  }

  checkTypeCompatibility(expected, actual, varName) {
    if (actual === 'unknown' || expected === 'unknown') return; 
    
    if (expected === 'ent' && actual === 'dec') {
      this.errors.push(`El tipo 'dec' (decimal) no puede ser asignado a la variable entera '${varName}'.`);
    }
    else if (expected === 'tex' && (actual === 'ent' || actual === 'dec')) {
      this.errors.push(`Se esperaba un texto, pero se intento asignar un numero a '${varName}'.`);
    }
    else if ((expected === 'ent' || expected === 'dec') && actual === 'tex') {
      this.errors.push(`Se esperaba un numero, pero se intento asignar texto a '${varName}'.`);
    }
    else if (expected === 'bol' && actual !== 'bol') {
      this.errors.push(`Se esperaba un booleano para la variable '${varName}'.`);
    }
  }
}
