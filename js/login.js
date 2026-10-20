 
document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email")
                .value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("password")
                .value;

        const rememberMe =
            document.getElementById("rememberMe")?.checked || false;

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        try {

            const response = await fetch(
                "/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Login API Response:", data);

            if (!response.ok) {

                window.location.href =
                    `error.html?message=${encodeURIComponent(
                        data.message || "Login failed"
                    )}&code=${response.status}`;

                return;
            }

            if (!data.user) {
                alert("Login successful, but user data was not received.");
                return;
            }

            localStorage.setItem(
                "currentUser",
                JSON.stringify(data.user)
            );

            if (rememberMe) {

                localStorage.setItem(
                    "rememberMe",
                    "true"
                );

            } else {

                localStorage.removeItem("rememberMe");
            }

            alert(data.message || "Login successful.");

            window.location.href = "profile.html";

        } catch (error) {

            console.error("Login Server Error:", error);

            window.location.href =
                `error.html?message=${encodeURIComponent(
                    "Cannot connect to server"
                )}&code=500`;
        }
    });

}) 
