const listeners = {};

export const INVALID_CUSTOM_EVENT = "INVALID_CUSTOM_EVENT";


export const subscribe = (eventName, callback) => {
    if (!listeners[eventName]) {
        listeners[eventName] = [];
    }

    listeners[eventName].push(callback);
};


export const unsubscribe = (eventName, callback) => {

    if (!Array.isArray(listeners[eventName])) {
        return;
    }

    const index = listeners[eventName].indexOf(callback);

    if (index !== -1) {
        listeners[eventName].splice(index, 1);
    }
};


export const dispatch = (eventName, ...rest) => {
    const callbacks = listeners[eventName];

    if (!Array.isArray(callbacks)) {
        return;
    }

    callbacks.forEach((callback) => callback(...rest));

};

