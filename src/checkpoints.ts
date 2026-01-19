import { db, type ProcessingCheckpoint } from './db';

type JobType = ProcessingCheckpoint['jobType'];

/**
 * Load active checkpoint for a specific job type
 * Returns null if no active checkpoint exists
 */
export async function loadCheckpoint(
  jobType: JobType
): Promise<ProcessingCheckpoint | null> {
  const checkpoints = await db.checkpoints
    .where('jobType')
    .equals(jobType)
    .and(checkpoint => checkpoint.status === 'running')
    .toArray();

  // Return the most recent if multiple exist (shouldn't happen)
  if (checkpoints.length > 0) {
    return checkpoints.sort((a, b) => b.startTime - a.startTime)[0];
  }

  return null;
}

/**
 * Save checkpoint state
 * Creates new checkpoint or updates existing one
 */
export async function saveCheckpoint(checkpoint: ProcessingCheckpoint): Promise<void> {
  if (checkpoint.id) {
    // Update existing checkpoint
    await db.checkpoints.update(checkpoint.id, checkpoint);
  } else {
    // Create new checkpoint
    await db.checkpoints.add(checkpoint);
  }
}

/**
 * Clear checkpoint when job is complete
 */
export async function clearCheckpoint(
  jobType: JobType
): Promise<void> {
  // Mark all running checkpoints for this job type as completed
  const checkpoints = await db.checkpoints
    .where('jobType')
    .equals(jobType)
    .toArray();

  for (const checkpoint of checkpoints) {
    if (checkpoint.status === 'running') {
      await db.checkpoints.update(checkpoint.id!, {
        status: 'completed'
      });
    }
  }
}

/**
 * Mark checkpoint as failed
 */
export async function failCheckpoint(
  jobType: JobType,
  error: string
): Promise<void> {
  const checkpoint = await loadCheckpoint(jobType);
  if (checkpoint?.id) {
    await db.checkpoints.update(checkpoint.id, {
      status: 'failed'
    });
    console.error(`Checkpoint ${jobType} failed:`, error);
  }
}

/**
 * Get checkpoint progress as percentage (0-100)
 */
export function getCheckpointProgress(checkpoint: ProcessingCheckpoint): number {
  if (checkpoint.totalItems === 0) return 100;
  return Math.round((checkpoint.processedCount / checkpoint.totalItems) * 100);
}

/**
 * Clean up old completed/failed checkpoints (older than 7 days)
 */
export async function cleanupOldCheckpoints(): Promise<void> {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  const oldCheckpoints = await db.checkpoints
    .filter(checkpoint =>
      checkpoint.startTime < sevenDaysAgo &&
      (checkpoint.status === 'completed' || checkpoint.status === 'failed')
    )
    .toArray();

  for (const checkpoint of oldCheckpoints) {
    if (checkpoint.id) {
      await db.checkpoints.delete(checkpoint.id);
    }
  }

  if (oldCheckpoints.length > 0) {
    console.log(`Cleaned up ${oldCheckpoints.length} old checkpoints`);
  }
}
