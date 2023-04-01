/** @jsx h */
import { Fragment, h } from "nano-jsx";

type Prop = {
  examplesCodeBlockActiveTab: "sandbox-nft" | "sandbox-render" | "sandbox-code";
};

function ExampleSandbox({ examplesCodeBlockActiveTab }: Prop) {
  return (
    <Fragment>
      {examplesCodeBlockActiveTab === "sandbox-nft" && <figure id="_domtree" />}
      {examplesCodeBlockActiveTab === "sandbox-render" && (
        <iframe
          id="sandbox-render"
          frameborder="0"
          margin="0"
          padding="0"
          borderStyle="none"
          height="100%"
          width="100%"
          marginBottom="-5px"
          overflow="scroll"
        />
      )}
    </Fragment>
  );
}

export { ExampleSandbox };
export type { Prop as ExampleSandboxProp };
