const { z } = require("zod");

// params z URL sa zawsze stringami, dlatego coerce
const notificationIdParams = z.strictObject({
  id: z.coerce.number().int().positive()
});

module.exports = { notificationIdParams };
