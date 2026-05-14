// scripts/seed-events.js
//
// Populates the `events` table with the six demo events that used to live in
// frontend/csus-landing-page-events.html as a hardcoded array.
//
// Run from the `server/` directory:
//   npm run seed
//
// Safe to re-run: clears the table first, then re-inserts. This keeps the IDs
// predictable so anything referencing event id 1..6 keeps working.
//
// When real admin functionality lands, this script becomes obsolete — the
// admin UI will INSERT rows into this same table and the frontend will keep
// reading them through GET /api/events with no changes.

const db = require('../src/db');

const EVENTS = [
  { name: 'Bingo & Trivia Nights',  month: 'Feb',   day: 10, time_range: '2:00pm - 5:00pm',  image: 'assets/images/bingoNight.jpg' },
  { name: 'Career Fair',            month: 'April', day: 23, time_range: '12:00pm - 5:00pm', image: 'assets/images/careerFair.png' },
  { name: 'Academic Tutoring',      month: 'April', day: 30, time_range: '10:00pm - 5:00pm', image: 'assets/images/tutorting.png' },
  { name: 'Neighborhood Clean-up',  month: 'MAY',   day: 12, time_range: '1:00pm - 6:00pm',  image: 'assets/images/communityCleanup.webp' },
  { name: 'Resume Workshop',        month: 'MAY',   day: 16, time_range: '12:30pm - 3:00pm', image: 'assets/images/resumeWorkshop.png' },
  { name: 'Food Bank',              month: 'MAY',   day: 22, time_range: '1:00pm - 4:00pm',  image: 'assets/images/foodBank.jpg' },
];

async function seed() {
  try {
    // Wipe + reset auto-increment so re-running yields ids 1..6 every time.
    // TRUNCATE is faster than DELETE and resets the counter automatically.
    await db.query('TRUNCATE TABLE events');
    console.log('Cleared events table.');

    for (const ev of EVENTS) {
      await db.execute(
        'INSERT INTO events (name, month, day, time_range, image) VALUES (?, ?, ?, ?, ?)',
        [ev.name, ev.month, ev.day, ev.time_range, ev.image]
      );
    }

    console.log(`Seeded ${EVENTS.length} events.`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Pool keeps the process alive otherwise.
    await db.end();
  }
}

seed();
