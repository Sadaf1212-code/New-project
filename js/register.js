const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const fullName =
        document.getElementById("fullName").value.trim();

    const email =
        document.getElementById("email").value.trim().toLowerCase();

    const studentId =
        document.getElementById("studentId").value.trim();

    const phone =
        document.getElementById("phone").value.trim();

    const university =
        document.getElementById("university").value.trim();

    const department =
        document.getElementById("department").value.trim();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const agree =
        document.getElementById("terms").checked;

    const profileImage =
        document.getElementById("profileImage").value.trim();

    const userData = {
        fullName: fullName,
        email: email,
        studentId: studentId,
        phone: phone,
        university: university,
        department: department,
        password: password,
        confirmPassword: confirmPassword,
        profileImage: profileImage,
        agree: agree
    };

    console.log("Sending data to API:");
    console.log(userData);

    try {

        const response = await fetch(
            "/api/users",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            }
        );

        const data = await response.json();

        console.log("API Response:");
        console.log(data);

        if (!response.ok) {

            window.location.href =
                `error.html?message=${encodeURIComponent(
                    data.message
                )}&code=${response.status}`;

            return;
        }

        alert(data.message);

        registerForm.reset();

        window.location.href = "login.html";

    } catch (error) {

        console.error("Server Error:", error);

        window.location.href =
            `error.html?message=${encodeURIComponent(
                "Cannot connect to server"
            )}&code=500`;
    }

});
