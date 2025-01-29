const client =  chrome ? chrome : browser;
(function main() {
    console.log('BGH');
    client.runtime.onMessage.addListener(async ({command, description}) => {
        IssuesPage.run(command, description);
        await PullRequestPage.run(command, description);
    });
})();
