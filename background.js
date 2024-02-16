const client =  chrome ? chrome :  browser;

client.commands.onCommand.addListener(async (command) => {
    console.log(`Command: ${command}`);
    const tabs = await client.tabs.query({active: true});
    await client.tabs.sendMessage(tabs[0].id, command);
});

client.runtime.onInstalled.addListener(() => {
    const config = client.storage.local.get();
    if (config.options === undefined) {
        client.storage.local.set({
            options : [
                {
                    label: 'Find Testing Notes',
                    value: 'Testing'
                },
                {
                    label: 'Find Flaw Investigation',
                    value: 'Flaw Investigation'
                },
            ]
        });
    }
});