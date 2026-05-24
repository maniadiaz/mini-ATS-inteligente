const sequelize = require('../database')
const Vacante = require('./Vacante')
const Postulacion = require('./Postulacion')
const Usuario = require('./Usuario')

// Associations
Vacante.hasMany(Postulacion, { foreignKey: 'vacante_id', as: 'postulaciones' })
Postulacion.belongsTo(Vacante, { foreignKey: 'vacante_id', as: 'vacante' })

// Seed default admin user from .env
async function seedAdmin() {
  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS
  if (!adminUser || !adminPass) return

  const exists = await Usuario.findOne({ where: { username: adminUser } })
  if (!exists) {
    await Usuario.create({
      username: adminUser,
      password_hash: Usuario.hashPassword(adminPass),
      nombre: 'Administrador',
      rol: 'admin',
    })
    console.log(`Usuario admin "${adminUser}" creado por defecto.`)
  }
}

module.exports = { sequelize, Vacante, Postulacion, Usuario, seedAdmin }
