import ShortUniqueId from 'short-unique-id';
import merge from 'lodash.merge';
import template from 'lodash.template';

/**
 *
 */
class AccessModal {

    /**
     @class AccessModal
     @summary Access modal
     @param {Object} options - Supplied configuration
     @param {String} [options.id=null] Id attribute of chrome, also is used as prefix for inner elements ids
     @param {String|HTMLElement} [options.focusAfterClose=null] Selector string or node, that will be focused after AccessModal is closed
     @param {String|HTMLElement} [options.focusAfterOpen=null] Selector string or node inside modal, that will be focused after AccessModal is opened
     @param {String} [options.chromeRole="alertdialog"] Role attribute of chrome
     @param {String} [options.contentRole="document"] Role attribute of content
     @param {Number} [options.overlayOpacity=0.8] Opacity of overlay element
     @param {Number} [options.zIndex=100] Z-index of overlay element
     @param {Boolean} [options.writeInlineStyles=true] Will apply all inline styles if true

     @param {String} [options.template=null] Template
     @param {String} [options.templateVars=null] Template variables, key - value

     @param {Object} [options.closeButtonsSelector] - Close buttons selector
     @param {Object} [options.closeButtonDescriptionSelector] - Close button description selector
     @param {Object} [options.titleSelector] - Title node selector
     @param {Object} [options.descriptionSelector] - Title description element, invisible text

     @param {Object} [options.cssClassMap] - User supplied class for elements
     @param {String} [options.cssClassMap.chrome="access-modal access-modal-opened"] - Chrome (main) element
     @param {String} [options.cssClassMap.overlay="access-modal-overlay"] - Overlay element
     @param {String} [options.cssClassMap.content="access-modal-content"] - Content element (contains interior element)
     @param {String} [options.cssClassMap.everythingElse="access-modal-everything-else"] - Aria hidden element, will contain all body content when AccessDropdown is opened
     @param {Object} [options.callbacks] - User supplied functions to execute at given stages of the component lifecycle
     @param {Object} [options.focusableSelectorList] - Selector of elements, that may get focus
     @param {Function} options.callbacks.preOpen
     @param {Function} options.callbacks.postOpen
     @param {Function} options.callbacks.preClose
     @param {Function} options.callbacks.postClose
     @param {Function} options.callbacks.preEsc
     @param {Function} options.callbacks.postEsc
     */
    constructor(options) {
        let defaults;

        if (options === undefined) {
            options = {};
        }

        if (document.body.getAttribute('data-access-modals-opened') === null) {
            document.body.setAttribute('data-access-modals-opened', '0');
        }

        defaults = {
            id: null,
            focusAfterClose: null,
            focusAfterOpen: null,
            chromeRole: 'alertdialog',
            contentRole: 'document',
            overlayOpacity: 0.8,
            zIndex: 100,
            writeInlineStyles: true,

            closeButtonsSelector: '.access-modal-close-button',
            closeButtonDescriptionSelector: '.access-modal-close-button-description',

            titleSelector: '.access-modal-title',
            descriptionSelector: '.access-modal-description',

            template: null,
            templateVars: null,

            cssClassMap: {
                chrome: 'access-modal access-modal-opened',
                overlay: 'access-modal-overlay',
                content: 'access-modal-content',
                everythingElse: 'access-modal-everything-else'
            },
            focusableSelectorList: [
                'a[href]:not([tabindex="-1"])',
                'area[href]:not([tabindex="-1"])',
                'input:not([disabled]):not([tabindex="-1"])',
                'select:not([disabled]):not([tabindex="-1"])',
                'textarea:not([disabled]):not([tabindex="-1"])',
                'button:not([disabled]):not([tabindex="-1"])',
                'iframe:not([tabindex="-1"])',
                '[tabindex]:not([tabindex="-1"])',
                '[contentEditable=true]:not([tabindex="-1"])'
            ]
        };

        this.options = merge(defaults, options);

        if (this.options.chromeRole !== 'dialog' && this.options.chromeRole !== 'alertdialog') {
            throw new Error('You must set chromeRole=`dialog` or chromeRole=`alertdialog` in the modal options.');
        }

        if (!this.options.id) {
            let uid = new ShortUniqueId();
            this.options.id = 'access-modal-' + uid.randomUUID(6);
        }

        this.chrome = null;
        this.everythingElse = document.createElement('div');
        this.everythingElse.setAttribute('aria-hidden', true);
        this.everythingElse.style.position = 'relative';
        this.everythingElse.style.zIndex = '1';

        AccessModal.addClass(this.everythingElse, this.options.cssClassMap.everythingElse);
    }

    /**
     * If modal is opened, return chrome node
     *
     * @access public
     * @returns {null|*}
     */
    isOpened() {
        return this.chrome;
    }

    /**
     * Open modal
     *
     * @access public
     */
    open() {
        let focusAfterOpenEl;

        this.callCustom('preOpen');

        // Already opened
        if (this.chrome) {
            return;
        }

        this.chrome = this.buildChromeHtml();
        // Remember what had focus before opening modal, if certain element is not set
        if (!this.options.focusAfterClose) {
            this.lastActiveElement = document.activeElement;
        }

        // Hide everything in the DOM from screen readers by making an new aria-hidden element and moving all chromes beneath
        while (document.body.childNodes.length) {
            this.everythingElse.appendChild(document.body.firstChild);
        }

        document.body.appendChild(this.everythingElse);

        // Freeze body, if this is first modal
        if (document.body.getAttribute('data-access-modals-opened') === '0') {
            AccessModal.injectBodyFreezeCssClass();
            document.body.classList.add('access-modal-active');
        }

        // Show the modal chrome - make it the first position in the DOM
        document.body.insertBefore(this.chrome, document.body.firstChild);

        document.body.setAttribute('data-access-modals-opened',
            document.body.getAttribute('data-access-modals-opened') * 1 + 1
        );

        // Ensure the tabindex === 0 on the modal content
        this.content.setAttribute('tabindex', 0);
        if (this.options.contentRole) {
            this.content.setAttribute('role', this.options.contentRole);
        }

        // Focus the modal window itself or focusAfterOpen node
        if (typeof this.options.focusAfterOpen === 'string') {
            focusAfterOpenEl = document.querySelector(this.options.focusAfterOpen);
        } else {
            focusAfterOpenEl = this.options.focusAfterOpen;
        }

        if (focusAfterOpenEl && typeof focusAfterOpenEl.focus === 'function') {
            focusAfterOpenEl.focus();
        } else {
            this.content.focus();
        }

        // Key
        //

        this.onKeyBind = this.onKey.bind(this);
        document.addEventListener('keydown', this.onKeyBind);

        // Click
        //

        this.onCloseButtonClickBind = this.onCloseButtonClick.bind(this);
        //required: listen for click/touch on the close button
        [].forEach.call(this.content.querySelectorAll(this.options.closeButtonsSelector), closeButton => {
            closeButton.addEventListener('click', this.onCloseButtonClickBind);
            closeButton.addEventListener('touch', this.onCloseButtonClickBind);
        });

        // Focus
        //

        // Restrict focus
        this.onFocusBind = this.onFocus.bind(this);
        [].forEach.call(document.querySelectorAll(this.options.focusableSelectorList.join(',')), anyElement => {
            anyElement.addEventListener('focus', this.onFocusBind);
        });

        this.callCustom('postOpen');
    }

    /**
     * Close modal
     *
     * @access public
     */
    close() {
        this.callCustom('preClose');

        // Mve everything out of the aria-hidden wrapper back to the original positions in the body
        while (this.everythingElse.childNodes.length) {
            this.everythingElse.parentNode.appendChild(this.everythingElse.firstChild);
        }

        this.chrome.parentNode.removeChild(this.everythingElse);

        document.body.setAttribute('data-access-modals-opened',
            document.body.getAttribute('data-access-modals-opened') * 1 - 1
        );

        // Unfreeze the body scroll when last modal is removed
        if (document.body.getAttribute('data-access-modals-opened') === '0') {
            AccessModal.removeBodyFreezeCssClass();
            document.body.classList.remove('access-modal-active');
        }

        // Key
        //

        if (this.onKeyBind !== null) {
            document.removeEventListener('keydown', this.onKeyBind);
            this.onKeyBind = null;
        }

        // Focus
        //

        // Restore focusability on everything else
        if (this.onFocusBind !== null) {
            [].forEach.call(document.querySelectorAll(this.options.focusableSelectorList.join(',')), anyElement => {
                anyElement.removeEventListener('focus', this.onFocusBind);
            });

            // Done with this listener, destroy it
            this.onFocusBind = null;
        }

        // Click
        //

        if (this.onCloseButtonClickBind !== null) {
            [].forEach.call(this.content.querySelectorAll(this.options.closeButtonsSelector), closeButton => {
                closeButton.removeEventListener('click', this.onCloseButtonClickBind);
                closeButton.removeEventListener('touch', this.onCloseButtonClickBind);
            });
            this.onCloseButtonClickBind = null;
        }

        // Destroy the chrome (remove from DOM)
        this.chrome.parentNode.removeChild(this.chrome);
        this.chrome = null;

        // Restore focus to previous page chrome after modal has closed, or set focus to given in options selector or node
        if (this.lastActiveElement) {
            this.lastActiveElement.focus();
        } else if (this.options.focusAfterClose) {
            let focusAfterCloseEl;
            if (typeof this.options.focusAfterClose === 'string') {
                focusAfterCloseEl = document.querySelector(this.options.focusAfterClose);
            } else {
                focusAfterCloseEl = this.options.focusAfterClose;
            }
            if (focusAfterCloseEl && typeof focusAfterCloseEl.focus === 'function') {
                focusAfterCloseEl.focus();
            }
        }

        this.callCustom('postClose');
    }

    /**
     * Build modal nodes, chrome, overlay, content
     *
     * @access private
     * @returns {HTMLDivElement | HTMLDivElement | *}
     */
    buildChromeHtml() {
        let chrome;

        chrome = document.createElement('div');

        AccessModal.addClass(chrome, this.options.cssClassMap.chrome);
        chrome.style.position = 'relative';
        chrome.style.zIndex = '2';
        chrome.setAttribute('role', this.options.chromeRole);
        chrome.setAttribute('id', this.options.id);
        // Ensure the tabindex === -1 on the modal chrome
        chrome.setAttribute('tabindex', '-1');
        if (this.options.writeInlineStyles) {
            chrome.style.position = 'fixed';
            chrome.style.zIndex = this.options.zIndex;
            chrome.style.top = '0';
            chrome.style.right = '0';
            chrome.style.bottom = '0';
            chrome.style.left = '0';
            chrome.style.height = '100%';
            chrome.style.width = '100%';
        }

        this.overlay = document.createElement('div');
        AccessModal.addClass(this.overlay, this.options.cssClassMap.overlay);
        if (this.options.writeInlineStyles) {
            this.overlay.style.backgroundColor = 'rgba(0, 0, 0, ' + this.options.overlayOpacity + ')';
            this.overlay.style.pointerEvents = 'none';
            this.overlay.style.position = 'absolute';
            this.overlay.style.zIndex = this.options.zIndex;
            this.overlay.style.top = '0';
            this.overlay.style.right = '0';
            this.overlay.style.bottom = '0';
            this.overlay.style.left = '0';
            this.overlay.style.height = '100%';
            this.overlay.style.width = '100%';
        }

        this.content = document.createElement('div');
        AccessModal.addClass(this.content, this.options.cssClassMap.content);
        if (this.options.writeInlineStyles) {
            this.content.style.position = 'relative';
            this.content.style.zIndex = this.options.zIndex + 1;
        }

        this.content.insertAdjacentHTML('beforeend', template(this.options.template)(this.options.templateVars));

        this.title = this.content.querySelector(this.options.titleSelector);
        if (this.title) {
            let id;
            id = this.title.getAttribute('id');
            if (!id) {
                id = this.options.id + '-title';
                this.title.setAttribute('id', id);
            }
            chrome.setAttribute('aria-labelledby', id);
        }

        this.description = this.content.querySelector(this.options.descriptionSelector);
        if (this.description) {
            let id;
            id = this.description.getAttribute('id');
            if (!id) {
                id = this.options.id + '-description';
                this.description.setAttribute('id', id);
            }
            chrome.setAttribute('aria-describedby', id);
        }

        this.closeButtonDescription = this.content.querySelector(this.options.closeButtonDescriptionSelector);
        if (this.closeButtonDescription) {
            let id;
            id = this.closeButtonDescription.getAttribute('id');
            if (!id) {
                id = this.options.id + '-close-button-description';
                this.closeButtonDescription.setAttribute('id', id);
            }

            [].forEach.call(this.content.querySelectorAll(this.options.closeButtonsSelector), closeButton => {
                closeButton.setAttribute('aria-describedby', id);
            });
        }

        // Add overlay and content
        chrome.appendChild(this.overlay);
        chrome.appendChild(this.content);

        return chrome;
    }

    /**
     * Call user defined callbacks
     *
     * @access private
     * @param userFn
     */
    callCustom(userFn) {
        let sliced;

        sliced = Array.prototype.slice.call(arguments, 1);

        if (this.options.callbacks !== undefined && this.options.callbacks[userFn] !== undefined && typeof this.options.callbacks[userFn] === 'function'
        ) {
            this.options.callbacks[userFn].apply(this, sliced);
        }
    }

    /**
     * Stop focus from anything outside the modal
     *
     * @access private
     * @param event
     */
    onFocus(event) {
        if (!this.content.contains(event.target)) {
            event.stopPropagation();
            this.content.focus();
        }
    }

    /**
     * On document keydown event handler
     *
     * @access private
     * @param event
     */
    onKey(event) {
        let code;
        code = event.charCode || event.keyCode;

        if (event.type === 'keydown' && code === 27) {
            //topmost modal only
            if (this.chrome.parentNode === document.body) {
                this.close('onEscKey');
            }
        }
    }

    /**
     * On close button click event handler
     *
     * @access private
     * @param event
     */
    onCloseButtonClick(event) {
        if ((event.type === 'click' || event.type === 'touch')) {

            [].forEach.call(this.content.querySelectorAll(this.options.closeButtonsSelector), closeButton => {
                if (closeButton === event.target || closeButton.contains(event.target)) {
                    this.callCustom('preEsc');
                    event.stopPropagation();
                    this.close('onCloseButtonClickEvent');
                    this.callCustom('postEsc');
                }
            });
        }
    }

    /**
     * Inject body freeze css class as style node into head
     *
     * @static
     * @access private
     */
    static injectBodyFreezeCssClass() {
        let style;

        if (document.getElementById('access-modal-body-freeze-css')) {
            return;
        }

        style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.setAttribute('id', 'access-modal-body-freeze-css-class');
        style.innerHTML = '.access-modal-active {overflow: hidden;}';

        document.getElementsByTagName('head')[0].appendChild(style);
    }

    /**
     * Remove style node that contains body freeze css class
     *
     * @static
     * @access private
     */
    static removeBodyFreezeCssClass() {
        let style;

        style = document.getElementById('access-modal-body-freeze-css');
        if (style) {
            style.parentNode.removeChild(style);
        }
    }

    /**
     * Add css classes to the node, allows to add multiple classes separated by space
     *
     * @access private
     * @param element
     * @param classString
     */
    static addClass(element, classString) {
        let part, i;
        part = classString.split(' ');
        for (i = 0; i < part.length; i++) {
            if (part[i].trim() !== '') {
                element.classList.add(part[i]);
            }
        }
    }
}

export default AccessModal;
