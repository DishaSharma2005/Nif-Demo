(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultSection = document.getElementById('resultSection');
    const table = document.getElementById('dataTable');
    const bell = document.getElementById("notificationBell");
    const dot = document.getElementById("notificationDot");

    // ✅ Red Dot Notification Handling
    if (bell && dot) {
      // Check if user has already seen notifications
      const seen = localStorage.getItem("seenNotifications");
      if (seen === "true") {
        dot.style.display = "none";
      } else {
        dot.style.display = "inline-block";
      }

      bell.addEventListener("click", () => {
        dot.style.display = "none";
        localStorage.setItem("seenNotifications", "true");
      });
    }

    // ✅ Search by Button Click
    if (searchBtn && searchInput && resultSection) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchBtn.click();
        }
      });

      searchBtn.addEventListener('click', async function () {
        const searchName = searchInput.value.trim();
        resultSection.innerHTML = '';

        if (!searchName) {
          return showMessage('Please enter an innovator\'s name.', 'warning');
        }

        try {
          showMessage('🔍 Searching...', 'info');

          const response = await fetch(`/search?name=${encodeURIComponent(searchName)}`);
          if (!response.ok) throw new Error();

          const data = await response.json();
          if (!data || Object.keys(data).length === 0) throw new Error();

          const html = `
            <table class="table table-bordered mt-4">
              <thead class="table-dark">
                <tr><th>Field</th><th>Value</th></tr>
              </thead>
              <tbody>
                ${Object.entries(data).map(([key, value]) => `
                  <tr>
                    <td>${formatKey(key)}</td>
                    <td>${value || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
          resultSection.innerHTML = html;
        } catch (err) {
          showMessage('❌ Innovator not found.', 'danger');
        }
      });
    }

    // ✅ Live Table Filter + Highlight
    if (searchInput && table) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        let firstMatchFound = false;

        const rows = Array.from(table.querySelector('tbody').rows);

        rows.forEach((row) => {
          let matched = false;

          Array.from(row.cells).forEach((cell) => {
            removeHighlights(cell);
            if (cell.classList.contains('no-highlight')) return;

            const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            while (walker.nextNode()) {
              textNodes.push(walker.currentNode);
            }

            textNodes.forEach((node) => {
              const text = node.nodeValue;
              const lower = text.toLowerCase();
              if (query && lower.includes(query)) {
                const regex = new RegExp(`(${query})`, 'gi');
                const newHTML = text.replace(regex, '<mark>$1</mark>');
                const span = document.createElement('span');
                span.innerHTML = newHTML;
                node.parentNode.replaceChild(span, node);
                matched = true;
              }
            });
          });

          row.style.display = query === '' || matched ? '' : 'none';

          if (matched && !firstMatchFound) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstMatchFound = true;
          }
        });
      });
    }

    // ✅ Scroll to Entry from #row-URL
    const scrollToRowFromHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#row-")) {
        const tryScroll = () => {
          const targetRow = document.querySelector(hash);
          if (targetRow) {
            targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
            targetRow.classList.add("flash-highlight");
            setTimeout(() => {
              targetRow.classList.remove("flash-highlight");
            }, 2000);
          } else {
            requestAnimationFrame(tryScroll);
          }
        };
        setTimeout(tryScroll, 200);
      }
    };

    scrollToRowFromHash();

    // ✅ Utility Functions
    function formatKey(key) {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/_/g, ' ');
    }

    function removeHighlights(element) {
      const marks = element.querySelectorAll('mark');
      marks.forEach((mark) => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      });
    }

    function showMessage(msg, type = 'info') {
      resultSection.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    }

    // ✅ OPTIONAL: Check if new notifications were added (dynamic update)
   async function checkNewNotifications() {
      try {
        const response = await fetch("/api/notifications/latest");
        const { latest } = await response.json();

        const lastSeen = localStorage.getItem("lastSeenNotif");
        if (!lastSeen || new Date(latest) > new Date(lastSeen)) {
          document.getElementById("notificationDot")?.classList.remove("d-none");
        }
      } catch (err) {
        console.error("Failed to check new notifications:", err);
      }
    }

    checkNewNotifications();
})})();
