import { db } from '../config/db.config.js';

export const Coupon = {
  create: async (couponData) => {
    const { code, discountType, discountValue, expiryDate, usageLimit, createdBy } = couponData;
    const query = `
      INSERT INTO coupons (code, discount_type, discount_value, expiry_date, usage_limit, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [code, discountType, discountValue, expiryDate, usageLimit, createdBy];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  findById: async (id) => {
    const query = 'SELECT * FROM coupons WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  updateStatus: async (id, status) => {
    const query = 'UPDATE coupons SET status = $1 WHERE id = $2 RETURNING *;';
    
    // THE FIX: The parameters were swapped. It should be [status, id].
    const { rows } = await db.query(query, [status, id]); 
    
    return rows[0];
    
},
/**
   * Finds a coupon by its unique code.
   * @param {string} code - The coupon code string.
   * @returns {Promise<object|null>} The coupon object or null if not found.
   */
  findByCode: async (code) => {
    const query = 'SELECT * FROM coupons WHERE code = $1;';
    const { rows } = await db.query(query, [code]);
    return rows[0];
  },
};