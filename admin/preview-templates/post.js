import htm from "https://unpkg.com/htm?module";
import format from "https://unpkg.com/date-fns@2.7.0/esm/format/index.js?module";

const html = htm.bind(h);

// Preview component for a Post
const Post = createClass({
  render() {
    const entry = this.props.entry;

    // date can be empty on new/unsaved entries — guard before formatting
    let dateLabel = "";
    const rawDate = entry.getIn(["data", "date"]);
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        dateLabel = format(parsed, "dd MMM, yyyy");
      }
    }
    const author = entry.getIn(["data", "client"], "");

    return html`
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          <p>
            <small>
              ${dateLabel ? html`<time>${dateLabel}</time>` : ""}
              ${author ? " by " + author : ""}
            </small>
          </p>

          <p>${entry.getIn(["data", "summary"], "")}</p>

          ${this.props.widgetFor("body")}
          <p>
            ${
              entry.getIn(["data", "tags"], []).map(
                tag =>
                  html`
                    <a href="#" rel="tag">${tag}</a>
                  `
              )
            }
          </p>
        </article>
      </main>
    `;
  }
});

export default Post;
