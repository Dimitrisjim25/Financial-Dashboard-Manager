const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Συνδέεται με τη βάση

const Expense = sequelize.define('Expense', {
    description: { 
        type: DataTypes.STRING, allowNull: false,
        validate: { notEmpty: true, len: [3, 50] }
    },
    amount: { 
        type: DataTypes.FLOAT, allowNull: false,
        validate: { min: 0.01 }
    }
});

module.exports = Expense; // Το κάνουμε export για να το βρει το server.js