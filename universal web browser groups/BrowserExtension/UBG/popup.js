const tabsContainer = document.getElementById('tabs');
const exportBtn = document.getElementById('export');

var urls = [];

async function listAllTabs() {
  urls = [];

  tabsContainer.innerHTML = 'Loading...';
  // Use chrome.tabs.query — works across all windows
  chrome.tabs.query({}, (tabs) => {
    tabsContainer.innerHTML = '';
    if (!tabs || tabs.length === 0) {
      tabsContainer.textContent = 'No tabs found';
      return;
    }
    tabs.forEach(tab => {
      const div = document.createElement('div');
      div.className = 'tab';

      const img = document.createElement('img');
      img.className = 'favicon';
      img.src = tab.favIconUrl || '';

      const text = document.createElement('div');
      text.innerHTML = `<div class="title">${escapeHtml(tab.title || '(no title)')}</div>
                        <div class="url">${escapeHtml(tab.url || '')}</div>`;

      urls.push(escapeHtml(tab.url || ''))

      // click to switch to the tab
      div.addEventListener('click', () => {
        chrome.windows.update(tab.windowId, { focused: true }, () => {
          chrome.tabs.update(tab.id, { active: true });
        });
      });

      div.appendChild(img);
      div.appendChild(text);
      tabsContainer.appendChild(div);
    });
  });

//   console.log(urls)
}

async function exportHTML(urlsArray){
    let urlsCovered = [];
    for (let i = 0; i < urlsArray.length; i++){
        urlsCovered.push('"' + urlsArray[i] + '"')
    }

    const urlsString = urlsCovered.join(", ");

    // Build simple HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Universal Browser Groupper</title>
</head>
<body>
    <p>This tab should be automatically closed.</p>

<script type="text/javascript">
    const urls = [${urlsString}]

    for (let i = 0; i < urls.length; i++) {
        window.open(urls[i])
    }

    window.close()
</script>

</body>
</html>`;

    // Convert string → Blob → Object URL
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Download via chrome.downloads
    chrome.downloads.download({
      url: url,
      filename: "Groupped Tabs.html",
      saveAs: true
    }, function(downloadId) {
      if (chrome.runtime.lastError) {
        console.error("Download failed:", chrome.runtime.lastError);
      } else {
        console.log("Download started:", downloadId);
      }
      // Revoke blob URL after short delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    })

    // Download file via browser API
    // await browser.downloads.download({
    //     url,
    //     filename: "group.html",
    //     saveAs: true
    // });

    // Clean up object URL later (optional)
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function listAndExport(){
    listAllTabs()
    exportHTML(urls)
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

exportBtn.addEventListener('click', listAndExport);

// initial load
listAllTabs();