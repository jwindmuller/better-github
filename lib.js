const watchBodyDomChanges = (onChange) => {
    const watcher = new MutationObserver((mutationsList, observer) => {
        const done = onChange();
        if (done) {
            observer.disconnect();
        }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
}

const getOrMakeElement = (className, message) => {
    let element = document.querySelector(`.${className}`);
    if (!element) {
        element = document.createElement('div');
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

const showMessage = (message) => {
    const messageContainer = getOrMakeElement('better-gh-message');
    const close = getOrMakeElement('better-gh-message-close', 'X');
    close.addEventListener('click', () => hideMessage());
    messageContainer.append(close);

    const messageText = getOrMakeElement('better-gh-message-text', message);
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