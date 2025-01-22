const paginationDataMap = new WeakMap();
function throwError(msg) {
    throw new Error('Pagination: ' + msg);
}
function isNumeric(n) {
    if (typeof n === 'number')
        return isFinite(n);
    if (typeof n === 'string') {
        return !isNaN(parseFloat(n)) && isFinite(+n);
    }
    return false;
}
function extend(target, ...sources) {
    let result = Object.assign({}, target);
    for (const src of sources) {
        if (src) {
            for (const key of Object.keys(src)) {
                const value = src[key];
                if (Array.isArray(value)) {
                    result[key] = [...value];
                }
                else {
                    result[key] = value;
                }
            }
        }
    }
    return result;
}
const Helpers = {
    isObject(obj) {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    },
    isArray(obj) {
        return Array.isArray(obj);
    },
    isString(obj) {
        return typeof obj === 'string';
    },
};
const defaultOptions = {
    dataSource: '',
    locator: 'data',
    totalNumberLocator: undefined,
    totalNumber: 0,
    pageNumber: 1,
    pageSize: 10,
    pageRange: 2,
    showPrevious: true,
    showNext: true,
    showPageNumbers: true,
    showNavigator: false,
    showGoInput: false,
    showGoButton: false,
    showSizeChanger: false,
    sizeChangerOptions: [10, 20, 50, 100],
    pageLink: '',
    prevText: '&lsaquo;',
    nextText: '&rsaquo;',
    ellipsisText: '...',
    goButtonText: 'Go',
    classPrefix: 'paginationjs',
    activeClassName: 'active',
    disableClassName: 'disabled',
    formatNavigator: 'Total <%= totalNumber %> items',
    formatGoInput: '<%= input %>',
    formatGoButton: '<%= button %>',
    position: 'bottom',
    autoHidePrevious: false,
    autoHideNext: false,
    triggerPagingOnInit: true,
    resetPageNumberOnInit: true,
    hideOnlyOnePage: false,
    callback: () => { },
};
function pagination(container, options, arg3) {
    if (typeof container === 'string') {
        const foundEl = document.querySelector(container);
        if (!foundEl) {
            throwError('Invalid selector or element not found.');
        }
        container = foundEl;
    }
    if (!container) {
        throwError('A valid container element is required.');
    }
    if (typeof options === 'string') {
        const instanceData = paginationDataMap.get(container);
        if (!instanceData || !instanceData.instance) {
            throwError('Pagination is not initialized on this element.');
        }
        const instance = instanceData.instance;
        switch (options) {
            case 'previous':
                instance.previous();
                return instance;
            case 'next':
                instance.next();
                return instance;
            case 'go':
                instance.go(arg3);
                return instance;
            case 'disable':
                instance.disable();
                return instance;
            case 'enable':
                instance.enable();
                return instance;
            case 'refresh':
                instance.refresh();
                return instance;
            case 'show':
                instance.show();
                return instance;
            case 'hide':
                instance.hide();
                return instance;
            case 'destroy':
                instance.destroy();
                return instance;
            case 'getSelectedPageNum':
            case 'getCurrentPageNum':
                return instance.model.pageNumber;
            case 'getTotalPage':
                return Math.ceil(instance.model.totalNumber / instance.model.pageSize);
            case 'getSelectedPageData':
            case 'getCurrentPageData':
                return instanceData.currentPageData || [];
            case 'isDisabled':
                return !!instance.model.disabled;
            default:
                throwError('Unknown action: ' + options);
        }
    }
    if (!Helpers.isObject(options)) {
        throwError('Illegal options (must be an object).');
    }
    const config = extend({}, defaultOptions, options);
    parameterChecker(config);
    const oldData = paginationDataMap.get(container);
    if (oldData && oldData.initialized && oldData.instance) {
        oldData.instance.destroy({ silent: true });
    }
    const newInstance = new PaginationInstance(container, config);
    newInstance.initialize();
    paginationDataMap.set(container, {
        initialized: true,
        instance: newInstance,
    });
    return newInstance;
}
export class PaginationInstance {
    constructor(container, attributes) {
        var _a, _b;
        this.isAsync = false;
        this.isDynamicTotalNumber = false;
        this.abortController = null;
        this.container = container;
        this.attributes = attributes;
        this.disabled = !!attributes.disabled;
        if (attributes.showSizeChanger && !attributes.sizeChangerOptions) {
            const currentPageSize = attributes.pageSize || 10;
            const defaultOptions = [5, 10, 20, 50, 100];
            if (!defaultOptions.includes(currentPageSize)) {
                defaultOptions.push(currentPageSize);
                defaultOptions.sort((a, b) => a - b);
            }
            this.attributes.sizeChangerOptions = defaultOptions;
        }
        this.model = {
            pageNumber: (_a = attributes.pageNumber) !== null && _a !== void 0 ? _a : 1,
            pageSize: (_b = attributes.pageSize) !== null && _b !== void 0 ? _b : 10,
            totalNumber: attributes.totalNumber,
        };
    }
    initialize() {
        this.callHook('beforeInit');
        let dataObj = paginationDataMap.get(this.container) || {};
        dataObj.destroyed = false;
        paginationDataMap.set(this.container, dataObj);
        this.parseDataSource(this.attributes.dataSource, (finalDataSource) => {
            var _a;
            if (Helpers.isArray(finalDataSource)) {
                this.model.totalNumber = this.attributes.totalNumber = finalDataSource.length;
            }
            this.isAsync = Helpers.isString(finalDataSource);
            this.isDynamicTotalNumber =
                this.isAsync && typeof this.attributes.totalNumberLocator === 'function';
            this.render(true);
            const updatedData = paginationDataMap.get(this.container) || {};
            updatedData.initialized = true;
            paginationDataMap.set(this.container, updatedData);
            if (this.attributes.triggerPagingOnInit) {
                const totalPage = Math.max(this.getTotalPage(), 1);
                let defaultPageNumber = (_a = this.attributes.pageNumber) !== null && _a !== void 0 ? _a : 1;
                if (this.isDynamicTotalNumber && this.attributes.resetPageNumberOnInit) {
                    defaultPageNumber = 1;
                }
                this.go(Math.min(defaultPageNumber, totalPage));
            }
        });
        this.callHook('afterInit');
    }
    parseDataSource(dataSource, done) {
        if (Helpers.isObject(dataSource)) {
            const filtered = this.filterDataWithLocator(dataSource);
            done(filtered);
        }
        else if (Helpers.isArray(dataSource)) {
            done(dataSource);
        }
        else if (typeof dataSource === 'function') {
            dataSource((arr) => {
                if (!Helpers.isArray(arr)) {
                    throwError('The data passed to the dataSource callback must be an array.');
                }
                this.parseDataSource(arr, done);
            });
        }
        else if (typeof dataSource === 'string') {
            done(dataSource);
        }
        else {
            throwError('Unexpected dataSource type');
        }
    }
    filterDataWithLocator(dataSource) {
        const locator = this.getLocator(this.attributes.locator);
        let filteredData;
        if (Helpers.isObject(dataSource)) {
            try {
                const parts = locator.split('.');
                let cur = dataSource;
                for (const p of parts) {
                    cur = cur[p];
                }
                filteredData = cur;
            }
            catch (e) {
            }
            if (!filteredData) {
                throwError('dataSource.' + locator + ' is undefined.');
            }
            if (!Helpers.isArray(filteredData)) {
                throwError('dataSource.' + locator + ' should be an Array.');
            }
            return filteredData;
        }
        return dataSource;
    }
    getLocator(locator) {
        if (typeof locator === 'string')
            return locator;
        if (typeof locator === 'function')
            return locator();
        throwError('"locator" is incorrect. Expect string or function type.');
    }
    render(isBoot) {
        const model = this.model;
        let el = model.el || document.createElement('div');
        const isForced = isBoot !== true;
        this.callHook('beforeRender', isForced);
        if (!model.el) {
            el.className = 'paginationjs';
            if (this.attributes.className) {
                el.classList.add(this.attributes.className);
            }
        }
        const currentPage = model.pageNumber || this.attributes.pageNumber || 1;
        const totalPage = this.getTotalPage();
        if (this.attributes.pageRange === null) {
            el.innerHTML = this.generateHTML({
                currentPage,
                pageRange: null,
                rangeStart: 0,
                rangeEnd: 0
            });
        }
        else {
            const pageRange = this.attributes.pageRange || 0;
            let rangeStart = currentPage - pageRange;
            let rangeEnd = currentPage + pageRange;
            if (rangeEnd > totalPage) {
                rangeEnd = totalPage;
                rangeStart = Math.max(totalPage - (pageRange * 2 - pageRange), 1);
            }
            if (rangeStart <= 1) {
                rangeStart = 1;
                rangeEnd = Math.min(1 + pageRange * 2 - pageRange, totalPage);
            }
            el.innerHTML = this.generateHTML({
                currentPage,
                pageRange,
                rangeStart,
                rangeEnd,
            });
        }
        if (this.attributes.hideOnlyOnePage) {
            el.style.display = totalPage <= 1 ? 'none' : '';
        }
        if (!model.el) {
            if (this.attributes.position === 'bottom') {
                this.container.appendChild(el);
            }
            else {
                this.container.insertBefore(el, this.container.firstChild);
            }
            this.model.el = el;
            this.observer();
        }
        this.callHook('afterRender', isForced);
        return el;
    }
    callHook(hookName, args = null) {
        if (typeof this.attributes[hookName] === 'function') {
            this.attributes[hookName](args);
        }
    }
    generateHTML(args) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const attrs = this.attributes;
        const currentPage = args.currentPage;
        const totalPage = this.getTotalPage();
        const pageSize = (_a = attrs.pageSize) !== null && _a !== void 0 ? _a : 10;
        const totalNumber = this.getTotalNumber();
        const classPrefix = (_b = attrs.classPrefix) !== null && _b !== void 0 ? _b : 'paginationjs';
        const disableCN = (_c = attrs.disableClassName) !== null && _c !== void 0 ? _c : '';
        const ulCN = (_d = attrs.ulClassName) !== null && _d !== void 0 ? _d : '';
        const prevCN = (_e = attrs.prevClassName) !== null && _e !== void 0 ? _e : '';
        const nextCN = (_f = attrs.nextClassName) !== null && _f !== void 0 ? _f : '';
        let html = '';
        if (typeof attrs.header === 'function') {
            html += attrs.header(currentPage, totalPage, totalNumber) || '';
        }
        else if (attrs.header) {
            html += attrs.header;
        }
        if (attrs.showNavigator && attrs.formatNavigator) {
            const rangeStart = (currentPage - 1) * pageSize + 1;
            const rangeEnd = Math.min(currentPage * pageSize, totalNumber);
            let navStr = this.replaceVariables(attrs.formatNavigator, {
                currentPage,
                totalPage,
                totalNumber,
                rangeStart,
                rangeEnd,
            });
            html += `<div class="${classPrefix}-nav J-paginationjs-nav">${navStr}</div>`;
        }
        const shouldShowPages = attrs.showPrevious || attrs.showPageNumbers || attrs.showNext;
        if (args.pageRange === null) {
            var tt = 0;
        }
        if (shouldShowPages) {
            html += `<div class="paginationjs-pages">`;
            html += ulCN ? `<ul class="${ulCN}">` : `<ul>`;
            if (attrs.showPrevious) {
                if (currentPage <= 1) {
                    if (!attrs.autoHidePrevious) {
                        html += `<li class="${classPrefix}-prev ${disableCN} ${prevCN}"><a>${attrs.prevText}</a></li>`;
                    }
                }
                else {
                    html += `<li class="${classPrefix}-prev J-paginationjs-previous ${prevCN}" data-num="${currentPage - 1}" title="Previous page">${this.getPageLinkTag((_g = attrs.prevText) !== null && _g !== void 0 ? _g : '')}</li>`;
                }
            }
            if (attrs.showPageNumbers) {
                html += this.generatePageNumbersHTML(args);
            }
            if (attrs.showNext) {
                if (currentPage >= totalPage) {
                    if (!attrs.autoHideNext) {
                        html += `<li class="${classPrefix}-next ${disableCN} ${nextCN}"><a>${attrs.nextText}</a></li>`;
                    }
                }
                else {
                    html += `<li class="${classPrefix}-next J-paginationjs-next ${nextCN}" data-num="${currentPage + 1}" title="Next page">${this.getPageLinkTag((_h = attrs.nextText) !== null && _h !== void 0 ? _h : '')}</li>`;
                }
            }
            html += `</ul></div>`;
        }
        if (attrs.showSizeChanger && Helpers.isArray(attrs.sizeChangerOptions)) {
            let sizeChangerHTML = '<select class="J-paginationjs-size-select">';
            const currentPageSize = (_j = this.model.pageSize) !== null && _j !== void 0 ? _j : 5;
            const sizeOptions = [...attrs.sizeChangerOptions];
            if (!sizeOptions.includes(currentPageSize)) {
                sizeOptions.push(currentPageSize);
                sizeOptions.sort((a, b) => a - b);
            }
            sizeOptions.forEach((opt) => {
                sizeChangerHTML += `<option value="${opt}"${opt === currentPageSize ? ' selected' : ''}>${opt} / page</option>`;
            });
            sizeChangerHTML += '</select>';
            if (attrs.formatSizeChanger) {
                sizeChangerHTML = this.replaceVariables(attrs.formatSizeChanger, {
                    length: sizeChangerHTML,
                    total: totalNumber,
                });
            }
            html += `<div class="paginationjs-size-changer">${sizeChangerHTML}</div>`;
        }
        if (attrs.showGoInput) {
            const goInput = `<input type="text" class="J-paginationjs-go-pagenumber">`;
            let finalStr = goInput;
            if (attrs.formatGoInput) {
                finalStr = this.replaceVariables(attrs.formatGoInput, {
                    currentPage,
                    totalPage,
                    totalNumber,
                    input: goInput,
                });
            }
            html += `<div class="${classPrefix}-go-input">${finalStr}</div>`;
        }
        if (attrs.showGoButton) {
            const goButton = `<input type="button" class="J-paginationjs-go-button" value="${attrs.goButtonText}">`;
            let finalStr = goButton;
            if (attrs.formatGoButton) {
                finalStr = this.replaceVariables(attrs.formatGoButton, {
                    currentPage,
                    totalPage,
                    totalNumber,
                    button: goButton,
                });
            }
            html += `<div class="${classPrefix}-go-button">${finalStr}</div>`;
        }
        if (typeof attrs.footer === 'function') {
            html += attrs.footer(currentPage, totalPage, totalNumber) || '';
        }
        else if (attrs.footer) {
            html += attrs.footer;
        }
        return html;
    }
    generatePageNumbersHTML(args) {
        var _a, _b, _c, _d, _e;
        const attrs = this.attributes;
        const currentPage = args.currentPage;
        const totalPage = this.getTotalPage();
        const classPrefix = (_a = attrs.classPrefix) !== null && _a !== void 0 ? _a : 'paginationjs';
        const pageCN = (_b = attrs.pageClassName) !== null && _b !== void 0 ? _b : '';
        const activeCN = (_c = attrs.activeClassName) !== null && _c !== void 0 ? _c : 'active';
        const disableCN = (_d = attrs.disableClassName) !== null && _d !== void 0 ? _d : '';
        const ellipsisText = (_e = attrs.ellipsisText) !== null && _e !== void 0 ? _e : '...';
        const pageRange = args.pageRange;
        let html = '';
        if (pageRange === null) {
            for (let i = 1; i <= totalPage; i++) {
                if (i === currentPage) {
                    html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${i}"><a>${i}</a></li>`;
                }
                else {
                    html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${i}">${this.getPageLinkTag(i)}</li>`;
                }
            }
            return html;
        }
        if (currentPage === 1) {
            html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="1"><a>1</a></li>`;
        }
        else {
            html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="1">${this.getPageLinkTag(1)}</li>`;
        }
        if (currentPage > pageRange + 2) {
            html += `<li class="${classPrefix}-ellipsis ${disableCN}"><a>${ellipsisText}</a></li>`;
        }
        const start = Math.max(2, currentPage - pageRange);
        const end = Math.min(totalPage - 1, currentPage + pageRange);
        for (let i = start; i <= end; i++) {
            if (i === currentPage) {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${i}"><a>${i}</a></li>`;
            }
            else {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${i}">${this.getPageLinkTag(i)}</li>`;
            }
        }
        if (currentPage < totalPage - pageRange - 1) {
            html += `<li class="${classPrefix}-ellipsis ${disableCN}"><a>${ellipsisText}</a></li>`;
        }
        if (totalPage > 1) {
            if (currentPage === totalPage) {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${totalPage}"><a>${totalPage}</a></li>`;
            }
            else {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${totalPage}">${this.getPageLinkTag(totalPage)}</li>`;
            }
        }
        return html;
    }
    getPageLinkTag(index) {
        const pageLink = this.attributes.pageLink;
        if (pageLink) {
            return `<a href="${pageLink}">${index}</a>`;
        }
        return `<a>${index}</a>`;
    }
    observer() {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        const el = this.model.el;
        if (!el) {
            return;
        }
        el.addEventListener('click', (evt) => {
            var _a, _b, _c;
            const target = evt.target;
            if (target.tagName === 'A' && !this.attributes.pageLink) {
                evt.preventDefault();
            }
            const button = target.closest('li, button, input[type="button"]');
            if (!button)
                return;
            if (button.classList.contains((_a = this.attributes.disableClassName) !== null && _a !== void 0 ? _a : '') ||
                button.classList.contains((_b = this.attributes.activeClassName) !== null && _b !== void 0 ? _b : '')) {
                return;
            }
            if (button.classList.contains('J-paginationjs-page')) {
                const pageNum = parseInt((_c = button.getAttribute('data-num')) !== null && _c !== void 0 ? _c : '', 10);
                if (pageNum) {
                    this.callHook('beforePageOnClick');
                    this.go(pageNum);
                    this.callHook('afterPageOnClick');
                }
            }
            else if (button.classList.contains('J-paginationjs-previous')) {
                this.callHook('beforePreviousOnClick');
                this.previous();
                this.callHook('afterPreviousOnClick');
            }
            else if (button.classList.contains('J-paginationjs-next')) {
                this.callHook('beforeNextOnClick');
                this.next();
                this.callHook('afterNextOnClick');
            }
            else if (button.classList.contains('J-paginationjs-go-button')) {
                const input = el.querySelector('.J-paginationjs-go-pagenumber');
                if (input) {
                    const pageNum = parseInt(input.value.trim(), 10);
                    if (isNumeric(pageNum)) {
                        this.callHook('beforeGoButtonOnClick', pageNum);
                        this.go(pageNum);
                        this.callHook('afterGoButtonOnClick', pageNum);
                    }
                    else {
                        console.warn('Pagination: Invalid page number entered');
                    }
                }
            }
        }, { signal });
        el.addEventListener("keyup", (evt) => {
            const target = evt.target;
            if (target.classList.contains('J-paginationjs-go-pagenumber')) {
                if (evt.key === 'Enter') {
                    const pageNum = parseInt(target.value.trim(), 10);
                    if (isNumeric(pageNum)) {
                        this.callHook("beforeGoInputOnEnter");
                        this.go(pageNum);
                        target.focus();
                        this.callHook("afterGoInputOnEnter");
                    }
                    else {
                        console.warn('Pagination: Invalid page number entered');
                    }
                }
            }
        }, { signal });
        el.addEventListener('change', (evt) => {
            var _a;
            const target = evt.target;
            if (target.classList.contains('J-paginationjs-size-select')) {
                this.callHook('beforeSizeSelectorChange');
                const newSize = parseInt(target.value, 10);
                if (isNumeric(newSize)) {
                    const sizeOptions = [...this.attributes.sizeChangerOptions];
                    if (!sizeOptions.includes(newSize)) {
                        sizeOptions.push(newSize);
                    }
                    const defaultPageSize = (_a = this.model.pageSize) !== null && _a !== void 0 ? _a : 5;
                    if (!sizeOptions.includes(defaultPageSize)) {
                        sizeOptions.push(defaultPageSize);
                    }
                    sizeOptions.sort((a, b) => a - b);
                    this.attributes.pageSize = newSize;
                    this.model.pageSize = newSize;
                    this.attributes.sizeChangerOptions = sizeOptions;
                    const totalPage = this.getTotalPage();
                    if (this.model.pageNumber > totalPage) {
                        this.model.pageNumber = totalPage;
                    }
                    this.go(this.model.pageNumber);
                    this.callHook('afterSizeSelectorChange');
                }
            }
        }, { signal });
    }
    go(pageNumber, callback) {
        var _a, _b;
        if (this.disabled)
            return;
        this.callHook('beforePaging', pageNumber);
        pageNumber = parseInt(pageNumber, 10);
        if (!pageNumber || pageNumber < 1)
            return;
        const totalPage = this.getTotalPage();
        if (this.getTotalNumber() > 0 && pageNumber > totalPage)
            return;
        if (!this.isAsync) {
            const pageData = this.getPagingData(pageNumber);
            this.renderAndCallback(pageNumber, pageData, callback);
            return;
        }
        const userAjax = typeof this.attributes.ajax === 'function'
            ? this.attributes.ajax()
            : this.attributes.ajax;
        const settings = Object.assign({ method: 'GET', headers: { 'Content-Type': 'application/json' } }, userAjax);
        if (typeof settings.beforeSend === 'function') {
            const result = settings.beforeSend();
            if (result === false) {
                return;
            }
        }
        const pageSize = (_a = this.attributes.pageSize) !== null && _a !== void 0 ? _a : 10;
        const alias = this.attributes.alias || {};
        const pageSizeName = alias.pageSize || 'pageSize';
        const pageNumberName = alias.pageNumber || 'pageNumber';
        const url = this.attributes.dataSource;
        const isJSONP = settings.dataType === 'jsonp' || /=\?/.test(url);
        let paramObj = {};
        paramObj[pageSizeName] = pageSize;
        paramObj[pageNumberName] = settings.pageNumberStartWithZero
            ? pageNumber - 1
            : pageNumber;
        if (settings.data && typeof settings.data === 'object') {
            paramObj = Object.assign(Object.assign({}, paramObj), settings.data);
        }
        if (isJSONP) {
            this.disable();
            const urlObj = new URL(url, window.location.href);
            Object.entries(paramObj).forEach(([key, value]) => {
                urlObj.searchParams.set(key, String(value));
            });
            const callbackName = 'paginationCallback' + Date.now();
            let finalUrl = urlObj.toString().replace(/=(\?|%3F)/, `=${callbackName}`);
            if (settings.jsonp && settings.jsonp !== 'callback') {
                const re = new RegExp(settings.jsonp + '=(\\?|%3F)', 'g');
                finalUrl = finalUrl.replace(re, `${settings.jsonp}=${callbackName}`);
            }
            const script = document.createElement('script');
            script.src = finalUrl;
            let timeoutId = null;
            const cleanup = () => {
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
            };
            const requestTimeout = typeof settings.timeout === 'number' ? settings.timeout : 20000;
            timeoutId = window.setTimeout(() => {
                cleanup();
                if (typeof this.attributes.onError === 'function') {
                    this.attributes.onError(new Error('JSONP request timeout'), 'jsonpTimeout');
                }
                this.enable();
            }, requestTimeout);
            window[callbackName] = (response) => {
                cleanup();
                if (this.isDynamicTotalNumber && typeof this.attributes.totalNumberLocator === 'function') {
                    this.model.totalNumber = this.attributes.totalNumberLocator(response);
                }
                else {
                    this.model.totalNumber = this.attributes.totalNumber;
                }
                try {
                    const finalDataArray = this.filterDataWithLocator(response);
                    this.renderAndCallback(pageNumber, finalDataArray, callback);
                }
                catch (err) {
                    if (typeof this.attributes.onError === 'function') {
                        this.attributes.onError(err, 'jsonpError');
                    }
                }
                finally {
                    this.enable();
                }
            };
            script.onerror = () => {
                cleanup();
                if (typeof this.attributes.onError === 'function') {
                    this.attributes.onError(new Error('JSONP request failed'), 'jsonpError');
                }
                this.enable();
            };
            document.body.appendChild(script);
            return;
        }
        let fetchUrl = url;
        const method = (settings.method || 'GET').toUpperCase();
        if (method === 'GET') {
            const qs = new URLSearchParams(paramObj).toString();
            fetchUrl += fetchUrl.includes('?') ? `&${qs}` : `?${qs}`;
            delete settings.body;
        }
        else {
            settings.body = (_b = settings.body) !== null && _b !== void 0 ? _b : JSON.stringify(paramObj);
        }
        this.disable();
        fetch(fetchUrl, settings)
            .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok, status=' + response.status);
            }
            return response.json();
        })
            .then((data) => {
            if (this.isDynamicTotalNumber && typeof this.attributes.totalNumberLocator === 'function') {
                this.model.totalNumber = this.attributes.totalNumberLocator(data);
            }
            else {
                this.model.totalNumber = this.attributes.totalNumber;
            }
            const finalDataArray = this.filterDataWithLocator(data);
            this.renderAndCallback(pageNumber, finalDataArray, callback);
        })
            .catch((err) => {
            if (typeof this.attributes.onError === 'function') {
                this.attributes.onError(err, 'fetchError');
            }
            else {
                throwError(err.message);
            }
        })
            .finally(() => {
            this.enable();
        });
    }
    renderAndCallback(pageNumber, dataArray, customCallback) {
        if (!dataArray)
            dataArray = [];
        const oldPage = this.model.pageNumber;
        this.model.direction =
            typeof oldPage === 'undefined' ? 0 : pageNumber > oldPage ? 1 : -1;
        this.model.pageNumber = pageNumber;
        this.render(false);
        if (this.disabled && this.isAsync) {
            this.enable();
        }
        const containerData = paginationDataMap.get(this.container) || {};
        let finalData = dataArray;
        if (typeof this.attributes.formatResult === 'function') {
            const cloneData = JSON.parse(JSON.stringify(dataArray));
            const newData = this.attributes.formatResult(cloneData);
            if (Helpers.isArray(newData)) {
                finalData = newData;
            }
        }
        containerData.currentPageData = finalData;
        paginationDataMap.set(this.container, containerData);
        if (typeof customCallback === 'function') {
            customCallback(finalData, this.model);
        }
        else if (typeof this.attributes.callback === 'function') {
            this.attributes.callback(finalData, this.model);
        }
        this.callHook('afterPaging', pageNumber);
        if (pageNumber === 1) {
            this.callHook('afterIsFirstPage');
        }
        if (pageNumber === this.getTotalPage()) {
            this.callHook('afterIsLastPage');
        }
    }
    getPagingData(pageNumber) {
        var _a;
        const pageSize = (_a = this.attributes.pageSize) !== null && _a !== void 0 ? _a : 10;
        const ds = this.attributes.dataSource;
        const totalNumber = this.getTotalNumber();
        const start = pageSize * (pageNumber - 1) + 1;
        const end = Math.min(pageNumber * pageSize, totalNumber);
        return ds.slice(start - 1, end);
    }
    getTotalNumber() {
        var _a, _b;
        return (_b = (_a = this.model.totalNumber) !== null && _a !== void 0 ? _a : this.attributes.totalNumber) !== null && _b !== void 0 ? _b : 0;
    }
    getTotalPage() {
        return Math.ceil(this.getTotalNumber() / this.model.pageSize);
    }
    replaceVariables(template, vars) {
        let result = template;
        for (const key of Object.keys(vars)) {
            const val = vars[key];
            const re = new RegExp('<%=\\s*' + key + '\\s*%>', 'g');
            result = result.replace(re, String(val));
        }
        return result;
    }
    previous(callback) {
        this.go(this.model.pageNumber - 1, callback);
    }
    next(callback) {
        this.go(this.model.pageNumber + 1, callback);
    }
    disable() {
        this.callHook('beforeDisable');
        this.disabled = true;
        this.model.disabled = true;
        this.callHook('afterDisable');
    }
    enable() {
        this.callHook('beforeEnable');
        this.disabled = false;
        this.model.disabled = false;
        this.callHook('afterEnable');
    }
    refresh(callback) {
        this.go(this.model.pageNumber, callback);
    }
    show() {
        if (this.model.el) {
            this.model.el.style.display = '';
        }
    }
    hide() {
        if (this.model.el) {
            this.model.el.style.display = 'none';
        }
    }
    destroy(opts) {
        const silent = opts && opts.silent;
        const dataObj = paginationDataMap.get(this.container) || {};
        if (dataObj.destroyed)
            return;
        this.callHook('beforeDestroy');
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        if (this.model && this.model.el) {
            this.model.el.remove();
            this.model.el = null;
        }
        this.model = null;
        paginationDataMap.delete(this.container);
        if (!silent) {
            this.callHook('afterDestroy');
            if (typeof this.attributes.afterDestroy === 'function') {
                this.attributes.afterDestroy();
            }
        }
        dataObj.destroyed = true;
        dataObj.initialized = false;
        dataObj.instance = undefined;
        paginationDataMap.set(this.container, dataObj);
    }
}
function parameterChecker(args) {
    if (!args.dataSource) {
        throwError('"dataSource" is required.');
    }
    if (typeof args.dataSource === 'string') {
        if (args.totalNumberLocator === undefined) {
            if (args.totalNumber === undefined) {
                throwError('"totalNumber" is required when dataSource is a URL with no totalNumberLocator.');
            }
            else if (!isNumeric(args.totalNumber)) {
                throwError('"totalNumber" is incorrect. Expect numeric type');
            }
        }
        else {
            if (typeof args.totalNumberLocator !== 'function') {
                throwError('"totalNumberLocator" should be a Function.');
            }
        }
    }
    else if (Helpers.isObject(args.dataSource)) {
        if (typeof args.locator === 'undefined') {
            throwError('"dataSource" is an Object, please specify a "locator".');
        }
        else if (typeof args.locator !== 'string' &&
            typeof args.locator !== 'function') {
            throwError(`"${String(args.locator)}" is incorrect. Expect string or function type`);
        }
    }
    if (args.formatResult !== undefined && typeof args.formatResult !== 'function') {
        throwError('"formatResult" should be a Function.');
    }
    if (args.onError !== undefined && typeof args.onError !== 'function') {
        throwError('"onError" should be a Function.');
    }
}
if (typeof window !== 'undefined') {
    window.pagination = pagination;
}
export { pagination };
//# sourceMappingURL=index.js.map