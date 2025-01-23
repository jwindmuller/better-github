const watchBodyDomChanges = (onChange) => {
    const watcher = new MutationObserver((mutationsList, observer) => {
        const done = onChange();
        if (done) {
            observer.disconnect();
        }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
}

const getBlanket = () => { 
    let blanket = document.querySelector('.better-gh-loading');
    if (blanket ){
        return blanket;
    }
    blanket  = document.createElement('div');
    blanket.className = 'better-gh-loading';
    blanket.innerHTML = '<span class="text">Loading...</span>';

    document.body.append(blanket);
    return blanket;
}

