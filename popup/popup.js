(async () => {
    const client=  chrome ? chrome :  browser;
    const list = document.getElementById('popup-list')
    const tabs = await client.tabs.query({
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
        const command = button.getAttribute('data-command');
        const description = button.getAttribute('data-description');
        await client.tabs.sendMessage(tabs[0].id, {
            command,
            description
        });
    }
    
    const commands = await client.commands.getAll();
    const data = await client.storage.local.get();

    data.options.forEach(({label, value}) => {
        commands.push({
            type: 'customized',
            name: 'Find',
            label,
            description: value
        })
    })
    

    commands.forEach((command) => { 
        if (command.name[0] === '_') {
            return;
        }
        const isCustomized = command.type === 'customized';
        if (command.name === 'Find' && !isCustomized ) {
            return;
        }
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
        if (isCustomized) {
            button.innerText = command.label;
        }
        button.setAttribute('data-description', command.description);
        button.setAttribute('data-command', command.name);
        button.addEventListener('click', handleClick);
    });

})();