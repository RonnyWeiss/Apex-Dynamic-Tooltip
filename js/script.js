var dynamicTooltip = (function () {
    "use strict";
    var util = {
        /**********************************************************************************
         ** required functions 
         *********************************************************************************/
        featureInfo: {
            name: "APEX-Dynamic-Tooltip",
            info: {
                scriptVersion: "1.7",
                utilVersion: "1.3.3",
                url: "https://github.com/RonnyWeiss",
                license: "MIT"
            }
        },
        isDefinedAndNotNull: function (pInput) {
            if (typeof pInput !== "undefined" && pInput !== null && pInput != "") {
                return true;
            } else {
                return false;
            }
        },
        isAPEX: function () {
            if (typeof (apex) !== 'undefined') {
                return true;
            } else {
                return false;
            }
        },
        varType: function (pObj) {
            if (typeof pObj === "object") {
                var arrayConstructor = [].constructor;
                var objectConstructor = ({}).constructor;
                if (pObj.constructor === arrayConstructor) {
                    return "array";
                }
                if (pObj.constructor === objectConstructor) {
                    return "json";
                }
            } else {
                return typeof pObj;
            }
        },
        debug: {
            info: function () {
                if (util.isAPEX()) {
                    var arr = Array.from(arguments);
                    arr.push(util.featureInfo);
                    apex.debug.info.apply(this, arr);
                }
            },
            error: function () {
                var arr = Array.from(arguments);
                arr.push(util.featureInfo);
                if (util.isAPEX()) {
                    apex.debug.error.apply(this, arr);
                } else {
                    console.error.apply(this, arr);
                }
            }
        },
        /**********************************************************************************
         ** optinal functions 
         *********************************************************************************/
        escapeHTML: function (str) {
            if (str === null) {
                return null;
            }
            if (typeof str === "undefined") {
                return;
            }
            if (typeof str === "object") {
                try {
                    str = JSON.stringify(str);
                } catch (e) {
                    /*do nothing */
                }
            }
            if (util.isAPEX()) {
                return apex.util.escapeHTML(String(str));
            } else {
                str = String(str);
                return str
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#x27;")
                    .replace(/\//g, "&#x2F;");
            }
        },
        jsonSaveExtend: function (srcConfig, targetConfig) {
            var finalConfig = {};
            var tmpJSON = {};
            /* try to parse config json when string or just set */
            if (typeof targetConfig === 'string') {
                try {
                    tmpJSON = JSON.parse(targetConfig);
                } catch (e) {
                    util.debug.error({
                        "msg": "Error while try to parse targetConfig. Please check your Config JSON. Standard Config will be used.",
                        "err": e,
                        "targetConfig": targetConfig
                    });
                }
            } else {
                tmpJSON = $.extend(true, {}, targetConfig);
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, {}, srcConfig, tmpJSON);
            } catch (e) {
                finalConfig = $.extend(true, {}, srcConfig);
                util.debug.error({
                    "msg": "Error while try to merge 2 JSONs into standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.",
                    "err": e,
                    "finalConfig": finalConfig
                });
            }
            return finalConfig;
        },
        tooltip: {
            show: function (htmlContent, backgroundColor, maxWidth) {
                try {
                    if ($("#dynToolTip").length == 0) {
                        var tooltip = $("<div></div>")
                            .attr("id", "dynToolTip")
                            .css("max-width", "400px")
                            .css("position", "absolute")
                            .css("top", "0px")
                            .css("left", "0px")
                            .css("z-index", "2000")
                            .css("background-color", "rgba(240, 240, 240, 1)")
                            .css("padding", "10px")
                            .css("display", "block")
                            .css("top", "0")
                            .css("overflow-wrap", "break-word")
                            .css("word-wrap", "break-word")
                            .css("-ms-hyphens", "auto")
                            .css("-moz-hyphens", "auto")
                            .css("-webkit-hyphens", "auto")
                            .css("hyphens", "auto");
                        if (backgroundColor) {
                            tooltip.css("background-color", backgroundColor);
                        }
                        if (maxWidth) {
                            tooltip.css("max-width", maxWidth);
                        }
                        $("body").append(tooltip);
                    } else {
                        $("#dynToolTip").css("visibility", "visible");
                    }

                    $("#dynToolTip").html(htmlContent);
                    $("#dynToolTip")
                        .find("*")
                        .css("max-width", "100%")
                        .css("overflow-wrap", "break-word")
                        .css("word-wrap", "break-word")
                        .css("-ms-hyphens", "auto")
                        .css("-moz-hyphens", "auto")
                        .css("-webkit-hyphens", "auto")
                        .css("hyphens", "auto")
                        .css("white-space", "normal");
                    $("#dynToolTip")
                        .find("img")
                        .css("object-fit", "contain")
                        .css("object-position", "50% 0%");
                } catch (e) {
                    console.error('Error while try to show tooltip');
                    console.error(e);
                }
            },
            setPosition: function (event) {
                $("#dynToolTip").position({
                    my: "left+6 top+6",
                    of: event,
                    collision: "flipfit"
                });
            },
            hide: function () {
                $("#dynToolTip").css("visibility", "hidden");
            },
            remove: function () {
                $("#dynToolTip").remove();
            }
        },
        setItemValue: function (itemName, value) {
            if (util.isAPEX()) {
                if (apex.item(itemName) && apex.item(itemName).node != false) {
                    apex.item(itemName).setValue(value);
                } else {
                    util.debug.error("Please choose a set item. Because the value (" + value + ") can not be set on item (" + itemName + ")");
                }
            } else {
                util.debug.error("Error while try to call apex.item");
            }
        }
    };

    /***********************************************************************
     **
     ** Used to sanitize HTML
     **
     ***********************************************************************/
    function sanitizeVALUE(pValue, pSanitizeHTMLOptions) {
        return DOMPurify.sanitize(pValue, pSanitizeHTMLOptions);
    }

    return {
        initialize: function (elemetSelector, ajaxID, items2Submit, pKey, sKey, tKey, udConfigJSON, escapeRequired, sanitizeHTML, sanitizeHTMLOptions, openOn) {

            util.debug.info({
                "elemetSelector": elemetSelector,
                "ajaxID": ajaxID,
                "items2Submit": items2Submit,
                "pKey": pKey,
                "sKey": sKey,
                "tKey": tKey,
                "udConfigJSON": udConfigJSON,
                "escapeRequired": escapeRequired,
                "sanitizeHTML": sanitizeHTML,
                "sanitizeHTMLOptions": sanitizeHTMLOptions,
                "openOn": openOn
            });

            var stdConfigJSON = {
                "backgroundColor": "rgba(240, 240, 240, 1)",
                "maxWidth": "400px",
                "ajaxDelay": 500
            };

            var defaultSanitizeOptions = {
                "ALLOWED_ATTR": ["accesskey", "align", "alt", "always", "autocomplete", "autoplay", "border", "cellpadding", "cellspacing", "charset", "class", "dir", "height", "href", "id", "lang", "name", "rel", "required", "src", "style", "summary", "tabindex", "target", "title", "type", "value", "width"],
                "ALLOWED_TAGS": ["a", "address", "b", "blockquote", "br", "caption", "code", "dd", "div", "dl", "dt", "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "label", "li", "nl", "ol", "p", "pre", "s", "span", "strike", "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul"]
            };

            /* merge user defined sanitize options */
            var sanitizeHTMLOptionsFinal = util.jsonSaveExtend(defaultSanitizeOptions, sanitizeHTMLOptions);

            var configJSON = {};
            configJSON = util.jsonSaveExtend(stdConfigJSON, udConfigJSON);
            var element = $(elemetSelector);

            /* function to activate tooltip, get data and show tt */
            function activateTT(pObj, pEvent) {
                /* set values of the pk items */
                if (util.isDefinedAndNotNull(pKey)) {
                    util.setItemValue(pKey, $(pObj).attr("pk"), null, true);
                }
                if (util.isDefinedAndNotNull(sKey)) {
                    util.setItemValue(sKey, $(pObj).attr("sk"), null, true);
                }
                if (util.isDefinedAndNotNull(tKey)) {
                    util.setItemValue(tKey, $(pObj).attr("tk"), null, true);
                }

                /* call server and submit all items */
                apex.server.plugin(
                    ajaxID, {
                        pageItems: items2Submit
                    }, {
                        success: function (pData) {
                            if (openOn === "click") {
                                showTooltip(pData);
                                util.tooltip.setPosition(pEvent);
                            } else {
                                if (pObj.is(":hover")) {
                                    showTooltip(pData);
                                    util.tooltip.setPosition(pEvent);
                                }
                            }
                        },
                        error: function (d) {
                            util.debug.error(d.responseText);
                        },
                        dataType: "json"
                    });
            }

            /* for each element bind events */
            $.each(element, function () {
                var _this = $(this);
                var attr = _this.attr("hastooltip");

                /* Used to bind only one time the events */
                if (typeof attr === typeof undefined && attr !== true) {
                    _this.attr("hastooltip", true);
                    /***********************************************************************
                     **
                     ** Show tooltip
                     **
                     ***********************************************************************/
                    if (openOn === "click") {
                        _this.on("touchstart click", function (event) {
                            util.tooltip.hide();
                            activateTT(_this, event);
                        });
                    } else {
                        _this.on("mouseenter", function (event) {
                            /* used to debounce mousehover to save data */
                            setTimeout(function () {
                                if (_this.is(":hover")) {
                                    setTimeout(function () {
                                        if (_this.is(":hover")) {
                                            activateTT(_this, event);
                                        }
                                    }, Math.round(configJSON.ajaxDelay / 2));
                                }
                            }, Math.round(configJSON.ajaxDelay / 2));
                        });
                    }

                    /***********************************************************************
                     **
                     ** Hide tooltip
                     **
                     ***********************************************************************/
                    if (openOn === "click") {
                        $(document).on("touchstart click", function (e) {
                            if (!_this.is(e.target) && _this.has(e.target).length === 0) {
                                util.tooltip.hide();
                            }
                        });
                    } else {
                        _this.on("mouseleave", function () {
                            util.tooltip.hide();
                        });

                        _this.on("mousemove", function (event) {
                            util.tooltip.setPosition(event);
                        });
                    }
                }
            });

            /***********************************************************************
             **
             ** Used to show tooltip and set html content
             **
             ***********************************************************************/
            function showTooltip(content) {
                if (content.row[0]) {
                    if (content.row[0].TOOLTIP) {
                        var output = "";
                        var color = "";
                        var maxWidth = "";
                        if (escapeRequired !== false) {
                            output = util.escapeHTML(content.row[0].TOOLTIP);
                            color = util.escapeHTML(((content.row[0].BACKGROUNDCOLOR) ? content.row[0].BACKGROUNDCOLOR : configJSON.backgroundColor));
                            maxWidth = util.escapeHTML(configJSON.maxWidth);
                        } else {
                            if (sanitizeHTML == 'N') {
                                output = content.row[0].TOOLTIP;
                            } else {
                                output = sanitizeVALUE(content.row[0].TOOLTIP, sanitizeHTMLOptionsFinal);
                            }
                            color = ((content.row[0].BACKGROUNDCOLOR) ? content.row[0].BACKGROUNDCOLOR : configJSON.backgroundColor);
                            maxWidth = configJSON.maxWidth;
                        }

                        util.tooltip.show(output, color, maxWidth);
                    }
                }
            }
        }
    }
})();
