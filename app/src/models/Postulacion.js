const { DataTypes } = require('sequelize')
const { v4: uuidv4 } = require('uuid')
const sequelize = require('../database')

const Postulacion = sequelize.define('Postulacion', {
  id: {
    type: DataTypes.STRING(8),
    primaryKey: true,
    defaultValue: () => uuidv4().slice(0, 8),
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
  },
}, {
  tableName: 'postulaciones',
  timestamps: true,
})

module.exports = Postulacion
