/**
 * Shared profile persistence helpers for frontend pages.
 * This file centralises localStorage access for profile data.
 */
function loadProfileData() {
  try {
    return JSON.parse(localStorage.getItem('profileData') || '{}');
  } catch (err) {
    console.warn('Unable to parse profileData from localStorage:', err);
    return {};
  }
}

function saveProfileData(profile) {
  localStorage.setItem('profileData', JSON.stringify(profile));
}

function clearProfileData() {
  localStorage.removeItem('profileData');
}

function getProfilePhotoUrl(defaultUrl) {
  const saved = loadProfileData();
  return saved.photoUrl || defaultUrl;
}

function getStoredProfileName(defaultName) {
  const saved = loadProfileData();
  return saved.name || defaultName;
}

/**
 * Event application persistence helpers — manage which events the user has applied to.
 * These functions ensure that user event applications persist across page navigation
 * by storing them in the browser's localStorage.
 */

/**
 * loadAppliedEvents — retrieves the set of event IDs the user has applied to from localStorage.
 * Gracefully handles parsing errors and returns an empty set if data is corrupted.
 * @returns {Set<number>} A Set containing event IDs the user has applied to.
 */
function loadAppliedEvents() {
  try {
    return new Set(JSON.parse(localStorage.getItem('appliedEvents') || '[]'));
  } catch (err) {
    console.warn('Unable to parse appliedEvents from localStorage:', err);
    return new Set();
  }
}

/**
 * saveAppliedEvents — persists the entire set of applied event IDs to localStorage.
 * Converts the Set to an array for JSON serialization.
 * @param {Set<number>} appliedSet - The set of applied event IDs to save.
 */
function saveAppliedEvents(appliedSet) {
  localStorage.setItem('appliedEvents', JSON.stringify(Array.from(appliedSet)));
}

/**
 * addAppliedEvent — adds a single event ID to the applied events set and persists it.
 * Loads current applied events, adds the new ID, and saves the updated set.
 * @param {number} eventId - The event ID to add to applied events.
 */
function addAppliedEvent(eventId) {
  const applied = loadAppliedEvents();
  applied.add(eventId);
  saveAppliedEvents(applied);
}

/**
 * removeAppliedEvent — removes a single event ID from the applied events set and persists it.
 * Used when a user drops out of an event. Loads current applied events, removes the ID, and saves.
 * @param {number} eventId - The event ID to remove from applied events.
 */
function removeAppliedEvent(eventId) {
  const applied = loadAppliedEvents();
  applied.delete(eventId);
  saveAppliedEvents(applied);
}

/**
 * isEventApplied — checks whether a user has applied to a specific event.
 * Useful for conditional rendering or state verification.
 * @param {number} eventId - The event ID to check.
 * @returns {boolean} True if the user has applied to this event, false otherwise.
 */
function isEventApplied(eventId) {
  const applied = loadAppliedEvents();
  return applied.has(eventId);
}
