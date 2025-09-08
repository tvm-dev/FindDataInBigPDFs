const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises'); // Versão de promises
const fsSync = require('fs'); // Para usar o existsSync
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { PDFImage } = require('pdf-poppler');

const app = express();
const PORT = 3000;

// Pasta para arquivos temporários de upload e para imagens de OCR
const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');

// Assegura que as pastas de upload e temporária existem
if (!fsSync.existsSync(uploadDir)) {
    fsSync.mkdirSync(uploadDir);
}
if (!fsSync.existsSync(tempDir)) {
    fsSync.mkdirSync(tempDir);
}

// Configuração do multer para upload
const upload = multer({
    dest: uploadDir,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Apenas arquivos PDF são permitidos!'), false);
        }
        cb(null, true);
    }
});

// Servir front-end estático
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Função para extrair texto de PDFs pesquisáveis
async function extrairTextoPDF(pdfPath) {
    try {
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdf(dataBuffer);
        return data.text.trim();
    } catch (err) {
        console.error('Erro ao extrair texto do PDF:', err);
        return '';
    }
}

// Função para extrair texto usando OCR em PDFs de imagem
async function extrairTextoOCR(pdfPath) {
    let fullText = '';
    const outputDir = path.join(tempDir, path.basename(pdfPath, '.pdf'));
    
    await fs.mkdir(outputDir, { recursive: true });

    try {
        const popplerOptions = {
            format: 'jpeg',
            out_dir: outputDir,
            out_prefix: path.basename(pdfPath, '.pdf'),
            scale: 2048,
        };

        const poppler = new PDFImage(pdfPath, popplerOptions);
        await poppler.convertFile();

        const files = await fs.readdir(outputDir);
        for (const file of files) {
            const imagePath = path.join(outputDir, file);
            const { data: { text } } = await Tesseract.recognize(imagePath, 'por'); 
            fullText += text;
            await fs.unlink(imagePath); // Limpa a imagem após o OCR
        }

    } catch (err) {
        console.error('Erro no OCR:', err);
        throw new Error('Não foi possível processar o PDF com OCR. Verifique a instalação do Poppler.');
    } finally {
        await fs.rm(outputDir, { recursive: true, force: true });
    }
    
    return fullText.trim();
}

// Função para buscar palavras-chave no texto
function buscarNoTexto(texto, nomeProcurado) {
    const resultado = [];
    const palavrasChave = nomeProcurado.toLowerCase().split(/\s+/);
    
    const linhas = texto.split('\n');
    linhas.forEach((linha, index) => {
        const linhaNormalizada = linha.replace(/\s+/g, ' ').toLowerCase();
        
        const contemPalavra = palavrasChave.some(palavra => {
            return linhaNormalizada.includes(palavra);
        });

        if (contemPalavra) {
            resultado.push(`Linha ${index + 1}: ${linha.trim()}`);
        }
    });

    return resultado;
}

// Rota para upload e busca
app.post('/upload', upload.single('pdf'), async (req, res) => {
    let pdfPath = req.file?.path;
    let nomeProcurado = req.body?.nome?.trim();

    if (!pdfPath || !nomeProcurado) {
        return res.status(400).send(`
            Erro: Parâmetros inválidos. <br><a href="/">Voltar</a>
        `);
    }
    
    try {
        let texto = await extrairTextoPDF(pdfPath);

        // Se o PDF não for pesquisável, tenta o OCR
        if (!texto) {
            texto = await extrairTextoOCR(pdfPath);
        }
        
        // Adicionando um log para depuração
        console.log('Texto extraído:', texto);

        const resultado = buscarNoTexto(texto, nomeProcurado);

        let mensagemFinal = '';
        if (resultado.length > 0) {
            mensagemFinal = `<h2>Resultado da pesquisa:</h2><p>${resultado.join('<br>')}</p>`;
        } else {
            mensagemFinal = `<h2>Resultado da pesquisa:</h2><p>Nome não encontrado no documento. Isso pode ocorrer com PDFs de baixa qualidade de imagem ou se o nome não estiver presente.</p>`;
        }

        res.send(`
            ${mensagemFinal}
            <a href="/">Voltar</a>
        `);
    } catch (err) {
        res.status(500).send(`
            Erro: ${err.message} <br><a href="/">Voltar</a>
        `);
    } finally {
        if (pdfPath) {
            await fs.unlink(pdfPath).catch(err => console.error('Erro ao remover arquivo temporário:', err));
        }
    }
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));