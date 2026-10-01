const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Client records live in clients/*.md, managed through the Decap CMS admin
// ("Clients" collection). Each file has YAML frontmatter with:
//   name, contactName, contactEmail, color
module.exports = () => {
  const dir = path.join(__dirname, "..", "clients");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const match = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!match) return null;
      const data = yaml.load(match[1]);
      return data && data.name ? data : null;
    })
    .filter(Boolean);
};
