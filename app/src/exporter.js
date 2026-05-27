const ExcelJS = require('exceljs');

async function exportarExcel(res, vacante, postulaciones) {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Candidatos');

  // Headers
  const headers = [
    'ID', 'Nombre Completo', 'Teléfono', 'Correo', 'Score %',
    'Habilidades Match', 'Habilidades Encontradas', 'Habilidades Faltantes',
    'Inglés Requerido', 'Inglés Detectado', 'Años Exp Cumple',
    'ATS Legible', 'Problemas ATS', 'Fortalezas', 'Debilidades',
    'Recomendación', 'Pasó o No Pasó',
  ];

  // Add header row
  const headerRow = ws.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A3C5E' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Freeze first row
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // Color fills
  const grayFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
  const yellowFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
  const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };

  // Data rows
  postulaciones.forEach((post, idx) => {
    const r = post.resultado || {};
    const match = r.match_requisitos || {};
    // 'habilidades' es el campo actual; 'stack' es fallback para registros legacy en DB
    const stackInfo = match.habilidades || match.stack || {};
    const ats = r.ats_legibilidad || {};

    const recomendacion = r.recomendacion || 'REVISAR';
    let paso = 'Pendiente';
    if (recomendacion === 'APTO') paso = 'Sí';
    else if (recomendacion === 'NO APTO') paso = 'No';

    const rowData = [
      idx + 1,
      post.nombre || '',
      post.telefono || '',
      post.email || '',
      r.score_total || 0,
      stackInfo.cumple ? 'Sí' : 'No',
      (stackInfo.encontrados || []).join(' | '),
      (stackInfo.faltantes || []).join(' | '),
      vacante.ingles || '',
      (match.ingles || {}).detalle || '',
      (match.anios_exp || {}).cumple ? 'Sí' : 'No',
      ats.detectable ? 'Sí' : 'No',
      (ats.problemas || []).join(' | '),
      (r.fortalezas || []).join(' | '),
      (r.debilidades || []).join(' | '),
      recomendacion,
      paso,
    ];

    const row = ws.addRow(rowData);

    // Alternate row color
    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = grayFill;
      });
    }

    // Score color (column 5)
    const scoreCell = row.getCell(5);
    const score = r.score_total || 0;
    if (score >= 70) scoreCell.fill = greenFill;
    else if (score >= 40) scoreCell.fill = yellowFill;
    else scoreCell.fill = redFill;

    // Borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
  });

  // Auto-fit columns (minimum 15 chars)
  ws.columns.forEach((col, i) => {
    let maxLen = headers[i].length;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = Math.min(len, 50);
    });
    col.width = Math.max(maxLen + 3, 15);
  });

  // Send response
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const puesto = vacante.puesto.replace(/\s+/g, '_');
  const filename = `candidatos_${puesto}_${fecha}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { exportarExcel };
