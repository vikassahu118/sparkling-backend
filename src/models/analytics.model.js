import { db } from '../config/db.config.js';

export const Analytics = {
  /**
   * Fetches key performance indicators for the dashboard.
   * This function runs multiple aggregation queries in a single transaction
   * to ensure data consistency.
   * @returns {Promise<object>} An object containing dashboard metrics.
   */
  getDashboardAnalytics: async () => {
    try {
      // Start a transaction to get a consistent snapshot of the data
      await db.query('BEGIN');

      // Query 1: Calculate Total Revenue and Total Orders
      const salesQuery = `
        SELECT
          SUM(total_amount) as total_revenue,
          COUNT(id) as total_orders
        FROM orders
        WHERE status IN ('Delivered', 'Returned', 'Refunded');
      `;
      const salesResult = await db.query(salesQuery);
      
      // Query 2: Get a count of all customers
      const customerQuery = `SELECT COUNT(id) as total_customers FROM users WHERE role_id = 5;`;
      const customerResult = await db.query(customerQuery);
      
      // Query 3: Find the top 5 best-selling products by quantity sold
      // CORRECTED QUERY: Joins through product_variants to get product details.
      const topProductsQuery = `
        SELECT
          p.id,
          p.name,
          SUM(oi.quantity) as total_quantity_sold
        FROM order_items oi
        JOIN product_variants pv ON oi.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY total_quantity_sold DESC
        LIMIT 5;
      `;
      const topProductsResult = await db.query(topProductsQuery);

      // We're done with our queries, so we can end the transaction
      await db.query('COMMIT');

      // Format the results into a clean object
      return {
        total_revenue: parseFloat(salesResult.rows[0].total_revenue || 0).toFixed(2),
        total_orders: parseInt(salesResult.rows[0].total_orders || 0),
        total_customers: parseInt(customerResult.rows[0].total_customers || 0),
        top_selling_products: topProductsResult.rows,
      };

    } catch (error) {
      // If any query fails, roll back the transaction
      await db.query('ROLLBACK');
      throw error;
    }
  },
};
