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
/** @jsx h */ import { Component, h } from "nano-jsx";
import { Package } from "./package.js";
class DomRoot extends Component {
    didMount() {
        if (!this.generatorHash) {
            this.generateHash();
        }
    }
    didUpdate() {
        localStorage.setItem('selectedExports', JSON.stringify(this.selectedExports));
        localStorage.setItem('selectedDeps', JSON.stringify(this.selectedDeps));
        localStorage.setItem('generatorHash', this.generatorHash);
    }
    render() {
        const { created , downloads , exports , features , license , links , maintainers , name , readme , updated , version ,  } = this.props;
        return /*#__PURE__*/ h(Package, {
            created: created,
            downloads: downloads,
            exports: exports,
            features: features,
            license: license,
            links: links,
            name: name,
            readme: readme,
            toggleExportSelection: this.toggleExportSelection,
            maintainers: maintainers,
            updated: updated,
            version: version,
            generatorHash: this.generatorHash,
            selectedDeps: this.selectedDeps,
            openImportmapDialog: this.openImportmapDialog,
            toggleImportmapDialog: this.toggleImportmapDialog
        });
    }
    constructor(props){
        super(props);
        this.selectedExports = {};
        this.selectedDeps = [];
        this.generatorHash = '';
        this.openImportmapDialog = false;
        var _this = this;
        this.generateHash = _asyncToGenerator(function*() {
            if (typeof globalThis.document !== "undefined") {
                const { getStateHash  } = yield import("./generate-statehash.js");
                const selectedDeps = _this.selectedDeps.map((subpath)=>[
                        subpath,
                        !!subpath
                    ]
                );
                const generatorHash = yield getStateHash({
                    selectedDeps
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
            this.selectedExports[event.target.value] = !this.selectedExports[event.target.value];
            console.log(event.target.value);
            this.selectedDeps = Object.keys(this.selectedExports).filter((subpath)=>this.selectedExports[subpath] === true
            );
            this.generateHash();
            console.log(JSON.stringify(this.selectedExports));
            this.update();
        };
        this.toggleImportmapDialog = (event)=>{
            event.preventDefault();
            this.openImportmapDialog = !this.openImportmapDialog;
            this.update();
        };
        // const selectedExports = {};
        // if (props.selectedExports) {
        //   Object.entries(props.selectedExports).forEach(([subpath, selected]) => {
        //     if (selected === true) {
        //       selectedExports[subpath] = selected;
        //     }
        //   });
        // }
        this.selectedExports = localStorage.getItem('selectedExports') ? JSON.parse(localStorage.getItem('selectedExports')) : this.selectedExports;
        this.selectedDeps = localStorage.getItem('selectedDeps') ? JSON.parse(localStorage.getItem('selectedDeps')) : this.selectedDeps;
        this.generatorHash = localStorage.getItem('generatorHash') || this.generatorHash;
    }
}
export { DomRoot };


//# sourceMappingURL=dom-root.js.map