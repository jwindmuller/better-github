const watchBodyDomChanges = (onChange) => {
    const watcher = new MutationObserver((mutationsList, observer) => {
        const done = onChange();
        if (done) {
            observer.disconnect();
        }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
}

const getOrMakeElement = (className, message, tag) => {
    if (tag === undefined) {
        tag = 'div';
    }
    
    let element = document.querySelector(`.${className}`);
    if (!element) {
        element = document.createElement(tag);
        document.body.append(element);
    }
    if (message) {
        element.innerHTML = message;
    }
    element.className = className;
    return element;
}

const getBlanket = () => { 
    return getOrMakeElement('better-gh-loading', '<span class="text">Loading...</span>');
}

const showBlanket = () => {
    getBlanket().classList.add('shown');
}
const hideBlanket = () => {
    getBlanket().classList.remove('shown');
}

const makeButton = (label, action) => {
    const button = getOrMakeElement(`better-gh-custom-button-${label.toLowerCase()}`, label);
    button.classList.add('better-gh-message-button');
    button.addEventListener('click', action);
    return button;
}
const showMessage = (message, buttonList) => {
    const messageContainer = getOrMakeElement('better-gh-message');
    const buttons = getOrMakeElement('better-gh-message-buttons');
    
    if (Array.isArray(buttonList)) {
        buttonList.forEach(({label, action}) => {
            const button = makeButton(label, action);
            buttons.append(button);
        });
    }

    const close = makeButton('Close', () => hideMessage());
    messageContainer.append(close);

    buttons.append(close);
    
    messageContainer.append(buttons);
    
    const messageText = getOrMakeElement('better-gh-message-text', message, 'textarea');
    messageContainer.append(messageText);

    messageContainer.classList.add('shown');
};

const hideMessage = () => {
    getOrMakeElement('better-gh-message').classList.remove('shown');
};

window.fetchHtmlCache = {};
const fetchHtml = async (url) => {
    let result = window.fetchHtmlCache[url];
    if (result === undefined) {
        const response = await fetch(url);
        result = {
            url: response.url,
            html: await response.text()
        };
        window.fetchHtmlCache[url] = result;
    } 
    result = window.fetchHtmlCache[url];

    return result;
}