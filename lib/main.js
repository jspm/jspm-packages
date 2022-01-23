import h from "solid-js/h";
import { HydrationScript } from "solid-js/web";
function App() {
    return(/*#__PURE__*/ h("html", {
        lang: "en"
    }, /*#__PURE__*/ h("head", null, /*#__PURE__*/ h("title", null, "🔥 Solid SSR 🔥"), /*#__PURE__*/ h("meta", {
        charset: "UTF-8"
    }), /*#__PURE__*/ h("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0"
    }), /*#__PURE__*/ h("link", {
        rel: "stylesheet",
        href: "/styles.css"
    }), /*#__PURE__*/ h(HydrationScript, null)), /*#__PURE__*/ h("body", null)));
}
export default App;


//# sourceMappingURL=main.js.map