const REPO = 'davidrhoden/whatsgoingon';
const API_BASE = `https://api.github.com/repos/${REPO}/contents`;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_TOKEN not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { inputPath } = body;
  if (!inputPath) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing inputPath' }) };
  }

  // inputPath comes as e.g. "./posts/foo.md" — strip leading ./
  const filePath = inputPath.replace(/^\.\//, '');
  const url = `${API_BASE}/${filePath}`;

  const ghHeaders = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'whatsgoingon-netlify-fn'
  };

  // Fetch current file
  const getRes = await fetch(url, { headers: ghHeaders });
  if (!getRes.ok) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `GitHub GET failed: ${getRes.status}` })
    };
  }
  const fileData = await getRes.json();

  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
  const updatedContent = markDone(currentContent);

  if (updatedContent === currentContent) {
    // Already marked completed — nothing to do
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: true }) };
  }

  // Commit the updated file
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Mark "${filePath}" as completed`,
      content: Buffer.from(updatedContent, 'utf8').toString('base64'),
      sha: fileData.sha
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `GitHub PUT failed: ${putRes.status}`, detail: errText })
    };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

// -- frontmatter helpers ------------------------------------------------

function getTags(fm) {
  const block = fm.match(/^tags:(?:\n[ \t]+-[^\n]*)*/m);
  if (!block) return [];
  return [...block[0].matchAll(/^[ \t]+-\s*([^\s]+)\s*$/gm)].map(m => m[1]);
}

function updateTags(fm, tags) {
  const tagsYaml = 'tags:' + tags.map(t => `\n  - ${t}`).join('');
  if (/^tags:/m.test(fm)) {
    return fm.replace(/^tags:(?:\n[ \t]+-[^\n]*)*/m, tagsYaml);
  }
  return fm.trimEnd() + '\n' + tagsYaml;
}

function setStatus(fm, status) {
  if (/^status:/m.test(fm)) {
    return fm.replace(/^status:.*$/m, `status: ${status}`);
  }
  if (/^client:/m.test(fm)) {
    return fm.replace(/^(client:.*)$/m, `$1\nstatus: ${status}`);
  }
  return fm.trimEnd() + `\nstatus: ${status}`;
}

function markDone(content) {
  // Must start with ---
  if (!content.startsWith('---')) return content;
  const closingIdx = content.indexOf('\n---', 3);
  if (closingIdx === -1) return content;

  let fm = content.slice(3, closingIdx);        // frontmatter body (no --- delimiters)
  const rest = content.slice(closingIdx);       // "\n---\n..." (closing delimiter + body)
  const today = new Date().toISOString().split('T')[0];

  // tags: add "completed", drop "wontdo"
  let tags = getTags(fm).filter(t => t !== 'wontdo');
  if (!tags.includes('completed') && !tags.includes('complete')) {
    tags.push('completed');
  }
  fm = updateTags(fm, tags);

  // status: done
  fm = setStatus(fm, 'done');

  // completedDate
  if (!/^completedDate:/m.test(fm)) {
    if (/^tags:/m.test(fm)) {
      fm = fm.replace(/^(tags:)/m, `completedDate: ${today}\n$1`);
    } else {
      fm = fm.trimEnd() + `\ncompletedDate: ${today}`;
    }
  }

  return `---${fm}${rest}`;
}
