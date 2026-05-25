const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rfc: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
    defaultValue: 'trial',
  },
  trial_ends_at: {
    type: DataTypes.DATE,
  },
  cv_analizados_mes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  cv_extras: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  cv_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 150,
  },
  periodo_actual: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'companies',
  timestamps: true,
})

module.exports = Company
