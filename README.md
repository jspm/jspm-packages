# JSPM package website

# Develop
- `chomp serve --watch` or
- `chrome build --watch` and run [server.jsx](./server.jsx) in debug mode 

## Naming convention

Wrap uses of `JSX` component, with a valid [custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name) tag, composed of the `jspm-packages-{imports[subpath] || importmap.imports[subpath]}`.

Intention is to be compatible with API of compiling and using JSX Components to custom-elements
https://nanojsx.io/docs.html#:~:text=root%27))-,CustomElementsMode,-You%20can%20easily

```jsx

    import { Fragment, h } from "nano-jsx";
    import { Header } from "#header";
    import { Hero } from "#hero";

    function Home() {
        return (
            <Fragment>
            <jspm-packages-header>
                <Header search={false} />
            </jspm-packages-header>
            <main>
                <jspm-packages-hero>
                <Hero />
                </jspm-packages-hero>
            </main>
            </Fragment>
        );
    }

    export { Home };


// SSR Root / HTML document 
    <jspm-packages>
        render(<Home />
    </jspm-packages>
```
i.e. `@jspm/packages/header` || `#header` -> `jspm-packages-header`
# credit

<a href="https://www.flaticon.com/free-icons/external-link" title="external link icons">External link icons created by Moon.de - Flaticon</a>

<div> Icons made by <a href="https://www.flaticon.com/authors/dreamstale" title="Dreamstale"> Dreamstale </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com'</a></div>

<a target="_blank" href="https://icons8.com/icon/MDa4sU5BjhXS/search">search icon by Icons8</a>

<a href="https://icons8.com/icon/VXAuXEQhsYSM/attention">Attention icon by Icons8</a>
<a href="https://www.flaticon.com/free-icons/save" title="save icons">Save icons created by mavadee - Flaticon</a>
<div> Icons made by <a href="https://www.flaticon.com/authors/krishna-kanani" title="Krishna Kanani"> Krishna Kanani </a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com'</a></div>
<a href="https://www.flaticon.com/free-icons/download" title="download icons">Download icons created by Uniconlabs - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/copy" title="copy icons">Copy icons created by Pixel perfect - Flaticon</a>