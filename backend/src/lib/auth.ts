import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const TOKEN_TTL = '30d';

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (userId: string) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });

export const verifyToken = (token: string): string => {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  return payload.sub as string;
};
