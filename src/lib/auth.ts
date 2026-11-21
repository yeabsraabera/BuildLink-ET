import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const AUTH_COOKIE = "buildlink_token";
const WEEK_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  town: string;
  isAdmin: boolean;
  accountStatus: "active" | "suspended";
};

export type PublicOwner = {
  name: string;
  town: string;
};

type UserLike = {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string | null;
  town: string;
  isAdmin?: boolean;
  accountStatus?: "active" | "suspended";
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function signAuthToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_SECONDS,
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
}

export function toSessionUser(user: UserLike): SessionUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    town: user.town,
    isAdmin: Boolean(user.isAdmin),
    accountStatus: user.accountStatus ?? "active",
  };
}

export function toPublicOwner(user: { name: string; town: string }): PublicOwner {
  return { name: user.name, town: user.town };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return null;
  return toSessionUser(user);
}
