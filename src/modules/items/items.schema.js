const{z}=require('zod');

const INT_MAX=2147483647;

const itemBody = z.object({
    name:z.string().trim().min(1).max(150),
    description: z.string().trim().max(2000).default(''),
    stock: z.number().int().min(0, 'stock tidak boleh negatif').max(INT_MAX),
    price: z.number().min(0, 'Harga tidak boleh negatif').max(9999999999.99), 
});

const idParam = z.object({
    id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(100).optional(), 
});

const decreaseBody = z.object({
    quantity: z.number().int().min(1).max(INT_MAX),
});

module.exports = { itemBody, idParam, listQuery, decreaseBody };