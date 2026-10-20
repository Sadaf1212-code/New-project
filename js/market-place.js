 
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // 1. ELEMENTS
    // =====================================

    const postsContainer =
        document.getElementById("marketplacePosts");

    const emptyMessage =
        document.getElementById("emptyMessage");

    const searchInput =
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const sortFilter =
        document.getElementById("sortFilter");

    const postCount =
        document.getElementById("postCount");

    const filterButtons =
        document.querySelectorAll(".filter-btn");


    // =====================================
    // 2. VARIABLES
    // =====================================

    let posts = [];

    let selectedType = "All";


    // =====================================
    // 3. CURRENT USER
    // =====================================

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );


    // =====================================
    // 4. FILTER BUTTON STYLE
    // =====================================

    const style =
        document.createElement("style");

    style.textContent = `

        .filter-btn {
            padding: 8px 18px;
            border-radius: 9999px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            font-size: 14px;
            font-weight: 500;
            transition: 0.2s;
        }

        .filter-btn:hover {
            background: #f3f4f6;
        }

        .active-filter {
            background: #2563eb !important;
            color: white !important;
            border-color: #2563eb !important;
        }

    `;

    document.head.appendChild(style);


    // =====================================
    // 5. LOAD POSTS FROM EXPRESS SERVER
    // =====================================

    async function loadPosts() {

        try {

            const response =
                await fetch(
                    "/api/posts"
                );


            const data =
                await response.json();


            console.log(
                "SERVER RESPONSE:",
                data
            );


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Failed to load posts"
                );

            }


            // =================================
            // GET POSTS
            // =================================

            posts =
                Array.isArray(data.posts)
                    ? data.posts
                    : [];


            console.log(
                "TOTAL POSTS FROM SERVER:",
                posts.length
            );


            console.log(
                "POSTS:",
                posts
            );


            // =================================
            // DISPLAY
            // =================================

            displayPosts();


        } catch (error) {

            console.error(
                "Error loading posts:",
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


                    <p
                        class="text-gray-500 mt-2"
                    >

                        Please make sure the
                        Express server is running.

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


            postCount.textContent =
                "0 posts";

        }

    }


    // =====================================
    // 6. LISTING TYPE FILTER
    // =====================================

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(btn => {

                    btn.classList.remove(
                        "active-filter"
                    );

                });


                button.classList.add(
                    "active-filter"
                );


                selectedType =
                    button.dataset.type;


                displayPosts();

            }
        );

    });


    // =====================================
    // 7. SEARCH
    // =====================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            displayPosts
        );

    }


    // =====================================
    // 8. CATEGORY
    // =====================================

    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            displayPosts
        );

    }


    // =====================================
    // 9. SORT
    // =====================================

    if (sortFilter) {

        sortFilter.addEventListener(
            "change",
            displayPosts
        );

    }


    // =====================================
    // 10. DISPLAY POSTS
    // =====================================

    function displayPosts() {

        let filteredPosts =
            [...posts];


        // =================================
        // SEARCH
        // =================================

        const searchText =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        if (searchText) {

            filteredPosts =
                filteredPosts.filter(post => {

                    return (

                        String(post.title || "")
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        String(post.description || "")
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        String(post.category || "")
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        String(post.authorName || "")
                            .toLowerCase()
                            .includes(searchText)

                        ||

                        String(post.location || "")
                            .toLowerCase()
                            .includes(searchText)

                    );

                });

        }


        // =================================
        // LISTING TYPE
        // =================================

        if (selectedType !== "All") {

            filteredPosts =
                filteredPosts.filter(
                    post =>
                        post.listingType ===
                        selectedType
                );

        }


        // =================================
        // CATEGORY
        // =================================

        const selectedCategory =
            categoryFilter
                ? categoryFilter.value
                : "All";


        if (selectedCategory !== "All") {

            filteredPosts =
                filteredPosts.filter(
                    post =>
                        post.category ===
                        selectedCategory
                );

        }


        // =================================
        // SORT
        // =================================

        const sortValue =
            sortFilter
                ? sortFilter.value
                : "newest";


        // Newest

        if (sortValue === "newest") {

            filteredPosts.sort(
                (a, b) =>
                    Number(b.postId) -
                    Number(a.postId)
            );

        }


        // Oldest

        else if (sortValue === "oldest") {

            filteredPosts.sort(
                (a, b) =>
                    Number(a.postId) -
                    Number(b.postId)
            );

        }


        // Low Price

        else if (sortValue === "lowPrice") {

            filteredPosts.sort(
                (a, b) =>
                    (Number(a.price) || 0) -
                    (Number(b.price) || 0)
            );

        }


        // High Price

        else if (sortValue === "highPrice") {

            filteredPosts.sort(
                (a, b) =>
                    (Number(b.price) || 0) -
                    (Number(a.price) || 0)
            );

        }


        // =================================
        // UPDATE COUNT
        // =================================

        postCount.textContent =
            `${filteredPosts.length} posts`;


        // =================================
        // CLEAR OLD POSTS
        // =================================

        postsContainer.innerHTML = "";


        // =================================
        // NO POSTS
        // =================================

        if (filteredPosts.length === 0) {

            postsContainer.classList.add(
                "hidden"
            );

            emptyMessage.classList.remove(
                "hidden"
            );

            return;

        }


        postsContainer.classList.remove(
            "hidden"
        );

        emptyMessage.classList.add(
            "hidden"
        );


        // =================================
        // CREATE POST CARDS
        // =================================

        filteredPosts.forEach(post => {

            createPostCard(post);

        });

    }


    // =====================================
    // 11. CREATE POST CARD
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
            "../images/default-product.jpg";


        // =================================
        // OWNER CHECK
        // =================================

        const isOwner =
            currentUser &&
            String(post.userId) ===
            String(currentUser.id);


        // =================================
        // WISHLIST CHECK
        // =================================

        const wishlist =
            JSON.parse(
                localStorage.getItem("wishlist")
            ) || [];


        const isWishlisted =
            wishlist.some(
                id =>
                    String(id) ===
                    String(post.postId)
            );


        // =================================
        // WISHLIST BUTTON
        // =================================

        const wishlistButton = `

            <button
                onclick="toggleWishlist(${post.postId})"
                title="${
                    isWishlisted
                        ? "Remove from wishlist"
                        : "Add to wishlist"
                }"
                class="absolute
                       top-3
                       right-3
                       w-10
                       h-10
                       bg-white
                       rounded-full
                       shadow-md
                       flex
                       items-center
                       justify-center
                       text-xl
                       hover:bg-red-50
                       transition"
            >

                ${
                    isWishlisted
                        ? "❤️"
                        : "🤍"
                }

            </button>

        `;


        // =================================
        // OWNER BUTTONS
        // =================================

        let ownerButtons = "";


        if (isOwner) {

            ownerButtons = `

                <div
                    class="flex
                           gap-2
                           mt-2"
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

            `;

        }


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


                ${wishlistButton}

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


                <!-- SELLER -->

                <p
                    class="text-sm
                           text-gray-500
                           mt-1"
                >

                    👤
                    ${post.authorName || "Unknown User"}

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


                <!-- VIEW DETAILS -->

                <div class="mt-5">

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


                    ${ownerButtons}

                </div>

            </div>

        `;


        postsContainer.appendChild(card);

    }


    // =====================================
    // 12. TOGGLE WISHLIST
    // =====================================

    function toggleWishlist(postId) {

        let wishlist =
            JSON.parse(
                localStorage.getItem("wishlist")
            ) || [];


        const exists =
            wishlist.some(
                id =>
                    String(id) ===
                    String(postId)
            );


        if (exists) {

            wishlist =
                wishlist.filter(
                    id =>
                        String(id) !==
                        String(postId)
                );

        }

        else {

            wishlist.push(postId);

        }


        localStorage.setItem(
            "wishlist",
            JSON.stringify(wishlist)
        );


        // Re-render cards

        displayPosts();

    }


    // =====================================
    // 13. VIEW POST
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
    // 14. EDIT POST
    // =====================================

    function editPost(postId) {

        const post =
            posts.find(
                post =>
                    String(post.postId) ===
                    String(postId)
            );


        if (!post) {

            alert("Post not found!");

            return;
        }


        if (!currentUser) {

            alert("Please login first!");

            window.location.href =
                "login.html";

            return;
        }


        if (
            String(post.userId) !==
            String(currentUser.id)
        ) {

            alert(
                "You can only edit your own posts."
            );

            return;
        }


        localStorage.setItem(
            "editPostId",
            String(postId)
        );


        window.location.href =
            "create-post.html";

    }


    // =====================================
    // 15. DELETE POST
    // =====================================

    async function deletePost(postId) {

        const post =
            posts.find(
                post =>
                    String(post.postId) ===
                    String(postId)
            );


        if (!post) {

            alert("Post not found!");

            return;
        }


        if (!currentUser) {

            alert("Please login first!");

            window.location.href =
                "login.html";

            return;
        }


        if (
            String(post.userId) !==
            String(currentUser.id)
        ) {

            alert(
                "You can only delete your own posts."
            );

            return;
        }


        const confirmDelete =
            confirm(
                `Are you sure you want to delete "${post.title}"?`
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

                        body:
                            JSON.stringify({
                                userId:
                                    currentUser.id
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Failed to delete post."
                );

                return;
            }


            // Remove from wishlist too

            let wishlist =
                JSON.parse(
                    localStorage.getItem("wishlist")
                ) || [];


            wishlist =
                wishlist.filter(
                    id =>
                        String(id) !==
                        String(postId)
                );


            localStorage.setItem(
                "wishlist",
                JSON.stringify(wishlist)
            );


            alert(
                data.message ||
                "Post deleted successfully!"
            );


            await loadPosts();

        }

        catch (error) {

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
    // 16. GLOBAL FUNCTIONS
    // =====================================

    window.viewPost =
        viewPost;


    window.editPost =
        editPost;


    window.deletePost =
        deletePost;


    window.toggleWishlist =
        toggleWishlist;


    // =====================================
    // 17. INITIAL LOAD
    // =====================================

    loadPosts();

});
 
