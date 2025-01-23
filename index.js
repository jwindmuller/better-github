const client =  chrome ? chrome : browser;
(function main() {
    console.log('BGH');
    client.runtime.onMessage.addListener(({command, description}) => {
        IssuesPage.run(command, description);
    });
})();
