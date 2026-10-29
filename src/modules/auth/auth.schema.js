const { z } = require('zod');

const register = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72), // bcrypt hanya memproses maksimal 72 byte
});

const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

module.exports = { register, login };
