const sequelize = require('../database')
const Company = require('./Company')
const User = require('./User')
const Plan = require('./Plan')
const Subscription = require('./Subscription')
const Vacante = require('./Vacante')
const Postulacion = require('./Postulacion')
const CvPack = require('./CvPack')

// Associations
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' })
Company.hasOne(Subscription, { foreignKey: 'company_id', as: 'subscription' })
Company.hasMany(Vacante, { foreignKey: 'company_id', as: 'vacantes' })
Company.hasMany(CvPack, { foreignKey: 'company_id', as: 'cvPacks' })

CvPack.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })

User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })

Subscription.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })

Vacante.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })
Vacante.hasMany(Postulacion, { foreignKey: 'vacante_id', as: 'postulaciones' })

Postulacion.belongsTo(Vacante, { foreignKey: 'vacante_id', as: 'vacante' })
Postulacion.belongsTo(Company, { foreignKey: 'company_id', as: 'company' })

// Seed superadmin + plan
async function seedInitial() {
  // Seed superadmin
  const email = process.env.SUPERADMIN_EMAIL
  const password = process.env.SUPERADMIN_PASSWORD
  if (email && password) {
    const exists = await User.findOne({ where: { email, role: 'superadmin' } })
    if (!exists) {
      // Create internal company for superadmin
      const superCompany = await Company.create({
        nombre: process.env.SUPERADMIN_COMPANY_NAME || 'ServerControl',
        email,
        status: 'active',
        cv_limit: 999999,
        cv_analizados_mes: 0,
        cv_extras: 0,
      })

      const password_hash = await User.hashPassword(password)
      await User.create({
        nombre: process.env.SUPERADMIN_NOMBRE || 'Super Admin',
        email,
        password_hash,
        role: 'superadmin',
        company_id: superCompany.id,
      })
      console.log(`Superadmin "${email}" creado con empresa "${superCompany.nombre}".`)
    }
  }

  // Seed plan
  const existingPlan = await Plan.findOne({ where: { activo: true } })
  if (!existingPlan) {
    await Plan.create({
      nombre: process.env.PLAN_NAME || 'ATS Pro',
      precio: parseFloat(process.env.PLAN_PRICE) || 999,
      trial_days: parseInt(process.env.TRIAL_DAYS) || 14,
      cv_limit: parseInt(process.env.CV_LIMIT_BASE) || 150,
    })
    console.log('Plan inicial creado.')
  }
}

module.exports = { sequelize, Company, User, Plan, Subscription, Vacante, Postulacion, CvPack, seedInitial }
