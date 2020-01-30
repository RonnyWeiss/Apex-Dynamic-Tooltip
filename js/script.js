var dynamicTooltip = (function () {
    "use strict";
    var scriptVersion = "1.5";
    var util = {
        version: "1.2.1",
        isAPEX: function () {
            if (typeof (apex) !== 'undefined') {
                return true;
            } else {
                return false;
            }
        },
        debug: {
            info: function (str) {
                if (util.isAPEX()) {
                    apex.debug.info(str);
                }
            },
            error: function (str) {
                if (util.isAPEX()) {
                    apex.debug.error(str);
                } else {
                    console.error(str);
                }
            }
        },
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
                    console.error("Error while try to parse targetConfig. Please check your Config JSON. Standard Config will be used.");
                    console.error(e);
                    console.error(targetConfig);
                }
            } else {
                tmpJSON = targetConfig;
            }
            /* try to merge with standard if any attribute is missing */
            try {
                finalConfig = $.extend(true, srcConfig, tmpJSON);
            } catch (e) {
                console.error('Error while try to merge 2 JSONs into standard JSON if any attribute is missing. Please check your Config JSON. Standard Config will be used.');
                console.error(e);
                finalConfig = srcConfig;
                console.error(finalConfig);
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
                        .children('img')
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
        initialize: function (elemetSelector, ajaxID, items2Submit, pKey, sKey, tKey, udConfigJSON, escapeRequired, sanitizeHTML, sanitizeHTMLOptions) {
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

            /* for each element bind events */
            $.each(element, function () {
                var _this = $(this);
                var attr = _this.attr("hastooltip");

                /* Used to bind only one time the events */
                if (typeof attr === typeof undefined && attr !== true) {
                    _this.attr("hastooltip", true);
                    /***********************************************************************
                     **
                     ** Used to get data and to show tooltip with a little timeout to 
                     ** to much data loading
                     **
                     ***********************************************************************/
                    _this.on("mouseenter", function (obj) {
                        setTimeout(function () {
                            if (_this.is(":hover")) {
                                setTimeout(function () {
                                    if (_this.is(":hover")) {
                                        /* set values of the pk items */
                                        apex.item(pKey).setValue($(_this).attr("pk"), null, true);
                                        apex.item(sKey).setValue($(_this).attr("sk"), null, true);
                                        apex.item(tKey).setValue($(_this).attr("tk"), null, true);
                                        /* call server and submit all items */
                                        apex.server.plugin(
                                            ajaxID, {
                                                pageItems: items2Submit
                                            }, {
                                                success: function (pData) {
                                                    if (_this.is(":hover")) {
                                                        showTooltip(pData);
                                                        util.tooltip.setPosition(obj);
                                                    }
                                                },
                                                error: function (d) {
                                                    console.log(d.responseText);
                                                },
                                                dataType: "json"
                                            });
                                    }
                                }, Math.round(configJSON.ajaxDelay / 2));
                            }
                        }, Math.round(configJSON.ajaxDelay / 2));
                    });

                    /***********************************************************************
                     **
                     ** Hide tooltip when mouse leaves object
                     **
                     ***********************************************************************/
                    _this.on("mouseleave", function () {
                        util.tooltip.hide();
                    });

                    /***********************************************************************
                     **
                     ** Used to set position when mouse if moving oder object
                     **
                     ***********************************************************************/
                    _this.on("mousemove", function (event) {
                        util.tooltip.setPosition(event);
                    });
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
