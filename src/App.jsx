import React, { useState, useEffect, useRef } from 'react';
import { Lexer } from './compiler/Lexer';
import { Parser } from './compiler/Parser';
import { Interpreter } from './compiler/Interpreter';

const defaultCode = `// Prueba funcional en Ñ-Junior
cl Vehiculo {
  tex marca;
  ent velocidad;

  func vac configurar(tex m, ent vel) {
    marca = m;
    velocidad = vel;
  }

  func tex obtenerEstado() {
    ret "El vehiculo viaja a " + velocidad;
  }
}

cl Auto her Vehiculo {
  ent puertas;
}

«
  Instanciacion y salida
»
Vehiculo miAuto = nv Vehiculo();
miAuto.configurar("Chevrolet", 220);
imp "El IDE Ñ-Junior esta funcionando correctamente!";
`;

function App() {
  const [code, setCode] = useState(defaultCode);
  const [tokens, setTokens] = useState([]);
  const [ast, setAst] = useState(null);
  const [output, setOutput] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleRun = () => {
    // 1. Lexical Analysis
    const lexer = new Lexer(code);
    const generatedTokens = lexer.tokenize();
    setTokens(generatedTokens);
    
    // Check lexical errors
    if (lexer.errors.length > 0) {
      setOutput(lexer.errors.map(e => `Error Lexico: ${e.message} (L${e.line}:C${e.column})`));
      setAst(null);
      setParseErrors([]);
      return;
    }

    // 2. Syntactic Analysis (Parsing)
    const parser = new Parser(generatedTokens);
    const parserResult = parser.parse();
    setAst(parserResult.ast);
    setParseErrors(parserResult.errors);

    // Check syntax errors
    if (parserResult.errors.length > 0) {
      setOutput(parserResult.errors.map(e => `Error Sintactico: ${e}`));
      return;
    }

    // 3. Execution (Interpretation)
    try {
      const interpreter = new Interpreter();
      const result = interpreter.evaluate(parserResult.ast);
      setOutput(result);
    } catch (e) {
      setOutput([`Error de Ejecucion: ${e.message}`]);
    }
  };

  // Run once on load to show initial state
  useEffect(() => {
    handleRun();
  }, []);

  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className="ide-container">
      <header className="header">
        <h1>Ñ-Junior IDE</h1>
        <button className="run-btn" onClick={handleRun}>
          ▶ Compilar y Ejecutar
        </button>
      </header>

      <main className="main-content">
        {/* Panel Izquierdo: Editor */}
        <div className="panel grid-left">
          <div className="panel-header">
            <span>Editor (codigo.njr)</span>
          </div>
          <div className="panel-content" style={{ display: 'flex', flexDirection: 'row', padding: 0, overflow: 'hidden' }}>
            <div 
              ref={lineNumbersRef}
              style={{
                width: '40px',
                padding: '10px 5px',
                background: 'rgba(0,0,0,0.2)',
                color: '#666',
                textAlign: 'right',
                fontFamily: 'Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                overflow: 'hidden',
                borderRight: '1px solid var(--border-color)',
                userSelect: 'none',
                whiteSpace: 'pre'
              }}
            >
              {lines}
            </div>
            <textarea 
              ref={textareaRef}
              className="editor-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              spellCheck="false"
              style={{
                flex: 1,
                padding: '10px',
                margin: 0,
                border: 'none',
                resize: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre',
                overflow: 'auto'
              }}
            />
          </div>
        </div>

        {/* Panel Superior Derecho: Lexer y Parser (Tabs) */}
        <div className="panel grid-top-right" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-color)'}}>
          
          <div style={{background: 'var(--bg-glass)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
             <div className="panel-header"><span>Analizador Léxico (Tokens)</span></div>
             <div className="panel-content" style={{ overflow: 'auto' }}>
               <table className="tokens-table">
                 <thead>
                   <tr>
                     <th>Tipo</th>
                     <th>Lexema</th>
                     <th>Linea</th>
                   </tr>
                 </thead>
                 <tbody>
                   {tokens.map((t, i) => (
                     <tr key={i}>
                       <td style={{ color: `var(--${t.type.toLowerCase()})` }}>{t.type}</td>
                       <td>{t.lexeme}</td>
                       <td>{t.line}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          <div style={{background: 'var(--bg-glass)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
             <div className="panel-header"><span>Analizador Sintáctico (AST)</span></div>
             <div className="panel-content" style={{ overflow: 'auto' }}>
               <pre className="ast-tree">
                 {ast ? JSON.stringify(ast, null, 2) : 'No se pudo generar el AST por errores de compilación.'}
               </pre>
             </div>
          </div>
        </div>

        {/* Panel Inferior Derecho: Consola */}
        <div className="panel grid-bottom-right">
          <div className="panel-header">
            <span>Consola de Salida</span>
          </div>
          <div className="panel-content console-output" style={{ overflow: 'auto' }}>
            {output.map((line, i) => (
              <div key={i} className={line.toString().includes('Error') ? 'console-error' : ''}>
                {'> '} {line}
              </div>
            ))}
            {output.length === 0 && <div style={{color: 'var(--text-secondary)'}}>&gt; (sin salida)</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
