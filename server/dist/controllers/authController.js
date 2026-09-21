import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { createError } from '../middleware/errorHandler.js';
const TOKEN_EXPIRY = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
function generateToken(userId) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}
function setTokenCookie(res, token) {
    res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: COOKIE_MAX_AGE,
    });
}
export async function register(req, res, next) {
    try {
        const { email, password } = req.body;
        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            throw createError(409, 'Email already registered', 'EMAIL_EXISTS');
        }
        // Create user (password hashed by pre-save hook)
        const user = new User({ email, passwordHash: password });
        await user.save();
        // Generate token
        const token = generateToken(user._id.toString());
        setTokenCookie(res, token);
        res.status(201).json({
            user: { id: user._id, email: user.email },
            token,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
        }
        // Generate token
        const token = generateToken(user._id.toString());
        setTokenCookie(res, token);
        res.json({
            user: { id: user._id, email: user.email },
            token,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function logout(_req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
}
export async function me(req, res, next) {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            throw createError(404, 'User not found', 'USER_NOT_FOUND');
        }
        res.json({ user: { id: user._id, email: user.email } });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=authController.js.map