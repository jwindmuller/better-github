const client =  chrome ? chrome :  browser;

client.commands.onCommand.addListener(async (command) => {
    console.log(`Command: ${command}`);
    const tabs = await client.tabs.query({active: true});
    await client.tabs.sendMessage(tabs[0].id, command);
});