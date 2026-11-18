const { z } = require("zod");

// params z URL sa zawsze stringami, dlatego coerce
const sessionIdParams = z.strictObject({
  id: z.coerce.number().int().positive()
});

// startsAt jako ISO z offsetem, np. 2026-12-01T10:00:00+01:00 albo ...Z
// "czas w przyszlosci" to regula biznesowa (R3), sprawdza ja service, bo potrzebuje now()
const createSessionBody = z.strictObject({
  clientId: z.number().int().positive(),
  startsAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(180),
  notes: z.string().trim().max(1000).optional()
});

const updateNotesBody = z.strictObject({
  notes: z.string().trim().max(1000)
});

const listSessionsQuery = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional()
});

module.exports = { sessionIdParams, createSessionBody, updateNotesBody, listSessionsQuery };
