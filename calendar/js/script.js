//__________________________________________________TOGGLE LOCATION FIELDS____________________________________________________________
function updateLocationOptions() {
    // Step 1: Read the current value of the modality dropdown (either "In-person" or "Remote", based on what the user selected)
    const modality = document.getElementById('event_modality').value;

    // Step 2: Grab references to the two container divs that wrap the Location field and the Remote URL field
    const locationGroup = document.getElementById('location_group');
    const remoteGroup = document.getElementById('remote_group');

    // Step 3: Grab references to the actual input elements inside those containers, so we can control their "required" attribute
    const locationInput = document.getElementById('event_location');
    const remoteInput = document.getElementById('event_remote_url');

    // Step 4: Branch based on the selected modality
    if (modality === 'in-person') {
        // Step 4a: Show the Location field...
        locationGroup.style.display = '';       // '' resets to default display (visible)
        // ...and hide the Remote URL field
        remoteGroup.style.display = 'none';

        // Step 4b: Since Location is now visible, make it required; since Remote URL is hidden, it must NOT be required
        // (otherwise the form can't be submitted — a hidden required field blocks submission)
        locationInput.required = true;
        remoteInput.required = false;

    } else if (modality === 'remote') {
        // Step 4c: Do the reverse — hide Location, show Remote URL
        locationGroup.style.display = 'none';
        remoteGroup.style.display = '';

        // Step 4d: Flip which field is required to match visibility
        locationInput.required = false;
        remoteInput.required = true;
    }

}

document.getElementById('event_modal').addEventListener('shown.bs.modal', updateLocationOptions);

//_____________________________________________________part 5 of activity________________________________________________________

function createEventCard(eventDetails) {
    // Step 1: Create the outer container for this event card
    const eventElement = document.createElement('div');
    // Step 2: Apply Bootstrap/custom classes for styling
    eventElement.className = 'event row border rounded m-1 py-1';

     // ADDED: tag this card with the event's id so we can find/replace it later
    eventElement.dataset.eventId = eventDetails.id;
    // ADDED: make it visually + functionally clickable
    eventElement.style.cursor = 'pointer';

    // Step 3: Create a nested element to hold the actual event details text
    const detailsElement = document.createElement('div');
    detailsElement.className = 'col';

        // CHANGED: pastel background colors per category, with black text
    // for consistent readability across all of them (pastels are light
    // enough that black text works uniformly, unlike Bootstrap's mix
    // of light/dark semantic colors)
    const categoryColors = {
        class: '#D6E4FF',     // pastel blue
        work: '#FFD6D6',      // pastel red/pink
        personal: '#D6FFE0',  // pastel green
        social: '#FFF3D6',    // pastel yellow
        other: '#E8D6FF'      // pastel purple
    };

    // Look up this event's color; fall back to a neutral pastel gray
    // if the category is missing or unrecognized
    const bgColor = categoryColors[eventDetails.category] || '#E8E8E8';

    // Apply as inline styles, since these aren't Bootstrap classes
    eventElement.style.backgroundColor = bgColor;
    eventElement.style.color = 'black';

    // Step 4: Build the visible content using eventDetails' properties.
    // Use a template literal so we can interpolate values cleanly across
    // multiple lines. Location/URL line depends on modality, since only
    // one of eventDetails.location / eventDetails.remote_url is non-null.
    const locationLine = eventDetails.modality === 'in-person'
        ? `📍 ${eventDetails.location}`
        : `💻 ${eventDetails.remote_url}`;

    detailsElement.innerHTML = `
        <div class="fw-bold">${eventDetails.name}</div>
        <div>${eventDetails.time}</div>
        <div>${eventDetails.category}</div>
        <div>${locationLine}</div>
        <div>👥 ${eventDetails.attendees.join(', ')}</div>
    `;

    // Step 5: Append the nested details element to the outer container
    eventElement.appendChild(detailsElement);

    // ADDED: clicking the card opens the modal pre-filled with this event's data
    eventElement.addEventListener('click', () => openEventForEditing(eventDetails.id));

    // Step 6: Return the completed DOM element (not yet attached to the page)
    return eventElement;
}

// ADDED: opens the modal and fills it with an existing event's values
function openEventForEditing(eventId) {
    const eventDetails = events.find(e => e.id === eventId);
    if (!eventDetails) return; // safety check — event not found

    currentEditId = eventId; // remember we're editing, not creating

    // Populate each field with the event's current values
    document.getElementById('event_name').value = eventDetails.name;
    document.getElementById('event_category').value = eventDetails.category;
    document.getElementById('event_weekday').value = eventDetails.weekday;
    document.getElementById('event_time').value = eventDetails.time;
    document.getElementById('event_modality').value = eventDetails.modality;
    document.getElementById('event_location').value = eventDetails.location || '';
    document.getElementById('event_remote_url').value = eventDetails.remote_url || '';
    document.getElementById('event_attendees').value = eventDetails.attendees.join(', ');

    // Sync the location/remote visibility + required state to match
    // the modality we just set, since changing .value programmatically
    // does NOT fire the 'change' event on its own
    updateLocationOptions();

    // Open the modal
    const modalElement = document.getElementById('event_modal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}

function addEventToCalendarUI(eventInfo) {
    // Step 1: Build the event card DOM element
    const eventCard = createEventCard(eventInfo);

    // Step 2: Use the event's weekday to find the correct calendar column.
    // eventInfo.weekday comes from the <select> as "Monday", "Tuesday", etc.
    // (capitalized), but the column ids in index.html are lowercase
    // ("monday", "tuesday", ...), so convert before looking it up.
    const columnId = eventInfo.weekday.toLowerCase();
    const column = document.getElementById(columnId);

    // Step 3: Append the card to that column, so it renders alongside
    // any other events already in that day
    column.appendChild(eventCard);
}

//________________________________________________________4th part of activity ______________________________________________

// Step 0: Declare the events array OUTSIDE any function, so it persists
// across multiple calls to saveEvent() and isn't recreated each time
const events = [];
let nextEventId = 1;       // ADDED: simple counter to generate unique ids
let currentEditId = null;  // ADDED: tracks which event is being edited (null = creating new)

function saveEvent() {
    // Step 1: Read the form values directly from each input/select
    const name = document.getElementById('event_name').value;
    const category = document.getElementById('event_category').value; //new line added
    const weekday = document.getElementById('event_weekday').value;
    const time = document.getElementById('event_time').value;
    const modality = document.getElementById('event_modality').value;
    const location = document.getElementById('event_location').value;
    const remoteUrl = document.getElementById('event_remote_url').value;
    const attendees = document.getElementById('event_attendees').value;

    // Step 2: Validate the form before saving.
    // checkValidity() runs the browser's built-in HTML5 validation
    // (checks required fields, url pattern, etc.) and returns true/false.
    // reportValidity() additionally triggers the native "please fill
    // this field" popups on whatever is invalid.
    const form = document.getElementById('event_form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return; // stop here — don't save an invalid event
    }

    // Step 3: Create a JavaScript object with the event details
    // Step 5: Use null for whichever location-related field doesn't apply
    //         (Location is null when Remote; Remote URL is null when In-person)
    const eventDetails = {
         // Reuse the existing id if editing; otherwise assign a new one
        id: currentEditId !== null ? currentEditId : nextEventId++,
        name: name,
        weekday: weekday,
        time: time,
        modality: modality,
        location: modality === 'in-person' ? location : null,
        //Set the object's location property equal to the location variable's value, if modality is exactly 'in-person'. 
        // Otherwise, set it to null.
        remote_url: modality === 'remote' ? remoteUrl : null,
        // Split the comma-separated attendees string into a trimmed array,
        // e.g. "Alice, Bob" -> ["Alice", "Bob"]
        attendees: attendees.split(',').map(a => a.trim()).filter(a => a.length > 0),
        category: category //added this new line 
    };

    // Duplicate check — exclude the event currently being edited from
    // this check, so re-saving an event without changing name/day/time
    // isn't flagged as a duplicate of itself
    const isDuplicate = events.some(existingEvent =>
        existingEvent.id !== eventDetails.id &&
        existingEvent.name === eventDetails.name &&
        existingEvent.weekday === eventDetails.weekday &&
        existingEvent.time === eventDetails.time
    );

    if (isDuplicate) {
        alert('An event with this name, day, and time already exists.');
        return;
    }

    //ADDED

        if (currentEditId !== null) 
        {
        // UPDATING an existing event
        const index = events.findIndex(e => e.id === currentEditId);
        events[index] = eventDetails;

        // Remove the old card from the DOM...
        const oldCard = document.querySelector(`[data-event-id="${currentEditId}"]`);
        if (oldCard) oldCard.remove();

        // ...and add a freshly-built one (handles the case where the
        // weekday changed, so it needs to move to a different column)
        addEventToCalendarUI(eventDetails);
        } 
        else {
        // CREATING a new event
        events.push(eventDetails);
        addEventToCalendarUI(eventDetails);
        }


    // Step 4: Store the object in the events array
    events.push(eventDetails);

    // Step 6: Log the array during development so you can verify its contents
    console.log(events);

    currentEditId = null; // reset editing state for next time
        form.reset();

    // Step 8: Reset the form so all fields clear for the next event
    form.reset();

    // Step 9: Close the modal
    const modalElement = document.getElementById('event_modal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();
}

// Wire saveEvent() to the form's submit event, rather than relying on
// the button's type="submit" alone — this lets us call event.preventDefault()
// to stop the page from reloading (the default browser behavior on submit),
// and gives us one place to trigger validation + saving logic.
document.getElementById('event_form').addEventListener('submit', function (event) {
    event.preventDefault();
    saveEvent();
});