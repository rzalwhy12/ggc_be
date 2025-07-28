const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// Register
const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
        });

        // Don't return password in response
        const { password: _, ...userData } = user;
        res.status(201).json(userData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Login attempt:', { email, password }); // Debug log
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        console.log('User found:', user.email); // Debug log
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid); // Debug log
        
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const { password: _, ...userData } = user;
        res.status(200).json(userData);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

module.exports = {
    register,
    login,
};
