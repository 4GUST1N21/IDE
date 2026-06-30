export class Interpreter {
  constructor() {
    this.environment = {};
    this.classes = {};
    this.output = [];
  }

  evaluate(ast) {
    this.output = [];
    try {
      this.visit(ast);
    } catch (e) {
      this.output.push(`Error de Ejecucion: ${e.message}`);
    }
    return this.output;
  }

  visit(node) {
    if (!node) return null;
    switch (node.type) {
      case 'Program':
        for (const stmt of node.body) {
          this.visit(stmt);
        }
        break;
      case 'ClassDeclaration':
        this.classes[node.name] = node;
        break;
      case 'VariableDeclaration':
        const initValue = this.visit(node.init);
        this.environment[node.name] = initValue;
        break;
      case 'ExpressionStatement':
        this.visit(node.expression);
        break;
      case 'PrintStatement':
        const val = this.visit(node.argument);
        if (Array.isArray(val)) {
           this.output.push('[' + val.join(', ') + ']');
        } else {
           this.output.push(val);
        }
        break;
      case 'IfStatement':
        const condition = this.visit(node.test);
        if (condition) {
           node.consequent.forEach(stmt => this.visit(stmt));
        } else if (node.alternate) {
           node.alternate.forEach(stmt => this.visit(stmt));
        }
        break;
      case 'WhileStatement':
        while (this.visit(node.test)) {
           node.body.forEach(stmt => this.visit(stmt));
        }
        break;
      case 'ForStatement':
        if (node.init) this.visit(node.init);
        while (!node.test || this.visit(node.test)) {
           node.body.forEach(stmt => this.visit(stmt));
           if (node.update) this.visit(node.update);
        }
        break;
      case 'ReturnStatement':
        const retVal = this.visit(node.argument);
        const err = new Error('RETURN_VALUE');
        err.value = retVal;
        throw err;
      case 'AssignmentExpression':
        const assignVal = this.visit(node.right);
        if (node.left.type === 'Identifier') {
          this.environment[node.left.name] = assignVal;
          return assignVal;
        } else if (node.left.type === 'MemberExpression') {
          if (node.left.computed) {
             const obj = this.visit(node.left.object);
             const prop = this.visit(node.left.property);
             if (Array.isArray(obj)) {
                obj[prop] = assignVal;
                return assignVal;
             }
          }
          return assignVal;
        }
        throw new Error("Objetivo de asignacion invalido");
      case 'BinaryExpression':
        return this.evaluateBinary(node);
      case 'ArrayInstantiation':
        return new Array(this.visit(node.size)).fill(0);
      case 'NewExpression':
        return { type: 'Instance', className: node.callee, properties: {} };
      case 'Literal':
        // If it's a string, remove quotes for printing
        if (typeof node.value === 'string') {
          return node.value;
        }
        return node.value;
      case 'Identifier':
        if (!(node.name in this.environment)) {
          throw new Error(`Variable no definida: ${node.name}`);
        }
        return this.environment[node.name];
      case 'MemberExpression':
        const obj = this.visit(node.object);
        if (node.computed) {
           const prop = this.visit(node.property);
           if (Array.isArray(obj)) {
              return obj[prop];
           }
        }
        if (obj && obj.type === 'Instance') {
           return `<Miembro ${node.property} de ${obj.className}>`;
        }
        throw new Error(`No se puede acceder a la propiedad de un objeto nulo`);
      case 'CallExpression':
        if (node.callee.type === 'MemberExpression') {
           const callerObj = this.visit(node.callee.object);
           if (callerObj && callerObj.type === 'Instance') {
              const classDecl = this.classes[callerObj.className];
              if (classDecl) {
                 const method = classDecl.body.find(m => m.type === 'MethodDeclaration' && m.name === node.callee.property);
                 if (method) {
                    const args = node.arguments.map(arg => this.visit(arg));
                    const oldEnv = this.environment;
                    this.environment = Object.assign({}, oldEnv);
                    method.params.forEach((param, i) => {
                       this.environment[param.name] = args[i];
                    });
                    try {
                       method.body.forEach(stmt => this.visit(stmt));
                    } catch (e) {
                       if (e.message === 'RETURN_VALUE') {
                          this.environment = oldEnv;
                          return e.value;
                       }
                       throw e;
                    }
                    this.environment = oldEnv;
                    return null;
                 }
              }
           }
        }
        return `[Llamada a metodo ejecutada]`;
      default:
        throw new Error(`Nodo AST desconocido: ${node.type}`);
    }
  }

  evaluateBinary(node) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    
    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': 
        if (right === 0) throw new Error("Division por cero");
        return left / right;
      case '%': return left % right;
      case '==': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      default:
        throw new Error(`Operador desconocido: ${node.operator}`);
    }
  }
}
