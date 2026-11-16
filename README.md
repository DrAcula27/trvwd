# Utility website

Static site built with [Astro](https://astro.build). No server, no database.

## Run locally

    npm install
    npm run dev      # http://localhost:4321
    npm run build    # outputs ./dist

## Where to change things

| What                                                                  | Where                                   |
| --------------------------------------------------------------------- | --------------------------------------- |
| Phone, addresses, Drive folder IDs, alerts URL, meeting time/location | `src/config.ts`                         |
| Cancel or move a meeting                                              | `exceptions` in `src/config.ts`         |
| Commissioners and staff                                               | `src/data/staff.ts`                     |
| News posts                                                            | add a `.md` file in `src/content/news/` |
| Colors, fonts                                                         | top of `src/styles/global.css`          |

## Alerts (Google Sheet)

1. Create a Sheet with a tab named `Alerts` and these headers in row 1:
   `message | severity | active | expires`
2. `severity`: `emergency`, `warning`, or `info`. `active`: `TRUE`/`FALSE` (checkbox column works).
   `expires`: optional date; the alert disappears after that day.
3. File > Share > Publish to web > choose the `Alerts` tab > **CSV** > Publish.
4. Paste the URL into `alertsCsvUrl` in `src/config.ts` and redeploy once.
5. From then on, staff just edit the Sheet. Changes show up within ~5 to 10 minutes
   (Google caches published sheets for a few minutes; open pages refresh every 5).

Only publish the Alerts tab, and never put private data in that Sheet.

## Documents (Google Drive)

Make one folder each for minutes, notices, reports, resolutions. Share as
"Anyone with the link: Viewer". Put the folder ID (end of the folder URL) in
`src/config.ts`. New files appear automatically.

## Deploy (Cloudflare Pages, free)

Connect the GitHub repo. Build command `npm run build`, output directory `dist`.
Then point the Namecheap domain at Cloudflare Pages (custom domain setup).
The 4th-Tuesday date is recalculated in the browser, so no scheduled rebuilds are needed.
