const groups = [
  { label: "소개", slides: ["표지", "기획 의도", "개발 기록"] },
  { label: "데이터 설계", slides: ["원본 데이터", "분석·정리 과정", "분석 질문", "발견한 수치"] },
  { label: "프로그램 구조", slides: ["프로그램 화면", "다음 활용", "핵심 기능 안내"] },
  { label: "핵심 기능", slides: ["오늘의 할 일", "전체 상품", "재고 판단", "전략 입력", "전략 계산", "판단과 회고", "다음 시즌 기획"] },
  { label: "구현과 정리", slides: ["핵심 코드", "확장한 역량"] },
];

const sections = [...document.querySelectorAll(".story-section")];
const titles = sections.map((section) => section.dataset.title);
const toc = document.querySelector("#toc");
const currentGroup = document.querySelector("#currentGroup");
const currentTitle = document.querySelector("#currentTitle");
const currentNumber = document.querySelector("#currentNumber");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const menuBtn = document.querySelector("#menuBtn");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#scrim");
const pad = (value) => String(value).padStart(2, "0");
let activeIndex = 0;
let wheelLocked = false;

function closeMenu() {
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
  menuBtn.setAttribute("aria-expanded", "false");
}

let index = 0;
groups.forEach((group) => {
  const block = document.createElement("section");
  block.className = "toc-group";
  block.innerHTML = '<span class="toc-label">' + group.label + "</span>";
  group.slides.forEach((title) => {
    const link = document.createElement("a");
    link.className = "toc-item";
    link.dataset.index = index;
    link.href = "#slide-" + (index + 1);
    link.innerHTML = '<span class="num">' + pad(index + 1) + '</span><span class="label">' + title + "</span>";
    link.addEventListener("click", closeMenu);
    block.appendChild(link);
    index += 1;
  });
  toc.appendChild(block);
});

function groupFor(indexValue) {
  let cursor = 0;
  for (const group of groups) {
    if (indexValue < cursor + group.slides.length) return group.label;
    cursor += group.slides.length;
  }
  return "";
}

function setActive(indexValue) {
  const title = titles[indexValue];
  if (!title) return;
  activeIndex = indexValue;
  currentGroup.textContent = groupFor(indexValue);
  currentTitle.textContent = title;
  currentNumber.textContent = pad(indexValue + 1);
  document.querySelectorAll(".toc-item").forEach((item) => {
    const active = Number(item.dataset.index) === indexValue;
    item.classList.toggle("active", active);
    if (active) item.scrollIntoView({ block: "nearest" });
  });
  document.title = pad(indexValue + 1) + " · " + title + " | MD Decision Lab";
  history.replaceState(null, "", "#slide-" + (indexValue + 1));
}

function moveToSlide(indexValue, behavior = "smooth") {
  const nextIndex = Math.max(0, Math.min(sections.length - 1, indexValue));
  activeIndex = nextIndex;
  setActive(nextIndex);
  sections[nextIndex]?.scrollIntoView({ block: "start", behavior });
}

function usesPagedNavigation() {
  return window.matchMedia("(min-width: 961px)").matches;
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle("in-view", entry.isIntersecting));
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) setActive(Number(visible.target.dataset.index));
}, { rootMargin: "-18% 0px -55%", threshold: [0, 0.15, 0.4, 0.7] });

sections.forEach((section) => observer.observe(section));
menuBtn.addEventListener("click", () => {
  if (sidebar.classList.contains("open")) closeMenu();
  else {
    sidebar.classList.add("open");
    scrim.classList.add("show");
    menuBtn.setAttribute("aria-expanded", "true");
  }
});
scrim.addEventListener("click", closeMenu);
window.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
window.addEventListener("keydown", (event) => {
  if (!usesPagedNavigation() || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, button, [contenteditable='true']")) return;
  let nextIndex = null;
  if (["ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !event.shiftKey)) nextIndex = activeIndex + 1;
  if (["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey)) nextIndex = activeIndex - 1;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = sections.length - 1;
  if (nextIndex === null) return;
  event.preventDefault();
  moveToSlide(nextIndex, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
});
window.addEventListener("wheel", (event) => {
  if (!usesPagedNavigation() || event.ctrlKey || Math.abs(event.deltaY) < 18) return;
  if (event.target instanceof HTMLElement && event.target.closest(".sidebar, .toc")) return;
  event.preventDefault();
  if (wheelLocked) return;
  wheelLocked = true;
  moveToSlide(activeIndex + (event.deltaY > 0 ? 1 : -1), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  window.setTimeout(() => { wheelLocked = false; }, 720);
}, { passive: false });
fullscreenBtn.addEventListener("click", async () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());

const initial = Math.max(0, Math.min(sections.length - 1, Number((location.hash.match(/^#slide-(\d+)$/) || [0, 1])[1]) - 1));
setActive(initial);
if (location.hash) requestAnimationFrame(() => moveToSlide(initial, "auto"));
