const IssuesPage = (() => {

    class IssuesPageController {
        onCompleteLoading = null
        started = false
        findFunctions = {}
        
        run(command, description) { 
            this.started = true;
            switch (command) {
                case 'Expand All Hidden Items':
                    this.onCompleteLoading = null;
                    break;
                case 'Hide All Commits From Issue':
                    this.onCompleteLoading = this._hideCommitEntries;
                    break;
                case 'Find':
                    if (this.findFunctions[description] === undefined) {
                        this.findFunctions[description] = this._findCommentsStartingWith(description);
                    }
                    this.onCompleteLoading = this.findFunctions[description];
                    break;
                default:
                    return;
            }
            showBlanket();
            watchBodyDomChanges(this._clickLoadMore.bind(this));
            this._clickLoadMore();
        }
    
        _clickLoadMore(){
            if (!this.started) {
                return;
            }
            const loadMoreButton = this._getLoadMoreButton();
            
            
            
            if (!loadMoreButton) {
                hideBlanket();
                if (this.onCompleteLoading) {
                    this.onCompleteLoading();
                }
                return true;
            }
            
            if (loadMoreButton.getAttribute('aria-disabled' === 'true')) {
                return;
            }
            
            loadMoreButton.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
            loadMoreButton.click();
        }
        
        _hideCommitEntries() {
            const commitHistoryEntries = this._getCommitHistoryEntriesContainers();
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
        }
        
        _getCommitHistoryEntriesContainers() {
            let commitElementsToHide = Array.from(document.querySelectorAll('[data-hovercard-url*=commit]'));
            commitElementsToHide = commitElementsToHide.map(commit => commit.closest('[data-timeline-event-id]'));
            return commitElementsToHide;
        }
        
        _getLoadMoreButton() { 
            let button = document.querySelector('[data-testid="issue-timeline-load-more-load-top"]');
            return button;
        }

        _findCommentsStartingWith(text) {
            let nextCommentToFocus = 0;
            return (() => {
                const searchTerm = text.toLowerCase();
                const comments = this._getCommentElements();
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
            }).bind(this);
        }

        _getCommentElements() {
            let comments = Array.from(
                document.querySelectorAll('.TimelineItem.js-comment-container task-lists')
            );
            if (comments.length > 0) {
                return comments;
            }
            comments = Array.from(
                document.querySelectorAll('[data-testid^=comment-viewer-outer-box] [data-testid=markdown-body]')
            );
            return comments;
        }
    };

    return new IssuesPageController();
})();