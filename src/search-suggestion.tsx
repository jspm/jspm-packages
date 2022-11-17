/** @jsx h */
import { Fragment, h } from "nano-jsx";
import { Icon, IconType } from "#icon";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(dayjsPluginRelativeTime);

function PackageLinks({ homepage, repository, issues }) {
  const isGithubRepository =
    repository && new URL(repository).hostname === "github.com";

  return (
    <ul>
      {homepage && (
        <li>
          <a href={homepage} class="link-homepage">
            <Icon icon={IconType.HOME} />
          </a>
        </li>
      )}
      {repository && (
        <li>
          <a href={repository} class="link-repository">
            {isGithubRepository ? (
              <Icon icon={IconType.GITHUB} />
            ) : (
              <Icon icon={IconType.PULL_REQUEST} />
            )}
          </a>
        </li>
      )}
      {issues && (
        <li>
          <a href={issues} class="link-issues">
            <Icon icon={IconType.ISSUE} />
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
