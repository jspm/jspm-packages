import { hydrate, jsx } from "nano-jsx";
import { Header } from "../components/header.js";

hydrate(jsx`<${Header} />`, document.getElementById("app-header"));
