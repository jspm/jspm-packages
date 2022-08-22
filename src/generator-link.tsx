/** @jsx h */
import { h } from "nano-jsx";

type Prop = {
  generatorHash: string;
};

function GeneratorLink({ generatorHash }: Prop) {
  return (
    <a target="_blank" href={`https://generator.jspm.io/${generatorHash}`}>
      Generator
    </a>
  );
}

export { GeneratorLink };
export type { Prop as GeneratorLinkProp };
