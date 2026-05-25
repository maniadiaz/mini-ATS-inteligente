const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const CvPack = sequelize.define('CvPack', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mp_payment_id: {
    type: DataTypes.STRING,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'cv_packs',
  timestamps: true,
})

module.exports = CvPack
