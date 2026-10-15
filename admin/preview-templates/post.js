import htm from "https://unpkg.com/htm?module";
import format from "https://unpkg.com/date-fns@2.7.0/esm/format/index.js?module";

const html = htm.bind(h);

function slugify(str) {
  if (!str) return "";
  return String(str)
    .replace(/['''\u2018\u2019`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return "";
  return format(parsed, "dd MMM yyyy");
}

// Preview component for a Post — mirrors the slide look
const Post = createClass({
  render() {
    const entry = this.props.entry;

    const clientName = entry.getIn(["data", "client"], "");
    const status = entry.getIn(["data", "status"], "open");
    const completedDate = entry.getIn(["data", "completedDate"], "");

    // Client color (window.CLIENTS is loaded by admin/index.html)
    let bg = "#ffffff";
    const clients = window.CLIENTS || [];
    const client = clients.find(c => c && slugify(c.name) === slugify(clientName));
    if (client && client.color) bg = client.color;

    const dateLabel = formatDate(entry.getIn(["data", "date"]));
    const doneLabel = formatDate(completedDate);

    const badgeStyle = {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "12px",
      color: "#fff",
      margin: "0 0 8px",
      textTransform: "uppercase",
      letterSpacing: ".1em"
    };
    const statusBadge =
      status === "done"
        ? html`<span style=${{ ...badgeStyle, background: "#008000" }}>&#10003; Done${doneLabel ? " " + doneLabel : ""}</span>`
        : status === "wontdo"
          ? html`<span style=${{ ...badgeStyle, background: "#555" }}>&#10007; Won't Do</span>`
          : "";

    let tags = entry.getIn(["data", "tags"], []);
    if (tags && tags.toJS) tags = tags.toJS();
    tags = (tags || []).filter(t => t !== "post");

    return html`
      <main>
        <article style=${{ background: bg }}>
          <div class="centerer">
            ${statusBadge}
            <h3>${entry.getIn(["data", "title"], null)}</h3>
            <p>
              <small>
                ${dateLabel ? html`<time>${dateLabel}</time>` : ""}
                ${clientName ? " by " + clientName : ""}
              </small>
            </p>
            ${entry.getIn(["data", "summary"], "") ? html`<p>${entry.getIn(["data", "summary"], "")}</p>` : ""}
            ${this.props.widgetFor("body")}
            ${tags.length ? html`<p>${tags.map(tag => html`<a href="#" rel="tag">${tag}</a>`)}</p>` : ""}
          </div>
        </article>
      </main>
    `;
  }
});

export default Post;
