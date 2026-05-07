import { supabaseService } from './SupabaseService';
import { logger, logDatabaseOperation } from '../utils/logger';
import type { CheckInInput, CheckInResponse } from '../validators/checkIn';

/**
 * CheckInService - Isolated service for MVP check-in functionality
 * Does NOT depend on existing 50+ services
 * Focuses solely on: save, retrieve, list check-ins
 * Pattern detection happens asynchronously (separate service)
 */

export class CheckInService {
  /**
   * Save a new check-in for a user
   */
  async saveCheckIn(userId: string, data: CheckInInput): Promise<CheckInResponse> {
    const start = Date.now();

    try {
      const client = await supabaseService.getClient();

      const { data: checkIn, error } = await client
        .from('check_ins')
        .insert([
          {
            user_id: userId,
            emotion: data.emotion,
            energy_level: data.energy_level,
            context: data.context || null
          }
        ])
        .select();

      const duration = Date.now() - start;
      logDatabaseOperation('INSERT', 'check_ins', duration, !error);

      if (error) {
        logger.error({ error, userId }, 'Failed to save check-in');
        throw new Error(`Failed to save check-in: ${error.message}`);
      }

      if (!checkIn || checkIn.length === 0) {
        throw new Error('Check-in saved but no data returned');
      }

      return this.mapToResponse(checkIn[0]);
    } catch (error) {
      logger.error({ error, userId }, 'CheckInService.saveCheckIn failed');
      throw error;
    }
  }

  /**
   * Get all check-ins for a user (paginated)
   */
  async getCheckIns(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ data: CheckInResponse[]; total: number }> {
    const start = Date.now();

    try {
      const client = await supabaseService.getClient();

      // Get total count
      const { count, error: countError } = await client
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw new Error(`Failed to count check-ins: ${countError.message}`);
      }

      // Get paginated data
      const { data: checkIns, error } = await client
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const duration = Date.now() - start;
      logDatabaseOperation('SELECT', 'check_ins', duration, !error);

      if (error) {
        logger.error({ error, userId }, 'Failed to retrieve check-ins');
        throw new Error(`Failed to retrieve check-ins: ${error.message}`);
      }

      return {
        data: (checkIns || []).map(ci => this.mapToResponse(ci)),
        total: count || 0
      };
    } catch (error) {
      logger.error({ error, userId }, 'CheckInService.getCheckIns failed');
      throw error;
    }
  }

  /**
   * Get check-ins for a specific date range
   */
  async getCheckInsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CheckInResponse[]> {
    const start = Date.now();

    try {
      const client = await supabaseService.getClient();

      const { data: checkIns, error } = await client
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      const duration = Date.now() - start;
      logDatabaseOperation('SELECT', 'check_ins', duration, !error);

      if (error) {
        throw new Error(`Failed to retrieve check-ins: ${error.message}`);
      }

      return (checkIns || []).map(ci => this.mapToResponse(ci));
    } catch (error) {
      logger.error({ error, userId }, 'CheckInService.getCheckInsInRange failed');
      throw error;
    }
  }

  /**
   * Get check-in count for a user
   */
  async getCheckInCount(userId: string): Promise<number> {
    try {
      const client = await supabaseService.getClient();

      const { count, error } = await client
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to count check-ins: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error({ error, userId }, 'CheckInService.getCheckInCount failed');
      throw error;
    }
  }

  /**
   * Get recent check-ins (last 7 days)
   */
  async getRecentCheckIns(userId: string, days: number = 7): Promise<CheckInResponse[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getCheckInsInRange(userId, startDate, new Date());
  }

  /**
   * Get emotion frequency (for pattern detection prep)
   */
  async getEmotionFrequency(userId: string, days: number = 7) {
    const start = Date.now();

    try {
      const client = await supabaseService.getClient();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: checkIns, error } = await client
        .from('check_ins')
        .select('emotion')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const duration = Date.now() - start;
      logDatabaseOperation('SELECT (frequency)', 'check_ins', duration, !error);

      if (error) {
        throw new Error(`Failed to get emotion frequency: ${error.message}`);
      }

      // Count emotions
      const frequency: Record<string, number> = {};
      (checkIns || []).forEach(ci => {
        frequency[ci.emotion] = (frequency[ci.emotion] || 0) + 1;
      });

      return frequency;
    } catch (error) {
      logger.error({ error, userId }, 'CheckInService.getEmotionFrequency failed');
      throw error;
    }
  }

  /**
   * Helper: Map database row to response type
   */
  private mapToResponse(row: any): CheckInResponse {
    return {
      id: row.id,
      user_id: row.user_id,
      emotion: row.emotion,
      energy_level: row.energy_level,
      context: row.context,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
}

export const checkInService = new CheckInService();
