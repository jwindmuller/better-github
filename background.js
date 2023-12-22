
browser.commands.onCommand.addListener(async (command) => {
    console.log(`Command: ${command}`);
    const tabs = await browser.tabs.query({active: true});
    await browser.tabs.sendMessage(tabs[0].id, command);
});