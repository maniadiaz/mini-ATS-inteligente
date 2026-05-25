const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  company_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mp_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mp_plan_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('authorized', 'paused', 'cancelled', 'pending'),
    defaultValue: 'pending',
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
})

module.exports = Subscription
