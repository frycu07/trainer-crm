const { z } = require("zod");

// params z URL sa zawsze stringami, dlatego coerce
const clientIdParams = z.strictObject({
  id: z.coerce.number().int().positive()
});

// strictObject - nieznane pole (np. trainerId) to 400; trainerId zawsze bierzemy z tokenu
const clientBody = z.strictObject({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.email().max(255).optional(),
  phone: z.string().trim().max(20).optional(),
  goal: z.string().trim().max(500).optional()
});

const listClientsQuery = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  q: z.string().trim().max(100).optional()
});

module.exports = { clientIdParams, clientBody, listClientsQuery };
