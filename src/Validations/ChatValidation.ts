import Joi, { ObjectSchema, ValidationResult } from "joi";

// ------------------ Chat Schema ------------------
const chatSchema: ObjectSchema = Joi.object({
  // userId: Joi.string().required(),
  botId: Joi.string().optional(),
  threadId: Joi.string().required(),
  mode: Joi.string().required(),
  responseType: Joi.object().required(),

  avatar: Joi.string().allow("").optional(),
  question: Joi.string().allow("").optional(),
  answer: Joi.string().allow("").optional(),
  regenerate: Joi.boolean().optional().default(false),
  is_scratchpad: Joi.boolean().optional().default(false),

  isModel: Joi.string().allow("").optional(),
  scriptPreference: Joi.string().allow("").optional(),
  language: Joi.string().allow("").optional(),
});

// ------------------ Comment Schema ------------------
const commentSchema: ObjectSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.base": "Message ID must be a string.",
    "any.required": "Message ID is required.",
  }),
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string.",
    "any.required": "User ID is required.",
  }),
  comment: Joi.string().min(1).max(500).required().messages({
    "string.base": "Comment must be a string.",
    "string.empty": "Comment cannot be empty.",
    "string.min": "Comment must be at least 1 character long.",
    "string.max": "Comment cannot exceed 500 characters.",
    "any.required": "Comment is required.",
  }),
  mode: Joi.string().required().messages({
    "string.base": "Mode must be a string.",
    "any.required": "Mode is required.",
  }),
});

// ------------------ Vote Schema ------------------
const voteSchema: ObjectSchema = Joi.object({
  messageId: Joi.string().required().messages({
    "string.base": "Message ID must be a string.",
    "any.required": "Message ID is required.",
  }),
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string.",
    "any.required": "User ID is required.",
  }),
  action: Joi.string().valid("upvote", "downvote").required().messages({
    "any.only": "Action must be either 'upvote' or 'downvote'.",
    "any.required": "Action is required.",
  }),
  mode: Joi.string().required().messages({
    "string.base": "Mode must be a string.",
    "any.required": "Mode is required.",
  }),
});

// ------------------ Update CSSRS Schema ------------------
const updateCssrsSchema: ObjectSchema = Joi.object({
  cssrsId: Joi.string().required().messages({
    "string.base": "CSSRS ID must be a string.",
    "any.required": "CSSRS ID is required.",
  }),
  responseType: Joi.object().messages({
    "object.base": "Response Type must be an object.",
    "any.required": "Response Type is required.",
  }),
  threadId: Joi.string().required().messages({
    "string.base": "Thread ID must be a string.",
    "any.required": "Thread ID is required.",
  }),
  mode: Joi.string().required().messages({
    "string.base": "Mode must be a string.",
    "any.required": "Mode is required.",
  }),
});

// ------------------ Create Title Schema ------------------
const createTitleSchema: ObjectSchema = Joi.object({
  //   userId: Joi.string().required(),
  title: Joi.string().min(1).required(),
  category: Joi.string().optional(),
  mode: Joi.string().required().messages({
    "string.base": "Mode must be a string.",
    "any.required": "Mode is required.",
  }),
});

// ------------------ Validator Functions ------------------
export const validateChatRequest = (data: unknown): ValidationResult =>
  chatSchema.validate(data, { abortEarly: false });

export const validateCreateTitle = (data: unknown): ValidationResult =>
  createTitleSchema.validate(data, { abortEarly: false });

export const validateCommentRequest = (data: unknown): ValidationResult =>
  commentSchema.validate(data, { abortEarly: false });

export const validateVoteRequest = (data: unknown): ValidationResult =>
  voteSchema.validate(data, { abortEarly: false });

export const validateUpdateCssrs = (data: unknown): ValidationResult =>
  updateCssrsSchema.validate(data, { abortEarly: false });
