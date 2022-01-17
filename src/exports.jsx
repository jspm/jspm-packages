import { h, Helmet } from "nano-jsx";

function ExportsValue({ value }) {
  if (typeof value === "string") {
    return <jspm-package-exports-target>{value}</jspm-package-exports-target>;
  } else if (Array.isArray(value)) {
    return value.map((target) => (
      <jspm-package-exports-target>{target}</jspm-package-exports-target>
    ));
  }
  return <Exports exports={value} />;
}

function ExportsKey({ key, name }) {
  return <jspm-package-exports-key>{name}/{key}</jspm-package-exports-key>;
}

function Exports({ exports, name }) {
  return Object.entries(exports).map(([key, value]) => (
    <jspm-package-exports>
      <jspm-package-exports-entry>
        <ExportsKey key={key} name={name} />
        <ExportsValue value={value} />
      </jspm-package-exports-entry>
      <Helmet>
        <style data-page="package-details">
          {`
          jspm-package-exports-entry {
              display: flex;
              display: block;
              border: 1px solid red;
          }
          jspm-package-exports-target{
              margin-left: 20px;
              display: block;
          }
          
          `}
        </style>
      </Helmet>
    </jspm-package-exports>
  ));
}
export { Exports };
