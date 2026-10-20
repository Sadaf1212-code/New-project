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

            if (
                !title ||
                !listingType ||
                !category ||
                !condition ||
                !contact ||
                !location ||
                !description
            ) {

                alert(
                    "Please fill up all required fields!"
                );

                return;
            }

            const postData = {

                userId:
                    currentUser.id,

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
                                        "application/json"
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
                                        "application/json"
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
