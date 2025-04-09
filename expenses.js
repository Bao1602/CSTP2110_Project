// Global variables
let expensesList = [];
let currentThreshold = localStorage.getItem("threshold") || 0;
let API_GATEWAY = "https://i1nnnk9xz1.execute-api.us-east-1.amazonaws.com/dev"

// Function to run on page load
window.onload = function() {
    // Set current month in the selector
    const currentDate = new Date();
    document.getElementById("monthSelector").value = currentDate.getMonth() + 1;
    
    // Load threshold from localStorage
    const savedThreshold = localStorage.getItem("threshold");
    if (savedThreshold) {
        document.getElementById("threshold").value = savedThreshold;
        currentThreshold = savedThreshold;
    }
    
    // Fetch expenses
    fetchExpenses();
};

// Set threshold for budget management and update on server
const setThreshold = async () => {
    const threshold = document.getElementById("threshold").value;
    if (!threshold || isNaN(threshold) || threshold < 0) {
        alert("Please enter a valid threshold amount");
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to set a threshold");
        window.location.href = "login.html";
        return;
    }
    
    try {
        // Save threshold to server
        const response = await fetch(`${API_GATEWAY}/thresholds`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ threshold: parseFloat(threshold) })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to set threshold");
        }
        
        // Save threshold locally
        localStorage.setItem("threshold", threshold);
        currentThreshold = threshold;
        alert(`Budget threshold set to $${threshold}`);
        
        // Re-run expense calculations to check if already over threshold
        filterExpensesByMonth();
    } catch (error) {
        console.error("Error setting threshold:", error);
        alert(`Failed to set threshold: ${error.message}`);
    }
};

// Create a new expense
const createExpense = async (event) => {
    event.preventDefault();
    
    // Get values from form
    const expenseName = document.getElementById("expenseName").value;
    const amount = document.getElementById("amount").value;
    const date = document.getElementById("date").value;
    const category = document.getElementById("category").value;
    
    // Validate inputs
    if (!expenseName || !amount || !date || category === "Choose Category") {
        alert("Please fill in all fields");
        return;
    }
    
    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to create expenses");
        window.location.href = "login.html";
        return;
    }
    
    // Prepare expense data
    const expenseData = {
        expenseName,
        amount: parseFloat(amount),
        date,
        category
    };
    
    try {
        const response = await fetch(`${API_GATEWAY}/expenses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to create expense");
        }
        
        // Clear form fields
        document.getElementById("expenseName").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("date").value = "";
        document.getElementById("category").value = "Choose Category";
        
        // Refresh expenses list
        fetchExpenses();
        
        alert("Expense created successfully!");
    } catch (error) {
        console.error("Error creating expense:", error);
        alert(`Failed to create expense: ${error.message}`);
    }
};

// Fetch all expenses for the logged-in user
const fetchExpenses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("No token found");
        return;
    }
    
    try {
        const response = await fetch(`${API_GATEWAY}/expenses`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch expenses");
        }
        
        // Debug: Log the first expense to check its structure
        if (data.expenses && data.expenses.length > 0) {
            console.log("Sample expense object structure:", data.expenses[0]);
        }
        
        // Store expenses globally and display
        expensesList = data.expenses || [];
        filterExpensesByMonth();
    } catch (error) {
        console.error("Error fetching expenses:", error);
        document.getElementById("allExpense").innerHTML = `<p class="text-red-500">Failed to load expenses: ${error.message}</p>`;
    }
};

// Filter expenses by selected month
const filterExpensesByMonth = () => {
    const monthSelector = document.getElementById("monthSelector");
    const selectedMonth = parseInt(monthSelector.value);
    
    // Filter the expenses by selected month
    const filteredExpenses = expensesList.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === selectedMonth;
    });
    
    // Calculate total for the month
    const monthlyTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Check if over threshold
    const isOverBudget = currentThreshold > 0 && monthlyTotal > currentThreshold;
    
    // Display expenses
    displayExpenses(filteredExpenses, monthlyTotal, isOverBudget);
};

// Display expenses in the UI
const displayExpenses = (expenses, totalAmount, isOverBudget) => {
    const expensesContainer = document.getElementById("allExpense");
    
    // Debug: Log to verify expenses structure
    console.log(`Displaying ${expenses.length} expenses for selected month`);
    if (expenses.length > 0) {
        console.log("First expense in list:", expenses[0]);
    }
    
    if (expenses.length === 0) {
        expensesContainer.innerHTML = `
            <div class="bg-white rounded-lg p-4 shadow-md">
                <p class="text-gray-600">No expenses found for this month.</p>
            </div>
        `;
        return;
    }
    
    // Create header with total
    let html = `
        <div class="w-full mb-4">
            <div class="flex justify-between items-center bg-white rounded-lg p-4 shadow-md">
                <h2 class="text-xl font-bold">Monthly Total: $${totalAmount.toFixed(2)}</h2>
                ${currentThreshold > 0 ? 
                    `<div class="font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}">
                        ${isOverBudget ? 
                            `Over budget by $${(totalAmount - currentThreshold).toFixed(2)}!` : 
                            `Budget remaining: $${(currentThreshold - totalAmount).toFixed(2)}`
                        }
                    </div>` : 
                    '<div class="text-gray-600">No budget set</div>'
                }
            </div>
        </div>
    `;
    
    // Add each expense
    expenses.forEach(expense => {
        const expenseDate = new Date(expense.date).toLocaleDateString();
        
        // Make sure expenseId exists and provide fallback
        if (!expense.expenseId) {
            console.warn("Missing expenseId for expense:", expense);
        }
        
        // Get the expense ID reliably
        const id = expense.expenseId || '';
        
        html += `
            <div class="bg-white rounded-lg p-4 shadow-md mb-4">
                <div class="flex justify-between">
                    <h3 class="font-semibold text-lg">${expense.expenseName}</h3>
                    <span class="font-bold ${expense.amount > 100 ? 'text-red-600' : 'text-green-600'}">$${expense.amount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Category: ${expense.category}</span>
                    <span>Date: ${expenseDate}</span>
                </div>
                <div class="mt-3 flex justify-end">
                    <button onclick="deleteExpense('${id}')" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs">
                        Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    expensesContainer.innerHTML = html;
};

// Delete an expense
const deleteExpense = async (expenseId) => {
    // Validate expense ID
    if (!expenseId) {
        console.error("Error: No expense ID provided for deletion");
        alert("Error: Could not delete this expense (missing ID)");
        return;
    }
    
    console.log(`Attempting to delete expense with ID: ${expenseId}`);
    
    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to delete expenses");
        return;
    }
    
    try {
        const response = await fetch(`${API_GATEWAY}/expenses/${expenseId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            // First try to parse as JSON, but handle case where response might not be JSON
            const data = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
            throw new Error(data.message || "Failed to delete expense");
        }
        
        // Try to parse response as JSON, but don't fail if it's not JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { message: "Expense deleted successfully" };
        }
        
        console.log("Delete response:", data);
        
        // Refresh expenses list
        fetchExpenses();
        alert("Expense deleted successfully!");
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert(`Failed to delete expense: ${error.message}`);
    }
};

// Logout function
const logout = (event) => {
    event.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "login.html";
};