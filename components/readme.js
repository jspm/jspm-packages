import { jsx } from "nano-jsx";

export const Readme = ({ __html }) => {
  return jsx`
    <jspm-package-readme dangerouslySetInnerHTML=${{
      __html,
    }} />
    `;
};
