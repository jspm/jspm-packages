/** @jsx h */
import { Fragment, h } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(dayjsPluginRelativeTime);

function GithubIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
      ></path>
    </svg>
  );
}

function PackageLinks({ homepage, repository, issues }) {
  const isGithubRepository =
    repository && new URL(repository).hostname === "github.com";

  return (
    <ul>
      {homepage && (
        <li>
          <a href={homepage} class="link-homepage">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
          </a>
        </li>
      )}
      {repository && (
        <li>
          <a href={repository} class="link-repository">
            {isGithubRepository ? (
              <GithubIcon />
            ) : (
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAABY0lEQVRIie2Wu0oDQRSGv4hgbZ0NmBBFwcZXsbO0FPEdfJUEb2GTymhhayFY2ogv4HoLaiwSIaLFnMCYzGx2wlmxyAfDwJl/5p/ZOcxZmPEPiIAY6EprAcuKeu8iHeB7pHWAooLeSywTT2ViEWhLrKGg99KVSfZuSxJ7U9Az5zHuSV9wjH06Yv0Ufd8R83KM2e0Z5v5KwLnEjgL1hyHGFSBhPFnugXKAPvHoU1kCatYiNYml6Q9E+5VBP5GhcRbWRXs7SehLrmnZkv5SY7GsJ97EZPwA2MjbuApsAxeWbl/D1DZeBXYwSXMNvPI7gz+APS1T29jVEqAJ7AKLIYvOB2h7mIpzBdwAd8BziFkow9Ot5WliUwbqlnGdKV6hUCrAA0pPYAgnYtTGPPoRpgD4ioQaT4zX10hijxoGvidzQXq7vhZGxnKhhf9Tx3karwAvuH/eqnkag7nfBvAuLf4L0xnq/AA2L4/r80ek+wAAAABJRU5ErkJggg==" />
            )}
          </a>
        </li>
      )}
      {issues && (
        <li>
          <a href={issues} class="link-issues">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.55509 0.608766L0.161178 11.3368C-0.275824 12.07 0.252503 13 1.10608 13H13.8939C14.7475 13 15.2758 12.07 14.8388 11.3368L8.4449 0.608765ZM7.4141 1.12073C7.45288 1.05566 7.54712 1.05566 7.5859 1.12073L13.9798 11.8488C14.0196 11.9154 13.9715 12 13.8939 12H1.10608C1.02849 12 0.980454 11.9154 1.02018 11.8488L7.4141 1.12073ZM6.8269 4.48611C6.81221 4.10423 7.11783 3.78663 7.5 3.78663C7.88217 3.78663 8.18778 4.10423 8.1731 4.48612L8.01921 8.48701C8.00848 8.766 7.7792 8.98664 7.5 8.98664C7.2208 8.98664 6.99151 8.766 6.98078 8.48701L6.8269 4.48611ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08567 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0618 7.08567 9.72599 7.49989 9.72599C7.9141 9.72599 8.24989 10.0618 8.24989 10.476Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
          </a>
        </li>
      )}
    </ul>
  );
}

function PackageHighlights({
  version,
  updatedTime,
  updated,
  score,
  publisher,
}: {
  version: string;
  updatedTime: string;
  updated: any;
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  publisher: {
    username: string;
    email: string;
  };
}) {
  return (
    <Fragment>
      {/* <ul>
        <li>Score: {score.final.toFixed(2)}</li>
        <li>quality: {score.detail.quality.toFixed(2)}</li>
        <li>popularity: {score.detail.popularity.toFixed(2)}</li>
      </ul> */}
      <ul>
        <li>v{version}</li>
        <li>
          Published <time datetime={updatedTime}>{updated}</time>
        </li>
        <li>Score: {score.final.toFixed(2)}</li>
        {/* <li>
          Publisher:{" "}
          <a
            href={`https://www.npmjs.com/~${publisher.username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {publisher.username}
          </a>
        </li> */}
      </ul>
    </Fragment>
  );
}

type Suggestion = {
  package: {
    name: string;
    scope: string;
    version: string;
    description: string;
    keywords: string[];
    date: string;
    links: {
      npm?: string;
      homepage?: string;
      repository?: string;
      bugs?: string;
    };
    author?: {
      name: string;
      email?: string;
      username?: string;
      url?: string;
    };
    publisher: {
      username: string;
      email: string;
    };
    maintainers: {
      username: string;
      email: string;
    }[];
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
  flags?: {
    unstable?: boolean;
  };
};

type Prop = { suggestion: Suggestion };

function SearchSuggestion({ suggestion }: Prop) {
  const {
    score,
    package: { name, version, description, date, links, keywords, publisher },
  } = suggestion;

  const updated = dayjs(date).fromNow();

  return (
    <article>
      <header>
        <h5>
          <a href={`/package/${name}`}>{name}</a>
        </h5>

        <jspm-packages-package-links>
          <PackageLinks
            homepage={links?.homepage}
            repository={links?.repository}
            issues={links?.bugs}
          />
        </jspm-packages-package-links>
      </header>

      {/* <footer>
        <jspm-packages-package-highlights>
          <PackageHighlights
            version={version}
            updatedTime={date}
            updated={updated}
            score={score}
            publisher={publisher}
          />
        </jspm-packages-package-highlights>
      </footer> */}
    </article>
  );
}

export { SearchSuggestion };
export type { Suggestion };
