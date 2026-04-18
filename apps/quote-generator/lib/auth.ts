import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { headers as nextHeaders } from "next/headers";

import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/schema/auth";

const allowedDomain = (
  process.env.SSO_EMAIL_DOMAIN ?? "noxe.ca"
).toLowerCase();

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
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
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

export async function getSession() {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  return session;
}
