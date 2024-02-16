let configTemplate = null;
let restoredSettings = null;
/*
On opening the options page, fetch stored settings and update the UI with them.
*/
(async() => {
    init();
})();

async function init() {
    restoredSettings = await browser.storage.local.get();
    updateUI();
}

function updateUI() {
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
             updateRow(event);
        });
        
        const valueInput = copy.querySelector('.SearchTerm--value');
        valueInput.value = value;
        valueInput.addEventListener('keyup', function(event) {
            updateRow(event);
        });

        const deleteButton =  copy.querySelector('.SearchTerm--delete');
        deleteButton.addEventListener('click', function(event){
            deleteRow(event);
        });
        
        container.appendChild(copy);
    });

    configureAddRuleButton();

    configureSaveButton();
    configureCancelButton();
}

function updateRow(event) {
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

function deleteRow(event) {
    const input = event.target;
    const container = input.closest('.SearchTerm');
    const row = parseInt(container.getAttribute('data-row'), 10);
    restoredSettings.options.splice(row, 1);
    updateUI(restoredSettings);
}

let addRuleButton = null;
function configureAddRuleButton() {
    if (addRuleButton !== null) {
        return;
    }
    
    addRuleButton = document.body.querySelector('.SearchTerm--add-rule');
    addRuleButton.addEventListener('click', function() {
        restoredSettings.options.push(makeOption());
        updateUI();
    });
}

let saveButton = null;
function configureSaveButton() {
    if (saveButton !== null) {
        return;
    }
    saveButton = document.body.querySelector('.SearchTerm--save-rules');
    saveButton.addEventListener('click', function() {
        saveOptions();
    })
}
let cancelButton = null;
function configureCancelButton() {
    if (cancelButton !== null) {
        return;
    }
    cancelButton = document.body.querySelector('.SearchTerm--cancel-edits');
    cancelButton.addEventListener('click', function() {
        init();
    })
}

function makeOption(label = '', value = '') {
    return {
        label,
        value,
    }
}

function saveOptions() {
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