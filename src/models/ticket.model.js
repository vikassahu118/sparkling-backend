import { db } from '../config/db.config.js';

export const Ticket = {
  /**
   * Creates a new ticket in the database.
   * @param {object} ticketData - The data for the new ticket.
   * @returns {Promise<object>} The newly created ticket object.
   */
  create: async (ticketData) => {
    const { ticketType, details, createdById } = ticketData;
    const query = `
      INSERT INTO tickets (ticket_type, details, created_by_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [ticketType, JSON.stringify(details), createdById];
    const { rows } = await db.query(query, values);
    return rows[0];
  },
  
  /**
   * Finds all open tickets, regardless of type. Primarily for Admins.
   * @returns {Promise<Array>} A list of all open tickets.
   */
  findOpen: async () => {
    const query = `
      SELECT t.*, u.email as created_by_email 
      FROM tickets t
      JOIN users u ON t.created_by_id = u.id
      WHERE t.status = 'Open' 
      ORDER BY t.created_at ASC;
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  /**
   * Finds all open tickets of a specific type.
   * @param {string} ticketType - The type of ticket to find (e.g., 'Refund Request').
   * @returns {Promise<Array>} A list of tickets.
   */
  findOpenByType: async (ticketType) => {
    const query = `
      SELECT t.*, u.email as created_by_email 
      FROM tickets t
      JOIN users u ON t.created_by_id = u.id
      WHERE t.status = 'Open' AND t.ticket_type = $1
      ORDER BY t.created_at ASC;
    `;
    const { rows } = await db.query(query, [ticketType]);
    return rows;
  },

  /**
   * Finds a single ticket by its ID.
   * @param {number} id - The ID of the ticket.
   * @returns {Promise<object|null>} The ticket object or null if not found.
   */
  findById: async (id) => {
    const query = 'SELECT * FROM tickets WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Updates the status of a ticket and records who resolved it.
   * @param {number} id - The ID of the ticket to update.
   * @param {string} status - The new status (e.g., 'Approved', 'Denied').
   * @param {string} resolvedById - The UUID of the user who resolved the ticket.
   * @returns {Promise<object>} The updated ticket object.
   */
  updateStatus: async (id, status, resolvedById) => {
    const query = `
      UPDATE tickets 
      SET status = $1, assigned_to_id = $2, resolved_at = NOW() 
      WHERE id = $3 
      RETURNING *;
    `;
    const { rows } = await db.query(query, [status, resolvedById, id]);
    return rows[0];
  },
};

