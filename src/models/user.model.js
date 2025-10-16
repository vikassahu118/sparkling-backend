import { db } from '../config/db.config.js';
import { hashPassword } from '../utils/password.utils.js';

export const User = {
  /**
   * Creates a new user with a default 'Customer' role. Used for public registration.
   */
  create: async (userData) => {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      age,
      gender,
      roleName = 'Customer', // Default role
    } = userData;

    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO users (first_name, last_name, email, mobile_number, password_hash, age, gender, role_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM roles WHERE name = $8))
      RETURNING id, first_name, last_name, email, mobile_number, age, gender, role_id, created_at;
    `;

    const values = [
      firstName,
      lastName,
      email,
      mobile,
      hashedPassword,
      age,
      gender,
      roleName,
    ];

    try {
      const { rows } = await db.query(query, values);
      return rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('User with this email or mobile number already exists.');
      }
      throw error;
    }
  },

  /**
   * Creates a new user with a specified role. Used by Admins.
   */
  createByAdmin: async (userData) => {
    const { firstName, lastName, email, mobile, password, roleId } = userData;
    const hashedPassword = await hashPassword(password);

    const query = `
      INSERT INTO users (first_name, last_name, email, mobile_number, password_hash, role_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, role_id;
    `;
    const values = [firstName, lastName, email, mobile, hashedPassword, roleId];
    
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Finds a user by their email or mobile number, including their role name.
   */
  findByEmailOrMobile: async (email, mobile) => {
    const query = `
      SELECT u.*, r.name as role_name 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 OR u.mobile_number = $2;
    `;
    const { rows } = await db.query(query, [email, mobile]);
    return rows[0];
  },

  /**
   * Finds a user by their ID, including their role name.
   */
  findById: async (id) => {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.mobile_number, u.age, u.gender, u.role_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * --- NEW FUNCTION ---
   * Finds all users who have a specific role.
   * @param {string} roleName - The name of the role to filter by.
   * @returns {Promise<Array>} A list of users with that role.
   */
  findUsersByRole: async (roleName) => {
    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.mobile_number, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = $1
      ORDER BY u.created_at DESC;
    `;
    const { rows } = await db.query(query, [roleName]);
    return rows;
  },
  
/**
   * --- NEW FUNCTION ---
   * Deletes a user by their ID.
   * Prevents deletion if the user is the last remaining admin.
   * @param {string} userId - The UUID of the user to delete.
   * @returns {Promise<object|null>} The deleted user object or an error indicator.
   */
  deleteById: async (userId) => {
    // Safety check: Prevent deleting the last admin
    const adminCheckQuery = `SELECT COUNT(*) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Admin');`;
    const userRoleQuery = `SELECT role_id FROM users WHERE id = $1;`;

    const { rows: adminCountRows } = await db.query(adminCheckQuery);
    const { rows: userRoleRows } = await db.query(userRoleQuery, [userId]);

    // Assuming role_id 1 from your database setup is 'Admin'
    const isAdmin = userRoleRows.length > 0 && userRoleRows[0].role_id === 1; 
    const adminCount = parseInt(adminCountRows[0].count, 10);

    if (isAdmin && adminCount <= 1) {
      return { error: 'Cannot delete the last admin user.' };
    }
    
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, email;`;
    const { rows } = await db.query(query, [userId]);
    return rows[0];
  },
  /**
   * Updates a user's role. Used by Admins.
   */
  updateRole: async (userId, roleId) => {
    const query = `
      UPDATE users 
      SET role_id = $1 
      WHERE id = $2 
      RETURNING id, email, role_id;
    `;
    const { rows } = await db.query(query, [roleId, userId]);
    return rows[0];
  },

  /**
   * Adds a new address for a user.
   */
  addAddress: async (userId, addressData) => {
    const { addressLine1, addressLine2, city, state, postalCode, country, addressType } = addressData;
    const query = `
      INSERT INTO addresses (user_id, address_line_1, address_line_2, city, state, postal_code, country, address_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [userId, addressLine1, addressLine2, city, state, postalCode, country, addressType];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Finds all addresses belonging to a specific user.
   */
  findAddressesByUserId: async (userId) => {
    const query = 'SELECT * FROM addresses WHERE user_id = $1;';
    const { rows } = await db.query(query, [userId]);
    return rows;
  },
};
