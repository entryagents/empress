import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { NeonDialect } from "kysely-neon";
import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "";

const db = connectionString
  ? new Kysely({
      dialect: new NeonDialect({
        neon: neon(connectionString),
      }),
    })
  : null;

export const auth = betterAuth({
  ...(db
    ? {
        database: {
          db,
          type: "postgres",
        },
      }
    : {}),
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || "empress-secret-key-fallback-2026-development",
  baseURL: process.env.BETTER_AUTH_URL || "https://empress-rosy.vercel.app",
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      username: {
        type: "string",
        required: false,
        unique: true,
      },
      phone: {
        type: "string",
        required: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      console.log(`[AUTH] Password reset requested for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
});
