const input = document.getElementById("trackerUrl");
const status = document.getElementById("status");

chrome.storage.sync.get("trackerUrl").then(({ trackerUrl }) => {
  if (trackerUrl) input.value = trackerUrl;
});

document.getElementById("save").addEventListener("click", async () => {
  const value = input.value.trim().replace(/\/$/, "");
  await chrome.storage.sync.set({ trackerUrl: value });
  status.textContent = "Saved.";
  setTimeout(() => (status.textContent = ""), 1500);
});
