import { h, hydrate } from "nano-jsx";
import { Header } from "./header.js";

hydrate(<Header />, document.getElementById("app-header"));