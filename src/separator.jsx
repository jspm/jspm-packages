import { h, Helmet } from "nano-jsx";

export function Seperator() {
  return (
    <div>
      <div class="seperator-seperator">
        <div class="seperator-container"></div>
        <div class="seperator-container1"></div>
        <div class="seperator-container2"></div>
        <div class="seperator-container3"></div>
      </div>
      <Helmet>
        <style data-component-name="seperator">{`
        .seperator-seperator {
            flex: 0 0 auto;
            width: 100%;
            height: auto;
            display: flex;
            margin-top: var(--dl-space-space-unit);
            align-items: center;
            margin-bottom: var(--dl-space-space-unit);
          }
          .seperator-container {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-500);
            border-top-left-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: var(--dl-radius-radius-radius8);
          }
          .seperator-container1 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-400);
          }
          .seperator-container2 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-300);
          }
          .seperator-container3 {
            flex: 0 0 auto;
            width: 50px;
            height: 8px;
            display: flex;
            align-items: flex-start;
            background-color: var(--dl-color-jspm-200);
            border-top-right-radius: var(--dl-radius-radius-radius8);
            border-bottom-right-radius: var(--dl-radius-radius-radius8);
          }
        `}</style>
      </Helmet>
    </div>
  );
}
