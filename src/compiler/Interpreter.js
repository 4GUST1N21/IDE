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
        this.output.push(val);
        break;
      case 'ReturnStatement':
        return this.visit(node.argument);
      case 'AssignmentExpression':
        const assignVal = this.visit(node.right);
        if (node.left.type === 'Identifier') {
          // If the variable doesn't exist yet, we still set it (or we could enforce declaration)
          this.environment[node.left.name] = assignVal;
          return assignVal;
        } else if (node.left.type === 'MemberExpression') {
          // Mock setting a property
          return assignVal;
        }
        throw new Error("Objetivo de asignacion invalido");
      case 'BinaryExpression':
        return this.evaluateBinary(node);
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
        if (obj && obj.type === 'Instance') {
           // Mocked property return
           return `<Miembro ${node.property} de ${obj.className}>`;
        }
        throw new Error(`No se puede acceder a la propiedad de un objeto nulo`);
      case 'CallExpression':
        // We'll just return a mock string for function calls to avoid deep OOP state management in the basic interpreter
        const callee = this.visit(node.callee);
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
