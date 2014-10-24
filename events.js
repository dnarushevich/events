(function (global) {

    var lastId = 0;
    //subscriptions
    var subs = {};

    /**
     * Subscribe to event of a given object
     * @param obj {object}
     * @param event {string|number} Event id
     * @param callback {function}
     * @param meta {object} Data that will be passed to callback
     * @param once {boolean}
     * @returns {number} Subscription id
     */
    function addListener(obj, eventType, listener, meta, once) {
        if (obj._events === undefined)
            obj._events = {};

        if (obj._events[eventType] === undefined)
            obj._events[eventType] = [];

        var event = obj._events[eventType];

        if (typeof listener !== "function")
            throw "Event handler should be a function";

        var id = lastId++;
        event.push(subs[id] = {
            id: id,
            listener: listener,
            meta: meta,
            once: once || false,
            target: obj,
            eventType: eventType
        });
        return id;
    }

    function once(obj, eventType, listener, meta) {
        return addListener(obj, eventType, listener, meta, true);
    }

    function unsubscribe(subscriptionId){
        var sub = subs[subscriptionId];
        return removeListener(sub.target, sub.eventType, subscriptionId);
    }

    /**
     * Unsubscribe from event of a given object, you can pass just subscription id
     * @param objOrSubId {object|int}
     * @param event [{string|number}] Event id
     * @param idOrListener [{number|function}] Subscription id or handler
     * @returns {boolean}
     */
    function removeListener(objOrSubId, eventType, listenerOrId) {
        var obj = objOrSubId;

        if(arguments.length === 1)
            return unsubscribe(objOrSubId);

        if (obj._events === undefined || obj._events[eventType] === undefined)
            return false;

        var event = obj._events[eventType];

        var id = -1;
        var sub;

        if (typeof listenerOrId === "function") {
            for (var i = 0, l = event.length; i < l; i++) {
                sub = event[i];
                if (sub !== undefined && sub.listener === listenerOrId) {
                    id = sub.id;
                    break;
                }
            }
        } else {
            id = listenerOrId;
        }

        if (id !== -1) {
            var index = event.indexOf(subs[id]);
            if (index !== -1) {
                event[index] = undefined;
            }
            delete subs[id];
            return true;
        }

        return false;
    }

    /**
     * Dispatch an event of a given object
     * @param obj {object}
     * @param event {string|number} Event id
     * @param sender {object} Sender argument that will be passed to callback
     * @param args {object} Event arguments that will be passed to callback
     */
    function fire(obj, eventType, args) {
        if (obj._events === undefined || obj._events[eventType] === undefined)
            return;

        var listeners = obj._events[eventType];

        var i, l = listeners.length,
            subscription,
            cleanUp = false;

        for (i = 0; i < l; i++) {
            subscription = listeners[i];

            if (subscription !== undefined) {
                if(subscription.once)
                    removeListener(obj, eventType, subscription.id);

                subscription.listener(obj, args, subscription.meta);
            } else {
                cleanUp = true;
            }
        }

        if (cleanUp) {
            for (i = l - 1; i !== -1; i--)
                if (listeners[i] === undefined)
                    listeners.splice(i, 1);
        }
    }

    function event(){
        function ev(args){
            return Events.fire(ev, "ev", args);
        }
        ev.add = function(listener, data){
            return Events.on(ev, "ev",listener, data);
        };
        ev.remove = function(listenerOrId){
            return Events.off(ev, "ev",listenerOrId);
        };
        return ev;
    }

    var Events = EventEmmiter;

    Events.event = event;

    Events.EventEmmiter = EventEmmiter;

    Events.addListener = Events.on = addListener;

    Events.once = once;

    Events.removeListener = Events.off = removeListener;

    Events.emit = Events.fire = fire;

    /**
     * @deprecated
     * @type {addListener|*}
     */
    Events.subscribe = Events.on;
    /**
     * @deprecated
     * @type {removeListener|*}
     */
    Events.unsubscribe = Events.off;

    function EventEmmiter() {
    }

    EventEmmiter.prototype.addEventListener = EventEmmiter.prototype.addListener = function (event, listener, meta) {
        return addListener(this, event, listener, meta);
    };

    EventEmmiter.prototype.removeEventListener = EventEmmiter.prototype.removeListener = function (event, listenerOrId) {
        return removeListener(this, event, listenerOrId);
    };

    EventEmmiter.prototype.dispatchEvent = EventEmmiter.prototype.emit = function (event, args) {
        return fire(this, event, args);
    };

    EventEmmiter.prototype.once = function (event, listener, meta) {
        return addListener(this, event, listener, meta, true);
    };

    global.Events = Events;
})(window);
