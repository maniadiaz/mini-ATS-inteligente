const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  trial_days: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
  },
  cv_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 150,
  },
  mp_plan_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'plans',
  timestamps: true,
})

module.exports = Plan
