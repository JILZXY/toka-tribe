import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  MONGODB_URI: Joi.string().required().messages({
    'any.required': 'MONGODB_URI es obligatorio para conectar a la base de datos.',
  }),

  // JWT
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET debe tener al menos 32 caracteres.',
    'any.required': 'JWT_SECRET es obligatorio.',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Toka
  TOKA_BASE_URL: Joi.string().uri().required(),
  TOKA_APP_ID: Joi.string().length(16).required().messages({
    'string.length': 'TOKA_APP_ID debe tener exactamente 16 caracteres (ver Miniprogram Platform).',
    'any.required': 'TOKA_APP_ID es obligatorio.',
  }),
  ALIPAY_MERCHANT_CODE: Joi.string().length(5).required().messages({
    'string.length': 'ALIPAY_MERCHANT_CODE debe tener exactamente 5 caracteres.',
    'any.required': 'ALIPAY_MERCHANT_CODE es obligatorio para pagos.',
  }),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Redis Cache (opcional). Si no se proporciona, se usará cache en memoria del proceso.
  REDIS_URL: Joi.string().optional().allow(''),
  CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(30),
  LEADERBOARD_CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(20),
});
