(function() {
    (function() {
        var supportCustomEvent = window.CustomEvent;
        if (!supportCustomEvent || typeof supportCustomEvent === "object") { supportCustomEvent = function CustomEvent(event, x) { x = x || {}; var ev = document.createEvent("CustomEvent");
                ev.initCustomEvent(event, !!x.bubbles, !!x.cancelable, x.detail || null); return ev };
            supportCustomEvent.prototype = window.Event.prototype }

        function createsStackingContext(el) {
            while (el && el !== document.body) {
                var s = window.getComputedStyle(el);
                var invalid = function(k, ok) {
                    return !(s[k] === undefined || s[k] ===
                        ok)
                };
                if (s.opacity < 1 || invalid("zIndex", "auto") || invalid("transform", "none") || invalid("mixBlendMode", "normal") || invalid("filter", "none") || invalid("perspective", "none") || s["isolation"] === "isolate" || s.position === "fixed" || s.webkitOverflowScrolling === "touch") return true;
                el = el.parentElement
            }
            return false
        }

        function findNearestDialog(el) { while (el) { if (el.localName === "dialog") return el;
                el = el.parentElement } return null }

        function safeBlur(el) { if (el && el.blur && el !== document.body) el.blur() }

        function inNodeList(nodeList,
            node) { for (var i = 0; i < nodeList.length; ++i)
                if (nodeList[i] === node) return true;
            return false }

        function isFormMethodDialog(el) { if (!el || !el.hasAttribute("method")) return false; return el.getAttribute("method").toLowerCase() === "dialog" }

        function dialogPolyfillInfo(dialog) {
            this.dialog_ = dialog;
            this.replacedStyleTop_ = false;
            this.openAsModal_ = false;
            if (!dialog.hasAttribute("role")) dialog.setAttribute("role", "dialog");
            dialog.show = this.show.bind(this);
            dialog.showModal = this.showModal.bind(this);
            dialog.close = this.close.bind(this);
            if (!("returnValue" in dialog)) dialog.returnValue = "";
            if ("MutationObserver" in window) { var mo = new MutationObserver(this.maybeHideModal.bind(this));
                mo.observe(dialog, { attributes: true, attributeFilter: ["open"] }) } else {
                var removed = false;
                var cb = function() { removed ? this.downgradeModal() : this.maybeHideModal();
                    removed = false }.bind(this);
                var timeout;
                var delayModel = function(ev) {
                    if (ev.target !== dialog) return;
                    var cand = "DOMNodeRemoved";
                    removed |= ev.type.substr(0, cand.length) === cand;
                    window.clearTimeout(timeout);
                    timeout =
                        window.setTimeout(cb, 0)
                };
                ["DOMAttrModified", "DOMNodeRemoved", "DOMNodeRemovedFromDocument"].forEach(function(name) { dialog.addEventListener(name, delayModel) })
            }
            Object.defineProperty(dialog, "open", { set: this.setOpen.bind(this), get: dialog.hasAttribute.bind(dialog, "open") });
            this.backdrop_ = document.createElement("div");
            this.backdrop_.className = "backdrop";
            this.backdrop_.addEventListener("click", this.backdropClick_.bind(this))
        }
        dialogPolyfillInfo.prototype = {get dialog() { return this.dialog_ },
            maybeHideModal: function() {
                if (this.dialog_.hasAttribute("open") &&
                    document.body.contains(this.dialog_)) return;
                this.downgradeModal()
            },
            downgradeModal: function() { if (!this.openAsModal_) return;
                this.openAsModal_ = false;
                this.dialog_.style.zIndex = ""; if (this.replacedStyleTop_) { this.dialog_.style.top = "";
                    this.replacedStyleTop_ = false }
                this.backdrop_.parentNode && this.backdrop_.parentNode.removeChild(this.backdrop_);
                dialogPolyfill.dm.removeDialog(this) },
            setOpen: function(value) {
                if (value) this.dialog_.hasAttribute("open") || this.dialog_.setAttribute("open", "");
                else {
                    this.dialog_.removeAttribute("open");
                    this.maybeHideModal()
                }
            },
            backdropClick_: function(e) {
                if (!this.dialog_.hasAttribute("tabindex")) { var fake = document.createElement("div");
                    this.dialog_.insertBefore(fake, this.dialog_.firstChild);
                    fake.tabIndex = -1;
                    fake.focus();
                    this.dialog_.removeChild(fake) } else this.dialog_.focus();
                var redirectedEvent = document.createEvent("MouseEvents");
                redirectedEvent.initMouseEvent(e.type, e.bubbles, e.cancelable, window, e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
                this.dialog_.dispatchEvent(redirectedEvent);
                e.stopPropagation()
            },
            focus_: function() { var target = this.dialog_.querySelector("[autofocus]:not([disabled])"); if (!target && this.dialog_.tabIndex >= 0) target = this.dialog_; if (!target) { var opts = ["button", "input", "keygen", "select", "textarea"]; var query = opts.map(function(el) { return el + ":not([disabled])" });
                    query.push('[tabindex]:not([disabled]):not([tabindex=""])');
                    target = this.dialog_.querySelector(query.join(", ")) }
                safeBlur(document.activeElement);
                target && target.focus() },
            updateZIndex: function(dialogZ, backdropZ) { if (dialogZ < backdropZ) throw new Error("dialogZ should never be < backdropZ");
                this.dialog_.style.zIndex = dialogZ;
                this.backdrop_.style.zIndex = backdropZ },
            show: function() { if (!this.dialog_.open) { this.setOpen(true);
                    this.focus_() } },
            showModal: function() {
                if (this.dialog_.hasAttribute("open")) throw new Error("Failed to execute 'showModal' on dialog: The element is already open, and therefore cannot be opened modally.");
                if (!document.body.contains(this.dialog_)) throw new Error("Failed to execute 'showModal' on dialog: The element is not in a Document.");
                if (!dialogPolyfill.dm.pushDialog(this)) throw new Error("Failed to execute 'showModal' on dialog: There are too many open modal dialogs.");
                if (createsStackingContext(this.dialog_.parentElement)) console.warn("A dialog is being shown inside a stacking context. " + "This may cause it to be unusable. For more information, see this link: " + "https://github.com/GoogleChrome/dialog-polyfill/#stacking-context");
                this.setOpen(true);
                this.openAsModal_ = true;
                if (dialogPolyfill.needsCentering(this.dialog_)) {
                    dialogPolyfill.reposition(this.dialog_);
                    this.replacedStyleTop_ = true
                } else this.replacedStyleTop_ = false;
                this.dialog_.parentNode.insertBefore(this.backdrop_, this.dialog_.nextSibling);
                this.focus_()
            },
            close: function(opt_returnValue) {
                if (!this.dialog_.hasAttribute("open")) throw new Error("Failed to execute 'close' on dialog: The element does not have an 'open' attribute, and therefore cannot be closed.");
                this.setOpen(false);
                if (opt_returnValue !== undefined) this.dialog_.returnValue = opt_returnValue;
                var closeEvent = new supportCustomEvent("close", {
                    bubbles: false,
                    cancelable: false
                });
                this.dialog_.dispatchEvent(closeEvent)
            }
        };
        var dialogPolyfill = {};
        dialogPolyfill.reposition = function(element) { var scrollTop = document.body.scrollTop || document.documentElement.scrollTop; var topValue = scrollTop + (window.innerHeight - element.offsetHeight) / 2;
            element.style.top = Math.max(scrollTop, topValue) + "px" };
        dialogPolyfill.isInlinePositionSetByStylesheet = function(element) {
            for (var i = 0; i < document.styleSheets.length; ++i) {
                var styleSheet = document.styleSheets[i];
                var cssRules = null;
                try {
                    cssRules =
                        styleSheet.cssRules
                } catch (e) {}
                if (!cssRules) continue;
                for (var j = 0; j < cssRules.length; ++j) { var rule = cssRules[j]; var selectedNodes = null; try { selectedNodes = document.querySelectorAll(rule.selectorText) } catch (e$0) {} if (!selectedNodes || !inNodeList(selectedNodes, element)) continue; var cssTop = rule.style.getPropertyValue("top"); var cssBottom = rule.style.getPropertyValue("bottom"); if (cssTop && cssTop !== "auto" || cssBottom && cssBottom !== "auto") return true }
            }
            return false
        };
        dialogPolyfill.needsCentering = function(dialog) {
            var computedStyle =
                window.getComputedStyle(dialog);
            if (computedStyle.position !== "absolute") return false;
            if (dialog.style.top !== "auto" && dialog.style.top !== "" || dialog.style.bottom !== "auto" && dialog.style.bottom !== "") return false;
            return !dialogPolyfill.isInlinePositionSetByStylesheet(dialog)
        };
        dialogPolyfill.forceRegisterDialog = function(element) {
            if (window.HTMLDialogElement || element.showModal) console.warn("This browser already supports <dialog>, the polyfill " + "may not work correctly", element);
            if (element.localName !== "dialog") throw new Error("Failed to register dialog: The element is not a dialog.");
            new dialogPolyfillInfo(element)
        };
        dialogPolyfill.registerDialog = function(element) { if (!element.showModal) dialogPolyfill.forceRegisterDialog(element) };
        dialogPolyfill.DialogManager = function() {
            this.pendingDialogStack = [];
            var checkDOM = this.checkDOM_.bind(this);
            this.overlay = document.createElement("div");
            this.overlay.className = "_dialog_overlay";
            this.overlay.addEventListener("click", function(e) { this.forwardTab_ = undefined;
                e.stopPropagation();
                checkDOM([]) }.bind(this));
            this.handleKey_ = this.handleKey_.bind(this);
            this.handleFocus_ = this.handleFocus_.bind(this);
            this.zIndexLow_ = 1E5;
            this.zIndexHigh_ = 1E5 + 150;
            this.forwardTab_ = undefined;
            if ("MutationObserver" in window) this.mo_ = new MutationObserver(function(records) { var removed = [];
                records.forEach(function(rec) { for (var i = 0, c; c = rec.removedNodes[i]; ++i) { if (!(c instanceof Element)) continue;
                        else if (c.localName === "dialog") removed.push(c);
                        removed = removed.concat(c.querySelectorAll("dialog")) } });
                removed.length && checkDOM(removed) })
        };
        dialogPolyfill.DialogManager.prototype.blockDocument =
            function() { document.documentElement.addEventListener("focus", this.handleFocus_, true);
                document.addEventListener("keydown", this.handleKey_);
                this.mo_ && this.mo_.observe(document, { childList: true, subtree: true }) };
        dialogPolyfill.DialogManager.prototype.unblockDocument = function() { document.documentElement.removeEventListener("focus", this.handleFocus_, true);
            document.removeEventListener("keydown", this.handleKey_);
            this.mo_ && this.mo_.disconnect() };
        dialogPolyfill.DialogManager.prototype.updateStacking = function() {
            var zIndex =
                this.zIndexHigh_;
            for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i) { dpi.updateZIndex(--zIndex, --zIndex); if (i === 0) this.overlay.style.zIndex = --zIndex }
            var last = this.pendingDialogStack[0];
            if (last) { var p = last.dialog.parentNode || document.body;
                p.appendChild(this.overlay) } else if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay)
        };
        dialogPolyfill.DialogManager.prototype.containedByTopDialog_ = function(candidate) {
            while (candidate = findNearestDialog(candidate)) {
                for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i)
                    if (dpi.dialog ===
                        candidate) return i === 0;
                candidate = candidate.parentElement
            }
            return false
        };
        dialogPolyfill.DialogManager.prototype.handleFocus_ = function(event) {
            if (this.containedByTopDialog_(event.target)) return;
            event.preventDefault();
            event.stopPropagation();
            safeBlur(event.target);
            if (this.forwardTab_ === undefined) return;
            var dpi = this.pendingDialogStack[0];
            var dialog = dpi.dialog;
            var position = dialog.compareDocumentPosition(event.target);
            if (position & Node.DOCUMENT_POSITION_PRECEDING)
                if (this.forwardTab_) dpi.focus_();
                else document.documentElement.focus();
            else;
            return false
        };
        dialogPolyfill.DialogManager.prototype.handleKey_ = function(event) { this.forwardTab_ = undefined; if (event.keyCode === 27) { event.preventDefault();
                event.stopPropagation(); var cancelEvent = new supportCustomEvent("cancel", { bubbles: false, cancelable: true }); var dpi = this.pendingDialogStack[0]; if (dpi && dpi.dialog.dispatchEvent(cancelEvent)) dpi.dialog.close() } else if (event.keyCode === 9) this.forwardTab_ = !event.shiftKey };
        dialogPolyfill.DialogManager.prototype.checkDOM_ = function(removed) {
            var clone = this.pendingDialogStack.slice();
            clone.forEach(function(dpi) { if (removed.indexOf(dpi.dialog) !== -1) dpi.downgradeModal();
                else dpi.maybeHideModal() })
        };
        dialogPolyfill.DialogManager.prototype.pushDialog = function(dpi) { var allowed = (this.zIndexHigh_ - this.zIndexLow_) / 2 - 1; if (this.pendingDialogStack.length >= allowed) return false; if (this.pendingDialogStack.unshift(dpi) === 1) this.blockDocument();
            this.updateStacking(); return true };
        dialogPolyfill.DialogManager.prototype.removeDialog = function(dpi) {
            var index = this.pendingDialogStack.indexOf(dpi);
            if (index ===
                -1) return;
            this.pendingDialogStack.splice(index, 1);
            if (this.pendingDialogStack.length === 0) this.unblockDocument();
            this.updateStacking()
        };
        dialogPolyfill.dm = new dialogPolyfill.DialogManager;
        dialogPolyfill.formSubmitter = null;
        dialogPolyfill.useValue = null;
        if (window.HTMLDialogElement === undefined) {
            var testForm = document.createElement("form");
            testForm.setAttribute("method", "dialog");
            if (testForm.method !== "dialog") {
                var methodDescriptor = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, "method");
                if (methodDescriptor) {
                    var realGet =
                        methodDescriptor.get;
                    methodDescriptor.get = function() { if (isFormMethodDialog(this)) return "dialog"; return realGet.call(this) };
                    var realSet = methodDescriptor.set;
                    methodDescriptor.set = function(v) { if (typeof v === "string" && v.toLowerCase() === "dialog") return this.setAttribute("method", v); return realSet.call(this, v) };
                    Object.defineProperty(HTMLFormElement.prototype, "method", methodDescriptor)
                }
            }
            document.addEventListener("click", function(ev) {
                dialogPolyfill.formSubmitter = null;
                dialogPolyfill.useValue = null;
                if (ev.defaultPrevented) return;
                var target = ev.target;
                if (!target || !isFormMethodDialog(target.form)) return;
                var valid = target.type === "submit" && ["button", "input"].indexOf(target.localName) > -1;
                if (!valid) { if (!(target.localName === "input" && target.type === "image")) return;
                    dialogPolyfill.useValue = ev.offsetX + "," + ev.offsetY }
                var dialog = findNearestDialog(target);
                if (!dialog) return;
                dialogPolyfill.formSubmitter = target
            }, false);
            var nativeFormSubmit = HTMLFormElement.prototype.submit;
            var replacementFormSubmit = function() {
                if (!isFormMethodDialog(this)) return nativeFormSubmit.call(this);
                var dialog = findNearestDialog(this);
                dialog && dialog.close()
            };
            HTMLFormElement.prototype.submit = replacementFormSubmit;
            document.addEventListener("submit", function(ev) { var form = ev.target; if (!isFormMethodDialog(form)) return;
                ev.preventDefault(); var dialog = findNearestDialog(form); if (!dialog) return; var s = dialogPolyfill.formSubmitter; if (s && s.form === form) dialog.close(dialogPolyfill.useValue || s.value);
                else dialog.close();
                dialogPolyfill.formSubmitter = null }, true)
        }
        dialogPolyfill["forceRegisterDialog"] = dialogPolyfill.forceRegisterDialog;
        dialogPolyfill["registerDialog"] = dialogPolyfill.registerDialog;
        if (typeof define === "function" && "amd" in define) define(function() { return dialogPolyfill });
        else if (typeof module === "object" && typeof module["exports"] === "object") module["exports"] = dialogPolyfill;
        else window["dialogPolyfill"] = dialogPolyfill
    })();
    /*

     Copyright 2015 Google Inc. All Rights Reserved.

     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
    */
    var componentHandler = { upgradeDom: function(optJsClass, optCssClass) {}, upgradeElement: function(element, optJsClass) {}, upgradeElements: function(elements) {}, upgradeAllRegistered: function() {}, registerUpgradedCallback: function(jsClass, callback) {}, register: function(config) {}, downgradeElements: function(nodes) {} };
    componentHandler = function() {
        var registeredComponents_ = [];
        var createdComponents_ = [];
        var componentConfigProperty_ = "mdlComponentConfigInternal_";

        function findRegisteredClass_(name, optReplace) { for (var i = 0; i < registeredComponents_.length; i++)
                if (registeredComponents_[i].className === name) { if (typeof optReplace !== "undefined") registeredComponents_[i] = optReplace; return registeredComponents_[i] }
            return false }

        function getUpgradedListOfElement_(element) {
            var dataUpgraded = element.getAttribute("data-upgraded");
            return dataUpgraded ===
                null ? [""] : dataUpgraded.split(",")
        }

        function isElementUpgraded_(element, jsClass) { var upgradedList = getUpgradedListOfElement_(element); return upgradedList.indexOf(jsClass) !== -1 }

        function createEvent_(eventType, bubbles, cancelable) { if ("CustomEvent" in window && typeof window.CustomEvent === "function") return new CustomEvent(eventType, { bubbles: bubbles, cancelable: cancelable });
            else { var ev = document.createEvent("Events");
                ev.initEvent(eventType, bubbles, cancelable); return ev } }

        function upgradeDomInternal(optJsClass,
            optCssClass) {
            if (typeof optJsClass === "undefined" && typeof optCssClass === "undefined")
                for (var i = 0; i < registeredComponents_.length; i++) upgradeDomInternal(registeredComponents_[i].className, registeredComponents_[i].cssClass);
            else {
                var jsClass = optJsClass;
                if (typeof optCssClass === "undefined") { var registeredClass = findRegisteredClass_(jsClass); if (registeredClass) optCssClass = registeredClass.cssClass }
                var elements = document.querySelectorAll("." + optCssClass);
                for (var n = 0; n < elements.length; n++) upgradeElementInternal(elements[n],
                    jsClass)
            }
        }

        function upgradeElementInternal(element, optJsClass) {
            if (!(typeof element === "object" && element instanceof Element)) throw new Error("Invalid argument provided to upgrade MDL element.");
            var upgradingEv = createEvent_("mdl-componentupgrading", true, true);
            element.dispatchEvent(upgradingEv);
            if (upgradingEv.defaultPrevented) return;
            var upgradedList = getUpgradedListOfElement_(element);
            var classesToUpgrade = [];
            if (!optJsClass) {
                var classList = element.classList;
                registeredComponents_.forEach(function(component) {
                    if (classList.contains(component.cssClass) &&
                        classesToUpgrade.indexOf(component) === -1 && !isElementUpgraded_(element, component.className)) classesToUpgrade.push(component)
                })
            } else if (!isElementUpgraded_(element, optJsClass)) classesToUpgrade.push(findRegisteredClass_(optJsClass));
            for (var i = 0, n = classesToUpgrade.length, registeredClass; i < n; i++) {
                registeredClass = classesToUpgrade[i];
                if (registeredClass) {
                    upgradedList.push(registeredClass.className);
                    element.setAttribute("data-upgraded", upgradedList.join(","));
                    var instance = new registeredClass.classConstructor(element);
                    instance[componentConfigProperty_] = registeredClass;
                    createdComponents_.push(instance);
                    for (var j = 0, m = registeredClass.callbacks.length; j < m; j++) registeredClass.callbacks[j](element);
                    if (registeredClass.widget) element[registeredClass.className] = instance
                } else throw new Error("Unable to find a registered component for the given class.");
                var upgradedEv = createEvent_("mdl-componentupgraded", true, false);
                element.dispatchEvent(upgradedEv)
            }
        }

        function upgradeElementsInternal(elements) {
            if (!Array.isArray(elements))
                if (elements instanceof Element) elements = [elements];
                else elements = Array.prototype.slice.call(elements);
            for (var i = 0, n = elements.length, element; i < n; i++) { element = elements[i]; if (element instanceof HTMLElement) { upgradeElementInternal(element); if (element.children.length > 0) upgradeElementsInternal(element.children) } }
        }

        function registerInternal(config) {
            var widgetMissing = typeof config.widget === "undefined" && typeof config["widget"] === "undefined";
            var widget = true;
            if (!widgetMissing) widget = config.widget || config["widget"];
            var newConfig = {
                classConstructor: config.constructor ||
                    config["constructor"],
                className: config.classAsString || config["classAsString"],
                cssClass: config.cssClass || config["cssClass"],
                widget: widget,
                callbacks: []
            };
            registeredComponents_.forEach(function(item) { if (item.cssClass === newConfig.cssClass) throw new Error("The provided cssClass has already been registered: " + item.cssClass); if (item.className === newConfig.className) throw new Error("The provided className has already been registered"); });
            if (config.constructor.prototype.hasOwnProperty(componentConfigProperty_)) throw new Error("MDL component classes must not have " +
                componentConfigProperty_ + " defined as a property.");
            var found = findRegisteredClass_(config.classAsString, newConfig);
            if (!found) registeredComponents_.push(newConfig)
        }

        function registerUpgradedCallbackInternal(jsClass, callback) { var regClass = findRegisteredClass_(jsClass); if (regClass) regClass.callbacks.push(callback) }

        function upgradeAllRegisteredInternal() { for (var n = 0; n < registeredComponents_.length; n++) upgradeDomInternal(registeredComponents_[n].className) }

        function deconstructComponentInternal(component) {
            if (component) {
                var componentIndex =
                    createdComponents_.indexOf(component);
                createdComponents_.splice(componentIndex, 1);
                var upgrades = component.element_.getAttribute("data-upgraded").split(",");
                var componentPlace = upgrades.indexOf(component[componentConfigProperty_].classAsString);
                upgrades.splice(componentPlace, 1);
                component.element_.setAttribute("data-upgraded", upgrades.join(","));
                var ev = createEvent_("mdl-componentdowngraded", true, false);
                component.element_.dispatchEvent(ev)
            }
        }

        function downgradeNodesInternal(nodes) {
            var downgradeNode = function(node) {
                createdComponents_.filter(function(item) {
                    return item.element_ ===
                        node
                }).forEach(deconstructComponentInternal)
            };
            if (nodes instanceof Array || nodes instanceof NodeList)
                for (var n = 0; n < nodes.length; n++) downgradeNode(nodes[n]);
            else if (nodes instanceof Node) downgradeNode(nodes);
            else throw new Error("Invalid argument provided to downgrade MDL nodes.");
        }
        return {
            upgradeDom: upgradeDomInternal,
            upgradeElement: upgradeElementInternal,
            upgradeElements: upgradeElementsInternal,
            upgradeAllRegistered: upgradeAllRegisteredInternal,
            registerUpgradedCallback: registerUpgradedCallbackInternal,
            register: registerInternal,
            downgradeElements: downgradeNodesInternal
        }
    }();
    componentHandler.ComponentConfigPublic;
    componentHandler.ComponentConfig;
    componentHandler.Component;
    componentHandler["upgradeDom"] = componentHandler.upgradeDom;
    componentHandler["upgradeElement"] = componentHandler.upgradeElement;
    componentHandler["upgradeElements"] = componentHandler.upgradeElements;
    componentHandler["upgradeAllRegistered"] = componentHandler.upgradeAllRegistered;
    componentHandler["registerUpgradedCallback"] = componentHandler.registerUpgradedCallback;
    componentHandler["register"] = componentHandler.register;
    componentHandler["downgradeElements"] = componentHandler.downgradeElements;
    window.componentHandler = componentHandler;
    window["componentHandler"] = componentHandler;
    window.addEventListener("load", function() { if ("classList" in document.createElement("div") && "querySelector" in document && "addEventListener" in window && Array.prototype.forEach) { document.documentElement.classList.add("mdl-js");
            componentHandler.upgradeAllRegistered() } else { componentHandler.upgradeElement = function() {};
            componentHandler.register = function() {} } });
    (function() {
        var MaterialButton = function MaterialButton(element) { this.element_ = element;
            this.init() };
        window["MaterialButton"] = MaterialButton;
        MaterialButton.prototype.Constant_ = {};
        MaterialButton.prototype.CssClasses_ = { RIPPLE_EFFECT: "mdl-js-ripple-effect", RIPPLE_CONTAINER: "mdl-button__ripple-container", RIPPLE: "mdl-ripple" };
        MaterialButton.prototype.blurHandler_ = function(event) { if (event) this.element_.blur() };
        MaterialButton.prototype.disable = function() { this.element_.disabled = true };
        MaterialButton.prototype["disable"] =
            MaterialButton.prototype.disable;
        MaterialButton.prototype.enable = function() { this.element_.disabled = false };
        MaterialButton.prototype["enable"] = MaterialButton.prototype.enable;
        MaterialButton.prototype.init = function() {
            if (this.element_) {
                if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
                    var rippleContainer = document.createElement("span");
                    rippleContainer.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
                    this.rippleElement_ = document.createElement("span");
                    this.rippleElement_.classList.add(this.CssClasses_.RIPPLE);
                    rippleContainer.appendChild(this.rippleElement_);
                    this.boundRippleBlurHandler = this.blurHandler_.bind(this);
                    this.rippleElement_.addEventListener("mouseup", this.boundRippleBlurHandler);
                    this.element_.appendChild(rippleContainer)
                }
                this.boundButtonBlurHandler = this.blurHandler_.bind(this);
                this.element_.addEventListener("mouseup", this.boundButtonBlurHandler);
                this.element_.addEventListener("mouseleave", this.boundButtonBlurHandler)
            }
        };
        componentHandler.register({
            constructor: MaterialButton,
            classAsString: "MaterialButton",
            cssClass: "mdl-js-button",
            widget: true
        })
    })();
    (function() {
        var MaterialProgress = function MaterialProgress(element) { this.element_ = element;
            this.init() };
        window["MaterialProgress"] = MaterialProgress;
        MaterialProgress.prototype.Constant_ = {};
        MaterialProgress.prototype.CssClasses_ = { INDETERMINATE_CLASS: "mdl-progress__indeterminate" };
        MaterialProgress.prototype.setProgress = function(p) { if (this.element_.classList.contains(this.CssClasses_.INDETERMINATE_CLASS)) return;
            this.progressbar_.style.width = p + "%" };
        MaterialProgress.prototype["setProgress"] = MaterialProgress.prototype.setProgress;
        MaterialProgress.prototype.setBuffer = function(p) { this.bufferbar_.style.width = p + "%";
            this.auxbar_.style.width = 100 - p + "%" };
        MaterialProgress.prototype["setBuffer"] = MaterialProgress.prototype.setBuffer;
        MaterialProgress.prototype.init = function() {
            if (this.element_) {
                var el = document.createElement("div");
                el.className = "progressbar bar bar1";
                this.element_.appendChild(el);
                this.progressbar_ = el;
                el = document.createElement("div");
                el.className = "bufferbar bar bar2";
                this.element_.appendChild(el);
                this.bufferbar_ = el;
                el = document.createElement("div");
                el.className = "auxbar bar bar3";
                this.element_.appendChild(el);
                this.auxbar_ = el;
                this.progressbar_.style.width = "0%";
                this.bufferbar_.style.width = "100%";
                this.auxbar_.style.width = "0%";
                this.element_.classList.add("is-upgraded")
            }
        };
        componentHandler.register({ constructor: MaterialProgress, classAsString: "MaterialProgress", cssClass: "mdl-js-progress", widget: true })
    })();
    (function() {
        var MaterialSpinner = function MaterialSpinner(element) { this.element_ = element;
            this.init() };
        window["MaterialSpinner"] = MaterialSpinner;
        MaterialSpinner.prototype.Constant_ = { MDL_SPINNER_LAYER_COUNT: 4 };
        MaterialSpinner.prototype.CssClasses_ = { MDL_SPINNER_LAYER: "mdl-spinner__layer", MDL_SPINNER_CIRCLE_CLIPPER: "mdl-spinner__circle-clipper", MDL_SPINNER_CIRCLE: "mdl-spinner__circle", MDL_SPINNER_GAP_PATCH: "mdl-spinner__gap-patch", MDL_SPINNER_LEFT: "mdl-spinner__left", MDL_SPINNER_RIGHT: "mdl-spinner__right" };
        MaterialSpinner.prototype.createLayer = function(index) {
            var layer = document.createElement("div");
            layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER);
            layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER + "-" + index);
            var leftClipper = document.createElement("div");
            leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
            leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_LEFT);
            var gapPatch = document.createElement("div");
            gapPatch.classList.add(this.CssClasses_.MDL_SPINNER_GAP_PATCH);
            var rightClipper =
                document.createElement("div");
            rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
            rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_RIGHT);
            var circleOwners = [leftClipper, gapPatch, rightClipper];
            for (var i = 0; i < circleOwners.length; i++) { var circle = document.createElement("div");
                circle.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE);
                circleOwners[i].appendChild(circle) }
            layer.appendChild(leftClipper);
            layer.appendChild(gapPatch);
            layer.appendChild(rightClipper);
            this.element_.appendChild(layer)
        };
        MaterialSpinner.prototype["createLayer"] = MaterialSpinner.prototype.createLayer;
        MaterialSpinner.prototype.stop = function() { this.element_.classList.remove("is-active") };
        MaterialSpinner.prototype["stop"] = MaterialSpinner.prototype.stop;
        MaterialSpinner.prototype.start = function() { this.element_.classList.add("is-active") };
        MaterialSpinner.prototype["start"] = MaterialSpinner.prototype.start;
        MaterialSpinner.prototype.init = function() {
            if (this.element_) {
                for (var i = 1; i <= this.Constant_.MDL_SPINNER_LAYER_COUNT; i++) this.createLayer(i);
                this.element_.classList.add("is-upgraded")
            }
        };
        componentHandler.register({ constructor: MaterialSpinner, classAsString: "MaterialSpinner", cssClass: "mdl-js-spinner", widget: true })
    })();
    (function() {
        var MaterialTextfield = function MaterialTextfield(element) { this.element_ = element;
            this.maxRows = this.Constant_.NO_MAX_ROWS;
            this.init() };
        window["MaterialTextfield"] = MaterialTextfield;
        MaterialTextfield.prototype.Constant_ = { NO_MAX_ROWS: -1, MAX_ROWS_ATTRIBUTE: "maxrows" };
        MaterialTextfield.prototype.CssClasses_ = { LABEL: "mdl-textfield__label", INPUT: "mdl-textfield__input", IS_DIRTY: "is-dirty", IS_FOCUSED: "is-focused", IS_DISABLED: "is-disabled", IS_INVALID: "is-invalid", IS_UPGRADED: "is-upgraded", HAS_PLACEHOLDER: "has-placeholder" };
        MaterialTextfield.prototype.onKeyDown_ = function(event) { var currentRowCount = event.target.value.split("\n").length; if (event.keyCode === 13)
                if (currentRowCount >= this.maxRows) event.preventDefault() };
        MaterialTextfield.prototype.onFocus_ = function(event) { this.element_.classList.add(this.CssClasses_.IS_FOCUSED) };
        MaterialTextfield.prototype.onBlur_ = function(event) { this.element_.classList.remove(this.CssClasses_.IS_FOCUSED) };
        MaterialTextfield.prototype.onReset_ = function(event) { this.updateClasses_() };
        MaterialTextfield.prototype.updateClasses_ =
            function() { this.checkDisabled();
                this.checkValidity();
                this.checkDirty();
                this.checkFocus() };
        MaterialTextfield.prototype.checkDisabled = function() { if (this.input_.disabled) this.element_.classList.add(this.CssClasses_.IS_DISABLED);
            else this.element_.classList.remove(this.CssClasses_.IS_DISABLED) };
        MaterialTextfield.prototype["checkDisabled"] = MaterialTextfield.prototype.checkDisabled;
        MaterialTextfield.prototype.checkFocus = function() {
            if (Boolean(this.element_.querySelector(":focus"))) this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
            else this.element_.classList.remove(this.CssClasses_.IS_FOCUSED)
        };
        MaterialTextfield.prototype["checkFocus"] = MaterialTextfield.prototype.checkFocus;
        MaterialTextfield.prototype.checkValidity = function() { if (this.input_.validity)
                if (this.input_.validity.valid) this.element_.classList.remove(this.CssClasses_.IS_INVALID);
                else this.element_.classList.add(this.CssClasses_.IS_INVALID) };
        MaterialTextfield.prototype["checkValidity"] = MaterialTextfield.prototype.checkValidity;
        MaterialTextfield.prototype.checkDirty =
            function() { if (this.input_.value && this.input_.value.length > 0) this.element_.classList.add(this.CssClasses_.IS_DIRTY);
                else this.element_.classList.remove(this.CssClasses_.IS_DIRTY) };
        MaterialTextfield.prototype["checkDirty"] = MaterialTextfield.prototype.checkDirty;
        MaterialTextfield.prototype.disable = function() { this.input_.disabled = true;
            this.updateClasses_() };
        MaterialTextfield.prototype["disable"] = MaterialTextfield.prototype.disable;
        MaterialTextfield.prototype.enable = function() {
            this.input_.disabled = false;
            this.updateClasses_()
        };
        MaterialTextfield.prototype["enable"] = MaterialTextfield.prototype.enable;
        MaterialTextfield.prototype.change = function(value) { this.input_.value = value || "";
            this.updateClasses_() };
        MaterialTextfield.prototype["change"] = MaterialTextfield.prototype.change;
        MaterialTextfield.prototype.init = function() {
            if (this.element_) {
                this.label_ = this.element_.querySelector("." + this.CssClasses_.LABEL);
                this.input_ = this.element_.querySelector("." + this.CssClasses_.INPUT);
                if (this.input_) {
                    if (this.input_.hasAttribute(this.Constant_.MAX_ROWS_ATTRIBUTE)) {
                        this.maxRows =
                            parseInt(this.input_.getAttribute(this.Constant_.MAX_ROWS_ATTRIBUTE), 10);
                        if (isNaN(this.maxRows)) this.maxRows = this.Constant_.NO_MAX_ROWS
                    }
                    if (this.input_.hasAttribute("placeholder")) this.element_.classList.add(this.CssClasses_.HAS_PLACEHOLDER);
                    this.boundUpdateClassesHandler = this.updateClasses_.bind(this);
                    this.boundFocusHandler = this.onFocus_.bind(this);
                    this.boundBlurHandler = this.onBlur_.bind(this);
                    this.boundResetHandler = this.onReset_.bind(this);
                    this.input_.addEventListener("input", this.boundUpdateClassesHandler);
                    this.input_.addEventListener("focus", this.boundFocusHandler);
                    this.input_.addEventListener("blur", this.boundBlurHandler);
                    this.input_.addEventListener("reset", this.boundResetHandler);
                    if (this.maxRows !== this.Constant_.NO_MAX_ROWS) { this.boundKeyDownHandler = this.onKeyDown_.bind(this);
                        this.input_.addEventListener("keydown", this.boundKeyDownHandler) }
                    var invalid = this.element_.classList.contains(this.CssClasses_.IS_INVALID);
                    this.updateClasses_();
                    this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
                    if (invalid) this.element_.classList.add(this.CssClasses_.IS_INVALID);
                    if (this.input_.hasAttribute("autofocus")) { this.element_.focus();
                        this.checkFocus() }
                }
            }
        };
        componentHandler.register({ constructor: MaterialTextfield, classAsString: "MaterialTextfield", cssClass: "mdl-js-textfield", widget: true })
    })();
    (function() {
        var l, aa = "function" == typeof Object.create ? Object.create : function(a) {
                function b() {}
                b.prototype = a; return new b },
            ba;
        if ("function" == typeof Object.setPrototypeOf) ba = Object.setPrototypeOf;
        else { var ca;
            a: { var da = { zb: !0 },
                    ea = {}; try { ea.__proto__ = da;
                    ca = ea.zb; break a } catch (a) {}
                ca = !1 }
            ba = ca ? function(a, b) { a.__proto__ = b; if (a.__proto__ !== b) throw new TypeError(a + " is not extensible"); return a } : null }
        var fa = ba;

        function n(a, b) {
            a.prototype = aa(b.prototype);
            a.prototype.constructor = a;
            if (fa) fa(a, b);
            else
                for (var c in b)
                    if ("prototype" !=
                        c)
                        if (Object.defineProperties) { var d = Object.getOwnPropertyDescriptor(b, c);
                            d && Object.defineProperty(a, c, d) } else a[c] = b[c];
            a.M = b.prototype
        }
        var ha = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, b, c) { a != Array.prototype && a != Object.prototype && (a[b] = c.value) },
            ia = "undefined" != typeof window && window === this ? this : "undefined" != typeof global && null != global ? global : this;

        function ka(a, b) {
            if (b) {
                var c = ia;
                a = a.split(".");
                for (var d = 0; d < a.length - 1; d++) { var e = a[d];
                    e in c || (c[e] = {});
                    c = c[e] }
                a = a[a.length -
                    1];
                d = c[a];
                b = b(d);
                b != d && null != b && ha(c, a, { configurable: !0, writable: !0, value: b })
            }
        }

        function la(a) { var b = 0; return function() { return b < a.length ? { done: !1, value: a[b++] } : { done: !0 } } }
        ka("Object.is", function(a) { return a ? a : function(b, c) { return b === c ? 0 !== b || 1 / b === 1 / c : b !== b && c !== c } });
        ka("Array.prototype.includes", function(a) { return a ? a : function(b, c) { var d = this;
                d instanceof String && (d = String(d)); var e = d.length;
                c = c || 0; for (0 > c && (c = Math.max(c + e, 0)); c < e; c++) { var f = d[c]; if (f === b || Object.is(f, b)) return !0 } return !1 } });

        function ma(a) {
            var b =
                "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
            return b ? b.call(a) : { next: la(a) }
        }
        ka("Promise", function(a) {
            function b(g) { this.f = 0;
                this.h = void 0;
                this.a = []; var h = this.j(); try { g(h.resolve, h.reject) } catch (k) { h.reject(k) } }

            function c() { this.a = null }

            function d(g) { return g instanceof b ? g : new b(function(h) { h(g) }) }
            if (a) return a;
            c.prototype.f = function(g) { if (null == this.a) { this.a = []; var h = this;
                    this.h(function() { h.s() }) }
                this.a.push(g) };
            var e = ia.setTimeout;
            c.prototype.h = function(g) { e(g, 0) };
            c.prototype.s =
                function() { for (; this.a && this.a.length;) { var g = this.a;
                        this.a = []; for (var h = 0; h < g.length; ++h) { var k = g[h];
                            g[h] = null; try { k() } catch (m) { this.j(m) } } }
                    this.a = null };
            c.prototype.j = function(g) { this.h(function() { throw g; }) };
            b.prototype.j = function() {
                function g(m) { return function(q) { k || (k = !0, m.call(h, q)) } } var h = this,
                    k = !1; return { resolve: g(this.L), reject: g(this.s) } };
            b.prototype.L = function(g) {
                if (g === this) this.s(new TypeError("A Promise cannot resolve to itself"));
                else if (g instanceof b) this.N(g);
                else {
                    a: switch (typeof g) {
                        case "object":
                            var h =
                                null != g;
                            break a;
                        case "function":
                            h = !0;
                            break a;
                        default:
                            h = !1
                    }
                    h ? this.I(g) : this.i(g)
                }
            };
            b.prototype.I = function(g) { var h = void 0; try { h = g.then } catch (k) { this.s(k); return } "function" == typeof h ? this.O(h, g) : this.i(g) };
            b.prototype.s = function(g) { this.w(2, g) };
            b.prototype.i = function(g) { this.w(1, g) };
            b.prototype.w = function(g, h) { if (0 != this.f) throw Error("Cannot settle(" + g + ", " + h + "): Promise already settled in state" + this.f);
                this.f = g;
                this.h = h;
                this.C() };
            b.prototype.C = function() {
                if (null != this.a) {
                    for (var g = 0; g < this.a.length; ++g) f.f(this.a[g]);
                    this.a = null
                }
            };
            var f = new c;
            b.prototype.N = function(g) { var h = this.j();
                g.Ia(h.resolve, h.reject) };
            b.prototype.O = function(g, h) { var k = this.j(); try { g.call(h, k.resolve, k.reject) } catch (m) { k.reject(m) } };
            b.prototype.then = function(g, h) {
                function k(S, Ha) { return "function" == typeof S ? function(Pa) { try { m(S(Pa)) } catch (ja) { q(ja) } } : Ha } var m, q, E = new b(function(S, Ha) { m = S;
                    q = Ha });
                this.Ia(k(g, m), k(h, q)); return E };
            b.prototype.catch = function(g) { return this.then(void 0, g) };
            b.prototype.Ia = function(g, h) {
                function k() {
                    switch (m.f) {
                        case 1:
                            g(m.h);
                            break;
                        case 2:
                            h(m.h);
                            break;
                        default:
                            throw Error("Unexpected state: " + m.f);
                    }
                }
                var m = this;
                null == this.a ? f.f(k) : this.a.push(k)
            };
            b.resolve = d;
            b.reject = function(g) { return new b(function(h, k) { k(g) }) };
            b.race = function(g) { return new b(function(h, k) { for (var m = ma(g), q = m.next(); !q.done; q = m.next()) d(q.value).Ia(h, k) }) };
            b.all = function(g) {
                var h = ma(g),
                    k = h.next();
                return k.done ? d([]) : new b(function(m, q) {
                    function E(Pa) { return function(ja) { S[Pa] = ja;
                            Ha--;
                            0 == Ha && m(S) } }
                    var S = [],
                        Ha = 0;
                    do S.push(void 0), Ha++, d(k.value).Ia(E(S.length -
                        1), q), k = h.next(); while (!k.done)
                })
            };
            return b
        });
        var p = this;

        function na(a) { return void 0 !== a }

        function r(a) { return "string" == typeof a }
        var oa = /^[\w+/_-]+[=]{0,2}$/,
            pa = null;

        function qa() {}

        function ra(a) { a.V = void 0;
            a.Ya = function() { return a.V ? a.V : a.V = new a } }

        function sa(a) {
            var b = typeof a;
            if ("object" == b)
                if (a) {
                    if (a instanceof Array) return "array";
                    if (a instanceof Object) return b;
                    var c = Object.prototype.toString.call(a);
                    if ("[object Window]" == c) return "object";
                    if ("[object Array]" == c || "number" == typeof a.length && "undefined" !=
                        typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) return "array";
                    if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) return "function"
                } else return "null";
            else if ("function" == b && "undefined" == typeof a.call) return "object";
            return b
        }

        function ta(a) { return "array" == sa(a) }

        function ua(a) { var b = sa(a); return "array" == b || "object" == b && "number" == typeof a.length }

        function va(a) {
            return "function" ==
                sa(a)
        }

        function wa(a) { var b = typeof a; return "object" == b && null != a || "function" == b }
        var xa = "closure_uid_" + (1E9 * Math.random() >>> 0),
            ya = 0;

        function za(a, b, c) { return a.call.apply(a.bind, arguments) }

        function Aa(a, b, c) { if (!a) throw Error(); if (2 < arguments.length) { var d = Array.prototype.slice.call(arguments, 2); return function() { var e = Array.prototype.slice.call(arguments);
                    Array.prototype.unshift.apply(e, d); return a.apply(b, e) } } return function() { return a.apply(b, arguments) } }

        function t(a, b, c) {
            Function.prototype.bind &&
                -1 != Function.prototype.bind.toString().indexOf("native code") ? t = za : t = Aa;
            return t.apply(null, arguments)
        }

        function Ba(a, b) { var c = Array.prototype.slice.call(arguments, 1); return function() { var d = c.slice();
                d.push.apply(d, arguments); return a.apply(this, d) } }

        function u(a, b) { for (var c in b) a[c] = b[c] }
        var Ca = Date.now || function() { return +new Date };

        function v(a, b) {
            a = a.split(".");
            var c = p;
            a[0] in c || "undefined" == typeof c.execScript || c.execScript("var " + a[0]);
            for (var d; a.length && (d = a.shift());) !a.length && na(b) ? c[d] =
                b : c[d] && c[d] !== Object.prototype[d] ? c = c[d] : c = c[d] = {}
        }

        function w(a, b) {
            function c() {}
            c.prototype = b.prototype;
            a.M = b.prototype;
            a.prototype = new c;
            a.prototype.constructor = a;
            a.uc = function(d, e, f) { for (var g = Array(arguments.length - 2), h = 2; h < arguments.length; h++) g[h - 2] = arguments[h]; return b.prototype[e].apply(d, g) } }

        function Da(a) { if (Error.captureStackTrace) Error.captureStackTrace(this, Da);
            else { var b = Error().stack;
                b && (this.stack = b) }
            a && (this.message = String(a)) }
        w(Da, Error);
        Da.prototype.name = "CustomError";
        var Ea;

        function Fa(a, b) { a = a.split("%s"); for (var c = "", d = a.length - 1, e = 0; e < d; e++) c += a[e] + (e < b.length ? b[e] : "%s");
            Da.call(this, c + a[d]) }
        w(Fa, Da);
        Fa.prototype.name = "AssertionError";

        function Ga(a, b) { throw new Fa("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1)); }
        var Ia = Array.prototype.indexOf ? function(a, b) { return Array.prototype.indexOf.call(a, b, void 0) } : function(a, b) { if (r(a)) return r(b) && 1 == b.length ? a.indexOf(b, 0) : -1; for (var c = 0; c < a.length; c++)
                    if (c in a && a[c] === b) return c;
                return -1 },
            Ja = Array.prototype.forEach ?
            function(a, b, c) { Array.prototype.forEach.call(a, b, c) } : function(a, b, c) { for (var d = a.length, e = r(a) ? a.split("") : a, f = 0; f < d; f++) f in e && b.call(c, e[f], f, a) };

        function Ka(a, b) { for (var c = r(a) ? a.split("") : a, d = a.length - 1; 0 <= d; --d) d in c && b.call(void 0, c[d], d, a) }
        var La = Array.prototype.filter ? function(a, b) { return Array.prototype.filter.call(a, b, void 0) } : function(a, b) { for (var c = a.length, d = [], e = 0, f = r(a) ? a.split("") : a, g = 0; g < c; g++)
                    if (g in f) { var h = f[g];
                        b.call(void 0, h, g, a) && (d[e++] = h) }
                return d },
            Ma = Array.prototype.map ?
            function(a, b) { return Array.prototype.map.call(a, b, void 0) } : function(a, b) { for (var c = a.length, d = Array(c), e = r(a) ? a.split("") : a, f = 0; f < c; f++) f in e && (d[f] = b.call(void 0, e[f], f, a)); return d },
            Na = Array.prototype.some ? function(a, b) { return Array.prototype.some.call(a, b, void 0) } : function(a, b) { for (var c = a.length, d = r(a) ? a.split("") : a, e = 0; e < c; e++)
                    if (e in d && b.call(void 0, d[e], e, a)) return !0;
                return !1 };

        function Oa(a, b, c) { for (var d = a.length, e = r(a) ? a.split("") : a, f = 0; f < d; f++)
                if (f in e && b.call(c, e[f], f, a)) return f;
            return -1 }

        function Qa(a, b) { return 0 <= Ia(a, b) }

        function Ra(a, b) { b = Ia(a, b); var c;
            (c = 0 <= b) && Sa(a, b); return c }

        function Sa(a, b) { return 1 == Array.prototype.splice.call(a, b, 1).length }

        function Ta(a, b) { b = Oa(a, b, void 0);
            0 <= b && Sa(a, b) }

        function Ua(a, b) { var c = 0;
            Ka(a, function(d, e) { b.call(void 0, d, e, a) && Sa(a, e) && c++ }) }

        function Va(a) { return Array.prototype.concat.apply([], arguments) }

        function Wa(a) { var b = a.length; if (0 < b) { for (var c = Array(b), d = 0; d < b; d++) c[d] = a[d]; return c } return [] }

        function Xa(a, b, c, d) {
            return Array.prototype.splice.apply(a,
                Ya(arguments, 1))
        }

        function Ya(a, b, c) { return 2 >= arguments.length ? Array.prototype.slice.call(a, b) : Array.prototype.slice.call(a, b, c) }
        var Za = String.prototype.trim ? function(a) { return a.trim() } : function(a) { return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(a)[1] },
            $a = /&/g,
            ab = /</g,
            bb = />/g,
            cb = /"/g,
            db = /'/g,
            eb = /\x00/g,
            fb = /[\x00&<>"']/;

        function gb(a, b) { return a < b ? -1 : a > b ? 1 : 0 }

        function hb(a) {
            fb.test(a) && (-1 != a.indexOf("&") && (a = a.replace($a, "&amp;")), -1 != a.indexOf("<") && (a = a.replace(ab, "&lt;")), -1 != a.indexOf(">") && (a = a.replace(bb,
                "&gt;")), -1 != a.indexOf('"') && (a = a.replace(cb, "&quot;")), -1 != a.indexOf("'") && (a = a.replace(db, "&#39;")), -1 != a.indexOf("\x00") && (a = a.replace(eb, "&#0;")));
            return a
        }

        function ib(a, b, c) { for (var d in a) b.call(c, a[d], d, a) }

        function jb(a) { var b = {},
                c; for (c in a) b[c] = a[c]; return b }
        var kb = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");

        function lb(a, b) {
            for (var c, d, e = 1; e < arguments.length; e++) {
                d = arguments[e];
                for (c in d) a[c] = d[c];
                for (var f = 0; f < kb.length; f++) c =
                    kb[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c])
            }
        }
        var mb = "StopIteration" in p ? p.StopIteration : { message: "StopIteration", stack: "" };

        function nb() {}
        nb.prototype.next = function() { throw mb; };
        nb.prototype.ha = function() { return this };

        function ob(a) { if (a instanceof nb) return a; if ("function" == typeof a.ha) return a.ha(!1); if (ua(a)) { var b = 0,
                    c = new nb;
                c.next = function() { for (;;) { if (b >= a.length) throw mb; if (b in a) return a[b++];
                        b++ } }; return c } throw Error("Not implemented"); }

        function pb(a, b) {
            if (ua(a)) try {
                Ja(a,
                    b, void 0)
            } catch (c) { if (c !== mb) throw c; } else { a = ob(a); try { for (;;) b.call(void 0, a.next(), void 0, a) } catch (c$1) { if (c$1 !== mb) throw c$1; } }
        }

        function qb(a) { if (ua(a)) return Wa(a);
            a = ob(a); var b = [];
            pb(a, function(c) { b.push(c) }); return b }

        function rb(a, b) {
            this.f = {};
            this.a = [];
            this.j = this.h = 0;
            var c = arguments.length;
            if (1 < c) { if (c % 2) throw Error("Uneven number of arguments"); for (var d = 0; d < c; d += 2) this.set(arguments[d], arguments[d + 1]) } else if (a)
                if (a instanceof rb)
                    for (c = a.ja(), d = 0; d < c.length; d++) this.set(c[d], a.get(c[d]));
                else
                    for (d in a) this.set(d, a[d])
        }
        l = rb.prototype;
        l.la = function() { sb(this); for (var a = [], b = 0; b < this.a.length; b++) a.push(this.f[this.a[b]]); return a };
        l.ja = function() { sb(this); return this.a.concat() };
        l.clear = function() { this.f = {};
            this.j = this.h = this.a.length = 0 };

        function sb(a) { if (a.h != a.a.length) { for (var b = 0, c = 0; b < a.a.length;) { var d = a.a[b];
                    tb(a.f, d) && (a.a[c++] = d);
                    b++ }
                a.a.length = c } if (a.h != a.a.length) { var e = {}; for (c = b = 0; b < a.a.length;) d = a.a[b], tb(e, d) || (a.a[c++] = d, e[d] = 1), b++;
                a.a.length = c } }
        l.get = function(a,
            b) { return tb(this.f, a) ? this.f[a] : b };
        l.set = function(a, b) { tb(this.f, a) || (this.h++, this.a.push(a), this.j++);
            this.f[a] = b };
        l.forEach = function(a, b) { for (var c = this.ja(), d = 0; d < c.length; d++) { var e = c[d],
                    f = this.get(e);
                a.call(b, f, e, this) } };
        l.ha = function(a) { sb(this); var b = 0,
                c = this.j,
                d = this,
                e = new nb;
            e.next = function() { if (c != d.j) throw Error("The map has changed since the iterator was created"); if (b >= d.a.length) throw mb; var f = d.a[b++]; return a ? f : d.f[f] }; return e };

        function tb(a, b) {
            return Object.prototype.hasOwnProperty.call(a,
                b)
        }
        var ub = /^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;

        function vb(a, b) { if (a) { a = a.split("&"); for (var c = 0; c < a.length; c++) { var d = a[c].indexOf("="),
                        e = null; if (0 <= d) { var f = a[c].substring(0, d);
                        e = a[c].substring(d + 1) } else f = a[c];
                    b(f, e ? decodeURIComponent(e.replace(/\+/g, " ")) : "") } } }

        function wb(a, b, c, d) {
            for (var e = c.length; 0 <= (b = a.indexOf(c, b)) && b < d;) {
                var f = a.charCodeAt(b - 1);
                if (38 == f || 63 == f)
                    if (f = a.charCodeAt(b + e), !f || 61 == f || 38 == f || 35 ==
                        f) return b;
                b += e + 1
            }
            return -1
        }
        var xb = /#|$/;

        function yb(a, b) { var c = a.search(xb),
                d = wb(a, 0, b, c); if (0 > d) return null; var e = a.indexOf("&", d); if (0 > e || e > c) e = c;
            d += b.length + 1; return decodeURIComponent(a.substr(d, e - d).replace(/\+/g, " ")) }
        var zb = /[?&]($|#)/;

        function Ab(a, b) {
            this.h = this.w = this.j = "";
            this.C = null;
            this.s = this.f = "";
            this.i = !1;
            var c;
            a instanceof Ab ? (this.i = na(b) ? b : a.i, Bb(this, a.j), this.w = a.w, this.h = a.h, Cb(this, a.C), this.f = a.f, Db(this, Eb(a.a)), this.s = a.s) : a && (c = String(a).match(ub)) ? (this.i = !!b, Bb(this, c[1] ||
                "", !0), this.w = Fb(c[2] || ""), this.h = Fb(c[3] || "", !0), Cb(this, c[4]), this.f = Fb(c[5] || "", !0), Db(this, c[6] || "", !0), this.s = Fb(c[7] || "")) : (this.i = !!b, this.a = new Gb(null, this.i))
        }
        Ab.prototype.toString = function() {
            var a = [],
                b = this.j;
            b && a.push(Hb(b, Ib, !0), ":");
            var c = this.h;
            if (c || "file" == b) a.push("//"), (b = this.w) && a.push(Hb(b, Ib, !0), "@"), a.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g, "%$1")), c = this.C, null != c && a.push(":", String(c));
            if (c = this.f) this.h && "/" != c.charAt(0) && a.push("/"), a.push(Hb(c,
                "/" == c.charAt(0) ? Jb : Kb, !0));
            (c = this.a.toString()) && a.push("?", c);
            (c = this.s) && a.push("#", Hb(c, Lb));
            return a.join("")
        };
        Ab.prototype.resolve = function(a) {
            var b = new Ab(this),
                c = !!a.j;
            c ? Bb(b, a.j) : c = !!a.w;
            c ? b.w = a.w : c = !!a.h;
            c ? b.h = a.h : c = null != a.C;
            var d = a.f;
            if (c) Cb(b, a.C);
            else if (c = !!a.f) {
                if ("/" != d.charAt(0))
                    if (this.h && !this.f) d = "/" + d;
                    else { var e = b.f.lastIndexOf("/"); - 1 != e && (d = b.f.substr(0, e + 1) + d) }
                e = d;
                if (".." == e || "." == e) d = "";
                else if (-1 != e.indexOf("./") || -1 != e.indexOf("/.")) {
                    d = 0 == e.lastIndexOf("/", 0);
                    e = e.split("/");
                    for (var f = [], g = 0; g < e.length;) { var h = e[g++]; "." == h ? d && g == e.length && f.push("") : ".." == h ? ((1 < f.length || 1 == f.length && "" != f[0]) && f.pop(), d && g == e.length && f.push("")) : (f.push(h), d = !0) }
                    d = f.join("/")
                } else d = e
            }
            c ? b.f = d : c = "" !== a.a.toString();
            c ? Db(b, Eb(a.a)) : c = !!a.s;
            c && (b.s = a.s);
            return b
        };

        function Bb(a, b, c) { a.j = c ? Fb(b, !0) : b;
            a.j && (a.j = a.j.replace(/:$/, "")) }

        function Cb(a, b) { if (b) { b = Number(b); if (isNaN(b) || 0 > b) throw Error("Bad port number " + b);
                a.C = b } else a.C = null }

        function Db(a, b, c) {
            b instanceof Gb ? (a.a = b, Mb(a.a, a.i)) :
                (c || (b = Hb(b, Nb)), a.a = new Gb(b, a.i))
        }

        function Ob(a) { return a instanceof Ab ? new Ab(a) : new Ab(a, void 0) }

        function Pb(a, b) { a instanceof Ab || (a = Ob(a));
            b instanceof Ab || (b = Ob(b)); return a.resolve(b) }

        function Fb(a, b) { return a ? b ? decodeURI(a.replace(/%25/g, "%2525")) : decodeURIComponent(a) : "" }

        function Hb(a, b, c) { return r(a) ? (a = encodeURI(a).replace(b, Qb), c && (a = a.replace(/%25([0-9a-fA-F]{2})/g, "%$1")), a) : null }

        function Qb(a) { a = a.charCodeAt(0); return "%" + (a >> 4 & 15).toString(16) + (a & 15).toString(16) }
        var Ib = /[#\/\?@]/g,
            Kb = /[#\?:]/g,
            Jb = /[#\?]/g,
            Nb = /[#\?@]/g,
            Lb = /#/g;

        function Gb(a, b) { this.f = this.a = null;
            this.h = a || null;
            this.j = !!b }

        function Rb(a) { a.a || (a.a = new rb, a.f = 0, a.h && vb(a.h, function(b, c) { a.add(decodeURIComponent(b.replace(/\+/g, " ")), c) })) }
        l = Gb.prototype;
        l.add = function(a, b) { Rb(this);
            this.h = null;
            a = Sb(this, a); var c = this.a.get(a);
            c || this.a.set(a, c = []);
            c.push(b);
            this.f += 1; return this };

        function Tb(a, b) {
            Rb(a);
            b = Sb(a, b);
            tb(a.a.f, b) && (a.h = null, a.f -= a.a.get(b).length, a = a.a, tb(a.f, b) && (delete a.f[b], a.h--, a.j++, a.a.length >
                2 * a.h && sb(a)))
        }
        l.clear = function() { this.a = this.h = null;
            this.f = 0 };

        function Ub(a, b) { Rb(a);
            b = Sb(a, b); return tb(a.a.f, b) }
        l.forEach = function(a, b) { Rb(this);
            this.a.forEach(function(c, d) { Ja(c, function(e) { a.call(b, e, d, this) }, this) }, this) };
        l.ja = function() { Rb(this); for (var a = this.a.la(), b = this.a.ja(), c = [], d = 0; d < b.length; d++)
                for (var e = a[d], f = 0; f < e.length; f++) c.push(b[d]); return c };
        l.la = function(a) {
            Rb(this);
            var b = [];
            if (r(a)) Ub(this, a) && (b = Va(b, this.a.get(Sb(this, a))));
            else {
                a = this.a.la();
                for (var c = 0; c < a.length; c++) b =
                    Va(b, a[c])
            }
            return b
        };
        l.set = function(a, b) { Rb(this);
            this.h = null;
            a = Sb(this, a);
            Ub(this, a) && (this.f -= this.a.get(a).length);
            this.a.set(a, [b]);
            this.f += 1; return this };
        l.get = function(a, b) { if (!a) return b;
            a = this.la(a); return 0 < a.length ? String(a[0]) : b };
        l.toString = function() {
            if (this.h) return this.h;
            if (!this.a) return "";
            for (var a = [], b = this.a.ja(), c = 0; c < b.length; c++) { var d = b[c],
                    e = encodeURIComponent(String(d));
                d = this.la(d); for (var f = 0; f < d.length; f++) { var g = e; "" !== d[f] && (g += "=" + encodeURIComponent(String(d[f])));
                    a.push(g) } }
            return this.h =
                a.join("&")
        };

        function Eb(a) { var b = new Gb;
            b.h = a.h;
            a.a && (b.a = new rb(a.a), b.f = a.f); return b }

        function Sb(a, b) { b = String(b);
            a.j && (b = b.toLowerCase()); return b }

        function Mb(a, b) { b && !a.j && (Rb(a), a.h = null, a.a.forEach(function(c, d) { var e = d.toLowerCase();
                d != e && (Tb(this, d), Tb(this, e), 0 < c.length && (this.h = null, this.a.set(Sb(this, e), Wa(c)), this.f += c.length)) }, a));
            a.j = b }

        function Vb(a) { this.a = Ob(a) }

        function Wb(a, b) { b ? a.a.a.set(x.Ta, b) : Tb(a.a.a, x.Ta) }

        function Xb(a, b) { null !== b ? a.a.a.set(x.Ra, b ? "1" : "0") : Tb(a.a.a, x.Ra) }

        function Yb(a) { return a.a.a.get(x.Qa) || null }

        function Zb(a, b) { b ? a.a.a.set(x.PROVIDER_ID, b) : Tb(a.a.a, x.PROVIDER_ID) }
        Vb.prototype.toString = function() { return this.a.toString() };
        var x = { Qa: "ui_auid", kc: "apiKey", Ra: "ui_sd", wb: "mode", ab: "oobCode", PROVIDER_ID: "ui_pid", Ta: "ui_sid", xb: "tenantId" };
        var $b;
        a: { var ac = p.navigator; if (ac) { var bc = ac.userAgent; if (bc) { $b = bc; break a } }
            $b = "" }

        function y(a) { return -1 != $b.indexOf(a) }

        function cc() { return (y("Chrome") || y("CriOS")) && !y("Edge") }

        function dc(a) { dc[" "](a); return a }
        dc[" "] = qa;

        function ec(a, b) { var c = fc; return Object.prototype.hasOwnProperty.call(c, a) ? c[a] : c[a] = b(a) }
        var gc = y("Opera"),
            z = y("Trident") || y("MSIE"),
            hc = y("Edge"),
            ic = hc || z,
            jc = y("Gecko") && !(-1 != $b.toLowerCase().indexOf("webkit") && !y("Edge")) && !(y("Trident") || y("MSIE")) && !y("Edge"),
            kc = -1 != $b.toLowerCase().indexOf("webkit") && !y("Edge"),
            lc = kc && y("Mobile"),
            mc = y("Macintosh");

        function nc() { var a = p.document; return a ? a.documentMode : void 0 }
        var oc;
        a: {
            var pc = "",
                qc = function() {
                    var a = $b;
                    if (jc) return /rv:([^\);]+)(\)|;)/.exec(a);
                    if (hc) return /Edge\/([\d\.]+)/.exec(a);
                    if (z) return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);
                    if (kc) return /WebKit\/(\S+)/.exec(a);
                    if (gc) return /(?:Version)[ \/]?(\S+)/.exec(a)
                }();qc && (pc = qc ? qc[1] : "");
            if (z) { var rc = nc(); if (null != rc && rc > parseFloat(pc)) { oc = String(rc); break a } }
            oc = pc
        }
        var fc = {};

        function sc(a) {
            return ec(a, function() {
                for (var b = 0, c = Za(String(oc)).split("."), d = Za(String(a)).split("."), e = Math.max(c.length, d.length), f = 0; 0 == b && f < e; f++) {
                    var g = c[f] || "",
                        h = d[f] || "";
                    do {
                        g = /(\d*)(\D*)(.*)/.exec(g) || ["",
                            "", "", ""
                        ];
                        h = /(\d*)(\D*)(.*)/.exec(h) || ["", "", "", ""];
                        if (0 == g[0].length && 0 == h[0].length) break;
                        b = gb(0 == g[1].length ? 0 : parseInt(g[1], 10), 0 == h[1].length ? 0 : parseInt(h[1], 10)) || gb(0 == g[2].length, 0 == h[2].length) || gb(g[2], h[2]);
                        g = g[3];
                        h = h[3]
                    } while (0 == b)
                }
                return 0 <= b
            })
        }
        var tc;
        var uc = p.document;
        tc = uc && z ? nc() || ("CSS1Compat" == uc.compatMode ? parseInt(oc, 10) : 5) : void 0;

        function vc(a, b) { this.a = a === wc && b || "";
            this.f = xc }
        vc.prototype.ma = !0;
        vc.prototype.ka = function() { return this.a };
        vc.prototype.toString = function() {
            return "Const{" +
                this.a + "}"
        };

        function yc(a) { if (a instanceof vc && a.constructor === vc && a.f === xc) return a.a;
            Ga("expected object of type Const, got '" + a + "'"); return "type_error:Const" }
        var xc = {},
            wc = {};

        function zc() { this.a = "";
            this.h = Ac }
        zc.prototype.ma = !0;
        zc.prototype.ka = function() { return this.a.toString() };
        zc.prototype.f = function() { return 1 };
        zc.prototype.toString = function() { return "TrustedResourceUrl{" + this.a + "}" };

        function Bc(a) {
            if (a instanceof zc && a.constructor === zc && a.h === Ac) return a.a;
            Ga("expected object of type TrustedResourceUrl, got '" +
                a + "' of type " + sa(a));
            return "type_error:TrustedResourceUrl"
        }
        var Ac = {};

        function Cc(a) { var b = new zc;
            b.a = a; return b }

        function Dc() { this.a = "";
            this.h = Ec }
        Dc.prototype.ma = !0;
        Dc.prototype.ka = function() { return this.a.toString() };
        Dc.prototype.f = function() { return 1 };
        Dc.prototype.toString = function() { return "SafeUrl{" + this.a + "}" };

        function Fc(a) { return Gc(a).toString() }

        function Gc(a) { if (a instanceof Dc && a.constructor === Dc && a.h === Ec) return a.a;
            Ga("expected object of type SafeUrl, got '" + a + "' of type " + sa(a)); return "type_error:SafeUrl" }
        var Hc = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;

        function Ic(a) { if (a instanceof Dc) return a;
            a = "object" == typeof a && a.ma ? a.ka() : String(a);
            Hc.test(a) || (a = "about:invalid#zClosurez"); return Jc(a) }
        var Ec = {};

        function Jc(a) { var b = new Dc;
            b.a = a; return b }
        Jc("about:blank");

        function Kc() { this.a = "";
            this.f = Lc }
        Kc.prototype.ma = !0;
        var Lc = {};
        Kc.prototype.ka = function() { return this.a };
        Kc.prototype.toString = function() { return "SafeStyle{" + this.a + "}" };

        function Mc() { this.a = "";
            this.j = Nc;
            this.h = null }
        Mc.prototype.f =
            function() { return this.h };
        Mc.prototype.ma = !0;
        Mc.prototype.ka = function() { return this.a.toString() };
        Mc.prototype.toString = function() { return "SafeHtml{" + this.a + "}" };

        function Oc(a) { if (a instanceof Mc && a.constructor === Mc && a.j === Nc) return a.a;
            Ga("expected object of type SafeHtml, got '" + a + "' of type " + sa(a)); return "type_error:SafeHtml" }
        var Nc = {};

        function Pc(a, b) { var c = new Mc;
            c.a = a;
            c.h = b; return c }
        Pc("<!DOCTYPE html>", 0);
        var Qc = Pc("", 0);
        Pc("<br>", 0);
        var Rc = function(a) {
            var b = !1,
                c;
            return function() {
                b || (c = a(),
                    b = !0);
                return c
            }
        }(function() { if ("undefined" === typeof document) return !1; var a = document.createElement("div"),
                b = document.createElement("div");
            b.appendChild(document.createElement("div"));
            a.appendChild(b); if (!a.firstChild) return !1;
            b = a.firstChild.firstChild;
            a.innerHTML = Oc(Qc); return !b.parentElement });

        function Sc(a, b) {
            a.src = Bc(b);
            if (null === pa) b: { b = p.document; if ((b = b.querySelector && b.querySelector("script[nonce]")) && (b = b.nonce || b.getAttribute("nonce")) && oa.test(b)) { pa = b; break b }
                pa = "" }
            b = pa;
            b && a.setAttribute("nonce",
                b)
        }

        function Tc(a, b) { this.a = na(a) ? a : 0;
            this.f = na(b) ? b : 0 }
        Tc.prototype.toString = function() { return "(" + this.a + ", " + this.f + ")" };
        Tc.prototype.ceil = function() { this.a = Math.ceil(this.a);
            this.f = Math.ceil(this.f); return this };
        Tc.prototype.floor = function() { this.a = Math.floor(this.a);
            this.f = Math.floor(this.f); return this };
        Tc.prototype.round = function() { this.a = Math.round(this.a);
            this.f = Math.round(this.f); return this };

        function Uc(a, b) { this.width = a;
            this.height = b }
        l = Uc.prototype;
        l.toString = function() {
            return "(" + this.width +
                " x " + this.height + ")"
        };
        l.aspectRatio = function() { return this.width / this.height };
        l.ceil = function() { this.width = Math.ceil(this.width);
            this.height = Math.ceil(this.height); return this };
        l.floor = function() { this.width = Math.floor(this.width);
            this.height = Math.floor(this.height); return this };
        l.round = function() { this.width = Math.round(this.width);
            this.height = Math.round(this.height); return this };

        function Vc(a) { return a ? new Wc(Xc(a)) : Ea || (Ea = new Wc) }

        function Yc(a, b) {
            var c = b || document;
            return c.querySelectorAll && c.querySelector ?
                c.querySelectorAll("." + a) : Zc(document, a, b)
        }

        function $c(a, b) { var c = b || document; if (c.getElementsByClassName) a = c.getElementsByClassName(a)[0];
            else { c = document; var d = b || c;
                a = d.querySelectorAll && d.querySelector && a ? d.querySelector(a ? "." + a : "") : Zc(c, a, b)[0] || null } return a || null }

        function Zc(a, b, c) {
            var d;
            a = c || a;
            if (a.querySelectorAll && a.querySelector && b) return a.querySelectorAll(b ? "." + b : "");
            if (b && a.getElementsByClassName) { var e = a.getElementsByClassName(b); return e }
            e = a.getElementsByTagName("*");
            if (b) {
                var f = {};
                for (c = d = 0; a = e[c]; c++) { var g = a.className; "function" == typeof g.split && Qa(g.split(/\s+/), b) && (f[d++] = a) }
                f.length = d;
                return f
            }
            return e
        }

        function ad(a, b) { ib(b, function(c, d) { c && "object" == typeof c && c.ma && (c = c.ka()); "style" == d ? a.style.cssText = c : "class" == d ? a.className = c : "for" == d ? a.htmlFor = c : bd.hasOwnProperty(d) ? a.setAttribute(bd[d], c) : 0 == d.lastIndexOf("aria-", 0) || 0 == d.lastIndexOf("data-", 0) ? a.setAttribute(d, c) : a[d] = c }) }
        var bd = {
            cellpadding: "cellPadding",
            cellspacing: "cellSpacing",
            colspan: "colSpan",
            frameborder: "frameBorder",
            height: "height",
            maxlength: "maxLength",
            nonce: "nonce",
            role: "role",
            rowspan: "rowSpan",
            type: "type",
            usemap: "useMap",
            valign: "vAlign",
            width: "width"
        };

        function cd(a) { return a.scrollingElement ? a.scrollingElement : kc || "CSS1Compat" != a.compatMode ? a.body || a.documentElement : a.documentElement }

        function dd(a) { a && a.parentNode && a.parentNode.removeChild(a) }

        function Xc(a) { return 9 == a.nodeType ? a : a.ownerDocument || a.document }

        function ed(a, b) {
            if ("textContent" in a) a.textContent = b;
            else if (3 == a.nodeType) a.data = String(b);
            else if (a.firstChild &&
                3 == a.firstChild.nodeType) { for (; a.lastChild != a.firstChild;) a.removeChild(a.lastChild);
                a.firstChild.data = String(b) } else { for (var c; c = a.firstChild;) a.removeChild(c);
                a.appendChild(Xc(a).createTextNode(String(b))) }
        }

        function fd(a, b) { return b ? gd(a, function(c) { return !b || r(c.className) && Qa(c.className.split(/\s+/), b) }) : null }

        function gd(a, b) { for (var c = 0; a;) { if (b(a)) return a;
                a = a.parentNode;
                c++ } return null }

        function Wc(a) { this.a = a || p.document || document }
        Wc.prototype.R = function() {
            return r(void 0) ? this.a.getElementById(void 0) :
                void 0
        };
        var hd = { Ec: !0 },
            id = { Gc: !0 },
            jd = { Dc: !0 },
            kd = { Fc: !0 };

        function ld() { throw Error("Do not instantiate directly"); }
        ld.prototype.va = null;
        ld.prototype.toString = function() { return this.content };

        function md(a, b, c, d) { a = a(b || nd, void 0, c);
            d = (d || Vc()).a.createElement("DIV");
            a = od(a);
            a.match(pd);
            a = Pc(a, null); if (Rc())
                for (; d.lastChild;) d.removeChild(d.lastChild);
            d.innerHTML = Oc(a);
            1 == d.childNodes.length && (a = d.firstChild, 1 == a.nodeType && (d = a)); return d }

        function od(a) {
            if (!wa(a)) return hb(String(a));
            if (a instanceof ld) { if (a.fa === hd) return a.content; if (a.fa === kd) return hb(a.content) }
            Ga("Soy template output is unsafe for use as HTML: " + a);
            return "zSoyz"
        }
        var pd = /^<(body|caption|col|colgroup|head|html|tr|td|th|tbody|thead|tfoot)>/i,
            nd = {};

        function qd(a) { if (null != a) switch (a.va) {
                case 1:
                    return 1;
                case -1:
                    return -1;
                case 0:
                    return 0 }
            return null }

        function rd() { ld.call(this) }
        w(rd, ld);
        rd.prototype.fa = hd;

        function A(a) { return null != a && a.fa === hd ? a : a instanceof Mc ? B(Oc(a).toString(), a.f()) : B(hb(String(String(a))), qd(a)) }

        function sd() { ld.call(this) }
        w(sd, ld);
        sd.prototype.fa = id;
        sd.prototype.va = 1;

        function ud(a, b) { this.content = String(a);
            this.va = null != b ? b : null }
        w(ud, ld);
        ud.prototype.fa = kd;

        function C(a) { return new ud(a, void 0) }
        var B = function(a) {
                function b(c) { this.content = c }
                b.prototype = a.prototype; return function(c, d) { c = new b(String(c));
                    void 0 !== d && (c.va = d); return c } }(rd),
            vd = function(a) {
                function b(c) { this.content = c }
                b.prototype = a.prototype; return function(c) { return new b(String(c)) } }(sd);

        function wd(a) {
            function b() {}
            var c = { label: D("New password") };
            b.prototype =
                a;
            a = new b;
            for (var d in c) a[d] = c[d];
            return a
        }

        function D(a) { return (a = String(a)) ? new ud(a, void 0) : "" }
        var xd = function(a) {
            function b(c) { this.content = c }
            b.prototype = a.prototype; return function(c, d) { c = String(c); if (!c) return "";
                c = new b(c);
                void 0 !== d && (c.va = d); return c } }(rd);

        function yd(a) { return null != a && a.fa === hd ? String(String(a.content).replace(zd, "").replace(Ad, "&lt;")).replace(Bd, Cd) : hb(String(a)) }

        function Dd(a) {
            null != a && a.fa === id ? a = String(a).replace(Ed, Fd) : a instanceof Dc ? a = String(Fc(a)).replace(Ed, Fd) :
                (a = String(a), Gd.test(a) ? a = a.replace(Ed, Fd) : (Ga("Bad value `%s` for |filterNormalizeUri", [a]), a = "#zSoyz"));
            return a
        }

        function Hd(a) { null != a && a.fa === jd ? a = a.content : null == a ? a = "" : a instanceof Kc ? a instanceof Kc && a.constructor === Kc && a.f === Lc ? a = a.a : (Ga("expected object of type SafeStyle, got '" + a + "' of type " + sa(a)), a = "type_error:SafeStyle") : (a = String(a), Id.test(a) || (Ga("Bad value `%s` for |filterCssValue", [a]), a = "zSoyz")); return a }
        var Jd = {
            "\x00": "&#0;",
            "\t": "&#9;",
            "\n": "&#10;",
            "\x0B": "&#11;",
            "\f": "&#12;",
            "\r": "&#13;",
            " ": "&#32;",
            '"': "&quot;",
            "&": "&amp;",
            "'": "&#39;",
            "-": "&#45;",
            "/": "&#47;",
            "<": "&lt;",
            "=": "&#61;",
            ">": "&gt;",
            "`": "&#96;",
            "\u0085": "&#133;",
            "\u00a0": "&#160;",
            "\u2028": "&#8232;",
            "\u2029": "&#8233;"
        };

        function Cd(a) { return Jd[a] }
        var Kd = {
            "\x00": "%00",
            "\u0001": "%01",
            "\u0002": "%02",
            "\u0003": "%03",
            "\u0004": "%04",
            "\u0005": "%05",
            "\u0006": "%06",
            "\u0007": "%07",
            "\b": "%08",
            "\t": "%09",
            "\n": "%0A",
            "\x0B": "%0B",
            "\f": "%0C",
            "\r": "%0D",
            "\u000e": "%0E",
            "\u000f": "%0F",
            "\u0010": "%10",
            "\u0011": "%11",
            "\u0012": "%12",
            "\u0013": "%13",
            "\u0014": "%14",
            "\u0015": "%15",
            "\u0016": "%16",
            "\u0017": "%17",
            "\u0018": "%18",
            "\u0019": "%19",
            "\u001a": "%1A",
            "\u001b": "%1B",
            "\u001c": "%1C",
            "\u001d": "%1D",
            "\u001e": "%1E",
            "\u001f": "%1F",
            " ": "%20",
            '"': "%22",
            "'": "%27",
            "(": "%28",
            ")": "%29",
            "<": "%3C",
            ">": "%3E",
            "\\": "%5C",
            "{": "%7B",
            "}": "%7D",
            "\u007f": "%7F",
            "\u0085": "%C2%85",
            "\u00a0": "%C2%A0",
            "\u2028": "%E2%80%A8",
            "\u2029": "%E2%80%A9",
            "\uff01": "%EF%BC%81",
            "\uff03": "%EF%BC%83",
            "\uff04": "%EF%BC%84",
            "\uff06": "%EF%BC%86",
            "\uff07": "%EF%BC%87",
            "\uff08": "%EF%BC%88",
            "\uff09": "%EF%BC%89",
            "\uff0a": "%EF%BC%8A",
            "\uff0b": "%EF%BC%8B",
            "\uff0c": "%EF%BC%8C",
            "\uff0f": "%EF%BC%8F",
            "\uff1a": "%EF%BC%9A",
            "\uff1b": "%EF%BC%9B",
            "\uff1d": "%EF%BC%9D",
            "\uff1f": "%EF%BC%9F",
            "\uff20": "%EF%BC%A0",
            "\uff3b": "%EF%BC%BB",
            "\uff3d": "%EF%BC%BD"
        };

        function Fd(a) { return Kd[a] }
        var Bd = /[\x00\x22\x27\x3c\x3e]/g,
            Ed = /[\x00- \x22\x27-\x29\x3c\x3e\\\x7b\x7d\x7f\x85\xa0\u2028\u2029\uff01\uff03\uff04\uff06-\uff0c\uff0f\uff1a\uff1b\uff1d\uff1f\uff20\uff3b\uff3d]/g,
            Id = /^(?!-*(?:expression|(?:moz-)?binding))(?:[.#]?-?(?:[_a-z0-9-]+)(?:-[_a-z0-9-]+)*-?|-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[a-z]{1,2}|%)?|!important|)$/i,
            Gd = /^(?![^#?]*\/(?:\.|%2E){2}(?:[\/?#]|$))(?:(?:https?|mailto):|[^&:\/?#]*(?:[\/?#]|$))/i,
            zd = /<(?:!|\/?([a-zA-Z][a-zA-Z0-9:\-]*))(?:[^>'"]|"[^"]*"|'[^']*')*>/g,
            Ad = /</g;

        function Ld() { return C("Enter a valid phone number") }

        function Md() { return C("Unable to send password reset code to specified email") }

        function Nd() { return C("Something went wrong. Please try again.") }

        function Od() { return C("This email already exists without any means of sign-in. Please reset the password to recover.") }

        function Pd(a) {
            a =
                a || {};
            var b = "";
            switch (a.code) {
                case "invalid-argument":
                    b += "Client specified an invalid argument.";
                    break;
                case "invalid-configuration":
                    b += "Client specified an invalid project configuration.";
                    break;
                case "failed-precondition":
                    b += "Request can not be executed in the current system state.";
                    break;
                case "out-of-range":
                    b += "Client specified an invalid range.";
                    break;
                case "unauthenticated":
                    b += "Request not authenticated due to missing, invalid, or expired OAuth token.";
                    break;
                case "permission-denied":
                    b += "Client does not have sufficient permission.";
                    break;
                case "not-found":
                    b += "Specified resource is not found.";
                    break;
                case "aborted":
                    b += "Concurrency conflict, such as read-modify-write conflict.";
                    break;
                case "already-exists":
                    b += "The resource that a client tried to create already exists.";
                    break;
                case "resource-exhausted":
                    b += "Either out of resource quota or reaching rate limiting.";
                    break;
                case "cancelled":
                    b += "Request cancelled by the client.";
                    break;
                case "data-loss":
                    b += "Unrecoverable data loss or data corruption.";
                    break;
                case "unknown":
                    b += "Unknown server error.";
                    break;
                case "internal":
                    b += "Internal server error.";
                    break;
                case "not-implemented":
                    b += "API method not implemented by the server.";
                    break;
                case "unavailable":
                    b += "Service unavailable.";
                    break;
                case "deadline-exceeded":
                    b += "Request deadline exceeded.";
                    break;
                case "auth/user-disabled":
                    b += "The user account has been disabled by an administrator.";
                    break;
                case "auth/timeout":
                    b += "The operation has timed out.";
                    break;
                case "auth/too-many-requests":
                    b += "We have blocked all requests from this device due to unusual activity. Try again later.";
                    break;
                case "auth/quota-exceeded":
                    b += "The quota for this operation has been exceeded. Try again later.";
                    break;
                case "auth/network-request-failed":
                    b += "A network error has occurred. Try again later.";
                    break;
                case "restart-process":
                    b += "An issue was encountered when authenticating your request. Please visit the URL that redirected you to this page again to restart the authentication process.";
                    break;
                case "no-matching-tenant-for-email":
                    b += "No sign-in provider is available for the given email, please try with a different email."
            }
            return C(b)
        }

        function Qd() { return C("Please login again to perform this operation") }

        function Rd(a, b, c) { var d = Error.call(this);
            this.message = d.message; "stack" in d && (this.stack = d.stack);
            this.code = Sd + a; if (!(a = b)) { a = ""; switch (this.code) {
                    case "firebaseui/merge-conflict":
                        a += "The current anonymous user failed to upgrade. The non-anonymous credential is already associated with a different user account."; break;
                    default:
                        a += Nd() }
                a = C(a).toString() }
            this.message = a || "";
            this.credential = c || null }
        n(Rd, Error);
        Rd.prototype.aa = function() {
            return {
                code: this.code,
                message: this.message
            }
        };
        Rd.prototype.toJSON = function() { return this.aa() };
        var Sd = "firebaseui/";

        function Td() { 0 != Ud && (Vd[this[xa] || (this[xa] = ++ya)] = this);
            this.O = this.O;
            this.C = this.C }
        var Ud = 0,
            Vd = {};
        Td.prototype.O = !1;
        Td.prototype.o = function() {
            if (!this.O && (this.O = !0, this.m(), 0 != Ud)) {
                var a = this[xa] || (this[xa] = ++ya);
                if (0 != Ud && this.C && 0 < this.C.length) throw Error(this + " did not empty its onDisposeCallbacks queue. This probably means it overrode dispose() or disposeInternal() without calling the superclass' method.");
                delete Vd[a]
            }
        };

        function Wd(a, b) { a.O ? na(void 0) ? b.call(void 0) : b() : (a.C || (a.C = []), a.C.push(na(void 0) ? t(b, void 0) : b)) }
        Td.prototype.m = function() { if (this.C)
                for (; this.C.length;) this.C.shift()() };

        function Xd(a) { a && "function" == typeof a.o && a.o() }
        var Yd = Object.freeze || function(a) { return a };
        var Zd = !z || 9 <= Number(tc),
            $d = z && !sc("9"),
            ae = function() {
                if (!p.addEventListener || !Object.defineProperty) return !1;
                var a = !1,
                    b = Object.defineProperty({}, "passive", { get: function() { a = !0 } });
                try {
                    p.addEventListener("test", qa, b), p.removeEventListener("test",
                        qa, b)
                } catch (c) {}
                return a
            }();

        function be(a, b) { this.type = a;
            this.f = this.target = b;
            this.h = !1;
            this.sb = !0 }
        be.prototype.stopPropagation = function() { this.h = !0 };
        be.prototype.preventDefault = function() { this.sb = !1 };

        function ce(a, b) {
            be.call(this, a ? a.type : "");
            this.relatedTarget = this.f = this.target = null;
            this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0;
            this.key = "";
            this.j = this.keyCode = 0;
            this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1;
            this.pointerId = 0;
            this.pointerType = "";
            this.a = null;
            if (a) {
                var c =
                    this.type = a.type,
                    d = a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : null;
                this.target = a.target || a.srcElement;
                this.f = b;
                if (b = a.relatedTarget) { if (jc) { a: { try { dc(b.nodeName); var e = !0; break a } catch (f) {}
                            e = !1 }
                        e || (b = null) } } else "mouseover" == c ? b = a.fromElement : "mouseout" == c && (b = a.toElement);
                this.relatedTarget = b;
                d ? (this.clientX = void 0 !== d.clientX ? d.clientX : d.pageX, this.clientY = void 0 !== d.clientY ? d.clientY : d.pageY, this.screenX = d.screenX || 0, this.screenY = d.screenY || 0) : (this.clientX = void 0 !== a.clientX ?
                    a.clientX : a.pageX, this.clientY = void 0 !== a.clientY ? a.clientY : a.pageY, this.screenX = a.screenX || 0, this.screenY = a.screenY || 0);
                this.button = a.button;
                this.keyCode = a.keyCode || 0;
                this.key = a.key || "";
                this.j = a.charCode || ("keypress" == c ? a.keyCode : 0);
                this.ctrlKey = a.ctrlKey;
                this.altKey = a.altKey;
                this.shiftKey = a.shiftKey;
                this.metaKey = a.metaKey;
                this.pointerId = a.pointerId || 0;
                this.pointerType = r(a.pointerType) ? a.pointerType : de[a.pointerType] || "";
                this.a = a;
                a.defaultPrevented && this.preventDefault()
            }
        }
        w(ce, be);
        var de = Yd({
            2: "touch",
            3: "pen",
            4: "mouse"
        });
        ce.prototype.stopPropagation = function() { ce.M.stopPropagation.call(this);
            this.a.stopPropagation ? this.a.stopPropagation() : this.a.cancelBubble = !0 };
        ce.prototype.preventDefault = function() { ce.M.preventDefault.call(this); var a = this.a; if (a.preventDefault) a.preventDefault();
            else if (a.returnValue = !1, $d) try { if (a.ctrlKey || 112 <= a.keyCode && 123 >= a.keyCode) a.keyCode = -1 } catch (b) {} };
        var ee = "closure_listenable_" + (1E6 * Math.random() | 0),
            fe = 0;

        function ge(a, b, c, d, e) {
            this.listener = a;
            this.proxy = null;
            this.src =
                b;
            this.type = c;
            this.capture = !!d;
            this.La = e;
            this.key = ++fe;
            this.sa = this.Ha = !1
        }

        function he(a) { a.sa = !0;
            a.listener = null;
            a.proxy = null;
            a.src = null;
            a.La = null }

        function ie(a) { this.src = a;
            this.a = {};
            this.f = 0 }
        ie.prototype.add = function(a, b, c, d, e) { var f = a.toString();
            a = this.a[f];
            a || (a = this.a[f] = [], this.f++); var g = je(a, b, d, e); - 1 < g ? (b = a[g], c || (b.Ha = !1)) : (b = new ge(b, this.src, f, !!d, e), b.Ha = c, a.push(b)); return b };

        function ke(a, b) { var c = b.type;
            c in a.a && Ra(a.a[c], b) && (he(b), 0 == a.a[c].length && (delete a.a[c], a.f--)) }

        function je(a,
            b, c, d) { for (var e = 0; e < a.length; ++e) { var f = a[e]; if (!f.sa && f.listener == b && f.capture == !!c && f.La == d) return e } return -1 }
        var le = "closure_lm_" + (1E6 * Math.random() | 0),
            me = {},
            ne = 0;

        function oe(a, b, c, d, e) { if (d && d.once) return pe(a, b, c, d, e); if (ta(b)) { for (var f = 0; f < b.length; f++) oe(a, b[f], c, d, e); return null }
            c = qe(c); return a && a[ee] ? a.I.add(String(b), c, !1, wa(d) ? !!d.capture : !!d, e) : re(a, b, c, !1, d, e) }

        function re(a, b, c, d, e, f) {
            if (!b) throw Error("Invalid event type");
            var g = wa(e) ? !!e.capture : !!e,
                h = se(a);
            h || (a[le] = h = new ie(a));
            c = h.add(b, c, d, g, f);
            if (c.proxy) return c;
            d = te();
            c.proxy = d;
            d.src = a;
            d.listener = c;
            if (a.addEventListener) ae || (e = g), void 0 === e && (e = !1), a.addEventListener(b.toString(), d, e);
            else if (a.attachEvent) a.attachEvent(ue(b.toString()), d);
            else if (a.addListener && a.removeListener) a.addListener(d);
            else throw Error("addEventListener and attachEvent are unavailable.");
            ne++;
            return c
        }

        function te() { var a = ve,
                b = Zd ? function(c) { return a.call(b.src, b.listener, c) } : function(c) { c = a.call(b.src, b.listener, c); if (!c) return c }; return b }

        function pe(a, b, c, d, e) { if (ta(b)) { for (var f = 0; f < b.length; f++) pe(a, b[f], c, d, e); return null }
            c = qe(c); return a && a[ee] ? a.I.add(String(b), c, !0, wa(d) ? !!d.capture : !!d, e) : re(a, b, c, !0, d, e) }

        function we(a, b, c, d, e) {
            if (ta(b))
                for (var f = 0; f < b.length; f++) we(a, b[f], c, d, e);
            else(d = wa(d) ? !!d.capture : !!d, c = qe(c), a && a[ee]) ? (a = a.I, b = String(b).toString(), b in a.a && (f = a.a[b], c = je(f, c, d, e), -1 < c && (he(f[c]), Sa(f, c), 0 == f.length && (delete a.a[b], a.f--)))) : a && (a = se(a)) && (b = a.a[b.toString()], a = -1, b && (a = je(b, c, d, e)), (c = -1 < a ? b[a] : null) &&
                xe(c))
        }

        function xe(a) { if ("number" != typeof a && a && !a.sa) { var b = a.src; if (b && b[ee]) ke(b.I, a);
                else { var c = a.type,
                        d = a.proxy;
                    b.removeEventListener ? b.removeEventListener(c, d, a.capture) : b.detachEvent ? b.detachEvent(ue(c), d) : b.addListener && b.removeListener && b.removeListener(d);
                    ne--;
                    (c = se(b)) ? (ke(c, a), 0 == c.f && (c.src = null, b[le] = null)) : he(a) } } }

        function ue(a) { return a in me ? me[a] : me[a] = "on" + a }

        function ye(a, b, c, d) {
            var e = !0;
            if (a = se(a))
                if (b = a.a[b.toString()])
                    for (b = b.concat(), a = 0; a < b.length; a++) {
                        var f = b[a];
                        f && f.capture ==
                            c && !f.sa && (f = ze(f, d), e = e && !1 !== f)
                    }
                return e
        }

        function ze(a, b) { var c = a.listener,
                d = a.La || a.src;
            a.Ha && xe(a); return c.call(d, b) }

        function ve(a, b) {
            if (a.sa) return !0;
            if (!Zd) {
                if (!b) a: { b = ["window", "event"]; for (var c = p, d = 0; d < b.length; d++)
                        if (c = c[b[d]], null == c) { b = null; break a }
                    b = c }
                d = b;
                b = new ce(d, this);
                c = !0;
                if (!(0 > d.keyCode || void 0 != d.returnValue)) {
                    a: { var e = !1; if (0 == d.keyCode) try { d.keyCode = -1; break a } catch (g) { e = !0 }
                        if (e || void 0 == d.returnValue) d.returnValue = !0 }
                    d = [];
                    for (e = b.f; e; e = e.parentNode) d.push(e);a = a.type;
                    for (e =
                        d.length - 1; !b.h && 0 <= e; e--) { b.f = d[e]; var f = ye(d[e], a, !0, b);
                        c = c && f }
                    for (e = 0; !b.h && e < d.length; e++) b.f = d[e],
                    f = ye(d[e], a, !1, b),
                    c = c && f
                }
                return c
            }
            return ze(a, new ce(b, this))
        }

        function se(a) { a = a[le]; return a instanceof ie ? a : null }
        var Ae = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);

        function qe(a) { if (va(a)) return a;
            a[Ae] || (a[Ae] = function(b) { return a.handleEvent(b) }); return a[Ae] }

        function F() { Td.call(this);
            this.I = new ie(this);
            this.yb = this;
            this.Fa = null }
        w(F, Td);
        F.prototype[ee] = !0;
        F.prototype.$a = function(a) {
            this.Fa =
                a
        };
        F.prototype.removeEventListener = function(a, b, c, d) { we(this, a, b, c, d) };

        function Be(a, b) { var c, d = a.Fa; if (d)
                for (c = []; d; d = d.Fa) c.push(d);
            a = a.yb;
            d = b.type || b; if (r(b)) b = new be(b, a);
            else if (b instanceof be) b.target = b.target || a;
            else { var e = b;
                b = new be(d, a);
                lb(b, e) }
            e = !0; if (c)
                for (var f = c.length - 1; !b.h && 0 <= f; f--) { var g = b.f = c[f];
                    e = Ce(g, d, !0, b) && e }
            b.h || (g = b.f = a, e = Ce(g, d, !0, b) && e, b.h || (e = Ce(g, d, !1, b) && e)); if (c)
                for (f = 0; !b.h && f < c.length; f++) g = b.f = c[f], e = Ce(g, d, !1, b) && e; return e }
        F.prototype.m = function() {
            F.M.m.call(this);
            if (this.I) { var a = this.I,
                    b = 0,
                    c; for (c in a.a) { for (var d = a.a[c], e = 0; e < d.length; e++) ++b, he(d[e]);
                    delete a.a[c];
                    a.f-- } }
            this.Fa = null
        };

        function Ce(a, b, c, d) { b = a.I.a[String(b)]; if (!b) return !0;
            b = b.concat(); for (var e = !0, f = 0; f < b.length; ++f) { var g = b[f]; if (g && !g.sa && g.capture == c) { var h = g.listener,
                        k = g.La || g.src;
                    g.Ha && ke(a.I, g);
                    e = !1 !== h.call(k, d) && e } } return e && 0 != d.sb }
        var De = {},
            Ee = 0;

        function Fe(a, b) {
            if (!a) throw Error("Event target element must be provided!");
            a = Ge(a);
            if (De[a] && De[a].length)
                for (var c = 0; c < De[a].length; c++) Be(De[a][c],
                    b)
        }

        function He(a) { var b = Ge(a.R());
            De[b] && De[b].length && (Ta(De[b], function(c) { return c == a }), De[b].length || delete De[b]) }

        function Ge(a) { "undefined" === typeof a.a && (a.a = Ee, Ee++); return a.a }

        function Ie(a) { if (!a) throw Error("Event target element must be provided!");
            F.call(this);
            this.a = a }
        n(Ie, F);
        Ie.prototype.R = function() { return this.a };
        Ie.prototype.register = function() { var a = Ge(this.R());
            De[a] ? Qa(De[a], this) || De[a].push(this) : De[a] = [this] };

        function Je(a) { if (!a) return !1; try { return !!a.$goog_Thenable } catch (b) { return !1 } }

        function Ke(a, b) { this.h = a;
            this.j = b;
            this.f = 0;
            this.a = null }
        Ke.prototype.get = function() { if (0 < this.f) { this.f--; var a = this.a;
                this.a = a.next;
                a.next = null } else a = this.h(); return a };

        function Le(a, b) { a.j(b);
            100 > a.f && (a.f++, b.next = a.a, a.a = b) }

        function Me() { this.f = this.a = null }
        var Oe = new Ke(function() { return new Ne }, function(a) { a.reset() });
        Me.prototype.add = function(a, b) { var c = Oe.get();
            c.set(a, b);
            this.f ? this.f.next = c : this.a = c;
            this.f = c };

        function Pe() {
            var a = Qe,
                b = null;
            a.a && (b = a.a, a.a = a.a.next, a.a || (a.f = null), b.next =
                null);
            return b
        }

        function Ne() { this.next = this.f = this.a = null }
        Ne.prototype.set = function(a, b) { this.a = a;
            this.f = b;
            this.next = null };
        Ne.prototype.reset = function() { this.next = this.f = this.a = null };

        function Re(a) { p.setTimeout(function() { throw a; }, 0) }
        var Se;

        function Te() {
            var a = p.MessageChannel;
            "undefined" === typeof a && "undefined" !== typeof window && window.postMessage && window.addEventListener && !y("Presto") && (a = function() {
                var e = document.createElement("IFRAME");
                e.style.display = "none";
                e.src = "";
                document.documentElement.appendChild(e);
                var f = e.contentWindow;
                e = f.document;
                e.open();
                e.write("");
                e.close();
                var g = "callImmediate" + Math.random(),
                    h = "file:" == f.location.protocol ? "*" : f.location.protocol + "//" + f.location.host;
                e = t(function(k) { if (("*" == h || k.origin == h) && k.data == g) this.port1.onmessage() }, this);
                f.addEventListener("message", e, !1);
                this.port1 = {};
                this.port2 = { postMessage: function() { f.postMessage(g, h) } }
            });
            if ("undefined" !== typeof a && !y("Trident") && !y("MSIE")) {
                var b = new a,
                    c = {},
                    d = c;
                b.port1.onmessage = function() {
                    if (na(c.next)) {
                        c = c.next;
                        var e =
                            c.hb;
                        c.hb = null;
                        e()
                    }
                };
                return function(e) { d.next = { hb: e };
                    d = d.next;
                    b.port2.postMessage(0) }
            }
            return "undefined" !== typeof document && "onreadystatechange" in document.createElement("SCRIPT") ? function(e) { var f = document.createElement("SCRIPT");
                f.onreadystatechange = function() { f.onreadystatechange = null;
                    f.parentNode.removeChild(f);
                    f = null;
                    e();
                    e = null };
                document.documentElement.appendChild(f) } : function(e) { p.setTimeout(e, 0) }
        }

        function Ue(a, b) { Ve || We();
            Xe || (Ve(), Xe = !0);
            Qe.add(a, b) }
        var Ve;

        function We() {
            if (p.Promise && p.Promise.resolve) {
                var a =
                    p.Promise.resolve(void 0);
                Ve = function() { a.then(Ye) }
            } else Ve = function() { var b = Ye;!va(p.setImmediate) || p.Window && p.Window.prototype && !y("Edge") && p.Window.prototype.setImmediate == p.setImmediate ? (Se || (Se = Te()), Se(b)) : p.setImmediate(b) }
        }
        var Xe = !1,
            Qe = new Me;

        function Ye() { for (var a; a = Pe();) { try { a.a.call(a.f) } catch (b) { Re(b) }
                Le(Oe, a) }
            Xe = !1 }

        function Ze(a) {
            this.a = $e;
            this.w = void 0;
            this.j = this.f = this.h = null;
            this.s = this.i = !1;
            if (a != qa) try {
                var b = this;
                a.call(void 0, function(c) { af(b, bf, c) }, function(c) {
                    if (!(c instanceof cf)) try { if (c instanceof Error) throw c; throw Error("Promise rejected."); } catch (d) {}
                    af(b, df, c)
                })
            } catch (c) { af(this, df, c) }
        }
        var $e = 0,
            bf = 2,
            df = 3;

        function ef() { this.next = this.context = this.f = this.j = this.a = null;
            this.h = !1 }
        ef.prototype.reset = function() { this.context = this.f = this.j = this.a = null;
            this.h = !1 };
        var ff = new Ke(function() { return new ef }, function(a) { a.reset() });

        function gf(a, b, c) { var d = ff.get();
            d.j = a;
            d.f = b;
            d.context = c; return d }

        function G(a) { if (a instanceof Ze) return a; var b = new Ze(qa);
            af(b, bf, a); return b }

        function hf(a) { return new Ze(function(b, c) { c(a) }) }
        Ze.prototype.then = function(a, b, c) { return jf(this, va(a) ? a : null, va(b) ? b : null, c) };
        Ze.prototype.$goog_Thenable = !0;
        l = Ze.prototype;
        l.ec = function(a, b) { a = gf(a, a, b);
            a.h = !0;
            kf(this, a); return this };
        l.ta = function(a, b) { return jf(this, null, a, b) };
        l.cancel = function(a) { this.a == $e && Ue(function() { var b = new cf(a);
                lf(this, b) }, this) };

        function lf(a, b) {
            if (a.a == $e)
                if (a.h) {
                    var c = a.h;
                    if (c.f) {
                        for (var d = 0, e = null, f = null, g = c.f; g && (g.h || (d++, g.a == a && (e = g), !(e && 1 < d))); g = g.next) e ||
                            (f = g);
                        e && (c.a == $e && 1 == d ? lf(c, b) : (f ? (d = f, d.next == c.j && (c.j = d), d.next = d.next.next) : mf(c), nf(c, e, df, b)))
                    }
                    a.h = null
                } else af(a, df, b)
        }

        function kf(a, b) { a.f || a.a != bf && a.a != df || of(a);
            a.j ? a.j.next = b : a.f = b;
            a.j = b }

        function jf(a, b, c, d) { var e = gf(null, null, null);
            e.a = new Ze(function(f, g) { e.j = b ? function(h) { try { var k = b.call(d, h);
                        f(k) } catch (m) { g(m) } } : f;
                e.f = c ? function(h) { try { var k = c.call(d, h);!na(k) && h instanceof cf ? g(h) : f(k) } catch (m) { g(m) } } : g });
            e.a.h = a;
            kf(a, e); return e.a }
        l.gc = function(a) { this.a = $e;
            af(this, bf, a) };
        l.hc =
            function(a) { this.a = $e;
                af(this, df, a) };

        function af(a, b, c) { if (a.a == $e) { a === c && (b = df, c = new TypeError("Promise cannot resolve to itself"));
                a.a = 1;
                a: { var d = c,
                        e = a.gc,
                        f = a.hc; if (d instanceof Ze) { kf(d, gf(e || qa, f || null, a)); var g = !0 } else if (Je(d)) d.then(e, f, a), g = !0;
                    else { if (wa(d)) try { var h = d.then; if (va(h)) { pf(d, h, e, f, a);
                                g = !0; break a } } catch (k) { f.call(a, k);
                            g = !0; break a }
                        g = !1 } }
                g || (a.w = c, a.a = b, a.h = null, of(a), b != df || c instanceof cf || qf(a, c)) } }

        function pf(a, b, c, d, e) {
            function f(k) { h || (h = !0, d.call(e, k)) }

            function g(k) {
                h ||
                    (h = !0, c.call(e, k))
            }
            var h = !1;
            try { b.call(a, g, f) } catch (k) { f(k) }
        }

        function of(a) { a.i || (a.i = !0, Ue(a.Gb, a)) }

        function mf(a) { var b = null;
            a.f && (b = a.f, a.f = b.next, b.next = null);
            a.f || (a.j = null); return b }
        l.Gb = function() { for (var a; a = mf(this);) nf(this, a, this.a, this.w);
            this.i = !1 };

        function nf(a, b, c, d) { if (c == df && b.f && !b.h)
                for (; a && a.s; a = a.h) a.s = !1; if (b.a) b.a.h = null, rf(b, c, d);
            else try { b.h ? b.j.call(b.context) : rf(b, c, d) } catch (e) { sf.call(null, e) }
            Le(ff, b) }

        function rf(a, b, c) {
            b == bf ? a.j.call(a.context, c) : a.f && a.f.call(a.context,
                c)
        }

        function qf(a, b) { a.s = !0;
            Ue(function() { a.s && sf.call(null, b) }) }
        var sf = Re;

        function cf(a) { Da.call(this, a) }
        w(cf, Da);
        cf.prototype.name = "cancel";

        function tf(a, b, c) {
            b || (b = {});
            c = c || window;
            var d = a instanceof Dc ? a : Ic("undefined" != typeof a.href ? a.href : String(a));
            a = b.target || a.target;
            var e = [];
            for (f in b) switch (f) {
                case "width":
                case "height":
                case "top":
                case "left":
                    e.push(f + "=" + b[f]); break;
                case "target":
                case "noopener":
                case "noreferrer":
                    break;
                default:
                    e.push(f + "=" + (b[f] ? 1 : 0)) }
            var f = e.join(",");
            (y("iPhone") && !y("iPod") &&
                !y("iPad") || y("iPad") || y("iPod")) && c.navigator && c.navigator.standalone && a && "_self" != a ? (f = c.document.createElement("A"), d instanceof Dc || d instanceof Dc || (d = "object" == typeof d && d.ma ? d.ka() : String(d), Hc.test(d) || (d = "about:invalid#zClosurez"), d = Jc(d)), f.href = Gc(d), f.setAttribute("target", a), b.noreferrer && f.setAttribute("rel", "noreferrer"), b = document.createEvent("MouseEvent"), b.initMouseEvent("click", !0, !0, c, 1), f.dispatchEvent(b), c = {}) : b.noreferrer ? (c = c.open("", a, f), b = Fc(d), c && (ic && -1 != b.indexOf(";") &&
                (b = "'" + b.replace(/'/g, "%27") + "'"), c.opener = null, b = Pc('<meta name="referrer" content="no-referrer"><meta http-equiv="refresh" content="0; url=' + hb(b) + '">', null), c.document.write(Oc(b)), c.document.close())) : (c = c.open(Fc(d), a, f)) && b.noopener && (c.opener = null);
            return c
        }

        function uf(a) { window.location.assign(Fc(Ic(a))) }

        function vf() {
            try {
                return !!(window.opener && window.opener.location && window.opener.location.assign && window.opener.location.hostname === window.location.hostname && window.opener.location.protocol ===
                    window.location.protocol)
            } catch (a$2) {}
            return !1
        }

        function wf(a) { tf(a, { target: window.cordova && window.cordova.InAppBrowser ? "_system" : "_blank" }, void 0) }

        function xf(a, b) { a = wa(a) && 1 == a.nodeType ? a : document.querySelector(String(a)); if (null == a) throw Error(b || "Cannot find element."); return a }

        function yf() { return window.location.href }

        function zf() { var a = null; return (new Ze(function(b) { "complete" == p.document.readyState ? b() : (a = function() { b() }, pe(window, "load", a)) })).ta(function(b) { we(window, "load", a); throw b; }) }

        function Af() { for (var a = 32, b = []; 0 < a;) b.push("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(62 * Math.random()))), a--; return b.join("") }

        function Bf(a, b, c) { c = void 0 === c ? {} : c; return Object.keys(a).filter(function(d) { return b.includes(d) }).reduce(function(d, e) { d[e] = a[e]; return d }, c) }

        function Cf(a) { var b = Df;
            this.s = [];
            this.O = b;
            this.N = a || null;
            this.j = this.a = !1;
            this.h = void 0;
            this.I = this.l = this.w = !1;
            this.i = 0;
            this.f = null;
            this.C = 0 }
        Cf.prototype.cancel = function(a) {
            if (this.a) this.h instanceof
            Cf && this.h.cancel();
            else { if (this.f) { var b = this.f;
                    delete this.f;
                    a ? b.cancel(a) : (b.C--, 0 >= b.C && b.cancel()) }
                this.O ? this.O.call(this.N, this) : this.I = !0;
                this.a || (a = new Ef(this), Ff(this), Gf(this, !1, a)) }
        };
        Cf.prototype.L = function(a, b) { this.w = !1;
            Gf(this, a, b) };

        function Gf(a, b, c) { a.a = !0;
            a.h = c;
            a.j = !b;
            Hf(a) }

        function Ff(a) { if (a.a) { if (!a.I) throw new If(a);
                a.I = !1 } }

        function Jf(a, b, c) { a.s.push([b, c, void 0]);
            a.a && Hf(a) }
        Cf.prototype.then = function(a, b, c) {
            var d, e, f = new Ze(function(g, h) { d = g;
                e = h });
            Jf(this, d, function(g) {
                g instanceof
                Ef ? f.cancel() : e(g)
            });
            return f.then(a, b, c)
        };
        Cf.prototype.$goog_Thenable = !0;

        function Kf(a) { return Na(a.s, function(b) { return va(b[1]) }) }

        function Hf(a) {
            if (a.i && a.a && Kf(a)) { var b = a.i,
                    c = Lf[b];
                c && (p.clearTimeout(c.a), delete Lf[b]);
                a.i = 0 }
            a.f && (a.f.C--, delete a.f);
            b = a.h;
            for (var d = c = !1; a.s.length && !a.w;) {
                var e = a.s.shift(),
                    f = e[0],
                    g = e[1];
                e = e[2];
                if (f = a.j ? g : f) try {
                    var h = f.call(e || a.N, b);
                    na(h) && (a.j = a.j && (h == b || h instanceof Error), a.h = b = h);
                    if (Je(b) || "function" === typeof p.Promise && b instanceof p.Promise) d = !0, a.w = !0
                } catch (k) { b = k, a.j = !0, Kf(a) || (c = !0) }
            }
            a.h = b;
            d && (h = t(a.L, a, !0), d = t(a.L, a, !1), b instanceof Cf ? (Jf(b, h, d), b.l = !0) : b.then(h, d));
            c && (b = new Mf(b), Lf[b.a] = b, a.i = b.a)
        }

        function If() { Da.call(this) }
        w(If, Da);
        If.prototype.message = "Deferred has already fired";
        If.prototype.name = "AlreadyCalledError";

        function Ef() { Da.call(this) }
        w(Ef, Da);
        Ef.prototype.message = "Deferred was canceled";
        Ef.prototype.name = "CanceledError";

        function Mf(a) { this.a = p.setTimeout(t(this.h, this), 0);
            this.f = a }
        Mf.prototype.h = function() {
            delete Lf[this.a];
            throw this.f;
        };
        var Lf = {};

        function Nf(a) {
            var b = {},
                c = b.document || document,
                d = Bc(a).toString(),
                e = document.createElement("SCRIPT"),
                f = { tb: e, ub: void 0 },
                g = new Cf(f),
                h = null,
                k = null != b.timeout ? b.timeout : 5E3;
            0 < k && (h = window.setTimeout(function() { Of(e, !0); var m = new Pf(Qf, "Timeout reached for loading script " + d);
                Ff(g);
                Gf(g, !1, m) }, k), f.ub = h);
            e.onload = e.onreadystatechange = function() { e.readyState && "loaded" != e.readyState && "complete" != e.readyState || (Of(e, b.wc || !1, h), Ff(g), Gf(g, !0, null)) };
            e.onerror = function() {
                Of(e, !0,
                    h);
                var m = new Pf(Rf, "Error while loading script " + d);
                Ff(g);
                Gf(g, !1, m)
            };
            f = b.attributes || {};
            lb(f, { type: "text/javascript", charset: "UTF-8" });
            ad(e, f);
            Sc(e, a);
            Sf(c).appendChild(e);
            return g
        }

        function Sf(a) { var b = (a || document).getElementsByTagName("HEAD"); return b && 0 != b.length ? b[0] : a.documentElement }

        function Df() { if (this && this.tb) { var a = this.tb;
                a && "SCRIPT" == a.tagName && Of(a, !0, this.ub) } }

        function Of(a, b, c) {
            null != c && p.clearTimeout(c);
            a.onload = qa;
            a.onerror = qa;
            a.onreadystatechange = qa;
            b && window.setTimeout(function() { dd(a) },
                0)
        }
        var Rf = 0,
            Qf = 1;

        function Pf(a, b) { var c = "Jsloader error (code #" + a + ")";
            b && (c += ": " + b);
            Da.call(this, c);
            this.code = a }
        w(Pf, Da);

        function Tf(a) { this.a = a || p.googleyolo;
            this.f = null;
            this.h = !1 }
        Tf.prototype.cancel = function() { this.a && this.h && (this.f = this.a.cancelLastOperation().catch(function() {})) };

        function Uf(a, b, c) {
            if (a.a && b) {
                var d = function() {
                    a.h = !0;
                    var e = Promise.resolve(null);
                    c || (e = a.a.retrieve(b).catch(function(f) { if (f.type === Vf || f.type === Wf) throw f; return null }));
                    return e.then(function(f) { return f ? f : a.a.hint(b) }).catch(function(f) {
                        if (f.type ===
                            Vf) a.f = Promise.resolve();
                        else if (f.type === Wf) return a.cancel(), Uf(a, b, c);
                        return null
                    })
                };
                return a.f ? a.f.then(d) : d()
            }
            if (b) return d = Xf.Ya().load().then(function() { a.a = p.googleyolo; return Uf(a, b, c) }).ta(function() { return null }), Promise.resolve(d);
            if ("undefined" !== typeof Promise) return Promise.resolve(null);
            throw Error("One-Tap sign in not supported in the current browser!");
        }
        ra(Tf);
        var Yf = new vc(wc, "https://smartlock.google.com/client"),
            Wf = "illegalConcurrentRequest",
            Vf = "userCanceled";

        function Xf() {
            this.a =
                null
        }
        Xf.prototype.load = function() { var a = this; if (this.a) return this.a; var b = Cc(yc(Yf)); return p.googleyolo ? G() : this.a = zf().then(function() { if (!p.googleyolo) return new Ze(function(c, d) { var e = setTimeout(function() { a.a = null;
                        d(Error("Network error!")) }, 1E4);
                    p.onGoogleYoloLoad = function() { clearTimeout(e);
                        c() };
                    G(Nf(b)).ta(function(f) { clearTimeout(e);
                        a.a = null;
                        d(f) }) }) }) };
        ra(Xf);

        function Zf(a, b) { this.a = a;
            this.f = b || function(c) { throw c; } }
        Zf.prototype.confirm = function(a) { return G(this.a.confirm(a)).ta(this.f) };

        function $f(a, b, c) { this.reset(a, b, c, void 0, void 0) }
        $f.prototype.a = null;
        var ag = 0;
        $f.prototype.reset = function(a, b, c, d, e) { "number" == typeof e || ag++;
            this.h = d || Ca();
            this.j = a;
            this.s = b;
            this.f = c;
            delete this.a };

        function bg(a) { this.s = a;
            this.a = this.h = this.j = this.f = null }

        function cg(a, b) { this.name = a;
            this.value = b }
        cg.prototype.toString = function() { return this.name };
        var dg = new cg("SEVERE", 1E3),
            eg = new cg("WARNING", 900),
            fg = new cg("CONFIG", 700);

        function gg(a) {
            if (a.j) return a.j;
            if (a.f) return gg(a.f);
            Ga("Root logger has no level set.");
            return null
        }
        bg.prototype.log = function(a, b, c) { if (a.value >= gg(this).value)
                for (va(b) && (b = b()), a = new $f(a, String(b), this.s), c && (a.a = c), c = this; c;) { var d = c,
                        e = a; if (d.a)
                        for (var f = 0; b = d.a[f]; f++) b(e);
                    c = c.f } };
        var hg = {},
            ig = null;

        function jg() { ig || (ig = new bg(""), hg[""] = ig, ig.j = fg) }

        function kg(a) { jg(); var b; if (!(b = hg[a])) { b = new bg(a); var c = a.lastIndexOf("."),
                    d = a.substr(c + 1);
                c = kg(a.substr(0, c));
                c.h || (c.h = {});
                c.h[d] = b;
                b.f = c;
                hg[a] = b } return b }

        function lg() { this.a = Ca() }
        var mg = null;
        lg.prototype.set = function(a) {
            this.a =
                a
        };
        lg.prototype.reset = function() { this.set(Ca()) };
        lg.prototype.get = function() { return this.a };

        function ng(a) { this.j = a || "";
            mg || (mg = new lg);
            this.s = mg }
        ng.prototype.a = !0;
        ng.prototype.f = !0;
        ng.prototype.h = !1;

        function og(a) { return 10 > a ? "0" + a : String(a) }

        function pg(a, b) { a = (a.h - b) / 1E3;
            b = a.toFixed(3); var c = 0; if (1 > a) c = 2;
            else
                for (; 100 > a;) c++, a *= 10; for (; 0 < c--;) b = " " + b; return b }

        function qg(a) { ng.call(this, a) }
        w(qg, ng);

        function rg(a, b) {
            var c = [];
            c.push(a.j, " ");
            if (a.f) {
                var d = new Date(b.h);
                c.push("[", og(d.getFullYear() -
                    2E3) + og(d.getMonth() + 1) + og(d.getDate()) + " " + og(d.getHours()) + ":" + og(d.getMinutes()) + ":" + og(d.getSeconds()) + "." + og(Math.floor(d.getMilliseconds() / 10)), "] ")
            }
            c.push("[", pg(b, a.s.get()), "s] ");
            c.push("[", b.f, "] ");
            c.push(b.s);
            a.h && (b = b.a) && c.push("\n", b instanceof Error ? b.message : b.toString());
            a.a && c.push("\n");
            return c.join("")
        }

        function sg() { this.s = t(this.h, this);
            this.a = new qg;
            this.a.f = !1;
            this.a.h = !1;
            this.f = this.a.a = !1;
            this.j = {} }
        sg.prototype.h = function(a) {
            function b(f) {
                if (f) {
                    if (f.value >= dg.value) return "error";
                    if (f.value >= eg.value) return "warn";
                    if (f.value >= fg.value) return "log"
                }
                return "debug"
            }
            if (!this.j[a.f]) { var c = rg(this.a, a),
                    d = tg; if (d) { var e = b(a.j);
                    ug(d, e, c, a.a) } }
        };
        var tg = p.console;

        function ug(a, b, c, d) { if (a[b]) a[b](c, d || "");
            else a.log(c, d || "") }

        function vg(a, b) { var c = wg;
            c && c.log(dg, a, b) }
        var wg;
        wg = kg("firebaseui");
        var xg = new sg;
        if (1 != xg.f) { var yg;
            jg();
            yg = ig; var zg = xg.s;
            yg.a || (yg.a = []);
            yg.a.push(zg);
            xg.f = !0 }

        function Ag(a) { var b = wg;
            b && b.log(eg, a, void 0) }

        function Bg(a, b, c, d) {
            this.a = a;
            this.h = b || null;
            this.j = c ||
                null;
            this.f = d || null
        }
        Bg.prototype.aa = function() { return { email: this.a, displayName: this.h, photoUrl: this.j, providerId: this.f } };

        function Cg(a) { return a.email ? new Bg(a.email, a.displayName, a.photoUrl, a.providerId) : null }

        function Dg() { this.a = ("undefined" == typeof document ? null : document) || { cookie: "" } }
        l = Dg.prototype;
        l.set = function(a, b, c, d, e, f) {
            if (/[;=\s]/.test(a)) throw Error('Invalid cookie name "' + a + '"');
            if (/[;\r\n]/.test(b)) throw Error('Invalid cookie value "' + b + '"');
            na(c) || (c = -1);
            e = e ? ";domain=" + e : "";
            d = d ? ";path=" +
                d : "";
            f = f ? ";secure" : "";
            c = 0 > c ? "" : 0 == c ? ";expires=" + (new Date(1970, 1, 1)).toUTCString() : ";expires=" + (new Date(Ca() + 1E3 * c)).toUTCString();
            this.a.cookie = a + "=" + b + e + d + c + f
        };
        l.get = function(a, b) { for (var c = a + "=", d = (this.a.cookie || "").split(";"), e = 0, f; e < d.length; e++) { f = Za(d[e]); if (0 == f.lastIndexOf(c, 0)) return f.substr(c.length); if (f == a) return "" } return b };
        l.ja = function() { return Eg(this).keys };
        l.la = function() { return Eg(this).values };
        l.clear = function() {
            for (var a = Eg(this).keys, b = a.length - 1; 0 <= b; b--) {
                var c = a[b];
                this.get(c);
                this.set(c, "", 0, void 0, void 0)
            }
        };

        function Eg(a) { a = (a.a.cookie || "").split(";"); for (var b = [], c = [], d, e, f = 0; f < a.length; f++) e = Za(a[f]), d = e.indexOf("="), -1 == d ? (b.push(""), c.push(e)) : (b.push(e.substring(0, d)), c.push(e.substring(d + 1))); return { keys: b, values: c } }
        var Fg = new Dg;

        function Gg() {}

        function Hg(a, b, c, d) { this.h = "undefined" !== typeof a && null !== a ? a : -1;
            this.f = b || null;
            this.a = c || null;
            this.j = !!d }
        n(Hg, Gg);
        Hg.prototype.set = function(a, b) { Fg.set(a, b, this.h, this.f, this.a, this.j) };
        Hg.prototype.get = function(a) {
            return Fg.get(a) ||
                null
        };
        Hg.prototype.ra = function(a) { var b = this.f,
                c = this.a;
            Fg.get(a);
            Fg.set(a, "", 0, b, c) };

        function Ig(a, b) { this.f = a;
            this.a = b || null }
        Ig.prototype.aa = function() { return { email: this.f, credential: this.a && this.a.toJSON() } };

        function Jg(a) { if (a && a.email) { var b = a.credential && firebase.auth.AuthCredential.fromJSON(a.credential); return new Ig(a.email, b) } return null }

        function Kg(a) { this.a = a || null }
        Kg.prototype.aa = function() { return { tenantId: this.a } };

        function Lg(a) {
            for (var b = [], c = 0, d = 0; d < a.length; d++) {
                var e = a.charCodeAt(d);
                255 < e && (b[c++] = e & 255, e >>= 8);
                b[c++] = e
            }
            return b
        }

        function Ng(a) { return Ma(a, function(b) { b = b.toString(16); return 1 < b.length ? b : "0" + b }).join("") }

        function Og(a) {
            this.i = a;
            this.f = this.i.length / 4;
            this.j = this.f + 6;
            this.h = [
                [],
                [],
                [],
                []
            ];
            this.s = [
                [],
                [],
                [],
                []
            ];
            this.a = Array(Pg * (this.j + 1));
            for (a = 0; a < this.f; a++) this.a[a] = [this.i[4 * a], this.i[4 * a + 1], this.i[4 * a + 2], this.i[4 * a + 3]];
            var b = Array(4);
            for (a = this.f; a < Pg * (this.j + 1); a++) {
                b[0] = this.a[a - 1][0];
                b[1] = this.a[a - 1][1];
                b[2] = this.a[a - 1][2];
                b[3] = this.a[a - 1][3];
                if (0 == a % this.f) {
                    var c =
                        b,
                        d = c[0];
                    c[0] = c[1];
                    c[1] = c[2];
                    c[2] = c[3];
                    c[3] = d;
                    Qg(b);
                    b[0] ^= Rg[a / this.f][0];
                    b[1] ^= Rg[a / this.f][1];
                    b[2] ^= Rg[a / this.f][2];
                    b[3] ^= Rg[a / this.f][3]
                } else 6 < this.f && 4 == a % this.f && Qg(b);
                this.a[a] = Array(4);
                this.a[a][0] = this.a[a - this.f][0] ^ b[0];
                this.a[a][1] = this.a[a - this.f][1] ^ b[1];
                this.a[a][2] = this.a[a - this.f][2] ^ b[2];
                this.a[a][3] = this.a[a - this.f][3] ^ b[3]
            }
        }
        Og.prototype.w = 16;
        var Pg = Og.prototype.w / 4;

        function Sg(a, b) { for (var c, d = 0; d < Pg; d++)
                for (var e = 0; 4 > e; e++) c = 4 * e + d, c = b[c], a.h[d][e] = c }

        function Tg(a) {
            for (var b = [],
                    c = 0; c < Pg; c++)
                for (var d = 0; 4 > d; d++) b[4 * d + c] = a.h[c][d];
            return b
        }

        function Ug(a, b) { for (var c = 0; 4 > c; c++)
                for (var d = 0; 4 > d; d++) a.h[c][d] ^= a.a[4 * b + d][c] }

        function Vg(a, b) { for (var c = 0; 4 > c; c++)
                for (var d = 0; 4 > d; d++) a.h[c][d] = b[a.h[c][d]] }

        function Wg(a) { for (var b = 1; 4 > b; b++)
                for (var c = 0; 4 > c; c++) a.s[b][c] = a.h[b][c]; for (b = 1; 4 > b; b++)
                for (c = 0; 4 > c; c++) a.h[b][c] = a.s[b][(c + b) % Pg] }

        function Xg(a) { for (var b = 1; 4 > b; b++)
                for (var c = 0; 4 > c; c++) a.s[b][(c + b) % Pg] = a.h[b][c]; for (b = 1; 4 > b; b++)
                for (c = 0; 4 > c; c++) a.h[b][c] = a.s[b][c] }

        function Qg(a) {
            a[0] =
                Yg[a[0]];
            a[1] = Yg[a[1]];
            a[2] = Yg[a[2]];
            a[3] = Yg[a[3]]
        }
        var Yg = [99, 124, 119, 123, 242, 107, 111, 197, 48, 1, 103, 43, 254, 215, 171, 118, 202, 130, 201, 125, 250, 89, 71, 240, 173, 212, 162, 175, 156, 164, 114, 192, 183, 253, 147, 38, 54, 63, 247, 204, 52, 165, 229, 241, 113, 216, 49, 21, 4, 199, 35, 195, 24, 150, 5, 154, 7, 18, 128, 226, 235, 39, 178, 117, 9, 131, 44, 26, 27, 110, 90, 160, 82, 59, 214, 179, 41, 227, 47, 132, 83, 209, 0, 237, 32, 252, 177, 91, 106, 203, 190, 57, 74, 76, 88, 207, 208, 239, 170, 251, 67, 77, 51, 133, 69, 249, 2, 127, 80, 60, 159, 168, 81, 163, 64, 143, 146, 157, 56, 245, 188, 182, 218, 33,
                16, 255, 243, 210, 205, 12, 19, 236, 95, 151, 68, 23, 196, 167, 126, 61, 100, 93, 25, 115, 96, 129, 79, 220, 34, 42, 144, 136, 70, 238, 184, 20, 222, 94, 11, 219, 224, 50, 58, 10, 73, 6, 36, 92, 194, 211, 172, 98, 145, 149, 228, 121, 231, 200, 55, 109, 141, 213, 78, 169, 108, 86, 244, 234, 101, 122, 174, 8, 186, 120, 37, 46, 28, 166, 180, 198, 232, 221, 116, 31, 75, 189, 139, 138, 112, 62, 181, 102, 72, 3, 246, 14, 97, 53, 87, 185, 134, 193, 29, 158, 225, 248, 152, 17, 105, 217, 142, 148, 155, 30, 135, 233, 206, 85, 40, 223, 140, 161, 137, 13, 191, 230, 66, 104, 65, 153, 45, 15, 176, 84, 187, 22
            ],
            Zg = [82, 9, 106, 213, 48, 54, 165, 56,
                191, 64, 163, 158, 129, 243, 215, 251, 124, 227, 57, 130, 155, 47, 255, 135, 52, 142, 67, 68, 196, 222, 233, 203, 84, 123, 148, 50, 166, 194, 35, 61, 238, 76, 149, 11, 66, 250, 195, 78, 8, 46, 161, 102, 40, 217, 36, 178, 118, 91, 162, 73, 109, 139, 209, 37, 114, 248, 246, 100, 134, 104, 152, 22, 212, 164, 92, 204, 93, 101, 182, 146, 108, 112, 72, 80, 253, 237, 185, 218, 94, 21, 70, 87, 167, 141, 157, 132, 144, 216, 171, 0, 140, 188, 211, 10, 247, 228, 88, 5, 184, 179, 69, 6, 208, 44, 30, 143, 202, 63, 15, 2, 193, 175, 189, 3, 1, 19, 138, 107, 58, 145, 17, 65, 79, 103, 220, 234, 151, 242, 207, 206, 240, 180, 230, 115, 150, 172, 116,
                34, 231, 173, 53, 133, 226, 249, 55, 232, 28, 117, 223, 110, 71, 241, 26, 113, 29, 41, 197, 137, 111, 183, 98, 14, 170, 24, 190, 27, 252, 86, 62, 75, 198, 210, 121, 32, 154, 219, 192, 254, 120, 205, 90, 244, 31, 221, 168, 51, 136, 7, 199, 49, 177, 18, 16, 89, 39, 128, 236, 95, 96, 81, 127, 169, 25, 181, 74, 13, 45, 229, 122, 159, 147, 201, 156, 239, 160, 224, 59, 77, 174, 42, 245, 176, 200, 235, 187, 60, 131, 83, 153, 97, 23, 43, 4, 126, 186, 119, 214, 38, 225, 105, 20, 99, 85, 33, 12, 125
            ],
            Rg = [
                [0, 0, 0, 0],
                [1, 0, 0, 0],
                [2, 0, 0, 0],
                [4, 0, 0, 0],
                [8, 0, 0, 0],
                [16, 0, 0, 0],
                [32, 0, 0, 0],
                [64, 0, 0, 0],
                [128, 0, 0, 0],
                [27, 0, 0, 0],
                [54,
                    0, 0, 0
                ]
            ],
            $g = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222, 224, 226, 228, 230, 232, 234, 236, 238, 240, 242, 244, 246, 248, 250, 252, 254, 27, 25, 31, 29, 19, 17, 23, 21, 11, 9, 15,
                13, 3, 1, 7, 5, 59, 57, 63, 61, 51, 49, 55, 53, 43, 41, 47, 45, 35, 33, 39, 37, 91, 89, 95, 93, 83, 81, 87, 85, 75, 73, 79, 77, 67, 65, 71, 69, 123, 121, 127, 125, 115, 113, 119, 117, 107, 105, 111, 109, 99, 97, 103, 101, 155, 153, 159, 157, 147, 145, 151, 149, 139, 137, 143, 141, 131, 129, 135, 133, 187, 185, 191, 189, 179, 177, 183, 181, 171, 169, 175, 173, 163, 161, 167, 165, 219, 217, 223, 221, 211, 209, 215, 213, 203, 201, 207, 205, 195, 193, 199, 197, 251, 249, 255, 253, 243, 241, 247, 245, 235, 233, 239, 237, 227, 225, 231, 229
            ],
            ah = [0, 3, 6, 5, 12, 15, 10, 9, 24, 27, 30, 29, 20, 23, 18, 17, 48, 51, 54, 53, 60, 63, 58, 57, 40, 43,
                46, 45, 36, 39, 34, 33, 96, 99, 102, 101, 108, 111, 106, 105, 120, 123, 126, 125, 116, 119, 114, 113, 80, 83, 86, 85, 92, 95, 90, 89, 72, 75, 78, 77, 68, 71, 66, 65, 192, 195, 198, 197, 204, 207, 202, 201, 216, 219, 222, 221, 212, 215, 210, 209, 240, 243, 246, 245, 252, 255, 250, 249, 232, 235, 238, 237, 228, 231, 226, 225, 160, 163, 166, 165, 172, 175, 170, 169, 184, 187, 190, 189, 180, 183, 178, 177, 144, 147, 150, 149, 156, 159, 154, 153, 136, 139, 142, 141, 132, 135, 130, 129, 155, 152, 157, 158, 151, 148, 145, 146, 131, 128, 133, 134, 143, 140, 137, 138, 171, 168, 173, 174, 167, 164, 161, 162, 179, 176, 181, 182, 191, 188,
                185, 186, 251, 248, 253, 254, 247, 244, 241, 242, 227, 224, 229, 230, 239, 236, 233, 234, 203, 200, 205, 206, 199, 196, 193, 194, 211, 208, 213, 214, 223, 220, 217, 218, 91, 88, 93, 94, 87, 84, 81, 82, 67, 64, 69, 70, 79, 76, 73, 74, 107, 104, 109, 110, 103, 100, 97, 98, 115, 112, 117, 118, 127, 124, 121, 122, 59, 56, 61, 62, 55, 52, 49, 50, 35, 32, 37, 38, 47, 44, 41, 42, 11, 8, 13, 14, 7, 4, 1, 2, 19, 16, 21, 22, 31, 28, 25, 26
            ],
            bh = [0, 9, 18, 27, 36, 45, 54, 63, 72, 65, 90, 83, 108, 101, 126, 119, 144, 153, 130, 139, 180, 189, 166, 175, 216, 209, 202, 195, 252, 245, 238, 231, 59, 50, 41, 32, 31, 22, 13, 4, 115, 122, 97, 104, 87, 94, 69,
                76, 171, 162, 185, 176, 143, 134, 157, 148, 227, 234, 241, 248, 199, 206, 213, 220, 118, 127, 100, 109, 82, 91, 64, 73, 62, 55, 44, 37, 26, 19, 8, 1, 230, 239, 244, 253, 194, 203, 208, 217, 174, 167, 188, 181, 138, 131, 152, 145, 77, 68, 95, 86, 105, 96, 123, 114, 5, 12, 23, 30, 33, 40, 51, 58, 221, 212, 207, 198, 249, 240, 235, 226, 149, 156, 135, 142, 177, 184, 163, 170, 236, 229, 254, 247, 200, 193, 218, 211, 164, 173, 182, 191, 128, 137, 146, 155, 124, 117, 110, 103, 88, 81, 74, 67, 52, 61, 38, 47, 16, 25, 2, 11, 215, 222, 197, 204, 243, 250, 225, 232, 159, 150, 141, 132, 187, 178, 169, 160, 71, 78, 85, 92, 99, 106, 113, 120,
                15, 6, 29, 20, 43, 34, 57, 48, 154, 147, 136, 129, 190, 183, 172, 165, 210, 219, 192, 201, 246, 255, 228, 237, 10, 3, 24, 17, 46, 39, 60, 53, 66, 75, 80, 89, 102, 111, 116, 125, 161, 168, 179, 186, 133, 140, 151, 158, 233, 224, 251, 242, 205, 196, 223, 214, 49, 56, 35, 42, 21, 28, 7, 14, 121, 112, 107, 98, 93, 84, 79, 70
            ],
            ch = [0, 11, 22, 29, 44, 39, 58, 49, 88, 83, 78, 69, 116, 127, 98, 105, 176, 187, 166, 173, 156, 151, 138, 129, 232, 227, 254, 245, 196, 207, 210, 217, 123, 112, 109, 102, 87, 92, 65, 74, 35, 40, 53, 62, 15, 4, 25, 18, 203, 192, 221, 214, 231, 236, 241, 250, 147, 152, 133, 142, 191, 180, 169, 162, 246, 253, 224, 235,
                218, 209, 204, 199, 174, 165, 184, 179, 130, 137, 148, 159, 70, 77, 80, 91, 106, 97, 124, 119, 30, 21, 8, 3, 50, 57, 36, 47, 141, 134, 155, 144, 161, 170, 183, 188, 213, 222, 195, 200, 249, 242, 239, 228, 61, 54, 43, 32, 17, 26, 7, 12, 101, 110, 115, 120, 73, 66, 95, 84, 247, 252, 225, 234, 219, 208, 205, 198, 175, 164, 185, 178, 131, 136, 149, 158, 71, 76, 81, 90, 107, 96, 125, 118, 31, 20, 9, 2, 51, 56, 37, 46, 140, 135, 154, 145, 160, 171, 182, 189, 212, 223, 194, 201, 248, 243, 238, 229, 60, 55, 42, 33, 16, 27, 6, 13, 100, 111, 114, 121, 72, 67, 94, 85, 1, 10, 23, 28, 45, 38, 59, 48, 89, 82, 79, 68, 117, 126, 99, 104, 177, 186, 167,
                172, 157, 150, 139, 128, 233, 226, 255, 244, 197, 206, 211, 216, 122, 113, 108, 103, 86, 93, 64, 75, 34, 41, 52, 63, 14, 5, 24, 19, 202, 193, 220, 215, 230, 237, 240, 251, 146, 153, 132, 143, 190, 181, 168, 163
            ],
            dh = [0, 13, 26, 23, 52, 57, 46, 35, 104, 101, 114, 127, 92, 81, 70, 75, 208, 221, 202, 199, 228, 233, 254, 243, 184, 181, 162, 175, 140, 129, 150, 155, 187, 182, 161, 172, 143, 130, 149, 152, 211, 222, 201, 196, 231, 234, 253, 240, 107, 102, 113, 124, 95, 82, 69, 72, 3, 14, 25, 20, 55, 58, 45, 32, 109, 96, 119, 122, 89, 84, 67, 78, 5, 8, 31, 18, 49, 60, 43, 38, 189, 176, 167, 170, 137, 132, 147, 158, 213, 216, 207, 194, 225,
                236, 251, 246, 214, 219, 204, 193, 226, 239, 248, 245, 190, 179, 164, 169, 138, 135, 144, 157, 6, 11, 28, 17, 50, 63, 40, 37, 110, 99, 116, 121, 90, 87, 64, 77, 218, 215, 192, 205, 238, 227, 244, 249, 178, 191, 168, 165, 134, 139, 156, 145, 10, 7, 16, 29, 62, 51, 36, 41, 98, 111, 120, 117, 86, 91, 76, 65, 97, 108, 123, 118, 85, 88, 79, 66, 9, 4, 19, 30, 61, 48, 39, 42, 177, 188, 171, 166, 133, 136, 159, 146, 217, 212, 195, 206, 237, 224, 247, 250, 183, 186, 173, 160, 131, 142, 153, 148, 223, 210, 197, 200, 235, 230, 241, 252, 103, 106, 125, 112, 83, 94, 73, 68, 15, 2, 21, 24, 59, 54, 33, 44, 12, 1, 22, 27, 56, 53, 34, 47, 100, 105, 126,
                115, 80, 93, 74, 71, 220, 209, 198, 203, 232, 229, 242, 255, 180, 185, 174, 163, 128, 141, 154, 151
            ],
            eh = [0, 14, 28, 18, 56, 54, 36, 42, 112, 126, 108, 98, 72, 70, 84, 90, 224, 238, 252, 242, 216, 214, 196, 202, 144, 158, 140, 130, 168, 166, 180, 186, 219, 213, 199, 201, 227, 237, 255, 241, 171, 165, 183, 185, 147, 157, 143, 129, 59, 53, 39, 41, 3, 13, 31, 17, 75, 69, 87, 89, 115, 125, 111, 97, 173, 163, 177, 191, 149, 155, 137, 135, 221, 211, 193, 207, 229, 235, 249, 247, 77, 67, 81, 95, 117, 123, 105, 103, 61, 51, 33, 47, 5, 11, 25, 23, 118, 120, 106, 100, 78, 64, 82, 92, 6, 8, 26, 20, 62, 48, 34, 44, 150, 152, 138, 132, 174, 160,
                178, 188, 230, 232, 250, 244, 222, 208, 194, 204, 65, 79, 93, 83, 121, 119, 101, 107, 49, 63, 45, 35, 9, 7, 21, 27, 161, 175, 189, 179, 153, 151, 133, 139, 209, 223, 205, 195, 233, 231, 245, 251, 154, 148, 134, 136, 162, 172, 190, 176, 234, 228, 246, 248, 210, 220, 206, 192, 122, 116, 102, 104, 66, 76, 94, 80, 10, 4, 22, 24, 50, 60, 46, 32, 236, 226, 240, 254, 212, 218, 200, 198, 156, 146, 128, 142, 164, 170, 184, 182, 12, 2, 16, 30, 52, 58, 40, 38, 124, 114, 96, 110, 68, 74, 88, 86, 55, 57, 43, 37, 15, 1, 19, 29, 71, 73, 91, 85, 127, 113, 99, 109, 215, 217, 203, 197, 239, 225, 243, 253, 167, 169, 187, 181, 159, 145, 131, 141
            ];

        function fh(a,
            b) { a = new Og(gh(a));
            b = Lg(b); for (var c = Xa(b, 0, 16), d = "", e; c.length;) { e = 16 - c.length; for (var f = 0; f < e; f++) c.push(0);
                e = a;
                Sg(e, c);
                Ug(e, 0); for (c = 1; c < e.j; ++c) { Vg(e, Yg);
                    Wg(e);
                    f = e.h; for (var g = e.s[0], h = 0; 4 > h; h++) g[0] = f[0][h], g[1] = f[1][h], g[2] = f[2][h], g[3] = f[3][h], f[0][h] = $g[g[0]] ^ ah[g[1]] ^ g[2] ^ g[3], f[1][h] = g[0] ^ $g[g[1]] ^ ah[g[2]] ^ g[3], f[2][h] = g[0] ^ g[1] ^ $g[g[2]] ^ ah[g[3]], f[3][h] = ah[g[0]] ^ g[1] ^ g[2] ^ $g[g[3]];
                    Ug(e, c) }
                Vg(e, Yg);
                Wg(e);
                Ug(e, e.j);
                d += Ng(Tg(e));
                c = Xa(b, 0, 16) } return d }

        function hh(a, b) {
            a = new Og(gh(a));
            for (var c = [], d = 0; d < b.length; d += 2) c.push(parseInt(b.substring(d, d + 2), 16));
            var e = Xa(c, 0, 16);
            for (b = ""; e.length;) {
                d = a;
                Sg(d, e);
                Ug(d, d.j);
                for (e = 1; e < d.j; ++e) { Xg(d);
                    Vg(d, Zg);
                    Ug(d, d.j - e); for (var f = d.h, g = d.s[0], h = 0; 4 > h; h++) g[0] = f[0][h], g[1] = f[1][h], g[2] = f[2][h], g[3] = f[3][h], f[0][h] = eh[g[0]] ^ ch[g[1]] ^ dh[g[2]] ^ bh[g[3]], f[1][h] = bh[g[0]] ^ eh[g[1]] ^ ch[g[2]] ^ dh[g[3]], f[2][h] = dh[g[0]] ^ bh[g[1]] ^ eh[g[2]] ^ ch[g[3]], f[3][h] = ch[g[0]] ^ dh[g[1]] ^ bh[g[2]] ^ eh[g[3]] }
                Xg(d);
                Vg(d, Zg);
                Ug(d, 0);
                d = Tg(d);
                if (8192 >= d.length) d = String.fromCharCode.apply(null,
                    d);
                else { e = ""; for (f = 0; f < d.length; f += 8192) e += String.fromCharCode.apply(null, Ya(d, f, f + 8192));
                    d = e }
                b += d;
                e = Xa(c, 0, 16)
            }
            return b.replace(/(\x00)+$/, "")
        }

        function gh(a) { a = Lg(a.substring(0, 32)); for (var b = 32 - a.length, c = 0; c < b; c++) a.push(0); return a }

        function ih(a) { var b = [];
            jh(new kh, a, b); return b.join("") }

        function kh() {}

        function jh(a, b, c) {
            if (null == b) c.push("null");
            else {
                if ("object" == typeof b) {
                    if (ta(b)) { var d = b;
                        b = d.length;
                        c.push("["); for (var e = "", f = 0; f < b; f++) c.push(e), jh(a, d[f], c), e = ",";
                        c.push("]"); return }
                    if (b instanceof String || b instanceof Number || b instanceof Boolean) b = b.valueOf();
                    else { c.push("{");
                        e = ""; for (d in b) Object.prototype.hasOwnProperty.call(b, d) && (f = b[d], "function" != typeof f && (c.push(e), lh(d, c), c.push(":"), jh(a, f, c), e = ","));
                        c.push("}"); return }
                }
                switch (typeof b) {
                    case "string":
                        lh(b, c); break;
                    case "number":
                        c.push(isFinite(b) && !isNaN(b) ? String(b) : "null"); break;
                    case "boolean":
                        c.push(String(b)); break;
                    case "function":
                        c.push("null"); break;
                    default:
                        throw Error("Unknown type: " + typeof b); }
            }
        }
        var mh = {
                '"': '\\"',
                "\\": "\\\\",
                "/": "\\/",
                "\b": "\\b",
                "\f": "\\f",
                "\n": "\\n",
                "\r": "\\r",
                "\t": "\\t",
                "\x0B": "\\u000b"
            },
            nh = /\uffff/.test("\uffff") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;

        function lh(a, b) { b.push('"', a.replace(nh, function(c) { var d = mh[c];
                d || (d = "\\u" + (c.charCodeAt(0) | 65536).toString(16).substr(1), mh[c] = d); return d }), '"') }

        function oh(a) { this.a = a }
        oh.prototype.set = function(a, b) { na(b) ? this.a.set(a, ih(b)) : this.a.ra(a) };
        oh.prototype.get = function(a) {
            try { var b = this.a.get(a) } catch (c) { return }
            if (null !== b) try { return JSON.parse(b) } catch (c$3) {
                throw "Storage: Invalid value was encountered";
            }
        };

        function ph() {}
        w(ph, Gg);
        ph.prototype.clear = function() { var a = qb(this.ha(!0)),
                b = this;
            Ja(a, function(c) { b.ra(c) }) };

        function qh(a) { this.a = a }
        w(qh, ph);

        function rh(a) { if (!a.a) return !1; try { return a.a.setItem("__sak", "1"), a.a.removeItem("__sak"), !0 } catch (b) { return !1 } }
        l = qh.prototype;
        l.set = function(a, b) { try { this.a.setItem(a, b) } catch (c) { if (0 == this.a.length) throw "Storage mechanism: Storage disabled"; throw "Storage mechanism: Quota exceeded"; } };
        l.get = function(a) {
            a = this.a.getItem(a);
            if (!r(a) && null !== a) throw "Storage mechanism: Invalid value was encountered";
            return a
        };
        l.ra = function(a) { this.a.removeItem(a) };
        l.ha = function(a) { var b = 0,
                c = this.a,
                d = new nb;
            d.next = function() { if (b >= c.length) throw mb; var e = c.key(b++); if (a) return e;
                e = c.getItem(e); if (!r(e)) throw "Storage mechanism: Invalid value was encountered"; return e }; return d };
        l.clear = function() { this.a.clear() };
        l.key = function(a) { return this.a.key(a) };

        function sh() { var a = null; try { a = window.localStorage || null } catch (b) {}
            this.a = a }
        w(sh, qh);

        function th() {
            var a = null;
            try { a = window.sessionStorage || null } catch (b) {}
            this.a =
                a
        }
        w(th, qh);

        function uh(a, b) { this.f = a;
            this.a = b + "::" }
        w(uh, ph);
        uh.prototype.set = function(a, b) { this.f.set(this.a + a, b) };
        uh.prototype.get = function(a) { return this.f.get(this.a + a) };
        uh.prototype.ra = function(a) { this.f.ra(this.a + a) };
        uh.prototype.ha = function(a) { var b = this.f.ha(!0),
                c = this,
                d = new nb;
            d.next = function() { for (var e = b.next(); e.substr(0, c.a.length) != c.a;) e = b.next(); return a ? e.substr(c.a.length) : c.f.get(e) }; return d };
        var vh, wh = new sh;
        vh = rh(wh) ? new uh(wh, "firebaseui") : null;
        var xh = new oh(vh),
            yh, zh = new th;
        yh = rh(zh) ? new uh(zh, "firebaseui") : null;
        var Ah = new oh(yh),
            Bh = { name: "pendingEmailCredential", storage: Ah },
            Ch = { name: "redirectStatus", storage: Ah },
            Dh = { name: "redirectUrl", storage: Ah },
            Eh = { name: "rememberAccount", storage: Ah },
            Fh = { name: "rememberedAccounts", storage: xh },
            Gh = { name: "emailForSignIn", storage: new oh(new Hg(3600, "/")) },
            Hh = { name: "pendingEncryptedCredential", storage: new oh(new Hg(3600, "/")) };

        function Ih(a, b) { return a.storage.get(b ? a.name + ":" + b : a.name) }

        function Jh(a, b) { a.storage.a.ra(b ? a.name + ":" + b : a.name) }

        function Kh(a, b, c) { a.storage.set(c ? a.name + ":" + c : a.name, b) }

        function Lh(a) { return Ih(Dh, a) || null }

        function Mh(a, b) { Kh(Dh, a, b) }

        function Nh(a, b) { Kh(Eh, a, b) }

        function Oh(a) { a = Ih(Fh, a) || [];
            a = Ma(a, function(b) { return Cg(b) }); return La(a, function(b) { return null != b }) }

        function Ph(a, b) { var c = Oh(b),
                d = Oa(c, function(e) { return e.a == a.a && (e.f || null) == (a.f || null) }); - 1 < d && Sa(c, d);
            c.unshift(a);
            Kh(Fh, Ma(c, function(e) { return e.aa() }), b) }

        function Qh(a) { a = Ih(Bh, a) || null; return Jg(a) }

        function Rh(a) { Jh(Bh, a) }

        function Sh(a, b) {
            Kh(Bh,
                a.aa(), b)
        }

        function Th(a) { return (a = Ih(Ch, a) || null) && "undefined" !== typeof a.tenantId ? new Kg(a.tenantId) : null }

        function Uh(a, b) { Kh(Ch, a.aa(), b) }

        function Vh(a, b) { b = Ih(Gh, b); var c = null; if (b) try { var d = hh(a, b),
                    e = JSON.parse(d);
                c = e && e.email || null } catch (f) {}
            return c }

        function Wh(a, b) { b = Ih(Hh, b); var c = null; if (b) try { var d = hh(a, b);
                c = JSON.parse(d) } catch (e) {}
            return Jg(c || null) }

        function Xh(a, b, c) { Kh(Hh, fh(a, JSON.stringify(b.aa())), c) }

        function Yh() { this.V = {} }

        function H(a, b, c) {
            if (b.toLowerCase() in a.V) throw Error("Configuration " +
                b + " has already been defined.");
            a.V[b.toLowerCase()] = c
        }

        function Zh(a, b, c) { if (!(b.toLowerCase() in a.V)) throw Error("Configuration " + b + " is not defined.");
            a.V[b.toLowerCase()] = c }
        Yh.prototype.get = function(a) { if (!(a.toLowerCase() in this.V)) throw Error("Configuration " + a + " is not defined."); return this.V[a.toLowerCase()] };

        function $h(a, b) { a = a.get(b); if (!a) throw Error("Configuration " + b + " is required."); return a }

        function ai() { this.f = void 0;
            this.a = {} }
        l = ai.prototype;
        l.set = function(a, b) { bi(this, a, b, !1) };
        l.add =
            function(a, b) { bi(this, a, b, !0) };

        function bi(a, b, c, d) { for (var e = 0; e < b.length; e++) { var f = b.charAt(e);
                a.a[f] || (a.a[f] = new ai);
                a = a.a[f] } if (d && void 0 !== a.f) throw Error('The collection already contains the key "' + b + '"');
            a.f = c }
        l.get = function(a) { a: { for (var b = this, c = 0; c < a.length; c++)
                    if (b = b.a[a.charAt(c)], !b) { a = void 0; break a }
                a = b } return a ? a.f : void 0 };
        l.la = function() { var a = [];
            ci(this, a); return a };

        function ci(a, b) { void 0 !== a.f && b.push(a.f); for (var c in a.a) ci(a.a[c], b) }
        l.ja = function() { var a = [];
            di(this, "", a); return a };

        function di(a, b, c) { void 0 !== a.f && c.push(b); for (var d in a.a) di(a.a[d], b + d, c) }
        l.clear = function() { this.a = {};
            this.f = void 0 };

        function ei(a) { this.a = a;
            this.f = new ai; for (a = 0; a < this.a.length; a++) { var b = this.f.get("+" + this.a[a].b);
                b ? b.push(this.a[a]) : this.f.add("+" + this.a[a].b, [this.a[a]]) } }

        function fi(a, b) { a = a.f; var c = {},
                d = 0;
            void 0 !== a.f && (c[d] = a.f); for (; d < b.length; d++) { var e = b.charAt(d); if (!(e in a.a)) break;
                a = a.a[e];
                void 0 !== a.f && (c[d] = a.f) } for (var f in c)
                if (c.hasOwnProperty(f)) return c[f];
            return [] }

        function gi(a) {
            for (var b =
                    0; b < hi.length; b++)
                if (hi[b].c === a) return hi[b];
            return null
        }

        function ii(a) { a = a.toUpperCase(); for (var b = [], c = 0; c < hi.length; c++) hi[c].g === a && b.push(hi[c]); return b }

        function ji(a) { if (0 < a.length && "+" == a.charAt(0)) { a = a.substring(1); for (var b = [], c = 0; c < hi.length; c++) hi[c].b == a && b.push(hi[c]);
                a = b } else a = ii(a); return a }

        function ki(a) { a.sort(function(b, c) { return b.name.localeCompare(c.name, "en") }) }
        var hi = [{ name: "Afghanistan", c: "93-AF-0", b: "93", g: "AF" }, { name: "\u00c5land Islands", c: "358-AX-0", b: "358", g: "AX" }, {
                name: "Albania",
                c: "355-AL-0",
                b: "355",
                g: "AL"
            }, { name: "Algeria", c: "213-DZ-0", b: "213", g: "DZ" }, { name: "American Samoa", c: "1-AS-0", b: "1", g: "AS" }, { name: "Andorra", c: "376-AD-0", b: "376", g: "AD" }, { name: "Angola", c: "244-AO-0", b: "244", g: "AO" }, { name: "Anguilla", c: "1-AI-0", b: "1", g: "AI" }, { name: "Antigua and Barbuda", c: "1-AG-0", b: "1", g: "AG" }, { name: "Argentina", c: "54-AR-0", b: "54", g: "AR" }, { name: "Armenia", c: "374-AM-0", b: "374", g: "AM" }, { name: "Aruba", c: "297-AW-0", b: "297", g: "AW" }, { name: "Ascension Island", c: "247-AC-0", b: "247", g: "AC" }, {
                name: "Australia",
                c: "61-AU-0",
                b: "61",
                g: "AU"
            }, { name: "Austria", c: "43-AT-0", b: "43", g: "AT" }, { name: "Azerbaijan", c: "994-AZ-0", b: "994", g: "AZ" }, { name: "Bahamas", c: "1-BS-0", b: "1", g: "BS" }, { name: "Bahrain", c: "973-BH-0", b: "973", g: "BH" }, { name: "Bangladesh", c: "880-BD-0", b: "880", g: "BD" }, { name: "Barbados", c: "1-BB-0", b: "1", g: "BB" }, { name: "Belarus", c: "375-BY-0", b: "375", g: "BY" }, { name: "Belgium", c: "32-BE-0", b: "32", g: "BE" }, { name: "Belize", c: "501-BZ-0", b: "501", g: "BZ" }, { name: "Benin", c: "229-BJ-0", b: "229", g: "BJ" }, {
                name: "Bermuda",
                c: "1-BM-0",
                b: "1",
                g: "BM"
            }, { name: "Bhutan", c: "975-BT-0", b: "975", g: "BT" }, { name: "Bolivia", c: "591-BO-0", b: "591", g: "BO" }, { name: "Bosnia and Herzegovina", c: "387-BA-0", b: "387", g: "BA" }, { name: "Botswana", c: "267-BW-0", b: "267", g: "BW" }, { name: "Brazil", c: "55-BR-0", b: "55", g: "BR" }, { name: "British Indian Ocean Territory", c: "246-IO-0", b: "246", g: "IO" }, { name: "British Virgin Islands", c: "1-VG-0", b: "1", g: "VG" }, { name: "Brunei", c: "673-BN-0", b: "673", g: "BN" }, { name: "Bulgaria", c: "359-BG-0", b: "359", g: "BG" }, {
                name: "Burkina Faso",
                c: "226-BF-0",
                b: "226",
                g: "BF"
            }, { name: "Burundi", c: "257-BI-0", b: "257", g: "BI" }, { name: "Cambodia", c: "855-KH-0", b: "855", g: "KH" }, { name: "Cameroon", c: "237-CM-0", b: "237", g: "CM" }, { name: "Canada", c: "1-CA-0", b: "1", g: "CA" }, { name: "Cape Verde", c: "238-CV-0", b: "238", g: "CV" }, { name: "Caribbean Netherlands", c: "599-BQ-0", b: "599", g: "BQ" }, { name: "Cayman Islands", c: "1-KY-0", b: "1", g: "KY" }, { name: "Central African Republic", c: "236-CF-0", b: "236", g: "CF" }, { name: "Chad", c: "235-TD-0", b: "235", g: "TD" }, { name: "Chile", c: "56-CL-0", b: "56", g: "CL" }, {
                name: "China",
                c: "86-CN-0",
                b: "86",
                g: "CN"
            }, { name: "Christmas Island", c: "61-CX-0", b: "61", g: "CX" }, { name: "Cocos [Keeling] Islands", c: "61-CC-0", b: "61", g: "CC" }, { name: "Colombia", c: "57-CO-0", b: "57", g: "CO" }, { name: "Comoros", c: "269-KM-0", b: "269", g: "KM" }, { name: "Democratic Republic Congo", c: "243-CD-0", b: "243", g: "CD" }, { name: "Republic of Congo", c: "242-CG-0", b: "242", g: "CG" }, { name: "Cook Islands", c: "682-CK-0", b: "682", g: "CK" }, { name: "Costa Rica", c: "506-CR-0", b: "506", g: "CR" }, { name: "C\u00f4te d'Ivoire", c: "225-CI-0", b: "225", g: "CI" }, {
                name: "Croatia",
                c: "385-HR-0",
                b: "385",
                g: "HR"
            }, { name: "Cuba", c: "53-CU-0", b: "53", g: "CU" }, { name: "Cura\u00e7ao", c: "599-CW-0", b: "599", g: "CW" }, { name: "Cyprus", c: "357-CY-0", b: "357", g: "CY" }, { name: "Czech Republic", c: "420-CZ-0", b: "420", g: "CZ" }, { name: "Denmark", c: "45-DK-0", b: "45", g: "DK" }, { name: "Djibouti", c: "253-DJ-0", b: "253", g: "DJ" }, { name: "Dominica", c: "1-DM-0", b: "1", g: "DM" }, { name: "Dominican Republic", c: "1-DO-0", b: "1", g: "DO" }, { name: "East Timor", c: "670-TL-0", b: "670", g: "TL" }, { name: "Ecuador", c: "593-EC-0", b: "593", g: "EC" }, {
                name: "Egypt",
                c: "20-EG-0",
                b: "20",
                g: "EG"
            }, { name: "El Salvador", c: "503-SV-0", b: "503", g: "SV" }, { name: "Equatorial Guinea", c: "240-GQ-0", b: "240", g: "GQ" }, { name: "Eritrea", c: "291-ER-0", b: "291", g: "ER" }, { name: "Estonia", c: "372-EE-0", b: "372", g: "EE" }, { name: "Ethiopia", c: "251-ET-0", b: "251", g: "ET" }, { name: "Falkland Islands [Islas Malvinas]", c: "500-FK-0", b: "500", g: "FK" }, { name: "Faroe Islands", c: "298-FO-0", b: "298", g: "FO" }, { name: "Fiji", c: "679-FJ-0", b: "679", g: "FJ" }, { name: "Finland", c: "358-FI-0", b: "358", g: "FI" }, {
                name: "France",
                c: "33-FR-0",
                b: "33",
                g: "FR"
            }, { name: "French Guiana", c: "594-GF-0", b: "594", g: "GF" }, { name: "French Polynesia", c: "689-PF-0", b: "689", g: "PF" }, { name: "Gabon", c: "241-GA-0", b: "241", g: "GA" }, { name: "Gambia", c: "220-GM-0", b: "220", g: "GM" }, { name: "Georgia", c: "995-GE-0", b: "995", g: "GE" }, { name: "Germany", c: "49-DE-0", b: "49", g: "DE" }, { name: "Ghana", c: "233-GH-0", b: "233", g: "GH" }, { name: "Gibraltar", c: "350-GI-0", b: "350", g: "GI" }, { name: "Greece", c: "30-GR-0", b: "30", g: "GR" }, { name: "Greenland", c: "299-GL-0", b: "299", g: "GL" }, {
                name: "Grenada",
                c: "1-GD-0",
                b: "1",
                g: "GD"
            }, { name: "Guadeloupe", c: "590-GP-0", b: "590", g: "GP" }, { name: "Guam", c: "1-GU-0", b: "1", g: "GU" }, { name: "Guatemala", c: "502-GT-0", b: "502", g: "GT" }, { name: "Guernsey", c: "44-GG-0", b: "44", g: "GG" }, { name: "Guinea Conakry", c: "224-GN-0", b: "224", g: "GN" }, { name: "Guinea-Bissau", c: "245-GW-0", b: "245", g: "GW" }, { name: "Guyana", c: "592-GY-0", b: "592", g: "GY" }, { name: "Haiti", c: "509-HT-0", b: "509", g: "HT" }, { name: "Heard Island and McDonald Islands", c: "672-HM-0", b: "672", g: "HM" }, { name: "Honduras", c: "504-HN-0", b: "504", g: "HN" }, {
                name: "Hong Kong",
                c: "852-HK-0",
                b: "852",
                g: "HK"
            }, { name: "Hungary", c: "36-HU-0", b: "36", g: "HU" }, { name: "Iceland", c: "354-IS-0", b: "354", g: "IS" }, { name: "India", c: "91-IN-0", b: "91", g: "IN" }, { name: "Indonesia", c: "62-ID-0", b: "62", g: "ID" }, { name: "Iran", c: "98-IR-0", b: "98", g: "IR" }, { name: "Iraq", c: "964-IQ-0", b: "964", g: "IQ" }, { name: "Ireland", c: "353-IE-0", b: "353", g: "IE" }, { name: "Isle of Man", c: "44-IM-0", b: "44", g: "IM" }, { name: "Israel", c: "972-IL-0", b: "972", g: "IL" }, { name: "Italy", c: "39-IT-0", b: "39", g: "IT" }, { name: "Jamaica", c: "1-JM-0", b: "1", g: "JM" },
            { name: "Japan", c: "81-JP-0", b: "81", g: "JP" }, { name: "Jersey", c: "44-JE-0", b: "44", g: "JE" }, { name: "Jordan", c: "962-JO-0", b: "962", g: "JO" }, { name: "Kazakhstan", c: "7-KZ-0", b: "7", g: "KZ" }, { name: "Kenya", c: "254-KE-0", b: "254", g: "KE" }, { name: "Kiribati", c: "686-KI-0", b: "686", g: "KI" }, { name: "Kosovo", c: "377-XK-0", b: "377", g: "XK" }, { name: "Kosovo", c: "381-XK-0", b: "381", g: "XK" }, { name: "Kosovo", c: "386-XK-0", b: "386", g: "XK" }, { name: "Kuwait", c: "965-KW-0", b: "965", g: "KW" }, { name: "Kyrgyzstan", c: "996-KG-0", b: "996", g: "KG" }, {
                name: "Laos",
                c: "856-LA-0",
                b: "856",
                g: "LA"
            }, { name: "Latvia", c: "371-LV-0", b: "371", g: "LV" }, { name: "Lebanon", c: "961-LB-0", b: "961", g: "LB" }, { name: "Lesotho", c: "266-LS-0", b: "266", g: "LS" }, { name: "Liberia", c: "231-LR-0", b: "231", g: "LR" }, { name: "Libya", c: "218-LY-0", b: "218", g: "LY" }, { name: "Liechtenstein", c: "423-LI-0", b: "423", g: "LI" }, { name: "Lithuania", c: "370-LT-0", b: "370", g: "LT" }, { name: "Luxembourg", c: "352-LU-0", b: "352", g: "LU" }, { name: "Macau", c: "853-MO-0", b: "853", g: "MO" }, { name: "Macedonia", c: "389-MK-0", b: "389", g: "MK" }, {
                name: "Madagascar",
                c: "261-MG-0",
                b: "261",
                g: "MG"
            }, { name: "Malawi", c: "265-MW-0", b: "265", g: "MW" }, { name: "Malaysia", c: "60-MY-0", b: "60", g: "MY" }, { name: "Maldives", c: "960-MV-0", b: "960", g: "MV" }, { name: "Mali", c: "223-ML-0", b: "223", g: "ML" }, { name: "Malta", c: "356-MT-0", b: "356", g: "MT" }, { name: "Marshall Islands", c: "692-MH-0", b: "692", g: "MH" }, { name: "Martinique", c: "596-MQ-0", b: "596", g: "MQ" }, { name: "Mauritania", c: "222-MR-0", b: "222", g: "MR" }, { name: "Mauritius", c: "230-MU-0", b: "230", g: "MU" }, { name: "Mayotte", c: "262-YT-0", b: "262", g: "YT" }, {
                name: "Mexico",
                c: "52-MX-0",
                b: "52",
                g: "MX"
            }, { name: "Micronesia", c: "691-FM-0", b: "691", g: "FM" }, { name: "Moldova", c: "373-MD-0", b: "373", g: "MD" }, { name: "Monaco", c: "377-MC-0", b: "377", g: "MC" }, { name: "Mongolia", c: "976-MN-0", b: "976", g: "MN" }, { name: "Montenegro", c: "382-ME-0", b: "382", g: "ME" }, { name: "Montserrat", c: "1-MS-0", b: "1", g: "MS" }, { name: "Morocco", c: "212-MA-0", b: "212", g: "MA" }, { name: "Mozambique", c: "258-MZ-0", b: "258", g: "MZ" }, { name: "Myanmar [Burma]", c: "95-MM-0", b: "95", g: "MM" }, { name: "Namibia", c: "264-NA-0", b: "264", g: "NA" }, {
                name: "Nauru",
                c: "674-NR-0",
                b: "674",
                g: "NR"
            }, { name: "Nepal", c: "977-NP-0", b: "977", g: "NP" }, { name: "Netherlands", c: "31-NL-0", b: "31", g: "NL" }, { name: "New Caledonia", c: "687-NC-0", b: "687", g: "NC" }, { name: "New Zealand", c: "64-NZ-0", b: "64", g: "NZ" }, { name: "Nicaragua", c: "505-NI-0", b: "505", g: "NI" }, { name: "Niger", c: "227-NE-0", b: "227", g: "NE" }, { name: "Nigeria", c: "234-NG-0", b: "234", g: "NG" }, { name: "Niue", c: "683-NU-0", b: "683", g: "NU" }, { name: "Norfolk Island", c: "672-NF-0", b: "672", g: "NF" }, { name: "North Korea", c: "850-KP-0", b: "850", g: "KP" }, {
                name: "Northern Mariana Islands",
                c: "1-MP-0",
                b: "1",
                g: "MP"
            }, { name: "Norway", c: "47-NO-0", b: "47", g: "NO" }, { name: "Oman", c: "968-OM-0", b: "968", g: "OM" }, { name: "Pakistan", c: "92-PK-0", b: "92", g: "PK" }, { name: "Palau", c: "680-PW-0", b: "680", g: "PW" }, { name: "Palestinian Territories", c: "970-PS-0", b: "970", g: "PS" }, { name: "Panama", c: "507-PA-0", b: "507", g: "PA" }, { name: "Papua New Guinea", c: "675-PG-0", b: "675", g: "PG" }, { name: "Paraguay", c: "595-PY-0", b: "595", g: "PY" }, { name: "Peru", c: "51-PE-0", b: "51", g: "PE" }, { name: "Philippines", c: "63-PH-0", b: "63", g: "PH" }, {
                name: "Poland",
                c: "48-PL-0",
                b: "48",
                g: "PL"
            }, { name: "Portugal", c: "351-PT-0", b: "351", g: "PT" }, { name: "Puerto Rico", c: "1-PR-0", b: "1", g: "PR" }, { name: "Qatar", c: "974-QA-0", b: "974", g: "QA" }, { name: "R\u00e9union", c: "262-RE-0", b: "262", g: "RE" }, { name: "Romania", c: "40-RO-0", b: "40", g: "RO" }, { name: "Russia", c: "7-RU-0", b: "7", g: "RU" }, { name: "Rwanda", c: "250-RW-0", b: "250", g: "RW" }, { name: "Saint Barth\u00e9lemy", c: "590-BL-0", b: "590", g: "BL" }, { name: "Saint Helena", c: "290-SH-0", b: "290", g: "SH" }, { name: "St. Kitts", c: "1-KN-0", b: "1", g: "KN" }, {
                name: "St. Lucia",
                c: "1-LC-0",
                b: "1",
                g: "LC"
            }, { name: "Saint Martin", c: "590-MF-0", b: "590", g: "MF" }, { name: "Saint Pierre and Miquelon", c: "508-PM-0", b: "508", g: "PM" }, { name: "St. Vincent", c: "1-VC-0", b: "1", g: "VC" }, { name: "Samoa", c: "685-WS-0", b: "685", g: "WS" }, { name: "San Marino", c: "378-SM-0", b: "378", g: "SM" }, { name: "S\u00e3o Tom\u00e9 and Pr\u00edncipe", c: "239-ST-0", b: "239", g: "ST" }, { name: "Saudi Arabia", c: "966-SA-0", b: "966", g: "SA" }, { name: "Senegal", c: "221-SN-0", b: "221", g: "SN" }, { name: "Serbia", c: "381-RS-0", b: "381", g: "RS" }, {
                name: "Seychelles",
                c: "248-SC-0",
                b: "248",
                g: "SC"
            }, { name: "Sierra Leone", c: "232-SL-0", b: "232", g: "SL" }, { name: "Singapore", c: "65-SG-0", b: "65", g: "SG" }, { name: "Sint Maarten", c: "1-SX-0", b: "1", g: "SX" }, { name: "Slovakia", c: "421-SK-0", b: "421", g: "SK" }, { name: "Slovenia", c: "386-SI-0", b: "386", g: "SI" }, { name: "Solomon Islands", c: "677-SB-0", b: "677", g: "SB" }, { name: "Somalia", c: "252-SO-0", b: "252", g: "SO" }, { name: "South Africa", c: "27-ZA-0", b: "27", g: "ZA" }, { name: "South Georgia and the South Sandwich Islands", c: "500-GS-0", b: "500", g: "GS" }, {
                name: "South Korea",
                c: "82-KR-0",
                b: "82",
                g: "KR"
            }, { name: "South Sudan", c: "211-SS-0", b: "211", g: "SS" }, { name: "Spain", c: "34-ES-0", b: "34", g: "ES" }, { name: "Sri Lanka", c: "94-LK-0", b: "94", g: "LK" }, { name: "Sudan", c: "249-SD-0", b: "249", g: "SD" }, { name: "Suriname", c: "597-SR-0", b: "597", g: "SR" }, { name: "Svalbard and Jan Mayen", c: "47-SJ-0", b: "47", g: "SJ" }, { name: "Swaziland", c: "268-SZ-0", b: "268", g: "SZ" }, { name: "Sweden", c: "46-SE-0", b: "46", g: "SE" }, { name: "Switzerland", c: "41-CH-0", b: "41", g: "CH" }, { name: "Syria", c: "963-SY-0", b: "963", g: "SY" }, {
                name: "Taiwan",
                c: "886-TW-0",
                b: "886",
                g: "TW"
            }, { name: "Tajikistan", c: "992-TJ-0", b: "992", g: "TJ" }, { name: "Tanzania", c: "255-TZ-0", b: "255", g: "TZ" }, { name: "Thailand", c: "66-TH-0", b: "66", g: "TH" }, { name: "Togo", c: "228-TG-0", b: "228", g: "TG" }, { name: "Tokelau", c: "690-TK-0", b: "690", g: "TK" }, { name: "Tonga", c: "676-TO-0", b: "676", g: "TO" }, { name: "Trinidad/Tobago", c: "1-TT-0", b: "1", g: "TT" }, { name: "Tunisia", c: "216-TN-0", b: "216", g: "TN" }, { name: "Turkey", c: "90-TR-0", b: "90", g: "TR" }, { name: "Turkmenistan", c: "993-TM-0", b: "993", g: "TM" }, {
                name: "Turks and Caicos Islands",
                c: "1-TC-0",
                b: "1",
                g: "TC"
            }, { name: "Tuvalu", c: "688-TV-0", b: "688", g: "TV" }, { name: "U.S. Virgin Islands", c: "1-VI-0", b: "1", g: "VI" }, { name: "Uganda", c: "256-UG-0", b: "256", g: "UG" }, { name: "Ukraine", c: "380-UA-0", b: "380", g: "UA" }, { name: "United Arab Emirates", c: "971-AE-0", b: "971", g: "AE" }, { name: "United Kingdom", c: "44-GB-0", b: "44", g: "GB" }, { name: "United States", c: "1-US-0", b: "1", g: "US" }, { name: "Uruguay", c: "598-UY-0", b: "598", g: "UY" }, { name: "Uzbekistan", c: "998-UZ-0", b: "998", g: "UZ" }, { name: "Vanuatu", c: "678-VU-0", b: "678", g: "VU" },
            { name: "Vatican City", c: "379-VA-0", b: "379", g: "VA" }, { name: "Venezuela", c: "58-VE-0", b: "58", g: "VE" }, { name: "Vietnam", c: "84-VN-0", b: "84", g: "VN" }, { name: "Wallis and Futuna", c: "681-WF-0", b: "681", g: "WF" }, { name: "Western Sahara", c: "212-EH-0", b: "212", g: "EH" }, { name: "Yemen", c: "967-YE-0", b: "967", g: "YE" }, { name: "Zambia", c: "260-ZM-0", b: "260", g: "ZM" }, { name: "Zimbabwe", c: "263-ZW-0", b: "263", g: "ZW" }
        ];
        ki(hi);
        var li = new ei(hi);

        function mi(a, b) { this.a = a;
            this.za = b }

        function ni(a) {
            a = Za(a);
            var b = fi(li, a);
            return 0 < b.length ? new mi("1" ==
                b[0].b ? "1-US-0" : b[0].c, Za(a.substr(b[0].b.length + 1))) : null
        }

        function oi(a) { var b = gi(a.a); if (!b) throw Error("Country ID " + a.a + " not found."); return "+" + b.b + a.za }

        function pi(a, b) { for (var c = 0; c < a.length; c++)
                if (!Qa(qi, a[c]) && (null !== ri && a[c] in ri || Qa(b, a[c]))) return a[c];
            return null }
        var qi = ["emailLink", "password", "phone"],
            ri = { "facebook.com": "FacebookAuthProvider", "github.com": "GithubAuthProvider", "google.com": "GoogleAuthProvider", password: "EmailAuthProvider", "twitter.com": "TwitterAuthProvider", phone: "PhoneAuthProvider" };

        function si() { this.a = new Yh;
            H(this.a, "acUiConfig");
            H(this.a, "autoUpgradeAnonymousUsers");
            H(this.a, "callbacks");
            H(this.a, "credentialHelper", ti);
            H(this.a, "immediateFederatedRedirect", !1);
            H(this.a, "popupMode", !1);
            H(this.a, "privacyPolicyUrl");
            H(this.a, "queryParameterForSignInSuccessUrl", "signInSuccessUrl");
            H(this.a, "queryParameterForWidgetMode", "mode");
            H(this.a, "signInFlow");
            H(this.a, "signInOptions");
            H(this.a, "signInSuccessUrl");
            H(this.a, "siteName");
            H(this.a, "tosUrl");
            H(this.a, "widgetUrl") }

        function ui(a) {
            return a.a.get("acUiConfig") ||
                null
        }

        function vi(a) { var b = a.a.get("widgetUrl") || yf(); return wi(a, b) }

        function wi(a, b) { a = xi(a); for (var c = b.search(xb), d = 0, e, f = []; 0 <= (e = wb(b, d, a, c));) f.push(b.substring(d, e)), d = Math.min(b.indexOf("&", e) + 1 || c, c);
            f.push(b.substr(d));
            b = f.join("").replace(zb, "$1");
            c = "=" + encodeURIComponent("select");
            (a += c) ? (c = b.indexOf("#"), 0 > c && (c = b.length), d = b.indexOf("?"), 0 > d || d > c ? (d = c, e = "") : e = b.substring(d + 1, c), b = [b.substr(0, d), e, b.substr(c)], c = b[1], b[1] = a ? c ? c + "&" + a : a : c, a = b[0] + (b[1] ? "?" + b[1] : "") + b[2]) : a = b; return a }

        function yi(a) {
            var b = !!a.a.get("autoUpgradeAnonymousUsers");
            b && !zi(a) && vg('Missing "signInFailure" callback: "signInFailure" callback needs to be provided when "autoUpgradeAnonymousUsers" is set to true.', void 0);
            return b
        }

        function Ai(a) { a = a.a.get("signInOptions") || []; for (var b = [], c = 0; c < a.length; c++) { var d = a[c];
                d = wa(d) ? d : { provider: d };
                d.provider && b.push(d) } return b }

        function Bi(a, b) { a = Ai(a); for (var c = 0; c < a.length; c++)
                if (a[c].provider === b) return a[c];
            return null }

        function Ci(a) { return Ma(Ai(a), function(b) { return b.provider }) }

        function Di(a, b) { a = Ei(a); for (var c = 0; c < a.length; c++)
                if (a[c].providerId === b) return a[c];
            return null }

        function Ei(a) { return Ma(Ai(a), function(b) { return ri[b.provider] || Qa(Fi, b.provider) ? { providerId: b.provider } : { providerId: b.provider, rb: b.providerName || null, Ga: b.buttonColor || null, Na: b.iconUrl ? Fc(Ic(b.iconUrl)) : null, Nb: b.loginHintKey || null } }) }

        function Gi(a) {
            var b = [],
                c = [];
            Ja(Ai(a), function(e) { e.authMethod && (b.push(e.authMethod), e.clientId && c.push({ uri: e.authMethod, clientId: e.clientId })) });
            var d = null;
            Hi(a) ===
                Ii && b.length && (d = { supportedIdTokenProviders: c, supportedAuthMethods: b });
            return d
        }

        function Ji(a, b) { var c = null;
            Ja(Ai(a), function(d) { d.authMethod === b && (c = d.provider) }); return c }

        function Ki(a) {
            var b = null;
            Ja(Ai(a), function(d) { d.provider == firebase.auth.PhoneAuthProvider.PROVIDER_ID && wa(d.recaptchaParameters) && !ta(d.recaptchaParameters) && (b = jb(d.recaptchaParameters)) });
            if (b) {
                var c = [];
                Ja(Li, function(d) { "undefined" !== typeof b[d] && (c.push(d), delete b[d]) });
                c.length && Ag('The following provided "recaptchaParameters" keys are not allowed: ' +
                    c.join(", "))
            }
            return b
        }

        function Mi(a, b) { a = (a = Bi(a, b)) && a.scopes; return ta(a) ? a : [] }

        function Ni(a, b) { a = (a = Bi(a, b)) && a.customParameters; return wa(a) ? (a = jb(a), b === firebase.auth.GoogleAuthProvider.PROVIDER_ID && delete a.login_hint, b === firebase.auth.GithubAuthProvider.PROVIDER_ID && delete a.login, a) : null }

        function Oi(a) { a = Bi(a, firebase.auth.PhoneAuthProvider.PROVIDER_ID); var b = null;
            a && "string" === typeof a.loginHint && (b = ni(a.loginHint)); return a && a.defaultNationalNumber || b && b.za || null }

        function Pi(a) {
            var b = (a =
                Bi(a, firebase.auth.PhoneAuthProvider.PROVIDER_ID)) && a.defaultCountry || null;
            b = b && ii(b);
            var c = null;
            a && "string" === typeof a.loginHint && (c = ni(a.loginHint));
            return b && b[0] || c && gi(c.a) || null
        }

        function Qi(a) {
            a = Bi(a, firebase.auth.PhoneAuthProvider.PROVIDER_ID);
            if (!a) return null;
            var b = a.whitelistedCountries,
                c = a.blacklistedCountries;
            if ("undefined" !== typeof b && (!ta(b) || 0 == b.length)) throw Error("WhitelistedCountries must be a non-empty array.");
            if ("undefined" !== typeof c && !ta(c)) throw Error("BlacklistedCountries must be an array.");
            if (b && c) throw Error("Both whitelistedCountries and blacklistedCountries are provided.");
            if (!b && !c) return hi;
            a = [];
            if (b) { c = {}; for (var d = 0; d < b.length; d++) { var e = ji(b[d]); for (var f = 0; f < e.length; f++) c[e[f].c] = e[f] } for (var g in c) c.hasOwnProperty(g) && a.push(c[g]) } else { g = {}; for (b = 0; b < c.length; b++)
                    for (e = ji(c[b]), d = 0; d < e.length; d++) g[e[d].c] = e[d]; for (e = 0; e < hi.length; e++) null !== g && hi[e].c in g || a.push(hi[e]) }
            return a
        }

        function xi(a) { return $h(a.a, "queryParameterForWidgetMode") }

        function I(a) {
            var b = a.a.get("tosUrl") ||
                null;
            a = a.a.get("privacyPolicyUrl") || null;
            b && !a && Ag("Privacy Policy URL is missing, the link will not be displayed.");
            if (b && a) { if (va(b)) return b; if ("string" === typeof b) return function() { wf(b) } }
            return null
        }

        function Ri(a) { var b = a.a.get("tosUrl") || null,
                c = a.a.get("privacyPolicyUrl") || null;
            c && !b && Ag("Term of Service URL is missing, the link will not be displayed."); if (b && c) { if (va(c)) return c; if ("string" === typeof c) return function() { wf(c) } } return null }

        function Si(a) {
            return (a = Bi(a, firebase.auth.EmailAuthProvider.PROVIDER_ID)) &&
                "undefined" !== typeof a.requireDisplayName ? !!a.requireDisplayName : !0
        }

        function Ti(a) { a = Bi(a, firebase.auth.EmailAuthProvider.PROVIDER_ID); return !(!a || a.signInMethod !== firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD) }

        function Ui(a) { a = Bi(a, firebase.auth.EmailAuthProvider.PROVIDER_ID); return !(!a || !a.forceSameDevice) }

        function Vi(a) {
            if (Ti(a)) {
                var b = { url: yf(), handleCodeInApp: !0 };
                (a = Bi(a, firebase.auth.EmailAuthProvider.PROVIDER_ID)) && "function" === typeof a.emailLinkSignIn && lb(b, a.emailLinkSignIn());
                b.url = Pb(yf(), b.url).toString();
                return b
            }
            return null
        }

        function Wi(a) { var b = !!a.a.get("immediateFederatedRedirect"),
                c = Ci(a);
            a = Xi(a); return b && 1 == c.length && !Qa(qi, c[0]) && a == Yi }

        function Xi(a) { a = a.a.get("signInFlow"); for (var b in Zi)
                if (Zi[b] == a) return Zi[b];
            return Yi }

        function $i(a) { return aj(a).uiShown || null }

        function bj(a) { return aj(a).signInSuccess || null }

        function cj(a) { return aj(a).signInSuccessWithAuthResult || null }

        function zi(a) { return aj(a).signInFailure || null }

        function aj(a) {
            return a.a.get("callbacks") || {}
        }

        function Hi(a) { if ("http:" !== (window.location && window.location.protocol) && "https:" !== (window.location && window.location.protocol)) return dj;
            a = a.a.get("credentialHelper"); for (var b in ej)
                if (ej[b] == a) return ej[b];
            return ti }
        var ti = "accountchooser.com",
            Ii = "googleyolo",
            dj = "none",
            ej = { jc: ti, mc: Ii, NONE: dj },
            Yi = "redirect",
            Zi = { pc: "popup", qc: Yi },
            fj = {
                lc: "callback",
                RECOVER_EMAIL: "recoverEmail",
                rc: "resetPassword",
                REVERT_SECOND_FACTOR_ADDITION: "revertSecondFactorAddition",
                sc: "select",
                tc: "signIn",
                VERIFY_AND_CHANGE_EMAIL: "verifyAndChangeEmail",
                VERIFY_EMAIL: "verifyEmail"
            },
            Fi = ["anonymous"],
            Li = ["sitekey", "tabindex", "callback", "expired-callback"];
        var gj, hj, ij, jj, J = {};

        function K(a, b, c, d) { J[a].apply(null, Array.prototype.slice.call(arguments, 1)) }
        var kj = null;

        function lj(a) { return !(!a || -32E3 != a.code || "Service unavailable" != a.message) }

        function mj(a, b, c, d) {
            kj || (a = { callbacks: { empty: a, select: function(e, f) { e && e.account && b ? b(Cg(e.account)) : c && c(!lj(f)) }, store: a, update: a }, language: "en", providers: void 0, ui: d }, "undefined" != typeof accountchooser && accountchooser.Api &&
                accountchooser.Api.init ? kj = accountchooser.Api.init(a) : (kj = new nj(a), oj()))
        }

        function pj(a, b, c) {
            function d() { var e = Pb(window.location.href, c).toString();
                kj.select(Ma(b || [], function(f) { return f.aa() }), { clientCallbackUrl: e }) }
            b && b.length ? d() : kj.checkEmpty(function(e, f) { e || f ? a(!lj(f)) : d() }) }

        function nj(a) { this.a = a;
            this.a.callbacks = this.a.callbacks || {} }

        function oj() { var a = kj;
            va(a.a.callbacks.empty) && a.a.callbacks.empty() }
        l = nj.prototype;
        l.store = function() {
            va(this.a.callbacks.store) && this.a.callbacks.store(void 0,
                qj)
        };
        l.select = function() { va(this.a.callbacks.select) && this.a.callbacks.select(void 0, qj) };
        l.update = function() { va(this.a.callbacks.update) && this.a.callbacks.update(void 0, qj) };
        l.checkDisabled = function(a) { a(!0) };
        l.checkEmpty = function(a) { a(void 0, qj) };
        l.checkAccountExist = function(a, b) { b(void 0, qj) };
        l.checkShouldUpdate = function(a, b) { b(void 0, qj) };
        var qj = { code: -32E3, message: "Service unavailable", data: "Service is unavailable." };
        var rj = /MSIE ([\d.]+).*Windows NT ([\d.]+)/,
            sj = /Firefox\/([\d.]+)/,
            tj = /Opera[ \/]([\d.]+)(.*Version\/([\d.]+))?/,
            uj = /Chrome\/([\d.]+)/,
            vj = /((Windows NT ([\d.]+))|(Mac OS X ([\d_]+))).*Version\/([\d.]+).*Safari/,
            wj = /Mac OS X;.*(?!(Version)).*Safari/,
            xj = /Android ([\d.]+).*Safari/,
            yj = /OS ([\d_]+) like Mac OS X.*Mobile.*Safari/,
            zj = /Konqueror\/([\d.]+)/,
            Aj = /MSIE ([\d.]+).*Windows Phone OS ([\d.]+)/;

        function Bj(a, b) { a = a.split(b || ".");
            this.a = []; for (b = 0; b < a.length; b++) this.a.push(parseInt(a[b], 10)) }

        function Cj(a, b) {
            b instanceof Bj || (b = new Bj(String(b)));
            for (var c = Math.max(a.a.length, b.a.length), d = 0; d < c; d++) {
                var e = a.a[d],
                    f = b.a[d];
                if (void 0 !== e && void 0 !== f && e !== f) return e - f;
                if (void 0 === e) return -1;
                if (void 0 === f) return 1
            }
            return 0
        }

        function Dj(a, b) { return 0 <= Cj(a, b) }

        function Ej() {
            var a = window.navigator && window.navigator.userAgent;
            if (a) {
                var b;
                if (b = a.match(tj)) { var c = new Bj(b[3] || b[1]); return 0 <= a.indexOf("Opera Mini") ? !1 : 0 <= a.indexOf("Opera Mobi") ? 0 <= a.indexOf("Android") && Dj(c, "10.1") : Dj(c, "8.0") }
                if (b = a.match(sj)) return Dj(new Bj(b[1]), "2.0");
                if (b = a.match(uj)) return Dj(new Bj(b[1]), "6.0");
                if (b = a.match(vj)) return c = new Bj(b[6]),
                    a = b[3] && new Bj(b[3]), b = b[5] && new Bj(b[5], "_"), (!(!a || !Dj(a, "6.0")) || !(!b || !Dj(b, "10.5.6"))) && Dj(c, "3.0");
                if (b = a.match(xj)) return Dj(new Bj(b[1]), "3.0");
                if (b = a.match(yj)) return Dj(new Bj(b[1], "_"), "4.0");
                if (b = a.match(zj)) return Dj(new Bj(b[1]), "4.7");
                if (b = a.match(Aj)) return c = new Bj(b[1]), a = new Bj(b[2]), Dj(c, "7.0") && Dj(a, "7.0");
                if (b = a.match(rj)) return c = new Bj(b[1]), a = new Bj(b[2]), Dj(c, "7.0") && Dj(a, "6.0");
                if (a.match(wj)) return !1
            }
            return !0
        }

        function Fj(a) {
            if (a.classList) return a.classList;
            a = a.className;
            return r(a) && a.match(/\S+/g) || []
        }

        function Gj(a, b) { return a.classList ? a.classList.contains(b) : Qa(Fj(a), b) }

        function Hj(a, b) { a.classList ? a.classList.add(b) : Gj(a, b) || (a.className += 0 < a.className.length ? " " + b : b) }

        function Ij(a, b) { a.classList ? a.classList.remove(b) : Gj(a, b) && (a.className = La(Fj(a), function(c) { return c != b }).join(" ")) }

        function Jj(a) {
            var b = a.type;
            switch (r(b) && b.toLowerCase()) {
                case "checkbox":
                case "radio":
                    return a.checked ? a.value : null;
                case "select-one":
                    return b = a.selectedIndex, 0 <= b ? a.options[b].value :
                        null;
                case "select-multiple":
                    b = [];
                    for (var c, d = 0; c = a.options[d]; d++) c.selected && b.push(c.value);
                    return b.length ? b : null;
                default:
                    return null != a.value ? a.value : null
            }
        }

        function Kj(a, b) {
            var c = a.type;
            switch (r(c) && c.toLowerCase()) {
                case "checkbox":
                case "radio":
                    a.checked = b;
                    break;
                case "select-one":
                    a.selectedIndex = -1;
                    if (r(b))
                        for (var d = 0; c = a.options[d]; d++)
                            if (c.value == b) { c.selected = !0; break }
                    break;
                case "select-multiple":
                    r(b) && (b = [b]);
                    for (d = 0; c = a.options[d]; d++)
                        if (c.selected = !1, b)
                            for (var e, f = 0; e = b[f]; f++) c.value ==
                                e && (c.selected = !0);
                    break;
                default:
                    a.value = null != b ? b : ""
            }
        }

        function Lj(a) { if (a.altKey && !a.ctrlKey || a.metaKey || 112 <= a.keyCode && 123 >= a.keyCode) return !1; if (Mj(a.keyCode)) return !0; switch (a.keyCode) {
                case 18:
                case 20:
                case 93:
                case 17:
                case 40:
                case 35:
                case 27:
                case 36:
                case 45:
                case 37:
                case 224:
                case 91:
                case 144:
                case 12:
                case 34:
                case 33:
                case 19:
                case 255:
                case 44:
                case 39:
                case 145:
                case 16:
                case 38:
                case 252:
                case 224:
                case 92:
                    return !1;
                case 0:
                    return !jc;
                default:
                    return 166 > a.keyCode || 183 < a.keyCode } }

        function Nj(a, b, c, d, e, f) {
            if (kc &&
                !sc("525")) return !0;
            if (mc && e) return Mj(a);
            if (e && !d) return !1;
            if (!jc) { "number" == typeof b && (b = Oj(b)); var g = 17 == b || 18 == b || mc && 91 == b; if ((!c || mc) && g || mc && 16 == b && (d || f)) return !1 }
            if ((kc || hc) && d && c) switch (a) {
                case 220:
                case 219:
                case 221:
                case 192:
                case 186:
                case 189:
                case 187:
                case 188:
                case 190:
                case 191:
                case 192:
                case 222:
                    return !1 }
            if (z && d && b == a) return !1;
            switch (a) {
                case 13:
                    return jc ? f || e ? !1 : !(c && d) : !0;
                case 27:
                    return !(kc || hc || jc) }
            return jc && (d || e || f) ? !1 : Mj(a)
        }

        function Mj(a) {
            if (48 <= a && 57 >= a || 96 <= a && 106 >= a || 65 <= a && 90 >=
                a || (kc || hc) && 0 == a) return !0;
            switch (a) {
                case 32:
                case 43:
                case 63:
                case 64:
                case 107:
                case 109:
                case 110:
                case 111:
                case 186:
                case 59:
                case 189:
                case 187:
                case 61:
                case 188:
                case 190:
                case 191:
                case 192:
                case 222:
                case 219:
                case 220:
                case 221:
                case 163:
                    return !0;
                case 173:
                    return jc;
                default:
                    return !1 }
        }

        function Oj(a) { if (jc) a = Pj(a);
            else if (mc && kc) switch (a) {
                case 93:
                    a = 91 }
            return a }

        function Pj(a) { switch (a) {
                case 61:
                    return 187;
                case 59:
                    return 186;
                case 173:
                    return 189;
                case 224:
                    return 91;
                case 0:
                    return 224;
                default:
                    return a } }

        function Qj(a) {
            F.call(this);
            this.a = a;
            oe(a, "keydown", this.f, !1, this);
            oe(a, "click", this.h, !1, this)
        }
        w(Qj, F);
        Qj.prototype.f = function(a) {
            (13 == a.keyCode || kc && 3 == a.keyCode) && Rj(this, a) };
        Qj.prototype.h = function(a) { Rj(this, a) };

        function Rj(a, b) { var c = new Sj(b); if (Be(a, c)) { c = new Tj(b); try { Be(a, c) } finally { b.stopPropagation() } } }
        Qj.prototype.m = function() { Qj.M.m.call(this);
            we(this.a, "keydown", this.f, !1, this);
            we(this.a, "click", this.h, !1, this);
            delete this.a };

        function Tj(a) { ce.call(this, a.a);
            this.type = "action" }
        w(Tj, ce);

        function Sj(a) {
            ce.call(this,
                a.a);
            this.type = "beforeaction"
        }
        w(Sj, ce);

        function Uj(a) { F.call(this);
            this.a = a;
            a = z ? "focusout" : "blur";
            this.f = oe(this.a, z ? "focusin" : "focus", this, !z);
            this.h = oe(this.a, a, this, !z) }
        w(Uj, F);
        Uj.prototype.handleEvent = function(a) { var b = new ce(a.a);
            b.type = "focusin" == a.type || "focus" == a.type ? "focusin" : "focusout";
            Be(this, b) };
        Uj.prototype.m = function() { Uj.M.m.call(this);
            xe(this.f);
            xe(this.h);
            delete this.a };

        function Vj(a, b) { F.call(this);
            this.f = a || 1;
            this.a = b || p;
            this.h = t(this.fc, this);
            this.j = Ca() }
        w(Vj, F);
        l = Vj.prototype;
        l.Ka = !1;
        l.$ = null;
        l.fc = function() { if (this.Ka) { var a = Ca() - this.j;
                0 < a && a < .8 * this.f ? this.$ = this.a.setTimeout(this.h, this.f - a) : (this.$ && (this.a.clearTimeout(this.$), this.$ = null), Be(this, "tick"), this.Ka && (Wj(this), this.start())) } };
        l.start = function() { this.Ka = !0;
            this.$ || (this.$ = this.a.setTimeout(this.h, this.f), this.j = Ca()) };

        function Wj(a) { a.Ka = !1;
            a.$ && (a.a.clearTimeout(a.$), a.$ = null) }
        l.m = function() { Vj.M.m.call(this);
            Wj(this);
            delete this.a };

        function Xj(a, b) {
            if (va(a)) b && (a = t(a, b));
            else if (a && "function" == typeof a.handleEvent) a =
                t(a.handleEvent, a);
            else throw Error("Invalid listener argument");
            return 2147483647 < Number(0) ? -1 : p.setTimeout(a, 0)
        }

        function Yj(a) { Td.call(this);
            this.f = a;
            this.a = {} }
        w(Yj, Td);
        var Zj = [];

        function ak(a, b, c, d) { ta(c) || (c && (Zj[0] = c.toString()), c = Zj); for (var e = 0; e < c.length; e++) { var f = oe(b, c[e], d || a.handleEvent, !1, a.f || a); if (!f) break;
                a.a[f.key] = f } }

        function bk(a) { ib(a.a, function(b, c) { this.a.hasOwnProperty(c) && xe(b) }, a);
            a.a = {} }
        Yj.prototype.m = function() { Yj.M.m.call(this);
            bk(this) };
        Yj.prototype.handleEvent = function() {
            throw Error("EventHandler.handleEvent not implemented");
        };

        function ck(a) { F.call(this);
            this.a = null;
            this.f = a;
            a = z || hc || kc && !sc("531") && "TEXTAREA" == a.tagName;
            this.h = new Yj(this);
            ak(this.h, this.f, a ? ["keydown", "paste", "cut", "drop", "input"] : "input", this) }
        w(ck, F);
        ck.prototype.handleEvent = function(a) {
            if ("input" == a.type) z && sc(10) && 0 == a.keyCode && 0 == a.j || (dk(this), Be(this, ek(a)));
            else if ("keydown" != a.type || Lj(a)) {
                var b = "keydown" == a.type ? this.f.value : null;
                z && 229 == a.keyCode && (b = null);
                var c = ek(a);
                dk(this);
                this.a = Xj(function() { this.a = null;
                        this.f.value != b && Be(this, c) },
                    this)
            }
        };

        function dk(a) { null != a.a && (p.clearTimeout(a.a), a.a = null) }

        function ek(a) { a = new ce(a.a);
            a.type = "input"; return a }
        ck.prototype.m = function() { ck.M.m.call(this);
            this.h.o();
            dk(this);
            delete this.f };

        function fk(a, b) { F.call(this);
            a && (this.Pa && gk(this), this.qa = a, this.Oa = oe(this.qa, "keypress", this, b), this.Za = oe(this.qa, "keydown", this.Ib, b, this), this.Pa = oe(this.qa, "keyup", this.Jb, b, this)) }
        w(fk, F);
        l = fk.prototype;
        l.qa = null;
        l.Oa = null;
        l.Za = null;
        l.Pa = null;
        l.T = -1;
        l.W = -1;
        l.Va = !1;
        var hk = {
                3: 13,
                12: 144,
                63232: 38,
                63233: 40,
                63234: 37,
                63235: 39,
                63236: 112,
                63237: 113,
                63238: 114,
                63239: 115,
                63240: 116,
                63241: 117,
                63242: 118,
                63243: 119,
                63244: 120,
                63245: 121,
                63246: 122,
                63247: 123,
                63248: 44,
                63272: 46,
                63273: 36,
                63275: 35,
                63276: 33,
                63277: 34,
                63289: 144,
                63302: 45
            },
            ik = { Up: 38, Down: 40, Left: 37, Right: 39, Enter: 13, F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123, "U+007F": 46, Home: 36, End: 35, PageUp: 33, PageDown: 34, Insert: 45 },
            jk = !kc || sc("525"),
            kk = mc && jc;
        l = fk.prototype;
        l.Ib = function(a) {
            if (kc || hc)
                if (17 == this.T && !a.ctrlKey || 18 ==
                    this.T && !a.altKey || mc && 91 == this.T && !a.metaKey) this.W = this.T = -1; - 1 == this.T && (a.ctrlKey && 17 != a.keyCode ? this.T = 17 : a.altKey && 18 != a.keyCode ? this.T = 18 : a.metaKey && 91 != a.keyCode && (this.T = 91));
            jk && !Nj(a.keyCode, this.T, a.shiftKey, a.ctrlKey, a.altKey, a.metaKey) ? this.handleEvent(a) : (this.W = Oj(a.keyCode), kk && (this.Va = a.altKey))
        };
        l.Jb = function(a) { this.W = this.T = -1;
            this.Va = a.altKey };
        l.handleEvent = function(a) {
            var b = a.a,
                c = b.altKey;
            if (z && "keypress" == a.type) { var d = this.W; var e = 13 != d && 27 != d ? b.keyCode : 0 } else(kc || hc) && "keypress" ==
                a.type ? (d = this.W, e = 0 <= b.charCode && 63232 > b.charCode && Mj(d) ? b.charCode : 0) : gc && !kc ? (d = this.W, e = Mj(d) ? b.keyCode : 0) : ("keypress" == a.type ? (kk && (c = this.Va), b.keyCode == b.charCode ? 32 > b.keyCode ? (d = b.keyCode, e = 0) : (d = this.W, e = b.charCode) : (d = b.keyCode || this.W, e = b.charCode || 0)) : (d = b.keyCode || this.W, e = b.charCode || 0), mc && 63 == e && 224 == d && (d = 191));
            var f = d = Oj(d);
            d ? 63232 <= d && d in hk ? f = hk[d] : 25 == d && a.shiftKey && (f = 9) : b.keyIdentifier && b.keyIdentifier in ik && (f = ik[b.keyIdentifier]);
            jc && jk && "keypress" == a.type && !Nj(f, this.T,
                a.shiftKey, a.ctrlKey, c, a.metaKey) || (a = f == this.T, this.T = f, b = new lk(f, e, a, b), b.altKey = c, Be(this, b))
        };
        l.R = function() { return this.qa };

        function gk(a) { a.Oa && (xe(a.Oa), xe(a.Za), xe(a.Pa), a.Oa = null, a.Za = null, a.Pa = null);
            a.qa = null;
            a.T = -1;
            a.W = -1 }
        l.m = function() { fk.M.m.call(this);
            gk(this) };

        function lk(a, b, c, d) { ce.call(this, d);
            this.type = "key";
            this.keyCode = a;
            this.j = b;
            this.repeat = c }
        w(lk, ce);

        function mk(a, b, c, d) { this.top = a;
            this.right = b;
            this.bottom = c;
            this.left = d }
        mk.prototype.toString = function() {
            return "(" + this.top + "t, " +
                this.right + "r, " + this.bottom + "b, " + this.left + "l)"
        };
        mk.prototype.ceil = function() { this.top = Math.ceil(this.top);
            this.right = Math.ceil(this.right);
            this.bottom = Math.ceil(this.bottom);
            this.left = Math.ceil(this.left); return this };
        mk.prototype.floor = function() { this.top = Math.floor(this.top);
            this.right = Math.floor(this.right);
            this.bottom = Math.floor(this.bottom);
            this.left = Math.floor(this.left); return this };
        mk.prototype.round = function() {
            this.top = Math.round(this.top);
            this.right = Math.round(this.right);
            this.bottom =
                Math.round(this.bottom);
            this.left = Math.round(this.left);
            return this
        };

        function nk(a, b) { var c = Xc(a); return c.defaultView && c.defaultView.getComputedStyle && (a = c.defaultView.getComputedStyle(a, null)) ? a[b] || a.getPropertyValue(b) || "" : "" }

        function ok(a) { try { var b = a.getBoundingClientRect() } catch (c) { return { left: 0, top: 0, right: 0, bottom: 0 } }
            z && a.ownerDocument.body && (a = a.ownerDocument, b.left -= a.documentElement.clientLeft + a.body.clientLeft, b.top -= a.documentElement.clientTop + a.body.clientTop); return b }

        function pk(a,
            b) {
            b = b || cd(document);
            var c = b || cd(document);
            var d = qk(a),
                e = qk(c);
            if (!z || 9 <= Number(tc)) { g = nk(c, "borderLeftWidth"); var f = nk(c, "borderRightWidth");
                h = nk(c, "borderTopWidth");
                k = nk(c, "borderBottomWidth");
                f = new mk(parseFloat(h), parseFloat(f), parseFloat(k), parseFloat(g)) } else { var g = rk(c, "borderLeft");
                f = rk(c, "borderRight"); var h = rk(c, "borderTop"),
                    k = rk(c, "borderBottom");
                f = new mk(h, f, k, g) }
            c == cd(document) ? (g = d.a - c.scrollLeft, d = d.f - c.scrollTop, !z || 10 <= Number(tc) || (g += f.left, d += f.top)) : (g = d.a - e.a - f.left, d = d.f - e.f -
                f.top);
            e = a.offsetWidth;
            f = a.offsetHeight;
            h = kc && !e && !f;
            na(e) && !h || !a.getBoundingClientRect ? a = new Uc(e, f) : (a = ok(a), a = new Uc(a.right - a.left, a.bottom - a.top));
            e = c.clientHeight - a.height;
            f = c.scrollLeft;
            h = c.scrollTop;
            f += Math.min(g, Math.max(g - (c.clientWidth - a.width), 0));
            h += Math.min(d, Math.max(d - e, 0));
            c = new Tc(f, h);
            b.scrollLeft = c.a;
            b.scrollTop = c.f
        }

        function qk(a) {
            var b = Xc(a),
                c = new Tc(0, 0);
            var d = b ? Xc(b) : document;
            d = !z || 9 <= Number(tc) || "CSS1Compat" == Vc(d).a.compatMode ? d.documentElement : d.body;
            if (a == d) return c;
            a =
                ok(a);
            d = Vc(b).a;
            b = cd(d);
            d = d.parentWindow || d.defaultView;
            b = z && sc("10") && d.pageYOffset != b.scrollTop ? new Tc(b.scrollLeft, b.scrollTop) : new Tc(d.pageXOffset || b.scrollLeft, d.pageYOffset || b.scrollTop);
            c.a = a.left + b.a;
            c.f = a.top + b.f;
            return c
        }
        var sk = { thin: 2, medium: 4, thick: 6 };

        function rk(a, b) {
            if ("none" == (a.currentStyle ? a.currentStyle[b + "Style"] : null)) return 0;
            var c = a.currentStyle ? a.currentStyle[b + "Width"] : null;
            if (c in sk) a = sk[c];
            else if (/^\d+px?$/.test(c)) a = parseInt(c, 10);
            else {
                b = a.style.left;
                var d = a.runtimeStyle.left;
                a.runtimeStyle.left = a.currentStyle.left;
                a.style.left = c;
                c = a.style.pixelLeft;
                a.style.left = b;
                a.runtimeStyle.left = d;
                a = +c
            }
            return a
        }

        function tk() {}
        ra(tk);
        tk.prototype.a = 0;

        function uk(a) { F.call(this);
            this.s = a || Vc();
            this.eb = null;
            this.na = !1;
            this.f = null;
            this.L = void 0;
            this.oa = this.Ca = this.X = null }
        w(uk, F);
        l = uk.prototype;
        l.Kb = tk.Ya();
        l.R = function() { return this.f };

        function L(a, b) { return a.f ? $c(b, a.f || a.s.a) : null }

        function vk(a) { a.L || (a.L = new Yj(a)); return a.L }
        l.$a = function(a) {
            if (this.X && this.X != a) throw Error("Method not supported");
            uk.M.$a.call(this, a)
        };
        l.lb = function() { this.f = this.s.a.createElement("DIV") };
        l.render = function(a) { if (this.na) throw Error("Component already rendered");
            this.f || this.lb();
            a ? a.insertBefore(this.f, null) : this.s.a.body.appendChild(this.f);
            this.X && !this.X.na || this.v() };
        l.v = function() { this.na = !0;
            wk(this, function(a) {!a.na && a.R() && a.v() }) };
        l.ya = function() { wk(this, function(a) { a.na && a.ya() });
            this.L && bk(this.L);
            this.na = !1 };
        l.m = function() {
            this.na && this.ya();
            this.L && (this.L.o(), delete this.L);
            wk(this, function(a) { a.o() });
            this.f && dd(this.f);
            this.X = this.f = this.oa = this.Ca = null;
            uk.M.m.call(this)
        };

        function wk(a, b) { a.Ca && Ja(a.Ca, b, void 0) }
        l.removeChild = function(a, b) { if (a) { var c = r(a) ? a : a.eb || (a.eb = ":" + (a.Kb.a++).toString(36));
                this.oa && c ? (a = this.oa, a = (null !== a && c in a ? a[c] : void 0) || null) : a = null; if (c && a) { var d = this.oa;
                    c in d && delete d[c];
                    Ra(this.Ca, a);
                    b && (a.ya(), a.f && dd(a.f));
                    b = a; if (null == b) throw Error("Unable to set parent component");
                    b.X = null;
                    uk.M.$a.call(b, null) } } if (!a) throw Error("Child is not in parent component"); return a };

        function M(a, b) { var c = fd(a, "firebaseui-textfield");
            b ? (Ij(a, "firebaseui-input-invalid"), Hj(a, "firebaseui-input"), c && Ij(c, "firebaseui-textfield-invalid")) : (Ij(a, "firebaseui-input"), Hj(a, "firebaseui-input-invalid"), c && Hj(c, "firebaseui-textfield-invalid")) }

        function xk(a, b, c) { b = new ck(b);
            Wd(a, Ba(Xd, b));
            ak(vk(a), b, "input", c) }

        function yk(a, b, c) { b = new fk(b);
            Wd(a, Ba(Xd, b));
            ak(vk(a), b, "key", function(d) { 13 == d.keyCode && (d.stopPropagation(), d.preventDefault(), c(d)) }) }

        function zk(a, b, c) {
            b = new Uj(b);
            Wd(a, Ba(Xd,
                b));
            ak(vk(a), b, "focusin", c)
        }

        function Ak(a, b, c) { b = new Uj(b);
            Wd(a, Ba(Xd, b));
            ak(vk(a), b, "focusout", c) }

        function N(a, b, c) { b = new Qj(b);
            Wd(a, Ba(Xd, b));
            ak(vk(a), b, "action", function(d) { d.stopPropagation();
                d.preventDefault();
                c(d) }) }

        function Bk(a) { Hj(a, "firebaseui-hidden") }

        function Ck(a, b) { b && ed(a, b);
            Ij(a, "firebaseui-hidden") }

        function Dk(a) { return !Gj(a, "firebaseui-hidden") && "none" != a.style.display }

        function Ek(a) {
            a = a || {};
            var b = a.email,
                c = a.disabled,
                d = '<div class="firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-email-input">';
            d = a.vc ? d + "Enter new email address" : d + "Email";
            d += '</label><input type="email" name="email" id="ui-sign-in-email-input" autocomplete="username" class="mdl-textfield__input firebaseui-input firebaseui-id-email" value="' + yd(null != b ? b : "") + '"' + (c ? "disabled" : "") + '></div><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-id-email-error"></p></div>';
            return B(d)
        }

        function Fk(a) {
            a = a || {};
            a = a.label;
            var b = '<button type="submit" class="firebaseui-id-submit firebaseui-button mdl-button mdl-js-button mdl-button--raised mdl-button--colored">';
            b = a ? b + A(a) : b + "Next";
            return B(b + "</button>")
        }

        function Gk() { var a = "" + Fk({ label: D("Sign In") }); return B(a) }

        function Hk() { var a = "" + Fk({ label: D("Save") }); return B(a) }

        function Ik() { var a = "" + Fk({ label: D("Continue") }); return B(a) }

        function Jk(a) {
            a = a || {};
            a = a.label;
            var b = '<div class="firebaseui-new-password-component"><div class="firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-new-password-input">';
            b = a ? b +
                A(a) : b + "Choose password";
            return B(b + '</label><input type="password" name="newPassword" id="ui-sign-in-new-password-input" autocomplete="new-password" class="mdl-textfield__input firebaseui-input firebaseui-id-new-password"></div><a href="javascript:void(0)" class="firebaseui-input-floating-button firebaseui-id-password-toggle firebaseui-input-toggle-on firebaseui-input-toggle-blur"></a><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-id-new-password-error"></p></div></div>')
        }

        function Kk() { var a = {}; var b = '<div class="firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-password-input">';
            b = a.current ? b + "Current password" : b + "Password"; return B(b + '</label><input type="password" name="password" id="ui-sign-in-password-input" autocomplete="current-password" class="mdl-textfield__input firebaseui-input firebaseui-id-password"></div><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-id-password-error"></p></div>') }

        function Lk() { return B('<a class="firebaseui-link firebaseui-id-secondary-link" href="javascript:void(0)">Trouble signing in?</a>') }

        function Mk(a) { a = a || {};
            a = a.label; var b = '<button class="firebaseui-id-secondary-link firebaseui-button mdl-button mdl-js-button mdl-button--primary">';
            b = a ? b + A(a) : b + "Cancel"; return B(b + "</button>") }

        function Nk(a) {
            var b = "";
            a.G && a.F && (b += '<ul class="firebaseui-tos-list firebaseui-tos"><li class="firebaseui-inline-list-item"><a href="javascript:void(0)" class="firebaseui-link firebaseui-tos-link" target="_blank">Terms of Service</a></li><li class="firebaseui-inline-list-item"><a href="javascript:void(0)" class="firebaseui-link firebaseui-pp-link" target="_blank">Privacy Policy</a></li></ul>');
            return B(b)
        }

        function Ok(a) { var b = "";
            a.G && a.F && (b += '<p class="firebaseui-tos firebaseui-tospp-full-message">By continuing, you are indicating that you accept our <a href="javascript:void(0)" class="firebaseui-link firebaseui-tos-link" target="_blank">Terms of Service</a> and <a href="javascript:void(0)" class="firebaseui-link firebaseui-pp-link" target="_blank">Privacy Policy</a>.</p>'); return B(b) }

        function Pk(a) {
            a = '<div class="firebaseui-info-bar firebaseui-id-info-bar"><p class="firebaseui-info-bar-message">' +
                A(a.message) + '&nbsp;&nbsp;<a href="javascript:void(0)" class="firebaseui-link firebaseui-id-dismiss-info-bar">Dismiss</a></p></div>';
            return B(a)
        }
        Pk.A = "firebaseui.auth.soy2.element.infoBar";

        function Qk(a) { var b = a.content;
            a = a.Bb; return B('<dialog class="mdl-dialog firebaseui-dialog firebaseui-id-dialog' + (a ? " " + yd(a) : "") + '">' + A(b) + "</dialog>") }

        function Rk(a) {
            var b = a.message;
            return B(Qk({
                content: xd('<div class="firebaseui-dialog-icon-wrapper"><div class="' + yd(a.Ma) + ' firebaseui-dialog-icon"></div></div><div class="firebaseui-progress-dialog-message">' +
                    A(b) + "</div>")
            }))
        }
        Rk.A = "firebaseui.auth.soy2.element.progressDialog";

        function Sk(a) {
            var b = '<div class="firebaseui-list-box-actions">';
            a = a.items;
            for (var c = a.length, d = 0; d < c; d++) {
                var e = a[d];
                b += '<button type="button" data-listboxid="' + yd(e.id) + '" class="mdl-button firebaseui-id-list-box-dialog-button firebaseui-list-box-dialog-button">' + (e.Ma ? '<div class="firebaseui-list-box-icon-wrapper"><div class="firebaseui-list-box-icon ' + yd(e.Ma) + '"></div></div>' : "") + '<div class="firebaseui-list-box-label-wrapper">' +
                    A(e.label) + "</div></button>"
            }
            b = "" + Qk({ Bb: D("firebaseui-list-box-dialog"), content: xd(b + "</div>") });
            return B(b)
        }
        Sk.A = "firebaseui.auth.soy2.element.listBoxDialog";

        function Tk(a) { a = a || {}; return B(a.vb ? '<div class="mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active firebaseui-busy-indicator firebaseui-id-busy-indicator"></div>' : '<div class="mdl-progress mdl-js-progress mdl-progress__indeterminate firebaseui-busy-indicator firebaseui-id-busy-indicator"></div>') }
        Tk.A = "firebaseui.auth.soy2.element.busyIndicator";

        function Uk(a, b) { a = a || {};
            a = a.ga; return C(a.rb ? a.rb : b.ib[a.providerId] ? "" + b.ib[a.providerId] : 0 == ("" + a.providerId).indexOf("saml.") ? ("" + a.providerId).substring(5) : 0 == ("" + a.providerId).indexOf("oidc.") ? ("" + a.providerId).substring(5) : "" + a.providerId) }

        function Vk(a) { Wk(a, "upgradeElement") }

        function Xk(a) { Wk(a, "downgradeElements") }
        var Yk = ["mdl-js-textfield", "mdl-js-progress", "mdl-js-spinner", "mdl-js-button"];

        function Wk(a, b) {
            a && window.componentHandler && window.componentHandler[b] && Ja(Yk, function(c) {
                if (Gj(a,
                        c)) window.componentHandler[b](a);
                Ja(Yc(c, a), function(d) { window.componentHandler[b](d) })
            })
        }

        function Zk(a, b, c) {
            $k.call(this);
            document.body.appendChild(a);
            a.showModal || window.dialogPolyfill.registerDialog(a);
            a.showModal();
            Vk(a);
            b && N(this, a, function(f) { var g = a.getBoundingClientRect();
                (f.clientX < g.left || g.left + g.width < f.clientX || f.clientY < g.top || g.top + g.height < f.clientY) && $k.call(this) });
            if (!c) {
                var d = this.R().parentElement || this.R().parentNode;
                if (d) {
                    var e = this;
                    this.da = function() {
                        if (a.open) {
                            var f = a.getBoundingClientRect().height,
                                g = d.getBoundingClientRect().height,
                                h = d.getBoundingClientRect().top - document.body.getBoundingClientRect().top,
                                k = d.getBoundingClientRect().left - document.body.getBoundingClientRect().left,
                                m = a.getBoundingClientRect().width,
                                q = d.getBoundingClientRect().width;
                            a.style.top = (h + (g - f) / 2).toString() + "px";
                            f = k + (q - m) / 2;
                            a.style.left = f.toString() + "px";
                            a.style.right = (document.body.getBoundingClientRect().width - f - m).toString() + "px"
                        } else window.removeEventListener("resize", e.da)
                    };
                    this.da();
                    window.addEventListener("resize",
                        this.da, !1)
                }
            }
        }

        function $k() { var a = al.call(this);
            a && (Xk(a), a.open && a.close(), dd(a), this.da && window.removeEventListener("resize", this.da)) }

        function al() { return $c("firebaseui-id-dialog") }

        function bl() { dd(cl.call(this)) }

        function cl() { return L(this, "firebaseui-id-info-bar") }

        function dl() { return L(this, "firebaseui-id-dismiss-info-bar") }
        var el = {
            xa: {
                "google.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                "github.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/github.svg",
                "facebook.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg",
                "twitter.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/twitter.svg",
                password: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg",
                phone: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/phone.svg",
                anonymous: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/anonymous.png",
                "microsoft.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/microsoft.svg",
                "yahoo.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/yahoo.svg",
                "apple.com": "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/apple.png",
                saml: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/saml.svg",
                oidc: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/oidc.svg"
            },
            wa: { "google.com": "#ffffff", "github.com": "#333333", "facebook.com": "#3b5998", "twitter.com": "#55acee", password: "#db4437", phone: "#02bd7e", anonymous: "#f4b400", "microsoft.com": "#2F2F2F", "yahoo.com": "#720E9E", "apple.com": "#000000", saml: "#007bff", oidc: "#007bff" },
            ib: {
                "google.com": "Google",
                "github.com": "GitHub",
                "facebook.com": "Facebook",
                "twitter.com": "Twitter",
                password: "Password",
                phone: "Phone",
                anonymous: "Guest",
                "microsoft.com": "Microsoft",
                "yahoo.com": "Yahoo",
                "apple.com": "Apple"
            }
        };

        function fl(a, b, c) { be.call(this, a, b); for (var d in c) this[d] = c[d] }
        w(fl, be);

        function O(a, b, c, d, e) { uk.call(this, c);
            this.gb = a;
            this.fb = b;
            this.Da = !1;
            this.Ea = d || null;
            this.w = this.ca = null;
            this.Y = jb(el);
            lb(this.Y, e || {}) }
        w(O, uk);
        l = O.prototype;
        l.lb = function() { var a = md(this.gb, this.fb, this.Y, this.s);
            Vk(a);
            this.f = a };
        l.v =
            function() { O.M.v.call(this);
                Fe(P(this), new fl("pageEnter", P(this), { pageId: this.Ea })); if (this.cb() && this.Y.G) { var a = this.Y.G;
                    N(this, this.cb(), function() { a() }) } if (this.bb() && this.Y.F) { var b = this.Y.F;
                    N(this, this.bb(), function() { b() }) } };
        l.ya = function() { Fe(P(this), new fl("pageExit", P(this), { pageId: this.Ea }));
            O.M.ya.call(this) };
        l.m = function() { window.clearTimeout(this.ca);
            this.fb = this.gb = this.ca = null;
            this.Da = !1;
            this.w = null;
            Xk(this.R());
            O.M.m.call(this) };

        function gl(a) {
            a.Da = !0;
            var b = Gj(a.R(), "firebaseui-use-spinner");
            a.ca = window.setTimeout(function() { a.R() && null === a.w && (a.w = md(Tk, { vb: b }, null, a.s), a.R().appendChild(a.w), Vk(a.w)) }, 500)
        }
        l.K = function(a, b, c, d) {
            function e() { if (f.O) return null;
                f.Da = !1;
                window.clearTimeout(f.ca);
                f.ca = null;
                f.w && (Xk(f.w), dd(f.w), f.w = null) } var f = this; if (f.Da) return null;
            gl(f); return a.apply(null, b).then(c, d).then(e, e) };

        function P(a) { return a.R().parentElement || a.R().parentNode }

        function hl(a, b, c) { yk(a, b, function() { c.focus() }) }

        function il(a, b, c) { yk(a, b, function() { c() }) }
        u(O.prototype, {
            a: function(a) {
                bl.call(this);
                var b = md(Pk, { message: a }, null, this.s);
                this.R().appendChild(b);
                N(this, dl.call(this), function() { dd(b) })
            },
            xc: bl,
            zc: cl,
            yc: dl,
            Z: function(a, b) { a = md(Rk, { Ma: a, message: b }, null, this.s);
                Zk.call(this, a) },
            h: $k,
            Db: al,
            Bc: function() { return L(this, "firebaseui-tos") },
            cb: function() { return L(this, "firebaseui-tos-link") },
            bb: function() { return L(this, "firebaseui-pp-link") },
            Cc: function() { return L(this, "firebaseui-tos-list") }
        });

        function jl(a, b, c) {
            a = a || {};
            b = a.Wa;
            var d = a.ia;
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-sign-in"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in with email</h1></div><div class="firebaseui-card-content"><div class="firebaseui-relative-wrapper">' +
                Ek(a) + '</div></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + (b ? Mk(null) : "") + Fk(null) + '</div></div><div class="firebaseui-card-footer">' + (d ? Ok(c) : Nk(c)) + "</div></form></div>";
            return B(a)
        }
        jl.A = "firebaseui.auth.soy2.page.signIn";

        function kl(a, b, c) {
            a = a || {};
            b = a.ia;
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-sign-in"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content">' +
                Ek(a) + Kk() + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-links">' + Lk() + '</div><div class="firebaseui-form-actions">' + Gk() + '</div></div><div class="firebaseui-card-footer">' + (b ? Ok(c) : Nk(c)) + "</div></form></div>";
            return B(a)
        }
        kl.A = "firebaseui.auth.soy2.page.passwordSignIn";

        function ll(a, b, c) {
            a = a || {};
            var d = a.Sb;
            b = a.Ua;
            var e = a.ia,
                f = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-sign-up"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Create account</h1></div><div class="firebaseui-card-content">' +
                Ek(a);
            d ? (a = a || {}, a = a.name, a = '<div class="firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-name-input">First &amp; last name</label><input type="text" name="name" id="ui-sign-in-name-input" autocomplete="name" class="mdl-textfield__input firebaseui-input firebaseui-id-name" value="' + yd(null != a ? a : "") + '"></div><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-id-name-error"></p></div>',
                a = B(a)) : a = "";
            c = f + a + Jk(null) + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + (b ? Mk(null) : "") + Hk() + '</div></div><div class="firebaseui-card-footer">' + (e ? Ok(c) : Nk(c)) + "</div></form></div>";
            return B(c)
        }
        ll.A = "firebaseui.auth.soy2.page.passwordSignUp";

        function ml(a, b, c) {
            a = a || {};
            b = a.Ua;
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-recovery"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Recover password</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Get instructions sent to this email that explain how to reset your password</p>' +
                Ek(a) + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + (b ? Mk(null) : "") + Fk({ label: D("Send") }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(a)
        }
        ml.A = "firebaseui.auth.soy2.page.passwordRecovery";

        function nl(a, b, c) {
            b = a.H;
            var d = "";
            a = "Follow the instructions sent to <strong>" + (A(a.email) + "</strong> to recover your password");
            d += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-recovery-email-sent"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Check your email</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' +
                a + '</p></div><div class="firebaseui-card-actions">';
            b && (d += '<div class="firebaseui-form-actions">' + Fk({ label: D("Done") }) + "</div>");
            d += '</div><div class="firebaseui-card-footer">' + Nk(c) + "</div></div>";
            return B(d)
        }
        nl.A = "firebaseui.auth.soy2.page.passwordRecoveryEmailSent";

        function ol(a, b, c) { return B('<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-callback"><div class="firebaseui-callback-indicator-container">' + Tk(null, null, c) + "</div></div>") }
        ol.A = "firebaseui.auth.soy2.page.callback";

        function pl(a, b, c) { return B('<div class="firebaseui-container firebaseui-id-page-spinner">' + Tk({ vb: !0 }, null, c) + "</div>") }
        pl.A = "firebaseui.auth.soy2.page.spinner";

        function ql() { return B('<div class="firebaseui-container firebaseui-id-page-blank firebaseui-use-spinner"></div>') }
        ql.A = "firebaseui.auth.soy2.page.blank";

        function rl(a, b, c) {
            b = "";
            a = "A sign-in email with additional instructions was sent to <strong>" + (A(a.email) + "</strong>. Check your email to complete sign-in.");
            var d = B('<a class="firebaseui-link firebaseui-id-trouble-getting-email-link" href="javascript:void(0)">Trouble getting email?</a>');
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-link-sign-in-sent"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign-in email sent</h1></div><div class="firebaseui-card-content"><div class="firebaseui-email-sent"></div><p class="firebaseui-text">' + a + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-links">' + d + '</div><div class="firebaseui-form-actions">' + Mk({ label: D("Back") }) + '</div></div><div class="firebaseui-card-footer">' +
                Nk(c) + "</div></form></div>";
            return B(b)
        }
        rl.A = "firebaseui.auth.soy2.page.emailLinkSignInSent";

        function sl(a, b, c) {
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-not-received"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Trouble getting email?</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Try these common fixes:<ul><li>Check if the email was marked as spam or filtered.</li><li>Check your internet connection.</li><li>Check that you did not misspell your email.</li><li>Check that your inbox space is not running out or other inbox settings related issues.</li></ul></p><p class="firebaseui-text">If the steps above didn\'t work, you can resend the email. Note that this will deactivate the link in the older email.</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-links">' +
                B('<a class="firebaseui-link firebaseui-id-resend-email-link" href="javascript:void(0)">Resend</a>') + '</div><div class="firebaseui-form-actions">' + Mk({ label: D("Back") }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(a)
        }
        sl.A = "firebaseui.auth.soy2.page.emailNotReceived";

        function tl(a, b, c) {
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-link-sign-in-confirmation"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Confirm email</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Confirm your email to complete sign in</p><div class="firebaseui-relative-wrapper">' +
                Ek(a) + '</div></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Mk(null) + Fk(null) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(a)
        }
        tl.A = "firebaseui.auth.soy2.page.emailLinkSignInConfirmation";

        function ul() {
            var a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-different-device-error"><div class="firebaseui-card-header"><h1 class="firebaseui-title">New device or browser detected</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Try opening the link using the same device or browser where you started the sign-in process.</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' +
                Mk({ label: D("Dismiss") }) + "</div></div></div>";
            return B(a)
        }
        ul.A = "firebaseui.auth.soy2.page.differentDeviceError";

        function vl() {
            var a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-anonymous-user-mismatch"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Session ended</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">The session associated with this sign-in request has either expired or was cleared.</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' +
                Mk({ label: D("Dismiss") }) + "</div></div></div>";
            return B(a)
        }
        vl.A = "firebaseui.auth.soy2.page.anonymousUserMismatch";

        function wl(a, b, c) {
            b = "";
            a = "You\u2019ve already used <strong>" + (A(a.email) + "</strong> to sign in. Enter your password for that account.");
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-linking"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><h2 class="firebaseui-subtitle">You already have an account</h2><p class="firebaseui-text">' +
                a + "</p>" + Kk() + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-links">' + Lk() + '</div><div class="firebaseui-form-actions">' + Gk() + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        wl.A = "firebaseui.auth.soy2.page.passwordLinking";

        function xl(a, b, c) {
            var d = a.email;
            b = "";
            a = "" + Uk(a, c);
            a = D(a);
            d = "You\u2019ve already used <strong>" + (A(d) + ("</strong>. You can connect your <strong>" + (A(a) + ("</strong> account with <strong>" + (A(d) + "</strong> by signing in with email link below.")))));
            a = "For this flow to successfully connect your " + (A(a) + " account with this email, you have to open the link on the same device or browser.");
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-link-sign-in-linking"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><h2 class="firebaseui-subtitle">You already have an account</h2><p class="firebaseui-text firebaseui-text-justify">' +
                d + '<p class="firebaseui-text firebaseui-text-justify">' + a + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Gk() + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        xl.A = "firebaseui.auth.soy2.page.emailLinkSignInLinking";

        function yl(a, b, c) {
            b = "";
            var d = "" + Uk(a, c);
            d = D(d);
            a = "You originally intended to connect <strong>" + (A(d) + "</strong> to your email account but have opened the link on a different device where you are not signed in.");
            d = "If you still want to connect your <strong>" + (A(d) + "</strong> account, open the link on the same device where you started sign-in. Otherwise, tap Continue to sign-in on this device.");
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-link-sign-in-linking-different-device"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text firebaseui-text-justify">' +
                a + '</p><p class="firebaseui-text firebaseui-text-justify">' + d + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Ik() + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        yl.A = "firebaseui.auth.soy2.page.emailLinkSignInLinkingDifferentDevice";

        function zl(a, b, c) {
            var d = a.email;
            b = "";
            a = "" + Uk(a, c);
            a = D(a);
            d = "You\u2019ve already used <strong>" + (A(d) + ("</strong>. Sign in with " + (A(a) + " to continue.")));
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-federated-linking"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><h2 class="firebaseui-subtitle">You already have an account</h2><p class="firebaseui-text">' +
                d + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Fk({ label: D("Sign in with " + a) }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        zl.A = "firebaseui.auth.soy2.page.federatedLinking";

        function Al(a, b, c) {
            b = "";
            a = "To continue sign in with <strong>" + (A(a.email) + "</strong> on this device, you have to recover the password.");
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-unsupported-provider"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' +
                a + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Mk(null) + Fk({ label: D("Recover password") }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        Al.A = "firebaseui.auth.soy2.page.unsupportedProvider";

        function Bl(a) {
            var b = "",
                c = '<p class="firebaseui-text">for <strong>' + (A(a.email) + "</strong></p>");
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-reset"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Reset your password</h1></div><div class="firebaseui-card-content">' +
                c + Jk(wd(a)) + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Hk() + "</div></div></form></div>";
            return B(b)
        }
        Bl.A = "firebaseui.auth.soy2.page.passwordReset";

        function Cl(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-reset-success"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Password changed</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">You can now sign in with your new password</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Cl.A = "firebaseui.auth.soy2.page.passwordResetSuccess";

        function Dl(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-password-reset-failure"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Try resetting your password again</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Your request to reset your password has expired or the link has already been used</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Dl.A = "firebaseui.auth.soy2.page.passwordResetFailure";

        function El(a) {
            var b = a.H,
                c = "";
            a = "Your sign-in email address has been changed back to <strong>" + (A(a.email) + "</strong>.");
            c += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-change-revoke-success"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Updated email address</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' +
                a + '</p><p class="firebaseui-text">If you didn\u2019t ask to change your sign-in email, it\u2019s possible someone is trying to access your account and you should <a class="firebaseui-link firebaseui-id-reset-password-link" href="javascript:void(0)">change your password right away</a>.</p></div><div class="firebaseui-card-actions">' + (b ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></form></div>";
            return B(c)
        }
        El.A = "firebaseui.auth.soy2.page.emailChangeRevokeSuccess";

        function Fl(a) {
            a =
                a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-change-revoke-failure"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Unable to update your email address</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">There was a problem changing your sign-in email back.</p><p class="firebaseui-text">If you try again and still can\u2019t reset your email, try asking your administrator for help.</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Fl.A = "firebaseui.auth.soy2.page.emailChangeRevokeFailure";

        function Gl(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-verification-success"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Your email has been verified</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">You can now sign in with your new account</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Gl.A = "firebaseui.auth.soy2.page.emailVerificationSuccess";

        function Hl(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-verification-failure"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Try verifying your email again</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Your request to verify your email has expired or the link has already been used</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Hl.A = "firebaseui.auth.soy2.page.emailVerificationFailure";

        function Il(a) {
            var b = a.H,
                c = "";
            a = "You can now sign in with your new email <strong>" + (A(a.email) + "</strong>.");
            c += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-verify-and-change-email-success"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Your email has been verified and changed</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' +
                a + '</p></div><div class="firebaseui-card-actions">' + (b ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(c)
        }
        Il.A = "firebaseui.auth.soy2.page.verifyAndChangeEmailSuccess";

        function Jl(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-verify-and-change-email-failure"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Try updating your email again</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Your request to verify and update your email has expired or the link has already been used.</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Jl.A = "firebaseui.auth.soy2.page.verifyAndChangeEmailFailure";

        function Kl(a) {
            var b = a.factorId,
                c = a.phoneNumber;
            a = a.H;
            var d = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-revert-second-factor-addition-success"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Removed second factor</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">';
            switch (b) {
                case "phone":
                    b = "The <strong>" + (A(b) + (" " + (A(c) + "</strong> was removed as a second authentication step.")));
                    d += b; break;
                default:
                    d += "The device or app was removed as a second authentication step." }
            d += '</p><p class="firebaseui-text">If you don\'t recognize this device, someone might be trying to access your account. Consider <a class="firebaseui-link firebaseui-id-reset-password-link" href="javascript:void(0)">changing your password right away</a>.</p></div><div class="firebaseui-card-actions">' +
                (a ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></form></div>";
            return B(d)
        }
        Kl.A = "firebaseui.auth.soy2.page.revertSecondFactorAdditionSuccess";

        function Ll(a) {
            a = a || {};
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-revert-second-factor-addition-failure"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Couldn\'t remove your second factor</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">Something went wrong removing your second factor.</p><p class="firebaseui-text">Try removing it again. If that doesn\'t work, contact support for assistance.</p></div><div class="firebaseui-card-actions">' +
                (a.H ? '<div class="firebaseui-form-actions">' + Ik() + "</div>" : "") + "</div></div>";
            return B(a)
        }
        Ll.A = "firebaseui.auth.soy2.page.revertSecondFactorAdditionFailure";

        function Ml(a) {
            var b = a.Ab;
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-recoverable-error"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Error encountered</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' + A(a.errorMessage) + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">';
            b && (a += Fk({ label: D("Retry") }));
            return B(a + "</div></div></div>")
        }
        Ml.A = "firebaseui.auth.soy2.page.recoverableError";

        function Nl(a) { a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-unrecoverable-error"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Error encountered</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' + A(a.errorMessage) + "</p></div></div>"; return B(a) }
        Nl.A = "firebaseui.auth.soy2.page.unrecoverableError";

        function Ol(a,
            b, c) {
            var d = a.Pb;
            b = "";
            a = "Continue with " + (A(a.ic) + "?");
            d = "You originally wanted to sign in with " + A(d);
            b += '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-email-mismatch"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><h2 class="firebaseui-subtitle">' + a + '</h2><p class="firebaseui-text">' + d + '</p></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' +
                Mk(null) + Fk({ label: D("Continue") }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form></div>";
            return B(b)
        }
        Ol.A = "firebaseui.auth.soy2.page.emailMismatch";

        function Pl(a, b, c) {
            var d = '<div class="firebaseui-container firebaseui-page-provider-sign-in firebaseui-id-page-provider-sign-in firebaseui-use-spinner"><div class="firebaseui-card-content"><form onsubmit="return false;"><ul class="firebaseui-idp-list">';
            a = a.Rb;
            b = a.length;
            for (var e = 0; e < b; e++) {
                var f = { ga: a[e] };
                var g = c;
                f = f || {};
                var h =
                    f.ga,
                    k = f;
                k = k || {};
                var m = "";
                switch (k.ga.providerId) {
                    case "google.com":
                        m += "firebaseui-idp-google"; break;
                    case "github.com":
                        m += "firebaseui-idp-github"; break;
                    case "facebook.com":
                        m += "firebaseui-idp-facebook"; break;
                    case "twitter.com":
                        m += "firebaseui-idp-twitter"; break;
                    case "phone":
                        m += "firebaseui-idp-phone"; break;
                    case "anonymous":
                        m += "firebaseui-idp-anonymous"; break;
                    case "password":
                        m += "firebaseui-idp-password"; break;
                    default:
                        m += "firebaseui-idp-generic" }
                k = '<button class="firebaseui-idp-button mdl-button mdl-js-button mdl-button--raised ' +
                    yd(C(m)) + ' firebaseui-id-idp-button" data-provider-id="' + yd(h.providerId) + '" style="background-color:';
                m = (m = f) || {};
                m = m.ga;
                k = k + yd(Hd(C(m.Ga ? m.Ga : g.wa[m.providerId] ? "" + g.wa[m.providerId] : 0 == m.providerId.indexOf("saml.") ? "" + g.wa.saml : 0 == m.providerId.indexOf("oidc.") ? "" + g.wa.oidc : "" + g.wa.password))) + '"><span class="firebaseui-idp-icon-wrapper"><img class="firebaseui-idp-icon" alt="" src="';
                var q = f;
                m = g;
                q = q || {};
                q = q.ga;
                m = vd(q.Na ? Dd(q.Na) : m.xa[q.providerId] ? Dd(m.xa[q.providerId]) : 0 == q.providerId.indexOf("saml.") ?
                    Dd(m.xa.saml) : 0 == q.providerId.indexOf("oidc.") ? Dd(m.xa.oidc) : Dd(m.xa.password));
                k = k + yd(Dd(m)) + '"></span>';
                "password" == h.providerId ? k += '<span class="firebaseui-idp-text firebaseui-idp-text-long">Sign in with email</span><span class="firebaseui-idp-text firebaseui-idp-text-short">Email</span>' : "phone" == h.providerId ? k += '<span class="firebaseui-idp-text firebaseui-idp-text-long">Sign in with phone</span><span class="firebaseui-idp-text firebaseui-idp-text-short">Phone</span>' : "anonymous" == h.providerId ?
                    k += '<span class="firebaseui-idp-text firebaseui-idp-text-long">Continue as guest</span><span class="firebaseui-idp-text firebaseui-idp-text-short">Guest</span>' : (h = "Sign in with " + A(Uk(f, g)), k += '<span class="firebaseui-idp-text firebaseui-idp-text-long">' + h + '</span><span class="firebaseui-idp-text firebaseui-idp-text-short">' + A(Uk(f, g)) + "</span>");
                f = B(k + "</button>");
                d += '<li class="firebaseui-list-item">' + f + "</li>"
            }
            d += '</ul></form></div><div class="firebaseui-card-footer firebaseui-provider-sign-in-footer">' +
                Ok(c) + "</div></div>";
            return B(d)
        }
        Pl.A = "firebaseui.auth.soy2.page.providerSignIn";

        function Ql(a, b, c) {
            a = a || {};
            var d = a.Fb,
                e = a.Wa;
            b = a.ia;
            a = a || {};
            a = a.za;
            a = '<div class="firebaseui-phone-number"><button class="firebaseui-id-country-selector firebaseui-country-selector mdl-button mdl-js-button"><span class="firebaseui-flag firebaseui-country-selector-flag firebaseui-id-country-selector-flag"></span><span class="firebaseui-id-country-selector-code"></span></button><div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label firebaseui-textfield firebaseui-phone-input-wrapper"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-phone-number-input">Phone number</label><input type="tel" name="phoneNumber" id="ui-sign-in-phone-number-input" class="mdl-textfield__input firebaseui-input firebaseui-id-phone-number" value="' +
                yd(null != a ? a : "") + '"></div></div><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-phone-number-error firebaseui-id-phone-number-error"></p></div>';
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-phone-sign-in-start"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Enter your phone number</h1></div><div class="firebaseui-card-content"><div class="firebaseui-relative-wrapper">' +
                B(a);
            var f;
            d ? f = B('<div class="firebaseui-recaptcha-wrapper"><div class="firebaseui-recaptcha-container"></div><div class="firebaseui-error-wrapper firebaseui-recaptcha-error-wrapper"><p class="firebaseui-error firebaseui-hidden firebaseui-id-recaptcha-error"></p></div></div>') : f = "";
            f = a + f + '</div></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + (e ? Mk(null) : "") + Fk({ label: D("Verify") }) + '</div></div><div class="firebaseui-card-footer">';
            b ? (b = '<p class="firebaseui-tos firebaseui-phone-tos">',
                    b = c.G && c.F ? b + 'By tapping Verify, you are indicating that you accept our <a href="javascript:void(0)" class="firebaseui-link firebaseui-tos-link" target="_blank">Terms of Service</a> and <a href="javascript:void(0)" class="firebaseui-link firebaseui-pp-link" target="_blank">Privacy Policy</a>. An SMS may be sent. Message &amp; data rates may apply.' : b + "By tapping Verify, an SMS may be sent. Message &amp; data rates may apply.", c = B(b + "</p>")) : c = B('<p class="firebaseui-tos firebaseui-phone-sms-notice">By tapping Verify, an SMS may be sent. Message &amp; data rates may apply.</p>') +
                Nk(c);
            return B(f + c + "</div></form></div>")
        }
        Ql.A = "firebaseui.auth.soy2.page.phoneSignInStart";

        function Rl(a, b, c) {
            a = a || {};
            b = a.phoneNumber;
            var d = "";
            a = 'Enter the 6-digit code we sent to <a class="firebaseui-link firebaseui-change-phone-number-link firebaseui-id-change-phone-number-link" href="javascript:void(0)">&lrm;' + (A(b) + "</a>");
            A(b);
            b = d;
            d = B('<div class="firebaseui-textfield mdl-textfield mdl-js-textfield mdl-textfield--floating-label"><label class="mdl-textfield__label firebaseui-label" for="ui-sign-in-phone-confirmation-code-input">6-digit code</label><input type="number" name="phoneConfirmationCode" id="ui-sign-in-phone-confirmation-code-input" class="mdl-textfield__input firebaseui-input firebaseui-id-phone-confirmation-code"></div><div class="firebaseui-error-wrapper"><p class="firebaseui-error firebaseui-text-input-error firebaseui-hidden firebaseui-id-phone-confirmation-code-error"></p></div>');
            c = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-phone-sign-in-finish"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Verify your phone number</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">' + a + "</p>" + d + '</div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Mk(null) + Fk({ label: D("Continue") }) + '</div></div><div class="firebaseui-card-footer">' + Nk(c) + "</div></form>";
            a = B('<div class="firebaseui-resend-container"><span class="firebaseui-id-resend-countdown"></span><a href="javascript:void(0)" class="firebaseui-id-resend-link firebaseui-hidden firebaseui-link">Resend</a></div>');
            return B(b + (c + a + "</div>"))
        }
        Rl.A = "firebaseui.auth.soy2.page.phoneSignInFinish";

        function Sl() { return B('<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-sign-out"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign Out</h1></div><div class="firebaseui-card-content"><p class="firebaseui-text">You are now successfully signed out.</p></div></div>') }
        Sl.A = "firebaseui.auth.soy2.page.signOut";

        function Tl(a, b, c) {
            var d = '<div class="firebaseui-container firebaseui-page-select-tenant firebaseui-id-page-select-tenant"><div class="firebaseui-card-content"><form onsubmit="return false;"><ul class="firebaseui-tenant-list">';
            a = a.dc;
            b = a.length;
            for (var e = 0; e < b; e++) {
                var f = a[e];
                var g = "",
                    h = "Sign in to " + A(f.displayName),
                    k = A(f.displayName),
                    m = f.tenantId ? f.tenantId : "top-level-project";
                m = D(m);
                g += '<button class="firebaseui-tenant-button mdl-button mdl-js-button mdl-button--raised firebaseui-tenant-selection-' +
                    yd(m) + ' firebaseui-id-tenant-selection-button"' + (f.tenantId ? 'data-tenant-id="' + yd(f.tenantId) + '"' : "") + 'style="background-color:' + yd(Hd(f.Ga)) + '"><span class="firebaseui-idp-icon-wrapper"><img class="firebaseui-idp-icon" alt="" src="' + yd(Dd(f.Na)) + '"></span><span class="firebaseui-idp-text firebaseui-idp-text-long">' + h + '</span><span class="firebaseui-idp-text firebaseui-idp-text-short">' + k + "</span></button>";
                f = B(g);
                d += '<li class="firebaseui-list-item">' + f + "</li>"
            }
            d += '</ul></form></div><div class="firebaseui-card-footer firebaseui-provider-sign-in-footer">' +
                Ok(c) + "</div></div>";
            return B(d)
        }
        Tl.A = "firebaseui.auth.soy2.page.selectTenant";

        function Ul(a, b, c) {
            a = '<div class="mdl-card mdl-shadow--2dp firebaseui-container firebaseui-id-page-provider-match-by-email"><form onsubmit="return false;"><div class="firebaseui-card-header"><h1 class="firebaseui-title">Sign in</h1></div><div class="firebaseui-card-content"><div class="firebaseui-relative-wrapper">' + Ek(null) + '</div></div><div class="firebaseui-card-actions"><div class="firebaseui-form-actions">' + Fk(null) +
                '</div></div><div class="firebaseui-card-footer">' + Ok(c) + "</div></form></div>";
            return B(a)
        }
        Ul.A = "firebaseui.auth.soy2.page.providerMatchByEmail";

        function Vl() { return L(this, "firebaseui-id-submit") }

        function Wl() { return L(this, "firebaseui-id-secondary-link") }

        function Xl(a, b) { N(this, Vl.call(this), function(d) { a(d) }); var c = Wl.call(this);
            c && b && N(this, c, function(d) { b(d) }) }

        function Yl() { return L(this, "firebaseui-id-password") }

        function Zl() { return L(this, "firebaseui-id-password-error") }

        function $l() {
            var a =
                Yl.call(this),
                b = Zl.call(this);
            xk(this, a, function() { Dk(b) && (M(a, !0), Bk(b)) })
        }

        function am() { var a = Yl.call(this); var b = Zl.call(this);
            Jj(a) ? (M(a, !0), Bk(b), b = !0) : (M(a, !1), Ck(b, C("Enter your password").toString()), b = !1); return b ? Jj(a) : null }

        function bm(a, b, c, d, e, f) { O.call(this, wl, { email: a }, f, "passwordLinking", { G: d, F: e });
            this.B = b;
            this.J = c }
        n(bm, O);
        bm.prototype.v = function() { this.S();
            this.P(this.B, this.J);
            il(this, this.i(), this.B);
            this.i().focus();
            O.prototype.v.call(this) };
        bm.prototype.m = function() {
            this.B = null;
            O.prototype.m.call(this)
        };
        bm.prototype.j = function() { return Jj(L(this, "firebaseui-id-email")) };
        u(bm.prototype, { i: Yl, D: Zl, S: $l, u: am, ea: Vl, ba: Wl, P: Xl });
        var cm = /^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/;

        function dm() { return L(this, "firebaseui-id-email") }

        function em() { return L(this, "firebaseui-id-email-error") }

        function fm(a) { var b = dm.call(this),
                c = em.call(this);
            xk(this, b, function() { Dk(c) && (M(b, !0), Bk(c)) });
            a && yk(this, b, function() { a() }) }

        function gm() {
            return Za(Jj(dm.call(this)) ||
                "")
        }

        function hm() { var a = dm.call(this); var b = em.call(this); var c = Jj(a) || "";
            c ? cm.test(c) ? (M(a, !0), Bk(b), b = !0) : (M(a, !1), Ck(b, C("That email address isn't correct").toString()), b = !1) : (M(a, !1), Ck(b, C("Enter your email address to continue").toString()), b = !1); return b ? Za(Jj(a)) : null }

        function im(a, b, c, d, e, f, g) { O.call(this, kl, { email: c, ia: !!f }, g, "passwordSignIn", { G: d, F: e });
            this.B = a;
            this.J = b }
        n(im, O);
        im.prototype.v = function() {
            this.S();
            this.ea();
            this.ba(this.B, this.J);
            hl(this, this.l(), this.i());
            il(this, this.i(),
                this.B);
            Jj(this.l()) ? this.i().focus() : this.l().focus();
            O.prototype.v.call(this)
        };
        im.prototype.m = function() { this.J = this.B = null;
            O.prototype.m.call(this) };
        u(im.prototype, { l: dm, U: em, S: fm, P: gm, j: hm, i: Yl, D: Zl, ea: $l, u: am, ua: Vl, pa: Wl, ba: Xl });

        function Q(a, b, c, d, e, f) { O.call(this, a, b, d, e || "notice", f);
            this.i = c || null }
        w(Q, O);
        Q.prototype.v = function() { this.i && (this.u(this.i), this.l().focus());
            Q.M.v.call(this) };
        Q.prototype.m = function() { this.i = null;
            Q.M.m.call(this) };
        u(Q.prototype, { l: Vl, B: Wl, u: Xl });

        function jm(a, b,
            c, d, e) { Q.call(this, nl, { email: a, H: !!b }, b, e, "passwordRecoveryEmailSent", { G: c, F: d }) }
        w(jm, Q);

        function km(a, b) { Q.call(this, Gl, { H: !!a }, a, b, "emailVerificationSuccess") }
        w(km, Q);

        function lm(a, b) { Q.call(this, Hl, { H: !!a }, a, b, "emailVerificationFailure") }
        w(lm, Q);

        function mm(a, b, c) { Q.call(this, Il, { email: a, H: !!b }, b, c, "verifyAndChangeEmailSuccess") }
        w(mm, Q);

        function nm(a, b) { Q.call(this, Jl, { H: !!a }, a, b, "verifyAndChangeEmailFailure") }
        w(nm, Q);

        function om(a, b) { Q.call(this, Ll, { H: !!a }, a, b, "revertSecondFactorAdditionFailure") }
        w(om, Q);

        function pm(a) { Q.call(this, Sl, void 0, void 0, a, "signOut") }
        w(pm, Q);

        function qm(a, b) { Q.call(this, Cl, { H: !!a }, a, b, "passwordResetSuccess") }
        w(qm, Q);

        function rm(a, b) { Q.call(this, Dl, { H: !!a }, a, b, "passwordResetFailure") }
        w(rm, Q);

        function sm(a, b) { Q.call(this, Fl, { H: !!a }, a, b, "emailChangeRevokeFailure") }
        w(sm, Q);

        function tm(a, b, c) { Q.call(this, Ml, { errorMessage: a, Ab: !!b }, b, c, "recoverableError") }
        w(tm, Q);

        function um(a, b) { Q.call(this, Nl, { errorMessage: a }, void 0, b, "unrecoverableError") }
        w(um, Q);
        var vm = !1,
            wm = null;

        function xm(a, b) { vm = !!b;
            wm || ("undefined" == typeof accountchooser && Ej() ? (b = Cc(yc(new vc(wc, "//www.gstatic.com/accountchooser/client.js"))), wm = G(Nf(b)).ta(function() {})) : wm = G());
            wm.then(a, a) }

        function ym(a, b) { a = R(a);
            (a = aj(a).accountChooserInvoked || null) ? a(b): b() }

        function zm(a, b, c) { a = R(a);
            (a = aj(a).accountChooserResult || null) ? a(b, c): c() }

        function Am(a, b, c, d, e) {
            d ? (K("callback", a, b), vm && c()) : ym(a, function() {
                Uh(new Kg(a.a.tenantId || null), T(a));
                pj(function(f) {
                    Jh(Ch, T(a));
                    zm(a, f ? "empty" : "unavailable", function() {
                        K("signIn",
                            a, b);
                        (f || vm) && c()
                    })
                }, Oh(T(a)), e)
            })
        }

        function Bm(a, b, c, d) {
            function e(f) { f = U(f);
                V(b, c, void 0, f);
                d() }
            zm(b, "accountSelected", function() { Nh(!1, T(b)); var f = Cm(b);
                W(b, X(b).fetchSignInMethodsForEmail(a.a).then(function(g) { Dm(b, c, g, a.a, a.h || void 0, void 0, f);
                    d() }, e)) }) }

        function Em(a, b, c, d) { zm(b, a ? "addAccount" : "unavailable", function() { K("signIn", b, c);
                (a || vm) && d() }) }

        function Fm(a, b, c, d) {
            function e() { var f = a();
                f && (f = $i(R(f))) && f() }
            mj(function() { var f = a();
                    f && Am(f, b, e, c, d) }, function(f) { var g = a();
                    g && Bm(f, g, b, e) },
                function(f) { var g = a();
                    g && Em(f, g, b, e) }, a() && ui(R(a())))
        }

        function Gm(a, b, c, d) {
            function e(g) {
                if (!g.name || "cancel" != g.name) {
                    a: { var h = g.message; try { var k = ((JSON.parse(h).error || {}).message || "").toLowerCase().match(/invalid.+(access|id)_token/); if (k && k.length) { var m = !0; break a } } catch (q) {}
                        m = !1 }
                    if (m) g = P(b),
                    b.o(),
                    V(a, g, void 0, C("Your sign-in session has expired. Please try again.").toString());
                    else {
                        m = g && g.message || "";
                        if (g.code) {
                            if ("auth/email-already-in-use" == g.code || "auth/credential-already-in-use" == g.code) return;
                            m = U(g)
                        }
                        b.a(m)
                    }
                }
            }
            Hm(a);
            if (d) return Im(a, c), G();
            if (!c.credential) throw Error("No credential found!");
            d = X(a).currentUser || c.user;
            if (!d) throw Error("User not logged in.");
            d = new Bg(d.email, d.displayName, d.photoURL, "password" == c.credential.providerId ? null : c.credential.providerId);
            null != Ih(Eh, T(a)) && !Ih(Eh, T(a)) || Ph(d, T(a));
            Jh(Eh, T(a));
            try { var f = Jm(a, c) } catch (g) { return vg(g.code || g.message, g), b.a(g.code || g.message), G() }
            c = f.then(function(g) { Im(a, g) }, e).then(void 0, e);
            W(a, f);
            return G(c)
        }

        function Im(a, b) {
            if (!b.user) throw Error("No user found");
            var c = cj(R(a));
            bj(R(a)) && c && Ag("Both signInSuccess and signInSuccessWithAuthResult callbacks are provided. Only signInSuccessWithAuthResult callback will be invoked.");
            if (c) { c = cj(R(a)); var d = Lh(T(a)) || void 0;
                Jh(Dh, T(a)); var e = !1; if (vf()) { if (!c || c(b, d)) e = !0, window.opener.location.assign(Fc(Ic(Km(a, d))));
                    c || window.close() } else if (!c || c(b, d)) e = !0, uf(Km(a, d));
                e || a.reset() } else {
                c = b.user;
                b = b.credential;
                d = bj(R(a));
                e = Lh(T(a)) || void 0;
                Jh(Dh, T(a));
                var f = !1;
                if (vf()) {
                    if (!d || d(c, b, e)) f = !0, window.opener.location.assign(Fc(Ic(Km(a,
                        e))));
                    d || window.close()
                } else if (!d || d(c, b, e)) f = !0, uf(Km(a, e));
                f || a.reset()
            }
        }

        function Km(a, b) { a = b || R(a).a.get("signInSuccessUrl"); if (!a) throw Error("No redirect URL has been found. You must either specify a signInSuccessUrl in the configuration, pass in a redirect URL to the widget URL, or return false from the callback."); return a }

        function U(a) {
            var b = { code: a.code };
            b = b || {};
            var c = "";
            switch (b.code) {
                case "auth/email-already-in-use":
                    c += "The email address is already used by another account";
                    break;
                case "auth/requires-recent-login":
                    c +=
                        Qd();
                    break;
                case "auth/too-many-requests":
                    c += "You have entered an incorrect password too many times. Please try again in a few minutes.";
                    break;
                case "auth/user-cancelled":
                    c += "Please authorize the required permissions to sign in to the application";
                    break;
                case "auth/user-not-found":
                    c += "That email address doesn't match an existing account";
                    break;
                case "auth/user-token-expired":
                    c += Qd();
                    break;
                case "auth/weak-password":
                    c += "Strong passwords have at least 6 characters and a mix of letters and numbers";
                    break;
                case "auth/wrong-password":
                    c += "The email and password you entered don't match";
                    break;
                case "auth/network-request-failed":
                    c += "A network error has occurred";
                    break;
                case "auth/invalid-phone-number":
                    c += Ld();
                    break;
                case "auth/invalid-verification-code":
                    c += C("Wrong code. Try again.");
                    break;
                case "auth/code-expired":
                    c += "This code is no longer valid";
                    break;
                case "auth/expired-action-code":
                    c += "This code has expired.";
                    break;
                case "auth/invalid-action-code":
                    c += "The action code is invalid. This can happen if the code is malformed, expired, or has already been used."
            }
            if (b =
                C(c).toString()) return b;
            try { return JSON.parse(a.message), vg("Internal error: " + a.message, void 0), Nd().toString() } catch (d) { return a.message }
        }

        function Lm(a, b, c) {
            var d = ri[b] && firebase.auth[ri[b]] ? new firebase.auth[ri[b]] : 0 == b.indexOf("saml.") ? new firebase.auth.SAMLAuthProvider(b) : new firebase.auth.OAuthProvider(b);
            if (!d) throw Error("Invalid Firebase Auth provider!");
            var e = Mi(R(a), b);
            if (d.addScope)
                for (var f = 0; f < e.length; f++) d.addScope(e[f]);
            e = Ni(R(a), b) || {};
            c && (b == firebase.auth.GoogleAuthProvider.PROVIDER_ID ?
                a = "login_hint" : b == firebase.auth.GithubAuthProvider.PROVIDER_ID ? a = "login" : a = (a = Di(R(a), b)) && a.Nb, a && (e[a] = c));
            d.setCustomParameters && d.setCustomParameters(e);
            return d
        }

        function Mm(a, b, c, d) {
            function e() { Uh(new Kg(a.a.tenantId || null), T(a));
                W(a, b.K(t(a.cc, a), [k], function() { if ("file:" === (window.location && window.location.protocol)) return W(a, Nm(a).then(function(m) { b.o();
                        Jh(Ch, T(a));
                        K("callback", a, h, G(m)) }, f)) }, g)) }

            function f(m) {
                Jh(Ch, T(a));
                if (!m.name || "cancel" != m.name) switch (m.code) {
                    case "auth/popup-blocked":
                        e();
                        break;
                    case "auth/popup-closed-by-user":
                    case "auth/cancelled-popup-request":
                        break;
                    case "auth/credential-already-in-use":
                        break;
                    case "auth/network-request-failed":
                    case "auth/too-many-requests":
                    case "auth/user-cancelled":
                        b.a(U(m));
                        break;
                    default:
                        b.o(), K("callback", a, h, hf(m))
                }
            }

            function g(m) { Jh(Ch, T(a));
                m.name && "cancel" == m.name || (vg("signInWithRedirect: " + m.code, void 0), m = U(m), "blank" == b.Ea && Wi(R(a)) ? (b.o(), K("providerSignIn", a, h, m)) : b.a(m)) }
            var h = P(b),
                k = Lm(a, c, d);
            Xi(R(a)) == Yi ? e() : W(a, Om(a, k).then(function(m) {
                b.o();
                K("callback", a, h, G(m))
            }, f))
        }

        function Pm(a, b) { W(a, b.K(t(a.Zb, a), [], function(c) { b.o(); return Gm(a, b, c, !0) }, function(c) { c.name && "cancel" == c.name || (vg("ContinueAsGuest: " + c.code, void 0), c = U(c), b.a(c)) })) }

        function Qm(a, b, c) {
            function d(f) {
                var g = !1;
                f = b.K(t(a.$b, a), [f], function(h) { var k = P(b);
                    b.o();
                    K("callback", a, k, G(h));
                    g = !0 }, function(h) {
                    if (!h.name || "cancel" != h.name)
                        if (!h || "auth/credential-already-in-use" != h.code)
                            if (h && "auth/email-already-in-use" == h.code && h.email && h.credential) {
                                var k = P(b);
                                b.o();
                                K("callback",
                                    a, k, hf(h))
                            } else h = U(h), b.a(h)
                });
                W(a, f);
                return f.then(function() { return g }, function() { return !1 })
            }
            var e = Ji(R(a), c && c.authMethod || null);
            if (c && c.idToken && e === firebase.auth.GoogleAuthProvider.PROVIDER_ID) return Mi(R(a), firebase.auth.GoogleAuthProvider.PROVIDER_ID).length ? (Mm(a, b, e, c.id), c = G(!0)) : c = d(firebase.auth.GoogleAuthProvider.credential(c.idToken)), c;
            c && b.a(C("The selected credential for the authentication provider is not supported!").toString());
            return G(!1)
        }

        function Rm(a, b) {
            var c = b.j(),
                d = b.u();
            if (c)
                if (d) {
                    var e = firebase.auth.EmailAuthProvider.credential(c, d);
                    W(a, b.K(t(a.ac, a), [c, d], function(f) { return Gm(a, b, { user: f.user, credential: e, operationType: f.operationType, additionalUserInfo: f.additionalUserInfo }) }, function(f) {
                        if (!f.name || "cancel" != f.name) switch (f.code) {
                            case "auth/email-already-in-use":
                                break;
                            case "auth/email-exists":
                                M(b.l(), !1);
                                Ck(b.U(), U(f));
                                break;
                            case "auth/too-many-requests":
                            case "auth/wrong-password":
                                M(b.i(), !1);
                                Ck(b.D(), U(f));
                                break;
                            default:
                                vg("verifyPassword: " + f.message, void 0),
                                    b.a(U(f))
                        }
                    }))
                } else b.i().focus();
            else b.l().focus()
        }

        function Cm(a) { a = Ci(R(a)); return 1 == a.length && a[0] == firebase.auth.EmailAuthProvider.PROVIDER_ID }

        function Sm(a) { a = Ci(R(a)); return 1 == a.length && a[0] == firebase.auth.PhoneAuthProvider.PROVIDER_ID }

        function V(a, b, c, d) { Cm(a) ? d ? K("signIn", a, b, c, d) : Tm(a, b, c) : a && Sm(a) && !d ? K("phoneSignInStart", a, b) : a && Wi(R(a)) && !d ? K("federatedRedirect", a, b, c) : K("providerSignIn", a, b, d, c) }

        function Um(a, b, c, d) {
            var e = P(b);
            W(a, b.K(t(X(a).fetchSignInMethodsForEmail, X(a)), [c], function(f) {
                Nh(Hi(R(a)) ==
                    ti, T(a));
                b.o();
                Dm(a, e, f, c, void 0, d)
            }, function(f) { f = U(f);
                b.a(f) }))
        }

        function Dm(a, b, c, d, e, f, g) {
            c.length || Ti(R(a)) ? !c.length && Ti(R(a)) ? K("sendEmailLinkForSignIn", a, b, d, function() { K("signIn", a, b) }) : Qa(c, firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD) ? K("passwordSignIn", a, b, d, g) : 1 == c.length && c[0] === firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD ? K("sendEmailLinkForSignIn", a, b, d, function() { K("signIn", a, b) }) : (c = pi(c, Ci(R(a)))) ? (Sh(new Ig(d), T(a)), K("federatedSignIn", a, b, d, c, f)) :
                K("unsupportedProvider", a, b, d) : K("passwordSignUp", a, b, d, e, void 0, g)
        }

        function Vm(a, b, c, d, e, f) { var g = P(b);
            W(a, b.K(t(a.Hb, a), [c, f], function() { b.o();
                K("emailLinkSignInSent", a, g, c, d, f) }, e)) }

        function Tm(a, b, c) {
            Hi(R(a)) == ti ? xm(function() { kj ? ym(a, function() { Uh(new Kg(a.a.tenantId || null), T(a));
                    pj(function(d) { Jh(Ch, T(a));
                        zm(a, d ? "empty" : "unavailable", function() { c ? K("prefilledEmailSignIn", a, b, c) : K("signIn", a, b) }) }, Oh(T(a)), vi(R(a))) }) : (Y(a), Fm(Wm, b, !1, vi(R(a)))) }, !1) : (vm = !1, ym(a, function() {
                zm(a, "unavailable",
                    function() { c ? K("prefilledEmailSignIn", a, b, c) : K("signIn", a, b) })
            }))
        }

        function Xm(a) { var b = yf();
            a = xi(R(a));
            b = yb(b, a) || ""; for (var c in fj)
                if (fj[c].toLowerCase() == b.toLowerCase()) return fj[c];
            return "callback" }

        function Ym(a) { var b = yf();
            a = $h(R(a).a, "queryParameterForSignInSuccessUrl"); return (b = yb(b, a)) ? Fc(Ic(b)) : null }

        function Zm() { return yb(yf(), "oobCode") }

        function $m() { var a = yb(yf(), "continueUrl"); return a ? function() { uf(a) } : null }

        function an(a, b) {
            var c = xf(b, "Could not find the FirebaseUI widget element on the page.");
            b = Ym(a);
            switch (Xm(a)) {
                case "callback":
                    b && Mh(b, T(a));
                    a.ob() ? K("callback", a, c) : V(a, c, bn(a));
                    break;
                case "resetPassword":
                    K("passwordReset", a, c, Zm(), $m());
                    break;
                case "recoverEmail":
                    K("emailChangeRevocation", a, c, Zm());
                    break;
                case "revertSecondFactorAddition":
                    K("revertSecondFactorAddition", a, c, Zm());
                    break;
                case "verifyEmail":
                    K("emailVerification", a, c, Zm(), $m());
                    break;
                case "verifyAndChangeEmail":
                    K("verifyAndChangeEmail", a, c, Zm(), $m());
                    break;
                case "signIn":
                    K("emailLinkSignInCallback", a, c, yf());
                    cn();
                    break;
                case "select":
                    if (b &&
                        Mh(b, T(a)), kj) { V(a, c); break } else { xm(function() { Y(a);
                            Fm(Wm, c, !0) }, !0); return }
                default:
                    throw Error("Unhandled widget operation.");
            }(b = $i(R(a))) && b()
        }

        function dn(a, b) { O.call(this, vl, void 0, b, "anonymousUserMismatch");
            this.i = a }
        n(dn, O);
        dn.prototype.v = function() { var a = this;
            N(this, this.l(), function() { a.i() });
            this.l().focus();
            O.prototype.v.call(this) };
        dn.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(dn.prototype, { l: Wl });
        J.anonymousUserMismatch = function(a, b) {
            var c = new dn(function() {
                c.o();
                V(a,
                    b)
            });
            c.render(b);
            Z(a, c)
        };

        function en(a) { O.call(this, ol, void 0, a, "callback") }
        n(en, O);
        en.prototype.K = function(a, b, c, d) { return a.apply(null, b).then(c, d) };

        function fn(a, b, c) {
            if (c.user) {
                var d = { user: c.user, credential: c.credential, operationType: c.operationType, additionalUserInfo: c.additionalUserInfo },
                    e = Qh(T(a)),
                    f = e && e.f;
                if (f && !gn(c.user, f)) hn(a, b, d);
                else {
                    var g = e && e.a;
                    g ? W(a, c.user.linkWithCredential(g).then(function(h) {
                        d = { user: h.user, credential: g, operationType: h.operationType, additionalUserInfo: h.additionalUserInfo };
                        jn(a, b, d)
                    }, function(h) { kn(a, b, h) })) : jn(a, b, d)
                }
            } else c = P(b), b.o(), Rh(T(a)), V(a, c)
        }

        function jn(a, b, c) { Rh(T(a));
            Gm(a, b, c) }

        function kn(a, b, c) { var d = P(b);
            Rh(T(a));
            c = U(c);
            b.o();
            V(a, d, void 0, c) }

        function ln(a, b, c, d) {
            var e = P(b);
            W(a, X(a).fetchSignInMethodsForEmail(c).then(function(f) {
                b.o();
                f.length ? Qa(f, firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD) ? K("passwordLinking", a, e, c) : 1 == f.length && f[0] === firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD ? K("emailLinkSignInLinking", a, e, c) : (f = pi(f,
                    Ci(R(a)))) ? K("federatedLinking", a, e, c, f, d) : (Rh(T(a)), K("unsupportedProvider", a, e, c)) : (Rh(T(a)), K("passwordRecovery", a, e, c, !1, Od().toString()))
            }, function(f) { kn(a, b, f) }))
        }

        function hn(a, b, c) { var d = P(b);
            W(a, mn(a).then(function() { b.o();
                K("emailMismatch", a, d, c) }, function(e) { e.name && "cancel" == e.name || (e = U(e.code), b.a(e)) })) }

        function gn(a, b) { if (b == a.email) return !0; if (a.providerData)
                for (var c = 0; c < a.providerData.length; c++)
                    if (b == a.providerData[c].email) return !0;
            return !1 }
        J.callback = function(a, b, c) {
            var d = new en;
            d.render(b);
            Z(a, d);
            b = c || Nm(a);
            W(a, b.then(function(e) { fn(a, d, e) }, function(e) {
                if (e && ("auth/account-exists-with-different-credential" == e.code || "auth/email-already-in-use" == e.code) && e.email && e.credential) Sh(new Ig(e.email, e.credential), T(a)), ln(a, d, e.email);
                else if (e && "auth/user-cancelled" == e.code) { var f = Qh(T(a)),
                        g = U(e);
                    f && f.a ? ln(a, d, f.f, g) : f ? Um(a, d, f.f, g) : kn(a, d, e) } else e && "auth/credential-already-in-use" == e.code || (e && "auth/operation-not-supported-in-this-environment" == e.code && Cm(a) ? fn(a, d, {
                    user: null,
                    credential: null
                }) : kn(a, d, e))
            }))
        };

        function nn(a, b) { O.call(this, ul, void 0, b, "differentDeviceError");
            this.i = a }
        n(nn, O);
        nn.prototype.v = function() { var a = this;
            N(this, this.l(), function() { a.i() });
            this.l().focus();
            O.prototype.v.call(this) };
        nn.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(nn.prototype, { l: Wl });
        J.differentDeviceError = function(a, b) { var c = new nn(function() { c.o();
                V(a, b) });
            c.render(b);
            Z(a, c) };

        function on(a, b, c, d) {
            O.call(this, El, { email: a, H: !!c }, d, "emailChangeRevoke");
            this.l = b;
            this.i =
                c || null
        }
        n(on, O);
        on.prototype.v = function() { var a = this;
            N(this, L(this, "firebaseui-id-reset-password-link"), function() { a.l() });
            this.i && (this.B(this.i), this.u().focus());
            O.prototype.v.call(this) };
        on.prototype.m = function() { this.l = this.i = null;
            O.prototype.m.call(this) };
        u(on.prototype, { u: Vl, D: Wl, B: Xl });

        function pn() { return L(this, "firebaseui-id-new-password") }

        function qn() { return L(this, "firebaseui-id-password-toggle") }

        function rn() {
            this.Sa = !this.Sa;
            var a = qn.call(this),
                b = pn.call(this);
            this.Sa ? (b.type = "text",
                Hj(a, "firebaseui-input-toggle-off"), Ij(a, "firebaseui-input-toggle-on")) : (b.type = "password", Hj(a, "firebaseui-input-toggle-on"), Ij(a, "firebaseui-input-toggle-off"));
            b.focus()
        }

        function sn() { return L(this, "firebaseui-id-new-password-error") }

        function tn() {
            this.Sa = !1;
            var a = pn.call(this);
            a.type = "password";
            var b = sn.call(this);
            xk(this, a, function() { Dk(b) && (M(a, !0), Bk(b)) });
            var c = qn.call(this);
            Hj(c, "firebaseui-input-toggle-on");
            Ij(c, "firebaseui-input-toggle-off");
            zk(this, a, function() {
                Hj(c, "firebaseui-input-toggle-focus");
                Ij(c, "firebaseui-input-toggle-blur")
            });
            Ak(this, a, function() { Hj(c, "firebaseui-input-toggle-blur");
                Ij(c, "firebaseui-input-toggle-focus") });
            N(this, c, t(rn, this))
        }

        function un() { var a = pn.call(this); var b = sn.call(this);
            Jj(a) ? (M(a, !0), Bk(b), b = !0) : (M(a, !1), Ck(b, C("Enter your password").toString()), b = !1); return b ? Jj(a) : null }

        function vn(a, b, c) { O.call(this, Bl, { email: a }, c, "passwordReset");
            this.l = b }
        n(vn, O);
        vn.prototype.v = function() { this.J();
            this.D(this.l);
            il(this, this.i(), this.l);
            this.i().focus();
            O.prototype.v.call(this) };
        vn.prototype.m = function() { this.l = null;
            O.prototype.m.call(this) };
        u(vn.prototype, { i: pn, B: sn, P: qn, J: tn, u: un, U: Vl, S: Wl, D: Xl });

        function wn(a, b, c, d, e) { O.call(this, Kl, { factorId: a, phoneNumber: c || null, H: !!d }, e, "revertSecondFactorAdditionSuccess");
            this.l = b;
            this.i = d || null }
        n(wn, O);
        wn.prototype.v = function() { var a = this;
            N(this, L(this, "firebaseui-id-reset-password-link"), function() { a.l() });
            this.i && (this.B(this.i), this.u().focus());
            O.prototype.v.call(this) };
        wn.prototype.m = function() { this.l = this.i = null;
            O.prototype.m.call(this) };
        u(wn.prototype, { u: Vl, D: Wl, B: Xl });

        function xn(a, b, c, d, e) { var f = c.u();
            f && W(a, c.K(t(X(a).confirmPasswordReset, X(a)), [d, f], function() { c.o(); var g = new qm(e);
                g.render(b);
                Z(a, g) }, function(g) { yn(a, b, c, g) })) }

        function yn(a, b, c, d) { "auth/weak-password" == (d && d.code) ? (a = U(d), M(c.i(), !1), Ck(c.B(), a), c.i().focus()) : (c && c.o(), c = new rm, c.render(b), Z(a, c)) }

        function zn(a, b, c) {
            var d = new on(c, function() {
                W(a, d.K(t(X(a).sendPasswordResetEmail, X(a)), [c], function() {
                    d.o();
                    d = new jm(c, void 0, I(R(a)), Ri(R(a)));
                    d.render(b);
                    Z(a,
                        d)
                }, function() { d.a(Md().toString()) }))
            });
            d.render(b);
            Z(a, d)
        }

        function An(a, b, c, d) { var e = new wn(d.factorId, function() { e.K(t(X(a).sendPasswordResetEmail, X(a)), [c], function() { e.o();
                    e = new jm(c, void 0, I(R(a)), Ri(R(a)));
                    e.render(b);
                    Z(a, e) }, function() { e.a(Md().toString()) }) }, d.phoneNumber);
            e.render(b);
            Z(a, e) }
        J.passwordReset = function(a, b, c, d) { W(a, X(a).verifyPasswordResetCode(c).then(function(e) { var f = new vn(e, function() { xn(a, b, f, c, d) });
                f.render(b);
                Z(a, f) }, function() { yn(a, b) })) };
        J.emailChangeRevocation = function(a,
            b, c) { var d = null;
            W(a, X(a).checkActionCode(c).then(function(e) { d = e.data.email; return X(a).applyActionCode(c) }).then(function() { zn(a, b, d) }, function() { var e = new sm;
                e.render(b);
                Z(a, e) })) };
        J.emailVerification = function(a, b, c, d) { W(a, X(a).applyActionCode(c).then(function() { var e = new km(d);
                e.render(b);
                Z(a, e) }, function() { var e = new lm;
                e.render(b);
                Z(a, e) })) };
        J.revertSecondFactorAddition = function(a, b, c) {
            var d = null,
                e = null;
            W(a, X(a).checkActionCode(c).then(function(f) { d = f.data.email;
                e = f.data.multiFactorInfo; return X(a).applyActionCode(c) }).then(function() {
                An(a,
                    b, d, e)
            }, function() { var f = new om;
                f.render(b);
                Z(a, f) }))
        };
        J.verifyAndChangeEmail = function(a, b, c, d) { var e = null;
            W(a, X(a).checkActionCode(c).then(function(f) { e = f.data.email; return X(a).applyActionCode(c) }).then(function() { var f = new mm(e, d);
                f.render(b);
                Z(a, f) }, function() { var f = new nm;
                f.render(b);
                Z(a, f) })) };

        function Bn(a, b) {
            try { var c = "number" == typeof a.selectionStart } catch (d) { c = !1 }
            c ? (a.selectionStart = b, a.selectionEnd = b) : z && !sc("9") && ("textarea" == a.type && (b = a.value.substring(0, b).replace(/(\r\n|\r|\n)/g, "\n").length),
                a = a.createTextRange(), a.collapse(!0), a.move("character", b), a.select())
        }

        function Cn(a, b, c, d, e, f) { O.call(this, tl, { email: c }, f, "emailLinkSignInConfirmation", { G: d, F: e });
            this.l = a;
            this.u = b }
        n(Cn, O);
        Cn.prototype.v = function() { this.B(this.l);
            this.D(this.l, this.u);
            this.i().focus();
            Bn(this.i(), (this.i().value || "").length);
            O.prototype.v.call(this) };
        Cn.prototype.m = function() { this.u = this.l = null;
            O.prototype.m.call(this) };
        u(Cn.prototype, { i: dm, P: em, B: fm, J: gm, j: hm, U: Vl, S: Wl, D: Xl });
        J.emailLinkConfirmation = function(a,
            b, c, d, e, f) { var g = new Cn(function() { var h = g.j();
                h ? (g.o(), d(a, b, h, c)) : g.i().focus() }, function() { g.o();
                V(a, b, e || void 0) }, e || void 0, I(R(a)), Ri(R(a)));
            g.render(b);
            Z(a, g);
            f && g.a(f) };

        function Dn(a, b, c, d, e) { O.call(this, yl, { ga: a }, e, "emailLinkSignInLinkingDifferentDevice", { G: c, F: d });
            this.i = b }
        n(Dn, O);
        Dn.prototype.v = function() { this.u(this.i);
            this.l().focus();
            O.prototype.v.call(this) };
        Dn.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(Dn.prototype, { l: Vl, u: Xl });
        J.emailLinkNewDeviceLinking = function(a,
            b, c, d) { var e = new Vb(c);
            c = e.a.a.get(x.PROVIDER_ID) || null;
            Zb(e, null); if (c) { var f = new Dn(Di(R(a), c), function() { f.o();
                    d(a, b, e.toString()) }, I(R(a)), Ri(R(a)));
                f.render(b);
                Z(a, f) } else V(a, b) };

        function En(a) { O.call(this, ql, void 0, a, "blank") }
        n(En, O);

        function Fn(a, b, c, d, e) {
            var f = new En,
                g = new Vb(c),
                h = g.a.a.get(x.ab) || "",
                k = g.a.a.get(x.Ta) || "",
                m = "1" === g.a.a.get(x.Ra),
                q = Yb(g),
                E = g.a.a.get(x.PROVIDER_ID) || null;
            g = g.a.a.get(x.xb) || null;
            Gn(a, g);
            var S = !Ih(Gh, T(a)),
                Ha = d || Vh(k, T(a)),
                Pa = (d = Wh(k, T(a))) && d.a;
            E && Pa && Pa.providerId !==
                E && (Pa = null);
            f.render(b);
            Z(a, f);
            W(a, f.K(function() { var ja = G(null);
                ja = q && S || S && m ? hf(Error("anonymous-user-not-found")) : Hn(a, c).then(function(Mg) { if (E && !Pa) throw Error("pending-credential-not-found"); return Mg }); var td = null; return ja.then(function(Mg) { td = Mg; return e ? null : X(a).checkActionCode(h) }).then(function() { return td }) }, [], function(ja) { Ha ? In(a, f, Ha, c, Pa, ja) : m ? (f.o(), K("differentDeviceError", a, b)) : (f.o(), K("emailLinkConfirmation", a, b, c, Jn)) }, function(ja) {
                var td = void 0;
                if (!ja || !ja.name || "cancel" !=
                    ja.name) switch (f.o(), ja && ja.message) {
                    case "anonymous-user-not-found":
                        K("differentDeviceError", a, b); break;
                    case "anonymous-user-mismatch":
                        K("anonymousUserMismatch", a, b); break;
                    case "pending-credential-not-found":
                        K("emailLinkNewDeviceLinking", a, b, c, Kn); break;
                    default:
                        ja && (td = U(ja)), V(a, b, void 0, td) }
            }))
        }

        function Jn(a, b, c, d) { Fn(a, b, d, c, !0) }

        function Kn(a, b, c) { Fn(a, b, c) }

        function In(a, b, c, d, e, f) {
            var g = P(b);
            b.Z("mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active firebaseui-progress-dialog-loading-icon",
                C("Signing in...").toString());
            var h = null;
            e = (f ? Ln(a, f, c, d, e) : Mn(a, c, d, e)).then(function(k) { Jh(Hh, T(a));
                Jh(Gh, T(a));
                b.h();
                b.Z("firebaseui-icon-done", C("Signed in!").toString());
                h = setTimeout(function() { b.h();
                    Gm(a, b, k, !0) }, 1E3);
                W(a, function() { b && (b.h(), b.o());
                    clearTimeout(h) }) }, function(k) {
                b.h();
                b.o();
                if (!k.name || "cancel" != k.name) {
                    var m = U(k);
                    "auth/email-already-in-use" == k.code || "auth/credential-already-in-use" == k.code ? (Jh(Hh, T(a)), Jh(Gh, T(a))) : "auth/invalid-email" == k.code ? (m = C("The email provided does not match the current sign-in session.").toString(),
                        K("emailLinkConfirmation", a, g, d, Jn, null, m)) : V(a, g, c, m)
                }
            });
            W(a, e)
        }
        J.emailLinkSignInCallback = Fn;

        function Nn(a, b, c, d, e, f) { O.call(this, xl, { email: a, ga: b }, f, "emailLinkSignInLinking", { G: d, F: e });
            this.i = c }
        n(Nn, O);
        Nn.prototype.v = function() { this.u(this.i);
            this.l().focus();
            O.prototype.v.call(this) };
        Nn.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(Nn.prototype, { l: Vl, u: Xl });

        function On(a, b, c, d) {
            var e = P(b);
            Vm(a, b, c, function() { V(a, e, c) }, function(f) {
                if (!f.name || "cancel" != f.name) {
                    var g = U(f);
                    f && "auth/network-request-failed" ==
                        f.code ? b.a(g) : (b.o(), V(a, e, c, g))
                }
            }, d)
        }
        J.emailLinkSignInLinking = function(a, b, c) { var d = Qh(T(a));
            Rh(T(a)); if (d) { var e = d.a.providerId,
                    f = new Nn(c, Di(R(a), e), function() { On(a, f, c, d) }, I(R(a)), Ri(R(a)));
                f.render(b);
                Z(a, f) } else V(a, b) };

        function Pn(a, b, c, d, e, f) { O.call(this, rl, { email: a }, f, "emailLinkSignInSent", { G: d, F: e });
            this.u = b;
            this.i = c }
        n(Pn, O);
        Pn.prototype.v = function() {
            var a = this;
            N(this, this.l(), function() { a.i() });
            N(this, L(this, "firebaseui-id-trouble-getting-email-link"), function() { a.u() });
            this.l().focus();
            O.prototype.v.call(this)
        };
        Pn.prototype.m = function() { this.i = this.u = null;
            O.prototype.m.call(this) };
        u(Pn.prototype, { l: Wl });
        J.emailLinkSignInSent = function(a, b, c, d, e) { var f = new Pn(c, function() { f.o();
                K("emailNotReceived", a, b, c, d, e) }, function() { f.o();
                d() }, I(R(a)), Ri(R(a)));
            f.render(b);
            Z(a, f) };

        function Qn(a, b, c, d, e, f, g) { O.call(this, Ol, { ic: a, Pb: b }, g, "emailMismatch", { G: e, F: f });
            this.l = c;
            this.i = d }
        n(Qn, O);
        Qn.prototype.v = function() { this.B(this.l, this.i);
            this.u().focus();
            O.prototype.v.call(this) };
        Qn.prototype.m =
            function() { this.i = null;
                O.prototype.m.call(this) };
        u(Qn.prototype, { u: Vl, D: Wl, B: Xl });
        J.emailMismatch = function(a, b, c) { var d = Qh(T(a)); if (d) { var e = new Qn(c.user.email, d.f, function() { var f = e;
                    Rh(T(a));
                    Gm(a, f, c) }, function() { var f = c.credential.providerId,
                        g = P(e);
                    e.o();
                    d.a ? K("federatedLinking", a, g, d.f, f) : K("federatedSignIn", a, g, d.f, f) }, I(R(a)), Ri(R(a)));
                e.render(b);
                Z(a, e) } else V(a, b) };

        function Rn(a, b, c, d, e) { O.call(this, sl, void 0, e, "emailNotReceived", { G: c, F: d });
            this.l = a;
            this.i = b }
        n(Rn, O);
        Rn.prototype.v = function() {
            var a =
                this;
            N(this, this.u(), function() { a.i() });
            N(this, this.Ba(), function() { a.l() });
            this.u().focus();
            O.prototype.v.call(this)
        };
        Rn.prototype.Ba = function() { return L(this, "firebaseui-id-resend-email-link") };
        Rn.prototype.m = function() { this.i = this.l = null;
            O.prototype.m.call(this) };
        u(Rn.prototype, { u: Wl });
        J.emailNotReceived = function(a, b, c, d, e) { var f = new Rn(function() { Vm(a, f, c, d, function(g) { g = U(g);
                    f.a(g) }, e) }, function() { f.o();
                V(a, b, c) }, I(R(a)), Ri(R(a)));
            f.render(b);
            Z(a, f) };

        function Sn(a, b, c, d, e, f) {
            O.call(this, zl, {
                email: a,
                ga: b
            }, f, "federatedLinking", { G: d, F: e });
            this.i = c
        }
        n(Sn, O);
        Sn.prototype.v = function() { this.u(this.i);
            this.l().focus();
            O.prototype.v.call(this) };
        Sn.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(Sn.prototype, { l: Vl, u: Xl });
        J.federatedLinking = function(a, b, c, d, e) { var f = Qh(T(a)); if (f && f.a) { var g = new Sn(c, Di(R(a), d), function() { Mm(a, g, d, c) }, I(R(a)), Ri(R(a)));
                g.render(b);
                Z(a, g);
                e && g.a(e) } else V(a, b) };
        J.federatedRedirect = function(a, b, c) { var d = new En;
            d.render(b);
            Z(a, d);
            b = Ci(R(a))[0];
            Mm(a, d, b, c) };
        J.federatedSignIn = function(a, b, c, d, e) { var f = new Sn(c, Di(R(a), d), function() { Mm(a, f, d, c) }, I(R(a)), Ri(R(a)));
            f.render(b);
            Z(a, f);
            e && f.a(e) };

        function Tn(a, b, c, d) {
            var e = b.u();
            e ? W(a, b.K(t(a.Wb, a), [c, e], function(f) { f = f.user.linkWithCredential(d).then(function(g) { return Gm(a, b, { user: g.user, credential: d, operationType: g.operationType, additionalUserInfo: g.additionalUserInfo }) });
                W(a, f); return f }, function(f) {
                if (!f.name || "cancel" != f.name) switch (f.code) {
                    case "auth/wrong-password":
                        M(b.i(), !1);
                        Ck(b.D(), U(f));
                        break;
                    case "auth/too-many-requests":
                        b.a(U(f));
                        break;
                    default:
                        vg("signInWithEmailAndPassword: " + f.message, void 0), b.a(U(f))
                }
            })) : b.i().focus()
        }
        J.passwordLinking = function(a, b, c) { var d = Qh(T(a));
            Rh(T(a)); var e = d && d.a; if (e) { var f = new bm(c, function() { Tn(a, f, c, e) }, function() { f.o();
                    K("passwordRecovery", a, b, c) }, I(R(a)), Ri(R(a)));
                f.render(b);
                Z(a, f) } else V(a, b) };

        function Un(a, b, c, d, e, f) { O.call(this, ml, { email: c, Ua: !!b }, f, "passwordRecovery", { G: d, F: e });
            this.l = a;
            this.u = b }
        n(Un, O);
        Un.prototype.v = function() {
            this.D();
            this.J(this.l,
                this.u);
            Jj(this.i()) || this.i().focus();
            il(this, this.i(), this.l);
            O.prototype.v.call(this)
        };
        Un.prototype.m = function() { this.u = this.l = null;
            O.prototype.m.call(this) };
        u(Un.prototype, { i: dm, B: em, D: fm, P: gm, j: hm, U: Vl, S: Wl, J: Xl });

        function Vn(a, b) { var c = b.j(); if (c) { var d = P(b);
                W(a, b.K(t(X(a).sendPasswordResetEmail, X(a)), [c], function() { b.o(); var e = new jm(c, function() { e.o();
                        V(a, d) }, I(R(a)), Ri(R(a)));
                    e.render(d);
                    Z(a, e) }, function(e) { M(b.i(), !1);
                    Ck(b.B(), U(e)) })) } else b.i().focus() }
        J.passwordRecovery = function(a, b,
            c, d, e) { var f = new Un(function() { Vn(a, f) }, d ? void 0 : function() { f.o();
                V(a, b) }, c, I(R(a)), Ri(R(a)));
            f.render(b);
            Z(a, f);
            e && f.a(e) };
        J.passwordSignIn = function(a, b, c, d) { var e = new im(function() { Rm(a, e) }, function() { var f = e.P();
                e.o();
                K("passwordRecovery", a, b, f) }, c, I(R(a)), Ri(R(a)), d);
            e.render(b);
            Z(a, e) };

        function Wn() { return L(this, "firebaseui-id-name") }

        function Xn() { return L(this, "firebaseui-id-name-error") }

        function Yn(a, b, c, d, e, f, g, h, k) {
            O.call(this, ll, { email: d, Sb: a, name: e, Ua: !!c, ia: !!h }, k, "passwordSignUp", {
                G: f,
                F: g
            });
            this.B = b;
            this.J = c;
            this.D = a
        }
        n(Yn, O);
        Yn.prototype.v = function() { this.ea();
            this.D && this.Ja();
            this.ua();
            this.pa(this.B, this.J);
            this.D ? (hl(this, this.i(), this.u()), hl(this, this.u(), this.l())) : hl(this, this.i(), this.l());
            this.B && il(this, this.l(), this.B);
            Jj(this.i()) ? this.D && !Jj(this.u()) ? this.u().focus() : this.l().focus() : this.i().focus();
            O.prototype.v.call(this) };
        Yn.prototype.m = function() { this.J = this.B = null;
            O.prototype.m.call(this) };
        u(Yn.prototype, {
            i: dm,
            U: em,
            ea: fm,
            kb: gm,
            j: hm,
            u: Wn,
            Ac: Xn,
            Ja: function() {
                var a =
                    Wn.call(this),
                    b = Xn.call(this);
                xk(this, a, function() { Dk(b) && (M(a, !0), Bk(b)) })
            },
            P: function() { var a = Wn.call(this); var b = Xn.call(this); var c = Jj(a);
                c = !/^[\s\xa0]*$/.test(null == c ? "" : String(c));
                M(a, c);
                c ? (Bk(b), b = !0) : (Ck(b, C("Enter your account name").toString()), b = !1); return b ? Za(Jj(a)) : null },
            l: pn,
            ba: sn,
            mb: qn,
            ua: tn,
            S: un,
            Mb: Vl,
            Lb: Wl,
            pa: Xl
        });

        function Zn(a, b) {
            var c = Si(R(a)),
                d = b.j(),
                e = null;
            c && (e = b.P());
            var f = b.S();
            if (d) {
                if (c)
                    if (e) e = hb(e);
                    else { b.u().focus(); return }
                if (f) {
                    var g = firebase.auth.EmailAuthProvider.credential(d,
                        f);
                    W(a, b.K(t(a.Xb, a), [d, f], function(h) { var k = { user: h.user, credential: g, operationType: h.operationType, additionalUserInfo: h.additionalUserInfo }; return c ? (h = h.user.updateProfile({ displayName: e }).then(function() { return Gm(a, b, k) }), W(a, h), h) : Gm(a, b, k) }, function(h) {
                        if (!h.name || "cancel" != h.name) {
                            var k = U(h);
                            switch (h.code) {
                                case "auth/email-already-in-use":
                                    return $n(a, b, d, h);
                                case "auth/too-many-requests":
                                    k = C("Too many account requests are coming from your IP address. Try again in a few minutes.").toString();
                                case "auth/operation-not-allowed":
                                case "auth/weak-password":
                                    M(b.l(), !1);
                                    Ck(b.ba(), k);
                                    break;
                                default:
                                    h = "setAccountInfo: " + ih(h), vg(h, void 0), b.a(k)
                            }
                        }
                    }))
                } else b.l().focus()
            } else b.i().focus()
        }

        function $n(a, b, c, d) {
            function e() { var g = U(d);
                M(b.i(), !1);
                Ck(b.U(), g);
                b.i().focus() } var f = X(a).fetchSignInMethodsForEmail(c).then(function(g) { g.length ? e() : (g = P(b), b.o(), K("passwordRecovery", a, g, c, !1, Od().toString())) }, function() { e() });
            W(a, f); return f }
        J.passwordSignUp = function(a, b, c, d, e, f) {
            function g() {
                h.o();
                V(a,
                    b)
            }
            var h = new Yn(Si(R(a)), function() { Zn(a, h) }, e ? void 0 : g, c, d, I(R(a)), Ri(R(a)), f);
            h.render(b);
            Z(a, h)
        };

        function ao() { return L(this, "firebaseui-id-phone-confirmation-code") }

        function bo() { return L(this, "firebaseui-id-phone-confirmation-code-error") }

        function co() { return L(this, "firebaseui-id-resend-countdown") }

        function eo(a, b, c, d, e, f, g, h, k) { O.call(this, Rl, { phoneNumber: e }, k, "phoneSignInFinish", { G: g, F: h });
            this.kb = f;
            this.i = new Vj(1E3);
            this.D = f;
            this.S = a;
            this.l = b;
            this.J = c;
            this.P = d }
        n(eo, O);
        eo.prototype.v = function() {
            var a =
                this;
            this.U(this.kb);
            oe(this.i, "tick", this.B, !1, this);
            this.i.start();
            N(this, L(this, "firebaseui-id-change-phone-number-link"), function() { a.S() });
            N(this, this.Ba(), function() { a.P() });
            this.Ja(this.l);
            this.ea(this.l, this.J);
            this.u().focus();
            O.prototype.v.call(this)
        };
        eo.prototype.m = function() { this.P = this.J = this.l = this.S = null;
            Wj(this.i);
            we(this.i, "tick", this.B);
            this.i = null;
            O.prototype.m.call(this) };
        eo.prototype.B = function() {
            --this.D;
            0 < this.D ? this.U(this.D) : (Wj(this.i), we(this.i, "tick", this.B), this.ua(),
                this.mb())
        };
        u(eo.prototype, { u: ao, pa: bo, Ja: function(a) { var b = ao.call(this),
                    c = bo.call(this);
                xk(this, b, function() { Dk(c) && (M(b, !0), Bk(c)) });
                a && yk(this, b, function() { a() }) }, ba: function() { var a = Za(Jj(ao.call(this)) || ""); return /^\d{6}$/.test(a) ? a : null }, Eb: co, U: function(a) { ed(co.call(this), C("Resend code in " + ((9 < a ? "0:" : "0:0") + a)).toString()) }, ua: function() { Bk(this.Eb()) }, Ba: function() { return L(this, "firebaseui-id-resend-link") }, mb: function() { Ck(this.Ba()) }, Mb: Vl, Lb: Wl, ea: Xl });

        function fo(a, b, c, d) {
            function e(g) {
                b.u().focus();
                M(b.u(), !1);
                Ck(b.pa(), g)
            }
            var f = b.ba();
            f ? (b.Z("mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active firebaseui-progress-dialog-loading-icon", C("Verifying...").toString()), W(a, b.K(t(d.confirm, d), [f], function(g) { b.h();
                b.Z("firebaseui-icon-done", C("Verified!").toString()); var h = setTimeout(function() { b.h();
                    b.o(); var k = { user: go(a).currentUser, credential: null, operationType: g.operationType, additionalUserInfo: g.additionalUserInfo };
                    Gm(a, b, k, !0) }, 1E3);
                W(a, function() { b && b.h();
                    clearTimeout(h) }) }, function(g) {
                if (g.name &&
                    "cancel" == g.name) b.h();
                else { var h = U(g); switch (g.code) {
                        case "auth/credential-already-in-use":
                            b.h(); break;
                        case "auth/code-expired":
                            g = P(b);
                            b.h();
                            b.o();
                            K("phoneSignInStart", a, g, c, h); break;
                        case "auth/missing-verification-code":
                        case "auth/invalid-verification-code":
                            b.h();
                            e(h); break;
                        default:
                            b.h(), b.a(h) } }
            }))) : e(C("Wrong code. Try again.").toString())
        }
        J.phoneSignInFinish = function(a, b, c, d, e, f) {
            var g = new eo(function() { g.o();
                K("phoneSignInStart", a, b, c) }, function() { fo(a, g, c, e) }, function() { g.o();
                V(a, b) }, function() {
                g.o();
                K("phoneSignInStart", a, b, c)
            }, oi(c), d, I(R(a)), Ri(R(a)));
            g.render(b);
            Z(a, g);
            f && g.a(f)
        };
        var ho = !z && !(y("Safari") && !(cc() || y("Coast") || y("Opera") || y("Edge") || y("Firefox") || y("FxiOS") || y("Silk") || y("Android")));

        function io(a, b) { if (/-[a-z]/.test(b)) return null; if (ho && a.dataset) { if (!(!y("Android") || cc() || y("Firefox") || y("FxiOS") || y("Opera") || y("Silk") || b in a.dataset)) return null;
                a = a.dataset[b]; return void 0 === a ? null : a } return a.getAttribute("data-" + String(b).replace(/([A-Z])/g, "-$1").toLowerCase()) }

        function jo(a,
            b, c) { var d = this;
            a = md(Sk, { items: a }, null, this.s);
            Zk.call(this, a, !0, !0);
            c && (c = ko(a, c)) && (c.focus(), pk(c, a));
            N(this, a, function(e) { if (e = (e = fd(e.target, "firebaseui-id-list-box-dialog-button")) && io(e, "listboxid")) $k.call(d), b(e) }) }

        function ko(a, b) { a = (a || document).getElementsByTagName("BUTTON"); for (var c = 0; c < a.length; c++)
                if (io(a[c], "listboxid") === b) return a[c];
            return null }

        function lo() { return L(this, "firebaseui-id-phone-number") }

        function mo() { return L(this, "firebaseui-id-country-selector") }

        function no() {
            return L(this,
                "firebaseui-id-phone-number-error")
        }

        function oo(a, b) { var c = a.a,
                d = po("1-US-0", c),
                e = null;
            b && po(b, c) ? e = b : d ? e = "1-US-0" : e = 0 < c.length ? c[0].c : null; if (!e) throw Error("No available default country");
            qo.call(this, e, a) }

        function po(a, b) { a = gi(a); return !(!a || !Qa(b, a)) }

        function ro(a) { return Ma(a, function(b) { return { id: b.c, Ma: "firebaseui-flag " + so(b), label: b.name + " " + ("\u200e+" + b.b) } }) }

        function so(a) { return "firebaseui-flag-" + a.g }

        function to(a) {
            var b = this;
            jo.call(this, ro(a.a), function(c) { qo.call(b, c, a, !0);
                    b.N().focus() },
                this.Aa)
        }

        function qo(a, b, c) { var d = gi(a);
            d && (c && (c = Za(Jj(lo.call(this)) || ""), b = fi(b, c), b.length && b[0].b != d.b && (c = "+" + d.b + c.substr(b[0].b.length + 1), Kj(lo.call(this), c))), b = gi(this.Aa), this.Aa = a, a = L(this, "firebaseui-id-country-selector-flag"), b && Ij(a, so(b)), Hj(a, so(d)), ed(L(this, "firebaseui-id-country-selector-code"), "\u200e+" + d.b)) }

        function uo(a, b, c, d, e, f, g, h, k, m) {
            O.call(this, Ql, { Fb: b, za: k || null, Wa: !!c, ia: !!f }, m, "phoneSignInStart", { G: d, F: e });
            this.J = h || null;
            this.P = b;
            this.l = a;
            this.B = c || null;
            this.pa = g ||
                null
        }
        n(uo, O);
        uo.prototype.v = function() { this.ea(this.pa, this.J);
            this.S(this.l, this.B || void 0);
            this.P || hl(this, this.N(), this.i());
            il(this, this.i(), this.l);
            this.N().focus();
            Bn(this.N(), (this.N().value || "").length);
            O.prototype.v.call(this) };
        uo.prototype.m = function() { this.B = this.l = null;
            O.prototype.m.call(this) };
        u(uo.prototype, {
            Db: al,
            N: lo,
            D: no,
            ea: function(a, b, c) {
                var d = this,
                    e = lo.call(this),
                    f = mo.call(this),
                    g = no.call(this),
                    h = a || li,
                    k = h.a;
                if (0 == k.length) throw Error("No available countries provided.");
                oo.call(d,
                    h, b);
                N(this, f, function() { to.call(d, h) });
                xk(this, e, function() { Dk(g) && (M(e, !0), Bk(g)); var m = Za(Jj(e) || ""),
                        q = gi(this.Aa),
                        E = fi(h, m);
                    m = po("1-US-0", k);
                    E.length && E[0].b != q.b && (q = E[0], qo.call(d, "1" == q.b && m ? "1-US-0" : q.c, h)) });
                c && yk(this, e, function() { c() })
            },
            U: function(a) {
                var b = Za(Jj(lo.call(this)) || "");
                a = a || li;
                var c = a.a,
                    d = fi(li, b);
                if (d.length && !Qa(c, d[0])) throw Kj(lo.call(this)), lo.call(this).focus(), Ck(no.call(this), C("The country code provided is not supported.").toString()), Error("The country code provided is not supported.");
                c = gi(this.Aa);
                d.length && d[0].b != c.b && qo.call(this, d[0].c, a);
                d.length && (b = b.substr(d[0].b.length + 1));
                return b ? new mi(this.Aa, b) : null
            },
            Ja: mo,
            ba: function() { return L(this, "firebaseui-recaptcha-container") },
            u: function() { return L(this, "firebaseui-id-recaptcha-error") },
            i: Vl,
            ua: Wl,
            S: Xl
        });

        function vo(a, b, c, d) {
            try { var e = b.U(ij) } catch (f) { return }
            e ? gj ? (b.Z("mdl-spinner mdl-spinner--single-color mdl-js-spinner is-active firebaseui-progress-dialog-loading-icon", C("Verifying...").toString()), W(a, b.K(t(a.bc, a), [oi(e),
                c
            ], function(f) { var g = P(b);
                b.Z("firebaseui-icon-done", C("Code sent!").toString()); var h = setTimeout(function() { b.h();
                    b.o();
                    K("phoneSignInFinish", a, g, e, 15, f) }, 1E3);
                W(a, function() { b && b.h();
                    clearTimeout(h) }) }, function(f) {
                b.h();
                if (!f.name || "cancel" != f.name) {
                    grecaptcha.reset(jj);
                    gj = null;
                    var g = f && f.message || "";
                    if (f.code) switch (f.code) {
                        case "auth/too-many-requests":
                            g = C("This phone number has been used too many times").toString();
                            break;
                        case "auth/invalid-phone-number":
                        case "auth/missing-phone-number":
                            b.N().focus();
                            Ck(b.D(), Ld().toString());
                            return;
                        default:
                            g = U(f)
                    }
                    b.a(g)
                }
            }))) : hj ? Ck(b.u(), C("Solve the reCAPTCHA").toString()) : !hj && d && b.i().click() : (b.N().focus(), Ck(b.D(), Ld().toString()))
        }
        J.phoneSignInStart = function(a, b, c, d) {
            var e = Ki(R(a)) || {};
            gj = null;
            hj = !(e && "invisible" === e.size);
            var f = Sm(a),
                g = Pi(R(a)),
                h = f ? Oi(R(a)) : null;
            g = c && c.a || g && g.c || null;
            c = c && c.za || h;
            (h = Qi(R(a))) && ki(h);
            ij = h ? new ei(Qi(R(a))) : li;
            var k = new uo(function(q) { vo(a, k, m, !(!q || !q.keyCode)) }, hj, f ? null : function() { m.clear();
                    k.o();
                    V(a, b) }, I(R(a)), Ri(R(a)),
                f, ij, g, c);
            k.render(b);
            Z(a, k);
            d && k.a(d);
            e.callback = function(q) { k.u() && Bk(k.u());
                gj = q;
                hj || vo(a, k, m) };
            e["expired-callback"] = function() { gj = null };
            var m = new firebase.auth.RecaptchaVerifier(hj ? k.ba() : k.i(), e, go(a).app);
            W(a, k.K(t(m.render, m), [], function(q) { jj = q }, function(q) { q.name && "cancel" == q.name || (q = U(q), k.o(), V(a, b, void 0, q)) }))
        };
        J.prefilledEmailSignIn = function(a, b, c) {
            var d = new En;
            d.render(b);
            Z(a, d);
            W(a, d.K(t(X(a).fetchSignInMethodsForEmail, X(a)), [c], function(e) {
                d.o();
                var f = !(!Cm(a) || !bn(a));
                Dm(a, b, e,
                    c, void 0, void 0, f)
            }, function(e) { e = U(e);
                d.o();
                K("signIn", a, b, c, e) }))
        };

        function wo(a, b, c, d, e) { O.call(this, Pl, { Rb: b }, e, "providerSignIn", { G: c, F: d });
            this.i = a }
        n(wo, O);
        wo.prototype.v = function() { this.l(this.i);
            O.prototype.v.call(this) };
        wo.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(wo.prototype, { l: function(a) {
                function b(g) { a(g) } for (var c = this.f ? Yc("firebaseui-id-idp-button", this.f || this.s.a) : [], d = 0; d < c.length; d++) { var e = c[d],
                        f = io(e, "providerId");
                    N(this, e, Ba(b, f)) } } });
        J.providerSignIn = function(a,
            b, c, d) { var e = new wo(function(f) { f == firebase.auth.EmailAuthProvider.PROVIDER_ID ? (e.o(), Tm(a, b, d)) : f == firebase.auth.PhoneAuthProvider.PROVIDER_ID ? (e.o(), K("phoneSignInStart", a, b)) : "anonymous" == f ? Pm(a, e) : Mm(a, e, f, d);
                Y(a);
                a.l.cancel() }, Ei(R(a)), I(R(a)), Ri(R(a)));
            e.render(b);
            Z(a, e);
            c && e.a(c);
            xo(a) };
        J.sendEmailLinkForSignIn = function(a, b, c, d) { var e = new en;
            e.render(b);
            Z(a, e);
            Vm(a, e, c, d, function(f) { e.o();
                f = U(f);
                K("signIn", a, b, c, f) }) };

        function yo(a, b, c, d, e, f, g) {
            O.call(this, jl, { email: c, Wa: !!b, ia: !!f }, g, "signIn", { G: d, F: e });
            this.i = a;
            this.u = b
        }
        n(yo, O);
        yo.prototype.v = function() { this.B(this.i);
            this.D(this.i, this.u || void 0);
            this.l().focus();
            Bn(this.l(), (this.l().value || "").length);
            O.prototype.v.call(this) };
        yo.prototype.m = function() { this.u = this.i = null;
            O.prototype.m.call(this) };
        u(yo.prototype, { l: dm, P: em, B: fm, J: gm, j: hm, U: Vl, S: Wl, D: Xl });
        J.signIn = function(a, b, c, d) {
            var e = Cm(a),
                f = e && Hi(R(a)) != ti,
                g = new yo(function() { var h = g,
                        k = h.j() || "";
                    k && Um(a, h, k) }, f ? null : function() { g.o();
                    V(a, b, c) }, c, I(R(a)), Ri(R(a)), e);
            g.render(b);
            Z(a,
                g);
            d && g.a(d)
        };

        function zo(a, b, c, d, e, f) { O.call(this, Al, { email: a }, f, "unsupportedProvider", { G: d, F: e });
            this.l = b;
            this.i = c }
        n(zo, O);
        zo.prototype.v = function() { this.B(this.l, this.i);
            this.u().focus();
            O.prototype.v.call(this) };
        zo.prototype.m = function() { this.i = this.l = null;
            O.prototype.m.call(this) };
        u(zo.prototype, { u: Vl, D: Wl, B: Xl });
        J.unsupportedProvider = function(a, b, c) { var d = new zo(c, function() { d.o();
                K("passwordRecovery", a, b, c) }, function() { d.o();
                V(a, b, c) }, I(R(a)), Ri(R(a)));
            d.render(b);
            Z(a, d) };

        function Ao(a, b) {
            this.Z = !1;
            var c = Bo(b);
            if (Co[c]) throw Error('An AuthUI instance already exists for the key "' + c + '"');
            Co[c] = this;
            this.f = a;
            this.u = null;
            this.X = !1;
            Do(this.f);
            this.a = firebase.initializeApp({ apiKey: a.app.options.apiKey, authDomain: a.app.options.authDomain }, a.app.name + "-firebaseui-temp").auth();
            Do(this.a);
            this.a.setPersistence && this.a.setPersistence(firebase.auth.Auth.Persistence.SESSION);
            this.oa = b;
            this.ca = new si;
            this.h = this.O = this.i = this.I = this.N = null;
            this.s = [];
            this.Y = !1;
            this.l = Tf.Ya();
            this.j = this.C = null;
            this.da =
                this.w = !1
        }

        function Do(a) { a && a.INTERNAL && a.INTERNAL.logFramework && a.INTERNAL.logFramework("FirebaseUI-web") }
        var Co = {};

        function Bo(a) { return a || "[DEFAULT]" }

        function Nm(a) {
            Y(a);
            a.i || (a.i = Eo(a, function(b) { return b && !Qh(T(a)) ? G(go(a).getRedirectResult().then(function(c) { return c }, function(c) { if (c && "auth/email-already-in-use" == c.code && c.email && c.credential) throw c; return Fo(a, c) })) : G(X(a).getRedirectResult().then(function(c) { return yi(R(a)) && !c.user && a.j && !a.j.isAnonymous ? go(a).getRedirectResult() : c })) }));
            return a.i
        }

        function Z(a, b) { Y(a);
            a.h = b }
        var Go = null;

        function Wm() { return Go }

        function X(a) { Y(a); return a.a }

        function go(a) { Y(a); return a.f }

        function T(a) { Y(a); return a.oa }

        function bn(a) { Y(a); return a.N ? a.N.emailHint : void 0 }
        l = Ao.prototype;
        l.ob = function() { Y(this); return !!Th(T(this)) || Ho(yf()) };

        function Ho(a) { a = new Vb(a); return "signIn" === (a.a.a.get(x.wb) || null) && !!a.a.a.get(x.ab) }
        l.start = function(a, b) { Io(this, a, b) };

        function Io(a, b, c, d) {
            Y(a);
            "undefined" !== typeof a.f.languageCode && (a.u = a.f.languageCode);
            var e =
                "en".replace(/_/g, "-");
            a.f.languageCode = e;
            a.a.languageCode = e;
            a.X = !0;
            "undefined" !== typeof a.f.tenantId && (a.a.tenantId = a.f.tenantId);
            a.jb(c);
            a.N = d || null;
            var f = p.document;
            a.C ? a.C.then(function() { "complete" == f.readyState ? Jo(a, b) : pe(window, "load", function() { Jo(a, b) }) }) : "complete" == f.readyState ? Jo(a, b) : pe(window, "load", function() { Jo(a, b) })
        }

        function Jo(a, b) {
            var c = xf(b, "Could not find the FirebaseUI widget element on the page.");
            c.setAttribute("lang", "en".replace(/_/g, "-"));
            if (Go) {
                var d = Go;
                Y(d);
                Qh(T(d)) &&
                    Ag("UI Widget is already rendered on the page and is pending some user interaction. Only one widget instance can be rendered per page. The previous instance has been automatically reset.");
                Go.reset()
            }
            Go = a;
            a.O = c;
            Ko(a, c);
            rh(new sh) && rh(new th) ? an(a, b) : (b = xf(b, "Could not find the FirebaseUI widget element on the page."), c = new um(C("The browser you are using does not support Web Storage. Please try again in a different browser.").toString()), c.render(b), Z(a, c));
            b = a.h && "blank" == a.h.Ea && Wi(R(a));
            Th(T(a)) &&
                !b && (b = Th(T(a)), Gn(a, b.a), Jh(Ch, T(a)))
        }

        function Eo(a, b) { if (a.w) return b(Lo(a));
            W(a, function() { a.w = !1 }); if (yi(R(a))) { var c = new Ze(function(d) { W(a, a.f.onAuthStateChanged(function(e) { a.j = e;
                        a.w || (a.w = !0, d(b(Lo(a)))) })) });
                W(a, c); return c }
            a.w = !0; return b(null) }

        function Lo(a) { Y(a); return yi(R(a)) && a.j && a.j.isAnonymous ? a.j : null }

        function W(a, b) { Y(a); if (b) { a.s.push(b); var c = function() { Ua(a.s, function(d) { return d == b }) }; "function" != typeof b && b.then(c, c) } }
        l.disableAutoSignIn = function() { Y(this);
            this.Y = !0 };

        function Mo(a) {
            Y(a);
            var b;
            (b = a.Y) || (a = R(a), a = Ni(a, firebase.auth.GoogleAuthProvider.PROVIDER_ID), b = !(!a || "select_account" !== a.prompt));
            return b
        }

        function Hm(a) { "undefined" !== typeof a.f.languageCode && a.X && (a.X = !1, a.f.languageCode = a.u) }

        function Gn(a, b) { a.f.tenantId = b;
            a.a.tenantId = b }
        l.reset = function() {
            Y(this);
            var a = this;
            this.O && this.O.removeAttribute("lang");
            this.I && He(this.I);
            Hm(this);
            this.N = null;
            cn();
            Jh(Ch, T(this));
            Y(this);
            this.l.cancel();
            this.i = G({ user: null, credential: null });
            Go == this && (Go = null);
            this.O = null;
            for (var b = 0; b <
                this.s.length; b++)
                if ("function" == typeof this.s[b]) this.s[b]();
                else this.s[b].cancel && this.s[b].cancel();
            this.s = [];
            Rh(T(this));
            this.h && (this.h.o(), this.h = null);
            this.L = null;
            this.a && (this.C = mn(this).then(function() { a.C = null }, function() { a.C = null }))
        };

        function Ko(a, b) { a.L = null;
            a.I = new Ie(b);
            a.I.register();
            oe(a.I, "pageEnter", function(c) { c = c && c.pageId; if (a.L != c) { var d = R(a);
                    (d = aj(d).uiChanged || null) && d(a.L, c);
                    a.L = c } }) }
        l.jb = function(a) {
            Y(this);
            var b = this.ca,
                c;
            for (c in a) try { Zh(b.a, c, a[c]) } catch (d) {
                vg('Invalid config: "' +
                    c + '"', void 0)
            }
            lc && Zh(b.a, "popupMode", !1);
            Qi(b);
            !this.da && bj(R(this)) && (Ag("signInSuccess callback is deprecated. Please use signInSuccessWithAuthResult callback instead."), this.da = !0)
        };

        function R(a) { Y(a); return a.ca }
        l.Vb = function() {
            Y(this);
            var a = R(this),
                b = $h(a.a, "widgetUrl");
            var c = wi(a, b);
            R(this).a.get("popupMode") ? (a = (window.screen.availHeight - 600) / 2, b = (window.screen.availWidth - 500) / 2, c = c || "about:blank", a = { width: 500, height: 600, top: 0 < a ? a : 0, left: 0 < b ? b : 0, location: !0, resizable: !0, statusbar: !0, toolbar: !1 },
                a.target = a.target || c.target || "google_popup", a.width = a.width || 690, a.height = a.height || 500, (a = tf(c, a)) && a.focus()) : uf(c)
        };

        function Y(a) { if (a.Z) throw Error("AuthUI instance is deleted!"); }
        l.Xa = function() { var a = this;
            Y(this); return this.a.app.delete().then(function() { var b = Bo(T(a));
                delete Co[b];
                a.reset();
                a.Z = !0 }) };

        function xo(a) { Y(a); try { Uf(a.l, Gi(R(a)), Mo(a)).then(function(b) { return a.h ? Qm(a, a.h, b) : !1 }) } catch (b) {} }
        l.Hb = function(a, b) {
            Y(this);
            var c = this,
                d = Af();
            if (!Ti(R(this))) return hf(Error("Email link sign-in should be enabled to trigger email sending."));
            var e = Vi(R(this)),
                f = new Vb(e.url);
            Wb(f, d);
            b && b.a && (Xh(d, b, T(this)), Zb(f, b.a.providerId));
            Xb(f, Ui(R(this)));
            return Eo(this, function(g) { g && ((g = g.uid) ? f.a.a.set(x.Qa, g) : Tb(f.a.a, x.Qa));
                e.url = f.toString(); return X(c).sendSignInLinkToEmail(a, e) }).then(function() { var g = T(c),
                    h = {};
                h.email = a;
                Kh(Gh, fh(d, JSON.stringify(h)), g) }, function(g) { Jh(Hh, T(c));
                Jh(Gh, T(c)); throw g; })
        };

        function Hn(a, b) {
            var c = Yb(new Vb(b));
            if (!c) return G(null);
            b = new Ze(function(d, e) {
                var f = go(a).onAuthStateChanged(function(g) {
                    f();
                    g && g.isAnonymous &&
                        g.uid === c ? d(g) : g && g.isAnonymous && g.uid !== c ? e(Error("anonymous-user-mismatch")) : e(Error("anonymous-user-not-found"))
                });
                W(a, f)
            });
            W(a, b);
            return b
        }

        function Ln(a, b, c, d, e) {
            Y(a);
            var f = e || null,
                g = firebase.auth.EmailAuthProvider.credentialWithLink(c, d);
            c = f ? X(a).signInWithEmailLink(c, d).then(function(h) { return h.user.linkWithCredential(f) }).then(function() { return mn(a) }).then(function() { return Fo(a, { code: "auth/email-already-in-use" }, f) }) : X(a).fetchSignInMethodsForEmail(c).then(function(h) {
                return h.length ? Fo(a, { code: "auth/email-already-in-use" }, g) : b.linkWithCredential(g)
            });
            W(a, c);
            return c
        }

        function Mn(a, b, c, d) {
            Y(a);
            var e = d || null,
                f;
            b = X(a).signInWithEmailLink(b, c).then(function(g) { f = { user: g.user, credential: null, operationType: g.operationType, additionalUserInfo: g.additionalUserInfo }; if (e) return g.user.linkWithCredential(e).then(function(h) { f = { user: h.user, credential: e, operationType: f.operationType, additionalUserInfo: h.additionalUserInfo } }) }).then(function() { mn(a) }).then(function() { return go(a).updateCurrentUser(f.user) }).then(function() {
                f.user =
                    go(a).currentUser;
                return f
            });
            W(a, b);
            return b
        }

        function cn() { var a = yf(); if (Ho(a)) { a = new Vb(a); for (var b in x) x.hasOwnProperty(b) && Tb(a.a.a, x[b]);
                b = { state: "signIn", mode: "emailLink", operation: "clear" }; var c = p.document.title;
                p.history && p.history.replaceState && p.history.replaceState(b, c, a.toString()) } }
        l.ac = function(a, b) {
            Y(this);
            var c = this;
            return X(this).signInWithEmailAndPassword(a, b).then(function(d) {
                return Eo(c, function(e) {
                    return e ? mn(c).then(function() {
                        return Fo(c, { code: "auth/email-already-in-use" },
                            firebase.auth.EmailAuthProvider.credential(a, b))
                    }) : d
                })
            })
        };
        l.Xb = function(a, b) { Y(this); var c = this; return Eo(this, function(d) { if (d) { var e = firebase.auth.EmailAuthProvider.credential(a, b); return d.linkWithCredential(e) } return X(c).createUserWithEmailAndPassword(a, b) }) };
        l.$b = function(a) { Y(this); var b = this; return Eo(this, function(c) { return c ? c.linkWithCredential(a).then(function(d) { return d }, function(d) { if (d && "auth/email-already-in-use" == d.code && d.email && d.credential) throw d; return Fo(b, d, a) }) : X(b).signInWithCredential(a) }) };

        function Om(a, b) { Y(a); return Eo(a, function(c) { return c && !Qh(T(a)) ? c.linkWithPopup(b).then(function(d) { return d }, function(d) { if (d && "auth/email-already-in-use" == d.code && d.email && d.credential) throw d; return Fo(a, d) }) : X(a).signInWithPopup(b) }) }
        l.cc = function(a) { Y(this); var b = this,
                c = this.i;
            this.i = null; return Eo(this, function(d) { return d && !Qh(T(b)) ? d.linkWithRedirect(a) : X(b).signInWithRedirect(a) }).then(function() {}, function(d) { b.i = c; throw d; }) };
        l.bc = function(a, b) {
            Y(this);
            var c = this;
            return Eo(this, function(d) {
                return d ?
                    d.linkWithPhoneNumber(a, b).then(function(e) { return new Zf(e, function(f) { if ("auth/credential-already-in-use" == f.code) return Fo(c, f); throw f; }) }) : go(c).signInWithPhoneNumber(a, b).then(function(e) { return new Zf(e) })
            })
        };
        l.Zb = function() { Y(this); return go(this).signInAnonymously() };

        function Jm(a, b) {
            Y(a);
            return Eo(a, function(c) {
                if (a.j && !a.j.isAnonymous && yi(R(a)) && !X(a).currentUser) return mn(a).then(function() { "password" == b.credential.providerId && (b.credential = null); return b });
                if (c) return mn(a).then(function() { return c.linkWithCredential(b.credential) }).then(function(d) {
                    b.user =
                        d.user;
                    b.credential = d.credential;
                    b.operationType = d.operationType;
                    b.additionalUserInfo = d.additionalUserInfo;
                    return b
                }, function(d) { if (d && "auth/email-already-in-use" == d.code && d.email && d.credential) throw d; return Fo(a, d, b.credential) });
                if (!b.user) throw Error('Internal error: An incompatible or outdated version of "firebase.js" may be used.');
                return mn(a).then(function() { return go(a).updateCurrentUser(b.user) }).then(function() {
                    b.user = go(a).currentUser;
                    b.operationType = "signIn";
                    b.credential && b.credential.providerId &&
                        "password" == b.credential.providerId && (b.credential = null);
                    return b
                })
            })
        }
        l.Wb = function(a, b) { Y(this); return X(this).signInWithEmailAndPassword(a, b) };

        function mn(a) { Y(a); return X(a).signOut() }

        function Fo(a, b, c) { Y(a); if (b && b.code && ("auth/email-already-in-use" == b.code || "auth/credential-already-in-use" == b.code)) { var d = zi(R(a)); return G().then(function() { return d(new Rd("anonymous-upgrade-merge-conflict", null, c || b.credential)) }).then(function() { a.h && (a.h.o(), a.h = null); throw b; }) } return hf(b) }

        function No(a,
            b, c, d) { O.call(this, Ul, void 0, d, "providerMatchByEmail", { G: b, F: c });
            this.i = a }
        n(No, O);
        No.prototype.v = function() { this.u(this.i);
            this.B(this.i);
            this.l().focus();
            Bn(this.l(), (this.l().value || "").length);
            O.prototype.v.call(this) };
        No.prototype.m = function() { this.i = null;
            O.prototype.m.call(this) };
        u(No.prototype, { l: dm, J: em, u: fm, D: gm, j: hm, P: Vl, B: Xl });

        function Oo(a, b, c, d, e) { O.call(this, Tl, { dc: b }, e, "selectTenant", { G: c, F: d });
            this.i = a }
        n(Oo, O);
        Oo.prototype.v = function() { Po(this, this.i);
            O.prototype.v.call(this) };
        Oo.prototype.m =
            function() { this.i = null;
                O.prototype.m.call(this) };

        function Po(a, b) {
            function c(h) { b(h) } for (var d = a.f ? Yc("firebaseui-id-tenant-selection-button", a.f || a.s.a) : [], e = 0; e < d.length; e++) { var f = d[e],
                    g = io(f, "tenantId");
                N(a, f, Ba(c, g)) } }

        function Qo(a) { O.call(this, pl, void 0, a, "spinner") }
        n(Qo, O);

        function Ro(a) {
            this.a = new Yh;
            H(this.a, "authDomain");
            H(this.a, "displayMode", So);
            H(this.a, "tenants");
            H(this.a, "callbacks");
            H(this.a, "tosUrl");
            H(this.a, "privacyPolicyUrl");
            for (var b in a)
                if (a.hasOwnProperty(b)) try {
                    Zh(this.a,
                        b, a[b])
                } catch (c) { vg('Invalid config: "' + b + '"', void 0) }
        }

        function To(a) { a = a.a.get("displayMode"); for (var b in Uo)
                if (Uo[b] === a) return Uo[b];
            return So }

        function Vo(a) { return a.a.get("callbacks") || {} }

        function Wo(a) { var b = a.a.get("tosUrl") || null;
            a = a.a.get("privacyPolicyUrl") || null;
            b && !a && Ag("Privacy Policy URL is missing, the link will not be displayed."); if (b && a) { if ("function" === typeof b) return b; if ("string" === typeof b) return function() { wf(b) } } return null }

        function Xo(a) {
            var b = a.a.get("tosUrl") || null,
                c =
                a.a.get("privacyPolicyUrl") || null;
            c && !b && Ag("Terms of Service URL is missing, the link will not be displayed.");
            if (b && c) { if ("function" === typeof c) return c; if ("string" === typeof c) return function() { wf(c) } }
            return null
        }

        function Yo(a, b) { a = a.a.get("tenants"); if (!a || !a.hasOwnProperty(b) && !a.hasOwnProperty(Zo)) throw Error("Invalid tenant configuration!"); }

        function $o(a, b, c) {
            a = a.a.get("tenants");
            if (!a) throw Error("Invalid tenant configuration!");
            var d = [];
            a = a[b] || a[Zo];
            if (!a) return vg("Invalid tenant configuration: " +
                (b + " is not configured!"), void 0), d;
            b = a.signInOptions;
            if (!b) throw Error("Invalid tenant configuration: signInOptions are invalid!");
            b.forEach(function(e) { if ("string" === typeof e) d.push(e);
                else if ("string" === typeof e.provider) { var f = e.hd;
                    f && c ? (f instanceof RegExp ? f : new RegExp("@" + f.replace(".", "\\.") + "$")).test(c) && d.push(e.provider) : d.push(e.provider) } else e = "Invalid tenant configuration: signInOption " + (JSON.stringify(e) + " is invalid!"), vg(e, void 0) });
            return d
        }

        function ap(a, b, c) {
            a = bp(a, b);
            (b = a.signInOptions) &&
            c && (b = b.filter(function(d) { return "string" === typeof d ? c.includes(d) : c.includes(d.provider) }), a.signInOptions = b);
            return a
        }

        function bp(a, b) { var c = cp; var d = void 0 === d ? {} : d;
            Yo(a, b);
            a = a.a.get("tenants"); return Bf(a[b] || a[Zo], c, d) }
        var cp = ["immediateFederatedRedirect", "privacyPolicyUrl", "signInFlow", "signInOptions", "tosUrl"],
            So = "optionFirst",
            Uo = { oc: So, nc: "identifierFirst" },
            Zo = "*";

        function dp(a, b) {
            var c = this;
            this.s = xf(a);
            this.a = {};
            Object.keys(b).forEach(function(d) { c.a[d] = new Ro(b[d]) });
            this.pb = this.f = this.w =
                this.h = this.i = this.j = null;
            Object.defineProperty(this, "languageCode", { get: function() { return this.pb }, set: function(d) { this.pb = d || null }, enumerable: !1 })
        }
        l = dp.prototype;
        l.Tb = function(a, b) {
            var c = this;
            ep(this);
            var d = a.apiKey;
            return new Ze(function(e, f) {
                if (c.a.hasOwnProperty(d)) {
                    var g = Vo(c.a[d]).selectTenantUiHidden || null;
                    if (To(c.a[d]) === So) {
                        var h = [];
                        b.forEach(function(q) {
                            q = q || "_";
                            var E = c.a[d].a.get("tenants");
                            if (!E) throw Error("Invalid tenant configuration!");
                            (E = E[q] || E[Zo]) ? q = {
                                tenantId: "_" !== q ? q : null,
                                displayName: E.displayName,
                                Na: E.iconUrl,
                                Ga: E.buttonColor
                            }: (vg("Invalid tenant configuration: " + (q + " is not configured!"), void 0), q = null);
                            q && h.push(q)
                        });
                        var k = function(q) { q = { tenantId: q, providerIds: $o(c.a[d], q || "_") };
                            e(q) };
                        if (1 === h.length) { k(h[0].tenantId); return }
                        c.f = new Oo(function(q) { ep(c);
                            g && g();
                            k(q) }, h, Wo(c.a[d]), Xo(c.a[d]))
                    } else c.f = new No(function() { var q = c.f.j(); if (q) { for (var E = 0; E < b.length; E++) { var S = $o(c.a[d], b[E] || "_", q); if (0 !== S.length) { q = { tenantId: b[E], providerIds: S, email: q };
                                        ep(c);
                                        g && g();
                                        e(q); return } }
                                c.f.a(Pd({ code: "no-matching-tenant-for-email" }).toString()) } },
                        Wo(c.a[d]), Xo(c.a[d]));
                    c.f.render(c.s);
                    (f = Vo(c.a[d]).selectTenantUiShown || null) && f()
                } else { var m = Error("Invalid project configuration: API key is invalid!");
                    m.code = "invalid-configuration";
                    c.qb(m);
                    f(m) }
            })
        };
        l.Ob = function(a, b) {
            if (!this.a.hasOwnProperty(a)) throw Error("Invalid project configuration: API key is invalid!");
            var c = b || void 0;
            Yo(this.a[a], b || "_");
            try { this.i = firebase.app(c).auth() } catch (e) {
                var d = this.a[a].a.get("authDomain");
                if (!d) throw Error("Invalid project configuration: authDomain is required!");
                a = firebase.initializeApp({ apiKey: a, authDomain: d }, c);
                a.auth().tenantId = b;
                this.i = a.auth()
            }
            return this.i
        };
        l.Yb = function(a, b) {
            var c = this;
            return new Ze(function(d, e) {
                function f(E, S) { c.j = new Ao(a);
                    Io(c.j, c.s, E, S) }
                var g = a.app.options.apiKey;
                c.a.hasOwnProperty(g) || e(Error("Invalid project configuration: API key is invalid!"));
                var h = ap(c.a[g], a.tenantId || "_", b && b.providerIds);
                ep(c);
                e = { signInSuccessWithAuthResult: function(E) { d(E); return !1 } };
                var k = Vo(c.a[g]).signInUiShown || null,
                    m = !1;
                e.uiChanged = function(E, S) {
                    null ===
                        E && "callback" === S ? ((E = $c("firebaseui-id-page-callback", c.s)) && Bk(E), c.h = new Qo, c.h.render(c.s)) : m || null === E && "spinner" === S || "blank" === S || (c.h && (c.h.o(), c.h = null), m = !0, k && k(a.tenantId))
                };
                h.callbacks = e;
                h.credentialHelper = "none";
                var q;
                b && b.email && (q = { emailHint: b.email });
                c.j ? c.j.Xa().then(function() { f(h, q) }) : f(h, q)
            })
        };
        l.reset = function() { var a = this; return G().then(function() { a.j && a.j.Xa() }).then(function() { a.j = null;
                ep(a) }) };
        l.Ub = function() {
            var a = this;
            this.h || this.w || (this.w = window.setTimeout(function() {
                ep(a);
                a.h = new Qo;
                a.f = a.h;
                a.h.render(a.s);
                a.w = null
            }, 500))
        };
        l.nb = function() { window.clearTimeout(this.w);
            this.w = null;
            this.h && (this.h.o(), this.h = null) };
        l.Cb = function() { ep(this);
            this.f = new pm;
            this.f.render(this.s); return G() };

        function ep(a) { a.j && a.j.reset();
            a.nb();
            a.f && a.f.o() }
        l.qb = function(a) { var b = this,
                c = Pd({ code: a.code }).toString() || a.message;
            ep(this); var d;
            a.retry && va(a.retry) && (d = function() { b.reset();
                a.retry() });
            this.f = new tm(c, d);
            this.f.render(this.s) };
        l.Qb = function(a) {
            var b = this;
            return G().then(function() {
                var c =
                    b.i && b.i.app.options.apiKey;
                if (!b.a.hasOwnProperty(c)) throw Error("Invalid project configuration: API key is invalid!");
                Yo(b.a[c], a.tenantId || "_");
                if (!b.i.currentUser || b.i.currentUser.uid !== a.uid) throw Error("The user being processed does not match the signed in user!");
                return (c = Vo(b.a[c]).beforeSignInSuccess || null) ? c(a) : a
            }).then(function(c) { if (c.uid !== a.uid) throw Error("User with mismatching UID returned."); return c })
        };
        v("firebaseui.auth.FirebaseUiHandler", dp);
        v("firebaseui.auth.FirebaseUiHandler.prototype.selectTenant",
            dp.prototype.Tb);
        v("firebaseui.auth.FirebaseUiHandler.prototype.getAuth", dp.prototype.Ob);
        v("firebaseui.auth.FirebaseUiHandler.prototype.startSignIn", dp.prototype.Yb);
        v("firebaseui.auth.FirebaseUiHandler.prototype.reset", dp.prototype.reset);
        v("firebaseui.auth.FirebaseUiHandler.prototype.showProgressBar", dp.prototype.Ub);
        v("firebaseui.auth.FirebaseUiHandler.prototype.hideProgressBar", dp.prototype.nb);
        v("firebaseui.auth.FirebaseUiHandler.prototype.completeSignOut", dp.prototype.Cb);
        v("firebaseui.auth.FirebaseUiHandler.prototype.handleError",
            dp.prototype.qb);
        v("firebaseui.auth.FirebaseUiHandler.prototype.processUser", dp.prototype.Qb);
        v("firebaseui.auth.AuthUI", Ao);
        v("firebaseui.auth.AuthUI.getInstance", function(a) { a = Bo(a); return Co[a] ? Co[a] : null });
        v("firebaseui.auth.AuthUI.prototype.disableAutoSignIn", Ao.prototype.disableAutoSignIn);
        v("firebaseui.auth.AuthUI.prototype.start", Ao.prototype.start);
        v("firebaseui.auth.AuthUI.prototype.setConfig", Ao.prototype.jb);
        v("firebaseui.auth.AuthUI.prototype.signIn", Ao.prototype.Vb);
        v("firebaseui.auth.AuthUI.prototype.reset",
            Ao.prototype.reset);
        v("firebaseui.auth.AuthUI.prototype.delete", Ao.prototype.Xa);
        v("firebaseui.auth.AuthUI.prototype.isPendingRedirect", Ao.prototype.ob);
        v("firebaseui.auth.AuthUIError", Rd);
        v("firebaseui.auth.AuthUIError.prototype.toJSON", Rd.prototype.toJSON);
        v("firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM", ti);
        v("firebaseui.auth.CredentialHelper.GOOGLE_YOLO", Ii);
        v("firebaseui.auth.CredentialHelper.NONE", dj);
        v("firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID", "anonymous");
        Ze.prototype["catch"] =
            Ze.prototype.ta;
        Ze.prototype["finally"] = Ze.prototype.ec
    }).apply(typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : window);
}).apply(typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : window);