const User = require('../Models/user');
const { setUser } = require('../Services/auth');
const bcrypt = require('bcrypt');
let handleUserSignup = async (req, res) => {
    try {
        const { name, email, password, contact } = req.body;
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserDoc = await User.create({ name, email, password: hashedPassword, contact });
        const token = setUser(newUserDoc);
        res.cookie('_auth_token_pei', token, { httpOnly: true });
        console.log(newUserDoc);
        return res.status(201).json({ message: 'User created successfully', user: newUserDoc });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = { handleUserSignup };