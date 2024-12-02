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
const hideCommitEntries = async () => {
    const commitHistoryEntries = getCommitHistoryEntriesContainers();
    commitHistoryEntries.forEach(container => {
        container.style.display = 'none'
    });

    let header = document.querySelector('.gh-header-title');
    if (!header) { 
        header = document.querySelector('[data-testid="issue-title"]');
    }
    setTimeout(() => {
        header.scrollIntoView({
            behavior:'smooth',
            block: 'center',
            inline: 'center'
        });
    }, 100);
};

const getCommitHistoryEntriesContainers = () => {
    let commitElementsToHide = Array.from(document.querySelectorAll('.TimelineItem [id^=ref-commit]'));
    
    if (commitElementsToHide.length > 0) {
        return commitElementsToHide;
    }
    commitElementsToHide =Array.from(document.querySelectorAll('[data-hovercard-url*=commit]')) ;
    commitElementsToHide = commitElementsToHide.map(commit => commit.closest('[data-timeline-event-id]'));
    commitElementsToHide = commitElementsToHide
        .filter((timelineItemsContainer, index) => commitElementsToHide.indexOf(timelineItemsContainer) !== index);
    return commitElementsToHide;
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
    const loadMoreButton = getLoadMoreButton();
    if (!loadMoreButton) {
        getBlanket().classList.remove('shown');
        if (onComplete) {
            onComplete();
        }
        return;
    }

    let containers = getMoreContentContainers(loadMoreButton);
    debug({loadMoreButton,container: containers})
    debug('START LOADING', containers);
    loadMoreButton.scrollIntoView(false, { behavior: 'instant', block: 'center', inline: 'center' });
    window.scrollTo({ top: window.scrollY + 100, left: 0 });
    loadMoreButton.click();
    for (const container of containers) {
        debouncedActionOnDOMChange(container, () => {
            expandLoadMore(onComplete)
        });
    }
}

const getLoadMoreButton = () => { 
    let button = document.querySelector('[data-testid="issue-timeline-load-more-load-top"]');
    if (button) {
        return button;
    }
    button = document.querySelector('.ajax-pagination-btn');
    return button;
}

const getMoreContentContainers = (button) => {
    const isOldButton = button.classList.contains('ajax-pagination-btn');
    if (isOldButton) {
        let container = button.closest('#js-progressive-timeline-item-container');
        if (container === null) {
            container = button.closest('.TimelineItem-body');
        }
        return [container];
    }
    const eventContainers = document.querySelectorAll('[data-testid="issue-timeline-container"] [aria-label="Events"]');

    return Array.from(eventContainers);
}

const findCommentsStartingWith = (text) => {
    let nextCommentToFocus = 0;
    return () => {
        const searchTerm = text.toLowerCase();
        const comments = getCommentElements();
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

const getCommentElements = () => {
    let comments = Array.from(
        document.querySelectorAll('.TimelineItem.js-comment-container task-lists')
    );
    console.log({comments})
    if (comments.length > 0) {
        return comments;
    }
    comments = Array.from(
        document.querySelectorAll('[data-testid^=comment-viewer-outer-box] [data-testid=markdown-body]')
    );
    console.log({comments})
    return comments;
}

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


