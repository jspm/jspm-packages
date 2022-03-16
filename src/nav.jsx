import nano, { h } from "nano-jsx";

const { Helmet } = nano;

function Nav({ generatorHash = "", dependencies = [] }) {
  return (
    <div>
      <nav>
        <ul class="nav-list-style">
          <li class="nav-list-item">
            <a
              target="_blank"
              href={`https://generator.jspm.io/${generatorHash}`}
            >
              Generator [{dependencies?.length}]
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
          `}
        </style>
      </Helmet>
    </div>
  );
}
export { Nav };
