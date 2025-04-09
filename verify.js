const verifyEmail = async () => {
    const verificationCodeElement = document.getElementById("verificationCode");
    const emailElement = document.getElementById("email");
    const messageElement = document.getElementById("message");

    const verificationCode = verificationCodeElement.value.trim();
    const email = emailElement.value.trim();

    // Validation
    if (!verificationCode || !email) {
        messageElement.textContent = "Please enter both email and verification code";
        return;
    }

    const verificationData = {
        ClientId: "7ufpgivr5bj113bc1rarviugoi",
        Username: email,
        ConfirmationCode: verificationCode
    };

    try {
        const response = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.ConfirmSignUp",
                "Accept": "application/json"
            },
            body: JSON.stringify(verificationData)
        });

        const data = await response.json();

        // Comprehensive error handling
        if (!response.ok) {
            const errorMessage = data.message || 
                                 data.code || 
                                 "Unknown verification error";
            
            console.error('Verification Error Details:', {
                status: response.status,
                code: data.code,
                message: data.message,
                type: data.type
            });

            messageElement.textContent = `Verification failed: ${errorMessage}`;
            return;
        }

        // Success handling
        messageElement.textContent = "Verification successful!";
        alert("Email verified. You can now login.");
        window.location.href = "login.html";

    } catch (error) {
        console.error('Verification Error:', error);
        messageElement.textContent = 'A network error occurred. Please try again.';
    }
};

// Optional: Resend verification code function
const resendVerificationCode = async () => {
    const emailElement = document.getElementById("email");
    const email = emailElement.value.trim();

    if (!email) {
        alert("Please enter your email");
        return;
    }

    const resendData = {
        ClientId: "7ufpgivr5bj113bc1rarviugoi",
        Username: email
    };

    try {
        const response = await fetch("https://cognito-idp.us-east-1.amazonaws.com/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.ResendConfirmationCode",
                "Accept": "application/json"
            },
            body: JSON.stringify(resendData)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.message || "Failed to resend verification code";
            alert(errorMessage);
            return;
        }

        alert("Verification code resent. Please check your email.");

    } catch (error) {
        console.error('Resend Code Error:', error);
        alert('Failed to resend verification code. Please try again.');
    }
};