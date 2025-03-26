const addExpense = async () => {
    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const token = localStorage.getItem("token");

    const response = await fetch("https://dvf3jejs81.execute-api.us-east-1.amazonaws.com/expenses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount, description })
    });

    const data = await response.json();
    alert(data.message);
};

const setThreshold = async () => {
    const threshold = document.getElementById("threshold").value;
    localStorage.setItem("threshold", threshold);
};
