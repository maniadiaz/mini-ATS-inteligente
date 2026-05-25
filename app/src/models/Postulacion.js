const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const sequelize = require('../database')

const Postulacion = sequelize.define('Postulacion', {
  id: {
    type: DataTypes.STRING(8),
    primaryKey: true,
    defaultValue: () => uuidv4().slice(0, 8),
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  vacante_id: {
    type: DataTypes.STRING(8),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  filename: {
    type: DataTypes.STRING,
  },
  resultado: {
    type: DataTypes.JSON,
    get() {
      const raw = this.getDataValue('resultado')
      if (typeof raw === 'string') {
        try { return JSON.parse(raw) } catch { return raw }
      }
      return raw
    },
  },
}, {
  tableName: 'postulaciones',
  timestamps: true,
})

module.exports = Postulacion
