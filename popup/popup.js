(async () => {
    const list = document.getElementById('popup-list')
    const tabs = await browser.tabs.query({ 
        active: true, 
        currentWindow: true 
    });
    
    if (tabs.length !== 1) {
        return;
    }

    const url = tabs[0].url;
    const isGitHub = url?.match(/^https:\/\/(www.)?github\.com\//);
    if (!isGitHub) {
        const error = document.createElement('li');
        error.innerText = 'This is not a GitHub page!';
        error.className= 'error';
        list.appendChild(error);
        return;
    }

    const handleClick = async (event) => {
        const button = event.target;
        await browser.tabs.sendMessage(tabs[0].id, button.innerText);
    }
    
    const commands = await this.browser.commands.getAll();

    commands.forEach((command) => { 
        const description = command.description;
        const path = description.split('#path:')[1]?.trim();
        let disabled = false;
        if (path) {
            const pathMatches= url.indexOf(path) !== -1;
            if (!pathMatches) {
                disabled =true;
            }
        }

        const item = document.createElement('li');
        const button = document.createElement('button');
        if (disabled) {
            button.setAttribute('disabled', true);
        }
        item.appendChild(button);
        list.appendChild(item);
        button.innerText = command.name;
        button.setAttribute('data-command', command.name);
        button.addEventListener('click', handleClick);
    });

})();