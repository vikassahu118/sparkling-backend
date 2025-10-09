import { db } from '../config/db.config.js';

export const Product = {
  create: async (productData) => {
    const { name, description, price, stockQuantity, imageUrls, category } =
      productData;
    const query = `
      INSERT INTO products (name, description, price, stock_quantity, image_urls, category)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      name,
      description,
      price,
      stockQuantity,
      JSON.stringify(imageUrls), // Assuming imageUrls is an array
      category,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  findAll: async () => {
    const query = 'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC;';
    const { rows } = await db.query(query);
    return rows;
  },

  findById: async (id) => {
    const query = 'SELECT * FROM products WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  update: async (id, updateData) => {
    const { name, description, price, stockQuantity, imageUrls, category, isActive } =
      updateData;
    const query = `
      UPDATE products
      SET 
        name = $1, 
        description = $2, 
        price = $3, 
        stock_quantity = $4, 
        image_urls = $5, 
        category = $6,
        is_active = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
    const values = [
      name,
      description,
      price,
      stockQuantity,
      JSON.stringify(imageUrls),
      category,
      isActive,
      id,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },
  
  // Using a soft delete for data integrity
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