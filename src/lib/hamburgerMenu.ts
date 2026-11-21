const header = document.querySelector<HTMLElement>(".site-header")!;
const btn = document.getElementById("nav-toggle")!;
const nav = document.getElementById("site-nav")!;
const mobile = matchMedia("(max-width: 56rem)");

const isOpen = () => btn.getAttribute("aria-expanded") === "true";
const setOpen = (open: boolean) => {
  header.classList.toggle("nav-open", open);
  btn.setAttribute("aria-expanded", String(open));
};

btn.addEventListener("click", () => setOpen(!isOpen()));
nav.addEventListener("click", (e) => {
  if ((e.target as Element).closest("a")) setOpen(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isOpen()) {
    setOpen(false);
    btn.focus();
  }
});
mobile.addEventListener("change", () => setOpen(false));

// Keep anchor links from landing underneath the sticky header.
const setHeight = () =>
  document.documentElement.style.setProperty(
    "--header-h",
    header.offsetHeight + "px",
  );
new ResizeObserver(setHeight).observe(header);
setHeight();
