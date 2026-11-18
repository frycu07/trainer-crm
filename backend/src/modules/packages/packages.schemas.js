const { z } = require("zod");

// params z URL sa zawsze stringami, dlatego coerce
const packageIdParams = z.strictObject({
  id: z.coerce.number().int().positive()
});

// clientId jest wymagane - pakiety zawsze oglada sie w kontekscie klienta
const listPackagesQuery = z.strictObject({
  clientId: z.coerce.number().int().positive()
});

const packageFields = {
  name: z.string().trim().min(1).max(100),
  totalSessions: z.number().int().min(1).max(100),
  price: z.number().min(0).max(99999999),
  validUntil: z.iso.date()
};

const createPackageBody = z.strictObject({
  clientId: z.number().int().positive(),
  ...packageFields
});

// PUT nie zmienia klienta, do ktorego nalezy pakiet
const updatePackageBody = z.strictObject(packageFields);

module.exports = { packageIdParams, listPackagesQuery, createPackageBody, updatePackageBody };
