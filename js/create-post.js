document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("createPostForm");

    if (!form) {
        return;
    }

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    if (!currentUser) {

        alert("Please login first!");

        window.location.href =
            "login.html";

        return;
    }

    const editPostId =
        localStorage.getItem("editPostId");

    const listingTypeInput = document.getElementById("listingType");
    const componentsInput = document.getElementById("projectComponents");
    const priceInput = document.getElementById("price");
    const imageInput = document.getElementById("productImage");
    const imageRequiredMark = document.getElementById("imageRequiredMark");
    const priceRequiredMark = document.getElementById("priceRequiredMark");

    function updateProjectRequirements() {
        const isProject = listingTypeInput.value === "Project";
        componentsInput.required = isProject;
        priceInput.required = isProject;
        imageInput.required = isProject;
        imageRequiredMark.classList.toggle("hidden", !isProject);
        priceRequiredMark.classList.toggle("hidden", !isProject);
    }

    listingTypeInput.addEventListener("change", updateProjectRequirements);
    updateProjectRequirements();

    async function loadEditPost() {

        if (!editPostId) {
            return;
        }

        try {

            const response =
                await fetch(
                    `/api/posts/${editPostId}`
                );

            const data =
                await response.json();

            console.log(
                "Edit Post Response:",
                data
            );

            if (!response.ok) {

                alert(
                    data.message ||
                    "Post not found"
                );

                localStorage.removeItem(
                    "editPostId"
                );

                return;
            }

            const post =
                data.post;

            if (
                String(post.userId) !==
                String(currentUser.id)
            ) {

                alert(
                    "You cannot edit this post."
                );

                localStorage.removeItem(
                    "editPostId"
                );

                window.location.href =
                    "my-posts.html";

                return;
            }

            document.getElementById(
                "title"
            ).value =
                post.title || "";

            document.getElementById(
                "listingType"
            ).value =
                post.listingType || "";

            document.getElementById(
                "category"
            ).value =
                post.category || "";

            document.getElementById(
                "price"
            ).value =
                post.price || "";

            document.getElementById(
                "condition"
            ).value =
                post.condition || "";

            document.getElementById(
                "contact"
            ).value =
                post.contact || "";

            document.getElementById(
                "location"
            ).value =
                post.location || "";

            document.getElementById(
                "description"
            ).value =
                post.description || "";

            document.getElementById(
                "productImage"
            ).value =
                post.image || "";

            componentsInput.value = post.components || "";
            updateProjectRequirements();

            const heading =
                document.querySelector("h1");

            if (heading) {
                heading.textContent =
                    "Edit Post";
            }

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {
                submitButton.textContent =
                    "Save Changes";
            }

        } catch (error) {

            console.error(
                "Error loading post:",
                error
            );

            alert(
                "Cannot connect to server."
            );
        }
    }

    loadEditPost();

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const title =
                document.getElementById(
                    "title"
                ).value.trim();

            const listingType =
                document.getElementById(
                    "listingType"
                ).value;

            const category =
                document.getElementById(
                    "category"
                ).value;

            const price =
                document.getElementById(
                    "price"
                ).value;

            const condition =
                document.getElementById(
                    "condition"
                ).value;

            const contact =
                document.getElementById(
                    "contact"
                ).value.trim();

            const location =
                document.getElementById(
                    "location"
                ).value.trim();

            const description =
                document.getElementById(
                    "description"
                ).value.trim();

            const image =
                document.getElementById(
                    "productImage"
                ).value.trim();

            const components = componentsInput.value.trim();

            if (
                !title ||
                !listingType ||
                !category ||
                !condition ||
                !contact ||
                !location ||
                !description ||
                (listingType === "Project" && (!components || !image || !price))
            ) {

                alert(
                    "Please fill up all required fields!"
                );

                return;
            }

            const postData = {
                title:
                    title,

                listingType:
                    listingType,

                category:
                    category,

                price:
                    Number(price) || 0,

                condition:
                    condition,

                contact:
                    contact,

                location:
                    location,

                description:
                    description,

                components:
                    components,

                image:
                    image
            };

            console.log(
                "Sending post:",
                postData
            );

            try {

                let response;

                if (editPostId) {

                    response =
                        await fetch(
                            `/api/posts/${editPostId}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    "Authorization":
                                        `Bearer ${localStorage.getItem("authToken") || ""}`
                                },

                                body:
                                    JSON.stringify(
                                        postData
                                    )
                            }
                        );

                } else {

                    response =
                        await fetch(
                            "/api/posts",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    "Authorization":
                                        `Bearer ${localStorage.getItem("authToken") || ""}`
                                },

                                body:
                                    JSON.stringify(
                                        postData
                                    )
                            }
                        );
                }

                const data =
                    await response.json();

                console.log(
                    "Post API Response:",
                    data
                );

                if (!response.ok) {

                    if (response.status === 401) {
                        localStorage.removeItem("currentUser");
                        localStorage.removeItem("authToken");
                        alert("Your login session expired. Please sign in again.");
                        window.location.href = "login.html";
                        return;
                    }

                    alert(
                        data.message ||
                        "Something went wrong"
                    );

                    return;
                }

                alert(
                    data.message ||
                    "Post saved successfully!"
                );

                localStorage.removeItem(
                    "editPostId"
                );

                form.reset();

                window.location.href =
                    "market-place.html";

            } catch (error) {

                console.error(
                    "Server Error:",
                    error
                );

                alert(
                    "Cannot connect to server."
                );
            }

        }
    );

});
