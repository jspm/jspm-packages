/** @jsx h */
import { h } from "nano-jsx";

function Nav(
  { generatorHash = "", dependencies = [], open, toggleImportmapDialog },
) {
  return (
    <div>
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
            <button class="toggle-dialog" title="Explore Importmap" onClick={toggleImportmapDialog}>
              [{dependencies?.length}]
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
export { Nav };
