const signup = async () => {
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");
    
    const email = emailElement.value.trim();
    const password = passwordElement.value;

    // Basic validation
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    // More robust email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address");
        return;
    }

    // Password strength validation
    if (password.length < 8) {
        alert("Password must be at least 8 characters long");
        return;
    }

    const userData = {
        ClientId: "363jkb3ojf89mva2ijs849v3g7",
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: "email",
                Value: email
            }
        ]
    };

    try {
        const response = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp",
                "Accept": "application/json"
            },
            body: JSON.stringify(userData)
        });

        // Detailed logging
        console.log('Full Request:', {
            url: "https://cognito-idp.us-east-1.amazonaws.com/",
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.SignUp"
            },
            body: userData
        });

        const responseText = await response.text();
        console.log('Response Status:', response.status);
        console.log('Response Body:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            alert('Unexpected server response');
            return;
        }

        // Comprehensive error handling
        if (!response.ok) {
            const errorMessage = data.message || 
                                 data.code || 
                                 "Unknown signup error";
            
            console.error('Signup Error Details:', {
                status: response.status,
                code: data.code,
                message: data.message,
                type: data.type
            });

            alert(`Signup failed: ${errorMessage}`);
            return;
        }

        // Success handling
        alert("Sign-up successful! Please verify your email.");
        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;

    } catch (error) {
        console.error('Network or Fetch Error:', error);
        alert('A network error occurred. Please try again.');
    }
};