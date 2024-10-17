const User = require('../Models/user');
const { setUser } = require('../Services/auth');
const bcrypt = require('bcrypt');
let handleUserSignup = async (req, res) => {
    try {
        await User.init();
        const { name, email, password, contact } = req.body;
        if (!name || !email || !password || !contact) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserDoc = await User.create({ name, email, password: hashedPassword, contact });
        const token = setUser(newUserDoc);
        res.cookie('_auth_token_pei', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', domain: process.env.HOST_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000
        });
        console.log(newUserDoc);
        return res.status(201).json({ message: 'User created successfully', user: newUserDoc });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

let handleUserLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = setUser(user);

        res.cookie('_auth_token_pei', token, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', domain: process.env.HOST_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const { password: _, ...userData } = user.toObject();
        console.log("Login Successfully");
        return res.status(200).json({ message: 'Login successful', user: userData });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { handleUserSignup, handleUserLogin }; 
