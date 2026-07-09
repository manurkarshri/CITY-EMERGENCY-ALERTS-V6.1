export function renderEmergency() {
  document.getElementById("tab-emergency").innerHTML = `
    <section class="card feature">
      <div class="section-kicker">Immediate Help</div>
      <h2>Emergency Dial</h2>
      <div class="call-grid">
        <a class="call-btn emergency" href="tel:112">112<br><span class="small">Emergency</span></a>
        <a class="call-btn" href="tel:100">100<br><span class="small">Police</span></a>
        <a class="call-btn" href="tel:101">101<br><span class="small">Fire</span></a>
        <a class="call-btn" href="tel:108">108<br><span class="small">Ambulance</span></a>
      </div>
    </section>
    <section class="card">
      <h2>Nearby Emergency Services</h2>
      <div class="call-grid">
        <a class="call-btn" href="https://www.google.com/maps/search/hospital+near+me" target="_blank">Hospitals</a>
        <a class="call-btn" href="https://www.google.com/maps/search/police+station+near+me" target="_blank">Police Stations</a>
        <a class="call-btn" href="https://www.google.com/maps/search/fire+station+near+me" target="_blank">Fire Stations</a>
        <a class="call-btn" href="https://www.google.com/maps/search/disaster+management+office+near+me" target="_blank">Disaster Help</a>
      </div>
    </section>
    <section class="card">
      <h2>Share My Location</h2>
      <button class="primary-btn" id="shareLocationBtn">Share My Location</button>
      <p class="small">Your location is used only on your device for sharing. It is not stored on any server.</p>
    </section>
    <section class="card">
      <details><summary>Safety Resources</summary>
        <h3>Flood / Heavy Rain</h3><p>Avoid riverbanks, flooded underpasses and roads where the surface is not visible.</p>
        <h3>Heatwave</h3><p>Stay hydrated and avoid prolonged outdoor activity during peak afternoon heat.</p>
        <h3>Lightning</h3><p>Move indoors. Avoid open fields, isolated trees and metal structures.</p>
        <h3>Fire</h3><p>Leave the area calmly. Do not use lifts during building fires.</p>
        <h3>Emergency Kit</h3><p>Keep water, torch, power bank, medicines, ID copies and basic first aid ready.</p>
      </details>
    </section>
  `;
  document.getElementById("shareLocationBtn")?.addEventListener("click", shareLocation);
}

function shareLocation() {
  if (!navigator.geolocation) { alert("Location sharing is not supported."); return; }
  navigator.geolocation.getCurrentPosition(async position => {
    const text = `My location: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
    if (navigator.share) await navigator.share({ title: "My Location", text });
    else { await navigator.clipboard.writeText(text); alert("Location copied to clipboard."); }
  }, () => alert("Unable to access location. Please allow location permission."));
}
