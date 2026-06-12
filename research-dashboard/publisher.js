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
      date: u.post_date || u.published_at,
      title: u.title,
      body: u.body,
      tags: JSON.parse(u.tags || '[]'),
      images: JSON.parse(u.images || '[]'),
      project: u.project || 'stick'
    }));

    const safeTitle = update.title.replace(/^#+\s*/, '').replace(/"/g, '\\"');
    const commitMsg = `research: publish update ${safeTitle}`;
    // Sync with remote, write update, commit and push
    const branch = execSync(`git rev-parse --abbrev-ref HEAD`, { cwd: REPO_ROOT }).toString().trim();
    execSync(`git fetch origin`, { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync(`git reset --hard origin/${branch}`, { cwd: REPO_ROOT, stdio: 'pipe' });
    fs.writeFileSync(UPDATES_JSON, JSON.stringify(jsonData, null, 2));
    execSync(`git add research/updates.json`, { cwd: REPO_ROOT, stdio: 'pipe' });
    try {
      execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
    } catch (_) {} // nothing new to commit is fine
    execSync(`git push origin HEAD`, { cwd: REPO_ROOT, stdio: 'pipe' });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { publish };
