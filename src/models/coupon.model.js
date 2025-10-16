import { db } from '../config/db.config.js';
import { ApiError } from '../utils/ApiError.js'; // Import ApiError

export const Coupon = {
  create: async (couponData) => {
    // --- ROBUST VALIDATION ADDED ---
    // This check runs before anything else.
    if (!couponData || !couponData.code) {
      throw new ApiError(400, "Coupon `code` is a required field and was not provided.");
    }

    const { code, discountType, discountValue, expiryDate, usageLimit, createdBy } = couponData;
    
    const query = `
      INSERT INTO coupons (code, discount_type, discount_value, expiry_date, usage_limit, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [code, discountType, discountValue, expiryDate, usageLimit, createdBy];
    
    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
        // This will catch potential unique constraint violations for the code
        if (error.code === '23505') {
            throw new ApiError(409, `A coupon with the code '${code}' already exists.`);
        }
        throw error; // Re-throw other errors
    }
  },

  findById: async (id) => {
    const query = 'SELECT * FROM coupons WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  updateStatus: async (id, status) => {
    const query = 'UPDATE coupons SET status = $1 WHERE id = $2 RETURNING *;';
    const { rows } = await db.query(query, [status, id]); 
    return rows[0];
  },

  findByCode: async (code) => {
    const query = 'SELECT * FROM coupons WHERE code = $1;';
    const { rows } = await db.query(query, [code]);
    return rows[0];
  },
};

