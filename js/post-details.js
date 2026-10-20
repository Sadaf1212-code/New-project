 
document.addEventListener("DOMContentLoaded", async () => {

    // =========================================
    // 1. GET SELECTED POST ID
    // =========================================

    const postId =
        localStorage.getItem("selectedPostId");


    if (!postId) {

        alert("Post not found!");

        window.location.href =
            "marketplace.html";

        return;
    }


    // =========================================
    // 2. GET POST FROM BACKEND
    // =========================================

    let post;

    try {

        const response = await fetch(
            `/api/posts/${postId}`
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Post not found"
            );
        }


        post = data.post;

    } catch (error) {

        console.error(
            "Error loading post:",
            error
        );


        alert(
            "Unable to load post."
        );


        window.location.href =
            "marketplace.html";

        return;
    }


    // =========================================
    // 3. HELPER
    // =========================================

    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {
            element.textContent = value;
        }
    }


    // =========================================
    // 4. IMAGE
    // =========================================

    const image =
        document.getElementById("postImage");


    if (image) {

        image.src =
            post.image ||
            "../images/default-product.jpg";


        image.alt =
            post.title ||
            "Product";


        image.onerror = () => {

            image.src =
                "../images/default-product.jpg";
        };
    }


    // =========================================
    // 5. POST INFORMATION
    // =========================================

    setText(
        "postTitle",
        post.title || "No title"
    );


    setText(
        "postType",
        post.listingType || "Unknown"
    );


    setText(
        "postCategory",
        post.category || "Other"
    );


    setText(
        "postPrice",
        `৳${post.price || 0}`
    );


    setText(
        "postCondition",
        post.condition || "Unknown"
    );


    setText(
        "postLocation",
        post.location || "Not specified"
    );


    setText(
        "postDate",
        post.createdAt || "Unknown"
    );


    setText(
        "postDescription",
        post.description ||
        "No description available."
    );


    setText(
        "pickupLocation",
        `📍 ${post.location || "Location not specified"}`
    );


    setText(
        "postAuthor",
        post.authorName ||
        "Unknown seller"
    );


    setText(
        "sellerContact",
        post.contact ||
        "Contact information not available"
    );


    // =========================================
    // 6. LISTING TYPE COLOR
    // =========================================

    const postType =
        document.getElementById("postType");


    if (postType) {

        const typeClasses = {

            Sell:
                "bg-green-100 text-green-700",

            Rent:
                "bg-blue-100 text-blue-700",

            Lost:
                "bg-red-100 text-red-700",

            Found:
                "bg-purple-100 text-purple-700"
        };


        postType.className =
            "absolute left-5 top-5 rounded-full px-4 py-1.5 text-sm font-semibold " +
            (
                typeClasses[post.listingType] ||
                "bg-gray-100 text-gray-700"
            );
    }


    // =========================================
    // 7. CONTACT SELLER
    // =========================================

    const contactButton =
        document.getElementById(
            "contact-seller"
        );


    const contactNote =
        document.getElementById(
            "contact-note"
        );


    if (contactButton) {

        contactButton.addEventListener(
            "click",
            () => {

                contactButton.textContent =
                    "Request sent ✓";


                contactButton.disabled =
                    true;


                if (contactNote) {

                    contactNote.classList.remove(
                        "hidden"
                    );
                }
            }
        );
    }


    // =========================================
    // 8. WISHLIST
    // =========================================

    const saveButton =
        document.getElementById(
            "save-post"
        );


    if (saveButton) {

        function getWishlist() {

            return JSON.parse(
                localStorage.getItem(
                    "wishlist"
                )
            ) || [];
        }


        function renderSaveState() {

            const wishlist =
                getWishlist();


            const saved =
                wishlist.some(
                    item =>
                        String(item.postId) ===
                        String(postId)
                );


            saveButton.textContent =
                saved ? "♥" : "♡";


            saveButton.classList.toggle(
                "text-rose-500",
                saved
            );
        }


        saveButton.addEventListener(
            "click",
            () => {

                const wishlist =
                    getWishlist();


                const index =
                    wishlist.findIndex(
                        item =>
                            String(item.postId) ===
                            String(postId)
                    );


                if (index === -1) {

                    wishlist.push(post);

                } else {

                    wishlist.splice(
                        index,
                        1
                    );
                }


                localStorage.setItem(
                    "wishlist",
                    JSON.stringify(wishlist)
                );


                renderSaveState();
            }
        );


        renderSaveState();
    }

});
 
