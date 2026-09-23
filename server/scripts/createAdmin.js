const bcrypt = require('bcryptjs');
const readline = require('readline');
const { db, initSchema } = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  await initSchema();

  const args = process.argv.slice(2);
  let username = args[0];
  let email = args[1];
  let password = args[2];

  if (!username || !email || !password) {
    console.log('Usage: node server/scripts/createAdmin.js <username> <email> <password>');
    console.log('Or running with default interactive prompts...');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    username = username || (await question('Enter Admin Username (default: admin): ')) || 'admin';
    email = email || (await question('Enter Admin Email (default: admin@shivade.in): ')) || 'admin@shivade.in';
    password = password || (await question('Enter Admin Password (min 6 chars): '));
    rl.close();
  }

  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters long.');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const existing = await db.getAsync('SELECT id FROM admins WHERE email = ? OR username = ?', [email, username]);
  if (existing) {
    await db.runAsync(
      'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hash, existing.id]
    );
    console.log(`Admin ${username} (${email}) password updated successfully.`);
  } else {
    await db.runAsync(
      'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    console.log(`Admin ${username} (${email}) created successfully.`);
  }

  process.exit(0);
}

createAdmin().catch((err) => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
