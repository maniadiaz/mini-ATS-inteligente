require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { sequelize, Vacante, Postulacion, seedInitial } = require('./models');
const { extractText } = require('./extractor');
const { analyzeCV } = require('./analyzer');
const { initCrons } = require('./cron');

// Route imports
const authRouter = require('./routes/auth');
const vacantesRouter = require('./routes/vacantes');
const cvRouter = require('./routes/cv');
const adminRouter = require('./routes/admin');
const superadminRouter = require('./routes/superadmin');
const webhookRouter = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3105;

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

// Multer config (for public postular form)
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
  if (!vacante || !vacante.activa) return res.status(404).send('Vacante no encontrada');
  res.render('postular', { vacante, error: null });
});

app.post('/postular/:vid', upload.single('cv'), async (req, res) => {
  const vacante = await Vacante.findByPk(req.params.vid);
  if (!vacante || !vacante.activa) return res.status(404).send('Vacante no encontrada');

  if (!req.file) {
    return res.render('postular', { vacante, error: 'Solo se aceptan archivos .pdf y .docx' });
  }

  try {
    const cvText = await extractText(req.file.path, req.file.originalname);
    const resultado = await analyzeCV(vacante, cvText);

    const postulacion = await Postulacion.create({
      company_id: vacante.company_id,
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

// =============== API ROUTES ===============
app.use('/auth', authRouter);
app.use('/vacante', vacantesRouter);
app.use('/cv', cvRouter);
app.use('/admin', adminRouter);
app.use('/superadmin', superadminRouter);
app.use('/webhook', webhookRouter);

// --------------- Error handler for multer ---------------
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes('Solo se aceptan')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// --------------- Start with DB sync ---------------
sequelize.sync({ alter: true }).then(async () => {
  await seedInitial();
  initCrons();
  app.listen(PORT, () => {
    console.log(`Mini ATS Inteligente corriendo en http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Error conectando a la base de datos:', err.message);
  process.exit(1);
});
