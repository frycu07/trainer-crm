const { z } = require("zod");

// params z URL sa zawsze stringami, dlatego coerce
const userIdParams = z.strictObject({
  id: z.coerce.number().int().positive()
});

// strictObject - nieznane pole (np. "isAdmin") to 400, a nie ciche zignorowanie
const createUserBody = z.strictObject({
  email: z.email(),
  // bcrypt bierze pod uwage tylko 72 bajty - dluzsze haslo zostaloby po cichu obciete
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(1).max(100),
  role: z.enum(["ADMIN", "TRAINER"])
});

module.exports = { userIdParams, createUserBody };
