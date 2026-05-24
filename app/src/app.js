require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const { extractText } = require('./extractor');
const { analyzeCV } = require('./analyzer');
const { exportarExcel } = require('./exporter');
const { sequelize, Vacante, Postulacion, Usuario, seedAdmin } = require('./models');

const app = express();
const PORT = process.env.PORT || 3105;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'default-jwt-secret';

// --------------- Config ---------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, uuidv4() + '_' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'pdf' || ext === 'docx') {
    cb(null, true);
  } else {
    cb(new Error('Solo se aceptan archivos .pdf y .docx'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --------------- Public routes (EJS for candidates) ---------------

app.get('/postular/:vid', async (req, res) => {
  const vacante = await Vacante.findByPk(req.params.vid);
  if (!vacante) return res.status(404).send('Vacante no encontrada');
  res.render('postular', { vacante, error: null });
});

app.post('/postular/:vid', upload.single('cv'), async (req, res) => {
  const vacante = await Vacante.findByPk(req.params.vid);
  if (!vacante) return res.status(404).send('Vacante no encontrada');

  if (!req.file) {
    return res.render('postular', { vacante, error: 'Solo se aceptan archivos .pdf y .docx' });
  }

  try {
    const cvText = await extractText(req.file.path, req.file.originalname);
    const resultado = await analyzeCV(vacante, cvText);

    const postulacion = await Postulacion.create({
      vacante_id: vacante.id,
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      email: req.body.email,
      filename: req.file.filename,
      resultado,
    });

    return res.redirect(`/confirmacion/${postulacion.id}`);
  } catch (err) {
    console.error('Error en postulación:', err.message);
    return res.render('postular', { vacante, error: err.message });
  }
});

app.get('/confirmacion/:pid', async (req, res) => {
  const post = await Postulacion.findByPk(req.params.pid);
  if (!post) return res.status(404).send('Postulación no encontrada');
  res.render('confirmacion', { post });
});

// =============== API ROUTES (JSON + JWT) ===============

// JWT middleware
function requireJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// API Auth
app.post('/auth/login', async (req, res) => {
  const { user, pass } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { username: user, activo: true } });
    if (usuario && usuario.verifyPassword(pass)) {
      const token = jwt.sign(
        { id: usuario.id, user: usuario.username, rol: usuario.rol },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      return res.json({ token, usuario: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol } });
    }
    res.status(401).json({ error: 'Credenciales incorrectas' });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// API Vacantes
app.get('/vacante', requireJWT, async (req, res) => {
  try {
    const vacantes = await Vacante.findAll({
      include: [{ model: Postulacion, as: 'postulaciones', attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(vacantes);
  } catch (err) {
    console.error('Error listando vacantes:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/vacante', requireJWT, async (req, res) => {
  try {
    const vacante = await Vacante.create({
      puesto: req.body.puesto,
      empresa: req.body.empresa,
      descripcion: req.body.descripcion,
      anios_exp: req.body.anios_exp,
      stack: req.body.stack,
      ingles: req.body.ingles,
      espanol: req.body.espanol,
      otros: req.body.otros || '',
    });
    res.json(vacante);
  } catch (err) {
    console.error('Error creando vacante:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/vacante/:vid/dashboard', requireJWT, async (req, res) => {
  try {
    const vacante = await Vacante.findByPk(req.params.vid);
    if (!vacante) return res.status(404).json({ error: 'Vacante no encontrada' });

    let posts = await Postulacion.findAll({ where: { vacante_id: req.params.vid } });

    // Filter by recommendation (JSON field — filter in JS)
    const rec = req.query.recomendacion || '';
    if (rec && ['APTO', 'REVISAR', 'NO APTO'].includes(rec)) {
      posts = posts.filter((p) => p.resultado && p.resultado.recomendacion === rec);
    }

    // Sort
    const orden = req.query.orden || 'score';
    if (orden === 'nombre') {
      posts.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else if (orden === 'fecha') {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      posts.sort((a, b) => (b.resultado?.score_total || 0) - (a.resultado?.score_total || 0));
    }

    res.json({ vacante, postulaciones: posts });
  } catch (err) {
    console.error('Error en dashboard:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/vacante/:vid/exportar', requireJWT, async (req, res) => {
  try {
    const vacante = await Vacante.findByPk(req.params.vid);
    if (!vacante) return res.status(404).json({ error: 'Vacante no encontrada' });

    const posts = await Postulacion.findAll({ where: { vacante_id: req.params.vid } });
    posts.sort((a, b) => (b.resultado?.score_total || 0) - (a.resultado?.score_total || 0));

    await exportarExcel(res, vacante, posts);
  } catch (err) {
    console.error('Error exportando:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// API CV download
app.get('/cv/:pid', requireJWT, async (req, res) => {
  const post = await Postulacion.findByPk(req.params.pid);
  if (!post) return res.status(404).json({ error: 'Postulación no encontrada' });

  const filepath = path.join(uploadsDir, post.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Archivo no encontrado' });

  res.download(filepath, post.filename.split('_').slice(1).join('_'));
});

// --------------- Error handler for multer ---------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('Solo se aceptan')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// --------------- Start with DB sync ---------------
sequelize.sync({ alter: true }).then(async () => {
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Mini ATS Inteligente corriendo en http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Error conectando a la base de datos:', err.message);
  process.exit(1);
});
