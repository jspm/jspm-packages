/** @jsx h */
import { h } from "nano-jsx";
import { ImportmapToggleButton } from "#importmap-toggle-button";
import { GeneratorLink } from "#generator-link";

function Nav() {
  return (
    <nav>
      <ul class="nav-list-style">
        <li class="nav-list-item">
          <jspm-packages-generator-link>
            <GeneratorLink />
          </jspm-packages-generator-link>
        </li>
        <li class="nav-list-item">
          <a href="https://jspm.org/docs/cdn">Docs</a>
        </li>
        <li class="nav-list-item">
          <a href="https://jspm.org/sandbox">Sandbox</a>
        </li>
        <li class="nav-list-item">
          <a href="https://github.com/jspm/generator">Github</a>
        </li>
        <li class="nav-list-item">
          <jspm-packages-importmap-toggle-button>
            <ImportmapToggleButton />
          </jspm-packages-importmap-toggle-button>
        </li>
      </ul>
    </nav>
  );
}
export { Nav };
