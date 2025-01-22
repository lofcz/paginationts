declare global {
    interface Window {
        pagination: typeof pagination;
    }
}

interface PaginationData {
    // Extra info we store in the WeakMap for each container
    initialized?: boolean;
    destroyed?: boolean;
    instance?: PaginationInstance;
    currentPageData?: any[];
}

/** Pagination plugin options. */
export interface PaginationOptions {
    dataSource: any; // Can be an array, URL string, or function
    locator?: string | (() => string);
    totalNumberLocator?: ((data: any) => number) | undefined;
    totalNumber?: number;
    pageNumber?: number;
    pageSize?: number;
    pageRange?: number | null;
    showPrevious?: boolean;
    showNext?: boolean;
    showPageNumbers?: boolean;
    showNavigator?: boolean;
    showGoInput?: boolean;
    showGoButton?: boolean;
    showSizeChanger?: boolean;
    sizeChangerOptions?: number[];
    pageLink?: string;
    prevText?: string;
    nextText?: string;
    ellipsisText?: string;
    goButtonText?: string;
    classPrefix?: string;
    activeClassName?: string;
    disableClassName?: string;
    formatNavigator?: string;
    formatGoInput?: string;
    formatGoButton?: string;
    formatSizeChanger?: string;
    position?: 'top' | 'bottom';
    autoHidePrevious?: boolean;
    autoHideNext?: boolean;
    triggerPagingOnInit?: boolean;
    resetPageNumberOnInit?: boolean;
    hideOnlyOnePage?: boolean;
    callback?: (data: any[], model: PaginationModel) => void;
    header?: string | ((currentPage: number, totalPage: number, totalNumber: number) => string);
    footer?: string | ((currentPage: number, totalPage: number, totalNumber: number) => string);
    className?: string;
    ulClassName?: string;
    prevClassName?: string;
    nextClassName?: string;
    pageClassName?: string;
    alias?: { pageSize?: string; pageNumber?: string; [key: string]: string | undefined };
    ajax?: (() => RequestInit) | RequestInit;
    onError?: (error: Error, type: string) => void;
    afterDestroy?: () => void;
    formatResult?: (data: any[]) => any[];
    disabled?: boolean;
}

/** Internal model tracked by PaginationInstance. */
export interface PaginationModel {
    pageNumber: number;
    pageSize: number;
    totalNumber?: number;
    disabled?: boolean;
    direction?: number; // -1, +1, or 0
    el?: HTMLElement | null;
}

declare global {
    interface Window {
        pagination: typeof pagination;
    }
}

const paginationDataMap = new WeakMap<HTMLElement, PaginationData>();

/** Throw errors with a consistent message prefix. */
function throwError(msg: string): never {
    throw new Error('Pagination: ' + msg);
}

/** Check if a value is numeric. */
function isNumeric(n: string | number): boolean {
    if (typeof n === 'number') return isFinite(n);
    if (typeof n === 'string') {
        return !isNaN(parseFloat(n)) && isFinite(+n);
    }
    return false;
}

function extend<T extends object, U extends object>(target: T, ...sources: U[]): T & U {
    let result = Object.assign({}, target) as T & U;
    for (const src of sources) {
        if (src) {
            for (const key of Object.keys(src)) {
                const value = (src as any)[key];
                if (Array.isArray(value)) {
                    (result as any)[key] = [...value];
                } else {
                    (result as any)[key] = value;
                }
            }
        }
    }
    return result;
}


const Helpers = {
    isObject(obj: any): boolean {
        return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
    },
    isArray(obj: any): boolean {
        return Array.isArray(obj);
    },
    isString(obj: any): boolean {
        return typeof obj === 'string';
    },
};

/** Default plugin options. */
const defaultOptions: PaginationOptions = {
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
    callback: () => {},
};

/**
 * Main function to create/get a pagination instance.
 * Usage:
 *   pagination(document.getElementById('myDiv'), { ...options... });
 *   OR
 *   window.pagination('#myDiv', 'next');
 */
function pagination(
    container: HTMLElement | string,
    options: PaginationOptions | string,
    arg3?: any
): PaginationInstance | any {
    // If container is a selector string, get the element
    if (typeof container === 'string') {
        const foundEl = document.querySelector<HTMLElement>(container);
        if (!foundEl) {
            throwError('Invalid selector or element not found.');
        }
        container = foundEl as HTMLElement;
    }

    if (!container) {
        throwError('A valid container element is required.');
    }


    // If options is a string, we might be calling "previous", "next", etc.
    if (typeof options === 'string') {
        const instanceData = paginationDataMap.get(container as HTMLElement);
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
                // arg3 is the pageNumber
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
                return Math.ceil(instance.model.totalNumber! / instance.model.pageSize);
            case 'getSelectedPageData':
            case 'getCurrentPageData':
                return instanceData.currentPageData || [];
            case 'isDisabled':
                return !!instance.model.disabled;
            default:
                throwError('Unknown action: ' + options);
        }
    }

    // Otherwise, we are initializing with options object
    if (!Helpers.isObject(options)) {
        throwError('Illegal options (must be an object).');
    }
    const config = extend({}, defaultOptions, options) as PaginationOptions;
    parameterChecker(config);

    // If an old instance exists, destroy it before re-init
    const oldData = paginationDataMap.get(container as HTMLElement);
    if (oldData && oldData.initialized && oldData.instance) {
        oldData.instance.destroy({ silent: true });
    }

    // Create and init a new instance
    const newInstance = new PaginationInstance(container as HTMLElement, config);
    newInstance.initialize();

    paginationDataMap.set(container as HTMLElement, {
        initialized: true,
        instance: newInstance,
    });

    return newInstance;
}

/** Class that represents an instance of pagination on a container. */
export class PaginationInstance {
    public container: HTMLElement;
    public attributes: PaginationOptions;
    public disabled: boolean;
    public model: PaginationModel;
    public isAsync: boolean = false;
    public isDynamicTotalNumber: boolean = false;

    private abortController: AbortController | null = null;

    constructor(container: HTMLElement, attributes: PaginationOptions) {
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
            pageNumber: attributes.pageNumber ?? 1,
            pageSize: attributes.pageSize ?? 10,
            totalNumber: attributes.totalNumber,
        };
    }

    initialize(): void {
        let dataObj: PaginationData = paginationDataMap.get(this.container) || {};
        dataObj.destroyed = false;
        paginationDataMap.set(this.container, dataObj);

        // Parse data source
        this.parseDataSource(this.attributes.dataSource, (finalDataSource: any) => {
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
                let defaultPageNumber = this.attributes.pageNumber ?? 1;
                if (this.isDynamicTotalNumber && this.attributes.resetPageNumberOnInit) {
                    defaultPageNumber = 1;
                }
                this.go(Math.min(defaultPageNumber, totalPage));
            }
        });
    }

    parseDataSource(dataSource: any, done: (val: any) => void): void {
        if (Helpers.isObject(dataSource)) {
            const filtered = this.filterDataWithLocator(dataSource);
            done(filtered);
        } else if (Helpers.isArray(dataSource)) {
            done(dataSource);
        } else if (typeof dataSource === 'function') {
            dataSource((arr: any[]) => {
                if (!Helpers.isArray(arr)) {
                    throwError('The data passed to the dataSource callback must be an array.');
                }
                this.parseDataSource(arr, done);
            });
        } else if (typeof dataSource === 'string') {
            // treat as URL
            done(dataSource);
        } else {
            throwError('Unexpected dataSource type');
        }
    }

    filterDataWithLocator(dataSource: any): any[] {
        const locator = this.getLocator(this.attributes.locator!);
        let filteredData: any;

        if (Helpers.isObject(dataSource)) {
            try {
                const parts = locator.split('.');
                let cur: any = dataSource;
                for (const p of parts) {
                    cur = cur[p];
                }
                filteredData = cur;
            } catch (e) {
                // ignore
            }
            if (!filteredData) {
                throwError('dataSource.' + locator + ' is undefined.');
            }
            if (!Helpers.isArray(filteredData)) {
                throwError('dataSource.' + locator + ' should be an Array.');
            }
            return filteredData;
        }
        return dataSource; // might already be array
    }

    getLocator(locator: string | (() => string)): string {
        if (typeof locator === 'string') return locator;
        if (typeof locator === 'function') return locator();
        throwError('"locator" is incorrect. Expect string or function type.');
    }

    render(isBoot: boolean): HTMLElement | null {
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
            } else {
                this.container.insertBefore(el, this.container.firstChild);
            }
            this.model.el = el;
            this.observer();
        }

        this.callHook('afterRender', isForced);
        return el;
    }

    private callHook(hookName: string, isForced: boolean): void {
        if (typeof this.attributes[hookName] === 'function') {
            this.attributes[hookName](isForced);
        }
    }

    generateHTML(args: {
        currentPage: number;
        pageRange: number | null;
        rangeStart: number;
        rangeEnd: number;
    }): string {
        const attrs = this.attributes;
        const currentPage = args.currentPage;
        const totalPage = this.getTotalPage();
        const pageSize = attrs.pageSize ?? 10;
        const totalNumber = this.getTotalNumber();
        const classPrefix = attrs.classPrefix ?? 'paginationjs';
        const disableCN = attrs.disableClassName ?? '';
        const ulCN = attrs.ulClassName ?? '';
        const prevCN = attrs.prevClassName ?? '';
        const nextCN = attrs.nextClassName ?? '';
        let html = '';

        // header
        if (typeof attrs.header === 'function') {
            html += attrs.header(currentPage, totalPage, totalNumber) || '';
        } else if (attrs.header) {
            html += attrs.header;
        }

        // navigator text
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

        // page buttons
        const shouldShowPages =
            attrs.showPrevious || attrs.showPageNumbers || attrs.showNext;

        if (args.pageRange === null) {
            var tt = 0;
        }

        if (shouldShowPages) {
            html += `<div class="paginationjs-pages">`;
            html += ulCN ? `<ul class="${ulCN}">` : `<ul>`;

            // previous
            if (attrs.showPrevious) {
                if (currentPage <= 1) {
                    if (!attrs.autoHidePrevious) {
                        html += `<li class="${classPrefix}-prev ${disableCN} ${prevCN}"><a>${attrs.prevText}</a></li>`;
                    }
                } else {
                    html += `<li class="${classPrefix}-prev J-paginationjs-previous ${prevCN}" data-num="${
                        currentPage - 1
                    }" title="Previous page">${this.getPageLinkTag(attrs.prevText ?? '')}</li>`;
                }
            }

            // page numbers
            if (attrs.showPageNumbers) {
                html += this.generatePageNumbersHTML(args);
            }

            // next
            if (attrs.showNext) {
                if (currentPage >= totalPage) {
                    if (!attrs.autoHideNext) {
                        html += `<li class="${classPrefix}-next ${disableCN} ${nextCN}"><a>${attrs.nextText}</a></li>`;
                    }
                } else {
                    html += `<li class="${classPrefix}-next J-paginationjs-next ${nextCN}" data-num="${
                        currentPage + 1
                    }" title="Next page">${this.getPageLinkTag(attrs.nextText ?? '')}</li>`;
                }
            }

            html += `</ul></div>`;
        }

        // size changer
        if (attrs.showSizeChanger && Helpers.isArray(attrs.sizeChangerOptions)) {
            let sizeChangerHTML = '<select class="J-paginationjs-size-select">';
            const currentPageSize = this.model.pageSize ?? 5;
            const sizeOptions = [...attrs.sizeChangerOptions];

            if (!sizeOptions.includes(currentPageSize)) {
                sizeOptions.push(currentPageSize);
                sizeOptions.sort((a, b) => a - b);
            }

            sizeOptions.forEach((opt) => {
                sizeChangerHTML += `<option value="${opt}"${
                    opt === currentPageSize ? ' selected' : ''
                }>${opt} / page</option>`;
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

        // go input
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

        // go button
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

        // footer
        if (typeof attrs.footer === 'function') {
            html += attrs.footer(currentPage, totalPage, totalNumber) || '';
        } else if (attrs.footer) {
            html += attrs.footer;
        }

        return html;
    }

    generatePageNumbersHTML(args: {
        currentPage: number;
        pageRange: number | null;
        rangeStart: number;
        rangeEnd: number;
    }): string {
        const attrs = this.attributes;
        const currentPage = args.currentPage;
        const totalPage = this.getTotalPage();
        const classPrefix = attrs.classPrefix ?? 'paginationjs';
        const pageCN = attrs.pageClassName ?? '';
        const activeCN = attrs.activeClassName ?? 'active';
        const disableCN = attrs.disableClassName ?? '';
        const ellipsisText = attrs.ellipsisText ?? '...';
        const pageRange = args.pageRange;
        let html = '';

        if (pageRange === null) {
            for (let i = 1; i <= totalPage; i++) {
                if (i === currentPage) {
                    html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${i}"><a>${i}</a></li>`;
                } else {
                    html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${i}">${this.getPageLinkTag(i)}</li>`;
                }
            }
            return html;
        }

        // first page
        if (currentPage === 1) {
            html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="1"><a>1</a></li>`;
        } else {
            html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="1">${this.getPageLinkTag(
                1
            )}</li>`;
        }

        // front ellipsis
        if (currentPage > pageRange + 2) {
            html += `<li class="${classPrefix}-ellipsis ${disableCN}"><a>${ellipsisText}</a></li>`;
        }

        // in-range pages
        const start = Math.max(2, currentPage - pageRange);
        const end = Math.min(totalPage - 1, currentPage + pageRange);
        for (let i = start; i <= end; i++) {
            if (i === currentPage) {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${i}"><a>${i}</a></li>`;
            } else {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${i}">${this.getPageLinkTag(
                    i
                )}</li>`;
            }
        }

        // rear ellipsis
        if (currentPage < totalPage - pageRange - 1) {
            html += `<li class="${classPrefix}-ellipsis ${disableCN}"><a>${ellipsisText}</a></li>`;
        }

        // last page
        if (totalPage > 1) {
            if (currentPage === totalPage) {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN} ${activeCN}" data-num="${totalPage}"><a>${totalPage}</a></li>`;
            } else {
                html += `<li class="${classPrefix}-page J-paginationjs-page ${pageCN}" data-num="${totalPage}">${this.getPageLinkTag(
                    totalPage
                )}</li>`;
            }
        }
        return html;
    }

    getPageLinkTag(index: string | number): string {
        const pageLink = this.attributes.pageLink;
        if (pageLink) {
            return `<a href="${pageLink}">${index}</a>`;
        }
        return `<a>${index}</a>`;
    }

    observer(): void {

        if (this.abortController) {
            this.abortController.abort();
        }

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const el = this.model.el;
        if (!el) {
            console.warn('Pagination: No element to observe');
            return;
        }

        el.addEventListener('click', (evt) => {
            const target = evt.target as HTMLElement;

            if (target.tagName === 'A' && !this.attributes.pageLink) {
                evt.preventDefault();
            }

            const button = target.closest('li, button, input[type="button"]') as HTMLElement;
            if (!button) return;

            if (
                button.classList.contains(this.attributes.disableClassName ?? '') ||
                button.classList.contains(this.attributes.activeClassName ?? '')
            ) {
                console.log('Pagination: Clicked disabled or active element');
                return;
            }

            if (button.classList.contains('J-paginationjs-page')) {
                const pageNum = parseInt(button.getAttribute('data-num') ?? '', 10);
                if (pageNum) {
                    console.log('Pagination: Page button clicked:', pageNum);
                    this.go(pageNum);
                }
            }
            else if (button.classList.contains('J-paginationjs-previous')) {
                console.log('Pagination: Previous button clicked');
                this.previous();
            }
            else if (button.classList.contains('J-paginationjs-next')) {
                console.log('Pagination: Next button clicked');
                this.next();
            }
            else if (button.classList.contains('J-paginationjs-go-button')) {
                const input = el.querySelector('.J-paginationjs-go-pagenumber') as HTMLInputElement;
                if (input) {
                    const pageNum = parseInt(input.value.trim(), 10);
                    if (isNumeric(pageNum)) {
                        console.log('Pagination: Go button clicked:', pageNum);
                        this.go(pageNum);
                    } else {
                        console.warn('Pagination: Invalid page number entered');
                    }
                }
            }
        }, { signal });

        const goInput = el.querySelector('.J-paginationjs-go-pagenumber') as HTMLInputElement;
        if (goInput) {
            goInput.addEventListener('keyup', (evt) => {
                if (evt.key === 'Enter') {
                    const pageNum = parseInt(goInput.value.trim(), 10);
                    if (isNumeric(pageNum)) {
                        console.log('Pagination: Go input enter pressed:', pageNum);
                        this.go(pageNum);
                        goInput.focus();
                    } else {
                        console.warn('Pagination: Invalid page number entered');
                    }
                }
            }, { signal });
        }

        el.addEventListener('change', (evt) => {
            const target = evt.target as HTMLElement;
            if (target.classList.contains('J-paginationjs-size-select')) {
                const newSize = parseInt((target as HTMLSelectElement).value, 10);
                if (isNumeric(newSize)) {

                    const sizeOptions = [...this.attributes.sizeChangerOptions!];

                    if (!sizeOptions.includes(newSize)) {
                        sizeOptions.push(newSize);
                    }

                    const defaultPageSize = this.model.pageSize ?? 5

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
                }
            }
        }, { signal });


    }

    go(pageNumber: number, callback?: (data: any[], model: PaginationModel) => void): void {
        if (this.disabled) return;
        pageNumber = parseInt(pageNumber as any, 10);
        if (!pageNumber || pageNumber < 1) return;
        const totalPage = this.getTotalPage();
        if (this.getTotalNumber() > 0 && pageNumber > totalPage) return;

        // If dataSource is local (array or object), we just slice the data.
        if (!this.isAsync) {
            const pageData = this.getPagingData(pageNumber);
            this.renderAndCallback(pageNumber, pageData, callback);
            return;
        }

        // Otherwise, remote/async data.
        const userAjax = typeof this.attributes.ajax === 'function'
            ? this.attributes.ajax()
            : this.attributes.ajax;

        // Convert userAjax to a (RequestInit & {dataType?: string, beforeSend?: Function}) object:
        const settings: any & {
            dataType?: string;
            beforeSend?: () => boolean | void;
            data?: Record<string, unknown>;
            pageNumberStartWithZero?: boolean;
        } = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            ...userAjax
        };

        // If the user passed a beforeSend, invoke it now.
        // If beforeSend returns false, we cancel the request.
        if (typeof settings.beforeSend === 'function') {
            const result = settings.beforeSend();
            if (result === false) {
                return;
            }
        }

        const pageSize = this.attributes.pageSize ?? 10;
        const alias = this.attributes.alias || {};
        const pageSizeName = alias.pageSize || 'pageSize';
        const pageNumberName = alias.pageNumber || 'pageNumber';
        const url = this.attributes.dataSource as string;
        const isJSONP = settings.dataType === 'jsonp' || /=\?/.test(url);

        // Build up query/body parameters
        let paramObj: Record<string, any> = {};
        paramObj[pageSizeName] = pageSize;
        // Allow zero-based page if pageNumberStartWithZero set
        paramObj[pageNumberName] = settings.pageNumberStartWithZero
            ? pageNumber - 1
            : pageNumber;

        // If userAjax.data was provided, merge it in
        if (settings.data && typeof settings.data === 'object') {
            paramObj = { ...paramObj, ...settings.data };
        }

        // Handle JSONP
        if (isJSONP) {
            this.disable(); // disable pagination while loading

            // Build final URL with query
            const urlObj = new URL(url, window.location.href);
            Object.entries(paramObj).forEach(([key, value]) => {
                urlObj.searchParams.set(key, String(value));
            });

            // Make a unique callback param name
            const callbackName = 'paginationCallback' + Date.now();

            // By default, jQuery uses callback=? in the query string.
            // If you see =? or =%3F, replace it with our unique callbackName.
            let finalUrl = urlObj.toString().replace(/=(\?|%3F)/, `=${callbackName}`);

            // Also allow for a “jsonp” property override (like jQuery's “jsonp” option)
            // e.g., if user sets settings.jsonp = 'cb', we replace &cb=?
            if (settings.jsonp && settings.jsonp !== 'callback') {
                const re = new RegExp(settings.jsonp + '=(\\?|%3F)', 'g');
                finalUrl = finalUrl.replace(re, `${settings.jsonp}=${callbackName}`);
            }

            // Insert <script> and wait for the callback
            const script = document.createElement('script');
            script.src = finalUrl;

            let timeoutId: number | null = null;
            const cleanup = () => {
                if ((window as any)[callbackName]) {
                    delete (window as any)[callbackName];
                }
                if (script.parentNode) {
                    document.body.removeChild(script);
                }
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
            };

            // Default to a 20s timeout; let user override with settings.timeout if desired
            const requestTimeout = typeof settings.timeout === 'number' ? settings.timeout : 20000;
            timeoutId = window.setTimeout(() => {
                cleanup();
                if (typeof this.attributes.onError === 'function') {
                    this.attributes.onError(new Error('JSONP request timeout'), 'jsonpTimeout');
                }
                this.enable();
            }, requestTimeout);

            (window as any)[callbackName] = (response: any) => {
                cleanup();
                // Possibly update totalNumber dynamically
                if (this.isDynamicTotalNumber && typeof this.attributes.totalNumberLocator === 'function') {
                    this.model.totalNumber = this.attributes.totalNumberLocator(response);
                } else {
                    this.model.totalNumber = this.attributes.totalNumber;
                }
                try {
                    const finalDataArray = this.filterDataWithLocator(response);
                    this.renderAndCallback(pageNumber, finalDataArray, callback);
                } catch (err) {
                    if (typeof this.attributes.onError === 'function') {
                        this.attributes.onError(err as Error, 'jsonpError');
                    }
                } finally {
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

        // Otherwise do a standard (fetch) request
        // If GET, append params to query; if POST, place in body.
        let fetchUrl = url;
        const method = (settings.method || 'GET').toUpperCase();
        if (method === 'GET') {
            const qs = new URLSearchParams(paramObj).toString();
            fetchUrl += fetchUrl.includes('?') ? `&${qs}` : `?${qs}`;
            delete settings.body; // no body for GET
        } else {
            // JSON body
            settings.body = settings.body ?? JSON.stringify(paramObj);
        }

        this.disable(); // disable pagination while loading

        fetch(fetchUrl, settings)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok, status=' + response.status);
                }
                return response.json();
            })
            .then((data) => {
                // Possibly update totalNumber dynamically
                if (this.isDynamicTotalNumber && typeof this.attributes.totalNumberLocator === 'function') {
                    this.model.totalNumber = this.attributes.totalNumberLocator(data);
                } else {
                    this.model.totalNumber = this.attributes.totalNumber;
                }
                const finalDataArray = this.filterDataWithLocator(data);
                this.renderAndCallback(pageNumber, finalDataArray, callback);
            })
            .catch((err) => {
                if (typeof this.attributes.onError === 'function') {
                    this.attributes.onError(err, 'fetchError');
                } else {
                    throwError(err.message);
                }
            })
            .finally(() => {
                this.enable();
            });
    }

    renderAndCallback(
        pageNumber: number,
        dataArray: any[],
        customCallback?: (data: any[], model: PaginationModel) => void
    ): void {
        if (!dataArray) dataArray = [];

        const oldPage = this.model.pageNumber;
        this.model.direction =
            typeof oldPage === 'undefined' ? 0 : pageNumber > oldPage ? 1 : -1;
        this.model.pageNumber = pageNumber;

        this.render(false);

        if (this.disabled && this.isAsync) {
            this.enable();
        }

        // Save page data
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

        // Callback
        if (typeof customCallback === 'function') {
            customCallback(finalData, this.model);
        } else if (typeof this.attributes.callback === 'function') {
            this.attributes.callback(finalData, this.model);
        }
    }

    getPagingData(pageNumber: number): any[] {
        const pageSize = this.attributes.pageSize ?? 10;
        const ds = this.attributes.dataSource as any[];
        const totalNumber = this.getTotalNumber();
        const start = pageSize * (pageNumber - 1) + 1;
        const end = Math.min(pageNumber * pageSize, totalNumber);
        return ds.slice(start - 1, end);
    }

    getTotalNumber(): number {
        return this.model.totalNumber ?? this.attributes.totalNumber ?? 0;
    }

    getTotalPage(): number {
        return Math.ceil(this.getTotalNumber() / this.model.pageSize);
    }

    replaceVariables(template: string, vars: Record<string, any>): string {
        let result = template;
        for (const key of Object.keys(vars)) {
            const val = vars[key];
            const re = new RegExp('<%=\\s*' + key + '\\s*%>', 'g');
            result = result.replace(re, String(val));
        }
        return result;
    }

    previous(callback?: (data: any[], model: PaginationModel) => void): void {
        this.go(this.model.pageNumber - 1, callback);
    }

    next(callback?: (data: any[], model: PaginationModel) => void): void {
        this.go(this.model.pageNumber + 1, callback);
    }

    disable(): void {
        this.disabled = true;
        this.model.disabled = true;
    }

    enable(): void {
        this.disabled = false;
        this.model.disabled = false;
    }

    refresh(callback?: (data: any[], model: PaginationModel) => void): void {
        this.go(this.model.pageNumber, callback);
    }

    show(): void {
        if (this.model.el) {
            this.model.el.style.display = '';
        }
    }

    hide(): void {
        if (this.model.el) {
            this.model.el.style.display = 'none';
        }
    }

    destroy(opts?: { silent?: boolean }): void {
        const silent = opts && opts.silent;
        const dataObj = paginationDataMap.get(this.container) || {};
        if (dataObj.destroyed) return;

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

        if (!silent && typeof this.attributes.afterDestroy === 'function') {
            this.attributes.afterDestroy();
        }

        dataObj.destroyed = true;
        dataObj.initialized = false;
        dataObj.instance = undefined;
        paginationDataMap.set(this.container, dataObj);
    }
}

/** Validate the user’s config options. */
function parameterChecker(args: PaginationOptions): void {
    if (!args.dataSource) {
        throwError('"dataSource" is required.');
    }
    if (typeof args.dataSource === 'string') {
        // If it's a URL
        if (args.totalNumberLocator === undefined) {
            if (args.totalNumber === undefined) {
                throwError(
                    '"totalNumber" is required when dataSource is a URL with no totalNumberLocator.'
                );
            } else if (!isNumeric(args.totalNumber)) {
                throwError('"totalNumber" is incorrect. Expect numeric type');
            }
        } else {
            if (typeof args.totalNumberLocator !== 'function') {
                throwError('"totalNumberLocator" should be a Function.');
            }
        }
    } else if (Helpers.isObject(args.dataSource)) {
        if (typeof args.locator === 'undefined') {
            throwError('"dataSource" is an Object, please specify a "locator".');
        } else if (
            typeof args.locator !== 'string' &&
            typeof args.locator !== 'function'
        ) {
            throwError(
                `"${String(
                    args.locator
                )}" is incorrect. Expect string or function type`
            );
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