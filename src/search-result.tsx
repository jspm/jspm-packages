/** @jsx h */
import { Fragment, h } from "nano-jsx";
import dayjs from "dayjs";
import dayjsPluginRelativeTime from "dayjs/plugin/relativeTime";
import { IconType, Icon } from "#icon";

dayjs.extend(dayjsPluginRelativeTime);

type Result = {
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

type Prop = { result: Result };


function PackageLinks({ homepage, repository, issues }) {
  const isGithubRepository =
    repository && new URL(repository).hostname === "github.com";

  return (
    <ul>
      {homepage && (
        <li>
          <a href={homepage} class="link-homepage">
            <Icon icon={IconType.HOME} color="#564d4d" />
          </a>
        </li>
      )}
      {repository && (
        <li>
          <a href={repository} class="link-repository">
            {isGithubRepository ? (
              <Icon icon={IconType.GITHUB} color="#564d4d" />
            ) : (
              <Icon icon={IconType.PULL_REQUEST} color="#564d4d" />
            )}
          </a>
        </li>
      )}
      {issues && (
        <li>
          <a href={issues} class="link-issues">
            <Icon icon={IconType.ISSUE} color="#564d4d" />
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
        <li>{score.final.toFixed(2)}</li>
        <li>
          Published <time datetime={updatedTime}>{updated}</time>
        </li>
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

function SearchResult({ result }: Prop) {
  const {
    score,
    package: { name, version, description, date, links, keywords, publisher },
  } = result;

  const updated = dayjs(date).fromNow();

  return (
    <article>
      <header>
        <h4>
          <a href={`/package/${name}`}>{name}</a>
        </h4>
      </header>

      <p>{description}</p>
      {/* <ul>
        {keywords.map((keyword) => (
          <li>
            <a href={`/search?keyword=${keyword}`}>#{keyword}</a>
          </li>
        ))}
      </ul> */}
      <jspm-packages-package-links>
          <PackageLinks
            homepage={links?.homepage}
            repository={links?.repository}
            issues={links?.bugs}
          />
      </jspm-packages-package-links>
      <footer>
        <jspm-packages-package-highlights>
          <PackageHighlights
            version={version}
            updatedTime={date}
            updated={updated}
            score={score}
            publisher={publisher}
          />
        </jspm-packages-package-highlights>
      </footer>
    </article>
  );
}

export { SearchResult };
export type { Result };
