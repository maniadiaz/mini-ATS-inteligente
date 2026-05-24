const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractText(filepath, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    const buffer = fs.readFileSync(filepath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({ path: filepath });
    return result.value;
  }

  throw new Error('Formato no soportado. Solo se aceptan archivos .pdf y .docx');
}

module.exports = { extractText };
