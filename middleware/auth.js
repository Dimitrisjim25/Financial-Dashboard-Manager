const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Παίρνουμε το token από τα Headers
    const token = req.header('Authorization');

    // 2. Αν δεν υπάρχει token -> STOP
    if (!token) {
        return res.status(401).json({ error: 'Δεν υπάρχει πρόσβαση. Λείπει το Token.' });
    }

    try {
        // 3. Έλεγχος γνησιότητας
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next(); // Όλα καλά, προχώρα
    } catch (err) {
        res.status(400).json({ error: 'Μη έγκυρο Token.' });
    }
};