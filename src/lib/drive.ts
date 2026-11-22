// Lists a public Google Drive folder (and its year subfolders) from the browser.
// Uses the Drive API v3 with a referrer-restricted, read-only API key.

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}
export interface YearGroup {
  name: string;
  files: DriveFile[];
}
export interface FolderListing {
  groups: YearGroup[];
  loose: DriveFile[];
}

const API = "https://www.googleapis.com/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";
const ID_OK = /^[\w-]+$/;

async function listAll(key: string, q: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q,
      key,
      pageSize: "1000",
      fields:
        "nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,parents)",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`Drive API ${res.status}`);
    const data = await res.json();
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < 5000);
  return files;
}

// Newest first. Name files like "2026-11-24 Minutes.pdf" and they sort by date.
const byNameDesc = (a: { name: string }, b: { name: string }) =>
  b.name.localeCompare(a.name, undefined, { numeric: true });

/** Two API calls total, no matter how many year folders there are. */
export async function loadFolder(
  key: string,
  rootId: string,
): Promise<FolderListing> {
  if (!ID_OK.test(rootId)) throw new Error("Bad folder id");
  const root = await listAll(key, `'${rootId}' in parents and trashed = false`);
  const folders = root.filter((f) => f.mimeType === FOLDER).sort(byNameDesc);
  const loose = root.filter((f) => f.mimeType !== FOLDER).sort(byNameDesc);

  let groups: YearGroup[] = [];
  if (folders.length) {
    const parents = folders
      .filter((f) => ID_OK.test(f.id))
      .map((f) => `'${f.id}' in parents`);
    const kids = await listAll(
      key,
      `(${parents.join(" or ")}) and trashed = false and mimeType != '${FOLDER}'`,
    );
    groups = folders.map((f) => ({
      name: f.name,
      files: kids.filter((k) => k.parents?.includes(f.id)).sort(byNameDesc),
    }));
  }
  return { groups, loose };
}

// ---------- rendering (DOM, text only: never innerHTML) ----------

const TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.google-apps.document": "Doc",
  "application/vnd.google-apps.spreadsheet": "Sheet",
  "application/vnd.google-apps.presentation": "Slides",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "Word",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function fileItem(f: DriveFile, tz: string): HTMLLIElement {
  const li = el("li");
  const href =
    f.webViewLink &&
    /^https:\/\/(drive|docs)\.google\.com\//.test(f.webViewLink)
      ? f.webViewLink
      : `https://drive.google.com/file/d/${f.id}/view`;
  const a = el("a", "", f.name.replace(/\.(pdf|docx?|xlsx?|pptx?)$/i, ""));
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.append(el("span", "sr-only", " (opens in a new tab)"));

  const meta = el("span", "meta");
  const type = TYPES[f.mimeType] ?? "File";
  const date = f.modifiedTime
    ? new Date(f.modifiedTime).toLocaleDateString("en-US", {
        dateStyle: "medium",
        timeZone: tz,
      })
    : "";
  meta.textContent = date ? `${type} · Updated ${date}` : type;

  li.append(a, meta);
  return li;
}

const fileList = (files: DriveFile[], tz: string) => {
  const ul = el("ul");
  files.forEach((f) => ul.append(fileItem(f, tz)));
  return ul;
};

export function renderFolder(
  host: HTMLElement,
  { groups, loose }: FolderListing,
  tz: string,
) {
  host.replaceChildren();
  host.removeAttribute("aria-busy");

  if (!groups.length && !loose.length) {
    host.append(el("p", "muted", "No documents have been posted yet."));
    return;
  }
  if (loose.length) {
    const box = el("div", "flat");
    box.append(fileList(loose, tz));
    host.append(box);
  }
  groups.forEach((g, i) => {
    const d = el("details");
    d.open = i === 0 && !loose.length; // newest year open by default
    const s = el("summary", "", g.name);
    s.append(
      el(
        "span",
        "count",
        `${g.files.length} document${g.files.length === 1 ? "" : "s"}`,
      ),
    );
    d.append(s);
    d.append(
      g.files.length
        ? fileList(g.files, tz)
        : el("p", "muted", "Nothing posted for this year."),
    );
    host.append(d);
  });
}

/** Used when the API key is missing or the request fails: the plain Drive embed. */
export function renderFallback(
  host: HTMLElement,
  folderId: string,
  title: string,
) {
  host.replaceChildren();
  host.removeAttribute("aria-busy");
  if (!ID_OK.test(folderId)) return;
  const frame = el("iframe", "drive");
  frame.title = title;
  frame.src = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  frame.loading = "lazy";
  const p = el("p", "muted");
  const a = el("a", "", "Open the folder in Google Drive");
  a.href = `https://drive.google.com/drive/folders/${folderId}`;
  p.append("Trouble viewing the list? ", a, ".");
  host.append(frame, p);
}
