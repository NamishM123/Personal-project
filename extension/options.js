const trackerInput = document.getElementById("trackerUrl");
const autoInput = document.getElementById("autoDetect");
const status = document.getElementById("status");

(async function init() {
  const { trackerUrl, autoDetect } = await chrome.storage.sync.get(["trackerUrl", "autoDetect"]);
  if (trackerUrl) trackerInput.value = trackerUrl;
  // Default to ON for new users.
  autoInput.checked = autoDetect !== false;
})();

document.getElementById("save").addEventListener("click", async () => {
  const trackerUrl = trackerInput.value.trim().replace(/\/$/, "");
  await chrome.storage.sync.set({
    trackerUrl,
    autoDetect: !!autoInput.checked,
  });
  status.textContent = "Saved.";
  setTimeout(() => (status.textContent = ""), 1500);
});
