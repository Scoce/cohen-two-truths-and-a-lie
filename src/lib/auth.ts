import { SignJWT, jwtVerify } from 'jose';

function getKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

export async function signJWT(payload: { userId: number; username: string }): Promise<string> {
  const key = getKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setIssuer('two-truths-and-a-lie')
    .setAudience('two-truths-and-a-lie')
    .sign(key);
}

export async function verifyJWT(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const key = getKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      issuer: 'two-truths-and-a-lie',
      audience: 'two-truths-and-a-lie',
    });
    return payload as { userId: number; username: string };
  } catch {
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
  } catch {
    return null;
  }
}
