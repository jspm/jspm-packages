import { jsx, Suspense, Component } from "nano-jsx";

export class FeaturedPackages extends Component {
  static fetchPackages = () => [];

  render() {
    return jsx`
        <${Suspense} cache packages=${
      FeaturedPackages.fetchPackages || fetchPackages
    } fallback=${jsx`<div>Loading....</div>`}>
            <${PackageList} />
        </${Suspense}>`;
  }
}

const PackageList = async ({ packages = [] }) => {
  return jsx`
    <ul>
       ${packages.map((item) => {
         //  console.log(item.package.name);
         return jsx`<li>Some name </li>`;
       })}
    </ul>
    `;
};
