const groups = [
  {
    label: "소개",
    slides: [
      ["표지", "데이터 파악은 단숨에, 다음 시즌 예측은 확실하게"],
      ["기획 의도", "매일 반복하는 세 가지 판단을 한 흐름으로"],
      ["개발 기록", "판단 기반 구축부터 기능 마무리까지"],
    ],
  },
  {
    label: "데이터 설계",
    slides: [
      ["원본 데이터", "H&M 상품·거래 데이터 연결"],
      ["분석·정리 과정", "대규모 거래를 상품별 판단 데이터로 변환"],
      ["분석 질문", "MD가 실제로 답해야 할 네 가지 질문"],
      ["발견한 수치", "순위보다 최근 판매 추세를 함께 확인"],
    ],
  },
  {
    label: "프로그램 구조",
    slides: [
      ["프로그램 화면", "상품 선별부터 전략 손익 비교까지"],
      ["다음 활용", "자사 데이터 업로드와 확장 방향"],
      ["핵심 기능 안내", "업무 순서로 보는 다섯 가지 기능"],
    ],
  },
  {
    label: "핵심 기능",
    slides: [
      ["오늘의 할 일", "우선 확인 상품 자동 정리"],
      ["전체 상품", "검색과 정렬로 검토 대상 선택"],
      ["재고 판단", "소진 예상일과 입고 소요일 비교"],
      ["전략 입력", "MD가 조치와 예상 판매량 설정"],
      ["전략 계산", "예상 매출·이익·재고 비교"],
      ["판단과 회고", "선택 이유와 실행 결과 연결"],
      ["다음 시즌 기획", "유사 상품의 두 시즌 흐름 비교"],
    ],
  },
  {
    label: "구현과 정리",
    slides: [
      ["핵심 코드", "서버 교차 검증과 발주 검토량 계산"],
      ["확장한 역량", "MD 경험을 데이터 분석과 제품 기획으로"],
    ],
  },
];

const flatSlides = [];
groups.forEach((group) => {
  group.slides.forEach(([title, description]) => {
    flatSlides.push({ group: group.label, title, description });
  });
});

const toc = document.querySelector("#toc");
const slideImage = document.querySelector("#slideImage");
const slideFrame = document.querySelector("#slideFrame");
const currentGroup = document.querySelector("#currentGroup");
const currentTitle = document.querySelector("#currentTitle");
const currentNumber = document.querySelector("#currentNumber");
const slideTitleFooter = document.querySelector("#slideTitleFooter");
const progressBar = document.querySelector("#progressBar");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const menuBtn = document.querySelector("#menuBtn");
const sidebar = document.querySelector("#sidebar");
const scrim = document.querySelector("#scrim");

let current = 0;

function pad(value) { return String(value).padStart(2, "0"); }

let runningIndex = 0;
groups.forEach((group) => {
  const section = document.createElement("section");
  section.className = "toc-group";
  const heading = document.createElement("span");
  heading.className = "toc-label";
  heading.textContent = group.label;
  section.appendChild(heading);

  group.slides.forEach(([title]) => {
    const index = runningIndex++;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toc-item";
    button.dataset.index = index;
    button.innerHTML = `<span class="num">${pad(index + 1)}</span><span class="label">${title}</span>`;
    button.addEventListener("click", () => {
      showSlide(index);
      closeMenu();
    });
    section.appendChild(button);
  });
  toc.appendChild(section);
});

function showSlide(index, { updateHash = true } = {}) {
  const next = Math.max(0, Math.min(flatSlides.length - 1, index));
  const data = flatSlides[next];
  current = next;
  slideFrame.classList.add("is-changing");

  const imagePath = `assets/slides/slide-${pad(next + 1)}.png`;
  const preload = new Image();
  preload.onload = () => {
    slideImage.src = imagePath;
    slideImage.alt = `${data.title} 슬라이드`;
    requestAnimationFrame(() => slideFrame.classList.remove("is-changing"));
  };
  preload.src = imagePath;

  currentGroup.textContent = data.group;
  currentTitle.textContent = data.title;
  currentNumber.textContent = pad(next + 1);
  slideTitleFooter.textContent = data.description;
  progressBar.style.width = `${((next + 1) / flatSlides.length) * 100}%`;
  prevBtn.disabled = next === 0;
  nextBtn.disabled = next === flatSlides.length - 1;

  document.querySelectorAll(".toc-item").forEach((item) => {
    const isActive = Number(item.dataset.index) === next;
    item.classList.toggle("active", isActive);
    if (isActive) item.scrollIntoView({ block: "nearest" });
  });

  document.title = `${pad(next + 1)} · ${data.title} | MD Decision Lab`;
  if (updateHash) history.replaceState(null, "", `#slide-${next + 1}`);
  preloadAdjacent(next);
}

function preloadAdjacent(index) {
  [index - 1, index + 1].forEach((value) => {
    if (value >= 0 && value < flatSlides.length) {
      const img = new Image();
      img.src = `assets/slides/slide-${pad(value + 1)}.png`;
    }
  });
}

function hashIndex() {
  const match = location.hash.match(/^#slide-(\d+)$/);
  return match ? Number(match[1]) - 1 : 0;
}

function openMenu() {
  sidebar.classList.add("open");
  scrim.classList.add("show");
  menuBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  sidebar.classList.remove("open");
  scrim.classList.remove("show");
  menuBtn.setAttribute("aria-expanded", "false");
}

prevBtn.addEventListener("click", () => showSlide(current - 1));
nextBtn.addEventListener("click", () => showSlide(current + 1));
menuBtn.addEventListener("click", () => sidebar.classList.contains("open") ? closeMenu() : openMenu());
scrim.addEventListener("click", closeMenu);

fullscreenBtn.addEventListener("click", async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
});

window.addEventListener("hashchange", () => showSlide(hashIndex(), { updateHash: false }));
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key === "PageUp") showSlide(current - 1);
  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") showSlide(current + 1);
  if (event.key === "Home") showSlide(0);
  if (event.key === "End") showSlide(flatSlides.length - 1);
  if (event.key === "Escape") closeMenu();
});

showSlide(hashIndex(), { updateHash: false });
