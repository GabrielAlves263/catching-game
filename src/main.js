import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`
window.addEventListener("mousemove", (event) => {
    const rect = render.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetObjects);

    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        const name = planetNames[hovered.uuid];
        if (name) {
            tooltip.innerText = name;
            tooltip.style.left = event.clientX + 10 + "px";
            tooltip.style.top = event.clientY + 10 + "px";
            tooltip.style.display = "block";
        }
    } else {
        tooltip.style.display = "none";
    }
});

setupCounter(document.querySelector('#counter'))
