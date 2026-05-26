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
  stripe_payment_intent_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stripe_session_id: {
    type: DataTypes.STRING,
    allowNull: true,
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
