import argon2 from 'argon2';
import { config } from '../config';

const params = () => ({
  type: argon2.argon2id,
  memoryCost: config.argon2.memoryCost,
  timeCost: config.argon2.timeCost,
  parallelism: 1,
});

export const hashPassword = (plain: string): Promise<string> => argon2.hash(plain, params());

/** Never throws on malformed hashes; a bad hash is simply a failed verification. */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// Hash with the SAME parameters as real users so unknown/inactive accounts cost the same time.
const dummyHash: Promise<string> = hashPassword('dummy-password-for-timing-equalisation');
dummyHash.catch(() => undefined); // computed at boot so the first unknown-user login is not slower
export function verifyAgainstDummy(plain: string): Promise<boolean> {
  return dummyHash.then((h) => verifyPassword(h, plain));
}
