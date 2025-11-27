require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- SECURITY ---
app.use(helmet({ contentSecurityPolicy: false })); // Επιτρέπει scripts
app.use(cors()); // Επιτρέπει συνδέσεις
app.use(express.json({ limit: '10kb' })); 
app.use(express.static('public'));

// --- RATE LIMIT ---
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// --- DATABASE ---
const sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    logging: false
});

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

// --- ROUTES ---

// 1. GET (Όλα)
app.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.findAll({ 
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'description', 'amount', 'createdAt'] // ΠΡΟΣΟΧΗ: Χρειαζόμαστε το 'id' για τη διαγραφή!
        });
        res.json(expenses);
    } catch (e) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// 2. POST (Προσθήκη)
app.post('/expenses', async (req, res) => {
    try {
        const safeData = {
            description: req.body.description ? req.body.description.trim() : '',
            amount: parseFloat(req.body.amount)
        };
        const newItem = await Expense.create(safeData);
        res.json(newItem);
    } catch (e) {
        if (e.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Λάθος δεδομένα (π.χ. μικρή λέξη)' });
        }
        res.status(500).json({ error: 'Server Error' });
    }
});

// 3. DELETE (Διαγραφή) - <--- ΑΥΤΟ ΣΟΥ ΕΛΕΙΠΕ ΜΑΛΛΟΝ
app.delete('/expenses/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Διαγραφή από τη βάση
        const result = await Expense.destroy({ where: { id: id } });

        if (result === 0) {
            return res.status(404).json({ error: 'Δεν βρέθηκε' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Σφάλμα διαγραφής' });
    }
});

// --- START ---
app.listen(3000, async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('✅ SERVER READY: http://localhost:3000');
    } catch (error) {
        console.error('❌ DB ERROR:', error.message);
    }
});