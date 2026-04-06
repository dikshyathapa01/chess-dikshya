import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secretkey';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    SECRET,
    { expiresIn: '1h' }
  );
};
export const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};