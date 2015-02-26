﻿// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=329104
(function () {
    "use strict";
    /* global loadGame */

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    Object.defineProperty(Node.prototype, "unsafeInnerHTML", {
        get: function () {
            return this.innerHTML;
        },
        set: function (value) {
            WinJS.Utilities.setInnerHTMLUnsafe(this, value);
        },
        enumerable: false
    });


    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {

            if (args.detail.previousExecutionState !==
                activation.ApplicationExecutionState.terminated) {

                MSApp.execUnsafeLocalFunction(loadGame);

                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    // app.oncheckpoint = function (args) {
    //     // TODO: This application is about to be suspended. Save any state
    //     // that needs to persist across suspensions here. You might use the
    //     // WinJS.Application.sessionState object, which is automatically
    //     // saved and restored across suspension. If you need to complete an
    //     // asynchronous operation before your application is suspended, call
    //     // args.setPromise().
    // };

    app.start();
})();
