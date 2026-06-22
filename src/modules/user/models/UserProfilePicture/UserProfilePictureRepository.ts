import { pool } from "../../../../shared/config/db";
import logger from "../../../../shared/utils/logger";

export class UserProfilePictureRepository {
  static async saveProfilePicture(userId: string, url: string, publicId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Mark all other pictures as inactive
      await client.query(
        'UPDATE user_profile_pictures SET is_active = false WHERE user_id = $1',
        [userId]
      );
      
      // Insert the new picture as active
      const insertQuery = `
        INSERT INTO user_profile_pictures (user_id, url, public_id, is_active)
        VALUES ($1, $2, $3, true)
        RETURNING *
      `;
      const res = await client.query(insertQuery, [userId, url, publicId]);
      
      // Update user avatar
      await client.query(
        'UPDATE users SET avatar = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId, url]
      );
      
      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error saving profile picture in repository', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  static async getProfilePictures(userId: string) {
    try {
      const query = `
        SELECT * FROM user_profile_pictures 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching profile pictures', { error, userId });
      throw error;
    }
  }

  static async selectProfilePicture(userId: string, pictureId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the picture first to make sure it exists and belongs to the user
      const findRes = await client.query(
        'SELECT * FROM user_profile_pictures WHERE id = $1 AND user_id = $2',
        [pictureId, userId]
      );

      if (findRes.rows.length === 0) {
        throw new Error('Profile picture not found');
      }

      const picture = findRes.rows[0];

      // Mark all other pictures as inactive
      await client.query(
        'UPDATE user_profile_pictures SET is_active = false WHERE user_id = $1',
        [userId]
      );

      // Mark selected picture as active
      await client.query(
        'UPDATE user_profile_pictures SET is_active = true WHERE id = $1',
        [pictureId]
      );

      // Update user avatar
      await client.query(
        'UPDATE users SET avatar = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId, picture.url]
      );

      await client.query('COMMIT');
      return picture;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error selecting profile picture', { error, userId, pictureId });
      throw error;
    } finally {
      client.release();
    }
  }
}
