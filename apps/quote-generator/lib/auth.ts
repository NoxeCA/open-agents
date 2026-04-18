import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { headers as nextHeaders } from "next/headers";

import { db } from "@/lib/db";
import {
  DEFAULT_LOCAL_APP_URL,
  DEV_AUTH_USER_EMAIL,
  DEV_AUTH_USER_ID,
  DEV_AUTH_USER_NAME,
  isDevAuthBypassed,
} from "@/lib/dev-auth";
import * as authSchema from "@/lib/db/schema/auth";

const allowedDomain = (
  process.env.SSO_EMAIL_DOMAIN ?? "noxe.ca"
).toLowerCase();
const isDevBypassEnabled = isDevAuthBypassed();
const authBaseUrl = process.env.BETTER_AUTH_URL ?? DEFAULT_LOCAL_APP_URL;
const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  (isDevBypassEnabled ? "dev-skip-auth-secret" : undefined);
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

if (!authSecret) {
  throw new Error(
    "BETTER_AUTH_SECRET is required unless DEV_SKIP_AUTH=true outside production.",
  );
}

if (!isDevBypassEnabled && (!microsoftClientId || !microsoftClientSecret)) {
  throw new Error(
    "MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are required unless DEV_SKIP_AUTH=true outside production.",
  );
}

function assertAllowedEmail(email: string | undefined | null) {
  const suffix = `@${allowedDomain}`;
  if (!email || !email.toLowerCase().endsWith(suffix)) {
    throw new APIError("FORBIDDEN", {
      message: `Email domain must be ${allowedDomain}`,
    });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  secret: authSecret,
  baseURL: authBaseUrl,
  socialProviders: isDevBypassEnabled
    ? {}
    : {
        microsoft: {
          clientId: microsoftClientId!,
          clientSecret: microsoftClientSecret!,
          tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
        },
      },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          assertAllowedEmail(user.email);
          return { data: user };
        },
      },
      update: {
        before: async (user) => {
          if (typeof user.email === "string") {
            assertAllowedEmail(user.email);
          }
          return { data: user };
        },
      },
    },
  },
});

type AppSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

async function ensureDevUser() {
  await db
    .insert(authSchema.user)
    .values({
      id: DEV_AUTH_USER_ID,
      email: DEV_AUTH_USER_EMAIL,
      emailVerified: true,
      name: DEV_AUTH_USER_NAME,
    })
    .onConflictDoUpdate({
      target: authSchema.user.id,
      set: {
        email: DEV_AUTH_USER_EMAIL,
        emailVerified: true,
        name: DEV_AUTH_USER_NAME,
        updatedAt: new Date(),
      },
    });
}

function createDevSession(): AppSession {
  const now = new Date();

  return {
    session: {
      id: "dev-local-session",
      userId: DEV_AUTH_USER_ID,
      token: "dev-local-session-token",
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      ipAddress: "127.0.0.1",
      userAgent: "dev-auth-bypass",
    },
    user: {
      id: DEV_AUTH_USER_ID,
      email: DEV_AUTH_USER_EMAIL,
      emailVerified: true,
      name: DEV_AUTH_USER_NAME,
      image: null,
      createdAt: now,
      updatedAt: now,
    },
  } as AppSession;
}

export async function getSession() {
  if (isDevBypassEnabled) {
    await ensureDevUser();
    return createDevSession();
  }

  const session = await auth.api.getSession({ headers: await nextHeaders() });
  return session;
}
