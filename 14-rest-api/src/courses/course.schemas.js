// Validation with Zod: one schema = runtime checks + parsing/coercion + (in TS) types.
import { z } from 'zod';

export const courseInput = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  durationHours: z.number().int().positive().max(500),
  price: z.number().nonnegative(),
}).strict();   // unknown fields (like "id") are rejected, not silently accepted

export const coursePatch = courseInput.partial().refine((o) => Object.keys(o).length > 0, {
  message: 'Send at least one field to update',
});

// Query strings are always strings: coerce "2" -> 2, apply defaults and limits
export const listQuery = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['title', 'price', 'durationHours', '-title', '-price', '-durationHours']).default('title'),
});

export const idParams = z.object({ id: z.coerce.number().int().positive() });
