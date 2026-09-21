export interface AuthContext {
  userId: string;
  familyId: string;
  roles: string[];
  permissions: Set<string>;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
