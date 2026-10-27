// Ponto de partida de um termo novo: mesmo <style> do Termo de Compromisso
// da UnB (modelo #4), para que os blocos do editor visual (seção, cláusula,
// destaque, atenção) saiam com a mesma aparência dos termos existentes.
export const TERMO_ESQUELETO = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Termo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            color: #333;
            min-height: 100vh;

        }
        
        .termo-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            overflow: hidden;
        }
        
        .termo-header {
            padding: 30px;
            text-align: center;
            border-bottom: 5px solid #e74c3c;
        }
        
        .termo-header h1 {
            font-size: 2.2em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .termo-header .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .termo-content {
            padding: 40px;
        }
        
        .intro-text {
            font-size: 1.1em;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 5px;
            line-height: 1.8;
        }
        
        .clausula-section {
            margin-bottom: 35px;
        }
        
        .clausula-title {
            font-size: 1.4em;
            color: #2c3e50;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
            font-weight: 600;
            display: flex;
            align-items: center;
        }
        
        .clausula-title::before {
            content: "§";
            margin-right: 15px;
            background: #3498db;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .clausula-item {
            margin-bottom: 20px;
            padding-left: 30px;
            position: relative;
        }
        
        .clausula-item::before {
            content: counters(item, ".") " ";
            counter-increment: item;
            position: absolute;
            left: 0;
            top: 0;
            font-weight: bold;
            color: #e74c3c;
            font-size: 1.1em;
        }
        
        .clausula-item ol {
            list-style-type: none;
            counter-reset: subitem;
            margin-top: 15px;
            padding-left: 25px;
        }
        
        .clausula-item li {
            margin-bottom: 12px;
            padding-left: 30px;
            position: relative;
        }
        
        .clausula-item li::before {
            content: counters(item, ".") "." counters(subitem, ".") " ";
            counter-increment: subitem;
            position: absolute;
            left: 0;
            font-weight: 600;
            color: #27ae60;
        }
        
        .clausula-item li li::before {
            content: counters(item, ".") "." counters(subitem, ".") "." counters(subsubitem, ".") " ";
            counter-increment: subsubitem;
            color: #f39c12;
        }
        
        .clausula-item li li {
            padding-left: 40px;
        }
        
        .clausula-text {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 3px solid #3498db;
            margin: 10px 0;
        }
        
        .highlight {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 6px;
            font-weight: 500;
        }
        
        .warning {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 12px 15px;
            margin: 15px 0;
            border-radius: 6px;
            font-weight: 500;
        }
        
        .termo-footer {
            background: #ecf0f1;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #bdc3c7;
        }
        
        
        
        @media (max-width: 768px) {
            .termo-content {
                padding: 20px;
            }
            
            .termo-header h1 {
                font-size: 1.8em;
            }
            
            .clausula-title {
                font-size: 1.2em;
            }
            
            .footer-info {
                flex-direction: column;
            }
        }
        
        .print-only {
            display: none;
        }
        
        @media print {
            body {
                background: none;
                padding: 0;
            }
            
            .termo-container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .print-only {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="termo-container">
        <header class="termo-header">
            <h1>TÍTULO DO TERMO</h1>
            <p class="subtitle">Programa de Iniciação Científica</p>
        </header>

        <main class="termo-content">
            <div class="intro-text">
                Pelo presente termo, o/a estudante <strong>[NOME_ALUNO]</strong>, responsável pelo plano de trabalho <strong>[NOME_PLANO]</strong>, com vigência de [INICIO_VIGENCIA_EDITAL] a [FIM_VIGENCIA_EDITAL], declara estar ciente e de acordo com os itens abaixo.
            </div>

            <section class="clausula-section">
                <h2 class="clausula-title">Compromissos</h2>

                <div class="clausula-item">
                    <div class="clausula-text">
                        Escreva aqui o primeiro compromisso.
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>
`;
