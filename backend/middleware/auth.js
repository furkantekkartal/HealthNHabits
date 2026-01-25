const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nutrition_tracker_secret_key_change_in_production';

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
module.exports.JWT_SECRET = JWT_SECRET;
