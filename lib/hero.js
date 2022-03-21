function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _asyncToGenerator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
/** @jsx h */ import nano, { Component, h } from "nano-jsx";
const { Helmet  } = nano;
class Hero extends Component {
    didMount() {
        if (!this.generatorHash) {
            this.generateHash();
        }
    }
    render() {
        if (this.generatorHash) {
            const { name , description , version , updated , types  } = this.props;
            const selectedImports = Object.keys(this.exports).filter((subpath)=>this.exports[subpath] === true
            );
            const numSelectedImports = selectedImports.length;
            const depText = `${numSelectedImports} ${numSelectedImports > 1 ? "dependencies" : "dependency"}`;
            return /*#__PURE__*/ h("jspm-hero", null, /*#__PURE__*/ h("jspm-hero-main", null, /*#__PURE__*/ h("jspm-highlight", null, /*#__PURE__*/ h("h2", null, name), /*#__PURE__*/ h("jspm-summary", null, /*#__PURE__*/ h("span", null, version), /*#__PURE__*/ h("span", null, "Published ", updated), types && /*#__PURE__*/ h("img", {
                height: "20",
                src: "/icon-typescript-logo.svg"
            })), /*#__PURE__*/ h("p", null, description)), /*#__PURE__*/ h("jspm-hero-cta", null, /*#__PURE__*/ h("jspm-hero-cta-generator", null, /*#__PURE__*/ h("p", null, "Customise importmap for selected ", depText, "."), /*#__PURE__*/ h("a", {
                target: "_blank",
                href: `https://generator.jspm.io/${this.generatorHash}`
            }, "JSPM Generator")))), /*#__PURE__*/ h("jspm-exports", null, /*#__PURE__*/ h("h3", null, "Package Exports"), /*#__PURE__*/ h("ul", null, Object.entries(this.exports).map(([subpath, selected])=>/*#__PURE__*/ h("li", {
                    "data-selected": selected
                }, /*#__PURE__*/ h("jspm-export", null, /*#__PURE__*/ h("button", {
                    type: "button",
                    class: "code",
                    onClick: this.toggleExportSelection,
                    value: subpath
                }, `${name}${subpath.slice(1)}`)))
            ))), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
                "data-component-name": "jspm-hero"
            }, `
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
          `)));
        } else {
            return /*#__PURE__*/ h("div", null);
        }
    }
    constructor(props){
        super(props);
        var _this = this;
        this.generateHash = _asyncToGenerator(function*() {
            if (typeof globalThis.document !== "undefined") {
                const { name , version  } = _this.props;
                const { getStateHash  } = yield import("./generate-statehash.js");
                const exports = Object.keys(_this.exports).filter((subpath)=>_this.exports[subpath] === true
                );
                const generatorHash = yield getStateHash({
                    name,
                    version,
                    exports
                });
                if (generatorHash) {
                    _this.generatorHash = generatorHash;
                    _this.update();
                }
            }
        });
        this.toggleExportSelection = (event)=>{
            event.preventDefault();
            console.log(event);
            this.exports[event.target.value] = !this.exports[event.target.value];
            console.log(event.target.value);
            this.generateHash();
            this.update();
        };
        const selectedExports = {};
        props.exports.forEach((subpath)=>selectedExports[subpath] = subpath === "."
        );
        this.exports = selectedExports;
    }
}
export { Hero };


//# sourceMappingURL=hero.js.map