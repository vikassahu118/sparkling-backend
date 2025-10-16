import { db } from '../config/db.config.js';

export const Product = {
  /**
   * Creates a new base product and its variants in a single transaction.
   * @param {object} productData - Contains base product info and an array of variants.
   * @returns {Promise<object>} The newly created product with its variants.
   */
  create: async (productData) => {
    const { name, description, original_price, discounted_price, category, variants } = productData;

    try {
      await db.query('BEGIN'); // Start transaction

      // 1. Insert the base product
      const productQuery = `
        INSERT INTO products (name, description, original_price, discounted_price, category)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const productResult = await db.query(productQuery, [name, description, original_price, discounted_price, category]);
      const productId = productResult.rows[0].id;

      // 2. Insert each variant associated with the new product
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const { colorId, sizeId, stockQuantity, imageUrls } = variant;
          const variantQuery = `
            INSERT INTO product_variants (product_id, color_id, size_id, stock_quantity, image_urls)
            VALUES ($1, $2, $3, $4, $5);
          `;
          await db.query(variantQuery, [productId, colorId, sizeId, stockQuantity, JSON.stringify(imageUrls || [])]);
        }
      }

      await db.query('COMMIT'); // Commit transaction

      // Return the newly created product ID for confirmation
      return { id: productId, ...productData };
    } catch (error) {
      await db.query('ROLLBACK'); // Rollback on error
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * Finds all active products and includes a summary of their variants.
   * @returns {Promise<Array>} A list of products.
   */
  findAll: async () => {
    const query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.original_price,
        p.discounted_price,
        p.category,
        (
          SELECT json_agg(json_build_object('color', c.name, 'image', pv.image_urls ->> 0))
          FROM product_variants pv
          JOIN colors c ON pv.color_id = c.id
          WHERE pv.product_id = p.id
        ) as available_colors
      FROM products p
      WHERE p.is_active = true
      ORDER BY p.created_at DESC;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  /**
   * Finds a single product by its ID and aggregates all its variants, colors, and sizes.
   * @param {number} id - The ID of the product.
   * @returns {Promise<object|null>} The product object with nested variants.
   */
  findById: async (id) => {
    const query = `
      SELECT
        p.id,
        p.name,
        p.description,
        p.original_price,
        p.discounted_price,
        p.category,
        p.created_at,
        p.updated_at,
        COALESCE(
          (SELECT
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'variantId', pv.id,
                'color', c.name,
                'size', s.age_range,
                'stock', pv.stock_quantity,
                'images', pv.image_urls
              )
            )
          FROM product_variants pv
          JOIN colors c ON pv.color_id = c.id
          JOIN sizes s ON pv.size_id = s.id
          WHERE pv.product_id = p.id),
        '[]'::json
        ) AS variants
      FROM products p
      WHERE p.id = $1 AND p.is_active = true;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Updates a base product's details.
   * Note: Updating variants would require a separate, more complex logic.
   * @param {number} id - The product ID.
   * @param {object} updateData - The data to update.
   * @returns {Promise<object>} The updated product.
   */
  update: async (id, updateData) => {
    const { name, description, original_price, discounted_price, category, is_active } = updateData;
    const query = `
      UPDATE products
      SET 
        name = $1, 
        description = $2, 
        original_price = $3, 
        discounted_price = $4,
        category = $5,
        is_active = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;
    const values = [name, description, original_price, discounted_price, category, is_active, id];
    const { rows } = await db.query(query, values);
    return rows[0];
  },
  
  /**
   * Deactivates a product (soft delete).
   * @param {number} id - The product ID.
   * @returns {Promise<object>} The deactivated product.
   */
  deactivate: async (id) => {
    const query = `
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },
};
