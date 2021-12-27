import { jsx, Component, Helmet } from "nano-jsx";

export class Readme extends Component {
  render() {
    return jsx`
      <jspm-package-readme>
        <package-readme-placeholder></package-readme-placeholder>
      </jspm-package-readme>
    `;
  }
}
