 
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // 1. ELEMENTS
    // =====================================

    const postsContainer =
        document.getElementById("myPosts");

    const emptyMessage =
        document.getElementById("emptyMessage");

    const totalPosts =
        document.getElementById("totalPosts");

    const sellPosts =
        document.getElementById("sellPosts");

    const lostFoundPosts =
        document.getElementById("lostFoundPosts");


    // =====================================
    // 2. CURRENT USER
    // =====================================

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    // =====================================
    // 3. CHECK LOGIN
    // =====================================

    if (!currentUser) {

        alert("Please login first!");

        window.location.href = "login.html";

        return;
    }


    // =====================================
    // 4. LOAD MY POSTS
    // =====================================

    async function loadMyPosts() {

        try {

            const response =
                await fetch(
                    "/api/posts"
                );


            const data =
                await response.json();


            console.log("SERVER RESPONSE:", data);


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Failed to load posts"
                );

            }


            // =================================
            // ALL POSTS FROM SERVER
            // =================================

            const allPosts =
                Array.isArray(data.posts)
                    ? data.posts
                    : [];


            console.log(
                "TOTAL POSTS FROM SERVER:",
                allPosts.length
            );


            // =================================
            // FILTER CURRENT USER POSTS
            // =================================

            const myPosts =
                allPosts.filter(post =>
                    String(post.userId) ===
                    String(currentUser.id)
                );


            console.log(
                "MY POSTS:",
                myPosts
            );


            // =================================
            // UPDATE STATS
            // =================================

            updateStats(myPosts);


            // =================================
            // DISPLAY POSTS
            // =================================

            displayPosts(myPosts);


        } catch (error) {

            console.error(
                "Error loading my posts:",
                error
            );


            postsContainer.innerHTML = `

                <div
                    class="col-span-full
                           text-center
                           bg-white
                           border
                           rounded-xl
                           p-12"
                >

                    <div class="text-5xl mb-4">
                        ⚠️
                    </div>

                    <h3
                        class="text-xl
                               font-semibold
                               text-red-600"
                    >
                        Failed to Load Posts
                    </h3>

                    <p class="text-gray-500 mt-2">
                        Please make sure the Express server is running.
                    </p>

                    <p
                        class="text-sm
                               text-gray-400
                               mt-2"
                    >
                        ${error.message}
                    </p>

                </div>

            `;

        }

    }


    // =====================================
    // 5. UPDATE STATS
    // =====================================

    function updateStats(posts) {

        // Total posts
        totalPosts.textContent =
            posts.length;


        // Sell posts
        const sellCount =
            posts.filter(
                post =>
                    post.listingType === "Sell"
            ).length;


        sellPosts.textContent =
            sellCount;


        // Lost + Found
        const lostFoundCount =
            posts.filter(
                post =>
                    post.listingType === "Lost" ||
                    post.listingType === "Found"
            ).length;


        lostFoundPosts.textContent =
            lostFoundCount;

    }


    // =====================================
    // 6. DISPLAY POSTS
    // =====================================

    function displayPosts(posts) {

        // Clear old content
        postsContainer.innerHTML = "";


        // =================================
        // NO POSTS
        // =================================

        if (posts.length === 0) {

            emptyMessage.classList.remove(
                "hidden"
            );

            return;
        }


        emptyMessage.classList.add(
            "hidden"
        );


        // =================================
        // SORT NEWEST FIRST
        // =================================

        posts.sort(
            (a, b) =>
                Number(b.postId) -
                Number(a.postId)
        );


        // =================================
        // CREATE CARDS
        // =================================

        posts.forEach(post => {

            createPostCard(post);

        });

    }


    // =====================================
    // 7. CREATE POST CARD
    // =====================================

    function createPostCard(post) {

        const card =
            document.createElement("div");


        card.className =
            "bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition";


        // =================================
        // BADGE COLOR
        // =================================

        let badgeClass =
            "bg-gray-100 text-gray-700";


        if (post.listingType === "Sell") {

            badgeClass =
                "bg-green-100 text-green-700";

        }

        else if (post.listingType === "Rent") {

            badgeClass =
                "bg-blue-100 text-blue-700";

        }

        else if (post.listingType === "Lost") {

            badgeClass =
                "bg-red-100 text-red-700";

        }

        else if (post.listingType === "Found") {

            badgeClass =
                "bg-purple-100 text-purple-700";

        }


        // =================================
        // PRICE
        // =================================

        let priceHTML = "";


        if (
            post.listingType === "Sell" ||
            post.listingType === "Rent"
        ) {

            priceHTML = `

                <p
                    class="text-xl
                           font-bold
                           text-green-600"
                >
                    ৳${Number(post.price) || 0}
                </p>

            `;

        }

        else {

            priceHTML = `

                <p
                    class="text-sm
                           text-gray-500"
                >
                    No Price
                </p>

            `;

        }


        // =================================
        // IMAGE
        // =================================

        const image =
            post.image ||
            "../images/anas.jpeg";


        // =================================
        // CARD HTML
        // =================================

        card.innerHTML = `

            <!-- IMAGE -->

            <div
                class="relative
                       w-full
                       h-48
                       bg-gray-100"
            >

                <img
                    src="${image}"
                    alt="${post.title || "Product"}"
                    class="w-full
                           h-full
                           object-cover"
                    onerror="
                        this.src =
                        '../images/default-product.jpg'
                    "
                >

            </div>


            <!-- CONTENT -->

            <div class="p-5">

                <!-- TYPE + CATEGORY -->

                <div
                    class="flex
                           justify-between
                           items-center
                           mb-3"
                >

                    <span
                        class="${badgeClass}
                               px-3
                               py-1
                               rounded-full
                               text-xs
                               font-semibold"
                    >
                        ${post.listingType || "Unknown"}
                    </span>


                    <span
                        class="text-xs
                               text-gray-400"
                    >
                        ${post.category || "Others"}
                    </span>

                </div>


                <!-- TITLE -->

                <h3
                    class="text-lg
                           font-bold
                           text-gray-800
                           line-clamp-1"
                >
                    ${post.title || "Untitled Post"}
                </h3>


                <!-- DESCRIPTION -->

                <p
                    class="text-sm
                           text-gray-500
                           mt-2
                           line-clamp-2"
                >
                    ${
                        post.description ||
                        "No description"
                    }
                </p>


                <!-- PRICE -->

                <div class="mt-4">

                    ${priceHTML}

                </div>


                <!-- CONDITION -->

                <p
                    class="text-sm
                           text-gray-500
                           mt-2"
                >
                    Condition:
                    ${post.condition || "Unknown"}
                </p>


                <!-- LOCATION -->

                <p
                    class="text-sm
                           text-gray-500
                           mt-1"
                >
                    📍
                    ${post.location || "Unknown"}
                </p>


                <!-- CONTACT -->

                <p
                    class="text-sm
                           text-gray-500
                           mt-1"
                >
                    📞
                    ${post.contact || "Not available"}
                </p>


                <!-- DATE -->

                <p
                    class="text-xs
                           text-gray-400
                           mt-2"
                >
                    ${post.createdAt || ""}
                </p>


                <!-- BUTTONS -->

                <div class="mt-5 space-y-2">

                    <!-- VIEW -->

                    <button
                        onclick="viewPost(${post.postId})"
                        class="w-full
                               bg-blue-600
                               hover:bg-blue-700
                               text-white
                               py-2.5
                               rounded-lg
                               font-medium
                               transition"
                    >
                        View Details
                    </button>


                    <!-- EDIT + DELETE -->

                    <div
                        class="flex
                               gap-2"
                    >

                        <button
                            onclick="editPost(${post.postId})"
                            class="flex-1
                                   bg-yellow-500
                                   hover:bg-yellow-600
                                   text-white
                                   py-2.5
                                   rounded-lg
                                   font-medium
                                   transition"
                        >
                            Edit
                        </button>


                        <button
                            onclick="deletePost(${post.postId})"
                            class="flex-1
                                   bg-red-500
                                   hover:bg-red-600
                                   text-white
                                   py-2.5
                                   rounded-lg
                                   font-medium
                                   transition"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            </div>

        `;


        postsContainer.appendChild(card);

    }


    // =====================================
    // 8. VIEW POST
    // =====================================

    function viewPost(postId) {

        localStorage.setItem(
            "selectedPostId",
            String(postId)
        );


        window.location.href =
            "post-details.html";

    }


    // =====================================
    // 9. EDIT POST
    // =====================================

    function editPost(postId) {

        localStorage.setItem(
            "editPostId",
            String(postId)
        );


        window.location.href =
            "create-post.html";

    }


    // =====================================
    // 10. DELETE POST
    // =====================================

    async function deletePost(postId) {

        const confirmDelete =
            confirm(
                "Are you sure you want to delete this post?"
            );


        if (!confirmDelete) {
            return;
        }


        try {

            const response =
                await fetch(
                    `/api/posts/${postId}`,
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            userId:
                                currentUser.id
                        })
                    }
                );


            const data =
                await response.json();


            console.log(
                "DELETE RESPONSE:",
                data
            );


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to delete post."
                );

                return;
            }


            alert(
                data.message ||
                "Post deleted successfully!"
            );


            // Reload posts
            await loadMyPosts();


        } catch (error) {

            console.error(
                "Delete Error:",
                error
            );


            alert(
                "Cannot connect to server."
            );

        }

    }


    // =====================================
    // 11. GLOBAL FUNCTIONS
    // =====================================

    window.viewPost =
        viewPost;


    window.editPost =
        editPost;


    window.deletePost =
        deletePost;


    // =====================================
    // 12. INITIAL LOAD
    // =====================================

    loadMyPosts();

});
 
