# Markdown extensions: the top 10 to support

The content repo is an Obsidian vault that also lives on GitHub, so writers expect what renders in both places. This list ranks the ten extensions that matter most for a private docs site, says which we already had, and records what we picked for each.

Ranking rule: how often it shows up in real docs, times how badly the page breaks without it. A diagram that shows as raw text is a broken page. A missing emoji is not.

| # | Extension | Syntax | Status before | Pick |
| --- | --- | --- | --- | --- |
| 1 | Code highlighting | fenced code with a language | highlight.js, basic | Shiki |
| 2 | Diagrams | ` ```mermaid ` | not supported, shown as code | Mermaid, in the browser |
| 3 | Math | `$x^2$`, `$$...$$` | not supported, shown as text | KaTeX, on the server |
| 4 | Callouts | `> [!note]`, `> [!tip] Title`, `> [!faq]-` | GitHub's five only | GitHub plus Obsidian types, with titles and folding |
| 5 | GFM basics | tables, `- [ ]`, `~~x~~`, footnotes, autolinks | supported | remark-gfm |
| 6 | Wikilinks and embeds | `[[Page]]`, `[[Page#Heading|label]]`, `![[img.png|300]]` | supported | our own plugin |
| 7 | Highlights | `==marked text==` | not supported | our own plugin |
| 8 | Comments | `%% hidden from readers %%` | not supported, and worse: shown to readers and indexed for search | strip before render and before indexing |
| 9 | Safe inline HTML | `<details>`, `<summary>`, `<kbd>`, `<sub>`, `<sup>` | all HTML dropped | rehype-raw, then sanitize |
| 10 | Heading anchors and outline | `## Heading` gets `#heading` | supported | rehype-slug plus the "On this page" column |

## 1. Code highlighting: Shiki

Candidates we looked at:

- **highlight.js via rehype-highlight** (what we had). Regex grammars, so TypeScript generics and JSX often colour wrong. No line highlighting or diff marks.
- **Prism via rehype-prism-plus.** Better than highlight.js, same regex approach, slower release pace.
- **Shiki via `@shikijs/rehype`** (picked). Uses the TextMate grammars VS Code uses, so code looks the way writers saw it in their editor. Runs on the server and outputs plain spans with colours, so readers download no highlighter. Loads a language the first time a page uses it. The official transformers add `// [!code ++]` and `// [!code --]` diff marks, `// [!code highlight]`, and `{1,3-5}` line ranges in the fence.
- **rehype-pretty-code.** Also Shiki underneath, with a friendlier options object. It works with Shiki 4, but it is one more layer between us and Shiki, and the official plugin now covers what we need.

Render cost is paid once per page version because rendered HTML is cached by blob sha.

Writers can use:

````md
```ts title="lib/auth.ts" {2}
export function check(user: User) {
  return user.active // [!code highlight]
}
```
````

## 2. Diagrams: Mermaid

Mermaid draws flowcharts, sequence, class, state, ER and Gantt diagrams, plus pies, mindmaps and timelines, from text, and both GitHub and Obsidian render it, so vault authors already write it.

- **In the browser** (picked). The Mermaid library loads only on pages that contain a diagram, runs with `securityLevel: "strict"` (no click handlers, labels sanitized), and redraws when the reader flips light or dark.
- **On the server** (`rehype-mermaid`, `mermaid-cli`). Needs a headless browser in the app container. Too heavy for one self-hosted instance.

A diagram that fails to parse shows its source and the error, not a blank box.

## 3. Math: KaTeX

- **KaTeX via remark-math and rehype-katex** (picked). Renders to HTML on the server, so no client script, and it is fast. `trust` stays off, so `\href` and friends cannot inject links.
- **MathJax.** Covers more LaTeX but is heavier, and server rendering needs extra setup.

Inline `$E = mc^2$`, block `$$ ... $$`.

## 4. Callouts

GitHub knows five (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`). Obsidian adds more (`info`, `todo`, `success`, `question`, `failure`, `danger`, `bug`, `example`, `quote`, `abstract` and aliases), custom titles (`> [!tip] Before you start`) and folding (`> [!faq]-` starts closed, `+` starts open). Unknown types fall back to a note instead of showing `[!type]` as text. Folding uses `<details>`, so it needs no script.

## 7. Highlights

`==text==` becomes `<mark>`. Only inside one paragraph, never inside code.

## 8. Comments

`%% ... %%` is how Obsidian writers leave notes to themselves. They must never reach a reader, so they are removed from the Markdown before it renders and before the search excerpt is built. Fenced code keeps its `%%`.

## 9. Safe inline HTML

Raw HTML is parsed (rehype-raw) and then passed through rehype-sanitize with GitHub's allowlist, so `<details>`, `<summary>`, `<kbd>`, `<sub>`, `<sup>` and `<br>` work, and `<script>`, `<iframe>`, `style` and `on*` attributes do not. Sanitize still runs before any of our own transforms.

## Looked at and left out

- **Emoji shortcodes** (`:rocket:`). Neither Obsidian nor most editors need them; writers can type the emoji.
- **PlantUML.** Needs a render server.
- **Note transclusion** (`![[Other note]]` inlined). Needs cycle handling and per-page access checks; we link instead.
- **Dataview queries.** A query engine over the vault, not a formatter.
- **Embedded iframes** (YouTube, Figma). Opens the page to third-party content; revisit with an allowlist if asked.
