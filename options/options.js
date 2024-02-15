let configTemplate = null;
function buildDefaultSettings(restoredSettings) {
    if (restoredSettings.options !== undefined)  {
        return restoredSettings;
    }
    return {
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
    };
}

function updateUI(restoredSettings) {
    restoredSettings = buildDefaultSettings(restoredSettings);
    
    if (configTemplate === null) {
        configTemplate = document.querySelector('.SearchTerm');
        document.body.removeChild(configTemplate);
    }
    
    const container = document.body.querySelector('.SearchTerm--container');
    container.replaceChildren();
    
    restoredSettings.options.forEach((option, index) => { 
        const {label, value} = option;
        const copy = configTemplate.cloneNode(true);
        copy.setAttribute('data-row', index);
        const labelInput = copy.querySelector('.SearchTerm--label');
        labelInput.value = label;
        labelInput.addEventListener('keyup', function(event) {
             updateRow(event, restoredSettings);
        });
        
        const valueInput = copy.querySelector('.SearchTerm--value');
        valueInput.value = value;
        valueInput.addEventListener('keyup', function(event) {
            updateRow(event, restoredSettings);
       });
        
        container.appendChild(copy);
    });

    configureAddRuleButton(restoredSettings);

    configureSaveButton(restoredSettings);
}

function updateRow(event, restoredSettings) {
    const input = event.target;
    const container = input.closest('.SearchTerm');
    const row = parseInt(container.getAttribute('data-row'), 10);
    const entry = restoredSettings.options[row];
    const isLabel = input.classList.contains('SearchTerm--label');
    if (isLabel){
        entry.label = input.value.trim();
    } else {
        entry.value = input.value.trim();
    }
}
let addRuleButton = null;
function configureAddRuleButton(restoredSettings) {
    if (addRuleButton !== null) {
        return;
    }
    
    addRuleButton = document.body.querySelector('.SearchTerm--add-rule');
    addRuleButton.addEventListener('click', function() {
        restoredSettings.options.push(makeOption());
        updateUI(restoredSettings);
    });
}

let saveButton = null;
function configureSaveButton(restoredSettings) {
    if (saveButton !== null) {
        return;
    }
    saveButton = document.body.querySelector('.SearchTerm--save-rules');
    saveButton.addEventListener('click', function() {
        saveOptions(restoredSettings);
    })
}

function makeOption(label = '', value = '') {
    return {
        label,
        value,
    }
}

function saveOptions(restoredSettings) {
    const optionsToSave = restoredSettings.options.filter(function({label, value}) {
        return label !== '' || value !== '';
    })
    browser.storage.local.set({
        options: optionsToSave
    });
}

function onError(e) {
    console.error(e);
}
  
/*
On opening the options page, fetch stored settings and update the UI with them.
*/
const gettingStoredSettings = browser.storage.local.get();
gettingStoredSettings.then(updateUI, onError);
