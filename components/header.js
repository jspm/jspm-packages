import { jsx, Helmet } from "nano-jsx";

export const Header = () => {
  return jsx`
    <div>
    <div class="header-header">
      <div class="header-container">
        <div class="header-logo">
          <img
            alt="image"
            src="https://jspm-registry.teleporthq.app/playground_assets/jspm.png"
            class="header-image"
          />
          <h1 class="jspmheaderlogo"><span>JSPM</span></h1>
        </div>
        <div class="header-search">
          <input
            type="text"
            autofocus="true"
            placeholder="Search for packages..."
            autocomplete="on"
            class="header-textinput search_input"
          />
          <button class="search_button"><span>Search</span></button>
        </div>
      </div>
      <div class="header-container1">
        <span class="header-text1"><span>Generator</span></span>
        <span class="header-text2"><span>Docs</span></span>
        <span class="header-text3"><span>Faq</span></span>
        <img
          alt="image"
          src="https://jspm-registry.teleporthq.app/playground_assets/github.svg"
          class="header-image1"
        />
      </div>
    </div>
    <${Helmet}>
        <style>
        .search_button {
            color: var(--dl-color-gray-black);
            display: inline-block;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            height: 40px;
            display: flex;
            align-items: center;
            border-width: 0px;
            padding-left: var(--dl-space-space-oneandhalfunits);
            padding-right: var(--dl-space-space-oneandhalfunits);
            background-color: var(--dl-color-primary-js-primary);
            border-top-left-radius: none;
            border-top-right-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: none;
            border-bottom-right-radius: var(--dl-radius-radius-radius8);
        }
          
          .search_input {
            color: var(--dl-color-gray-black);
            cursor: auto;
            padding: 0.5rem 1rem;
            border-color: var(--dl-color-gray-black);
            border-width: 1px;
            background-color: var(--dl-color-gray-white);
            height: 40px;
            padding: var(--dl-space-space-halfunit);
            max-width: 500px;
            border-color: var(--dl-color-jspm-placeholder);
            background-color: var(--dl-color-jspm-placeholder);
            border-top-left-radius: var(--dl-radius-radius-radius8);
            border-bottom-left-radius: var(--dl-radius-radius-radius8);
          }

        .header-header {
            width: 100%;
            display: flex;
            margin-top: var(--dl-space-space-oneandhalfunits);
            align-items: center;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
            flex-direction: row;
            justify-content: space-between;
          }
          .header-container {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: center;
          }
          .header-logo {
            display: flex;
            align-items: center;
            margin-right: var(--dl-space-space-unit);
            flex-direction: row;
            justify-content: center;
          }
          .header-image {
            width: 32px;
            object-fit: cover;
          }
          .header-search {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: center;
          }
          .header-textinput {
            width: 300px;
          }
          .header-container1 {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: center;
          }
          .header-text1 {
            margin-left: var(--dl-space-space-unit);
            margin-right: var(--dl-space-space-unit);
          }
          .header-text2 {
            margin-left: var(--dl-space-space-unit);
            margin-right: var(--dl-space-space-unit);
          }
          .header-text3 {
            margin-left: var(--dl-space-space-unit);
            margin-right: var(--dl-space-space-unit);
          }
          .header-image1 {
            width: 35px;
            object-fit: cover;
          }
          @media(max-width: 767px) {
            .header-header {
              flex-wrap: wrap;
              flex-direction: column;
            }
            .header-container {
              margin-bottom: var(--dl-space-space-unit);
            }
          }
          @media(max-width: 479px) {
            .header-container {
              flex-wrap: wrap;
            }
            .header-logo {
              margin-left: var(--dl-space-space-unit);
              margin-right: var(--dl-space-space-unit);
              margin-bottom: var(--dl-space-space-unit);
            }
            .header-search {
              margin-bottom: var(--dl-space-space-unit);
            }
          }
        </style>
    </${Helmet}>
  </div>
    `;
};
