const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.join(__dirname, '..');
const UPDATES_JSON = path.join(REPO_ROOT, 'research', 'updates.json');

function publish(db, updateId) {
  try {
    // Fetch the update being published
    const update = db.prepare('SELECT * FROM updates WHERE id = ?').get(updateId);
    if (!update) {
      return { success: false, error: 'Update not found' };
    }

    // Fetch all published updates ordered by date desc
    const published = db.prepare(
      'SELECT * FROM updates WHERE published_at IS NOT NULL ORDER BY published_at DESC'
    ).all();

    const jsonData = published.map(u => ({
      id: u.id,
      date: u.published_at,
      title: u.title,
      body: u.body,
      tags: JSON.parse(u.tags || '[]'),
      images: JSON.parse(u.images || '[]')
    }));

    fs.writeFileSync(UPDATES_JSON, JSON.stringify(jsonData, null, 2));

    const commitMsg = `research: publish update ${update.title}`;
    execSync(
      `git add research/updates.json && git commit -m "${commitMsg.replace(/"/g, '\\"')}" && git push origin HEAD`,
      { cwd: REPO_ROOT, stdio: 'pipe' }
    );

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { publish };
