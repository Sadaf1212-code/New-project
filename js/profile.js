document.addEventListener("DOMContentLoaded", async () => {

    // =====================================
    // 1. GET CURRENT USER
    // =====================================

    let currentUser;

    try {
        currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );
    } catch (error) {
        currentUser = null;
    }

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }


    let user = { ...currentUser };

    let allPosts = [];


    // =====================================
    // 2. GET HTML ELEMENTS
    // =====================================

    const profileImage =
        document.getElementById("profileImage");

    const profileName =
        document.getElementById("profileName");

    const profileUniversity =
        document.getElementById("profileUniversity");

    const profileDepartment =
        document.getElementById("profileDepartment");

    const profileEmail =
        document.getElementById("profileEmail");

    const profilePhone =
        document.getElementById("profilePhone");

    const accountName =
        document.getElementById("accountName");

    const accountEmail =
        document.getElementById("accountEmail");

    const accountStudentId =
        document.getElementById("accountStudentId");

    const accountPhone =
        document.getElementById("accountPhone");

    const accountUniversity =
        document.getElementById("accountUniversity");

    const accountDepartment =
        document.getElementById("accountDepartment");

    const accountCreatedAt =
        document.getElementById("accountCreatedAt");

    const totalPosts =
        document.getElementById("totalPosts");

    const sellPosts =
        document.getElementById("sellPosts");

    const lostPosts =
        document.getElementById("lostPosts");

    const foundPosts =
        document.getElementById("foundPosts");

    const recentPosts =
        document.getElementById("recentPosts");


    // =====================================
    // 3. DISPLAY PROFILE
    // =====================================

    function displayProfile() {

        profileName.textContent =
            user.fullName || "Student Name";

        profileUniversity.textContent =
            user.university || "Premier University";

        profileDepartment.textContent =
            user.department ||
            "Computer Science & Engineering";

        profileEmail.textContent =
            user.email || "student@email.com";

        profilePhone.textContent =
            user.phone || "Not added";


        // Account information

        accountName.textContent =
            user.fullName || "Student Name";

        accountEmail.textContent =
            user.email || "student@email.com";

        accountStudentId.textContent =
            user.studentId || "Not available";

        accountPhone.textContent =
            user.phone || "Not added";

        accountUniversity.textContent =
            user.university || "Premier University";

        accountDepartment.textContent =
            user.department ||
            "Computer Science & Engineering";


        // Created date

        if (user.createdAt) {

            const date =
                new Date(user.createdAt);

            accountCreatedAt.textContent =
                date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                });

        } else {

            accountCreatedAt.textContent =
                "2026";
        }


        // Profile image

        profileImage.src =
            user.profileImage ||
            "https://via.placeholder.com/150";
    }


    // =====================================
    // 4. GET USER POSTS FROM BACKEND
    // =====================================

    async function getUserPosts() {

        try {

            const response = await fetch(
                "/api/posts"
            );

            if (!response.ok) {
                throw new Error("Failed to load posts");
            }

            const data =
                await response.json();

            allPosts =
                data.posts || [];


            // Only current user's posts

            return allPosts.filter(
                post =>
                    String(post.userId) ===
                    String(user.id)
            );

        } catch (error) {

            console.error(
                "Post loading error:",
                error
            );

            return [];
        }
    }


    // =====================================
    // 5. DISPLAY STATISTICS
    // =====================================

    async function displayStatistics() {

        const userPosts =
            await getUserPosts();


        const sellCount =
            userPosts.filter(
                post =>
                    post.listingType === "Sell"
            ).length;


        const lostCount =
            userPosts.filter(
                post =>
                    post.listingType === "Lost"
            ).length;


        const foundCount =
            userPosts.filter(
                post =>
                    post.listingType === "Found"
            ).length;


        totalPosts.textContent =
            userPosts.length;

        sellPosts.textContent =
            sellCount;

        lostPosts.textContent =
            lostCount;

        foundPosts.textContent =
            foundCount;
    }


    // =====================================
    // 6. DISPLAY RECENT POSTS
    // =====================================

    async function displayRecentPosts() {

        const userPosts =
            await getUserPosts();


        recentPosts.innerHTML = "";


        if (userPosts.length === 0) {

            recentPosts.innerHTML = `

                <div
                    class="col-span-full rounded-xl
                    border border-gray-200 bg-white
                    p-8 text-center"
                >

                    <p class="text-gray-500">
                        You have not created any posts yet.
                    </p>

                    <a
                        href="create-post.html"
                        class="mt-4 inline-block rounded-lg
                        bg-green-700 px-5 py-2
                        text-sm font-medium text-white
                        hover:bg-green-800"
                    >
                        Create Post
                    </a>

                </div>

            `;

            return;
        }


        // Latest 3

        const latestPosts =
            [...userPosts]
                .sort(
                    (a, b) =>
                        Number(b.postId) -
                        Number(a.postId)
                )
                .slice(0, 3);


        latestPosts.forEach(post => {

            const card =
                document.createElement("div");


            card.className =
                "overflow-hidden rounded-xl border " +
                "border-gray-200 bg-white shadow-sm";


            const image =
                post.image ||
                "https://via.placeholder.com/400x250?text=EduTrade";


            card.innerHTML = `

                <img
                    src="${image}"
                    alt="${post.title || "Post"}"
                    class="h-44 w-full object-cover"
                >

                <div class="p-5">

                    <div
                        class="mb-2 flex items-center
                        justify-between"
                    >

                        <span
                            class="rounded-full bg-green-100
                            px-3 py-1 text-xs
                            font-semibold text-green-700"
                        >
                            ${post.listingType || "Post"}
                        </span>

                        <span
                            class="text-sm text-gray-500"
                        >
                            ${post.category || ""}
                        </span>

                    </div>


                    <h3
                        class="line-clamp-2 text-lg font-bold"
                    >
                        ${post.title || "Untitled Post"}
                    </h3>


                    ${
                        post.price
                            ? `
                                <p
                                    class="mt-2 font-semibold
                                    text-green-700"
                                >
                                    ৳ ${post.price}
                                </p>
                              `
                            : ""
                    }


                    <p
                        class="mt-2 line-clamp-2
                        text-sm text-gray-500"
                    >
                        ${
                            post.description ||
                            "No description available."
                        }
                    </p>


                    <button
                        class="view-post mt-4 w-full
                        rounded-lg border
                        border-green-700 px-4 py-2
                        text-sm font-medium
                        text-green-700
                        hover:bg-green-50"
                        data-id="${post.postId}"
                    >
                        View Post
                    </button>

                </div>
            `;


            recentPosts.appendChild(card);

        });


        // View post buttons

        document
            .querySelectorAll(".view-post")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        localStorage.setItem(
                            "selectedPostId",
                            button.dataset.id
                        );

                        window.location.href =
                            "post-details.html";
                    }
                );

            });
    }


    // =====================================
    // 7. EDIT PROFILE
    // =====================================

    const editProfileButton =
        document.getElementById(
            "editProfileButton"
        );

    const editModal =
        document.getElementById("editModal");

    const closeModal =
        document.getElementById("closeModal");

    const cancelEdit =
        document.getElementById("cancelEdit");

    const editProfileForm =
        document.getElementById(
            "editProfileForm"
        );

    const editName =
        document.getElementById("editName");

    const editEmail =
        document.getElementById("editEmail");

    const editPhone =
        document.getElementById("editPhone");

    const editUniversity =
        document.getElementById(
            "editUniversity"
        );

    const editDepartment =
        document.getElementById(
            "editDepartment"
        );

    const editProfileImage =
        document.getElementById(
            "editProfileImage"
        );


    // =====================================
    // 8. OPEN EDIT MODAL
    // =====================================

    editProfileButton.addEventListener(
        "click",
        () => {

            editName.value =
                user.fullName || "";

            editEmail.value =
                user.email || "";

            editPhone.value =
                user.phone || "";

            editUniversity.value =
                user.university || "";

            editDepartment.value =
                user.department || "";

            editProfileImage.value =
                user.profileImage || "";


            editModal.classList.remove(
                "hidden"
            );

            editModal.classList.add(
                "flex"
            );
        }
    );


    // =====================================
    // 9. CLOSE MODAL
    // =====================================

    function closeEditModal() {

        editModal.classList.add("hidden");

        editModal.classList.remove("flex");
    }


    closeModal.addEventListener(
        "click",
        closeEditModal
    );


    cancelEdit.addEventListener(
        "click",
        closeEditModal
    );


    // =====================================
    // 10. UPDATE PROFILE
    // =====================================

    editProfileForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const updatedUser = {

                fullName:
                    editName.value.trim(),

                email:
                    user.email,

                studentId:
                    user.studentId,

                phone:
                    editPhone.value.trim(),

                university:
                    editUniversity.value.trim(),

                department:
                    editDepartment.value.trim(),

                profileImage:
                    editProfileImage.value.trim()
            };


            if (!updatedUser.fullName) {

                alert(
                    "Please enter your name."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        `/api/users/${user.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    updatedUser
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Profile update failed"
                    );
                }


                // Backend returned updated user

                user =
                    data.user;


                // Update localStorage

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(user)
                );


                displayProfile();

                closeEditModal();


                alert(
                    "Profile updated successfully."
                );


            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to update profile."
                );
            }
        }
    );


    // =====================================
    // 11. INITIAL LOAD
    // =====================================

    displayProfile();

    await displayStatistics();

    await displayRecentPosts();

});
