const login = async () => {
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");
    
    const email = emailElement.value.trim();
    const password = passwordElement.value;

    // Validation
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    const loginData = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: "7ufpgivr5bj113bc1rarviugoi",
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    try {
        const response = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
                "Accept": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        // Handle NEW_PASSWORD_REQUIRED challenge
        if (data.ChallengeName === "NEW_PASSWORD_REQUIRED") {
            // Prompt for new password
            const newPassword = prompt("You must set a new password. Please enter a new password:");
            
            if (!newPassword) {
                alert("New password is required.");
                return;
            }

            // Prepare challenge response
            const challengeRequestData = {
                ChallengeName: "NEW_PASSWORD_REQUIRED",
                ClientId: "7ufpgivr5bj113bc1rarviugoi",
                ChallengeResponses: {
                    USERNAME: email,
                    NEW_PASSWORD: newPassword,
                    // Parse and include user attributes if needed
                    ...JSON.parse(data.ChallengeParameters.userAttributes)
                },
                Session: data.Session
            };

            const challengeResponse = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-amz-json-1.1",
                    "X-Amz-Target": "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
                    "Accept": "application/json"
                },
                body: JSON.stringify(challengeRequestData)
            });

            const challengeData = await challengeResponse.json();

            // Comprehensive error logging
            console.log('Challenge Response:', challengeData);

            // Check for successful authentication
            if (challengeData.AuthenticationResult) {
                localStorage.setItem("token", challengeData.AuthenticationResult.IdToken);
                
                if (challengeData.AuthenticationResult.RefreshToken) {
                    localStorage.setItem("refreshToken", challengeData.AuthenticationResult.RefreshToken);
                }

                // Clear sensitive input fields
                emailElement.value = '';
                passwordElement.value = '';

                window.location.href = "expenses.html";
            } else {
                // More detailed error handling
                const errorMessage = challengeData.message || 
                                     challengeData.code || 
                                     "Failed to set new password";
                
                console.error('New Password Challenge Error:', challengeData);
                alert(`Password reset failed: ${errorMessage}`);
            }
        } 
        // Existing success handling for normal login
        else if (data.AuthenticationResult) {
            localStorage.setItem("token", data.AuthenticationResult.IdToken);
            
            if (data.AuthenticationResult.RefreshToken) {
                localStorage.setItem("refreshToken", data.AuthenticationResult.RefreshToken);
            }

            emailElement.value = '';
            passwordElement.value = '';

            window.location.href = "expenses.html";
        } 
        else {
            alert("Authentication failed. Please try again.");
        }

    } catch (error) {
        console.error('Login Error:', error);
        alert('A login error occurred. Please try again.');
    }
};