/**
 * offlineForm
 * 
 * @version 0.1.0
 * @example $('form.offline').offlineForm();
 * @author Brewal RENAULT http://oziolab.fr/
 * 
 * This is a jQuery plugin for synchronizing forms when navigator is
 * offline. If it is, forms will be stored into localStorage, until an online 
 * event is detected. If it is not, forms are directly sent without any other
 * action done. 
 */
(function($)
{
    var defaults = 
    {
        // localStorage key of the plugin
        key: "offlineForm",
        // class css 
        classname: "offlineForm",
        // if true, send the form with ajax
        onlineAjaxSend: false,
        // called before syncing all local data
        beforeSync: null,
        // called when forms are synchronized
        afterSync: null,
        // called when a form is syncrhonized
        onSync: null,
        // called when offline before saving in localStorage
        beforeStorage: null,
        // called when offline after saving in localStorage
        onStorage: null,
        // called when an error occured during syncing
        onError: null,
        // called before sending the ajax request when online
        beforeOnlineAjaxSend: null,
        // callback for online ajax sending
        onlineAjaxCallback: null
    };

    var p = defaults;
    
    function onFormSubmit() {
        form = $(this);
        // if navigator is online, we just send the form
        if (navigator.onLine) {
            if (p.onlineAjaxSend) {
                if (p.beforeOnlineAjaxSend) {
                    p.beforeOnlineAjaxSend();
                }
                $.ajax({
                    type: form.attr('method'),
                    url: form.attr('action'),
                    data: form.serialize(),
                    success: function(ret) {
                        if (p.onlineAjaxCallback) {
                            p.onlineAjaxCallback(ret);
                        }
                    }
                }).fail(function(e) {
                    if (p.onError) p.onError(e);
                    return false;
                });
                return false;
            }
            return true;
        }

        // action of the form 
        action = form.attr('action');
        if (action === '') action = document.location.href;

        // initializing the localStorage for the plugin
        if (localStorage[p.key] === undefined) {
            localStorage[p.key] = JSON.stringify([]);
        }

        // retreive data waiting to be sent
        data = JSON.parse(localStorage[p.key]);

        // removes empty records
        if(data.length) {
            $.each(data, function(index, value){
                if(value === null) {
                    data.splice(index, 1);
                }
            });
        }

        if (p.beforeStorage) p.beforeStorage(data.length, data);
        // add the serialized form to the data
        data.push({
            action: action,
            urlEncoded: form.serialize(),
            method: form.attr('method')
        });

        // call the callback onStorage
        if (p.onStorage) p.onStorage(data.length, data);

        // store the new data
        localStorage[p.key] = JSON.stringify(data);

        return false;
    }
            
    var methods = {
        init : function(options) {
            return this.each(function()
            {
                p = $.extend(p, options);
                
                form = $(this);
                
                if (!form.hasClass(p.classname)) {
                    form.on('submit', onFormSubmit);
                    form.addClass(p.classname);
                }
            });
        },
        sync: function() {
            // retreive data waiting to be sent
            if(localStorage[p.key] === undefined) return false;
            else data = JSON.parse(localStorage[p.key]);

            total = data.length;

            if (data !== undefined && total > 0) {
                // removes empty records
                $.each(data, function(index, value){
                    if(value === null) {
                        data.splice(index, 1);
                    }
                });
                
                total = data.length;
                
                if (p.beforeSync) p.beforeSync(total);

                // send forms one by one
                // if it succeed, we remove the form from the localStorage
                var newData = JSON.parse(JSON.stringify(data));
                $.each(data, function(index, form) {
                    if (form) {
                        $.ajax({
                            type: form.method,
                            url: form.action,
                            data: form.urlEncoded,
                            async: false,
                            success: function(ret) {
                                if (p.onSync) p.onSync((index+1), total, ret);
                                newData.splice(0, 1);
                                // store the new data.
                                // It should be an empty array if no error occured.
                                localStorage[p.key] = JSON.stringify(newData);

                                if (data.length === 0 && p.afterSync) p.afterSync(total);
                            }
                        }).fail(function(e) {
                            // we remove the form causing the issue
                            newData.splice(0, 1);
                            localStorage[p.key] = JSON.stringify(newData);
                            if (p.onError) p.onError(e);
                            return false;
                        });
                    }
                });

                return true;
            }
            return false;
        }
    };
    
    $.fn.offlineForm = function(methodOrOptions) {
        if ( methods[methodOrOptions] ) {
            return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
            // Default to "init"
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.offlineForm' );
        }    
    };
    
})(jQuery);
