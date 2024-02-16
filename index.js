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

    let container = loadMoreButton.closest('#js-progressive-timeline-item-container');
    if (container === null) {
        container = loadMoreButton.closest('.TimelineItem-body');
    }
    debug('START LOADING', container);
    loadMoreButton.scrollIntoView(false, { behavior: 'instant', block: 'center', inline: 'center' });
    window.scrollTo({ top: window.scrollY + 100, left: 0 });
    loadMoreButton.click();

    debouncedActionOnDOMChange(container, () => {
        expandLoadMore(onComplete)
    });
}

const findCommentsStartingWith = (text) => {
    let nextCommentToFocus = 0;
    return () => {
        const searchTerm = text.toLowerCase();
        const comments = Array.from(
            document.querySelectorAll('.TimelineItem.js-comment-container task-lists')
        );
        const found = comments.reduce((commentsThatMatch, comment, currentIndex) => { 
            const commentText = comment.innerText.toLowerCase().trim();
            const isMatch = commentText.indexOf(searchTerm) === 0;
            if (isMatch) {
                commentsThatMatch.push(currentIndex);
            }
            
            return commentsThatMatch;
        }, []);

        if (found.length === 0) {
            alert(`No comments beginning with "${text}" found!`);
            window.scrollTo({top: document.body.scrollHeight, left: 0 });
            return;
        }
        
        comments[found[nextCommentToFocus]].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'start' 
        });
        
        nextCommentToFocus++;
        if (nextCommentToFocus >= found.length) {
            nextCommentToFocus = 0;
        }
    }
};

const client =  chrome ? chrome : browser;
const findFunctions = {};
(() => {
    console.log('BGH');
    client.runtime.onMessage.addListener(({command, description}) => {
        if (command === 'Expand All Hidden Items') {
            expandLoadMore();
            return;
        }
        if (command === 'Hide All Commits From Issue') {
            expandLoadMore(hideCommitEntries);
            return;
        }
        if (command === 'Find') {
            if (findFunctions[description] === undefined) {
                findFunctions[description] = findCommentsStartingWith(description);
            }
            expandLoadMore(findFunctions[description]);
            return;
        }
    });
})();


