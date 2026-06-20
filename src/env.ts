import {createEnv} from '@t3-oss/env-nextjs';
import {z} from 'zod';

const azureThreshold = z.enum(['0', '2', '4', '6']).transform(Number);

export const env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().url().default('postgres://postgres:hackme@localhost:5432/opengifame'),
    DB_SSL: z.string().optional(),

    // NextAuth
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),

    // OAuth providers (all optional — unused providers are simply skipped)
    GITHUB_CLIENT_ID:     z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID:     z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID:   z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),

    // Content moderation
    GOOGLE_VISION_API_KEY:          z.string().optional(),
    AZURE_CONTENT_SAFETY_ENDPOINT:  z.string().url().optional(),
    AZURE_CONTENT_SAFETY_KEY:       z.string().optional(),

    // Moderation thresholds — Azure severity: 0=block all, 2=low+, 4=medium+, 6=high only
    MODERATION_THRESHOLD_SEXUAL:   azureThreshold.default(2),
    MODERATION_THRESHOLD_VIOLENCE: azureThreshold.default(4),
    MODERATION_THRESHOLD_HATE:     azureThreshold.default(4),
    MODERATION_THRESHOLD_SELFHARM: azureThreshold.default(4),
  },

  client: {
    NEXT_PUBLIC_GIF_MAX_DURATION: z.coerce.number().positive().default(30),
  },

  runtimeEnv: {
    DATABASE_URL:               process.env.DATABASE_URL,
    DB_SSL:                     process.env.DB_SSL,
    NEXTAUTH_SECRET:            process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:               process.env.NEXTAUTH_URL,
    GITHUB_CLIENT_ID:           process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET:       process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID:           process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:       process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_CLIENT_ID:         process.env.FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET:     process.env.FACEBOOK_CLIENT_SECRET,
    GOOGLE_VISION_API_KEY:      process.env.GOOGLE_VISION_API_KEY,
    AZURE_CONTENT_SAFETY_ENDPOINT: process.env.AZURE_CONTENT_SAFETY_ENDPOINT,
    AZURE_CONTENT_SAFETY_KEY:   process.env.AZURE_CONTENT_SAFETY_KEY,
    MODERATION_THRESHOLD_SEXUAL:   process.env.MODERATION_THRESHOLD_SEXUAL,
    MODERATION_THRESHOLD_VIOLENCE: process.env.MODERATION_THRESHOLD_VIOLENCE,
    MODERATION_THRESHOLD_HATE:     process.env.MODERATION_THRESHOLD_HATE,
    MODERATION_THRESHOLD_SELFHARM: process.env.MODERATION_THRESHOLD_SELFHARM,
    NEXT_PUBLIC_GIF_MAX_DURATION:  process.env.NEXT_PUBLIC_GIF_MAX_DURATION,
  },
});
