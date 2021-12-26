import { jsx } from "nano-jsx";

export const Logo = ({ name, version }) => {
  return jsx`
    <jspm-package-logo>
      <div class="scene">
    <div class="cube show-top">
      <div class="cube__face cube__face--front">${name}</div>
      <div class="cube__face cube__face--back"></div>
      <div class="cube__face cube__face--right">${version}</div>
      <div class="cube__face cube__face--left">left</div>
      <div class="cube__face cube__face--top"><a href="/">JSPM</a></div>
      <div class="cube__face cube__face--bottom"></div>
    </div>
  </div>
  </jspm-package-logo>
      `;
};
