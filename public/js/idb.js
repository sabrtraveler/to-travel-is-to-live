// Create var for DB connection 
let db;

// Est. Connection to IndexedDB called budget_tracker and make it version 1
const request = indexedDB.open('budget_tracker', 1);

// This event will happen if the DB version changes 
request.onupgradeneeded = function(event) {

    // save a reference to the database
    const db = event.target.result;

    // Create table called new transactions and set it to have incrementing primary key of sorts 
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon being successful
request.onsuccess = function(event) {

    // When DB is created successfully then save reference to DB in global variable 
    db = event.target.result;

    // See if the app is online and if so then run uploadTransaction function to send all local DB data to api 
    if (navigator.onLine) {
        // todo: uploadTransaction();
    }
};

request.onerror = function(event) {
    // this is where we log the error
    console.log(event.target.errorCode);
};

// this function will run if we try to submit a new transaction but there is no internet connection 
function saveRecord(record) {

    // open new transaction with the database with the DB with read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store for new_transaction 
    const  budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store using add method 
    budgetObjectStore.add(record);
}

function uploadTransaction() {

    // open transaction on your DB 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // Access your object store 
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // Retrieve all records from store and set to a variable 
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {

        // If there is data in indexDB;s store then send it to api server 
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    // Open another transaction 
                    const transaction = db.transaction(['new_transaction'], 'readwrite');

                    // Access the new transaction object store 
                    const budgetObjectStore = transaction.objectStore('new_transaction');

                    // Clear the items in the store 
                    budgetObjectStore.clear();

                    alert('All saved transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// Listen for app coming back online 
window.addEventListener('online', uploadTransaction);