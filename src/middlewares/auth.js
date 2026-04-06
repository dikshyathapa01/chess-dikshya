import { verifyToken } from '../utils/json.js';
import { prisma } from '../utils/prisma-client.js';

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    delete user.password;
    req.user = user;
    next();
  } catch (error) {
    console.log('Auth error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export { auth };