import {
  jsx,
  Helmet,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.27/lib/index.js";

function Footer() {
  return jsx`
    <div class="footer-container">
      <footer class="footer-footer">
        <div class="footer-container1">
          <img
            alt="image"
            src="https://jspm-registry.teleporthq.app/playground_assets/jspm.png"
            class="footer-image"
          />
          <div class="footer-container2">
            <div class="footer-product-container">
              <span class="footer-text">Docs</span>
              <span class="footer-text01">Get Started</span>
              <span class="footer-text02">Workspace</span>
              <span class="footer-text03">.npmrc</span>
            </div>
            <div class="footer-company-container">
              <span class="footer-text04">Community</span>
              <span class="footer-text05">Getting Started</span>
              <span class="footer-text06">Workspace</span>
              <span class="footer-text07">.npmrc</span>
            </div>
            <div class="footer-company-container1">
              <span class="footer-text08">Contributing</span>
              <span class="footer-text09">Getting Started</span>
              <span class="footer-text10">Workspace</span>
              <span class="footer-text11">.npmrc</span>
            </div>
          </div>
        </div>
        <div class="footer-separator"></div>
        <div class="footer-copyright">
          <span class="footer-text12"><span>Copyright © 2015-2021</span></span>
          <div class="footer-socials">
            <span class="footer-text14">Follow Us</span>
            <div class="footer-icon-group">
              <img
                alt="image"
                src="https://jspm-registry.teleporthq.app/playground_assets/github.svg"
                class="footer-image1"
              />
              <svg viewBox="0 0 950.8571428571428 1024" class="footer-icon">
                <path
                  d="M925.714 233.143c-25.143 36.571-56.571 69.143-92.571 95.429 0.571 8 0.571 16 0.571 24 0 244-185.714 525.143-525.143 525.143-104.571 0-201.714-30.286-283.429-82.857 14.857 1.714 29.143 2.286 44.571 2.286 86.286 0 165.714-29.143 229.143-78.857-81.143-1.714-149.143-54.857-172.571-128 11.429 1.714 22.857 2.857 34.857 2.857 16.571 0 33.143-2.286 48.571-6.286-84.571-17.143-148-91.429-148-181.143v-2.286c24.571 13.714 53.143 22.286 83.429 23.429-49.714-33.143-82.286-89.714-82.286-153.714 0-34.286 9.143-65.714 25.143-93.143 90.857 112 227.429 185.143 380.571 193.143-2.857-13.714-4.571-28-4.571-42.286 0-101.714 82.286-184.571 184.571-184.571 53.143 0 101.143 22.286 134.857 58.286 41.714-8 81.714-23.429 117.143-44.571-13.714 42.857-42.857 78.857-81.143 101.714 37.143-4 73.143-14.286 106.286-28.571z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <${Helmet}> 
        <style data-page-name="footer">
        .footer-container {
            width: 100%;
            display: flex;
            position: relative;
            align-items: flex-start;
            flex-direction: column;
            background-color: var(--dl-color-jspm-footer);
          }
          .footer-footer {
            width: 100%;
            display: flex;
            max-width: var(--dl-size-size-maxwidth);
            align-items: center;
            padding-top: var(--dl-space-space-twounits);
            padding-left: var(--dl-space-space-threeunits);
            padding-right: var(--dl-space-space-threeunits);
            flex-direction: column;
            padding-bottom: var(--dl-space-space-twounits);
            justify-content: space-between;
            background-color: var(--dl-color-gray-900);
            margin-top: var(--dl-space-space-unit);
          }
          .footer-container1 {
            width: 100%;
            display: flex;
            align-items: flex-start;
            flex-direction: row;
            justify-content: center;
          }
          .footer-image {
            width: 45px;
            object-fit: cover;
            margin-right: var(--dl-space-space-oneandhalfunits);
          }
          .footer-container2 {
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: row;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .footer-product-container {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text01 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text02 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text03 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-company-container {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            margin-right: 5rem;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text04 {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text05 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text06 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text07 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-company-container1 {
            flex: 0 0 auto;
            display: flex;
            align-items: flex-start;
            flex-direction: column;
            justify-content: flex-start;
          }
          .footer-text08 {
            font-weight: 700;
            margin-bottom: var(--dl-space-space-oneandhalfunits);
          }
          .footer-text09 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text10 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-text11 {
            margin-bottom: var(--dl-space-space-unit);
          }
          .footer-separator {
            width: 100%;
            height: 1px;
            margin-top: var(--dl-space-space-twounits);
            margin-bottom: var(--dl-space-space-twounits);
            background-color: var(--dl-color-gray-900);
          }
          .footer-copyright {
            flex: 0 0 auto;
            width: 100%;
            height: auto;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
          }
          .footer-text12 {
            align-self: center;
          }
          .footer-socials {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: flex-start;
          }
          .footer-text14 {
            font-style: normal;
            font-weight: 400;
            margin-right: var(--dl-space-space-unit);
            margin-bottom: 0px;
          }
          .footer-icon-group {
            display: flex;
            align-items: center;
            flex-direction: row;
            justify-content: space-between;
          }
          .footer-image1 {
            width: var(--dl-size-size-xsmall);
            height: var(--dl-size-size-xsmall);
            object-fit: cover;
            margin-right: var(--dl-space-space-unit);
          }
          .footer-icon {
            width: var(--dl-size-size-xsmall);
            height: var(--dl-size-size-xsmall);
            margin-left: 0px;
            margin-right: 0px;
          }
          
          @media(max-width: 991px) {
            .footer-footer {
              flex-direction: column;
            }
            .footer-container2 {
              margin-right: var(--dl-space-space-fourunits);
            }
            .footer-product-container {
              margin-right: var(--dl-space-space-fourunits);
            }
          }
          @media(max-width: 767px) {
            .footer-footer {
              padding-left: var(--dl-space-space-twounits);
              padding-right: var(--dl-space-space-twounits);
            }
            .footer-container1 {
              align-items: center;
              flex-direction: column;
              justify-content: space-between;
            }
            .footer-image {
              display: none;
            }
            .footer-container2 {
              margin-right: var(--dl-space-space-fourunits);
            }
            .footer-product-container {
              margin-right: var(--dl-space-space-fourunits);
            }
          }
          @media(max-width: 479px) {
            .footer-footer {
              padding: var(--dl-space-space-unit);
            }
            .footer-container1 {
              align-items: center;
              flex-direction: column;
            }
            .footer-container2 {
              margin-right: 0px;
            }
            .footer-text12 {
              text-align: center;
            }
          }          
        </style>
    </${Helmet}>
    `;
}

export { Footer };
