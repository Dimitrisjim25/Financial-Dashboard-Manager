// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Παίρνουμε τη σύνδεση από το άλλο αρχείο

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: { // Εδώ θα αποθηκεύουμε το HASH, όχι τον κωδικό σκέτο
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = User;