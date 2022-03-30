/** @jsx h */
import nano, { h } from "nano-jsx";

const { Helmet } = nano;

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
      <Helmet>
        <style data-component-name="jspm-nav">
          {`
          .nav-list-style {
              display: flex;
              list-style: none;
          }

          .nav-list-item {
              margin-right: var(--dl-space-space-twounits);
          }
          .nav-list-item .toggle-dialog{
            background: transparent url('/icon-distributed.png') left center no-repeat;
            background-size: contain;
            padding-left: 25px;
            border: 0;
            cursor: pointer;
            color: crimson;
          }
          `}
        </style>
      </Helmet>
    </div>
  );
}
export { Nav };
