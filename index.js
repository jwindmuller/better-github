const debugging = false;
const debug = (...args) => {
    if (!debugging) {
        return;
    }

    console.log(...args);
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
    let commitElementsToHide =Array.from(document.querySelectorAll('[data-hovercard-url*=commit]'));
    commitElementsToHide = commitElementsToHide.map(commit => commit.closest('[data-timeline-event-id]'));
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

const getLoadMoreButton = () => { 
    let button = document.querySelector('[data-testid="issue-timeline-load-more-load-top"]');
    return button;
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

const watchBodyDomChanges = () => {
    const watcher = new MutationObserver((mutationsList, observer) => {
        if (!started) {
            return;
        }
        const done = clickLoadMore();
        if (done) {
            observer.disconnect();
        }
    });
    watcher.observe(document.body, { childList: true, subtree: true });
}

const client =  chrome ? chrome : browser;
const findFunctions = {};
let onCompleteLoading = null;
let started = false;

(function main() {
    console.log('BGH');
    client.runtime.onMessage.addListener(({command, description}) => {
        switch (command) {
            case 'Expand All Hidden Items':
                onCompleteLoading = null;
                break;
            case 'Hide All Commits From Issue':
                onCompleteLoading = hideCommitEntries;
                break;
            case 'Find':
                if (findFunctions[description] === undefined) {
                    findFunctions[description] = findCommentsStartingWith(description);
                }
                onCompleteLoading = findFunctions[description];
                break;
            default:
                return;
        }

        started = true;
        watchBodyDomChanges();
        clickLoadMore();
    });
})();

const clickLoadMore = () => {
    const loadMoreButton = getLoadMoreButton();
    if (!started) {
        return;
    }
    
    getBlanket().classList.add('shown');
    
    if (!loadMoreButton) {
        getBlanket().classList.remove('shown');
        if (onCompleteLoading) {
            onCompleteLoading();
        }
        return true;
    }
    
    if (loadMoreButton.getAttribute('aria-disabled' === 'true')) {
        return;
    }

    loadMoreButton.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
    loadMoreButton.click();
}