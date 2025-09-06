// src/Validators/ProfileValidator.ts
import Joi from "joi";

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
  role: Joi.string().max(50).optional(),
  industry: Joi.string().max(100).optional(),
  areaOfInterest: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
});
