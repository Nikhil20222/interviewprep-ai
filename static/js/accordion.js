
function toggleSection(header) {
  const item = header.parentElement;
  const accordion = item.parentElement;
  const wasOpen = item.classList.contains("open");

  accordion.querySelectorAll(".accordion-item.open").forEach((el) => {
    el.classList.remove("open");
  });

  if (!wasOpen) {
    item.classList.add("open");
  }
}
