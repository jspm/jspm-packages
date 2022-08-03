/** @jsx h */

import { h, Fragment } from "nano-jsx";
import { Header } from "@jspm/packages/header";
import { SearchResult } from "@jspm/packages/search-result";
import type { Result } from "@jspm/packages/search-result";

type Results = {
  objects: Result[];
  total: number;
  time: string;
};

type Prop = Results & {
  size: number;
  searchTerm: string;
  searchKeyword: string;
  page: number;
};

function NoResult() {
  return <h4>No matching result found.</h4>;
}

// function SearchResult({ result }: { result: Result }) {
//   const { score, package: {name, version, description, date, links} } = result;

//   const updated = dayjs(date).fromNow();
//   return (
//     <jspm-packages-hero>
//       <Hero
//         name={name}
//         version={version}
//         updated={updated}
//         description={description}
//         links={{...links, issues: links.bugs}}
//         updatedTime={date}
//         score={score}
//       />
//     </jspm-packages-hero>
//   );
//   // return (
//   //   <article>
//   //     <h4>
//   //       <a href={`/package/${name}@${version}`}>
//   //         {name} v{version}
//   //       </a>
//   //     </h4>
//   //     <p>{description}</p>

//   //     <time datetime={updated}>{updated}</time>
//   //   </article>
//   // );
// }

function SearchResults({
  objects,
  total,
  size,
  searchTerm,
  searchKeyword,
  page,
}: Prop) {
  const totalPages = Math.ceil(total / size);
  //const PAGE_NUMBER = page ? parseInt(page, 10) : 1;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const pageIndex = pages.indexOf(page);
  const previousPagesStartIndex = pageIndex - 2;
  const previousPagesStartIndexActual =
    previousPagesStartIndex < 0 ? 0 : previousPagesStartIndex;
  const pagination = pages.slice(
    previousPagesStartIndexActual,
    previousPagesStartIndexActual + 5
  );
  const paginationBaseURL = `/search?${searchKeyword ? "keyword" : "q"}=${
    searchKeyword || searchTerm
  }`;
  const previousPageLink =
    page > 1 ? `${paginationBaseURL}&page=${page - 1}` : "";
  const nextPageLink =
    page < totalPages ? `${paginationBaseURL}&page=${page + 1}` : "";

  return (
    <Fragment>
      <jspm-packages-importmap-dialog>
      </jspm-packages-importmap-dialog>
      <jspm-packages-header>
        <Header search />
      </jspm-packages-header>
      <main>
        {total === 0 ? (
          <jspm-packages-search-no-results>
            <NoResult />
          </jspm-packages-search-no-results>
        ) : (
          <Fragment>
            <p>
              Found <em>{total}</em> results for{" "}
              <strong>{searchKeyword || searchTerm}</strong>
            </p>
            {objects.map((result) => (
              <jspm-packages-search-result>
                <SearchResult result={result} />
              </jspm-packages-search-result>
            ))}
            <nav aria-label="pagination">
              <ol>
                {page > 1 && (
                  <li>
                    <a href={`${paginationBaseURL}&page=1`}>First</a>
                  </li>
                )}
                {previousPageLink && (
                  <li>
                    <a href={previousPageLink}>Prev</a>
                  </li>
                )}
                {pagination.map((pageNumber) => {
                  const isCurrentPage = pageNumber === page;
                  if (isCurrentPage) {
                    return <li>{pageNumber}</li>;
                  }
                  return (
                    <li>
                      <a href={`${paginationBaseURL}&page=${pageNumber}`}>
                        {pageNumber}
                      </a>
                    </li>
                  );
                })}
                {/* {pages.map((page) => (
                  <li>
                    <a href={`${paginationBaseURL}&page=${page}`}>{page}</a>
                  </li>
                ))} */}

                {nextPageLink && (
                  <li>
                    <a href={nextPageLink}>Next</a>
                  </li>
                )}
                {page < totalPages && (
                  <li>
                    <a href={`${paginationBaseURL}&page=${totalPages}`}>Last</a>
                  </li>
                )}
              </ol>
            </nav>
          </Fragment>
        )}
      </main>
    </Fragment>
  );
}

export { SearchResults };
export type { Results, Prop as SearchResultsProp };
