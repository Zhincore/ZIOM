/**
 * Better jQuery click event that's not invoked when you drag or select text
 *
 * Copyright (C) 2018 Jakub T. Jankiewicz <https://jcubic.pl/me>
 * Released under MIT license
 *
 * solution based on this SO question
 * https://stackoverflow.com/a/21851799/387194
 */
/* global jQuery, setTimeout, clearTimeout, define, module, exports */
(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
})(function ($) {
    $.event.special.draglessClick = {
        setup: function() {
            console.log('setup');
            var $element = $(this);
            var callbacks = $.Callbacks();
            var isDragging = false;
            var timer;
            var handlers = {
                move: function mousemove() {
                    isDragging = true;
                    $(window).off('mousemove', handlers.move);
                },
                down: function() {
                    isDragging = false;
                    // there is wierd issue where move is triggerd just
                    // after mousedown even without moving the cursor
                    timer = setTimeout(function() {
                        $(window).mousemove(handlers.move);
                    }, 100);
                },
                up: function() {
                    clearTimeout(timer);
                    $(window).off('mousemove', handlers.move);
                },
                click: function(e) {
                    var wasDragging = isDragging;
                    isDragging = false;
                    if (!wasDragging) {
                        callbacks.fireWith(this, [e]);
                    }
                }
            };
            $element
                .data('handlers', handlers)
                .data('callbacks', callbacks)
                .mousedown(handlers.down)
                .mouseup(handlers.up)
                .click(handlers.click);
        },
        teardown: function() {
            var $element = $(this);
            var callbacks = $element.data('callbacks');
            callbacks.empty();
            $element.removeData('callbacks');
            var handlers = $element.data('handlers');
            if (handlers) {
                $(window).off('mousemove', handlers.move);
            }
            $element
                .off('mousedown', handlers.down)
                .off('mouseup', handlers.up)
                .off('click', handlers.click);
        },
        add: function(handlerObject) {
            $(this).data('callbacks').add(handlerObject.handler);
        },
        remove: function(handlerObject) {
            $(this).data('callbacks').remove(handlerObject.handler);
        },
        trigger: function(e, data) {
            var event = $.Event('click');
            $(this).data('callbacks').fireWith(this, [event]);
        }
    };
});
