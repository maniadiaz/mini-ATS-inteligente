const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const crypto = require('crypto')
const sequelize = require('../database')

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.STRING(8),
    primaryKey: true,
    defaultValue: () => uuidv4().slice(0, 8),
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'reclutador'),
    defaultValue: 'reclutador',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
})

// Helper to hash passwords
Usuario.hashPassword = function (password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Instance method to verify password
Usuario.prototype.verifyPassword = function (password) {
  return this.password_hash === Usuario.hashPassword(password)
}

module.exports = Usuario
