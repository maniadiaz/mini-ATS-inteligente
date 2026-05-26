require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { sequelize, Vacante, Postulacion, Company, seedInitial } = require('./models');
const { extractText } = require('./extractor');
const { analyzeCV } = require('./analyzer');
const { initCrons } = require('./cron');
const { sendCvLimitWarningEmail, sendNewApplicationEmail } = require('./mailer');

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
app.use('/logos', express.static(path.join(__dirname, '..', 'public', 'logos')));

// IMPORTANT: Stripe webhook needs raw body BEFORE express.json()
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRouter)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Logos directory
const logosDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
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
  const vacante = await Vacante.findByPk(req.params.vid, {
    include: [{ model: Company, as: 'company', attributes: ['nombre', 'descripcion', 'sitio_web', 'industria', 'logo_url'] }]
  });
  if (!vacante) return res.status(404).send('Vacante no encontrada');

  // Check if vacante is open for applications
  const ahora = new Date();
  const inicio = vacante.fecha_inicio ? new Date(vacante.fecha_inicio) : null;
  const fin = vacante.fecha_fin ? new Date(vacante.fecha_fin) : null;

  if (!vacante.activa) {
    return res.render('postular', { vacante, company: vacante.company, cerrada: true, motivo: 'manual', error: null });
  }
  if (inicio && ahora < inicio) {
    return res.render('postular', { vacante, company: vacante.company, cerrada: true, motivo: 'no_iniciada', fecha_inicio: vacante.fecha_inicio, error: null });
  }
  if (fin && ahora > fin) {
    return res.render('postular', { vacante, company: vacante.company, cerrada: true, motivo: 'vencida', fecha_fin: vacante.fecha_fin, error: null });
  }

  res.render('postular', { vacante, company: vacante.company, cerrada: false, error: null });
});

app.post('/postular/:vid', upload.single('cv'), async (req, res) => {
  const vacante = await Vacante.findByPk(req.params.vid, {
    include: [{ model: Company, as: 'company' }]
  });
  if (!vacante) return res.status(404).send('Vacante no encontrada');

  // Validate vacante is open
  const ahora = new Date();
  const inicio = vacante.fecha_inicio ? new Date(vacante.fecha_inicio) : null;
  const fin = vacante.fecha_fin ? new Date(vacante.fecha_fin) : null;

  if (!vacante.activa || (inicio && ahora < inicio) || (fin && ahora > fin)) {
    return res.status(403).send('Esta vacante no está aceptando postulaciones');
  }

  if (!req.file) {
    return res.render('postular', { vacante, error: 'Solo se aceptan archivos .pdf y .docx' });
  }

  try {
    // Check CV limit for company
    const company = await Company.findByPk(vacante.company_id);
    if (company) {
      // Reset counter if new month
      const ahora = new Date();
      const periodoActual = new Date(company.periodo_actual);
      if (
        ahora.getMonth() !== periodoActual.getMonth() ||
        ahora.getFullYear() !== periodoActual.getFullYear()
      ) {
        await company.update({ cv_analizados_mes: 0, periodo_actual: ahora });
        company.cv_analizados_mes = 0;
      }

      const cvDisponibles = (company.cv_limit - company.cv_analizados_mes) + company.cv_extras;
      if (cvDisponibles <= 0) {
        return res.render('postular', { vacante, error: 'La empresa ha alcanzado su límite de CVs analizados este mes. Intenta más tarde.' });
      }
    }

    const cvText = await extractText(req.file.path, req.file.originalname);
    const resultado = await analyzeCV(vacante, cvText);

    // Increment CV counter AFTER successful analysis
    if (company) {
      if (company.cv_analizados_mes < company.cv_limit) {
        await company.increment('cv_analizados_mes');
      } else {
        await company.decrement('cv_extras');
      }

      // Send warning email at 80% usage
      const newCount = company.cv_analizados_mes + 1;
      if (newCount === Math.ceil(company.cv_limit * 0.8)) {
        await sendCvLimitWarningEmail(company);
      }
    }

    const postulacion = await Postulacion.create({
      company_id: vacante.company_id,
      vacante_id: vacante.id,
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      email: req.body.email,
      filename: req.file.filename,
      resultado,
    });

    // Send email notification if enabled
    if (vacante.notify_email && company) {
      const { User } = require('./models');
      const adminUser = await User.findOne({
        where: { company_id: vacante.company_id, role: 'admin', activo: true }
      });
      if (adminUser) {
        await sendNewApplicationEmail(adminUser.email, company.nombre, vacante, postulacion);
      }
    }

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
// Webhook route already registered above with raw body parser

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
