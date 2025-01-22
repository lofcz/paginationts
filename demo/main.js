import { pagination } from '../src';
import '../src/styles.scss';
document.addEventListener('DOMContentLoaded', function () {
    function generateData(number) {
        var result = [];
        for (var i = 1; i <= number; i++) {
            result.push(i);
        }
        return result;
    }
    function generateObjData(number) {
        var result = [];
        for (var i = 1; i <= number; i++) {
            result.push({ a: i });
        }
        return result;
    }
    var demoConfigs = [
        {
            id: 1,
            desc: 'Normal',
            anchor: 'normal',
            options: {
                dataSource: generateData(195)
            }
        },
        {
            id: 7,
            desc: 'Only page numbers',
            anchor: 'only_page_numbers',
            options: {
                dataSource: generateData(100),
                pageSize: 5,
                className: 'paginationjs-big',
                showPrevious: false,
                showNext: false
            }
        },
        {
            id: 20,
            desc: 'Show page size changer',
            anchor: 'show_page_size_changer',
            disableContainerMaxHeight: true,
            options: {
                dataSource: generateData(195),
                pageSize: 5,
                className: 'paginationjs-big',
                showSizeChanger: true
            }
        },
        {
            id: 8,
            desc: 'Show "go" input & button',
            anchor: 'show_go_button',
            options: {
                dataSource: generateData(40),
                pageSize: 5,
                className: 'paginationjs-big',
                showGoInput: true,
                showGoButton: true
            }
        },
        {
            id: 12,
            desc: 'Auto hide previous & next button',
            anchor: 'auto_hide',
            options: {
                dataSource: generateData(35),
                pageSize: 5,
                className: 'paginationjs-big',
                autoHidePrevious: true,
                autoHideNext: true
            }
        },
        {
            id: 5,
            desc: 'Mini',
            anchor: 'mini',
            options: {
                dataSource: generateData(50),
                pageSize: 5,
                className: 'paginationjs-big',
                showPageNumbers: false,
                showNavigator: true
            }
        },
        {
            id: 14,
            desc: 'Show all pages',
            anchor: 'show_all_pages',
            options: {
                dataSource: generateData(50),
                pageSize: 5,
                pageRange: null,
                className: 'paginationjs-big',
                showPageNumbers: true
            }
        },
        {
            id: 3,
            desc: 'Asynchronous or JSONP',
            anchor: 'datasource_jsonp',
            options: {
                dataSource: 'https://api.flickr.com/services/feeds/photos_public.gne?tags=cat&tagmode=any&format=json&jsoncallback=?',
                locator: 'items',
                totalNumber: 120,
                pageSize: 20,
                className: 'paginationjs-big',
                ajax: {
                    beforeSend: function () {
                        var container = document.querySelector('#demo3 .data-container');
                        if (container) {
                            container.innerHTML = '<div class="loading">Loading data from flickr.com ...</div>';
                        }
                    }
                }
            }
        },
        {
            id: 13,
            desc: 'Asynchronous & Dynamic total number',
            anchor: 'totalNumber_locator',
            options: {
                dataSource: 'https://api.flickr.com/services/feeds/photos_public.gne?tags=cat&tagmode=any&format=json&jsoncallback=?',
                locator: 'items',
                totalNumberLocator: function (response) {
                    return Math.floor(Math.random() * (1000 - 100)) + 100;
                },
                pageSize: 20,
                className: 'paginationjs-big',
                ajax: {
                    beforeSend: function () {
                        var container = document.querySelector('#demo13 .data-container');
                        if (container) {
                            container.innerHTML = '<div class="loading">Loading data from flickr.com ...</div>';
                        }
                    }
                }
            }
        },
        {
            id: 2,
            desc: 'Specify default',
            anchor: 'specify_default',
            options: {
                dataSource: generateData(35),
                pageNumber: 3,
                pageSize: 5,
                className: 'paginationjs-big'
            }
        },
        {
            id: 6,
            desc: 'Format result data',
            anchor: 'format_result_data',
            options: {
                dataSource: generateData(100),
                pageSize: 8,
                className: 'paginationjs-big',
                formatResult: function (data) {
                    var result = [];
                    for (var i = 0; i < data.length; i++) {
                        result.push(data[i] + ' - good guys');
                    }
                    return result;
                }
            }
        },
        {
            id: 9,
            desc: 'Another format result data',
            anchor: 'format_result_data2',
            options: {
                dataSource: generateObjData(100),
                pageSize: 5,
                className: 'paginationjs-big',
                formatResult: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        data[i].a = data[i].a + ' - bad guys';
                    }
                },
                callback: function (data) {
                    var paginationWrapper = document.querySelector('#demo9');
                    if (!paginationWrapper)
                        return;
                    var dataContainer = paginationWrapper.querySelector('.data-container');
                    var html = '<ul>';
                    data.forEach(function (item) {
                        html += '<li>' + item.a + '</li>';
                    });
                    html += '</ul>';
                    dataContainer.innerHTML = html;
                }
            }
        },
        {
            id: 4,
            desc: 'Format navigator',
            anchor: 'format_navigator',
            options: {
                dataSource: generateData(15),
                pageSize: 5,
                position: 'top',
                showNavigator: true,
                formatNavigator: '<%= rangeStart %>-<%= rangeEnd %> of <%= totalNumber %> items',
                className: 'paginationjs-big'
            }
        },
        {
            id: 10,
            desc: 'Format "go" input',
            anchor: 'format_go_input',
            options: {
                dataSource: generateData(25),
                pageSize: 5,
                showGoInput: true,
                showGoButton: true,
                className: 'paginationjs-big',
                formatGoInput: 'go to <%= input %> st/rd/th'
            }
        },
        {
            id: 11,
            desc: 'Methods & Events',
            anchor: 'methods_events',
            options: {
                dataSource: generateData(100),
                pageSize: 5,
                showGoInput: true,
                showGoButton: true,
                className: 'paginationjs-big'
            }
        }
    ];
    var hooks = [
        'beforeInit',
        'beforeRender',
        'beforePaging',
        'beforeSizeSelectorChange',
        'beforeDestroy',
        'beforeDisable',
        'beforeEnable',
        'beforePreviousOnClick',
        'beforePageOnClick',
        'beforeNextOnClick',
        'beforeGoInputOnEnter',
        'beforeGoButtonOnClick',
        'afterInit',
        'afterRender',
        'afterPaging',
        'afterSizeSelectorChange',
        'afterDestroy',
        'afterDisable',
        'afterEnable',
        'afterPreviousOnClick',
        'afterPageOnClick',
        'afterNextOnClick',
        'afterGoInputOnEnter',
        'afterGoButtonOnClick',
        'afterIsFirstPage',
        'afterIsLastPage'
    ];
    var ctrl = {
        createDemo: function (config) {
            var _this = this;
            var id = config.id;
            var desc = config.desc;
            var anchor = config.anchor;
            var options = config.options;
            var disableContainerMaxHeight = config.disableContainerMaxHeight;
            if (!id) {
                id = Math.floor(Math.random() * 1000);
            }
            var key = 'demo' + id;
            var demoWrapper = document.querySelector('#J-demo');
            var templates = document.querySelector('#template-' + key);
            if (!templates) {
                templates = document.querySelector('#template-demo');
            }
            var section = document.createElement('div');
            section.innerHTML = templates.innerHTML;
            demoWrapper.appendChild(section);
            var sectionTitle = section.querySelector('.demo-section-title');
            if (sectionTitle) {
                sectionTitle.textContent = desc;
                var anchorElem = document.createElement('a');
                anchorElem.name = anchor;
                sectionTitle.parentNode.insertBefore(anchorElem, sectionTitle);
            }
            var paginationWrapper = section.querySelector('.preview');
            if (paginationWrapper) {
                paginationWrapper.id = key;
            }
            var dataContainer = paginationWrapper
                ? paginationWrapper.querySelector('.data-container')
                : null;
            if (dataContainer && !disableContainerMaxHeight) {
                var guessHeight = Math.min(options.pageSize * 35, 175);
                dataContainer.style.minHeight = guessHeight + 'px';
                dataContainer.style.maxHeight = Math.min(options.pageSize * 35, 285) + 'px';
            }
            if (!options.callback) {
                options.callback = function (data, pagination) {
                    if (window.console) {
                        console.log(id, desc, data, pagination);
                    }
                    if (dataContainer) {
                        dataContainer.innerHTML = _this.template(data);
                    }
                };
            }
            if (paginationWrapper instanceof HTMLElement) {
                pagination(paginationWrapper, options);
            }
        },
        createDemos: function () {
            var _this = this;
            var demoWrapper = document.querySelector('#J-demo');
            if (demoWrapper) {
                demoWrapper.innerHTML = '';
            }
            demoConfigs.forEach(function (config) {
                _this.createDemo(config);
            });
        },
        template: function (data) {
            var html = '<ul>';
            if (data && data[0] && (data[0].published || data[0].title)) {
                data.forEach(function (item) {
                    html += '<li><a href="' + item.link + '">' + (item.title || item.link) + '</a></li>';
                });
            }
            else {
                data.forEach(function (item) {
                    html += '<li>' + item + '</li>';
                });
            }
            html += '</ul>';
            return html;
        },
        addHooks: function () {
            var eventsContainer = document.querySelector('#J-events-container');
            if (!eventsContainer)
                return;
            var html = '';
            hooks.forEach(function (hook) {
                html += '<div class="event-item">' +
                    '<label><input type="checkbox" value="' + hook + '" id="checkbox-' + hook + '" checked> ' + hook + '</label>' +
                    '</div>';
            });
            eventsContainer.innerHTML = html;
        },
        registerHooks: function () {
            var _this = this;
            var start = new Date().getTime();
            var i = 0;
            function logEvent(event, data) {
                var cb = document.querySelector('#checkbox-' + event);
                if (cb && !cb.checked)
                    return;
                var logContainer = document.querySelector('#J-log-container');
                if (!logContainer)
                    return;
                var now = new Date().getTime();
                var diff = now - start;
                var logs = [i, '@' + (diff / 1000).toFixed(3), '[' + event + ']'];
                var argstr = ' Args: ';
                for (var j = 0; j < data.length; j++) {
                    var dataItem = data[j];
                    try {
                        if (typeof dataItem === 'object' && dataItem !== null && dataItem.type) {
                            argstr += '[Event Object]';
                        }
                        else {
                            argstr += JSON.stringify(dataItem);
                        }
                    }
                    catch (e) {
                        if (dataItem && dataItem.toString) {
                            argstr += dataItem.toString();
                        }
                    }
                    if (j < data.length - 1) {
                        argstr += ', ';
                    }
                }
                logs.push(argstr);
                if (window.console) {
                    console.log(i, '@' + diff / 1000, '[' + event + ']', data);
                }
                var li = document.createElement('li');
                li.innerHTML = logs.join(' ');
                logContainer.appendChild(li);
                logContainer.scrollTop = logContainer.scrollHeight;
                i++;
            }
            var config = demoConfigs[demoConfigs.length - 1].options;
            hooks.forEach(function (hook) {
                config[hook] = function () {
                    logEvent(hook, arguments);
                };
            });
        },
        prettyprint: function () {
        },
        observer: function () {
            this.registerHooks();
            this.createDemos();
            this.addHooks();
            this.prettyprint();
            var logClear = document.querySelector('#J-log-clear');
            var checkAll = document.querySelector('#J-checkAll');
            var gotoTop = document.querySelector('#gototop');
            var eventsContainer = document.querySelector('#J-events-container');
            if (logClear) {
                logClear.addEventListener('click', function () {
                    var logContainer = document.querySelector('#J-log-container');
                    if (logContainer) {
                        logContainer.innerHTML = '';
                    }
                });
            }
            if (checkAll && eventsContainer) {
                checkAll.addEventListener('click', function () {
                    var cbs = eventsContainer.querySelectorAll('input[type="checkbox"]');
                    cbs.forEach(function (cb) {
                        cb.checked = !cb.checked;
                    });
                });
            }
            if (gotoTop) {
                gotoTop.addEventListener('click', function () {
                    window.scrollTo(0, 0);
                });
            }
            var actions = document.querySelector('#J-actions');
            if (actions) {
                actions.addEventListener('click', function (e) {
                    if (e.target instanceof HTMLElement) {
                        var btn = e.target.closest('.button');
                        if (!btn)
                            return;
                        var action = btn.getAttribute('data-action');
                        var type = btn.getAttribute('data-type');
                        var params = btn.getAttribute('data-params');
                        var container = document.querySelector('#demo11');
                        if (!container)
                            return;
                        if (type === 'get') {
                        }
                        else {
                            if (params) {
                            }
                            else {
                            }
                        }
                    }
                });
            }
        },
        init: function () {
            this.observer();
        }
    };
    ctrl.init();
});
//# sourceMappingURL=main.js.map