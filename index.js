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
const expandLoadMore = (onComplete) => {
    
    getBlanket().classList.add('shown');
    const loadMoreButton = document.querySelector('.ajax-pagination-btn');
    if (!loadMoreButton) {
        getBlanket().classList.remove('shown');
        if (onComplete) {
            onComplete();
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

let nextTestingNotes = 0;
const findTestingNotes = () => {
    const comments = Array.from(document.querySelectorAll('.TimelineItem.js-comment-container task-lists'));
    const found = comments.reduce((testingNotesList, comment, currentIndex) => { 
        const isTestingNotes = comment.innerText.toLowerCase().trim().indexOf('testing') === 0;
        console.log({isTestingNotes})
        if (isTestingNotes) {
            testingNotesList.push(currentIndex);
        }
        return testingNotesList;
    }, []);

    if (found.length === 0) {
        alert('No testing notes found (comments beginning with "testing")!');
        window.scrollTo({top: document.body.scrollHeight, left: 0 });
        return;
    }
    comments[found[nextTestingNotes]].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
    nextTestingNotes++;
    if (nextTestingNotes >= found.length) {
        nextTestingNotes = 0;
    }
};

const client =  chrome ? chrome : browser;
(() => {
    console.log('BGH');
    client.runtime.onMessage.addListener((command) => {
        if (command === 'Expand All Hidden Items') {
            expandLoadMore();
            return;
        }
        if (command === 'Hide All Commits From Issue') {
            expandLoadMore(hideCommitEntries);
            return;
        }
        if (command === 'Find Testing Notes') {
            expandLoadMore(findTestingNotes);
            return;
        }
    });
})();


