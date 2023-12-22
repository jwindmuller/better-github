const debugging = false;
const debug = (...args) => {
    if (!debugging) {
        return;
    }

    console.log(...args);
}
// observeDOM, from https://stackoverflow.com/a/14570614
const observeDOM = (function () {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    return function (obj, callback) {
        if (!obj || obj.nodeType !== 1) return;

        // define a new observer
        var mutationObserver = new MutationObserver((mutationList, observer) => {
            callback(observer.disconnect.bind(observer));
        })

        // have the observer observe for changes in children
        mutationObserver.observe(obj, { childList: true, subtree: true });
        return mutationObserver;
    }
})();

const debouncedActionOnDOMChange = (element, action) => {

    let delay = 0;
    observeDOM(element, (stopObserving) => {
        clearTimeout(delay);
        delay = setTimeout(() => {
            stopObserving();
            action();

        }, 10);
    })
}

// Extension code
const hideCommitEntries = async (parentContainer) => {
    if (parentContainer === undefined) {
        parentContainer = document;
    }
    const commitHistoryEntries = Array.from(parentContainer.querySelectorAll('.TimelineItem [id^=ref-commit]'));
    commitHistoryEntries.forEach(commitEntry => {
        const container = commitEntry.closest('.TimelineItem');
        container.style.display = 'none'
    });

    document.querySelector('.gh-header-title').scrollIntoView({behavior:'smooth', block: 'center', inline: 'center'});
};

const expandLoadMore = (onComplete) => {
    const loadMoreButton = document.querySelector('.ajax-pagination-btn');
    if (!loadMoreButton) {
        if (onComplete) {
            onComplete();
        } else {
            alert('Nothing more to expand');
        }
        return;
    }


    const container = loadMoreButton.closest('#js-progressive-timeline-item-container');
    debug('START LOADING', container);
    loadMoreButton.scrollIntoView(false, { behavior: 'instant', block: 'center', inline: 'center' });
    window.scrollTo({ top: window.scrollY + 100, left: 0 });
    loadMoreButton.click();

    debouncedActionOnDOMChange(container, () => {
        expandLoadMore(onComplete)
    });
}


(() => {
    console.log('BGH');
    browser.runtime.onMessage.addListener((command) => {
        if (command === 'Expand All Hidden Items') {
            expandLoadMore();
            return;
        }
        if (command === 'Hide All Commits From Issue') {
            expandLoadMore(hideCommitEntries);
            return;
        }
    });
})();


