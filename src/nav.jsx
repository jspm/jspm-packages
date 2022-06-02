/** @jsx h */
import { h } from "nano-jsx";
import { ImportmapToggleButton } from "@jspm/packages/importmap-toggle-button";

function Nav(
  { generatorHash = ""},
) {
  return (
    <nav>
      <ul class="nav-list-style">
        <li class="nav-list-item">
          <a
            target="_blank"
            href={`https://generator.jspm.io/${generatorHash}`}
          >
            Generator
          </a>
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
