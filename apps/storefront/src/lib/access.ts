import { z } from 'zod';

const accessRequestSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLocaleLowerCase()),
}).strict();

export type AccessRequest = z.infer<typeof accessRequestSchema>;

export function parseAccessRequest(input: unknown): AccessRequest | null {
  const result = accessRequestSchema.safeParse(input);
  return result.success ? result.data : null;
}
