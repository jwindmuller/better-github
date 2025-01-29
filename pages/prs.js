
window.issueCache = window.issueCache || {};
const PullRequestPage = (() => {
    const ALL_SELECTORS = {
        PR_COMMITS_LIST: {
            // This class only appears in PR commit list page
            BRANCH_NAMES: '[class*=BranchName]',
            COMMIT_LIST_ITEM: '[data-testid="commit-row-item"]',
            COMMIT_LIST_ITEM_COMMIT_LINKS: '[class*=TitleHeader-module] a[title][href*=commit]',
        },
        ISSUE_PAGE: {
            REACT_DATA: 'script[data-target="react-app.embeddedData"]',
        }
    };

    class PullRequestPageController {
        async run(command, description) {
            if (command !== 'Generate List of Pending PRs') {
                return;
            }
            console.clear();
            showBlanket();
            const foreignIssues = this._getForeingIssuesMentionedInCommits();

            const blockers = await this._fetchIssuesAndPrs(foreignIssues);
            const list = blockers.map(({issueNumber, prs} )=> {
                let allPRsClosed = true;
                const prList = prs.map(pr => {
                    if (pr.isOpen) {
                        allPRsClosed = false;
                    }
                    return `\n    - #${pr.number}`;
                }).join('');
                return `- [${allPRsClosed ? 'x': ' '}] #${issueNumber} PRs: ${prList}`;
            }).join('\n');
            
            const message = `Waiting on:\n${list}`;
            console.log(message);
            hideBlanket();

            showMessage(message);
        }

        _getSourceBranchFromPRPageDOM(dom) {
            const branchesInvolved = dom.querySelectorAll(ALL_SELECTORS.PR_COMMITS_LIST.BRANCH_NAMES);
            const issueForThisPR = branchesInvolved[1].textContent.trim();
            return issueForThisPR;
        }

        _getIssueNumberFromBranchName(branchName) {
            return branchName.match(/issue\/(\d+).*/)[1]
        }

        _getForeingIssuesMentionedInCommits() {
            const messages = this._getCommitMessages();

            const issueForThisPR = this._getIssueNumberFromBranchName(this._getSourceBranchFromPRPageDOM(document));

            const foreignCommits = messages.filter(message => !message.includes(`#${issueForThisPR}`));
            const foreignIssuesNumbers = new Set();
            const foreignIssues = [];
            foreignCommits.forEach(message => {
                const matchesIssue = message.match(/#(\d+)/gm);
                if (matchesIssue === null) {
                    return;
                }
                if (foreignIssuesNumbers.has(matchesIssue[0])) {
                    return;
                }
                foreignIssuesNumbers.add(matchesIssue[0]);
                foreignIssues.push({
                    message,
                    issue: matchesIssue[0]
                });
            });

            return foreignIssues;
        }

        _getCommitMessages() {
            const commits  = Array.from(
                document.querySelectorAll(ALL_SELECTORS.PR_COMMITS_LIST.COMMIT_LIST_ITEM)
            );
            if (commits.length === 0) {
                return false;
            }

            const commitTitles = commits.map(commit => {
                const commitLinks = Array.from(
                    commit.querySelectorAll(ALL_SELECTORS.PR_COMMITS_LIST.COMMIT_LIST_ITEM_COMMIT_LINKS)
                )
                const titles = commitLinks.map(link =>  link.getAttribute('title').trim());
                const uniqueTitles = [... new Set(titles)];
                return uniqueTitles[0];
            });


            return commitTitles;
        }

        async _fetchIssuesAndPrs (issues) {
            const parser = new DOMParser();
            let issuesData = issues.map(async (issue) => {
                const issueId = issue.issue.replace('#', '');
                const issueResponse = await fetchHtml( `https://github.com/rpmsoftware/rpm/issues/${issueId}`);
                const isPR = issueResponse.url.includes('/pull/');
                if (isPR) {
                    return false;
                }
                const linkedPRs = this._getLinkedPRsFromDoc(parser.parseFromString(issueResponse.html, 'text/html'));
                let  prResponses = await Promise.all(linkedPRs.map(async(pr) => {
                    const prIsOpen =pr.state === 'OPEN';

                    const prPageResponse = await fetchHtml(`${pr.url}/commits`);

                    const sourceBranchForLinkedPR = this._getSourceBranchFromPRPageDOM(
                        parser.parseFromString(prPageResponse.html, 'text/html')
                    );

                    const prIsForProd = sourceBranchForLinkedPR.match(/^issue\/\d+$/);
                    if (prIsForProd) {
                        return null;
                    }

                    return {number: pr.number, isOpen: prIsOpen, state: pr.state };
                }, this));
                prResponses = prResponses.filter(pr => pr !== null)

                return { issueNumber: issueId, prs: prResponses };
            }, this);

            issuesData = await Promise.all(issuesData);
            issuesData = issuesData.filter(Boolean);
            return issuesData;
        }

        async _fetchIssueHtml (issueId) {
            const url = `https://github.com/rpmsoftware/rpm/issues/${issueId}`;
            try {
                if (window.issueCache[issueId] && window.issueCache[issueId].docPromise) {
                    await window.issueCache[issueId].docPromise;
                    return Promise.resolve(window.issueCache[issueId]);
                }
            } catch(e) {
                delete window.issueCache[issueId];
            }
            window.issueCache[issueId] = { numericId: issueId };
            const parser = new DOMParser();
            const docPromise = fetch(url).then(async resp => {

                return {
                    finalUrl: resp.url,
                    text: await resp.text()
                };
            }).then(({finalUrl, text}) => {
                const doc = parser.parseFromString(text, 'text/html');
                window.issueCache[issueId].isPR = finalUrl.includes('/pull/');
                window.issueCache[issueId].doc = doc;
                return doc;
            });

            window.issueCache[issueId].docPromise = docPromise;
            await docPromise;
            return window.issueCache[issueId];
        }

        _getLinkedPRsFromDoc(doc) {
            if (!doc) {
                return [];
            }
            const reactData = doc.querySelector(ALL_SELECTORS.ISSUE_PAGE.REACT_DATA)?.textContent;
            if (!reactData) {
                return []
            }
            const linkedPRs = JSON.parse(reactData)
                .payload
                .preloadedQueries[0]
                .result
                .data
                .repository
                .issue
                .linkedPullRequests
                .nodes || [];
            return linkedPRs;
        }
    }

    return new PullRequestPageController();
})();