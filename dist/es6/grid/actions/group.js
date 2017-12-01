import { Draggable, Droppable } from '@syncfusion/ej2-base';
import { createElement, closest, remove, classList, addClass, removeClass } from '@syncfusion/ej2-base';
import { isNullOrUndefined, extend } from '@syncfusion/ej2-base';
import { parentsUntil, isActionPrevent } from '../base/util';
import * as events from '../base/constant';
import { AriaService } from '../services/aria-service';
/**
 *
 * `Group` module is used to handle group action.
 */
var Group = /** @class */ (function () {
    /**
     * Constructor for Grid group module
     * @hidden
     */
    function Group(parent, groupSettings, sortedColumns, serviceLocator) {
        var _this = this;
        this.visualElement = createElement('div', {
            className: 'e-cloneproperties e-dragclone e-gdclone',
            styles: 'line-height:23px', attrs: { action: 'grouping' }
        });
        this.helper = function (e) {
            var gObj = _this.parent;
            var target = e.sender.target;
            var element = target.classList.contains('e-groupheadercell') ? target :
                parentsUntil(target, 'e-groupheadercell');
            if (!element) {
                return false;
            }
            _this.column = gObj.getColumnByField(element.firstElementChild.getAttribute('ej-mappingname'));
            _this.visualElement.textContent = element.textContent;
            _this.visualElement.style.width = element.offsetWidth + 2 + 'px';
            _this.visualElement.style.height = element.offsetHeight + 2 + 'px';
            _this.visualElement.setAttribute('e-mappinguid', _this.column.uid);
            gObj.element.appendChild(_this.visualElement);
            return _this.visualElement;
        };
        this.dragStart = function () {
            _this.parent.element.classList.add('e-ungroupdrag');
        };
        this.drag = function (e) {
            var target = e.target;
            var cloneElement = _this.parent.element.querySelector('.e-cloneproperties');
            _this.parent.trigger(events.columnDrag, { target: target, draggableType: 'headercell', column: _this.column });
            classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
            if (!(parentsUntil(target, 'e-gridcontent') || parentsUntil(target, 'e-headercell'))) {
                classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
            }
        };
        this.dragStop = function (e) {
            _this.parent.element.classList.remove('e-ungroupdrag');
            if (!(parentsUntil(e.target, 'e-gridcontent') || parentsUntil(e.target, 'e-gridheader'))) {
                remove(e.helper);
                return;
            }
        };
        this.drop = function (e) {
            var gObj = _this.parent;
            var column = gObj.getColumnByUid(e.droppedElement.getAttribute('e-mappinguid'));
            _this.element.classList.remove('e-hover');
            remove(e.droppedElement);
            _this.aria.setDropTarget(_this.parent.element.querySelector('.e-groupdroparea'), false);
            _this.aria.setGrabbed(_this.parent.getHeaderTable().querySelector('[aria-grabbed=true]'), false);
            if (isNullOrUndefined(column) || column.allowGrouping === false ||
                parentsUntil(gObj.getColumnHeaderByUid(column.uid), 'e-grid').getAttribute('id') !==
                    gObj.element.getAttribute('id')) {
                return;
            }
            _this.groupColumn(column.field);
        };
        this.contentRefresh = true;
        this.aria = new AriaService();
        this.parent = parent;
        this.groupSettings = groupSettings;
        this.serviceLocator = serviceLocator;
        this.sortedColumns = sortedColumns;
        this.focus = serviceLocator.getService('focus');
        this.addEventListener();
    }
    Group.prototype.columnDrag = function (e) {
        var gObj = this.parent;
        var cloneElement = this.parent.element.querySelector('.e-cloneproperties');
        classList(cloneElement, ['e-defaultcur'], ['e-notallowedcur']);
        if (!parentsUntil(e.target, 'e-groupdroparea') &&
            !(this.parent.allowReordering && parentsUntil(e.target, 'e-headercell'))) {
            classList(cloneElement, ['e-notallowedcur'], ['e-defaultcur']);
        }
        e.target.classList.contains('e-groupdroparea') ? this.element.classList.add('e-hover') : this.element.classList.remove('e-hover');
    };
    Group.prototype.columnDragStart = function (e) {
        if (e.target.classList.contains('e-stackedheadercell')) {
            return;
        }
        var gObj = this.parent;
        var dropArea = this.parent.element.querySelector('.e-groupdroparea');
        this.aria.setDropTarget(dropArea, e.column.allowGrouping);
        var element = e.target.classList.contains('e-headercell') ? e.target : parentsUntil(e.target, 'e-headercell');
        this.aria.setGrabbed(element, true, !e.column.allowGrouping);
    };
    Group.prototype.columnDrop = function (e) {
        var gObj = this.parent;
        if (e.droppedElement.getAttribute('action') === 'grouping') {
            var column = gObj.getColumnByUid(e.droppedElement.getAttribute('e-mappinguid'));
            if (isNullOrUndefined(column) || column.allowGrouping === false ||
                parentsUntil(gObj.getColumnHeaderByUid(column.uid), 'e-grid').getAttribute('id') !==
                    gObj.element.getAttribute('id')) {
                return;
            }
            this.ungroupColumn(column.field);
        }
    };
    /**
     * @hidden
     */
    Group.prototype.addEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(events.uiUpdate, this.enableAfterRender, this);
        this.parent.on(events.groupComplete, this.onActionComplete, this);
        this.parent.on(events.ungroupComplete, this.onActionComplete, this);
        this.parent.on(events.inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(events.click, this.clickHandler, this);
        this.parent.on(events.columnDrag, this.columnDrag, this);
        this.parent.on(events.columnDragStart, this.columnDragStart, this);
        this.parent.on(events.columnDrop, this.columnDrop, this);
        this.parent.on(events.headerRefreshed, this.refreshSortIcons, this);
        this.parent.on(events.sortComplete, this.refreshSortIcons, this);
        this.parent.on(events.keyPressed, this.keyPressHandler, this);
        this.parent.on(events.contentReady, this.initialEnd, this);
        this.parent.on(events.initialEnd, this.render, this);
    };
    /**
     * @hidden
     */
    Group.prototype.removeEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(events.initialEnd, this.render);
        this.parent.off(events.uiUpdate, this.enableAfterRender);
        this.parent.off(events.groupComplete, this.onActionComplete);
        this.parent.off(events.ungroupComplete, this.onActionComplete);
        this.parent.off(events.inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(events.click, this.clickHandler);
        this.parent.off(events.columnDrag, this.columnDrag);
        this.parent.off(events.columnDragStart, this.columnDragStart);
        this.parent.off(events.columnDrop, this.columnDrop);
        this.parent.off(events.headerRefreshed, this.refreshSortIcons);
        this.parent.off(events.sortComplete, this.refreshSortIcons);
        this.parent.off(events.keyPressed, this.keyPressHandler);
    };
    Group.prototype.initialEnd = function () {
        var gObj = this.parent;
        this.parent.off(events.contentReady, this.initialEnd);
        if (this.parent.getColumns().length && this.groupSettings.columns.length) {
            this.contentRefresh = false;
            for (var _i = 0, _a = gObj.groupSettings.columns; _i < _a.length; _i++) {
                var col = _a[_i];
                this.groupColumn(col);
            }
            this.contentRefresh = true;
        }
    };
    Group.prototype.keyPressHandler = function (e) {
        var gObj = this.parent;
        if (!this.groupSettings.columns.length) {
            return;
        }
        e.preventDefault();
        switch (e.action) {
            case 'altDownArrow':
            case 'altUpArrow':
                var selected = gObj.allowSelection ? gObj.getSelectedRowIndexes() : [];
                if (selected.length) {
                    var rows = gObj.getContentTable().querySelector('tbody').children;
                    var dataRow = gObj.getDataRows()[selected[selected.length - 1]];
                    var grpRow = void 0;
                    for (var i = dataRow.rowIndex; i >= 0; i--) {
                        if (!rows[i].classList.contains('e-row') && !rows[i].classList.contains('e-detailrow')) {
                            grpRow = rows[i];
                            break;
                        }
                    }
                    this.expandCollapseRows(grpRow.querySelector(e.action === 'altUpArrow' ?
                        '.e-recordplusexpand' : '.e-recordpluscollapse'));
                }
                break;
            case 'ctrlDownArrow':
                this.expandAll();
                break;
            case 'ctrlUpArrow':
                this.collapseAll();
                break;
            case 'enter':
                if (this.parent.isEdit) {
                    return;
                }
                var element = this.focus.getFocusedElement();
                var row = element.parentElement.querySelector('[class^="e-record"]');
                if (!row) {
                    break;
                }
                this.expandCollapseRows(row);
                break;
        }
    };
    Group.prototype.clickHandler = function (e) {
        this.expandCollapseRows(e.target);
        this.applySortFromTarget(e.target);
        this.unGroupFromTarget(e.target);
        this.toogleGroupFromHeader(e.target);
    };
    Group.prototype.unGroupFromTarget = function (target) {
        if (target.classList.contains('e-ungroupbutton')) {
            this.ungroupColumn(target.parentElement.getAttribute('ej-mappingname'));
        }
    };
    Group.prototype.toogleGroupFromHeader = function (target) {
        if (this.groupSettings.showToggleButton) {
            if (target.classList.contains('e-grptogglebtn')) {
                if (target.classList.contains('e-toggleungroup')) {
                    this.ungroupColumn(this.parent.getColumnByUid(target.parentElement.getAttribute('e-mappinguid')).field);
                }
                else {
                    this.groupColumn(this.parent.getColumnByUid(target.parentElement.getAttribute('e-mappinguid')).field);
                }
            }
            else {
                if (target.classList.contains('e-toggleungroup')) {
                    this.ungroupColumn(target.parentElement.getAttribute('ej-mappingname'));
                }
            }
        }
    };
    Group.prototype.applySortFromTarget = function (target) {
        var gObj = this.parent;
        var gHeader = closest(target, '.e-groupheadercell');
        if (gObj.allowSorting && gHeader && !target.classList.contains('e-ungroupbutton') &&
            !target.classList.contains('e-toggleungroup')) {
            var field = gHeader.firstElementChild.getAttribute('ej-mappingname');
            if (gObj.getColumnHeaderByField(field).querySelectorAll('.e-ascending').length) {
                gObj.sortColumn(field, 'descending', true);
            }
            else {
                gObj.sortColumn(field, 'ascending', true);
            }
        }
    };
    /**
     * Expand or collapse grouped rows by target element.
     * @param  {Element} target - Defines the target element of grouped row.
     * @return {void}
     */
    Group.prototype.expandCollapseRows = function (target) {
        var trgt = parentsUntil(target, 'e-recordplusexpand') ||
            parentsUntil(target, 'e-recordpluscollapse');
        if (trgt) {
            var cellIdx = trgt.cellIndex;
            var rowIdx = trgt.parentElement.rowIndex;
            var rowNodes = this.parent.getContentTable().querySelector('tbody').children;
            var rows = [].slice.call(rowNodes).slice(rowIdx + 1, rowNodes.length);
            var isHide = void 0;
            var expandElem = void 0;
            var toExpand = [];
            var indent = trgt.parentElement.querySelectorAll('.e-indentcell').length;
            var expand = false;
            if (trgt.classList.contains('e-recordpluscollapse')) {
                addClass([trgt], 'e-recordplusexpand');
                removeClass([trgt], 'e-recordpluscollapse');
                trgt.firstElementChild.className = 'e-icons e-gdiagonaldown e-icon-gdownarrow';
                expand = true;
            }
            else {
                isHide = true;
                removeClass([trgt], 'e-recordplusexpand');
                addClass([trgt], 'e-recordpluscollapse');
                trgt.firstElementChild.className = 'e-icons e-gnextforward e-icon-grightarrow';
            }
            this.aria.setExpand(trgt, expand);
            for (var i = 0, len = rows.length; i < len; i++) {
                if (rows[i].querySelectorAll('td')[cellIdx] &&
                    rows[i].querySelectorAll('td')[cellIdx].classList.contains('e-indentcell') && rows) {
                    if (isHide) {
                        rows[i].style.display = 'none';
                    }
                    else {
                        if (rows[i].querySelectorAll('.e-indentcell').length === indent + 1) {
                            rows[i].style.display = '';
                            expandElem = rows[i].querySelector('.e-recordplusexpand');
                            if (expandElem) {
                                toExpand.push(expandElem);
                            }
                            if (rows[i].classList.contains('e-detailrow')) {
                                if (rows[i - 1].querySelectorAll('.e-detailrowcollapse').length) {
                                    rows[i].style.display = 'none';
                                }
                            }
                        }
                    }
                }
                else {
                    break;
                }
            }
            for (var i = 0, len = toExpand.length; i < len; i++) {
                removeClass([toExpand[i]], 'e-recordplusexpand');
                addClass([toExpand[i]], 'e-recordpluscollapse');
                toExpand[i].firstElementChild.className = 'e-icons e-gnextforward e-icon-grightarrow';
                this.expandCollapseRows(toExpand[i]);
            }
        }
    };
    Group.prototype.expandCollapse = function (isExpand) {
        var rowNodes = this.parent.getContentTable().querySelector('tbody').children;
        var row;
        for (var i = 0, len = rowNodes.length; i < len; i++) {
            if (rowNodes[i].querySelectorAll('.e-recordplusexpand, .e-recordpluscollapse').length) {
                row = rowNodes[i].querySelector(isExpand ? '.e-recordpluscollapse' : '.e-recordplusexpand');
                if (row) {
                    row.className = isExpand ? 'e-recordplusexpand' : 'e-recordpluscollapse';
                    row.firstElementChild.className = isExpand ? 'e-icons e-gdiagonaldown e-icon-gdownarrow' :
                        'e-icons e-gnextforward e-icon-grightarrow';
                }
                if (!(rowNodes[i].firstElementChild.classList.contains('e-recordplusexpand') ||
                    rowNodes[i].firstElementChild.classList.contains('e-recordpluscollapse'))) {
                    rowNodes[i].style.display = isExpand ? '' : 'none';
                }
            }
            else {
                rowNodes[i].style.display = isExpand ? '' : 'none';
            }
        }
    };
    /**
     * Expands all the grouped rows of Grid.
     * @return {void}
     */
    Group.prototype.expandAll = function () {
        this.expandCollapse(true);
    };
    /**
     * Collapses all the grouped rows of Grid.
     * @return {void}
     */
    Group.prototype.collapseAll = function () {
        this.expandCollapse(false);
    };
    /**
     * The function is used to render grouping
     * @return {Element}
     * @hidden
     */
    Group.prototype.render = function () {
        this.l10n = this.serviceLocator.getService('localization');
        this.renderGroupDropArea();
        this.initDragAndDrop();
        this.refreshToggleBtn();
    };
    Group.prototype.renderGroupDropArea = function () {
        var groupElem = this.parent.element.querySelector('.e-groupdroparea');
        if (groupElem) {
            remove(groupElem);
        }
        this.element = createElement('div', { className: 'e-groupdroparea', attrs: { 'tabindex': '-1' } });
        this.updateGroupDropArea();
        this.parent.element.insertBefore(this.element, this.parent.element.firstChild);
        if (!this.groupSettings.showDropArea) {
            this.element.style.display = 'none';
        }
    };
    Group.prototype.updateGroupDropArea = function () {
        if (this.groupSettings.showDropArea && !this.groupSettings.columns.length) {
            var dragLabel = this.l10n.getConstant('GroupDropArea');
            this.element.innerHTML = dragLabel;
            this.element.classList.remove('e-grouped');
        }
        else {
            if (this.element.innerHTML === this.l10n.getConstant('GroupDropArea') && this.groupSettings.columns.length === 1) {
                this.element.innerHTML = '';
            }
            this.element.classList.add('e-grouped');
        }
    };
    Group.prototype.initDragAndDrop = function () {
        this.initializeGHeaderDrop();
        this.initializeGHeaderDrag();
    };
    Group.prototype.initializeGHeaderDrag = function () {
        var drag = new Draggable(this.element, {
            dragTarget: '.e-groupheadercell',
            distance: 5,
            helper: this.helper,
            dragStart: this.dragStart,
            drag: this.drag,
            dragStop: this.dragStop
        });
    };
    Group.prototype.initializeGHeaderDrop = function () {
        var gObj = this.parent;
        var drop = new Droppable(this.element, {
            accept: '.e-dragclone',
            drop: this.drop
        });
    };
    /**
     * Groups a column by column name.
     * @param  {string} columnName - Defines the column name to group.
     * @return {void}
     */
    Group.prototype.groupColumn = function (columnName) {
        var gObj = this.parent;
        var column = gObj.getColumnByField(columnName);
        if (isNullOrUndefined(column) || column.allowGrouping === false ||
            (this.contentRefresh && this.groupSettings.columns.indexOf(columnName) > -1)) {
            return;
        }
        if (isActionPrevent(gObj)) {
            gObj.notify(events.preventBatch, { instance: this, handler: this.groupColumn, arg1: columnName });
            return;
        }
        column.visible = gObj.groupSettings.showGroupedColumn;
        this.colName = columnName;
        if (this.contentRefresh) {
            this.updateModel();
        }
        else {
            this.addColToGroupDrop(columnName);
        }
        this.updateGroupDropArea();
    };
    /**
     * Ungroups a column by column name.
     * @param  {string} columnName - Defines the column name to ungroup.
     * @return {void}
     */
    Group.prototype.ungroupColumn = function (columnName) {
        var gObj = this.parent;
        var column = this.parent.enableColumnVirtualization ?
            this.parent.columns.filter(function (c) { return c.field === columnName; })[0] : gObj.getColumnByField(columnName);
        if (isNullOrUndefined(column) || column.allowGrouping === false || this.groupSettings.columns.indexOf(columnName) < 0) {
            return;
        }
        if (isActionPrevent(gObj)) {
            gObj.notify(events.preventBatch, { instance: this, handler: this.ungroupColumn, arg1: columnName });
            return;
        }
        column.visible = true;
        this.colName = column.field;
        var columns = JSON.parse(JSON.stringify(this.groupSettings.columns));
        columns.splice(columns.indexOf(this.colName), 1);
        if (this.sortedColumns.indexOf(columnName) < 0) {
            for (var i = 0, len = gObj.sortSettings.columns.length; i < len; i++) {
                if (columnName === gObj.sortSettings.columns[i].field) {
                    gObj.sortSettings.columns.splice(i, 1);
                    break;
                }
            }
        }
        this.groupSettings.columns = columns;
        if (gObj.allowGrouping) {
            this.parent.dataBind();
        }
    };
    /**
     * The function used to update groupSettings
     * @return {void}
     * @hidden
     */
    Group.prototype.updateModel = function () {
        var gObj = this.parent;
        var i = 0;
        var columns = JSON.parse(JSON.stringify(this.groupSettings.columns));
        columns.push(this.colName);
        this.groupSettings.columns = columns;
        while (i < gObj.sortSettings.columns.length) {
            if (gObj.sortSettings.columns[i].field === this.colName) {
                break;
            }
            i++;
        }
        if (gObj.sortSettings.columns.length === i) {
            gObj.sortSettings.columns.push({ field: this.colName, direction: 'ascending' });
        }
        else if (!gObj.allowSorting) {
            gObj.sortSettings.columns[i].direction = 'ascending';
        }
        this.parent.dataBind();
    };
    /**
     * The function used to trigger onActionComplete
     * @return {void}
     * @hidden
     */
    Group.prototype.onActionComplete = function (e) {
        var gObj = this.parent;
        if (e.requestType === 'grouping') {
            this.addColToGroupDrop(this.colName);
        }
        else {
            this.removeColFromGroupDrop(this.colName);
        }
        var args = this.groupSettings.columns.indexOf(this.colName) > -1 ? {
            columnName: this.colName, requestType: 'grouping', type: events.actionComplete
        } : { requestType: 'ungrouping', type: events.actionComplete };
        this.parent.trigger(events.actionComplete, extend(e, args));
    };
    Group.prototype.addColToGroupDrop = function (field) {
        var gObj = this.parent;
        var direction = 'ascending';
        var groupedColumn = createElement('div', { className: 'e-grid-icon e-groupheadercell' });
        var childDiv = createElement('div', { attrs: { 'ej-mappingname': field } });
        var column = this.parent.getColumnByField(field);
        //Todo headerTemplateID for grouped column, disableHtmlEncode                          
        var headerCell = gObj.getColumnHeaderByUid(column.uid);
        if (!isNullOrUndefined(column.headerTemplate)) {
            if (column.headerTemplate.indexOf('#') !== -1) {
                childDiv.innerHTML = document.querySelector(column.headerTemplate).innerHTML.trim();
            }
            else {
                childDiv.innerHTML = column.headerTemplate;
            }
            childDiv.firstElementChild.classList.add('e-grouptext');
        }
        else {
            childDiv.appendChild(createElement('span', {
                className: 'e-grouptext', innerHTML: column.headerText,
                attrs: { tabindex: '-1', 'aria-label': 'sort the grouped column' }
            }));
        }
        if (this.groupSettings.showToggleButton) {
            childDiv.appendChild(createElement('span', {
                className: 'e-togglegroupbutton e-icons e-icon-ungroup e-toggleungroup', innerHTML: '&nbsp;',
                attrs: { tabindex: '-1', 'aria-label': 'ungroup button' }
            }));
        }
        if (headerCell.querySelectorAll('.e-ascending,.e-descending').length) {
            direction = headerCell.querySelector('.e-ascending') ? 'ascending' : 'descending';
        }
        childDiv.appendChild(createElement('span', {
            className: 'e-groupsort e-icons ' + ('e-' + direction + ' e-icon-' + direction), innerHTML: '&nbsp;',
            attrs: { tabindex: '-1', 'aria-label': 'sort the grouped column' }
        }));
        childDiv.appendChild(createElement('span', {
            className: 'e-ungroupbutton e-icons e-icon-hide', innerHTML: '&nbsp;',
            attrs: { title: this.l10n.getConstant('UnGroup'), tabindex: '-1', 'aria-label': 'ungroup the grouped column' },
            styles: this.groupSettings.showUngroupButton ? '' : 'display:none'
        }));
        groupedColumn.appendChild(childDiv);
        this.element.appendChild(groupedColumn);
        //Todo:  rtl 
    };
    Group.prototype.refreshToggleBtn = function (isRemove) {
        if (this.groupSettings.showToggleButton) {
            var headers = [].slice.call(this.parent.element.getElementsByClassName('e-headercelldiv'));
            for (var i = 0, len = headers.length; i < len; i++) {
                if (!(headers[i].classList.contains('e-emptycell'))) {
                    var column = this.parent.getColumnByUid(headers[i].getAttribute('e-mappinguid'));
                    if (!this.parent.showColumnMenu || (this.parent.showColumnMenu && !column.showColumnMenu)) {
                        if (headers[i].querySelectorAll('.e-grptogglebtn').length) {
                            remove(headers[i].querySelectorAll('.e-grptogglebtn')[0]);
                        }
                        if (!isRemove) {
                            headers[i].appendChild(createElement('span', {
                                className: 'e-grptogglebtn e-icons ' +
                                    (this.groupSettings.columns.indexOf(column.field) > -1 ? 'e-toggleungroup e-icon-ungroup'
                                        : 'e-togglegroup e-icon-group'), attrs: { tabindex: '-1', 'aria-label': 'Group button' }
                            }));
                        }
                    }
                }
            }
        }
    };
    Group.prototype.removeColFromGroupDrop = function (field) {
        remove(this.getGHeaderCell(field));
        this.updateGroupDropArea();
    };
    Group.prototype.onPropertyChanged = function (e) {
        if (e.module !== this.getModuleName()) {
            return;
        }
        for (var _i = 0, _a = Object.keys(e.properties); _i < _a.length; _i++) {
            var prop = _a[_i];
            switch (prop) {
                case 'columns':
                    if (this.contentRefresh) {
                        var args = this.groupSettings.columns.indexOf(this.colName) > -1 ? {
                            columnName: this.colName, requestType: 'grouping', type: events.actionBegin
                        } : { requestType: 'ungrouping', type: events.actionBegin };
                        this.parent.notify(events.modelChanged, args);
                    }
                    break;
                case 'showDropArea':
                    this.updateGroupDropArea();
                    this.groupSettings.showDropArea ? this.element.style.display = '' : this.element.style.display = 'none';
                    break;
                case 'showGroupedColumn':
                    this.updateGroupedColumn(this.groupSettings.showGroupedColumn);
                    this.parent.notify(events.modelChanged, { requestType: 'refresh' });
                    break;
                case 'showUngroupButton':
                    this.updateButtonVisibility(this.groupSettings.showUngroupButton, 'e-ungroupbutton');
                    break;
                case 'showToggleButton':
                    this.updateButtonVisibility(this.groupSettings.showToggleButton, 'e-togglegroupbutton ');
                    this.parent.refreshHeader();
                    break;
            }
        }
    };
    Group.prototype.updateGroupedColumn = function (isVisible) {
        for (var i = 0; i < this.groupSettings.columns.length; i++) {
            this.parent.getColumnByField(this.groupSettings.columns[i]).visible = isVisible;
        }
    };
    Group.prototype.updateButtonVisibility = function (isVisible, className) {
        var gHeader = [].slice.call(this.element.querySelectorAll('.' + className));
        for (var i = 0; i < gHeader.length; i++) {
            gHeader[i].style.display = isVisible ? '' : 'none';
        }
    };
    Group.prototype.enableAfterRender = function (e) {
        if (e.module === this.getModuleName() && e.enable) {
            this.render();
        }
    };
    /**
     * To destroy the reorder
     * @return {void}
     * @hidden
     */
    Group.prototype.destroy = function () {
        this.clearGrouping();
        this.removeEventListener();
        this.refreshToggleBtn(true);
        remove(this.element);
        //call ejdrag and drop destroy
    };
    /**
     * Clears all the grouped columns of Grid.
     * @return {void}
     */
    Group.prototype.clearGrouping = function () {
        var cols = JSON.parse(JSON.stringify(this.groupSettings.columns));
        this.contentRefresh = false;
        for (var i = 0, len = cols.length; i < len; i++) {
            this.ungroupColumn(cols[i]);
        }
        this.contentRefresh = true;
    };
    /**
     * For internal use only - Get the module name.
     * @private
     */
    Group.prototype.getModuleName = function () {
        return 'group';
    };
    Group.prototype.refreshSortIcons = function (e) {
        var gObj = this.parent;
        var header;
        var cols = gObj.sortSettings.columns;
        var gCols = gObj.groupSettings.columns;
        var fieldNames = this.parent.getColumns().map(function (c) { return c.field; });
        this.refreshToggleBtn();
        for (var i = 0, len = cols.length; i < len; i++) {
            if (fieldNames.indexOf(cols[i].field) === -1) {
                continue;
            }
            header = gObj.getColumnHeaderByField(cols[i].field);
            if (!gObj.allowSorting && (this.sortedColumns.indexOf(cols[i].field) > -1 ||
                this.groupSettings.columns.indexOf(cols[i].field) > -1)) {
                classList(header.querySelector('.e-sortfilterdiv'), ['e-ascending', 'e-icon-ascending'], []);
                if (cols.length > 1) {
                    header.querySelector('.e-headercelldiv').appendChild(createElement('span', { className: 'e-sortnumber', innerHTML: (i + 1).toString() }));
                }
            }
            else if (this.getGHeaderCell(cols[i].field) && this.getGHeaderCell(cols[i].field).querySelectorAll('.e-groupsort').length) {
                if (cols[i].direction === 'ascending') {
                    classList(this.getGHeaderCell(cols[i].field).querySelector('.e-groupsort'), ['e-ascending', 'e-icon-ascending'], ['e-descending', 'e-icon-descending']);
                }
                else {
                    classList(this.getGHeaderCell(cols[i].field).querySelector('.e-groupsort'), ['e-descending', 'e-icon-descending'], ['e-ascending', 'e-icon-ascending']);
                }
            }
        }
        for (var i = 0, len = gCols.length; i < len; i++) {
            if (fieldNames.indexOf(gCols[i]) === -1) {
                continue;
            }
            gObj.getColumnHeaderByField(gCols[i]).setAttribute('aria-grouped', 'true');
        }
    };
    Group.prototype.getGHeaderCell = function (field) {
        if (this.element && this.element.querySelector('[ej-mappingname=' + field + ']')) {
            return this.element.querySelector('[ej-mappingname=' + field + ']').parentElement;
        }
        return null;
    };
    return Group;
}());
export { Group };