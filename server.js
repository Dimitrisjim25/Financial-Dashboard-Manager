require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Imports
const sequelize = require('./config/db');
const Expense = require('./models/Expense');
const User = require('./models/User'); //Φέραμε και το User
const authRoutes = require('./routes/auth');
const verifyToken = require('./middleware/auth'); 

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' })); 
app.use(express.static('public'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

//ΟΡΙΣΜΟΣ ΣΧΕΣΕΩΝ (Associations)
// Λέμε στη βάση πώς συνδέονται οι πίνακες
User.hasMany(Expense);
Expense.belongsTo(User);

// --- ROUTES ---
app.use('/auth', authRoutes);

// --- EXPENSES (ΚΛΕΙΔΩΜΕΝΑ & ΠΡΟΣΩΠΙΚΑ) ---

app.get('/expenses', verifyToken, async (req, res) => {
    try {
        //Ζητάμε ΜΟΝΟ τα έξοδα του χρήστη που έκανε το αίτημα (req.user.id)
        const expenses = await Expense.findAll({ 
            where: { UserId: req.user.id }, // <--- ΤΟ ΦΙΛΤΡΟ
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'description', 'amount', 'createdAt']
        });
        res.json(expenses);
    } catch (e) { res.status(500).json({ error: 'Server Error' }); }
});

app.post('/expenses', verifyToken, async (req, res) => {
    try {
        const safeData = {
            description: req.body.description ? req.body.description.trim() : '',
            amount: parseFloat(req.body.amount),
            UserId: req.user.id //Αποθηκεύουμε ΠΟΙΟΣ το έκανε
        };
        const newItem = await Expense.create(safeData);
        res.json(newItem);
    } catch (e) {
        if (e.name === 'SequelizeValidationError') return res.status(400).json({ error: 'Invalid Data' });
        res.status(500).json({ error: 'Server Error' });
    }
});

app.delete('/expenses/:id', verifyToken, async (req, res) => {
    try {
        // Διαγράφουμε μόνο αν το ID ταιριάζει ΚΑΙ αν ανήκει στον χρήστη
        const result = await Expense.destroy({ 
            where: { 
                id: req.params.id,
                UserId: req.user.id // <--- Ασφάλεια
            } 
        });
        if (result === 0) return res.status(404).json({ error: 'Not Found' });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Deletion Failed' }); }
});

// Server Start
app.listen(3000, async () => {
    try {
        await sequelize.authenticate();
        // Το alter: true θα προσθέσει αυτόματα τη στήλη UserId στον πίνακα Expenses
        await sequelize.sync({ alter: true }); 
        console.log('SERVER READY: http://localhost:3000');
    } catch (error) {
        console.error('DB ERROR:', error.message);
    }
});