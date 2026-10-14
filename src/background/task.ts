import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import type { NotifySettings } from '../notifications/settings';
import { checkForNewPayments } from './check';

export const TASK_NAME = 'ledgerly-check-payments';

// Must run at app start (it is imported from the root layout) so Android can also run it headless.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await checkForNewPayments();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the periodic check while any notification is switched on, and removes it otherwise. */
export async function syncBackgroundTask(settings: NotifySettings): Promise<void> {
  const wanted = settings.newPayments || settings.dailyReminder;
  if ((await BackgroundTask.getStatusAsync()) === BackgroundTask.BackgroundTaskStatus.Restricted) return;
  const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (wanted && !registered) await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
  if (!wanted && registered) await BackgroundTask.unregisterTaskAsync(TASK_NAME);
}
