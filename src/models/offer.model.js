import { db } from '../config/db.config.js';

export const Offer = {
  /**
   * Finds the currently active site-wide offer.
   * @returns {Promise<object|null>} The active offer object.
   */
  findActive: async () => {
    const query = `
      SELECT description, updated_at 
      FROM site_offers 
      WHERE is_active = TRUE 
      ORDER BY updated_at DESC 
      LIMIT 1;
    `;
    const { rows } = await db.query(query);
    return rows[0];
  },

  /**
   * Sets or updates the site-wide offer. This is an "upsert" operation.
   * It deactivates old offers and creates a new active one.
   * @param {string} description - The new offer text.
   * @returns {Promise<object>} The newly created offer object.
   */
  set: async (description) => {
    try {
      await db.query('BEGIN');
      // Deactivate all current offers
      await db.query('UPDATE site_offers SET is_active = FALSE;');
      // Insert the new active offer
      const query = `
        INSERT INTO site_offers (description, is_active) 
        VALUES ($1, TRUE) 
        RETURNING *;
      `;
      const { rows } = await db.query(query, [description]);
      await db.query('COMMIT');
      return rows[0];
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },
};

