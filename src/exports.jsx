import { h, Helmet } from "nano-jsx";

function ExportsValue({ value, name }) {
  if (typeof value === "string") {
    return <jspm-package-exports-target>{value}</jspm-package-exports-target>;
  } else if (Array.isArray(value)) {
    return value.map((target) => (
      <jspm-package-exports-target>{target}</jspm-package-exports-target>
    ));
  }
  return <Exports exports={value} name={name} />;
}

function getResolvedKey({ key, name }) {
  if (key === ".") {
    return name;
  }
  if (key.startsWith("./")) {
    return `${name}${key.slice(1)}`;
  }
  return name ? `${name}/${key}` : key;
}

function ExportsKey({ key, name }) {
  const resolvedKey = getResolvedKey({ key, name });
  return (
    <jspm-package-exports-key>
       {resolvedKey}
    </jspm-package-exports-key>
  );
}

function Exports({ exports, name }) {
  return (
    <jspm-package-exports>
      {Object.entries(exports).map(([key, value]) => key.endsWith('!cjs') || key === 'default' ? false : (
        <jspm-package-exports-entry>
          <details>
            <summary>
              <ExportsKey key={key} name={name} />
            </summary>
            <ExportsValue value={value} name={name} />
          </details>
        </jspm-package-exports-entry>
      ))}
      <Helmet>
        <style data-page="package-details">
          {`
          jspm-package-exports-entry {
              display: flex;
              display: block;
              padding-left: 10px;
          }
          jspm-package-exports-target{
              margin-left: 20px;
              display: block;
          }
          
          `}
        </style>
      </Helmet>
    </jspm-package-exports>
  );
}
export { Exports };
