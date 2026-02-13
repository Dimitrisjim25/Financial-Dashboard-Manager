// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Φέρνουμε το μοντέλο που φτιάξαμε

// ΕΓΓΡΑΦΗ (Register)
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Κρυπτογράφηση κωδικού
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Δημιουργία χρήστη
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.json({ message: "Επιτυχής εγγραφή!", userId: newUser.id });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// ΣΥΝΔΕΣΗ (Login)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Βρες τον χρήστη
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "Λάθος email ή κωδικός" });

        // Έλεγχος κωδικού
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(404).json({ error: "Λάθος email ή κωδικός" });

        // Δημιουργία Token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, username: user.username });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;