export function setupConnectivity({ reloadData, refreshView }) {
  const banner = document.getElementById("offlineNotice");
  const setStatus = online => {
    document.body.classList.toggle("is-offline", !online);
    if (banner) {
      banner.hidden = online;
      banner.textContent = online ? "Connection restored. Refreshing live intelligence…" : "You are offline. Showing the last safely cached intelligence.";
    }
  };

  const refreshWhenOnline = async () => {
    setStatus(true);
    try {
      await reloadData();
      refreshView();
    } catch (error) {
      console.warn("Could not refresh after reconnecting", error);
    }
  };

  window.addEventListener("offline", () => setStatus(false));
  window.addEventListener("online", refreshWhenOnline);
  setStatus(navigator.onLine);
}
