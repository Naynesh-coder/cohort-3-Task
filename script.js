/* ----------------------------------------------------------
   STEP 1: GRABBING ELEMENTS FROM THE DOM
   We use document.getElementById() and querySelector() to
   get references to the HTML elements we need to work with.
---------------------------------------------------------- */

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitleInput");
const categorySelect = document.getElementById("categorySelect");
const taskContainer = document.getElementById("taskContainer");
const emptyMessage = document.getElementById("emptyMessage");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const clearAllBtn = document.getElementById("clearAllBtn");

const completedCountSpan = document.getElementById("completedCount");
const pendingCountSpan = document.getElementById("pendingCount");

const themeToggleBtn = document.getElementById("themeToggleBtn");

const demoInput = document.getElementById("demoInput");
const checkValueBtn = document.getElementById("checkValueBtn");
const attributeOutput = document.getElementById("attributeOutput");
const propertyOutput = document.getElementById("propertyOutput");

const captureToggle = document.getElementById("captureToggle");
const grandparentBox = document.getElementById("grandparentBox");
const parentBox = document.getElementById("parentBox");
const childButton = document.getElementById("childButton");


/* ----------------------------------------------------------
   STEP 2: APP STATE
   We keep all our tasks inside one array.
   Every task is just a simple object with a few properties.
   This array is the "single source of truth" for our app.
---------------------------------------------------------- */

let taskList = [];   // this will hold all task objects
let taskIdCounter = 1; // used to give every task a unique id


/* ----------------------------------------------------------
   STEP 3: LOCAL STORAGE HELPERS (Bonus Feature)
   Local Storage lets us save data in the browser so that
   tasks are not lost when the page is refreshed.
---------------------------------------------------------- */

// Save the current task list and theme into Local Storage
function saveToLocalStorage() {
  // JSON.stringify converts our JavaScript array into a text string
  localStorage.setItem("savedTasks", JSON.stringify(taskList));
  localStorage.setItem("savedTheme", document.body.getAttribute("data-theme"));
}

// Load tasks and theme from Local Storage when the page opens
function loadFromLocalStorage() {
  const storedTasks = localStorage.getItem("savedTasks");
  const storedTheme = localStorage.getItem("savedTheme");

  // If we found saved tasks, convert the text back into an array
  if (storedTasks) {
    taskList = JSON.parse(storedTasks);

    // Make sure our id counter continues from the highest saved id
    taskList.forEach(function (task) {
      if (task.id >= taskIdCounter) {
        taskIdCounter = task.id + 1;
      }
    });
  }

  // If we found a saved theme, apply it to the page
  if (storedTheme) {
    document.body.setAttribute("data-theme", storedTheme);
    updateThemeButtonText();
  }
}


/* ----------------------------------------------------------
   STEP 4: RENDERING TASKS TO THE SCREEN
   This function clears the task container and rebuilds it
   from the taskList array. We use a DocumentFragment here.
---------------------------------------------------------- */

function renderTasks() {

  // First, clear out whatever is currently in the container
  taskContainer.innerHTML = "";

  // Apply search text and category filter before rendering
  const searchText = searchInput.value.toLowerCase();
  const selectedFilter = filterSelect.value;

  const visibleTasks = taskList.filter(function (task) {
    const matchesSearch = task.title.toLowerCase().includes(searchText);
    const matchesFilter = selectedFilter === "All" || task.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  /*
    DocumentFragment is like an invisible container that lives in memory,
    not in the actual page. We build all our task cards inside this
    fragment first, and only add it to the real page ONE time at the end.

    Why this is faster:
    If we added each task card directly to taskContainer one by one,
    the browser would have to repaint/reflow the page after every single
    task. By using a fragment, the browser only has to do that ONE time
    for the whole batch of tasks. This saves a lot of performance,
    especially when there are many tasks.
  */
  const fragment = document.createDocumentFragment();

  visibleTasks.forEach(function (task) {
    const taskCard = buildTaskCard(task);
    fragment.appendChild(taskCard);
  });

  // Now we add the entire fragment to the real DOM in one single step
  taskContainer.appendChild(fragment);

  // Show or hide the "no tasks" message depending on whether we have tasks
  if (taskList.length === 0) {
    emptyMessage.classList.remove("hidden");
  } else {
    emptyMessage.classList.add("hidden");
  }

  updateCounters();
  saveToLocalStorage();
}


/* ----------------------------------------------------------
   STEP 5: BUILDING A SINGLE TASK CARD
   This function creates all the HTML elements for one task
   using createElement(), createTextNode() and append().
---------------------------------------------------------- */

function buildTaskCard(task) {

  // Create the main card container (a div)
  const card = document.createElement("div");
  card.className = "task-card";

  // If the task is completed, add an extra CSS class for styling
  if (task.state === "completed") {
    card.classList.add("completed-task");
  }

  /*
    CUSTOM ATTRIBUTES (data-* attributes)
    setAttribute() lets us attach extra information to an element
    that is not a normal HTML attribute. We use these to remember
    the task's id, category and current state directly on the element.
  */
  card.setAttribute("data-id", task.id);
  card.setAttribute("data-state", task.state);
  card.setAttribute("data-category", task.category);

  // Container for the title and category text
  const infoDiv = document.createElement("div");
  infoDiv.className = "task-info";

  // Create the title text using createElement + createTextNode
  const titleEl = document.createElement("p");
  titleEl.className = "task-title";
  const titleText = document.createTextNode(task.title); // createTextNode() makes a plain text node
  titleEl.appendChild(titleText); // appendChild() attaches the text node inside the <p>

  // Create the category badge
  const categoryEl = document.createElement("span");
  categoryEl.className = "task-category";
  categoryEl.textContent = task.category;

  // append() can add multiple nodes at once, and also accepts plain strings
  infoDiv.append(titleEl, categoryEl);

  // Container for the action buttons
  const buttonsDiv = document.createElement("div");
  buttonsDiv.className = "task-buttons";

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "Edit";
  editBtn.setAttribute("data-action", "edit"); // tells our event delegation what to do

  // Complete button
  const completeBtn = document.createElement("button");
  completeBtn.className = "complete-btn";
  completeBtn.textContent = task.state === "completed" ? "Undo" : "Complete";
  completeBtn.setAttribute("data-action", "complete");

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("data-action", "delete");

  buttonsDiv.append(editBtn, completeBtn, deleteBtn);

  // Finally put the info and buttons into the main card
  card.append(infoDiv, buttonsDiv);

  return card;
}


/* ----------------------------------------------------------
   STEP 6: UPDATING THE COMPLETED/PENDING COUNTERS
---------------------------------------------------------- */

function updateCounters() {
  const completedTasks = taskList.filter(function (task) {
    return task.state === "completed";
  });

  const pendingTasks = taskList.filter(function (task) {
    return task.state === "pending";
  });

  completedCountSpan.textContent = completedTasks.length;
  pendingCountSpan.textContent = pendingTasks.length;
}


/* ----------------------------------------------------------
   STEP 7: ADDING A NEW TASK (Feature 1)
   We listen for the form "submit" event.
---------------------------------------------------------- */

taskForm.addEventListener("submit", function (event) {

  // event.preventDefault() stops the browser from refreshing the page,
  // which is the normal/default behavior when a form is submitted.
  event.preventDefault();

  const titleValue = taskTitleInput.value.trim();

  // Simple validation - don't add empty tasks
  if (titleValue === "") {
    alert("Please type a task title before adding!");
    return;
  }

  // Create a new task object and add it to our array
  const newTask = {
    id: taskIdCounter,
    title: titleValue,
    category: categorySelect.value,
    state: "pending" // every new task starts as pending
  };

  taskIdCounter++;

  /*
    We use prepend-style behavior here: new tasks go to the TOP of the
    array (using unshift) so the newest task appears first in the list.
    This demonstrates the idea behind prepend() at the data level,
    and we also use the real prepend() DOM method below for a quick
    confirmation message.
  */
  taskList.unshift(newTask);

  renderTasks();

  // Show a little temporary confirmation message using prepend()
  showAddedMessage();

  // Clear the input field and refocus it for the next task
  taskTitleInput.value = "";
  taskTitleInput.focus();
});


/* ----------------------------------------------------------
   FEATURE 4 EXAMPLE: prepend()
   This shows a quick "Task added!" message at the very TOP
   of the task container, then removes it after a short delay.
---------------------------------------------------------- */

function showAddedMessage() {
  const message = document.createElement("p");
  message.className = "status-message";
  message.textContent = "✅ New task added!";

  // prepend() inserts the message as the FIRST child of the container,
  // pushing all existing task cards down by one position.
  taskContainer.prepend(message);

  // remove() takes the element straight out of the DOM after 1.5 seconds
  setTimeout(function () {
    message.remove();
  }, 1500);
}


/* ----------------------------------------------------------
   STEP 8: EVENT DELEGATION FOR EDIT / COMPLETE / DELETE
   (Feature 7 - VERY IMPORTANT)

   Instead of putting a click listener on every single button
   (which would be slow and wasteful if we have 100 tasks),
   we put ONE listener on the parent taskContainer.

   When any button inside is clicked, the click event "bubbles up"
   to the container, and we can figure out which button was
   actually clicked using event.target.
---------------------------------------------------------- */

taskContainer.addEventListener("click", function (event) {

  // event.target is the exact element the user clicked on.
  // closest() searches upward from that element to find the
  // nearest parent (or itself) that matches a CSS selector.
  const clickedButton = event.target.closest("button");

  // If the click did not happen on a button, do nothing
  if (!clickedButton) {
    return;
  }

  // matches() checks if an element matches a given CSS selector.
  // We use it here just to double check we really clicked a button
  // that has a data-action attribute.
  if (!clickedButton.matches("[data-action]")) {
    return;
  }

  // Find the task card that this button belongs to
  const taskCard = clickedButton.closest(".task-card");

  // getAttribute() reads the value of the data-id attribute (it's a string)
  const taskId = Number(taskCard.getAttribute("data-id"));

  // dataset is an easier way to read data-* attributes.
  // taskCard.dataset.action would NOT exist on the card itself,
  // but clickedButton.dataset.action gives us "edit", "complete" or "delete"
  const action = clickedButton.dataset.action;

  if (action === "edit") {
    handleEditTask(taskId, taskCard);
  } else if (action === "complete") {
    handleCompleteTask(taskId);
  } else if (action === "delete") {
    handleDeleteTask(taskId, taskCard);
  }
});


/* ----------------------------------------------------------
   STEP 9: EDIT TASK (Feature 4 example: replaceWith())
---------------------------------------------------------- */

function handleEditTask(taskId, taskCard) {

  // Find the task object in our array
  const task = taskList.find(function (t) {
    return t.id === taskId;
  });

  if (!task) return;

  // Ask the user for a new title using a simple prompt box
  const newTitle = prompt("Edit your task title:", task.title);

  // If the user cancels the prompt, newTitle will be null
  if (newTitle === null || newTitle.trim() === "") {
    return;
  }

  // Update our data
  task.title = newTitle.trim();

  // Find the old title element inside this specific card
  const oldTitleEl = taskCard.querySelector(".task-title");

  // Create a brand new title element with the updated text
  const newTitleEl = document.createElement("p");
  newTitleEl.className = "task-title";
  newTitleEl.textContent = task.title;

  /*
    replaceWith() swaps out the old element for a new one in the DOM,
    without needing to know the parent or use removeChild + appendChild
    separately. It just replaces itself directly.
  */
  oldTitleEl.replaceWith(newTitleEl);

  saveToLocalStorage();
}


/* ----------------------------------------------------------
   STEP 10: COMPLETE / UNDO TASK (Feature 4 example: after())
---------------------------------------------------------- */

function handleCompleteTask(taskId) {

  const task = taskList.find(function (t) {
    return t.id === taskId;
  });

  if (!task) return;

  // Toggle between pending and completed
  if (task.state === "pending") {
    task.state = "completed";
  } else {
    task.state = "pending";
  }

  // Re-render everything so the data-state attribute and styles update
  renderTasks();

  // Find the card we just updated so we can show a status message after it
  const updatedCard = taskContainer.querySelector('[data-id="' + taskId + '"]');

  if (updatedCard && task.state === "completed") {
    const statusMsg = document.createElement("p");
    statusMsg.className = "status-message";
    statusMsg.textContent = "🎉 Great job finishing this task!";

    /*
      after() inserts a new element right after the element we call it on,
      as a sibling, without disturbing anything else around it.
    */
    updatedCard.after(statusMsg);

    // Remove the little celebration message after 2 seconds
    setTimeout(function () {
      statusMsg.remove();
    }, 2000);
  }
}


/* ----------------------------------------------------------
   STEP 11: DELETE TASK (Feature 4 example: remove())
---------------------------------------------------------- */

function handleDeleteTask(taskId, taskCard) {

  const confirmDelete = confirm("Are you sure you want to delete this task?");
  if (!confirmDelete) return;

  // Remove the task from our data array
  taskList = taskList.filter(function (task) {
    return task.id !== taskId;
  });

  // remove() deletes the element directly from the DOM
  taskCard.remove();

  // Update everything else (counters, empty message, storage)
  if (taskList.length === 0) {
    emptyMessage.classList.remove("hidden");
  }
  updateCounters();
  saveToLocalStorage();
}


/* ----------------------------------------------------------
   STEP 12: CLEAR ALL TASKS BUTTON (Bonus Feature)
---------------------------------------------------------- */

clearAllBtn.addEventListener("click", function () {
  if (taskList.length === 0) return;

  const confirmClear = confirm("This will delete ALL tasks. Are you sure?");
  if (!confirmClear) return;

  taskList = [];
  renderTasks();
});


/* ----------------------------------------------------------
   STEP 13: SEARCH AND FILTER (Bonus Feature)
   Every time the user types in the search box or changes the
   filter dropdown, we simply re-render the task list.
---------------------------------------------------------- */

searchInput.addEventListener("input", function () {
  renderTasks();
});

filterSelect.addEventListener("change", function () {
  renderTasks();
});


/* ----------------------------------------------------------
   STEP 14: DARK MODE / LIGHT MODE TOGGLE (Feature 5)
---------------------------------------------------------- */

function updateThemeButtonText() {
  const currentTheme = document.body.getAttribute("data-theme");

  if (currentTheme === "dark") {
    themeToggleBtn.textContent = "☀️ Switch to Light Mode";
  } else {
    themeToggleBtn.textContent = "🌙 Switch to Dark Mode";
  }
}

themeToggleBtn.addEventListener("click", function () {

  // getAttribute() reads the current value of data-theme
  const currentTheme = document.body.getAttribute("data-theme");

  if (currentTheme === "light") {
    // setAttribute() changes the value of data-theme to "dark"
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.body.setAttribute("data-theme", "light");
  }

  /*
    We are also demonstrating classList here, even though our dark mode
    is mainly driven by the data-theme attribute and CSS variables.
    Toggling this class lets us add any extra dark-mode-only styling
    later if needed, without changing our main theme logic.
  */
  document.body.classList.toggle("dark-mode-active");

  updateThemeButtonText();
  saveToLocalStorage();
});


/* ----------------------------------------------------------
   STEP 15: ATTRIBUTES VS PROPERTIES DEMO (Feature 3)
---------------------------------------------------------- */

checkValueBtn.addEventListener("click", function () {

  /*
    demoInput.getAttribute("value") always returns the ORIGINAL value
    that was written in the HTML file, no matter what the user types.
    Think of it as the "default" or "starting" value.

    demoInput.value is a PROPERTY. It always shows the CURRENT live
    value of the input box, which updates instantly as the user types.
  */
  const attributeValue = demoInput.getAttribute("value");
  const propertyValue = demoInput.value;

  // Show the difference in the browser console
  console.log("----- Attribute vs Property -----");
  console.log("Attribute (original HTML value):", attributeValue);
  console.log("Property (current live value):", propertyValue);

  // Also show the result directly on the page for convenience
  attributeOutput.textContent = attributeValue;
  propertyOutput.textContent = propertyValue;
});


/* ----------------------------------------------------------
   EXTRA: hasAttribute() and removeAttribute() DEMONSTRATION
   We use these on the demo input as another small example.
---------------------------------------------------------- */

demoInput.addEventListener("focus", function () {
  // hasAttribute() checks if an attribute exists at all (returns true/false)
  if (demoInput.hasAttribute("value")) {
    console.log("This input still has its original 'value' attribute in the HTML.");
  }
});

demoInput.addEventListener("dblclick", function () {
  // removeAttribute() completely deletes an attribute from the element
  demoInput.removeAttribute("value");
  console.log("The 'value' attribute has been removed! (double-click triggered this)");
  console.log("Notice the property (.value) is NOT affected by removing the attribute.");
});


/* ----------------------------------------------------------
   STEP 16: EVENT BUBBLING AND CAPTURING DEMO (Feature 8 & 9)

   Bubbling = event starts at the CHILD and moves UP to the parents.
   Capturing = event starts at the OUTERMOST parent and moves DOWN
               to the child (this is the opposite direction).

   addEventListener(type, handler, useCapture):
   - useCapture = false (or not given) -> normal bubbling phase
   - useCapture = true -> capturing phase
---------------------------------------------------------- */

// BUBBLING listeners (third argument is false, which is also the default)
grandparentBox.addEventListener("click", function () {
  console.log("Grandparent (Bubbling Phase)");
}, false);

parentBox.addEventListener("click", function () {
  console.log("Parent (Bubbling Phase)");
}, false);

childButton.addEventListener("click", function () {
  console.log("Child Button (Bubbling Phase)");
  console.log("---");
}, false);


// CAPTURING listeners (third argument is true)
grandparentBox.addEventListener("click", function () {
  if (captureToggle.checked) {
    console.log("Grandparent (Capturing Phase)");
  }
}, true);

parentBox.addEventListener("click", function () {
  if (captureToggle.checked) {
    console.log("Parent (Capturing Phase)");
  }
}, true);

childButton.addEventListener("click", function () {
  if (captureToggle.checked) {
    console.log("Child Button (Capturing Phase)");
    console.log("---");
  }
}, true);

/*
  NOTE ON HOW THIS DEMO WORKS:
  The bubbling listeners above are ALWAYS active, so by default,
  clicking the child button logs:
    Child -> Parent -> Grandparent   (this is bubbling: child to parent)

  When the user checks "Enable Capturing Mode", the capturing listeners
  also start printing to the console. Because the capturing phase always
  happens BEFORE the bubbling phase, you will see:
    Grandparent -> Parent -> Child   (this is capturing: parent to child)
  printed FIRST, followed by the normal bubbling order right after it.
*/


/* ----------------------------------------------------------
   STEP 17: LOAD EVERYTHING WHEN THE PAGE FIRST OPENS
---------------------------------------------------------- */

// This runs once, as soon as the script file loads
loadFromLocalStorage();
renderTasks();
updateThemeButtonText();