/** @jsx h */
import nano, { Component, h } from "nano-jsx";

const { Helmet  } = nano;

class Hero extends Component {
  constructor(props) {
    super(props);
    const selectedExports = {};
    props.exports.forEach((subpath) =>
      selectedExports[subpath] = subpath === "."
    );
    this.exports = selectedExports;
  }

  exports;
  generatorHash;

  generateHash = async () => {
    if (typeof globalThis.document !== "undefined") {
      const { name, version } = this.props;

      const { getStateHash } = await import("./generate-statehash.js");
      const exports = Object.keys(this.exports).filter((subpath) =>
        this.exports[subpath] === true
      );
      const generatorHash = await getStateHash({
        name,
        version,
        exports,
      });

      if (generatorHash) {
        this.generatorHash = generatorHash;
        this.update();
      }
    }
  };

  didMount() {
    if (!this.generatorHash) {
      this.generateHash();
    }
  }
  toggleExportSelection = (event) => {
    event.preventDefault();
    console.log(event);
    this.exports[event.target.value] = !this
      .exports[event.target.value];
    console.log(event.target.value);
    this.generateHash();
    this.update();
  };

  render() {
    if (this.generatorHash) {
      const { name, description, version, updated, types } = this.props;
      const selectedImports = Object.keys(this.exports).filter((subpath) =>
        this.exports[subpath] === true
      );
      const numSelectedImports = selectedImports.length;
      const depText = `${numSelectedImports} ${
        numSelectedImports > 1 ? "dependencies" : "dependency"
      }`;
      return (
        <jspm-hero>
          <jspm-hero-main>
            <jspm-highlight>
              <h2>{name}</h2>
              <jspm-summary>
                <span>{version}</span>
                <span>Published {updated}</span>
                {types && <img height="20" src="/icon-typescript-logo.svg" />}
              </jspm-summary>
              <p>{description}</p>
            </jspm-highlight>

            <jspm-hero-cta>
              <jspm-hero-cta-generator>
                <p>
                  Customise importmap for selected {depText}.
                </p>
                <a
                  target="_blank"
                  href={`https://generator.jspm.io/${this.generatorHash}`}
                >
                  JSPM Generator
                </a>
              </jspm-hero-cta-generator>
            </jspm-hero-cta>
          </jspm-hero-main>
          <jspm-exports>
            <h3>Package Exports</h3>
            <ul>
              {Object.entries(this.exports).map((
                [subpath, selected],
              ) => (
                <li data-selected={selected}>
                  <jspm-export>
                    {
                      /* <input
                  type="checkbox"
                  {...(selected ? { checked: true } : {})}
                  value={subpath}
                  onClick={this.toggleExportSelection}
                /> */
                    }
                    <button
                      type="button"
                      class="code"
                      onClick={this.toggleExportSelection}
                      value={subpath}
                    >
                      {`${name}${subpath.slice(1)}`}
                    </button>
                  </jspm-export>
                </li>
              ))}
            </ul>
          </jspm-exports>
          <Helmet>
            <style data-component-name="jspm-hero">
              {`
              jspm-summary{
                display: flex;
                justify-content: center;
                font-weight: 700;
              }
              jspm-summary > span:after{
                content: '•';
                margin: 0 10px;
              }
              jspm-exports{
                max-height: 400px;
                overflow-y: scroll;
              }
              jspm-exports ul{
                margin: 0;
                padding: 0 0 0 15px;
              }
              jspm-exports li{
                padding-inline-start: 1ch;
                list-style-type: '+';
              }
              jspm-exports li::marker {
                color: var(--dl-color-primary-js-primary);
              }
              jspm-exports li[data-selected="true"]{
                list-style-type: '✔';
              }
              jspm-hero{
                display: grid;
                grid-template-columns: minmax(800px, 1fr) minmax(350px, 1fr);
                grid-gap: 1rem;
              }
              jspm-export{
                display: block;
              }
          jspm-export button {
              background: white;
              border: none;
              cursor: pointer;
              display: block;
              line-height: 30px;
              border-radius: 5px;
              text-align: left;
          }
          jspm-hero-cta{
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          jspm-hero-cta p{
            font-family: "Bebas Neue", cursive;
            font-size: var(--step-1);
          }
          jspm-hero-cta a{
            background: var(--dl-color-primary-js-primary);
            color: black;
            padding: 15px;
            display: inline-block;
            border: 3px solid black;
          }
          /*
          jspm-export button[data-selected="true"]{
            border: none;
            background: #FFC95C;
            display: block;
            width: 100%;
            box-shadow: 2px 2px 24px 0px #00000026;
          }
          
          jspm-export button:before {
              content: '';
              width: 20px;
              height: 20px;
              background: url('/images/icon-add.svg') center center no-repeat;
              color: black;
              display: inline-block;
              margin: 10px;
          }
          jspm-export button[data-selected="true"]:before {
            background: url('/images/icon-check.svg') center center no-repeat;
          }
          */
          `}
            </style>
          </Helmet>
        </jspm-hero>
      );
    } else {
      return <div></div>;
    }
  }
}

export { Hero };
