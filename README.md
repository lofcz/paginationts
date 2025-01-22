[![NPM version][npm-image]][npm-url]

[npm-url]: https://npmjs.org/package/paginate-next
[npm-image]: http://img.shields.io/npm/v/paginate-next.svg

# PaginationTs

<img align="left" width="128" height="128" alt="PaginationTs Icon" src="https://raw.githubusercontent.com/lofcz/paginationts/refs/heads/master/icon.svg" />
TypeScript-based drop-in replacement of <a target="_blank" href="https://github.com/superRaytin/paginationjs">pagination.js</a> without JQuery dependency and with extra features. Check out the <a target="_blank" href="https://lofcz.github.io/paginationts/">demo</a> for an interactive playground. Supports both client & server-side pagination. Accessible, optionally headless, comes with rich API and callbacks interface. Fully typed, SPA ready.

<br/><br/>

## Getting Started

Install via npm:
```
npm install paginate-next --save
```

Or via CDN:
```html
<script src="https://unpkg.com/paginate-next/dist/paginationts.js" />
<link rel="stylesheet" href="https://unpkg.com/paginate-next/dist/pagination.css" />
```

Paginate:
```html
<div id="dataContainer"></div>
<div id="paginateContainer"></div>
```
```js
const paginationIns = pagination("#paginateContainer", {
    dataSource: [1, 2, 3, 4, 5, 6 ],
    callback: function(data, pagination) {
        var html = template(data);
        document.getElementById("dataContainer").html(html);
    }
})
```

That's it! ⭐

## License

MIT 💜
