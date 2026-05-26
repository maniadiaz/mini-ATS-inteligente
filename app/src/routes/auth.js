const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { Company, User, Plan } = require('../models')
const { sendWelcomeEmail } = require('../mailer')
const { requireJWT } = require('../middleware/auth')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret'

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  try {
    const user = await User.findOne({
      where: { email, activo: true },
      include: [{ model: Company, as: 'company' }],
    })

    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // If not superadmin, check company status
    if (user.role !== 'superadmin') {
      if (!user.company) {
        return res.status(403).json({ error: 'Empresa no encontrada' })
      }
      if (user.company.status === 'cancelled') {
        return res.status(403).json({ error: 'Cuenta cancelada' })
      }
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      company_nombre: user.company?.nombre || null,
      company_status: user.company?.status || null,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_nombre: user.company?.nombre || null,
        company_status: user.company?.status || null,
      },
    })
  } catch (err) {
    console.error('Error en login:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /auth/register
router.post('/register', async (req, res) => {
  const { nombre_empresa, rfc, email, password, nombre_admin } = req.body

  if (!nombre_empresa || !email || !password || !nombre_admin) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos' })
  }

  try {
    // Check email unique
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    // Get trial days from plan
    const plan = await Plan.findOne({ where: { activo: true } })
    const trialDays = plan ? plan.trial_days : parseInt(process.env.TRIAL_DAYS) || 14

    // Create company
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + trialDays)

    const company = await Company.create({
      nombre: nombre_empresa,
      rfc: rfc || null,
      email,
      status: 'trial',
      trial_ends_at: trialEnds,
    })

    // Create admin user
    const password_hash = await User.hashPassword(password)
    const user = await User.create({
      company_id: company.id,
      nombre: nombre_admin,
      email,
      password_hash,
      role: 'admin',
    })

    // Send welcome email
    await sendWelcomeEmail(company, trialDays)

    // Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: company.id,
      company_nombre: company.nombre,
      company_status: company.status,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

    res.status(201).json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        company_id: company.id,
        company_nombre: company.nombre,
        company_status: company.status,
      },
    })
  } catch (err) {
    console.error('Error en registro:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /auth/refresh — Refresh token with updated company status
router.get('/refresh', requireJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user_id, {
      include: [{ model: Company, as: 'company' }],
    })

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      company_nombre: user.company?.nombre || null,
      company_status: user.company?.status || null,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

    res.json({ token })
  } catch (err) {
    console.error('Error refrescando token:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
