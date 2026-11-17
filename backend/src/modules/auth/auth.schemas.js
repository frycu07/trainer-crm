const { z } = require("zod");

// przy logowaniu bez reguly dlugosci hasla - zle haslo ma dac 401, a nie 400
const loginBody = z.strictObject({
  email: z.email(),
  password: z.string().min(1)
});

module.exports = { loginBody };
