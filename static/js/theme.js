
(function () {
  "use strict";

  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");
  });
})();
