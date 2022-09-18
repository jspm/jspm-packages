/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Score } from "#score";

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="32"
      height="32"
      viewBox="0 0 172 172"
      style=" fill:#000000;"
    >
      <g
        fill="none"
        fill-rule="nonzero"
        stroke="none"
        stroke-width="1"
        stroke-linecap="butt"
        stroke-linejoin="miter"
        stroke-miterlimit="10"
        stroke-dasharray=""
        stroke-dashoffset="0"
        font-family="none"
        font-weight="none"
        font-size="none"
        text-anchor="none"
        style="mix-blend-mode: normal"
      >
        <path d="M0,172v-172h172v172z" fill="none"></path>
        <g>
          <path
            d="M86,14.33333c-39.5815,0 -71.66667,32.08517 -71.66667,71.66667c0,31.84508 20.78692,58.80608 49.52167,68.14067h44.29c28.73475,-9.33458 49.52167,-36.29558 49.52167,-68.14067c0,-39.5815 -32.08517,-71.66667 -71.66667,-71.66667z"
            fill="#ffc95dff"
          ></path>
          <path
            d="M132.58333,84.20833c0,-10.38092 -3.13542,-17.79483 -8.43875,-23.01933c3.38983,-6.02717 -1.0965,-18.189 -1.0965,-18.189c-8.95833,1.79167 -15.64842,5.375 -20.09892,8.514c-5.26033,-0.93525 -10.96142,-1.34733 -16.94917,-1.34733c-6.1275,0 -11.96475,0.42283 -17.32183,1.40825c-4.4505,-3.14975 -11.16208,-6.76892 -20.18133,-8.57492c0,0 -4.601,12.513 -0.91375,18.43983c-5.14567,5.21017 -8.16642,12.55958 -8.16642,22.7685c0,21.93717 13.89975,30.73783 32.99892,33.23183c-2.66242,3.12825 -4.33225,7.13083 -4.33225,11.55983v1.09292c-0.58408,0.16125 -1.18967,0.301 -1.84183,0.387c-3.96675,0.51242 -8.13775,0 -10.15158,-1.19325c-2.01383,-1.19325 -4.40392,-3.88075 -6.19558,-6.49658c-1.51217,-2.20733 -4.52575,-7.28133 -12.24067,-7.09142c-1.34733,-0.03583 -1.96367,1.22908 -1.79167,2.01742c0.15408,0.69517 0.76325,1.79167 3.21067,2.6875c2.45458,0.89942 3.80908,3.06017 5.15283,5.2245c1.49783,2.41517 1.49425,8.84367 9.1805,12.24067c5.4825,2.42592 10.707,2.1285 14.68092,1.17175l0.00358,11.46308c0,2.28975 -2.09625,4.03125 -4.26775,3.62992c6.966,2.3435 14.41217,3.53317 22.17725,3.53317c7.7615,0 15.20408,-1.18967 22.18083,-3.526c-2.1715,0.39775 -4.26417,-1.34375 -4.26417,-3.6335v-21.50717c0,-4.429 -1.66983,-8.43158 -4.33225,-11.55983c19.09917,-2.494 32.99892,-11.29467 32.99892,-33.23183z"
            fill="#ffffff"
          ></path>
          <path
            d="M53.75,64.5l13.75283,-4.58308c3.61917,-1.20758 4.41108,-6.03433 1.30792,-8.24883l-0.13258,-0.09317c-8.59642,1.57667 -15.92792,4.62608 -21.09867,9.86492c1.1395,1.83467 3.04942,3.06017 6.1705,3.06017z"
            fill="#ffffff"
          ></path>
          <path
            d="M102.81658,51.60717c-3.14617,2.23242 -2.34708,7.12008 1.3115,8.33842l13.66325,4.55442c3.27158,0 5.23525,-1.32583 6.35325,-3.311c-5.23167,-5.15283 -12.58825,-8.1485 -21.19542,-9.67858c-0.04658,0.03225 -0.08958,0.0645 -0.13258,0.09675z"
            fill="#ffffff"
          ></path>
          <path
            d="M86,111.08333c-5.46458,0 -10.2985,2.49758 -13.58442,6.35683c4.3,0.56258 8.858,0.80983 13.58442,0.80983c4.72642,0 9.28442,-0.24725 13.58442,-0.80983c-3.28592,-3.85925 -8.11983,-6.35683 -13.58442,-6.35683z"
            fill="#ffffff"
          ></path>
        </g>
      </g>
    </svg>
  );
}

function PackageTitle({ name, version, versions }) {
  if (versions?.length > 0) {
    return (
      <Fragment>
        <h2>{name}</h2>
        <details>
          <summary>{version}</summary>
          <ul>
            {versions?.map((v) => (
              <li data-active={v === version}>
                <a href={`/package/${name}@${v}`}>{v}</a>
              </li>
            ))}
          </ul>
        </details>
      </Fragment>
    );
  }
  return (
    <Fragment>
      <h2>{name}</h2>
      <h3>v{version}</h3>
    </Fragment>
  );
}

function PackageLinks({ homepage, repository, bugs, npm }) {
  const { hostname } = repository ? new URL(repository) : { hostname: "" };
  const isGithubRepository = hostname === "github.com";

  return (
    <ul>
      {homepage && (
        <li>
          <a
            href={homepage}
            class="link-homepage"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="32"
              height="32"
              viewBox="0 0 172 172"
              style=" fill:#000000;"
            >
              <g
                fill="none"
                fill-rule="nonzero"
                stroke="none"
                stroke-width="1"
                stroke-linecap="butt"
                stroke-linejoin="miter"
                stroke-miterlimit="10"
                stroke-dasharray=""
                stroke-dashoffset="0"
                font-family="none"
                font-weight="none"
                font-size="none"
                text-anchor="none"
                style="mix-blend-mode: normal"
              >
                <path d="M0,172v-172h172v172z" fill="none"></path>
                <g>
                  <path
                    d="M2.65391,86c0,-46.02344 37.32266,-83.34609 83.34609,-83.34609c46.02344,0 83.34609,37.32266 83.34609,83.34609c0,46.02344 -37.32266,83.34609 -83.34609,83.34609c-46.02344,0 -83.34609,-37.32266 -83.34609,-83.34609z"
                    fill="#ffc95dff"
                  ></path>
                  <path
                    d="M137.09609,69.47188l-50.42422,-25.16172c-0.43672,-0.20156 -0.90703,-0.20156 -1.34375,0l-50.45781,25.16172c-0.57109,0.26875 -0.90703,0.80625 -0.90703,1.44453v9.94375c0,0.5375 0.26875,1.04141 0.73906,1.34375c0.47031,0.30234 1.04141,0.33594 1.51172,0.10078l49.78594,-24.85938l49.75234,24.85938c0.20156,0.10078 0.43672,0.16797 0.67188,0.16797c0.30234,0 0.60469,-0.06719 0.83984,-0.23516c0.47031,-0.30234 0.73906,-0.80625 0.73906,-1.34375v-10.01094c0,-0.60469 -0.33594,-1.17578 -0.90703,-1.41094z"
                    fill="#ffffff"
                  ></path>
                  <path
                    d="M127.82422,82.57344l-41.82422,-20.82812l-41.82422,20.82812v38.63281h23.17969v-29.62969h15.95703v29.62969h44.51172z"
                    fill="#ffffff"
                  ></path>
                  <path
                    d="M88.58672,91.57656h10.75v10.75h-10.75z"
                    fill="#ea4949"
                  ></path>
                </g>
              </g>
            </svg>
          </a>
        </li>
      )}
      {repository && (
        <li>
          <a
            href={repository}
            class="link-repository"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {isGithubRepository ? (
              <GithubIcon />
            ) : (
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAABY0lEQVRIie2Wu0oDQRSGv4hgbZ0NmBBFwcZXsbO0FPEdfJUEb2GTymhhayFY2ogv4HoLaiwSIaLFnMCYzGx2wlmxyAfDwJl/5p/ZOcxZmPEPiIAY6EprAcuKeu8iHeB7pHWAooLeSywTT2ViEWhLrKGg99KVSfZuSxJ7U9Az5zHuSV9wjH06Yv0Ufd8R83KM2e0Z5v5KwLnEjgL1hyHGFSBhPFnugXKAPvHoU1kCatYiNYml6Q9E+5VBP5GhcRbWRXs7SehLrmnZkv5SY7GsJ97EZPwA2MjbuApsAxeWbl/D1DZeBXYwSXMNvPI7gz+APS1T29jVEqAJ7AKLIYvOB2h7mIpzBdwAd8BziFkow9Ot5WliUwbqlnGdKV6hUCrAA0pPYAgnYtTGPPoRpgD4ioQaT4zX10hijxoGvidzQXq7vhZGxnKhhf9Tx3karwAvuH/eqnkag7nfBvAuLf4L0xnq/AA2L4/r80ek+wAAAABJRU5ErkJggg==" />
            )}
          </a>
        </li>
      )}
      {bugs && (
        <li>
          <a
            href={bugs}
            class="link-issues"
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAC3UlEQVRYhcWXy29MYRjGf+93aEQqSpNSt4VeqI1ozEzbhI0WEenGQoozhIWFxMLGdhY2+Bvq0imVsJogtLosHRWxcStlQYhIKEJD53yvxfQ2THvOmaF9Vt/5zvs+zy/n9p1PKEB6/9ByNFODMaWoVZTvqDcoDV0fwnpJoEBNGB682oHVNqAZqMzvJu9Q24NwhUh1t0jCFg2gA/FmrJ4BNgWBnaInQEJiyasFAWg6Xg7aCewMGfynbuKVuNLU/ikwgKbjtaApYF2R4eMaQm2rNFx64gug/fs3IKYPKPMxzSBcQ8WA7gEcn/rPOE6TbL7wbOqkyQlPx8sRkwoQDqLHJZpsk1jHXoQTvvWwBM+m9O6RpdMCjN3zqgBmoHIr73jmphqcXxfzAmi/u4swD5zMy0wxHg3cB7u1/0BLDoBqwiCcCmFSnETOqibMBAADL7cT/j0vRhtJv26eBFDZN4vhY7JtkwAi22Y9X8heAX1woBLVFbMOAKu0z60wqLN2DsKzmidVBs8unjMAQ5nxr/rfDI75MmfplmGDylBBzV6mdGKssqggj4wOCYCm3bfAypDt5/jx5iiLagVvpB1wQ/a/kVhyzfgz0BuyGeAwC1e/xxt5X0A4iNyBiQ+RdhUAAKBAxrcqn6ztmgSIVHeDPgppcZJochnRZCUix0J1Cg+JVfdmh2PStLsDCLauK8+kIVmXM5V2B4DNgfqNtEikY8otACSWvA3cDGQgMpxn9mvA3tR4eA4AAF6JC/LC30Wjev/g1omjgXgU2BIgfpD55mAOz1/W99w6DH3AEh+zn0AKREFbgQU+9Z8x2iiRzuczAgBo/74acFII631Mg+olllZpTD7980TetUAaLr9g1GsCrhcdLZKixInkC4egWzPV0yj1IaMfg56UWOeNGfmCOKkmTPYfzrYhtDD9Z/stIj1Y20WsuvefbE7zAvW5FThSi7HZBUmcbzhmUOrPfwzr9Ruoe+916F7M1AAAAABJRU5ErkJggg==" />
          </a>
        </li>
      )}
    </ul>
  );
}

function PackageFeatures({ features }) {
  return (
    <section>
      <ul>
        {Object.entries(features).map(([feature, supported]) => (
          <li data-feature-supported={supported}>{feature}</li>
        ))}
      </ul>
    </section>
  );
}

function PackageHighlights({
  createdTime,
  created,
  updatedTime,
  updated,
  downloads,
  score,
  license,
  types,
}) {
  return (
    <ul>
      {created && (
        <li>
          <span>Created</span> <time datetime={createdTime}>{created}</time>
        </li>
      )}
      {updated && (
        <li>
          <span>Published</span> <time datetime={updatedTime}>{updated}</time>
        </li>
      )}
      {downloads && (
        <li>
          <span>Downloads</span> <span>{downloads}</span>
        </li>
      )}
      {score && (
        <li>
          <span>
            Score{" "}
            <a
              href="https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-info-circle"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <circle cx="12" cy="12" r="9"></circle>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                <polyline points="11 12 12 12 12 16 13 16"></polyline>
              </svg>
            </a>
          </span>{" "}
          <div class="package-scores">
            <jspm-packages-score title="Maintenance">
              <Score
                value={
                  parseFloat(Number(score.detail.maintenance)).toFixed(2) * 100
                }
              />
              <span>M</span>
            </jspm-packages-score>
            <jspm-packages-score title="Popularity">
              <Score
                value={
                  parseFloat(Number(score.detail.popularity)).toFixed(2) * 100
                }
              />
              <span>P</span>
            </jspm-packages-score>
            <jspm-packages-score title="Quality">
              <Score
                value={
                  parseFloat(Number(score.detail.quality)).toFixed(2) * 100
                }
              />
              <span>Q</span>
            </jspm-packages-score>
            <jspm-packages-score title="Final">
              <Score value={parseFloat(Number(score.final)).toFixed(2) * 100} />
              <span>F</span>
            </jspm-packages-score>
          </div>
        </li>
      )}
      {license && (
        <li>
          <span>License</span> <span>{license}</span>
        </li>
      )}
      {types && (
        <li>
          <img height="20" src="/icon-typescript-logo.svg" />
        </li>
      )}
    </ul>
  );
}

type Prop = {
  name: string;
  version: string;
  versions?: string[];
  license?: string;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  createdTime: string;
  created: string;
  updated: string;
  updatedTime: string;
  types?: string;
  description: string;
  links: {
    npm: string;
    homepage: string;
    repository: string;
    bugs: string;
  };
  features: Record<string, boolean>;
  downloads: string;
};

function Hero({
  createdTime,
  created,
  downloads,
  name,
  version,
  versions,
  license,
  score,
  updated,
  updatedTime,
  types,
  description,
  features,
  links,
}: Prop) {
  return (
    <Fragment>
      <div class="package-stamp">
        <div>
          <jspm-packages-package-title>
            <PackageTitle name={name} version={version} versions={versions} />
          </jspm-packages-package-title>
          <jspm-packages-package-links>
            <PackageLinks
              homepage={links?.homepage}
              repository={links?.repository}
              bugs={links?.bugs}
              npm={links?.npm}
            />
          </jspm-packages-package-links>
        </div>
        {features && (
          <jspm-packages-package-features>
            <PackageFeatures features={features} />
          </jspm-packages-package-features>
        )}
      </div>
      <div>
        <jspm-packages-package-highlights>
          <PackageHighlights
            createdTime={createdTime}
            created={created}
            updatedTime={updatedTime}
            updated={updated}
            downloads={downloads}
            score={score}
            license={license}
            types={types}
          />
        </jspm-packages-package-highlights>
      </div>
      <p class="package-description">{description}</p>
    </Fragment>
  );
}

export { Hero };
