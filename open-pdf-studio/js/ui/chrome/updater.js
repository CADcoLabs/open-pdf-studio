/**
 * Auto-Update Module
 * Uses Tauri Plugin Updater to check for and install updates.
 */

import { isTauri } from '../../core/platform.js';
import { check } from '@tauri-apps/plugin-updater';
import { openDialog } from '../../bridge.js';

let checking = false;

/**
 * Auto-update is disabled in the MAPI fork.
 *
 * This build is a detached internal fork. The upstream release channel is not
 * ours and would replace this build (and its MAPI customizations) with the
 * upstream application. There is no MAPI release channel yet, so update checks
 * are hard-disabled here rather than relying on the endpoint in
 * src-tauri/tauri.conf.json alone.
 *
 * To re-enable: set this to false and point the updater endpoint in
 * tauri.conf.json at a MAPI-controlled latest.json signed with a MAPI key.
 */
const UPDATES_DISABLED = true;

/**
 * Check for updates using the Tauri updater plugin.
 * @param {boolean} silent - If true, don't show "no update" or error messages
 */
export async function checkForUpdates(silent = true) {
  if (UPDATES_DISABLED) {
    if (!silent) showNoUpdateMessage();
    return;
  }
  if (!isTauri() || checking) return;
  checking = true;

  try {
    const update = await check();

    if (update) {
      const skipVersion = localStorage.getItem('openpdfstudio-skip-version');
      if (silent && skipVersion === update.version) {
        return;
      }
      openDialog('update', { update });
    } else {
      if (!silent) showNoUpdateMessage();
    }
  } catch (e) {
    console.warn('Update check failed:', e);
    if (!silent) showUpdateError(e);
  } finally {
    checking = false;
  }
}

function showNoUpdateMessage() {
  if (window.__TAURI__?.dialog?.message) {
    window.__TAURI__.dialog.message(
      'You are running the latest version of Open PDF Studio.',
      { title: 'Software Update', kind: 'info' }
    );
  }
}

function showUpdateError(error) {
  if (window.__TAURI__?.dialog?.message) {
    window.__TAURI__.dialog.message(
      'Could not check for updates. Please try again later.\n\n' + (error.message || error),
      { title: 'Update Error', kind: 'error' }
    );
  }
}
