function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
/** @jsx h */ import nano, { h } from "nano-jsx";
const { Helmet  } = nano;
function fromPkgStr(pkg) {
    const versionIndex = pkg.indexOf("@", 1);
    const name = pkg.slice(0, versionIndex);
    let subpathIndex = pkg.indexOf("/", versionIndex);
    if (subpathIndex === -1) {
        subpathIndex = pkg.length;
    }
    const version = pkg.slice(versionIndex + 1, subpathIndex);
    const subpath = "." + pkg.slice(name.length + version.length + 1);
    return {
        name,
        version,
        subpath
    };
}
function ImportMapDialog({ generatorHash ="" , dependencies =[] , open: dialogOpen , toggleImportmapDialog , toggleExportSelection ,  }) {
    const shouldOpen = dialogOpen && dependencies.length > 0;
    const open = shouldOpen ? {
        open: shouldOpen
    } : {};
    let map = {};
    dependencies.forEach((dependency)=>{
        const { name , version , subpath  } = fromPkgStr(dependency);
        if (typeof map[name] === "undefined") {
            map[name] = {
                [version]: []
            };
        }
        if (typeof map[name][version] === "undefined") {
            map[name][version] = [];
        }
        map[name][version] = [
            ...map[name][version],
            subpath
        ];
    });
    return /*#__PURE__*/ h("jspm-importmap-dialog", null, /*#__PURE__*/ h("dialog", _extends({}, open), /*#__PURE__*/ h("button", {
        class: "icon-close",
        onClick: toggleImportmapDialog
    }, "\u2715"), generatorHash && /*#__PURE__*/ h("h4", null, /*#__PURE__*/ h("a", {
        target: "_blank",
        href: `https://generator.jspm.io/${generatorHash}`
    }, "Customize importmap at JSPM Generator")), Object.entries(map).map(([name, versions])=>{
        const mapEntries = Object.entries(versions);
        if (mapEntries.length === 1) {
            const [version, subpaths] = mapEntries[0];
            return /*#__PURE__*/ h("details", null, /*#__PURE__*/ h("summary", null, /*#__PURE__*/ h("jspm-importmap-entry-summary", null, /*#__PURE__*/ h("jspm-importmap-entry-name", null, name), /*#__PURE__*/ h("jspm-importmap-entry-version", {
                class: "code"
            }, "v", version))), /*#__PURE__*/ h("ol", null, subpaths.map((subpath)=>/*#__PURE__*/ h("li", null, /*#__PURE__*/ h("jspm-importmap-entry", null, /*#__PURE__*/ h("jspm-importmap-entry-subpath", {
                    class: "code"
                }, subpath), /*#__PURE__*/ h("button", {
                    onClick: toggleExportSelection,
                    value: `${name}@${version}${subpath.slice(1)}`
                }, "\u2212 Remove")))
            )));
        }
        return /*#__PURE__*/ h("details", null, /*#__PURE__*/ h("summary", null, /*#__PURE__*/ h("jspm-importmap-entry-summary", null, name)), mapEntries.map(([version, subpaths])=>{
            return /*#__PURE__*/ h("details", null, /*#__PURE__*/ h("summary", null, /*#__PURE__*/ h("jspm-importmap-entry-version", {
                class: "code"
            }, "v", version)), /*#__PURE__*/ h("ol", null, subpaths.map((subpath)=>/*#__PURE__*/ h("li", null, /*#__PURE__*/ h("jspm-importmap-entry", null, subpath, /*#__PURE__*/ h("button", {
                    onClick: toggleExportSelection,
                    value: `${name}@${version}${subpath.slice(1)}`
                }, "\u2212 Remove")))
            )));
        }));
    })), /*#__PURE__*/ h(Helmet, null, /*#__PURE__*/ h("style", {
        "data-component-name": "jspm-importmap-dialog"
    }, `
          jspm-importmap-dialog dialog  {
            min-height: 100vh;
            min-width: 350px;
            background: white;
            left: unset;
            border: 0 solid black;

            
            border-radius: 0;
            /*background: linear-gradient(225deg, #e6e6e6, #ffffff);*/
            /*box-shadow:  -5px 5px 10px #d9d9d9, 5px -5px 10px #ffffff;*/
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
          }
          jspm-importmap-dialog dialog details  {
            margin: 15px;
            padding: 10px;
            -webkit-border-radius: 50px;
            border-radius: 10px;
            background: #ffffff;
            -webkit-box-shadow: 12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
            box-shadow: -12px 12px 24px #d9d9d9, -12px -12px 24px #ffffff;
          }
          jspm-importmap-dialog dialog details summary, jspm-importmap-entry-summary{
            padding: 10px;
            cursor: pointer;
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }
          jspm-importmap-dialog dialog details summary:after{
            content: '›';
            margin-right: 10px;
            font-weight: 700;
            font-size: 1.2rem;
          }
          jspm-importmap-dialog dialog details[open] summary:after{
            content: '⌄';
          }
          jspm-importmap-entry-name{
            font-weight: 700;
          }
          jspm-importmap-entry-version{
            margin-left: 10px;
          }
          jspm-importmap-dialog dialog .icon-close{
            background: white;
            border: 2px solid black;
            background: black;
            color: var(--dl-color-primary-js-primary);
            cursor: pointer;
          }
          jspm-importmap-entry{
            display: flex;
            align-content: center;
            justify-content: space-between;
            align-items: center;
          }
          jspm-importmap-entry button{
            background: white;
            border: none;
            cursor: pointer;
            color: crimson;
          }
          `)));
}
export { ImportMapDialog };


//# sourceMappingURL=importmap-dialog.js.map