import { prisma } from '../utils/prisma-client.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/json.js';

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const { password: _password, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getOneUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Get one user error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deletedUser = await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: 'User deleted', deletedUser });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(404).json({ error: 'User not found' });
  }
};