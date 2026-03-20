/**
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2015-2016 ForgeRock AS.
 * Portions Copyright 2024 Wren Security.
 */

define([
    "lodash",
    "jquery",
    "bootstrap"
], function (_, $, bootstrap) {

    var DIALOG_ID_COUNTER = 0;

    var SIZE_MAP = {
        "size-normal": "",
        "size-small": "modal-sm",
        "size-wide": "modal-lg",
        "size-large": "modal-xl"
    };

    function buildButton (btn) {
        var $btn = $("<button>", {
            type: "button",
            "class": "btn " + (btn.cssClass || "btn-secondary")
        });
        if (btn.id) {
            $btn.attr("id", btn.id);
        }
        if (btn.disabled) {
            $btn.prop("disabled", true);
        }
        $btn.text(btn.label);
        return $btn;
    }

    function buildModal (dialogId, options) {
        var sizeClass = SIZE_MAP[options.size] || "";

        var $modal = $("<div>", {
            "class": "modal fade " + (options.type || ""),
            id: dialogId,
            tabindex: "-1",
            role: "dialog"
        });

        var $dialog = $("<div>", { "class": "modal-dialog " + sizeClass });
        var $content = $("<div>", { "class": "modal-content" });

        var $header = $("<div>", { "class": "modal-header" });
        var $title = $("<h4>", { "class": "modal-title" }).text(options.title || "");
        var $closeBtn = $("<button>", {
            type: "button",
            "class": "btn-close",
            "data-bs-dismiss": "modal",
            "aria-label": "Close"
        });
        $header.append($title, $closeBtn);

        var $body = $("<div>", { "class": "modal-body" });
        if (options.message) {
            $body.append(options.message);
        }

        var $footer = $("<div>", { "class": "modal-footer" });
        if (options.buttons && options.buttons.length) {
            _.each(options.buttons, function (btn) {
                $footer.append(buildButton(btn));
            });
        } else {
            $footer.append($("<button>", {
                type: "button",
                "class": "btn btn-secondary",
                "data-bs-dismiss": "modal"
            }).text("Close"));
        }

        $content.append($header, $body, $footer);
        $dialog.append($content);
        $modal.append($dialog);
        return $modal;
    }

    /**
     * Dialog handle returned from show/confirm/warning/danger/success calls.
     * Provides compatibility shim for the old bootstrap-dialog API.
     */
    function DialogHandle (modalEl, bsModal) {
        this.$el = $(modalEl);
        this._bsModal = bsModal;
        this.$modalContent = this.$el.find(".modal-content");
    }

    DialogHandle.prototype.getModal = function () {
        return this.$el;
    };

    DialogHandle.prototype.getModalHeader = function () {
        return this.$el.find(".modal-header");
    };

    DialogHandle.prototype.getButton = function (id) {
        var $btn = this.$el.find("#" + id);
        return {
            disable: function () { $btn.prop("disabled", true); },
            enable: function () { $btn.prop("disabled", false); }
        };
    };

    DialogHandle.prototype.close = function () {
        this._bsModal.hide();
    };

    /**
     * @exports org/forgerock/commons/ui/common/components/BootstrapDialog
     */
    var obj = {};

    obj.TYPE_DEFAULT = "type-default";
    obj.TYPE_INFO = "type-info";
    obj.TYPE_PRIMARY = "type-primary";
    obj.TYPE_SUCCESS = "type-success";
    obj.TYPE_WARNING = "type-warning";
    obj.TYPE_DANGER = "type-danger";
    obj.SIZE_NORMAL = "size-normal";
    obj.SIZE_SMALL = "size-small";
    obj.SIZE_WIDE = "size-wide";
    obj.SIZE_LARGE = "size-large";

    obj.show = function (options) {
        var dialogId = options.id || ("fr-dialog-" + (++DIALOG_ID_COUNTER));
        var type = options.type || obj.TYPE_PRIMARY;

        // Remove any existing modal with the same ID to prevent DOM collisions.
        $("#" + dialogId).remove();

        var $modal = buildModal(dialogId, options).appendTo("body");
        var modalEl = $modal[0];

        var bsModal = new bootstrap.Modal(modalEl, { keyboard: true });
        var handle = new DialogHandle(modalEl, bsModal);

        // Apply Bootstrap text utility class derived from the type for color theming.
        handle.getModalHeader().addClass(type.replace("type", "text"));

        // Wire up button actions.
        if (options.buttons && options.buttons.length) {
            _.each(options.buttons, function (btn, i) {
                if (btn.action) {
                    var $btn = btn.id
                        ? $modal.find("#" + btn.id)
                        : $modal.find(".modal-footer .btn").eq(i);
                    $btn.on("click", function () {
                        btn.action(handle);
                    });
                }
            });
        }

        // Auto-focus the first [autofocus] element after the modal is shown.
        $modal.on("shown.bs.modal", function () {
            var $autoFocus = $modal.find("[autofocus]");
            if ($autoFocus.length) {
                $autoFocus.focus();
            }
        });

        // Clean up DOM after modal is fully hidden.
        $modal.on("hidden.bs.modal", function () {
            bsModal.dispose();
            $modal.remove();
        });

        bsModal.show();
        return handle;
    };

    _.each(["confirm", "warning", "danger", "success"], function (method) {
        obj[method] = function (options) {
            return obj.show(options);
        };
    });

    return obj;
});
