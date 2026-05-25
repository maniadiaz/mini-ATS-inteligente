const { DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')
const sequelize = require('../database')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: true, // null for superadmin
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'recruiter'),
    defaultValue: 'recruiter',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
})

User.hashPassword = async function (password) {
  return bcrypt.hash(password, 10)
}

User.prototype.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.password_hash)
}

module.exports = User
