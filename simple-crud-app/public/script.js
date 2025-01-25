// //script.js

// // Constants for API endpoints and common selectors
// const API_BASE_URL = '/api';
// const LOADING_DELAY = 1; // milliseconds

// // Utility function to show/hide loading spinner
// const toggleLoading = (show = false) => {
//     const spinner = document.getElementById('loadingSpinner');
//     spinner.classList.toggle('hidden', !show);
// };

// // Enhanced status message handling
// const showMessage = (message, type = 'success') => {
//     const statusDiv = document.getElementById('statusMessage');
//     statusDiv.textContent = message;
//     statusDiv.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${
//         type === 'success' ? 'bg-green-500' : 'bg-red-500'
//     }`;
//     statusDiv.classList.remove('hidden');
//     setTimeout(() => statusDiv.classList.add('hidden'), 3000);
// };

// const showSuccess = (message) => showMessage(message, 'success');
// const showError = (message) => showMessage(message, 'error');

// // Tab handling with loading states
// document.querySelectorAll('.tab-button').forEach(button => {
//     button.addEventListener('click', async () => {
//         // Update active states
//         document.querySelectorAll('.tab-button').forEach(b => {
//             b.classList.remove('bg-blue-600', 'text-white');
//             b.classList.add('bg-gray-200', 'text-gray-700');
//         });
//         document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
        
//         // Set active tab styling
//         button.classList.remove('bg-gray-200', 'text-gray-700');
//         button.classList.add('bg-blue-600', 'text-white');
        
//         const targetTab = document.getElementById(`${button.dataset.tab}-tab`);
//         targetTab.classList.remove('hidden');
        
//         // Load data for the selected tab
//         await loadTabData(button.dataset.tab);
//     });
// });

// // Enhanced data loading with error handling
// async function loadTabData(tabName) {
//   toggleLoading(true);
//   try {
//       const response = await fetch(`${API_BASE_URL}/${tabName}`);
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//       const data = await response.json();
      
//       // Check if the response contains a data property (for paginated responses)
//       const items = data.data || data;
      
//       if (!Array.isArray(items)) {
//           throw new Error('Invalid data format received from server');
//       }
      
//       await populateTable(tabName, items);
      
//       // Load related data for dropdowns if needed
//       await loadRelatedData(tabName);
//   } catch (error) {
//       showError(`Error loading ${tabName}: ${error.message}`);
//       console.error(`Error loading ${tabName}:`, error);
//   } finally {
//       toggleLoading(false);
//   }
// }

// // Load related data for dropdowns
// async function loadRelatedData(tabName) {
//     switch(tabName) {
//         case 'books':
//             await Promise.all([
//                 populateSelect('publisher_id', 'publishers'),
//                 populateSelect('category_id', 'categories')
//             ]);
//             break;
//         case 'orders':
//             await populateSelect('order-customer', 'customers');
//             break;
//         case 'reviews':
//             await Promise.all([
//                 populateSelect('review-book', 'books'),
//                 populateSelect('review-customer', 'customers')
//             ]);
//             break;
//     }
// }

// // Populate select dropdowns
// async function populateSelect(selectId, dataType) {
//   try {
//       const response = await fetch(`${API_BASE_URL}/${dataType}`);
//       const data = await response.json();
//       const select = document.getElementById(selectId);
      
//       if (!select) {
//           console.error(`Select element with id ${selectId} not found`);
//           return;
//       }
      
//       select.innerHTML = '<option value="">Select...</option>';
      
//       if (Array.isArray(data)) {
//           data.forEach(item => {
//               const option = document.createElement('option');
//               option.value = item[`${dataType.slice(0, -1)}_id`];
//               option.textContent = item.name || `${item.first_name} ${item.last_name}` || item.title;
//               select.appendChild(option);
//           });
//       }
//   } catch (error) {
//       showError(`Error loading ${dataType}: ${error.message}`);
//       console.error(`Error loading ${dataType}:`, error);
//   }
// }

// // Enhanced table population with better formatting
// function populateTable(tabName, data) {
//   const tbody = document.querySelector(`#${tabName}-table tbody`);
//   tbody.innerHTML = '';
  
//   // Check if data is an array and not empty
//   if (!Array.isArray(data)) {
//       console.error('Data is not an array:', data);
//       return;
//   }
  
//   data.forEach(item => {
//       const tr = document.createElement('tr');
//       tr.className = 'hover:bg-gray-50';
      
//       const columns = getColumnsForTable(tabName, item);
//       tr.innerHTML = `
//           ${columns}
//           <td class="px-6 py-4 whitespace-nowrap">
//               <button onclick="editItem('${tabName}', ${item[`${tabName.slice(0, -1)}_id`]})"
//                   class="text-blue-600 hover:text-blue-800 mr-2">
//                   <i class="fas fa-edit"></i>
//               </button>
//               <button onclick="deleteItem('${tabName}', ${item[`${tabName.slice(0, -1)}_id`]})"
//                   class="text-red-600 hover:text-red-800">
//                   <i class="fas fa-trash"></i>
//               </button>
//           </td>
//       `;
//       tbody.appendChild(tr);
//   });
// }

// // Helper function to get table columns based on table type
// function getColumnsForTable(tabName, item) {
//     const formatters = {
//         date: (date) => date ? new Date(date).toLocaleDateString() : '',
//         currency: (amount) => amount ? `$${parseFloat(amount).toFixed(2)}` : '',
//         text: (text) => text || '',
//     };

//     // ... (previous code remains the same until tableConfigs)

// const tableConfigs = {
//   books: [
//       { key: 'book_id', format: 'text' },
//       { key: 'isbn', format: 'text' },
//       { key: 'title', format: 'text' },
//       { key: 'price', format: 'currency' },
//       { key: 'publication_date', format: 'date' },
//       { key: 'stock_quantity', format: 'text' },
//       { key: 'publisher_name', format: 'text' },
//       { key: 'category_name', format: 'text' }
//   ],
//   authors: [
//       { key: 'author_id', format: 'text' },
//       { key: 'first_name', format: 'text' },
//       { key: 'last_name', format: 'text' },
//       { key: 'email', format: 'text' },
//       { key: 'birth_date', format: 'date' }
//   ],
//   publishers: [
//       { key: 'publisher_id', format: 'text' },
//       { key: 'name', format: 'text' },
//       { key: 'address', format: 'text' },
//       { key: 'phone', format: 'text' },
//       { key: 'email', format: 'text' }
//   ],
//   categories: [
//       { key: 'category_id', format: 'text' },
//       { key: 'name', format: 'text' },
//       { key: 'description', format: 'text' }
//   ],
//   customers: [
//       { key: 'customer_id', format: 'text' },
//       { key: 'first_name', format: 'text' },
//       { key: 'last_name', format: 'text' },
//       { key: 'email', format: 'text' },
//       { key: 'phone', format: 'text' },
//       { key: 'address', format: 'text' },
//       { key: 'registration_date', format: 'date' }
//   ],
//   orders: [
//       { key: 'order_id', format: 'text' },
//       { key: 'customer_id', format: 'text' },
//       { key: 'order_date', format: 'date' },
//       { key: 'total_amount', format: 'currency' },
//       { key: 'status', format: 'text' }
//   ],
//   reviews: [
//       { key: 'review_id', format: 'text' },
//       { key: 'book_id', format: 'text' },
//       { key: 'customer_id', format: 'text' },
//       { key: 'rating', format: 'text' },
//       { key: 'review_text', format: 'text' },
//       { key: 'review_date', format: 'date' }
//   ]
// };
// const config = tableConfigs[tabName] || [];
//     return config.map(col => 
//         `<td class="px-6 py-4 whitespace-nowrap">${formatters[col.format](item[col.key])}</td>`
//     ).join('');
// } 

// // CRUD Operations
// async function addItem(tabName, data) {
//   toggleLoading(true);
//   try {
//       const response = await fetch(`${API_BASE_URL}/${tabName}`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(data)
//       });

//       if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || 'Failed to add item');
//       }

//       await loadTabData(tabName);
//       document.getElementById(`${tabName}-form`).reset();
//       showSuccess(`${tabName.slice(0, -1)} added successfully`);
//   } catch (error) {
//       showError(error.message);
//       console.log(`${error.message}`);
//   } finally {
//       toggleLoading(false);
//   }
// }

// async function editItem(tabName, id) {
//     toggleLoading(true);
//     try {
//         const response = await fetch(`${API_BASE_URL}/${tabName}/${id}`);
//         if (!response.ok) throw new Error('Failed to fetch item');
        
//         const item = await response.json();
//         const form = document.getElementById(`${tabName}-form`);
        
//         // Set form values based on table type
//         switch(tabName) {
//             case 'books':
//                 form.querySelector('#book-id').value = item.book_id;
//                 form.querySelector('#isbn').value = item.isbn;
//                 form.querySelector('#title').value = item.title;
//                 form.querySelector('#price').value = item.price;
//                 form.querySelector('#publication-date').value = item.publication_date?.split('T')[0];
//                 form.querySelector('#stock-quantity').value = item.stock_quantity;
//                 form.querySelector('#publisher-id').value = item.publisher_id;
//                 form.querySelector('#category-id').value = item.category_id;
//                 break;
//             case 'authors':
//                 form.querySelector('#author-id').value = item.author_id;
//                 form.querySelector('#author-first-name').value = item.first_name;
//                 form.querySelector('#author-last-name').value = item.last_name;
//                 form.querySelector('#author-email').value = item.email || '';
//                 form.querySelector('#author-birth-date').value = item.birth_date?.split('T')[0];
//                 break;
//             case 'publishers':
//                 form.querySelector('#publisher-id').value = item.publisher_id;
//                 form.querySelector('#publisher-name').value = item.name;
//                 form.querySelector('#publisher-address').value = item.address || '';
//                 form.querySelector('#publisher-phone').value = item.phone || '';
//                 form.querySelector('#publisher-email').value = item.email || '';
//                 break;
//             case 'categories':
//                 form.querySelector('#category-id').value = item.category_id;
//                 form.querySelector('#category-name').value = item.name;
//                 form.querySelector('#category-description').value = item.description || '';
//                 break;
//             case 'customers':
//                 form.querySelector('#customer-id').value = item.customer_id;
//                 form.querySelector('#customer-first-name').value = item.first_name;
//                 form.querySelector('#customer-last-name').value = item.last_name;
//                 form.querySelector('#customer-email').value = item.email || '';
//                 form.querySelector('#customer-phone').value = item.phone || '';
//                 form.querySelector('#customer-address').value = item.address;
//                 form.querySelector('#customer-registration-date').value = item.registration_date?.split('T')[0];
//                 break;
//             case 'orders':
//                 form.querySelector('#order-id').value = item.order_id;
//                 form.querySelector('#customer-id').value = item.customer_id;
//                 form.querySelector('#order-date').value = item.order_date?.split('T')[0];
//                 form.querySelector('#total-amount').value = item.total_amount;
//                 form.querySelector('#order-status').value = item.status;
//                 break;
//             case 'order-details':
//                 form.querySelector('#order-id').value = item.order_id;
//                 form.querySelector('#book-id').value = item.book_id;
//                 form.querySelector('#quantity').value = item.quantity;
//                 form.querySelector('#unit-price').value = item.unit_price;
//                 break;
//             case 'reviews':
//                 form.querySelector('#review-id').value = item.review_id;
//                 form.querySelector('#book-id').value = item.book_id;
//                 form.querySelector('#customer-id').value = item.customer_id;
//                 form.querySelector('#rating').value = item.rating;
//                 form.querySelector('#review-text').value = item.review_text || '';
//                 form.querySelector('#review-date').value = item.review_date?.split('T')[0];
//                 break;
//             // Add more cases as needed
//         }
  
//         // Show update button, hide submit button
//         form.querySelector('button[type="submit"]').classList.add('hidden');
//         form.querySelector(`#update-${tabName}-btn`).classList.remove('hidden');
//     } catch (error) {
//         showError(error.message);
//         console.log(`${error.message}`);
//     } finally {
//         toggleLoading(false);
//     }
//   }
  

// async function updateItem(tabName) {
//   toggleLoading(true);
//   try {
//       const form = document.getElementById(`${tabName}-form`);
//       const id = form.querySelector(`#${tabName.slice(0, -1)}-id`).value;
//       const formData = new FormData(form);
//       const data = Object.fromEntries(formData.entries());

//       const response = await fetch(`${API_BASE_URL}/${tabName}/${id}`, {
//           method: 'PUT',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(data)
//       });

//       if (!response.ok) throw new Error('Failed to update item');

//       await loadTabData(tabName);
//       form.reset();
//       form.querySelector('button[type="submit"]').classList.remove('hidden');
//       form.querySelector(`#update-${tabName}-btn`).classList.add('hidden');
//       showSuccess(`${tabName.slice(0, -1)} updated successfully`);
//   } catch (error) {
//       showError(error.message);
//       console.log(`${error.message}`);
//   } finally {
//       toggleLoading(false);
//   }
// }

// async function deleteItem(tabName, id) {
//   if (!confirm(`Are you sure you want to delete this ${tabName.slice(0, -1)}?`)) return;

//   toggleLoading(true);
//   try {
//       const response = await fetch(`${API_BASE_URL}/${tabName}/${id}`, {
//           method: 'DELETE'
//       });

//       if (!response.ok) throw new Error('Failed to delete item');

//       await loadTabData(tabName);
//       showSuccess(`${tabName.slice(0, -1)} deleted successfully`);
//   } catch (error) {
//       showError(error.message);
//       console.log(`${error.message}`);
//   } finally {
//       toggleLoading(false);
//   }
// }

// // Add event listeners for update buttons
// document.querySelectorAll('[id^="update-"][id$="-btn"]').forEach(button => {
//   button.addEventListener('click', (e) => {
//       const tabName = e.target.id.replace('update-', '').replace('-btn', '');
//       updateItem(tabName);
//   });
// });

// // Initialize the application
// document.addEventListener('DOMContentLoaded', () => {
//   const activeTab = document.querySelector('.tab-button.active').dataset.tab;
//   loadTabData(activeTab);
// });

// //     const config = tableConfigs[tabName] || [];
// //     return config.map(col => 
// //         `<td class="px-6 py-4 whitespace-nowrap">${formatters[col.format](item[col.key])}</td>`
// //     ).join('');
// // }

// // Form submission handling
// document.querySelectorAll('.data-form').forEach(form => {
//     form.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const tabName = form.id.replace('-form', '');
//         const formData = new FormData(form);
//         const data = Object.fromEntries(formData.entries());
        
//         await addItem(tabName, data);
//     });
// });

// // Continue with the rest of your CRUD functions (addItem, editItem, deleteItem)
// // but add proper loading states and error handling...

// // Initialize the application
// document.addEventListener('DOMContentLoaded', () => {
//   const defaultTab = document.querySelector('.tab-button');
//   if (defaultTab) {
//       defaultTab.classList.add('active');
//       const tabName = defaultTab.dataset.tab;
//       if (tabName) {
//           loadTabData(tabName);
//       } else {
//           console.error('No tab name found in dataset');
//       }
//   } else {
//       console.error('No tab buttons found');
//   }
// });





















// Constants for API endpoints and common selectors
const API_BASE_URL = '/api';
const LOADING_DELAY = 1; // milliseconds

// Utility function to show/hide loading spinner
const toggleLoading = (show = false) => {
    const spinner = document.getElementById('loadingSpinner');
    spinner.classList.toggle('hidden', !show);
};

// Enhanced status message handling
const showMessage = (message, type = 'success') => {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    statusDiv.classList.remove('hidden');
    setTimeout(() => statusDiv.classList.add('hidden'), 3000);
};

const showSuccess = (message) => showMessage(message, 'success');
const showError = (message) => showMessage(message, 'error');

// Tab handling with loading states
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', async () => {
        // Update active states
        document.querySelectorAll('.tab-button').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-gray-200', 'text-gray-700');
        });
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
        
        // Set active tab styling
        button.classList.remove('bg-gray-200', 'text-gray-700');
        button.classList.add('bg-blue-600', 'text-white');
        
        const targetTab = document.getElementById(`${button.dataset.tab}-tab`);
        targetTab.classList.remove('hidden');
        
        // Load data for the selected tab
        await loadTabData(button.dataset.tab);
    });
});

// Enhanced data loading with error handling
async function loadTabData(tabName) {
  toggleLoading(true);
  try {
      const response = await fetch(`${API_BASE_URL}/${tabName}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Check if the response contains a data property (for paginated responses)
      const items = data.data || data;
      
      if (!Array.isArray(items)) {
          throw new Error('Invalid data format received from server');
      }
      
      await populateTable(tabName, items);
      
      // Load related data for dropdowns if needed
      await loadRelatedData(tabName);
  } catch (error) {
      showError(`Error loading ${tabName}: ${error.message}`);
      console.error(`Error loading ${tabName}:`, error);
  } finally {
      toggleLoading(false);
  }
}

// Load related data for dropdowns
async function loadRelatedData(tabName) {
    switch(tabName) {
        case 'books':
            await Promise.all([
                populateSelect('publisher_id', 'publishers'),
                populateSelect('category_id', 'categories')
            ]);
            break;
        case 'orders':
            await populateSelect('order-customer', 'customers');
            break;
        case 'reviews':
            await Promise.all([
                populateSelect('review-book', 'books'),
                populateSelect('review-customer', 'customers')
            ]);
            break;
    }
}

// Populate select dropdowns
async function populateSelect(selectId, dataType) {
  try {
      const response = await fetch(`${API_BASE_URL}/${dataType}`);
      const data = await response.json();
      const select = document.getElementById(selectId);
      
      if (!select) {
          console.error(`Select element with id ${selectId} not found`);
          return;
      }
      
      select.innerHTML = '<option value="">Select...</option>';
      
      if (Array.isArray(data)) {
          data.forEach(item => {
              const option = document.createElement('option');
              option.value = item[`${dataType.slice(0, -1)}_id`];
              option.textContent = item.name || `${item.first_name} ${item.last_name}` || item.title;
              select.appendChild(option);
          });
      }
  } catch (error) {
      showError(`Error loading ${dataType}: ${error.message}`);
      console.error(`Error loading ${dataType}:`, error);
  }
}

// Enhanced table population with better formatting
function populateTable(tabName, data) {
  const tbody = document.querySelector(`#${tabName}-table tbody`);
  tbody.innerHTML = '';
  
  // Check if data is an array and not empty
  if (!Array.isArray(data)) {
      console.error('Data is not an array:', data);
      return;
  }
  
  data.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      
      const columns = getColumnsForTable(tabName, item);
      tr.innerHTML = `
          ${columns}
          <td class="px-6 py-4 whitespace-nowrap">
              <button data-action="edit" data-tab="${tabName}" data-id="${item[`${tabName.slice(0, -1)}_id`]}"
                  class="text-blue-600 hover:text-blue-800 mr-2">
                  <i class="fas fa-edit"></i>
              </button>
              <button data-action="delete" data-tab="${tabName}" data-id="${item[`${tabName.slice(0, -1)}_id`]}"
                  class="text-red-600 hover:text-red-800">
                  <i class="fas fa-trash"></i>
              </button>
          </td>
      `;
      tbody.appendChild(tr);
  });
}

// Helper function to get table columns based on table type
function getColumnsForTable(tabName, item) {
    const formatters = {
        date: (date) => date ? new Date(date).toLocaleDateString() : '',
        currency: (amount) => amount ? `$${parseFloat(amount).toFixed(2)}` : '',
        text: (text) => text || '',
    };

    const tableConfigs = {
        books: [
            { key: 'book_id', format: 'text' },
            { key: 'isbn', format: 'text' },
            { key: 'title', format: 'text' },
            { key: 'price', format: 'currency' },
            { key: 'publication_date', format: 'date' },
            { key: 'stock_quantity', format: 'text' },
            { key: 'publisher_name', format: 'text' },
            { key: 'category_name', format: 'text' }
        ],
        authors: [
            { key: 'author_id', format: 'text' },
            { key: 'first_name', format: 'text' },
            { key: 'last_name', format: 'text' },
            { key: 'email', format: 'text' },
            { key: 'birth_date', format: 'date' }
        ],
        publishers: [
            { key: 'publisher_id', format: 'text' },
            { key: 'name', format: 'text' },
            { key: 'address', format: 'text' },
            { key: 'phone', format: 'text' },
            { key: 'email', format: 'text' }
        ],
        categories: [
            { key: 'category_id', format: 'text' },
            { key: 'name', format: 'text' },
            { key: 'description', format: 'text' }
        ],
        customers: [
            { key: 'customer_id', format: 'text' },
            { key: 'first_name', format: 'text' },
            { key: 'last_name', format: 'text' },
            { key: 'email', format: 'text' },
            { key: 'phone', format: 'text' },
            { key: 'address', format: 'text' },
            { key: 'registration_date', format: 'date' }
        ],
        orders: [
            { key: 'order_id', format: 'text' },
            { key: 'customer_id', format: 'text' },
            { key: 'order_date', format: 'date' },
            { key: 'total_amount', format: 'currency' },
            { key: 'status', format: 'text' }
        ],
        reviews: [
            { key: 'review_id', format: 'text' },
            { key: 'book_id', format: 'text' },
            { key: 'customer_id', format: 'text' },
            { key: 'rating', format: 'text' },
            { key: 'review_text', format: 'text' },
            { key: 'review_date', format: 'date' }
        ]
    };

    const config = tableConfigs[tabName] || [];
    return config.map(col => 
        `<td class="px-6 py-4 whitespace-nowrap">${formatters[col.format](item[col.key])}</td>`
    ).join('');
}

// Event delegation for dynamic buttons
document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const tabName = button.dataset.tab;
    const id = button.dataset.id;

    if (action === 'edit') editItem(tabName, id);
    if (action === 'delete') deleteItem(tabName, id);
});

// CRUD Operations
async function addItem(tabName, data) {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/${tabName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add item');
        }

        await loadTabData(tabName);
        document.getElementById(`${tabName}-form`).reset();
        showSuccess(`${tabName.slice(0, -1)} added successfully`);
    } catch (error) {
        showError(error.message);
        console.log(`${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

async function editItem(tabName, id) {
    toggleLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/${tabName}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        
        const item = await response.json();
        const form = document.getElementById(`${tabName}-form`);
        
        // Set form values based on table type
        switch(tabName) {
            case 'books':
                form.querySelector('#book_id').value = item.book_id;
                form.querySelector('#isbn').value = item.isbn;
                form.querySelector('#title').value = item.title;
                form.querySelector('#price').value = item.price;
                form.querySelector('#publication_date').value = item.publication_date?.split('T')[0];
                form.querySelector('#stock_quantity').value = item.stock_quantity;
                form.querySelector('#publisher_id').value = item.publisher_id;
                form.querySelector('#category_id').value = item.category_id;
                break;
        
            case 'authors':
                form.querySelector('#author_id').value = item.author_id;
                form.querySelector('#first_name').value = item.first_name;
                form.querySelector('#last_name').value = item.last_name;
                form.querySelector('#email').value = item.email;
                form.querySelector('#birth_date').value = item.birth_date?.split('T')[0];
                break;
        
            case 'publishers':
                form.querySelector('#publisher_id').value = item.publisher_id;
                form.querySelector('#name').value = item.name;
                form.querySelector('#address').value = item.address;
                form.querySelector('#phone').value = item.phone;
                form.querySelector('#email').value = item.email;
                break;
        
            case 'categories':
                form.querySelector('#category_id').value = item.category_id;
                form.querySelector('#name').value = item.name;
                form.querySelector('#description').value = item.description;
                break;
        
            case 'customers':
                form.querySelector('#customer_id').value = item.customer_id;
                form.querySelector('#first_name').value = item.first_name;
                form.querySelector('#last_name').value = item.last_name;
                form.querySelector('#email').value = item.email;
                form.querySelector('#phone').value = item.phone;
                form.querySelector('#address').value = item.address;
                form.querySelector('#registration_date').value = item.registration_date?.split('T')[0];
                break;
        
            case 'orders':
                form.querySelector('#order_id').value = item.order_id;
                form.querySelector('#customer_id').value = item.customer_id;
                form.querySelector('#order_date').value = item.order_date?.split('T')[0];
                form.querySelector('#total_amount').value = item.total_amount;
                form.querySelector('#status').value = item.status;
                break;
        
            case 'reviews':
                form.querySelector('#review_id').value = item.review_id;
                form.querySelector('#book_id').value = item.book_id;
                form.querySelector('#customer_id').value = item.customer_id;
                form.querySelector('#rating').value = item.rating;
                form.querySelector('#review_text').value = item.review_text;
                form.querySelector('#review_date').value = item.review_date?.split('T')[0];
                break;
        
            default:
                console.error(`Unknown tab type: ${tabName}`);
                break;
        }

        // Show update button, hide submit button
        form.querySelector('button[type="submit"]').classList.add('hidden');
        form.querySelector(`#update-${tabName}-btn`).classList.remove('hidden');
    } catch (error) {
        showError(error.message);
        console.log(`${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

async function deleteItem(tabName, id) {
    if (!confirm(`Are you sure you want to delete this ${tabName.slice(0, -1)}?`)) return;

    toggleLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/${tabName}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete item');

        await loadTabData(tabName);
        showSuccess(`${tabName.slice(0, -1)} deleted successfully`);
    } catch (error) {
        showError(error.message);
        console.log(`${error.message}`);
    } finally {
        toggleLoading(false);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const activeTab = document.querySelector('.tab-button.active')?.dataset.tab;
    if (activeTab) loadTabData(activeTab);
});

// Form submission handling
document.querySelectorAll('.data-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tabName = form.id.replace('-form', '');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        await addItem(tabName, data);
    });
});