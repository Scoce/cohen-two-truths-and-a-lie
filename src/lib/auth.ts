import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-fallback-secret-for-two-truths-and-a-lie';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: { userId: number; username: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyJWT(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as { userId: number; username: string };
  } catch (err) {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<{ userId: number; username: string } | null> {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const parts = c.split('=');
        return [parts[0].trim(), parts.slice(1).join('=')];
      })
    );
    const token = cookies['session'];
    if (!token) return null;
    return await verifyJWT(token);
  } catch (err) {
    return null;
  }
}
