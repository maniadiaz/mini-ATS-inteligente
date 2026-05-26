const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const sequelize = require('../database')

const Vacante = sequelize.define('Vacante', {
  id: {
    type: DataTypes.STRING(8),
    primaryKey: true,
    defaultValue: () => uuidv4().slice(0, 8),
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  puesto: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  empresa: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  anios_exp: {
    type: DataTypes.STRING,
  },
  stack: {
    type: DataTypes.TEXT,
  },
  ingles: {
    type: DataTypes.STRING,
  },
  espanol: {
    type: DataTypes.STRING,
  },
  otros: {
    type: DataTypes.TEXT,
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notify_email: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  area: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'vacantes',
  timestamps: true,
})

module.exports = Vacante
